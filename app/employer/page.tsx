'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Lock, Building2, PlusCircle, FileText, Clock, Users, ArrowLeft, Languages, 
  Send, Calendar, CheckCircle2, AlertCircle, Plane, Briefcase, UserCheck, Phone, Mail, MessageSquare 
} from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function EmployerPortalPage() {
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panova_portal_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) return saved;
    }
    return 'en';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('panova_portal_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) {
        setCurrentLang(saved);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const timer = setInterval(handleStorageChange, 150);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(timer);
    };
  }, []);

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('panova_portal_lang', lang);
    }
  };

  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employer, setEmployer] = useState<any | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  
  // Sekme Yönetimi
  const [activeTab, setActiveTab] = useState<'requests' | 'candidates' | 'interviews' | 'selected' | 'travel' | 'employees' | 'support' | 'profile'>('requests');

  // Destek formu state'leri
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';
  
  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

  const [newRequest, setNewRequest] = useState({
    sector: 'construction',
    positionTitle: 'Electrician',
    customPositionTitle: '',
    headcount: 1,
    targetStartDate: '',
    monthlyNetSalary: '',
    workingHours: '40 hours/week',
    overtimeConditions: '',
    accommodationProvided: true,
    foodProvided: true,
    transportProvided: true,
    flightCovered: true,
    requiredExperienceYears: 0,
    requiredCertificate: false,
    requiredLanguage: '',
    specialRequirements: '',
  });

  const positionOptions: Record<string, string[]> = {
    construction: ['Electrician', 'Mason / Plasterer', 'Welder', 'Plumber', 'Carpenter', 'Heavy Machinery Operator', 'General Laborer', 'Other'],
    agriculture: ['Fruit Picker', 'Tractor Driver', 'Greenhouse Worker', 'Irrigation Technician', 'Farm Supervisor', 'Other'],
    hr: ['HR Specialist', 'Recruiter', 'Administrative Assistant', 'Translator / Interpreter', 'Other'],
    trade: ['Logistics Coordinator', 'Warehouse Worker', 'Forklift Driver', 'Export Specialist', 'Other'],
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (email === 'demo@panova.com' && password === 'employer2026') {
        const { data: existingEmployers } = await supabase
          .from('employers')
          .select('*')
          .eq('email', 'demo@panova.com');

        let currentEmployer = existingEmployers && existingEmployers.length > 0 ? existingEmployers[0] : null;

        if (!currentEmployer) {
          const { data: newEmp, error: createErr } = await supabase
            .from('employers')
            .insert([
              {
                company_name: 'PANOVA Construction Partners DOO',
                contact_person: 'Aleksandar Petrov',
                email: 'demo@panova.com',
                phone: '+389 70 123 456',
                country: 'North Macedonia',
                password: 'employer2026'
              }
            ])
            .select()
            .single();

          if (createErr) throw createErr;
          currentEmployer = newEmp;
        }

        setEmployer(currentEmployer);
        setAuthenticated(true);
        if (currentEmployer) fetchEmployerData(currentEmployer.id);
      } else {
        const { data, error } = await supabase
          .from('employers')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .single();

        if (error || !data) {
          alert('Invalid email or password! (Demo: demo@panova.com / employer2026)');
        } else {
          setEmployer(data);
          setAuthenticated(true);
          fetchEmployerData(data.id);
        }
      }
    } catch (err: any) {
      alert('Login Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployerData = async (employerId: string) => {
    setLoading(true);
    // 1. Talepleri Çek
    const { data: reqs } = await supabase
      .from('job_requests')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (reqs) setRequests(reqs);

    // 2. Aday Havuzunu Çek (Tüm adaylar veya eşleşenler)
    const { data: cands } = await supabase
      .from('job_candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (cands) setCandidates(cands);

    // 3. Destek Taleplerini Çek
    const { data: tickets } = await supabase
      .from('candidate_support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (tickets) setSupportTickets(tickets);

    setLoading(false);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employer) return;

    setSubmitting(true);
    try {
      const finalPosition = newRequest.positionTitle === 'Other' 
        ? newRequest.customPositionTitle 
        : newRequest.positionTitle;

      const payload = {
        employer_id: employer.id,
        employer_name: employer.company_name,
        sector: newRequest.sector,
        position_title: finalPosition || 'General Worker',
        headcount: Number(newRequest.headcount) || 1,
        target_start_date: newRequest.targetStartDate || null,
        monthly_net_salary: Number(newRequest.monthlyNetSalary) || 0,
        working_hours: newRequest.workingHours,
        overtime_conditions: newRequest.overtimeConditions,
        accommodation_provided: newRequest.accommodationProvided,
        food_provided: newRequest.foodProvided,
        transport_provided: newRequest.transportProvided,
        flight_covered: newRequest.flightCovered,
        required_experience_years: Number(newRequest.requiredExperienceYears) || 0,
        required_certificate: newRequest.requiredCertificate,
        required_language: newRequest.requiredLanguage,
        special_requirements: newRequest.specialRequirements,
        status: 'new_request'
      };

      const { error } = await supabase.from('job_requests').insert([payload]);
      if (error) throw error;

      alert('Job Request Dossier Created Successfully!');
      setShowNewRequestModal(false);
      fetchEmployerData(employer.id);
    } catch (err: any) {
      alert('Error creating request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) return;

    const { error } = await supabase.from('candidate_support_tickets').insert([
      {
        candidate_id: employer.id, // İşveren ID
        candidate_name: `${employer.company_name} (İşveren)`,
        subject: supportSubject,
        message: supportMessage,
        status: 'open'
      }
    ]);

    if (!error) {
      alert('Destek talebiniz başarıyla gönderildi!');
      setSupportSubject('');
      setSupportMessage('');
      fetchEmployerData(employer.id);
    } else {
      alert('Hata: ' + error.message);
    }
  };

  if (!authenticated) {
    return (
      <div className={`min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="absolute top-6 right-6 flex items-center bg-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-700 shadow-sm">
          <Languages className="w-4 h-4 text-slate-300 mr-1.5 rtl:ml-1.5" />
          <select
            value={currentLang}
            onChange={(e) => changeLanguage(e.target.value as Language)}
            className="bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value={currentLang} className="font-bold">
              {activeLangObj?.flag} {activeLangObj?.name}
            </option>
            {selectableLanguages.map((lang) => (
              <option key={lang.code} value={lang.code} className="text-slate-900">{lang.flag} {lang.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <div className="w-14 h-14 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">{t.empPortalTitle}</h1>
          <p className="text-slate-500 text-sm mb-6">{t.empPortalSub}</p>

          <form onSubmit={handleLogin} className="space-y-4 text-left rtl:text-right">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Company Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                placeholder="demo@panova.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.passwordLabel}</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium focus:ring-2 focus:ring-[#2e7d32] outline-none text-sm"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-lg mt-2 text-sm cursor-pointer"
            >
              {loading ? t.submitting : t.signInBtn}
            </button>
          </form>
          <div className="mt-4 text-xs text-slate-600 bg-slate-100 p-2.5 rounded-xl border border-slate-200">
            Demo Login: <strong>demo@panova.com</strong> / <strong>employer2026</strong>
          </div>
          <Link href="/" className="inline-flex items-center gap-1.5 mt-6 text-sm text-slate-500 hover:underline">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 p-4 sm:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <span className="text-xs font-bold text-[#2e7d32] bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
              {employer?.country || 'Employer Dashboard'}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{employer?.company_name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition border"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
            </Link>

            <div className="relative flex items-center bg-slate-100 rounded-lg px-2.5 py-1.5 border border-slate-200 shadow-sm">
              <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
              <select
                value={currentLang}
                onChange={(e) => changeLanguage(e.target.value as Language)}
                className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value={currentLang} className="font-bold">
                  {activeLangObj?.flag} {activeLangObj?.name}
                </option>
                {selectableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-slate-900">{lang.flag} {lang.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowNewRequestModal(true)}
              className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> {t.newDemandBtn}
            </button>

            <button
              onClick={() => setAuthenticated(false)}
              className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {t.logoutBtn}
            </button>
          </div>
        </div>

        {/* Metrik Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-xs font-bold uppercase">{t.totalDemands}</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">{requests.length}</div>
            </div>
            <FileText className="w-10 h-10 text-emerald-600 bg-emerald-50 p-2 rounded-xl" />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-xs font-bold uppercase">{t.requestedHeadcount}</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">
                {requests.reduce((acc, r) => acc + (r.headcount || 0), 0)}
              </div>
            </div>
            <Users className="w-10 h-10 text-blue-600 bg-blue-50 p-2 rounded-xl" />
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-xs font-bold uppercase">{t.activeProcesses}</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">
                {requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length}
              </div>
            </div>
            <Clock className="w-10 h-10 text-amber-600 bg-amber-50 p-2 rounded-xl" />
          </div>
        </div>

        {/* Sekmeler (Tabs) */}
        <div className="flex flex-wrap gap-2 border-b pb-2 overflow-x-auto text-xs font-bold">
          <button onClick={() => setActiveTab('requests')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'requests' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📁 Personel Taleplerim
          </button>
          <button onClick={() => setActiveTab('candidates')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'candidates' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            👥 Adaylar / Eşleşmeler ({candidates.length})
          </button>
          <button onClick={() => setActiveTab('interviews')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'interviews' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📅 Görüşmeler
          </button>
          <button onClick={() => setActiveTab('selected')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'selected' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            ⭐ Seçtiğim Adaylar
          </button>
          <button onClick={() => setActiveTab('travel')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'travel' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            ✈️ Seyahat ve Başlangıç
          </button>
          <button onClick={() => setActiveTab('employees')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'employees' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            🛡️ Aktif Çalışanlar (30/60/90 Gün)
          </button>
          <button onClick={() => setActiveTab('support')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'support' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            💬 Destek / Bildirim
          </button>
          <button onClick={() => setActiveTab('profile')} className={`px-4 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'profile' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            🏢 Şirket Bilgilerim
          </button>
        </div>

        {/* Tab 1: Personel Taleplerim */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 font-bold text-slate-900 text-lg">
              {t.dossierTitle}
            </div>
            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading dossiers...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right text-sm text-slate-700">
                  <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-4">{t.colPosSec}</th>
                      <th className="p-4">{t.colHeadcount}</th>
                      <th className="p-4">{t.colSalary}</th>
                      <th className="p-4">{t.colBenefits}</th>
                      <th className="p-4">{t.colTargetStart}</th>
                      <th className="p-4">{t.colDemandStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-bold text-slate-900">
                          {req.position_title}
                          <div className="text-xs text-slate-500 font-normal uppercase">{req.sector}</div>
                        </td>
                        <td className="p-4 font-bold text-slate-800">{req.headcount} Person(s)</td>
                        <td className="p-4 font-semibold text-emerald-700">€{req.monthly_net_salary} / mo</td>
                        <td className="p-4 text-xs space-y-1 text-slate-600">
                          <div>{t.accommodation}: {req.accommodation_provided ? '✅ Covered' : '❌ No'}</div>
                          <div>{t.foodAllowance} / {t.flightTicket}: {req.food_provided ? '✅' : '❌'} | {req.flight_covered ? '✅' : '❌'}</div>
                        </td>
                        <td className="p-4 text-xs font-medium text-slate-700">{req.target_start_date || 'Flexible'}</td>
                        <td className="p-4">
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                            {req.status || 'new_request'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {requests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          No active workforce demands found. Click "{t.newDemandBtn}" above to submit one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Adaylar / Eşleşmeler */}
        {activeTab === 'candidates' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Taleplerinize Sunulan Aday Havuzu</h3>
            {candidates.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs">Henüz eşleşen aday bulunmuyor.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidates.map((cand) => (
                  <div key={cand.id} className="p-4 bg-slate-50 rounded-2xl border flex flex-col justify-between space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center font-extrabold text-lg">
                        {cand.full_name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{cand.full_name}</h4>
                        <p className="text-xs text-slate-500">Uzmanlık: <strong>{cand.profession}</strong> | Sektör: {cand.sector}</p>
                        <p className="text-xs text-emerald-700 mt-1">Beklenti: €{cand.expected_salary || '---'} / ay</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <button onClick={() => alert('Görüşme talebi yönetime iletildi!')} className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-[#2e7d32] border border-emerald-200 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
                        📅 Görüşme İste
                      </button>
                      <button onClick={() => alert('Aday kısa listeye alındı!')} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-xl text-xs font-bold transition cursor-pointer">
                        ⭐ Kısa Listeye Al
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Görüşmeler */}
        {activeTab === 'interviews' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Planlanan ve Tamamlanan Görüşmeler</h3>
            <div className="p-10 text-center text-slate-400 font-bold text-xs">
              Planlanmış aktif mülakat randevunuz bulunmamaktadır.
            </div>
          </div>
        )}

        {/* Tab 4: Seçtiğim Adaylar */}
        {activeTab === 'selected' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Onayladığınız ve İşlemde Olan Adaylar</h3>
            <div className="p-10 text-center text-slate-400 font-bold text-xs">
              Henüz onayladığınız bir aday bulunmuyor.
            </div>
          </div>
        )}

        {/* Tab 5: Seyahat ve Başlangıç */}
        {activeTab === 'travel' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-600" /> Uçuş, Varış ve Karşılama Bilgileri
            </h3>
            <div className="p-10 text-center text-slate-400 font-bold text-xs">
              Vize ve biletleme işlemleri tamamlanan personellerin seyahat detayları burada listelenecektir.
            </div>
          </div>
        )}

        {/* Tab 6: Aktif Çalışanlar */}
        {activeTab === 'employees' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">İşe Başlayan Personel ve 30/60/90 Gün Takibi</h3>
            <div className="p-10 text-center text-slate-400 font-bold text-xs">
              Şirketinizde aktif çalışan personel bulunmuyor.
            </div>
          </div>
        )}

        {/* Tab 7: Destek / Bildirim */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Operasyonel Destek Talebi Aç</h3>
              <form onSubmit={handleSendSupport} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Konu / Başlık</label>
                  <input type="text" required value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} placeholder="Örn: Yeni Personel İhtiyacı veya Çalışan Talebi" className="w-full px-3 py-2.5 text-xs rounded-xl border outline-none text-slate-900 font-medium bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mesajınız</label>
                  <textarea rows={4} required value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} placeholder="Talebinizi detaylı yazın..." className="w-full px-3 py-2.5 text-xs rounded-xl border outline-none text-slate-900 font-medium bg-white" />
                </div>
                <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3 rounded-xl font-bold text-xs transition cursor-pointer shadow-md">
                  Destek Talebi Gönder
                </button>
              </form>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Destek Geçmişim</h3>
              {supportTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Aktif destek kaydınız yok.</div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 bg-slate-50 rounded-2xl border space-y-1">
                      <div className="flex justify-between font-bold text-xs text-slate-900">
                        <span>{ticket.subject}</span>
                        <span className="text-emerald-700 uppercase text-[10px]">{ticket.status}</span>
                      </div>
                      <p className="text-xs text-slate-600">{ticket.message}</p>
                      {ticket.admin_reply && (
                        <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                          <strong>PANOVA Operasyon:</strong> {ticket.admin_reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 8: Şirket Bilgilerim */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm max-w-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-3">Firma ve İletişim Bilgilerim</h3>
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border">
                <span className="font-bold text-slate-500 uppercase block mb-1">Şirket Unvanı</span>
                <span className="font-extrabold text-slate-900 text-sm">{employer?.company_name}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border">
                <span className="font-bold text-slate-500 uppercase block mb-1">Yetkili Kişi</span>
                <span className="font-extrabold text-slate-900 text-sm">{employer?.contact_person || 'Aleksandar Petrov'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-xl border">
                  <span className="font-bold text-slate-500 uppercase block mb-1">E-Posta</span>
                  <span className="font-bold text-slate-900">{employer?.email}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border">
                  <span className="font-bold text-slate-500 uppercase block mb-1">Telefon</span>
                  <span className="font-bold text-slate-900">{employer?.phone || '+389...'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Yeni Talep Oluşturma Modalı */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="text-xl font-extrabold text-slate-900">{t.modalDemandTitle}</h3>
              <button type="button" onClick={() => setShowNewRequestModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">{t.sectorLabel}</label>
                  <select
                    value={newRequest.sector}
                    onChange={(e) => {
                      const sec = e.target.value;
                      const defaultPos = positionOptions[sec]?.[0] || 'Other';
                      setNewRequest({ ...newRequest, sector: sec, positionTitle: defaultPos });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white text-sm outline-none cursor-pointer"
                  >
                    <option value="construction">Construction</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="hr">General HR</option>
                    <option value="trade">Foreign Trade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">{t.professionLabel}</label>
                  <select
                    value={newRequest.positionTitle}
                    onChange={(e) => setNewRequest({ ...newRequest, positionTitle: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white text-sm outline-none cursor-pointer"
                  >
                    {(positionOptions[newRequest.sector] || ['Other']).map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
              </div>

              {newRequest.positionTitle === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">{t.specifyCustomPos}</label>
                  <input type="text" required value={newRequest.customPositionTitle} onChange={(e) => setNewRequest({ ...newRequest, customPositionTitle: e.target.value })} placeholder="e.g. Scaffolder" className="w-full px-3 py-2.5 rounded-xl border text-sm" />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">{t.colHeadcount} *</label>
                  <input type="number" min="1" required value={newRequest.headcount} onChange={(e) => setNewRequest({ ...newRequest, headcount: Number(e.target.value) })} className="w-full px-3 py-2.5 rounded-xl border text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">{t.colSalary} *</label>
                  <input type="number" required value={newRequest.monthlyNetSalary} onChange={(e) => setNewRequest({ ...newRequest, monthlyNetSalary: e.target.value })} placeholder="850" className="w-full px-3 py-2.5 rounded-xl border text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">{t.colTargetStart}</label>
                  <input type="date" value={newRequest.targetStartDate} onChange={(e) => setNewRequest({ ...newRequest, targetStartDate: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border text-sm" />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border space-y-2">
                <div className="text-xs font-bold text-slate-800 mb-2">{t.colBenefits}:</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium text-slate-800">
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={newRequest.accommodationProvided} onChange={(e) => setNewRequest({ ...newRequest, accommodationProvided: e.target.checked })} /> {t.accommodation}</label>
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={newRequest.foodProvided} onChange={(e) => setNewRequest({ ...newRequest, foodProvided: e.target.checked })} /> {t.foodAllowance}</label>
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={newRequest.transportProvided} onChange={(e) => setNewRequest({ ...newRequest, transportProvided: e.target.checked })} /> {t.localTransport}</label>
                  <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={newRequest.flightCovered} onChange={(e) => setNewRequest({ ...newRequest, flightCovered: e.target.checked })} /> {t.flightTicket}</label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">{t.specialReqs}</label>
                <textarea rows={2} value={newRequest.specialRequirements} onChange={(e) => setNewRequest({ ...newRequest, specialRequirements: e.target.value })} placeholder="e.g. 3+ years experience" className="w-full px-3 py-2 rounded-xl border text-sm" />
              </div>

              <button type="submit" disabled={submitting} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer">
                <Send className="w-4 h-4" /> {submitting ? t.creatingDossier : t.submitDossierBtn}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}