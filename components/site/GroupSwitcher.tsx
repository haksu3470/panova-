'use client';

import Link from 'next/link';
import type { Language } from '@/lib/dictionary';

/**
 * Panova Group birimleri: üst bantta logo + birim adı yan yana.
 * Seçili birim renkli ve altı çizili; hazır olmayan birimler soluk ("yakında").
 */
export type GroupUnit = 'hr' | 'agri' | 'construction' | 'trade' | 'social';

const UNITS: { key: GroupUnit; href: string | null }[] = [
  { key: 'hr', href: '/' },
  { key: 'agri', href: '/tarim' },
  { key: 'construction', href: null },
  { key: 'trade', href: null },
  { key: 'social', href: null },
];

const LABELS: Record<'tr' | 'en' | 'mk', Record<GroupUnit, string> & { soon: string; nav: string }> = {
  tr: { hr: 'HR', agri: 'Tarım', construction: 'İnşaat', trade: 'Trade', social: 'Sosyal Projeler', soon: 'yakında', nav: 'Panova Group birimleri' },
  en: { hr: 'HR', agri: 'Agriculture', construction: 'Construction', trade: 'Trade', social: 'Social Projects', soon: 'soon', nav: 'Panova Group units' },
  mk: { hr: 'HR', agri: 'Земјоделство', construction: 'Градежништво', trade: 'Трговија', social: 'Социјални проекти', soon: 'наскоро', nav: 'Единици на Panova Group' },
};

export function GroupSwitcher({ active, lang }: { active: GroupUnit; lang: Language }) {
  const l = lang === 'tr' || lang === 'mk' ? LABELS[lang] : LABELS.en;
  return (
    <nav aria-label={l.nav} className="min-w-0 flex-1">
      <ul className="flex items-stretch gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {UNITS.map(({ key, href }) => {
          const isActive = key === active;
          const ready = href !== null;
          const inner = (
            <>
              <img
                src="/logo.png"
                alt=""
                width={1051}
                height={725}
                className={`h-8 w-auto shrink-0 object-contain sm:h-11 ${isActive ? '' : 'hidden grayscale sm:block'}`}
              />
              <span className="min-w-0 leading-none">
                <span className={`text-[13px] font-extrabold tracking-tight sm:block sm:text-base ${isActive ? 'block text-slate-900' : 'hidden text-slate-500'}`}>PANOVA</span>
                <span className={`mt-0.5 block whitespace-nowrap text-[10px] font-bold sm:text-[11px] ${isActive ? 'text-brand' : 'text-slate-400'}`}>
                  {l[key]}
                  {!ready ? <span className="hidden font-normal sm:inline"> · {l.soon}</span> : null}
                </span>
              </span>
            </>
          );
          const base = 'relative flex shrink-0 items-center gap-1.5 rounded-xl px-2 py-1.5 sm:gap-2 sm:px-2.5';
          return (
            <li key={key} className="flex shrink-0">
              {isActive ? (
                <span aria-current="page" className={`${base} bg-emerald-50/70 ring-1 ring-emerald-200`}>
                  {inner}
                </span>
              ) : ready ? (
                <Link href={href} className={`${base} opacity-70 transition hover:bg-slate-100 hover:opacity-100`}>
                  {inner}
                </Link>
              ) : (
                <span aria-disabled="true" title={l.soon} className={`${base} cursor-default opacity-40`}>
                  {inner}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
