
  'use client';
  
  import { use, useEffect } from 'react';
  import { useRouter } from 'next/navigation';
  
  interface PageProps {
    params: Promise<{ hubSlug: string }>;
  }
  
  export default function PiattiPage({ params }: PageProps) {
    const { hubSlug } = use(params);
    const router = useRouter();
  
    useEffect(() => {
      // Aspetta 3 secondi e poi reindirizza
      const timer = setTimeout(() => {
      router.push(`${hubSlug}`);
      }, 3000);
  
      return () => clearTimeout(timer);
    }, [hubSlug, router]);
  
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <span className="text-4xl">👨‍🍳</span>
          <h1 className="text-2xl font-bold tracking-tight">
            Stiamo ancora spadellando!
          </h1>
          <p className="text-muted-foreground">
            Questa sezione è ancora in preparazione. Tra pochissimo ti riportiamo nella pagina principale...
          </p>
          <div className="pt-2 text-sm text-amber-600 font-medium animate-pulse">
            Reindirizzamento in corso...
          </div>
        </div>
      </main>
    );
  }