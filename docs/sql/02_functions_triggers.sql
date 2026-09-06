-- ==============================================================================
-- 02_FUNCTIONS_TRIGGERS.SQL: FUNZIONI STORED E TRIGGER DI DATABASE
-- Database: PostgreSQL 15+ / Supabase
-- Sistema: Kyuubi Hub Manager & EazyHubs Platform
-- ==============================================================================

-- 1. Funzione Generica per Gestione Automatica del Timestamp updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = current_timestamp;
    return new;
end;
$$ language plpgsql;

-- 2. Trigger di auto-aggiornamento updated_at su tutte le tabelle
create or replace trigger trg_users_updated_at
    before update on public.users
    for each row execute function public.handle_updated_at();

create or replace trigger trg_hubs_updated_at
    before update on public.hubs
    for each row execute function public.handle_updated_at();

create or replace trigger trg_hub_billing_info_updated_at
    before update on public.hub_billing_info
    for each row execute function public.handle_updated_at();

create or replace trigger trg_professionisti_updated_at
    before update on public.professionisti
    for each row execute function public.handle_updated_at();

create or replace trigger trg_servizi_updated_at
    before update on public.servizi
    for each row execute function public.handle_updated_at();

create or replace trigger trg_prodotti_updated_at
    before update on public.prodotti
    for each row execute function public.handle_updated_at();

create or replace trigger trg_piatti_updated_at
    before update on public.piatti
    for each row execute function public.handle_updated_at();

create or replace trigger trg_rubrica_updated_at
    before update on public.rubrica
    for each row execute function public.handle_updated_at();

create or replace trigger trg_prof_servizi_updated_at
    before update on public.professionisti_servizi
    for each row execute function public.handle_updated_at();

create or replace trigger trg_orari_lavoro_updated_at
    before update on public.orari_lavoro
    for each row execute function public.handle_updated_at();

create or replace trigger trg_prenotazioni_updated_at
    before update on public.prenotazioni
    for each row execute function public.handle_updated_at();

create or replace trigger trg_prenotazioni_items_updated_at
    before update on public.prenotazioni_items
    for each row execute function public.handle_updated_at();

-- 3. Funzione & Trigger per Sincronizzazione automatica tra auth.users e public.users
create or replace function public.handle_auth_user_created()
returns trigger as $$
begin
    insert into public.users (id, email, nome, cognome, telefono)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
        coalesce(new.raw_user_meta_data->>'cognome', ''),
        new.raw_user_meta_data->>'telefono'
    )
    on conflict (id) do update
    set 
        email = excluded.email,
        nome = case when public.users.nome is null or public.users.nome = '' then excluded.nome else public.users.nome end,
        cognome = case when public.users.cognome is null or public.users.cognome = '' then excluded.cognome else public.users.cognome end,
        telefono = coalesce(excluded.telefono, public.users.telefono);
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_auth_user_created();

-- 4. Funzione & Trigger: Assegnazione automatica del creatore dell'Hub come Professionista Admin
create or replace function public.handle_hub_owner_professionista()
returns trigger as $$
declare
    v_user_nome text;
    v_user_cognome text;
begin
    select nome, cognome into v_user_nome, v_user_cognome
    from public.users
    where id = new.id_user;

    insert into public.professionisti (
        id_hub,
        id_user,
        nome,
        ruolo,
        admin,
        is_active,
        colore
    ) values (
        new.id,
        new.id_user,
        coalesce(nullif(trim(concat_ws(' ', v_user_nome, v_user_cognome)), ''), 'Amministratore Hub'),
        'Titolare / Amministratore',
        true,
        true,
        '#10b981'
    )
    on conflict (id_user, id_hub) do update
    set admin = true, is_active = true;

    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_hub_created_make_admin on public.hubs;
create trigger on_hub_created_make_admin
    after insert on public.hubs
    for each row execute function public.handle_hub_owner_professionista();

-- 5. Funzione di Sicurezza RLS: Verifica se l'utente autenticato è Amministratore dell'Hub
create or replace function public.is_hub_admin(p_hub_id uuid)
returns boolean as $$
begin
    return exists (
        select 1
        from public.professionisti p
        where p.id_hub = p_hub_id
          and p.id_user = auth.uid()
          and p.admin = true
          and p.is_active = true
          and p.deleted_at is null
    ) or exists (
        select 1
        from public.hubs h
        where h.id = p_hub_id
          and h.id_user = auth.uid()
          and h.deleted_at is null
    );
end;
$$ language plpgsql security definer;

-- 6. Funzione di Sicurezza RLS: Verifica se l'utente autenticato è Membro attivo dell'Hub (qualsiasi ruolo)
create or replace function public.is_hub_member(p_hub_id uuid)
returns boolean as $$
begin
    return exists (
        select 1
        from public.professionisti p
        where p.id_hub = p_hub_id
          and p.id_user = auth.uid()
          and p.is_active = true
          and p.deleted_at is null
    ) or exists (
        select 1
        from public.hubs h
        where h.id = p_hub_id
          and h.id_user = auth.uid()
          and h.deleted_at is null
    );
end;
$$ language plpgsql security definer;
