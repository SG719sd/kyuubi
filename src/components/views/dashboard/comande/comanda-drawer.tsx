'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  UtensilsCrossed,
  Clock,
  User,
  Plus,
  Trash2,
  AlertCircle,
  Phone,
  MessageCircle,
  Search,
  UserPlus,
  ShieldCheck,
  Undo2,
  Lock,
  Minus,
  Check,
  ChefHat,
  ShoppingBag,
  Wrench,
} from 'lucide-react';

import {
  upsertPrenotazioneAction,
  deletePrenotazioneAction,
} from '@/server/actions/prenotazioni.actions';
import { createRubricaAction } from '@/server/actions/rubrica.actions';
import { PrenotazioneWithDetails } from '@/server/repositories/prenotazioni.repository';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  hubId: string;
  hubSlug: string;
  isAdmin?: boolean;
  initialData?: PrenotazioneWithDetails | null;
  initialDate?: string;
  initialTime?: string;
  initialStaffId?: number | null;
  professionisti: any[];
  professionistiServizi?: any[];
  clienti: any[];
  piatti: any[];
  prodotti?: any[];
  servizi?: any[];
}

interface ItemLine {
  id_item: number;
  tipo: 'piatto' | 'prodotto' | 'servizio';
  titolo: string;
  quantita: number;
  prezzo: number;
  tempo_minuti: number;
  note?: string;
}

