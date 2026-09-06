-- ==============================================================================
-- 01_TABLES.SQL: TABELLE DDL, CHIAVI PRIMARIE, FOREIGN KEYS, CHECK E INDICI
-- Database: PostgreSQL 15+ / Supabase
-- Sistema: Kyuubi Hub Manager & EazyHubs Platform
-- ==============================================================================

-- 1. Estensioni PostgreSQL
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. Tabella Utenti (Sincronizzata con Supabase auth.users)
create table if not exists public.users (
    id uuid not null,
    email text not null,
    nome text not null,
    cognome text not null,
    telefono text null,
    note text null,
    is_active boolean not null default true,
    preferito boolean not null default false,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    deleted_at timestamp with time zone null,
    constraint users_pkey primary key (id),
    constraint users_email_key unique (email),
    constraint fk_users_auth foreign key (id) references auth.users (id) on delete cascade,
    constraint chk_users_nome check (char_length(nome) <= 100),
    constraint chk_users_cognome check (char_length(cognome) <= 100),
    constraint chk_users_email check (char_length(email) <= 255),
    constraint chk_users_telefono check (char_length(telefono) <= 30),
    constraint chk_users_note check (char_length(note) <= 500)
);

create index if not exists idx_users_email on public.users using btree (email);
create index if not exists idx_users_active on public.users using btree (is_active) where (deleted_at is null);

-- 3. Tabella Hubs (Multi-Tenant Core)
create table if not exists public.hubs (
    id uuid not null default gen_random_uuid(),
    id_user uuid not null,
    slug text not null,
    nome text not null,
    style text not null default 'default'::text,
    palette text null default 'emerald'::text,
    categoria text not null default 'default'::text,
    sottocategoria text not null default 'default'::text,
    email text not null,
    telefono text null,
    indirizzo text null,
    citta text null,
    cap text null,
    provincia text null,
    logo_url text null,
    sito_web text null,
    links jsonb null default '{}'::jsonb,
    orari_apertura text null,
    descrizione text null,
    note text null,
    is_visible boolean not null default true,
    is_active boolean not null default true,
    data_scadenza timestamp with time zone null,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    deleted_at timestamp with time zone null,
    has_products boolean not null default true,
    has_services boolean not null default true,
    has_dishes boolean not null default false,
    has_booking boolean not null default true,
    constraint hubs_pkey primary key (id),
    constraint hubs_slug_key unique (slug),
    constraint fk_users_hubs foreign key (id_user) references public.users (id) on delete restrict,
    constraint chk_hubs_nome check (char_length(nome) <= 150),
    constraint chk_hubs_slug check (char_length(slug) <= 100),
    constraint chk_hubs_email check (char_length(email) <= 255),
    constraint chk_hubs_telefono check (char_length(telefono) <= 30),
    constraint chk_hubs_indirizzo check (char_length(indirizzo) <= 255),
    constraint chk_hubs_citta check (char_length(citta) <= 100),
    constraint chk_hubs_cap check (char_length(cap) <= 10),
    constraint chk_hubs_provincia check (char_length(provincia) <= 10),
    constraint chk_hubs_logo_url check (char_length(logo_url) <= 500),
    constraint chk_hubs_sito_web check (char_length(sito_web) <= 255),
    constraint chk_hubs_categoria check (char_length(categoria) <= 100),
    constraint chk_hubs_sottocategoria check (char_length(sottocategoria) <= 100),
    constraint chk_hubs_descrizione check (char_length(descrizione) <= 1000),
    constraint chk_hubs_orari_apertura check (char_length(orari_apertura) <= 1000),
    constraint chk_hubs_note check (char_length(note) <= 500),
    constraint chk_hubs_style check (char_length(style) <= 50),
    constraint hubs_palette_check check (length(palette) <= 30)
);

create index if not exists idx_hubs_user on public.hubs using btree (id_user);
create index if not exists idx_hubs_slug on public.hubs using btree (slug);
create index if not exists idx_hubs_public_lookup on public.hubs using btree (slug, is_visible, is_active) where (deleted_at is null);

