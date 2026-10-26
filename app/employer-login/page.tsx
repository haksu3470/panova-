'use client';

import OAuthButtons from '@/components/auth/OAuthButtons';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { linkMyEmployer, signOut } from '@/lib/auth';
import EmailVerifyNotice from '@/components/auth/EmailVerifyNotice';
import {
  beginPasswordSignup,
  emailGateListenerPaused,
  gateSession,
  isEmailNotConfirmedMessage,
  pauseEmailGateListener,
  rememberVerifyEmail,
  storedVerifyEmail,
} from '@/lib/emailVerification';
import { Languages, ArrowLeft, Building2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';
import { homeCopy } from '@/lib/home-copy';
import { readStoredLanguage, syncDocumentLanguage, writeStoredLanguage } from '@/lib/site-language';
import { AuthFooter } from '@/components/site/AuthFooter';
import { EuropeanCountryOptions } from '@/components/site/EuropeanCountryOptions';

export default function EmployerLoginPage() {
  const [currentLang, setCurrentLang] = useState<Language>('tr');

  const t = translations[currentLang] || translations.tr;
  const ui = homeCopy[currentLang];
  const isRtl = currentLang === 'ar';

  useEffect(() => {
    const apply = () => {
      const next = readStoredLanguage('tr');
      setCurrentLang(next);
      syncDocumentLanguage(next);
    };
    apply();
    window.addEventListener('storage', apply);
    return () => window.removeEventListener('storage', apply);
  }, []);

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    writeStoredLanguage(lang);
  };

  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'verify'>('signin');
  const [verifyEmail, setVerifyEmail] = useState('');
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

  const loadEmployerProfile = async (employerId: string, fallbackEmail: string) => {
    const { data: emp } = await supabase.from('employers').select('*').eq('id', employerId).maybeSingle();
    const formattedEmp = {
      id: employerId,
      companyName: emp?.company_name || '',
      contactPerson: emp?.contact_person || '',
      email: emp?.email || fallbackEmail,
      phone: emp?.phone || '',
      country: emp?.country || '',
      companyLogo: emp?.logo || ''
    };
    if (typeof window !== 'undefined') {
      // Sadece görüntü önbelleği; yetki kontrolü Supabase Auth oturumu ile yapılır
      localStorage.setItem('panova_employer_profile', JSON.stringify(formattedEmp));
    }
  };

  const openEmployer = async (email: string) => {
    const employerId = await linkMyEmployer();
    if (!employerId) return false;
    await loadEmployerProfile(employerId, email);
    window.location.href = '/employer';
    return true;
  };

  const showVerify = (email: string) => {
    setVerifyEmail(email);
    setAuthMode('verify');
  };

  // Google dönüşü veya doğrulanmış oturum: işverene bağla. Şifre kaydı önce e-posta kanıtı ister.
  useEffect(() => {
    const pending = storedVerifyEmail();
    if (pending && new URLSearchParams(window.location.search).get('verify') === '1') showVerify(pending);
    let alive = true;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return;
      setTimeout(async () => {
        if (!alive || emailGateListenerPaused() || !session) return;
        const gate = await gateSession();
        if (!alive) return;
        if (gate.status === 'verify') {
          showVerify(gate.email);
          return;
        }
        if (gate.status === 'ready') await openEmployer(session.user.email || '');
      }, 0);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    const resume = pauseEmailGateListener();
    const email = loginEmail.trim().toLowerCase();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: loginPassword });
      if (error || !data.user) {
        if (isEmailNotConfirmedMessage(error?.message)) {
          rememberVerifyEmail(email, 'signup');
          showVerify(email);
          return;
        }
        alert('Geçersiz şirket e-postası veya şifre!');
        return;
      }
      const gate = await gateSession();
      if (gate.status === 'verify') {
        showVerify(gate.email || email);
        return;
      }
      const opened = await openEmployer(email);
      if (!opened) {
        await signOut();
        alert('Bu e-posta ile eşleşen bir işveren kaydı bulunamadı. Lütfen Panova ekibiyle iletişime geçin.');
      }
    } finally {
      resume();
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regCompanyName || !regEmail || !regPassword) return;
    const resume = pauseEmailGateListener();
    const email = regEmail.trim().toLowerCase();
    try {
      const result = await beginPasswordSignup({
        email,
        password: regPassword,
        redirectPath: '/employer-login',
        metadata: {
          role: 'employer',
          full_name: regContactPerson || regCompanyName,
          company_name: regCompanyName,
          contact_person: regContactPerson || 'Yetkili',
          phone: regPhone,
          country: regCountry,
        },
      });
      if (result.status === 'error') {
        alert('Kayıt oluşturulurken hata: ' + result.message);
        return;
      }
      showVerify(result.email);
    } finally {
      resume();
    }
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
            {t.returnHome}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-slate-200 w-full">
          {authMode !== 'verify' && <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                authMode === 'signin' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.signInMenu || t.signInBtn}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                authMode === 'signup' ? 'bg-emerald-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.signUpMenu || t.signUpBtn}
            </button>
          </div>}

          {authMode !== 'verify' && <div className="text-center mb-6">
            <div className="inline-block p-3 bg-blue-50 text-blue-700 rounded-2xl mb-2 text-xl font-bold shadow-sm">
              🏢
            </div>
            <h1 className="text-xl font-black text-slate-900">
              {authMode === 'signup' ? (t.employerRegTitle || t.signUpPortalTitle) : (t.loginPortalTitle || t.empPortalTitle)}
            </h1>
            <p className="text-slate-500 text-xs mt-1">{authMode === 'signup' ? (t.employerRegSub || t.signUpPortalSub) : (t.loginPortalSub || t.empPortalSub)}</p>
          </div>}

          {authMode === 'verify' ? (
            <div className="space-y-4">
              <EmailVerifyNotice
                email={verifyEmail}
                lang={currentLang}
                redirectPath="/employer-login"
                onVerified={async () => {
                  const opened = await openEmployer(verifyEmail);
                  if (!opened) alert('E-posta doğrulandı. İşveren kaydı bağlanamadı; Panova ekibiyle iletişime geçin.');
                }}
              />
              <button type="button" onClick={() => setAuthMode('signin')} className="w-full text-xs font-bold text-slate-500 cursor-pointer">
                {t.verifyEmailBack}
              </button>
            </div>
          ) : authMode === 'signin' ? (
            <><form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">{t.companyEmailLabel} *</label>
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
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">{t.passwordLabel} *</label>
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
                {t.signInBtn}
              </button>
            </form>
              <div className="mt-4"><OAuthButtons redirectPath="/employer-login" orLabel={ui.oauthOr} googleLabel={ui.oauthGoogle} /></div></>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4" autoComplete="off">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">{t.companyNameLabel} *</label>
                  <input type="text" required placeholder="Firma Adı DOO" value={regCompanyName} onChange={(e) => setRegCompanyName(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-xs bg-slate-50 text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">{t.contactPersonLabel} *</label>
                  <input type="text" required placeholder="Ad Soyad" value={regContactPerson} onChange={(e) => setRegContactPerson(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-xs bg-slate-50 text-slate-900 font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">{t.phoneLabel}</label>
                  <input type="text" placeholder="+389..." value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-xs bg-slate-50 text-slate-900 font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">{t.countryLabel}</label>
                  <select value={regCountry} onChange={(e) => setRegCountry(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-xs bg-slate-50 text-slate-900 font-medium cursor-pointer">
                    <EuropeanCountryOptions lang={currentLang} currentValue={regCountry} />
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">{t.emailLabel} *</label>
                <input type="email" required placeholder="iletisim@sirket.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-xs bg-slate-50 text-slate-900 font-medium" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-700 mb-1">{t.passwordLabel} *</label>
                <input type="password" required placeholder="••••••••" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full px-3 py-2.5 border rounded-xl text-xs bg-slate-50 text-slate-900 font-medium" />
              </div>

              <button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3.5 rounded-xl transition text-xs shadow-lg cursor-pointer mt-2">
                {t.signUpBtn}
              </button>
            </form>
          )}
        </div>
      </main>

      <AuthFooter tone="slate" />
    </div>
  );
}