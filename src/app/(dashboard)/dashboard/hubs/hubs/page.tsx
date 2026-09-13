import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowLeft, ShieldCheck, Layers } from 'lucide-react';

export default function CustomHubsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alla Dashboard
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Custom Hub Routing
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Hub &quot;hubs&quot; Personalizzato
              </h1>
            </div>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Questa rotta statica <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-mono text-indigo-600 dark:text-indigo-400">/dashboard/hubs/hubs</code> convive perfettamente nella stessa cartella con la rotta dinamica <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-mono text-indigo-600 dark:text-indigo-400">/dashboard/hubs/[slugHub]</code>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Priorità di Routing
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                In Next.js App Router, i segmenti statici hanno sempre la precedenza su quelli dinamici. Le richieste a <span className="font-mono text-slate-700 dark:text-slate-300">/hubs</span> atterrano qui, mentre tutti gli altri slug vengono serviti da <span className="font-mono text-slate-700 dark:text-slate-300">[slugHub]</span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <Layers className="w-4 h-4 text-indigo-500" />
                Totale Indipendenza
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Puoi personalizzare layout, componenti, logica di accesso e viste in modo del tutto autonomo rispetto alla struttura standard degli altri Hub.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
