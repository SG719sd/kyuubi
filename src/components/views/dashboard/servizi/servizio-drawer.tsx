"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Wrench, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { compressAndConvertToWebP } from "@/lib/image-optimizer";
import { getHubStoragePath } from "@/types/storage-paths";
import {
  createServizioAction,
  updateServizioAction,
  updateImmagineServizioAction,
} from "@/server/actions/servizi.actions";

export default function ServizioDrawer({
  isOpen,
  onClose,
  hubId,
  hubSlug,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  hubId: string;
  hubSlug: string;
  initialData?: any;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [form, setForm] = useState({
    titolo: "",
    categoria: "",
    descrizione: "",
    immagine: "",
    codice_a_barre: "",
    ordine: 0,
    prezzo: 0,
    prezzo_costo: 0,
    aliquota_iva: 22,
    tempo_minuti: 30,
    richiede_operatore: false,
    pubblico: true,
    is_active: true,
    note: "",
    preferito: false,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        titolo: initialData.titolo || "",
        categoria: initialData.categoria || "",
        descrizione: initialData.descrizione || "",
        immagine: initialData.immagine || "",
        codice_a_barre: initialData.codice_a_barre || "",
        ordine: initialData.ordine ?? 0,
        prezzo: initialData.prezzo ?? 0,
        prezzo_costo: initialData.prezzo_costo ?? 0,
        aliquota_iva: initialData.aliquota_iva ?? 22,
        tempo_minuti: initialData.tempo_minuti ?? 30,
        richiede_operatore: Boolean(initialData.richiede_operatore),
        pubblico: Boolean(initialData.pubblico),
        is_active: Boolean(initialData.is_active),
        note: initialData.note || "",
        preferito: Boolean(initialData.preferito),
      });
      setImagePreview(initialData.immagine || "");
    } else {
      setForm({
        titolo: "",
        categoria: "",
        descrizione: "",
        immagine: "",
        codice_a_barre: "",
        ordine: 0,
        prezzo: 0,
        prezzo_costo: 0,
        aliquota_iva: 22,
        tempo_minuti: 30,
        richiede_operatore: false,
        pubblico: true,
        is_active: true,
        note: "",
        preferito: false,
      });
      setImagePreview("");
    }
    setImageFile(null);
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const supabase = createClient();

    const payload = {
      ...form,
      id_hub: hubId,
      categoria: form.categoria.trim() || null,
      descrizione: form.descrizione.trim() || null,
      immagine: form.immagine.trim() || null,
      codice_a_barre: form.codice_a_barre.trim() || null,
      note: form.note.trim() || null,
    };

    let servizioId = initialData?.id;

    // 1. Salvataggio / Aggiornamento dati base del servizio
    if (initialData) {
      const res = await updateServizioAction(initialData.id, payload, hubSlug);
      if (!res.success) {
        setErrorMsg(res.error);
        return;
      }
    } else {
      const res = await createServizioAction(payload, hubSlug);
      if (!res.success) {
        setErrorMsg(res.error || "Errore creazione");
        return;
      }

      if ("data" in res && res.data) {
        servizioId = (res as { data: { id: number } }).data.id;
      } else {
        setErrorMsg("Errore creazione: dati non trovati");
        return;
      }
    }

    // 2. Elaborazione e Upload Immagine Servizio
    if (imageFile && servizioId) {
      try {
        const webpBlob = await compressAndConvertToWebP(
          imageFile,
          800,
          800,
          0.82,
        );
        const fileName = `${servizioId}.webp`;
        const storagePath = getHubStoragePath.servizio(hubId, fileName);

        // Upload con bypass della cache CDN Supabase (cacheControl: '0')
        const { error: uploadError } = await supabase.storage
          .from("hubs_media")
          .upload(storagePath, webpBlob, {
            contentType: "image/webp",
            upsert: true,
            cacheControl: "0",
          });

        if (uploadError) throw new Error(uploadError.message);

        // Recupero dell'URL pubblico base
        const { data: publicUrlData } = supabase.storage
          .from("hubs_media")
          .getPublicUrl(storagePath);

        const basePublicUrl = publicUrlData.publicUrl;
        // Timestamp per invalidare la cache nel browser lato client
        const displayUrl = `${basePublicUrl}?t=${Date.now()}`;

        // Aggiornamento database con l'URL completo di timestamp
        await updateImmagineServizioAction(servizioId, displayUrl, hubSlug);
      } catch (imgErr: any) {
        setErrorMsg(
          `Servizio salvato, ma errore upload immagine: ${imgErr.message}`,
        );
        return;
      }
    }

    // 3. Refresh interfaccia e chiusura modal
    startTransition(() => {
      router.refresh();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base tracking-tight flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {initialData ? "Modifica Servizio" : "Nuovo Servizio"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gestisci dettagli, prezzi, tempistiche e immagine.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form
            id="servizio-form"
            onSubmit={handleSubmit}
            className="p-6 space-y-4 overflow-y-auto flex-1 text-xs"
          >
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 rounded-2xl font-medium">
                {errorMsg}
              </div>
            )}

            {/* Immagine Preview & Upload */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Immagine Servizio
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-400 dark:text-slate-600" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-950/50 file:text-indigo-700 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50 cursor-pointer transition-all"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Verrà convertita in formato WebP automaticamente.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Titolo Servizio *
              </label>
              <input
                type="text"
                required
                maxLength={150}
                value={form.titolo}
                onChange={(e) => setForm({ ...form, titolo: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="Nome del servizio..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Categoria
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={form.categoria}
                  onChange={(e) =>
                    setForm({ ...form, categoria: e.target.value })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Es. Consulenza..."
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Codice a Barre
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={form.codice_a_barre}
                  onChange={(e) =>
                    setForm({ ...form, codice_a_barre: e.target.value })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Barcode opzionale"
                />
              </div>
            </div>

            {/* Prezzi */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Prezzo di Vendita
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.prezzo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      prezzo: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Prezzo di Costo
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.prezzo_costo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      prezzo_costo: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Aliquota IVA (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.aliquota_iva}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      aliquota_iva: parseFloat(e.target.value) || 22,
                    })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Durata (Minuti)
                </label>
                <input
                  type="number"
                  value={form.tempo_minuti}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tempo_minuti: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ordine Visualizzazione
                </label>
                <input
                  type="number"
                  value={form.ordine}
                  onChange={(e) =>
                    setForm({ ...form, ordine: parseInt(e.target.value) || 0 })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Descrizione
              </label>
              <textarea
                maxLength={1000}
                rows={3}
                value={form.descrizione}
                onChange={(e) =>
                  setForm({ ...form, descrizione: e.target.value })
                }
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Note Interne
              </label>
              <textarea
                maxLength={500}
                rows={2}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all"
              />
            </div>

            {/* Toggle Flags */}
            <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
              <label className="flex justify-between items-center cursor-pointer select-none">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Richiede Operatore
                </span>
                <input
                  type="checkbox"
                  checked={form.richiede_operatore}
                  onChange={(e) =>
                    setForm({ ...form, richiede_operatore: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                />
              </label>
              <label className="flex justify-between items-center cursor-pointer select-none">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Servizio Attivo
                </span>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                />
              </label>
              <label className="flex justify-between items-center cursor-pointer select-none">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Servizio Pubblico
                </span>
                <input
                  type="checkbox"
                  checked={form.pubblico}
                  onChange={(e) =>
                    setForm({ ...form, pubblico: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                />
              </label>
              <label className="flex justify-between items-center cursor-pointer select-none">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Contrassegna come Preferito
                </span>
                <input
                  type="checkbox"
                  checked={form.preferito}
                  onChange={(e) =>
                    setForm({ ...form, preferito: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                />
              </label>
            </div>
          </form>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              form="servizio-form"
              disabled={isPending}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              {isPending ? "Salvataggio..." : "Salva Servizio"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