-- 4. Tabella Dati Fatturazione Hub (E-Invoicing)
create table if not exists public.hub_billing_info (
    hub_id uuid not null,
    ragione_sociale text null,
    partita_iva text null,
    codice_fiscale text null,
    sdi_code text null,
    pec text null,
    indirizzo_fatturazione text null,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    constraint hub_billing_info_pkey primary key (hub_id),
    constraint fk_billing_hub foreign key (hub_id) references public.hubs (id) on delete cascade,
    constraint chk_billing_ragione_sociale check (char_length(ragione_sociale) <= 200),
    constraint chk_billing_partita_iva check (char_length(partita_iva) <= 20),
    constraint chk_billing_codice_fiscale check (char_length(codice_fiscale) <= 20),
    constraint chk_billing_sdi_code check (char_length(sdi_code) <= 10),
    constraint chk_billing_pec check (char_length(pec) <= 255),
    constraint chk_billing_indirizzo_fatturazione check (char_length(indirizzo_fatturazione) <= 255)
);

-- 5. Tabella Professionisti & Collaboratori (Membri Staff & Access Control)
create table if not exists public.professionisti (
    id serial not null,
    id_hub uuid not null,
    id_user uuid not null,
    nome text not null,
    ruolo text not null default 'collaboratore'::text,
    img_url text null,
    note text null,
    is_visible boolean not null default true,
    is_active boolean not null default true,
    red_flags integer not null default 0,
    admin boolean not null default false,
    preferito boolean not null default false,
    colore text null default '#0044cc'::text,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    deleted_at timestamp with time zone null,
    constraint professionisti_pkey primary key (id),
    constraint professionisti_user_hub_key unique (id_user, id_hub),
    constraint fk_professionisti_hub foreign key (id_hub) references public.hubs (id) on delete cascade,
    constraint fk_professionisti_user foreign key (id_user) references public.users (id) on delete cascade,
    constraint chk_professionisti_nome check (char_length(nome) <= 255),
    constraint chk_professionisti_ruolo check (char_length(ruolo) <= 30),
    constraint chk_professionisti_img_url check (char_length(img_url) <= 500),
    constraint chk_professionisti_note check (char_length(note) <= 500),
    constraint professionisti_colore_check check (length(colore) <= 30)
);

create index if not exists idx_professionisti_hub on public.professionisti using btree (id_hub);
create index if not exists idx_professionisti_user on public.professionisti using btree (id_user);

-- 6. Tabella Consensi Normativi e Firma Digitale (GDPR & Audit Log con IP Address)
create table if not exists public.consensi_autorizzazioni (
    id serial not null,
    id_user uuid not null,
    id_hub uuid null,
    tipo_consenso text not null,
    versione_policy text not null,
    stato text not null default 'ACCETTATO'::text,
    ip_address text not null,
    created_at timestamp with time zone not null default current_timestamp,
    constraint consensi_autorizzazioni_pkey primary key (id),
    constraint fk_consensi_hub foreign key (id_hub) references public.hubs (id) on delete set null,
    constraint fk_consensi_user foreign key (id_user) references public.users (id) on delete cascade,
    constraint chk_consensi_tipo_consenso check (char_length(tipo_consenso) <= 50),
    constraint chk_consensi_versione_policy check (char_length(versione_policy) <= 20),
    constraint chk_consensi_stato check (char_length(stato) <= 20),
    constraint chk_consensi_ip_address check (char_length(ip_address) <= 45)
);

create index if not exists idx_consensi_user on public.consensi_autorizzazioni using btree (id_user);
create index if not exists idx_consensi_hub on public.consensi_autorizzazioni using btree (id_hub);

-- 7. Tabella Servizi (Listino Prestazioni e Trattamenti)
create table if not exists public.servizi (
    id serial not null,
    id_hub uuid not null,
    titolo text not null,
    categoria text null,
    descrizione text null,
    immagine text null,
    codice_a_barre text null,
    ordine integer not null default 0,
    prezzo numeric(10, 2) not null default 0.00,
    prezzo_costo numeric(10, 2) not null default 0.00,
    aliquota_iva numeric(5, 2) not null default 22.00,
    tempo_minuti integer not null default 30,
    richiede_operatore boolean not null default false,
    is_active boolean not null default true,
    note text null,
    preferito boolean not null default false,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    deleted_at timestamp with time zone null,
    pubblico boolean not null default true,
    prenotabile boolean not null default false,
    constraint servizi_pkey primary key (id),
    constraint fk_servizi_hub foreign key (id_hub) references public.hubs (id) on delete cascade,
    constraint chk_servizi_titolo check (char_length(titolo) <= 150),
    constraint chk_servizi_categoria check (char_length(categoria) <= 100),
    constraint chk_servizi_descrizione check (char_length(descrizione) <= 1000),
    constraint chk_servizi_immagine check (char_length(immagine) <= 500),
    constraint chk_servizi_codice_a_barre check (char_length(codice_a_barre) <= 100),
    constraint chk_servizi_note check (char_length(note) <= 500),
    constraint chk_servizi_prezzo_positivo check (prezzo >= 0),
    constraint chk_servizi_tempo_positivo check (tempo_minuti >= 1)
);

