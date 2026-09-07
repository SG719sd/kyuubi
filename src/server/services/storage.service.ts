import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

export class StorageService {
  private static PRIMARY_BUCKET = 'hubs_media';
  private static FALLBACK_BUCKETS = ['hubs', 'media', 'public'];

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
   * Determina il bucket disponibile o tenta di crearlo automaticamente se mancante
   */
  private static async resolveBucket(supabase: any): Promise<string> {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (!error && Array.isArray(buckets) && buckets.length > 0) {
        // Se hubs_media esiste già
        if (buckets.some((b: any) => b.name === this.PRIMARY_BUCKET || b.id === this.PRIMARY_BUCKET)) {
          return this.PRIMARY_BUCKET;
        }
        // Se l'utente ha creato 'hubs' o altri bucket
        for (const candidate of this.FALLBACK_BUCKETS) {
          const match = buckets.find((b: any) => b.name === candidate || b.id === candidate);
          if (match) {
            return match.name || match.id;
          }
        }
      }

      // Prova a creare automaticamente hubs_media se ha i permessi admin
      const { error: createErr } = await supabase.storage.createBucket(this.PRIMARY_BUCKET, {
        public: true,
      });
      if (!createErr) {
        return this.PRIMARY_BUCKET;
      }
    } catch (e) {
      console.warn('[StorageService] Errore risoluzione automatica bucket:', e);
    }

    return this.PRIMARY_BUCKET;
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
      const bucket = await this.resolveBucket(supabase);

      let { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, fileData, {
          contentType,
          upsert: true,
          cacheControl: '0',
        });

      // Se fallisce per bucket non trovato, ritenta creazione forzata
      if (uploadError && uploadError.message?.toLowerCase().includes('not found')) {
        try {
          await supabase.storage.createBucket(this.PRIMARY_BUCKET, { public: true });
          const retry = await supabase.storage
            .from(this.PRIMARY_BUCKET)
            .upload(storagePath, fileData, {
              contentType,
              upsert: true,
              cacheControl: '0',
            });
          uploadError = retry.error;
        } catch {}
      }

      if (uploadError) {
        console.error('[StorageService] Errore upload:', uploadError);
        return {
          url: '',
          error: `Bucket storage '${bucket}' non trovato su Supabase. Crea un bucket pubblico chiamato 'hubs_media' nella sezione Storage di Supabase (o esegui: INSERT INTO storage.buckets (id, name, public) VALUES ('hubs_media', 'hubs_media', true);)`,
        };
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
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
      const bucket = await this.resolveBucket(supabase);
      let path = filePathOrUrl;

      for (const b of [this.PRIMARY_BUCKET, ...this.FALLBACK_BUCKETS]) {
        if (filePathOrUrl.includes(b)) {
          const parts = filePathOrUrl.split(`${b}/`);
          if (parts.length > 1) {
            path = parts[1].split('?')[0];
            break;
          }
        }
      }

      const { error } = await supabase.storage.from(bucket).remove([path]);
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
