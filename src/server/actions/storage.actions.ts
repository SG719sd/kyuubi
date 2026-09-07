'use server';

import { StorageService } from '@/server/services/storage.service';

/**
 * Server action per il caricamento sicuro di file e immagini su Supabase Storage.
 * Bypassa i limiti e conflitti delle RLS lato client delegando l'operazione al backend.
 */
export async function uploadMediaAction(formData: FormData): Promise<{
  success: boolean;
  url?: string;
  error?: string;
}> {
  try {
    const file = formData.get('file') as File | null;
    const storagePath = formData.get('storagePath') as string | null;

    if (!file || !storagePath) {
      return { success: false, error: 'File o percorso di destinazione non fornito.' };
    }

    const arrayBuffer = await file.arrayBuffer();
    const contentType = file.type || 'image/webp';

    const result = await StorageService.uploadFile(storagePath, arrayBuffer, contentType);

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true, url: result.url };
  } catch (err: any) {
    console.error('[uploadMediaAction] Errore:', err);
    return {
      success: false,
      error: err.message || 'Errore durante il caricamento del file.',
    };
  }
}

/**
 * Server action per la cancellazione di un file dallo storage.
 */
export async function deleteMediaAction(filePathOrUrl: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const ok = await StorageService.deleteFile(filePathOrUrl);
    return { success: ok };
  } catch (err: any) {
    console.error('[deleteMediaAction] Errore:', err);
    return { success: false, error: err.message };
  }
}
