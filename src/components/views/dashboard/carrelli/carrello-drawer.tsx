'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  ShoppingBag,
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
  UtensilsCrossed,
  Wrench,
  PackageCheck,
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
  prodotti: any[];
  piatti?: any[];
  servizi?: any[];
}

interface ItemLine {
  id_item: number;
  tipo: 'prodotto' | 'piatto' | 'servizio';
  titolo: string;
  quantita: number;
  prezzo: number;
  tempo_minuti: number;
  note?: string;
}

export default function CarrelloDrawer({
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
  prodotti = [],
  piatti = [],
  servizi = [],
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Catalog Tab for adding items: 'prodotto' | 'piatto' | 'servizio'
  const [catalogTab, setCatalogTab] = useState<'prodotto' | 'piatto' | 'servizio'>('prodotto');

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
  const [timeStr, setTimeStr] = useState('11:00');

  // Selected items list
  const [items, setItems] = useState<ItemLine[]>([]);

  // Search query in catalogue
  const [itemSearchQuery, setItemSearchQuery] = useState('');

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
        setTimeStr('11:00');
      }

      // Map items
      if (initialData.items && initialData.items.length > 0) {
        const mappedItems: ItemLine[] = initialData.items.map((it) => {
          let itemTitle = `Articolo #${it.id_item}`;
          if (it.tipo === 'prodotto') {
            const f = prodotti?.find((pr) => pr.id === it.id_item);
            if (f) itemTitle = f.titolo;
          } else if (it.tipo === 'piatto') {
            const f = piatti?.find((p) => p.id === it.id_item);
            if (f) itemTitle = f.titolo;
          } else {
            const f = servizi?.find((s) => s.id === it.id_item);
            if (f) itemTitle = f.titolo;
          }

          return {
            id_item: it.id_item,
            tipo: (it.tipo as any) || 'prodotto',
            titolo: itemTitle,
            quantita: it.quantita || 1,
            prezzo: it.prezzo || 0,
            tempo_minuti: it.tempo_minuti || 10,
            note: it.note || '',
          };
        });
        setItems(mappedItems);
      } else {
        setItems([]);
      }
    } else {
      // Create new carrello
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
      setTimeStr(initialTime || '11:00');
      setItems([]);
      setCatalogTab('prodotto');
    }

    setErrorMsg(null);
  }, [initialData, isOpen, initialDate, initialTime, initialStaffId, professionisti, prodotti, piatti, servizi]);

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
      setTitolo(`Carrello ${clientToRestore.nome}`);
    }
  };

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
    setQuickNote('Cliente ordine carrello');
  };

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
          setTitolo(`Carrello ${newClient.nome}`);
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

  const filteredProdotti = useMemo(() => {
    const q = itemSearchQuery.trim().toLowerCase();
    const available = (prodotti || []).filter((p) => p.is_active !== false);
    if (!q) return available;
    return available.filter((p) => p.titolo?.toLowerCase().includes(q) || p.categoria?.toLowerCase().includes(q));
  }, [prodotti, itemSearchQuery]);

  const filteredPiatti = useMemo(() => {
    const q = itemSearchQuery.trim().toLowerCase();
    const available = (piatti || []).filter((p) => p.is_active !== false && p.is_disponibile !== false);
    if (!q) return available;
    return available.filter((p) => p.titolo?.toLowerCase().includes(q) || p.categoria?.toLowerCase().includes(q));
  }, [piatti, itemSearchQuery]);

  const filteredServizi = useMemo(() => {
    const q = itemSearchQuery.trim().toLowerCase();
    const available = (servizi || []).filter((s) => s.is_active !== false);
    if (!q) return available;
    return available.filter((s) => s.titolo?.toLowerCase().includes(q) || s.categoria?.toLowerCase().includes(q));
  }, [servizi, itemSearchQuery]);

  // Aggiungi prodotto (Carrello)
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

  // Aggiungi piatto (Comanda nel carrello)
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

  const totalMinutes = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.tempo_minuti || 0) * (it.quantita || 1), 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return items.reduce((acc, it) => acc + (it.prezzo || 0) * (it.quantita || 1), 0);
  }, [items]);

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

  // Submit Carrello
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('Operazione non consentita: solo gli amministratori possono salvare i carrelli.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Seleziona almeno un prodotto o elemento per il carrello.');
      return;
    }

    if (!dateStr || !timeStr) {
      setErrorMsg('Specifica data e orario per il carrello.');
      return;
    }

    setErrorMsg(null);

    const [h, m] = timeStr.split(':').map(Number);
    const startISO = new Date(`${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`).toISOString();

    let generatedTitle = titolo.trim();
    if (!generatedTitle) {
      if (currentClient) {
        generatedTitle = `Carrello ${currentClient.nome} ${currentClient.cognome || ''}`.trim();
      } else if (items.length > 0) {
        generatedTitle = `Carrello ${items[0].titolo}`;
      } else {
        generatedTitle = 'Carrello Banco';
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
        tipo: it.tipo || 'prodotto',
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
        setErrorMsg(res.error || 'Errore durante il salvataggio del carrello');
      }
    });
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      setErrorMsg('Operazione non consentita: solo gli amministratori possono cancellare i carrelli.');
      return;
    }
    if (!initialData) return;
    if (!confirm('Sei sicuro di voler cancellare questo carrello?')) return;

    startTransition(async () => {
      const res = await deletePrenotazioneAction(initialData.id, hubId, hubSlug);
      if (res.success) {
        router.refresh();
        onClose();
      } else {
        setErrorMsg(res.error || 'Errore durante l\'eliminazione del carrello');
      }
    });
  };

  const getWhatsAppLink = () => {
    if (!currentClient?.telefono) return '#';
    let cleanTel = currentClient.telefono.replace(/[^\d+]/g, '').replace(/^00/, '+');
    if (!cleanTel.startsWith('+')) cleanTel = `+39${cleanTel}`;
    const cleanNum = cleanTel.replace('+', '');
    const productCount = items.reduce((acc, it) => acc + (it.quantita || 1), 0);
    const msg = encodeURIComponent(
      `Ciao ${currentClient.nome}, il tuo carrello con ${productCount} articoli è programmato per il ${dateStr} alle ore ${timeStr}.`
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
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/60 dark:border-amber-900/40">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="truncate min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {currentClient
                    ? `Carrello: ${currentClient.nome} ${currentClient.cognome || ''}`.trim()
                    : (titolo.trim() || (initialData ? `Carrello #${initialData.id}` : 'Nuovo Carrello Prodotti'))}
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
                {items.length > 0 ? ` • ${items.reduce((acc, it) => acc + (it.quantita || 1), 0)} articoli` : ''}
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

          <form id="carrello-form" onSubmit={handleSubmit} className="max-w-full overflow-x-hidden">
            <fieldset disabled={!isAdmin} className="space-y-4 sm:space-y-5 max-w-full overflow-x-hidden">

              {/* 1. SELEZIONE CLIENTE */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    Cliente / Destinatario Carrello
                  </label>
                  {!showQuickAddClient && !currentClient && (
                    <button
                      type="button"
                      onClick={handleOpenQuickAdd}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
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
                  <div className="p-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
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
                            className="text-amber-600 hover:underline flex items-center gap-0.5"
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
                  <div className="p-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2.5">
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
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Annulla
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveQuickClient}
                        disabled={quickLoading}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        {quickLoading ? 'Salvataggio...' : 'Salva in Rubrica'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Campo Ricerca Cliente */
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Cerca cliente per nome, telefono o email (o lascia vuoto per vendita al banco)..."
                      value={clientSearchQuery}
                      onChange={(e) => {
                        setClientSearchQuery(e.target.value);
                        setIsClientSearchOpen(true);
                      }}
                      onFocus={() => setIsClientSearchOpen(true)}
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20"
                    />

                    {isClientSearchOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg max-h-48 overflow-y-auto z-30 divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredClienti.length > 0 ? (
                          filteredClienti.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedClienteId(c.id);
                                setIsClientSearchOpen(false);
                                setClientSearchQuery('');
                                setRemovedClient(null);
                                if (!titolo.trim()) {
                                  setTitolo(`Carrello ${c.nome}`);
                                }
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs flex items-center justify-between transition-colors cursor-pointer"
                            >
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white">
                                  {c.nome} {c.cognome || ''}
                                </div>
                                {c.telefono && (
                                  <div className="text-[10px] text-slate-400">{c.telefono}</div>
                                )}
                              </div>
                              <Plus className="w-3.5 h-3.5 text-amber-500" />
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-400">
                            Nessun cliente trovato.
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

              {/* 2. RIFERIMENTO CARRELLO & ADDETTO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                    Riferimento Carrello / Ritiro *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Ritiro Banco, Ordine #104, Spedizione..."
                    value={titolo}
                    onChange={(e) => setTitolo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    Addetto Magazzino / Cassa
                  </label>
                  <select
                    value={selectedStaffId || ''}
                    onChange={(e) => setSelectedStaffId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="">-- Cassa / Non assegnato --</option>
                    {professionisti.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p.ruolo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* STATO CARRELLO */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Stato Avanzamento Ordine / Carrello
                </label>
                <select
                  value={stato}
                  onChange={(e) => setStato(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="pending">⏳ In allestimento (Da preparare)</option>
                  <option value="confermata">📦 Pronto per il ritiro / Spedizione</option>
                  <option value="completata">🎉 Consegnato / Ritirato con successo</option>
                  <option value="cancellata">❌ Annullato</option>
                </select>
              </div>

              {/* 3. DATA, ORARIO & TEMPI DI GESTIONE */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Orario Ritiro / Evasione Carrello
                  </span>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    Prep. stimata: {totalMinutes} min
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Data Evasione
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
                      Ora Prevista
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
                      Pronto Entro
                    </label>
                    <input
                      type="time"
                      readOnly
                      value={calculatedEndTime}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 cursor-default"
                    />
                  </div>
                </div>
              </div>

              {/* 4. PRODOTTI E PIATTI NEL CARRELLO */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-amber-500" />
                    Articoli nel Carrello ({items.reduce((acc, it) => acc + (it.quantita || 1), 0)})
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                      Totale Carrello: € {totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Selettore Modulo Cataloghi */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
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
                    <span>Prodotti Magazzino ({prodotti?.length || 0})</span>
                  </button>

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
                        catalogTab === 'prodotto'
                          ? 'Cerca prodotto in magazzino da aggiungere...'
                          : catalogTab === 'piatto'
                          ? 'Cerca piatto da aggiungere...'
                          : 'Cerca servizio...'
                      }
                      value={itemSearchQuery}
                      onChange={(e) => setItemSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/20"
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

                  {/* Tab Prodotti */}
                  {catalogTab === 'prodotto' && (
                    filteredProdotti.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                        {filteredProdotti.slice(0, 12).map((prod) => {
                          const pr = Number(prod.prezzo_nuovo || prod.prezzo_listino || 0);
                          return (
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
                                    € {pr.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                                <Plus className="w-3.5 h-3.5" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        {prodotti.length === 0
                          ? 'Nessun prodotto disponibile nel magazzino di questo Hub.'
                          : `Nessun prodotto trovato con "${itemSearchQuery}"`}
                      </div>
                    )
                  )}

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
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate block group-hover:text-rose-600">
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
                            <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 group-hover:bg-rose-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                              <Plus className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        Nessun piatto trovato.
                      </div>
                    )
                  )}

                  {/* Tab Servizi */}
                  {catalogTab === 'servizio' && (
                    filteredServizi.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
                        {filteredServizi.slice(0, 12).map((srv) => (
                          <button
                            key={srv.id}
                            type="button"
                            onClick={() => handleAddService(srv)}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-xl text-left transition-all group flex items-center justify-between gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate block group-hover:text-indigo-600">
                                {srv.titolo}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>{srv.categoria || 'Servizio'}</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-600 dark:text-slate-300">
                                  € {Number(srv.prezzo || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                              <Plus className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        Nessun servizio trovato.
                      </div>
                    )
                  )}
                </div>

                {/* Elenco Elementi nel Carrello Selezionati */}
                {items.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-1">
                    <ShoppingBag className="w-7 h-7 text-amber-400 mx-auto opacity-60" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      Nessun articolo aggiunto al carrello
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Clicca su uno dei prodotti o piatti in alto per aggiungerlo all&apos;ordine.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((it, idx) => (
                      <div
                        key={`${it.id_item}-${idx}`}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex items-center gap-2">
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                it.tipo === 'prodotto'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : it.tipo === 'piatto'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              }`}
                            >
                              {it.tipo}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {it.titolo}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                              € {(it.prezzo * (it.quantita || 1)).toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              title="Rimuovi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Modificatori Quantità, Tempo & Note */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                          {/* Stepper Quantità */}
                          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                            <span className="text-[10px] font-bold text-slate-500 pl-1.5">Q.tà:</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(idx, -1)}
                              className="w-5 h-5 rounded flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white px-1 min-w-[16px] text-center">
                              {it.quantita || 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(idx, 1)}
                              className="w-5 h-5 rounded flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          {/* Stepper Minuti Preparazione / Gestione */}
                          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                            <Clock className="w-3 h-3 text-slate-400 ml-1" />
                            <span className="text-[10px] font-bold text-slate-500">Prep:</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemDuration(idx, (it.tempo_minuti || 0) - 5)}
                              className="w-5 h-5 rounded flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors"
                            >
                              -
                            </button>
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white px-1 min-w-[24px] text-center">
                              {it.tempo_minuti || 0}m
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemDuration(idx, (it.tempo_minuti || 0) + 5)}
                              className="w-5 h-5 rounded flex items-center justify-center bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-colors"
                            >
                              +
                            </button>
                          </div>

                          {/* Nota Specifica Articolo */}
                          <div className="w-full">
                            <input
                              type="text"
                              placeholder="Note articolo (es. confezione regalo, colore, dettagli consegna...)"
                              value={it.note || ''}
                              onChange={(e) => handleUpdateItemNote(idx, e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] text-slate-800 dark:text-slate-200 placeholder-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. NOTE GENERALI CARRELLO */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Note di Spedizione / Istruzioni al Banco
                </label>
                <textarea
                  rows={2}
                  placeholder="Note generali sul ritiro, indirizzo consegna o orari preferiti..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

            </fieldset>
          </form>
        </div>

        {/* Footer Checkout DRY con Totali Reattivi */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 sticky bottom-0 z-20">
          <div className="min-w-0">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Totale ({items.reduce((acc, it) => acc + (it.quantita || 1), 0)} articoli • ~{totalMinutes} min)
            </div>
            <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
              € {totalPrice.toFixed(2)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {initialData && isAdmin && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl transition-colors cursor-pointer"
                title="Elimina Carrello"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              form="carrello-form"
              disabled={isPending || !isAdmin}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-black shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <span>Salvataggio...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {initialData ? 'Aggiorna Carrello' : `Salva Carrello (€ ${totalPrice.toFixed(2)})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
