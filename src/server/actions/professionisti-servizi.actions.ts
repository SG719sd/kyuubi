'use server';

import { revalidatePath } from 'next/cache';
import { ProfessionistiServiziService } from '@/server/services/professionisti-servizi.service';
import { ProfessionistaServizioInput } from '@/lib/validations/professionisti-servizi';
import { requireHubAdmin } from '@/server/auth/context';

export async function saveProfessionistaServizioAction(
  data: ProfessionistaServizioInput,
  hubSlug: string
) {
  try {
    await requireHubAdmin(hubSlug);

    const result = await ProfessionistiServiziService.savePersonalizzazione(data);
    revalidatePath(`/dashboard/hubs/${hubSlug}/servizi-professionisti`);
    return { success: true, data: result };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante il salvataggio della personalizzazione' };
  }
}

export async function deleteProfessionistaServizioAction(
  id: number,
  hubSlug: string
) {
  try {
    await requireHubAdmin(hubSlug);

    await ProfessionistiServiziService.removePersonalizzazione(id);
    revalidatePath(`/dashboard/hubs/${hubSlug}/servizi-professionisti`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore durante la rimozione' };
  }
}