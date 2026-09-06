import { createClient } from '@/utils/supabase/server';
import { UserService } from '../services/user.service';
import { ConsensiService } from '../services/consensi.service';
import { UserRow } from '@/types';
import { User } from '@supabase/supabase-js';

export type RegisterParams = {
  email: string;
  password: string;
  nome: string;
  cognome: string;
  telefono: string;
  marketingAccettato?: boolean;
  ipAddress: string;
};

export class AuthOrchestrator {
  static async register(params: RegisterParams): Promise<{ authUser: User; profile: UserRow }> {
    const supabase = await createClient();

    // 1. SignUp su Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          nome: params.nome,
          cognome: params.cognome,
          telefono: params.telefono,
        },
      },
    });

    if (authError || !authData.user) {
      console.error('❌ ERRORE SUPABASE AUTH:', authError?.message);
      throw new Error(authError?.message || 'Errore durante la registrazione.');
    }

    const userId = authData.user.id;

    // 2. Inserimento/Aggiornamento Profilo su public.users (Upsert)
    let newUser: UserRow;
    try {
      newUser = await UserService.upsertUserProfile({
        id: userId,
        email: params.email,
        nome: params.nome,
        cognome: params.cognome,
        telefono: params.telefono,
        is_active: true,
      });
    } catch (err: any) {
      console.error('❌ ERRORE GESTIONE TABELLA USERS:', err.message);
      throw new Error(`Errore creazione profilo: ${err.message}`);
    }

    // 3. Salva Consensi nel DB
    try {
      await ConsensiService.saveInitialConsents({
        userId,
        ipAddress: params.ipAddress,
        marketingAccettato: !!params.marketingAccettato,
      });
    } catch (err: any) {
      console.error('❌ ERRORE SALVATAGGIO CONSENSI:', err.message);
      throw new Error(`Errore registrazione consensi: ${err.message}`);
    }

    return { authUser: authData.user, profile: newUser };
  }

  static async login(email: string, password: string): Promise<{ user: User; profile: UserRow }> {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Credenziali non valide.');
    }

    const profile = await UserService.getUserProfile(data.user.id);

    return { user: data.user, profile };
  }
}