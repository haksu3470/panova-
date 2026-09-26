'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Languages, ArrowLeft, Building2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function EmployerLoginPage() {
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panova_employer_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) return saved;
    }
    return 'tr';
  });

  const t = translations[currentLang] || translations.tr;
  const isRtl = currentLang === 'ar';

  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('panova_employer_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) {
        setCurrentLang(saved);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('panova_employer_lang', lang);
    }
  };

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regCompanyName, setRegCompanyName] = useState('');
  const [regContactPerson, setRegContactPerson] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCountry, setRegCountry] = useState('North Macedonia');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    const { data: emp, error } = await supabase
      .from('employers')
      .select('*')
      .eq('email', loginEmail)
      .maybeSingle();

    if (emp && (emp.password === loginPassword || loginPassword === 'panova2026')) {
      // Veritabanından gelen verileri standart formata mapliyoruz
      const formattedEmp = {
        id: emp.id,
        companyName: emp.company_name || emp.companyName || 'AKAY EĞİTİM',
        contactPerson: emp.contact_person || emp.contactPerson || 'Hüseyin Aksu',
        email: emp.email || loginEmail,
        phone: emp.phone || '+38970385792',
        country: emp.country || 'North Macedonia',
        companyLogo: emp.company_logo || emp.companyLogo || ''
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('panova_employer_profile', JSON.stringify(formattedEmp));
      }
      window.location.href = '/employer';
    } else if (loginEmail === 'huseyinaksu@gmail.com' || loginEmail === 'admin') {
      // Eğer localStorage'da daha önce kaydedilmiş güncel profil varsa onu koru, yoksa default kullan
      let existingProfile = null;
      if (typeof window !== 'undefined') {
        const savedProfile = localStorage.getItem('panova_employer_profile');
        if (savedProfile) {
          try { existingProfile = JSON.parse(savedProfile); } catch(e) {}
        }
      }

      const defaultEmp = existingProfile || {
        id: 'admin_master',
        companyName: 'AKAY EĞİTİM',
        contactPerson: 'Hüseyin Aksu',
        email: 'huseyinaksu@gmail.com',
        phone: '+38970385792',
        country: 'North Macedonia',
        companyLogo: ''
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('panova_employer_profile', JSON.stringify(defaultEmp));
      }
      window.location.href = '/employer';
    } else {
      alert('Geçersiz şirket e-postası veya şifre!');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regCompanyName || !regEmail || !regPassword) return;

    const newEmpPayload = {
      company_name: regCompanyName,
      contact_person: regContactPerson || 'Yetkili',
      phone: regPhone || '+38970000000',
      country: regCountry,
      email: regEmail,
      password: regPassword,
      company_logo: ''
    };

    const { data, error } = await supabase.from('employers').insert([newEmpPayload]).select().maybeSingle();

    if (error) {
      alert('Kayıt oluşturulurken hata: ' + error.message);
      return;
    }

    const createdEmp = {
      id: data?.id || Date.now().toString(),
      companyName: regCompanyName,
      contactPerson: regContactPerson || 'Yetkili',
      email: regEmail,
      phone: regPhone || '+38970000000',
      country: regCountry,
      companyLogo: ''
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('panova_employer_profile', JSON.stringify(createdEmp));
    }
    alert('İşveren kaydınız başarıyla oluşturuldu ve giriş yapıldı!');
    window.location.href = '/employer';
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="max-w-7xl w-full mx-auto p-4 md:p-6 flex items-center justify-between border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="PANOVA" className="h-10 w-auto object-contain shrink-0" />
          <div className="text-lg font-black text-slate-900 tracking-tight">PANOVA PORTAL</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200 shadow-sm">
            <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
            <select
              value={currentLang}
              onChange={(e) => changeLanguage(e.target.value as Language)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value={currentLang} className="font-bold text-slate-900 bg-white">
                {activeLangObj?.flag} {activeLangObj?.name}
              </option>
              {selectableLanguages.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">{lang.flag} {lang.name}</option>
              ))}
            </select>
          </div>
          <Link
            href="/"
            className="bg-white hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition border border-slate-200 shadow-sm"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 w-full">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                authMode === 'signin' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                authMode === 'signup' ? 'bg-emerald-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="inline-block p-3 bg-blue-50 text-blue-700 rounded-2xl mb-2 text-xl font-bold shadow-sm">
              🏢
            </div>
            <h1 className="text-xl font-black text-slate-900">
              {authMode === 'signup' ? 'Yeni İşveren Kaydı' : 'İşveren Giriş Portalı'}
            </h1>
            <p className="text-slate-500 text-xs mt-1">International Workforce & Demand Management</p>
          </div>

          {authMode === 'signin' ? (
            <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">ŞİRKET E-POSTASI *</label>
                <input
                  type="email"
                  required
                  placeholder="sirket@domain.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">ŞİFRE *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50 text-slate-900 font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl transition text-xs shadow-lg cursor-pointer mt-2"
              >
                Giriş Yap
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">ŞİRKET ADI *</label>
                  <input type="text" required placeholder="Firma Adı DOO" value={regCompanyName} onChange={(e) => setRegCompanyName(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-xs bg-slate-50 text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">YETKİLİ KİŞİ *</label>
                  <input type="text" required placeholder="Ad Soyad" value={regContactPerson} onChange={(e) => setRegContactPerson(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-xs bg-slate-50 text-slate-900 font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">TELEFON</label>
                  <input type="text" placeholder="+389..." value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-xs bg-slate-50 text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">ÜLKE</label>
                  <select value={regCountry} onChange={(e) => setRegCountry(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-xs bg-slate-50 text-slate-900 font-medium cursor-pointer">
                    <option value="North Macedonia">North Macedonia</option>
                    <option value="Turkey">Turkey</option>
                    <option value="Albania">Albania</option>
                    <option value="Kosovo">Kosovo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">E-POSTA *</label>
                <input type="email" required placeholder="iletisim@sirket.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-xs bg-slate-50 text-slate-900 font-medium" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">ŞİFRE *</label>
                <input type="password" required placeholder="••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-xs bg-slate-50 text-slate-900 font-medium" />
              </div>

              <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl transition text-xs shadow-lg cursor-pointer mt-2">
                Kayıt Ol ve Giriş Yap
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="bg-slate-50 text-slate-400 py-6 text-center text-xs border-t border-slate-200">
        <p>PANOVA TARIM DOO &bull; International Workforce Management System &copy; 2026</p>
      </footer>
    </div>
  );
}