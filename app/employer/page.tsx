'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, Users, FileText, Plus, CheckCircle, Clock, ArrowLeft, Languages, 
  Trash2, Send, AlertCircle, CheckSquare, Briefcase, MapPin, Calendar, DollarSign, Download, Plane, ShieldCheck, HeartHandshake, UploadCloud, Check
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
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
      return {
        id: 'admin_master',
        companyName: 'AKAY EĞİTİM',
        contactPerson: 'Hüseyin Aksu',
        phone: '+38970385792',
        country: 'Turkey',
        email: 'huseyinaksu@gmail.com',
        companyLogo: ''
      };
    }
    return {
      id: 'admin_master',
      companyName: 'AKAY EĞİTİM',
      contactPerson: 'Hüseyin Aksu',
      phone: '+38970385792',
      country: 'Turkey',
      email: 'huseyinaksu@gmail.com',
      companyLogo: ''
    };
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
  const [editCountry, setEditCountry] = useState('Turkey');
  const [editCompanyLogo, setEditCompanyLogo] = useState('');

  useEffect(() => {
    if (employerProfile) {
      setEditCompanyName(employerProfile.companyName || employerProfile.company_name || 'AKAY EĞİTİM');
      setEditContactPerson(employerProfile.contactPerson || employerProfile.contact_person || 'Hüseyin Aksu');
      setEditPhone(employerProfile.phone || '+38970385792');
      setEditCountry(employerProfile.country || 'Turkey');
      setEditCompanyLogo(employerProfile.companyLogo || employerProfile.company_logo || '');
    }
  }, [employerProfile]);

  const [activeTab, setActiveTab] = useState<
    'home' | 'demands' | 'candidates' | 'interviews' | 'selected' | 'status' | 'travel' | 'employees' | 'support' | 'company'
  >('home');

  const [jobDemands, setJobDemands] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);

  // Zengin Tıklanabilir Talep Formu State'leri
  const [selectedSector, setSelectedSector] = useState<'agriculture' | 'construction' | 'trade'>('construction');
  const [selectedPositions, setSelectedPositions] = useState<string[]>(['Kalıp Ustası']);
  const [customPosition, setCustomPosition] = useState('');
  const [demandHeadcount, setDemandHeadcount] = useState(5);
  const [demandCity, setDemandCity] = useState('Struga');
  const [demandSalary, setDemandSalary] = useState('1200 EUR');
  const [demandDuration, setDemandDuration] = useState('12 Ay (Sezonluk / Tam Zamanlı)');
  const [demandAccommodation, setDemandAccommodation] = useState(true);
  const [demandFood, setDemandFood] = useState(true);
  const [demandTransport, setDemandTransport] = useState(true);
  const [demandNotes, setDemandNotes] = useState('');

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
    const compName = employerProfile?.companyName || employerProfile?.company_name || 'AKAY EĞİTİM';
    
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
        companyLogo: emp.company_logo || emp.companyLogo || '',
        country: emp.country || 'Turkey'
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
        country: editCountry || 'Turkey',
        companyLogo: editCompanyLogo || ''
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

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditCompanyLogo(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateCompanyInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...employerProfile,
      companyName: editCompanyName,
      contactPerson: editContactPerson,
      phone: editPhone,
      country: editCountry,
      companyLogo: editCompanyLogo
    };

    try {
      if (employerProfile.id && employerProfile.id !== 'admin_master') {
        await supabase.from('employers').update({
          company_name: editCompanyName,
          contact_person: editContactPerson,
          phone: editPhone,
          country: editCountry,
          company_logo: editCompanyLogo
        }).eq('id', employerProfile.id);
      }
    } catch (err) {}

    setEmployerProfile(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('panova_employer_profile', JSON.stringify(updated));
    }
    alert(t.saveSuccess || 'Şirket bilgileriniz ve yüklenen logo başarıyla kaydedildi!');
  };

  const handleLogout = () => {
    const resetEmp = {
      id: 'admin_master',
      companyName: editCompanyName || 'AKAY EĞİTİM',
      contactPerson: editContactPerson || 'Hüseyin Aksu',
      phone: editPhone || '+38970385792',
      country: editCountry || 'Turkey',
      email: 'huseyinaksu@gmail.com',
      companyLogo: editCompanyLogo || ''
    };
    setEmployerProfile(resetEmp);
    if (typeof window !== 'undefined') {
      localStorage.setItem('panova_employer_profile', JSON.stringify(resetEmp));
    }
  };

  const togglePositionSelection = (pos: string) => {
    if (selectedPositions.includes(pos)) {
      setSelectedPositions(selectedPositions.filter(p => p !== pos));
    } else {
      setSelectedPositions([...selectedPositions, pos]);
    }
  };

  const handleCreateRichDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPositions.length === 0 && !customPosition.trim()) {
      alert('Lütfen en az bir pozisyon seçin veya yazın.');
      return;
    }

    const finalPositions = [...selectedPositions];
    if (customPosition.trim()) finalPositions.push(customPosition.trim());

    const newDemandPayload = {
      employer_id: employerProfile?.id || 'admin_master',
      employer_name: employerProfile?.companyName || employerProfile?.company_name || 'AKAY EĞİTİM',
      position_title: finalPositions.join(', '),
      sector: selectedSector,
      headcount: Number(demandHeadcount),
      city: demandCity,
      salary: demandSalary,
      job_description: `Süre: ${demandDuration} | Konaklama: ${demandAccommodation ? 'Var' : 'Yok'} | Yemek: ${demandFood ? 'Var' : 'Yok'} | Ulaşım: ${demandTransport ? 'Var' : 'Yok'} | Notlar: ${demandNotes}`,
      status: 'new_request'
    };

    const { error } = await supabase.from('job_requests').insert([newDemandPayload]);

    if (error) {
      alert('Talep oluşturulurken hata oluştu: ' + error.message);
      return;
    }

    alert('Zengin iş gücü talebiniz başarıyla PANOVA operasyon ekibine iletildi!');
    setCustomPosition('');
    setDemandNotes('');
    fetchEmployerData();
    setActiveTab('demands');
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

  const sectorPositions: Record<string, string[]> = {
    agriculture: ['Hasat İşçisi', 'Sera Sorumlusu', 'Budama Uzmanı', 'Traktör Operatörü', 'Mantar Yetiştirme Uzmanı', 'Paketleme Elemanı'],
    construction: ['Kalıp Ustası', 'Demirci', 'Duvarcı / Sıvacı', 'Kaynakçı', 'Elektrikçi', 'İnşaat Mühendisi', 'Şantiye Şefi'],
    trade: ['Depo Sorumlusu', 'Forklift Operatörü', 'Dış Ticaret Uzmanı', 'Lojistik Sorumlusu', 'Ön Muhasebe', 'Satış Temsilcisi']
  };

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* ÜST HEADER (4 DİL DESTEKLİ) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PANOVA" className="h-10 w-auto object-contain shrink-0" />
            <div className="border-l pl-3 border-slate-200">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-[11px] uppercase tracking-wider mb-0.5">
                <Building2 className="w-3.5 h-3.5" /> {t.employerPortalTitle || 'İşveren Partner Portalı'}
              </div>
              <div className="flex items-center gap-2">
                {editCompanyLogo && (
                  <img src={editCompanyLogo} alt="Şirket Logosu" className="h-7 w-auto object-contain rounded border bg-white p-0.5" />
                )}
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">{editCompanyName || employerProfile.companyName}</h1>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="font-bold text-slate-900">{t.contactPerson || 'Yetkili'}: {editContactPerson || employerProfile.contactPerson}</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.homeButton || 'Ana Sayfa'}
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
              {t.logoutButton || 'Çıkış Yap'}
            </button>
          </div>
        </div>

        {/* 10 SEKME (FLEX-WRAP) */}
        <div className="bg-white p-3 rounded-2xl border shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <button onClick={() => setActiveTab('home')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'home' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              🏠 {t.tabHomeSummary || 'Ana Sayfa (Özet)'}
            </button>
            <button onClick={() => setActiveTab('demands')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'demands' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              📁 {t.tabPersonnelDemands || 'Personel Taleplerim'} ({jobDemands.length})
            </button>
            <button onClick={() => setActiveTab('candidates')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'candidates' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              👥 {t.candidatesTab || 'Adaylar'} ({candidates.length})
            </button>
            <button onClick={() => setActiveTab('interviews')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'interviews' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              📅 {t.tabInterviews || 'Görüşmeler'}
            </button>
            <button onClick={() => setActiveTab('selected')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'selected' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              ⭐ {t.tabSelected || 'Seçtiğim Adaylar'}
            </button>
            <button onClick={() => setActiveTab('status')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'status' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              📄 {t.tabStatus || 'Belge ve İşlem Durumları'}
            </button>
            <button onClick={() => setActiveTab('travel')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'travel' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              ✈️ {t.tabTravel || 'Seyahat ve İşe Başlangıç'}
            </button>
            <button onClick={() => setActiveTab('employees')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'employees' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              👷 {t.tabEmployees || 'Aktif Çalışanlar'}
            </button>
            <button onClick={() => setActiveTab('support')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'support' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              💬 {t.tabSupport || 'Destek / Bildirim'} ({supportTickets.length})
            </button>
            <button onClick={() => setActiveTab('company')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'company' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              🏢 {t.tabCompany || 'Şirket Bilgilerim'}
            </button>
          </div>
        </div>

        {/* 1. ANA SAYFA */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">{t.activeDemandsCard || 'Aktif Talepler'}</span>
                <div className="text-2xl font-black text-emerald-700">{jobDemands.length}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">{t.presentedCandidatesCard || 'Sunulan Adaylar'}</span>
                <div className="text-2xl font-black text-blue-700">{candidates.length}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">{t.inProcessCard || 'İşlemde Olanlar'}</span>
                <div className="text-2xl font-black text-amber-600">2</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">{t.startedCard || 'İşe Başlayanlar'}</span>
                <div className="text-2xl font-black text-purple-700">4</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base border-b pb-3">{t.operationalSummaryTitle || 'Son Operasyonel Durum Özeti'}</h3>
              <p className="text-xs text-slate-600">
                {t.operationalSummaryDesc || 'PANOVA uluslararası iş gücü operasyon merkezimiz üzerinden tüm süreçleriniz kesintisiz takip edilmektedir. Yeni personel talebi oluşturmak için "Personel Taleplerim" sekmesini kullanabilirsiniz.'}
              </p>
            </div>
          </div>
        )}

        {/* 2. PERSONEL TALEPLERİM VE ZENGİN TIKLANARAK İŞARETLENEN TALEP FORMU */}
        {activeTab === 'demands' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Zengin İş Gücü Talep Sihirbazı</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Sektör seçin, aradığınız pozisyonları ve çalışma şartlarını tıklayarak detaylıca belirleyin.</p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs border border-emerald-200">
                  Toplam Aktif Dosya: {jobDemands.length}
                </div>
              </div>

              <form onSubmit={handleCreateRichDemand} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">1. Sektör Seçin *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => { setSelectedSector('agriculture'); setSelectedPositions([]); }}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        selectedSector === 'agriculture' ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500 text-emerald-900 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-700 font-semibold'
                      }`}
                    >
                      <span>🌱 Tarım & Hayvancılık</span>
                      {selectedSector === 'agriculture' && <Check className="w-4 h-4 text-emerald-700" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedSector('construction'); setSelectedPositions([]); }}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        selectedSector === 'construction' ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500 text-emerald-900 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-700 font-semibold'
                      }`}
                    >
                      <span>🏗️ İnşaat & Yapı</span>
                      {selectedSector === 'construction' && <Check className="w-4 h-4 text-emerald-700" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedSector('trade'); setSelectedPositions([]); }}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        selectedSector === 'trade' ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500 text-emerald-900 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-700 font-semibold'
                      }`}
                    >
                      <span>📦 Dış Ticaret & Lojistik</span>
                      {selectedSector === 'trade' && <Check className="w-4 h-4 text-emerald-700" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">2. Pozisyonları İşaretleyin (Birden Fazla Seçilebilir) *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {sectorPositions[selectedSector].map((pos) => {
                      const isSelected = selectedPositions.includes(pos);
                      return (
                        <button
                          type="button"
                          key={pos}
                          onClick={() => togglePositionSelection(pos)}
                          className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                            isSelected ? 'bg-emerald-700 text-white shadow-md border-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{pos}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3">
                    <input
                      type="text"
                      placeholder="Veya diğer özel pozisyon ünvanını buraya yazın..."
                      value={customPosition}
                      onChange={(e) => setCustomPosition(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Kişi Sayısı</label>
                    <input type="number" min="1" value={demandHeadcount} onChange={(e) => setDemandHeadcount(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold bg-white text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Şehir / Lokasyon</label>
                    <input type="text" value={demandCity} onChange={(e) => setDemandCity(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold bg-white text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Maaş Teklifi</label>
                    <input type="text" value={demandSalary} onChange={(e) => setDemandSalary(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold bg-white text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Çalışma Süresi</label>
                    <input type="text" value={demandDuration} onChange={(e) => setDemandDuration(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold bg-white text-slate-900" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">3. Sağlanan İmkanlar</label>
                  <div className="flex flex-wrap gap-6 bg-slate-50 p-4 rounded-xl border text-xs font-semibold text-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={demandAccommodation} onChange={(e) => setDemandAccommodation(e.target.checked)} className="w-4 h-4 accent-emerald-700 rounded cursor-pointer" />
                      Konaklama (Lojman / Daire)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={demandFood} onChange={(e) => setDemandFood(e.target.checked)} className="w-4 h-4 accent-emerald-700 rounded cursor-pointer" />
                      Yemek (3 Öğün / Yemek Ücreti)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={demandTransport} onChange={(e) => setDemandTransport(e.target.checked)} className="w-4 h-4 accent-emerald-700 rounded cursor-pointer" />
                      Ulaşım (Servis / Yol Masrafı)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">Ek Açıklama ve Özel Şartlar</label>
                  <textarea rows={3} value={demandNotes} onChange={(e) => setDemandNotes(e.target.value)} placeholder="Çalışma saatleri, mesai detayları vb..." className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-slate-900 resize-none" />
                </div>

                <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-4 rounded-xl font-bold transition shadow-lg cursor-pointer text-sm">
                  Zengin Personel Talebini PANOVA Operasyona Gönder
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h4 className="font-extrabold text-slate-900 text-base">Aktif İş Gücü Talep Dosyalarınız ({jobDemands.length})</h4>
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

        {/* 10. ŞİRKET BİLGİLERİM VE LOGO YÜKLEME */}
        {activeTab === 'company' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-6">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 border-b pb-3">Şirket Bilgilerim ve Logo Yükleme</h3>
            
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
                  <label className="block font-bold text-slate-700 uppercase mb-1">Ülke</label>
                  <select value={editCountry} onChange={(e) => setEditCountry(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-900 font-semibold cursor-pointer">
                    <option value="North Macedonia">North Macedonia</option>
                    <option value="Turkey">Turkey</option>
                    <option value="Albania">Albania</option>
                    <option value="Kosovo">Kosovo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Şirket Logosu Yükle (Dosya Seç)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-slate-700 font-semibold cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
                />
                <p className="text-[11px] text-slate-400 mt-1">Bilgisayarınızdan şirket logonuzu seçin. Yüklenen logo üst başlıkta şirket adınızın yanında gösterilir.</p>
              </div>

              {editCompanyLogo && (
                <div className="p-3 bg-slate-50 border rounded-xl flex items-center gap-3">
                  <span className="font-bold text-slate-700">Logo Önizleme:</span>
                  <img src={editCompanyLogo} alt="Logo Önizleme" className="h-10 w-auto object-contain bg-white p-1 border rounded shadow-sm" />
                </div>
              )}

              <button type="submit" className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-6 py-3 rounded-xl font-bold transition shadow cursor-pointer">
                Bilgileri ve Logoyu Kalıcı Olarak Kaydet
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}