create index if not exists idx_servizi_hub on public.servizi using btree (id_hub);
create index if not exists idx_servizi_hub_active on public.servizi using btree (id_hub, is_active) where (deleted_at is null);

-- 8. Tabella Prodotti (Magazzino, Scorte e Prezzi)
create table if not exists public.prodotti (
    id serial not null,
    id_hub uuid not null,
    sku text null,
    codice_a_barre text null,
    azienda_produttrice text null,
    brand text null,
    categoria text null,
    titolo text not null,
    descrizione text null,
    immagine text null,
    prezzo_nuovo numeric(10, 2) not null default 0.00,
    prezzo_usato numeric(10, 2) not null default 0.00,
    prezzo_fornitore numeric(10, 2) not null default 0.00,
    prezzo_listino numeric(10, 2) not null default 0.00,
    aliquota_iva numeric(5, 2) not null default 22.00,
    ordine integer not null default 0,
    quantita_nuovo integer not null default 0,
    quantita_usato integer not null default 0,
    quantita_alert integer not null default 10,
    posizione_magazzino text null,
    tempo_minuti integer not null default 0,
    is_active boolean not null default true,
    note text null,
    preferito boolean not null default false,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    deleted_at timestamp with time zone null,
    pubblico boolean not null default true,
    prenotabile boolean not null default false,
    constraint prodotti_pkey primary key (id),
    constraint fk_prodotti_hub foreign key (id_hub) references public.hubs (id) on delete cascade,
    constraint chk_prodotti_titolo check (char_length(titolo) <= 150),
    constraint chk_prodotti_categoria check (char_length(categoria) <= 100),
    constraint chk_prodotti_brand check (char_length(brand) <= 100),
    constraint chk_prodotti_azienda_produttrice check (char_length(azienda_produttrice) <= 100),
    constraint chk_prodotti_sku check (char_length(sku) <= 100),
    constraint chk_prodotti_codice_a_barre check (char_length(codice_a_barre) <= 100),
    constraint chk_prodotti_descrizione check (char_length(descrizione) <= 1000),
    constraint chk_prodotti_immagine check (char_length(immagine) <= 500),
    constraint chk_prodotti_posizione_magazzino check (char_length(posizione_magazzino) <= 100),
    constraint chk_prodotti_note check (char_length(note) <= 500),
    constraint chk_prodotti_prezzo_nuovo check (prezzo_nuovo >= 0)
);

create index if not exists idx_prodotti_hub on public.prodotti using btree (id_hub);
create index if not exists idx_prodotti_barcode on public.prodotti using btree (codice_a_barre);

-- 9. Tabella Piatti (Menu Digitale, Ristorazione e Allergeni)
create table if not exists public.piatti (
    id serial not null,
    id_hub uuid not null,
    titolo text not null,
    categoria text null,
    descrizione text null,
    ingredienti text null,
    allergeni text null,
    prezzo numeric(10, 2) not null default 0.00,
    aliquota_iva numeric(5, 2) not null default 10.00,
    immagine text null,
    ordine integer not null default 0,
    is_vegetariano boolean not null default false,
    is_vegano boolean not null default false,
    is_gluten_free boolean not null default false,
    is_disponibile boolean not null default true,
    is_active boolean not null default true,
    note text null,
    preferito boolean not null default false,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    deleted_at timestamp with time zone null,
    pubblico boolean not null default true,
    prenotabile boolean not null default false,
    constraint piatti_pkey primary key (id),
    constraint fk_piatti_hub foreign key (id_hub) references public.hubs (id) on delete cascade,
    constraint chk_piatti_titolo check (char_length(titolo) <= 150),
    constraint chk_piatti_categoria check (char_length(categoria) <= 100),
    constraint chk_piatti_descrizione check (char_length(descrizione) <= 1000),
    constraint chk_piatti_ingredienti check (char_length(ingredienti) <= 1000),
    constraint chk_piatti_allergeni check (char_length(allergeni) <= 500),
    constraint chk_piatti_immagine check (char_length(immagine) <= 500),
    constraint chk_piatti_note check (char_length(note) <= 500),
    constraint chk_piatti_prezzo check (prezzo >= 0)
);

