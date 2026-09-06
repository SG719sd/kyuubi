'use server';

import { revalidatePath } from 'next/cache';
import { ServiziService } from '@/server/services/servizi.service';
import { ServizioInput } from '@/lib/validations/servizi';

export async function createServizioAction(data: ServizioInput, hubSlug: string) {
  try {
    const result = await ServiziService.createServizio(data);
    revalidatePath(`/dashboard/hubs/${hubSlug}/servizi`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante la creazione del servizio' };
  }
}

export async function updateServizioAction(
  id: number,
  data: Partial<ServizioInput>,
  hubSlug: string
) {
  try {
    const result = await ServiziService.updateServizio(id, data);
    revalidatePath(`/dashboard/hubs/${hubSlug}/servizi`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante l\'aggiornamento del servizio' };
  }
}

export async function updateImmagineServizioAction(id: number, url: string, hubSlug: string) {
  try {
    const result = await ServiziService.updateImmagineServizio(id, url);
    revalidatePath(`/dashboard/hubs/${hubSlug}/servizi`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante l\'aggiornamento dell\'immagine' };
  }
}

export async function deleteServizioAction(id: number, hubSlug: string) {
  try {
    await ServiziService.deleteServizio(id);
    revalidatePath(`/dashboard/hubs/${hubSlug}/servizi`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante l\'eliminazione del servizio' };
  }
}