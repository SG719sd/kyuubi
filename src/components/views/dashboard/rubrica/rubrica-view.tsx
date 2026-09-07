'use client';

import { useState } from 'react';
import { Plus, Search, Phone, Mail, MapPin, User, Edit3, Trash2 } from 'lucide-react';
import RubricaDrawer from './rubrica-drawer';
import { deleteRubricaAction } from '@/server/actions/rubrica.actions';

export default function RubricaView({
  contatti,
  hubId,
  hubSlug,
  isAdmin,
}: {
  contatti: any[];
  hubId: string;
  hubSlug: string;
  isAdmin: boolean;
}) {
  const [search, setSearch] = useState('');
  const [selectedContatto, setSelectedContatto] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredContatti = contatti.filter((c) => {
    const term = search.toLowerCase();
    const nomeCompleto = `${c.nome} ${c.cognome || ''}`.toLowerCase();
    const tel = (c.telefono || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    return nomeCompleto.includes(term) || tel.includes(term) || email.includes(term);
  });

  const handleOpenCreate = () => {
    setSelectedContatto(null);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (contatto: any) => {
    setSelectedContatto(contatto);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Sei sicuro di voler eliminare "${nome}" dalla rubrica?`)) return;
    await deleteRubricaAction(id, hubSlug);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar Gestionale (Allineata con gli altri moduli) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per nome, cognome o telefono..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-400"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium px-1 shrink-0">
            Totale: <span className="text-slate-900 dark:text-white font-bold">{filteredContatti.length}</span>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuovo Contatto</span>
          </button>
        )}
      </div>

      {/* Griglia Contatti */}
      {filteredContatti.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-12 text-center shadow-xs">
          <User className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nessun contatto trovato</p>
          <p className="text-xs text-slate-400 mt-1">Aggiungi nuovi contatti o modifica la ricerca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContatti.map((contatto) => (
            <div
              key={contatto.id}
              className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                      {contatto.nome[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {contatto.nome} {contatto.cognome || ''}
                      </h3>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {contatto.id_user && (
                          <span
                            className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-md flex items-center gap-1"
                            title={`Account utente collegato: ${contatto.id_user}`}
                          >
                            <User className="w-2.5 h-2.5" /> Utente collegato
                          </span>
                        )}
                        {!contatto.is_active && (
                          <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
                            Inattivo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  {contatto.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <a href={`tel:${contatto.telefono}`} className="hover:underline truncate text-slate-700 dark:text-slate-300">
                        {contatto.telefono}
                      </a>
                    </div>
                  )}

                  {contatto.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <a href={`mailto:${contatto.email}`} className="hover:underline truncate text-slate-700 dark:text-slate-300">
                        {contatto.email}
                      </a>
                    </div>
                  )}

                  {contatto.indirizzo && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate text-slate-700 dark:text-slate-300">{contatto.indirizzo}</span>
                    </div>
                  )}

                  {contatto.note && (
                    <p className="text-[11px] bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 italic">
                      "{contatto.note}"
                    </p>
                  )}
                </div>
              </div>

              {isAdmin && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(contatto)}
                    className="p-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                    title="Modifica"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(contatto.id, `${contatto.nome} ${contatto.cognome || ''}`)}
                    className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
                    title="Elimina"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drawer Form */}
      <RubricaDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        hubId={hubId}
        hubSlug={hubSlug}
        contatto={selectedContatto}
      />
    </div>
  );
}