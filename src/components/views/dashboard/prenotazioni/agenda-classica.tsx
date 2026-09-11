'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
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
  prodotti?: any[];
  piatti?: any[];
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

// Formatta l'orario reale per visualizzazione (es. "09:15")
function getBookingDisplayTime(tms?: string | null): string {
  if (!tms) return '';
  const d = new Date(tms);
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Converte stringa orario "HH:MM" in minuti totali dall'inizio della giornata (es. "09:30" -> 570)
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Converte minuti totali in formato stringa "HH:MM" (es. 570 -> "09:30")
function minutesToTime(totalMinutes: number): string {
  const normalized = Math.max(0, totalMinutes);
  const h = Math.floor(normalized / 60) % 24;
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Calcola la durata effettiva in minuti di una prenotazione
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
  return 30; // Minimo default 30 minuti
}

// Costanti di rendering griglia oraria continua
export const TIME_SLOT_MINUTES = 30;
export const SLOT_HEIGHT = 60; // 60px per slot da 30 min -> 2.0px per minuto esatto
export const PIXELS_PER_MINUTE = SLOT_HEIGHT / TIME_SLOT_MINUTES; // 2.0
export const DAY_START_MINUTES = 7 * 60; // 07:00 (420 min)
export const DAY_END_MINUTES = 22 * 60 + 30; // 22:30 (1350 min)

// Restituisce i dettagli dell'arco temporale di una prenotazione
export interface BookingTimeSpan {
  startMinutes: number;
  endMinutes: number;
  duration: number;
  displayStart: string;
  displayEnd: string;
}

// Struttura posizionata sulla griglia continua
export interface PositionedBooking {
  booking: PrenotazioneWithDetails;
  span: BookingTimeSpan;
  lane: number;
  totalLanes: number;
  top: number;
  height: number;
}

// Algoritmo avanzato di partizionamento corsie per sovrapposizioni orarie
export function layoutBookingsInLanes(
  items: Array<{ booking: PrenotazioneWithDetails; span: BookingTimeSpan }>
): PositionedBooking[] {
  if (!items || items.length === 0) return [];

  // 1. Ordina per inizio crescente, poi per durata decrescente
  const sorted = [...items].sort((a, b) => {
    if (a.span.startMinutes !== b.span.startMinutes) {
      return a.span.startMinutes - b.span.startMinutes;
    }
    return b.span.endMinutes - a.span.endMinutes;
  });

  // 2. Raggruppa in componenti connesse (cluster di eventi sovrapposti)
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

  // 3. Per ciascun cluster assegna le corsie orizzontali senza collisioni
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
        const height = Math.max(durationMinutes * PIXELS_PER_MINUTE, 26);

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

// Converte un colore HEX in RGBA con trasparenza specifica
function hexToRgba(hex?: string | null, alpha = 1): string {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
    return `rgba(99, 102, 241, ${alpha})`;
  }
  let c = hex.substring(1);
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(99, 102, 241, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Risolve il colore associato al professionista (usando la colonna colore o l'elenco professionisti)
function resolveStaffColor(
  booking: PrenotazioneWithDetails,
  professionistiList: any[] = []
): string {
  if (booking.professionisti?.colore) return booking.professionisti.colore;
  if (booking.id_professionista) {
    const found = professionistiList.find((p) => p.id === booking.id_professionista);
    if (found?.colore) return found.colore;
  }
  return '#64748B'; // Default colore Hub / Non assegnato
}

// Risolve il nome dell'elemento da catalogo
function resolveItemTitle(it: any, servizi: any[], prodotti?: any[], piatti?: any[]): string {
  if (it.titolo) return it.titolo;
  if (it.tipo === 'servizio') {
    const s = servizi?.find((srv) => srv.id === it.id_item);
    if (s) return s.titolo;
  } else if (it.tipo === 'prodotto' && prodotti) {
    const p = prodotti.find((prod) => prod.id === it.id_item);
    if (p) return p.titolo;
  } else if (it.tipo === 'piatto' && piatti) {
    const pt = piatti.find((piat) => piat.id === it.id_item);
    if (pt) return pt.titolo;
  }
  return `${it.tipo.charAt(0).toUpperCase() + it.tipo.slice(1)} #${it.id_item}`;
}

// Rileva se una prenotazione è un ordine, piatto, prodotto o senza orario fisso
function isDishOrProductOrUntimed(p: PrenotazioneWithDetails): boolean {
  // Se non c'è timestamp valido di inizio, è forzatamente senza orario
  if (!p.tms_inizio) return true;

  // Se è esplicitamente marcato come ordine senza orario fisso
  if (p.ordini === true) return true;

  // Se ordini è false, è un appuntamento programmato con orario fisso (anche se contiene piatti o prodotti!)
  if (p.ordini === false) return false;

  // Fallback per record storici dove ordini è undefined:
  // Se è impostata a mezzanotte UTC senza tempo minuti, consideralo senza orario
  const d = new Date(p.tms_inizio);
  if (d.getUTCHours() === 12 && d.getUTCMinutes() === 0 && (!p.tempo_minuti || p.tempo_minuti === 0)) {
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
  clienti: _clienti,
  servizi,
  prodotti = [],
  piatti = [],
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

  // Orario corrente per linea guida realtime
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
                              {it.quantita}x {resolveItemTitle(it, servizi, prodotti, piatti)}
                            </span>
                            <span className="font-semibold shrink-0">€ {Number(it.prezzo).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer con contatti rapidi */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      {(() => {
                        const staffColor = resolveStaffColor(order, professionisti);
                        return (
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[140px] flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: staffColor }} />
                            <span className="truncate">{order.professionisti ? order.professionisti.nome : 'Hub Generale'}</span>
                          </span>
                        );
                      })()}
                      {phone && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => callPhone(e, phone)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-colors cursor-pointer"
                            title="Chiama"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => openWhatsApp(e, order)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-xl transition-colors cursor-pointer"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
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

      {/* SELETTORE RAPIDO OPERATORE (Ottimizzato per Smartphone & Tablet) */}
      {subView === 'giorno' && professionisti.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => setSelectedStaffFilter('tutti')}
            className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
              selectedStaffFilter === 'tutti'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
            }`}
          >
            <span>Tutti</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/20">
              {professionisti.length}
            </span>
          </button>

          {professionisti.map((p) => {
            const isSelected = selectedStaffFilter === p.id;
            const staffColor = p.colore || '#6366F1';
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedStaffFilter(p.id)}
                style={{
                  backgroundColor: isSelected ? staffColor : undefined,
                  borderColor: isSelected ? staffColor : undefined,
                }}
                className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                  isSelected
                    ? 'text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: isSelected ? '#FFFFFF' : staffColor }}
                />
                <span className="truncate">{p.nome}</span>
              </button>
            );
          })}

          {unassignedCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedStaffFilter('non_assegnato')}
              className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                selectedStaffFilter === 'non_assegnato'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              <span>🏢 Hub ({unassignedCount})</span>
            </button>
          )}
        </div>
      )}

      {/* VISTA 1: GIORNALIERA (ORARI SULLE RIGHE, OPERATORI SULLE COLONNE) */}
      {subView === 'giorno' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className={columnsStaff.length === 1 ? 'w-full min-w-0' : 'min-w-[650px] sm:min-w-[750px]'}>
              {/* Header Colonne Operatori */}
              <div
                className="grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 sticky top-0 z-10"
                style={{
                  gridTemplateColumns:
                    columnsStaff.length === 1
                      ? '70px 1fr'
                      : `75px repeat(${columnsStaff.length}, minmax(170px, 1fr))`,
                }}
              >
                <div className="p-3 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 text-center border-r border-slate-200 dark:border-slate-800 flex items-center justify-center sticky left-0 z-30 bg-slate-100 dark:bg-slate-900 shadow-xs">
                  <Clock className="w-3.5 h-3.5 mr-1" /> Ora
                </div>

                {columnsStaff.map((staff) => {
                  const staffColor = staff.colore || '#64748B';
                  return (
                    <div
                      key={staff.id ?? 'hub'}
                      className="p-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 flex items-center justify-center gap-2 relative"
                      style={{ borderTop: `3px solid ${staffColor}` }}
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: staffColor }}
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
                  );
                })}
              </div>

              {/* Corpo Griglia Oraria Continua */}
              <div
                className="grid relative"
                style={{
                  gridTemplateColumns:
                    columnsStaff.length === 1
                      ? '70px 1fr'
                      : `75px repeat(${columnsStaff.length}, minmax(170px, 1fr))`,
                  height: `${TIME_SLOTS.length * SLOT_HEIGHT}px`,
                }}
              >
                {/* Colonna Orari Sticky a Sinistra */}
                <div className="border-r border-slate-200/80 dark:border-slate-800 sticky left-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs select-none">
                  {TIME_SLOTS.map((time) => (
                    <div
                      key={time}
                      style={{ height: `${SLOT_HEIGHT}px` }}
                      className="p-1.5 border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-start justify-center pt-1.5 shadow-2xs"
                    >
                      {time}
                    </div>
                  ))}
                </div>

                {/* Colonne Operatori */}
                {columnsStaff.map((staff) => {
                  const staffColor = staff.colore || '#64748B';

                  // Filtra prenotazioni del giorno corrente per questo operatore
                  const relevantBookings = prenotazioni.filter((p) => {
                    if (!p.tms_inizio) return false;
                    if (isDishOrProductOrUntimed(p)) return false;

                    const bDate = getBookingLocalDate(p.tms_inizio);
                    if (bDate !== currentDateStr) return false;

                    if (staff.id !== null) {
                      return p.id_professionista === staff.id;
                    } else {
                      return !p.id_professionista;
                    }
                  });

                  // Calcola le prenotazioni con span e posizionamento corsie
                  const items = relevantBookings
                    .map((p) => {
                      const span = getBookingSpan(p);
                      if (!span) return null;
                      return { booking: p, span };
                    })
                    .filter(Boolean) as Array<{ booking: PrenotazioneWithDetails; span: BookingTimeSpan }>;

                  const positioned = layoutBookingsInLanes(items);
                  const isCurrentDayToday = currentDateStr === todayStr;

                  return (
                    <div
                      key={staff.id ?? 'hub'}
                      className="border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0 relative select-none"
                      style={{ height: `${TIME_SLOTS.length * SLOT_HEIGHT}px` }}
                    >
                      {/* Layer 1: Slot di background da 30 minuti con guida a 15 minuti */}
                      <div className="absolute inset-0 flex flex-col pointer-events-auto">
                        {TIME_SLOTS.map((time) => {
                          return (
                            <div
                              key={time}
                              style={{ height: `${SLOT_HEIGHT}px` }}
                              onDragOver={handleDragOver}
                              onDrop={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const offsetY = e.clientY - rect.top;
                                let targetTime = time;
                                if (offsetY >= 30) {
                                  targetTime = minutesToTime(timeToMinutes(time) + 15);
                                }
                                handleDropSlot(currentDateStr, targetTime, staff.id);
                              }}
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const offsetY = e.clientY - rect.top;
                                let clickedTime = time;
                                if (offsetY >= 30) {
                                  clickedTime = minutesToTime(timeToMinutes(time) + 15);
                                }
                                onSelectSlot({ date: currentDateStr, time: clickedTime, staffId: staff.id });
                              }}
                              className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/15 cursor-pointer relative group transition-colors"
                            >
                              {/* Linea tratteggiata per il quarto d'ora (15 minuti) a metà slot */}
                              <div className="absolute left-0 right-0 top-1/2 border-b border-dashed border-slate-200/50 dark:border-slate-800/40 pointer-events-none" />

                              {/* Prompt di aggiunta al passaggio del mouse */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0">
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md shadow-xs">
                                  + {time}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Layer 2: Indicatore linea rossa orario corrente (se oggi) */}
                      {isCurrentDayToday && nowMinutes >= DAY_START_MINUTES && nowMinutes <= DAY_END_MINUTES && (
                        <div
                          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                          style={{
                            top: `${(nowMinutes - DAY_START_MINUTES) * PIXELS_PER_MINUTE}px`,
                          }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs -ml-1.5 ring-2 ring-white dark:ring-slate-900" />
                          <div className="h-[2px] w-full bg-rose-500/85 shadow-xs" />
                        </div>
                      )}

                      {/* Layer 3: Prenotazioni continue (TUTTA LA SLOT UNICA SENZA DUPLICAZIONI) */}
                      <div className="absolute inset-0 pointer-events-none z-10">
                        {positioned.map(({ booking: b, span, lane, totalLanes, top, height }) => {
                          const isConfermata = b.stato === 'confermata';
                          const isCompletata = b.stato === 'completata';
                          const clientName = b.rubrica
                            ? `${b.rubrica.nome} ${b.rubrica.cognome || ''}`.trim()
                            : 'Cliente Anonimo';
                          const phone = b.rubrica?.telefono;
                          const hasDishes = b.items?.some((it) => it.tipo === 'piatto');
                          const hasProducts = b.items?.some((it) => it.tipo === 'prodotto');

                          const leftPercent = (lane / totalLanes) * 100;
                          const widthPercent = 100 / totalLanes;

                          const isQuarterHour = height <= 38;
                          const isHalfHour = height > 38 && height <= 68;

                          return (
                            <div
                              key={b.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, b)}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditPrenotazione(b);
                              }}
                              title={`${b.titolo || clientName} (${span.displayStart} - ${span.displayEnd}, ${span.duration}m). Clicca per modificare o trascina per spostare.`}
                              style={{
                                top: `${top + 1}px`,
                                height: `${height - 2}px`,
                                left: `calc(${leftPercent}% + 2px)`,
                                width: `calc(${widthPercent}% - 4px)`,
                                borderLeft: `4px solid ${staffColor}`,
                                backgroundColor: hexToRgba(staffColor, 0.12),
                              }}
                              className="absolute rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:z-30 transition-all cursor-grab active:cursor-grabbing pointer-events-auto overflow-hidden text-left"
                            >
                              {/* 1. LAYOUT COMPATTO: 15 MINUTI (Occupa solo il suo quarto d'ora, lasciando il resto libero) */}
                              {isQuarterHour ? (
                                <div className="h-full px-2 py-0.5 flex items-center justify-between gap-1 text-[10px] font-bold overflow-hidden">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="font-black font-mono px-1 py-0.5 rounded bg-white/90 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-700/60 text-[9px] shrink-0">
                                      {span.displayStart} - {span.displayEnd}
                                    </span>
                                    <span className="truncate text-slate-900 dark:text-slate-100 font-extrabold">
                                      {b.titolo || clientName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 text-[9px] font-mono opacity-80">
                                    <span>{span.duration}m</span>
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        isCompletata
                                          ? 'bg-emerald-500'
                                          : isConfermata
                                          ? 'bg-indigo-500'
                                          : 'bg-amber-500'
                                      }`}
                                    />
                                  </div>
                                </div>
                              ) : isHalfHour ? (
                                /* 2. LAYOUT MEDIO: 30 MINUTI */
                                <div className="h-full p-1.5 flex flex-col justify-between overflow-hidden">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1 shadow-2xs">
                                      <Clock className="w-2.5 h-2.5 shrink-0" style={{ color: staffColor }} />
                                      <span>{span.displayStart} - {span.displayEnd}</span>
                                      <span className="text-[9px] opacity-70 font-semibold font-mono">({span.duration}m)</span>
                                    </span>
                                    <div className="flex items-center gap-1">
                                      {hasDishes && <span title="Contiene Piatti">🍕</span>}
                                      {hasProducts && <span title="Contiene Prodotti">🛍️</span>}
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                          isCompletata
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                            : isConfermata
                                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                        }`}
                                      >
                                        {isCompletata ? 'Completata' : isConfermata ? 'Confermata' : 'Attesa'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between gap-1 mt-0.5">
                                    <div className="font-extrabold text-xs leading-tight truncate text-slate-900 dark:text-slate-100">
                                      {b.titolo || clientName}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100 shrink-0 font-mono">
                                      €{Number(b.totale || 0).toFixed(0)}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                /* 3. LAYOUT COMPLETO: 45+ MINUTI (Slot unica estesa fino alla fine) */
                                <div className="h-full p-2 flex flex-col justify-between overflow-hidden">
                                  <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1 shadow-2xs">
                                        <Clock className="w-2.5 h-2.5 shrink-0" style={{ color: staffColor }} />
                                        <span>{span.displayStart} - {span.displayEnd}</span>
                                        <span className="text-[9px] opacity-70 font-semibold font-mono">({span.duration}m)</span>
                                      </span>
                                      <div className="flex items-center gap-1">
                                        {hasDishes && <span title="Contiene Piatti">🍕</span>}
                                        {hasProducts && <span title="Contiene Prodotti">🛍️</span>}
                                        <Move className="w-3 h-3 opacity-40 hover:opacity-100 cursor-grab" />
                                      </div>
                                    </div>

                                    <div className="font-extrabold text-xs leading-tight truncate text-slate-900 dark:text-slate-100">
                                      {b.titolo || clientName}
                                    </div>
                                    <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                      <User className="w-2.5 h-2.5 shrink-0" />
                                      <span>{clientName}</span>
                                    </div>
                                  </div>

                                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100 font-mono">
                                      €{Number(b.totale || 0).toFixed(2)}
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                          isCompletata
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                            : isConfermata
                                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                        }`}
                                      >
                                        {isCompletata ? 'Completata' : isConfermata ? 'Confermata' : 'Attesa'}
                                      </span>

                                      {phone && (
                                        <div className="flex items-center gap-0.5">
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
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
                style={{ gridTemplateColumns: `75px repeat(7, minmax(130px, 1fr))` }}
              >
                <div className="p-3 text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400 text-center border-r border-slate-200 dark:border-slate-800 flex items-center justify-center sticky left-0 z-30 bg-slate-100 dark:bg-slate-900 shadow-xs">
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
                style={{ gridTemplateColumns: `75px repeat(7, minmax(130px, 1fr))` }}
              >
                <div className="p-2 border-r border-amber-200/80 dark:border-amber-900/50 text-[10px] font-bold text-amber-800 dark:text-amber-300 flex items-center justify-center text-center sticky left-0 z-20 bg-amber-100 dark:bg-amber-950 shadow-xs">
                  📦 Ordini
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

              {/* Corpo Griglia Settimanale Continua */}
              <div
                className="grid relative"
                style={{
                  gridTemplateColumns: `75px repeat(7, minmax(130px, 1fr))`,
                  height: `${TIME_SLOTS.length * SLOT_HEIGHT}px`,
                }}
              >
                {/* Indicatore Orario Sticky a Sinistra */}
                <div className="border-r border-slate-200/80 dark:border-slate-800 sticky left-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs select-none">
                  {TIME_SLOTS.map((time) => (
                    <div
                      key={time}
                      style={{ height: `${SLOT_HEIGHT}px` }}
                      className="p-1.5 border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-start justify-center pt-1.5 shadow-2xs"
                    >
                      {time}
                    </div>
                  ))}
                </div>

                {/* Ciascuno dei 7 giorni della settimana */}
                {weekDays.map((day) => {
                  const dayStr = getBookingLocalDate(day);
                  const isTodayDay = dayStr === todayStr;

                  // Filtra prenotazioni del giorno 'dayStr' in base a selectedStaffFilter
                  const relevantBookings = prenotazioni.filter((p) => {
                    if (!p.tms_inizio) return false;
                    if (isDishOrProductOrUntimed(p)) return false;

                    const bDate = getBookingLocalDate(p.tms_inizio);
                    if (bDate !== dayStr) return false;

                    if (selectedStaffFilter === 'non_assegnato') {
                      return !p.id_professionista;
                    }

                    if (selectedStaffFilter !== 'tutti') {
                      return p.id_professionista === selectedStaffFilter;
                    }

                    return true;
                  });

                  // Calcola le prenotazioni con span e posizionamento corsie
                  const items = relevantBookings
                    .map((p) => {
                      const span = getBookingSpan(p);
                      if (!span) return null;
                      return { booking: p, span };
                    })
                    .filter(Boolean) as Array<{ booking: PrenotazioneWithDetails; span: BookingTimeSpan }>;

                  const positioned = layoutBookingsInLanes(items);

                  return (
                    <div
                      key={dayStr}
                      className={`border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0 relative select-none ${
                        isTodayDay ? 'bg-indigo-50/15 dark:bg-indigo-950/10' : ''
                      }`}
                      style={{ height: `${TIME_SLOTS.length * SLOT_HEIGHT}px` }}
                    >
                      {/* Layer 1: Slot di background da 30 minuti con guida a 15 minuti */}
                      <div className="absolute inset-0 flex flex-col pointer-events-auto">
                        {TIME_SLOTS.map((time) => {
                          return (
                            <div
                              key={time}
                              style={{ height: `${SLOT_HEIGHT}px` }}
                              onDragOver={handleDragOver}
                              onDrop={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const offsetY = e.clientY - rect.top;
                                let targetTime = time;
                                if (offsetY >= 30) {
                                  targetTime = minutesToTime(timeToMinutes(time) + 15);
                                }
                                handleDropSlot(
                                  dayStr,
                                  targetTime,
                                  typeof selectedStaffFilter === 'number' ? selectedStaffFilter : undefined
                                );
                              }}
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const offsetY = e.clientY - rect.top;
                                let clickedTime = time;
                                if (offsetY >= 30) {
                                  clickedTime = minutesToTime(timeToMinutes(time) + 15);
                                }
                                onSelectSlot({
                                  date: dayStr,
                                  time: clickedTime,
                                  staffId:
                                    typeof selectedStaffFilter === 'number' ? selectedStaffFilter : undefined,
                                });
                              }}
                              className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/15 cursor-pointer relative group transition-colors"
                            >
                              {/* Linea tratteggiata per il quarto d'ora a metà slot */}
                              <div className="absolute left-0 right-0 top-1/2 border-b border-dashed border-slate-200/50 dark:border-slate-800/40 pointer-events-none" />

                              {/* Prompt rapido al passaggio del mouse */}
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0">
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded-md shadow-xs">
                                  + {time}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Layer 2: Indicatore linea rossa orario corrente (se giorno odierno) */}
                      {isTodayDay && nowMinutes >= DAY_START_MINUTES && nowMinutes <= DAY_END_MINUTES && (
                        <div
                          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                          style={{
                            top: `${(nowMinutes - DAY_START_MINUTES) * PIXELS_PER_MINUTE}px`,
                          }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs -ml-1.5 ring-2 ring-white dark:ring-slate-900" />
                          <div className="h-[2px] w-full bg-rose-500/85 shadow-xs" />
                        </div>
                      )}

                      {/* Layer 3: Prenotazioni continue (TUTTA LA SLOT UNICA SENZA DUPLICAZIONI) */}
                      <div className="absolute inset-0 pointer-events-none z-10">
                        {positioned.map(({ booking: b, span, lane, totalLanes, top, height }) => {
                          const staffColor = resolveStaffColor(b, professionisti);
                          const staffName =
                            b.professionisti?.nome ||
                            (b.id_professionista
                              ? professionisti.find((p) => p.id === b.id_professionista)?.nome
                              : 'Hub');
                          const clientName = b.rubrica
                            ? `${b.rubrica.nome} ${b.rubrica.cognome || ''}`.trim()
                            : 'Cliente';
                          const phone = b.rubrica?.telefono;
                          const hasDishes = b.items?.some((it) => it.tipo === 'piatto');
                          const hasProducts = b.items?.some((it) => it.tipo === 'prodotto');

                          const leftPercent = (lane / totalLanes) * 100;
                          const widthPercent = 100 / totalLanes;

                          const isQuarterHour = height <= 38;
                          const isHalfHour = height > 38 && height <= 68;

                          return (
                            <div
                              key={b.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, b)}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditPrenotazione(b);
                              }}
                              title={`${b.titolo || clientName} (${staffName}) - ${span.displayStart} - ${span.displayEnd} (${span.duration}m). Clicca per modificare o trascina per spostare.`}
                              style={{
                                top: `${top + 1}px`,
                                height: `${height - 2}px`,
                                left: `calc(${leftPercent}% + 2px)`,
                                width: `calc(${widthPercent}% - 4px)`,
                                borderLeft: `4px solid ${staffColor}`,
                                backgroundColor: hexToRgba(staffColor, 0.12),
                              }}
                              className="absolute rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:z-30 transition-all cursor-grab active:cursor-grabbing pointer-events-auto overflow-hidden text-left"
                            >
                              {/* 1. LAYOUT COMPATTO: 15 MINUTI (Occupa solo il suo quarto d'ora, lasciando il resto libero) */}
                              {isQuarterHour ? (
                                <div className="h-full px-1.5 py-0.5 flex items-center justify-between gap-1 text-[10px] font-bold overflow-hidden">
                                  <div className="flex items-center gap-1 truncate">
                                    <span className="font-black font-mono text-[9px] shrink-0 text-slate-800 dark:text-slate-200">
                                      {span.displayStart}
                                    </span>
                                    <span className="truncate text-slate-900 dark:text-slate-100 font-extrabold text-[10px]">
                                      {b.titolo || clientName}
                                    </span>
                                  </div>
                                  <span className="text-[9px] opacity-75 shrink-0 font-mono">
                                    {span.duration}m
                                  </span>
                                </div>
                              ) : isHalfHour ? (
                                /* 2. LAYOUT MEDIO: 30 MINUTI */
                                <div className="h-full p-1.5 flex flex-col justify-between overflow-hidden">
                                  <div className="flex items-center justify-between gap-1 text-[10px] font-black">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5 shrink-0" style={{ color: staffColor }} />
                                      <span>{span.displayStart} - {span.displayEnd}</span>
                                    </span>
                                    <span className="text-[9px] opacity-70 font-semibold font-mono">
                                      {span.duration}m
                                    </span>
                                  </div>

                                  <div className="font-extrabold text-[11px] leading-tight truncate text-slate-900 dark:text-slate-100">
                                    {b.titolo || clientName}
                                  </div>

                                  <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate flex items-center justify-between leading-none">
                                    <span className="truncate">{clientName}</span>
                                    <span className="font-bold text-[9px] text-slate-800 dark:text-slate-200 font-mono">
                                      €{Number(b.totale || 0).toFixed(0)}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                /* 3. LAYOUT COMPLETO: 45+ MINUTI (Slot unica estesa fino alla fine) */
                                <div className="h-full p-2 flex flex-col justify-between overflow-hidden">
                                  <div>
                                    <div className="flex items-center justify-between text-[10px] font-black mb-1">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-2.5 h-2.5 shrink-0" style={{ color: staffColor }} />
                                        <span>{span.displayStart} - {span.displayEnd}</span>
                                      </span>
                                      <div className="flex items-center gap-1">
                                        {hasDishes && <span title="Piatto">🍕</span>}
                                        {hasProducts && <span title="Prodotto">🛍️</span>}
                                        <span className="text-[9px] opacity-70 font-semibold font-mono">
                                          {span.duration}m
                                        </span>
                                      </div>
                                    </div>

                                    {/* Badge Staff (se visualizziamo tutti gli operatori) */}
                                    {selectedStaffFilter === 'tutti' && staffName && (
                                      <div className="mb-1">
                                        <span
                                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 max-w-full"
                                          style={{
                                            backgroundColor: hexToRgba(staffColor, 0.18),
                                            color: staffColor,
                                          }}
                                        >
                                          <span
                                            className="w-1.5 h-1.5 rounded-full shrink-0"
                                            style={{ backgroundColor: staffColor }}
                                          />
                                          <span className="truncate">{staffName}</span>
                                        </span>
                                      </div>
                                    )}

                                    <div className="font-extrabold text-[11px] leading-tight truncate text-slate-900 dark:text-slate-100">
                                      {b.titolo || clientName}
                                    </div>
                                    <div className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                                      {clientName}
                                    </div>
                                  </div>

                                  <div className="mt-1 pt-1 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between text-[10px]">
                                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                                      €{Number(b.totale || 0).toFixed(0)}
                                    </span>

                                    {phone && (
                                      <div className="flex items-center gap-0.5 ml-1">
                                        <button
                                          type="button"
                                          onClick={(e) => callPhone(e, phone)}
                                          className="p-0.5 hover:bg-white/80 dark:hover:bg-slate-900 rounded cursor-pointer"
                                          title="Chiama al telefono"
                                        >
                                          <Phone className="w-2.5 h-2.5 text-indigo-600 dark:text-indigo-400" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => openWhatsApp(e, b)}
                                          className="p-0.5 hover:bg-white/80 dark:hover:bg-slate-900 rounded cursor-pointer"
                                          title="Invia promemoria WhatsApp"
                                        >
                                          <MessageCircle className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
