import { notFound } from 'next/navigation';
import { getHubContext } from '@/server/auth/context';
import { PrenotazioniService } from '@/server/services/prenotazioni.service';
import { ProfessionistiService } from '@/server/services/professionisti.service';
import { ProfessionistiServiziService } from '@/server/services/professionisti-servizi.service';
import { RubricaService } from '@/server/services/rubrica.service';
import { ServiziService } from '@/server/services/servizi.service';
import { ProdottiService } from '@/server/services/prodotti.service';
import { PiattiService } from '@/server/services/piatti.service';
import CarrelliView from '@/components/views/dashboard/carrelli/carrelli-view';
import BackButton from '@/components/layout/back-button';
import HubPageWrapper from '@/components/layout/wrapper/HubPageWrapper';

export const dynamic = 'force-dynamic';

export default async function CarrelliPage({
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
      {/* Intestazione Compatta ed Elegante */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Carrelli per i Prodotti</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-bold border border-amber-200/60 dark:border-amber-800/60 hidden sm:inline-block">
                E-commerce & Cassa
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gestione ordini d&apos;acquisto, pre-prenotazione prodotti e ritiro al banco
            </p>
          </div>
        </div>
      </div>

      {/* Vista Gestionale Carrelli (Client Component) */}
      <CarrelliView
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
