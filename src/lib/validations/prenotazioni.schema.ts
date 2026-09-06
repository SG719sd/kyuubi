import { z } from 'zod';

// Discriminante dei tipi di item
export const TipoItemEnum = z.enum(['servizio', 'prodotto', 'piatto']);
export const StatoPrenotazioneEnum = z.enum(['pending', 'confermata', 'completata', 'cancellata']);

// 1. Schema per il singolo Item inserito nel Drawer / Prenotazione
export const prenotazioneItemSchema = z.object({
  id: z.number().optional(), // opzionale in creazione
  id_item: z.number({ message: 'Seleziona un elemento' }),
  tipo: TipoItemEnum,
  pagamento: z.boolean().default(false),
  nuovo: z.boolean().default(true),
  quantita: z.number().min(1, 'La quantità deve essere almeno 1').default(1),
  prezzo: z.number().min(0, 'Il prezzo non può essere negativo'),
  tempo_minuti: z.number().min(0).default(0),
  note: z.string().max(500, 'Note troppo lunghe').nullable().optional(),
});

// 2. Schema per la creazione/modifica della testata Prenotazione (Payload completo)
export const upsertPrenotazioneSchema = z.object({
  id: z.number().optional(), // Se presente -> Update, altrimenti -> Insert
  id_hub: z.string().uuid('ID Hub non valido'),
  id_professionista: z.number().nullable().optional(),
  id_user: z.string().uuid().nullable().optional(),
  id_rubrica: z.number().nullable().optional(),
  
  titolo: z.string().max(150, 'Titolo troppo lungo').nullable().optional(),
  descrizione: z.string().max(1000).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  
  stato: StatoPrenotazioneEnum.default('pending'),
  agenda: z.boolean().default(true),
  ordini: z.boolean().default(false),
  
  tms_inizio: z.string().datetime({ message: 'Data e ora inizio non valide (richiesto ISO string)' }),
  
  // Gli items associati
  items: z.array(prenotazioneItemSchema).min(1, 'Inserisci almeno un servizio o prodotto'),
});

// 3. Schema per la ricerca rapida di Slot Liberi
export const ricercaSlotQuerySchema = z.object({
  id_hub: z.string().uuid(),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido (YYYY-MM-DD)'),
  id_professionista: z.number().optional(),
  id_servizio: z.number().optional(), // Per calcolare la durata specifica dal listino
  durata_minuti_override: z.number().min(5).optional(), // Se si imposta una durata manuale
});

// 4. Schema per il cambio stato rapido
export const cambioStatoPrenotazioneSchema = z.object({
  id_prenotazione: z.number(),
  id_hub: z.string().uuid(),
  nuovo_stato: StatoPrenotazioneEnum,
});

// Inferred Types da Zod per l'uso nel codice
export type UpsertPrenotazioneInput = z.infer<typeof upsertPrenotazioneSchema>;
export type PrenotazioneItemInput = z.infer<typeof prenotazioneItemSchema>;
export type RicercaSlotQueryInput = z.infer<typeof ricercaSlotQuerySchema>;