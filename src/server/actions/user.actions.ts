'server-only';
'use server';

import { createClient } from '@/utils/supabase/server';
import { UserService } from '../services/user.service';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Action per aggiornare Nome, Cognome e Telefono
 */
export async function updateProfileAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Sessione non valida o utente non autenticato.' };
    }

    const nome = formData.get('nome') as string;
    const cognome = formData.get('cognome') as string;
    const telefono = (formData.get('telefono') as string) || null;

    if (!nome || !cognome) {
      return { error: 'Nome e Cognome sono campi obbligatori.' };
    }

    await UserService.updateUserProfile(user.id, {
      nome,
      cognome,
      telefono,
    });

    revalidatePath('/dashboard/profilo');
    return { success: 'Profilo aggiornato con successo!' };
  } catch (error: any) {
    return { error: error.message || 'Errore durante l\'aggiornamento del profilo.' };
  }
}

/**
 * Action per Soft Delete dell'account e Logout
 */
export async function deleteAccountAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Utente non autenticato.' };
    }

    // 1. Esegui la soft delete sulla tabella 'users'
    await UserService.deleteUserProfile(user.id);

    // 2. Chiudi la sessione Supabase Auth
    await supabase.auth.signOut();

  } catch (error: any) {
    return { error: error.message || 'Impossibile disattivare l\'account.' };
  }

  // 3. Reindirizza alla pagina di login
  redirect('/login');
}