create index if not exists idx_piatti_hub on public.piatti using btree (id_hub);

-- 10. Tabella Rubrica (Anagrafiche Clienti & Fornitori)
create table if not exists public.rubrica (
    id serial not null,
    id_hub uuid not null,
    nome text not null,
    cognome text null,
    telefono text null,
    email text null,
    indirizzo text null,
    note text null,
    is_active boolean not null default true,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    deleted_at timestamp with time zone null,
    constraint rubrica_pkey primary key (id),
    constraint fk_rubrica_hub foreign key (id_hub) references public.hubs (id) on delete cascade,
    constraint chk_rubrica_nome check (char_length(nome) <= 100),
    constraint chk_rubrica_cognome check (char_length(cognome) <= 100),
    constraint chk_rubrica_telefono check (char_length(telefono) <= 30),
    constraint chk_rubrica_email check (char_length(email) <= 255),
    constraint chk_rubrica_indirizzo check (char_length(indirizzo) <= 255),
    constraint chk_rubrica_note check (char_length(note) <= 500)
);

create index if not exists idx_rubrica_hub on public.rubrica using btree (id_hub);

-- 11. Tabella Abilitazioni & Override Servizi per Professionista
create table if not exists public.professionisti_servizi (
    id serial not null,
    id_hub uuid not null,
    id_professionista integer not null,
    id_servizio integer not null,
    tempo_minuti_personalizzato integer null,
    prezzo_personalizzato numeric(10, 2) null,
    is_active boolean not null default true,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    constraint professionisti_servizi_pkey primary key (id),
    constraint prof_servizi_unique unique (id_professionista, id_servizio),
    constraint fk_prof_servizi_hub foreign key (id_hub) references public.hubs (id) on delete cascade,
    constraint fk_prof_servizi_prof foreign key (id_professionista) references public.professionisti (id) on delete cascade,
    constraint fk_prof_servizi_servizio foreign key (id_servizio) references public.servizi (id) on delete cascade
);

create index if not exists idx_prof_servizi_hub on public.professionisti_servizi using btree (id_hub);

-- 12. Tabella Orari di Lavoro (Hub e Operatori)
create table if not exists public.orari_lavoro (
    id bigint generated always as identity not null,
    id_hub uuid not null,
    id_professionista bigint null,
    giorno_settimana smallint not null,
    is_chiuso boolean not null default false,
    ora_inizio_1 time without time zone null,
    ora_fine_1 time without time zone null,
    ora_inizio_2 time without time zone null,
    ora_fine_2 time without time zone null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    constraint orari_lavoro_pkey primary key (id),
    constraint orari_lavoro_id_hub_fkey foreign key (id_hub) references public.hubs (id) on delete cascade,
    constraint orari_lavoro_id_professionista_fkey foreign key (id_professionista) references public.professionisti (id) on delete cascade,
    constraint orari_lavoro_giorno_settimana_check check (giorno_settimana between 0 and 6)
);

create index if not exists idx_orari_lavoro_hub on public.orari_lavoro using btree (id_hub);
create index if not exists idx_orari_lavoro_prof on public.orari_lavoro using btree (id_professionista) where (id_professionista is not null);
create unique index if not exists idx_unique_orario_prof on public.orari_lavoro using btree (id_hub, id_professionista, giorno_settimana) where (id_professionista is not null);
create unique index if not exists idx_unique_orario_hub on public.orari_lavoro using btree (id_hub, giorno_settimana) where (id_professionista is null);

