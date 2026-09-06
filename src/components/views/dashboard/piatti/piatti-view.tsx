'use client';

import { useState } from 'react';
import PiattoDrawer from './piatto-drawer';

export default function PiattiView({
  piatti,
  hubId,
  hubSlug,
  isAdmin,
}: {
  piatti: any[];
  hubId: string;
  hubSlug: string;
  isAdmin: boolean;
}) {
  const [search, setSearch] = useState('');
  const [selectedPiatto, setSelectedPiatto] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filtered = piatti.filter(
    (p) =>
      p.titolo.toLowerCase().includes(search.toLowerCase()) ||
      (p.categoria && p.categoria.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpenCreate = () => {
    setSelectedPiatto(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (piatto: any) => {
    setSelectedPiatto(piatto);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar Gestionale (identica a ProfessionistiView) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Cerca per titolo o categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
            <span className="text-sm font-bold">+</span> Nuovo Piatto
          </button>
        )}
      </div>

      {/* Griglia Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((piatto) => (
          <div
            key={piatto.id}
            className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
          >
            {/* Tag in alto a destra */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              {piatto.preferito && (
                <span className="text-amber-500 text-xs bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full font-medium" title="Preferito">
                  ★
                </span>
              )}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                piatto.is_disponibile 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' 
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
              }`}>
                {piatto.is_disponibile ? 'Disponibile' : 'Esaurito'}
              </span>
            </div>

            {/* Info Principali */}
            <div className="flex items-start gap-3.5 pr-16">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 overflow-hidden flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 shrink-0 shadow-inner">
                {piatto.immagine ? (
                  <img src={piatto.immagine} alt={piatto.titolo} className="w-full h-full object-cover" />
                ) : (
                  <span>🍽️</span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">{piatto.titolo}</h3>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                  {piatto.categoria || 'Generale'}
                </p>
              </div>
            </div>

            {/* Badge dietetici */}
            <div className="flex flex-wrap gap-1">
              {piatto.is_vegetariano && (
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                  Vegetariano
                </span>
              )}
              {piatto.is_vegano && (
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                  Vegano
                </span>
              )}
              {piatto.is_gluten_free && (
                <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-medium px-2 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900/40">
                  Gluten Free
                </span>
              )}
            </div>

            {/* Prezzo */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400 text-[10px] font-semibold uppercase">Prezzo Piatto</span>
              <strong className="text-slate-900 dark:text-white font-bold text-sm">€ {Number(piatto.prezzo).toFixed(2)}</strong>
            </div>

            {/* Footer Card */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium truncate max-w-[180px]">
                {piatto.descrizione || 'Nessuna descrizione'}
              </span>

              {isAdmin && (
                <button
                  onClick={() => handleOpenEdit(piatto)}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-all shadow-2xs"
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
          <p className="text-sm text-slate-500 dark:text-slate-400">Nessun piatto trovato.</p>
        </div>
      )}

      <PiattoDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        hubId={hubId}
        hubSlug={hubSlug}
        initialData={selectedPiatto}
      />
    </div>
  );
}