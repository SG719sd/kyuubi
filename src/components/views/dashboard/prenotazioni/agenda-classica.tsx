'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  MessageCircle,
  Plus,
  Move,
  CheckCircle,
  AlertCircle,
  UtensilsCrossed,
} from 'lucide-react';
import { PrenotazioneWithDetails } from '@/server/repositories/prenotazioni.repository';
import { upsertPrenotazioneAction } from '@/server/actions/prenotazioni.actions';

interface Props {
  prenotazioni: PrenotazioneWithDetails[];
  professionisti: any[];
  clienti: any[];
  servizi: any[];
  hubId: string;
  hubSlug: string;
  onSelectSlot: (slot: {
    date: string;
    time?: string;
    staffId?: number | null;
    senzaOrario?: boolean;
    itemType?: 'servizio' | 'prodotto' | 'piatto';
  }) => void;
  onEditPrenotazione: (prenotazione: PrenotazioneWithDetails) => void;
}

// Genera gli slot orari della giornata (07:00 - 22:00 ogni 30 min)
const TIME_SLOTS: string[] = [];
for (let h = 7; h <= 21; h++) {
  const hh = String(h).padStart(2, '0');
  TIME_SLOTS.push(`${hh}:00`);
  TIME_SLOTS.push(`${hh}:30`);
}
TIME_SLOTS.push('22:00');

