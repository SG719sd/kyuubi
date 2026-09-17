'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '../theme/theme-toggle';
import { logoutAction } from '@/server/actions/auth.actions';
import { getUserHubsAction } from '@/server/actions/hub.actions';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Store, 
  User, 
  LogOut,
  ChevronDown,
  Building2,
  Check,
  Plus
} from 'lucide-react';
import Image from 'next/image';
import { HubRow } from '@/types';

export function Header({ 
  user, 
  userHubs = [] 
}: { 
  user?: any; 
  userHubs?: HubRow[];
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHubDropdownOpen, setIsHubDropdownOpen] = useState(false);
  const [hubsList, setHubsList] = useState<HubRow[]>(userHubs);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();

  // Rilevamento se l'utente è all'interno di un Hub tramite URL
  const hubMatch = pathname ? pathname.match(/\/dashboard\/hubs\/([^\/]+)/) : null;
  const currentSlug = hubMatch ? hubMatch[1] : null;
  const isInsideHub = Boolean(currentSlug);
  const isHubHomePage = currentSlug ? pathname === `/dashboard/hubs/${currentSlug}` : false;

  // Sincronizza o recupera gli Hub se non passati o cambiati
  useEffect(() => {
    if (userHubs && userHubs.length > 0) {
      setHubsList(userHubs);
    } else if (user) {
      getUserHubsAction().then((res) => {
        if (res.success && res.data) {
          setHubsList(res.data);
        }
      });
    }
  }, [userHubs, user]);

  // Chiudi dropdown al click all'esterno
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsHubDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hub attualmente selezionato
  const currentHub = currentSlug ? hubsList.find((h) => h.slug === currentSlug) : null;
  const currentHubTitle = currentHub?.nome || (currentHub as any)?.titolo || (currentSlug ? currentSlug.replace(/-/g, ' ') : '');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* LOGO & BRAND */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-1.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
                <Image 
                  src="/logo.png" 
                  alt="Kyuubi Logo" 
                  width={28} 
                  height={28} 
                  className="object-contain w-full h-full" 
                />
              </div>
              <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white hidden sm:inline">
                KYUUBI
              </span>
            </Link>

            {/* DROPDOWN HUB CHE SI POSSONO VISITARE (DESKTOP) */}
            {user && (
              <div className="relative hidden md:block" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsHubDropdownOpen(!isHubDropdownOpen)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                    isInsideHub
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-100/80'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                  aria-expanded={isHubDropdownOpen}
                >
                  <Building2 className={`w-3.5 h-3.5 ${isInsideHub ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
                  <span className="max-w-[130px] lg:max-w-[180px] truncate capitalize">
                    {isInsideHub ? currentHubTitle : 'Seleziona Hub'}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isHubDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* MENU A TENDINA HUBS */}
                {isHubDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        I tuoi Hub ({hubsList.length})
                      </span>
                      <Link
                        href="/dashboard"
                        onClick={() => setIsHubDropdownOpen(false)}
                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Nuovo Hub
                      </Link>
                    </div>

                    <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
                      {hubsList.length === 0 ? (
                        <div className="px-3 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
                          Nessun hub disponibile.
                        </div>
                      ) : (
                        hubsList.map((h) => {
                          const isCurrent = h.slug === currentSlug;
                          return (
                            <Link
                              key={h.id}
                              href={`/dashboard/hubs/${h.slug}`}
                              onClick={() => setIsHubDropdownOpen(false)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                                isCurrent
                                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                                  isCurrent 
                                    ? 'bg-indigo-600 text-white shadow-xs' 
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}>
                                  {(h.nome || (h as any).titolo || 'H').charAt(0).toUpperCase()}
                                </div>
                                <div className="truncate">
                                  <div className="truncate font-bold text-slate-900 dark:text-white capitalize">
                                    {h.nome || (h as any).titolo}
                                  </div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                    /{h.slug}
                                  </div>
                                </div>
                              </div>
                              {isCurrent && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />}
                            </Link>
                          );
                        })
                      )}
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 px-2 pt-1.5">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsHubDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                        <span>Panoramica Dashboard</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CENTRO / AZIONE RAPIDA: BOTTONE "HOME HUB" SE DENTRO UN HUB */}
          {user && isInsideHub && (
            <div className="flex items-center">
              <Link
                href={`/dashboard/hubs/${currentSlug}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
                  isHubHomePage 
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent hover:shadow-xs'
                }`}
                title={`Vai alla Home di ${currentHubTitle}`}
              >
                <Store className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Home Hub</span>
                <span className="sm:hidden">Home</span>
              </Link>
            </div>
          )}

          {/* DESKTOP NAVIGATION */}
          {user && (
            <nav className="hidden md:flex items-center gap-5">
              <Link
                href="/dashboard"
                className={`text-xs font-bold tracking-wider transition-colors uppercase flex items-center gap-1.5 ${
                  pathname === '/dashboard' 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/dashboard/profilo"
                className={`text-xs font-bold tracking-wider transition-colors uppercase flex items-center gap-1.5 ${
                  pathname === '/dashboard/profilo' 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Profilo</span>
              </Link>
            </nav>
          )}

          {/* CONTROLS (THEME + LOGOUT / HAMBURGER) */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            {user && (
              <>
                {/* LOGOUT BUTTON DESKTOP */}
                <form action={logoutAction} className="hidden md:block">
                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all border border-slate-200 dark:border-slate-700/60 cursor-pointer"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>

                {/* HAMBURGER BUTTON MOBILE */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700/60 cursor-pointer"
                  aria-label="Open Menu"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {user && isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-3 pb-6 space-y-3 transition-colors animate-in fade-in-50">
          
          {/* Se dentro un Hub su mobile */}
          {isInsideHub && (
            <Link
              href={`/dashboard/hubs/${currentSlug}`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold text-sm"
            >
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Home Hub ({currentHubTitle})</span>
              </div>
              <span className="text-xs text-indigo-500">Torna alla home →</span>
            </Link>
          )}

          {/* Selezione Hubs su mobile */}
          {hubsList.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                I tuoi Hub ({hubsList.length})
              </div>
              <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
                {hubsList.map((h) => {
                  const isCurrent = h.slug === currentSlug;
                  return (
                    <Link
                      key={h.id}
                      href={`/dashboard/hubs/${h.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                        isCurrent
                          ? 'bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span className="truncate capitalize">{h.nome || (h as any).titolo}</span>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          <Link
            href="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-sm"
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-500" />
            <span>Dashboard Generale</span>
          </Link>

          <Link
            href="/dashboard/profilo"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-sm"
          >
            <User className="w-4 h-4 text-indigo-500" />
            <span>Profilo</span>
          </Link>

          <form action={logoutAction} className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-sm border border-red-500/20 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Esci dal Profilo</span>
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
