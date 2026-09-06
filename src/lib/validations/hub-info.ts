import { z } from 'zod';

export const updateHubGeneralSchema = z.object({
  nome: z.string().min(2, 'Il nome deve avere almeno 2 caratteri').max(150),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/, 'Lo slug può contenere solo lettere minuscole, numeri e trattini'),
  categoria: z.string().max(100).default('Non Specificata'),
  email: z.string().email('Email non valida').max(255),
  telefono: z.string().max(30).nullable().optional(),
  indirizzo: z.string().max(255).nullable().optional(),
  citta: z.string().max(100).nullable().optional(),
  cap: z.string().max(10).nullable().optional(),
  provincia: z.string().max(10).nullable().optional(),
  sito_web: z.string().url('URL non valido').max(255).or(z.literal('')).nullable().optional(),
  descrizione: z.string().max(1000).nullable().optional(),
  orari_apertura: z.string().max(1000).nullable().optional(),
});

export const updateHubBillingSchema = z.object({
  ragione_sociale: z.string().max(200).nullable().optional(),
  partita_iva: z.string().max(20).nullable().optional(),
  codice_fiscale: z.string().max(20).nullable().optional(),
  sdi_code: z.string().max(10).nullable().optional(),
  pec: z.string().email('PEC non valida').max(255).or(z.literal('')).nullable().optional(),
  indirizzo_fatturazione: z.string().max(255).nullable().optional(),
});

// 🚀 NUOVO SCHEMA: Impostazioni & Stile
export const updateHubStyleSettingsSchema = z.object({
  has_products: z.boolean().default(false),
  has_dishes: z.boolean().default(false),
  has_services: z.boolean().default(false),
  has_booking: z.boolean().default(true),
  style: z.string().min(1, 'Seleziona uno stile').default('default'),
  type: z.string().optional(),
  palette: z.string().min(1, 'Seleziona una palette').default('emerald'),
});

export type UpdateHubGeneralInput = z.infer<typeof updateHubGeneralSchema>;
export type UpdateHubBillingInput = z.infer<typeof updateHubBillingSchema>;
export type UpdateHubStyleSettingsInput = z.infer<typeof updateHubStyleSettingsSchema>;