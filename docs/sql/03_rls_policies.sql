-- ==============================================================================
-- 03_RLS_POLICIES.SQL: ROW LEVEL SECURITY (RLS) POLICIES & AUTORIZZAZIONI
-- Database: PostgreSQL 15+ / Supabase
-- Sistema: Kyuubi Hub Manager & EazyHubs Platform
-- ==============================================================================

-- 1. Abilitazione RLS su tutte le tabelle
alter table public.users enable row level security;
alter table public.hubs enable row level security;
alter table public.hub_billing_info enable row level security;
alter table public.professionisti enable row level security;
alter table public.consensi_autorizzazioni enable row level security;
alter table public.servizi enable row level security;
alter table public.prodotti enable row level security;
alter table public.piatti enable row level security;
alter table public.rubrica enable row level security;
alter table public.professionisti_servizi enable row level security;
alter table public.orari_lavoro enable row level security;
alter table public.prenotazioni enable row level security;
alter table public.prenotazioni_items enable row level security;
alter table public.lookup_options enable row level security;

-- ==============================================================================
-- 2. POLICIES PER TABELLA USERS
-- ==============================================================================
drop policy if exists "Users can view their own profile" on public.users;
create policy "Users can view their own profile" on public.users
    for select using (id = auth.uid());

drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile" on public.users
    for update using (id = auth.uid()) with check (id = auth.uid());

-- ==============================================================================
-- 3. POLICIES PER TABELLA HUBS
-- ==============================================================================
-- Visualizzazione per membri autorizzati
drop policy if exists "Hub members can select hub" on public.hubs;
create policy "Hub members can select hub" on public.hubs
    for select using (public.is_hub_member(id));

-- Visualizzazione pubblica per portale EazyHubs
drop policy if exists "Public can view active hubs" on public.hubs;
create policy "Public can view active hubs" on public.hubs
    for select using (is_visible = true and is_active = true and deleted_at is null);

-- Creazione nuovo Hub
drop policy if exists "Authenticated users can create hubs" on public.hubs;
create policy "Authenticated users can create hubs" on public.hubs
    for insert with check (auth.uid() = id_user);

-- Modifica e Cancellazione riservata agli Hub Admin / Titolari
drop policy if exists "Hub admins can update hub" on public.hubs;
create policy "Hub admins can update hub" on public.hubs
    for update using (public.is_hub_admin(id)) with check (public.is_hub_admin(id));

drop policy if exists "Hub admins can delete hub" on public.hubs;
create policy "Hub admins can delete hub" on public.hubs
    for delete using (public.is_hub_admin(id));

-- ==============================================================================
-- 4. POLICIES PER TABELLA HUB BILLING INFO
-- ==============================================================================
drop policy if exists "Hub admins can view billing" on public.hub_billing_info;
create policy "Hub admins can view billing" on public.hub_billing_info
    for select using (public.is_hub_admin(hub_id));

drop policy if exists "Hub admins can insert billing" on public.hub_billing_info;
create policy "Hub admins can insert billing" on public.hub_billing_info
    for insert with check (public.is_hub_admin(hub_id));

drop policy if exists "Hub admins can update billing" on public.hub_billing_info;
create policy "Hub admins can update billing" on public.hub_billing_info
    for update using (public.is_hub_admin(hub_id)) with check (public.is_hub_admin(hub_id));

drop policy if exists "Hub admins can delete billing" on public.hub_billing_info;
create policy "Hub admins can delete billing" on public.hub_billing_info
    for delete using (public.is_hub_admin(hub_id));

-- ==============================================================================
-- 5. POLICIES PER TABELLA PROFESSIONISTI
-- ==============================================================================
drop policy if exists "Hub members can view professionisti" on public.professionisti;
create policy "Hub members can view professionisti" on public.professionisti
    for select using (public.is_hub_member(id_hub) or is_visible = true);

drop policy if exists "Hub admins can manage professionisti" on public.professionisti;
create policy "Hub admins can manage professionisti" on public.professionisti
    for all using (public.is_hub_admin(id_hub))
    with check (public.is_hub_admin(id_hub));

-- ==============================================================================
-- 6. POLICIES PER TABELLA CONSENSI & AUTORIZZAZIONI (GDPR AUDIT LOG)
-- ==============================================================================
drop policy if exists "Users can view and insert their own consensi" on public.consensi_autorizzazioni;
create policy "Users can view and insert their own consensi" on public.consensi_autorizzazioni
    for all using (id_user = auth.uid())
    with check (id_user = auth.uid());

-- ==============================================================================
-- 7. POLICIES PER TABELLA SERVIZI
-- ==============================================================================
drop policy if exists "EazyHubs public can view public servizi" on public.servizi;
create policy "EazyHubs public can view public servizi" on public.servizi
    for select using (pubblico = true and is_active = true and deleted_at is null);

drop policy if exists "Hub members can view all hub servizi" on public.servizi;
create policy "Hub members can view all hub servizi" on public.servizi
    for select using (public.is_hub_member(id_hub));

