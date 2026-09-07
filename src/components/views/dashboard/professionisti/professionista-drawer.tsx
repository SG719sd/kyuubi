"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X, UserCheck, Image as ImageIcon, User } from "lucide-react";
import { compressAndConvertToWebP } from "@/lib/image-optimizer";
import { getHubStoragePath } from "@/types/storage-paths";
import {
  createProfessionistaAction,
  updateProfessionistaAction,
  updateImmagineProfessionistaAction,
} from "@/server/actions/professionisti.actions";
import { uploadMediaAction } from "@/server/actions/storage.actions";

const PRESET_COLORS = [
  "#3B82F6", // Blu
  "#10B981", // Verde
  "#F59E0B", // Giallo
  "#EF4444", // Rosso
  "#8B5CF6", // Viola
  "#EC4899", // Rosa
];

export default function ProfessionistaDrawer({
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
    id_user: "",
    nome: "",
    ruolo: "collaboratore",
    img_url: "",
    note: "",
    colore: "",
    admin: false,
    is_visible: true,
    is_active: true,
    preferito: false,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        id_user: initialData.id_user || "",
        nome: initialData.nome || "",
        ruolo: initialData.ruolo || "collaboratore",
        img_url: initialData.img_url || "",
        note: initialData.note || "",
        colore: initialData.colore || "",
        admin: Boolean(initialData.admin),
        is_visible: Boolean(initialData.is_visible),
        is_active: Boolean(initialData.is_active),
        preferito: Boolean(initialData.preferito),
      });
      setImagePreview(initialData.img_url || "");
    } else {
      setForm({
        id_user: "",
        nome: "",
        ruolo: "collaboratore",
        img_url: "",
        note: "",
        colore: "",
        admin: false,
        is_visible: true,
        is_active: true,
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

    const payload = {
      ...form,
      id_hub: hubId,
      img_url: form.img_url.trim() || null,
      note: form.note.trim() || null,
      colore: form.colore.trim() || null,
      red_flags: initialData?.red_flags ?? 0,
    };

    let profId = initialData?.id;

    // 1. Salvataggio / Aggiornamento dati base del professionista
    if (initialData) {
      const res = await updateProfessionistaAction(
        initialData.id,
        payload,
        hubSlug,
      );
      if (!res.success) {
        setErrorMsg(res.error);
        return;
      }
    } else {
      const res = await createProfessionistaAction(payload, hubSlug);
      if (!res.success) {
        setErrorMsg(res.error || "Errore creazione");
        return;
      }

      if ("data" in res && res.data) {
        profId = (res as { data: { id: number } }).data.id;
      } else {
        setErrorMsg("Errore creazione: dati non trovati");
        return;
      }
    }

    // 2. Elaborazione e Upload Foto Professionista via Server Action
    if (imageFile && profId) {
      try {
        const webpBlob = await compressAndConvertToWebP(
          imageFile,
          400,
          400,
          0.82,
        );
        const fileName = `prof_${profId}.webp`;
        const storagePath = getHubStoragePath.professionista(hubId, fileName);

        const formData = new FormData();
        formData.append("file", webpBlob, fileName);
        formData.append("storagePath", storagePath);

        const uploadRes = await uploadMediaAction(formData);
        if (!uploadRes.success || !uploadRes.url) {
          throw new Error(uploadRes.error || "Errore upload immagine");
        }

        const displayUrl = uploadRes.url;

        // Salva l'URL con il query string di cache busting
        await updateImmagineProfessionistaAction(profId, displayUrl, hubSlug);
      } catch (imgErr: any) {
        setErrorMsg(
          `Professionista salvato, ma errore upload immagine: ${imgErr.message}`,
        );
        return;
      }
    }

    // 3. Refresh e chiusura
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
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base tracking-tight flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {initialData
                  ? "Modifica Professionista"
                  : "Nuovo Professionista"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Compila i dettagli e le autorizzazioni del profilo.
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
            id="prof-form"
            onSubmit={handleSubmit}
            className="p-6 space-y-4 overflow-y-auto flex-1"
          >
            {errorMsg && (
              <div className="p-3.5 text-xs bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 rounded-2xl font-medium">
                {errorMsg}
              </div>
            )}

            {/* Avatar Preview & Upload */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Avatar Professionista
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-slate-400 dark:text-slate-600" />
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
                User UUID *
              </label>
              <input
                type="text"
                required
                disabled={Boolean(initialData)}
                value={form.id_user}
                onChange={(e) => setForm({ ...form, id_user: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 transition-all font-mono"
                placeholder="es. c56a4180-65aa..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Nome e Cognome *
              </label>
              <input
                type="text"
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                placeholder="Mario Rossi"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ruolo
              </label>
              <select
                value={form.ruolo}
                onChange={(e) => setForm({ ...form, ruolo: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="collaboratore">Collaboratore</option>
                <option value="Titolare">Titolare</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Selection Colore identificativo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Colore Identificativo
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  type="color"
                  value={form.colore || "#3B82F6"}
                  onChange={(e) => setForm({ ...form, colore: e.target.value })}
                  className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer bg-white dark:bg-slate-950 p-1 shrink-0"
                />
                <input
                  type="text"
                  value={form.colore}
                  onChange={(e) => setForm({ ...form, colore: e.target.value })}
                  placeholder="#3B82F6"
                  className="w-24 border border-slate-200 dark:border-slate-800 p-2 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                />
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {PRESET_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setForm({ ...form, colore: hex })}
                      className={`w-6 h-6 rounded-full border transition-transform shrink-0 ${
                        form.colore === hex
                          ? "scale-110 border-slate-900 dark:border-white shadow-xs"
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Note Interne
              </label>
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                rows={3}
                placeholder="Eventuali note interne..."
              />
            </div>

            {/* Toggle Flags */}
            <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
              <label className="flex justify-between items-center cursor-pointer select-none">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Ruolo Amministratore
                </span>
                <input
                  type="checkbox"
                  checked={form.admin}
                  onChange={(e) =>
                    setForm({ ...form, admin: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                />
              </label>
              <label className="flex justify-between items-center cursor-pointer select-none">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Visibile nel profilo
                </span>
                <input
                  type="checkbox"
                  checked={form.is_visible}
                  onChange={(e) =>
                    setForm({ ...form, is_visible: e.target.checked })
                  }
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                />
              </label>
              <label className="flex justify-between items-center cursor-pointer select-none">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Utente Attivo
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
                  Segna come Preferito
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
              form="prof-form"
              disabled={isPending}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              {isPending ? "Salvataggio..." : "Salva Modifiche"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
