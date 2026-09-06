'use client';

import { useState } from 'react';
import ServizioDrawer from './servizio-drawer';

export default function ServiziView({
  servizi,
  hubId,
  hubSlug,
  isAdmin,
}: {
  servizi: any[];
  hubId: string;
  hubSlug: string;
  isAdmin: boolean;
}) {
  const [search, setSearch] = useState('');
  const [selectedServizio, setSelectedServizio] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filtered = servizi.filter(
    (s) =>
      s.titolo.toLowerCase().includes(search.toLowerCase()) ||
      (s.categoria && s.categoria.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenCreate = () => {
    setSelectedServizio(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (servizio: any) => {
    setSelectedServizio(servizio);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar Gestionale */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Cerca per titolo o categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-400"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium px-1 shrink-0">
            Totale: <span className="text-slate-900 dark:text-white font-bold">{filtered.length}</span>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <span className="text-sm font-bold">+</span> Nuovo Servizio
          </button>
        )}
      </div>

      {/* Griglia Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((serv) => (
          <div
            key={serv.id}
            className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            {/* Tag in alto a destra */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              {serv.preferito && (
                <span className="text-amber-500 text-xs bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full font-medium" title="Preferito">
                  ★
                </span>
              )}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                serv.is_active 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {serv.is_active ? 'Attivo' : 'Disattivato'}
              </span>
            </div>

            {/* Info Principali */}
            <div className="flex items-start gap-3.5 pr-12">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 overflow-hidden flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 shrink-0 shadow-inner">
                {serv.immagine ? (
                  <img src={serv.immagine} alt={serv.titolo} className="w-full h-full object-cover" />
                ) : (
                  <span>🛠️</span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{serv.titolo}</h3>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                  {serv.categoria || 'Generale'} • {serv.tempo_minuti} min
                </p>
              </div>
            </div>

            {/* Prezzo e Dettagli */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Prezzo</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">€ {Number(serv.prezzo).toFixed(2)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Operatore</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">
                  {serv.richiede_operatore ? 'Richiesto' : 'Opzionale'}
                </strong>
              </div>
            </div>

            {/* Footer Card */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium truncate max-w-[180px]">
                {serv.note || 'Nessuna nota'}
              </span>

              {isAdmin && (
                <button
                  onClick={() => handleOpenEdit(serv)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all shadow-2xs cursor-pointer"
                >
                  Modifica
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs">
          <p className="text-sm text-slate-500 dark:text-slate-400">Nessun servizio trovato.</p>
        </div>
      )}

      <ServizioDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        hubId={hubId}
        hubSlug={hubSlug}
        initialData={selectedServizio}
      />
    </div>
  );
}