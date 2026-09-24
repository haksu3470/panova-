'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Building2, ArrowLeft, Languages, Lock, Mail, User, Phone } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function EmployerLoginPage() {
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panova_portal_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) return saved;
    }
    return 'en';
  });

  const [isLoginTab, setIsLoginTab] = useState(true);

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Register State
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regContactPerson, setRegContactPerson] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCountry, setRegCountry] = useState('North Macedonia');
  const [regSector, setRegSector] = useState('Agriculture');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';
  
  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('panova_portal_lang', lang);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let currentEmployer = null;

      if (email === 'demo@panova.com' && password === 'employer2026') {
        const { data: existingEmployers } = await supabase
          .from('employers')
          .select('*')
          .eq('email', 'demo@panova.com');

        currentEmployer = existingEmployers && existingEmployers.length > 0 ? existingEmployers[0] : null;

        if (!currentEmployer) {
          const { data: newEmp, error: createErr } = await supabase
            .from('employers')
            .insert([
              {
                company_name: 'PANOVA Construction Partners DOO',
                contact_person: 'Aleksandar Petrov',
                email: 'demo@panova.com',
                phone: '+389 70 123 456',
                country: 'North Macedonia',
                password: 'employer2026'
              }
            ])
            .select()
            .single();

          if (createErr) throw createErr;
          currentEmployer = newEmp;
        }
      } else {
        const { data, error } = await supabase
          .from('employers')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .single();

        if (error || !data) {
          alert('Geçersiz e-posta veya şifre! (Demo: demo@panova.com / employer2026)');
          setLoading(false);
          return;
        }
        currentEmployer = data;
      }

      if (currentEmployer) {
        localStorage.setItem('panova_employer_auth', 'true');
        localStorage.setItem('panova_employer_data', JSON.stringify(currentEmployer));
        router.push('/employer');
      }
    } catch (err: any) {
      alert('Giriş Hatası: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);

    const { error } = await supabase.from('employers').insert([
      {
        company_name: regCompanyName,
        contact_person: regContactPerson,
        email: regEmail,
        phone: regPhone,
        country: regCountry,
        sector: regSector,
        password: regPassword,
        status: 'active'
      }
    ]);

    setRegLoading(false);

    if (!error) {
      alert('İşveren kaydınız başarıyla oluşturuldu! Lütfen giriş yapın.');
      setIsLoginTab(true);
      setEmail(regEmail);
      setPassword(regPassword);
    } else {
      alert('Kayıt Hatası: ' + error.message);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center bg-slate-800 rounded-xl px-3 py-2 border border-slate-700 shadow-sm">
        <Languages className="w-4 h-4 text-slate-300 mr-2 rtl:ml-2" />
        <select
          value={currentLang}
          onChange={(e) => changeLanguage(e.target.value as Language)}
          className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
        >
          <option value={currentLang} className="font-bold">
            {activeLangObj?.flag} {activeLangObj?.name}
          </option>
          {selectableLanguages.map((lang) => (
            <option key={lang.code} value={lang.code} className="text-slate-900">{lang.flag} {lang.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6">
        
        {/* Üst Sekmeler (Giriş Yap / Kayıt Ol) */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-2xl font-bold text-xs">
          <button
            type="button"
            onClick={() => setIsLoginTab(true)}
            className={`py-2.5 rounded-xl transition cursor-pointer ${isLoginTab ? 'bg-[#2e7d32] text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => setIsLoginTab(false)}
            className={`py-2.5 rounded-xl transition cursor-pointer ${!isLoginTab ? 'bg-[#2e7d32] text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Kayıt Ol
          </button>
        </div>

        <div className="w-12 h-12 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto">
          <Building2 className="w-6 h-6" />
        </div>

        {isLoginTab ? (
          <div className="space-y-4">
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">İşveren Giriş Portalı</h1>
              <p className="text-slate-500 text-xs mt-1">E-posta ve şifreniz ile giriş yapın.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3 text-left rtl:text-right text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">E-Posta *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium outline-none"
                  placeholder="demo@panova.com"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Şifre *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium outline-none"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-md mt-2 text-xs cursor-pointer"
              >
                {loading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}
              </button>
            </form>

            <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border">
              Demo Giriş: <strong>demo@panova.com</strong> / <strong>employer2026</strong>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">İşveren Kayıt Formu</h1>
              <p className="text-slate-500 text-xs mt-1">Personel talebi oluşturmak için şirketinizi kaydedin.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3 text-left rtl:text-right text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Şirket Unvanı *</label>
                <input type="text" required value={regCompanyName} onChange={(e) => setRegCompanyName(e.target.value)} placeholder="Panova Tarim DOO" className="w-full px-3 py-2.5 rounded-xl border outline-none bg-white font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Yetkili *</label>
                  <input type="text" required value={regContactPerson} onChange={(e) => setRegContactPerson(e.target.value)} placeholder="Ad Soyad" className="w-full px-3 py-2.5 rounded-xl border outline-none bg-white font-medium" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Telefon *</label>
                  <input type="tel" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+389..." className="w-full px-3 py-2.5 rounded-xl border outline-none bg-white font-medium" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Kurumsal E-Posta *</label>
                <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="info@panova.com" className="w-full px-3 py-2.5 rounded-xl border outline-none bg-white font-medium" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Şifre Belirle *</label>
                <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2.5 rounded-xl border outline-none bg-white font-medium" />
              </div>
              <button
                type="submit"
                disabled={regLoading}
                className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-md mt-2 text-xs cursor-pointer"
              >
                {regLoading ? 'Kayıt Yapılıyor...' : 'İşveren Kaydını Tamamla'}
              </button>
            </form>
          </div>
        )}

        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:underline pt-2 border-t">
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  );
}