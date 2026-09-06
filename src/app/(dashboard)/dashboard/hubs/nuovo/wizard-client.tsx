'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createHubWizardAction } from '@/server/actions/hub.actions';
import { CreateHubWizardDTO } from '@/types';
import { compressAndConvertToWebP } from '@/lib/image-optimizer';
import { 
  Building2, 
  Paintbrush,
  MapPin, 
  Receipt, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react';
import { CATEGORY_OPTIONS, PALETTE_OPTIONS, TYPE_OPTIONS } from '@/utils/constants/dropdown';


const INITIAL_FORM: CreateHubWizardDTO = {
  nome: '',
  slug: '',
  email: '',
  telefono: '',
  categoria: 'nc',
  type: 'default',
  palette: 'default',
  has_products: false,
  has_dishes: false,
  has_services: false,
  logo_url: '',
  indirizzo: '',
  citta: '',
  cap: '',
  provincia: '',
  sito_web: '',
  descrizione: '',
  ragione_sociale: '',
  partita_iva: '',
  codice_fiscale: '',
  sdi_code: '',
  pec: '',
  indirizzo_fatturazione: '',
  accettaTermini: false,
  accettaPrivacy: false,
};

export function WizardClient() {
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<CreateHubWizardDTO>(INITIAL_FORM);
  const [loading, setLoading] = useState<boolean>(false);
  const [compressingLogo, setCompressingLogo] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateField = (field: keyof CreateHubWizardDTO, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === 'nome' && (!prev.slug || prev.slug === prev.nome.toLowerCase().replace(/\s+/g, '-'))) {
        updated.slug = value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      }
      return updated;
    });
  };

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressingLogo(true);
    setErrorMsg(null);

    try {
      const webpBlob = await compressAndConvertToWebP(file, 800, 800, 0.82);

      const reader = new FileReader();
      reader.readAsDataURL(webpBlob);
      reader.onloadend = () => {
        updateField('logo_url', reader.result as string);
        setCompressingLogo(false);
      };
    } catch (err: any) {
      setErrorMsg(err.message || 'Errore nella compressione dell\'immagine.');
      setCompressingLogo(false);
    }
  }

  const isStep1Valid = Boolean(formData.nome && formData.slug && formData.email);
  const isStep5Valid = Boolean(formData.accettaTermini && formData.accettaPrivacy);

  async function handleSubmit() {
    setLoading(true);
    setErrorMsg(null);

    const res = await createHubWizardAction(formData);

    if (!res.success || !res.data || !res.data.slug) {
      setErrorMsg(res.error || 'Errore imprevisto durante la creazione.');
      setLoading(false);
      return;
    }

    window.location.href = `/dashboard/hubs/${res.data.slug}`;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* INDICATORE STEPS (6 STEP TOTALI) */}
      <div className="grid grid-cols-6 gap-2">
        {[
          { num: 1, label: 'Generali', icon: Building2 },
          { num: 2, label: 'Branding', icon: Paintbrush },
          { num: 3, label: 'Dettagli', icon: MapPin },
          { num: 4, label: 'Fatturazione', icon: Receipt },
          { num: 5, label: 'Privacy', icon: ShieldCheck },
          { num: 6, label: 'Conferma', icon: CheckCircle2 },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;

          return (
            <div
              key={s.num}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all text-center ${
                isActive
                  ? 'bg-sky-500/10 border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                  : isDone
                  ? 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-900 text-slate-400 opacity-60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] md:text-[10px] uppercase tracking-wider font-semibold truncate w-full">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* ERROR ALERT */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* CARD CONTENT */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
        
        {/* STEP 1: GENERALI & LOGO */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">1. Informazioni Generali</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Nome Hub *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => updateField('nome', e.target.value)}
                  placeholder="Es. Studio Rossi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Slug Identificativo *</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => updateField('slug', e.target.value)}
                  placeholder="studio-rossi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Email Hub *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="info@studiorossi.it"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Telefono</label>
                <input
                  type="tel"
                  value={formData.telefono || ''}
                  onChange={(e) => updateField('telefono', e.target.value)}
                  placeholder="+39 02 123456"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* SEZIONE LOGO */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">
                Logo Hub (Convertito in WebP)
              </label>

              <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950">
                <div className="relative w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-300 dark:border-slate-700">
                  {formData.logo_url ? (
                    <>
                      <img src={formData.logo_url} alt="Logo Hub" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => updateField('logo_url', '')}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-sm"
                        title="Rimuovi"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : compressingLogo ? (
                    <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                  ) : (
                    <ImageIcon className="w-7 h-7 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all">
                    <Upload className="w-4 h-4 text-sky-500" />
                    <span>{compressingLogo ? 'Ottimizzazione in corso...' : 'Seleziona Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={compressingLogo}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Verrà salvato nel bucket: <code className="text-slate-600 dark:text-slate-400">hubs_media/{'{vero_id_hub}'}/logo/logo.webp</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BRANDING, CATEGORIA & MODULI (NUOVO) */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">2. Stile & Moduli Abilitati</h2>
              <span className="text-xs font-bold text-slate-400">(Opzionale - Saltabile)</span>
            </div>

            {/* TYPE, CATEGORIA, PALETTE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                  Tipo Layout
                </label>
                <select
                  value={formData.type || 'default'}
                  onChange={(e) => updateField('type', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                  Categoria
                </label>
                <select
                  value={formData.categoria || 'nc'}
                  onChange={(e) => updateField('categoria', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">
                  Palette Colori
                </label>
                <select
                  value={formData.palette || 'default'}
                  onChange={(e) => updateField('palette', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium"
                >
                  {PALETTE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* MODULI ABILITATI */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase">
                Moduli Abilitati
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-sky-500/50 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.has_products || false}
                    onChange={(e) => updateField('has_products', e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Prodotti</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-sky-500/50 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.has_dishes || false}
                    onChange={(e) => updateField('has_dishes', e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Piatti / Menu</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:border-sky-500/50 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.has_services || false}
                    onChange={(e) => updateField('has_services', e.target.checked)}
                    className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Servizi</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DETTAGLI ATTIVITÀ */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">3. Dettagli Attività</h2>
              <span className="text-xs font-bold text-slate-400">(Opzionale - Saltabile)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Indirizzo</label>
                <input
                  type="text"
                  value={formData.indirizzo || ''}
                  onChange={(e) => updateField('indirizzo', e.target.value)}
                  placeholder="Via Roma 10"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Città</label>
                <input
                  type="text"
                  value={formData.citta || ''}
                  onChange={(e) => updateField('citta', e.target.value)}
                  placeholder="Milano"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Descrizione Breve</label>
              <textarea
                value={formData.descrizione || ''}
                onChange={(e) => updateField('descrizione', e.target.value)}
                rows={3}
                placeholder="Presenta brevemente la tua attività..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Sito Web</label>
              <input
                type="url"
                value={formData.sito_web || ''}
                onChange={(e) => updateField('sito_web', e.target.value)}
                placeholder="https://studiorossi.it"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
              />
            </div>
          </div>
        )}

        {/* STEP 4: FATTURAZIONE */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">4. Dati di Fatturazione</h2>
              <span className="text-xs font-bold text-slate-400">(Opzionale - Saltabile)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Ragione Sociale</label>
                <input
                  type="text"
                  value={formData.ragione_sociale || ''}
                  onChange={(e) => updateField('ragione_sociale', e.target.value)}
                  placeholder="Studio Rossi S.r.l."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase">Partita IVA</label>
                <input
                  type="text"
                  value={formData.partita_iva || ''}
                  onChange={(e) => updateField('partita_iva', e.target.value)}
                  placeholder="IT12345678901"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: PRIVACY */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">5. Privacy & Termini</h2>

            <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={formData.accettaTermini}
                onChange={(e) => updateField('accettaTermini', e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300">
                Accetto i <strong>Termini e le Condizioni di Servizio</strong> per la gestione del nuovo Hub. *
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={formData.accettaPrivacy}
                onChange={(e) => updateField('accettaPrivacy', e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300">
                Dichiaro di aver letto l'<strong>Informativa Privacy</strong> e acconsento al trattamento dei dati. *
              </span>
            </label>
          </div>
        )}

        {/* STEP 6: RIEPILOGO FINALE */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">6. Riepilogo Finale</h2>
              <p className="text-xs text-slate-500">Verifica i dati dell'Hub prima della creazione finale.</p>
            </div>

            <div className="space-y-4 text-xs">
              {/* BRAND & LOGO */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt="Logo"
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shrink-0 shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400 font-bold text-xs">
                    NO LOGO
                  </div>
                )}
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">{formData.nome || 'Nessun Nome'}</h3>
                  <p className="font-mono text-[11px] text-sky-600 dark:text-sky-400">/{formData.slug}</p>
                  <p className="text-slate-500">{formData.email} {formData.telefono && `• ${formData.telefono}`}</p>
                </div>
              </div>

              {/* CONFIGURAZIONE STILE & CATEGORIA */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Configurazione & Design
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Categoria</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                      {CATEGORY_OPTIONS.find((c) => c.value === formData.categoria)?.label || formData.categoria || 'Nessuna'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Tipo Layout</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                      {TYPE_OPTIONS.find((t) => t.value === formData.type)?.label.split(' ')[0] || formData.type}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Palette</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
                      {PALETTE_OPTIONS.find((p) => p.value === formData.palette)?.label.split(' ')[0] || formData.palette}
                    </span>
                  </div>
                </div>

                {/* BADGES MODULI ATTIVI */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">Moduli:</span>
                  {formData.has_products && (
                    <span className="px-2.5 py-1 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-lg text-[11px] font-bold border border-sky-500/20">
                      Prodotti
                    </span>
                  )}
                  {formData.has_dishes && (
                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[11px] font-bold border border-amber-500/20">
                      Piatti / Menu
                    </span>
                  )}
                  {formData.has_services && (
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[11px] font-bold border border-emerald-500/20">
                      Servizi
                    </span>
                  )}
                  {!formData.has_products && !formData.has_dishes && !formData.has_services && (
                    <span className="text-slate-400 italic">Nessun modulo abilitato</span>
                  )}
                </div>
              </div>

              {/* DETTAGLI LOCALITÀ & FATTURAZIONE */}
              {(formData.indirizzo || formData.citta || formData.ragione_sociale) && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    Sede & Fatturazione
                  </span>
                  {formData.indirizzo && <p><strong className="text-slate-600 dark:text-slate-400">Indirizzo:</strong> {formData.indirizzo} {formData.citta && `, ${formData.citta}`}</p>}
                  {formData.ragione_sociale && <p><strong className="text-slate-600 dark:text-slate-400">Ragione Sociale:</strong> {formData.ragione_sociale}</p>}
                  {formData.partita_iva && <p><strong className="text-slate-600 dark:text-slate-400">Partita IVA:</strong> <code className="font-mono">{formData.partita_iva}</code></p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PULSANTI DI NAVIGAZIONE */}
        <div className="pt-6 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              disabled={loading || compressingLogo}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold rounded-xl flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Indietro
            </button>
          ) : <div />}

          {step < 6 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={(step === 1 && !isStep1Valid) || (step === 5 && !isStep5Valid) || compressingLogo}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-sky-500/20"
            >
              Avanti <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || compressingLogo}
              className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-lg shadow-sky-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{loading ? 'CREAZIONE IN CORSO...' : 'CONFERMA E CREA HUB'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}