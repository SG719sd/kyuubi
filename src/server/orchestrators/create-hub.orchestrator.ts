import { HubService } from "../services/hub.service";
import { ProfessionistiRepository } from "../repositories/professionisti.repository";
import { HubBillingRepository } from "../repositories/hub-billing.repository";
import { ConsensiRepository } from "../repositories/consensi.repository";
import { UserRepository } from "../repositories/user.repository";
import { StorageService } from "../services/storage.service";
import { HubInfoRepository } from "../repositories/hub-info.repository";
import { getHubStoragePath } from "@/types/storage-paths";
import { CreateHubWizardDTO, HubRow, TablesInsert } from "@/types";

export class CreateHubOrchestrator {
  static async execute(
    dto: CreateHubWizardDTO & { userId: string; userIp: string },
  ): Promise<HubRow> {
    // 1. Recupero utente per impostare nome/cognome nel professionista
    const user = await UserRepository.findById(dto.userId);
    if (!user) {
      throw new Error("Utente creatore non trovato.");
    }

    // 2. Creazione dell'Hub
    const hub = await HubService.createHub({
      id_user: dto.userId,
      nome: dto.nome,
      slug: dto.slug,
      email: dto.email,
      telefono: dto.telefono || null,
      style: dto.style || dto.type || "default",
      categoria: dto.categoria || "default",
      palette: dto.palette || "emerald",
      has_products: dto.has_products ?? false,
      has_dishes: dto.has_dishes ?? false,
      has_services: dto.has_services ?? false,
      has_booking: dto.has_booking ?? true,
      indirizzo: dto.indirizzo || null,
      citta: dto.citta || null,
      cap: dto.cap || null,
      provincia: dto.provincia || null,
      sito_web: dto.sito_web || null,
      descrizione: dto.descrizione || null,
      is_active: true,
      is_visible: dto.is_visible ?? true,
    });

    // 2.1 Gestione Caricamento e Salvataggio Logo iniziale su Supabase Storage
    if (dto.logo_url) {
      try {
        if (dto.logo_url.startsWith("data:")) {
          const parts = dto.logo_url.split(",");
          if (parts.length > 1) {
            const mimeMatch = parts[0].match(/:(.*?);/);
            const contentType = mimeMatch ? mimeMatch[1] : "image/webp";
            const buffer = Buffer.from(parts[1], "base64");
            const storagePath = getHubStoragePath.logo(hub.id, "logo.webp");
            const uploadRes = await StorageService.uploadFile(storagePath, buffer, contentType);
            if (uploadRes.url) {
              await HubInfoRepository.updateHub(hub.id, { logo_url: uploadRes.url });
              hub.logo_url = uploadRes.url;
            }
          }
        } else if (dto.logo_url.startsWith("http://") || dto.logo_url.startsWith("https://")) {
          await HubInfoRepository.updateHub(hub.id, { logo_url: dto.logo_url });
          hub.logo_url = dto.logo_url;
        }
      } catch (err: any) {
        console.warn("Avviso durante l'upload del logo dell'Hub su storage:", err?.message);
      }
    }

    // 3. Gestione del Professionista associato (Proprietario & Admin)
    // Nota: Il database potrebbe avere un trigger AFTER INSERT su hubs che crea già il professionista titolare.
    // Verifichiamo se esiste già per evitare la violazione del vincolo 'professionisti_user_hub_key'.
    try {
      const existingProfList = await ProfessionistiRepository.getByHubId(hub.id);
      const existingProf = existingProfList?.find((p) => p.id_user === dto.userId);

      if (existingProf) {
        await ProfessionistiRepository.update(existingProf.id, {
          nome: `${user.nome} ${user.cognome}`.trim(),
          ruolo: "Titolare",
          admin: true,
          is_active: true,
          is_visible: true,
        });
      } else {
        await ProfessionistiRepository.create({
          id_hub: hub.id,
          id_user: dto.userId,
          nome: `${user.nome} ${user.cognome}`.trim(),
          ruolo: "Titolare",
          admin: true,
          is_active: true,
          is_visible: true,
          red_flags: 0,
          preferito: false,
        });
      }
    } catch (err: any) {
      console.warn("Nota inserimento professionista titolare (già creato da trigger DB):", err?.message);
    }

    // 4. Inserimento Billing Info (se compilato almeno un campo)
    const hasBilling =
      dto.ragione_sociale ||
      dto.partita_iva ||
      dto.codice_fiscale ||
      dto.sdi_code ||
      dto.pec ||
      dto.indirizzo_fatturazione;

    if (hasBilling) {
      await HubBillingRepository.create({
        hub_id: hub.id,
        ragione_sociale: dto.ragione_sociale || null,
        partita_iva: dto.partita_iva || null,
        codice_fiscale: dto.codice_fiscale || null,
        sdi_code: dto.sdi_code || null,
        pec: dto.pec || null,
        indirizzo_fatturazione: dto.indirizzo_fatturazione || null,
      });
    }

    // 5. Registrazione dei Consensi Privacy & Termini (Batch insert)
    const consensiToInsert: TablesInsert<"consensi_autorizzazioni">[] = [];

    if (dto.accettaTermini) {
      consensiToInsert.push({
        id_user: dto.userId,
        id_hub: hub.id,
        tipo_consenso: "TERMINI_E_CONDIZIONI",
        versione_policy: "v1.0",
        stato: "ACCETTATO",
        ip_address: dto.userIp,
      });
    }

    if (dto.accettaPrivacy) {
      consensiToInsert.push({
        id_user: dto.userId,
        id_hub: hub.id,
        tipo_consenso: "PRIVACY_POLICY",
        versione_policy: "v1.0",
        stato: "ACCETTATO",
        ip_address: dto.userIp,
      });
    }

    if (consensiToInsert.length > 0) {
      await ConsensiRepository.createMany(consensiToInsert);
    }

    return hub;
  }
}
