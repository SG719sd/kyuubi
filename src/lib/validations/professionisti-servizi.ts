import { z } from 'zod';

export const professionistaServizioSchema = z.object({
  id_hub: z.string().uuid('ID Hub non valido'),
  id_professionista: z.number().int().positive('ID Professionista obbligatorio'),
  id_servizio: z.number().int().positive('ID Servizio obbligatorio'),
  tempo_minuti_personalizzato: z.number().int().min(1, 'La durata deve essere maggiore di 0').nullable().optional(),
  prezzo_personalizzato: z.number().min(0, 'Il prezzo non può essere negativo').nullable().optional(),
  is_active: z.boolean().default(true),
});

export type ProfessionistaServizioInput = z.infer<typeof professionistaServizioSchema>;