"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updateHubGeneralAction,
  updateHubBillingAction,
  updateHubStyleSettingsAction,
} from "@/server/actions/hub-info.actions";
import { Database } from "@/types/database.types";
import {
  Building2,
  Receipt,
  Palette,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Globe,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  Utensils,
  Wrench,
  CalendarCheck,
  LayoutGrid,
} from "lucide-react";
import { PALETTE_OPTIONS, TYPE_OPTIONS } from "@/utils/constants/dropdown";

type HubRow = Database["public"]["Tables"]["hubs"]["Row"];
type BillingRow = Database["public"]["Tables"]["hub_billing_info"]["Row"];

interface Props {
  slugHub: string;
  isAdmin: boolean;
  initialData: {
    hub: HubRow;
    billing: BillingRow | null;
  };
}

export function HubInfoClient({ slugHub, isAdmin, initialData }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "billing" | "style">(
    "general",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // General Form State
  const [general, setGeneral] = useState({
    nome: initialData.hub.nome || "",
    slug: initialData.hub.slug || "",
    categoria: initialData.hub.categoria || "Non Specificata",
    email: initialData.hub.email || "",
    telefono: initialData.hub.telefono || "",
    indirizzo: initialData.hub.indirizzo || "",
    citta: initialData.hub.citta || "",
    cap: initialData.hub.cap || "",
    provincia: initialData.hub.provincia || "",
    sito_web: initialData.hub.sito_web || "",
    descrizione: initialData.hub.descrizione || "",
    orari_apertura: initialData.hub.orari_apertura || "",
  });

  // Billing Form State
  const [billing, setBilling] = useState({
    ragione_sociale: initialData.billing?.ragione_sociale || "",
    partita_iva: initialData.billing?.partita_iva || "",
    codice_fiscale: initialData.billing?.codice_fiscale || "",
    sdi_code: initialData.billing?.sdi_code || "",
    pec: initialData.billing?.pec || "",
    indirizzo_fatturazione: initialData.billing?.indirizzo_fatturazione || "",
  });

  // 🚀 Style & Features State
  const [styleSettings, setStyleSettings] = useState({
    has_products: Boolean(initialData.hub.has_products),
    has_dishes: Boolean(initialData.hub.has_dishes),
    has_services: Boolean(initialData.hub.has_services),
    has_booking: Boolean(initialData.hub.has_booking ?? true),
    style: initialData.hub.style || initialData.hub.type || "default",
    type: initialData.hub.style || initialData.hub.type || "default",
    palette: initialData.hub.palette || "emerald",
  });

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setLoading(true);
    setMessage(null);

    const res = await updateHubGeneralAction(slugHub, general);

    if (res.success) {
      setMessage({
        type: "success",
        text: "Informazioni generali aggiornate con successo!",
      });
      if (res.newSlug && res.newSlug !== slugHub) {
        router.push(`/dashboard/hubs/${res.newSlug}/gestione/info`);
      }
    } else {
      setMessage({
        type: "error",
        text: res.error || "Errore durante il salvataggio",
      });
    }
    setLoading(false);
  };

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setLoading(true);
    setMessage(null);

    const res = await updateHubBillingAction(slugHub, billing);

    if (res.success) {
      setMessage({
        type: "success",
        text: "Dati di fatturazione aggiornati con successo!",
      });
    } else {
      setMessage({
        type: "error",
        text: res.error || "Errore durante il salvataggio",
      });
    }
    setLoading(false);
  };

  const handleSaveStyleSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setLoading(true);
    setMessage(null);

    const res = await updateHubStyleSettingsAction(slugHub, {
      ...styleSettings,
      style: styleSettings.type,
    });

    if (res.success) {
      setMessage({
        type: "success",
        text: "Stile e impostazioni aggiornate con successo!",
      });
    } else {
      setMessage({
        type: "error",
        text: res.error || "Errore durante il salvataggio",
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Visual Badge per non-admin */}
      {!isAdmin && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs md:text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>
            Sei in modalità <strong>Solo Lettura</strong>. Solo gli
            amministratori dell'Hub possono apportare modifiche a questa
            sezione.
          </span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex-wrap gap-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab("general");
            setMessage(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "general"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Generale & Contatti</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("style");
            setMessage(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "style"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Impostazioni & Stile</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("billing");
            setMessage(null);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "billing"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Fatturazione & Dati Fiscali</span>
        </button>
      </div>

      {/* Alert Messaggi */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl text-xs md:text-sm border ${
            message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab 1: Info Generali */}
      {activeTab === "general" && (
        <form
          onSubmit={handleSaveGeneral}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Informazioni dell'Hub
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Aggiorna il nome dell'Hub, l'URL personalizzato e i dati di
              contatto pubblici.
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Nome Hub
                </label>
                <input
                  disabled={!isAdmin}
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  value={general.nome}
                  onChange={(e) =>
                    setGeneral({ ...general, nome: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  URL unico
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-xs text-slate-400 font-mono">
                    /hubs/
                  </span>
                  <input
                    disabled
                    type="text"
                    required
                    className="w-full pl-16 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    value={general.slug}
                    onChange={(e) =>
                      setGeneral({ ...general, slug: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email di
                  contatto
                </label>
                <input
                  disabled={!isAdmin}
                  type="email"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  value={general.email}
                  onChange={(e) =>
                    setGeneral({ ...general, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Telefono
                </label>
                <input
                  disabled={!isAdmin}
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  value={general.telefono}
                  onChange={(e) =>
                    setGeneral({ ...general, telefono: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> Sito Web
                </label>
                <input
                  disabled={!isAdmin}
                  type="text"
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  value={general.sito_web}
                  onChange={(e) =>
                    setGeneral({ ...general, sito_web: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" /> Indirizzo e Sede
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Via / Indirizzo
                  </label>
                  <input
                    disabled={!isAdmin}
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    value={general.indirizzo}
                    onChange={(e) =>
                      setGeneral({ ...general, indirizzo: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Città
                  </label>
                  <input
                    disabled={!isAdmin}
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    value={general.citta}
                    onChange={(e) =>
                      setGeneral({ ...general, citta: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    CAP
                  </label>
                  <input
                    disabled={!isAdmin}
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    value={general.cap}
                    onChange={(e) =>
                      setGeneral({ ...general, cap: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Provincia
                  </label>
                  <input
                    disabled={!isAdmin}
                    type="text"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    value={general.provincia}
                    onChange={(e) =>
                      setGeneral({ ...general, provincia: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Descrizione Hub
              </label>
              <textarea
                disabled={!isAdmin}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all resize-none"
                value={general.descrizione}
                onChange={(e) =>
                  setGeneral({ ...general, descrizione: e.target.value })
                }
              />
            </div>
          </div>

          {isAdmin && (
            <div className="p-4 bg-slate-50/80 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{loading ? "Salvataggio..." : "Salva Modifiche"}</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* Tab 2: Dati Fatturazione */}
      {activeTab === "billing" && (
        <form
          onSubmit={handleSaveBilling}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Dati di Fatturazione
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Inserisci i dati fiscali dell'azienda o della struttura per la
              fatturazione elettronica.
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Ragione Sociale / Intestazione
                </label>
                <input
                  disabled={!isAdmin}
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  value={billing.ragione_sociale}
                  onChange={(e) =>
                    setBilling({ ...billing, ragione_sociale: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Partita IVA
                </label>
                <input
                  disabled={!isAdmin}
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  value={billing.partita_iva}
                  onChange={(e) =>
                    setBilling({ ...billing, partita_iva: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Codice Fiscale
                </label>
                <input
                  disabled={!isAdmin}
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  value={billing.codice_fiscale}
                  onChange={(e) =>
                    setBilling({ ...billing, codice_fiscale: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Codice SDI
                </label>
                <input
                  disabled={!isAdmin}
                  type="text"
                  maxLength={10}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-mono uppercase"
                  value={billing.sdi_code}
                  onChange={(e) =>
                    setBilling({ ...billing, sdi_code: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  PEC
                </label>
                <input
                  disabled={!isAdmin}
                  type="email"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  value={billing.pec}
                  onChange={(e) =>
                    setBilling({ ...billing, pec: e.target.value })
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Indirizzo di Fatturazione
                </label>
                <input
                  disabled={!isAdmin}
                  type="text"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                  value={billing.indirizzo_fatturazione}
                  onChange={(e) =>
                    setBilling({
                      ...billing,
                      indirizzo_fatturazione: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="p-4 bg-slate-50/80 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>
                  {loading ? "Salvataggio..." : "Salva Dati Fatturazione"}
                </span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* 🚀 Tab 3: Impostazioni & Stile */}
      {activeTab === "style" && (
        <form
          onSubmit={handleSaveStyleSettings}
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Impostazioni & Stile
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Personalizza i moduli visibili e l'aspetto grafico dell'Hub.
            </p>
          </div>

          <div className="p-6 space-y-8">
            {/* Sezione Booleani (Moduli Abilitati) */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-slate-400" /> Moduli Attivi
                dell'Hub
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Switch Products */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                    styleSettings.has_products
                      ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800"
                      : "bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800"
                  }`}
                >
                  <input
                    disabled={!isAdmin}
                    type="checkbox"
                    checked={styleSettings.has_products}
                    onChange={(e) =>
                      setStyleSettings({
                        ...styleSettings,
                        has_products: e.target.checked,
                      })
                    }
                    className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Prodotti
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Abilita il modulo di catalogo prodotti.
                    </p>
                  </div>
                </label>

                {/* Switch Dishes */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                    styleSettings.has_dishes
                      ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800"
                      : "bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800"
                  }`}
                >
                  <input
                    disabled={!isAdmin}
                    type="checkbox"
                    checked={styleSettings.has_dishes}
                    onChange={(e) =>
                      setStyleSettings({
                        ...styleSettings,
                        has_dishes: e.target.checked,
                      })
                    }
                    className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Piatti & Menù
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Abilita la gestione menù e piatti del giorno.
                    </p>
                  </div>
                </label>

                {/* Switch Services */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                    styleSettings.has_services
                      ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800"
                      : "bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800"
                  }`}
                >
                  <input
                    disabled={!isAdmin}
                    type="checkbox"
                    checked={styleSettings.has_services}
                    onChange={(e) =>
                      setStyleSettings({
                        ...styleSettings,
                        has_services: e.target.checked,
                      })
                    }
                    className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Servizi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Abilita l'elenco dei servizi offerti.
                    </p>
                  </div>
                </label>

                {/* Switch Booking */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                    styleSettings.has_booking
                      ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800"
                      : "bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800"
                  }`}
                >
                  <input
                    disabled={!isAdmin}
                    type="checkbox"
                    checked={styleSettings.has_booking}
                    onChange={(e) =>
                      setStyleSettings({
                        ...styleSettings,
                        has_booking: e.target.checked,
                      })
                    }
                    className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Prenotazioni
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Abilita l'agenda e le prenotazioni online.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Sezione Aspetto (Type e Palette Dropdown) */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-400" /> Aspetto Grafico &
                Temi
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dropdown Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Tipo Layout / Stile
                  </label>
                  <select
                    disabled={!isAdmin}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    value={styleSettings.type}
                    onChange={(e) =>
                      setStyleSettings({
                        ...styleSettings,
                        type: e.target.value,
                      })
                    }
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dropdown Palette */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Palette Colori
                  </label>
                  <select
                    disabled={!isAdmin}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    value={styleSettings.palette}
                    onChange={(e) =>
                      setStyleSettings({
                        ...styleSettings,
                        palette: e.target.value,
                      })
                    }
                  >
                    {PALETTE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="p-4 bg-slate-50/80 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>
                  {loading ? "Salvataggio..." : "Salva Impostazioni & Stile"}
                </span>
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
