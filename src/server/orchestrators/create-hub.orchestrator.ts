import { HubService } from "../services/hub.service";
import { ProfessionistiRepository } from "../repositories/professionisti.repository";
import { HubBillingRepository } from "../repositories/hub-billing.repository";
import { ConsensiRepository } from "../repositories/consensi.repository";
import { UserRepository } from "../repositories/user.repository";
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
      type: dto.type || "default",
      categoria: dto.categoria || "default",
      palette: dto.palette || "default", // NEW
      has_products: dto.has_products ?? false, // NEW
      has_dishes: dto.has_dishes ?? false, // NEW
      has_services: dto.has_services ?? false, // NEW
      indirizzo: dto.indirizzo || null,
      citta: dto.citta || null,
      cap: dto.cap || null,
      provincia: dto.provincia || null,
      sito_web: dto.sito_web || null,
      descrizione: dto.descrizione || null,
      is_active: true,
      is_visible: true,
    });

    // 3. Creazione del Professionista associato (Proprietario & Admin)
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