export default function ComandaDrawer({
  isOpen,
  onClose,
  hubId,
  hubSlug,
  isAdmin = true,
  initialData,
  initialDate,
  initialTime,
  initialStaffId,
  professionisti,
  clienti,
  piatti = [],
  prodotti = [],
  servizi = [],
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Catalog Tab for adding items: 'piatto' | 'prodotto' | 'servizio'
  const [catalogTab, setCatalogTab] = useState<'piatto' | 'prodotto' | 'servizio'>('piatto');

  // Form states
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [titolo, setTitolo] = useState('');
  const [note, setNote] = useState('');
  const [stato, setStato] = useState<'pending' | 'confermata' | 'completata' | 'cancellata'>('pending');

  // Clienti list locale sincronizzata
  const [clientiList, setClientiList] = useState<any[]>(clienti);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [quickClientSuccessMsg, setQuickClientSuccessMsg] = useState<string | null>(null);
  const [removedClient, setRemovedClient] = useState<any | null>(null);

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
  const [timeStr, setTimeStr] = useState('12:30');

  // Selected items list
  const [items, setItems] = useState<ItemLine[]>([]);

  // Search query in catalogue
  const [itemSearchQuery, setItemSearchQuery] = useState('');

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
    setRemovedClient(null);

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
        setTimeStr('12:30');
      }

      // Map items
      if (initialData.items && initialData.items.length > 0) {
        const mappedItems: ItemLine[] = initialData.items.map((it) => {
          let itemTitle = `Voce #${it.id_item}`;
          if (it.tipo === 'piatto') {
            const f = piatti?.find((p) => p.id === it.id_item);
            if (f) itemTitle = f.titolo;
          } else if (it.tipo === 'prodotto') {
            const f = prodotti?.find((pr) => pr.id === it.id_item);
            if (f) itemTitle = f.titolo;
          } else {
            const f = servizi?.find((s) => s.id === it.id_item);
            if (f) itemTitle = f.titolo;
          }

          return {
            id_item: it.id_item,
            tipo: (it.tipo as any) || 'piatto',
            titolo: itemTitle,
            quantita: it.quantita || 1,
            prezzo: it.prezzo || 0,
            tempo_minuti: it.tempo_minuti || 15,
            note: it.note || '',
          };
        });
        setItems(mappedItems);
      } else {
        setItems([]);
      }
    } else {
      // Create new comanda
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
      setTimeStr(initialTime || '12:30');
      setItems([]);
      setCatalogTab('piatto');
    }

    setErrorMsg(null);
  }, [initialData, isOpen, initialDate, initialTime, initialStaffId, professionisti, piatti, prodotti, servizi]);

  // Cliente attualmente collegato
  const currentClient = useMemo(() => {
    if (!selectedClienteId) return null;
    const foundInList = clientiList.find((c) => c.id === selectedClienteId);
    if (foundInList) return foundInList;
    if (initialData?.rubrica && initialData.rubrica.id === selectedClienteId) {
      return initialData.rubrica;
    }
    return null;
  }, [selectedClienteId, clientiList, initialData]);

  // Gestione rimozione e cambio cliente
  const handleRemoveClient = () => {
    if (currentClient) {
      setRemovedClient(currentClient);
    }
    setSelectedClienteId(null);
    setClientSearchQuery('');
    setIsClientSearchOpen(false);
  };

  const handleStartChangeClient = () => {
    if (currentClient) {
      setRemovedClient(currentClient);
    }
    setSelectedClienteId(null);
    setClientSearchQuery('');
    setIsClientSearchOpen(true);
  };

  const handleRestoreClient = (clientToRestore: any) => {
    if (!clientToRestore) return;
    setSelectedClienteId(clientToRestore.id);
    setRemovedClient(null);
    setIsClientSearchOpen(false);
    setClientSearchQuery('');
    if (!titolo.trim()) {
      setTitolo(`Tavolo ${clientToRestore.nome}`);
    }
  };

  // Ricerca live clienti in rubrica
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

  // Apri pannello rapido "Aggiungi in Rubrica"
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
    setQuickNote('Cliente comanda cucina');
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
          cognome: quickCognome.trim() || undefined,
          telefono: quickTelefono.trim() || undefined,
          email: quickEmail.trim() || undefined,
          note: quickNote.trim() || undefined,
          is_active: true,
        },
        hubSlug
      );

      if (res.success && res.data) {
        const newClient = res.data;
        setClientiList((prev) => [newClient, ...prev]);
        setSelectedClienteId(newClient.id);
        setRemovedClient(null);
        if (!titolo.trim()) {
          setTitolo(`Tavolo ${newClient.nome}`);
        }
        setShowQuickAddClient(false);
        setIsClientSearchOpen(false);
        setQuickClientSuccessMsg(`Cliente "${newClient.nome}" aggiunto con successo!`);
        setTimeout(() => setQuickClientSuccessMsg(null), 3000);
      } else {
        setQuickError(res.error || 'Errore durante la creazione del contatto.');
      }
    } catch (err: any) {
      setQuickError(err.message || 'Errore imprevisto nella creazione rapida.');
    } finally {
      setQuickLoading(false);
    }
  };

  // Piatti filtrati per ricerca
  const filteredPiatti = useMemo(() => {
    const q = itemSearchQuery.trim().toLowerCase();
    const available = (piatti || []).filter((p) => p.is_active !== false && p.is_disponibile !== false);
    if (!q) return available;
    return available.filter((p) => p.titolo?.toLowerCase().includes(q) || p.categoria?.toLowerCase().includes(q));
  }, [piatti, itemSearchQuery]);

  // Prodotti filtrati per ricerca
  const filteredProdotti = useMemo(() => {
    const q = itemSearchQuery.trim().toLowerCase();
    const available = (prodotti || []).filter((p) => p.is_active !== false);
    if (!q) return available;
    return available.filter((p) => p.titolo?.toLowerCase().includes(q) || p.categoria?.toLowerCase().includes(q));
  }, [prodotti, itemSearchQuery]);

  // Servizi filtrati per ricerca
  const filteredServizi = useMemo(() => {
    const q = itemSearchQuery.trim().toLowerCase();
    const available = (servizi || []).filter((s) => s.is_active !== false);
    if (!q) return available;
    return available.filter((s) => s.titolo?.toLowerCase().includes(q) || s.categoria?.toLowerCase().includes(q));
  }, [servizi, itemSearchQuery]);

  // Aggiungi piatto (Comanda)
  const handleAddPiatto = (piatto: any) => {
    setItems((prev) => [
      ...prev,
      {
        id_item: piatto.id,
        tipo: 'piatto',
        titolo: piatto.titolo,
        quantita: 1,
        prezzo: Number(piatto.prezzo) || 0,
        tempo_minuti: 15,
        note: '',
      },
    ]);
  };

  // Aggiungi prodotto
  const handleAddProdotto = (prodotto: any) => {
    const pr = Number(prodotto.prezzo_nuovo || prodotto.prezzo_listino || 0);
    setItems((prev) => [
      ...prev,
      {
        id_item: prodotto.id,
        tipo: 'prodotto',
        titolo: prodotto.titolo,
        quantita: 1,
        prezzo: pr,
        tempo_minuti: 5,
        note: '',
      },
    ]);
  };

  // Aggiungi servizio
  const handleAddService = (servizio: any) => {
    setItems((prev) => [
      ...prev,
      {
        id_item: servizio.id,
        tipo: 'servizio',
        titolo: servizio.titolo,
        quantita: 1,
        prezzo: Number(servizio.prezzo) || 0,
        tempo_minuti: Number(servizio.tempo_minuti) || 30,
        note: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemDuration = (index: number, newMinutes: number) => {
    const clamped = Math.max(0, newMinutes);
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, tempo_minuti: clamped } : it))
    );
  };

  const handleUpdateItemQuantity = (index: number, delta: number) => {
    setItems((prev) =>
      prev.map((it, idx) => {
        if (idx !== index) return it;
        const nextQty = Math.max(1, (it.quantita || 1) + delta);
        return { ...it, quantita: nextQty };
      })
    );
  };

  const handleUpdateItemNote = (index: number, noteVal: string) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, note: noteVal } : it))
    );
  };

  // Durata totale in minuti (tempo di preparazione stimato)
  const totalMinutes = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.tempo_minuti || 0) * (it.quantita || 1), 0);
  }, [items]);

  // Totale complessivo prezzo
  const totalPrice = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.prezzo || 0) * (it.quantita || 1), 0);
  }, [items]);

  // Orario stimato fine / uscita comanda
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

  // Invio Form Comanda
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('Operazione non consentita: solo gli amministratori possono salvare le comande.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Seleziona almeno un piatto o prodotto per la comanda.');
      return;
    }

    if (!dateStr || !timeStr) {
      setErrorMsg('Specifica data e orario della comanda.');
      return;
    }

    setErrorMsg(null);

    const [h, m] = timeStr.split(':').map(Number);
    const startISO = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`).toISOString();

    let generatedTitle = titolo.trim();
    if (!generatedTitle) {
      if (currentClient) {
        generatedTitle = `Comanda ${currentClient.nome} ${currentClient.cognome || ''}`.trim();
      } else if (items.length > 0) {
        generatedTitle = `Comanda ${items[0].titolo}`;
      } else {
        generatedTitle = 'Comanda Sala';
      }
    }

    const selectedCliente = selectedClienteId
      ? clientiList.find((c) => c.id === selectedClienteId) ||
        (initialData?.rubrica?.id === selectedClienteId ? initialData.rubrica : null)
      : null;
    const resolvedUserId = selectedCliente ? (selectedCliente.id_user || null) : null;

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
      ordini: true,
      tms_inizio: startISO,
      items: items.map((it) => ({
        id_item: it.id_item,
        tipo: it.tipo || 'piatto',
        quantita: it.quantita || 1,
        prezzo: it.prezzo || 0,
        tempo_minuti: it.tempo_minuti || 0,
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
        setErrorMsg(res.error || 'Errore durante il salvataggio della comanda');
      }
    });
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      setErrorMsg('Operazione non consentita: solo gli amministratori possono cancellare le comande.');
      return;
    }
    if (!initialData) return;
    if (!confirm('Sei sicuro di voler cancellare questa comanda?')) return;

    startTransition(async () => {
      const res = await deletePrenotazioneAction(initialData.id, hubId, hubSlug);
      if (res.success) {
        router.refresh();
        onClose();
      } else {
        setErrorMsg(res.error || 'Errore durante l\'eliminazione della comanda');
      }
    });
  };

  const getWhatsAppLink = () => {
    if (!currentClient?.telefono) return '#';
    let cleanTel = currentClient.telefono.replace(/[^\d+]/g, '').replace(/^00/, '+');
    if (!cleanTel.startsWith('+')) {
      cleanTel = `+39${cleanTel}`;
    }
    const cleanNum = cleanTel.replace('+', '');
    const dishCount = items.reduce((acc, it) => acc + (it.quantita || 1), 0);
    const msg = encodeURIComponent(
      `Ciao ${currentClient.nome}, confermiamo la comanda di ${dishCount} portate per il ${dateStr} alle ore ${timeStr}.`
    );
    return `https://wa.me/${cleanNum}?text=${msg}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
      <div
        className="fixed inset-0 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 animate-slide-left">
        {/* Header Drawer */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/60 dark:border-rose-900/40">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="truncate min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {currentClient
                    ? `Comanda: ${currentClient.nome} ${currentClient.cognome || ''}`.trim()
                    : (titolo.trim() || (initialData ? `Comanda #${initialData.id}` : 'Nuova Comanda Cucina'))}
                </h2>
                {initialData && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                    #{initialData.id}
                  </span>
                )}
                {currentClient ? (
                  currentClient.id_user ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Account</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shrink-0">
                      <UserPlus className="w-2.5 h-2.5 text-amber-600" />
                      <span>Rubrica</span>
                    </span>
                  )
                ) : null}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {dateStr} • Ore {timeStr}
                {items.length > 0 ? ` • ${items.reduce((acc, it) => acc + (it.quantita || 1), 0)} portate` : ''}
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

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-5 max-w-full">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isAdmin && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
              <Lock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Modalità sola lettura: solo gli amministratori possono apportare modifiche.</span>
            </div>
          )}

          <form id="comanda-form" onSubmit={handleSubmit} className="max-w-full overflow-x-hidden">
            <fieldset disabled={!isAdmin} className="space-y-4 sm:space-y-5 max-w-full overflow-x-hidden">

              {/* 1. SELEZIONE CLIENTE (OPZIONALE PER COMANDE SALA) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-rose-500" />
                    Cliente / Contatto Sala o Asporto
                  </label>
                  {!showQuickAddClient && !currentClient && (
                    <button
                      type="button"
                      onClick={handleOpenQuickAdd}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Nuovo in Rubrica</span>
                    </button>
                  )}
                </div>

                {quickClientSuccessMsg && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 text-xs">
                    {quickClientSuccessMsg}
                  </div>
                )}

                {/* Cliente Selezionato Badge */}
                {currentClient ? (
                  <div className="p-3 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {currentClient.nome} {currentClient.cognome || ''}
                        </span>
                      </div>
                      {currentClient.telefono && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{currentClient.telefono}</span>
                          <a
                            href={`tel:${currentClient.telefono}`}
                            className="text-rose-600 hover:underline flex items-center gap-0.5"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                          <a
                            href={getWhatsAppLink()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline flex items-center gap-0.5"
                          >
                            <MessageCircle className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={handleStartChangeClient}
                        className="px-2 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition-colors"
                      >
                        Cambia
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveClient}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer transition-colors"
                        title="Rimuovi cliente"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : showQuickAddClient ? (
                  /* Form Rapido Aggiunta Cliente */
                  <div className="p-3 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                      <span>Nuovo Contatto in Rubrica</span>
                      <button
                        type="button"
                        onClick={() => setShowQuickAddClient(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {quickError && (
                      <div className="text-[11px] text-rose-600 dark:text-rose-400">{quickError}</div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nome *"
                        required
                        value={quickNome}
                        onChange={(e) => setQuickNome(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Cognome"
                        value={quickCognome}
                        onChange={(e) => setQuickCognome(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="tel"
                        placeholder="Telefono (es. 340...)"
                        value={quickTelefono}
                        onChange={(e) => setQuickTelefono(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={quickEmail}
                        onChange={(e) => setQuickEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowQuickAddClient(false)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                      >
                        Annulla
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveQuickClient()}
                        disabled={quickLoading || !quickNome.trim()}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                      >
                        {quickLoading ? 'Salvataggio...' : 'Salva in Rubrica'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Campo di Ricerca o Selezione */
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Cerca cliente in rubrica (opzionale per comande banco/sala)..."
                        value={clientSearchQuery}
                        onChange={(e) => {
                          setClientSearchQuery(e.target.value);
                          setIsClientSearchOpen(true);
                        }}
                        onFocus={() => setIsClientSearchOpen(true)}
                        className="w-full pl-8 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      />
                      {clientSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setClientSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {isClientSearchOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-30 p-1">
                        {filteredClienti.length > 0 ? (
                          filteredClienti.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedClienteId(c.id);
                                setIsClientSearchOpen(false);
                                setClientSearchQuery('');
                                if (!titolo.trim()) {
                                  setTitolo(`Tavolo ${c.nome}`);
                                }
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center justify-between text-xs cursor-pointer transition-colors"
                            >
                              <span className="font-bold text-slate-800 dark:text-white">
                                {c.nome} {c.cognome || ''}
                              </span>
                              {c.telefono && (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {c.telefono}
                                </span>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="p-2 text-center text-xs text-slate-400">
                            Nessun cliente trovato.{' '}
                            <button
                              type="button"
                              onClick={handleOpenQuickAdd}
                              className="text-rose-600 font-bold hover:underline"
                            >
                              Crea ora
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {removedClient && !currentClient && (
                  <button
                    type="button"
                    onClick={() => handleRestoreClient(removedClient)}
                    className="text-[11px] text-amber-600 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <Undo2 className="w-3 h-3" />
                    <span>Ripristina {removedClient.nome}</span>
                  </button>
                )}
              </div>

              {/* 2. RIFERIMENTO TAVOLO / ASPOSTO & OPERATORE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-rose-500" />
                    Tavolo / Riferimento Comanda *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Tavolo 4, Terrazza, Asporto 13:00..."
                    value={titolo}
                    onChange={(e) => setTitolo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-rose-500" />
                    Cameriere / Addetto Sala
                  </label>
                  <select
                    value={selectedStaffId || ''}
                    onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">-- Sala / Non assegnato --</option>
                    {professionisti.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p.ruolo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* STATO COMANDA */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Stato Avanzamento Cucina
                </label>
                <select
                  value={stato}
                  onChange={(e) => setStato(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="pending">⏳ In attesa (Da prendere in carico)</option>
                  <option value="confermata">🍳 In preparazione (In cucina)</option>
                  <option value="completata">🎉 Servita / Chiusa al tavolo</option>
                  <option value="cancellata">❌ Annullata</option>
                </select>
              </div>

              {/* 3. DATA, ORARIO & TEMPI DI PREPARAZIONE */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                    Orario Comanda & Tempi Cucina
                  </span>
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    Prep. stimata: {totalMinutes} min
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Data Comanda
                    </label>
                    <input
                      type="date"
                      required
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Ora Ordinazione
                    </label>
                    <input
                      type="time"
                      required
                      value={timeStr}
                      onChange={(e) => setTimeStr(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Uscita Prevista
                    </label>
                    <input
                      type="time"
                      readOnly
                      value={calculatedEndTime}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 cursor-default"
                    />
                  </div>
                </div>
              </div>

              {/* 4. PIATTI E PRODOTTI INCLUSI NELLA COMANDA */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <ChefHat className="w-3.5 h-3.5 text-rose-500" />
                    Portate Comanda ({items.reduce((acc, it) => acc + (it.quantita || 1), 0)})
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800">
                      Totale Comanda: € {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Selettore Modulo Cataloghi */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogTab('piatto');
                      setItemSearchQuery('');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      catalogTab === 'piatto'
                        ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <UtensilsCrossed className="w-3 h-3" />
                    <span>Piatti Menu ({piatti?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCatalogTab('prodotto');
                      setItemSearchQuery('');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      catalogTab === 'prodotto'
                        ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Bevande & Prodotti ({prodotti?.length || 0})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCatalogTab('servizio');
                      setItemSearchQuery('');
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      catalogTab === 'servizio'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Wrench className="w-3 h-3" />
                    <span>Servizi ({servizi?.length || 0})</span>
                  </button>
                </div>

                {/* Ricerca e Aggiunta Rapida Elementi */}
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 max-w-full overflow-hidden">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={
                        catalogTab === 'piatto'
                          ? 'Cerca piatto nel menu da aggiungere...'
                          : catalogTab === 'prodotto'
                          ? 'Cerca bevanda o articolo...'
                          : 'Cerca servizio...'
                      }
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20"
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

                  {/* Tab Piatti */}
                  {catalogTab === 'piatto' && (
                    filteredPiatti.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                        {filteredPiatti.slice(0, 12).map((piatto) => (
                          <button
                            key={piatto.id}
                            type="button"
                            onClick={() => handleAddPiatto(piatto)}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-rose-50/60 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700 rounded-xl text-left transition-all group flex items-center justify-between gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate block group-hover:text-rose-600 dark:group-hover:text-rose-400">
                                {piatto.titolo}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>{piatto.categoria || 'Piatto'}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-600 dark:text-slate-300">
                                  € {Number(piatto.prezzo || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                              <Plus className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        {piatti.length === 0
                          ? 'Nessun piatto configurato nel Menu di questo Hub.'
                          : `Nessun piatto trovato con "${itemSearchQuery}"`}
                      </div>
                    )
                  )}

                  {/* Tab Prodotti */}
                  {catalogTab === 'prodotto' && (
                    filteredProdotti.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                        {filteredProdotti.slice(0, 12).map((prod) => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => handleAddProdotto(prod)}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-amber-50/60 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 rounded-xl text-left transition-all group flex items-center justify-between gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate block group-hover:text-amber-600 dark:group-hover:text-amber-400">
                                {prod.titolo}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>{prod.categoria || 'Articolo'}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-600 dark:text-slate-300">
                                  € {Number(prod.prezzo_nuovo || prod.prezzo_listino || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                              <Plus className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        {prodotti.length === 0
                          ? 'Nessun prodotto a catalogo.'
                          : `Nessun prodotto trovato con "${itemSearchQuery}"`}
                      </div>
                    )
                  )}

                  {/* Tab Servizi */}
                  {catalogTab === 'servizio' && (
                    filteredServizi.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                        {filteredServizi.slice(0, 12).map((serv) => (
                          <button
                            key={serv.id}
                            type="button"
                            onClick={() => handleAddService(serv)}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl text-left transition-all group flex items-center justify-between gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate block group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                {serv.titolo}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>€ {Number(serv.prezzo || 0).toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                              <Plus className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        Nessun servizio disponibile.
                      </div>
                    )
                  )}
                </div>

                {/* Lista delle Portate Aggiunte */}
                {items.length === 0 ? (
                  <div className="p-4 text-center rounded-2xl border border-dashed border-rose-200 dark:border-rose-900/40 text-xs text-slate-400">
                    Nessuna portata aggiunta. Scegli piatti dal menu sopra per completare la comanda.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {items.map((it, idx) => (
                      <div
                        key={`${it.tipo}-${it.id_item}-${idx}`}
                        className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                  it.tipo === 'piatto'
                                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
                                    : it.tipo === 'prodotto'
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
                                    : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50'
                                }`}
                              >
                                {it.tipo === 'piatto' ? 'Piatto' : it.tipo === 'prodotto' ? 'Bevanda' : 'Servizio'}
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {it.titolo}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              € {Number(it.prezzo).toFixed(2)} cad.
                            </span>
                          </div>

                          {/* Controlli Quantità & Prep Time */}
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Stepper Quantità */}
                            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQuantity(idx, -1)}
                                className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                title="Riduci quantità"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold px-1 min-w-[20px] text-center text-slate-900 dark:text-white">
                                {it.quantita || 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQuantity(idx, 1)}
                                className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                title="Aumenta quantità"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Controllo Tempo Preparazione Cucina */}
                            <div
                              className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5"
                              title="Tempo di preparazione stimato in cucina"
                            >
                              <UtensilsCrossed className="w-3 h-3 text-rose-500 shrink-0" />
                              <input
                                type="number"
                                min="0"
                                step="5"
                                value={it.tempo_minuti || 0}
                                onChange={(e) => handleUpdateItemDuration(idx, parseInt(e.target.value) || 0)}
                                className="w-8 bg-transparent text-xs font-bold text-slate-900 dark:text-white text-right focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-400">m</span>
                            </div>

                            {/* Subtotale Item */}
                            <div className="text-right min-w-[50px]">
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                € {(Number(it.prezzo) * (it.quantita || 1)).toFixed(2)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Rimuovi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Note specifiche per la cucina */}
                        <div className="pt-1 border-t border-slate-100 dark:border-slate-800/60">
                          <input
                            type="text"
                            placeholder="Note cucina (es. ben cotto, senza cipolla, no formaggio, intolleranze)..."
                            value={it.note || ''}
                            onChange={(e) => handleUpdateItemNote(idx, e.target.value)}
                            className="w-full text-[11px] px-2.5 py-1 bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:border-rose-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. NOTE AGGIUNTIVE COMANDA */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Note Generali per la Cucina o lo Staff
                </label>
                <textarea
                  rows={2}
                  placeholder="Es. Servire prima i primi piatti, comanda urgente, tavolo con bambini..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white resize-none"
                />
              </div>

            </fieldset>
          </form>
        </div>

        {/* Footer Drawer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shrink-0">
          <div>
            {initialData && isAdmin ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Elimina Comanda</span>
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Annulla
            </button>

            {isAdmin && (
              <button
                type="submit"
                form="comanda-form"
                disabled={isPending || items.length === 0}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isPending ? (
                  'Salvataggio...'
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{initialData ? 'Aggiorna Comanda' : 'Salva Comanda'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
