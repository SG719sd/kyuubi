'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface HubPageWrapperProps {
  slugHub?: string;
  children: React.ReactNode;
}

export default function HubPageWrapper({
  children,
}: HubPageWrapperProps) {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 md:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Barra di navigazione con history back nativo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer touch-manipulation"
          title="Torna indietro"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Contenuto della pagina */}
      <div>{children}</div>
    </div>
  );
}