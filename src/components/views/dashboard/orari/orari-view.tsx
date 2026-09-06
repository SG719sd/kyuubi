'use client';

import { useState } from 'react';
import OrarioDrawer from './orari-drawer';
import { Building2, User, Clock, Plus, Edit2 } from 'lucide-react';

const GIORNI_SETTIMANA = [
  'Domenica',
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
];

export default function OrariView({
  orari,
  professionisti,
  hubId,
  hubSlug,
  isAdmin,
}: {
  orari: any[];
  professionisti: any[];
  hubId: string;
  hubSlug: string;
  isAdmin: boolean;
}) {
  // null = Orari generali dell'Hub, altrimenti ID del professionista
  const [selectedProfId, setSelectedProfId] = useState<number | null>(null);
  const [selectedOrario, setSelectedOrario] = useState<any | null>(null);
  const [selectedGiorno, setSelectedGiorno] = useState<number | undefined>(undefined);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Filtriamo gli orari per l'entità attualmente selezionata
  const filteredOrari = orari.filter((o) =>
    selectedProfId === null
      ? o.id_professionista === null
      : o.id_professionista === selectedProfId
  );

  const handleOpenCreate = (giornoIdx?: number) => {
    setSelectedOrario(null);
    setSelectedGiorno(giornoIdx);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (orario: any) => {
    setSelectedOrario(orario);
    setSelectedGiorno(orario.giorno_settimana);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Selettore Contesto: Hub vs Professionisti */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <button
          onClick={() => setSelectedProfId(null)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            selectedProfId === null
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700/80'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Orario Generale Hub</span>
        </button>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">Staff:</span>
          {professionisti.map((prof) => (
            <button
              key={prof.id}
              onClick={() => setSelectedProfId(prof.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
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
      </div>

      {/* Griglia Settimanale */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 0].map((giornoIdx) => {
          const item = filteredOrari.find((o) => o.giorno_settimana === giornoIdx);

          return (
            <div
              key={giornoIdx}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between space-y-4 ${
                item?.is_chiuso
                  ? 'border-rose-200/60 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10'
                  : 'border-slate-200/80 dark:border-slate-800 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{GIORNI_SETTIMANA[giornoIdx]}</h3>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    item
                      ? item.is_chiuso
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item ? (item.is_chiuso ? 'Chiuso' : 'Aperto') : 'Non impostato'}
                </span>
              </div>

              {/* Dettaglio Fasce Orarie */}
              <div className="space-y-2 py-1">
                {item && !item.is_chiuso ? (
                  <>
                    <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs flex justify-between items-center">
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Turno 1
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {item.ora_inizio_1?.slice(0, 5)} - {item.ora_fine_1?.slice(0, 5)}
                      </span>
                    </div>

                    {item.ora_inizio_2 && item.ora_fine_2 && (
                      <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs flex justify-between items-center">
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Turno 2
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {item.ora_inizio_2?.slice(0, 5)} - {item.ora_fine_2?.slice(0, 5)}
                        </span>
                      </div>
                    )}
                  </>
                ) : item?.is_chiuso ? (
                  <p className="text-xs text-rose-500 dark:text-rose-400 font-medium italic">Nessun orario previsto</p>
                ) : (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">Clicca per definire l'orario</p>
                )}
              </div>

              {/* Bottone Azione */}
              {isAdmin && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  {item ? (
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-all"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Modifica</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenCreate(giornoIdx)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl font-semibold text-xs transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Configura</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <OrarioDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        hubId={hubId}
        hubSlug={hubSlug}
        idProfessionista={selectedProfId}
        defaultGiorno={selectedGiorno}
        initialData={selectedOrario}
      />
    </div>
  );
}