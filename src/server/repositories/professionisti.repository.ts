import { createClient } from '@/utils/supabase/server';
import { ProfessionistaInput } from '@/lib/validations/professionisti';

export class ProfessionistiRepository {
  static async getByHubId(hubId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('professionisti')
      .select('*')
      .eq('id_hub', hubId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  static async getById(id: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('professionisti')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

static async updateImmagine(id: number, immagineUrl: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('professionisti')
      .update({ img_url: immagineUrl, updated_at: new Date().toISOString() }) // <-- Corretto da 'immagine' a 'img_url'
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async create(payload: ProfessionistaInput) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('professionisti')
      .insert([payload])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: number, payload: Partial<ProfessionistaInput>) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('professionisti')
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

  static async softDelete(id: number) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('professionisti')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }
}