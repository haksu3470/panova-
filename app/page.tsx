'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Globe2, Sprout, HardHat, Building2, Languages, CheckCircle2, Lock, Send, User } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function HomePage() {
  const [currentLang, setCurrentLang] = useState<Language>('tr');
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
  const isRtl = currentLang === 'ar';
  
  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

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
      alert('Error submitting form: ' + error.message);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 font-sans ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <img 
              src="/logo.png" 
              alt="PANOVA Group" 
              className="h-10 w-auto object-contain"
            />
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-none">PANOVA</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{company.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Multi-Language Selector */}
            <div className="relative flex items-center bg-slate-100 rounded-lg px-2.5 py-1.5 border border-slate-200 shadow-sm">
              <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
              <select
                value={currentLang}
                onChange={(e) => setCurrentLang(e.target.value as Language)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value={currentLang} className="font-bold">
                  {activeLangObj?.flag} {activeLangObj?.name}
                </option>
                {selectableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-slate-900">{lang.flag} {lang.name}</option>
                ))}
              </select>
            </div>

            {/* Şirket Seçimine Göre Dinamik Butonlar */}
            {selectedCompanyKey === 'hr' ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/candidate"
                  className="inline-flex items-center gap-1.5 bg-emerald-100 text-[#2e7d32] px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-emerald-200 transition border border-emerald-200 z-10 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" /> Aday Portalı
                </Link>

                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 bg-[#2e7d32] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#1b5e20] transition shadow-md z-10 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" /> {t.candidateRegister}
                </Link>

                <Link
                  href="/employer"
                  className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 transition border border-slate-200 z-10 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" /> {t.employerPortal}
                </Link>
              </div>
            ) : (
              <a
                href="#contact-form"
                className="inline-flex items-center gap-1.5 bg-[#2e7d32] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#1b5e20] transition shadow-md z-10 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Kurumsal Teklif Al
              </a>
            )}

            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-sm z-10 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" /> {t.portalLogin}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <span className="text-emerald-400 font-bold text-xs uppercase tracking-widest bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800/50 inline-block mb-4">
            {company.name}
          </span>
          <h1 className="text-4xl sm:text-6xl font-black mb-6 tracking-tight leading-tight">{company.tagline}</h1>
          <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">{company.desc}</p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Company Selector Cards */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl font-extrabold text-slate-900">{t.selectedCompany}</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedCompanyKey('hr')}
                className={`p-5 rounded-2xl text-left rtl:text-right border-2 transition cursor-pointer ${selectedCompanyKey === 'hr' ? 'border-[#2e7d32] bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <Users className="w-8 h-8 text-[#2e7d32] mb-3" />
                <div className="font-bold text-slate-900 text-base">{t.companies.hr.name}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{t.companies.hr.tagline}</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCompanyKey('trade')}
                className={`p-5 rounded-2xl text-left rtl:text-right border-2 transition cursor-pointer ${selectedCompanyKey === 'trade' ? 'border-[#2e7d32] bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <Globe2 className="w-8 h-8 text-blue-600 mb-3" />
                <div className="font-bold text-slate-900 text-base">{t.companies.trade.name}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{t.companies.trade.tagline}</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCompanyKey('agriculture')}
                className={`p-5 rounded-2xl text-left rtl:text-right border-2 transition cursor-pointer ${selectedCompanyKey === 'agriculture' ? 'border-[#2e7d32] bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <Sprout className="w-8 h-8 text-amber-600 mb-3" />
                <div className="font-bold text-slate-900 text-base">{t.companies.agriculture.name}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{t.companies.agriculture.tagline}</div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCompanyKey('construction')}
                className={`p-5 rounded-2xl text-left rtl:text-right border-2 transition cursor-pointer ${selectedCompanyKey === 'construction' ? 'border-[#2e7d32] bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <HardHat className="w-8 h-8 text-orange-600 mb-3" />
                <div className="font-bold text-slate-900 text-base">{t.companies.construction.name}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2">{t.companies.construction.tagline}</div>
              </button>
            </div>

            {/* Scope Box */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mt-8">
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">{company.name}</h3>
              <p className="text-slate-600 text-sm mb-6">{company.desc}</p>

              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t.scopeTitle}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {company.services.map((srv: string, idx: number) => (
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
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl sticky top-28">
              <h3 className="text-2xl font-extrabold text-slate-900 mb-1">{t.formTitle}</h3>
              <p className="text-slate-500 text-xs mb-6">{company.name} ile doğrudan iletişime geçin.</p>

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
    </div>
  );
}