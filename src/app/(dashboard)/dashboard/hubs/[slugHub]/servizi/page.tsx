import { notFound } from 'next/navigation';
import { getHubContext } from '@/server/auth/context';
import { ServiziService } from '@/server/services/servizi.service';
import ServiziView from '@/components/views/dashboard/servizi/servizi-view';
import BackButton from '@/components/layout/back-button';
import HubPageWrapper from '@/components/layout/wrapper/HubPageWrapper';

export const dynamic = 'force-dynamic';

export default async function ServiziPage({
  params,
}: {
  params: Promise<{ slugHub: string }>; // 1. Cambiato da hubSlug a slugHub
}) {
  const { slugHub } = await params; // 2. Estrai slugHub
  const ctx = await getHubContext(slugHub); // 3. Passa slugHub a getHubContext

  if (!ctx) notFound();

  const servizi = await ServiziService.listServizi(ctx.hubId);

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
            <span>🛠️ Gestione Catalogo</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
            Catalogo Servizi
          </h1>

          <p className="text-xs md:text-sm text-indigo-100/80 leading-relaxed">
            Gestisci i servizi offerti, definisci tariffe, durate in minuti e requisiti degli operatori per questo Hub.
          </p>
        </div>

        {/* Decorazioni di Sfondo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Vista Gestionale (Client Component) */}
      <ServiziView
        servizi={servizi}
        hubId={ctx.hubId}
        hubSlug={slugHub}
        isAdmin={ctx.isAdmin}
      />
    </HubPageWrapper>
  );
}