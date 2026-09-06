import { createClient } from '@/utils/supabase/server';

export class StorageService {
  private static BUCKET = 'hubs_media';

  /**
   * Elimina un file dallo storage a partire dal suo percorso relativo o URL pubblico.
   */
  static async deleteFile(filePathOrUrl: string): Promise<boolean> {
    if (!filePathOrUrl) return true;

    try {
      const supabase = await createClient();
      let path = filePathOrUrl;

      // Se è un URL completo, estraiamo il percorso relativo all'interno del bucket hubs_media
      if (filePathOrUrl.includes(this.BUCKET)) {
        const parts = filePathOrUrl.split(`${this.BUCKET}/`);
        if (parts.length > 1) {
          path = parts[1].split('?')[0]; // Rimuove eventuali query parameters (?t=...)
        }
      }

      const { error } = await supabase.storage.from(this.BUCKET).remove([path]);
      if (error) {
        console.warn(`[StorageService] Avviso rimozione file '${path}':`, error.message);
        return false;
      }
      return true;
    } catch (err: any) {
      console.warn(`[StorageService] Eccezione rimozione file:`, err.message);
      return false;
    }
  }
}
