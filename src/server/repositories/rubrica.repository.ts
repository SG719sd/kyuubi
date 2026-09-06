import { createClient } from '@/utils/supabase/server';
import { RubricaInput } from '@/lib/validations/rubrica';

export class RubricaRepository {
  static async getByHubId(hubId: string, search?: string) {
    const supabase = await createClient();

    let query = supabase
      .from('rubrica')
      .select('*')
      .eq('id_hub', hubId)
      .is('deleted_at', null)
      .order('nome', { ascending: true });

    if (search && search.trim() !== '') {
      const cleanSearch = `%${search.trim()}%`;
      query = query.or(`nome.ilike.${cleanSearch},cognome.ilike.${cleanSearch},telefono.ilike.${cleanSearch}`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  static async getById(id: number) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('rubrica')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async create(payload: RubricaInput) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('rubrica')
      .insert({
        ...payload,
        email: payload.email || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: number, payload: Partial<RubricaInput>) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('rubrica')
      .update({
        ...payload,
        email: payload.email || null,
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
      .from('rubrica')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }
}