'use client';

import { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Clock,
  User,
  Search,
  Plus,
  ChevronRight,
  Phone,
  Calendar as CalendarIcon,
  LayoutGrid,
  List,
  CalendarRange,
  Lock,
  Package,
} from 'lucide-react';
import CarrelloDrawer from './carrello-drawer';
import AgendaCarrelli from './agenda-carrelli';
import { PrenotazioneWithDetails } from '@/server/repositories/prenotazioni.repository';
import { cambioStatoPrenotazioneAction } from '@/server/actions/prenotazioni.actions';

interface Props {
  prenotazioni: PrenotazioneWithDetails[];
  professionisti: any[];
  professionistiServizi?: any[];
  clienti: any[];
  servizi: any[];
  prodotti: any[];
  piatti: any[];
  hubId: string;
  hubSlug: string;
  isAdmin: boolean;
}

export default function CarrelliView({
  prenotazioni: initialPrenotazioni,
  professionisti,
  professionistiServizi = [],
  clienti,
  servizi,
  prodotti,
  piatti,
  hubId,
  hubSlug,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [carrelliList, setCarrelliList] = useState(initialPrenotazioni);

  useEffect(() => {
    setCarrelliList(initialPrenotazioni);
  }, [initialPrenotazioni]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('tutti');
  const [staffFilter, setStaffFilter] = useState<string>('tutti');
  const [dateQuickFilter, setDateQuickFilter] = useState<'tutte' | 'oggi' | 'prossimi' | 'passati'>('tutte');
  const [viewMode, setViewMode] = useState<'elenco' | 'timeline' | 'agenda'>('elenco');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCarrello, setSelectedCarrello] = useState<PrenotazioneWithDetails | null>(null);
  const [initialSlot, setInitialSlot] = useState<{
    date?: string;
    time?: string;
    staffId?: number | null;
  }>({});

  // Status badge config per ordini e carrelli
  const getStatusBadge = (stato: string) => {
    switch (stato) {
      case 'confermata':
        return {
          label: 'In Allestimento',
          className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          dot: 'bg-amber-500',
        };
      case 'completata':
        return {
          label: 'Consegnato / Ritirato',
          className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          dot: 'bg-emerald-500',
        };
      case 'cancellata':
        return {
          label: 'Annullato',
          className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          dot: 'bg-rose-500',
        };
      default: // pending
        return {
          label: 'In Attesa / Da Confermare',
          className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          dot: 'bg-blue-500',
        };
    }
  };

  const getProductTitle = useCallback(
    (idItem: number) => {
      return prodotti?.find((pr) => pr.id === idItem)?.titolo || `Prodotto #${idItem}`;
    },
    [prodotti]
  );

  const handleQuickStatusChange = (id: number, nextStato: string) => {
    if (!isAdmin) return;
    setCarrelliList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stato: nextStato as any } : p))
    );
    startTransition(async () => {
      const res = await cambioStatoPrenotazioneAction(id, hubId, nextStato, hubSlug);
      if (res.success) {
        router.refresh();
      } else {
        setCarrelliList(initialPrenotazioni);
      }
    });
  };

  // Filtra solo le prenotazioni che contengono prodotti (Carrelli)
  const filteredCarrelli = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    return carrelliList.filter((p) => {
      // Deve avere almeno un prodotto oppure essere registrata come ordine carrello
      const hasProducts = p.items?.some((i) => i.tipo === 'prodotto');
      if (!hasProducts && p.ordini !== true) return false;

      // 1. Text search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = p.titolo?.toLowerCase().includes(query);
        const matchesClient =
          p.rubrica?.nome?.toLowerCase().includes(query) ||
          p.rubrica?.cognome?.toLowerCase().includes(query) ||
          p.rubrica?.telefono?.includes(query);
        const matchesProduct = p.items?.some((i) => {
          const prodTitle = getProductTitle(i.id_item);
          return prodTitle.toLowerCase().includes(query) || (i.note && i.note.toLowerCase().includes(query));
        });
        const matchesNotes = p.note?.toLowerCase().includes(query);

        if (!matchesTitle && !matchesClient && !matchesProduct && !matchesNotes) {
          return false;
        }
      }

      // 2. Status Filter
      if (statusFilter !== 'tutti' && p.stato !== statusFilter) {
        return false;
      }

      // 3. Staff Filter
      if (staffFilter !== 'tutti') {
        if (p.id_professionista !== Number(staffFilter)) return false;
      }

      // 4. Quick Date Filter
      if (p.tms_inizio) {
        const pDateStr = new Date(p.tms_inizio).toISOString().slice(0, 10);
        if (dateQuickFilter === 'oggi' && pDateStr !== todayStr) return false;
        if (dateQuickFilter === 'prossimi' && pDateStr < todayStr) return false;
        if (dateQuickFilter === 'passati' && pDateStr >= todayStr) return false;
      }

      return true;
    });
  }, [carrelliList, search, statusFilter, staffFilter, dateQuickFilter, getProductTitle]);

  // Group by date for timeline
  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: PrenotazioneWithDetails[] } = {};
    for (const item of filteredCarrelli) {
      const dStr = item.tms_inizio ? new Date(item.tms_inizio).toISOString().slice(0, 10) : 'Senza data';
      if (!groups[dStr]) groups[dStr] = [];
      groups[dStr].push(item);
    }
    return groups;
  }, [filteredCarrelli]);

  const handleOpenCreate = () => {
    setSelectedCarrello(null);
    setInitialSlot({
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (p: PrenotazioneWithDetails) => {
    setSelectedCarrello(p);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Switcher Modalità di Vista & Nuovo Carrello */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setViewMode('elenco')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              viewMode === 'elenco'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Elenco Ordini</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              viewMode === 'timeline'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Per Data</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('agenda')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              viewMode === 'agenda'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Agenda Ritiri</span>
          </button>
        </div>

        <div className="flex items-center gap-2 justify-end">
          {isAdmin ? (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Carrello</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Sola Lettura</span>
            </div>
          )}
        </div>
      </div>

      {/* AGENDA CARRELLI SE ATTIVA */}
      {viewMode === 'agenda' && (
        <AgendaCarrelli
          prenotazioni={filteredCarrelli}
          professionisti={professionisti}
          clienti={clienti}
          servizi={servizi}
          prodotti={prodotti}
          piatti={piatti}
          hubId={hubId}
          hubSlug={hubSlug}
          isAdmin={isAdmin}
          onSelectSlot={(slot) => {
            setSelectedCarrello(null);
            setInitialSlot({
              date: slot.date,
              time: slot.time,
              staffId: slot.staffId,
            });
            setIsDrawerOpen(true);
          }}
          onEditPrenotazione={handleOpenEdit}
        />
      )}

      {/* FILTRI TOOLBAR PER VISTE ELENCO E TIMELINE */}
      {viewMode !== 'agenda' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Ricerca */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cerca carrello per cliente, articolo, riferimento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Filtri rapidi per data */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['tutte', 'oggi', 'prossimi', 'passati'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDateQuickFilter(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer ${
                    dateQuickFilter === tab
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab === 'tutte' ? 'Tutte le date' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Select Dropdowns: Stato e Addetto Vendita */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="tutti">Tutti gli stati</option>
                <option value="pending">⏳ In attesa / Da confermare</option>
                <option value="confermata">📦 In allestimento</option>
                <option value="completata">🎉 Consegnato / Ritirato</option>
                <option value="cancellata">❌ Annullato</option>
              </select>

              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
              >
                <option value="tutti">Tutti gli addetti cassa</option>
                {professionisti.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 1: TABELLA / CARD ELENCO CARRELLI */}
      {viewMode === 'elenco' && (
        <div className="space-y-3">
          {filteredCarrelli.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-500 mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Nessun carrello o ordine trovato
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Non sono presenti ordini attivi con i filtri selezionati. Registra un nuovo carrello prodotti al banco.
              </p>
            </div>
          ) : (
            filteredCarrelli.map((carrello) => {
              const status = getStatusBadge(carrello.stato);
              const startDate = carrello.tms_inizio ? new Date(carrello.tms_inizio) : null;
              const formattedDate = startDate
                ? startDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
                : 'Data n.d.';
              const formattedTime = startDate
                ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '--:--';

              const productItems = carrello.items?.filter((i) => i.tipo === 'prodotto') || [];
              const totalPrice = carrello.items?.reduce((acc, it) => acc + (Number(it.prezzo) || 0) * (it.quantita || 1), 0) || 0;

              return (
                <div
                  key={carrello.id}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-900/60 rounded-3xl shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex flex-col items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <ShoppingBag className="w-5 h-5" />
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {carrello.titolo || `Carrello Ordine #${carrello.id}`}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${status.className}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <Package className="w-2.5 h-2.5" />
                          {productItems.reduce((acc, it) => acc + (it.quantita || 1), 0)} articoli
                        </span>
                      </div>

                      {/* Articoli del carrello con note specifiche */}
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {productItems.map((prod, i) => (
                          <div
                            key={`${prod.id_item}-${i}`}
                            className="text-[11px] px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center gap-1.5 text-slate-800 dark:text-slate-200"
                          >
                            <span className="font-extrabold text-amber-600 dark:text-amber-400">{prod.quantita || 1}x</span>
                            <span className="font-medium truncate max-w-[150px]">{getProductTitle(prod.id_item)}</span>
                            {prod.note && (
                              <span className="text-[10px] italic text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-1 rounded">
                                ({prod.note})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Info acquirente / cliente */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5">
                        {carrello.rubrica && (
                          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {carrello.rubrica.nome} {carrello.rubrica.cognome || ''}
                            {carrello.rubrica.telefono && (
                              <a
                                href={`tel:${carrello.rubrica.telefono}`}
                                className="text-amber-600 hover:underline flex items-center gap-0.5 ml-1"
                              >
                                <Phone className="w-3 h-3" />
                                {carrello.rubrica.telefono}
                              </a>
                            )}
                          </span>
                        )}

                        {carrello.professionisti && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <span>Operatore:</span>
                            <strong className="text-slate-700 dark:text-slate-300">
                              {carrello.professionisti.nome}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Prezzo & Azioni Rapide */}
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="text-left md:text-right">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center md:justify-end gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{formattedDate}</span>
                        <span className="text-amber-600 dark:text-amber-400 ml-0.5">{formattedTime}</span>
                      </div>
                      <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        € {totalPrice.toFixed(2)}
                      </div>
                    </div>

                    {/* Quick actions buttons */}
                    <div className="flex items-center gap-1.5">
                      {isAdmin && carrello.stato === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(carrello.id, 'confermata')}
                          disabled={isPending}
                          className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          title="Allestisci ordine"
                        >
                          Allestisci
                        </button>
                      )}

                      {isAdmin && carrello.stato === 'confermata' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(carrello.id, 'completata')}
                          disabled={isPending}
                          className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          title="Segna ordine consegnato"
                        >
                          Consegna
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEdit(carrello)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isAdmin ? 'Modifica' : 'Dettagli'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VISTA 2: TIMELINE / RAGGRUPPATI PER DATA */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {Object.keys(groupedByDate).length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl text-xs text-slate-400">
              Nessun ordine trovato per le date selezionate.
            </div>
          ) : (
            Object.entries(groupedByDate).map(([dateStr, items]) => {
              const parsedDate = new Date(dateStr);
              const headerLabel = !isNaN(parsedDate.getTime())
                ? parsedDate.toLocaleDateString('it-IT', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })
                : dateStr;

              return (
                <div key={dateStr} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 capitalize flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-amber-500" />
                      {headerLabel}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {items.length} {items.length === 1 ? 'ordine' : 'ordini'}
                    </span>
                    <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {items.map((item) => {
                      const status = getStatusBadge(item.stato);
                      const sDate = item.tms_inizio ? new Date(item.tms_inizio) : null;
                      const timeString = sDate
                        ? sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '--:--';
                      const productItems = item.items?.filter((i) => i.tipo === 'prodotto') || [];
                      const tot = item.items?.reduce((acc, it) => acc + (Number(it.prezzo) || 0) * (it.quantita || 1), 0) || 0;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleOpenEdit(item)}
                          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 shadow-2xs cursor-pointer transition-all hover:shadow-xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {timeString}
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${status.className}`}>
                              {status.label}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.titolo || `Carrello #${item.id}`}
                          </h4>

                          <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                            {productItems.length} articoli ({productItems.map((p) => `${p.quantita || 1}x ${getProductTitle(p.id_item)}`).join(', ')})
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-slate-500">
                              {item.rubrica ? `${item.rubrica.nome} ${item.rubrica.cognome || ''}` : 'Cliente Banco'}
                            </span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                              € {tot.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Drawer dedicato per creazione / modifica carrello */}
      <CarrelloDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        hubId={hubId}
        hubSlug={hubSlug}
        isAdmin={isAdmin}
        initialData={selectedCarrello}
        initialDate={initialSlot.date}
        initialTime={initialSlot.time}
        initialStaffId={initialSlot.staffId}
        professionisti={professionisti}
        professionistiServizi={professionistiServizi}
        clienti={clienti}
        servizi={servizi}
        prodotti={prodotti}
        piatti={piatti}
      />
    </div>
  );
}
