import { z } from 'zod';

export const rubricaSchema = z.object({
  id_hub: z.string().uuid('ID Hub non valido'),
  id_user: z.string().uuid('ID Utente non valido').or(z.literal('')).nullable().optional(),
  nome: z.string().min(1, 'Il nome è obbligatorio').max(100, 'Massimo 100 caratteri'),
  cognome: z.string().max(100, 'Massimo 100 caratteri').nullable().optional(),
  telefono: z.string().max(30, 'Massimo 30 caratteri').nullable().optional(),
  email: z.string().email('Email non valida').max(255, 'Massimo 255 caratteri').or(z.literal('')).nullable().optional(),
  indirizzo: z.string().max(255, 'Massimo 255 caratteri').nullable().optional(),
  note: z.string().max(500, 'Massimo 500 caratteri').nullable().optional(),
  is_active: z.boolean().default(true),
});

export type RubricaInput = z.infer<typeof rubricaSchema>;