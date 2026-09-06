import { createClient } from "@/utils/supabase/server";
import { HubRow, TablesInsert } from "@/types";

export class HubRepository {
  static async create(data: TablesInsert<'hubs'>): Promise<HubRow> {
    const supabase = await createClient();
    const { data: hub, error } = await (supabase.from('hubs') as any)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Errore creazione Hub: ${error.message}`);
    }

    return hub as unknown as HubRow;
  }

  static async findBySlug(slug: string): Promise<HubRow | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('hubs')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !data) return null;
    return data as unknown as HubRow;
  }

  // --- RECURPERA GLI HUBS DELL'UTENTE ---
  static async findUserHubs(userId: string): Promise<HubRow[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('professionisti')
      .select(`
        hubs!inner(*)
      `)
      .eq('id_user', userId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .is('hubs.deleted_at', null);

    if (error || !data) return [];

    // Estraiamo la relazione 'hubs' da ogni record di professionisti
    return data.map((item: any) => item.hubs as unknown as HubRow);
  }

  static async findBySlugWithProfessionista(slug: string, userId: string) {
    const supabase = await createClient();

    // Recupera l'hub
    const { data: hub, error: hubError } = await supabase
      .from('hubs')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle();

    if (hubError || !hub) return null;

    // Recupera il profilo professionista per questo specifico utente in questo hub
    const { data: professionista } = await supabase
      .from('professionisti')
      .select('*')
      .eq('id_hub', hub.id)
      .eq('id_user', userId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .maybeSingle();

    return { 
      hub: hub as unknown as HubRow, 
      professionista 
    };
  }
}