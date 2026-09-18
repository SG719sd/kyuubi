import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { unstable_noStore as noStore } from 'next/cache';

export interface HubContext {
  userId: string;
  hubId: string;
  hubSlug: string;
  professionistaId: number;
  ruolo: string;
  admin: boolean;   // Colonna booleana DB 'admin'
  isAdmin: boolean; // TRUE se admin === true OPPURE ruolo === 'admin'
}

interface ProfQueryData {
  id: number;
  id_hub: string;
  ruolo: string;
  admin: boolean;
}

/**
 * Recupera il contesto dell'Hub sempre aggiornato direttamente dal DB,
 * bypassando gli header della richiesta ed evitando qualsiasi caching di Next.js.
 */
export async function getHubContext(slugOrId?: string): Promise<HubContext | null> {
  // Disabilita la cache di Next.js per questa chiamata per avere sempre dati freschi
  noStore();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Se viene passato uno slug o un ID hub, leggiamo direttamente dal DB per avere la verità aggiornata
  if (slugOrId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    // Recupera l'hub sia per slug che per id
    const hubQuery = supabase
      .from('hubs')
      .select('id, slug, id_user')
      .is('deleted_at', null);

    const { data: hub } = await (isUuid
      ? hubQuery.eq('id', slugOrId).maybeSingle()
      : hubQuery.eq('slug', slugOrId).maybeSingle());

    if (!hub) return null;

    const isOwner = hub.id_user === user.id;

    // Recupera il profilo professionista associato a questo utente e hub
    const { data: rawProf } = await supabase
      .from('professionisti')
      .select('id, id_hub, ruolo, admin')
      .eq('id_user', user.id)
      .eq('id_hub', hub.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .maybeSingle();

    const prof = rawProf as unknown as ProfQueryData | null;

    if (!prof && !isOwner) return null;

    const isBooleanoAdmin = Boolean(prof?.admin) || isOwner;
    const ruoloLower = prof?.ruolo ? prof.ruolo.toLowerCase() : (isOwner ? 'admin' : '');
    const hasWritePermissions =
      isBooleanoAdmin ||
      ['admin', 'amministratore', 'titolare', 'owner', 'gestore'].includes(ruoloLower);

    return {
      userId: user.id,
      hubId: hub.id,
      hubSlug: hub.slug,
      professionistaId: prof?.id || 0,
      ruolo: prof?.ruolo || (isOwner ? 'admin' : 'collaboratore'),
      admin: isBooleanoAdmin,
      isAdmin: hasWritePermissions,
    };
  }

  // Fallback sugli header solo se non viene fornito uno slugHub
  const headerList = await headers();
  const hubId = headerList.get('x-hub-id');
  const hubSlug = headerList.get('x-hub-slug');
  const profId = headerList.get('x-professionista-id');
  const ruolo = headerList.get('x-professionista-ruolo');
  const adminHeader = headerList.get('x-professionista-admin');

  if (hubId && profId && ruolo && adminHeader !== null) {
    const isBooleanoAdmin = adminHeader === 'true';
    const ruoloLower = ruolo.toLowerCase();
    const hasWritePermissions = isBooleanoAdmin || ['admin', 'titolare', 'owner', 'gestore'].includes(ruoloLower);

    return {
      userId: user.id,
      hubId,
      hubSlug: hubSlug || '',
      professionistaId: Number(profId),
      ruolo,
      admin: isBooleanoAdmin,
      isAdmin: hasWritePermissions,
    };
  }

  return null;
}

export async function requireHubMember(slugHub: string): Promise<HubContext> {
  const ctx = await getHubContext(slugHub);

  if (!ctx) {
    throw new Error('UNAUTHORIZED: Utente non autenticato o non associato all\'Hub');
  }

  return ctx;
}

export async function requireHubAdmin(slugHub: string): Promise<HubContext> {
  const ctx = await getHubContext(slugHub);

  if (!ctx) {
    throw new Error('UNAUTHORIZED: Utente non autenticato o non associato all\'Hub');
  }

  if (!ctx.isAdmin) {
    throw new Error('FORBIDDEN: Azione consentita solo agli amministratori');
  }

  return ctx;
}