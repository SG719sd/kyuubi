"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, Package, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { compressAndConvertToWebP } from "@/lib/image-optimizer";
import { getHubStoragePath } from "@/types/storage-paths";
import {
  createProdottoAction,
  updateProdottoAction,
  updateImmagineProdottoAction,
} from "@/server/actions/prodotti.actions";

export default function ProdottoDrawer({
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
    sku: "",
    codice_a_barre: "",
    azienda_produttrice: "",
    brand: "",
    categoria: "",
    titolo: "",
    descrizione: "",
    immagine: "",
    prezzo_nuovo: 0,
    prezzo_usato: 0,
    prezzo_fornitore: 0,
    prezzo_listino: 0,
    aliquota_iva: 22,
    ordine: 0,
    quantita_nuovo: 0,
    quantita_usato: 0,
    quantita_alert: 10,
    posizione_magazzino: "",
    tempo_minuti: 0,
    pubblico: true,
    prenotabile: false,
    is_active: true,
    note: "",
    preferito: false,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        sku: initialData.sku || "",
        codice_a_barre: initialData.codice_a_barre || "",
        azienda_produttrice: initialData.azienda_produttrice || "",
        brand: initialData.brand || "",
        categoria: initialData.categoria || "",
        titolo: initialData.titolo || "",
        descrizione: initialData.descrizione || "",
        immagine: initialData.immagine || "",
        prezzo_nuovo: initialData.prezzo_nuovo ?? 0,
        prezzo_usato: initialData.prezzo_usato ?? 0,
        prezzo_fornitore: initialData.prezzo_fornitore ?? 0,
        prezzo_listino: initialData.prezzo_listino ?? 0,
        aliquota_iva: initialData.aliquota_iva ?? 22,
        ordine: initialData.ordine ?? 0,
        quantita_nuovo: initialData.quantita_nuovo ?? 0,
        quantita_usato: initialData.quantita_usato ?? 0,
        quantita_alert: initialData.quantita_alert ?? 10,
        posizione_magazzino: initialData.posizione_magazzino || "",
        tempo_minuti: initialData.tempo_minuti ?? 0,
        pubblico: initialData.pubblico !== undefined ? Boolean(initialData.pubblico) : true,
        prenotabile: initialData.prenotabile !== undefined ? Boolean(initialData.prenotabile) : false,
        is_active: Boolean(initialData.is_active),
        note: initialData.note || "",
        preferito: Boolean(initialData.preferito),
      });
      setImagePreview(initialData.immagine || "");
    } else {
      setForm({
        sku: "",
        codice_a_barre: "",
        azienda_produttrice: "",
        brand: "",
        categoria: "",
        titolo: "",
        descrizione: "",
        immagine: "",
        prezzo_nuovo: 0,
        prezzo_usato: 0,
        prezzo_fornitore: 0,
        prezzo_listino: 0,
        aliquota_iva: 22,
        ordine: 0,
        quantita_nuovo: 0,
        quantita_usato: 0,
        quantita_alert: 10,
        posizione_magazzino: "",
        tempo_minuti: 0,
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
      sku: form.sku.trim() || null,
      codice_a_barre: form.codice_a_barre.trim() || null,
      azienda_produttrice: form.azienda_produttrice.trim() || null,
      brand: form.brand.trim() || null,
      categoria: form.categoria.trim() || null,
      descrizione: form.descrizione.trim() || null,
      immagine: form.immagine.trim() || null,
      posizione_magazzino: form.posizione_magazzino.trim() || null,
      note: form.note.trim() || null,
    };

    let prodottoId = initialData?.id;

    // 1. Salvataggio / Aggiornamento dati base del prodotto
    if (initialData) {
      const res = await updateProdottoAction(initialData.id, payload, hubSlug);
      if (!res.success) {
        setErrorMsg(res.error);
        return;
      }
    } else {
      const res = await createProdottoAction(payload, hubSlug);
      if (!res.success) {
        setErrorMsg(res.error || "Errore creazione");
        return;
      }

      if ("data" in res && res.data) {
        prodottoId = (res as { data: { id: number } }).data.id;
      } else {
        setErrorMsg("Errore creazione: dati non trovati");
        return;
      }
    }

    // 2. Elaborazione e Upload Immagine Prodotto
    if (imageFile && prodottoId) {
      try {
        const webpBlob = await compressAndConvertToWebP(
          imageFile,
          800,
          800,
          0.82,
        );
        const fileName = `${prodottoId}.webp`;
        const storagePath = getHubStoragePath.prodotto(hubId, fileName);

        // Upload con bypass della cache di Supabase (cacheControl: '0')
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
        // Timestamp per forzare l'aggiornamento istantaneo dell'immagine nel browser
        const displayUrl = `${basePublicUrl}?t=${Date.now()}`;

        // Aggiornamento database con l'URL provvisto di query string per il cache busting
        await updateImmagineProdottoAction(prodottoId, displayUrl, hubSlug);
      } catch (imgErr: any) {
        setErrorMsg(
          `Prodotto salvato, ma errore upload immagine: ${imgErr.message}`,
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
                <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {initialData ? "Modifica Prodotto" : "Nuovo Prodotto"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gestisci dettagli, prezzi, scorte e immagine.
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
            id="prodotto-form"
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
                Immagine Prodotto
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
                Titolo Prodotto *
              </label>
              <input
                type="text"
                required
                maxLength={150}
                value={form.titolo}
                onChange={(e) => setForm({ ...form, titolo: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Nome del prodotto..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  SKU
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="SKU-001"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Codice a Barre
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={form.codice_a_barre}
                  onChange={(e) =>
                    setForm({ ...form, codice_a_barre: e.target.value })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="EAN/Barcode"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Brand
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
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
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Azienda Prod.
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={form.azienda_produttrice}
                  onChange={(e) =>
                    setForm({ ...form, azienda_produttrice: e.target.value })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Prezzi */}
            <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Prezzo Nuovo (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.prezzo_nuovo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      prezzo_nuovo: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Prezzo Usato (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.prezzo_usato}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      prezzo_usato: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Fornitore (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.prezzo_fornitore}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      prezzo_fornitore: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Listino (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.prezzo_listino}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      prezzo_listino: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Magazzino */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Q.tà Nuovo
                </label>
                <input
                  type="number"
                  value={form.quantita_nuovo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      quantita_nuovo: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Q.tà Usato
                </label>
                <input
                  type="number"
                  value={form.quantita_usato}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      quantita_usato: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Alert Scorta
                </label>
                <input
                  type="number"
                  value={form.quantita_alert}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      quantita_alert: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Posizione Magazzino
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={form.posizione_magazzino}
                  onChange={(e) =>
                    setForm({ ...form, posizione_magazzino: e.target.value })
                  }
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Scaffale A3..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Descrizione
              </label>
              <textarea
                maxLength={1000}
                rows={3}
                value={form.descrizione}
                onChange={(e) =>
                  setForm({ ...form, descrizione: e.target.value })
                }
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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

            {/* Toggle Flags */}
            <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
              <label className="flex justify-between items-center cursor-pointer select-none">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Prodotto Attivo
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
                  Prodotto Pubblico
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
                  Prenotabile in Agenda / Ordini
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
              form="prodotto-form"
              disabled={isPending}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              {isPending ? "Salvataggio..." : "Salva Prodotto"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
