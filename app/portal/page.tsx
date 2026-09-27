'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { translations, Language, languages } from '@/lib/dictionary';
import { 
  Building2, Users, FileText, Plus, CheckCircle, Clock, ArrowLeft, Languages, 
  Trash2, Send, AlertCircle, CheckSquare, Briefcase, MapPin, Calendar, DollarSign, Download, Plane, ShieldCheck, HeartHandshake, UploadCloud, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

  const [employerProfile, setEmployerProfile] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panova_employer_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.companyName) return parsed;
        } catch (e) {}
      }
    }
    return {
      id: 'admin_master',
      companyName: 'PANOVA Construction Partners DOO',
      contactPerson: 'Aleksandar Petrov',
      phone: '+38970385792',
      country: 'North Macedonia',
      email: 'huseyinaksu@gmail.com',
      companyLogo: ''
    };
  });

  const [editCompanyName, setEditCompanyName] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCountry, setEditCountry] = useState('North Macedonia');
  const [editCompanyLogo, setEditCompanyLogo] = useState('');

  useEffect(() => {
    async function fetchLatestFromDB() {
      const targetEmail = employerProfile?.email || 'huseyinaksu@gmail.com';
      const { data, error } = await supabase
        .from('employers')
        .select('*')
        .eq('email', targetEmail)
        .maybeSingle();

      if (data) {
        const synced = {
          id: data.id,
          companyName: data.company_name || 'PANOVA Construction Partners DOO',
          contactPerson: data.contact_person || 'Aleksandar Petrov',
          email: data.email || targetEmail,
          phone: data.phone || '+38970385792',
          country: data.country || 'North Macedonia',
          companyLogo: data.logo || ''
        };
        setEmployerProfile(synced);
        localStorage.setItem('panova_employer_profile', JSON.stringify(synced));
      }
    }
    fetchLatestFromDB();
  }, []);

  useEffect(() => {
    if (employerProfile) {
      setEditCompanyName(employerProfile.companyName || employerProfile.company_name || 'PANOVA Construction Partners DOO');
      setEditContactPerson(employerProfile.contactPerson || employerProfile.contact_person || 'Aleksandar Petrov');
      setEditEmail(employerProfile.email || 'huseyinaksu@gmail.com');
      setEditPhone(employerProfile.phone || '+38970385792');
      setEditCountry(employerProfile.country || 'North Macedonia');
      setEditCompanyLogo(employerProfile.companyLogo || employerProfile.company_logo || employerProfile.logo || '');
    }
  }, [employerProfile]);

  const [activeTab, setActiveTab] = useState<
    'demands' | 'candidates' | 'contracts' | 'support' | 'company'
  >('demands');

  const [jobDemands, setJobDemands] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);

  const [selectedSector, setSelectedSector] = useState<'agriculture' | 'construction' | 'trade'>('construction');
  const [selectedPositions, setSelectedPositions] = useState<string[]>(['Kalıp Ustası']);
  const [customPosition, setCustomPosition] = useState('');
  const [demandHeadcount, setDemandHeadcount] = useState(5);
  const [demandCity, setDemandCity] = useState('Struga');
  const [demandSalary, setDemandSalary] = useState('1200 EUR');
  const [demandDuration, setDemandDuration] = useState('12 Ay (Sezonluk / Tam Zamanlı)');
  const [demandExperience, setDemandExperience] = useState('1 - 3 Yıl Tecrübe');
  const [demandLanguageReq, setDemandLanguageReq] = useState('Temel Seviye');
  const [demandAccommodation, setDemandAccommodation] = useState(true);
  const [demandFood, setDemandFood] = useState(true);
  const [demandTransport, setDemandTransport] = useState(true);
  const [demandNotes, setDemandNotes] = useState('');

  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const selectableLanguages = languages.filter((lang: { code: Language }) => lang.code !== currentLang);
  const activeLangObj = languages.find((l: { code: Language }) => l.code === currentLang);

  useEffect(() => {
    if (employerProfile) {
      fetchEmployerData();
    }
  }, [employerProfile]);

  const fetchEmployerData = async () => {
    const compName = employerProfile?.companyName || employerProfile?.company_name || 'PANOVA Construction Partners DOO';
    
    const { data: demData } = await supabase
      .from('job_requests')
      .select('*')
      .or(`employer_name.ilike.%${compName}%,employer_id.eq.${employerProfile?.id || 'none'}`)
      .order('created_at', { ascending: false });

    if (demData && demData.length > 0) {
      setJobDemands(demData);
    } else {
      setJobDemands([
        { id: '1', position_title: 'çoban', sector: 'agriculture', headcount: 1, city: 'Struga', salary: '1200 EUR', status: 'searching_candidates', created_at: '2026-09-23' },
        { id: '2', position_title: 'Electrician', sector: 'construction', headcount: 1, city: 'Struga', salary: '1200 EUR', status: 'presenting_candidates', created_at: '2026-09-20' }
      ]);
    }

    const { data: candData } = await supabase.from('job_candidates').select('*').order('created_at', { ascending: false });
    if (candData) setCandidates(candData);

    const { data: ticketData } = await supabase.from('candidate_support_tickets').select('*').order('created_at', { ascending: false });
    if (ticketData) setSupportTickets(ticketData);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setEditCompanyLogo(compressedDataUrl);
        };
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
      email: editEmail,
      phone: editPhone,
      country: editCountry,
      companyLogo: editCompanyLogo
    };

    try {
      const targetEmail = editEmail || employerProfile.email || 'huseyinaksu@gmail.com';
      
      const { data: existing } = await supabase
        .from('employers')
        .select('id')
        .eq('email', targetEmail)
        .maybeSingle();

      if (existing) {
        await supabase.from('employers').update({
          company_name: editCompanyName,
          contact_person: editContactPerson,
          phone: editPhone,
          country: editCountry,
          logo: editCompanyLogo
        }).eq('email', targetEmail);
      } else {
        await supabase.from('employers').insert([{
          company_name: editCompanyName,
          contact_person: editContactPerson,
          email: targetEmail,
          phone: editPhone,
          country: editCountry,
          logo: editCompanyLogo,
          password: 'panova2026'
        }]);
      }
    } catch (err) {
      console.error('DB Update Error:', err);
    }

    setEmployerProfile(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('panova_employer_profile', JSON.stringify(updated));
    }
    alert('Şirket bilgileriniz ve logonuz başarıyla kaydedildi!');
  };

  const handleLogout = () => {
    window.location.href = '/employer-login';
  };

  const handleCreateCorporateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPositions.length === 0 && !customPosition.trim()) {
      return;
    }

    const finalPositions = [...selectedPositions];
    if (customPosition.trim()) finalPositions.push(customPosition.trim());

    const newDemandPayload = {
      employer_id: employerProfile?.id || 'admin_master',
      employer_name: employerProfile?.companyName || employerProfile?.company_name || 'PANOVA Construction Partners DOO',
      position_title: finalPositions.join(', '),
      sector: selectedSector,
      headcount: Number(demandHeadcount),
      city: demandCity,
      salary: demandSalary,
      job_description: `Süre: ${demandDuration} | Tecrübe: ${demandExperience} | Dil: ${demandLanguageReq} | Konaklama: ${demandAccommodation ? 'Var' : 'Yok'} | Yemek: ${demandFood ? 'Var' : 'Yok'} | Ulaşım: ${demandTransport ? 'Var' : 'Yok'} | Notlar: ${demandNotes}`,
      status: 'searching_candidates'
    };

    await supabase.from('job_requests').insert([newDemandPayload]);

    setCustomPosition('');
    setDemandNotes('');
    fetchEmployerData();
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) return;

    const ticketPayload = {
      candidate_id: employerProfile?.id || 'employer',
      candidate_name: employerProfile?.companyName || employerProfile?.company_name || 'PANOVA Construction Partners DOO',
      subject: supportSubject,
      message: supportMessage,
      status: 'open'
    };

    await supabase.from('candidate_support_tickets').insert([ticketPayload]);

    setSupportSubject('');
    setSupportMessage('');
    fetchEmployerData();
  };

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* ÜST HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PANOVA" className="h-10 w-auto object-contain shrink-0" />
            <div className="border-l pl-3 border-slate-200">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-[11px] uppercase tracking-wider mb-0.5">
                <Building2 className="w-3.5 h-3.5" /> {t.empPortalTitle || 'İşveren Partner Portalı'}
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
              <span className="font-bold text-slate-900">Yetkili: {editContactPerson || employerProfile.contactPerson}</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome || 'Ana Sayfa'}
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
                {selectableLanguages.map((lang: { code: Language; flag: string; name: string }) => (
                  <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">{lang.flag} {lang.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {t.logout || 'Çıkış Yap'}
            </button>
          </div>
        </div>

        {/* 5 SEKME */}
        <div className="bg-white p-3 rounded-2xl border shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <button onClick={() => setActiveTab('demands')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'demands' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              📁 İş Gücü Taleplerim ({jobDemands.length})
            </button>
            <button onClick={() => setActiveTab('candidates')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'candidates' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              👥 Aday Havuzu & Eşleşmeler ({candidates.length})
            </button>
            <button onClick={() => setActiveTab('contracts')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'contracts' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              📄 Sözleşmeler & Evraklar
            </button>
            <button onClick={() => setActiveTab('support')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'support' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              💬 Destek & Operasyon ({supportTickets.length})
            </button>
            <button onClick={() => setActiveTab('company')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'company' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              🏢 Şirket Profilim
            </button>
          </div>
        </div>

        {/* 1. İŞ GÜCÜ TALEPLERİM */}
        {activeTab === 'demands' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 h-fit">
              <h3 className="text-base font-extrabold text-slate-950 border-b pb-3">Yeni İş Gücü Talebi Oluştur</h3>
              <form onSubmit={handleCreateCorporateDemand} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Pozisyon Ünvanı *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Örn: Kaynakçı / İnşaat Ustası" 
                    value={customPosition} 
                    onChange={(e) => setCustomPosition(e.target.value)} 
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Sektör</label>
                  <select 
                    value={selectedSector} 
                    onChange={(e) => setSelectedSector(e.target.value as any)} 
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950 font-semibold cursor-pointer"
                  >
                    <option value="construction">Construction</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="trade">Trade</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Kişi Sayısı</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={demandHeadcount} 
                    onChange={(e) => setDemandHeadcount(Number(e.target.value))} 
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Şehir / Lokasyon</label>
                  <input 
                    type="text" 
                    value={demandCity} 
                    onChange={(e) => setDemandCity(e.target.value)} 
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Maaş Teklifi</label>
                  <input 
                    type="text" 
                    value={demandSalary} 
                    onChange={(e) => setDemandSalary(e.target.value)} 
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">İş Açıklaması & Şartlar</label>
                  <textarea 
                    rows={3} 
                    value={demandNotes} 
                    onChange={(e) => setDemandNotes(e.target.value)} 
                    placeholder="Çalışma saatleri, konaklama vb detaylar..." 
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950 resize-none" 
                  />
                </div>
                <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold cursor-pointer transition shadow">
                  Talebi Gönder
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-sm">
                <h3 className="font-extrabold text-slate-950 text-base">Aktif İş Gücü Talepleriniz</h3>
                <span className="bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl text-xs font-bold border border-emerald-200">
                  Toplam Talep: {jobDemands.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobDemands.map((dem) => (
                  <div key={dem.id} className="bg-white rounded-2xl border p-5 shadow-sm space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md">{dem.sector}</span>
                        <span className="text-xs font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">{dem.headcount} Kişi</span>
                      </div>
                      <h4 className="font-extrabold text-slate-950 text-lg">{dem.position_title}</h4>
                      <p className="text-xs text-slate-500">📍 {dem.city} | 💰 {dem.salary}</p>
                      {dem.job_description && <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl">{dem.job_description}</p>}
                    </div>
                    <div className="pt-3 border-t flex justify-between items-center text-xs">
                      <span className="text-slate-400">📅 {dem.created_at ? dem.created_at.substring(0, 10) : '2026-09'}</span>
                      <span className="font-bold uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">Durum: {dem.status || 'searching_candidates'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. ADAY HAVUZU */}
        {activeTab === 'candidates' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-950 border-b pb-3">Aday Havuzu & Eşleşmeler</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-900 font-bold border-b">
                  <tr>
                    <th className="p-4">Ad Soyad</th>
                    <th className="p-4">Meslek / Sektör</th>
                    <th className="p-4">Uyruk / Ülke</th>
                    <th className="p-4">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-950">{cand.full_name}</td>
                      <td className="p-4">{cand.profession} ({cand.sector})</td>
                      <td className="p-4">{cand.nationality || cand.country}</td>
                      <td className="p-4 flex items-center gap-2">
                        <button onClick={() => {}} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100">Görüşme İste</button>
                        <button onClick={() => {}} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100">Seç</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. SÖZLEŞMELER */}
        {activeTab === 'contracts' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-950 border-b pb-3">Sözleşmeler ve Resmi Evraklar</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border text-xs space-y-2">
              <div className="font-bold text-slate-950">PANOVA - Partner Çerçeve Sözleşmesi 2026</div>
              <p className="text-slate-500">Durum: Onaylandı ve İmzalandı | İndir: PDF</p>
            </div>
          </div>
        )}

        {/* 4. DESTEK */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4 h-fit">
              <h3 className="text-base font-bold text-slate-950 border-b pb-3">Destek & Operasyon Talebi</h3>
              <form onSubmit={handleSendSupport} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Konu *</label>
                  <input type="text" required value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} placeholder="Örn: Evrak talebi / Çalışan değişimi" className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Mesajınız *</label>
                  <textarea rows={4} required value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} placeholder="Detayları yazın..." className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950 resize-none" />
                </div>
                <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold cursor-pointer text-xs sm:text-sm">
                  Gönder
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-950 border-b pb-3">Destek Geçmişi</h3>
              {supportTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Henüz bildirim bulunmuyor.</div>
              ) : (
                <div className="space-y-3">
                  {supportTickets.map((tkt) => (
                    <div key={tkt.id} className="p-4 bg-slate-50 rounded-2xl border space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-950">
                        <span>{tkt.subject}</span>
                        <span className="text-emerald-700 uppercase text-[10px]">{tkt.status}</span>
                      </div>
                      <p className="text-slate-700">{tkt.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. ŞİRKET PROFİLİM */}
        {activeTab === 'company' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
            <h3 className="text-lg font-extrabold text-slate-950 border-b pb-3">Şirket Bilgilerim ve Logo Yönetimi</h3>
            
            <form onSubmit={handleUpdateCompanyInfo} className="space-y-4 text-xs max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Şirket Adı</label>
                  <input type="text" value={editCompanyName} onChange={(e) => setEditCompanyName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950 font-semibold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Yetkili Kişi</label>
                  <input type="text" value={editContactPerson} onChange={(e) => setEditContactPerson(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950 font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">E-Posta Adresi</label>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950 font-semibold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Telefon Numarası</label>
                  <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950 font-semibold" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Ülke</label>
                <select value={editCountry} onChange={(e) => setEditCountry(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950 font-semibold cursor-pointer">
                  <option value="North Macedonia">North Macedonia</option>
                  <option value="Turkey">Turkey</option>
                  <option value="Albania">Albania</option>
                  <option value="Kosovo">Kosovo</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Şirket Logosu Yükle (Dosya Seç)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-slate-700 font-semibold cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
                />
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