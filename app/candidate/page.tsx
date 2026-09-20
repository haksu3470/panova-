'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  User, CheckCircle2, LogOut, Lock, KeyRound, Camera, Save, Phone, Mail, 
  FileText, FileCheck, Award, Video, Upload, Eye, X, Briefcase, Calendar, 
  FileSignature, Plane, LifeBuoy, CheckSquare, Languages, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function CandidateDashboard() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [currentLang, setCurrentLang] = useState<Language>('tr');
  const [authenticated, setAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [candidate, setCandidate] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'documents' | 'jobs' | 'interviews' | 'offers' | 'process' | 'travel' | 'support'>('overview');

  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null);
  const [forgotModal, setForgotModal] = useState(false);

  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  const isRtl = currentLang === 'ar';

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
        setNewVideoUrl(data.video_url || '');
        setAuthenticated(true);
      } else {
        alert(currentLang === 'tr' ? 'Hatalı şifre!' : 'Incorrect password!');
      }
    } else {
      alert(currentLang === 'tr' ? 'Kayıt bulunamadı!' : 'Candidate not found!');
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

  const handleDocUpload = async (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileUrl = e.target?.result as string;
      const currentDocs = candidate?.documents_json ? JSON.parse(candidate.documents_json) : [];
      
      const updatedDocs = currentDocs.map((doc: any) => {
        if (doc.id === docId) {
          return { ...doc, file_url: fileUrl, file_name: file.name, status: 'uploaded' };
        }
        return doc;
      });

      const { error } = await supabase
        .from('job_candidates')
        .update({ documents_json: JSON.stringify(updatedDocs) })
        .eq('id', candidate.id);

      if (!error) {
        setCandidate({ ...candidate, documents_json: JSON.stringify(updatedDocs) });
        alert(currentLang === 'tr' ? 'Belge yüklendi!' : 'Document uploaded!');
      }
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
        video_url: newVideoUrl,
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
        video_url: newVideoUrl,
      });
      alert(currentLang === 'tr' ? 'Güncellendi!' : 'Updated!');
    }
  };

  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    setSupportSent(true);
    setSupportSubject('');
    setSupportMsg('');
    setTimeout(() => setSupportSent(false), 4000);
  };

  if (!authenticated) {
    return (
      <div className={`min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="absolute top-6 right-6 flex items-center bg-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-700 shadow-sm">
          <Languages className="w-4 h-4 text-slate-300 mr-1.5 rtl:ml-1.5" />
          <select 
            value={currentLang} 
            onChange={(e) => setCurrentLang(e.target.value as Language)} 
            className="bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code} className="text-slate-900">
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-14 h-14 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
            {currentLang === 'tr' ? 'Aday Giriş Portalı' : currentLang === 'sq' ? 'Portali i Hyrjes për Kandidatët' : currentLang === 'ar' ? 'بوابة دخول المرشحين' : 'Candidate Login Portal'}
          </h1>
          <p className="text-slate-500 text-xs mb-6 leading-relaxed">
            {currentLang === 'tr' ? 'E-posta, Telefon veya Pasaport numaranız ve şifreniz ile giriş yapın.' : 'Sign in with your email, phone, or passport number.'}
          </p>

          <form onSubmit={handleCandidateLogin} className="space-y-4 text-left rtl:text-right">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-Posta / Telefon / Pasaport *</label>
              <input type="text" required value={loginInput} onChange={(e) => setLoginInput(e.target.value)} placeholder="Örn: omer@gmail.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{currentLang === 'tr' ? 'Şifre *' : 'Password *'}</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm" />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Varsayılan: 123456</span>
              <button type="button" onClick={() => setForgotModal(true)} className="text-[#2e7d32] font-bold hover:underline">Şifre?</button>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-lg mt-2 cursor-pointer text-sm">
              {loading ? 'Giriş Yapılıyor...' : 'Sisteme Giriş Yap'}
            </button>
          </form>

          <Link href="/" className="inline-flex items-center gap-1.5 mt-6 text-sm text-slate-500 hover:underline">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {currentLang === 'tr' ? 'Ana Sayfaya Dön' : 'Return to Home'}
          </Link>
        </div>

        {forgotModal && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-left space-y-4 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#2e7d32]" /> Şifre Bilgisi
              </h3>
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center">
                Varsayılan şifreniz: <code className="bg-emerald-100 px-1 rounded">123456</code>
              </div>
              <button onClick={() => setForgotModal(false)} className="w-full bg-slate-900 text-white py-2 rounded-xl text-xs font-bold">Kapat</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const candidateDocs = candidate?.documents_json ? JSON.parse(candidate.documents_json) : [
    { id: '1', name: 'Pasaport Taraması', status: 'pending' },
    { id: '2', name: 'Mesleki Sertifika / İzin Belgesi', status: 'pending' },
    { id: '3', name: 'Adli Sicil Kaydı (Sabıka Kaydı)', status: 'pending' },
    { id: '4', name: 'Sağlık Raporu / Akciğer Grafisi', status: 'pending' },
  ];

  return (
    <div className={`min-h-screen bg-slate-50 p-4 sm:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-6">
        
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
              <span className="text-xs text-slate-500">Pasaport: {candidate.passport_number || 'N/A'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200">
              <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
              <select 
                value={currentLang} 
                onChange={(e) => setCurrentLang(e.target.value as Language)} 
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-slate-900">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <Link href="/" className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition border">
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {currentLang === 'tr' ? 'Ana Sayfa' : 'Home'}
            </Link>

            <button onClick={() => setAuthenticated(false)} className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer">
              <LogOut className="w-4 h-4" /> {currentLang === 'tr' ? 'Çıkış' : 'Logout'}
            </button>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="flex flex-wrap gap-2 border-b pb-2 overflow-x-auto">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'overview' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>
            {currentLang === 'tr' ? 'Ana Sayfa' : 'Overview'}
          </button>
          <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'profile' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>
            {currentLang === 'tr' ? 'Profilim' : 'Profile'}
          </button>
          <button onClick={() => setActiveTab('documents')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'documents' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>
            {currentLang === 'tr' ? 'Belgelerim' : 'Documents'}
          </button>
          <button onClick={() => setActiveTab('jobs')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'jobs' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>
            {currentLang === 'tr' ? 'İş Fırsatlarım' : 'Job Opportunities'}
          </button>
          <button onClick={() => setActiveTab('interviews')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'interviews' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>
            {currentLang === 'tr' ? 'Görüşmelerim' : 'Interviews'}
          </button>
          <button onClick={() => setActiveTab('offers')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'offers' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>
            {currentLang === 'tr' ? 'İş Tekliflerim' : 'Job Offers'}
          </button>
          <button onClick={() => setActiveTab('process')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'process' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>
            {currentLang === 'tr' ? 'İşlem Durumu' : 'Process Status'}
          </button>
          <button onClick={() => setActiveTab('travel')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'travel' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>
            {currentLang === 'tr' ? 'Seyahat Bilgilerim' : 'Travel Info'}
          </button>
          <button onClick={() => setActiveTab('support')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'support' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>
            {currentLang === 'tr' ? 'Destek' : 'Support'}
          </button>
        </div>

        {/* Tab İçerikleri */}
        {activeTab === 'overview' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">{currentLang === 'tr' ? 'Başvuru Durumu ve Özet' : 'Application Status & Summary'}</h3>
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-emerald-800 uppercase">{currentLang === 'tr' ? 'Güncel Süreç Aşaması' : 'Current Stage'}</div>
                <div className="text-xl font-black text-emerald-900 uppercase mt-1">{candidate.status || 'Beklemede'}</div>
              </div>
              <CheckCircle2 className="w-10 h-10 text-[#2e7d32]" />
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm max-w-3xl space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-[#2e7d32]" /> {currentLang === 'tr' ? 'Kimlik, İletişim ve Şifre Yönetimi' : 'Profile & Credentials'}
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
                  <label className="absolute -bottom-2 -right-2 bg-[#2e7d32] text-white p-2 rounded-xl cursor-pointer shadow">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">{candidate.full_name}</h4>
                  <p className="text-xs text-slate-500">Pasaport: {candidate.passport_number}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{currentLang === 'tr' ? 'Telefon (GSM)' : 'Phone (GSM)'}</label>
                  <input type="tel" required value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{currentLang === 'tr' ? 'E-posta' : 'Email'}</label>
                  <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{currentLang === 'tr' ? 'Çalışma Videosu Linki' : 'Work Video URL'}</label>
                <input type="url" value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className="w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{currentLang === 'tr' ? 'Şifre' : 'Password'}</label>
                <input type="text" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none" />
              </div>
              <button type="submit" disabled={updatingProfile} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold text-sm transition cursor-pointer">
                {currentLang === 'tr' ? 'Değişiklikleri Kaydet' : 'Save Changes'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">{currentLang === 'tr' ? 'Belgelerim' : 'My Documents'}</h3>
            <div className="space-y-3">
              {candidateDocs.map((doc: any) => (
                <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">{doc.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">{doc.status}</span>
                    <label className="bg-white text-slate-700 px-3 py-1.5 rounded-lg border font-bold cursor-pointer text-xs shadow-sm">
                      {currentLang === 'tr' ? 'Yükle' : 'Upload'}
                      <input type="file" onChange={(e) => handleDocUpload(doc.id, e)} className="hidden" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {['jobs', 'interviews', 'offers', 'process', 'travel', 'support'].includes(activeTab) && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm text-center py-12 text-slate-500 font-bold text-sm">
            {currentLang === 'tr' ? 'Bu bölüm için aktif kayıt bulunmamaktadır.' : 'No active records found for this section.'}
          </div>
        )}

      </div>
    </div>
  );
}