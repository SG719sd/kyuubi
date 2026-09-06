import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-4">
      <div className="text-center max-w-lg space-y-6">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Kyuubi <span className="text-indigo-500">Admin</span>
        </h1>
        <p className="text-slate-400 text-base">
          Gestione multi-tenant per i tuoi hub, prodotti, servizi e prenotazioni.
        </p>
        <div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
          >
            Accedi o Registrati
          </Link>
        </div>
      </div>
    </main>
  );
}