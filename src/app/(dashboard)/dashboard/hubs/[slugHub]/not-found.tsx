import Link from 'next/link';
import { ShieldX, ArrowLeft } from 'lucide-react';

export default function HubNotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl space-y-5">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldX className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Hub non trovato o non autorizzato
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Non hai i permessi per accedere a questo Hub oppure l'Hub richiesto non esiste o è stato rimosso.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
