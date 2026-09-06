'use server';

import { revalidatePath } from 'next/cache';
import { RubricaService } from '@/server/services/rubrica.service';
import { RubricaInput } from '@/lib/validations/rubrica';
import { requireHubAdmin } from '@/server/auth/context';

export async function createRubricaAction(data: RubricaInput, hubSlug: string) {
  try {
    await requireHubAdmin(hubSlug);
    const result = await RubricaService.createContatto(data);
    revalidatePath(`/dashboard/hubs/${hubSlug}/rubrica`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante la creazione del contatto' };
  }
}

export async function updateRubricaAction(
  id: number,
  data: Partial<RubricaInput>,
  hubSlug: string
) {
  try {
    await requireHubAdmin(hubSlug);
    const result = await RubricaService.updateContatto(id, data);
    revalidatePath(`/dashboard/hubs/${hubSlug}/rubrica`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante l\'aggiornamento del contatto' };
  }
}

export async function deleteRubricaAction(id: number, hubSlug: string) {
  try {
    await requireHubAdmin(hubSlug);
    await RubricaService.deleteContatto(id);
    revalidatePath(`/dashboard/hubs/${hubSlug}/rubrica`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante l\'eliminazione del contatto' };
  }
}