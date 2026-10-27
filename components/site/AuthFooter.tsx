'use client';

import { company } from '@/lib/company';
import type { Language } from '@/lib/dictionary';
import { homeCopy } from '@/lib/home-copy';
import { useSiteLanguage } from '@/lib/site-language';

export function AuthFooter({
  tone = 'light',
  lang,
}: {
  tone?: 'light' | 'slate' | 'dark';
  lang?: Language;
}) {
  const { currentLang: storedLang } = useSiteLanguage(lang ?? 'tr');
  const currentLang = lang ?? storedLang;
  const a = homeCopy[currentLang].about;
  const cls =
    tone === 'dark'
      ? 'bg-slate-800 text-slate-400 py-6 text-center text-xs border-t border-slate-700'
      : tone === 'slate'
        ? 'bg-slate-50 text-slate-500 py-6 text-center text-xs border-t border-slate-200'
        : 'w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white';

  const presence = company.presence
    .map((place, i) => `${a.countries[i]} (${place.city})`)
    .join(' · ');

  return (
    <footer className={cls}>
      <p className="font-semibold">{company.brandName}</p>
      <p className="mt-1">{presence}</p>
      <p className="mt-1">{company.address}</p>
      <p className="mt-1">
        <a className="hover:underline" href={`mailto:${company.email}`}>{company.email}</a>
      </p>
      <p className="mt-1">
        {company.phones.map((p, i) => (
          <span key={p.tel}>
            {i > 0 ? ' · ' : null}
            <a className="hover:underline" href={`tel:${p.tel}`}>{p.display}</a>
          </span>
        ))}
      </p>
      <p className="mt-2 font-semibold">{a.turkeyOffice}</p>
      <p className="mt-1">{company.turkey.addressLines.join(' · ')}</p>
      <p className="mt-1">
        <a className="hover:underline" href={`mailto:${company.turkey.email}`}>{company.turkey.email}</a>
        {' · '}
        <a className="hover:underline" href={`tel:${company.turkey.phone.tel}`}>{company.turkey.phone.display}</a>
      </p>
      <p className="mt-1">{a.siteTaxOffice} · {a.vkn} {company.turkey.vkn}</p>
      <p className="mt-2 font-semibold">{a.bangladeshOffice}</p>
      <p className="mt-1">{company.bangladesh.addressLines.join(' · ')}</p>
      <p className="mt-1">
        <a className="hover:underline" href={`mailto:${company.bangladesh.email}`}>{company.bangladesh.email}</a>
        {' · '}
        <a className="hover:underline" href={`tel:${company.bangladesh.phone.tel}`}>{company.bangladesh.phone.display}</a>
      </p>
    </footer>
  );
}
