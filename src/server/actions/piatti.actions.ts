'use server';

import { revalidatePath } from 'next/cache';
import { PiattiService } from '@/server/services/piatti.service';
import { PiattoInput } from '@/lib/validations/piatti';

export async function createPiattoAction(data: PiattoInput, hubSlug: string) {
  try {
    const result = await PiattiService.createPiatto(data);
    revalidatePath(`/dashboard/hubs/${hubSlug}/piatti`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante la creazione del piatto' };
  }
}

export async function updatePiattoAction(
  id: number,
  data: Partial<PiattoInput>,
  hubSlug: string
) {
  try {
    const result = await PiattiService.updatePiatto(id, data);
    revalidatePath(`/dashboard/hubs/${hubSlug}/piatti`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante l\'aggiornamento del piatto' };
  }
}

export async function updateImmaginePiattoAction(id: number, url: string, hubSlug: string) {
  try {
    const result = await PiattiService.updateImmaginePiatto(id, url);
    revalidatePath(`/dashboard/hubs/${hubSlug}/piatti`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante l\'aggiornamento dell\'immagine' };
  }
}

export async function deletePiattoAction(id: number, hubSlug: string) {
  try {
    await PiattiService.deletePiatto(id);
    revalidatePath(`/dashboard/hubs/${hubSlug}/piatti`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Errore durante l'eliminazione del piatto" };
  }
}