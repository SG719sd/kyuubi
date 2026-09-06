import { notFound } from 'next/navigation';
import { getHubContext } from '@/server/auth/context';
import { OrariService } from '@/server/services/orari.service';
import { ProfessionistiService } from '@/server/services/professionisti.service';
import OrariView from '@/components/views/dashboard/orari/orari-view';
import HubPageWrapper from '@/components/layout/wrapper/HubPageWrapper';
import BackButton from '@/components/layout/back-button';

export const dynamic = 'force-dynamic';

export default async function OrariPage({
  params,
}: {
  params: Promise<{ slugHub: string }>;
}) {
  const { slugHub } = await params;
  const ctx = await getHubContext(slugHub);

  if (!ctx) notFound();

  // Carichiamo tutti gli orari (sia generali che di ciascun professionista)
  const orari = await OrariService.listOrari(ctx.hubId);
  const professionisti = await ProfessionistiService.listProfessionisti(ctx.hubId);

  return (
    <HubPageWrapper slugHub={slugHub}>
      {/* Hero Header Server-Side */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-500/20 mb-6">
        
        {/* Pulsante Torna Indietro */}
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Contenuto Hero */}
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-medium">
            <span>⏰ Pianificazione Settimanale</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
            Gestione Orari di Lavoro
          </h1>

          <p className="text-xs md:text-sm text-indigo-100/80 leading-relaxed">
            Imposta le fasce orarie e i giorni di chiusura per la struttura generale dell'Hub o per i singoli membri dello staff.
          </p>
        </div>

        {/* Decorazioni di Sfondo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Vista Client */}
      <OrariView
        orari={orari}
        professionisti={professionisti}
        hubId={ctx.hubId}
        hubSlug={slugHub}
        isAdmin={ctx.isAdmin}
      />
    </HubPageWrapper>
  );
}