import Link from 'next/link';

export default function TerminiServizioPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Termini e Condizioni d'Uso (TOS)
          </h1>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Eazyhubs Ecosystem / Kyuubi • Versione 1.0 (BETA)
          </p>
        </div>

        {/* Contenuto */}
        <div className="space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              1. Oggetto del Servizio
            </h2>
            <p>
              La piattaforma <strong>Eazyhubs Ecosystem</strong> offre un'infrastruttura digitale integrata sia per le attività ("Hub"), per la configurazione di listini, menù e gestione prenotazioni, sia per gli utenti finali, che possono esplorare le attività ed effettuare prenotazioni online.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              2. Account Utente e Relazione Utente-Hub
            </h2>
            <p className="mb-2">
              La registrazione all'ecosistema crea un profilo unico utente. L'utente accetta che:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>La semplice registrazione sulla piattaforma non condivide i propri dati con gli Hub registrati.</li>
              <li>Per effettuare una prenotazione ed usufruire dei servizi di un determinato Hub, l'utente acconsente al collegamento del proprio profilo con l'Hub scelto e all'inserimento nell'elenco clienti di quell'attività.</li>
              <li>L'utente è l'unico responsabile della riservatezza delle proprie credenziali (email e password).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              3. Responsabilità sui Contenuti e sulle Prenotazioni
            </h2>
            <p>
              Ciascun Hub risponde in via esclusiva dell'accuratezza dei propri menù, listini prezzi e disponibilità orarie. La piattaforma Eazyhubs agisce come intermediario tecnologico e non risponde di eventuali inesattezze sui servizi o disservizi forniti dai singoli Hub ai propri clienti finali.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              4. Sicurezza, Isolamento Dati e Logout
            </h2>
            <p>
              La sicurezza dell'ecosistema è garantita da controlli di accesso rigidi sia a livello server sia a livello database (Row Level Security su Supabase). L'isolamento garantisce che nessun Hub possa accedere ai dati di clienti associati ad altre strutture. Tutte le informazioni temporanee in memoria vengono eliminate al momento del logout.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              5. Limitazione di Responsabilità
            </h2>
            <p>
              Trattandosi di un servizio in costante aggiornamento ed evoluzione, la piattaforma è fornita "così com'è". Non si garantisce l'assenza totale di interruzioni temporanee dovute a manutenzione dei server hosting o dei database.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              6. Modifiche e Contatti
            </h2>
            <p className="mb-2">
              I presenti termini potranno essere aggiornati a seguito di nuove funzionalità o adeguamenti normativi. Per informazioni o assistenza:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Email:</strong> <a href="mailto:eazyhubs@gmail.com" className="text-sky-600 dark:text-sky-400 hover:underline">eazyhubs@gmail.com</a></li>
              <li><strong>Telefono & WhatsApp:</strong> <a href="https://wa.me/393518216235" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline">+39 351 821 6235</a></li>
              <li><strong>Chi Siamo:</strong> <a href="https://eazyhubs.com/chi-siamo" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline">eazyhubs.com/chi-siamo</a></li>
            </ul>
          </section>

        </div>

        {/* Footer Card */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Tutti i diritti riservati • Kyuubi Platform</span>
          <Link href="/login" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">
            Torna alla pagina d'accesso
          </Link>
        </div>

      </div>
    </main>
  );
}