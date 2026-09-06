'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, UserCheck, RotateCcw } from 'lucide-react';
import {
  saveProfessionistaServizioAction,
  deleteProfessionistaServizioAction,
} from '@/server/actions/professionisti-servizi.actions';

export default function ServizioProfessionistaDrawer({
  isOpen,
  onClose,
  hubId,
  hubSlug,
  idProfessionista,
  servizio,
}: {
  isOpen: boolean;
  onClose: () => void;
  hubId: string;
  hubSlug: string;
  idProfessionista: number;
  servizio: any;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const custom = servizio?.custom;

  const [useCustomPrezzo, setUseCustomPrezzo] = useState(false);
  const [prezzoCustom, setPrezzoCustom] = useState<number>(0);

  const [useCustomTempo, setUseCustomTempo] = useState(false);
  const [tempoCustom, setTempoCustom] = useState<number>(0);

  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (servizio) {
      const c = servizio.custom;
      const hasPrezzo = c?.prezzo_personalizzato !== null && c?.prezzo_personalizzato !== undefined;
      const hasTempo = c?.tempo_minuti_personalizzato !== null && c?.tempo_minuti_personalizzato !== undefined;

      setUseCustomPrezzo(hasPrezzo);
      setPrezzoCustom(hasPrezzo ? c.prezzo_personalizzato : servizio.prezzo);

      setUseCustomTempo(hasTempo);
      setTempoCustom(hasTempo ? c.tempo_minuti_personalizzato : servizio.tempo_minuti);

      setIsActive(c ? Boolean(c.is_active) : true);
    }
    setErrorMsg(null);
  }, [servizio, isOpen]);

  if (!isOpen || !servizio) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const payload = {
      id_hub: hubId,
      id_professionista: idProfessionista,
      id_servizio: servizio.id,
      prezzo_personalizzato: useCustomPrezzo ? Number(prezzoCustom) : null,
      tempo_minuti_personalizzato: useCustomTempo ? Number(tempoCustom) : null,
      is_active: isActive,
    };

    const res = await saveProfessionistaServizioAction(payload, hubSlug);

    if (!res.success) {
      setErrorMsg(res.error || 'Errore durante il salvataggio');
      return;
    }

    startTransition(() => {
      router.refresh();
      onClose();
    });
  };

  const handleReset = async () => {
    if (!custom?.id || !confirm('Vuoi ripristinare le impostazioni predefinite del servizio per questo professionista?')) return;

    const res = await deleteProfessionistaServizioAction(custom.id, hubSlug);
    if (!res.success) {
      setErrorMsg(res.error || 'Errore durante il ripristino');
      return;
    }

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
                Personalizza {servizio.titolo}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Override tariffe e tempistiche per lo staff
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form id="prof-servizio-form" onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 rounded-2xl font-medium">
                {errorMsg}
              </div>
            )}

            {/* Status Abilitato */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <label className="flex justify-between items-center cursor-pointer select-none">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Servizio erogato da questo professionista
                </span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                />
              </label>
            </div>

            {/* Custom Prezzo */}
            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Prezzo Personalizzato</span>
                <input
                  type="checkbox"
                  checked={useCustomPrezzo}
                  onChange={(e) => setUseCustomPrezzo(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                />
              </label>

              {useCustomPrezzo ? (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">€</span>
                  <input
                    type="number"
                    step="0.01"
                    value={prezzoCustom}
                    onChange={(e) => setPrezzoCustom(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                  Usa prezzo standard Hub (€ {Number(servizio.prezzo).toFixed(2)})
                </p>
              )}
            </div>

            {/* Custom Durata */}
            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Durata Personalizzata</span>
                <input
                  type="checkbox"
                  checked={useCustomTempo}
                  onChange={(e) => setUseCustomTempo(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                />
              </label>

              {useCustomTempo ? (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    value={tempoCustom}
                    onChange={(e) => setTempoCustom(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                  <span className="text-slate-500 dark:text-slate-400 font-medium">minuti</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                  Usa durata standard Hub ({servizio.tempo_minuti} min)
                </p>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
            {custom ? (
              <button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl font-semibold transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Ripristina Default
              </button>
            ) : <div />}

            <div className="flex gap-2.5">
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
                form="prof-servizio-form"
                disabled={isPending}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xs transition-all disabled:opacity-50"
              >
                {isPending ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}