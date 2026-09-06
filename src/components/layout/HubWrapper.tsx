'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';

interface HubPageWrapperProps {
  slugHub: string;
  children: React.ReactNode;
}

export default function HubPageWrapper({
  slugHub,
  children,
}: HubPageWrapperProps) {
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6">
      {/* Barra di navigazione con history back nativo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-all shadow-2xs hover:scale-105 active:scale-95 cursor-pointer"
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