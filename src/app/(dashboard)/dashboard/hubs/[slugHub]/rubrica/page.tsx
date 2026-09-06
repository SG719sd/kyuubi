import { notFound } from 'next/navigation';
import { getHubContext } from '@/server/auth/context';
import { RubricaService } from '@/server/services/rubrica.service';
import RubricaView from '@/components/views/dashboard/rubrica/rubrica-view';
import BackButton from '@/components/layout/back-button';
import HubPageWrapper from '@/components/layout/wrapper/HubPageWrapper';

export const dynamic = 'force-dynamic';

export default async function RubricaPage({
  params,
}: {
  params: Promise<{ slugHub: string }>;
}) {
  const { slugHub } = await params;
  const ctx = await getHubContext(slugHub);

  if (!ctx) notFound();

  const contatti = await RubricaService.listContatti(ctx.hubId);

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
            <span>📇 Gestione Clienti Locali</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
            Rubrica Clienti
          </h1>

          <p className="text-xs md:text-sm text-indigo-100/80 leading-relaxed">
            Salva e organizza i contatti diretti dei clienti che prenotano al telefono o di persona. Gestisci recapiti, indirizzi e note specifiche.
          </p>
        </div>

        {/* Decorazioni di Sfondo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Vista Gestionale (Client Component) */}
      <RubricaView
        contatti={contatti}
        hubId={ctx.hubId}
        hubSlug={slugHub}
        isAdmin={ctx.isAdmin}
      />
    </HubPageWrapper>
  );
}