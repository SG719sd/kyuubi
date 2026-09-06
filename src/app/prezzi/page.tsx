import Link from 'next/link';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header principale */}
        <div className="text-center space-y-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            Fase BETA • 100% Gratuito
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Piani e Prezzi
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Stiamo costruendo Eazyhubs insieme a voi. Durante la fase Beta tutte le funzionalità sono completamente gratuite.
          </p>
        </div>

        {/* Card Trasparenza BETA */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-6 sm:p-8 space-y-3">
          <h2 className="text-base font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
            💡 Come funzionerà in futuro?
          </h2>
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            Crediamo nel supporto alle attività locali: la creazione dell'<strong>Hub base</strong> (con orari di apertura, contatti e info generali) <strong>rimarrà gratuita per sempre</strong>. Quando usciremo dalla fase Beta, introdurremo dei piani trasparenti e accessibili solo per chi sceglierà di attivare le funzionalità avanzate, come l'inserimento di prodotti, menù, listini servizi o il modulo di prenotazione online.
          </p>
        </div>

        {/* Griglia Piani Futuri */}
        <div className="grid md:grid-cols-2 gap-6">
          
          {/* Piano BASE (Sempre Gratis) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Hub Base</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">La tua presenza digitale essenziale</p>
                </div>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">€0</span>
              </div>
              
              <hr className="border-slate-100 dark:border-slate-800" />

              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Profilo Hub personalizzato
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Orari di apertura e contatti
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Mappa e indicazioni stradali
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✓</span> Inserimento nel network Eazyhubs
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 text-center">
              Sempre gratuito per tutti gli Hub
            </div>
          </div>

          {/* Piano PRO (Beta Gratis / Futuro a pagamento) */}
          <div className="bg-white dark:bg-slate-900 border-2 border-sky-500 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-sky-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl">
              Incluso in Beta
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Hub Pro & Business</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Gestione completa dell'attività</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">Gratis</span>
                  <span className="block text-[10px] text-slate-400">in fase BETA</span>
                </div>
              </div>
              
              <hr className="border-slate-100 dark:border-slate-800" />

              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="text-sky-500 font-bold">✓</span> <strong>Tutto ciò che include il piano Base</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sky-500 font-bold">✓</span> Listini, menù digitali e cataloghi prodotti
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sky-500 font-bold">✓</span> Gestione e pubblicazione dei <strong>Servizi offerti</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sky-500 font-bold">✓</span> Modulo prenotazioni online per clienti
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-sky-500 font-bold">✓</span> Gestione del pacchetto clienti e consensi
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-sky-600 dark:text-sky-400 font-medium text-center">
              Prezzo definitivo da definire al termine del periodo Beta
            </div>
          </div>

        </div>

        {/* Footer Navigation Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <span>Piani & Prezzi • Eazyhubs Ecosystem</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/login" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">
              Torna alla pagina d'accesso
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}