'use client';

import Link from 'next/link';
import type { Language } from '@/lib/dictionary';

/**
 * Panova Group "holding şeridi": en üstte ince koyu şerit (tüm birimler, metin),
 * altında birimin kendi başlığı (logo + PANOVA + birim adı).
 * Hazır olmayan birimler soluk ve tıklanamaz ("yakında").
 */
export type GroupUnit = 'hr' | 'agri' | 'construction' | 'trade' | 'social';

const UNITS: { key: GroupUnit; href: string | null }[] = [
  { key: 'hr', href: '/' },
  { key: 'agri', href: '/tarim' },
  { key: 'construction', href: null },
  { key: 'trade', href: null },
  { key: 'social', href: null },
];

type Labels = Record<GroupUnit, string> & { short: Record<GroupUnit, string>; soon: string; nav: string; home: string };

const LABELS: Record<'tr' | 'en' | 'mk', Labels> = {
  tr: { hr: 'İnsan Kaynakları', agri: 'Tarım ve Hayvancılık', construction: 'İnşaat', trade: 'Trade', social: 'Sosyal Projeler', short: { hr: 'İK', agri: 'Tarım', construction: 'İnşaat', trade: 'Trade', social: 'Sosyal' }, soon: 'yakında', nav: 'Panova Group birimleri', home: 'Ana sayfa' },
  en: { hr: 'Human Resources', agri: 'Agriculture & Livestock', construction: 'Construction', trade: 'Trade', social: 'Social Projects', short: { hr: 'HR', agri: 'Agriculture', construction: 'Construction', trade: 'Trade', social: 'Social' }, soon: 'soon', nav: 'Panova Group units', home: 'Home' },
  mk: { hr: 'Човечки ресурси', agri: 'Земјоделство и сточарство', construction: 'Градежништво', trade: 'Трговија', social: 'Социјални проекти', short: { hr: 'ЧР', agri: 'Земјоделство', construction: 'Градежништво', trade: 'Трговија', social: 'Социјални' }, soon: 'наскоро', nav: 'Единици на Panova Group', home: 'Почетна' },
};

const labelsFor = (lang: Language) => (lang === 'tr' || lang === 'mk' ? LABELS[lang] : LABELS.en);

/** İnce koyu grup şeridi — header'ın en üstüne, tam genişlikte. */
export function GroupStrip({ active, lang }: { active: GroupUnit; lang: Language }) {
  const l = labelsFor(lang);
  return (
    <div className="bg-[#173404] text-[#C0DD97]">
      <nav aria-label={l.nav} className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <ul className="flex h-8 items-center gap-4 overflow-x-auto whitespace-nowrap text-xs [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden">
          <li className="shrink-0 font-bold tracking-[0.14em] opacity-75">PANOVA GROUP</li>
          {UNITS.map(({ key, href }) => {
            const text = (
              <>
                <span className="hidden sm:inline">{l[key]}</span>
                <span className="sm:hidden">{l.short[key]}</span>
              </>
            );
            if (key === active) {
              return (
                <li key={key} className="flex h-full shrink-0 items-center">
                  <span aria-current="page" className="flex h-full items-center border-b-2 border-[#97C459] font-semibold text-white">{text}</span>
                </li>
              );
            }
            return (
              <li key={key} className="flex h-full shrink-0 items-center">
                {href ? (
                  <Link href={href} className="flex h-full items-center border-b-2 border-transparent transition hover:text-white">{text}</Link>
                ) : (
                  <span aria-disabled="true" title={`${l[key]} · ${l.soon}`} className="cursor-default opacity-50">{text}</span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/** Birimin kendi başlığı: logo + PANOVA + birim adı. */
export function GroupBrand({ active, lang }: { active: GroupUnit; lang: Language }) {
  const l = labelsFor(lang);
  return (
    <Link href={UNITS.find((u) => u.key === active)?.href ?? '/'} title={l.home} className="flex min-w-0 items-center gap-2 hover:opacity-90 sm:gap-3">
      <img src="/logo.png" alt="PANOVA" width={1051} height={725} className="h-9 w-auto shrink-0 object-contain sm:h-12" />
      <span className="min-w-0 leading-tight">
        <span className="block text-base font-extrabold tracking-tight text-slate-900 sm:text-xl">PANOVA</span>
        <span className="block truncate text-[11px] font-semibold text-emerald-700 sm:text-xs">{l[active]}</span>
      </span>
    </Link>
  );
}
