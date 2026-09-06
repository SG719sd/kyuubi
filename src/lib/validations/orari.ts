import { z } from 'zod';

// Regex per convalidare il formato TIME "HH:MM" o "HH:MM:SS" (accetta null o stringa vuota)
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;

const optionalTimeSchema = z
  .string()
  .nullable()
  .optional()
  .refine((val) => !val || timeRegex.test(val), {
    message: 'Formato orario non valido (es. 09:00)',
  });

export const orarioLavoroSchema = z
  .object({
    id_hub: z.string().uuid('ID Hub non valido'),
    id_professionista: z.number().nullable().optional(),
    giorno_settimana: z
      .number()
      .min(0, 'Giorno non valido (0-6)')
      .max(6, 'Giorno non valido (0-6)'),
    is_chiuso: z.boolean().default(false),
    ora_inizio_1: optionalTimeSchema,
    ora_fine_1: optionalTimeSchema,
    ora_inizio_2: optionalTimeSchema,
    ora_fine_2: optionalTimeSchema,
  })
  .refine(
    (data) => {
      // Se non è chiuso, la prima fascia oraria deve essere presente
      if (!data.is_chiuso) {
        return Boolean(data.ora_inizio_1 && data.ora_fine_1);
      }
      return true;
    },
    {
      message: 'Compila almeno la prima fascia oraria se il giorno non è chiuso',
      path: ['ora_inizio_1'],
    }
  );

export type OrarioLavoroInput = z.infer<typeof orarioLavoroSchema>;