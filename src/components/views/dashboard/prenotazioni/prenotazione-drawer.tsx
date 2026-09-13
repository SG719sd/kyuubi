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
  Search,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import {
  upsertPrenotazioneAction,
  deletePrenotazioneAction,
  calcolaSlotDisponibiliAction,
} from '@/server/actions/prenotazioni.actions';
import { createRubricaAction } from '@/server/actions/rubrica.actions';
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

  // Clienti list locale sincronizzata con aggiunte al volo
  const [clientiList, setClientiList] = useState<any[]>(clienti);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [quickClientSuccessMsg, setQuickClientSuccessMsg] = useState<string | null>(null);

  // Quick Add Client form state
  const [quickNome, setQuickNome] = useState('');
  const [quickCognome, setQuickCognome] = useState('');
  const [quickTelefono, setQuickTelefono] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickNote, setQuickNote] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  // Date and Time
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('09:00');
  const [senzaOrario, setSenzaOrario] = useState(false);

  // Selected items list
  const [items, setItems] = useState<ItemLine[]>([]);

  // Item selector state
  const [itemTypeToAdd, setItemTypeToAdd] = useState<'servizio' | 'prodotto' | 'piatto'>('servizio');
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string>('');

  // Catalog item search & category filter (Autocompiler)
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [catalogFilterType, setCatalogFilterType] = useState<'tutti' | 'servizio' | 'prodotto' | 'piatto'>('tutti');

  // Available slots preview
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotMessage, setSlotMessage] = useState<string | null>(null);

  // Sincronizza clientiList se cambiano le props
  useEffect(() => {
    setClientiList(clienti);
  }, [clienti]);

  // Initialize form
  useEffect(() => {
    setClientSearchQuery('');
    setIsClientSearchOpen(false);
    setShowQuickAddClient(false);
    setQuickError(null);
    setItemSearchQuery('');

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
      return clientiList.find((c) => c.id === selectedClienteId) || null;
    }
    if (initialData?.rubrica) {
      return initialData.rubrica;
    }
    return null;
  }, [selectedClienteId, clientiList, initialData]);

  // Ricerca live clienti (Autocompiler utenti)
  const filteredClienti = useMemo(() => {
    const q = clientSearchQuery.trim().toLowerCase();
    if (!q) return clientiList.slice(0, 8);
    return clientiList.filter((c) => {
      const full = `${c.nome || ''} ${c.cognome || ''}`.toLowerCase();
      const tel = (c.telefono || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      return full.includes(q) || tel.includes(q) || email.includes(q);
    });
  }, [clientiList, clientSearchQuery]);

  // Apri pannello rapido "Aggiungi in Rubrica" con autocompilazione intelligente
  const handleOpenQuickAdd = () => {
    setShowQuickAddClient(true);
    setIsClientSearchOpen(false);
    setQuickError(null);
    const trimmed = clientSearchQuery.trim();
    if (/^[0-9+\s\-()]+$/.test(trimmed) && trimmed.length >= 3) {
      setQuickTelefono(trimmed);
      setQuickNome('');
      setQuickCognome('');
    } else if (trimmed) {
      const parts = trimmed.split(' ');
      setQuickNome(parts[0] || '');
      setQuickCognome(parts.slice(1).join(' ') || '');
      setQuickTelefono('');
    } else {
      setQuickNome('');
      setQuickCognome('');
      setQuickTelefono('');
    }
    setQuickEmail('');
    setQuickNote('Inserito da prenotazione');
  };

  // Salva cliente in Rubrica ed associalo istantaneamente
  const handleSaveQuickClient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickNome.trim()) {
      setQuickError('Il nome del cliente è obbligatorio.');
      return;
    }

    setQuickLoading(true);
    setQuickError(null);

    try {
      const res = await createRubricaAction(
        {
          id_hub: hubId,
          nome: quickNome.trim(),
          cognome: quickCognome.trim() || null,
          telefono: quickTelefono.trim() || null,
          email: quickEmail.trim() || null,
          note: quickNote.trim() || 'Inserito da prenotazione telefonica',
          is_active: true,
        },
        hubSlug
      );

      if (!res.success || !res.data) {
        throw new Error(res.error || 'Impossibile salvare il cliente in rubrica');
      }

      const newClient = res.data;
      setClientiList((prev) => [newClient, ...prev]);
      setSelectedClienteId(newClient.id);
      if (!titolo.trim()) {
        setTitolo(`${newClient.nome} ${newClient.cognome || ''}`.trim());
      }
      setShowQuickAddClient(false);
      setClientSearchQuery('');
      setQuickClientSuccessMsg(`Cliente "${newClient.nome}" aggiunto in Rubrica e collegato!`);
      setTimeout(() => setQuickClientSuccessMsg(null), 4000);
      router.refresh();
    } catch (err: any) {
      setQuickError(err.message || 'Errore durante il salvataggio in rubrica');
    } finally {
      setQuickLoading(false);
    }
  };

  // Catalogo unificato e ricercabile (Autocompiler prestazioni, prodotti e piatti)
  const unifiedCatalog = useMemo(() => {
    const list: {
      id: number;
      tipo: 'servizio' | 'prodotto' | 'piatto';
      titolo: string;
      prezzo: number;
      tempo_minuti: number;
      isCustomized?: boolean;
    }[] = [];

    // Servizi
    availableServizi.forEach((s) => {
      list.push({
        id: s.id,
        tipo: 'servizio',
        titolo: s.titolo,
        prezzo: Number(s.prezzo) || 0,
        tempo_minuti: Number(s.tempo_minuti) || 30,
        isCustomized: s.isCustomized,
      });
    });

    // Prodotti
    prodotti.forEach((p) => {
      list.push({
        id: p.id,
        tipo: 'prodotto',
        titolo: p.titolo,
        prezzo: Number(p.prezzo_listino || p.prezzo_nuovo) || 0,
        tempo_minuti: Number(p.tempo_minuti) || 0,
      });
    });

    // Piatti
    piatti.forEach((p) => {
      list.push({
        id: p.id,
        tipo: 'piatto',
        titolo: p.titolo,
        prezzo: Number(p.prezzo) || 0,
        tempo_minuti: Number(p.tempo_minuti) || 0,
      });
    });

    return list;
  }, [availableServizi, prodotti, piatti]);

  // Catalogo filtrato per ricerca e tipologia
  const filteredCatalog = useMemo(() => {
    let result = unifiedCatalog;
    if (catalogFilterType !== 'tutti') {
      result = result.filter((item) => item.tipo === catalogFilterType);
    }
    const q = itemSearchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((item) => item.titolo.toLowerCase().includes(q));
    }
    return result;
  }, [unifiedCatalog, catalogFilterType, itemSearchQuery]);

  // Aggiunta rapida con un clic dal catalogo
  const handleAddCatalogItem = (item: {
    id: number;
    tipo: 'servizio' | 'prodotto' | 'piatto';
    titolo: string;
    prezzo: number;
    tempo_minuti: number;
  }) => {
    setItems((prev) => [
      ...prev,
      {
        id_item: item.id,
        tipo: item.tipo,
        titolo: item.titolo,
        quantita: 1,
        prezzo: item.prezzo,
        tempo_minuti: item.tempo_minuti,
        note: '',
      },
    ]);
  };

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

    const selectedCliente = selectedClienteId ? clienti.find((c) => c.id === selectedClienteId) : null;
    const resolvedUserId = selectedCliente?.id_user || initialData?.id_user || null;

    const payload = {
      id: initialData ? initialData.id : undefined,
      id_hub: hubId,
      id_professionista: selectedStaffId || null,
      id_rubrica: selectedClienteId || null,
      id_user: resolvedUserId,
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
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                {initialData ? 'Dettagli & Modifica Prenotazione' : 'Nuova Prenotazione'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {initialData ? `ID #${initialData.id}` : 'Inserisci i dettagli e gli slot orari'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form id="prenotazione-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Feedback rapido aggiunta cliente */}
            {quickClientSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{quickClientSuccessMsg}</span>
              </div>
            )}

            {/* SEZIONE CLIENTE & OPERATORE */}
            {currentClient ? (
              /* CARD CLIENTE SELEZIONATO CON CONTATTI RAPIDI */
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {currentClient.nome?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {currentClient.nome} {currentClient.cognome || ''}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                          In Rubrica
                        </span>
                      </div>
                      {currentClient.note && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {currentClient.note}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClienteId(null);
                      setClientSearchQuery('');
                      setIsClientSearchOpen(false);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    Cambia / Rimuovi
                  </button>
                </div>

                {/* Pulsanti azioni rapide di contatto */}
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-indigo-200/50 dark:border-indigo-800/40">
                  {currentClient.telefono && (
                    <>
                      <button
                        type="button"
                        onClick={handleCopyPhone}
                        className="px-2.5 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedPhone ? 'Copiato!' : currentClient.telefono}</span>
                      </button>

                      <a
                        href={`tel:${currentClient.telefono}`}
                        className="px-3 py-1 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Phone className="w-3.5 h-3.5 text-indigo-500" />
                        Chiama
                      </a>

                      <a
                        href={getWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp Promemoria
                      </a>
                    </>
                  )}

                  {currentClient.email && (
                    <a
                      href={`mailto:${currentClient.email}?subject=Promemoria%20Appuntamento&body=Gentile%20${encodeURIComponent(currentClient.nome)},%20ti%20ricordiamo%20il%20tuo%20appuntamento%20il%20${dateStr}%20alle%20${timeStr}.`}
                      className="px-3 py-1 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      Email
                    </a>
                  )}
                </div>

                {/* Operatore Assegnato in riga compatta quando cliente è selezionato */}
                <div className="pt-2 border-t border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    Operatore Assegnato:
                  </span>
                  <select
                    value={selectedStaffId || ''}
                    onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : null)}
                    className="px-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-white cursor-pointer"
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
            ) : showQuickAddClient ? (
              /* MODULO RAPIDO AGGIUNGI IN RUBRICA */
              <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-700 dark:text-amber-300">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                        Registra Cliente al Telefono in Rubrica
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Salva i dati del cliente per ritrovarlo sempre e inviargli promemoria
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddClient(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {quickError && (
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{quickError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nome *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Es. Mario"
                      value={quickNome}
                      onChange={(e) => setQuickNome(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cognome
                    </label>
                    <input
                      type="text"
                      placeholder="Es. Rossi"
                      value={quickCognome}
                      onChange={(e) => setQuickCognome(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Telefono (per WhatsApp & Chiamate)
                    </label>
                    <input
                      type="tel"
                      placeholder="Es. 3331234567"
                      value={quickTelefono}
                      onChange={(e) => setQuickTelefono(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Email (opzionale)
                    </label>
                    <input
                      type="email"
                      placeholder="Es. cliente@gmail.com"
                      value={quickEmail}
                      onChange={(e) => setQuickEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Note cliente (es. Preferenze o come ci ha conosciuto)
                    </label>
                    <input
                      type="text"
                      placeholder="Es. Prenotazione telefonica"
                      value={quickNote}
                      onChange={(e) => setQuickNote(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/50 dark:border-amber-800/40">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddClient(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveQuickClient()}
                    disabled={quickLoading}
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {quickLoading ? (
                      <span>Salvataggio in corso...</span>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Salva in Rubrica e Collega</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* RICERCA INTELLIGENTE / AUTOCOMPILER CLIENTE DA RUBRICA + OPERATORE */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Autocompiler Ricerca Cliente */}
                <div className="space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Cerca Cliente in Rubrica
                    </label>
                    <button
                      type="button"
                      onClick={handleOpenQuickAdd}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Aggiungi in Rubrica</span>
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Digita nome, cognome o telefono..."
                      value={clientSearchQuery}
                      onChange={(e) => {
                        setClientSearchQuery(e.target.value);
                        setIsClientSearchOpen(true);
                      }}
                      onFocus={() => setIsClientSearchOpen(true)}
                      className="w-full pl-8 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    {clientSearchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setClientSearchQuery('');
                          setIsClientSearchOpen(false);
                        }}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dropdown Live Risultati Autocompiler */}
                  {isClientSearchOpen && (
                    <div className="absolute left-0 right-0 z-30 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                      {filteredClienti.length > 0 ? (
                        <div className="py-1">
                          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800">
                            Clienti trovati ({filteredClienti.length})
                          </div>
                          {filteredClienti.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedClienteId(c.id);
                                if (!titolo.trim()) {
                                  setTitolo(`${c.nome} ${c.cognome || ''}`.trim());
                                }
                                setIsClientSearchOpen(false);
                                setClientSearchQuery('');
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-indigo-50/70 dark:hover:bg-indigo-950/50 flex items-center justify-between gap-2 transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-800/40 last:border-0"
                            >
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                                  {c.nome} {c.cognome || ''}
                                </span>
                                {c.telefono && (
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Phone className="w-3 h-3 text-slate-400" />
                                    {c.telefono}
                                  </span>
                                )}
                              </div>
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold shrink-0">
                                Collega
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-center space-y-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Nessun contatto trovato con &quot;{clientSearchQuery}&quot;
                          </p>
                          <button
                            type="button"
                            onClick={handleOpenQuickAdd}
                            className="w-full px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>+ Aggiungi subito in Rubrica</span>
                          </button>
                        </div>
                      )}

                      {/* Helper per chiudere o usare come titolo libero */}
                      <div className="p-2 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                        {clientSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setTitolo(clientSearchQuery);
                              setIsClientSearchOpen(false);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                          >
                            Usa &quot;{clientSearchQuery}&quot; come titolo
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsClientSearchOpen(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-auto"
                        >
                          Chiudi
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400">
                    Seleziona un cliente da Rubrica oppure usa <strong>+ Aggiungi</strong> per registrarlo al volo.
                  </p>
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

              {/* Autocompiler & Ricerca Rapida Catalogo */}
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                {/* Filtri categoria & Barra di ricerca */}
                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                  {/* Categoria Tabs */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setCatalogFilterType('tutti')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                        catalogFilterType === 'tutti'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Tutti ({unifiedCatalog.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatalogFilterType('servizio')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                        catalogFilterType === 'servizio'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      🛠️ Servizi ({availableServizi.length})
                    </button>
                    {prodotti.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCatalogFilterType('prodotto')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                          catalogFilterType === 'prodotto'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        🛍️ Prodotti ({prodotti.length})
                      </button>
                    )}
                    {piatti.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCatalogFilterType('piatto')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                          catalogFilterType === 'piatto'
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        🍽️ Menù ({piatti.length})
                      </button>
                    )}
                  </div>

                  {/* Input Ricerca Live Prestazione */}
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filtra / cerca prestazione o articolo..."
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    {itemSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setItemSearchQuery('')}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Add Pills / Cards dei risultati (1 clic per aggiungere) */}
                {filteredCatalog.length > 0 ? (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Tocca per aggiungere istantaneamente:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {filteredCatalog.slice(0, 10).map((catItem) => (
                        <button
                          key={`${catItem.tipo}-${catItem.id}`}
                          type="button"
                          onClick={() => handleAddCatalogItem(catItem)}
                          className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl text-left transition-all group flex items-center justify-between gap-2 cursor-pointer shadow-2xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500">
                                {catItem.tipo === 'servizio' ? '🛠️' : catItem.tipo === 'prodotto' ? '🛍️' : '🍽️'}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {catItem.titolo}
                              </span>
                              {catItem.isCustomized && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 font-bold" title="Prezzo o tempo dedicato all'operatore">
                                  🌟
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                € {catItem.prezzo.toFixed(2)}
                              </span>
                              {catItem.tempo_minuti > 0 && (
                                <span>• {catItem.tempo_minuti} min</span>
                              )}
                            </div>
                          </div>
                          <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    Nessun elemento corrisponde alla ricerca &quot;{itemSearchQuery}&quot;
                  </div>
                )}

                {/* Selettore classico alternativo a tendina */}
                <details className="text-[11px] text-slate-500 group">
                  <summary className="cursor-pointer hover:text-indigo-600 font-semibold flex items-center gap-1 select-none">
                    <span>Oppure seleziona tramite menu a tendina</span>
                  </summary>
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
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

                    <select
                      value={selectedCatalogItemId}
                      onChange={(e) => setSelectedCatalogItemId(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="">-- Seleziona dal catalogo completo --</option>
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
                </details>
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
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            {initialData && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Elimina
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer text-center"
            >
              Annulla
            </button>

            <button
              type="submit"
              form="prenotazione-form"
              disabled={isPending}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
            >
              {isPending ? 'Salvataggio...' : initialData ? 'Salva Modifiche' : 'Crea Prenotazione'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
