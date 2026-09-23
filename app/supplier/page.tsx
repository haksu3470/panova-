'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CheckCircle2, UserPlus, Send, Building, Languages } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function SupplierCandidateRegister() {
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panova_portal_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) return saved;
    }
    return 'tr';
  });

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('panova_portal_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) {
        setCurrentLang(saved);
      }
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(handleStorage, 150);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('panova_portal_lang', lang);
    }
  };

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supplierName, setSupplierName] = useState('');

  const t = translations[currentLang] || translations.tr;
  const isRtl = currentLang === 'ar';
  
  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

  const [formData, setFormData] = useState({
    fullName: '',
    passportNumber: '',
    phone: '',
    email: '',
    profession: 'Electrician / Elektrikçi',
    sector: 'construction',
    expectedSalary: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('job_candidates').insert([
      {
        full_name: formData.fullName,
        passport_number: formData.passportNumber,
        phone: formData.phone,
        email: formData.email,
        profession: formData.profession,
        sector: formData.sector,
        expected_salary: parseFloat(formData.expectedSalary) || null,
        status: 'pending',
        notes: `Tedarikçi Partner Tarafından Kaydedildi: ${supplierName || 'Yetkili Tedarikçi'}`,
      },
    ]);

    setLoading(false);
    if (!error) setSubmitted(true);
    else alert('Hata: ' + error.message);
  };

  return (
    <div className={`min-h-screen bg-slate-900 text-slate-100 py-6 sm:py-12 px-3 sm:px-6 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Üst Bar */}
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
          </Link>

          <div className="flex items-center bg-slate-800 rounded-xl px-2.5 py-1.5 border border-slate-700 shadow-sm">
            <Languages className="w-4 h-4 text-slate-300 mr-1.5 rtl:ml-1.5" />
            <select
              value={currentLang}
              onChange={(e) => changeLanguage(e.target.value as Language)}
              className="bg-transparent text-xs sm:text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value={currentLang} className="text-slate-900 font-bold">
                {activeLangObj?.flag} {activeLangObj?.name}
              </option>
              {selectableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-slate-900">{lang.flag} {lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-slate-800 p-4 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-white">Yetkili Tedarikçi Aday Kayıt Paneli</h1>
              <p className="text-slate-400 text-xs mt-0.5">Partner ve tedarikçi firmalar üzerinden havuza aday ekleyin.</p>
            </div>
          </div>

          {submitted ? (
            <div className="bg-emerald-950 p-6 sm:p-8 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16 text-emerald-400 mx-auto" />
              <h2 className="text-base sm:text-lg font-bold text-white">Aday Başarıyla Tedarikçi Havuzuna Eklendi!</h2>
              <button onClick={() => setSubmitted(false)} className="bg-[#2e7d32] text-white px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition hover:bg-[#1b5e20]">Yeni Aday Kaydet</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Tedarikçi / Partner Firma Adınız *</label>
                <input type="text" required value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Örn: Balkan Global İK" className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm outline-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Aday Ad Soyad *</label>
                  <input type="text" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Pasaport No</label>
                  <input type="text" value={formData.passportNumber} onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">GSM (Telefon) *</label>
                  <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+389..." className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">E-Posta *</label>
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm outline-none" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 sm:py-4 rounded-xl font-bold transition text-xs sm:text-sm cursor-pointer mt-4 shadow-lg">
                {loading ? 'Kaydediliyor...' : 'Tedarikçi Adayını Sisteme Kaydet'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}