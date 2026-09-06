import { z } from 'zod';

export const professionistaSchema = z.object({
  id_hub: z.string().uuid('ID Hub non valido'),
  id_user: z.string().uuid('ID User non valido'), // Inserito manualmente per ora
  nome: z.string().min(2, 'Il nome deve avere almeno 2 caratteri').max(255),
  ruolo: z.string().max(30).default('collaboratore'),
  img_url: z.string().url('URL non valido').nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  colore: z.string().max(30).nullable().optional(),
  is_visible: z.boolean().default(true),
  is_active: z.boolean().default(true),
  red_flags: z.number().int().min(0).default(0),
  admin: z.boolean().default(false),
  preferito: z.boolean().default(false),
});

export type ProfessionistaInput = z.infer<typeof professionistaSchema>;