import Link from 'next/link';

export default function SupportoPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header principale */}
        <div className="text-center space-y-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            Centro Assistenza & Contatti
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Come possiamo aiutarti?
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Siamo a tua disposizione per assistenza tecnica, informazioni sulle funzionalità dell'ecosistema o supporto nella gestione del tuo Hub.
          </p>
        </div>

        {/* Griglia Contatti Diretti */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card Email */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 font-bold text-lg">
                ✉️
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Email</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scrivici per qualsiasi dubbio o segnalazione tecnica.
              </p>
            </div>
            <a 
              href="mailto:eazyhubs@gmail.com" 
              className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs hover:bg-sky-600 hover:text-white dark:hover:bg-sky-500 transition-colors"
            >
              Invia un'email
            </a>
          </div>

          {/* Card WhatsApp & Telefono */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                💬
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">WhatsApp & Telefono</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supporto rapido direttamente via chat o chiamata.
              </p>
            </div>
            <div className="flex gap-2">
              <a 
                href="https://wa.me/393518216235" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-1 inline-flex items-center justify-center py-2.5 px-2 rounded-xl bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 transition-colors text-center"
              >
                WhatsApp
              </a>
              <a 
                href="tel:+393518216235" 
                className="flex-1 inline-flex items-center justify-center py-2.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-center"
              >
                Chiama
              </a>
            </div>
          </div>

          {/* Card Chi Siamo / Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg flex flex-col justify-between space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-lg">
                🌐
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Chi Siamo</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scopri la visione dietro Eazyhubs e il nostro ecosistema.
              </p>
            </div>
            <a 
              href="https://eazyhubs.com/chi-siamo" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-xs hover:bg-purple-600 hover:text-white dark:hover:bg-purple-500 transition-colors"
            >
              Visita eazyhubs.com
            </a>
          </div>

        </div>

        {/* Sezione FAQ rapide */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Domande Frequenti (FAQ)
          </h2>
          
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="space-y-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Come faccio a configurare il mio primo Hub?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Dopo la registrazione ti basterà accedere alla tua Dashboard per impostare orari di apertura, dati di contatto, prodotti o servizi offerti.
              </p>
            </div>

            <hr className="border-slate-100 dark:border-slate-800" />

            <div className="space-y-1">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Cosa comporta la fase BETA gratuita?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Tutte le funzionalità (compresi menù, listini e prenotazioni) sono al momento gratuite. L'Hub base rimarrà gratuito per sempre anche al termine della Beta.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <span>Supporto & Assistenza • Kyuubi Platform</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy-policy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/pricing" className="hover:underline">
              Prezzi
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