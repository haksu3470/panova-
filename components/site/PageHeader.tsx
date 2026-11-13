'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import type { Language } from '@/lib/dictionary';

export type HeaderTone = 'light' | 'dark';

/** Shared look of a header button (home link and page-specific extras). */
export const headerButtonClass: Record<HeaderTone, string> = {
  light:
    'inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200 cursor-pointer',
  dark:
    'inline-flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-700 px-3.5 py-2 text-xs font-bold text-on-dark transition hover:bg-slate-600 cursor-pointer',
};

export const headerLogoutClass =
  'inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 cursor-pointer';

/** Primary page action in a header (e.g. save). */
export const headerPrimaryClass =
  'inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-solid px-3.5 py-2 text-xs font-bold text-white shadow transition hover:bg-brand cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-500';

/**
 * The right-hand group of every page header, in this order:
 * page-specific extras, language switcher, "back to home", log out.
 * Log out is left out on pages without a session.
 */
export function HeaderActions({
  lang,
  onLanguageChange,
  homeLabel,
  homeHref = '/',
  onHomeClick,
  logoutLabel,
  onLogout,
  extra,
  tone = 'light',
}: {
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  homeLabel: string;
  homeHref?: string;
  onHomeClick?: () => void;
  logoutLabel?: string;
  onLogout?: () => void | Promise<void>;
  /** Page-specific buttons; they come before the standard three. */
  extra?: ReactNode;
  tone?: HeaderTone;
}) {
  return (
    <div data-header-actions className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
      {extra}
      <LanguageSwitcher currentLang={lang} onChange={onLanguageChange} tone={tone} />
      <Link href={homeHref} onClick={onHomeClick} className={headerButtonClass[tone]}>
        <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden /> {homeLabel}
      </Link>
      {onLogout && logoutLabel ? (
        <button type="button" onClick={() => void onLogout()} className={headerLogoutClass}>
          <LogOut className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden /> {logoutLabel}
        </button>
      ) : null}
    </div>
  );
}

const VARIANT: Record<'card' | 'bar' | 'dark-bar' | 'plain', string> = {
  card: 'rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6',
  bar: 'w-full border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6',
  'dark-bar': 'w-full border-b border-slate-700 bg-slate-800 px-4 py-4 sm:px-6',
  plain: '',
};

/**
 * Page header: logo, title and the signed-in user on the start side,
 * HeaderActions on the end side. Wraps to two rows on small screens.
 */
export function PageHeader({
  start,
  children,
  actions,
  variant = 'card',
  className = '',
}: {
  start?: ReactNode;
  /** Same place as `start`; use children when the start side sets its own surface colour. */
  children?: ReactNode;
  actions: ReactNode;
  variant?: keyof typeof VARIANT;
  className?: string;
}) {
  return (
    <header className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between ${VARIANT[variant]} ${className}`}>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {start}
        {children}
      </div>
      {actions}
    </header>
  );
}
