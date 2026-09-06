'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Share2 } from 'lucide-react';

interface HubShareActionsProps {
  slug: string;
  nome: string;
}

export function HubShareActions({ slug, nome }: HubShareActionsProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `https://eazyhubs.com/hubs/${slug}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Errore nel copiare il link:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: slug,
          text: `Scopri ${slug} su EazyHubs: ${shareUrl}`,
          url: shareUrl,
        });
      } catch (err) {
        // L'utente ha annullato la condivisione
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap pt-0.5">
      <Link
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-mono text-indigo-300/80 hover:text-indigo-200 hover:underline transition-colors"
      >
        eazyhubs.com/hubs/{slug}
      </Link>

      <div className="flex items-center gap-1.5 ml-1">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-100 text-[11px] font-medium transition-all cursor-pointer"
          title="Copia link"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copiato!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-indigo-300" />
              <span>Copia</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-100 text-[11px] font-medium transition-all cursor-pointer"
          title="Condividi"
        >
          <Share2 className="w-3 h-3 text-indigo-300" />
          <span>Condividi</span>
        </button>
      </div>
    </div>
  );
}