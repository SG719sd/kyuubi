'use client';

import { useState } from 'react';
import ServizioProfessionistaDrawer from './servizio-professionista-drawer';
import { User, SlidersHorizontal, Clock, Tag } from 'lucide-react';

export default function ServiziProfessionistiView({
  servizi,
  professionisti,
  personalizzazioni,
  hubId,
  hubSlug,
  isAdmin,
}: {
  servizi: any[];
  professionisti: any[];
  personalizzazioni: any[];
  hubId: string;
  hubSlug: string;
  isAdmin: boolean;
}) {
  const [selectedProfId, setSelectedProfId] = useState<number>(professionisti[0]?.id || 0);
  const [selectedServizio, setSelectedServizio] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const selectedProf = professionisti.find((p) => p.id === selectedProfId);

  const handleOpenEdit = (servizio: any) => {
    setSelectedServizio(servizio);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Tabs Professionisti */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 pl-3 pr-1 whitespace-nowrap">
          Seleziona Operatore:
        </span>
        {professionisti.map((prof) => (
          <button
            key={prof.id}
            onClick={() => setSelectedProfId(prof.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              selectedProfId === prof.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/80'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{prof.nome} {prof.cognome}</span>
          </button>
        ))}
      </div>

      {/* Grid Servizi del Professionista Selezionato */}
      {selectedProfId > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {servizi.map((servizio) => {
            const custom = personalizzazioni.find(
              (p) => p.id_professionista === selectedProfId && p.id_servizio === servizio.id
            );

            const isAbilitato = custom ? custom.is_active : true;
            const prezzoEffettivo = custom?.prezzo_personalizzato ?? servizio.prezzo;
            const durataEffettiva = custom?.tempo_minuti_personalizzato ?? servizio.tempo_minuti;

            const haPersonalizzazioni =
              (custom?.prezzo_personalizzato !== null && custom?.prezzo_personalizzato !== undefined) ||
              (custom?.tempo_minuti_personalizzato !== null && custom?.tempo_minuti_personalizzato !== undefined);

            return (
              <div
                key={servizio.id}
                className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 relative ${
                  !isAbilitato
                    ? 'opacity-50 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50'
                    : 'border-slate-200/80 dark:border-slate-800 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                      {servizio.categoria || 'Generale'}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate mt-0.5">
                      {servizio.titolo}
                    </h3>
                  </div>

                  {haPersonalizzazioni && (
                    <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60 shrink-0">
                      Personalizzato
                    </span>
                  )}
                </div>

                {/* Confronto Prezzi & Durate */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-medium flex items-center gap-1 mb-0.5">
                      <Tag className="w-3 h-3" /> Prezzo
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <strong className="text-slate-900 dark:text-white font-extrabold text-sm">
                        € {Number(prezzoEffettivo).toFixed(2)}
                      </strong>
                      {custom?.prezzo_personalizzato !== null && custom?.prezzo_personalizzato !== undefined && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through">
                          € {Number(servizio.prezzo).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-medium flex items-center gap-1 mb-0.5">
                      <Clock className="w-3 h-3" /> Durata
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <strong className="text-slate-900 dark:text-white font-extrabold text-sm">
                        {durataEffettiva} min
                      </strong>
                      {custom?.tempo_minuti_personalizzato !== null && custom?.tempo_minuti_personalizzato !== undefined && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through">
                          {servizio.tempo_minuti} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Card */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isAbilitato
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isAbilitato ? `Abilitato (${selectedProf?.nome})` : 'Disabilitato'}
                  </span>

                  {isAdmin && (
                    <button
                      onClick={() => handleOpenEdit({ ...servizio, custom })}
                      className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-all shadow-xs"
                    >
                      <SlidersHorizontal className="w-3 h-3" />
                      <span>Personalizza</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedServizio && (
        <ServizioProfessionistaDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          hubId={hubId}
          hubSlug={hubSlug}
          idProfessionista={selectedProfId}
          servizio={selectedServizio}
        />
      )}
    </div>
  );
}