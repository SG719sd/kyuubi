'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '../theme/theme-toggle';
import { logoutAction } from '@/server/actions/auth.actions';
import { 
  Rocket, 
  Menu, 
  X, 
  LayoutDashboard, 
  Store, 
  User, 
  LogOut 
} from 'lucide-react';
import Image from 'next/image';

export function Header({ user }: { user?: any }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          

<Link href="/dashboard" className="flex items-center gap-2.5 group">
  <div className="w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-1.5 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
    <Image 
      src="/logo.png" 
      alt="Kyuubi Logo" 
      width={28} 
      height={28} 
      className="object-contain w-full h-full" 
    />
  </div>
  <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">
    KYUUBI
  </span>
</Link>

          {/* DESKTOP NAVIGATION */}
          {user && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-xs font-bold tracking-wider text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              {/* <Link
                href="/dashboard/hubs"
                className="text-xs font-bold tracking-wider text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase flex items-center gap-1.5"
              >
                <Store className="w-4 h-4" />
                <span>I Miei Hubs</span>
              </Link> */}
              <Link
                href="/dashboard/profilo"
                className="text-xs font-bold tracking-wider text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                <span>Profilo</span>
              </Link>
            </nav>
          )}

          {/* CONTROLS (THEME + LOGOUT / HAMBURGER) */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {user && (
              <>
                {/* LOGOUT BUTTON DESKTOP */}
                <form action={logoutAction} className="hidden md:block">
                  <button
                    type="submit"
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all border border-slate-200 dark:border-slate-700/60"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>

                {/* HAMBURGER BUTTON MOBILE */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700/60"
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
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-3 pb-6 space-y-3 transition-colors">
          <Link
            href="/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-sm"
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-500" />
            <span>Dashboard</span>
          </Link>

          {/* <Link
            href="/dashboard/hubs"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-sm"
          >
            <Store className="w-4 h-4 text-indigo-500" />
            <span>I Miei Hubs</span>
          </Link> */}
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
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-sm border border-red-500/20"
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