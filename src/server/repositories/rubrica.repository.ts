import { createClient, createAdminClient } from '@/utils/supabase/server';
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

    let { data, error } = await query;

    if ((error || !data) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createAdminClient();
      if (adminClient) {
        let adminQuery = adminClient
          .from('rubrica')
          .select('*')
          .eq('id_hub', hubId)
          .is('deleted_at', null)
          .order('nome', { ascending: true });

        if (search && search.trim() !== '') {
          const cleanSearch = `%${search.trim()}%`;
          adminQuery = adminQuery.or(`nome.ilike.${cleanSearch},cognome.ilike.${cleanSearch},telefono.ilike.${cleanSearch}`);
        }
        const adminRes = await adminQuery;
        if (!adminRes.error && adminRes.data) {
          data = adminRes.data;
          error = null;
        }
      }
    }

    if (error) throw new Error(error.message);
    return data || [];
  }

  static async getById(id: number) {
    const numId = Number(id);
    const supabase = await createClient();

    let { data, error } = await supabase
      .from('rubrica')
      .select('*')
      .eq('id', numId)
      .is('deleted_at', null)
      .maybeSingle();

    if ((error || !data) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const adminRes = await adminClient
          .from('rubrica')
          .select('*')
          .eq('id', numId)
          .is('deleted_at', null)
          .maybeSingle();
        if (!adminRes.error && adminRes.data) {
          data = adminRes.data;
          error = null;
        }
      }
    }

    if (error) throw new Error(error.message);
    return data;
  }

  static async create(payload: RubricaInput) {
    const supabase = await createClient();
    const insertPayload = {
      ...payload,
      email: payload.email || null,
      id_user: payload.id_user || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from('rubrica')
      .insert(insertPayload)
      .select()
      .maybeSingle();

    if ((error || !data) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const adminRes = await adminClient
          .from('rubrica')
          .insert(insertPayload)
          .select()
          .maybeSingle();
        if (!adminRes.error && adminRes.data) {
          data = adminRes.data;
          error = null;
        }
      }
    }

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: number, payload: Partial<RubricaInput>) {
    const numId = Number(id);
    const supabase = await createClient();

    // Rimuoviamo campi immutabili
    const updateFields = { ...(payload as Record<string, any>) };
    delete updateFields.id;
    delete updateFields.id_hub;
    delete updateFields.created_at;

    const updatePayload = {
      ...updateFields,
      ...(payload.email !== undefined ? { email: payload.email || null } : {}),
      ...(payload.id_user !== undefined ? { id_user: payload.id_user || null } : {}),
      updated_at: new Date().toISOString(),
    };

    let { data: updatedRows, error } = await supabase
      .from('rubrica')
      .update(updatePayload)
      .eq('id', numId)
      .select();

    if ((error || !updatedRows || updatedRows.length === 0) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const adminRes = await adminClient
          .from('rubrica')
          .update(updatePayload)
          .eq('id', numId)
          .select();
        if (!adminRes.error && adminRes.data && adminRes.data.length > 0) {
          updatedRows = adminRes.data;
          error = null;
        }
      }
    }

    if (error) throw new Error(error.message);
    return updatedRows && updatedRows.length > 0 ? updatedRows[0] : null;
  }

  static async softDelete(id: number) {
    const numId = Number(id);
    const supabase = await createClient();

    let { error } = await supabase
      .from('rubrica')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
      })
      .eq('id', numId);

    if (error && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const adminRes = await adminClient
          .from('rubrica')
          .update({
            deleted_at: new Date().toISOString(),
            is_active: false,
          })
          .eq('id', numId);
        if (!adminRes.error) {
          error = null;
        }
      }
    }

    if (error) throw new Error(error.message);
    return true;
  }
}