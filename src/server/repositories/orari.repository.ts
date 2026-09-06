import { createClient } from '@/utils/supabase/server';
import { OrarioLavoroInput } from '@/lib/validations/orari';

export class OrariRepository {
  /**
   * Recupera gli orari per un dato Hub e opzionalmente filtrati per professionista.
   * Se idProfessionista è null, recupera gli orari generali dell'Hub.
   */
  static async getByHubId(hubId: string, idProfessionista?: number | null) {
  const supabase = await createClient();

  let query = supabase
    .from('orari_lavoro')
    .select(`
      *,
      professionisti (
        id,
        nome
      )
    `)
    .eq('id_hub', hubId)
    .order('giorno_settimana', { ascending: true });

    if (idProfessionista !== undefined) {
      if (idProfessionista === null) {
        query = query.is('id_professionista', null);
      } else {
        query = query.eq('id_professionista', idProfessionista);
      }
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  static async create(payload: OrarioLavoroInput) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('orari_lavoro')
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: number, payload: Partial<OrarioLavoroInput>) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('orari_lavoro')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async delete(id: number) {
    const supabase = await createClient();

    const { error } = await supabase
      .from('orari_lavoro')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }
}