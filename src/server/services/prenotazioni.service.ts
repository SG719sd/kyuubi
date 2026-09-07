import {
  PrenotazioniRepository,
  PrenotazioneWithDetails,
} from '@/server/repositories/prenotazioni.repository';
import {
  upsertPrenotazioneSchema,
  UpsertPrenotazioneInput,
  cambioStatoPrenotazioneSchema,
  RicercaSlotQueryInput,
  ricercaSlotQuerySchema,
} from '@/lib/validations/prenotazioni.schema';
import { OrariService } from '@/server/services/orari.service';
import { ServiziService } from '@/server/services/servizi.service';

export class PrenotazioniService {
  /**
   * Lista delle prenotazioni con filtri opzionali
   */
  static async listPrenotazioni(
    hubId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      stato?: string;
      id_professionista?: number;
    }
  ): Promise<PrenotazioneWithDetails[]> {
    return await PrenotazioniRepository.listByHubId(hubId, options);
  }

  /**
   * Dettaglio singola prenotazione
   */
  static async getPrenotazioneById(
    id: number,
    hubId: string
  ): Promise<PrenotazioneWithDetails | null> {
    return await PrenotazioniRepository.getById(id, hubId);
  }

  /**
   * Crea o aggiorna una prenotazione con calcolo automatico di totali, durate e orario di fine
   */
  static async upsertPrenotazione(
    input: UpsertPrenotazioneInput
  ): Promise<PrenotazioneWithDetails> {
    const validated = upsertPrenotazioneSchema.parse(input);

    // Calcolo totale prezzo e durata totale in minuti
    let totalePrezzo = 0;
    let durataTotaleMinuti = 0;

    const itemsPayload = validated.items.map((item) => {
      const qta = item.quantita || 1;
      const subtotal = (item.prezzo || 0) * qta;
      const duration = (item.tempo_minuti || 0) * qta;

      totalePrezzo += subtotal;
      durataTotaleMinuti += duration;

      return {
        id_hub: validated.id_hub,
        id_item: item.id_item,
        tipo: item.tipo,
        prezzo: item.prezzo,
        quantita: qta,
        totale: subtotal,
        tempo_minuti: item.tempo_minuti || 0,
        pagamento: item.pagamento ?? false,
        nuovo: item.nuovo ?? true,
        note: item.note || null,
        stato: 'attivo',
        is_active: true,
      };
    });

    // Calcolo tms_fine in base all'inizio e alla durata
    const startDate = new Date(validated.tms_inizio);
    const durationMs = Math.max(durataTotaleMinuti, 15) * 60 * 1000; // Minimo 15 minuti
    const endDate = new Date(startDate.getTime() + durationMs);

    const headerPayload = {
      id_hub: validated.id_hub,
      id_professionista: validated.id_professionista || null,
      id_rubrica: validated.id_rubrica || null,
      id_user: validated.id_user || null,
      titolo: validated.titolo || null,
      descrizione: validated.descrizione || null,
      note: validated.note || null,
      stato: validated.stato,
      agenda: validated.agenda,
      ordini: validated.ordini,
      tms_inizio: startDate.toISOString(),
      tms_fine: endDate.toISOString(),
      tempo_minuti: durataTotaleMinuti,
      prezzo: totalePrezzo,
      parziale: 0,
      totale: totalePrezzo,
      is_active: true,
    };

    if (validated.id) {
      return await PrenotazioniRepository.update(
        validated.id,
        validated.id_hub,
        headerPayload,
        itemsPayload
      );
    } else {
      return await PrenotazioniRepository.create(headerPayload, itemsPayload);
    }
  }

  /**
   * Modifica rapida dello stato (pending -> confermata -> completata -> cancellata)
   */
  static async cambioStato(id: number, hubId: string, nuovoStato: string) {
    const validated = cambioStatoPrenotazioneSchema.parse({
      id_prenotazione: id,
      id_hub: hubId,
      nuovo_stato: nuovoStato,
    });
    return await PrenotazioniRepository.updateStato(
      validated.id_prenotazione,
      validated.id_hub,
      validated.nuovo_stato
    );
  }

  /**
   * Eliminazione soft-delete della prenotazione
   */
  static async deletePrenotazione(id: number, hubId: string) {
    return await PrenotazioniRepository.softDelete(id, hubId);
  }

  /**
   * Calcolo slot orari disponibili per una determinata data
   */
  static async calcolaSlotDisponibili(query: RicercaSlotQueryInput) {
    const validated = ricercaSlotQuerySchema.parse(query);
    const { id_hub, data, id_professionista, id_servizio, durata_minuti_override } = validated;

    // Determina la durata richiesta
    let durata = durata_minuti_override || 30;
    if (!durata_minuti_override && id_servizio) {
      const servizio = await ServiziService.getServizioById(id_servizio);
      if (servizio?.tempo_minuti) {
        durata = servizio.tempo_minuti;
      }
    }

    // 1. Recupera gli orari di apertura dell'Hub per quel giorno della settimana
    const targetDate = new Date(data);
    const dayOfWeek = targetDate.getDay(); // 0 = Domenica, 1 = Lunedi, ..., 6 = Sabato
    const mappedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
    const orari = await OrariService.listOrari(id_hub);

    let orarioGiorno: (typeof orari)[0] | null = null;

    if (id_professionista) {
      // Cerca se esiste un orario configurato specificamente per questo professionista
      const orarioProf = orari.find(
        (o) =>
          Number(o.id_professionista) === Number(id_professionista) &&
          (o.giorno_settimana === mappedDay || o.giorno_settimana === dayOfWeek)
      );

      if (orarioProf) {
        // Se il professionista ha un orario configurato ma è chiuso o senza ore
        if (orarioProf.is_chiuso || !orarioProf.ora_inizio_1 || !orarioProf.ora_fine_1) {
          return {
            aperto: false,
            slotLiberi: [],
            motivo: 'Il professionista selezionato non è in servizio o è chiuso in questa data',
          };
        }
        orarioGiorno = orarioProf;
      }
    }

    // Se non c'è un orario specifico del professionista, ripiega sull'orario generale dell'Hub
    if (!orarioGiorno) {
      const orarioHub = orari.find(
        (o) =>
          (!o.id_professionista || o.id_professionista === null) &&
          (o.giorno_settimana === mappedDay || o.giorno_settimana === dayOfWeek)
      );

      if (!orarioHub || orarioHub.is_chiuso || !orarioHub.ora_inizio_1 || !orarioHub.ora_fine_1) {
        return {
          aperto: false,
          slotLiberi: [],
          motivo: "L'Hub è chiuso nel giorno selezionato",
        };
      }
      orarioGiorno = orarioHub;
    }

    // 2. Recupera prenotazioni occupate per quel giorno
    const dayStartISO = new Date(data + 'T00:00:00.000Z').toISOString();
    const dayEndISO = new Date(data + 'T23:59:59.999Z').toISOString();

    const occupied = await PrenotazioniRepository.findOccupiedSlots(
      id_hub,
      dayStartISO,
      dayEndISO,
      id_professionista
    );

    // Costruisci i turni di apertura (Turno 1 obbligatorio, Turno 2 facoltativo)
    const turni: Array<{ inizio: string; fine: string }> = [];
    if (orarioGiorno.ora_inizio_1 && orarioGiorno.ora_fine_1) {
      turni.push({ inizio: orarioGiorno.ora_inizio_1, fine: orarioGiorno.ora_fine_1 });
    }
    if (orarioGiorno.ora_inizio_2 && orarioGiorno.ora_fine_2) {
      turni.push({ inizio: orarioGiorno.ora_inizio_2, fine: orarioGiorno.ora_fine_2 });
    }

    const slotStepMinutes = 15;
    const slotList: { inizio: string; fine: string; disponibile: boolean }[] = [];
    const pad = (n: number) => String(n).padStart(2, '0');

    for (const turno of turni) {
      const [startHour, startMinute] = turno.inizio.split(':').map(Number);
      const [endHour, endMinute] = turno.fine.split(':').map(Number);

      const shiftStart = new Date(data);
      shiftStart.setHours(startHour, startMinute, 0, 0);

      const shiftEnd = new Date(data);
      shiftEnd.setHours(endHour, endMinute, 0, 0);

      let currentSlotStart = new Date(shiftStart.getTime());

      while (currentSlotStart.getTime() + durata * 60 * 1000 <= shiftEnd.getTime()) {
        const currentSlotEnd = new Date(currentSlotStart.getTime() + durata * 60 * 1000);

        // Verifica se si sovrappone a una prenotazione esistente
        const isOverlap = occupied.some((occ) => {
          if (!occ.tms_inizio || !occ.tms_fine) return false;
          const occStart = new Date(occ.tms_inizio).getTime();
          const occEnd = new Date(occ.tms_fine).getTime();

          return (
            currentSlotStart.getTime() < occEnd &&
            currentSlotEnd.getTime() > occStart
          );
        });

        const startStr = `${pad(currentSlotStart.getHours())}:${pad(currentSlotStart.getMinutes())}`;
        const endStr = `${pad(currentSlotEnd.getHours())}:${pad(currentSlotEnd.getMinutes())}`;

        slotList.push({
          inizio: startStr,
          fine: endStr,
          disponibile: !isOverlap,
        });

        currentSlotStart = new Date(currentSlotStart.getTime() + slotStepMinutes * 60 * 1000);
      }
    }

    return {
      aperto: true,
      durataRichiestaMinuti: durata,
      slotLiberi: slotList.filter((s) => s.disponibile),
      tuttiSlot: slotList,
    };
  }
}
