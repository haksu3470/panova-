'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Globe2, Sprout, HardHat, Building2, CheckCircle2, Lock, Send, User, LogIn } from 'lucide-react';
import Link from 'next/link';
import { StatsBar, AudienceSections, TrustSections, CompanyAbout, SiteFooter } from '@/components/home/HomeSections';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import { translations } from '@/lib/dictionary';
import { fill, homeCopy } from '@/lib/home-copy';
import { useSiteLanguage } from '@/lib/site-language';
import { company as registry } from '@/lib/company';

export default function HomePage() {
  const { currentLang, changeLanguage, isRtl } = useSiteLanguage('tr');

  const [selectedCompanyKey, setSelectedCompanyKey] = useState<'hr' | 'trade' | 'agriculture' | 'construction'>('hr');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    notes: '',
  });

  const t = translations[currentLang] || translations.tr;
  const company = t.companies[selectedCompanyKey];
  const h = homeCopy[currentLang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('contact_submissions').insert([
      {
        company_key: selectedCompanyKey,
        company_name: company.name,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes,
      },
    ]);

    setLoading(false);

    if (!error) {
      setSubmitted(true);
    } else {
      console.error('contact form submit failed', error);
      alert(t.formSubmitError || 'Mesajınız gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 font-sans ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Navbar (Mobil Uyumlu Esnek Yapı) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-auto sm:h-20 py-3 sm:py-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center space-x-3 rtl:space-x-reverse min-w-0">
              <img
                src="/logo.png"
                alt="PANOVA"
                width={1051}
                height={725}
                className="h-12 sm:h-14 w-auto object-contain shrink-0"
              />
              <div className="min-w-0">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 block leading-none">PANOVA</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[140px] sm:max-w-none block">{company.name}</span>
              </div>
            </div>
            <div className="sm:hidden">
              <LanguageSwitcher currentLang={currentLang} onChange={changeLanguage} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="hidden sm:block">
              <LanguageSwitcher currentLang={currentLang} onChange={changeLanguage} />
            </div>

            {/* Şirket Seçimine Göre Dinamik Butonlar */}
            {selectedCompanyKey === 'hr' ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/candidate"
                  className="inline-flex items-center gap-1.5 bg-[#2e7d32] text-white px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#1b5e20] transition shadow-md z-10 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" /> {t.candidatePortalBtn || 'Aday Portalı & Giriş'}
                </Link>

                <Link
                  href="/employer-login"
                  className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition border border-slate-200 z-10 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" /> {t.employerPortal}
                </Link>
              </div>
            ) : (
              <a
                href="#contact-form"
                className="inline-flex items-center gap-1.5 bg-[#2e7d32] text-white px-3.5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#1b5e20] transition shadow-md z-10 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> {h.ctaQuote}
              </a>
            )}

            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm z-10 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" /> {t.portalLogin}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-14 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(46,125,50,0.45),transparent_60%)]" />
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/50 inline-block mb-4">
            {company.name}
          </span>
          <h1 className="text-3xl sm:text-6xl font-black mb-4 sm:mb-6 tracking-tight leading-tight">{company.tagline}</h1>
          <p className="text-slate-300 text-sm sm:text-xl max-w-2xl mx-auto leading-relaxed">{company.desc}</p>
          <p className="text-emerald-200 text-xs sm:text-sm mt-4 font-semibold">
            {registry.presence.map((place, i) => `${h.about.countries[i]} (${place.city})`).join(' · ')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
            <Link href="/employer-login" className="inline-flex justify-center items-center gap-2 bg-[#2e7d32] hover:bg-[#1b5e20] px-6 py-3.5 rounded-xl font-bold text-sm">
              <Building2 className="w-4 h-4" /> {h.ctaHire}
            </Link>
            <Link href="/candidate" className="inline-flex justify-center items-center gap-2 bg-white text-slate-900 hover:bg-slate-100 px-6 py-3.5 rounded-xl font-bold text-sm">
              <User className="w-4 h-4" /> {h.ctaJob}
            </Link>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-8 text-xs sm:text-sm text-slate-300 font-semibold">
            <a href="#isverenler" className="hover:text-white">{h.nav.employers}</a>
            <a href="#adaylar" className="hover:text-white">{h.nav.candidates}</a>
            <a href="#sektorler" className="hover:text-white">{h.nav.sectors}</a>
            <a href="#nasil-calisir" className="hover:text-white">{h.nav.how}</a>
            <a href="#grup" className="hover:text-white">{h.nav.group}</a>
            <a href="#kurumsal" className="hover:text-white">{h.nav.about}</a>
            <a href="#sss" className="hover:text-white">{h.nav.faq}</a>
          </nav>
        </div>
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
                <Users className="w-8 h-8 text-[#2e7d32] mb-3" />
                <div className="font-bold text-slate-900 text-base">{t.companies.hr.name}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{t.companies.hr.tagline}</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCompanyKey('trade')}
                className={`p-5 rounded-2xl text-left rtl:text-right border-2 transition cursor-pointer ${selectedCompanyKey === 'trade' ? 'border-[#2e7d32] bg-emerald-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <Globe2 className="w-8 h-8 text-blue-600 mb-3" />
                <div className="font-bold text-slate-900 text-base">{t.companies.trade.name}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{t.companies.trade.tagline}</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCompanyKey('agriculture')}
                className={`p-5 rounded-2xl text-left rtl:text-right border-2 transition cursor-pointer ${selectedCompanyKey === 'agriculture' ? 'border-[#2e7d32] bg-emerald-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <Sprout className="w-8 h-8 text-amber-600 mb-3" />
                <div className="font-bold text-slate-900 text-base">{t.companies.agriculture.name}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{t.companies.agriculture.tagline}</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCompanyKey('construction')}
                className={`p-5 rounded-2xl text-left rtl:text-right border-2 transition cursor-pointer ${selectedCompanyKey === 'construction' ? 'border-[#2e7d32] bg-emerald-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <HardHat className="w-8 h-8 text-orange-600 mb-3" />
                <div className="font-bold text-slate-900 text-base">{t.companies.construction.name}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{t.companies.construction.tagline}</div>
              </button>
            </div>

            {/* Scope Box */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm mt-8">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mb-2">{company.name}</h3>
              <p className="text-slate-600 text-xs sm:text-sm mb-6">{company.desc}</p>

              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t.scopeTitle}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {company.services?.map((srv: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-[#2e7d32] flex-shrink-0" />
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
                    <a className="font-semibold text-[#1b5e20]" href={`mailto:${registry.email}`}>{registry.email}</a>
                  </p>
                  {registry.phones.map((p) => (
                    <p key={p.tel}>
                      <a className="font-semibold text-[#1b5e20]" href={`tel:${p.tel}`}>{p.display}</a>
                    </p>
                  ))}
                </div>
                <div className="space-y-1.5 border-t border-slate-200 pt-3">
                  <p className="font-extrabold text-slate-900">{h.about.turkeyOffice} · {registry.turkey.city}</p>
                  {registry.turkey.addressLines.map((line) => <p key={line}>{line}</p>)}
                  <p>
                    <a className="font-semibold text-[#1b5e20]" href={`mailto:${registry.turkey.email}`}>{registry.turkey.email}</a>
                  </p>
                  <p>
                    <a className="font-semibold text-[#1b5e20]" href={`tel:${registry.turkey.phone.tel}`}>{registry.turkey.phone.display}</a>
                  </p>
                  <p className="text-xs text-slate-500">{h.about.siteTaxOffice} · {h.about.vkn} {registry.turkey.vkn}</p>
                </div>
                <div className="space-y-1.5 border-t border-slate-200 pt-3">
                  <p className="font-extrabold text-slate-900">{h.about.bangladeshOffice} · {registry.bangladesh.city}</p>
                  {registry.bangladesh.addressLines.map((line) => <p key={line}>{line}</p>)}
                  <p>
                    <a className="font-semibold text-[#1b5e20]" href={`mailto:${registry.bangladesh.email}`}>{registry.bangladesh.email}</a>
                  </p>
                  <p>
                    <a className="font-semibold text-[#1b5e20]" href={`tel:${registry.bangladesh.phone.tel}`}>{registry.bangladesh.phone.display}</a>
                  </p>
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-1">{t.formTitle}</h3>
              <p className="text-slate-500 text-xs mb-6">{fill(h.contactDirect, { name: company.name })}</p>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center">
                  <CheckCircle2 className="w-12 h-12 text-[#2e7d32] mx-auto mb-3" />
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 text-sm cursor-pointer"
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