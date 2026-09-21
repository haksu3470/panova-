'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  User, CheckCircle2, LogOut, Lock, KeyRound, Camera, Save, Phone, Mail, 
  FileText, FileCheck, Award, Video, Upload, Eye, X, Briefcase, Calendar, 
  FileSignature, Plane, LifeBuoy, CheckSquare, Languages, ArrowLeft, Bell, MessageSquare, Send, Check, PlaneTakeoff, Ticket, MapPin, Building, UserPlus, LogIn
} from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function CandidateDashboard() {
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panova_candidate_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) return saved;
    }
    return 'tr';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('panova_candidate_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) {
        setCurrentLang(saved);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const timer = setInterval(handleStorageChange, 200);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(timer);
    };
  }, []);

  const [authenticated, setAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login'); // Giriş mi Kayıt mı?
  
  // Login State'leri
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up (Kayıt) State'leri
  const [regFullName, setRegFullName] = useState('');
  const [regPassport, setRegPassport] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regProfession, setRegProfession] = useState('Elektrik Mühendisi / Teknisyeni');
  const [regSector, setRegSector] = useState('construction');

  const [candidate, setCandidate] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'documents' | 'jobs' | 'interviews' | 'offers' | 'process' | 'travel' | 'notifications' | 'support'>('overview');
  
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Bildirim, Destek ve İş Teklifleri State'leri
  const [notifications, setNotifications] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [jobOffers, setJobOffers] = useState<any[]>([]);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportSending, setSupportSending] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null);

  const t = translations[currentLang] || translations.tr;
  const isRtl = currentLang === 'ar';

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
        fetchCandidateData(data.id);
      } else {
        alert(currentLang === 'tr' ? 'Hatalı şifre!' : 'Incorrect password!');
      }
    } else {
      alert(currentLang === 'tr' ? 'Kayıt bulunamadı!' : 'Candidate not found!');
    }
  };

  const handleCandidateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regPassport || !regEmail) {
      alert(currentLang === 'tr' ? 'Lütfen zorunlu alanları doldurun.' : 'Please fill in required fields.');
      return;
    }

    setLoading(true);
    const defaultPassword = '123456';

    const { data, error } = await supabase
      .from('job_candidates')
      .insert([
        {
          full_name: regFullName,
          passport_number: regPassport.toUpperCase(),
          phone: regPhone,
          email: regEmail.toLowerCase(),
          profession: regProfession,
          sector: regSector,
          password: defaultPassword,
          status: 'pending'
        }
      ])
      .select()
      .single();

    setLoading(false);

    if (!error && data) {
      alert(currentLang === 'tr' ? 'Başvurunuz ve kaydınız başarıyla oluşturuldu! Geçici şifreniz: 123456' : 'Registration successful! Default password: 123456');
      setCandidate(data);
      setNewPhone(data.phone || '');
      setNewEmail(data.email || '');
      setNewPassword(defaultPassword);
      setAuthenticated(true);
      fetchCandidateData(data.id);
    } else {
      alert('Hata: ' + (error?.message || 'Kayıt oluşturulamadı.'));
    }
  };

  const fetchCandidateData = async (candId: string) => {
    const { data: notifs } = await supabase
      .from('candidate_notifications')
      .select('*')
      .eq('candidate_id', candId)
      .order('created_at', { ascending: false });

    if (notifs) setNotifications(notifs);

    const { data: tickets } = await supabase
      .from('candidate_support_tickets')
      .select('*')
      .eq('candidate_id', candId)
      .order('created_at', { ascending: false });

    if (tickets) setSupportTickets(tickets);

    const { data: offers } = await supabase
      .from('job_offers')
      .select('*')
      .eq('candidate_id', candId)
      .order('created_at', { ascending: false });

    if (offers) setJobOffers(offers);
  };

  const handleUpdateOfferStatus = async (offerId: string, newStatus: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('job_offers')
      .update({ status: newStatus })
      .eq('id', offerId);

    if (!error) {
      setJobOffers(jobOffers.map(o => o.id === offerId ? { ...o, status: newStatus } : o));
      alert(newStatus === 'accepted' ? 'İş teklifini başarıyla kabul ettiniz!' : 'İş teklifi reddedildi.');
    } else {
      alert('Hata: ' + error.message);
    }
  };

  const markNotificationAsRead = async (notifId: string) => {
    await supabase
      .from('candidate_notifications')
      .update({ is_read: true })
      .eq('id', notifId);

    setNotifications(notifications.map(n => n.id === notifId ? { ...n, is_read: true } : n));
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMsg.trim()) return;
    setSupportSending(true);

    const { data, error } = await supabase
      .from('candidate_support_tickets')
      .insert([
        {
          candidate_id: candidate.id,
          candidate_name: candidate.full_name,
          subject: supportSubject,
          message: supportMsg,
          status: 'open'
        }
      ])
      .select()
      .single();

    setSupportSending(false);

    if (!error && data) {
      setSupportTickets([data, ...supportTickets]);
      setSupportSubject('');
      setSupportMsg('');
      alert(currentLang === 'tr' ? 'Destek talebiniz başarıyla oluşturuldu!' : 'Support ticket created successfully!');
    } else {
      alert('Hata: ' + (error?.message || 'Bilinmeyen hata'));
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

        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full">
          
          {/* Sekme Seçici: Giriş Yap / Kayıt Ol */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 border">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'login' ? 'bg-[#2e7d32] text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" /> {currentLang === 'tr' ? 'Giriş Yap' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'signup' ? 'bg-[#2e7d32] text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> {currentLang === 'tr' ? 'Hemen Başvur / Kayıt Ol' : 'Sign Up'}
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto mb-3">
              {authMode === 'login' ? <Lock className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">
              {authMode === 'login' ? (currentLang === 'tr' ? 'Aday Portalı Girişi' : 'Candidate Portal') : (currentLang === 'tr' ? 'Yeni Aday Başvuru & Kaydı' : 'Candidate Registration')}
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              {authMode === 'login' ? (currentLang === 'tr' ? 'Bilgilerinizle giriş yaparak süreci takip edin.' : 'Sign in to track your status.') : (currentLang === 'tr' ? 'Formu doldurarak anında aday havuzuna katılın.' : 'Fill out the form to join our pool.')}
            </p>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleCandidateLogin} className="space-y-4 text-left rtl:text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {currentLang === 'tr' ? 'E-POSTA / TELEFON / PASAPORT *' : 'EMAIL / PHONE / PASSPORT *'}
                </label>
                <input 
                  type="text" 
                  value={loginInput} 
                  onChange={(e) => setLoginInput(e.target.value)} 
                  placeholder="Örn: omer@gmail.com" 
                  required 
                  className="w-full px-4 py-2.5 rounded-xl border text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {currentLang === 'tr' ? 'ŞİFRE *' : 'PASSWORD *'}
                </label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••" 
                  required 
                  className="w-full px-4 py-2.5 rounded-xl border text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium" 
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{currentLang === 'tr' ? 'Varsayılan Şifre: 123456' : 'Default Password: 123456'}</span>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold py-3 rounded-xl transition shadow-lg cursor-pointer text-sm"
              >
                {loading ? 'Giriş yapılıyor...' : (currentLang === 'tr' ? 'Sisteme Giriş Yap' : 'Sign In')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCandidateSignup} className="space-y-3 text-left rtl:text-right text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Ad Soyad *</label>
                <input 
                  type="text" 
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Örn: Hüseyin Aksu"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Pasaport No *</label>
                  <input 
                    type="text" 
                    required
                    value={regPassport}
                    onChange={(e) => setRegPassport(e.target.value)}
                    placeholder="Örn: U1234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium uppercase outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Telefon (GSM)</label>
                  <input 
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+389..."
                    className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">E-Posta Adresi *</label>
                <input 
                  type="email" 
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ornek@mail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Uzmanlık / Meslek</label>
                  <input 
                    type="text"
                    value={regProfession}
                    onChange={(e) => setRegProfession(e.target.value)}
                    placeholder="Elektrik Mühendisi"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Sektör</label>
                  <select
                    value={regSector}
                    onChange={(e) => setRegSector(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium outline-none cursor-pointer"
                  >
                    <option value="construction">İnşaat & Yapı</option>
                    <option value="agriculture">Tarım & Hayvancılık</option>
                    <option value="manufacturing">Üretim & Sanayi</option>
                    <option value="hospitality">Turizm & Otelcilik</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold py-3 rounded-xl transition shadow-lg cursor-pointer text-sm mt-2"
              >
                {loading ? 'Kayıt oluşturuluyor...' : 'Hemen Kayıt Ol ve Başvur'}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:underline">
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
            </Link>
          </div>
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
  const unreadNotifsCount = notifications.filter(n => !n.is_read).length;
  const pendingOffersCount = jobOffers.filter(o => o.status === 'pending').length;

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
          
          <button onClick={() => setActiveTab('offers')} className={`relative px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${activeTab === 'offers' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>
            {t.offers}
            {pendingOffersCount > 0 && (
              <span className="bg-red-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-extrabold">{pendingOffersCount}</span>
            )}
          </button>

          <button onClick={() => setActiveTab('process')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'process' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>{t.process}</button>
          <button onClick={() => setActiveTab('travel')} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${activeTab === 'travel' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>{t.travel}</button>
          
          <button onClick={() => setActiveTab('notifications')} className={`relative px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 ${activeTab === 'notifications' ? 'bg-[#2e7d32] text-white' : 'bg-white border text-slate-700'}`}>
            <Bell className="w-3.5 h-3.5" /> 
            {currentLang === 'tr' ? 'Bildirimler' : 'Notifications'}
            {unreadNotifsCount > 0 && (
              <span className="bg-red-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-extrabold">{unreadNotifsCount}</span>
            )}
          </button>

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

            {unreadNotifsCount > 0 && (
              <div onClick={() => setActiveTab('notifications')} className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-amber-100 transition">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-amber-600" />
                  <div>
                    <div className="font-bold text-amber-900 text-xs">Okunmamış {unreadNotifsCount} yeni bildiriminiz var!</div>
                    <div className="text-[11px] text-amber-700">Yönetimden gelen mesajları ve güncellemeleri görmek için tıklayın.</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-800 underline">İncele →</span>
              </div>
            )}
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

        {/* Tab 3: Documents */}
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
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center justify-between">
              <span>İş Teklifleri ve Sözleşme Süreci</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold">{jobOffers.length} Teklif</span>
            </h3>

            {jobOffers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-bold text-xs">
                Henüz tarafınıza iletilmiş resmi bir iş teklifi bulunmuyor.
              </div>
            ) : (
              <div className="space-y-4">
                {jobOffers.map((offer) => (
                  <div key={offer.id} className="p-5 bg-slate-50 rounded-2xl border space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase">Resmi Teklif</span>
                        <h4 className="font-extrabold text-slate-900 text-base mt-1">{offer.employer_name}</h4>
                        <p className="text-xs text-slate-500">Pozisyon: <strong>{offer.position_title}</strong></p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${
                        offer.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        offer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {offer.status === 'accepted' ? '✅ Kabul Edildi' :
                         offer.status === 'rejected' ? '❌ Reddedildi' : '⏳ Yanıt Bekleniyor'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>Aylık Net Ücret: <strong className="text-emerald-700 text-sm">€{offer.monthly_net_salary} / ay</strong></div>
                      <div>İşe Başlama Tarihi: <strong className="text-slate-800">{offer.start_date || 'Belirtilmedi'}</strong></div>
                    </div>

                    {offer.terms_details && (
                      <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border">
                        <strong>Sözleşme / Teklif Şartları:</strong> {offer.terms_details}
                      </div>
                    )}

                    {offer.status === 'pending' && (
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleUpdateOfferStatus(offer.id, 'accepted')}
                          className="flex-1 bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-sm"
                        >
                          Teklifi Kabul Et
                        </button>
                        <button
                          onClick={() => handleUpdateOfferStatus(offer.id, 'rejected')}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
                        >
                          Teklifi Reddet
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PlaneTakeoff className="w-5 h-5 text-sky-600" /> Uçuş, Varış ve Konaklama Bilgilerim
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                candidate.travel_status === 'ticketed' ? 'bg-sky-100 text-sky-800' :
                candidate.travel_status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {candidate.travel_status === 'ticketed' ? '🎟️ Biletlendi' :
                 candidate.travel_status === 'completed' ? '✅ Tamamlandı' : '✈️ Planlanıyor'}
              </span>
            </div>

            {!candidate.flight_date && !candidate.pnr_code ? (
              <div className="p-10 bg-slate-50 rounded-2xl border text-center text-slate-400 font-bold text-xs">
                Seyahat planlamanız vize onayından sonra operasyon ekibimiz tarafından hazırlanacaktır.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 space-y-2">
                  <span className="text-[10px] font-bold text-sky-700 uppercase flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Uçuş Tarihi & Saati
                  </span>
                  <div className="text-sm font-extrabold text-slate-900">{candidate.flight_date || 'Belirtilmedi'}</div>
                </div>

                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 space-y-2">
                  <span className="text-[10px] font-bold text-sky-700 uppercase flex items-center gap-1">
                    <Plane className="w-3.5 h-3.5" /> Uçuş Kodu / Sefer No
                  </span>
                  <div className="text-sm font-extrabold text-slate-900">{candidate.flight_number || 'Belirtilmedi'}</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Güzergah (Kalkış → Varış)
                  </span>
                  <div className="text-sm font-extrabold text-slate-900">
                    {candidate.departureCity || candidate.departure_city || '---'} ➔ {candidate.arrivalCity || candidate.arrival_city || '---'}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5" /> PNR / Rezervasyon Kodu
                  </span>
                  <div className="text-sm font-black tracking-widest text-emerald-700 uppercase">{candidate.pnrCode || candidate.pnr_code || 'Belirtilmedi'}</div>
                </div>

                <div className="md:col-span-2 p-4 bg-slate-50 rounded-2xl border space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Building className="w-3.5 h-3.5" /> Konaklama & Karşılama Detayları
                  </span>
                  <div className="text-xs font-medium text-slate-800 leading-relaxed">{candidate.accommodationDetails || candidate.accommodation_details || 'Henüz eklenmedi.'}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 9: Notifications */}
        {activeTab === 'notifications' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center justify-between">
              <span>Yönetim Bildirimleri & Duyurular</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold">{notifications.length} Toplam</span>
            </h3>

            {notifications.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-bold">
                Henüz tarafınıza iletilen bir bildirim bulunmuyor.
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 rounded-2xl border transition ${notif.is_read ? 'bg-slate-50 border-slate-200' : 'bg-emerald-50/50 border-emerald-300 shadow-sm'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{notif.title}</span>
                          {!notif.is_read && <span className="bg-[#2e7d32] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">Yeni</span>}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 mt-2 block">{new Date(notif.created_at).toLocaleString()}</span>
                      </div>

                      {!notif.is_read && (
                        <button 
                          onClick={() => markNotificationAsRead(notif.id)}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Okundu İşaretle
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 10: Support */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Destek Talebi Oluştur</h3>
              <form onSubmit={handleSendSupport} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Konu</label>
                  <input type="text" required value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} placeholder="Örn: Evrak Güncellemesi Hakkında" className="w-full px-3 py-2.5 text-xs rounded-xl border outline-none text-slate-900 font-medium bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mesajınız</label>
                  <textarea rows={4} required value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)} placeholder="Sorununuzu veya talebinizi detaylı yazın..." className="w-full px-3 py-2.5 text-xs rounded-xl border outline-none text-slate-900 font-medium bg-white" />
                </div>
                <button type="submit" disabled={supportSending} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3 rounded-xl font-bold text-xs transition cursor-pointer shadow-md">
                  {supportSending ? 'Gönderiliyor...' : 'Destek Talebi Gönder'}
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Destek Taleplerim ve Geçmiş</h3>
              {supportTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Açık destek kaydınız bulunmuyor.</div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 bg-slate-50 rounded-2xl border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{ticket.subject}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {ticket.status === 'resolved' ? 'Çözüldü' : 'İşlemde'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{ticket.message}</p>
                      {ticket.admin_reply && (
                        <div className="mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                          <strong>PANOVA Destek Ekibi:</strong> {ticket.admin_reply}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400">{new Date(ticket.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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