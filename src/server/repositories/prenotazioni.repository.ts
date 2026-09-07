import { createClient } from '@/utils/supabase/server';
import { Database } from '@/types/database.types';

type PrenotazioneRow = Database['public']['Tables']['prenotazioni']['Row'];
type PrenotazioneInsert = Database['public']['Tables']['prenotazioni']['Insert'];
type PrenotazioneUpdate = Database['public']['Tables']['prenotazioni']['Update'];
type PrenotazioneItemInsert = Database['public']['Tables']['prenotazioni_items']['Insert'];
type PrenotazioneItemRow = Database['public']['Tables']['prenotazioni_items']['Row'];

export interface PrenotazioneWithDetails extends PrenotazioneRow {
  items: PrenotazioneItemRow[];
  professionisti?: {
    id: number;
    nome: string;
    ruolo: string;
    img_url?: string | null;
  } | null;
  rubrica?: {
    id: number;
    nome: string;
    cognome: string | null;
    telefono: string | null;
    email: string | null;
  } | null;
}

export class PrenotazioniRepository {
  /**
   * Recupera la lista delle prenotazioni con filtri e join relazionali
   */
  static async listByHubId(
    hubId: string,
    options?: {
      startDate?: string;
      endDate?: string;
      stato?: string;
      id_professionista?: number;
    }
  ): Promise<PrenotazioneWithDetails[]> {
    const supabase = await createClient();

    let query = supabase
      .from('prenotazioni')
      .select(`
        *,
        items:prenotazioni_items(*),
        professionisti(id, nome, ruolo, img_url),
        rubrica(id, nome, cognome, telefono, email)
      `)
      .eq('id_hub', hubId)
      .is('deleted_at', null)
      .order('tms_inizio', { ascending: true });

    if (options?.startDate) {
      query = query.gte('tms_inizio', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('tms_inizio', options.endDate);
    }
    if (options?.stato) {
      query = query.eq('stato', options.stato);
    }
    if (options?.id_professionista) {
      query = query.eq('id_professionista', options.id_professionista);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as unknown as PrenotazioneWithDetails[]) || [];
  }

  /**
   * Recupera una singola prenotazione per ID
   */
  static async getById(id: number, hubId: string): Promise<PrenotazioneWithDetails | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('prenotazioni')
      .select(`
        *,
        items:prenotazioni_items(*),
        professionisti(id, nome, ruolo, img_url),
        rubrica(id, nome, cognome, telefono, email)
      `)
      .eq('id', id)
      .eq('id_hub', hubId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !data) return null;
    return data as unknown as PrenotazioneWithDetails;
  }

  /**
   * Crea una nuova prenotazione con i relativi items
   */
  static async create(
    header: PrenotazioneInsert,
    items: Omit<PrenotazioneItemInsert, 'id_prenotazione'>[]
  ): Promise<PrenotazioneWithDetails> {
    const supabase = await createClient();

    const { data: createdHeader, error: headerError } = await supabase
      .from('prenotazioni')
      .insert([header])
      .select()
      .single();

    if (headerError || !createdHeader) {
      throw new Error(`Errore creazione testata prenotazione: ${headerError?.message}`);
    }

    const itemsToInsert: PrenotazioneItemInsert[] = items.map((item) => ({
      ...item,
      id_prenotazione: createdHeader.id,
      id_hub: header.id_hub,
    }));

    if (itemsToInsert.length > 0) {
      const { error: itemsError } = await supabase
        .from('prenotazioni_items')
        .insert(itemsToInsert);

      if (itemsError) {
        // Rollback logico eliminando la testata appena creata
        await supabase.from('prenotazioni').delete().eq('id', createdHeader.id);
        throw new Error(`Errore creazione items prenotazione: ${itemsError.message}`);
      }
    }

    const fullRecord = await this.getById(createdHeader.id, header.id_hub);
    if (!fullRecord) throw new Error('Impossibile recuperare la prenotazione creata');
    return fullRecord;
  }

  /**
   * Aggiorna una prenotazione e sincronizza gli items
   */
  static async update(
    id: number,
    hubId: string,
    header: PrenotazioneUpdate,
    items?: Omit<PrenotazioneItemInsert, 'id_prenotazione'>[]
  ): Promise<PrenotazioneWithDetails> {
    const supabase = await createClient();

    const { data: updatedHeader, error: updateError } = await supabase
      .from('prenotazioni')
      .update({
        ...header,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('id_hub', hubId)
      .select()
      .single();

    if (updateError || !updatedHeader) {
      throw new Error(`Errore aggiornamento prenotazione: ${updateError?.message}`);
    }

    // Se sono forniti nuovi items, sostituiamo gli esistenti per questa prenotazione
    if (items && items.length > 0) {
      // Elimina items vecchi
      await supabase
        .from('prenotazioni_items')
        .delete()
        .eq('id_prenotazione', id);

      const itemsToInsert: PrenotazioneItemInsert[] = items.map((item) => ({
        ...item,
        id_prenotazione: id,
        id_hub: hubId,
      }));

      const { error: insertItemsError } = await supabase
        .from('prenotazioni_items')
        .insert(itemsToInsert);

      if (insertItemsError) {
        throw new Error(`Errore aggiornamento items prenotazione: ${insertItemsError.message}`);
      }
    }

    const fullRecord = await this.getById(id, hubId);
    if (!fullRecord) throw new Error('Impossibile recuperare la prenotazione aggiornata');
    return fullRecord;
  }

  /**
   * Cambio stato rapido
   */
  static async updateStato(id: number, hubId: string, stato: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('prenotazioni')
      .update({ stato, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('id_hub', hubId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Soft delete di una prenotazione
   */
  static async softDelete(id: number, hubId: string): Promise<boolean> {
    const supabase = await createClient();
    const now = new Date().toISOString();

    const { error: headerError } = await supabase
      .from('prenotazioni')
      .update({ deleted_at: now, is_active: false })
      .eq('id', id)
      .eq('id_hub', hubId);

    if (headerError) throw new Error(headerError.message);

    // Soft delete items associati
    await supabase
      .from('prenotazioni_items')
      .update({ deleted_at: now, is_active: false })
      .eq('id_prenotazione', id);

    return true;
  }

  /**
   * Ricerca slot occupati per calcolo disponibilità
   */
  static async findOccupiedSlots(
    hubId: string,
    startDate: string,
    endDate: string,
    id_professionista?: number
  ) {
    const supabase = await createClient();

    let query = supabase
      .from('prenotazioni')
      .select('id, tms_inizio, tms_fine, tempo_minuti, id_professionista, stato')
      .eq('id_hub', hubId)
      .neq('stato', 'cancellata')
      .is('deleted_at', null)
      .gte('tms_inizio', startDate)
      .lte('tms_inizio', endDate);

    if (id_professionista) {
      query = query.eq('id_professionista', id_professionista);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  }
}
