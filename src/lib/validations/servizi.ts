import { z } from 'zod';

export const servizioSchema = z.object({
  id_hub: z.string().uuid('ID Hub non valido'),
  titolo: z.string().min(1, 'Il titolo è obbligatorio').max(150, 'Il titolo non può superare 150 caratteri'),
  categoria: z.string().max(100).nullable().optional(),
  descrizione: z.string().max(1000).nullable().optional(),
  immagine: z.string().url('URL immagine non valido').max(500).nullable().optional().or(z.literal('')),
  codice_a_barre: z.string().max(100).nullable().optional(),
  ordine: z.number().int().default(0),
  prezzo: z.number().min(0).default(0),
  prezzo_costo: z.number().min(0).default(0),
  aliquota_iva: z.number().min(0).max(100).default(22.00),
  tempo_minuti: z.number().int().min(0).default(30),
  richiede_operatore: z.boolean().default(false),
  pubblico: z.boolean().default(true),
  prenotabile: z.boolean().default(false),
  is_active: z.boolean().default(true),
  note: z.string().max(500).nullable().optional(),
  preferito: z.boolean().default(false),
});

export type ServizioInput = z.infer<typeof servizioSchema>;