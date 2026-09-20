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
  // 1. Dil state'ini localStorage'dan güvenli şekilde başlatıyoruz
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panova_candidate_lang') as Language;
      if (saved && translations[saved]) return saved;
    }
    return 'tr';
  });

  // 2. useEffect ile her değişiklikte localStorage'a kaydediyoruz
  useEffect(() => {
    window.scrollTo(0, 0);
    const savedLang = localStorage.getItem('panova_candidate_lang') as Language;
    if (savedLang && translations[savedLang]) {
      setCurrentLang(savedLang);
    }
  }, []);

  const [authenticated, setAuthenticated] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [candidate, setCandidate] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'documents' | 'jobs' | 'interviews' | 'offers' | 'process' | 'travel' | 'support'>('overview');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null);
  const [forgotModal, setForgotModal] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  const t = translations[currentLang] || translations.tr;
  const isRtl = currentLang === 'ar';

  // Dile göre güncellenen standart belge isimleri sözlüğü
  const docTitlesByLang: Record<Language, string[]> = {
    tr: ['Pasaport Taraması', 'Mesleki Sertifika / İzin Belgesi', 'Adli Sicil Kaydı (Sabıka Kaydı)', 'Sağlık Raporu / Akciğer Grafisi'],
    en: ['Passport Scan', 'Professional Certificate / Permit', 'Criminal Record', 'Health Report / X-Ray'],
    sq: ['Skanimi i Pasaportës', 'Certifikata Profesionale / Leja', 'Dëshmi Penaliteti', 'Raporti Shëndetësor / Rrezet X'],
    ar: ['مسح جواز السفر', 'الشهادة المهنية / التصريح', 'السجل الجنائي', 'التقرير الطبي / الأشعة']
  };

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

  const handleDocUpload = async (docIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileUrl = e.target?.result as string;
      const defaultDocs = [
        { id: '1', name: 'Pasaport Taraması', status: 'pending' },
        { id: '2', name: 'Mesleki Sertifika / İzin Belgesi', status: 'pending' },
        { id: '3', name: 'Adli Sicil Kaydı (Sabıka Kaydı)', status: 'pending' },
        { id: '4', name: 'Sağlık Raporu / Akciğer Grafisi', status: 'pending' },
      ];

      const currentDocs = candidate?.documents_json ? JSON.parse(candidate.documents_json) : defaultDocs;
      
      const updatedDocs = currentDocs.map((doc: any, idx: number) => {
        if (idx === docIndex) {
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
      } else {
        alert('Hata: ' + error.message);
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
      alert(currentLang === 'tr' ? 'Profil güncellendi!' : 'Profile updated!');
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
            onChange={(e) => {
              const newLang = e.target.value as Language;
              setCurrentLang(newLang);
              localStorage.setItem('panova_candidate_lang', newLang);
            }} 
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
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">{t.candidatePortal}</h1>
          <p className="text-slate-500 text-xs mb-6 leading-relaxed">{t.loginDesc}</p>

          <form onSubmit={handleLogin} className="space-y-4">
  <div>
    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
      {t.emailOrPhone}
    </label>
    <input 
      type="text" 
      value={loginInput} 
      onChange={(e) => setLoginInput(e.target.value)} 
      placeholder="Örn: omer@gmail.com" 
      required 
      className="w-full px-4 py-2.5 rounded-xl border text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm" 
    />
  </div>

  <div>
    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
      {t.password}
    </label>
    <input 
      type="password" 
      value={password} 
      onChange={(e) => setPassword(e.target.value)} 
      placeholder="••••••" 
      required 
      className="w-full px-4 py-2.5 rounded-xl border text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm" 
    />
  </div>

  <div className="flex items-center justify-between text-xs text-slate-500">
    <span>{currentLang === 'tr' ? 'Varsayılan: 123456' : (currentLang === 'sq' ? 'Parazgjedhur: 123456' : 'Default: 123456')}</span>
    <button 
      type="button" 
      onClick={() => setForgotModal(true)} 
      className="text-emerald-700 font-bold hover:underline cursor-pointer"
    >
      {currentLang === 'tr' ? 'Şifre?' : (currentLang === 'sq' ? 'Fjalëkalimi?' : 'Password?')}
    </button>
  </div>

  <button 
    type="submit" 
    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl transition shadow-lg cursor-pointer text-sm"
  >
    {t.loginBtn}
  </button>
</form>           

          <Link href="/" className="inline-flex items-center gap-1.5 mt-6 text-sm text-slate-500 hover:underline">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
          </Link>
        </div>
      </div>
    );
  }

  const defaultDocs = [
    { id: '1', name: 'Pasaport Taraması', status: 'pending' },
    { id: '2', name: 'Mesleki Sertifika / İzin Belgesi', status: 'pending' },
    { id: '3', name: 'Adli Sicil Kaydı (Sabıka Kaydı)', status: 'pending' },
    { id: '4', name: 'Sağlık Raporu / Akciğer Grafisi', status: 'pending' },
  ];
  const candidateDocs = candidate?.documents_json ? JSON.parse(candidate.documents_json) : defaultDocs;
  const currentLangTitles = docTitlesByLang[currentLang] || docTitlesByLang.tr;

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
              <span className="text-xs text-slate-500">Pasaport: {candidate.passport_number || 'N/A'} | Uzmanlık: {candidate.profession}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200">
              <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
              <select 
                value={currentLang}
                onChange={(e) => {
                  const newLang = e.target.value as Language;
                  setCurrentLang(newLang);
                  localStorage.setItem('panova_candidate_lang', newLang);
                }}
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
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
            </Link>

            <button onClick={() => setAuthenticated(false)} className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer">
              <LogOut className="w-4 h-4" /> {t.logout}
            </button>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="flex flex-wrap gap-2 border-b pb-2 overflow-x-auto">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'overview' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>{t.overview}</button>
          <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'profile' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>{t.profile}</button>
          <button onClick={() => setActiveTab('documents')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'documents' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>{t.documents}</button>
          <button onClick={() => setActiveTab('jobs')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'jobs' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>{t.jobs}</button>
          <button onClick={() => setActiveTab('interviews')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'interviews' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>{t.interviews}</button>
          <button onClick={() => setActiveTab('offers')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'offers' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>{t.offers}</button>
          <button onClick={() => setActiveTab('process')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'process' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>{t.process}</button>
          <button onClick={() => setActiveTab('travel')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'travel' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>{t.travel}</button>
          <button onClick={() => setActiveTab('support')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'support' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>{t.support}</button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Başvuru Durumu ve Özet</h3>
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-emerald-800 uppercase">Güncel Süreç Aşaması</div>
                <div className="text-xl font-black text-emerald-900 uppercase mt-1">{candidate.status || 'Beklemede'}</div>
              </div>
              <CheckCircle2 className="w-10 h-10 text-[#2e7d32]" />
            </div>
          </div>
        )}

        {/* Tab 2: Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm max-w-3xl space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-[#2e7d32]" /> Kimlik, İletişim ve Şifre Yönetimi
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefon (GSM)</label>
                  <input type="tel" required value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-posta</label>
                  <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Çalışma Videosu Linki</label>
                <input type="url" value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className="w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Şifre</label>
                <input type="text" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none" />
              </div>
              <button type="submit" disabled={updatingProfile} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold text-sm transition cursor-pointer">
                Değişiklikleri Kaydet
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Documents (Dile göre isim ve garanti önizleme) */}
        {activeTab === 'documents' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">{t.documents}</h3>
            <div className="space-y-3">
             {candidateDocs.map((doc: any, index: number) => {
              const localizedTitle = currentLangTitles[index] || doc.name;
              return (
                <div key={doc.id || index} className="p-4 bg-slate-50 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">{localizedTitle}</div>
                    {doc.file_name && <div className="text-xs text-slate-500">Yüklenen: {doc.file_name}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded font-bold uppercase text-[10px] ${doc.file_url ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {doc.file_url ? (currentLang === 'tr' ? 'Yüklendi' : 'Uploaded') : (currentLang === 'tr' ? 'Bekleniyor' : 'Pending')}
                    </span>
                    
                    {/* Önizle Butonu - Güvenli Kontrol */}
                    {doc.file_url && doc.file_url.trim() !== '' && (
                      <button 
                        type="button"
                        onClick={() => setPreviewDoc({ name: localizedTitle, url: doc.file_url })} 
                        className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer hover:bg-emerald-100 transition shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" /> {currentLang === 'tr' ? 'Önizle' : 'Preview'}
                      </button>
                    )}

                    <label className="bg-white text-slate-700 px-3 py-1.5 rounded-lg border font-bold cursor-pointer text-xs shadow-sm hover:bg-slate-100 transition">
                      {currentLang === 'tr' ? 'Yükle' : 'Upload'}
                      <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleDocUpload(index, e)} className="hidden" />
                    </label>
                  </div>
                </div>
              );
            })} 
            </div>
          </div>
        )}

        {/* Tab 4: Job Opportunities */}
        {activeTab === 'jobs' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Uygun İş Fırsatları & Çalışma Şartları</h3>
            <div className="p-5 bg-slate-50 rounded-2xl border space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-base">{candidate.profession || 'Pozisyon'}</span>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">Aktif Eşleşme</span>
              </div>
              <p className="text-xs text-slate-600">Sektör: <strong>{candidate.sector}</strong> | Ücret Beklentisi: <strong className="text-emerald-700">€{candidate.expected_salary} / ay</strong></p>
            </div>
          </div>
        )}

        {/* Tab 5: Interviews */}
        {activeTab === 'interviews' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Planlanan İşveren Görüşmeleri</h3>
            <div className="p-6 bg-slate-50 rounded-2xl border text-center text-slate-500 font-bold text-xs">
              Aktif mülakat randevunuz bulunmamaktadır.
            </div>
          </div>
        )}

        {/* Tab 6: Job Offers */}
        {activeTab === 'offers' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">İş Teklifleri ve Sözleşme Süreci</h3>
            <div className="p-6 bg-slate-50 rounded-2xl border text-center text-slate-500 font-bold text-xs">
              Henüz iletilmiş resmi bir iş teklifi bulunmuyor.
            </div>
          </div>
        )}

        {/* Tab 7: Process Status */}
        {activeTab === 'process' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Resmî Süreç ve Oturum Durumu</h3>
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-emerald-50 rounded-xl border flex justify-between items-center">
                <span className="font-bold text-emerald-900">1. Evrak Doğrulama</span>
                <span className="font-extrabold text-emerald-700">Tamamlandı</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border flex justify-between items-center">
                <span className="font-bold text-slate-700">2. İşveren Ön Görüşmesi</span>
                <span className="font-bold text-amber-600">Beklemede</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Travel Info */}
        {activeTab === 'travel' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Uçuş, Varış ve Konaklama Bilgileri</h3>
            <div className="p-6 bg-slate-50 rounded-2xl border text-center text-slate-500 font-bold text-xs">
              Seyahat planlaması vize onayından sonra yapılacaktır.
            </div>
          </div>
        )}

        {/* Tab 9: Support */}
        {activeTab === 'support' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm max-w-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Destek Talebi Oluştur</h3>
            {supportSent && (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center">
                Destek talebiniz başarıyla iletildi!
              </div>
            )}
            <form onSubmit={handleSendSupport} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Konu</label>
                <input type="text" required value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} placeholder="Konu" className="w-full px-3 py-2 text-xs rounded-xl border outline-none text-slate-900" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mesajınız</label>
                <textarea rows={4} required value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)} placeholder="Mesajınız..." className="w-full px-3 py-2 text-xs rounded-xl border outline-none text-slate-900" />
              </div>
              <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3 rounded-xl font-bold text-xs transition cursor-pointer">
                Destek Talebi Gönder
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Gelişmiş Önizleme Modalı */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm truncate max-w-md">{previewDoc.name}</h3>
              <div className="flex items-center gap-2">
                <a 
                  href={previewDoc.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
                >
                  Yeni Sekmede Aç ↗
                </a>
                <button onClick={() => setPreviewDoc(null)} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto flex justify-center items-center bg-slate-100 min-h-[60vh]">
              {previewDoc.url.startsWith('data:image/') ? (
                <img src={previewDoc.url} alt="Belge Önizleme" className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-md" />
              ) : (
                <iframe src={previewDoc.url} className="w-full h-[70vh] rounded-xl border bg-white" title="Belge Önizleme" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}