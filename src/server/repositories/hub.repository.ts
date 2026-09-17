import { createClient, createAdminClient } from "@/utils/supabase/server";
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

  // --- RECUPERA GLI HUBS DELL'UTENTE ---
  static async findUserHubs(userId: string): Promise<HubRow[]> {
    const supabase = await createClient();

    // 1. Hubs a cui l'utente appartiene come professionista/collaboratore/admin
    const { data: profHubs } = await supabase
      .from('professionisti')
      .select(`
        hubs!inner(*)
      `)
      .eq('id_user', userId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .is('hubs.deleted_at', null);

    // 2. Hubs creati/posseduti direttamente dall'utente
    const { data: ownedHubs } = await supabase
      .from('hubs')
      .select('*')
      .eq('id_user', userId)
      .is('deleted_at', null);

    const hubMap = new Map<string, HubRow>();

    if (profHubs && Array.isArray(profHubs)) {
      profHubs.forEach((item: any) => {
        if (item.hubs && item.hubs.id) {
          hubMap.set(item.hubs.id, item.hubs as HubRow);
        }
      });
    }

    if (ownedHubs && Array.isArray(ownedHubs)) {
      ownedHubs.forEach((hub: any) => {
        if (hub && hub.id) {
          hubMap.set(hub.id, hub as HubRow);
        }
      });
    }

    // Fallback con client admin se le query anonime restituiscono vuoto e abbiamo il service role
    if (hubMap.size === 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data: adminProfHubs } = await adminClient
          .from('professionisti')
          .select(`hubs!inner(*)`)
          .eq('id_user', userId)
          .eq('is_active', true)
          .is('deleted_at', null)
          .is('hubs.deleted_at', null);

        const { data: adminOwnedHubs } = await adminClient
          .from('hubs')
          .select('*')
          .eq('id_user', userId)
          .is('deleted_at', null);

        if (adminProfHubs && Array.isArray(adminProfHubs)) {
          adminProfHubs.forEach((item: any) => {
            if (item.hubs && item.hubs.id) {
              hubMap.set(item.hubs.id, item.hubs as HubRow);
            }
          });
        }

        if (adminOwnedHubs && Array.isArray(adminOwnedHubs)) {
          adminOwnedHubs.forEach((hub: any) => {
            if (hub && hub.id) {
              hubMap.set(hub.id, hub as HubRow);
            }
          });
        }
      }
    }

    return Array.from(hubMap.values());
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