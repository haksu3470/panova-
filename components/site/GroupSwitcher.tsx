'use client';

import Link from 'next/link';
import { Users, Sprout, HardHat, Globe2, HeartHandshake, type LucideIcon } from 'lucide-react';
import type { Language } from '@/lib/dictionary';

/**
 * Panova Group üst bandı: tek logo + birim sekmeleri.
 * Seçili birim ikon + adıyla açık görünür; diğerleri yalnız ikon.
 * Hazır olmayan birimler kesikli çerçeveli ve soluk ("yakında").
 */
export type GroupUnit = 'hr' | 'agri' | 'construction' | 'trade' | 'social';

const UNITS: { key: GroupUnit; href: string | null; Icon: LucideIcon }[] = [
  { key: 'hr', href: '/', Icon: Users },
  { key: 'agri', href: '/tarim', Icon: Sprout },
  { key: 'construction', href: null, Icon: HardHat },
  { key: 'trade', href: null, Icon: Globe2 },
  { key: 'social', href: null, Icon: HeartHandshake },
];

const LABELS: Record<'tr' | 'en' | 'mk', Record<GroupUnit, string> & { soon: string; nav: string; home: string }> = {
  tr: { hr: 'İnsan Kaynakları', agri: 'Tarım ve Hayvancılık', construction: 'İnşaat', trade: 'Trade', social: 'Sosyal Projeler', soon: 'yakında', nav: 'Panova Group birimleri', home: 'Ana sayfa' },
  en: { hr: 'Human Resources', agri: 'Agriculture & Livestock', construction: 'Construction', trade: 'Trade', social: 'Social Projects', soon: 'soon', nav: 'Panova Group units', home: 'Home' },
  mk: { hr: 'Човечки ресурси', agri: 'Земјоделство и сточарство', construction: 'Градежништво', trade: 'Трговија', social: 'Социјални проекти', soon: 'наскоро', nav: 'Единици на Panova Group', home: 'Почетна' },
};

export function GroupSwitcher({ active, lang }: { active: GroupUnit; lang: Language }) {
  const l = lang === 'tr' || lang === 'mk' ? LABELS[lang] : LABELS.en;
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
      <Link href="/" title={l.home} className="flex shrink-0 items-center gap-2 hover:opacity-90">
        <img src="/logo.png" alt="PANOVA" width={1051} height={725} className="h-9 w-auto object-contain sm:h-12" />
        <span className="hidden text-lg font-extrabold tracking-tight text-slate-900 sm:block sm:text-xl">PANOVA</span>
      </Link>
      <nav aria-label={l.nav} className="min-w-0">
        <ul className="flex items-center gap-1 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-1.5">
          {UNITS.map(({ key, href, Icon }) => {
            const isActive = key === active;
            const name = l[key];
            if (isActive) {
              return (
                <li key={key} className="shrink-0">
                  <span aria-current="page" className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 text-sm font-bold text-emerald-900 ring-1 ring-emerald-200 sm:h-10">
                    <Icon aria-hidden className="h-4 w-4 text-brand" />
                    <span className="whitespace-nowrap">
                      <span className="hidden sm:inline">{name}</span>
                      <span className="sm:hidden">{key === 'hr' ? 'HR' : key === 'agri' ? name.split(/ (ve|&|и) /)[0] : name}</span>
                    </span>
                  </span>
                </li>
              );
            }
            const box = 'grid h-9 w-9 place-items-center rounded-xl sm:h-10 sm:w-10';
            return (
              <li key={key} className="shrink-0">
                {href ? (
                  <Link href={href} title={name} aria-label={name} className={`${box} border border-slate-200 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900`}>
                    <Icon aria-hidden className="h-[18px] w-[18px]" />
                  </Link>
                ) : (
                  <span aria-disabled="true" title={`${name} · ${l.soon}`} aria-label={`${name} · ${l.soon}`} className={`${box} cursor-default border border-dashed border-slate-300 text-slate-400`}>
                    <Icon aria-hidden className="h-[18px] w-[18px]" />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
