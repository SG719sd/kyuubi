'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { compressAndConvertToWebP } from '@/lib/image-optimizer';
import { getHubStoragePath } from '@/types/storage-paths';
import { Store, Camera, Trash2, Loader2 } from 'lucide-react';

import { updateHubLogoAction } from '@/server/actions/hub-info.actions';
import { uploadMediaAction, deleteMediaAction } from '@/server/actions/storage.actions';

interface HubLogoUploaderProps {
  hubId: string;
  slugHub: string;
  currentLogoUrl: string | null;
  /**
   * Indica se l'utente ha i permessi di gestione dell'Hub (es. Titolare, Admin, Owner)
   */
  isAdmin?: boolean;
}

export function HubLogoUploader({
  hubId,
  slugHub,
  currentLogoUrl,
  isAdmin = false,
}: HubLogoUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl);
  const [loading, setLoading] = useState(false);

  // Genera il path coerente: {hubId}/logo/logo.webp
  const storageFilePath = getHubStoragePath.logo(hubId, 'logo.webp');

  // 1 & 2. CARICA, COMPRIMI E CONVERTI IN WEBP VIA SERVER ACTION
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    // Controllo permessi
    if (!file) return;
    if (!isAdmin) {
      alert('Non hai i permessi necessari per modificare il logo di questo Hub.');
      return;
    }

    setLoading(true);

    try {
      // Compressione e conversione in WebP (max 800x800, qualità 82%)
      const compressedWebpBlob = await compressAndConvertToWebP(file, 800, 800, 0.82);

      // Caricamento sicuro via Server Action
      const formData = new FormData();
      formData.append('file', compressedWebpBlob, 'logo.webp');
      formData.append('storagePath', storageFilePath);

      const uploadRes = await uploadMediaAction(formData);
      if (!uploadRes.success || !uploadRes.url) {
        throw new Error(uploadRes.error || 'Errore durante il caricamento del logo');
      }

      const displayUrl = uploadRes.url;

      // Aggiorna DB tramite Server Action
      const updateRes = await updateHubLogoAction(slugHub, displayUrl);
      if (!updateRes.success) {
        throw new Error(updateRes.error || 'Errore salvataggio logo');
      }

      setLogoUrl(displayUrl);
      router.refresh();
    } catch (err: unknown) {
      console.error('Errore durante il caricamento del logo:', err);
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      alert(`Impossibile caricare il logo: ${errorMessage}`);
    } finally {
      setLoading(false);
      // Reset dell'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 3. RIMOZIONE IMMAGINE
  const handleDeleteLogo = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAdmin) {
      alert('Non hai i permessi necessari per rimuovere il logo.');
      return;
    }

    if (!confirm('Sei sicuro di voler rimuovere il logo?')) return;

    setLoading(true);

    try {
      await deleteMediaAction(storageFilePath);

      const updateRes = await updateHubLogoAction(slugHub, null);
      if (!updateRes.success) {
        throw new Error(updateRes.error || 'Errore rimozione logo');
      }

      setLogoUrl(null);
      router.refresh();
    } catch (err: unknown) {
      console.error('Errore durante la rimozione del logo:', err);
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      alert(`Impossibile rimuovere il logo: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group w-16 h-16 shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={loading || !isAdmin}
      />

      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center overflow-hidden border border-slate-200/20 shadow-lg shadow-sky-500/20 relative">
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        ) : logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo Hub"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <Store className="w-8 h-8 group-hover:scale-105 transition-transform" />
        )}

        {isAdmin && !loading && (
          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              title={logoUrl ? 'Cambia logo' : 'Aggiungi logo'}
            >
              <Camera className="w-3.5 h-3.5" />
            </button>

            {logoUrl && (
              <button
                type="button"
                onClick={handleDeleteLogo}
                className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white transition-colors"
                title="Rimuovi logo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}