import { createClient } from '@/utils/supabase/server';
import { ProfessionistaServizioInput } from '@/lib/validations/professionisti-servizi';

export class ProfessionistiServiziRepository {
  /**
   * Recupera tutte le associazioni personalizzate per un intero Hub
   */
  static async getByHubId(hubId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('professionisti_servizi')
      .select('*')
      .eq('id_hub', hubId);

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Recupera tutte le associazioni personalizzate per un dato Hub e Professionista
   */
  static async getByProfId(hubId: string, idProfessionista: number) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('professionisti_servizi')
      .select(`
        *,
        servizi (*)
      `)
      .eq('id_hub', hubId)
      .eq('id_professionista', idProfessionista);

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Upsert (Crea o Aggiorna in caso di conflitto su id_professionista + id_servizio)
   */
  static async upsert(payload: ProfessionistaServizioInput) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('professionisti_servizi')
      .upsert(
        {
          ...payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id_professionista,id_servizio' }
      )
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async delete(id: number) {
    const supabase = await createClient();

    const { error } = await supabase
      .from('professionisti_servizi')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }
}