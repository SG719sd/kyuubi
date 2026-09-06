import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 transition-colors py-8 text-slate-500 dark:text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} Kyuubi Ecosystem. Tutti i diritti riservati.</p>
        <div className="flex items-center gap-6">
          <Link href="/prezzi" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Prezzi
          </Link>
          <Link href="/privacy-policy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/termini-servizio" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Termini e Condizioni
          </Link>
          <Link href="/supporto" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Supporto
          </Link>
        </div>
      </div>
    </footer>
  );
}