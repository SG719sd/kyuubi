'server-only';
'use server';

import { createClient } from '@/utils/supabase/server';
import { CreateHubOrchestrator } from '../orchestrators/create-hub.orchestrator';
import { ActionResponse, CreateHubWizardDTO } from '@/types';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export async function createHubWizardAction(
  dto: CreateHubWizardDTO
): Promise<ActionResponse<{ slug: string }>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Sessione scaduta o utente non autenticato.' };
    }

    const headersList = await headers();
    const userIp = headersList.get('x-forwarded-for') || '127.0.0.1';

    const newHub = await CreateHubOrchestrator.execute({
      ...dto,
      userId: user.id,
      userIp,
    });

    revalidatePath('/dashboard');
    return {
      success: true,
      message: 'Hub creato con successo!',
      data: { slug: newHub.slug },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Errore durante la creazione dell\'Hub.',
    };
  }
}