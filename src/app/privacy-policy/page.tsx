import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Informativa sulla Privacy & Cookie
          </h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Conforme al Regolamento Generale sulla Protezione dei Dati (GDPR - UE 2016/679)
          </p>
        </div>

        {/* Contenuto */}
        <div className="space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              1. Titolare del Trattamento dei Dati
            </h2>
            <p className="mb-2">
              Il Titolare del Trattamento dei dati personali per la piattaforma globale è <strong>Eazyhubs Ecosystem / Kyuubi</strong>. Per qualsiasi domanda o esercizio dei diritti, puoi contattarci tramite:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Email:</strong> <a href="mailto:eazyhubs@gmail.com" className="text-sky-600 dark:text-sky-400 hover:underline">eazyhubs@gmail.com</a></li>
              <li><strong>Telefono & WhatsApp:</strong> <a href="https://wa.me/393518216235" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline">+39 351 821 6235</a></li>
              <li><strong>Informazioni:</strong> <a href="https://eazyhubs.com/chi-siamo" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline">eazyhubs.com/chi-siamo</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              2. Tipologia di Dati Raccolti e Architettura dell'Ecosistema
            </h2>
            <p className="mb-2">
              La piattaforma gestisce una struttura multi-tenant composta da utenti registrati (clienti finali) e gestori di attività (Hub):
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dati di profilo utente:</strong> Nome, Cognome, Indirizzo Email, Numero di Telefono.</li>
              <li><strong>Dati di Audit e Sicurezza:</strong> Indirizzo IP registrato al momento del consenso per fini di verifica e compliance legale GDPR (memorizzato nel log dei consensi).</li>
              <li><strong>Dati dell'Attività (Hub):</strong> Prodotti, menù, listini e prenotazioni gestiti dai proprietari degli Hub.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              3. Condivisione dei Dati tra Utenti e Singoli Hub
            </h2>
            <p className="mb-2">
              I dati di profilo registrati su Eazyhubs rimangono riservati e visibili unicamente alla piattaforma centrale. 
            </p>
            <p>
              <strong>Associazione all'Hub tramite prenotazione:</strong> Nel momento in cui effettui una prenotazione presso uno specifico Hub e accetti di diventarne cliente, i tuoi dati di contatto (Nome, Cognome, Email, Telefono) vengono resi visibili ed accessibili al gestore di quello specifico Hub per consentire la gestione del servizio e del relativo elenco clienti. Nessun altro Hub presente sulla piattaforma ha o avrà mai accesso ai tuoi dati senza una tua esplicita interazione diretta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              4. Finalità, Base Giuridica e Conservazione
            </h2>
            <p className="mb-2">
              I dati personali forniti vengono trattati per:
            </p>
            <ol className="list-decimal pl-5 space-y-1 mb-2">
              <li>Esecuzione dei servizi di autenticazione, gestione Hub e funzionalità di prenotazione (Base giuridica: Esecuzione del contratto).</li>
              <li>Adempimento di obblighi di legge e tracciamento storico dei consensi espressi (Base giuridica: Obbligo legale).</li>
              <li>Eventuale invio di comunicazioni di aggiornamento (previo consenso facoltativo).</li>
            </ol>
            <p>
              <strong>Periodo di Conservazione:</strong> I log dei consensi e gli IP associati verranno conservati per tutta la durata dell'account attivo o fino alla richiesta di cancellazione dell'utente. In caso di disassociazione o eliminazione da un singolo Hub, la visibilità dei dati da parte di quella specifica attività decade immediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              5. Tecnologie di Infrastruttura e Hosting
            </h2>
            <p className="mb-2">
              La nostra infrastruttura si avvale dei seguenti servizi fornitori di terze parti altamente sicuri:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase:</strong> Gestione del database, autenticazione utenti e isolamento rigido dei dati tramite Row Level Security (RLS).</li>
              <li><strong>Vercel:</strong> Hosting dell'applicazione web Next.js su infrastruttura serverless ed Edge.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              6. Cookie e Diritti dell'Utente
            </h2>
            <p className="mb-2">
              La piattaforma utilizza <strong>esclusivamente cookie tecnici essenziali</strong> e token di sessione per il login (nessun cookie di profilazione o tracciamento terzi).
            </p>
            <p>
              In quanto interessato, hai il diritto di accedere ai tuoi dati, richiederne la rettifica, revocare i consensi o chiederne la cancellazione definitiva scrivendo a <a href="mailto:eazyhubs@gmail.com" className="text-sky-600 dark:text-sky-400 hover:underline">eazyhubs@gmail.com</a> o via WhatsApp al <a href="https://wa.me/393518216235" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline">+39 351 821 6235</a>.
            </p>
          </section>

        </div>

        {/* Footer Card */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Informativa Privacy • Kyuubi Platform</span>
          <Link href="/login" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">
            Torna alla pagina d'accesso
          </Link>
        </div>

      </div>
    </main>
  );
}