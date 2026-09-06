'use client';

import React, { useState } from 'react';
import { updateProfileAction, deleteAccountAction } from '@/server/actions/user.actions';
import CopyButton from '@/components/layout/copy-button';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Save, 
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface ProfileViewProps {
  authUser: {
    id: string;
    email?: string;
  };
  userProfile: {
    nome?: string;
    cognome?: string;
    telefono?: string | null;
    created_at?: string;
  } | null;
}

export function ProfileView({ authUser, userProfile }: ProfileViewProps) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  async function handleUpdate(formData: FormData) {
    setLoading(true);
    setFeedback(null);

    const res = await updateProfileAction(formData);

    if (res?.error) {
      setFeedback({ type: 'error', message: res.error });
    } else if (res?.success) {
      setFeedback({ type: 'success', message: res.success });
    }

    setLoading(false);
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    await deleteAccountAction();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white p-4 md:p-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER PROFILO */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-lg transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-sky-500/20 shrink-0">
              {userProfile?.nome ? userProfile.nome[0].toUpperCase() : 'U'}
            </div>
            <div>
              <span className="text-xs font-black tracking-widest text-sky-600 dark:text-sky-400 uppercase">
                IMPOSTAZIONI UTENTE
              </span>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {userProfile?.nome ? `${userProfile.nome} ${userProfile.cognome || ''}` : 'Profilo Utente'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {authUser?.email}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Account Attivo</span>
          </div>
        </div>

        {/* FEEDBACK MESSAGES */}
        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 border ${
              feedback.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* SIDEBAR Dettagli tecnici */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                ID Account
              </h3>

              <div className="text-xs space-y-3">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <Mail className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <div className="truncate">
                    <span className="block font-bold text-slate-900 dark:text-white">Email</span>
                    <span className="truncate block">{authUser?.email}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="block text-[11px] font-mono text-slate-400">
                    UUID
                  </span>
                  <CopyButton textToCopy={authUser?.id} label="Copia UUID" />
                </div>
              </div>
            </div>

            {/* ZONA PERICOLO / SOFT DELETE */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 space-y-3">
              <h3 className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Zona Pericolo</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Disattivando l'account i tuoi dati verranno archiviati (Soft Delete) e verrai disconnesso.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>DISATTIVA ACCOUNT</span>
              </button>
            </div>
          </div>

          {/* FORM MODIFICA PROFILO */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Dettagli Personali</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aggiorna i dati relativi al tuo profilo.
                </p>
              </div>

              <form action={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Nome *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        name="nome"
                        type="text"
                        defaultValue={userProfile?.nome || ''}
                        placeholder="Mario"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Cognome *
                    </label>
                    <input
                      name="cognome"
                      type="text"
                      defaultValue={userProfile?.cognome || ''}
                      placeholder="Rossi"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Telefono
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      name="telefono"
                      type="tel"
                      defaultValue={userProfile?.telefono || ''}
                      placeholder="+39 333 1234567"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-black rounded-2xl shadow-lg shadow-sky-500/20 transition-all transform active:scale-[0.98]"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{loading ? 'SALVATAGGIO...' : 'SALVA MODIFICHE'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>

      </div>

      {/* MODALE DI CONFERMA CANCELLAZIONE */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-slate-900 dark:text-white">Confermi la disattivazione?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Il tuo account verrà disattivato (`is_active: false`) e contrassegnato con data di eliminazione (`deleted_at`).
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Annulla
              </button>
              
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all shadow-md shadow-red-500/20"
              >
                {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{deleteLoading ? 'DISATTIVAZIONE...' : 'SI, DISATTIVA'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}