import { createClient } from '@/utils/supabase/server';
import { Database } from '@/types/database.types';

type HubRow = Database['public']['Tables']['hubs']['Row'];
type BillingRow = Database['public']['Tables']['hub_billing_info']['Row'];
type HubUpdate = Database['public']['Tables']['hubs']['Update'];
type BillingUpdate = Database['public']['Tables']['hub_billing_info']['Update'];

export class HubInfoRepository {
  /**
   * Recupera le info generali dell'Hub e le info di fatturazione
   */
  static async getHubDataBySlug(slug: string) {
    const supabase = await createClient();

    const { data: hub, error: hubError } = await supabase
      .from('hubs')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle();

    if (hubError || !hub) return null;

    const { data: billing } = await supabase
      .from('hub_billing_info')
      .select('*')
      .eq('hub_id', hub.id)
      .maybeSingle();

    return {
      hub: hub as unknown as HubRow,
      billing: billing as unknown as BillingRow | null,
    };
  }

  /**
   * Aggiorna la tabella `hubs`
   */
  static async updateHub(hubId: string, payload: HubUpdate): Promise<HubRow> {
    const supabase = await createClient();

    const updatePayload = {
      ...payload,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>;

    const { data, error } = await supabase
      .from('hubs')
      .update(updatePayload as never)
      .eq('id', hubId)
      .select()
      .single();

    if (error) throw new Error(`Errore durante l'aggiornamento dell'Hub: ${error.message}`);
    return data as unknown as HubRow;
  }

  /**
   * Aggiorna o crea (UPSERT) la tabella `hub_billing_info`
   */
  static async upsertBillingInfo(hubId: string, payload: BillingUpdate): Promise<BillingRow> {
    const supabase = await createClient();

    const upsertPayload = {
      hub_id: hubId,
      ...payload,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>;

    const { data, error } = await supabase
      .from('hub_billing_info')
      .upsert(upsertPayload as never)
      .select()
      .single();

    if (error) throw new Error(`Errore durante l'aggiornamento dei dati di fatturazione: ${error.message}`);
    return data as unknown as BillingRow;
  }
}