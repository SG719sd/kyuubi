import { createClient } from '@/utils/supabase/server';
import { TablesInsert } from '@/types';

export class ConsensiRepository {
  /**
   * Inserisce uno o più consensi nella tabella consensi_autorizzazioni
   */
  static async createMany(consensi: TablesInsert<'consensi_autorizzazioni'>[]) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('consensi_autorizzazioni')
      .insert(consensi as any)
      .select();

    if (error) {
      throw new Error(`Errore durante il salvataggio dei consensi: ${error.message}`);
    }

    return data;
  }
}