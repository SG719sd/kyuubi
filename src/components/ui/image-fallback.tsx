'use client';

import React, { useState } from 'react';
import { LucideIcon, ImageOff, Store, Wrench, UtensilsCrossed, Package, User } from 'lucide-react';

export type FallbackIconType = 'store' | 'servizio' | 'piatto' | 'prodotto' | 'user' | 'default';

const FALLBACK_ICON_MAP: Record<FallbackIconType, LucideIcon> = {
  store: Store,
  servizio: Wrench,
  piatto: UtensilsCrossed,
  prodotto: Package,
  user: User,
  default: ImageOff,
};

interface ImageFallbackProps {
  src?: string | null;
  alt: string;
  fallbackType?: FallbackIconType;
  fallbackIcon?: LucideIcon;
  className?: string;
  containerClassName?: string;
}

export function ImageFallback({
  src,
  alt,
  fallbackType = 'default',
  fallbackIcon,
  className = 'w-full h-full object-cover',
  containerClassName = '',
}: ImageFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const ResolvedIcon = fallbackIcon || (fallbackType && FALLBACK_ICON_MAP[fallbackType]) || ImageOff;

  if (!src || hasError) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 ${containerClassName || 'w-full h-full'}`}>
        <ResolvedIcon className="w-1/2 h-1/2 max-w-8 max-h-8 stroke-[1.5]" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-200/70 dark:bg-slate-800/70 animate-pulse z-0" />
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
