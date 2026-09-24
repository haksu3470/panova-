'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  User, CheckCircle2, LogOut, Lock, Camera, 
  FileText, Eye, X, Briefcase, Calendar, 
  Plane, Languages, ArrowLeft, Bell, Check, PlaneTakeoff, Ticket, MapPin, Building, UserPlus, LogIn, Video, ShieldAlert
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

  const [authenticated, setAuthenticated] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('panova_candidate_auth') === 'true';
    }
    return false;
  });

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regPassport, setRegPassport] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regProfession, setRegProfession] = useState('Elektrik Mühendisi / Teknisyeni');
  const [regSector, setRegSector] = useState('construction');

  const [candidate, setCandidate] = useState<any | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panova_current_candidate');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'documents' | 'jobs' | 'interviews' | 'offers' | 'process' | 'travel' | 'notifications' | 'support'>('overview');
  
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [jobOffers, setJobOffers] = useState<any[]>([]);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportSending, setSupportSending] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  const t = translations[currentLang] || translations.tr;
  const isRtl = currentLang === 'ar';

  const docTitlesByLang: Record<Language, string[]> = {
    tr: ['Pasaport Taraması', 'Mesleki Sertifika / İzin Belgesi', 'Adli Sicil Kaydı (Sabıka Kaydı)', 'Sağlık Raporu / Akciğer Grafisi'],
    en: ['Passport Scan', 'Professional Certificate / Permit', 'Criminal Record', 'Health Report / X-Ray'],
    sq: ['Skanimi i Pasaportës', 'Certifikata Profesionale / Leja', 'Dëshmi Penaliteti', 'Raporti Shëndetësor / Rrezet X'],
    ar: ['مسح جواز السفر', 'الشهادة المهنية / التصريح', 'السجل الجنائي', 'التقرير الطبي / الأشعة']
  };

  useEffect(() => {
    if (authenticated && candidate?.id) {
      fetchCandidateData(candidate.id);
      setNewPhone(candidate.phone || '');
      setNewEmail(candidate.email || '');
      setNewPassword(candidate.password || '123456');
      setNewPhoto(candidate.photo_url || '');
      setNewVideoUrl(candidate.video_url || '');
    }
  }, [authenticated]);

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
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('panova_candidate_auth', 'true');
          localStorage.setItem('panova_current_candidate', JSON.stringify(data));
        }

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
      alert(currentLang === 'tr' ? 'Başvurunuz başarıyla oluşturuldu! Şifreniz: 123456' : 'Registration successful! Default password: 123456');
      setCandidate(data);
      setNewPhone(data.phone || '');
      setNewEmail(data.email || '');
      setNewPassword(defaultPassword);
      setAuthenticated(true);

      if (typeof window !== 'undefined') {
        localStorage.setItem('panova_candidate_auth', 'true');
        localStorage.setItem('panova_current_candidate', JSON.stringify(data));
      }

      fetchCandidateData(data.id);
    } else {
      alert('Hata: ' + (error?.message || 'Kayıt oluşturulamadı.'));
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setCandidate(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('panova_candidate_auth');
      localStorage.removeItem('panova_current_candidate');
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
      alert(currentLang === 'tr' ? 'İş teklifi durumu güncellendi!' : 'Job offer status updated.');
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
      alert(currentLang === 'tr' ? 'Destek talebiniz oluşturuldu!' : 'Support ticket created successfully!');
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
        const updatedCandidate = { ...candidate, documents_json: JSON.stringify(updatedDocs) };
        setCandidate(updatedCandidate);
        if (typeof window !== 'undefined') {
          localStorage.setItem('panova_current_candidate', JSON.stringify(updatedCandidate));
        }
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
      const updatedCandidate = {
        ...candidate,
        phone: newPhone,
        email: newEmail,
        password: newPassword,
        photo_url: newPhoto,
        video_url: newVideoUrl,
      };
      setCandidate(updatedCandidate);
      if (typeof window !== 'undefined') {
        localStorage.setItem('panova_current_candidate', JSON.stringify(updatedCandidate));
      }
      alert(currentLang === 'tr' ? 'Profil güncellendi!' : 'Profile updated!');
    }
  };

  if (!authenticated || !candidate) {
    return (
      <div className={`min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center bg-slate-800 rounded-xl px-3 py-2 border border-slate-700 shadow-sm">
          <Languages className="w-4 h-4 text-slate-300 mr-2 rtl:ml-2" />
          <select 
            value={currentLang} 
            onChange={(e) => {
              const newLang = e.target.value as Language;
              setCurrentLang(newLang);
              localStorage.setItem('panova_candidate_lang', newLang);
            }} 
            className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code} className="text-slate-900">
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full my-auto">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 border">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'login' ? 'bg-[#2e7d32] text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" /> {currentLang === 'tr' ? 'Giriş Yap' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'signup' ? 'bg-[#2e7d32] text-white shadow' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" /> {currentLang === 'tr' ? 'Kayıt Ol' : 'Sign Up'}
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto mb-3">
              {authMode === 'login' ? <Lock className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
            </div>
            <h1 className="text-xl font-extrabold text-slate-900">
              {authMode === 'login' ? t.candidatePortal : (currentLang === 'tr' ? 'Aday Kayıt' : 'Candidate Registration')}
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              {authMode === 'login' ? t.loginDesc : (currentLang === 'tr' ? 'Formu doldurarak anında aday havuzuna katılın.' : 'Fill out the form to join.')}
            </p>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleCandidateLogin} className="space-y-4 text-left rtl:text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.emailOrPhone}</label>
                <input 
                  type="text" 
                  value={loginInput} 
                  onChange={(e) => setLoginInput(e.target.value)} 
                  placeholder="omer@gmail.com" 
                  required 
                  className="w-full px-4 py-3 rounded-xl border text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.password}</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••" 
                  required 
                  className="w-full px-4 py-3 rounded-xl border text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium" 
                />
              </div>

              <div className="text-xs text-slate-500">
                {currentLang === 'tr' ? 'Varsayılan Şifre: 123456' : 'Default Password: 123456'}
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold py-3.5 rounded-xl transition shadow-lg cursor-pointer text-sm"
              >
                {loading ? '...' : t.loginBtn}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCandidateSignup} className="space-y-3 text-left rtl:text-right text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">{t.nameLabel} *</label>
                <input 
                  type="text" 
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Hüseyin Aksu"
                  className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.passportLabel} *</label>
                  <input 
                    type="text" 
                    required
                    value={regPassport}
                    onChange={(e) => setRegPassport(e.target.value)}
                    placeholder="U1234567"
                    className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium uppercase outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.phone} *</label>
                  <input 
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+389..."
                    className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">{t.emailLabel} *</label>
                <input 
                  type="email" 
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ornek@mail.com"
                  className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.professionLabel}</label>
                  <input 
                    type="text"
                    value={regProfession}
                    onChange={(e) => setRegProfession(e.target.value)}
                    placeholder="Elektrik Mühendisi"
                    className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.sectorLabel}</label>
                  <select
                    value={regSector}
                    onChange={(e) => setRegSector(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium outline-none cursor-pointer text-sm"
                  >
                    <option value="construction">İnşaat & Yapı</option>
                    <option value="agriculture">Tarım ve Hayvancılık</option>
                    <option value="manufacturing">Üretim & Sanayi</option>
                    <option value="hospitality">Turizm & Otelcilik</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold py-3.5 rounded-xl transition shadow-lg cursor-pointer text-sm mt-3"
              >
                {loading ? '...' : t.completeReg}
              </button>
            </form>
          )}

          <div className="text-center mt-6">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:underline">
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t.pendingStatus;
      case 'reviewing': return t.reviewingStatus;
      case 'visa_processing': return t.visaProcessingStatus;
      case 'approved': return t.approvedStatus;
      default: return status;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3 sm:gap-4">
            {newPhoto ? (
              <img src={newPhoto} alt="Profil" className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border shadow" />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl">
                {candidate.full_name?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 truncate max-w-[200px] sm:max-w-none">{candidate.full_name}</h1>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500">
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">PNV-CAND-{candidate.id.substring(0, 6)}</span>
                <span>{t.passportLabel}: {candidate.passport_number || 'N/A'}</span>
                <span>{t.professionLabel}: {candidate.profession}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

            <Link href="/" className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border">
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" /> {t.returnHome}
            </Link>

            <button onClick={handleLogout} className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> {t.logout}
            </button>
          </div>
        </div>

        {/* Closed Status Warning */}
        {candidate.is_closed && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-2 text-xs sm:text-sm text-red-900">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <strong>Dosyanız süreçten kapatılmıştır.</strong> Sebep: {candidate.closure_reason || 'Belirtilmemiş'}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto whitespace-nowrap text-xs font-bold scrollbar-none">
          <button onClick={() => setActiveTab('overview')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'overview' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>📊 {t.overview}</button>
          <button onClick={() => setActiveTab('profile')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'profile' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>👤 {t.profile}</button>
          <button onClick={() => setActiveTab('documents')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'documents' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>📁 {t.documents}</button>
          <button onClick={() => setActiveTab('jobs')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'jobs' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>💼 {t.jobs}</button>
          <button onClick={() => setActiveTab('interviews')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'interviews' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>📅 {t.interviews}</button>
          
          <button onClick={() => setActiveTab('offers')} className={`relative px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 flex items-center gap-1.5 ${activeTab === 'offers' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            ✨ {t.offers}
            {pendingOffersCount > 0 && (
              <span className="bg-red-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-extrabold">{pendingOffersCount}</span>
            )}
          </button>

          <button onClick={() => setActiveTab('process')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'process' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>🔄 {t.process}</button>
          <button onClick={() => setActiveTab('travel')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'travel' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>✈️ {t.travel}</button>
          
          <button onClick={() => setActiveTab('notifications')} className={`relative px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 flex items-center gap-1.5 ${activeTab === 'notifications' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            <Bell className="w-3.5 h-3.5" /> 
            {currentLang === 'tr' ? 'Bildirimler' : 'Notifications'}
            {unreadNotifsCount > 0 && (
              <span className="bg-red-500 text-white rounded-full px-1.5 py-0.2 text-[10px] font-extrabold">{unreadNotifsCount}</span>
            )}
          </button>

          <button onClick={() => setActiveTab('support')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'support' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>💬 {t.support}</button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 border-b pb-3">{t.applicationStatusAndSummary}</h3>
            <div className="p-4 sm:p-5 bg-emerald-50 rounded-2xl border border-emerald-200 flex justify-between items-center">
              <div>
                <div className="text-[11px] sm:text-xs font-bold text-emerald-800 uppercase">{t.currentProcessStage}</div>
                <div className="text-lg sm:text-xl font-black text-emerald-900 uppercase mt-1">{getStatusText(candidate.status)}</div>
              </div>
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#2e7d32]" />
            </div>

            {unreadNotifsCount > 0 && (
              <div onClick={() => setActiveTab('notifications')} className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-amber-100 transition">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <div className="font-bold text-amber-900 text-xs">
                      {currentLang === 'tr' ? `Okunmamış ${unreadNotifsCount} yeni bildiriminiz var!` : `You have ${unreadNotifsCount} unread notifications!`}
                    </div>
                    <div className="text-[11px] text-amber-700">
                      {currentLang === 'tr' ? 'Mesajları görmek için tıklayın.' : 'Click to view.'}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-800 underline">→</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm max-w-3xl space-y-5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-[#2e7d32]" /> {t.profile}
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="flex items-center gap-4 sm:gap-6 p-4 bg-slate-50 rounded-2xl border">
                <div className="relative shrink-0">
                  {newPhoto ? (
                    <img src={newPhoto} alt="Foto" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border shadow" />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xl">
                      {candidate.full_name?.charAt(0)}
                    </div>
                  )}
                  <label className="absolute -bottom-2 -right-2 bg-[#2e7d32] text-white p-2 rounded-xl cursor-pointer shadow">
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm sm:text-base">{candidate.full_name}</h4>
                  <p className="text-[11px] sm:text-xs text-slate-500">{t.passportLabel}: {candidate.passport_number}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.phone}</label>
                  <input type="tel" required value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.emailLabel}</label>
                  <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none bg-white" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 uppercase mb-1">{t.videoUrlLabel}</label>
                <div className="flex gap-2">
                  <input type="url" value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className="flex-1 px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none bg-white" />
                  {newVideoUrl && (
                    <button type="button" onClick={() => setPreviewVideo(newVideoUrl)} className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition border border-indigo-200 cursor-pointer flex items-center gap-1">
                      <Video className="w-4 h-4" /> {currentLang === 'tr' ? 'Oynat' : 'Play'}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">{t.password}</label>
                <input type="text" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 outline-none bg-white" />
              </div>
              <button type="submit" disabled={updatingProfile} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 sm:py-4 rounded-xl font-bold text-sm transition cursor-pointer shadow-md">
                {t.saveBtn}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Documents */}
        {activeTab === 'documents' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.documents}</h3>
            <div className="space-y-3">
             {candidateDocs.map((doc: any, index: number) => {
              const localizedTitle = currentLangTitles[index] || doc.name;
              return (
                <div key={doc.id || index} className="p-4 bg-slate-50 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-extrabold text-slate-900 text-xs sm:text-sm">{localizedTitle}</div>
                    {doc.file_name && <div className="text-[11px] text-slate-500 truncate max-w-[250px] sm:max-w-none">{currentLang === 'tr' ? 'Yüklenen:' : 'File:'} {doc.file_name}</div>}
                    <div className="text-[10px] font-bold text-indigo-600 mt-1 uppercase">Durum: {doc.status || 'pending'}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className={`px-2.5 py-1 rounded font-bold uppercase text-[10px] ${
                      doc.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      doc.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      doc.status === 're_requested' ? 'bg-purple-100 text-purple-800' :
                      doc.file_url ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.status === 'approved' ? 'Onaylandı' :
                       doc.status === 'rejected' ? 'Reddedildi' :
                       doc.status === 're_requested' ? 'Yeniden İstendi' :
                       doc.file_url ? (currentLang === 'tr' ? 'Yüklendi' : 'Uploaded') : (currentLang === 'tr' ? 'Bekleniyor' : 'Pending')}
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

                    <label className="bg-white text-slate-700 px-3.5 py-1.5 rounded-lg border font-bold cursor-pointer text-xs shadow-sm hover:bg-slate-100 transition">
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
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.jobs}</h3>
            <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">{candidate.profession || 'Pozisyon'}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full w-fit">{t.approvedStatus}</span>
              </div>
              <p className="text-xs text-slate-600">{t.sectorLabel}: <strong>{candidate.sector}</strong> | {t.expectedSalaryLabel}: <strong className="text-emerald-700">€{candidate.expected_salary} / {t.monthText}</strong></p>
            </div>
          </div>
        )}

        {/* Tab 5: Interviews */}
        {activeTab === 'interviews' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.interviews}</h3>
            <div className="p-6 bg-slate-50 rounded-2xl border text-center text-slate-500 font-bold text-xs">
              {currentLang === 'tr' ? 'Aktif mülakat randevunuz bulunmamaktadır.' : 'No active interviews scheduled.'}
            </div>
          </div>
        )}

        {/* Tab 6: Job Offers */}
        {activeTab === 'offers' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex items-center justify-between">
              <span>{t.offers}</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold">{jobOffers.length}</span>
            </h3>

            {jobOffers.length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-bold text-xs">
                {currentLang === 'tr' ? 'Henüz tarafınıza iletilmiş resmi bir iş teklifi bulunmuyor.' : 'No job offers received yet.'}
              </div>
            ) : (
              <div className="space-y-4">
                {jobOffers.map((offer) => (
                  <div key={offer.id} className="p-4 sm:p-5 bg-slate-50 rounded-2xl border space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full uppercase">{t.offers}</span>
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base mt-1">{offer.employer_name}</h4>
                        <p className="text-xs text-slate-500">{t.professionLabel}: <strong>{offer.position_title}</strong></p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase w-fit ${
                        offer.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        offer.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {offer.status === 'accepted' ? '✅ Kabul Edildi' :
                         offer.status === 'rejected' ? '❌ Reddedildi' : '⏳ Yanıt Bekleniyor'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>{t.colSalary}: <strong className="text-emerald-700 text-sm">€{offer.monthly_net_salary} / {t.monthText}</strong></div>
                      <div>{t.colTargetStart}: <strong className="text-slate-800">{offer.start_date || 'N/A'}</strong></div>
                    </div>

                    {offer.terms_details && (
                      <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border">
                        <strong>Şartlar:</strong> {offer.terms_details}
                      </div>
                    )}

                    {offer.status === 'pending' && (
                      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                        <button
                          onClick={() => handleUpdateOfferStatus(offer.id, 'accepted')}
                          className="flex-1 bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3 rounded-xl font-bold text-xs transition cursor-pointer shadow-sm"
                        >
                          {currentLang === 'tr' ? 'Teklifi Kabul Et' : 'Accept Offer'}
                        </button>
                        <button
                          onClick={() => handleUpdateOfferStatus(offer.id, 'rejected')}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-3 rounded-xl font-bold text-xs transition cursor-pointer"
                        >
                          {currentLang === 'tr' ? 'Teklifi Reddet' : 'Reject Offer'}
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
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.process}</h3>
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-emerald-50 rounded-xl border flex justify-between items-center">
                <span className="font-bold text-emerald-900">1. {currentLang === 'tr' ? 'Evrak Doğrulama' : 'Document Verification'}</span>
                <span className="font-extrabold text-emerald-700">{t.approvedStatus}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border flex justify-between items-center">
                <span className="font-bold text-slate-700">2. {currentLang === 'tr' ? 'İşveren Ön Görüşmesi' : 'Employer Interview'}</span>
                <span className="font-bold text-amber-600">{t.pendingStatus}</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Travel Info */}
        {activeTab === 'travel' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <PlaneTakeoff className="w-5 h-5 text-sky-600" /> {t.travel}
              </h3>
            </div>

            {!candidate.flight_date && !candidate.pnr_code ? (
              <div className="p-10 bg-slate-50 rounded-2xl border text-center text-slate-400 font-bold text-xs">
                {currentLang === 'tr' ? 'Seyahat planlamanız vize onayından sonra hazırlanacaktır.' : 'Travel planning will be arranged after visa approval.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 space-y-2">
                  <span className="text-[10px] font-bold text-sky-700 uppercase">{currentLang === 'tr' ? 'Uçuş Tarihi' : 'Flight Date'}</span>
                  <div className="text-sm font-extrabold text-slate-900">{candidate.flight_date || 'N/A'}</div>
                </div>

                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-200 space-y-2">
                  <span className="text-[10px] font-bold text-sky-700 uppercase">{currentLang === 'tr' ? 'Uçuş Kodu' : 'Flight Number'}</span>
                  <div className="text-sm font-extrabold text-slate-900">{candidate.flight_number || 'N/A'}</div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{currentLang === 'tr' ? 'Güzergah' : 'Route'}</span>
                  <div className="text-sm font-extrabold text-slate-900">
                    {candidate.departure_city || '---'} ➔ {candidate.arrival_city || '---'}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{currentLang === 'tr' ? 'PNR Kodu' : 'PNR Code'}</span>
                  <div className="text-sm font-black tracking-widest text-emerald-700 uppercase">{candidate.pnr_code || 'N/A'}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 9: Notifications */}
        {activeTab === 'notifications' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex items-center justify-between">
              <span>{currentLang === 'tr' ? 'Bildirimler' : 'Notifications'}</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold">{notifications.length}</span>
            </h3>

            {notifications.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-bold">
                {currentLang === 'tr' ? 'Bildirim bulunmuyor.' : 'No notifications.'}
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div key={notif.id} className={`p-4 rounded-2xl border transition ${notif.is_read ? 'bg-slate-50 border-slate-200' : 'bg-emerald-50/50 border-emerald-300 shadow-sm'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{notif.title}</span>
                          {!notif.is_read && <span className="bg-[#2e7d32] text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">Yeni</span>}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                      </div>

                      {!notif.is_read && (
                        <button 
                          onClick={() => markNotificationAsRead(notif.id)}
                          className="px-3.5 py-2 bg-white border hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap w-fit"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> {currentLang === 'tr' ? 'Okundu İşaretle' : 'Mark Read'}
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
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.support}</h3>
              <form onSubmit={handleSendSupport} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{currentLang === 'tr' ? 'Konu' : 'Subject'}</label>
                  <input type="text" required value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} placeholder="Evrak Hakkında" className="w-full px-3.5 py-3 rounded-xl border outline-none text-slate-900 font-medium bg-white text-xs sm:text-sm" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{currentLang === 'tr' ? 'Mesajınız' : 'Message'}</label>
                  <textarea rows={4} required value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)} placeholder="Mesajınızı yazın..." className="w-full px-3.5 py-3 rounded-xl border outline-none text-slate-900 font-medium bg-white text-xs sm:text-sm" />
                </div>
                <button type="submit" disabled={supportSending} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-md">
                  {supportSending ? '...' : (currentLang === 'tr' ? 'Destek Talebi Gönder' : 'Submit Ticket')}
                </button>
              </form>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{currentLang === 'tr' ? 'Destek Geçmişi' : 'Support History'}</h3>
              {supportTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Kayıt bulunmuyor.</div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 bg-slate-50 rounded-2xl border space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{ticket.subject}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-slate-600">{ticket.message}</p>
                      {ticket.admin_reply && (
                        <div className="mt-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                          <strong>PANOVA:</strong> {ticket.admin_reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-xs sm:text-sm truncate max-w-[200px] sm:max-w-md">{previewDoc.name}</h3>
              <div className="flex items-center gap-2">
                <a href={previewDoc.url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition">
                  Yeni Sekmede Aç ↗
                </a>
                <button onClick={() => setPreviewDoc(null)} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-2 sm:p-4 flex-1 overflow-auto flex justify-center items-center bg-slate-100 min-h-[60vh]">
              {previewDoc.url.startsWith('data:image/') ? (
                <img src={previewDoc.url} alt="Önizleme" className="max-w-full max-h-[70vh] rounded-xl object-contain shadow-md" />
              ) : (
                <iframe src={previewDoc.url} className="w-full h-[70vh] rounded-xl border bg-white" title="Önizleme" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-xs sm:text-sm">Çalışma Videosu Önizleme</h3>
              <button onClick={() => setPreviewVideo(null)} className="p-1.5 bg-slate-800 rounded-full text-slate-300 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex justify-center items-center bg-slate-100">
              {previewVideo.includes('youtube.com') || previewVideo.includes('youtu.be') ? (
                <iframe 
                  src={previewVideo.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                  className="w-full h-[70vh] rounded-xl border bg-black" 
                  title="Video Önizleme" 
                  allowFullScreen 
                />
              ) : (
                <video src={previewVideo} controls className="w-full h-[70vh] rounded-xl border bg-black" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}