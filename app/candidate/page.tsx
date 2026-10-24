'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  User, CheckCircle2, LogOut, Lock, Camera, 
  FileText, Eye, X, Briefcase, Calendar, 
  Plane, Languages, ArrowLeft, Bell, Check, PlaneTakeoff, Ticket, MapPin, Building, UserPlus, LogIn, Video, ShieldAlert, ShieldCheck
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
  
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyRelation, setNewEmergencyRelation] = useState('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('');
  
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [jobOffers, setJobOffers] = useState<any[]>([]);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportSending, setSupportSending] = useState(false);

  const t = translations[currentLang] || translations.tr;
  const isRtl = currentLang === 'ar';

  const docTitlesByLang: Record<Language, string[]> = {
    tr: ['Pasaport Taraması', 'Mesleki Sertifika / İzin Belgesi', 'Adli Sicil Kaydı (Sabıka Kaydı)', 'Sağlık Raporu / Akciğer Grafisi', 'e-Apostil / Dışişleri Bakanlığı Tasdiki'],
    en: ['Passport Scan', 'Professional Certificate / Permit', 'Criminal Record', 'Health Report / X-Ray', 'e-Apostille / MoFA Legalization'],
    sq: ['Skanimi i Pasaportës', 'Certifikata Profesionale / Leja', 'Dëshmi Penaliteti', 'Raporti Shëndetësor / Rrezet X', 'e-Apostille / Legalizimi i Ministrisë së Jashtme'],
    ar: ['مسح جواز السفر', 'الشهادة المهنية / التصريح', 'السجل الجنائي', 'التقرير الطبي / الأشعة', 'أبوستيل الكتروني / تصديق وزارة الخارجية']
  };

  useEffect(() => {
    if (authenticated && candidate?.id) {
      fetchCandidateData(candidate.id);
      setNewPhone(candidate.phone || '');
      setNewEmail(candidate.email || '');
      setNewPassword(candidate.password || '123456');
      setNewPhoto(candidate.photo_url || '');
      setNewVideoUrl(candidate.video_url || '');
      setNewEmergencyName(candidate.emergency_name || '');
      setNewEmergencyRelation(candidate.emergency_relation || '');
      setNewEmergencyPhone(candidate.emergency_phone || '');
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
        setNewEmergencyName(data.emergency_name || '');
        setNewEmergencyRelation(data.emergency_relation || '');
        setNewEmergencyPhone(data.emergency_phone || '');
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
        { id: '5', name: 'e-Apostil / Dışişleri Bakanlığı Tasdiki', status: 'pending' },
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
        emergency_name: newEmergencyName,
        emergency_relation: newEmergencyRelation,
        emergency_phone: newEmergencyPhone,
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
        emergency_name: newEmergencyName,
        emergency_relation: newEmergencyRelation,
        emergency_phone: newEmergencyPhone,
      };
      setCandidate(updatedCandidate);
      if (typeof window !== 'undefined') {
        localStorage.setItem('panova_current_candidate', JSON.stringify(updatedCandidate));
      }
      alert(currentLang === 'tr' ? 'Profil ve acil durum bilgileri güncellendi!' : 'Profile and emergency contact updated!');
    }
  };

  if (!authenticated || !candidate) {
    return (
      <div className={`min-h-screen bg-slate-50 flex flex-col justify-between ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <header className="w-full bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PANOVA PORTAL" className="h-8 w-auto object-contain" />
            <span className="font-extrabold text-slate-800 text-sm tracking-wide">PANOVA PORTAL</span>
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
                  <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <Link href="/" className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-200">
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" /> {t.returnHome}
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full">
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
          </div>
        </main>

        <footer className="w-full py-4 text-center text-xs text-slate-500 border-t border-slate-200 bg-white">
          PANOVA TARIM DOO • International Workforce Management System © 2026
        </footer>
      </div>
    );
  }

  const defaultDocs = [
    { id: '1', name: 'Pasaport Taraması', status: 'pending' },
    { id: '2', name: 'Mesleki Sertifika / İzin Belgesi', status: 'pending' },
    { id: '3', name: 'Adli Sicil Kaydı (Sabıka Kaydı)', status: 'pending' },
    { id: '4', name: 'Sağlık Raporu / Akciğer Grafisi', status: 'pending' },
    { id: '5', name: 'e-Apostil / Dışişleri Bakanlığı Tasdiki', status: 'pending' },
  ];
  const candidateDocs = candidate?.documents_json ? JSON.parse(candidate.documents_json) : defaultDocs;
  const currentLangTitles = docTitlesByLang[currentLang] || docTitlesByLang.tr;

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
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
                  <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">
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

        {/* Navigasyon Sekmeleri (Sözlükteki 'profile', 'documents', 'offers' kullanıldı) */}
        <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto whitespace-nowrap text-xs font-bold scrollbar-none">
          <button onClick={() => setActiveTab('overview')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'overview' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📊 {t.overview || 'Genel Bakış'}
          </button>
          <button onClick={() => setActiveTab('profile')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'profile' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            👤 {t.profile || 'Profilim'}
          </button>
          <button onClick={() => setActiveTab('documents')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'documents' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📁 {t.documents || 'Belgelerim'}
          </button>
          <button onClick={() => setActiveTab('offers')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'offers' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            💼 {t.offers || 'İş Tekliflerim'} ({jobOffers.length})
          </button>
          <button onClick={() => setActiveTab('support')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'support' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            💬 {t.support || 'Destek'} ({supportTickets.length})
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
            <h3 className="text-lg font-extrabold text-slate-900 border-b pb-3">👤 Profil Bilgileri & Acil Durum İletişimi</h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">E-Posta Adresi</label>
                  <input 
                    type="email" 
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)} 
                    className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Telefon Numarası</label>
                  <input 
                    type="text" 
                    value={newPhone} 
                    onChange={(e) => setNewPhone(e.target.value)} 
                    className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs text-emerald-800 uppercase border-b pb-1">🚨 Acil Durum İletişim Bilgileri (Emergency Contact)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">İlgili Kişi Adı (Name)</label>
                    <input 
                      type="text" 
                      value={newEmergencyName} 
                      onChange={(e) => setNewEmergencyName(e.target.value)} 
                      placeholder="Örn: Md Samad Bepary" 
                      className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Yakınlık Derecesi (Relationship)</label>
                    <input 
                      type="text" 
                      value={newEmergencyRelation} 
                      onChange={(e) => setNewEmergencyRelation(e.target.value)} 
                      placeholder="Örn: Father / Baba" 
                      className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Acil Durum Telefonu (Phone)</label>
                    <input 
                      type="text" 
                      value={newEmergencyPhone} 
                      onChange={(e) => setNewEmergencyPhone(e.target.value)} 
                      placeholder="+880..." 
                      className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Portal Şifresi</label>
                <input 
                  type="text" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                />
              </div>

              <button 
                type="submit" 
                disabled={updatingProfile}
                className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-6 py-3 rounded-xl font-bold transition shadow cursor-pointer text-xs"
              >
                {updatingProfile ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900">📊 Aday Durum Özeti</h3>
            <p className="text-xs text-slate-600">Başvurunuz ve resmî süreçleriniz PANOVA sisteminde başarıyla takip edilmektedir.</p>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 border-b pb-3">📁 Belgelerim & e-Apostil Takibi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidateDocs.map((doc: any, idx: number) => (
                <div key={doc.id || idx} className="p-4 bg-slate-50 rounded-2xl border space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-900 text-xs">
                    <span>{currentLangTitles[idx] || doc.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${doc.status === 'uploaded' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {doc.status === 'uploaded' ? 'Yüklendi' : 'Bekleniyor'}
                    </span>
                  </div>
                  <input 
                    type="file" 
                    onChange={(e) => handleDocUpload(idx, e)}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-[#2e7d32] hover:file:bg-emerald-100 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 border-b pb-3">💼 İş Tekliflerim</h3>
            {jobOffers.length === 0 ? (
              <p className="text-xs text-slate-400">Henüz tarafınıza iletilen aktif bir iş teklifi bulunmamaktadır.</p>
            ) : (
              jobOffers.map((offer) => (
                <div key={offer.id} className="p-4 bg-slate-50 rounded-2xl border flex justify-between items-center text-xs">
                  <div>
                    <strong>{offer.position_title}</strong> - {offer.employer_name} ({offer.country})
                    <div className="text-[11px] text-slate-500 mt-0.5">Ücret: {offer.salary} | Durum: <strong>{offer.status}</strong></div>
                  </div>
                  {offer.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateOfferStatus(offer.id, 'accepted')} className="px-3 py-1.5 bg-[#2e7d32] text-white rounded-xl font-bold cursor-pointer">Kabul Et</button>
                      <button onClick={() => handleUpdateOfferStatus(offer.id, 'rejected')} className="px-3 py-1.5 bg-red-600 text-white rounded-xl font-bold cursor-pointer">Reddet</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'support' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 border-b pb-3">💬 PANOVA Destek Talepleri</h3>
            <form onSubmit={handleSendSupport} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Konu</label>
                <input type="text" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} required placeholder="Örn: Belge Güncellemesi Hakkında" className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Mesajınız</label>
                <textarea value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)} required rows={3} placeholder="Sorununuzu detaylı yazın..." className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white" />
              </div>
              <button type="submit" className="bg-[#2e7d32] text-white px-6 py-2.5 rounded-xl font-bold cursor-pointer">Destek Talebi Gönder</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}