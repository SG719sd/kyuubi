import React from 'react';
import { WizardClient } from './wizard-client';

export default function NewHubPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <span className="text-xs font-black tracking-widest text-sky-600 dark:text-sky-400 uppercase">
            NUOVA ATTIVITÀ
          </span>
          <h1 className="text-3xl font-black tracking-tight">Crea un nuovo Hub</h1>
        </div>

        <WizardClient />
      </div>
    </div>
  );
}