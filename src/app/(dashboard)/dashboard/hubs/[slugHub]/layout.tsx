import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { HubService } from '@/server/services/hub.service';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function HubSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slugHub: string }>;
}) {
  const { slugHub } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verifica che l'hub esista e che l'utente loggato sia un professionista attivo autorizzato per questo hub
  const rawData = await HubService.getHubWithProfessionista(slugHub, user.id);

  if (!rawData || !rawData.hub || !rawData.professionista) {
    notFound();
  }

  // Se l'hub è stato bloccato / disattivato manualmente dall'amministrazione (is_active === false)
  if (rawData.hub.is_active === false) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-8 text-center shadow-xl space-y-5">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Hub Sospeso o Bloccato
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              L'Hub <strong>{rawData.hub.nome}</strong> è stato temporaneamente disattivato dall'amministrazione.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Torna alla Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