-- 13. Tabella Prenotazioni & Ordini
create table if not exists public.prenotazioni (
    id serial not null,
    id_hub uuid not null,
    id_user uuid null,
    id_rubrica integer null,
    id_professionista integer null,
    titolo text null,
    descrizione text null,
    stato text not null default 'pending'::text,
    agenda boolean not null default false,
    tempo_minuti integer not null default 0,
    prezzo numeric(10, 2) not null default 0.00,
    parziale numeric(10, 2) not null default 0.00,
    totale numeric(10, 2) not null default 0.00,
    tms_inizio timestamp with time zone null,
    tms_fine timestamp with time zone null,
    is_active boolean not null default true,
    ordini boolean not null default false,
    note text null,
    posizione text null,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    deleted_at timestamp with time zone null,
    constraint prenotazioni_pkey primary key (id),
    constraint fk_prenotazioni_hub foreign key (id_hub) references public.hubs (id) on delete cascade,
    constraint fk_prenotazioni_user foreign key (id_user) references public.users (id) on delete set null,
    constraint fk_prenotazioni_rubrica foreign key (id_rubrica) references public.rubrica (id) on delete set null,
    constraint fk_prenotazioni_professionista foreign key (id_professionista) references public.professionisti (id) on delete set null,
    constraint chk_prenotazioni_titolo check (char_length(titolo) <= 150),
    constraint chk_prenotazioni_descrizione check (char_length(descrizione) <= 1000),
    constraint chk_prenotazioni_stato check (char_length(stato) <= 50),
    constraint chk_prenotazioni_note check (char_length(note) <= 500),
    constraint chk_prenotazioni_posizione check (length(posizione) <= 50)
);

create index if not exists idx_prenotazioni_hub on public.prenotazioni using btree (id_hub);
create index if not exists idx_prenotazioni_user on public.prenotazioni using btree (id_user);
create index if not exists idx_prenotazioni_rubrica on public.prenotazioni using btree (id_rubrica);
create index if not exists idx_prenotazioni_agenda_lookup on public.prenotazioni using btree (id_hub, id_professionista, tms_inizio, tms_fine) where (deleted_at is null and stato <> 'cancellata'::text);

-- 14. Tabella Dettagli Prenotazioni / Carrello Items
create table if not exists public.prenotazioni_items (
    id serial not null,
    id_hub uuid not null,
    id_prenotazione integer not null,
    id_item integer not null,
    tipo text not null,
    pagamento boolean not null default false,
    nuovo boolean not null default true,
    quantita integer not null default 1,
    prezzo numeric(10, 2) not null default 0.00,
    totale numeric(10, 2) not null default 0.00,
    stato text null,
    tempo_minuti integer not null default 0,
    is_active boolean not null default true,
    note text null,
    created_at timestamp with time zone not null default current_timestamp,
    updated_at timestamp with time zone not null default current_timestamp,
    deleted_at timestamp with time zone null,
    constraint prenotazioni_items_pkey primary key (id),
    constraint fk_prenotazioni_items_hub foreign key (id_hub) references public.hubs (id) on delete cascade,
    constraint fk_items_prenotazione foreign key (id_prenotazione) references public.prenotazioni (id) on delete cascade,
    constraint chk_prenotazioni_items_tipo check (char_length(tipo) <= 50),
    constraint chk_prenotazioni_items_stato check (char_length(stato) <= 50),
    constraint chk_prenotazioni_items_note check (char_length(note) <= 500)
);

create index if not exists idx_pr_items_hub on public.prenotazioni_items using btree (id_hub);
create index if not exists idx_pr_items_prenotazione on public.prenotazioni_items using btree (id_prenotazione);

-- 15. Tabella Configurazioni Lookups & Dropdowns
create table if not exists public.lookup_options (
    id serial not null,
    id_hub uuid not null,
    ordine integer not null default 0,
    codice text not null,
    tipo text not null,
    valore text not null,
    label text not null,
    is_active boolean not null default true,
    colore text null default '#232323'::text,
    constraint lookup_options_pkey primary key (id),
    constraint lookup_options_codice_valore_hub_key unique (id_hub, codice, valore),
    constraint fk_lookup_options_hub foreign key (id_hub) references public.hubs (id) on delete cascade,
    constraint chk_lookup_tipo check (char_length(tipo) <= 80),
    constraint chk_lookup_codice check (char_length(codice) <= 80),
    constraint chk_lookup_valore check (char_length(valore) <= 80),
    constraint chk_lookup_label check (char_length(label) <= 255),
    constraint chk_lookup_colore check (char_length(colore) <= 20)
);

create index if not exists idx_lookup_hub on public.lookup_options using btree (id_hub);
