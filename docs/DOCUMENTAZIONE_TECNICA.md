# 📘 DOCUMENTAZIONE TECNICA: ARCHITETTURA KYUUBI HUB MANAGER & EAZYHUBS PLATFORM

---

## 1. VISIONE ARCHITETTURALE E PATTERN A 4 LIVELLI

L'applicazione è progettata seguendo una rigorosa architettura a livelli disaccoppiati, ideale sia per ambienti moderni full-stack (Next.js con React Server Actions e App Router) sia per backend Node/Express con Supabase.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            1. PRESENTATION LAYER                            │
│  UI Components, React Contexts, Hook e Form Interattivi                     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ calls
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                     2. ACTIONS LAYER ('use server')                         │
│  /src/actions/*.ts (hubs, auth.server, catalog, staff, billing, storage)    │
│  - Estrazione IP client dagli Header HTTP (x-forwarded-for, x-real-ip)      │
│  - Validazione preliminare dei parametri e binding FormData                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ delegates
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    3. ORCHESTRATORS LAYER (Workflow)                        │
│  /src/orchestrators/*.ts (AuthOrchestrator, HubOrchestrator, MediaOrchestrator)│
│  - Coordinamento di transazioni multi-servizio (es. Auth + GDPR Audit Log)  │
│  - Elaborazione pipeline media: Compressione WebP, calcolo ratio, storage   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ executes
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                     4. SERVICES LAYER (Business Logic)                      │
│  /src/services/*.ts (AuthService, HubService, CatalogService, StaffService)  │
│  - Validazione rigorosa Zod Schemas e regole di dominio                     │
│  - Calcolo autorizzazioni RBAC (Admin, Responsabile, Collaboratore, Lettore)│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ reads/writes
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                   5. REPOSITORIES LAYER (Data Access)                       │
│  /src/repositories/*.ts (Supabase Client, Auth, Storage, HubRepository)     │
│  - Interfacciamento diretto con PostgreSQL & Supabase Database              │
│  - Esecuzione query, RLS policies, Storage Buckets                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. GESTIONE IP ADDRESS & AUDIT TRAIL GDPR

La conformità al regolamento GDPR e l'imputabilità legale delle azioni di consenso (Termini di Servizio, Trattamento Dati, Privacy Policy, Ricezione Comunicazioni di Marketing) richiedono la memorizzazione sicura dell'indirizzo IP del client al momento della firma digitale.

### 2.1 Estrazione dell'IP Reale con Proxy e Load Balancer
In ambienti con reverse proxy (Cloud Run, Vercel, Cloudflare, Nginx), l'indirizzo IP reale del client è contenuto nell'header `x-forwarded-for`. Se sono presenti più proxy concatenati, il primo IP della lista separata da virgola identifica il client d'origine.

```typescript
// /src/actions/auth.server.ts
export async function registerAction(formData: FormData): Promise<ActionResponse> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const nome = formData.get('nome') as string;
  const cognome = formData.get('cognome') as string;
  const telefono = formData.get('telefono') as string;
  const marketingAccettato = formData.get('marketing') === 'on';

  // 1. Estrazione degli header HTTP
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  
  // 2. Risoluzione dell'IP client originario
  const ipAddress = forwardedFor 
    ? forwardedFor.split(',')[0].trim() 
    : (realIp || '127.0.0.1');

  // 3. Orchestrazione registrazione e firma consensi
  try {
    await AuthOrchestrator.register({
      email,
      password,
      nome,
      cognome,
      telefono,
      marketingAccettato,
      ipAddress,
    });
  } catch (err: any) {
    return { success: false, error: err.message };
  }

  redirect('/dashboard');
}
```

### 2.2 Tabella `public.consensi_autorizzazioni`
Ciascun evento di firma genera una riga non modificabile con:
- `id_user` (UUID utente firmatario)
- `id_hub` (UUID opzionale dell'hub)
- `tipo_consenso` (`REGISTRAZIONE_TERMINI_SERVIZIO`, `CONSENSO_TRATTAMENTO_DATI_GDPR`, `CONSENSO_MARKETING_E_PROMOZIONI`)
- `versione_policy` (es. `v2.4_2026`)
- `stato` (`ACCETTATO`)
- `ip_address` (stringa IPv4 o IPv6 fino a 45 caratteri)
- `created_at` (timestamp immutabile di firma)

---

## 3. MODELLO DATI RELAZIONALE (POSTGRESQL / SUPABASE)

Lo schema è strutturato in moduli specializzati, con vincoli di integrità referenziale (`FOREIGN KEY`), indici `B-Tree` ad alte prestazioni e vincoli `CHECK`.

### File SQL Separati Disponibili:
1. `01_tables.sql`: DDL di tutte le 14 tabelle con vincoli e indici.
2. `02_functions_triggers.sql`: Funzioni di sincronizzazione e trigger automatici.
3. `03_rls_policies.sql`: Matrice completa di Row Level Security.
4. `04_seed_lookups.sql`: Dati di avvio e procedure di configurazione.
5. `00_master_schema.sql`: Script unificato per deploy rapido in Supabase.

### Schema Riassuntivo delle Tabelle:

| Tabella | Categoria | Descrizione | Chiave Primaria | RLS |
| :--- | :--- | :--- | :--- | :--- |
| `public.users` | Auth & Core | Anagrafica utente legata ad `auth.users` | `id` (UUID) | ✅ |
| `public.consensi_autorizzazioni` | Auth & Core | Registro firme digitali, policy, timestamp e IP | `id` (SERIAL) | ✅ |
| `public.hubs` | Hub Ecosystem | Entità Multi-Tenant centrale con slug, stile e flag moduli | `id` (UUID) | ✅ |
| `public.hub_billing_info` | Hub Ecosystem | Dati fiscali e fatturazione elettronica (SDI, PEC, P.IVA) | `hub_id` (UUID) | ✅ |
| `public.professionisti` | Hub Ecosystem | Membri dello staff, ruoli e permessi di amministrazione | `id` (SERIAL) | ✅ |
| `public.servizi` | Catalog & Menu | Listino trattamenti, prezzi, costi, durata e IVA | `id` (SERIAL) | ✅ |
| `public.prodotti` | Catalog & Menu | Magazzino, SKU, Barcode, scorte (nuovo/usato) e soglia alert | `id` (SERIAL) | ✅ |
| `public.piatti` | Catalog & Menu | Menu ristorazione, allergeni, ingredienti e diete | `id` (SERIAL) | ✅ |
| `public.rubrica` | Operations | Rubrica anagrafica clienti, recapiti e note | `id` (SERIAL) | ✅ |
| `public.professionisti_servizi` | Operations | Matrice override prezzi e durate personalizzate per operatore | `id` (SERIAL) | ✅ |
| `public.orari_lavoro` | Operations | Orari settimanali di apertura hub o turni professionisti | `id` (BIGINT) | ✅ |
| `public.prenotazioni` | Operations | Testate appuntamenti, ordini, agenda e totali | `id` (SERIAL) | ✅ |
| `public.prenotazioni_items` | Operations | Righe di dettaglio / carrello per prenotazioni | `id` (SERIAL) | ✅ |
| `public.lookup_options` | Settings | Opzioni configurabili per dropdown e tassonomie | `id` (SERIAL) | ✅ |

---

## 4. FUNZIONI POSTGRESQL E TRIGGER AUTOMATICI

### 4.1 `handle_updated_at()`
Aggiorna in tempo reale la colonna `updated_at` prima di qualsiasi operazione di `UPDATE` su qualsiasi tabella del database.

### 4.2 `handle_auth_user_created()`
Trigger applicato ad `auth.users`. Quando un utente effettua il signup su Supabase Auth, crea o aggiorna automaticamente il record corrispondente in `public.users`, preservando i metadati (`nome`, `cognome`, `telefono`).

### 4.3 `handle_hub_owner_professionista()`
Trigger applicato a `public.hubs`. Quando un utente crea un nuovo Hub, il trigger inserisce automaticamente il creatore come membro dello staff nella tabella `public.professionisti` con i privilegi di `admin = true` e ruolo `'Titolare / Amministratore'`.

### 4.4 Helper di Sicurezza: `is_hub_admin(p_hub_id)`
Verifica in modo performante e sicuro se l'utente corrente autenticato (`auth.uid()`) è l'owner dell'Hub oppure un professionista con flag `admin = true`.

### 4.5 Helper di Sicurezza: `is_hub_member(p_hub_id)`
Verifica se `auth.uid()` è un membro attivo dello staff associato all'Hub indicato.

---

## 5. MATRICE DI SICUREZZA ROW LEVEL SECURITY (RLS)

Tutte le tabelle hanno la Row Level Security **ATTIVA**. L'isolamento multi-tenant è garantito a livello di motore di database:

1. **Gestione Privata Hub**:
   - I dati di gestione (membri, rubrica, prenotazioni interne, billing) sono accessibili esclusivamente tramite le policy basate sulle funzioni `is_hub_admin` e `is_hub_member`.
2. **Visualizzazione Pubblica EazyHubs**:
   - Gli Hub attivi e visibili (`is_visible = true`, `is_active = true`, `deleted_at is null`) sono consultabili dal pubblico.
   - I cataloghi `servizi`, `prodotti` e `piatti` con flag `pubblico = true` sono leggibili liberamente per consentire la vetrina digitale e l'ordinazione/prenotazione online.
3. **Fatturazione Elettronica**:
   - I dati in `hub_billing_info` possono essere letti, inseriti o modificati unicamente dagli amministratori dell'Hub specifico.
4. **Audit Log Consensi**:
   - Gli utenti possono visualizzare e registrare unicamente i propri consensi (`id_user = auth.uid()`).

---

## 6. PIPELINE DI OTTIMIZZAZIONE MEDIA (WEBP)

Per garantire la massima velocità di caricamento delle pagine e ridurre i costi di banda su Supabase Storage:

1. **Client-Side Compression**: L'immagine (JPEG, PNG, HEIC) viene processata tramite HTML5 Canvas nel browser (`ImageOptimizationService`).
2. **Conversione in WebP**: L'immagine viene ridimensionata mantenendo l'aspect ratio (max 1200px di larghezza per foto prodotto/piatti/servizi, max 400px per avatar e loghi) con qualità 82%.
3. **Risparmio Calcolato**: La compressione riduce mediamente il peso dei file del **70-85%**.
4. **Persistenza su Supabase Storage**: Il blob WebP ottimizzato viene caricato nella cartella appropriata del bucket (`logos/`, `servizi/`, `prodotti/`, `piatti/`, `avatars/`) generando un URL pubblico permanente.
