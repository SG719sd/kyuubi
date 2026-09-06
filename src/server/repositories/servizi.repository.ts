import { createClient } from '@/utils/supabase/server';
import { ServizioInput } from '@/lib/validations/servizi';

export class ServiziRepository {
  static async getByHubId(hubId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('servizi')
      .select('*')
      .eq('id_hub', hubId)
      .is('deleted_at', null)
      .order('ordine', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  static async create(payload: ServizioInput) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('servizi')
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: number, payload: Partial<ServizioInput>) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('servizi')
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

  static async updateImmagine(id: number, immagineUrl: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('servizi')
      .update({ immagine: immagineUrl, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async softDelete(id: number) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('servizi')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }
}