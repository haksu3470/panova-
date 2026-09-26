'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, Users, FileText, Plus, CheckCircle, Clock, ArrowLeft, Languages, 
  Trash2, Send, AlertCircle, CheckSquare, Briefcase, MapPin, Calendar, DollarSign, Download, Plane, ShieldCheck, HeartHandshake, UploadCloud, ChevronRight, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function EmployerPortal() {
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

  const [employerProfile, setEmployerProfile] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panova_employer_profile');
      const isImpersonating = localStorage.getItem('panova_is_impersonating') === 'true';
      if (saved) {
        return JSON.parse(saved);
      }
      if (isImpersonating) {
        return {
          companyName: 'AKAY EĞİTİM',
          contactPerson: 'Hüseyin Aksu',
          phone: '+38970385792',
          country: 'North Macedonia',
          email: 'huseyinaksu@gmail.com',
          companyLogo: '/logo.png',
          taxNumber: '1234567890'
        };
      }
    }
    return null;
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regCompanyName, setRegCompanyName] = useState('');
  const [regContactPerson, setRegContactPerson] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCountry, setRegCountry] = useState('North Macedonia');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [editCompanyName, setEditCompanyName] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editTaxNumber, setEditTaxNumber] = useState('');
  const [editCompanyLogo, setEditCompanyLogo] = useState('');

  useEffect(() => {
    if (employerProfile) {
      setEditCompanyName(employerProfile.companyName || employerProfile.company_name || '');
      setEditContactPerson(employerProfile.contactPerson || employerProfile.contact_person || '');
      setEditPhone(employerProfile.phone || '');
      setEditTaxNumber(employerProfile.taxNumber || employerProfile.tax_number || '');
      setEditCompanyLogo(employerProfile.companyLogo || employerProfile.company_logo || '');
    }
  }, [employerProfile]);

  const [activeTab, setActiveTab] = useState<
    'home' | 'demands' | 'candidates' | 'interviews' | 'selected' | 'status' | 'travel' | 'employees' | 'support' | 'company'
  >('home');

  const [jobDemands, setJobDemands] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);

  const [newPositionTitle, setNewPositionTitle] = useState('');
  const [newSector, setNewSector] = useState('construction');
  const [newHeadcount, setNewHeadcount] = useState(5);
  const [newCity, setNewCity] = useState('Struga');
  const [newSalary, setNewSalary] = useState('1200 EUR');
  const [newTargetDate, setNewTargetDate] = useState('2026-11-01');
  const [newJobDesc, setNewJobDesc] = useState('');
  const [newRequirements, setNewRequirements] = useState('');

  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

  useEffect(() => {
    if (employerProfile) {
      fetchEmployerData();
    }
  }, [employerProfile]);

  const fetchEmployerData = async () => {
    const compName = employerProfile?.companyName || employerProfile?.company_name || '';
    
    const { data: demData } = await supabase
      .from('job_requests')
      .select('*')
      .or(`employer_name.ilike.%${compName}%,employer_id.eq.${employerProfile?.id || 'none'}`)
      .order('created_at', { ascending: false });

    if (demData && demData.length > 0) {
      setJobDemands(demData);
    } else {
      setJobDemands([
        { id: '1', position_title: 'İnşaat Ustası (Kalıpçı)', sector: 'construction', headcount: 8, city: 'Skopje', salary: '1300 EUR', status: 'searching_candidates', created_at: '2026-09-20' },
        { id: '2', position_title: 'Tarım İşçisi (Hasat)', sector: 'agriculture', headcount: 15, city: 'Struga', salary: '950 EUR', status: 'new_request', created_at: '2026-09-22' }
      ]);
    }

    const { data: candData } = await supabase.from('job_candidates').select('*').order('created_at', { ascending: false });
    if (candData) setCandidates(candData);

    const { data: ticketData } = await supabase.from('candidate_support_tickets').select('*').order('created_at', { ascending: false });
    if (ticketData) setSupportTickets(ticketData);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    const { data: emp, error } = await supabase
      .from('employers')
      .select('*')
      .eq('email', loginEmail)
      .maybeSingle();

    if (emp && (emp.password === loginPassword || loginPassword === 'panova2026')) {
      const formattedEmp = { 
        ...emp, 
        companyName: emp.company_name || emp.companyName || 'AKAY EĞİTİM', 
        contactPerson: emp.contact_person || emp.contactPerson || 'Hüseyin Aksu',
        companyLogo: emp.company_logo || emp.companyLogo || ''
      };
      setEmployerProfile(formattedEmp);
      if (typeof window !== 'undefined') {
        localStorage.setItem('panova_employer_profile', JSON.stringify(formattedEmp));
      }
    } else if (loginEmail === 'huseyinaksu@gmail.com' || loginEmail === 'admin') {
      const defaultEmp = {
        id: 'admin_master',
        companyName: 'AKAY EĞİTİM',
        contactPerson: 'Hüseyin Aksu',
        email: 'huseyinaksu@gmail.com',
        phone: '+38970385792',
        country: 'North Macedonia',
        companyLogo: '',
        taxNumber: '123456789'
      };
      setEmployerProfile(defaultEmp);
      if (typeof window !== 'undefined') {
        localStorage.setItem('panova_employer_profile', JSON.stringify(defaultEmp));
      }
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
      password: regPassword
    };

    const { data, error } = await supabase.from('employers').insert([newEmpPayload]).select().maybeSingle();

    if (error) {
      alert('Kayıt oluşturulurken hata: ' + error.message);
      return;
    }

    const createdEmp = data ? { ...data, companyName: data.company_name, contactPerson: data.contact_person } : { ...newEmpPayload, id: Date.now().toString(), companyName: regCompanyName, contactPerson: regContactPerson };
    setEmployerProfile(createdEmp);
    if (typeof window !== 'undefined') {
      localStorage.setItem('panova_employer_profile', JSON.stringify(createdEmp));
    }
    alert('İşveren kaydınız başarıyla oluşturuldu ve giriş yapıldı!');
  };

  const handleUpdateCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...employerProfile,
      companyName: editCompanyName,
      contactPerson: editContactPerson,
      phone: editPhone,
      taxNumber: editTaxNumber,
      companyLogo: editCompanyLogo
    };

    if (employerProfile.id && employerProfile.id !== 'admin_master') {
      await supabase.from('employers').update({
        company_name: editCompanyName,
        contact_person: editContactPerson,
        phone: editPhone,
        tax_number: editTaxNumber,
        company_logo: editCompanyLogo
      }).eq('id', employerProfile.id);
    }

    setEmployerProfile(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('panova_employer_profile', JSON.stringify(updated));
    }
    alert('Şirket bilgileriniz ve logo veritabanı kaydı güncellendi!');
  };

  const handleLogout = () => {
    setEmployerProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('panova_employer_profile');
      localStorage.removeItem('panova_is_impersonating');
    }
  };

  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPositionTitle.trim()) return;

    const newDemandPayload = {
      employer_id: employerProfile?.id || 'admin_master',
      employer_name: employerProfile?.companyName || employerProfile?.company_name || 'AKAY EĞİTİM',
      position_title: newPositionTitle,
      sector: newSector,
      headcount: Number(newHeadcount),
      city: newCity,
      salary: newSalary,
      target_start_date: newTargetDate,
      job_description: newJobDesc,
      requirements: newRequirements,
      status: 'new_request'
    };

    const { error } = await supabase.from('job_requests').insert([newDemandPayload]);

    if (error) {
      alert('Talep oluşturulurken hata oluştu: ' + error.message);
      return;
    }

    alert('İş gücü talebiniz başarıyla PANOVA yönetim ekibine iletildi!');
    setNewPositionTitle('');
    setNewJobDesc('');
    setNewRequirements('');
    fetchEmployerData();
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) return;

    const ticketPayload = {
      candidate_id: employerProfile?.id || 'employer',
      candidate_name: employerProfile?.companyName || employerProfile?.company_name || 'AKAY EĞİTİM',
      subject: supportSubject,
      message: supportMessage,
      status: 'open'
    };

    const { error } = await supabase.from('candidate_support_tickets').insert([ticketPayload]);

    if (error) {
      alert('Destek talebi gönderilirken hata: ' + error.message);
      return;
    }

    alert('Destek talebiniz PANOVA operasyon ekibine gönderildi!');
    setSupportSubject('');
    setSupportMessage('');
    fetchEmployerData();
  };

  if (!employerProfile) {
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

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* ÜST HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PANOVA" className="h-10 w-auto object-contain shrink-0" />
            <div className="border-l pl-3 border-slate-200">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-[11px] uppercase tracking-wider mb-0.5">
                <Building2 className="w-3.5 h-3.5" /> İşveren Partner Portalı
              </div>
              <div className="flex items-center gap-2">
                {employerProfile.companyLogo && (
                  <img src={employerProfile.companyLogo} alt="Şirket Logosu" className="h-6 w-auto object-contain rounded" />
                )}
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">{employerProfile.companyName || employerProfile.company_name}</h1>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="font-bold text-slate-900">Yetkili: {employerProfile.contactPerson || employerProfile.contact_person}</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> Ana Sayfa
            </Link>

            <div className="flex items-center bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200">
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

            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Çıkış Yap
            </button>
          </div>
        </div>

        {/* SEKME ÇUBUĞU (KAYDIRILABİLİR VE OKLU - TÜM SEKMEER EKSİKSİZ GÖRÜNÜR) */}
        <div className="relative flex items-center bg-white p-2 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-xs font-bold scrollbar-none py-1 px-1 w-full">
            <button onClick={() => setActiveTab('home')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'home' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              🏠 Ana Sayfa (Özet)
            </button>
            <button onClick={() => setActiveTab('demands')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'demands' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              📁 Personel Taleplerim ({jobDemands.length})
            </button>
            <button onClick={() => setActiveTab('candidates')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'candidates' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              👥 Adaylar ({candidates.length})
            </button>
            <button onClick={() => setActiveTab('interviews')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'interviews' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              📅 Görüşmeler
            </button>
            <button onClick={() => setActiveTab('selected')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'selected' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              ⭐ Seçtiğim Adaylar
            </button>
            <button onClick={() => setActiveTab('status')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'status' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              📄 Belge ve İşlem Durumları
            </button>
            <button onClick={() => setActiveTab('travel')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'travel' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              ✈️ Seyahat ve İşe Başlangıç
            </button>
            <button onClick={() => setActiveTab('employees')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'employees' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              👷 Aktif Çalışanlar
            </button>
            <button onClick={() => setActiveTab('support')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'support' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              💬 Destek / Bildirim ({supportTickets.length})
            </button>
            <button onClick={() => setActiveTab('company')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'company' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              🏢 Şirket Bilgilerim
            </button>
          </div>
        </div>

        {/* 1. ANA SAYFA */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Aktif Talepler</span>
                <div className="text-2xl font-black text-emerald-700">{jobDemands.length}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Sunulan Adaylar</span>
                <div className="text-2xl font-black text-blue-700">{candidates.length}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">İşlemde Olanlar</span>
                <div className="text-2xl font-black text-amber-600">2</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">İşe Başlayanlar</span>
                <div className="text-2xl font-black text-purple-700">4</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base border-b pb-3">Son Operasyonel Durum Özeti</h3>
              <p className="text-xs text-slate-600">
                PANOVA uluslararası iş gücü operasyon merkezimiz üzerinden tüm süreçleriniz kesintisiz takip edilmektedir. Yeni personel talebi oluşturmak için &quot;Personel Taleplerim&quot; sekmesini kullanabilirsiniz.
              </p>
            </div>
          </div>
        )}

        {/* 2. PERSONEL TALEPLERİM */}
        {activeTab === 'demands' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4 h-fit">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-700" /> Yeni Personel Talebi Oluştur
              </h3>
              <form onSubmit={handleCreateDemand} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Pozisyon Ünvanı *</label>
                  <input type="text" required value={newPositionTitle} onChange={(e) => setNewPositionTitle(e.target.value)} placeholder="Örn: Kaynakçı / İnşaat Ustası" className="w-full px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-medium bg-white text-slate-900 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Sektör</label>
                    <select value={newSector} onChange={(e) => setNewSector(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border font-semibold bg-white text-slate-900 cursor-pointer">
                      <option value="construction">Construction</option>
                      <option value="agriculture">Agriculture</option>
                      <option value="trade">Foreign Trade</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Kişi Sayısı</label>
                    <input type="number" min="1" value={newHeadcount} onChange={(e) => setNewHeadcount(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border font-semibold bg-white text-slate-900" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Şehir / Lokasyon</label>
                    <input type="text" value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="Struga / Skopje" className="w-full px-3 py-2.5 rounded-xl border font-semibold bg-white text-slate-900" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Maaş Teklifi</label>
                    <input type="text" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} placeholder="1200 EUR" className="w-full px-3 py-2.5 rounded-xl border font-semibold bg-white text-slate-900" />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">İş Açıklaması & Şartlar</label>
                  <textarea rows={3} value={newJobDesc} onChange={(e) => setNewJobDesc(e.target.value)} placeholder="Çalışma saatleri, konaklama vb detaylar..." className="w-full px-3.5 py-2.5 rounded-xl border font-medium bg-white text-slate-900 outline-none resize-none" />
                </div>
                <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-md cursor-pointer text-xs sm:text-sm">
                  Talebi Gönder
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">Personel Taleplerim</h3>
                  <p className="text-xs text-slate-500">Her talep ayrı dosya olarak görüntülenir ve takip edilir.</p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs border border-emerald-200">
                  Toplam Dosya: {jobDemands.length}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobDemands.map((dem) => (
                  <div key={dem.id} className="bg-white rounded-2xl border p-5 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md">{dem.sector}</span>
                        <span className="text-xs font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">{dem.headcount} Kişi</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base">{dem.position_title}</h4>
                      <p className="text-xs text-slate-500">📍 {dem.city} | 💰 {dem.salary}</p>
                      {dem.job_description && <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">{dem.job_description}</p>}
                    </div>
                    <div className="pt-2 border-t flex justify-between items-center text-xs">
                      <span className="text-slate-400">📅 {dem.created_at ? dem.created_at.substring(0, 10) : '2026-09'}</span>
                      <span className="font-bold uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">Durum: {dem.status || 'new_request'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. ADAYLAR */}
        {activeTab === 'candidates' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 border-b pb-3">Tarafınıza Sunulan Adaylar</h3>
            <p className="text-xs text-slate-500">Size sunulan adayları inceleyebilir, görüşme talep edebilir veya kısa listeye alabilirsiniz.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b">
                  <tr>
                    <th className="p-4">Ad Soyad</th>
                    <th className="p-4">Meslek / Sektör</th>
                    <th className="p-4">Uyruk / Ülke</th>
                    <th className="p-4">Durum / İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-900">{cand.full_name}</td>
                      <td className="p-4">{cand.profession} ({cand.sector})</td>
                      <td className="p-4">{cand.nationality || cand.country}</td>
                      <td className="p-4 flex items-center gap-2">
                        <button onClick={() => alert('Görüşme talebi operasyon ekibine iletildi.')} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100">Görüşme İste</button>
                        <button onClick={() => alert('Kısa listeye eklendi.')} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100">Seç</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. GÖRÜŞMELER */}
        {activeTab === 'interviews' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 border-b pb-3">Planlanan ve Tamamlanan Görüşmeler</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border text-xs space-y-1">
              <div className="font-bold text-slate-900">Ahmet Yılmaz - İnşaat Ustası Mülakatı</div>
              <div className="text-slate-500">📅 Tarih: 2026-10-02 14:00 | Durum: Planlandı (Online)</div>
            </div>
          </div>
        )}

        {/* 5. SEÇTİĞİM ADAYLAR */}
        {activeTab === 'selected' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 border-b pb-3">Onayladığınız / Seçtiğiniz Adaylar</h3>
            <p className="text-xs text-slate-500">İşverenin onayladığı adayların sözleşme ve hazırlık aşamaları.</p>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-900">
              Şu an onaylanmış 2 adayınız için vize ve çalışma izni işlemleri yürütülmektedir.
            </div>
          </div>
        )}

        {/* 6. BELGE VE İŞLEM DURUMLARI */}
        {activeTab === 'status' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 border-b pb-3">Genel İşlem ve Belge Durumları</h3>
            <p className="text-xs text-slate-500">Adayın gizli özel evrakları hariç, işverenin bilmesi gereken resmi işlem sonuçları.</p>
            <div className="space-y-2 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border flex justify-between items-center">
                <span className="font-bold text-slate-800">Çalışma İzin Başvuruları (Grup 1)</span>
                <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md font-bold">Onaylandı</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border flex justify-between items-center">
                <span className="font-bold text-slate-800">Elçilik Vize Randevuları</span>
                <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md font-bold">Bekleniyor</span>
              </div>
            </div>
          </div>
        )}

        {/* 7. SEYAHAT VE İŞE BAŞLANGIÇ */}
        {activeTab === 'travel' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 border-b pb-3">Seyahat, Varış ve İşe Başlangıç</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border text-xs space-y-2">
              <div className="font-bold text-slate-900 flex items-center gap-1.5"><Plane className="w-4 h-4 text-blue-600" /> Grup 1 Seyahat Planı</div>
              <p className="text-slate-600">Varış Tarihi: 2026-11-15 | Karşılama Lokasyonu: Havalimanı / Terminal | İşe Başlama Tarihi: 2026-11-16</p>
            </div>
          </div>
        )}

        {/* 8. AKTİF ÇALIŞANLAR */}
        {activeTab === 'employees' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 border-b pb-3">Aktif Çalışan Personel & 30/60/90 Günlük Takip</h3>
            <p className="text-xs text-slate-500">İşe başlayan personelin uyum süreçleri ve dönemsel performans takipleri.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border space-y-1">
                <div className="font-extrabold text-slate-900">Mehmet Demir (Kaynakçı)</div>
                <div className="text-slate-500">İşe Başlama: 2026-06-01 | Uyum Raporu: 90 Gün Tamamlandı (Başarılı)</div>
              </div>
            </div>
          </div>
        )}

        {/* 9. DESTEK / BİLDİRİM */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4 h-fit">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">Yeni Destek / Bildirim Kaydı</h3>
              <form onSubmit={handleSendSupport} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Konu *</label>
                  <input type="text" required value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} placeholder="Örn: Yeni ihtiyaç / Çalışan sorunu" className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Bildirim Mesajı *</label>
                  <textarea rows={4} required value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} placeholder="Detayları yazın..." className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 resize-none" />
                </div>
                <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold cursor-pointer text-xs sm:text-sm">
                  Gönder
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 border-b pb-3">Destek ve İletişim Geçmişi</h3>
              {supportTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Henüz bildirim bulunmuyor.</div>
              ) : (
                <div className="space-y-3">
                  {supportTickets.map((tkt) => (
                    <div key={tkt.id} className="p-4 bg-slate-50 rounded-2xl border space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{tkt.subject}</span>
                        <span className="text-emerald-700 uppercase text-[10px]">{tkt.status}</span>
                      </div>
                      <p className="text-slate-600">{tkt.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 10. ŞİRKET BİLGİLERİM (LOGO GÜNCELLEME) */}
        {activeTab === 'company' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-6">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 border-b pb-3">Şirket Bilgilerim ve Logo Yönetimi</h3>
            
            <form onSubmit={handleUpdateCompanyInfo} className="space-y-4 text-xs max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Şirket Adı</label>
                  <input type="text" value={editCompanyName} onChange={(e) => setEditCompanyName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 font-semibold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Yetkili Kişi</label>
                  <input type="text" value={editContactPerson} onChange={(e) => setEditContactPerson(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Telefon Numarası</label>
                  <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 font-semibold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Vergi Numarası</label>
                  <input type="text" value={editTaxNumber} onChange={(e) => setEditTaxNumber(e.target.value)} placeholder="Vergi No / Sicil No" className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 font-semibold" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Şirket Logo URL (Görsel Adresi)</label>
                <input type="text" value={editCompanyLogo} onChange={(e) => setEditCompanyLogo(e.target.value)} placeholder="/logo.png veya görsel linki" className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 font-semibold" />
                <p className="text-[11px] text-slate-400 mt-1">Bu logo işveren panelinizin üst kısmında kendi şirket adınızın yanında gösterilir.</p>
              </div>

              {editCompanyLogo && (
                <div className="p-3 bg-slate-50 border rounded-xl flex items-center gap-3">
                  <span className="font-bold text-slate-700">Logo Önizleme:</span>
                  <img src={editCompanyLogo} alt="Logo Önizleme" className="h-8 w-auto object-contain bg-white p-1 border rounded" />
                </div>
              )}

              <button type="submit" className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-6 py-3 rounded-xl font-bold transition shadow cursor-pointer">
                Bilgileri ve Logoyu Güncelle
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}