import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { HubService } from '@/server/services/hub.service';
import BackButton from '@/components/layout/back-button';
import HubPageWrapper from '@/components/layout/wrapper/HubPageWrapper';
import {
  Clock,
  UserCheck,
  Building2,
  ChevronRight
} from 'lucide-react';

interface GestioneHubPageProps {
  params: Promise<{
    slugHub: string;
  }>;
}

export default async function GestioneHubPage({ params }: GestioneHubPageProps) {
  const { slugHub } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const rawData = await HubService.getHubWithProfessionista(slugHub, user.id);

  if (!rawData || !rawData.hub) {
    notFound();
  }

  const moduliGestione = [
    {
      titolo: 'Orari di Apertura',
      descrizione: 'Configura i giorni e le fasce orarie di apertura del tuo Hub e dello staff.',
      icona: Clock,
      href: `/dashboard/hubs/${slugHub}/gestione/orari`,
      colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      titolo: 'Servizi Professionisti',
      descrizione: 'Personalizza tariffe, durate ed erogazione dei servizi per ciascun membro dello staff.',
      icona: UserCheck,
      href: `/dashboard/hubs/${slugHub}/gestione/servizi-professionisti`,
      colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      titolo: 'Il Mio Hub',
      descrizione: 'Modifica le informazioni generali, contatti, indirizzo e impostazioni del profilo Hub.',
      icona: Building2,
      href: `/dashboard/hubs/${slugHub}/gestione/info`,
      colorClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
  ];

  return (
    <HubPageWrapper slugHub={slugHub}>
      {/* Hero Principale integrata nel Server Component */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-500/20 mb-6">
        
        {/* Pulsante Torna Indietro */}
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Contenuto Hero */}
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-medium">
            <span>⚙️ Impostazioni e Configurazione</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
            Gestione Hub
          </h1>

          <p className="text-xs md:text-sm text-indigo-100/80 leading-relaxed">
            Gestisci la struttura dell'Hub, definisci gli orari di attività, le personalizzazioni del listino per operatore e le informazioni aziendali.
          </p>
        </div>

        {/* Decorazioni di Sfondo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* CARDS MODULI GESTIONE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {moduliGestione.map((modulo) => {
          const Icona = modulo.icona;
          return (
            <Link
              key={modulo.href}
              href={modulo.href}
              className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-md shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className={`w-12 h-12 rounded-2xl ${modulo.colorClass} border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shrink-0`}>
                  <Icona className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {modulo.titolo}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {modulo.descrizione}
                </p>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                <span>Accedi al pannello</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </HubPageWrapper>
  );
}