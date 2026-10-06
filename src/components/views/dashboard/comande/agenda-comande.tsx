'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Phone,
  MessageCircle,
  Plus,
  Move,
  CheckCircle,
  AlertCircle,
  UtensilsCrossed,
  ShoppingBag,
  Flame,
} from 'lucide-react';
import { PrenotazioneWithDetails } from '@/server/repositories/prenotazioni.repository';
import { upsertPrenotazioneAction } from '@/server/actions/prenotazioni.actions';

interface Props {
  prenotazioni: PrenotazioneWithDetails[];
  professionisti: any[];
  clienti: any[];
  piatti?: any[];
  prodotti?: any[];
  servizi?: any[];
  hubId: string;
  hubSlug: string;
  isAdmin?: boolean;
  onSelectSlot: (slot: {
    date: string;
    time?: string;
    staffId?: number | null;
    senzaOrario?: boolean;
    itemType?: 'piatto' | 'prodotto';
  }) => void;
  onEditPrenotazione: (prenotazione: PrenotazioneWithDetails) => void;
}

// Slot orari per la giornata ristorante / comande (07:00 - 23:30 ogni 30 min)
const TIME_SLOTS: string[] = [];
for (let h = 7; h <= 23; h++) {
  const hh = String(h).padStart(2, '0');
  TIME_SLOTS.push(`${hh}:00`);
  TIME_SLOTS.push(`${hh}:30`);
}

// Estrae YYYY-MM-DD in base al fuso orario locale
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

// Formatta l'orario reale per visualizzazione (es. "12:30")
function getBookingDisplayTime(tms?: string | null): string {
  if (!tms) return '';
  const d = new Date(tms);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function minutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, totalMinutes);
  const h = Math.floor(normalized / 60) % 24;
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Calcola la durata stimata della comanda (tempo di preparazione cucina)
function getBookingDurationMinutes(b: PrenotazioneWithDetails): number {
  if (b.tempo_minuti && b.tempo_minuti > 0) return b.tempo_minuti;
  if (b.tms_inizio && b.tms_fine) {
    const diff = Math.round((new Date(b.tms_fine).getTime() - new Date(b.tms_inizio).getTime()) / 60000);
    if (diff > 0) return diff;
  }
  if (b.items && b.items.length > 0) {
    const sum = b.items.reduce((acc, it) => acc + (it.tempo_minuti || 0) * (it.quantita || 1), 0);
    if (sum > 0) return sum;
  }
  return 30; // Minimo 30 minuti di servizio/cucina
}

export const TIME_SLOT_MINUTES = 30;
export const SLOT_HEIGHT = 60; // 60px per slot da 30 min -> 2.0px al minuto
export const PIXELS_PER_MINUTE = SLOT_HEIGHT / TIME_SLOT_MINUTES;
export const DAY_START_MINUTES = 7 * 60; // 07:00 (420 min)
export const DAY_END_MINUTES = 23 * 60 + 30; // 23:30 (1410 min)

export interface BookingTimeSpan {
  startMinutes: number;
  endMinutes: number;
  duration: number;
  displayStart: string;
  displayEnd: string;
}

export interface PositionedBooking {
  booking: PrenotazioneWithDetails;
  span: BookingTimeSpan;
  lane: number;
  totalLanes: number;
  top: number;
  height: number;
}

