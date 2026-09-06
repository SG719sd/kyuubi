import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { HubService } from "@/server/services/hub.service";
import { HubWithProfessionista } from "@/types";
import { HubLogoUploader } from "@/components/views/dashboard/hub-logo-uploader";
import BackButton from "@/components/layout/back-button";
import {
  Users,
  ShoppingBag,
  Briefcase,
  UtensilsCrossed,
  CalendarCheck,
  Info,
  ShieldCheck,
  Globe,
  MapPin,
  Mail,
  Phone,
  Settings,
  BookUser,
  ArrowRight,
} from "lucide-react";
import { HubShareActions } from "@/server/actions/hub-share-actions";

// Per le azioni interattive Client-Side (Copia / Condividi)

interface HubLandingPageProps {
  params: Promise<{
    slugHub: string;
  }>;
}

export default async function HubLandingPage({ params }: HubLandingPageProps) {
  const { slugHub } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const rawData = await HubService.getHubWithProfessionista(slugHub, user.id);

  if (!rawData || !rawData.hub) {
    notFound();
  }

  const { hub, professionista } = rawData as unknown as HubWithProfessionista;

  // Permesso di scrittura: TRUE se il booleano 'admin' è true OPPURE se il campo 'ruolo' è 'admin'
  const canManageLogo = Boolean(
    professionista?.admin || professionista?.ruolo?.toLowerCase() === "admin",
  );

  const managementModules = [
    {
      title: "Servizi",
      description:
        "Gestisci i servizi offerti ai clienti, listini prezzi e durate.",
      href: `/dashboard/hubs/${hub.slug}/servizi`,
      icon: Briefcase,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10",
      borderHover: "hover:border-indigo-500/50",
      disabled: false,
    },
    {
      title: "Prenotazioni",
      description:
        "Consulta il calendario appuntamenti e gestisci le disponibilità.",
      href: `/dashboard/hubs/${hub.slug}/prenotazioni`,
      icon: CalendarCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      borderHover: "hover:border-emerald-500/50",
      disabled: true,
    },
    {
      title: "Prodotti",
      description:
        "Catalogo prodotti in vendita, giacenze di magazzino e categorie.",
      href: `/dashboard/hubs/${hub.slug}/prodotti`,
      icon: ShoppingBag,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      borderHover: "hover:border-amber-500/50",
      disabled: false,
    },
    {
      title: "Menu & Piatti",
      description:
        "Crea il menu digitale, lista allergeni e variazioni piatti.",
      href: `/dashboard/hubs/${hub.slug}/piatti`,
      icon: UtensilsCrossed,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
      borderHover: "hover:border-rose-500/50",
      disabled: false,
    },
    {
      title: "Rubrica Clienti",
      description:
        "Gestisci i contatti e i dati dei clienti salvati in locale.",
      href: `/dashboard/hubs/${hub.slug}/rubrica`,
      icon: BookUser,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-500/10",
      borderHover: "hover:border-teal-500/50",
      disabled: false,
    },
    {
      title: "Team & Membri",
      description:
        "Gestisci lo staff, i ruoli e i permessi di accesso per questo Hub.",
      href: `/dashboard/hubs/${hub.slug}/professionisti`,
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10",
      borderHover: "hover:border-purple-500/50",
      disabled: false,
    },
    {
      title: "Gestione Hub",
      description:
        "Configura orari di apertura, listini personalizzati dello staff e profilo dell'Hub.",
      href: `/dashboard/hubs/${hub.slug}/gestione`,
      icon: Settings,
      color: "text-slate-600 dark:text-slate-300",
      bg: "bg-slate-500/10",
      borderHover: "hover:border-indigo-500/50",
      disabled: false,
    },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* HERO HEADER HUB */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl border border-indigo-500/20">
        {/* Pulsante Torna Indietro */}
        <div className="mb-6 relative z-10">
          <BackButton />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start md:items-center gap-5">
            {/* UPLOADER LOGO */}
            <HubLogoUploader
              hubId={hub.id}
              slugHub={hub.slug}
              currentLogoUrl={hub.logo_url || null}
              isAdmin={canManageLogo}
            />

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold uppercase tracking-wider">
                  HUB MANAGEMENT
                </span>
                {canManageLogo && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    <ShieldCheck className="w-3 h-3" /> ADMIN / OWNER
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">
                {hub.nome}
              </h1>

              {/* COMPONENTE LINK + PULSANTI COPIA E CONDIVISIONE */}
              <HubShareActions slug={hub.slug} nome={hub.nome} />
            </div>
          </div>

          {/* PULSANTE INFO & IMPOSTAZIONI */}
          <Link
            href={`/dashboard/hubs/${hub.slug}/gestione/info`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-2xl transition-all self-start md:self-auto border border-white/10 backdrop-blur-md shadow-xs"
          >
            <Info className="w-4 h-4 text-indigo-300" />
            <span>Informazioni & Impostazioni</span>
          </Link>
        </div>

        {/* DETTAGLI VELOCI (INDIRIZZO, CONTATTI) */}
        <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-indigo-100/70 relative z-10">
          {hub.indirizzo && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">
                {hub.indirizzo}
                {hub.citta ? `, ${hub.citta}` : ""}
              </span>
            </div>
          )}
          {hub.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{hub.email}</span>
            </div>
          )}
          {hub.telefono && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="truncate">{hub.telefono}</span>
            </div>
          )}
          {hub.sito_web && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
              <a
                href={hub.sito_web}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-indigo-200 truncate"
              >
                {hub.sito_web}
              </a>
            </div>
          )}
        </div>

        {/* Decorazioni di Sfondo Hero */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* MODULI DI GESTIONE HUB */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Pannelli di Gestione
          </h2>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            {managementModules.length} Moduli attivi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {managementModules.map((module) => {
            const Icon = module.icon;
            const cardClassName = `group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between space-y-6 relative overflow-hidden ${
              module.disabled
                ? "opacity-50 cursor-not-allowed select-none"
                : `${module.borderHover} hover:-translate-y-1 hover:shadow-lg shadow-xs`
            }`;

            const cardContent = (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl ${module.bg} ${module.color} flex items-center justify-center transition-transform ${
                      !module.disabled && "group-hover:scale-110"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div
                    className={`w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-all ${
                      !module.disabled &&
                      "group-hover:bg-indigo-600 group-hover:text-white"
                    }`}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                <h3
                  className={`text-lg font-bold text-slate-900 dark:text-white mb-1.5 transition-colors ${
                    !module.disabled &&
                    "group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                  }`}
                >
                  {module.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {module.description}
                </p>
              </div>
            );

            if (module.disabled) {
              return (
                <div key={module.title} className={cardClassName}>
                  {cardContent}
                </div>
              );
            }

            return (
              <Link
                key={module.title}
                href={module.href}
                className={cardClassName}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}