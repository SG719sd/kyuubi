import { notFound } from 'next/navigation';
import { getHubContext } from '@/server/auth/context';
import { PrenotazioniService } from '@/server/services/prenotazioni.service';
import { ProfessionistiService } from '@/server/services/professionisti.service';
import { ProfessionistiServiziService } from '@/server/services/professionisti-servizi.service';
import { RubricaService } from '@/server/services/rubrica.service';
import { ServiziService } from '@/server/services/servizi.service';
import { ProdottiService } from '@/server/services/prodotti.service';
import { PiattiService } from '@/server/services/piatti.service';
import PrenotazioniView from '@/components/views/dashboard/prenotazioni/prenotazioni-view';
import BackButton from '@/components/layout/back-button';
import HubPageWrapper from '@/components/layout/wrapper/HubPageWrapper';

export const dynamic = 'force-dynamic';

export default async function PrenotazioniPage({
  params,
}: {
  params: Promise<{ slugHub: string }>;
}) {
  const { slugHub } = await params;
  const ctx = await getHubContext(slugHub);

  if (!ctx) notFound();

  // Caricamento dati parallelo tramite Services
  const [
    prenotazioni,
    professionisti,
    professionistiServizi,
    clienti,
    servizi,
    prodotti,
    piatti,
  ] = await Promise.all([
    PrenotazioniService.listPrenotazioni(ctx.hubId),
    ProfessionistiService.listProfessionisti(ctx.hubId),
    ProfessionistiServiziService.listByHub(ctx.hubId),
    RubricaService.listContatti(ctx.hubId),
    ServiziService.listServizi(ctx.hubId),
    ProdottiService.listProdotti(ctx.hubId),
    PiattiService.listPiatti(ctx.hubId),
  ]);

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-medium">
            <span>📅 Agenda & Appuntamenti</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
            Gestione Prenotazioni
          </h1>

          <p className="text-xs md:text-sm text-indigo-100/80 leading-relaxed">
            Monitora l'agenda degli appuntamenti, pianifica nuovi slot per il tuo staff, gestisci lo stato delle richieste e visualizza i clienti associati.
          </p>
        </div>

        {/* Decorazioni di Sfondo */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Vista Gestionale (Client Component) */}
      <PrenotazioniView
        prenotazioni={prenotazioni}
        professionisti={professionisti}
        professionistiServizi={professionistiServizi}
        clienti={clienti}
        servizi={servizi}
        prodotti={prodotti}
        piatti={piatti}
        hubId={ctx.hubId}
        hubSlug={slugHub}
        isAdmin={ctx.isAdmin}
      />
    </HubPageWrapper>
  );
}