// Algoritmo di partizione corsie per comande sovrapposte
export function layoutBookingsInLanes(
  items: Array<{ booking: PrenotazioneWithDetails; span: BookingTimeSpan }>
): PositionedBooking[] {
  if (!items || items.length === 0) return [];

  const sorted = [...items].sort((a, b) => {
    if (a.span.startMinutes !== b.span.startMinutes) {
      return a.span.startMinutes - b.span.startMinutes;
    }
    return b.span.endMinutes - a.span.endMinutes;
  });

  const clusters: Array<typeof items> = [];
  let currentCluster: typeof items = [];
  let clusterEnd = -1;

  for (const item of sorted) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.span.endMinutes;
    } else if (item.span.startMinutes < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.span.endMinutes);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.span.endMinutes;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const results: PositionedBooking[] = [];

  for (const cluster of clusters) {
    const lanes: number[] = [];
    const clusterItemsWithLane: Array<{
      booking: PrenotazioneWithDetails;
      span: BookingTimeSpan;
      lane: number;
    }> = [];

    for (const item of cluster) {
      let assignedLane = -1;
      for (let i = 0; i < lanes.length; i++) {
        if (lanes[i] <= item.span.startMinutes) {
          assignedLane = i;
          lanes[i] = item.span.endMinutes;
          break;
        }
      }
      if (assignedLane === -1) {
        assignedLane = lanes.length;
        lanes.push(item.span.endMinutes);
      }
      clusterItemsWithLane.push({ ...item, lane: assignedLane });
    }

    const totalLanes = Math.max(lanes.length, 1);

    for (const it of clusterItemsWithLane) {
      const clampedStart = Math.max(it.span.startMinutes, DAY_START_MINUTES);
      const clampedEnd = Math.min(it.span.endMinutes, DAY_END_MINUTES);

      if (clampedEnd > DAY_START_MINUTES && clampedStart < DAY_END_MINUTES) {
        const top = (clampedStart - DAY_START_MINUTES) * PIXELS_PER_MINUTE;
        const durationMinutes = clampedEnd - clampedStart;
        const height = Math.max(durationMinutes * PIXELS_PER_MINUTE, 32);

        results.push({
          booking: it.booking,
          span: it.span,
          lane: it.lane,
          totalLanes,
          top,
          height,
        });
      }
    }
  }

  return results;
}