// Estrae YYYY-MM-DD in base al fuso orario locale del browser
function getBookingLocalDate(tms?: string | Date | null): string {
  if (!tms) return '';
  const d = new Date(tms);
  if (isNaN(d.getTime())) {
    return typeof tms === 'string' && tms.length >= 10 ? tms.slice(0, 10) : '';
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Determina lo slot 30-min per una prenotazione (es. 09:15 -> "09:00", 09:45 -> "09:30")
function getBookingTimeSlot(tms?: string | null): string | null {
  if (!tms) return null;
  const d = new Date(tms);
  if (isNaN(d.getTime())) return null;
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const slotMin = minutes < 30 ? '00' : '30';
  return `${String(hours).padStart(2, '0')}:${slotMin}`;
}

// Formatta l'orario reale per visualizzazione (es. "09:15")
function getBookingDisplayTime(tms?: string | null): string {
  if (!tms) return '';
  const d = new Date(tms);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Rileva se una prenotazione è un ordine, piatto, prodotto o senza orario fisso
function isDishOrProductOrUntimed(p: PrenotazioneWithDetails): boolean {
  if (p.ordini) return true;
  if (!p.tms_inizio) return true;

  // Se contiene piatti o prodotti
  if (p.items && p.items.length > 0) {
    const hasDish = p.items.some((it) => it.tipo === 'piatto');
    const hasProduct = p.items.some((it) => it.tipo === 'prodotto');
    const hasService = p.items.some((it) => it.tipo === 'servizio');
    if ((hasDish || hasProduct) && !hasService) return true;
  }

  // Se è impostata a mezzanotte (00:00:00 o 12:00:00 UTC senza durata servizi)
  const d = new Date(p.tms_inizio);
  if (d.getHours() === 0 && d.getMinutes() === 0 && (!p.tempo_minuti || p.tempo_minuti === 0)) {
    return true;
  }

  return false;
}

// Ottiene il lunedì della settimana
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function AgendaClassica({
  prenotazioni,
  professionisti,
  hubId,
  hubSlug,
  onSelectSlot,
  onEditPrenotazione,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Tipo di vista: Giornaliera o Settimanale
  const [subView, setSubView] = useState<'giorno' | 'settimana'>('giorno');

  // Data di riferimento selezionata
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Filtro operatore (tutti, id operatore, oppure 'non_assegnato')
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<number | 'tutti' | 'non_assegnato'>('tutti');

  // Feedback per spostamento / Drag & Drop
  const [moveNotice, setMoveNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Drag state
  const [draggedBooking, setDraggedBooking] = useState<PrenotazioneWithDetails | null>(null);

  // Helper navigazione
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (subView === 'giorno') {
        next.setDate(next.getDate() - 1);
      } else {
        next.setDate(next.getDate() - 7);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (subView === 'giorno') {
        next.setDate(next.getDate() + 1);
      } else {
        next.setDate(next.getDate() + 7);
      }
      return next;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const currentDateStr = getBookingLocalDate(currentDate);

  // 7 Giorni della settimana per la vista settimanale
  const weekDays = useMemo(() => {
    const monday = getMonday(currentDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // Conta prenotazioni senza operatore
  const unassignedCount = useMemo(() => {
    return prenotazioni.filter((p) => !p.id_professionista).length;
  }, [prenotazioni]);

  // Colonne operatori per la vista giornaliera
  const columnsStaff = useMemo(() => {
    const hubColumn = {
      id: null,
      nome: 'Hub / Non Assegnati',
      ruolo: 'Generale',
      colore: '#64748B',
    };

    if (selectedStaffFilter === 'non_assegnato') {
      return [hubColumn];
    }

    if (selectedStaffFilter !== 'tutti') {
      const found = professionisti.find((p) => p.id === selectedStaffFilter);
      return found ? [found] : professionisti;
    }

    // Modalità 'tutti': mostra tutti i professionisti
    // Se ci sono prenotazioni senza operatore assegnato, aggiungi la colonna Hub
    if (professionisti.length === 0) {
      return [hubColumn];
    }

    if (unassignedCount > 0) {
      return [...professionisti, hubColumn];
    }

    return professionisti;
  }, [selectedStaffFilter, professionisti, unassignedCount]);

  // Ordini, Piatti e Prodotti del giorno (senza orario specifico)
  const untimedOrdersForDay = useMemo(() => {
    return prenotazioni.filter((p) => {
      const pDate = getBookingLocalDate(p.tms_inizio || p.created_at);
      if (pDate !== currentDateStr) return false;
      return isDishOrProductOrUntimed(p);
    });
  }, [prenotazioni, currentDateStr]);

  // Ordini, Piatti e Prodotti per ciascun giorno della settimana (per vista settimanale)
  const untimedOrdersForWeek = useMemo(() => {
    const map: { [dayStr: string]: PrenotazioneWithDetails[] } = {};
    weekDays.forEach((day) => {
      const dayStr = getBookingLocalDate(day);
      map[dayStr] = prenotazioni.filter((p) => {
        const pDate = getBookingLocalDate(p.tms_inizio || p.created_at);
        if (pDate !== dayStr) return false;
        return isDishOrProductOrUntimed(p);
      });
    });
    return map;
  }, [prenotazioni, weekDays]);

  // Rileva altre date che contengono prenotazioni per aiutare l'utente a navigare
  const otherDatesWithBookings = useMemo(() => {
    const dateCounts: { [date: string]: number } = {};
    prenotazioni.forEach((p) => {
      const d = getBookingLocalDate(p.tms_inizio || p.created_at);
      if (d && d !== currentDateStr) {
        dateCounts[d] = (dateCounts[d] || 0) + 1;
      }
    });

    return Object.entries(dateCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 5); // prime 5 date
  }, [prenotazioni, currentDateStr]);

  // Handler Drag and Drop
  const handleDragStart = (e: React.DragEvent, booking: PrenotazioneWithDetails) => {
    e.dataTransfer.setData('text/plain', String(booking.id));
    setDraggedBooking(booking);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropSlot = (date: string, time: string, staffId?: number | null) => {
    if (!draggedBooking) return;

    const bookingId = draggedBooking.id;
    const [h, m] = time.split(':').map(Number);
    const newStart = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);

    setMoveNotice(null);

    startTransition(async () => {
      const payload = {
        id: bookingId,
        id_hub: hubId,
        id_professionista: staffId !== undefined ? staffId : draggedBooking.id_professionista,
        id_rubrica: draggedBooking.id_rubrica,
        titolo: draggedBooking.titolo,
        note: draggedBooking.note,
        stato: draggedBooking.stato,
        agenda: true,
        ordini: draggedBooking.ordini,
        tms_inizio: newStart.toISOString(),
        items: (draggedBooking.items || []).map((it) => ({
          id_item: it.id_item,
          tipo: it.tipo,
          quantita: it.quantita,
          prezzo: it.prezzo,
          tempo_minuti: it.tempo_minuti,
          note: it.note,
        })),
      };

      const res = await upsertPrenotazioneAction(payload as any, hubSlug);
      if (res.success) {
        setMoveNotice({
          type: 'success',
          message: `Prenotazione spostata al ${date} alle ore ${time}!`,
        });
        setTimeout(() => setMoveNotice(null), 4000);
        router.refresh();
      } else {
        setMoveNotice({
          type: 'error',
          message: res.error || 'Errore durante lo spostamento',
        });
      }
      setDraggedBooking(null);
    });
  };

  // Helper per WhatsApp
  const openWhatsApp = (e: React.MouseEvent, booking: PrenotazioneWithDetails) => {
    e.stopPropagation();
    const tel = booking.rubrica?.telefono;
    if (!tel) return;

    let cleanTel = tel.replace(/[^\d+]/g, '').replace(/^00/, '+');
    if (!cleanTel.startsWith('+')) {
      cleanTel = `+39${cleanTel}`;
    }
    const cleanNum = cleanTel.replace('+', '');

    const timeFormatted = getBookingDisplayTime(booking.tms_inizio);
    const dateFormatted = getBookingLocalDate(booking.tms_inizio);

    const text = encodeURIComponent(
      `Ciao ${booking.rubrica?.nome || 'Gentile Cliente'}, ti ricordiamo la tua prenotazione per "${booking.titolo}" fissata per il ${dateFormatted}${timeFormatted ? ` alle ore ${timeFormatted}` : ''}. A presto!`
    );
    window.open(`https://wa.me/${cleanNum}?text=${text}`, '_blank');
  };

  const callPhone = (e: React.MouseEvent, tel?: string | null) => {
    e.stopPropagation();
    if (tel && typeof window !== 'undefined') {
      window.open(`tel:${tel}`, '_self');
    }
  };

  // Helper formattazione titolo data
  const formattedTitle = useMemo(() => {
    if (subView === 'giorno') {
      return currentDate.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else {
      const first = weekDays[0];
      const last = weekDays[6];
      return `Settimana ${first.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${last.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
  }, [subView, currentDate, weekDays]);

  return (
    <div className="space-y-4">
      {/* Notifica di spostamento rapido */}
      {moveNotice && (
        <div
          className={`px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-bold border shadow-md animate-fade-in ${
            moveNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {moveNotice.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            )}
            <span>{moveNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setMoveNotice(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header comandi Agenda */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Navigazione Date con Date Picker interattivo */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-2xl p-1 bg-slate-50 dark:bg-slate-950">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-700 dark:text-slate-300"
              title="Precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            >
              Oggi
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-700 dark:text-slate-300"
              title="Successivo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-2.5 py-1">
            <input
              type="date"
              value={currentDateStr}
              onChange={(e) => {
                if (e.target.value) {
                  setCurrentDate(new Date(e.target.value + 'T12:00:00'));
                }
              }}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
            />
          </div>

          <h2 className="text-sm md:text-base font-extrabold capitalize text-slate-900 dark:text-white flex items-center gap-2 pl-1">
            <CalendarIcon className="w-4 h-4 text-indigo-500" />
            {formattedTitle}
          </h2>
        </div>

        {/* Controlli Vista (Giorno / Settimana) e Filtro Professionista */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Selettore Operatore per la vista */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-2xl">
            <User className="w-3.5 h-3.5 text-indigo-500" />
            <select
              value={selectedStaffFilter}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'tutti') setSelectedStaffFilter('tutti');
                else if (val === 'non_assegnato') setSelectedStaffFilter('non_assegnato');
                else setSelectedStaffFilter(Number(val));
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="tutti">Tutti gli Operatori</option>
              {professionisti.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.ruolo})
                </option>
              ))}
              {unassignedCount > 0 && (
                <option value="non_assegnato">Hub / Non Assegnato ({unassignedCount})</option>
              )}
            </select>
          </div>

          {/* Switch Giorno / Settimana */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSubView('giorno')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subView === 'giorno'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Giornaliera
            </button>
            <button
              type="button"
              onClick={() => setSubView('settimana')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                subView === 'settimana'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Settimanale
            </button>
          </div>

          {/* Pulsante rapido Aggiungi Ordine / Piatto / Prodotto */}
          <button
            type="button"
            onClick={() =>
              onSelectSlot({
                date: currentDateStr,
                senzaOrario: true,
                itemType: 'piatto',
              })
            }
            className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Aggiungi piatto o prodotto senza orario fisso"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>+ Piatto / Prodotto</span>
          </button>
        </div>
      </div>

      {/* BANNER SUGGERIMENTO DATE: Mostra se la data corrente non ha prenotazioni ma ci sono prenotazioni in altre date */}
      {untimedOrdersForDay.length === 0 &&
        prenotazioni.filter((p) => getBookingLocalDate(p.tms_inizio) === currentDateStr).length === 0 &&
        otherDatesWithBookings.length > 0 && (
          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <CalendarIcon className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                Nessuna prenotazione per <strong>{formattedTitle}</strong>. Trovate prenotazioni in altre date:
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {otherDatesWithBookings.map(([d, count]) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setCurrentDate(new Date(d + 'T12:00:00'))}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 font-bold hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer text-[11px]"
                >
                  {d} ({count})
                </button>
              ))}
            </div>
          </div>
        )}

      {/* SEZIONE SPECIALE: ORDINI, PIATTI & PRODOTTI (SENZA ORARIO FISSO) */}
      {subView === 'giorno' && (
        <div className="bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-xl">
                <UtensilsCrossed className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Ordini, Piatti & Prodotti del Giorno
                </h3>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-400">
                  Elementi senza orario fisso o ordini di piatti e prodotti registrati per oggi ({untimedOrdersForDay.length})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onSelectSlot({
                  date: currentDateStr,
                  senzaOrario: true,
                  itemType: 'piatto',
                })
              }
              className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Aggiungi</span>
            </button>
          </div>

          {untimedOrdersForDay.length === 0 ? (
            <div className="p-3 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-amber-100 dark:border-amber-950/60 text-center text-xs text-amber-800/60 dark:text-amber-400/60">
              Nessun piatto, prodotto o ordine del giorno registrato per questa data.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {untimedOrdersForDay.map((order) => {
                const clientName = order.rubrica
                  ? `${order.rubrica.nome} ${order.rubrica.cognome || ''}`.trim()
                  : 'Cliente Banco';
                const phone = order.rubrica?.telefono;

                const hasDishes = order.items?.some((it) => it.tipo === 'piatto');
                const hasProducts = order.items?.some((it) => it.tipo === 'prodotto');

                return (
                  <div
                    key={order.id}
                    onClick={() => onEditPrenotazione(order)}
                    className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {hasDishes && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 flex items-center gap-1">
                              🍕 Piatto
                            </span>
                          )}
                          {hasProducts && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                              🛍️ Prodotto
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              order.stato === 'completata'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : order.stato === 'confermata'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {order.stato}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {order.titolo || clientName}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {clientName}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                          € {Number(order.totale || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Items preview */}
                    {order.items && order.items.length > 0 && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/50 p-1.5 rounded-xl space-y-0.5">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px]">
                            <span className="truncate">
                              {it.quantita}x Elemento #{it.id_item} ({it.tipo})
                            </span>
                            <span className="font-semibold shrink-0">€ {Number(it.prezzo).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer con contatti rapidi */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400">
                        {order.professionisti ? `Staff: ${order.professionisti.nome}` : 'Hub Generale'}
                      </span>
                      {phone && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => callPhone(e, phone)}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg cursor-pointer"
                            title="Chiama"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openWhatsApp(e, order)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg cursor-pointer"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VISTA 1: GIORNALIERA (ORARI SULLE RIGHE, OPERATORI SULLE COLONNE) */}
      {subView === 'giorno' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[750px]">
              {/* Header Colonne Operatori */}
              <div
                className="grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 sticky top-0 z-10"
                style={{ gridTemplateColumns: `80px repeat(${columnsStaff.length}, minmax(180px, 1fr))` }}
              >
                <div className="p-3 text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 text-center border-r border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 mr-1" /> Ora
                </div>

                {columnsStaff.map((staff) => (
                  <div
                    key={staff.id ?? 'hub'}
                    className="p-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 flex items-center justify-center gap-2"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: staff.colore || '#6366F1' }}
                    />
                    <div>
                      <span className="text-xs font-black text-slate-800 dark:text-white block truncate">
                        {staff.nome}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {staff.ruolo || 'Operatore'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Corpo Griglia Oraria */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {TIME_SLOTS.map((time) => (
                  <div
                    key={time}
                    className="grid min-h-[56px]"
                    style={{ gridTemplateColumns: `80px repeat(${columnsStaff.length}, minmax(180px, 1fr))` }}
                  >
                    {/* Indicatore Orario */}
                    <div className="p-2 border-r border-slate-200/80 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center bg-slate-50/40 dark:bg-slate-950/30 select-none">
                      {time}
                    </div>

                    {/* Celle Operatori */}
                    {columnsStaff.map((staff) => {
                      // Trova prenotazioni con orario che ricadono in questo slot
                      const matchingBookings = prenotazioni.filter((p) => {
                        if (!p.tms_inizio) return false;
                        if (isDishOrProductOrUntimed(p)) return false; // già mostrate nella barra ordini in alto

                        const bDate = getBookingLocalDate(p.tms_inizio);
                        if (bDate !== currentDateStr) return false;

                        // Verifica slot 30-min
                        const slotKey = getBookingTimeSlot(p.tms_inizio);
                        if (slotKey !== time) return false;

                        // Verifica operatore
                        if (staff.id !== null) {
                          return p.id_professionista === staff.id;
                        } else {
                          // Colonna Hub: include solo quelle senza operatore assegnato
                          return !p.id_professionista;
                        }
                      });

                      return (
                        <div
                          key={`${time}-${staff.id ?? 'hub'}`}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDropSlot(currentDateStr, time, staff.id)}
                          onClick={() => {
                            if (matchingBookings.length === 0) {
                              onSelectSlot({ date: currentDateStr, time, staffId: staff.id });
                            }
                          }}
                          className={`p-1.5 border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0 transition-colors relative group ${
                            matchingBookings.length === 0
                              ? 'hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer'
                              : 'bg-slate-50/20 dark:bg-slate-950/10'
                          }`}
                        >
                          {/* Pulsante veloce aggiungi quando vuoto */}
                          {matchingBookings.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md shadow-xs">
                                + {time}
                              </span>
                            </div>
                          )}

                          {/* Prenotazioni per questo slot */}
                          <div className="space-y-1">
                            {matchingBookings.map((b) => {
                              const isConfermata = b.stato === 'confermata';
                              const isCompletata = b.stato === 'completata';
                              const clientName = b.rubrica
                                ? `${b.rubrica.nome} ${b.rubrica.cognome || ''}`.trim()
                                : 'Cliente Anonimo';
                              const phone = b.rubrica?.telefono;
                              const displayTime = getBookingDisplayTime(b.tms_inizio);

                              const hasDishes = b.items?.some((it) => it.tipo === 'piatto');
                              const hasProducts = b.items?.some((it) => it.tipo === 'prodotto');

                              return (
                                <div
                                  key={b.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, b)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditPrenotazione(b);
                                  }}
                                  className={`p-2 rounded-xl text-left border shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                                    isCompletata
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-100'
                                      : isConfermata
                                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-100'
                                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-100'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5 text-indigo-500" />
                                      {displayTime} ({b.tempo_minuti || 30}m)
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {hasDishes && <span title="Contiene Piatti">🍕</span>}
                                      {hasProducts && <span title="Contiene Prodotti">🛍️</span>}
                                      <Move className="w-3 h-3 opacity-40 hover:opacity-100 cursor-grab" />
                                    </div>
                                  </div>

                                  <div className="font-extrabold text-xs leading-tight truncate">
                                    {b.titolo || clientName}
                                  </div>
                                  <div className="text-[11px] opacity-80 truncate flex items-center gap-1 mt-0.5">
                                    <User className="w-2.5 h-2.5 shrink-0" />
                                    <span>{clientName}</span>
                                  </div>

                                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
                                    <span className="text-[10px] font-bold">
                                      € {Number(b.totale || 0).toFixed(2)}
                                    </span>

                                    {phone && (
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={(e) => callPhone(e, phone)}
                                          className="p-1 hover:bg-white/80 dark:hover:bg-slate-900 rounded text-slate-700 dark:text-slate-200 cursor-pointer"
                                          title="Chiama al telefono"
                                        >
                                          <Phone className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => openWhatsApp(e, b)}
                                          className="p-1 hover:bg-white/80 dark:hover:bg-slate-900 rounded text-emerald-600 dark:text-emerald-400 cursor-pointer"
                                          title="Invia promemoria WhatsApp"
                                        >
                                          <MessageCircle className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: SETTIMANALE (ORARI SULLE RIGHE, 7 GIORNI SULLE COLONNE) */}
      {subView === 'settimana' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header Colonne Giorni */}
              <div
                className="grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 sticky top-0 z-10"
                style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
              >
                <div className="p-3 text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500 text-center border-r border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 mr-1" /> Ora
                </div>

                {weekDays.map((day) => {
                  const dayStr = getBookingLocalDate(day);
                  const isToday = dayStr === getBookingLocalDate(new Date());

                  return (
                    <div
                      key={dayStr}
                      className={`p-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${
                        isToday ? 'bg-indigo-50/70 dark:bg-indigo-950/50' : ''
                      }`}
                    >
                      <span
                        className={`text-xs uppercase font-extrabold block ${
                          isToday ? 'text-indigo-600 dark:text-indigo-400 font-black' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {day.toLocaleDateString('it-IT', { weekday: 'short' })}
                      </span>
                      <span
                        className={`text-sm font-black inline-block mt-0.5 px-2 py-0.5 rounded-full ${
                          isToday
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* RIGA SPECIALE SETTIMANALE: Ordini & Prodotti dell'intera giornata */}
              <div
                className="grid border-b border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 min-h-[48px]"
                style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
              >
                <div className="p-2 border-r border-amber-200/80 dark:border-amber-900/50 text-[10px] font-bold text-amber-800 dark:text-amber-300 flex items-center justify-center text-center">
                  📦 Ordini / Piatti
                </div>

                {weekDays.map((day) => {
                  const dayStr = getBookingLocalDate(day);
                  const dayOrders = untimedOrdersForWeek[dayStr] || [];

                  return (
                    <div
                      key={`untimed-${dayStr}`}
                      className="p-1.5 border-r border-amber-200/60 dark:border-amber-900/40 last:border-r-0 space-y-1"
                    >
                      {dayOrders.map((ord) => (
                        <div
                          key={ord.id}
                          onClick={() => onEditPrenotazione(ord)}
                          className="px-2 py-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-lg shadow-2xs text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors flex items-center justify-between gap-1"
                          title={ord.titolo || 'Ordine del giorno'}
                        >
                          <span className="truncate">🍽️ {ord.titolo || 'Ordine'}</span>
                          <span className="shrink-0 text-amber-700 dark:text-amber-400">
                            €{Number(ord.totale || 0).toFixed(0)}
                          </span>
                        </div>
                      ))}
                      {dayOrders.length === 0 && (
                        <div
                          onClick={() =>
                            onSelectSlot({
                              date: dayStr,
                              senzaOrario: true,
                              itemType: 'piatto',
                            })
                          }
                          className="h-full min-h-[30px] flex items-center justify-center text-[10px] text-amber-700/50 dark:text-amber-400/50 hover:bg-amber-100/50 dark:hover:bg-amber-950/30 rounded cursor-pointer transition-colors"
                        >
                          + aggiungi
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Corpo Griglia Settimanale */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {TIME_SLOTS.map((time) => (
                  <div
                    key={time}
                    className="grid min-h-[56px]"
                    style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
                  >
                    {/* Indicatore Orario */}
                    <div className="p-2 border-r border-slate-200/80 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center bg-slate-50/40 dark:bg-slate-950/30 select-none">
                      {time}
                    </div>

                    {/* Ciascuno dei 7 giorni */}
                    {weekDays.map((day) => {
                      const dayStr = getBookingLocalDate(day);

                      // Trova prenotazioni con orario che ricadono in questo slot in questo giorno
                      const matchingBookings = prenotazioni.filter((p) => {
                        if (!p.tms_inizio) return false;
                        if (isDishOrProductOrUntimed(p)) return false;

                        const bDate = getBookingLocalDate(p.tms_inizio);
                        if (bDate !== dayStr) return false;

                        const slotKey = getBookingTimeSlot(p.tms_inizio);
                        if (slotKey !== time) return false;

                        if (selectedStaffFilter === 'non_assegnato') {
                          return !p.id_professionista;
                        }

                        if (selectedStaffFilter !== 'tutti') {
                          return p.id_professionista === selectedStaffFilter;
                        }

                        return true;
                      });

                      return (
                        <div
                          key={`${dayStr}-${time}`}
                          onDragOver={handleDragOver}
                          onDrop={() =>
                            handleDropSlot(
                              dayStr,
                              time,
                              typeof selectedStaffFilter === 'number' ? selectedStaffFilter : undefined
                            )
                          }
                          onClick={() => {
                            if (matchingBookings.length === 0) {
                              onSelectSlot({
                                date: dayStr,
                                time,
                                staffId:
                                  typeof selectedStaffFilter === 'number'
                                    ? selectedStaffFilter
                                    : undefined,
                              });
                            }
                          }}
                          className={`p-1.5 border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0 transition-colors relative group ${
                            matchingBookings.length === 0
                              ? 'hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer'
                              : 'bg-slate-50/20 dark:bg-slate-950/10'
                          }`}
                        >
                          {/* Pulsante veloce aggiungi quando vuoto */}
                          {matchingBookings.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md shadow-xs">
                                + {time}
                              </span>
                            </div>
                          )}

                          {/* Prenotazioni per questo slot */}
                          <div className="space-y-1">
                            {matchingBookings.map((b) => {
                              const isConfermata = b.stato === 'confermata';
                              const isCompletata = b.stato === 'completata';
                              const clientName = b.rubrica
                                ? `${b.rubrica.nome} ${b.rubrica.cognome || ''}`.trim()
                                : 'Cliente';
                              const phone = b.rubrica?.telefono;
                              const displayTime = getBookingDisplayTime(b.tms_inizio);

                              return (
                                <div
                                  key={b.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, b)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditPrenotazione(b);
                                  }}
                                  className={`p-1.5 rounded-xl text-left border shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                                    isCompletata
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-100'
                                      : isConfermata
                                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-100'
                                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-100'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] font-black mb-0.5">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5 text-indigo-500" />
                                      {displayTime}
                                    </span>
                                    <span className="text-[9px] opacity-70">
                                      {b.tempo_minuti || 30}m
                                    </span>
                                  </div>

                                  <div className="font-extrabold text-[11px] leading-tight truncate">
                                    {b.titolo || clientName}
                                  </div>

                                  <div className="text-[10px] opacity-75 truncate flex items-center justify-between mt-1">
                                    <span className="truncate">{clientName}</span>
                                    {phone && (
                                      <div className="flex items-center gap-0.5 ml-1">
                                        <button
                                          type="button"
                                          onClick={(e) => callPhone(e, phone)}
                                          className="p-0.5 hover:bg-white/80 rounded cursor-pointer"
                                        >
                                          <Phone className="w-2.5 h-2.5 text-indigo-600" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => openWhatsApp(e, b)}
                                          className="p-0.5 hover:bg-white/80 rounded cursor-pointer"
                                        >
                                          <MessageCircle className="w-2.5 h-2.5 text-emerald-600" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
