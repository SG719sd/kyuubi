import { notFound } from 'next/navigation';
import { getHubContext } from '@/server/auth/context';
import { ServiziService } from '@/server/services/servizi.service';
import { ProfessionistiService } from '@/server/services/professionisti.service';
import { createClient } from '@/utils/supabase/server';
import ServiziProfessionistiView from '@/components/views/dashboard/servizi-professionisti/servizi-professionisti-view';
import HubPageWrapper from '@/components/layout/wrapper/HubPageWrapper';
import BackButton from '@/components/layout/back-button';

export const dynamic = 'force-dynamic';

export default async function ServiziProfessionistiPage({
  params,
}: {
  params: Promise<{ hubSlug: string }>;
}) {
  const { hubSlug } = await params;
  const ctx = await getHubContext(hubSlug);

  if (!ctx) notFound();

  const supabase = await createClient();

  // Carichiamo servizi base dell'Hub, lista dei professionisti e tutte le sovrascritture esistenti
  const [servizi, professionisti, { data: personalizzazioni }] = await Promise.all([
    ServiziService.listServizi(ctx.hubId),
    ProfessionistiService.listProfessionisti(ctx.hubId),
    supabase.from('professionisti_servizi').select('*').eq('id_hub', ctx.hubId),
  ]);

  return (
    <HubPageWrapper slugHub={hubSlug}>
      {/* Hero Header Server-Side */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-indigo-500/20 mb-6">
        
        {/* Pulsante Torna Indietro */}
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Contenuto Hero */}
        <div className="relative z-10 space-y-3 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-medium">
            <span>🏷️ Personalizzazione Listino</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
            Servizi Professionisti
          </h1>

          <p className="text-xs md:text-sm text-indigo-100/80 leading-relaxed">
            Personalizza tariffe, durate ed erogazione dei servizi per ciascun membro dello staff rispetto al listino generale dell'Hub.
          </p>
        </div>

        {/* Decorazioni di Sfondo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Vista Client */}
      <ServiziProfessionistiView
        servizi={servizi}
        professionisti={professionisti}
        personalizzazioni={personalizzazioni || []}
        hubId={ctx.hubId}
        hubSlug={hubSlug}
        isAdmin={ctx.isAdmin}
      />
    </HubPageWrapper>
  );
}