'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Building2, PlusCircle, FileText, Clock, Users, ArrowLeft, Languages, 
  Send, Plane, UserPlus, LogIn, CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function EmployerPortalPage() {
  const router = useRouter();
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

  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('panova_employer_auth') === 'true';
    }
    return false;
  });

  const [employer, setEmployer] = useState<any | null>(() => {
    if (typeof window !== 'undefined') {
      const savedEmp = localStorage.getItem('panova_employer_data');
      if (savedEmp) {
        try { return JSON.parse(savedEmp); } catch { return null; }
      }
    }
    return null;
  });

  // Auth Modu: 'login' veya 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Register State
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regContactPerson, setRegContactPerson] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCountry, setRegCountry] = useState('North Macedonia');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const [requests, setRequests] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'requests' | 'candidates' | 'interviews' | 'selected' | 'travel' | 'employees' | 'support' | 'profile'>('requests');

  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';
  
  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

  useEffect(() => {
    if (authenticated && employer?.id) {
      fetchEmployerData(employer.id);
    }
  }, [authenticated]);

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
      let currentEmployer = null;

      if (email === 'demo@panova.com' && password === 'employer2026') {
        const { data: existingEmployers } = await supabase
          .from('employers')
          .select('*')
          .eq('email', 'demo@panova.com');

        currentEmployer = existingEmployers && existingEmployers.length > 0 ? existingEmployers[0] : null;

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
      } else {
        const { data, error } = await supabase
          .from('employers')
          .select('*')
          .eq('email', email)
          .eq('password', password)
          .single();

        if (error || !data) {
          alert('Invalid email or password! (Demo: demo@panova.com / employer2026)');
          setLoading(false);
          return;
        }
        currentEmployer = data;
      }

      if (currentEmployer) {
        setEmployer(currentEmployer);
        setAuthenticated(true);
        localStorage.setItem('panova_employer_auth', 'true');
        localStorage.setItem('panova_employer_data', JSON.stringify(currentEmployer));
        fetchEmployerData(currentEmployer.id);
      }
    } catch (err: any) {
      alert('Login Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);

    try {
      const { error } = await supabase.from('employers').insert([
        {
          company_name: regCompanyName,
          contact_person: regContactPerson,
          email: regEmail.trim().toLowerCase(),
          phone: regPhone,
          country: regCountry,
          password: regPassword,
          status: 'active'
        }
      ]);

      if (error) throw error;
      setRegSuccess(true);
    } catch (err: any) {
      alert('Kayıt Hatası: ' + err.message);
    } finally {
      setRegLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setEmployer(null);
    localStorage.removeItem('panova_employer_auth');
    localStorage.removeItem('panova_employer_data');
  };

  const fetchEmployerData = async (employerId: string) => {
    const { data: reqs } = await supabase
      .from('job_requests')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (reqs) setRequests(reqs);

    const { data: cands } = await supabase
      .from('job_candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (cands) setCandidates(cands);

    const { data: tickets } = await supabase
      .from('candidate_support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (tickets) setSupportTickets(tickets);
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
        candidate_id: employer.id,
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
      <div className={`min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center bg-slate-800 rounded-xl px-3 py-2 border border-slate-700 shadow-sm">
          <Languages className="w-4 h-4 text-slate-300 mr-2 rtl:ml-2" />
          <select
            value={currentLang}
            onChange={(e) => changeLanguage(e.target.value as Language)}
            className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value={currentLang} className="font-bold">
              {activeLangObj?.flag} {activeLangObj?.name}
            </option>
            {selectableLanguages.map((lang) => (
              <option key={lang.code} value={lang.code} className="text-slate-900">{lang.flag} {lang.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-6">
          <div className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-2xl font-bold text-xs">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setRegSuccess(false); }}
              className={`py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${authMode === 'login' ? 'bg-[#2e7d32] text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${authMode === 'register' ? 'bg-[#2e7d32] text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <UserPlus className="w-4 h-4" /> Sign Up
            </button>
          </div>

          <div className="w-12 h-12 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>

          {authMode === 'login' ? (
            <div className="space-y-4 text-left">
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 text-center">Employer Login Portal</h1>
                <p className="text-slate-500 text-xs text-center mt-1">Sign in with your company email and password.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Company Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium outline-none"
                    placeholder="demo@panova.com"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.passwordLabel || 'Password'} *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium outline-none"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-md mt-2 text-xs cursor-pointer"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border text-center">
                Demo Login: <strong>demo@panova.com</strong> / <strong>employer2026</strong>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 text-center">Employer Registration</h1>
                <p className="text-slate-500 text-xs text-center mt-1">Register your company to submit workforce demands.</p>
              </div>

              {regSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="font-extrabold text-slate-900 text-sm">Registration Successful!</h3>
                  <p className="text-xs text-slate-600">Your company account has been created. You can now sign in.</p>
                  <button
                    onClick={() => { setAuthMode('login'); setEmail(regEmail); setRegSuccess(false); }}
                    className="w-full bg-[#2e7d32] text-white py-2.5 rounded-xl font-bold text-xs mt-2"
                  >
                    Go to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Company Name *</label>
                    <input type="text" required value={regCompanyName} onChange={(e) => setRegCompanyName(e.target.value)} placeholder="Panova Tarim DOO" className="w-full px-3 py-2.5 rounded-xl border outline-none bg-white font-medium text-slate-900" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Contact Person *</label>
                      <input type="text" required value={regContactPerson} onChange={(e) => setRegContactPerson(e.target.value)} placeholder="Full Name" className="w-full px-3 py-2.5 rounded-xl border outline-none bg-white font-medium text-slate-900" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase mb-1">Phone *</label>
                      <input type="tel" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+389..." className="w-full px-3 py-2.5 rounded-xl border outline-none bg-white font-medium text-slate-900" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Company Email *</label>
                    <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="info@company.com" className="w-full px-3 py-2.5 rounded-xl border outline-none bg-white font-medium text-slate-900" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">Password *</label>
                    <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="••••••••" className="w-full px-3 py-2.5 rounded-xl border outline-none bg-white font-medium text-slate-900" />
                  </div>
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-md mt-2 text-xs cursor-pointer"
                  >
                    {regLoading ? 'Registering...' : 'Complete Registration'}
                  </button>
                </form>
              )}
            </div>
          )}

          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:underline pt-2 border-t">
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <span className="text-[10px] sm:text-xs font-bold text-[#2e7d32] bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
              {employer?.country || 'Employer Dashboard'}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">{employer?.company_name}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200 shadow-sm">
              <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
              <select
                value={currentLang}
                onChange={(e) => changeLanguage(e.target.value as Language)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value={currentLang} className="font-bold">
                  {activeLangObj?.flag} {activeLangObj?.name}
                </option>
                {selectableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-slate-900">{lang.flag} {lang.name}</option>
                ))}
              </select>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border"
            >
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" /> {t.returnHome}
            </Link>

            <button
              onClick={() => setShowNewRequestModal(true)}
              className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-md inline-flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> {t.newDemandBtn}
            </button>

            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {t.logoutBtn}
            </button>
          </div>
        </div>

        {/* Metrik Kartları */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-[11px] sm:text-xs font-bold uppercase">{t.totalDemands}</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{requests.length}</div>
            </div>
            <FileText className="w-9 h-9 sm:w-10 sm:h-10 text-emerald-600 bg-emerald-50 p-2 rounded-xl" />
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-[11px] sm:text-xs font-bold uppercase">{t.requestedHeadcount}</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {requests.reduce((acc, r) => acc + (r.headcount || 0), 0)}
              </div>
            </div>
            <Users className="w-9 h-9 sm:w-10 sm:h-10 text-blue-600 bg-blue-50 p-2 rounded-xl" />
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-slate-500 text-[11px] sm:text-xs font-bold uppercase">{t.activeProcesses}</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length}
              </div>
            </div>
            <Clock className="w-9 h-9 sm:w-10 sm:h-10 text-amber-600 bg-amber-50 p-2 rounded-xl" />
          </div>
        </div>

        {/* Sekmeler */}
        <div className="flex flex-wrap items-center gap-2 border-b pb-3 text-xs font-bold">
          <button onClick={() => setActiveTab('requests')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition ${activeTab === 'requests' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>📁 {t.empTabRequests}</button>
          <button onClick={() => setActiveTab('candidates')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition ${activeTab === 'candidates' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>👥 {t.empTabCandidates} ({candidates.length})</button>
          <button onClick={() => setActiveTab('interviews')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition ${activeTab === 'interviews' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>📅 {t.interviews}</button>
          <button onClick={() => setActiveTab('selected')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition ${activeTab === 'selected' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>⭐ {t.empTabSelected}</button>
          <button onClick={() => setActiveTab('travel')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition ${activeTab === 'travel' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>✈️ {t.empTabTravel}</button>
          <button onClick={() => setActiveTab('employees')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition ${activeTab === 'employees' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>🛡️ {t.employeesTab}</button>
          <button onClick={() => setActiveTab('support')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition ${activeTab === 'support' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>💬 {t.empTabSupport}</button>
          <button onClick={() => setActiveTab('profile')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition ${activeTab === 'profile' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>🏢 {t.empTabProfile}</button>
        </div>

        {/* Tab 1: Personel Taleplerim */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 font-bold text-slate-900 text-sm sm:text-base">
              {t.dossierTitle}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right text-xs sm:text-sm text-slate-700">
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
                        <div className="text-[11px] text-slate-500 font-normal uppercase">{req.sector}</div>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{req.headcount} {t.personCount}</td>
                      <td className="p-4 font-semibold text-emerald-700">€{req.monthly_net_salary} / {t.monthText}</td>
                      <td className="p-4 text-[11px] sm:text-xs space-y-1 text-slate-600">
                        <div>{t.accommodation}: {req.accommodation_provided ? '✅' : '❌'}</div>
                        <div>{t.foodAllowance} / {t.flightTicket}: {req.food_provided ? '✅' : '❌'} | {req.flight_covered ? '✅' : '❌'}</div>
                      </td>
                      <td className="p-4 font-medium text-slate-700">{req.target_start_date || 'Flexible'}</td>
                      <td className="p-4">
                        <span className="px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                          {req.status || 'new_request'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 text-xs">
                        {t.empNoRequests}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Adaylar / Eşleşmeler */}
        {activeTab === 'candidates' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.empCandidatesPoolTitle}</h3>
            {candidates.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs font-bold">{t.empNoCandidates}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidates.map((cand) => (
                  <div key={cand.id} className="p-4 bg-slate-50 rounded-2xl border flex flex-col justify-between space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center font-extrabold text-lg shrink-0">
                        {cand.full_name?.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{cand.full_name}</h4>
                        <p className="text-xs text-slate-500">{t.professionLabel}: <strong>{cand.profession}</strong> | {t.sectorLabel}: {cand.sector}</p>
                        <p className="text-xs text-emerald-700 mt-1">{t.expectedSalaryLabel}: €{cand.expected_salary || '---'} / {t.monthText}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t text-xs">
                      <button onClick={() => alert('Görüşme talebi yönetime iletildi!')} className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-[#2e7d32] border border-emerald-200 py-2.5 rounded-xl font-bold transition cursor-pointer">
                        📅 {t.empInterviewRequestBtn}
                      </button>
                      <button onClick={() => alert('Aday kısa listeye alındı!')} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold transition cursor-pointer">
                        ⭐ {t.empShortlistBtn}
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
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.empInterviewsTitle}</h3>
            <div className="p-10 text-center text-slate-400 font-bold text-xs">{t.empNoInterviews}</div>
          </div>
        )}

        {/* Tab 4: Seçtiğim Adaylar */}
        {activeTab === 'selected' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.empSelectedTitle}</h3>
            <div className="p-10 text-center text-slate-400 font-bold text-xs">{t.empNoSelected}</div>
          </div>
        )}

        {/* Tab 5: Seyahat ve Başlangıç */}
        {activeTab === 'travel' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
              <Plane className="w-5 h-5 text-sky-600" /> {t.empTravelTitle}
            </h3>
            <div className="p-10 text-center text-slate-400 font-bold text-xs">{t.empNoTravel}</div>
          </div>
        )}

        {/* Tab 6: Aktif Çalışanlar */}
        {activeTab === 'employees' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.empEmployeesTitle}</h3>
            <div className="p-10 text-center text-slate-400 font-bold text-xs">{t.empNoEmployees}</div>
          </div>
        )}

        {/* Tab 7: Destek */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.empSupportFormTitle}</h3>
              <form onSubmit={handleSendSupport} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.empSupportSubjectLabel}</label>
                  <input type="text" required value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} placeholder="Örn: Yeni Personel İhtiyacı" className="w-full px-3.5 py-3 rounded-xl border outline-none text-slate-900 font-medium bg-white text-xs sm:text-sm" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.empSupportMessageLabel}</label>
                  <textarea rows={4} required value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} placeholder="Talebinizi detaylı yazın..." className="w-full px-3.5 py-3 rounded-xl border outline-none text-slate-900 font-medium bg-white text-xs sm:text-sm" />
                </div>
                <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-md">
                  {t.empSupportSubmitBtn}
                </button>
              </form>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.empSupportHistoryTitle}</h3>
              {supportTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">{t.empNoSupportTickets}</div>
              ) : (
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {supportTickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 bg-slate-50 rounded-2xl border space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{ticket.subject}</span>
                        <span className="text-emerald-700 uppercase text-[10px]">{ticket.status}</span>
                      </div>
                      <p className="text-slate-600">{ticket.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 8: Şirket Bilgilerim */}
        {activeTab === 'profile' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm max-w-2xl space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3">{t.empProfileTitle}</h3>
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border">
                <span className="font-bold text-slate-500 uppercase block mb-1">{t.empProfileCompanyName}</span>
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">{employer?.company_name}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border">
                <span className="font-bold text-slate-500 uppercase block mb-1">{t.empProfileContactPerson}</span>
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">{employer?.contact_person}</span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Yeni Talep Oluşturma Modalı */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl p-4 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-xl font-extrabold text-slate-900">{t.modalDemandTitle}</h3>
              <button type="button" onClick={() => setShowNewRequestModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer p-1">✕</button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{t.sectorLabel}</label>
                  <select
                    value={newRequest.sector}
                    onChange={(e) => {
                      const sec = e.target.value;
                      const defaultPos = positionOptions[sec]?.[0] || 'Other';
                      setNewRequest({ ...newRequest, sector: sec, positionTitle: defaultPos });
                    }}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white outline-none cursor-pointer"
                  >
                    <option value="construction">Construction</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="hr">General HR</option>
                    <option value="trade">Foreign Trade</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">{t.professionLabel}</label>
                  <select
                    value={newRequest.positionTitle}
                    onChange={(e) => setNewRequest({ ...newRequest, positionTitle: e.target.value })}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white outline-none cursor-pointer"
                  >
                    {(positionOptions[newRequest.sector] || ['Other']).map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>
              </div>

              {newRequest.positionTitle === 'Other' && (
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{t.specifyCustomPos}</label>
                  <input type="text" required value={newRequest.customPositionTitle} onChange={(e) => setNewRequest({ ...newRequest, customPositionTitle: e.target.value })} placeholder="e.g. Scaffolder" className="w-full px-3.5 py-3 rounded-xl border outline-none text-slate-900 bg-white" />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{t.colHeadcount} *</label>
                  <input type="number" min="1" required value={newRequest.headcount} onChange={(e) => setNewRequest({ ...newRequest, headcount: Number(e.target.value) })} className="w-full px-3.5 py-3 rounded-xl border outline-none text-slate-900 bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{t.colSalary} *</label>
                  <input type="number" required value={newRequest.monthlyNetSalary} onChange={(e) => setNewRequest({ ...newRequest, monthlyNetSalary: e.target.value })} placeholder="850" className="w-full px-3.5 py-3 rounded-xl border outline-none text-slate-900 bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1">{t.colTargetStart}</label>
                  <input type="date" value={newRequest.targetStartDate} onChange={(e) => setNewRequest({ ...newRequest, targetStartDate: e.target.value })} className="w-full px-3.5 py-3 rounded-xl border outline-none text-slate-900 bg-white" />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border space-y-2">
                <div className="font-bold text-slate-800 mb-2">{t.colBenefits}:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-medium text-slate-800 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer p-1">
                    <input type="checkbox" checked={newRequest.accommodationProvided} onChange={(e) => setNewRequest({ ...newRequest, accommodationProvided: e.target.checked })} className="w-4 h-4 accent-[#2e7d32]" /> {t.accommodation}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1">
                    <input type="checkbox" checked={newRequest.foodProvided} onChange={(e) => setNewRequest({ ...newRequest, foodProvided: e.target.checked })} className="w-4 h-4 accent-[#2e7d32]" /> {t.foodAllowance}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1">
                    <input type="checkbox" checked={newRequest.transportProvided} onChange={(e) => setNewRequest({ ...newRequest, transportProvided: e.target.checked })} className="w-4 h-4 accent-[#2e7d32]" /> {t.localTransport}
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-1">
                    <input type="checkbox" checked={newRequest.flightCovered} onChange={(e) => setNewRequest({ ...newRequest, flightCovered: e.target.checked })} className="w-4 h-4 accent-[#2e7d32]" /> {t.flightTicket}
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">{t.specialReqs}</label>
                <textarea rows={2} value={newRequest.specialRequirements} onChange={(e) => setNewRequest({ ...newRequest, specialRequirements: e.target.value })} placeholder="e.g. 3+ years experience" className="w-full px-3.5 py-3 rounded-xl border outline-none text-slate-900 bg-white" />
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