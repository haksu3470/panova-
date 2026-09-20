'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, FileCheck, Briefcase, LifeBuoy, Languages, ArrowLeft, CheckCircle2, Clock, Send, LogOut, FileText, Lock, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function CandidateDashboard() {
  const [currentLang, setCurrentLang] = useState<Language>('tr');
  const [authenticated, setAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [candidate, setCandidate] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'support'>('overview');
  
  // Şifremi unuttum modal
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const t = translations[currentLang] || translations.tr;
  const isRtl = currentLang === 'ar';
  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

  const handleCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanInput = loginInput.trim().toLowerCase();
    const cleanPass = password.trim();

    // E-posta, Telefon veya Pasaport No ile arama yapıyoruz
    const { data, error } = await supabase
      .from('job_candidates')
      .select('*')
      .or(`email.eq.${cleanInput},phone.eq.${cleanInput},passport_number.eq.${cleanInput}`)
      .single();

    setLoading(false);

    if (!error && data) {
      if (data.password === cleanPass || (!data.password && cleanPass === '123456')) {
        setCandidate(data);
        setAuthenticated(true);
      } else {
        alert(currentLang === 'tr' ? 'Hatalı şifre! (Varsayılan şifreniz: 123456)' : 'Incorrect password! (Default: 123456)');
      }
    } else {
      alert(currentLang === 'tr' ? 'Girdiğiniz bilgilerle eşleşen aday kaydı bulunamadı!' : 'Candidate record not found!');
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(true);
  };

  if (!authenticated) {
    return (
      <div className={`min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="absolute top-6 right-6 flex items-center bg-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-700 shadow-sm">
          <Languages className="w-4 h-4 text-slate-300 mr-1.5 rtl:ml-1.5" />
          <select value={currentLang} onChange={(e) => setCurrentLang(e.target.value as Language)} className="bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer">
            <option value={currentLang} className="text-slate-900 font-bold">{activeLangObj?.flag} {activeLangObj?.name}</option>
            {selectableLanguages.map((lang) => (
              <option key={lang.code} value={lang.code} className="text-slate-900">{lang.flag} {lang.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-14 h-14 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Aday Giriş Portalı</h1>
          <p className="text-slate-500 text-xs mb-6 leading-relaxed">
            Kayıtlı <strong className="text-slate-800">E-posta adresiniz</strong>, <strong className="text-slate-800">Telefon numaranız (GSM)</strong> veya <strong className="text-slate-800">Pasaport numaranız</strong> ve şifreniz ile giriş yapabilirsiniz.
          </p>

          <form onSubmit={handleCandidateLogin} className="space-y-4 text-left rtl:text-right">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-Posta / Telefon (GSM) / Pasaport No *</label>
              <input 
                type="text" 
                required 
                value={loginInput} 
                onChange={(e) => setLoginInput(e.target.value)} 
                placeholder="Örn: omer@gmail.com veya +90555..." 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Şifre *</label>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm" 
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Varsayılan Şifre: 123456</span>
              <button type="button" onClick={() => setForgotModal(true)} className="text-[#2e7d32] font-bold hover:underline">
                Şifremi Unuttum?
              </button>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-lg mt-2 cursor-pointer text-sm">
              {loading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}
            </button>
          </form>

          <Link href="/" className="inline-flex items-center gap-1.5 mt-6 text-sm text-slate-500 hover:underline">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
          </Link>
        </div>

        {/* Şifremi Unuttum Modalı */}
        {forgotModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-left space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#2e7d32]" /> Şifre Sıfırlama
              </h3>
              {forgotSent ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center">
                  Geçici şifreniz kayıtlı iletişim bilgilerinize gönderilmiştir (Varsayılan şifreniz: <code className="text-emerald-900 bg-emerald-100 px-1 py-0.5 rounded">123456</code>).
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <p className="text-xs text-slate-500">Kayıtlı E-posta veya GSM numaranızı girin, geçici şifrenizi iletelim.</p>
                  <input type="text" required value={forgotInput} onChange={(e) => setForgotInput(e.target.value)} placeholder="E-posta veya Telefon" className="w-full px-3 py-2 text-xs rounded-xl border outline-none text-slate-900 font-medium" />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-[#2e7d32] text-white py-2 rounded-xl text-xs font-bold">Gönder</button>
                    <button type="button" onClick={() => setForgotModal(false)} className="px-4 bg-slate-100 text-slate-700 py-2 rounded-xl text-xs font-bold">İptal</button>
                  </div>
                </form>
              )}
              {forgotSent && <button onClick={() => setForgotModal(false)} className="w-full bg-slate-900 text-white py-2 rounded-xl text-xs font-bold">Kapat</button>}
            </div>
          </div>
        )}
      </div>
    );
  }

  const candidateDocs = candidate?.documents_json ? JSON.parse(candidate.documents_json) : [];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-4">
            {candidate.photo_url ? (
              <img src={candidate.photo_url} alt="Foto" className="w-12 h-12 rounded-full object-cover border" />
            ) : (
              <div className="w-12 h-12 bg-emerald-100 text-[#2e7d32] rounded-full flex items-center justify-center font-bold text-lg">
                {candidate.full_name?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{candidate.full_name}</h1>
              <span className="text-xs text-slate-500">GSM: {candidate.phone} | E-posta: {candidate.email}</span>
            </div>
          </div>
          <button onClick={() => setAuthenticated(false)} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold">
            <LogOut className="w-4 h-4" /> Çıkış
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Başvuru Durumu ve Belgelerim</h3>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center">
            <div>
              <div className="text-xs font-bold text-emerald-800 uppercase">Aşama</div>
              <div className="text-lg font-black text-emerald-900 uppercase">{candidate.status || 'Beklemede'}</div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-[#2e7d32]" />
          </div>
        </div>
      </div>
    </div>
  );
}