import { getHubContext, HubContext } from './context';

/**
 * Richiede che l'utente appartenga all'Hub (Admin, Titolare o Collaboratore)
 */
export async function requireHubMember(slugHub: string): Promise<HubContext> {
  const ctx = await getHubContext(slugHub);

  if (!ctx) {
    throw new Error('UNAUTHORIZED: Utente non autenticato o non associato all\'Hub');
  }

  return ctx;
}

/**
 * Richiede che l'utente sia Amministratore o Titolare dell'Hub
 */
export async function requireHubAdmin(slugHub: string): Promise<HubContext> {
  const ctx = await requireHubMember(slugHub);

  if (!ctx.isAdmin) {
    throw new Error('FORBIDDEN: Azione consentita solo agli amministratori');
  }

  return ctx;
}