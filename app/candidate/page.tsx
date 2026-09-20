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

interface CandidateDocument {
  id: string;
  name: string;
  status: 'pending' | 'uploaded' | 'reviewing' | 'approved' | 'rejected' | 're_requested';
  file_url?: string;
  file_name?: string;
}

export default function CandidateDashboard() {
  // Sayfa açıldığında otomatik en üste kaydır
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

  // Güncelleme State'leri
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Belge Önizleme Modal
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null);

  // Şifremi unuttum modal
  const [forgotModal, setForgotModal] = useState(false);

  // Destek Talebi State
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  const t = translations[currentLang] || translations.tr;
  const isRtl = currentLang === 'ar';
  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

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
        alert(currentLang === 'tr' ? 'Hatalı şifre! (Varsayılan şifreniz: 123456)' : 'Incorrect password!');
      }
    } else {
      alert(currentLang === 'tr' ? 'Girdiğiniz bilgilerle eşleşen aday kaydı bulunamadı!' : 'Candidate record not found!');
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
        alert(currentLang === 'tr' ? 'Belgeniz başarıyla yüklendi!' : 'Document uploaded successfully!');
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
      alert(currentLang === 'tr' ? 'Profiliniz ve şifreniz başarıyla güncellendi!' : 'Profile updated successfully!');
    } else {
      alert('Hata: ' + error.message);
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
        {/* Dil Seçici (Giriş Ekranı) */}
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
            E-posta, Telefon (GSM) veya Pasaport numaranız ve şifreniz ile giriş yapabilirsiniz.
          </p>

          <form onSubmit={handleCandidateLogin} className="space-y-4 text-left rtl:text-right">
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

          <Link href="/" className="inline-flex items-center gap-1.5 mt-6 text-sm text-slate-500 hover:underline">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
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
        
        {/* Top Header (Dil Seçici, Ana Sayfa Dönüş ve Çıkış Butonu ile Eksiksiz) */}
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
            {/* Dil Seçici */}
            <div className="flex items-center bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200">
              <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
              <select value={currentLang} onChange={(e) => setCurrentLang(e.target.value as Language)} className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer">
                <option value={currentLang} className="text-slate-900 font-bold">{activeLangObj?.flag} {activeLangObj?.name}</option>
                {selectableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-slate-900">{lang.flag} {lang.name}</option>
                ))}
              </select>
            </div>

            {/* Ana Sayfaya Dön */}
            <Link href="/" className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition border">
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
            </Link>

            {/* Çıkış Yap */}
            <button onClick={() => setAuthenticated(false)} className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer">
              <LogOut className="w-4 h-4" /> Çıkış Yap
            </button>
          </div>
        </div>

        {/* Sekme Menüsü */}
        <div className="flex flex-wrap gap-2 border-b pb-2 overflow-x-auto">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'overview' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>Ana Sayfa</button>
          <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'profile' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>Profilim</button>
          <button onClick={() => setActiveTab('documents')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'documents' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>Belgelerim</button>
          <button onClick={() => setActiveTab('jobs')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'jobs' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>İş Fırsatlarım</button>
          <button onClick={() => setActiveTab('interviews')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'interviews' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>Görüşmelerim</button>
          <button onClick={() => setActiveTab('offers')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'offers' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>İş Tekliflerim</button>
          <button onClick={() => setActiveTab('process')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'process' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>İşlem Durumu</button>
          <button onClick={() => setActiveTab('travel')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'travel' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>Seyahat Bilgilerim</button>
          <button onClick={() => setActiveTab('support')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'support' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>Destek</button>
        </div>

        {/* Tab 1: Ana Sayfa */}
        {activeTab === 'overview' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Başvuru Durumu ve Özet</h3>
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-emerald-800 uppercase">Güncel Süreç Aşaması</div>
                <div className="text-xl font-black text-emerald-900 uppercase mt-1">{candidate.status || 'Beklemede (Pending)'}</div>
              </div>
              <CheckCircle2 className="w-10 h-10 text-[#2e7d32]" />
            </div>
          </div>
        )}

        {/* Tab 2: Profilim */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm max-w-3xl space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-[#2e7d32]" /> Kimlik, İletişim, Çalışma Videosu ve Şifre Yönetimi
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
                  <p className="text-xs text-slate-500">Pasaport: {candidate.passport_number} | Ülke: {candidate.nationality}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefon Numarası (GSM)</label>
                  <input type="tel" required value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">E-posta Adresi</label>
                  <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Çalışma Videosu Linki</label>
                <input type="url" value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className="w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Portal Giriş Şifresi</label>
                <input type="text" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none" />
              </div>

              <button type="submit" disabled={updatingProfile} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold text-sm transition shadow-md cursor-pointer flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> {updatingProfile ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Belgelerim */}
        {activeTab === 'documents' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" /> Belgelerim ve Kontrol Durumları
            </h3>
            <div className="space-y-3">
              {candidateDocs.map((doc: any) => (
                <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-extrabold text-slate-900 text-sm">{doc.name}</div>
                    {doc.file_name && <div className="text-xs text-slate-500">Yüklenen: {doc.file_name}</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg font-bold uppercase text-[10px] ${
                      doc.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      doc.status === 'uploaded' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.status === 'approved' ? 'Onaylandı' : doc.status === 'uploaded' ? 'Yüklendi (İnceleniyor)' : 'Bekleniyor'}
                    </span>
                    {doc.file_url && (
                      <button onClick={() => setPreviewDoc({ name: doc.name, url: doc.file_url })} className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1 cursor-pointer">
                        <Eye className="w-3.5 h-3.5" /> Önizle
                      </button>
                    )}
                    <label className="bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border font-bold cursor-pointer text-xs flex items-center gap-1 shadow-sm">
                      <Upload className="w-3.5 h-3.5 text-indigo-600" /> Yükle
                      <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleDocUpload(doc.id, e)} className="hidden" />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: İş Fırsatlarım */}
        {activeTab === 'jobs' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" /> Uygun İş Fırsatları & Çalışma Şartları
            </h3>
            <div className="p-5 bg-slate-50 rounded-2xl border space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-slate-900 text-base">{candidate.profession || 'Pozisyon'}</span>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">Aktif Eşleşme</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sektör: <strong>{candidate.sector || 'Construction'}</strong> | Ücret Beklentisi: <strong className="text-emerald-700">€{candidate.expected_salary || '850'} / ay</strong>
              </p>
            </div>
          </div>
        )}

        {/* Tab 5: Görüşmelerim */}
        {activeTab === 'interviews' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Planlanan İşveren Görüşmeleri
            </h3>
            <div className="p-5 bg-slate-50 rounded-2xl border text-center space-y-2">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Aktif Görüşme Planı Bulunmuyor</h4>
            </div>
          </div>
        )}

        {/* Tab 6: İş Tekliflerim */}
        {activeTab === 'offers' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-indigo-600" /> İş Teklifleri ve Sözleşme Süreci
            </h3>
            <div className="p-5 bg-slate-50 rounded-2xl border text-center space-y-2">
              <FileSignature className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Henüz İletilmiş Resmi Teklif Yok</h4>
            </div>
          </div>
        )}

        {/* Tab 7: İşlem Durumu */}
        {activeTab === 'process' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-600" /> Resmî Süreç ve Oturum Durumu
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                <span className="font-bold text-emerald-900">1. Evrak Doğrulama</span>
                <span className="font-extrabold text-emerald-700">Tamamlandı</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border flex justify-between items-center">
                <span className="font-bold text-slate-700">2. İşveren Onayı & Ön Görüşme</span>
                <span className="font-bold text-amber-600">Beklemede</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Seyahat Bilgilerim */}
        {activeTab === 'travel' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-600" /> Uçuş, Varış ve Konaklama Bilgileri
            </h3>
            <div className="p-5 bg-slate-50 rounded-2xl border text-center space-y-2">
              <Plane className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-sm">Seyahat Planlaması Henüz Yapılmadı</h4>
            </div>
          </div>
        )}

        {/* Tab 9: Destek */}
        {activeTab === 'support' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm max-w-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-red-600" /> Destek Talebi Oluştur
            </h3>
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

      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">{previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="p-1.5 bg-slate-800 rounded-full text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex justify-center bg-slate-100">
              <iframe src={previewDoc.url} className="w-full h-[70vh] rounded-xl border" title="Önizleme" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}