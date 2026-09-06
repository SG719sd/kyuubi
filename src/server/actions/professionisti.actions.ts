'use server';

import { revalidatePath } from 'next/cache';
import { ProfessionistiService } from '@/server/services/professionisti.service';
import { ProfessionistaInput } from '@/lib/validations/professionisti';

export async function createProfessionistaAction(data: ProfessionistaInput, hubSlug: string) {
  try {
    const result = await ProfessionistiService.createProfessionista(data);
    revalidatePath(`/dashboard/hubs/${hubSlug}/professionisti`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante la creazione' };
  }
}

export async function updateProfessionistaAction(
  id: number,
  data: Partial<ProfessionistaInput>,
  hubSlug: string
) {
  try {
    const result = await ProfessionistiService.updateProfessionista(id, data);
    revalidatePath(`/dashboard/hubs/${hubSlug}/professionisti`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante l\'aggiornamento' };
  }
}

export async function updateImmagineProfessionistaAction(id: number, url: string, hubSlug: string) {
  try {
    const result = await ProfessionistiService.updateImmagineProfessionista(id, url);
    revalidatePath(`/dashboard/hubs/${hubSlug}/professionisti`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante l\'aggiornamento dell\'immagine' };
  }
}

export async function deleteProfessionistaAction(id: number, hubSlug: string) {
  try {
    await ProfessionistiService.deleteProfessionista(id);
    revalidatePath(`/dashboard/hubs/${hubSlug}/professionisti`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante l\'eliminazione' };
  }
}