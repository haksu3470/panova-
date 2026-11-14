'use client';

import { useRef, useState } from 'react';
import { Users, Globe2, Sprout, HardHat, Building2, CheckCircle2, Send, User } from 'lucide-react';
import Link from 'next/link';
import { StatsBar, AudienceSections, TrustSections, CompanyAbout, SiteFooter } from '@/components/home/HomeSections';
import { HeroVisual } from '@/components/home/HeroVisual';
import { LoginMenu } from '@/components/home/LoginMenu';
import { useHomeMotion } from '@/components/home/HomeMotion';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import { translations } from '@/lib/dictionary';
import { EUROPEAN_COUNTRIES } from '@/lib/europeanCountries';
import { fill, homeCopy } from '@/lib/home-copy';
import { homeExtraCopy } from '@/lib/home-extra-copy';
import { useSiteLanguage } from '@/lib/site-language';
import { company as registry } from '@/lib/company';
import KvkkConsent from '@/components/site/KvkkConsent';
import { releaseCopy } from '@/lib/release-copy';

export default function HomePage() {
  const { currentLang, changeLanguage, isRtl } = useSiteLanguage('tr');

  const [selectedCompanyKey, setSelectedCompanyKey] = useState<'hr' | 'trade' | 'agriculture' | 'construction'>('hr');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    notes: '',
  });

  const t = translations[currentLang] || translations.tr;
  const company = t.companies[selectedCompanyKey];
  const h = homeCopy[currentLang];
  const x = homeExtraCopy[currentLang];
  const albania = EUROPEAN_COUNTRIES.find((country) => country.code === 'AL')?.names[currentLang] ?? 'Albania';
  const rootRef = useRef<HTMLDivElement>(null);
  useHomeMotion(rootRef, [currentLang, selectedCompanyKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kvkkAccepted) {
      alert(releaseCopy[currentLang].kvkkRequired);
      return;
    }
    setLoading(true);

    let ok = false;
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyKey: selectedCompanyKey,
          companyName: company.name,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes,
          locale: currentLang,
          kvkkAccepted: true,
        }),
      });
      ok = response.ok;
      if (!ok) console.error('contact form submit failed', response.status);
    } catch (error) {
      console.error('contact form submit failed', error instanceof Error ? error.name : 'error');
    }

    setLoading(false);
    if (ok) setSubmitted(true);
    else alert(t.formSubmitError || 'Mesajınız gönderilemedi. Lütfen tekrar deneyin.');
  };

  return (
    <div ref={rootRef} className={`min-h-screen bg-slate-50 text-slate-900 font-sans ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top bar: logo, one language switcher, one sign-in menu */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo.png"
              alt="PANOVA"
              width={1051}
              height={725}
              className="h-10 sm:h-14 w-auto object-contain shrink-0"
            />
            <div className="min-w-0">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 block leading-none">PANOVA</span>
              <span className="hidden sm:block text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{company.name}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
            <LanguageSwitcher currentLang={currentLang} onChange={changeLanguage} />
            {selectedCompanyKey !== 'hr' ? (
              <a
                href="#contact-form"
                className="hidden sm:inline-flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm cursor-pointer"
              >
                <Send aria-hidden className="w-3.5 h-3.5" /> {h.ctaQuote}
              </a>
            ) : null}
            <LoginMenu labels={x.login} />
          </div>
        </div>
      </header>

      {/* Hero: soft brand gradient, text and the three-country drawing */}
      <section className="bg-slate-900 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 text-white py-12 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(46,125,50,0.4),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(124,179,66,0.16),transparent_55%)]" />
        <div className="max-w-7xl mx-auto relative z-10 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="text-center lg:text-start">
            <span className="text-emerald-300 font-bold text-xs uppercase tracking-widest bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800 inline-block mb-4">
              {company.name}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black mb-4 sm:mb-6 tracking-tight leading-tight">{company.tagline}</h1>
            <p className="text-on-dark-muted text-sm sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed">{company.desc}</p>
            <p className="text-emerald-200 text-xs sm:text-sm mt-4 font-semibold">
              {registry.presence.map((place, i) => `${h.about.countries[i]} (${place.city})`).join(' · ')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 mt-8">
              <Link href="/employer-login" className="inline-flex justify-center items-center gap-2 bg-brand-solid hover:bg-brand px-6 py-3.5 rounded-xl font-bold text-sm text-on-dark">
                <Building2 aria-hidden className="w-4 h-4" /> {h.ctaHire}
              </Link>
              <Link href="/candidate" className="inline-flex justify-center items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-6 py-3.5 rounded-xl font-bold text-sm">
                <User aria-hidden className="w-4 h-4" /> {h.ctaJob}
              </Link>
            </div>
          </div>
          <HeroVisual
            countries={[albania, h.about.countries[2], h.about.countries[1]]}
            mapLabel={x.hero.mapLabel}
            flowTitle={x.hero.flowTitle}
            flow={x.hero.flow}
          />
        </div>
        {/* Section links: one scrolling row on phones, wrapped from sm */}
        <nav aria-label={x.sectionsNav} className="max-w-7xl mx-auto relative z-10 mt-10">
          <ul className="flex flex-nowrap sm:flex-wrap sm:justify-center gap-x-5 gap-y-2 overflow-x-auto pb-2 text-xs sm:text-sm text-on-dark-muted font-semibold whitespace-nowrap">
            <li><a href="#isverenler" className="hover:text-white">{h.nav.employers}</a></li>
            <li><a href="#adaylar" className="hover:text-white">{h.nav.candidates}</a></li>
            <li><a href="#sektorler" className="hover:text-white">{h.nav.sectors}</a></li>
            <li><a href="#nasil-calisir" className="hover:text-white">{h.nav.how}</a></li>
            <li><a href="#grup" className="hover:text-white">{h.nav.group}</a></li>
            <li><a href="#guven" className="hover:text-white">{x.trustTitle}</a></li>
            <li><a href="#kurumsal" className="hover:text-white">{h.nav.about}</a></li>
            <li><a href="#sss" className="hover:text-white">{h.nav.faq}</a></li>
          </ul>
        </nav>
      </section>
      <StatsBar lang={currentLang} />
      <AudienceSections lang={currentLang} />

      {/* Main Content */}
      <main id="grup" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Company Selector Cards (Mobilde Tek Sütun, Tablet/Masaüstünde İki Sütun) */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{t.selectedCompany}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedCompanyKey('hr')}
                className={`p-5 rounded-2xl text-left rtl:text-right border-2 transition cursor-pointer ${selectedCompanyKey === 'hr' ? 'border-[#2e7d32] bg-emerald-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <Users className="w-8 h-8 text-brand mb-3" />
                <div className="font-bold text-slate-900 text-base">{t.companies.hr.name}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.companies.hr.tagline}</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCompanyKey('trade')}
                className={`p-5 rounded-2xl text-left rtl:text-right border-2 transition cursor-pointer ${selectedCompanyKey === 'trade' ? 'border-[#2e7d32] bg-emerald-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <Globe2 className="w-8 h-8 text-blue-600 mb-3" />
                <div className="font-bold text-slate-900 text-base">{t.companies.trade.name}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.companies.trade.tagline}</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCompanyKey('agriculture')}
                className={`p-5 rounded-2xl text-left rtl:text-right border-2 transition cursor-pointer ${selectedCompanyKey === 'agriculture' ? 'border-[#2e7d32] bg-emerald-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <Sprout className="w-8 h-8 text-amber-600 mb-3" />
                <div className="font-bold text-slate-900 text-base">{t.companies.agriculture.name}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.companies.agriculture.tagline}</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCompanyKey('construction')}
                className={`p-5 rounded-2xl text-left rtl:text-right border-2 transition cursor-pointer ${selectedCompanyKey === 'construction' ? 'border-[#2e7d32] bg-emerald-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <HardHat className="w-8 h-8 text-orange-600 mb-3" />
                <div className="font-bold text-slate-900 text-base">{t.companies.construction.name}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.companies.construction.tagline}</div>
              </button>
            </div>

            {/* Scope Box */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm mt-8">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-2">{company.name}</h3>
              <p className="text-slate-600 text-xs sm:text-sm mb-6">{company.desc}</p>

              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">{t.scopeTitle}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {company.services?.map((srv: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-brand flex-shrink-0" />
                    <span>{srv}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-5" id="contact-form">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xl lg:sticky lg:top-28">
              <div className="mb-6 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 space-y-3">
                <div className="space-y-1.5">
                  <p className="font-extrabold text-slate-900">{h.about.northMacedonia} · Struga</p>
                  <p>{registry.shortName}</p>
                  <p>{registry.address}</p>
                  <p>
                    <a className="font-semibold text-brand" href={`mailto:${registry.email}`}>{registry.email}</a>
                  </p>
                  {registry.phones.map((p) => (
                    <p key={p.tel}>
                      <a className="font-semibold text-brand" href={`tel:${p.tel}`}>{p.display}</a>
                    </p>
                  ))}
                </div>
                <div className="space-y-1.5 border-t border-slate-200 pt-3">
                  <p className="font-extrabold text-slate-900">{h.about.turkeyOffice} · {registry.turkey.city}</p>
                  {registry.turkey.addressLines.map((line) => <p key={line}>{line}</p>)}
                  <p>
                    <a className="font-semibold text-brand" href={`mailto:${registry.turkey.email}`}>{registry.turkey.email}</a>
                  </p>
                  <p>
                    <a className="font-semibold text-brand" href={`tel:${registry.turkey.phone.tel}`}>{registry.turkey.phone.display}</a>
                  </p>
                  <p className="text-xs text-muted-foreground">{h.about.siteTaxOffice} · {h.about.vkn} {registry.turkey.vkn}</p>
                </div>
                <div className="space-y-1.5 border-t border-slate-200 pt-3">
                  <p className="font-extrabold text-slate-900">{h.about.bangladeshOffice} · {registry.bangladesh.city}</p>
                  {registry.bangladesh.addressLines.map((line) => <p key={line}>{line}</p>)}
                  <p>
                    <a className="font-semibold text-brand" href={`mailto:${registry.bangladesh.email}`}>{registry.bangladesh.email}</a>
                  </p>
                  <p>
                    <a className="font-semibold text-brand" href={`tel:${registry.bangladesh.phone.tel}`}>{registry.bangladesh.phone.display}</a>
                  </p>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1">{t.formTitle}</h3>
              <p className="text-muted-foreground text-xs mb-6">{fill(h.contactDirect, { name: company.name })}</p>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center">
                  <CheckCircle2 className="w-12 h-12 text-brand mx-auto mb-3" />
                  <h4 className="font-extrabold text-emerald-900 text-lg mb-1">{t.successTitle}</h4>
                  <p className="text-xs text-emerald-700">{company.name} {t.successDesc}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.nameLabel}</label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.emailLabel}</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.phoneLabel}</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.notesLabel}</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                    />
                  </div>

                  <KvkkConsent id="contact-kvkk" checked={kvkkAccepted} onChange={setKvkkAccepted} copy={releaseCopy[currentLang]} />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-solid hover:bg-brand text-white py-3.5 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> {loading ? t.submitting : t.submitBtn}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </main>
      <TrustSections lang={currentLang} />
      <CompanyAbout lang={currentLang} />
      <SiteFooter lang={currentLang} />
    </div>
  );
}