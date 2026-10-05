import { headers } from 'next/headers';
import { createClient, getCurrentUser } from '@/utils/supabase/server';
import { cache } from 'react';

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
 * Recupera il contesto dell'Hub con deduplicazione a livello di richiesta (React cache),
 * verificando prima gli header iniettati dal proxy/middleware per evitare query DB ridondanti.
 */
export const getHubContext = cache(async (slugOrId?: string): Promise<HubContext | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  // 1. Controlla prima gli header passati dal middleware per risposta immediata a costo zero
  const headerList = await headers();
  const hId = headerList.get('x-hub-id');
  const hSlug = headerList.get('x-hub-slug');
  const hProfId = headerList.get('x-professionista-id');
  const hRuolo = headerList.get('x-professionista-ruolo');
  const hAdmin = headerList.get('x-professionista-admin');

  if (
    hId &&
    hProfId &&
    hAdmin !== null &&
    (!slugOrId || slugOrId === hSlug || slugOrId === hId)
  ) {
    const isBooleanoAdmin = hAdmin === 'true';
    const ruoloLower = (hRuolo || '').toLowerCase();
    const hasWritePermissions =
      isBooleanoAdmin ||
      ['admin', 'amministratore', 'titolare', 'owner', 'gestore'].includes(ruoloLower);

    return {
      userId: user.id,
      hubId: hId,
      hubSlug: hSlug || (slugOrId || ''),
      professionistaId: Number(hProfId),
      ruolo: hRuolo || 'collaboratore',
      admin: isBooleanoAdmin,
      isAdmin: hasWritePermissions,
    };
  }

  // 2. Se non presente negli header o diverso dallo slug richiesto, recupera dal DB
  if (slugOrId) {
    const supabase = await createClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    const hubQuery = supabase
      .from('hubs')
      .select('id, slug, id_user')
      .is('deleted_at', null);

    const { data: hub } = await (isUuid
      ? hubQuery.eq('id', slugOrId).maybeSingle()
      : hubQuery.eq('slug', slugOrId).maybeSingle());

    if (!hub) return null;

    const isOwner = hub.id_user === user.id;

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

  return null;
});

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