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
  Scissors,
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
  onSelectSlot: (slot: { date: string; time: string; staffId?: number | null }) => void;
  onEditPrenotazione: (prenotazione: PrenotazioneWithDetails) => void;
}

// Genera gli slot orari della giornata (08:00 - 20:30 ogni 30 min)
const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 20; h++) {
  const hh = String(h).padStart(2, '0');
  TIME_SLOTS.push(`${hh}:00`);
  if (h < 20) {
    TIME_SLOTS.push(`${hh}:30`);
  }
}

// Helper data formato ISO YYYY-MM-DD
function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Ottiene l'inizio della settimana (Lunedì)
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

  // Filtro operatore (null = tutti gli operatori in colonne parallele nel giorno)
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<number | 'tutti'>('tutti');

  // Feedback per spostamento / Drag & Drop
  const [moveNotice, setMoveNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Drag state
  const [draggedBooking, setDraggedBooking] = useState<PrenotazioneWithDetails | null>(null);

  // Helpers navigazione date
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

  const currentDateStr = formatDateISO(currentDate);

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

  // Lista operatori visibili nelle colonne
  const columnsStaff = useMemo(() => {
    if (selectedStaffFilter !== 'tutti') {
      const found = professionisti.find((p) => p.id === selectedStaffFilter);
      return found ? [found] : professionisti;
    }
    return professionisti.length > 0
      ? professionisti
      : [{ id: null, nome: 'Hub Generale', ruolo: 'Staff', colore: '#6366F1' }];
  }, [selectedStaffFilter, professionisti]);

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
          message: `Appuntamento spostato al ${date} alle ore ${time}!`,
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

    const timeFormatted = booking.tms_inizio
      ? new Date(booking.tms_inizio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    const dateFormatted = booking.tms_inizio
      ? new Date(booking.tms_inizio).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })
      : '';

    const text = encodeURIComponent(
      `Ciao ${booking.rubrica?.nome || 'Gentile Cliente'}, ti ricordiamo il tuo appuntamento per "${booking.titolo}" fissato per il ${dateFormatted} alle ore ${timeFormatted}. A presto!`
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
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header comandi Agenda */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Navigazione Date */}
        <div className="flex items-center gap-2">
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

          <h2 className="text-sm md:text-base font-extrabold capitalize text-slate-900 dark:text-white flex items-center gap-2 pl-2">
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
              onChange={(e) =>
                setSelectedStaffFilter(e.target.value === 'tutti' ? 'tutti' : Number(e.target.value))
              }
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="tutti">Tutti gli Operatori</option>
              {professionisti.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.ruolo})
                </option>
              ))}
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
        </div>
      </div>

      {/* Info bar e istruzioni drag & drop */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-2">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500" /> Clicca uno slot vuoto per creare
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-medium">
            <Move className="w-3 h-3 text-slate-400" /> Trascina un appuntamento per spostare l'orario
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Confermata</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> In Attesa</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Completata</span>
        </div>
      </div>

      {/* TABELLONE AGENDA: VISTA GIORNALIERA */}
      {subView === 'giorno' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header Colonne Operatori */}
              <div className="grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 sticky top-0 z-20"
                style={{ gridTemplateColumns: `80px repeat(${columnsStaff.length}, minmax(180px, 1fr))` }}
              >
                {/* Colonna Orario vuota in alto a sinistra */}
                <div className="p-3 text-center text-xs font-bold text-slate-400 border-r border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>

                {/* Intestazione per ciascun professionista */}
                {columnsStaff.map((staff) => (
                  <div
                    key={staff.id || 'hub'}
                    className="p-3 border-r border-slate-200/80 dark:border-slate-800 last:border-r-0 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: staff.colore || '#6366F1' }}
                      />
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[140px]">
                          {staff.nome}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                          {staff.ruolo}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectSlot({ date: currentDateStr, time: '09:00', staffId: staff.id })}
                      className="p-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors cursor-pointer"
                      title="Aggiungi appuntamento a questo operatore"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Corpo griglia slot orari */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {TIME_SLOTS.map((time) => (
                  <div
                    key={time}
                    className="grid min-h-[52px]"
                    style={{ gridTemplateColumns: `80px repeat(${columnsStaff.length}, minmax(180px, 1fr))` }}
                  >
                    {/* Indicatore Orario */}
                    <div className="p-2 border-r border-slate-200/80 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center bg-slate-50/40 dark:bg-slate-950/30 select-none">
                      {time}
                    </div>

                    {/* Celle Operatori */}
                    {columnsStaff.map((staff) => {
                      // Trova prenotazioni che iniziano esattamente in questo slot per questo operatore
                      const matchingBookings = prenotazioni.filter((p) => {
                        if (!p.tms_inizio) return false;
                        const bDate = p.tms_inizio.slice(0, 10);
                        if (bDate !== currentDateStr) return false;

                        // Verifica orario
                        const bTime = new Date(p.tms_inizio).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        if (bTime !== time) return false;

                        // Verifica operatore
                        if (staff.id !== null) {
                          return p.id_professionista === staff.id;
                        }
                        return true;
                      });

                      return (
                        <div
                          key={`${time}-${staff.id}`}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDropSlot(currentDateStr, time, staff.id)}
                          onClick={() => {
                            if (matchingBookings.length === 0) {
                              onSelectSlot({ date: currentDateStr, time, staffId: staff.id });
                            }
                          }}
                          className={`p-1 border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0 transition-colors relative group ${
                            matchingBookings.length === 0
                              ? 'hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer'
                              : 'bg-slate-50/20 dark:bg-slate-950/10'
                          }`}
                        >
                          {/* Pulsante veloce aggiungi quando vuoto */}
                          {matchingBookings.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-md shadow-xs">
                                + Prenota alle {time}
                              </span>
                            </div>
                          )}

                          {/* Prenotazioni per questo slot */}
                          <div className="space-y-1">
                            {matchingBookings.map((b) => {
                              const isConfermata = b.stato === 'confermata';
                              const isCompletata = b.stato === 'completata';
                              const isCancellata = b.stato === 'cancellata';

                              return (
                                <div
                                  key={b.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, b)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditPrenotazione(b);
                                  }}
                                  className={`p-2 rounded-xl border text-left shadow-xs transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${
                                    isCompletata
                                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800'
                                      : isConfermata
                                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800'
                                      : isCancellata
                                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 opacity-60 line-through'
                                      : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
                                  }`}
                                >
                                  {/* Titolo e durata */}
                                  <div className="flex items-start justify-between gap-1">
                                    <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                                      {b.titolo}
                                    </span>
                                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 shrink-0">
                                      € {Number(b.totale || 0).toFixed(2)}
                                    </span>
                                  </div>

                                  {/* Cliente & Telefono */}
                                  <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate flex items-center justify-between mt-1">
                                    <span className="truncate">
                                      👤 {b.rubrica ? `${b.rubrica.nome} ${b.rubrica.cognome || ''}` : 'Anonimo'}
                                    </span>

                                    {/* Azioni Rapide Contatto */}
                                    {b.rubrica?.telefono && (
                                      <div className="flex items-center gap-1 shrink-0 ml-1">
                                        <button
                                          type="button"
                                          onClick={(e) => callPhone(e, b.rubrica?.telefono)}
                                          className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 rounded-md text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                                          title={`Chiama ${b.rubrica.telefono}`}
                                        >
                                          <Phone className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => openWhatsApp(e, b)}
                                          className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 rounded-md text-emerald-600 dark:text-emerald-400 transition-colors"
                                          title="Invia promemoria WhatsApp"
                                        >
                                          <MessageCircle className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Items tag */}
                                  {b.items && b.items.length > 0 && (
                                    <div className="mt-1 flex items-center gap-1 text-[10px] text-indigo-600 dark:text-indigo-400 truncate">
                                      <Scissors className="w-2.5 h-2.5 shrink-0" />
                                      <span className="truncate">
                                        {b.items.length} {b.items.length === 1 ? 'servizio' : 'servizi'}
                                      </span>
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
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABELLONE AGENDA: VISTA SETTIMANALE */}
      {subView === 'settimana' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[850px]">
              {/* Header 7 Giorni della settimana */}
              <div
                className="grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 sticky top-0 z-20"
                style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
              >
                {/* Colonna orari */}
                <div className="p-3 text-center text-xs font-bold text-slate-400 border-r border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>

                {weekDays.map((day) => {
                  const dayStr = formatDateISO(day);
                  const isToday = dayStr === formatDateISO(new Date());

                  return (
                    <div
                      key={dayStr}
                      className={`p-3 border-r border-slate-200/80 dark:border-slate-800 last:border-r-0 text-center ${
                        isToday ? 'bg-indigo-50/60 dark:bg-indigo-950/40' : ''
                      }`}
                    >
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {day.toLocaleDateString('it-IT', { weekday: 'short' })}
                      </div>
                      <div
                        className={`text-sm font-black mt-0.5 inline-block px-2 py-0.5 rounded-full ${
                          isToday
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {day.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Corpo griglia slot settimanale */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {TIME_SLOTS.map((time) => (
                  <div
                    key={time}
                    className="grid min-h-[52px]"
                    style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}
                  >
                    {/* Indicatore Orario */}
                    <div className="p-2 border-r border-slate-200/80 dark:border-slate-800 text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center bg-slate-50/40 dark:bg-slate-950/30 select-none">
                      {time}
                    </div>

                    {/* Ciascuno dei 7 giorni */}
                    {weekDays.map((day) => {
                      const dayStr = formatDateISO(day);

                      // Trova prenotazioni che iniziano a quest'ora in questo giorno
                      const matchingBookings = prenotazioni.filter((p) => {
                        if (!p.tms_inizio) return false;
                        if (p.tms_inizio.slice(0, 10) !== dayStr) return false;

                        const bTime = new Date(p.tms_inizio).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        if (bTime !== time) return false;

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
                              selectedStaffFilter !== 'tutti' ? selectedStaffFilter : undefined
                            )
                          }
                          onClick={() => {
                            if (matchingBookings.length === 0) {
                              onSelectSlot({
                                date: dayStr,
                                time,
                                staffId: selectedStaffFilter !== 'tutti' ? selectedStaffFilter : undefined,
                              });
                            }
                          }}
                          className={`p-1 border-r border-slate-200/60 dark:border-slate-800/60 last:border-r-0 transition-colors relative group ${
                            matchingBookings.length === 0
                              ? 'hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer'
                              : 'bg-slate-50/20 dark:bg-slate-950/10'
                          }`}
                        >
                          {/* Bookings cards */}
                          <div className="space-y-1">
                            {matchingBookings.map((b) => {
                              const isConfermata = b.stato === 'confermata';
                              const isCompletata = b.stato === 'completata';
                              const isCancellata = b.stato === 'cancellata';

                              return (
                                <div
                                  key={b.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, b)}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditPrenotazione(b);
                                  }}
                                  className={`p-1.5 rounded-xl border text-left shadow-xs transition-all hover:shadow-md cursor-grab active:cursor-grabbing text-xs ${
                                    isCompletata
                                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800'
                                      : isConfermata
                                      ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800'
                                      : isCancellata
                                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 opacity-60 line-through'
                                      : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
                                  }`}
                                >
                                  <div className="font-extrabold text-slate-900 dark:text-white truncate">
                                    {b.titolo}
                                  </div>
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center justify-between">
                                    <span className="truncate">
                                      {b.rubrica?.nome || 'Anonimo'}
                                    </span>
                                    {b.rubrica?.telefono && (
                                      <div className="flex items-center gap-0.5 ml-1">
                                        <button
                                          type="button"
                                          onClick={(e) => callPhone(e, b.rubrica?.telefono)}
                                          className="p-0.5 hover:text-indigo-600"
                                        >
                                          <Phone className="w-2.5 h-2.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => openWhatsApp(e, b)}
                                          className="p-0.5 text-emerald-600 hover:text-emerald-700"
                                        >
                                          <MessageCircle className="w-2.5 h-2.5" />
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
