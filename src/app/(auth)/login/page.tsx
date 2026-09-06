'use client';

import { useState } from 'react';
import { loginAction, registerAction } from '@/server/actions/auth.actions';
import Link from 'next/link';
import { 
  Rocket, 
  Mail, 
  Lock, 
  Phone, 
  Sparkles,
  ArrowRight,
  User,
  AlertCircle,
  CheckCircle2,
  Check,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [alert, setAlert] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Stato Password
  const [password, setPassword] = useState('');

  // Requisiti Password SOLO per Registrazione
  const passwordRequirements = [
    { label: 'Almeno 8 caratteri', valid: password.length >= 8 },
    { label: 'Una lettera maiuscola', valid: /[A-Z]/.test(password) },
    { label: 'Un numero (0-9)', valid: /[0-9]/.test(password) },
    { label: 'Un carattere speciale (!@#$%^&*)', valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const isPasswordValid = passwordRequirements.every((req) => req.valid);

  // Calcolo forza password (solamente per la registrazione)
  const validCount = passwordRequirements.filter((req) => req.valid).length;
  const getStrengthLabel = () => {
    if (validCount === 0) return { text: '', color: 'bg-slate-200 dark:bg-slate-800' };
    if (validCount <= 2) return { text: 'Debole', color: 'bg-rose-500' };
    if (validCount === 3) return { text: 'Media', color: 'bg-amber-500' };
    return { text: 'Forte', color: 'bg-emerald-500' };
  };

  async function handleSubmit(formData: FormData) {
    setAlert(null);

    // Il controllo password viene applicato SOLTANTO se l'utente si sta registrando
    if (isRegistering && !isPasswordValid) {
      setAlert({
        type: 'error',
        message: 'La password deve soddisfare tutti i requisiti di sicurezza per la registrazione.',
      });
      return;
    }

    setLoading(true);

    const res = isRegistering 
      ? await registerAction(formData) 
      : await loginAction(formData);

    if (res?.error) {
      setAlert({ type: 'error', message: res.error });
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 py-12 relative overflow-hidden transition-colors">
      
      {/* Sfondo decorativo con gradiente morbido */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-sky-400/10 dark:from-sky-600/20 to-blue-500/10 dark:to-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* HEADER / BADGE */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 shadow-md mb-4">
            <Rocket className="w-4 h-4" />
            <span className="text-[11px] font-black tracking-widest uppercase">EAZYHUBS ECOSYSTEM</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 dark:from-sky-400 dark:to-blue-400 mb-2">
            {isRegistering ? 'Crea il tuo Hub' : 'Bentornato su Kyuubi'}
          </h1>
          
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {isRegistering
              ? 'Inserisci i tuoi dati per registrare la tua attività'
              : 'Accedi per gestire i tuoi servizi, prodotti e menù'}
          </p>
        </div>

        {/* CARD FORM */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl dark:shadow-2xl space-y-6 transition-colors">
          
          {/* ALERT BOX */}
          {alert && (
            <div
              className={`p-4 rounded-2xl text-sm font-semibold flex items-center gap-3 border ${
                alert.type === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                  : 'bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400'
              }`}
            >
              {alert.type === 'error' ? (
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500 dark:text-red-400" />
              ) : (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-sky-500 dark:text-sky-400" />
              )}
              <span>{alert.message}</span>
            </div>
          )}

          {/* FORM */}
          <form action={handleSubmit} className="space-y-4">
            {isRegistering && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Nome *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        name="nome"
                        type="text"
                        required
                        placeholder="Mario"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Cognome *
                    </label>
                    <input
                      name="cognome"
                      type="text"
                      required
                      placeholder="Rossi"
                      className="w-full px-3.5 py-2.5 bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Telefono *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      name="telefono"
                      type="tel"
                      required
                      placeholder="+39 333 1234567"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="mario.rossi@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* CAMPO PASSWORD */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-100/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* INDICATORE DI FORZA E REQUISITI PASSWORD (MOSTRATO SOLO SE IS_REGISTERING) */}
              {isRegistering && (
                <div className="mt-3 p-3.5 bg-slate-100/60 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-2.5">
                  {/* Progress Bar Forza Password */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 transition-all duration-300 ${
                            validCount >= step ? getStrengthLabel().color : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                    {password && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {getStrengthLabel().text}
                      </span>
                    )}
                  </div>

                  {/* Checklist Requisiti */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                    {passwordRequirements.map((req, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-1.5 font-medium transition-colors ${
                          req.valid
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      >
                        {req.valid ? (
                          <Check className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 shrink-0 opacity-40" />
                        )}
                        <span>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isRegistering && (
              <div className="pt-2 space-y-3">
                {/* CHECKBOX MARKETING */}
                <label className="flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="marketing"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="group-hover:text-slate-900 dark:group-hover:text-slate-300 transition-colors">
                    Acconsento a ricevere aggiornamenti e comunicazioni su Kyuubi Ecosystem (opzionale)
                  </span>
                </label>

                {/* NOTA TOS & PRIVACY */}
                <div className="p-3 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/50 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Registrandoti, accetti i nostri{' '}
                  <Link 
                    href="/termini-servizio" 
                    target="_blank" 
                    className="font-semibold text-sky-600 dark:text-sky-400 underline underline-offset-2 hover:text-sky-500"
                  >
                    Termini di Servizio
                  </Link>{' '}
                  e dichiari di aver letto la nostra{' '}
                  <Link 
                    href="/privacy-policy" 
                    target="_blank" 
                    className="font-semibold text-sky-600 dark:text-sky-400 underline underline-offset-2 hover:text-sky-500"
                  >
                    Privacy Policy
                  </Link>.
                </div>
              </div>
            )}

            {/* BUTTON PRINCIPALE GRADIENTE AZZURRO/BLU */}
            <button
              type="submit"
              disabled={loading || (isRegistering && !isPasswordValid)}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl shadow-lg shadow-sky-500/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 mt-4 text-sm tracking-wide"
            >
              <span>{loading ? 'Elaborazione...' : isRegistering ? 'CREA IL TUO HUB' : 'ACCEDI AL PANNELLO'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* TOGGLE REGISTRAZIONE / LOGIN */}
          <div className="text-center pt-4 border-t border-slate-200/80 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAlert(null);
                setPassword('');
              }}
              className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>
                {isRegistering
                  ? 'Hai già un account? Accedi subito'
                  : 'Non hai ancora un account? Crea un Hub'}
              </span>
            </button>
          </div>

        </div>
      </div>
    </main>
  );
}