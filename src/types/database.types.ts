export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clienti_hubs: {
        Row: {
          created_at: string
          id: number
          id_hub: string
          id_user: string
          is_active: boolean
          note: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          id_hub: string
          id_user: string
          is_active?: boolean
          note?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          id_hub?: string
          id_user?: string
          is_active?: boolean
          note?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_clienti_hubs_hub"
            columns: ["id_hub"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_clienti_hubs_user"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consensi_autorizzazioni: {
        Row: {
          created_at: string
          id: number
          id_hub: string | null
          id_user: string
          ip_address: string
          stato: string
          tipo_consenso: string
          versione_policy: string
        }
        Insert: {
          created_at?: string
          id?: number
          id_hub?: string | null
          id_user: string
          ip_address: string
          stato?: string
          tipo_consenso: string
          versione_policy: string
        }
        Update: {
          created_at?: string
          id?: number
          id_hub?: string | null
          id_user?: string
          ip_address?: string
          stato?: string
          tipo_consenso?: string
          versione_policy?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_consensi_hub"
            columns: ["id_hub"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_consensi_user"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_billing_info: {
        Row: {
          codice_fiscale: string | null
          created_at: string
          hub_id: string
          indirizzo_fatturazione: string | null
          partita_iva: string | null
          pec: string | null
          ragione_sociale: string | null
          sdi_code: string | null
          updated_at: string
        }
        Insert: {
          codice_fiscale?: string | null
          created_at?: string
          hub_id: string
          indirizzo_fatturazione?: string | null
          partita_iva?: string | null
          pec?: string | null
          ragione_sociale?: string | null
          sdi_code?: string | null
          updated_at?: string
        }
        Update: {
          codice_fiscale?: string | null
          created_at?: string
          hub_id?: string
          indirizzo_fatturazione?: string | null
          partita_iva?: string | null
          pec?: string | null
          ragione_sociale?: string | null
          sdi_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_billing_hub"
            columns: ["hub_id"]
            isOneToOne: true
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      hubs: {
        Row: {
          cap: string | null
          categoria: string
          citta: string | null
          created_at: string
          data_scadenza: string | null
          deleted_at: string | null
          descrizione: string | null
          email: string
          has_booking: boolean | null
          has_dishes: boolean | null
          has_products: boolean | null
          has_services: boolean | null
          id: string
          id_user: string
          indirizzo: string | null
          is_active: boolean
          is_visible: boolean
          links: Json | null
          logo_url: string | null
          nome: string
          note: string | null
          orari_apertura: string | null
          palette: string | null
          provincia: string | null
          sito_web: string | null
          slug: string
          style: string
          telefono: string | null
          type: string
          updated_at: string
        }
        Insert: {
          cap?: string | null
          categoria?: string
          citta?: string | null
          created_at?: string
          data_scadenza?: string | null
          deleted_at?: string | null
          descrizione?: string | null
          email: string
          has_booking?: boolean | null
          has_dishes?: boolean | null
          has_products?: boolean | null
          has_services?: boolean | null
          id?: string
          id_user: string
          indirizzo?: string | null
          is_active?: boolean
          is_visible?: boolean
          links?: Json | null
          logo_url?: string | null
          nome: string
          note?: string | null
          orari_apertura?: string | null
          palette?: string | null
          provincia?: string | null
          sito_web?: string | null
          slug: string
          style?: string
          telefono?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          cap?: string | null
          categoria?: string
          citta?: string | null
          created_at?: string
          data_scadenza?: string | null
          deleted_at?: string | null
          descrizione?: string | null
          email?: string
          has_booking?: boolean | null
          has_dishes?: boolean | null
          has_products?: boolean | null
          has_services?: boolean | null
          id?: string
          id_user?: string
          indirizzo?: string | null
          is_active?: boolean
          is_visible?: boolean
          links?: Json | null
          logo_url?: string | null
          nome?: string
          note?: string | null
          orari_apertura?: string | null
          palette?: string | null
          provincia?: string | null
          sito_web?: string | null
          slug?: string
          style?: string
          telefono?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_users_hubs"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      logs: {
        Row: {
          alert: boolean
          category: string
          created_at: string
          deleted_at: string | null
          description: string
          id: number
          id_hub: string
          is_active: boolean
          note: string | null
          title: string
          updated_at: string
        }
        Insert: {
          alert?: boolean
          category: string
          created_at?: string
          deleted_at?: string | null
          description: string
          id?: number
          id_hub: string
          is_active?: boolean
          note?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          alert?: boolean
          category?: string
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: number
          id_hub?: string
          is_active?: boolean
          note?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_logs_hub"
            columns: ["id_hub"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      lookup_options: {
        Row: {
          codice: string
          colore: string | null
          id: number
          id_hub: string
          is_active: boolean
          label: string
          ordine: number
          tipo: string
          valore: string
        }
        Insert: {
          codice: string
          colore?: string | null
          id?: number
          id_hub: string
          is_active?: boolean
          label: string
          ordine?: number
          tipo: string
          valore: string
        }
        Update: {
          codice?: string
          colore?: string | null
          id?: number
          id_hub?: string
          is_active?: boolean
          label?: string
          ordine?: number
          tipo?: string
          valore?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_lookup_options_hub"
            columns: ["id_hub"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      orari_lavoro: {
        Row: {
          created_at: string
          giorno_settimana: number
          id: number
          id_hub: string
          id_professionista: number | null
          is_chiuso: boolean
          ora_fine_1: string | null
          ora_fine_2: string | null
          ora_inizio_1: string | null
          ora_inizio_2: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          giorno_settimana: number
          id?: never
          id_hub: string
          id_professionista?: number | null
          is_chiuso?: boolean
          ora_fine_1?: string | null
          ora_fine_2?: string | null
          ora_inizio_1?: string | null
          ora_inizio_2?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          giorno_settimana?: number
          id?: never
          id_hub?: string
          id_professionista?: number | null
          is_chiuso?: boolean
          ora_fine_1?: string | null
          ora_fine_2?: string | null
          ora_inizio_1?: string | null
          ora_inizio_2?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orari_lavoro_id_hub_fkey"
            columns: ["id_hub"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orari_lavoro_id_professionista_fkey"
            columns: ["id_professionista"]
            isOneToOne: false
            referencedRelation: "professionisti"
            referencedColumns: ["id"]
          },
        ]
      }
      piatti: {
        Row: {
          aliquota_iva: number
          allergeni: string | null
          categoria: string | null
          created_at: string
          deleted_at: string | null
          descrizione: string | null
          id: number
          id_hub: string
          immagine: string | null
          ingredienti: string | null
          is_active: boolean
          is_disponibile: boolean
          is_gluten_free: boolean
          is_vegano: boolean
          is_vegetariano: boolean
          note: string | null
          ordine: number
          preferito: boolean
          prenotabile: boolean | null
          prezzo: number
          pubblico: boolean | null
          titolo: string
          updated_at: string
        }
        Insert: {
          aliquota_iva?: number
          allergeni?: string | null
          categoria?: string | null
          created_at?: string
          deleted_at?: string | null
          descrizione?: string | null
          id?: number
          id_hub: string
          immagine?: string | null
          ingredienti?: string | null
          is_active?: boolean
          is_disponibile?: boolean
          is_gluten_free?: boolean
          is_vegano?: boolean
          is_vegetariano?: boolean
          note?: string | null
          ordine?: number
          preferito?: boolean
          prenotabile?: boolean | null
          prezzo?: number
          pubblico?: boolean | null
          titolo: string
          updated_at?: string
        }
        Update: {
          aliquota_iva?: number
          allergeni?: string | null
          categoria?: string | null
          created_at?: string
          deleted_at?: string | null
          descrizione?: string | null
          id?: number
          id_hub?: string
          immagine?: string | null
          ingredienti?: string | null
          is_active?: boolean
          is_disponibile?: boolean
          is_gluten_free?: boolean
          is_vegano?: boolean
          is_vegetariano?: boolean
          note?: string | null
          ordine?: number
          preferito?: boolean
          prenotabile?: boolean | null
          prezzo?: number
          pubblico?: boolean | null
          titolo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_piatti_hub"
            columns: ["id_hub"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      prenotazioni: {
        Row: {
          agenda: boolean
          created_at: string
          deleted_at: string | null
          descrizione: string | null
          id: number
          id_hub: string
          id_professionista: number | null
          id_rubrica: number | null
          id_user: string | null
          is_active: boolean
          note: string | null
          ordini: boolean
          parziale: number
          posizione: string | null
          prezzo: number
          stato: string
          tempo_minuti: number
          titolo: string | null
          tms_fine: string | null
          tms_inizio: string | null
          totale: number
          updated_at: string
        }
        Insert: {
          agenda?: boolean
          created_at?: string
          deleted_at?: string | null
          descrizione?: string | null
          id?: number
          id_hub: string
          id_professionista?: number | null
          id_rubrica?: number | null
          id_user?: string | null
          is_active?: boolean
          note?: string | null
          ordini?: boolean
          parziale?: number
          posizione?: string | null
          prezzo?: number
          stato?: string
          tempo_minuti?: number
          titolo?: string | null
          tms_fine?: string | null
          tms_inizio?: string | null
          totale?: number
          updated_at?: string
        }
        Update: {
          agenda?: boolean
          created_at?: string
          deleted_at?: string | null
          descrizione?: string | null
          id?: number
          id_hub?: string
          id_professionista?: number | null
          id_rubrica?: number | null
          id_user?: string | null
          is_active?: boolean
          note?: string | null
          ordini?: boolean
          parziale?: number
          posizione?: string | null
          prezzo?: number
          stato?: string
          tempo_minuti?: number
          titolo?: string | null
          tms_fine?: string | null
          tms_inizio?: string | null
          totale?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_prenotazioni_hub"
            columns: ["id_hub"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prenotazioni_professionista"
            columns: ["id_professionista"]
            isOneToOne: false
            referencedRelation: "professionisti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prenotazioni_rubrica"
            columns: ["id_rubrica"]
            isOneToOne: false
            referencedRelation: "rubrica"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prenotazioni_user"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prenotazioni_items: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: number
          id_hub: string
          id_item: number
          id_prenotazione: number
          is_active: boolean
          note: string | null
          nuovo: boolean
          pagamento: boolean
          prezzo: number
          quantita: number
          stato: string | null
          tempo_minuti: number
          tipo: string
          totale: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: number
          id_hub: string
          id_item: number
          id_prenotazione: number
          is_active?: boolean
          note?: string | null
          nuovo?: boolean
          pagamento?: boolean
          prezzo?: number
          quantita?: number
          stato?: string | null
          tempo_minuti?: number
          tipo: string
          totale?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: number
          id_hub?: string
          id_item?: number
          id_prenotazione?: number
          is_active?: boolean
          note?: string | null
          nuovo?: boolean
          pagamento?: boolean
          prezzo?: number
          quantita?: number
          stato?: string | null
          tempo_minuti?: number
          tipo?: string
          totale?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_items_prenotazione"
            columns: ["id_prenotazione"]
            isOneToOne: false
            referencedRelation: "prenotazioni"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prenotazioni_items_hub"
            columns: ["id_hub"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      prodotti: {
        Row: {
          aliquota_iva: number
          azienda_produttrice: string | null
          brand: string | null
          categoria: string | null
          codice_a_barre: string | null
          created_at: string
          deleted_at: string | null
          descrizione: string | null
          id: number
          id_hub: string
          immagine: string | null
          is_active: boolean
          note: string | null
          ordine: number
          posizione_magazzino: string | null
          preferito: boolean
          prenotabile: boolean | null
          prezzo_fornitore: number
          prezzo_listino: number
          prezzo_nuovo: number
          prezzo_usato: number
          pubblico: boolean | null
          quantita_alert: number
          quantita_nuovo: number
          quantita_usato: number
          sku: string | null
          tempo_minuti: number
          titolo: string
          updated_at: string
        }
        Insert: {
          aliquota_iva?: number
          azienda_produttrice?: string | null
          brand?: string | null
          categoria?: string | null
          codice_a_barre?: string | null
          created_at?: string
          deleted_at?: string | null
          descrizione?: string | null
          id?: number
          id_hub: string
          immagine?: string | null
          is_active?: boolean
          note?: string | null
          ordine?: number
          posizione_magazzino?: string | null
          preferito?: boolean
          prenotabile?: boolean | null
          prezzo_fornitore?: number
          prezzo_listino?: number
          prezzo_nuovo?: number
          prezzo_usato?: number
          pubblico?: boolean | null
          quantita_alert?: number
          quantita_nuovo?: number
          quantita_usato?: number
          sku?: string | null
          tempo_minuti?: number
          titolo: string
          updated_at?: string
        }
        Update: {
          aliquota_iva?: number
          azienda_produttrice?: string | null
          brand?: string | null
          categoria?: string | null
          codice_a_barre?: string | null
          created_at?: string
          deleted_at?: string | null
          descrizione?: string | null
          id?: number
          id_hub?: string
          immagine?: string | null
          is_active?: boolean
          note?: string | null
          ordine?: number
          posizione_magazzino?: string | null
          preferito?: boolean
          prenotabile?: boolean | null
          prezzo_fornitore?: number
          prezzo_listino?: number
          prezzo_nuovo?: number
          prezzo_usato?: number
          pubblico?: boolean | null
          quantita_alert?: number
          quantita_nuovo?: number
          quantita_usato?: number
          sku?: string | null
          tempo_minuti?: number
          titolo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_prodotti_hub"
            columns: ["id_hub"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      professionisti: {
        Row: {
          admin: boolean
          colore: string | null
          created_at: string
          deleted_at: string | null
          id: number
          id_hub: string
          id_user: string
          img_url: string | null
          is_active: boolean
          is_visible: boolean
          nome: string
          note: string | null
          preferito: boolean
          red_flags: number
          ruolo: string
          updated_at: string
        }
        Insert: {
          admin?: boolean
          colore?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: number
          id_hub: string
          id_user: string
          img_url?: string | null
          is_active?: boolean
          is_visible?: boolean
          nome: string
          note?: string | null
          preferito?: boolean
          red_flags?: number
          ruolo?: string
          updated_at?: string
        }
        Update: {
          admin?: boolean
          colore?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: number
          id_hub?: string
          id_user?: string
          img_url?: string | null
          is_active?: boolean
          is_visible?: boolean
          nome?: string
          note?: string | null
          preferito?: boolean
          red_flags?: number
          ruolo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_professionisti_hub"
            columns: ["id_hub"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_professionisti_user"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      professionisti_servizi: {
        Row: {
          created_at: string
          id: number
          id_hub: string
          id_professionista: number
          id_servizio: number
          is_active: boolean
          prezzo_personalizzato: number | null
          tempo_minuti_personalizzato: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          id_hub: string
          id_professionista: number
          id_servizio: number
          is_active?: boolean
          prezzo_personalizzato?: number | null
          tempo_minuti_personalizzato?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          id_hub?: string
          id_professionista?: number
          id_servizio?: number
          is_active?: boolean
          prezzo_personalizzato?: number | null
          tempo_minuti_personalizzato?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_prof_servizi_hub"
            columns: ["id_hub"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prof_servizi_prof"
            columns: ["id_professionista"]
            isOneToOne: false
            referencedRelation: "professionisti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_prof_servizi_servizio"
            columns: ["id_servizio"]
            isOneToOne: false
            referencedRelation: "servizi"
            referencedColumns: ["id"]
          },
        ]
      }
      rubrica: {
        Row: {
          cognome: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: number
          id_hub: string
          id_user: string | null
          indirizzo: string | null
          is_active: boolean
          nome: string
          note: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          cognome?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: number
          id_hub: string
          id_user?: string | null
          indirizzo?: string | null
          is_active?: boolean
          nome: string
          note?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          cognome?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: number
          id_hub?: string
          id_user?: string | null
          indirizzo?: string | null
          is_active?: boolean
          nome?: string
          note?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_rubrica_hub"
            columns: ["id_hub"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_rubrica_user"
            columns: ["id_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      servizi: {
        Row: {
          aliquota_iva: number
          categoria: string | null
          codice_a_barre: string | null
          created_at: string
          deleted_at: string | null
          descrizione: string | null
          id: number
          id_hub: string
          immagine: string | null
          is_active: boolean
          note: string | null
          ordine: number
          preferito: boolean
          prenotabile: boolean | null
          prezzo: number
          prezzo_costo: number
          pubblico: boolean | null
          richiede_operatore: boolean
          tempo_minuti: number
          titolo: string
          updated_at: string
        }
        Insert: {
          aliquota_iva?: number
          categoria?: string | null
          codice_a_barre?: string | null
          created_at?: string
          deleted_at?: string | null
          descrizione?: string | null
          id?: number
          id_hub: string
          immagine?: string | null
          is_active?: boolean
          note?: string | null
          ordine?: number
          preferito?: boolean
          prenotabile?: boolean | null
          prezzo?: number
          prezzo_costo?: number
          pubblico?: boolean | null
          richiede_operatore?: boolean
          tempo_minuti?: number
          titolo: string
          updated_at?: string
        }
        Update: {
          aliquota_iva?: number
          categoria?: string | null
          codice_a_barre?: string | null
          created_at?: string
          deleted_at?: string | null
          descrizione?: string | null
          id?: number
          id_hub?: string
          immagine?: string | null
          is_active?: boolean
          note?: string | null
          ordine?: number
          preferito?: boolean
          prenotabile?: boolean | null
          prezzo?: number
          prezzo_costo?: number
          pubblico?: boolean | null
          richiede_operatore?: boolean
          tempo_minuti?: number
          titolo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_servizi_hub"
            columns: ["id_hub"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          cognome: string
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          is_active: boolean
          nome: string
          note: string | null
          preferito: boolean
          telefono: string | null
          updated_at: string
        }
        Insert: {
          cognome: string
          created_at?: string
          deleted_at?: string | null
          email: string
          id: string
          is_active?: boolean
          nome: string
          note?: string | null
          preferito?: boolean
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          cognome?: string
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          is_active?: boolean
          nome?: string
          note?: string | null
          preferito?: boolean
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
