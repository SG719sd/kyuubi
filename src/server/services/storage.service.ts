import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

export class StorageService {
  private static BUCKET = 'hubs_media';

  private static async getClient() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (serviceKey && url) {
      return createSupabaseAdminClient(url, serviceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }

    return await createClient();
  }

  /**
   * Carica un file nello storage Supabase via server-side
   */
  static async uploadFile(
    storagePath: string,
    fileData: ArrayBuffer | Blob | Buffer,
    contentType = 'image/webp'
  ): Promise<{ url: string; error?: string }> {
    try {
      const supabase = await this.getClient();

      const { error: uploadError } = await supabase.storage
        .from(this.BUCKET)
        .upload(storagePath, fileData, {
          contentType,
          upsert: true,
          cacheControl: '0',
        });

      if (uploadError) {
        console.error('[StorageService] Errore upload:', uploadError);
        return { url: '', error: uploadError.message };
      }

      const { data: publicUrlData } = supabase.storage
        .from(this.BUCKET)
        .getPublicUrl(storagePath);

      const basePublicUrl = publicUrlData.publicUrl;
      const displayUrl = `${basePublicUrl}?t=${Date.now()}`;

      return { url: displayUrl };
    } catch (err: any) {
      console.error('[StorageService] Eccezione upload:', err);
      return { url: '', error: err.message || 'Errore sconosciuto durante il caricamento' };
    }
  }

  /**
   * Elimina un file dallo storage a partire dal suo percorso relativo o URL pubblico.
   */
  static async deleteFile(filePathOrUrl: string): Promise<boolean> {
    if (!filePathOrUrl) return true;

    try {
      const supabase = await this.getClient();
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
