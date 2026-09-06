'use server';

import { revalidatePath } from 'next/cache';
import { OrariService } from '@/server/services/orari.service';
import { OrarioLavoroInput } from '@/lib/validations/orari';
import { requireHubAdmin } from '@/server/auth/context';

export async function createOrarioAction(data: OrarioLavoroInput, hubSlug: string) {
  try {
    await requireHubAdmin(hubSlug);

    const result = await OrariService.createOrario(data);
    revalidatePath(`/dashboard/hubs/${hubSlug}/orari`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante la creazione dell\'orario' };
  }
}

export async function updateOrarioAction(
  id: number,
  data: Partial<OrarioLavoroInput>,
  hubSlug: string
) {
  try {
    await requireHubAdmin(hubSlug);

    const result = await OrariService.updateOrario(id, data);
    revalidatePath(`/dashboard/hubs/${hubSlug}/orari`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante l\'aggiornamento dell\'orario' };
  }
}

export async function deleteOrarioAction(id: number, hubSlug: string) {
  try {
    await requireHubAdmin(hubSlug);

    await OrariService.deleteOrario(id);
    revalidatePath(`/dashboard/hubs/${hubSlug}/orari`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante l\'eliminazione dell\'orario' };
  }
}