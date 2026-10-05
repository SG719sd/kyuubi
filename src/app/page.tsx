import Link from 'next/link';
import {
  Rocket,
  CalendarCheck,
  ShoppingBag,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  Store,
  CheckCircle2,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: CalendarCheck,
      title: 'Agenda & Prenotazioni',
      badge: 'Real-Time',
      desc: 'Gestione orari, slot per operatori e sincronizzazione automatica degli appuntamenti dello staff.',
      color: 'from-blue-500 to-indigo-600',
      lightBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
    {
      icon: UtensilsCrossed,
      title: 'Comande & Menù Piatti',
      badge: 'Novità Comande',
      desc: 'Ordini veloci da tavolo o asporto, gestione allergeni, tempi di preparazione e cucina integrata.',
      color: 'from-rose-500 to-amber-600',
      lightBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
    {
      icon: ShoppingBag,
      title: 'Magazzino & Carrelli',
      badge: 'Novità Carrelli',
      desc: 'Pre-prenotazione articoli, giacenze dinamiche in tempo reale, barcode SKU e scorte con alert.',
      color: 'from-amber-500 to-orange-600',
      lightBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      icon: Store,
      title: 'Multi-Hub Vetrina',
      badge: 'Ecosistema',
      desc: 'Ogni attività dispone di un URL dedicato, listini personalizzati per professionista e logo personalizzato.',
      color: 'from-emerald-500 to-teal-600',
      lightBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background Glows & Grid */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-96 h-96 bg-indigo-600/25 rounded-full blur-[128px]" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-sky-500/20 rounded-full blur-[140px]" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/15 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 space-y-24">
        
        {/* HERO SECTION */}
        <section className="text-center max-w-4xl mx-auto space-y-8 pt-6 sm:pt-12">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-indigo-500/30 text-indigo-300 shadow-lg shadow-indigo-500/10 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-black tracking-widest uppercase">
              Kyuubi Hub Engine v2.0
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-semibold text-emerald-400">Moduli Attivi</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-white">
            La gestione totale del tuo Hub,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400">
              senza compromessi.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Dalla prenotazione dei servizi alle <strong className="text-white">Comande per i piatti</strong> e ai <strong className="text-white">Carrelli prodotti</strong>. Un'infrastruttura multi-tenant ultrarapida, modulare e disegnata per le attività che non si fermano mai.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/login?tab=login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-sky-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-black text-sm shadow-xl shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <span>Accedi alla Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/login?tab=register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm transition-all hover:border-slate-600"
            >
              <Rocket className="w-4 h-4 text-sky-400" />
              <span>Crea il tuo Hub Gratis</span>
            </Link>
          </div>

          {/* Highlights Mini-Bar */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% In-Cloud & Reale</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Nuovi Moduli Comande & Carrelli</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero Configurazione Server</span>
            </div>
          </div>
        </section>

        {/* INTERACTIVE MODULES SHOWCASE */}
        <section className="space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-black tracking-widest text-sky-400 uppercase">ARCHITETTURA MODULARE</span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tutto ciò di cui ha bisogno il tuo business
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              Attiva solo ciò che ti serve: servizi tradizionali per appuntamenti, comande per bar e ristoranti, oppure carrelli per e-commerce e magazzino.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="group relative bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${feat.lightBg} border transition-transform group-hover:scale-110`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {feat.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
                      {feat.title}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-indigo-400 transition-colors">
                    <span>Modulo pronto</span>
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PREVIEW BANNER / CTA */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/90 via-slate-900 to-slate-950 border border-indigo-500/30 p-8 sm:p-12 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <span className="text-[11px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30">
                PROVA KYUUBI OGGI
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Pronto a potenziare il tuo flusso di lavoro?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Nessun costo iniziale: accedi all'infrastruttura completa e configura il tuo Hub in meno di 2 minuti.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <Link
                href="/login?tab=register"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-black text-xs text-center transition-all shadow-lg"
              >
                Inizia Subito
              </Link>
              <Link
                href="/prezzi"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs text-center border border-slate-700 transition-all"
              >
                Scopri i Piani
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
