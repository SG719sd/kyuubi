import { z } from 'zod';

export const prodottoSchema = z.object({
  id_hub: z.string().uuid('ID Hub non valido'),
  sku: z.string().max(100).nullable().optional(),
  codice_a_barre: z.string().max(100).nullable().optional(),
  azienda_produttrice: z.string().max(100).nullable().optional(),
  brand: z.string().max(100).nullable().optional(),
  categoria: z.string().max(100).nullable().optional(),
  titolo: z.string().min(1, 'Il titolo è obbligatorio').max(150, 'Il titolo non può superare 150 caratteri'),
  descrizione: z.string().max(1000).nullable().optional(),
  immagine: z.string().url('URL immagine non valido').max(500).nullable().optional().or(z.literal('')),
  prezzo_nuovo: z.number().min(0).default(0),
  prezzo_usato: z.number().min(0).default(0),
  prezzo_fornitore: z.number().min(0).default(0),
  prezzo_listino: z.number().min(0).default(0),
  aliquota_iva: z.number().min(0).max(100).default(22.00),
  ordine: z.number().int().default(0),
  quantita_nuovo: z.number().int().min(0).default(0),
  quantita_usato: z.number().int().min(0).default(0),
  quantita_alert: z.number().int().min(0).default(10),
  posizione_magazzino: z.string().max(100).nullable().optional(),
  tempo_minuti: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  note: z.string().max(500).nullable().optional(),
  preferito: z.boolean().default(false),
});

export type ProdottoInput = z.infer<typeof prodottoSchema>;