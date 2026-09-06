"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, UtensilsCrossed, Upload, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { compressAndConvertToWebP } from "@/lib/image-optimizer";
import { getHubStoragePath } from "@/types/storage-paths";
import {
  createPiattoAction,
  updatePiattoAction,
  updateImmaginePiattoAction,
} from "@/server/actions/piatti.actions";

export default function PiattoDrawer({
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
    ingredienti: "",
    allergeni: "",
    prezzo: 0,
    aliquota_iva: 10,
    immagine: "",
    ordine: 0,
    is_vegetariano: false,
    is_vegano: false,
    is_gluten_free: false,
    is_disponibile: true,
    pubblico: true,
    prenotabile: false,
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
        ingredienti: initialData.ingredienti || "",
        allergeni: initialData.allergeni || "",
        prezzo: initialData.prezzo ?? 0,
        aliquota_iva: initialData.aliquota_iva ?? 10,
        immagine: initialData.immagine || "",
        ordine: initialData.ordine ?? 0,
        is_vegetariano: Boolean(initialData.is_vegetariano),
        is_vegano: Boolean(initialData.is_vegano),
        is_gluten_free: Boolean(initialData.is_gluten_free),
        is_disponibile: Boolean(initialData.is_disponibile),
        pubblico: initialData.pubblico !== undefined ? Boolean(initialData.pubblico) : true,
        prenotabile: initialData.prenotabile !== undefined ? Boolean(initialData.prenotabile) : false,
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
        ingredienti: "",
        allergeni: "",
        prezzo: 0,
        aliquota_iva: 10,
        immagine: "",
        ordine: 0,
        is_vegetariano: false,
        is_vegano: false,
        is_gluten_free: false,
        is_disponibile: true,
        pubblico: true,
        prenotabile: false,
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
      ingredienti: form.ingredienti.trim() || null,
      allergeni: form.allergeni.trim() || null,
      immagine: form.immagine.trim() || null,
      note: form.note.trim() || null,
    };

    let piattoId = initialData?.id;

    // 1. Salvataggio / Aggiornamento dati base del piatto
    if (initialData) {
      const res = await updatePiattoAction(initialData.id, payload, hubSlug);
      if (!res.success) {
        setErrorMsg(res.error);
        return;
      }
    } else {
      const res = await createPiattoAction(payload, hubSlug);
      if (!res.success) {
        setErrorMsg(res.error || "Errore creazione");
        return;
      }

      if ("data" in res && res.data) {
        piattoId = (res as { data: { id: number } }).data.id;
      } else {
        setErrorMsg("Errore creazione: dati non trovati");
        return;
      }
    }

    // 2. Elaborazione e Upload Immagine (se presente)
    if (imageFile && piattoId) {
      try {
        // Compressione e conversione WebP
        const webpBlob = await compressAndConvertToWebP(
          imageFile,
          800,
          800,
          0.82,
        );
        const fileName = `${piattoId}.webp`;
        const storagePath = getHubStoragePath.piatto(hubId, fileName);

        // Upload su Supabase Storage con cacheControl: '0'
        const { error: uploadError } = await supabase.storage
          .from("hubs_media")
          .upload(storagePath, webpBlob, {
            contentType: "image/webp",
            upsert: true,
            cacheControl: "0",
          });

        if (uploadError) throw new Error(uploadError.message);

        // Recupero URL pubblico base
        const { data: publicUrlData } = supabase.storage
          .from("hubs_media")
          .getPublicUrl(storagePath);

        const basePublicUrl = publicUrlData.publicUrl;
        // Timestamp per forzare l'aggiornamento istantaneo dell'immagine nel browser
        const displayUrl = `${basePublicUrl}?t=${Date.now()}`;

        // Aggiornamento URL nel database (salviamo l'URL con timestamp per invalidare la cache ovunque)
        await updateImmaginePiattoAction(piattoId, displayUrl, hubSlug);
      } catch (imgErr: any) {
        setErrorMsg(
          `Piatto salvato, ma errore upload immagine: ${imgErr.message}`,
        );
        return;
      }
    }

    // 3. Refresh ed esecuzione callback
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
                <UtensilsCrossed className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {initialData ? "Modifica Piatto" : "Nuovo Piatto"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gestisci dettagli, allergeni, prezzo e immagine.
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
            id="piatto-form"
            onSubmit={handleSubmit}
            className="p-6 space-y-4 overflow-y-auto flex-1"
          >
            {errorMsg && (
              <div className="p-3.5 text-xs bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 rounded-2xl font-medium">
                {errorMsg}
              </div>
            )}

            {/* Immagine Preview & Upload */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Immagine Piatto
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
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
                    className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950/60 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/60 cursor-pointer transition-all"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Verrà convertita in formato WebP automaticamente.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Titolo Piatto *
              </label>
              <input
                type="text"
                required
                maxLength={150}
                value={form.titolo}
                onChange={(e) => setForm({ ...form, titolo: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Nome del piatto..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Categoria
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={form.categoria}
                  onChange={(e) =>
                    setForm({ ...form, categoria: e.target.value })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Es. Antipasti, Primi..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ordine Visualizzazione
                </label>
                <input
                  type="number"
                  value={form.ordine}
                  onChange={(e) =>
                    setForm({ ...form, ordine: parseInt(e.target.value) || 0 })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Prezzi e IVA */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Prezzo (€)
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
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Aliquota IVA (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.aliquota_iva}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      aliquota_iva: parseFloat(e.target.value) || 10,
                    })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Descrizione
              </label>
              <textarea
                maxLength={1000}
                rows={2}
                value={form.descrizione}
                onChange={(e) =>
                  setForm({ ...form, descrizione: e.target.value })
                }
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ingredienti
              </label>
              <textarea
                maxLength={1000}
                rows={2}
                value={form.ingredienti}
                onChange={(e) =>
                  setForm({ ...form, ingredienti: e.target.value })
                }
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Elenco ingredienti..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Allergeni
              </label>
              <input
                type="text"
                maxLength={500}
                value={form.allergeni}
                onChange={(e) =>
                  setForm({ ...form, allergeni: e.target.value })
                }
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Es. Glutine, Latticini..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Note Interne
              </label>
              <textarea
                maxLength={500}
                rows={2}
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* Toggle Flags & Dietetici */}
            <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <input
                    type="checkbox"
                    checked={form.is_vegetariano}
                    onChange={(e) =>
                      setForm({ ...form, is_vegetariano: e.target.checked })
                    }
                    className="w-3.5 h-3.5 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Vegetariano
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <input
                    type="checkbox"
                    checked={form.is_vegano}
                    onChange={(e) =>
                      setForm({ ...form, is_vegano: e.target.checked })
                    }
                    className="w-3.5 h-3.5 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Vegano
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <input
                    type="checkbox"
                    checked={form.is_gluten_free}
                    onChange={(e) =>
                      setForm({ ...form, is_gluten_free: e.target.checked })
                    }
                    className="w-3.5 h-3.5 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                  />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Gluten Free
                  </span>
                </label>
              </div>

              <label className="flex justify-between items-center cursor-pointer select-none pt-2">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Piatto Disponibile
                </span>
                <input
                  type="checkbox"
                  checked={form.is_disponibile}
                  onChange={(e) =>
                    setForm({ ...form, is_disponibile: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                />
              </label>
              <label className="flex justify-between items-center cursor-pointer select-none">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Piatto Attivo
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
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Piatto Pubblico
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
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Prenotabile / Ordinabile in Prenotazioni
                </span>
                <input
                  type="checkbox"
                  checked={form.prenotabile}
                  onChange={(e) =>
                    setForm({ ...form, prenotabile: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                />
              </label>
              <label className="flex justify-between items-center cursor-pointer select-none">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
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
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              form="piatto-form"
              disabled={isPending}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              {isPending ? "Salvataggio..." : "Salva Piatto"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
