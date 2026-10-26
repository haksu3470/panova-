'use client';

import Link from 'next/link';
import { company } from '@/lib/company';
import { SiteFooter } from '@/components/home/HomeSections';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import { fill, homeCopy } from '@/lib/home-copy';
import { useSiteLanguage } from '@/lib/site-language';

export default function KvkkView() {
  const { currentLang, changeLanguage, isRtl } = useSiteLanguage('tr');
  const k = homeCopy[currentLang].kvkk;

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link href="/" className="font-black tracking-tight text-slate-900">PANOVA</Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLang={currentLang} onChange={changeLanguage} />
            <Link href="/" className="text-sm font-semibold text-[#1b5e20]">{k.home}</Link>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-sm leading-relaxed text-slate-700">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{k.title}</h1>
          <p className="mt-3">{k.intro}</p>
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2">
          <h2 className="font-extrabold text-slate-900">{k.controller}</h2>
          <p>{company.legalName}</p>
          <p>{k.shortName}: {company.shortName} / {company.shortNameMk}</p>
          <p>{k.address}: {company.address}</p>
          <p>{k.email}: <a className="text-[#1b5e20] font-semibold" href={`mailto:${company.email}`}>{company.email}</a></p>
          <ul>
            {company.phones.map((p) => (
              <li key={p.tel}>{p.name} ({homeCopy[currentLang].about.macedonia}): <a className="text-[#1b5e20] font-semibold" href={`tel:${p.tel}`}>{p.display}</a></li>
            ))}
          </ul>
          <p>EMBS: {company.embs} · {k.taxId}: {company.taxId}</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-slate-900">{k.purposeTitle}</h2>
          <p>{k.purpose}</p>
        </section>

        <section className="space-y-2">
          <h2 className="font-extrabold text-slate-900">{k.rightsTitle}</h2>
          <p>{fill(k.rights, { email: company.email })}</p>
        </section>
      </main>
      <SiteFooter lang={currentLang} />
    </div>
  );
}
