import { z } from 'zod';

export const piattoSchema = z.object({
  id_hub: z.string().uuid('ID Hub non valido'),
  titolo: z.string().min(1, 'Il titolo è obbligatorio').max(150, 'Il titolo non può superare 150 caratteri'),
  categoria: z.string().max(100).nullable().optional(),
  descrizione: z.string().max(1000).nullable().optional(),
  ingredienti: z.string().max(1000).nullable().optional(),
  allergeni: z.string().max(500).nullable().optional(),
  prezzo: z.number().min(0).default(0),
  aliquota_iva: z.number().min(0).max(100).default(10.00),
  immagine: z.string().url('URL immagine non valido').max(500).nullable().optional().or(z.literal('')),
  ordine: z.number().int().default(0),
  is_vegetariano: z.boolean().default(false),
  is_vegano: z.boolean().default(false),
  is_gluten_free: z.boolean().default(false),
  is_disponibile: z.boolean().default(true),
  is_active: z.boolean().default(true),
  note: z.string().max(500).nullable().optional(),
  preferito: z.boolean().default(false),
});

export type PiattoInput = z.infer<typeof piattoSchema>;