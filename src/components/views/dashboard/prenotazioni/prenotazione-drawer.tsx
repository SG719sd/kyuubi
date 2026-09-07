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
  Phone,
  MessageCircle,
  Mail,
  Copy,
  Check,
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
  initialDate?: string;
  initialTime?: string;
  initialStaffId?: number | null;
  initialSenzaOrario?: boolean;
  initialItemType?: 'servizio' | 'prodotto' | 'piatto';
  professionisti: any[];
  professionistiServizi?: any[];
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
  initialDate,
  initialTime,
  initialStaffId,
  initialSenzaOrario = false,
  initialItemType,
  professionisti,
  professionistiServizi = [],
  clienti,
  servizi,
  prodotti,
  piatti,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Form states
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [titolo, setTitolo] = useState('');
  const [note, setNote] = useState('');
  const [stato, setStato] = useState<'pending' | 'confermata' | 'completata' | 'cancellata'>('pending');

  // Date and Time
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('09:00');
  const [senzaOrario, setSenzaOrario] = useState(false);

  // Selected items list
  const [items, setItems] = useState<ItemLine[]>([]);

  // Item selector state
  const [itemTypeToAdd, setItemTypeToAdd] = useState<'servizio' | 'prodotto' | 'piatto'>('servizio');
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string>('');

  // Available slots preview
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotMessage, setSlotMessage] = useState<string | null>(null);

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
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        setDateStr(`${y}-${m}-${day}`);
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
        // Se ordini è true oppure manca tms_inizio è senza orario fisso
        const isUntimed = Boolean(initialData.ordini) || !initialData.tms_inizio;
        setSenzaOrario(isUntimed);
      } else {
        setItems([]);
        setSenzaOrario(Boolean(initialData.ordini));
      }
    } else {
      // Create new: usa i parametri di inizializzazione se passati da click su slot
      setSelectedClienteId(null);
      setSelectedStaffId(
        initialStaffId !== undefined
          ? initialStaffId
          : professionisti.length > 0
          ? professionisti[0].id
          : null
      );
      setTitolo('');
      setNote('');
      setStato('pending');
      setDateStr(initialDate || new Date().toISOString().slice(0, 10));
      setTimeStr(initialTime || '09:00');
      setSenzaOrario(Boolean(initialSenzaOrario));
      if (initialItemType) {
        setItemTypeToAdd(initialItemType);
      }
      setItems([]);
    }

    setErrorMsg(null);
    setAvailableSlots([]);
    setSlotMessage(null);
  }, [initialData, isOpen, initialDate, initialTime, initialStaffId, initialSenzaOrario, initialItemType, professionisti, servizi, prodotti, piatti]);

  // Filtro Servizi dedicati per l'operatore selezionato
  const availableServizi = useMemo(() => {
    if (selectedStaffId && professionistiServizi && professionistiServizi.length > 0) {
      const staffAssocs = professionistiServizi.filter(
        (ps) => Number(ps.id_professionista) === Number(selectedStaffId) && ps.is_active !== false
      );

      // Se il professionista ha una configurazione specifica di servizi
      if (staffAssocs.length > 0) {
        return staffAssocs.map((assoc) => {
          const baseServizio = servizi.find((s) => s.id === assoc.id_servizio);
          const customPrezzo =
            assoc.prezzo_personalizzato !== null && assoc.prezzo_personalizzato !== undefined
              ? Number(assoc.prezzo_personalizzato)
              : Number(baseServizio?.prezzo || 0);
          const customTempo =
            assoc.tempo_minuti_personalizzato !== null &&
            assoc.tempo_minuti_personalizzato !== undefined
              ? Number(assoc.tempo_minuti_personalizzato)
              : Number(baseServizio?.tempo_minuti || 30);

          return {
            id: assoc.id_servizio,
            titolo: baseServizio?.titolo || `Servizio #${assoc.id_servizio}`,
            prezzo: customPrezzo,
            tempo_minuti: customTempo,
            isCustomized:
              assoc.prezzo_personalizzato !== null || assoc.tempo_minuti_personalizzato !== null,
          };
        });
      }
    }

    // Fallback: nessun servizio specifico configurato per il professionista -> prendi tutti i servizi dell'Hub
    return servizi.map((s) => ({
      ...s,
      isCustomized: false,
    }));
  }, [selectedStaffId, professionistiServizi, servizi]);

  // Cliente attualmente collegato o selezionato
  const currentClient = useMemo(() => {
    if (selectedClienteId) {
      return clienti.find((c) => c.id === selectedClienteId) || null;
    }
    if (initialData?.rubrica) {
      return initialData.rubrica;
    }
    return null;
  }, [selectedClienteId, clienti, initialData]);

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

  // Modifica rapida della durata totale (es. 45 min invece di 60)
  const applyTotalDuration = (targetDuration: number) => {
    const clamped = Math.max(5, targetDuration);
    if (items.length === 0) return;

    if (items.length === 1) {
      const qta = Math.max(1, items[0].quantita);
      setItems((prev) => [
        { ...prev[0], tempo_minuti: Math.round(clamped / qta) }
      ]);
    } else {
      // Se ci sono servizi, applica la modifica al primo servizio, altrimenti al primo item
      const serviceIdx = items.findIndex((it) => it.tipo === 'servizio');
      const targetIdx = serviceIdx !== -1 ? serviceIdx : 0;

      const otherDuration = items.reduce((sum, it, idx) => {
        if (idx === targetIdx) return sum;
        return sum + (it.tempo_minuti || 0) * (it.quantita || 1);
      }, 0);

      const remainingForTarget = Math.max(5, clamped - otherDuration);
      const qta = Math.max(1, items[targetIdx].quantita);

      setItems((prev) =>
        prev.map((it, idx) =>
          idx === targetIdx
            ? { ...it, tempo_minuti: Math.round(remainingForTarget / qta) }
            : it
        )
      );
    }
  };

  // Modifica durata digitando l'orario di fine desiderato
  const handleEndTimeChange = (newEndTime: string) => {
    if (!newEndTime || !timeStr) return;
    try {
      const [startH, startM] = timeStr.split(':').map(Number);
      const [endH, endM] = newEndTime.split(':').map(Number);
      let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      if (diffMinutes < 0) diffMinutes += 24 * 60;
      if (diffMinutes <= 0) diffMinutes = 15;
      applyTotalDuration(diffMinutes);
    } catch (err) {
      console.error('Errore calcolo durata da orario fine:', err);
    }
  };

  // Handle adding an item to the list
  const handleAddItem = () => {
    if (!selectedCatalogItemId) return;
    const itemId = Number(selectedCatalogItemId);

    if (itemTypeToAdd === 'servizio') {
      const found = availableServizi.find((s) => s.id === itemId);
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

  const handleUpdateItemDuration = (index: number, minutes: number) => {
    const clamped = Math.max(0, minutes);
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, tempo_minuti: clamped } : it))
    );
  };

  // Check slots
  const handleCheckAvailableSlots = async () => {
    if (!dateStr) return;
    setSlotsLoading(true);
    setSlotMessage(null);

    const res = await calcolaSlotDisponibiliAction({
      id_hub: hubId,
      data: dateStr,
      id_professionista: selectedStaffId || undefined,
      durata_minuti_override: Math.max(totalMinutes, 15),
    });

    if (res.success && res.data) {
      if (!res.data.aperto) {
        setAvailableSlots([]);
        setSlotMessage(res.data.motivo || 'Chiuso nel giorno selezionato');
      } else {
        setAvailableSlots(res.data.slotLiberi.map((s: any) => s.inizio));
        if (res.data.slotLiberi.length === 0) {
          setSlotMessage('Nessuno slot libero disponibile per la durata richiesta');
        }
      }
    } else {
      setSlotMessage(res.error || 'Impossibile calcolare gli slot');
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

    if (!dateStr) {
      setErrorMsg('Seleziona la data dell\'appuntamento o ordine');
      return;
    }

    if (!senzaOrario && !timeStr) {
      setErrorMsg('Seleziona l\'ora di inizio oppure attiva "Senza orario fisso"');
      return;
    }

    // Build ISO timestamp
    let startISO: string;
    if (senzaOrario) {
      startISO = new Date(`${dateStr}T12:00:00.000Z`).toISOString();
    } else {
      const [h, m] = timeStr.split(':').map(Number);
      startISO = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`).toISOString();
    }

    // Customer name default for title if not typed
    let generatedTitle = titolo.trim();
    if (!generatedTitle) {
      if (selectedClienteId) {
        const cli = clienti.find((c) => c.id === selectedClienteId);
        if (cli) generatedTitle = `${senzaOrario ? 'Ordine' : 'Prenotazione'}: ${cli.nome} ${cli.cognome || ''}`.trim();
      } else {
        generatedTitle = `${senzaOrario ? 'Ordine' : 'Prenotazione'} ${items[0].titolo}`;
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
      ordini: Boolean(senzaOrario),
      tms_inizio: startISO,
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

  // Helper Contatti Rapidi
  const handleCopyPhone = () => {
    if (currentClient?.telefono) {
      navigator.clipboard.writeText(currentClient.telefono);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const getWhatsAppLink = () => {
    if (!currentClient?.telefono) return '#';
    let cleanTel = currentClient.telefono.replace(/[^\d+]/g, '').replace(/^00/, '+');
    if (!cleanTel.startsWith('+')) {
      cleanTel = `+39${cleanTel}`;
    }
    const cleanNum = cleanTel.replace('+', '');
    const serviceName = items.length > 0 ? items[0].titolo : (titolo || 'appuntamento');
    const msg = encodeURIComponent(
      `Ciao ${currentClient.nome}, ti ricordiamo il tuo appuntamento per "${serviceName}" fissato per il ${dateStr} alle ore ${timeStr}. Per qualsiasi informazione siamo a tua completa disposizione!`
    );
    return `https://wa.me/${cleanNum}?text=${msg}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
        
        {/* Header Drawer */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {initialData ? 'Dettagli & Modifica Prenotazione' : 'Nuova Prenotazione'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {initialData ? `ID #${initialData.id}` : 'Inserisci i dettagli e gli slot orari'}
              </p>
            </div>
          </div>
          <button
            type="button"
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

            {/* SEZIONE CONTATTI RAPIDI CLIENTE */}
            {currentClient && (currentClient.telefono || currentClient.email) && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    Contatti Rapidi Cliente ({currentClient.nome} {currentClient.cognome || ''})
                  </span>
                  {currentClient.telefono && (
                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPhone ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedPhone ? 'Copiato!' : currentClient.telefono}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {currentClient.telefono && (
                    <>
                      <a
                        href={`tel:${currentClient.telefono}`}
                        className="px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-indigo-500" />
                        Chiama
                      </a>

                      <a
                        href={getWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp Promemoria
                      </a>
                    </>
                  )}

                  {currentClient.email && (
                    <a
                      href={`mailto:${currentClient.email}?subject=Promemoria%20Appuntamento&body=Gentile%20${encodeURIComponent(currentClient.nome)},%20ti%20ricordiamo%20il%20tuo%20appuntamento%20il%20${dateStr}%20alle%20${timeStr}.`}
                      className="px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      Invia Email
                    </a>
                  )}
                </div>
              </div>
            )}

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
                  Pianificazione Data e Orario
                </span>
                {!senzaOrario && (
                  <button
                    type="button"
                    onClick={handleCheckAvailableSlots}
                    disabled={slotsLoading || !dateStr}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                  >
                    {slotsLoading ? 'Calcolo slot in corso...' : 'Calcola Slot Disponibili'}
                  </button>
                )}
              </div>

              {/* Toggle Senza Orario Fisso (Ideale per Piatti, Prodotti o Asporto) */}
              <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={senzaOrario}
                  onChange={(e) => setSenzaOrario(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  📦 Senza orario fisso (Ordine del giorno, Piatto o Prodotto)
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Data Riferimento
                  </label>
                  <input
                    type="date"
                    required
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                  />
                </div>

                {!senzaOrario ? (
                  <>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                        Ora Inizio
                      </label>
                      <input
                        type="time"
                        required
                        value={timeStr}
                        onChange={(e) => setTimeStr(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          Ora Fine (Modificabile)
                        </label>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          {totalMinutes} min
                        </span>
                      </div>
                      <input
                        type="time"
                        required
                        value={calculatedEndTime}
                        onChange={(e) => handleEndTimeChange(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                        title="Modifica l'orario di fine per ricalcolare automaticamente la durata"
                      />
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2 flex items-center p-2 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs">
                    <span>
                      Questo elemento apparirà nella barra <strong>Ordini & Prodotti del Giorno</strong> in cima all'agenda classica.
                    </span>
                  </div>
                )}
              </div>

              {/* Controlli Durata Rapida & Presets */}
              {!senzaOrario && (
                <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      Regola Durata Totale:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyTotalDuration(Math.max(5, totalMinutes - 15))}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-2xs"
                        title="Sottrai 15 minuti"
                      >
                        -15m
                      </button>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 min-w-[50px] text-center">
                        {totalMinutes} min
                      </span>
                      <button
                        type="button"
                        onClick={() => applyTotalDuration(totalMinutes + 15)}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-2xs"
                        title="Aggiungi 15 minuti"
                      >
                        +15m
                      </button>
                    </div>
                  </div>

                  {/* Preset chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[15, 30, 45, 60, 75, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => applyTotalDuration(mins)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          totalMinutes === mins
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-300'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messaggio o Avviso Slot */}
              {slotMessage && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  ℹ️ {slotMessage}
                </div>
              )}

              {/* Slot picker chips con selezione immediata */}
              {availableSlots.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block mb-1.5">
                    Tocca uno slot per selezionare l'orario di inizio:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {availableSlots.map((slot) => {
                      const isSelected = timeStr === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTimeStr(slot)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                          <span>{slot}</span>
                        </button>
                      );
                    })}
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

              {/* Barra aggiunta item con catalogo adattato all'operatore */}
              <div className="flex flex-col sm:flex-row gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                {/* Tipo Item */}
                <select
                  value={itemTypeToAdd}
                  onChange={(e) => {
                    setItemTypeToAdd(e.target.value as any);
                    setSelectedCatalogItemId('');
                  }}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-white cursor-pointer"
                >
                  <option value="servizio">🛠️ Servizio</option>
                  <option value="prodotto">🛍️ Prodotto</option>
                  <option value="piatto">🍽️ Menù / Piatto</option>
                </select>

                {/* Dropdown specifico del catalogo (Servizi personalizzati se presenti per l'operatore) */}
                <select
                  value={selectedCatalogItemId}
                  onChange={(e) => setSelectedCatalogItemId(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="">-- Seleziona dal catalogo --</option>
                  {itemTypeToAdd === 'servizio' &&
                    availableServizi.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.titolo} • € {Number(s.prezzo).toFixed(2)} ({s.tempo_minuti} min){s.isCustomized ? ' 🌟' : ''}
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
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Aggiungi
                </button>
              </div>

              {/* Tabella / Lista degli item aggiunti */}
              {items.length === 0 ? (
                <div className="p-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  Nessun elemento aggiunto alla prenotazione. Seleziona almeno un servizio o prodotto sopra.
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div
                      key={`${it.tipo}-${it.id_item}-${idx}`}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {it.tipo}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {it.titolo}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div
                            className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700"
                            title="Modifica durata per questo elemento"
                          >
                            <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                            <input
                              type="number"
                              min="0"
                              step="5"
                              value={it.tempo_minuti}
                              onChange={(e) => handleUpdateItemDuration(idx, parseInt(e.target.value) || 0)}
                              className="w-10 bg-transparent text-xs font-bold text-slate-900 dark:text-white text-right focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-500">min</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantità, Prezzo e Rimuovi */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                        {/* Quantità */}
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-1.5 py-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(idx, it.quantita - 1)}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center hover:bg-slate-100 cursor-pointer text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-5 text-center text-slate-900 dark:text-white">
                            {it.quantita}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(idx, it.quantita + 1)}
                            className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center hover:bg-slate-100 cursor-pointer text-xs"
                          >
                            +
                          </button>
                        </div>

                        {/* Prezzo modificabile */}
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1">
                          <span className="text-xs text-slate-400">€</span>
                          <input
                            type="number"
                            step="0.5"
                            value={it.prezzo}
                            onChange={(e) => handleUpdateItemPrice(idx, parseFloat(e.target.value) || 0)}
                            className="w-14 bg-transparent text-xs font-bold text-slate-900 dark:text-white text-right focus:outline-none"
                          />
                        </div>

                        {/* Rimuovi */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Rimuovi elemento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Sommari totali */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">
                      Totale Complessivo ({totalMinutes} minuti)
                    </span>
                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                      € {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Note Aggiuntive */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Note Interne & Richieste Speciali
              </label>
              <textarea
                rows={3}
                placeholder="Preferenze cliente, richieste particolari..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

          </form>
        </div>

        {/* Footer Drawer */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            {initialData && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Elimina Prenotazione
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Annulla
            </button>

            <button
              type="submit"
              form="prenotazione-form"
              disabled={isPending}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isPending ? 'Salvataggio...' : initialData ? 'Salva Modifiche' : 'Crea Prenotazione'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
