'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, Building2, PlusCircle, FileText, Clock, Users, ArrowLeft, Languages, Send } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

export default function EmployerPortalPage() {
  // İlk girişte 'en' (İngilizce) başlar, daha önce seçildiyse localStorage'dan okur (Tüm sayfalarla ortak: panova_portal_lang)
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('panova_portal_lang') as Language;
      if (saved && ['tr', 'en', 'sq', 'ar'].includes(saved)) return saved;
    }
    return 'en';
  });

  // Diğer sayfalardan veya sekmelerden gelen dil değişikliklerini reaktif olarak dinler ve senkronize eder
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
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

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
        if (currentEmployer) fetchRequests(currentEmployer.id);
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
          fetchRequests(data.id);
        }
      }
    } catch (err: any) {
      alert('Login Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async (employerId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_requests')
      .select('*')
      .eq('employer_id', employerId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRequests(data);
    }
    setLoading(false);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employer) {
      alert('Employer session not found. Please log in again.');
      return;
    }

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

      setNewRequest({
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

      fetchRequests(employer.id);
    } catch (err: any) {
      alert('Error creating request: ' + err.message);
    } finally {
      setSubmitting(false);
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
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <span className="text-xs font-bold text-[#2e7d32] bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">
              {employer?.country || 'Employer Dashboard'}
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{employer?.company_name}</h1>
          </div>

          <div className="flex items-center gap-3">
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
              className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-4 py-2.5 rounded-xl text-sm font-bold transition shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" /> {t.newDemandBtn}
            </button>

            <button
              onClick={() => setAuthenticated(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
            >
              {t.logoutBtn}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 font-bold text-slate-900 text-lg flex items-center justify-between">
            <span>{t.dossierTitle}</span>
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

        {showNewRequestModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 my-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <h3 className="text-xl font-extrabold text-slate-900">{t.modalDemandTitle}</h3>
                <button
                  type="button"
                  onClick={() => setShowNewRequestModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
                >
                  ✕
                </button>
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
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white text-sm outline-none focus:ring-2 focus:ring-[#2e7d32] cursor-pointer"
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
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white text-sm outline-none focus:ring-2 focus:ring-[#2e7d32] cursor-pointer"
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
                    <input
                      type="text"
                      required
                      value={newRequest.customPositionTitle}
                      onChange={(e) => setNewRequest({ ...newRequest, customPositionTitle: e.target.value })}
                      placeholder="e.g. Scaffolder, CNC Operator"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white text-sm outline-none focus:ring-2 focus:ring-[#2e7d32]"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">{t.colHeadcount} *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newRequest.headcount}
                      onChange={(e) => setNewRequest({ ...newRequest, headcount: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white text-sm outline-none focus:ring-2 focus:ring-[#2e7d32]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">{t.colSalary} *</label>
                    <input
                      type="number"
                      required
                      value={newRequest.monthlyNetSalary}
                      onChange={(e) => setNewRequest({ ...newRequest, monthlyNetSalary: e.target.value })}
                      placeholder="850"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white text-sm outline-none focus:ring-2 focus:ring-[#2e7d32]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">{t.colTargetStart}</label>
                    <input
                      type="date"
                      value={newRequest.targetStartDate}
                      onChange={(e) => setNewRequest({ ...newRequest, targetStartDate: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white text-sm outline-none focus:ring-2 focus:ring-[#2e7d32]"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-800 mb-2">{t.colBenefits}:</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium text-slate-800">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRequest.accommodationProvided}
                        onChange={(e) => setNewRequest({ ...newRequest, accommodationProvided: e.target.checked })}
                      />
                      {t.accommodation}
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRequest.foodProvided}
                        onChange={(e) => setNewRequest({ ...newRequest, foodProvided: e.target.checked })}
                      />
                      {t.foodAllowance}
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRequest.transportProvided}
                        onChange={(e) => setNewRequest({ ...newRequest, transportProvided: e.target.checked })}
                      />
                      {t.localTransport}
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newRequest.flightCovered}
                        onChange={(e) => setNewRequest({ ...newRequest, flightCovered: e.target.checked })}
                      />
                      {t.flightTicket}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">{t.specialReqs}</label>
                  <textarea
                    rows={2}
                    value={newRequest.specialRequirements}
                    onChange={(e) => setNewRequest({ ...newRequest, specialRequirements: e.target.value })}
                    placeholder="e.g. 3+ years experience"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 font-medium bg-white text-sm outline-none focus:ring-2 focus:ring-[#2e7d32]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold transition shadow-lg flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> {submitting ? t.creatingDossier : t.submitDossierBtn}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}