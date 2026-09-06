import { Database } from "./database.types";

// Utility helper per estrarre facilmente i tipi di riga, inserimento e modifica
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

  export type ConsensoRow = Tables<'consensi_autorizzazioni'>;
// Interfacce basate sugli script SQL forniti
// types.ts

export interface Hub {
  id: string;
  id_user: string;
  slug: string;
  nome: string;
  style: string;
  type?: string;
  palette?: string | null;
  categoria: string;
  has_products: boolean;
  has_dishes: boolean;
  has_services: boolean;
  has_booking?: boolean | null;
  email: string;
  telefono?: string | null;
  indirizzo?: string | null;
  citta?: string | null;
  cap?: string | null;
  provincia?: string | null;
  logo_url?: string | null;
  sito_web?: string | null;
  links?: Record<string, unknown> | null;
  orari_apertura?: string | null;
  descrizione?: string | null;
  note?: string | null;
  is_visible: boolean;
  is_active: boolean;
  data_scadenza?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreateHubWizardDTO {
  id?: string;
  nome: string;
  slug: string;
  email: string;
  telefono?: string;
  categoria?: string;
  style?: string;
  type?: string;
  palette?: string;
  has_products?: boolean;
  has_dishes?: boolean;
  has_services?: boolean;
  has_booking?: boolean;
  logo_url?: string;
  indirizzo?: string;
  citta?: string;
  cap?: string;
  provincia?: string;
  sito_web?: string;
  descrizione?: string;
  ragione_sociale?: string;
  partita_iva?: string;
  codice_fiscale?: string;
  sdi_code?: string;
  pec?: string;
  indirizzo_fatturazione?: string;
  accettaTermini: boolean;
  accettaPrivacy: boolean;
}

export interface HubBillingInfo {
  hub_id: string;
  ragione_sociale?: string | null;
  partita_iva?: string | null;
  codice_fiscale?: string | null;
  sdi_code?: string | null;
  pec?: string | null;
  indirizzo_fatturazione?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Professionista {
  id: number;
  id_hub: string;
  id_user: string;
  nome: string;
  ruolo: string;
  img_url?: string | null;
  note?: string | null;
  is_visible: boolean;
  is_active: boolean;
  red_flags: number;
  admin: boolean;
  preferito: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

// Tipo di ritorno per HubService.getHubWithProfessionista
export interface HubWithProfessionista {
  hub: Hub;
  professionista: Professionista | null;
}

// Scorciatoie
export type UserRow = Tables<'users'>;
export type HubRow = Hub;
export type ProfessionistaRow = Professionista;
export type ServizioRow = Tables<'servizi'>;
export type ProdottoRow = Tables<'prodotti'>;
export type PiattoRow = Tables<'piatti'>;
export type PrenotazioneRow = Tables<'prenotazioni'>;
export type PrenotazioneItemRow = Tables<'prenotazioni_items'>;
export type RubricaRow = Tables<'rubrica'>;

// Risposta generica per le Server Actions
export type ActionResponse<T = null> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};