drop policy if exists "Hub admins can insert/update/delete servizi" on public.servizi;
create policy "Hub admins can insert/update/delete servizi" on public.servizi
    for all using (public.is_hub_admin(id_hub))
    with check (public.is_hub_admin(id_hub));

-- ==============================================================================
-- 8. POLICIES PER TABELLA PRODOTTI
-- ==============================================================================
drop policy if exists "EazyHubs public can view public prodotti" on public.prodotti;
create policy "EazyHubs public can view public prodotti" on public.prodotti
    for select using (pubblico = true and is_active = true and deleted_at is null);

drop policy if exists "Hub members can view all hub prodotti" on public.prodotti;
create policy "Hub members can view all hub prodotti" on public.prodotti
    for select using (public.is_hub_member(id_hub));

drop policy if exists "Hub admins can manage prodotti" on public.prodotti;
create policy "Hub admins can manage prodotti" on public.prodotti
    for all using (public.is_hub_admin(id_hub))
    with check (public.is_hub_admin(id_hub));

-- ==============================================================================
-- 9. POLICIES PER TABELLA PIATTI
-- ==============================================================================
drop policy if exists "EazyHubs public can view public piatti" on public.piatti;
create policy "EazyHubs public can view public piatti" on public.piatti
    for select using (pubblico = true and is_active = true and deleted_at is null);

drop policy if exists "Hub members can view all hub piatti" on public.piatti;
create policy "Hub members can view all hub piatti" on public.piatti
    for select using (public.is_hub_member(id_hub));

drop policy if exists "Hub admins can manage piatti" on public.piatti;
create policy "Hub admins can manage piatti" on public.piatti
    for all using (public.is_hub_admin(id_hub))
    with check (public.is_hub_admin(id_hub));

-- ==============================================================================
-- 10. POLICIES PER TABELLA RUBRICA
-- ==============================================================================
drop policy if exists "Hub members can view rubrica" on public.rubrica;
create policy "Hub members can view rubrica" on public.rubrica
    for select using (public.is_hub_member(id_hub));

drop policy if exists "Hub admins can manage rubrica" on public.rubrica;
create policy "Hub admins can manage rubrica" on public.rubrica
    for all using (public.is_hub_admin(id_hub))
    with check (public.is_hub_admin(id_hub));

-- ==============================================================================
-- 11. POLICIES PER TABELLA PROFESSIONISTI SERVIZI
-- ==============================================================================
drop policy if exists "Hub members can view prof_servizi" on public.professionisti_servizi;
create policy "Hub members can view prof_servizi" on public.professionisti_servizi
    for select using (public.is_hub_member(id_hub));

drop policy if exists "Hub admins can manage prof_servizi" on public.professionisti_servizi;
create policy "Hub admins can manage prof_servizi" on public.professionisti_servizi
    for all using (public.is_hub_admin(id_hub))
    with check (public.is_hub_admin(id_hub));

-- ==============================================================================
-- 12. POLICIES PER TABELLA ORARI LAVORO
-- ==============================================================================
drop policy if exists "Public can view hub orari" on public.orari_lavoro;
create policy "Public can view hub orari" on public.orari_lavoro
    for select using (true);

drop policy if exists "Hub admins can manage orari" on public.orari_lavoro;
create policy "Hub admins can manage orari" on public.orari_lavoro
    for all using (public.is_hub_admin(id_hub))
    with check (public.is_hub_admin(id_hub));

-- ==============================================================================
-- 13. POLICIES PER TABELLA PRENOTAZIONI & ITEMS
-- ==============================================================================
drop policy if exists "Hub members can view prenotazioni" on public.prenotazioni;
create policy "Hub members can view prenotazioni" on public.prenotazioni
    for select using (public.is_hub_member(id_hub));

drop policy if exists "Users can view own prenotazioni" on public.prenotazioni;
create policy "Users can view own prenotazioni" on public.prenotazioni
    for select using (id_user = auth.uid());

drop policy if exists "Hub admins can manage all prenotazioni" on public.prenotazioni;
create policy "Hub admins can manage all prenotazioni" on public.prenotazioni
    for all using (public.is_hub_admin(id_hub))
    with check (public.is_hub_admin(id_hub));

drop policy if exists "Hub members can view prenotazioni items" on public.prenotazioni_items;
create policy "Hub members can view prenotazioni items" on public.prenotazioni_items
    for select using (public.is_hub_member(id_hub));

drop policy if exists "Hub admins can manage prenotazioni items" on public.prenotazioni_items;
create policy "Hub admins can manage prenotazioni items" on public.prenotazioni_items
    for all using (public.is_hub_admin(id_hub))
    with check (public.is_hub_admin(id_hub));

-- ==============================================================================
-- 14. POLICIES PER TABELLA LOOKUP OPTIONS
-- ==============================================================================
drop policy if exists "Hub members can view lookup options" on public.lookup_options;
create policy "Hub members can view lookup options" on public.lookup_options
    for select using (public.is_hub_member(id_hub));

drop policy if exists "Hub admins can manage lookup options" on public.lookup_options;
create policy "Hub admins can manage lookup options" on public.lookup_options
    for all using (public.is_hub_admin(id_hub))
    with check (public.is_hub_admin(id_hub));
