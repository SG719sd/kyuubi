'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck,
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
} from 'lucide-react';
import PrenotazioneDrawer from './prenotazione-drawer';
import AgendaClassica from './agenda-classica';
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

export default function PrenotazioniView({
  prenotazioni,
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

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('tutti');
  const [staffFilter, setStaffFilter] = useState<string>('tutti');
  const [dateQuickFilter, setDateQuickFilter] = useState<'tutte' | 'oggi' | 'prossimi' | 'passati'>('tutte');
  const [viewMode, setViewMode] = useState<'agenda' | 'elenco' | 'timeline'>('agenda');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPrenotazione, setSelectedPrenotazione] = useState<PrenotazioneWithDetails | null>(null);
  const [initialSlot, setInitialSlot] = useState<{ date?: string; time?: string; staffId?: number | null }>({});

  // Status Colors & Badges
  const getStatusBadge = (stato: string) => {
    switch (stato) {
      case 'confermata':
        return {
          label: 'Confermata',
          className: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          dot: 'bg-blue-500',
        };
      case 'completata':
        return {
          label: 'Completata',
          className: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          dot: 'bg-emerald-500',
        };
      case 'cancellata':
        return {
          label: 'Cancellata',
          className: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          dot: 'bg-rose-500',
        };
      default: // pending
        return {
          label: 'In Attesa',
          className: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          dot: 'bg-amber-500',
        };
    }
  };

  // Quick action: change status
  const handleQuickStatusChange = (id: number, nextStato: string) => {
    startTransition(async () => {
      const res = await cambioStatoPrenotazioneAction(id, hubId, nextStato, hubSlug);
      if (res.success) {
        router.refresh();
      }
    });
  };

  // KPIs
  const stats = useMemo(() => {
    const total = prenotazioni.length;
    const pending = prenotazioni.filter((p) => p.stato === 'pending').length;
    const confermate = prenotazioni.filter((p) => p.stato === 'confermata').length;
    const completate = prenotazioni.filter((p) => p.stato === 'completata').length;
    const revenue = prenotazioni
      .filter((p) => p.stato !== 'cancellata')
      .reduce((sum, p) => sum + (Number(p.totale) || 0), 0);

    return { total, pending, confermate, completate, revenue };
  }, [prenotazioni]);

  // Filtering for List & Timeline views
  const filteredPrenotazioni = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    return prenotazioni.filter((p) => {
      // 1. Text search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = p.titolo?.toLowerCase().includes(query);
        const matchesClient =
          p.rubrica?.nome?.toLowerCase().includes(query) ||
          p.rubrica?.cognome?.toLowerCase().includes(query) ||
          p.rubrica?.telefono?.includes(query);
        const matchesStaff = p.professionisti?.nome?.toLowerCase().includes(query);
        const matchesNotes = p.note?.toLowerCase().includes(query);

        if (!matchesTitle && !matchesClient && !matchesStaff && !matchesNotes) {
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
  }, [prenotazioni, search, statusFilter, staffFilter, dateQuickFilter]);

  // Group by date for timeline
  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: PrenotazioneWithDetails[] } = {};
    for (const item of filteredPrenotazioni) {
      const dStr = item.tms_inizio ? new Date(item.tms_inizio).toISOString().slice(0, 10) : 'Senza data';
      if (!groups[dStr]) groups[dStr] = [];
      groups[dStr].push(item);
    }
    return groups;
  }, [filteredPrenotazioni]);

  const handleOpenCreate = () => {
    setSelectedPrenotazione(null);
    setInitialSlot({
      date: new Date().toISOString().slice(0, 10),
      time: '09:00',
      staffId: professionisti.length > 0 ? professionisti[0].id : null,
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (p: PrenotazioneWithDetails) => {
    setSelectedPrenotazione(p);
    setIsDrawerOpen(true);
  };

  const handleSelectSlotFromAgenda = (slot: { date: string; time: string; staffId?: number | null }) => {
    setSelectedPrenotazione(null);
    setInitialSlot(slot);
    setIsDrawerOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Statistiche & KPI Rapidi */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
            Totale Appuntamenti
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {stats.total}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/50 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block mb-1">
            In Attesa (Pending)
          </span>
          <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.pending}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/50 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block mb-1">
            Confermate
          </span>
          <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
            {stats.confermate}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
            Completate
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.completate}
          </span>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/50 rounded-2xl p-4 shadow-2xs">
          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">
            Volume Atteso
          </span>
          <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 truncate block">
            € {stats.revenue.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Switch Modalità di Vista Principale & Nuovo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl flex items-center gap-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('agenda')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'agenda'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            <span>Agenda Classica</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('elenco')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'elenco'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            <span>Tabella Elenco</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Raggruppati per Data</span>
          </button>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Prenotazione</span>
          </button>
        )}
      </div>

      {/* VISTA 1: AGENDA CLASSICA (CALENDARIO GIORNALIERO E SETTIMANALE CON DRAG AND DROP E CONTATTI RAPIDI) */}
      {viewMode === 'agenda' && (
        <AgendaClassica
          prenotazioni={prenotazioni}
          professionisti={professionisti}
          clienti={clienti}
          servizi={servizi}
          hubId={hubId}
          hubSlug={hubSlug}
          onSelectSlot={handleSelectSlotFromAgenda}
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
                placeholder="Cerca cliente, telefono, titolo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
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
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab === 'tutte' ? 'Tutte le date' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Select Dropdowns: Stato e Professionista */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="tutti">Tutti gli stati</option>
                <option value="pending">⏳ In attesa</option>
                <option value="confermata">✅ Confermata</option>
                <option value="completata">🎉 Completata</option>
                <option value="cancellata">❌ Cancellata</option>
              </select>

              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="tutti">Tutti gli operatori</option>
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

      {/* VISTA 2: TABELLA ELENCO */}
      {viewMode === 'elenco' && (
        <div className="space-y-3">
          {filteredPrenotazioni.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Nessuna prenotazione trovata
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Non sono presenti prenotazioni che corrispondono ai filtri selezionati.
              </p>
            </div>
          ) : (
            filteredPrenotazioni.map((p) => {
              const status = getStatusBadge(p.stato);
              const startDate = p.tms_inizio ? new Date(p.tms_inizio) : null;
              const formattedDate = startDate
                ? startDate.toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Data n.d.';
              const formattedTime = startDate
                ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '--:--';

              return (
                <div
                  key={p.id}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-3xl shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex flex-col items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                      <CalendarCheck className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {p.titolo || 'Prenotazione'}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${status.className}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>

                      {/* Informazioni Cliente & Staff */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        {p.rubrica && (
                          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {p.rubrica.nome} {p.rubrica.cognome || ''}
                            {p.rubrica.telefono && (
                              <a
                                href={`tel:${p.rubrica.telefono}`}
                                className="text-indigo-600 hover:underline flex items-center gap-0.5 ml-1"
                              >
                                <Phone className="w-3 h-3" />
                                {p.rubrica.telefono}
                              </a>
                            )}
                          </span>
                        )}

                        {p.professionisti && (
                          <span className="flex items-center gap-1">
                            <span>Operatore:</span>
                            <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                              {p.professionisti.nome}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dettagli orari, prezzo e azioni */}
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left md:text-right">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center md:justify-end gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{formattedDate}</span>
                        <span className="text-indigo-600 dark:text-indigo-400 ml-0.5">{formattedTime}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        Durata: {p.tempo_minuti || 30} min • € {Number(p.totale || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* Quick actions buttons */}
                    <div className="flex items-center gap-1.5">
                      {p.stato === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(p.id, 'confermata')}
                          disabled={isPending}
                          className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                          title="Conferma prenotazione"
                        >
                          Conferma
                        </button>
                      )}

                      {p.stato === 'confermata' && (
                        <button
                          type="button"
                          onClick={() => handleQuickStatusChange(p.id, 'completata')}
                          disabled={isPending}
                          className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                          title="Segna come completata"
                        >
                          Completa
                        </button>
                      )}

                      {/* Modifica Drawer Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>Dettagli</span>
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

      {/* VISTA 3: TIMELINE / RAGGRUPPATI PER DATA */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {Object.keys(groupedByDate).length === 0 ? (
            <div className="p-10 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl text-xs text-slate-400">
              Nessuna data con appuntamenti per i filtri selezionati.
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
                      <CalendarIcon className="w-4 h-4 text-indigo-500" />
                      {headerLabel}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                      {items.length} {items.length === 1 ? 'appuntamento' : 'appuntamenti'}
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

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleOpenEdit(item)}
                          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 shadow-2xs cursor-pointer transition-all hover:shadow-xs space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {timeString} ({item.tempo_minuti}m)
                            </span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${status.className}`}>
                              {status.label}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.titolo || 'Appuntamento'}
                          </h4>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{item.rubrica ? `${item.rubrica.nome} ${item.rubrica.cognome || ''}` : 'Anonimo'}</span>
                            <span className="font-bold text-slate-900 dark:text-white">€ {Number(item.totale).toFixed(2)}</span>
                          </div>

                          {item.professionisti && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                              Operatore: <strong className="text-slate-700 dark:text-slate-300">{item.professionisti.nome}</strong>
                            </div>
                          )}
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

      {/* Drawer Prenotazione con supporto slot iniziali e servizi per professionista */}
      <PrenotazioneDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        hubId={hubId}
        hubSlug={hubSlug}
        initialData={selectedPrenotazione}
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
