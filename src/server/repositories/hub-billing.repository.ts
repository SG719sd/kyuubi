import { createClient } from "@/utils/supabase/server";
import { HubBillingInfo, TablesInsert } from "@/types";

export class HubBillingRepository {
  static async create(data: TablesInsert<'hub_billing_info'>): Promise<HubBillingInfo> {
    const supabase = await createClient();
    const { data: billing, error } = await supabase
      .from('hub_billing_info')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Errore salvataggio dati fatturazione: ${error.message}`);
    }

    return billing;
  }
}