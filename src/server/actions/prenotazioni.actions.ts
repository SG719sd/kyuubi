'use server';

import { revalidatePath } from 'next/cache';
import { PrenotazioniService } from '@/server/services/prenotazioni.service';
import {
  UpsertPrenotazioneInput,
  RicercaSlotQueryInput,
} from '@/lib/validations/prenotazioni.schema';

export async function listPrenotazioniAction(
  hubId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    stato?: string;
    id_professionista?: number;
  }
) {
  try {
    const data = await PrenotazioniService.listPrenotazioni(hubId, options);
    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Errore durante il recupero delle prenotazioni',
    };
  }
}

export async function upsertPrenotazioneAction(
  input: UpsertPrenotazioneInput,
  hubSlug: string
) {
  try {
    const result = await PrenotazioniService.upsertPrenotazione(input);
    revalidatePath(`/dashboard/hubs/${hubSlug}/prenotazioni`);
    return { success: true, data: result };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Errore durante il salvataggio della prenotazione',
    };
  }
}

export async function cambioStatoPrenotazioneAction(
  id: number,
  hubId: string,
  nuovoStato: string,
  hubSlug: string
) {
  try {
    const result = await PrenotazioniService.cambioStato(id, hubId, nuovoStato);
    revalidatePath(`/dashboard/hubs/${hubSlug}/prenotazioni`);
    return { success: true, data: result };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Errore durante il cambio stato della prenotazione',
    };
  }
}

export async function deletePrenotazioneAction(
  id: number,
  hubId: string,
  hubSlug: string
) {
  try {
    await PrenotazioniService.deletePrenotazione(id, hubId);
    revalidatePath(`/dashboard/hubs/${hubSlug}/prenotazioni`);
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Errore durante l\'eliminazione della prenotazione',
    };
  }
}

export async function calcolaSlotDisponibiliAction(query: RicercaSlotQueryInput) {
  try {
    const result = await PrenotazioniService.calcolaSlotDisponibili(query);
    return { success: true, data: result };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Errore durante il calcolo degli slot disponibili',
    };
  }
}
