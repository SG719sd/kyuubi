import React from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { UserService } from '@/server/services/user.service';
import { HubService } from '@/server/services/hub.service';
import { logoutAction } from '@/server/actions/auth.actions';
import {
  Store,
  Plus,
  ChevronRight,
  LogOut,
  Sparkles,
  TrendingUp,
  Building2
} from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return null;
  }

  // Chiamate parallele per Profilo Utente e Lista degli Hubs
  const [userProfile, userHubs] = await Promise.all([
    UserService.findById(authUser.id).catch(() => null),
    HubService.getUserHubs(authUser.id).catch(() => [])
  ]);

  const initialLetter = userProfile?.nome 
    ? userProfile.nome[0].toUpperCase() 
    : (authUser.email ? authUser.email[0].toUpperCase() : 'K');

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white p-4 md:p-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* TOP BAR / HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/95 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-lg transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-500/20 shrink-0">
              {initialLetter}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-sky-600 dark:text-sky-400 uppercase">KYUUBI DASHBOARD</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Ciao, {userProfile ? `${userProfile.nome} ${userProfile.cognome}` : authUser.email}!
              </h1>
            </div>
          </div>
        </header>

        {/* HERO METRICS / STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">I Tuoi Hubs</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white">{userHubs.length}</span>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Stato Account</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">ATTIVO</span>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Piano Kyuubi</span>
              <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">STARTER</span>
            </div>
          </div>
        </div>

        {/* SEZIONE HUBS UTENTE */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black text-sky-600 dark:text-sky-400 tracking-widest uppercase">GESTIONE VETRINE</span>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">I tuoi Hubs Registrati</h2>
            </div>

            <Link
              href="/dashboard/hubs/nuovo"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-black rounded-2xl shadow-lg shadow-sky-500/20 transition-all transform active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>CREA NUOVO HUB</span>
            </Link>
          </div>

          {/* GRIGLIA HUBS REALI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userHubs.length > 0 ? (
              userHubs.map((hub) => (
                <div
                  key={hub.id}
                  className="group relative bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-sky-500/80 dark:hover:border-sky-400/80 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-sky-500/10 flex flex-col justify-between shadow-sm"
                >
                  <div>
                    {/* LOGO OPPURE ICONA DI FALLBACK */}
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-600/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform overflow-hidden border border-slate-200/60 dark:border-slate-800 shrink-0">
                      {hub.logo_url ? (
                        <img 
                          src={hub.logo_url} 
                          alt={hub.nome} 
                          className="w-full h-full object-cover rounded-2xl" 
                        />
                      ) : (
                        <Store className="w-6 h-6" />
                      )}
                    </div>

                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">{hub.nome}</h3>
                    <p className="text-xs font-mono text-sky-600 dark:text-sky-400/80 mb-3">eazyhubs.com/{hub.slug}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs line-clamp-2 mb-6">
                      {hub.descrizione || 'Nessuna descrizione impostata per questo Hub.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                      ATTIVO
                    </span>

                    {/* ROUTING CORRETTO ALLO SLUG */}
                    <Link
                      href={`/dashboard/hubs/${hub.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-black text-sky-700 dark:text-sky-400 group-hover:text-sky-600 dark:group-hover:text-blue-400 transition-colors"
                    >
                      <span>GESTISCI</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              /* CARD VUOTA */
              <div className="col-span-full border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 text-center space-y-4 bg-slate-50 dark:bg-slate-900/30 transition-colors">
                <div className="w-16 h-16 rounded-3xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-inner">
                  <Store className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Non hai ancora creato nessun Hub</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-xs max-w-md mx-auto mt-1">
                    Inizia subito a configurare la tua vetrina digitale per gestire prodotti, servizi e prenotazioni.
                  </p>
                </div>
                <Link
                  href="/dashboard/hubs/nuovo"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-2xl transition-all shadow-lg shadow-sky-600/20 transform active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>CREA IL TUO PRIMO HUB</span>
                </Link>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}