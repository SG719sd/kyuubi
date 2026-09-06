'use server';

import { revalidatePath } from 'next/cache';
import { ProdottiService } from '@/server/services/prodotti.service';
import { ProdottoInput } from '@/lib/validations/prodotti';

export async function createProdottoAction(data: ProdottoInput, hubSlug: string) {
  try {
    const result = await ProdottiService.createProdotto(data);
    revalidatePath(`/dashboard/hubs/${hubSlug}/prodotti`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante la creazione del prodotto' };
  }
}

export async function updateProdottoAction(
  id: number,
  data: Partial<ProdottoInput>,
  hubSlug: string
) {
  try {
    const result = await ProdottiService.updateProdotto(id, data);
    revalidatePath(`/dashboard/hubs/${hubSlug}/prodotti`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante l\'aggiornamento del prodotto' };
  }
}

export async function updateImmagineProdottoAction(id: number, url: string, hubSlug: string) {
  try {
    const result = await ProdottiService.updateImmagineProdotto(id, url);
    revalidatePath(`/dashboard/hubs/${hubSlug}/prodotti`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante l\'aggiornamento dell\'immagine' };
  }
}

export async function deleteProdottoAction(id: number, hubSlug: string) {
  try {
    await ProdottiService.deleteProdotto(id);
    revalidatePath(`/dashboard/hubs/${hubSlug}/prodotti`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante l\'eliminazione del prodotto' };
  }
}