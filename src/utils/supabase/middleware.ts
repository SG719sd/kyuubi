import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from '@/types/database.types';

interface ProfAccessQueryResult {
  id: number;
  id_hub: string;
  ruolo: string;
  admin: boolean; // <--- Aggiunto campo admin
  hubs: {
    id: string;
    slug: string;
  } | null;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://memjlrhljifrwjqyymil.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  let user = null;
  let supabase: ReturnType<typeof createServerClient<Database>> | null = null;

  try {
    supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch (err) {
    console.warn('[Supabase Middleware] Session lookup failed:', err);
  }

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith('/login');
  const isDashboardRoute = pathname.startsWith('/dashboard');

  // 1. Redirect utente non autenticato
  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Redirect utente già autenticato da login o root a dashboard
  if (user && (isAuthRoute || pathname === '/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // 3. Controllo Accesso alla pagina specifica dell'Hub: /dashboard/hubs/[slugHub]
  const hubMatch = pathname.match(/^\/dashboard\/hubs\/([^\/]+)/);

  if (user && hubMatch && supabase) {
    const slugHub = hubMatch[1];

    if (slugHub !== 'nuovo' && slugHub !== 'hubs') {
      try {
        const { data: rawProfAccess } = await supabase
          .from('professionisti')
          .select(`
            id,
            id_hub,
            ruolo,
            admin,
            hubs!inner(id, slug)
          `)
          .eq('id_user', user.id)
          .eq('hubs.slug', slugHub)
          .eq('is_active', true)
          .is('deleted_at', null)
          .maybeSingle();

        const profAccess = rawProfAccess as unknown as ProfAccessQueryResult | null;

        // Nessun accesso a questo Hub -> Redirect
        if (!profAccess) {
          const url = request.nextUrl.clone();
          url.pathname = '/dashboard';
          url.searchParams.set('error', 'unauthorized');
          return NextResponse.redirect(url);
        }

        // Iniettiamo gli header per renderli disponibili al server component / layout
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-hub-id', profAccess.id_hub);
        requestHeaders.set('x-hub-slug', slugHub);
        requestHeaders.set('x-professionista-id', String(profAccess.id));
        requestHeaders.set('x-professionista-ruolo', profAccess.ruolo || '');
        // SETTIAMO ESPLICITAMENTE L'HEADER ADMIN COME STRINGA 'true' O 'false'
        requestHeaders.set('x-professionista-admin', String(Boolean(profAccess.admin)));

        // Re-inizializziamo la risposta facendo passare gli header aggiornati
        supabaseResponse = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      } catch (err) {
        console.warn('[Supabase Middleware] Hub access check failed:', err);
      }
    }
  }

  return supabaseResponse;
}