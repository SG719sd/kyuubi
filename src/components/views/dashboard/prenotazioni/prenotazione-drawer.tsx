'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  CalendarCheck,
  Clock,
  User,
  Scissors,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  upsertPrenotazioneAction,
  deletePrenotazioneAction,
  calcolaSlotDisponibiliAction,
} from '@/server/actions/prenotazioni.actions';
import { PrenotazioneWithDetails } from '@/server/repositories/prenotazioni.repository';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  hubId: string;
  hubSlug: string;
  initialData?: PrenotazioneWithDetails | null;
  professionisti: any[];
  clienti: any[];
  servizi: any[];
  prodotti: any[];
  piatti: any[];
}

interface ItemLine {
  id_item: number;
  tipo: 'servizio' | 'prodotto' | 'piatto';
  titolo: string;
  quantita: number;
  prezzo: number;
  tempo_minuti: number;
  note?: string;
}

export default function PrenotazioneDrawer({
  isOpen,
  onClose,
  hubId,
  hubSlug,
  initialData,
  professionisti,
  clienti,
  servizi,
  prodotti,
  piatti,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [titolo, setTitolo] = useState('');
  const [note, setNote] = useState('');
  const [stato, setStato] = useState<'pending' | 'confermata' | 'completata' | 'cancellata'>('pending');

  // Date and Time
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('09:00');

  // Selected items list
  const [items, setItems] = useState<ItemLine[]>([]);

  // Item selector state
  const [itemTypeToAdd, setItemTypeToAdd] = useState<'servizio' | 'prodotto' | 'piatto'>('servizio');
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string>('');

  // Available slots preview
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Initialize form
  useEffect(() => {
    if (initialData) {
      setSelectedClienteId(initialData.id_rubrica || null);
      setSelectedStaffId(initialData.id_professionista || null);
      setTitolo(initialData.titolo || '');
      setNote(initialData.note || '');
      setStato((initialData.stato as any) || 'pending');

      if (initialData.tms_inizio) {
        const d = new Date(initialData.tms_inizio);
        setDateStr(d.toISOString().slice(0, 10));
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        setTimeStr(`${hours}:${minutes}`);
      } else {
        setDateStr(new Date().toISOString().slice(0, 10));
        setTimeStr('09:00');
      }

      // Map items
      if (initialData.items && initialData.items.length > 0) {
        const mappedItems: ItemLine[] = initialData.items.map((it) => {
          let itemTitle = `Elemento #${it.id_item}`;
          if (it.tipo === 'servizio') {
            const f = servizi.find((s) => s.id === it.id_item);
            if (f) itemTitle = f.titolo;
          } else if (it.tipo === 'prodotto') {
            const f = prodotti.find((p) => p.id === it.id_item);
            if (f) itemTitle = f.titolo;
          } else if (it.tipo === 'piatto') {
            const f = piatti.find((p) => p.id === it.id_item);
            if (f) itemTitle = f.titolo;
          }

          return {
            id_item: it.id_item,
            tipo: it.tipo as any,
            titolo: itemTitle,
            quantita: it.quantita || 1,
            prezzo: it.prezzo || 0,
            tempo_minuti: it.tempo_minuti || 0,
            note: it.note || '',
          };
        });
        setItems(mappedItems);
      } else {
        setItems([]);
      }
    } else {
      // Create new
      setSelectedClienteId(null);
      setSelectedStaffId(professionisti.length > 0 ? professionisti[0].id : null);
      setTitolo('');
      setNote('');
      setStato('pending');
      setDateStr(new Date().toISOString().slice(0, 10));
      setTimeStr('09:00');
      setItems([]);
    }

    setErrorMsg(null);
    setAvailableSlots([]);
  }, [initialData, isOpen, professionisti, servizi, prodotti, piatti]);

  // Compute total duration and price
  const totalMinutes = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.tempo_minuti || 0) * it.quantita, 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.prezzo || 0) * it.quantita, 0);
  }, [items]);

  // Calculated End Time
  const calculatedEndTime = useMemo(() => {
    if (!dateStr || !timeStr) return '';
    try {
      const [h, m] = timeStr.split(':').map(Number);
      const start = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
      const end = new Date(start.getTime() + Math.max(totalMinutes, 15) * 60 * 1000);
      return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '';
    }
  }, [dateStr, timeStr, totalMinutes]);

  // Handle adding an item to the list
  const handleAddItem = () => {
    if (!selectedCatalogItemId) return;
    const itemId = Number(selectedCatalogItemId);

    if (itemTypeToAdd === 'servizio') {
      const found = servizi.find((s) => s.id === itemId);
      if (found) {
        setItems((prev) => [
          ...prev,
          {
            id_item: found.id,
            tipo: 'servizio',
            titolo: found.titolo,
            quantita: 1,
            prezzo: Number(found.prezzo) || 0,
            tempo_minuti: Number(found.tempo_minuti) || 30,
          },
        ]);
      }
    } else if (itemTypeToAdd === 'prodotto') {
      const found = prodotti.find((p) => p.id === itemId);
      if (found) {
        setItems((prev) => [
          ...prev,
          {
            id_item: found.id,
            tipo: 'prodotto',
            titolo: found.titolo,
            quantita: 1,
            prezzo: Number(found.prezzo_listino || found.prezzo_nuovo) || 0,
            tempo_minuti: Number(found.tempo_minuti) || 0,
          },
        ]);
      }
    } else if (itemTypeToAdd === 'piatto') {
      const found = piatti.find((p) => p.id === itemId);
      if (found) {
        setItems((prev) => [
          ...prev,
          {
            id_item: found.id,
            tipo: 'piatto',
            titolo: found.titolo,
            quantita: 1,
            prezzo: Number(found.prezzo) || 0,
            tempo_minuti: Number(found.tempo_minuti) || 0,
          },
        ]);
      }
    }

    setSelectedCatalogItemId('');
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemQuantity = (index: number, q: number) => {
    if (q < 1) return;
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, quantita: q } : it))
    );
  };

  const handleUpdateItemPrice = (index: number, price: number) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, prezzo: price } : it))
    );
  };

  // Check slots
  const handleCheckAvailableSlots = async () => {
    if (!dateStr) return;
    setSlotsLoading(true);
    const res = await calcolaSlotDisponibiliAction({
      id_hub: hubId,
      data: dateStr,
      id_professionista: selectedStaffId || undefined,
      durata_minuti_override: Math.max(totalMinutes, 15),
    });

    if (res.success && res.data) {
      setAvailableSlots(res.data.slotLiberi.map((s: any) => s.inizio));
    }
    setSlotsLoading(false);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (items.length === 0) {
      setErrorMsg('Aggiungi almeno un servizio, prodotto o piatto alla prenotazione');
      return;
    }

    if (!dateStr || !timeStr) {
      setErrorMsg('Seleziona data e ora di inizio');
      return;
    }

    // Build ISO timestamp
    const [h, m] = timeStr.split(':').map(Number);
    const startObj = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);

    // Customer name default for title if not typed
    let generatedTitle = titolo.trim();
    if (!generatedTitle) {
      if (selectedClienteId) {
        const cli = clienti.find((c) => c.id === selectedClienteId);
        if (cli) generatedTitle = `Prenotazione: ${cli.nome} ${cli.cognome || ''}`.trim();
      } else {
        generatedTitle = `Prenotazione ${items[0].titolo}`;
      }
    }

    const payload = {
      id: initialData ? initialData.id : undefined,
      id_hub: hubId,
      id_professionista: selectedStaffId || null,
      id_rubrica: selectedClienteId || null,
      titolo: generatedTitle,
      note: note.trim() || null,
      stato,
      agenda: true,
      ordini: items.some((i) => i.tipo === 'prodotto' || i.tipo === 'piatto'),
      tms_inizio: startObj.toISOString(),
      items: items.map((it) => ({
        id_item: it.id_item,
        tipo: it.tipo,
        quantita: it.quantita,
        prezzo: it.prezzo,
        tempo_minuti: it.tempo_minuti,
        note: it.note || null,
        pagamento: false,
        nuovo: true,
      })),
    };

    startTransition(async () => {
      const res = await upsertPrenotazioneAction(payload as any, hubSlug);
      if (res.success) {
        router.refresh();
        onClose();
      } else {
        setErrorMsg(res.error || 'Errore durante il salvataggio');
      }
    });
  };

  const handleDelete = async () => {
    if (!initialData) return;
    if (!confirm('Sei sicuro di voler cancellare questa prenotazione?')) return;

    startTransition(async () => {
      const res = await deletePrenotazioneAction(initialData.id, hubId, hubSlug);
      if (res.success) {
        router.refresh();
        onClose();
      } else {
        setErrorMsg(res.error || "Errore durante l'eliminazione");
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        
        {/* Header Drawer */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialData ? 'Modifica Prenotazione' : 'Nuova Prenotazione'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {initialData ? `ID #${initialData.id}` : 'Inserisci i dettagli dell\'appuntamento'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form id="prenotazione-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Sezione Cliente & Operatore */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Cliente da Rubrica */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Cliente (Rubrica)
                </label>
                <select
                  value={selectedClienteId || ''}
                  onChange={(e) => setSelectedClienteId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">-- Seleziona o lascia vuoto --</option>
                  {clienti.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.cognome || ''} {c.telefono ? `(${c.telefono})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Staff / Operatore */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  Operatore Assegnato
                </label>
                <select
                  value={selectedStaffId || ''}
                  onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">-- Nessun operatore specifico --</option>
                  {professionisti.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} ({p.ruolo})
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* Titolo e Stato */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Titolo Appuntamento / Note Rapide
                </label>
                <input
                  type="text"
                  placeholder="Es. Taglio + Barba Marco"
                  value={titolo}
                  onChange={(e) => setTitolo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Stato
                </label>
                <select
                  value={stato}
                  onChange={(e) => setStato(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="pending">⏳ In attesa (Pending)</option>
                  <option value="confermata">✅ Confermata</option>
                  <option value="completata">🎉 Completata</option>
                  <option value="cancellata">❌ Cancellata</option>
                </select>
              </div>
            </div>

            {/* Data e Orario */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Pianificazione Oraria
                </span>
                <button
                  type="button"
                  onClick={handleCheckAvailableSlots}
                  disabled={slotsLoading || !dateStr}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  {slotsLoading ? 'Verifica slot...' : 'Mostra Slot Liberi'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Giorno
                  </label>
                  <input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Ora Inizio
                  </label>
                  <input
                    type="time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Fine Prevista (Calc.)
                  </label>
                  <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                    <span>{calculatedEndTime || '--:--'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({totalMinutes} min)</span>
                  </div>
                </div>
              </div>

              {/* Slot picker chips */}
              {availableSlots.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Slot liberi suggeriti:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTimeStr(slot)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                          timeStr === slot
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sezione Selezione Items (Servizi, Prodotti, Piatti) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-slate-400" />
                  Elementi & Servizi Inclusi
                </h3>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {items.length} {items.length === 1 ? 'elemento' : 'elementi'}
                </span>
              </div>

              {/* Barra aggiunta item */}
              <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                {/* Tipo Item */}
                <select
                  value={itemTypeToAdd}
                  onChange={(e) => {
                    setItemTypeToAdd(e.target.value as any);
                    setSelectedCatalogItemId('');
                  }}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-white"
                >
                  <option value="servizio">🛠️ Servizio</option>
                  <option value="prodotto">🛍️ Prodotto</option>
                  <option value="piatto">🍽️ Menù / Piatto</option>
                </select>

                {/* Dropdown specifico del catalogo */}
                <select
                  value={selectedCatalogItemId}
                  onChange={(e) => setSelectedCatalogItemId(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                >
                  <option value="">-- Seleziona dal catalogo --</option>
                  {itemTypeToAdd === 'servizio' &&
                    servizi.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.titolo} • € {Number(s.prezzo).toFixed(2)} ({s.tempo_minuti} min)
                      </option>
                    ))}
                  {itemTypeToAdd === 'prodotto' &&
                    prodotti.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.titolo} • € {Number(p.prezzo_listino || p.prezzo_nuovo).toFixed(2)}
                      </option>
                    ))}
                  {itemTypeToAdd === 'piatto' &&
                    piatti.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.titolo} • € {Number(p.prezzo).toFixed(2)}
                      </option>
                    ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedCatalogItemId}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Aggiungi
                </button>
              </div>

              {/* Lista Items Selezionati */}
              {items.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-400">
                  Nessun servizio o prodotto inserito. Usa il selettore in alto per aggiungerne.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-md ${
                            item.tipo === 'servizio'
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : item.tipo === 'prodotto'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {item.tipo}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.titolo}
                          </span>
                        </div>
                        {item.tempo_minuti > 0 && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {item.tempo_minuti * item.quantita} min
                          </span>
                        )}
                      </div>

                      {/* Quantità e Prezzo */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(idx, item.quantita - 1)}
                            className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center hover:bg-slate-200"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-5 text-center text-slate-900 dark:text-white">
                            {item.quantita}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(idx, item.quantita + 1)}
                            className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center hover:bg-slate-200"
                          >
                            +
                          </button>
                        </div>

                        <div className="w-16 text-right">
                          <input
                            type="number"
                            step="0.5"
                            value={item.prezzo}
                            onChange={(e) => handleUpdateItemPrice(idx, parseFloat(e.target.value) || 0)}
                            className="w-full px-1.5 py-0.5 text-right bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-xs font-bold text-slate-900 dark:text-white"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          title="Rimuovi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Note & Riepilogo */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Note Interne
              </label>
              <textarea
                rows={2}
                placeholder="Preferenze cliente, richieste particolari..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Box Totale e Statistiche */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  Durata Totale Stimata
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {totalMinutes} minuti
                </span>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  Totale Prenotazione
                </span>
                <span className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  € {totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

          </form>
        </div>

        {/* Footer Buttons */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          {initialData ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all"
            >
              Cancella Prenotazione
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            >
              Annulla
            </button>
            <button
              type="submit"
              form="prenotazione-form"
              disabled={isPending}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
            >
              {isPending ? 'Salvataggio...' : initialData ? 'Aggiorna' : 'Crea Prenotazione'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
