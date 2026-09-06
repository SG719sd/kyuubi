'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Clock, Trash2, Plus } from 'lucide-react';
import {
  createOrarioAction,
  updateOrarioAction,
  deleteOrarioAction,
} from '@/server/actions/orari.actions';

const GIORNI = [
  { val: 1, label: 'Lunedì' },
  { val: 2, label: 'Martedì' },
  { val: 3, label: 'Mercoledì' },
  { val: 4, label: 'Giovedì' },
  { val: 5, label: 'Venerdì' },
  { val: 6, label: 'Sabato' },
  { val: 0, label: 'Domenica' },
];

export default function OrarioDrawer({
  isOpen,
  onClose,
  hubId,
  hubSlug,
  idProfessionista,
  defaultGiorno,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  hubId: string;
  hubSlug: string;
  idProfessionista?: number | null;
  defaultGiorno?: number;
  initialData?: any;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    giorno_settimana: 1,
    is_chiuso: false,
    ora_inizio_1: '09:00',
    ora_fine_1: '13:00',
    ora_inizio_2: '',
    ora_fine_2: '',
  });

  // Gestione visibilità secondo orario (se ci sono già dati li mostra subito)
  const [showFascia2, setShowFascia2] = useState(false);

  useEffect(() => {
    if (initialData) {
      const hasFascia2 = Boolean(initialData.ora_inizio_2 || initialData.ora_fine_2);
      setForm({
        giorno_settimana: initialData.giorno_settimana ?? 1,
        is_chiuso: Boolean(initialData.is_chiuso),
        ora_inizio_1: initialData.ora_inizio_1?.slice(0, 5) || '',
        ora_fine_1: initialData.ora_fine_1?.slice(0, 5) || '',
        ora_inizio_2: initialData.ora_inizio_2?.slice(0, 5) || '',
        ora_fine_2: initialData.ora_fine_2?.slice(0, 5) || '',
      });
      setShowFascia2(hasFascia2);
    } else {
      setForm({
        giorno_settimana: defaultGiorno ?? 1,
        is_chiuso: false,
        ora_inizio_1: '09:00',
        ora_fine_1: '13:00',
        ora_inizio_2: '',
        ora_fine_2: '',
      });
      setShowFascia2(false);
    }
    setErrorMsg(null);
  }, [initialData, defaultGiorno, isOpen]);

  if (!isOpen) return null;

  const handleResetFascia2 = () => {
    setForm((prev) => ({ ...prev, ora_inizio_2: '', ora_fine_2: '' }));
    setShowFascia2(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const payload = {
      id_hub: hubId,
      id_professionista: idProfessionista ?? null,
      giorno_settimana: Number(form.giorno_settimana),
      is_chiuso: form.is_chiuso,
      ora_inizio_1: form.is_chiuso ? null : form.ora_inizio_1 || null,
      ora_fine_1: form.is_chiuso ? null : form.ora_fine_1 || null,
      ora_inizio_2: form.is_chiuso || !showFascia2 ? null : form.ora_inizio_2 || null,
      ora_fine_2: form.is_chiuso || !showFascia2 ? null : form.ora_fine_2 || null,
    };

    let res;
    if (initialData) {
      res = await updateOrarioAction(initialData.id, payload, hubSlug);
    } else {
      res = await createOrarioAction(payload, hubSlug);
    }

    if (!res.success) {
      setErrorMsg(res.error || 'Errore durante il salvataggio');
      return;
    }

    startTransition(() => {
      router.refresh();
      onClose();
    });
  };

  const handleDelete = async () => {
    if (!initialData || !confirm('Vuoi davvero eliminare questo orario?')) return;
    setErrorMsg(null);

    const res = await deleteOrarioAction(initialData.id, hubSlug);
    if (!res.success) {
      setErrorMsg(res.error || 'Errore durante l\'eliminazione');
      return;
    }

    startTransition(() => {
      router.refresh();
      onClose();
    });
  };

  const giornoSelezionatoLabel = GIORNI.find((g) => g.val === Number(form.giorno_settimana))?.label || '';

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
                <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {initialData ? `Modifica Orario - ${giornoSelezionatoLabel}` : `Configura Orario - ${giornoSelezionatoLabel}`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {idProfessionista ? 'Orario specifico del professionista' : 'Orario di apertura generale dell\'Hub'}
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
          <form id="orario-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
            {errorMsg && (
              <div className="p-3.5 text-xs bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 rounded-2xl font-medium">
                {errorMsg}
              </div>
            )}

            {/* Checkbox Chiuso */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
              <label className="flex justify-between items-center cursor-pointer select-none">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Giorno di Chiusura</span>
                <input
                  type="checkbox"
                  checked={form.is_chiuso}
                  onChange={(e) => setForm({ ...form, is_chiuso: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                />
              </label>
            </div>

            {/* Fasce Orarie */}
            {!form.is_chiuso && (
              <div className="space-y-4 pt-1">
                {/* Fascia 1 */}
                <div className="p-4 border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl space-y-3">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Fascia 1 (Mattina / Giornata) *
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Dalle</label>
                      <input
                        type="time"
                        required={!form.is_chiuso}
                        value={form.ora_inizio_1}
                        onChange={(e) => setForm({ ...form, ora_inizio_1: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Alle</label>
                      <input
                        type="time"
                        required={!form.is_chiuso}
                        value={form.ora_fine_1}
                        onChange={(e) => setForm({ ...form, ora_fine_1: e.target.value })}
                        className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Fascia 2 o Bottone per aggiungerla */}
                {showFascia2 ? (
                  <div className="p-4 border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Fascia 2 (Pomeriggio)
                      </span>
                      <button
                        type="button"
                        onClick={handleResetFascia2}
                        className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Rimuovi fascia
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Dalle</label>
                        <input
                          type="time"
                          value={form.ora_inizio_2}
                          onChange={(e) => setForm({ ...form, ora_inizio_2: e.target.value })}
                          className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">Alle</label>
                        <input
                          type="time"
                          value={form.ora_fine_2}
                          onChange={(e) => setForm({ ...form, ora_fine_2: e.target.value })}
                          className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowFascia2(true)}
                    className="w-full py-3 border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-1.5 transition-all bg-slate-50/50 dark:bg-slate-950/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Aggiungi Seconda Fascia Oraria
                  </button>
                )}
              </div>
            )}
          </form>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
            {initialData ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Elimina</span>
              </button>
            ) : <div />}

            <div className="flex gap-2.5">
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
                form="orario-form"
                disabled={isPending}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
              >
                {isPending ? 'Salvataggio...' : 'Salva Orario'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}