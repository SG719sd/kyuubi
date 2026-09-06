'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
      title="Torna indietro"
    >
      <ArrowLeft className="w-4 h-4" />
    </button>
  );
}