function getBookingSpan(b: PrenotazioneWithDetails): BookingTimeSpan | null {
  if (!b.tms_inizio) return null;
  const d = new Date(b.tms_inizio);
  if (isNaN(d.getTime())) return null;

  const startMinutes = d.getHours() * 60 + d.getMinutes();
  const duration = Math.max(getBookingDurationMinutes(b), 15);
  const endMinutes = startMinutes + duration;
  const displayStart = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const displayEnd = minutesToTime(endMinutes);

  return {
    startMinutes,
    endMinutes,
    duration,
    displayStart,
    displayEnd,
  };
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function AgendaComande({
  prenotazioni,
  professionisti,
  piatti = [],
  prodotti = [],
  hubId,
  hubSlug,
  isAdmin = true,
  onSelectSlot,
  onEditPrenotazione,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [subView, setSubView] = useState<'giorno' | 'settimana'>('giorno');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<number | 'tutti' | 'non_assegnato'>('tutti');
  const [moveNotice, setMoveNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [draggedBooking, setDraggedBooking] = useState<PrenotazioneWithDetails | null>(null);

  const [nowMinutes, setNowMinutes] = useState<number>(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = useMemo(() => getBookingLocalDate(new Date()), []);
  const currentDateStr = getBookingLocalDate(currentDate);

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

  const columnsStaff = useMemo(() => {
    const salaColumn = {
      id: null,
      nome: 'Sala / Non Assegnati',
      ruolo: 'Banco',
      colore: '#F43F5E',
    };

    if (selectedStaffFilter === 'non_assegnato') {
      return [salaColumn];
    }

    if (selectedStaffFilter !== 'tutti') {
      const found = professionisti.find((p) => p.id === selectedStaffFilter);
      return found ? [found] : [salaColumn];
    }

    if (professionisti.length === 0) {
      return [salaColumn];
    }

    return [...professionisti, salaColumn];
  }, [selectedStaffFilter, professionisti]);

  // Comande aperte senza orario fisso del giorno selezionato
  const openUntimedComande = useMemo(() => {
    return prenotazioni.filter((p) => {
      const bDate = getBookingLocalDate(p.tms_inizio || p.created_at);
      if (bDate !== currentDateStr) return false;
      if (!p.tms_inizio) return true;
      const d = new Date(p.tms_inizio);
      // Se marcato senza orario fisso o se impostato a mezzogiorno esatto senza minuti/durata
      return p.ordini === true && (d.getUTCHours() === 12 && d.getUTCMinutes() === 0 && (!p.tempo_minuti || p.tempo_minuti === 0));
    });
  }, [prenotazioni, currentDateStr]);

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, booking: PrenotazioneWithDetails) => {
    if (!isAdmin) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', String(booking.id));
    setDraggedBooking(booking);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropSlot = (date: string, time: string, staffId?: number | null) => {
    if (!isAdmin) {
      setMoveNotice({
        type: 'error',
        message: 'Azione non consentita: solo gli amministratori possono spostare le comande.',
      });
      setTimeout(() => setMoveNotice(null), 4000);
      return;
    }

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
        ordini: true,
        tms_inizio: newStart.toISOString(),
        items: (draggedBooking.items || []).map((it) => ({
          id_item: it.id_item,
          tipo: it.tipo || 'piatto',
          quantita: it.quantita || 1,
          prezzo: it.prezzo || 0,
          tempo_minuti: it.tempo_minuti || 15,
          note: it.note || null,
        })),
      };

      const res = await upsertPrenotazioneAction(payload as any, hubSlug);
      if (res.success) {
        setMoveNotice({
          type: 'success',
          message: `Comanda spostata al ${date} ore ${time}!`,
        });
        setTimeout(() => setMoveNotice(null), 4000);
        router.refresh();
      } else {
        setMoveNotice({
          type: 'error',
          message: res.error || 'Errore durante lo spostamento della comanda',
        });
      }
      setDraggedBooking(null);
    });
  };

  const handleSlotClick = (slot: {
    date: string;
    time?: string;
    staffId?: number | null;
  }) => {
    if (!isAdmin) {
      setMoveNotice({
        type: 'error',
        message: 'Azione riservata: solo gli amministratori possono inserire nuove comande.',
      });
      setTimeout(() => setMoveNotice(null), 4000);
      return;
    }
    onSelectSlot({
      ...slot,
      itemType: 'piatto',
    });
  };

  const openWhatsApp = (e: React.MouseEvent, booking: PrenotazioneWithDetails) => {
    e.stopPropagation();
    const tel = booking.rubrica?.telefono;
    if (!tel) return;

    let cleanTel = tel.replace(/[^\d+]/g, '').replace(/^00/, '+');
    if (!cleanTel.startsWith('+')) cleanTel = `+39${cleanTel}`;
    const cleanNum = cleanTel.replace('+', '');

    const timeFormatted = getBookingDisplayTime(booking.tms_inizio);
    const dateFormatted = getBookingLocalDate(booking.tms_inizio);

    const text = encodeURIComponent(
      `Ciao ${booking.rubrica?.nome || 'Gentile Cliente'}, confermiamo la tua comanda "${booking.titolo}" per il ${dateFormatted}${timeFormatted ? ` alle ore ${timeFormatted}` : ''}. Buon appetito!`
    );
    window.open(`https://wa.me/${cleanNum}?text=${text}`, '_blank');
  };

  const callPhone = (e: React.MouseEvent, tel?: string | null) => {
    e.stopPropagation();
    if (tel && typeof window !== 'undefined') {
      window.open(`tel:${tel}`, '_self');
    }
  };

  const formattedTitle = useMemo(() => {
    if (subView === 'giorno') {
      return currentDate.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } else {
      const mon = weekDays[0];
      const sun = weekDays[6];
      const sameMonth = mon.getMonth() === sun.getMonth();
      if (sameMonth) {
        return `${mon.getDate()} - ${sun.getDate()} ${mon.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}`;
      }
      return `${mon.getDate()} ${mon.toLocaleDateString('it-IT', { month: 'short' })} - ${sun.getDate()} ${sun.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })}`;
    }
  }, [subView, currentDate, weekDays]);

  const getDishTitle = (idItem: number) => {
    return piatti?.find((p) => p.id === idItem)?.titolo || `Piatto #${idItem}`;
  };

  const getProductTitle = (idItem: number) => {
    return prodotti?.find((p) => p.id === idItem)?.titolo || `Prodotto #${idItem}`;
  };

  return (
    <div className="space-y-4">
      {/* Toast Notifiche Spostamento */}
      {moveNotice && (
        <div
          className={`p-3 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold animate-fade-in shadow-xs ${
            moveNotice.type === 'success'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {moveNotice.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-rose-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <span>{moveNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setMoveNotice(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100"
          >
            Chiudi
          </button>
        </div>
      )}

      {/* Toolbar di Navigazione Agenda Comande */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Navigazione Data */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-0.5">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Precedente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Oggi
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="Successivo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white capitalize flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-rose-500" />
              <span>{formattedTitle}</span>
            </h2>
          </div>

          {/* Switcher Giorno / Settimana & Filtri */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSubView('giorno')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  subView === 'giorno'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Giornaliera
              </button>
              <button
                type="button"
                onClick={() => setSubView('settimana')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  subView === 'settimana'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Settimanale
              </button>
            </div>

            {/* Filtro Cameriere / Staff */}
            <select
              value={selectedStaffFilter}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'tutti' || val === 'non_assegnato') {
                  setSelectedStaffFilter(val);
                } else {
                  setSelectedStaffFilter(Number(val));
                }
              }}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-1 focus:ring-rose-500"
            >
              <option value="tutti">Tutti i camerieri / addetti</option>
              {professionisti.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
              <option value="non_assegnato">Solo Sala / Non Assegnati</option>
            </select>
          </div>
        </div>

        {/* Banner Comande Aperte Senza Orario Fisso (se presenti) */}
        {openUntimedComande.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                Comande Aperte / Al Banco del Giorno ({openUntimedComande.length})
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {openUntimedComande.map((comanda) => {
                const dishes = comanda.items?.filter((i) => i.tipo === 'piatto') || [];
                const products = comanda.items?.filter((i) => i.tipo === 'prodotto') || [];
                const tot = comanda.items?.reduce((acc, it) => acc + (Number(it.prezzo) || 0) * (it.quantita || 1), 0) || 0;

                return (
                  <div
                    key={comanda.id}
                    onClick={() => onEditPrenotazione(comanda)}
                    className="shrink-0 p-2.5 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-2xl hover:border-rose-400 cursor-pointer transition-all space-y-1 min-w-[200px] max-w-[260px]"
                  >
                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-white truncate">
                      <span className="truncate">{comanda.titolo || `Comanda #${comanda.id}`}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black shrink-0 ml-1">
                        € {tot.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600 dark:text-slate-300 truncate">
                      {dishes.length > 0 && `${dishes.reduce((a, b) => a + (b.quantita || 1), 0)} portate`}
                      {products.length > 0 && ` • ${products.reduce((a, b) => a + (b.quantita || 1), 0)} articoli`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* GRIGLIA CONTINUA ORARIA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Intestazione Colonne */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 sticky top-0 z-20">
          <div className="w-14 sm:w-16 shrink-0 border-r border-slate-200 dark:border-slate-800 p-2.5 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Ora
          </div>

          <div className="flex-1 flex overflow-x-auto no-scrollbar">
            {subView === 'giorno' ? (
              columnsStaff.map((staff) => (
                <div
                  key={staff.id ?? 'sala'}
                  className="flex-1 min-w-[170px] sm:min-w-[200px] p-2.5 border-r border-slate-200 dark:border-slate-800 last:border-r-0 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: staff.colore || '#F43F5E' }}
                    >
                      {staff.nome.charAt(0)}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {staff.nome}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium truncate">
                        {staff.ruolo || 'Staff'}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() =>
                        handleSlotClick({
                          date: currentDateStr,
                          time: '12:30',
                          staffId: staff.id,
                        })
                      }
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                      title="Aggiungi comanda"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              weekDays.map((day) => {
                const dayStr = getBookingLocalDate(day);
                const isToday = dayStr === todayStr;
                return (
                  <div
                    key={dayStr}
                    className={`flex-1 min-w-[140px] sm:min-w-[160px] p-2.5 border-r border-slate-200 dark:border-slate-800 last:border-r-0 text-center ${
                      isToday ? 'bg-rose-50/50 dark:bg-rose-950/20' : ''
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                      {day.toLocaleDateString('it-IT', { weekday: 'short' })}
                    </div>
                    <div
                      className={`text-sm font-black mt-0.5 inline-block px-2 py-0.5 rounded-full ${
                        isToday
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {day.getDate()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Corpo Griglia: Ore e Slot */}
        <div className="flex relative overflow-y-auto max-h-[750px] no-scrollbar">
          
          {/* Colonna Orari a Sinistra */}
          <div className="w-14 sm:w-16 shrink-0 border-r border-slate-200 dark:border-slate-800 select-none bg-slate-50/40 dark:bg-slate-950/40">
            {TIME_SLOTS.map((slot) => (
              <div
                key={slot}
                style={{ height: `${SLOT_HEIGHT}px` }}
                className="border-b border-slate-100 dark:border-slate-800/80 px-1 py-1 text-right text-[10px] font-mono font-bold text-slate-400 flex items-start justify-end"
              >
                {slot}
              </div>
            ))}
          </div>

          {/* Colonne Contenuto (Giornaliera o Settimanale) */}
          <div className="flex-1 flex relative">
            
            {/* Linea indicatore orario realtime se oggi */}
            {currentDateStr === todayStr &&
              nowMinutes >= DAY_START_MINUTES &&
              nowMinutes <= DAY_END_MINUTES && (
                <div
                  style={{
                    top: `${(nowMinutes - DAY_START_MINUTES) * PIXELS_PER_MINUTE}px`,
                  }}
                  className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-600 -ml-1.5 shadow-sm" />
                  <div className="h-0.5 bg-rose-500 w-full" />
                </div>
              )}

            {subView === 'giorno' ? (
              columnsStaff.map((staff) => {
                // Filtra comande del giorno per questo cameriere o sala
                const dayBookings = prenotazioni.filter((p) => {
                  if (!p.tms_inizio) return false;
                  const bDate = getBookingLocalDate(p.tms_inizio);
                  if (bDate !== currentDateStr) return false;
                  if (staff.id !== null) {
                    return p.id_professionista === staff.id;
                  } else {
                    return !p.id_professionista;
                  }
                });

                const bookingSpans = dayBookings
                  .map((b) => {
                    const span = getBookingSpan(b);
                    return span ? { booking: b, span } : null;
                  })
                  .filter(Boolean) as Array<{
                  booking: PrenotazioneWithDetails;
                  span: BookingTimeSpan;
                }>;

                const positioned = layoutBookingsInLanes(bookingSpans);

                return (
                  <div
                    key={staff.id ?? 'sala'}
                    onDragOver={handleDragOver}
                    className="flex-1 min-w-[170px] sm:min-w-[200px] border-r border-slate-200 dark:border-slate-800 last:border-r-0 relative select-none"
                  >
                    {/* Griglia delle celle orarie da 30 min per click & drop */}
                    {TIME_SLOTS.map((slot) => (
                      <div
                        key={slot}
                        style={{ height: `${SLOT_HEIGHT}px` }}
                        onDrop={() => handleDropSlot(currentDateStr, slot, staff.id)}
                        onClick={() =>
                          handleSlotClick({
                            date: currentDateStr,
                            time: slot,
                            staffId: staff.id,
                          })
                        }
                        className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-rose-50/20 dark:hover:bg-rose-950/10 cursor-pointer transition-colors group flex items-start justify-end p-1"
                      >
                        <span className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-rose-500 transition-opacity">
                          + {slot}
                        </span>
                      </div>
                    ))}

                    {/* Carte Comande Posizionate */}
                    {positioned.map((pos) => {
                      const item = pos.booking;
                      const dishItems = item.items?.filter((i) => i.tipo === 'piatto') || [];
                      const prodItems = item.items?.filter((i) => i.tipo === 'prodotto') || [];
                      const tot = item.items?.reduce((acc, it) => acc + (Number(it.prezzo) || 0) * (it.quantita || 1), 0) || 0;

                      const widthPercent = 100 / pos.totalLanes;
                      const leftPercent = pos.lane * widthPercent;

                      return (
                        <div
                          key={item.id}
                          draggable={isAdmin}
                          onDragStart={(e) => handleDragStart(e, item)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPrenotazione(item);
                          }}
                          style={{
                            top: `${pos.top}px`,
                            height: `${pos.height}px`,
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          className="absolute z-10 p-1.5 sm:p-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md cursor-pointer transition-all overflow-hidden flex flex-col justify-between group"
                        >
                          {/* Intestazione Card */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-0.5 truncate">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>{pos.span.displayStart} - {pos.span.displayEnd}</span>
                            </span>
                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                              € {tot.toFixed(2)}
                            </span>
                          </div>

                          {/* Titolo Tavolo / Cliente */}
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                            {item.titolo || `Comanda #${item.id}`}
                          </div>

                          {/* Portate ed Elementi */}
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                            {dishItems.length > 0 && (
                              <span className="flex items-center gap-0.5 text-rose-600 dark:text-rose-400 font-bold">
                                <UtensilsCrossed className="w-2.5 h-2.5" />
                                {dishItems.map((d) => `${d.quantita || 1}x ${getDishTitle(d.id_item)}`).join(', ')}
                              </span>
                            )}
                            {prodItems.length > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold">
                                <ShoppingBag className="w-2.5 h-2.5" />
                                {prodItems.length} bevande
                              </span>
                            )}
                          </div>

                          {/* Footer Contatti Rapidi & Drag */}
                          <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                            <span className="truncate">
                              {item.rubrica ? `${item.rubrica.nome}` : 'Sala'}
                            </span>
                            <div className="flex items-center gap-1">
                              {item.rubrica?.telefono && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => callPhone(e, item.rubrica?.telefono)}
                                    className="hover:text-rose-600"
                                    title="Chiama"
                                  >
                                    <Phone className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => openWhatsApp(e, item)}
                                    className="hover:text-emerald-600"
                                    title="WhatsApp"
                                  >
                                    <MessageCircle className="w-2.5 h-2.5" />
                                  </button>
                                </>
                              )}
                              {isAdmin && (
                                <Move className="w-2.5 h-2.5 text-slate-300 group-hover:text-slate-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            ) : (
              /* Vista Settimanale */
              weekDays.map((day) => {
                const dayStr = getBookingLocalDate(day);
                const dayBookings = prenotazioni.filter((p) => {
                  if (!p.tms_inizio) return false;
                  return getBookingLocalDate(p.tms_inizio) === dayStr;
                });

                const bookingSpans = dayBookings
                  .map((b) => {
                    const span = getBookingSpan(b);
                    return span ? { booking: b, span } : null;
                  })
                  .filter(Boolean) as Array<{
                  booking: PrenotazioneWithDetails;
                  span: BookingTimeSpan;
                }>;

                const positioned = layoutBookingsInLanes(bookingSpans);

                return (
                  <div
                    key={dayStr}
                    onDragOver={handleDragOver}
                    className="flex-1 min-w-[140px] sm:min-w-[160px] border-r border-slate-200 dark:border-slate-800 last:border-r-0 relative select-none"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <div
                        key={slot}
                        style={{ height: `${SLOT_HEIGHT}px` }}
                        onDrop={() => handleDropSlot(dayStr, slot)}
                        onClick={() =>
                          handleSlotClick({
                            date: dayStr,
                            time: slot,
                          })
                        }
                        className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-rose-50/20 dark:hover:bg-rose-950/10 cursor-pointer transition-colors group flex items-start justify-end p-1"
                      >
                        <span className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-rose-500">
                          + {slot}
                        </span>
                      </div>
                    ))}

                    {positioned.map((pos) => {
                      const item = pos.booking;
                      const tot = item.items?.reduce((acc, it) => acc + (Number(it.prezzo) || 0) * (it.quantita || 1), 0) || 0;
                      const widthPercent = 100 / pos.totalLanes;
                      const leftPercent = pos.lane * widthPercent;

                      return (
                        <div
                          key={item.id}
                          draggable={isAdmin}
                          onDragStart={(e) => handleDragStart(e, item)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPrenotazione(item);
                          }}
                          style={{
                            top: `${pos.top}px`,
                            height: `${pos.height}px`,
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                          }}
                          className="absolute z-10 p-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md cursor-pointer transition-all overflow-hidden flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between text-[10px] font-black text-rose-600 dark:text-rose-400">
                            <span>{pos.span.displayStart}</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              € {tot.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                            {item.titolo || `Comanda #${item.id}`}
                          </div>
                          {item.items && item.items.length > 0 && (
                            <div className="text-[8px] text-slate-500 truncate">
                              {item.items.some((i) => i.tipo === 'prodotto')
                                ? `🍷 ${item.items.filter((i) => i.tipo === 'prodotto').map((i) => getProductTitle(i.id_item)).join(', ')}`
                                : `${item.items.length} portate`}
                            </div>
                          )}
                          <div className="text-[9px] text-slate-400 truncate">
                            {item.rubrica?.nome || 'Sala'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
