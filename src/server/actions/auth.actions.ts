'use server';

import { AuthOrchestrator } from '../orchestrators/auth.orchestrator';
import { ActionResponse } from '@/types';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function loginAction(formData: FormData): Promise<ActionResponse> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    await AuthOrchestrator.login(email, password);
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  redirect('/dashboard');
}

export async function registerAction(formData: FormData): Promise<ActionResponse> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const nome = formData.get('nome') as string;
  const cognome = formData.get('cognome') as string;
  const telefono = formData.get('telefono') as string;
  const marketingAccettato = formData.get('marketing') === 'on';

  if (!email || !password || !nome || !cognome || !telefono) {
    return { success: false, error: 'Tutti i campi obbligatori devono essere compilati.' };
  }

  // Estrazione dell'IP Address reale dagli header HTTP
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  
  // Se ci sono più IP in x-forwarded-for, prendiamo il primo (quello del client originale)
  const ipAddress = forwardedFor 
    ? forwardedFor.split(',')[0].trim() 
    : (realIp || '127.0.0.1');

  try {
    await AuthOrchestrator.register({
      email,
      password,
      nome,
      cognome,
      telefono,
      marketingAccettato,
      ipAddress,
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  redirect('/dashboard');
}

export async function logoutAction() {
  const { createClient } = await import('@/utils/supabase/server');
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}