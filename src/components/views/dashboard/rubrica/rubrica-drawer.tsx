'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X, Contact } from 'lucide-react';
import { createRubricaAction, updateRubricaAction } from '@/server/actions/rubrica.actions';

export default function RubricaDrawer({
  isOpen,
  onClose,
  hubId,
  hubSlug,
  contatto,
}: {
  isOpen: boolean;
  onClose: () => void;
  hubId: string;
  hubSlug: string;
  contatto: any | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [indirizzo, setIndirizzo] = useState('');
  const [idUser, setIdUser] = useState('');
  const [note, setNote] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (contatto) {
      setNome(contatto.nome || '');
      setCognome(contatto.cognome || '');
      setTelefono(contatto.telefono || '');
      setEmail(contatto.email || '');
      setIndirizzo(contatto.indirizzo || '');
      setIdUser(contatto.id_user || '');
      setNote(contatto.note || '');
      setIsActive(Boolean(contatto.is_active));
    } else {
      setNome('');
      setCognome('');
      setTelefono('');
      setEmail('');
      setIndirizzo('');
      setIdUser('');
      setNote('');
      setIsActive(true);
    }
    setErrorMsg(null);
  }, [contatto, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const payload = {
      id_hub: hubId,
      id_user: idUser.trim() || null,
      nome,
      cognome: cognome || null,
      telefono: telefono || null,
      email: email || null,
      indirizzo: indirizzo || null,
      note: note || null,
      is_active: isActive,
    };

    let res;
    if (contatto?.id) {
      res = await updateRubricaAction(contatto.id, payload, hubSlug);
    } else {
      res = await createRubricaAction(payload, hubSlug);
    }

    if (!res.success) {
      setErrorMsg(res.error || 'Errore durante il salvataggio');
      return;
    }

    startTransition(() => {
      router.refresh();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base tracking-tight flex items-center gap-2">
                <Contact className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                {contatto ? 'Modifica Contatto' : 'Nuovo Contatto Rubrica'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inserisci i dati del cliente locale.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <form id="rubrica-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
            {errorMsg && (
              <div className="p-3.5 text-xs bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 rounded-2xl font-medium">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Nome"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cognome
                </label>
                <input
                  type="text"
                  value={cognome}
                  onChange={(e) => setCognome(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="Cognome"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Telefono
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+39 333 1234567"
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@email.it"
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Indirizzo
              </label>
              <input
                type="text"
                value={indirizzo}
                onChange={(e) => setIndirizzo(e.target.value)}
                placeholder="Via Roma 12"
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                ID Utente Collegato <span className="text-slate-400 font-normal">(UUID Auth opzionale)</span>
              </label>
              <input
                type="text"
                value={idUser}
                onChange={(e) => setIdUser(e.target.value)}
                placeholder="Es. c0a80101-0000-0000-0000-000000000000"
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs font-mono bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Se impostato, collega questo contatto rubrica all'utente registrato e ne popolerà in automatico l'ID nelle prenotazioni.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Note
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Preferenze, allergie o indicazioni particolari..."
                className="w-full border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all"
              />
            </div>

            {/* Toggle Flags */}
            <div className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
              <label className="flex justify-between items-center cursor-pointer select-none">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Contatto Attivo</span>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded-md border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-indigo-500"
                />
              </label>
            </div>
          </form>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              form="rubrica-form"
              disabled={isPending}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              {isPending ? 'Salvataggio...' : 'Salva Contatto'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}