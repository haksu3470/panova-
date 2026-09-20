'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, CheckCircle2, LogOut, Lock, KeyRound, Camera, Save, Phone, Mail, FileText, FileCheck } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function CandidateDashboard() {
  const [currentLang, setCurrentLang] = useState<Language>('tr');
  const [authenticated, setAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [candidate, setCandidate] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Profil Güncelleme State
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Şifremi unuttum modal
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const t = translations[currentLang] || translations.tr;

  const handleCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanInput = loginInput.trim().toLowerCase();
    const cleanPass = password.trim();

    const { data, error } = await supabase
      .from('job_candidates')
      .select('*')
      .or(`email.eq.${cleanInput},phone.eq.${cleanInput},passport_number.eq.${cleanInput}`)
      .single();

    setLoading(false);

    if (!error && data) {
      if (data.password === cleanPass || (!data.password && cleanPass === '123456')) {
        setCandidate(data);
        setNewPhone(data.phone || '');
        setNewEmail(data.email || '');
        setNewPassword(data.password || '123456');
        setNewPhoto(data.photo_url || '');
        setAuthenticated(true);
      } else {
        alert('Hatalı şifre! (Varsayılan şifreniz: 123456)');
      }
    } else {
      alert('Girdiğiniz bilgilerle eşleşen aday kaydı bulunamadı!');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);

    const { error } = await supabase
      .from('job_candidates')
      .update({
        phone: newPhone,
        email: newEmail,
        password: newPassword,
        photo_url: newPhoto,
      })
      .eq('id', candidate.id);

    setUpdatingProfile(false);

    if (!error) {
      setCandidate({
        ...candidate,
        phone: newPhone,
        email: newEmail,
        password: newPassword,
        photo_url: newPhoto,
      });
      alert('Profiliniz, iletişim bilgileriniz ve şifreniz başarıyla güncellendi!');
    } else {
      alert('Güncelleme Hatası: ' + error.message);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSent(true);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-14 h-14 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Aday Giriş Portalı</h1>
          <p className="text-slate-500 text-xs mb-6 leading-relaxed">
            E-posta, Telefon (GSM) veya Pasaport numaranız ve şifreniz ile giriş yapabilirsiniz.
          </p>

          <form onSubmit={handleCandidateLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-Posta / Telefon (GSM) / Pasaport No *</label>
              <input type="text" required value={loginInput} onChange={(e) => setLoginInput(e.target.value)} placeholder="Örn: omer@gmail.com veya +90555..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Şifre *</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm" />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Varsayılan Şifre: 123456</span>
              <button type="button" onClick={() => setForgotModal(true)} className="text-[#2e7d32] font-bold hover:underline">Şifremi Unuttum?</button>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-lg mt-2 cursor-pointer text-sm">
              {loading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}
            </button>
          </form>

          <Link href="/" className="inline-block mt-6 text-sm text-slate-500 hover:underline">
            ← Ana Sayfaya Dön
          </Link>
        </div>

        {forgotModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-left space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#2e7d32]" /> Şifre Sıfırlama
              </h3>
              {forgotSent ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center">
                  Şifre sıfırlama talimatı gönderildi (Varsayılan şifreniz: <code className="bg-emerald-100 px-1 rounded">123456</code>).
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <p className="text-xs text-slate-500">Kayıtlı E-posta veya GSM numaranızı girin.</p>
                  <input type="text" required value={forgotInput} onChange={(e) => setForgotInput(e.target.value)} placeholder="E-posta veya Telefon" className="w-full px-3 py-2 text-xs rounded-xl border outline-none text-slate-900" />
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
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-4">
            {newPhoto ? (
              <img src={newPhoto} alt="Profil" className="w-14 h-14 rounded-2xl object-cover border shadow" />
            ) : (
              <div className="w-14 h-14 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center font-bold text-xl">
                {candidate.full_name?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{candidate.full_name}</h1>
              <span className="text-xs text-slate-500">GSM: {candidate.phone} | E-posta: {candidate.email}</span>
            </div>
          </div>
          <button onClick={() => setAuthenticated(false)} className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer">
            <LogOut className="w-4 h-4" /> Çıkış Yap
          </button>
        </div>

        {/* Başvuru Durumu */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Başvuru Durumu</h3>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center">
            <div>
              <div className="text-xs font-bold text-emerald-800 uppercase">Güncel Aşama</div>
              <div className="text-lg font-black text-emerald-900 uppercase">{candidate.status || 'Beklemede'}</div>
            </div>
            <CheckCircle2 className="w-8 h-8 text-[#2e7d32]" />
          </div>
        </div>

        {/* Profil Fotoğrafı, İletişim ve Şifre Düzenleme (Doğrudan Görünür) */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-[#2e7d32]" /> Profil Fotoğrafı, İletişim ve Şifre Düzenleme
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border">
              <div className="relative">
                {newPhoto ? (
                  <img src={newPhoto} alt="Foto" className="w-20 h-20 rounded-2xl object-cover border shadow" />
                ) : (
                  <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xl">
                    {candidate.full_name?.charAt(0)}
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 bg-[#2e7d32] text-white p-2 rounded-xl cursor-pointer shadow hover:bg-[#1b5e20] transition" title="Fotoğraf Değiştir">
                  <Camera className="w-4 h-4" />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">{candidate.full_name}</h4>
                <p className="text-xs text-slate-500">Profil fotoğrafınızı güncellemek için kamera ikonuna tıklayın.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefon Numarası (GSM)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input type="tel" required value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#2e7d32]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-posta Adresi</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#2e7d32]" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Portal Giriş Şifresi</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input type="text" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Yeni şifreniz" className="w-full pl-9 pr-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#2e7d32]" />
              </div>
            </div>

            <button type="submit" disabled={updatingProfile} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold text-sm transition shadow-md cursor-pointer flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {updatingProfile ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </form>
        </div>

        {/* Belgelerim */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Belgelerim</h3>
          <div className="space-y-3">
            {candidateDocs.map((doc: any) => (
              <div key={doc.id} className="p-4 bg-slate-50 rounded-xl border flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">{doc.name}</span>
                <span className={`px-3 py-1 rounded font-bold uppercase text-[10px] ${doc.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {doc.status === 'approved' ? 'Onaylandı' : 'Beklemede'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}