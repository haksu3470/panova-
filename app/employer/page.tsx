'use client';

import AuthGuard from '@/components/auth/AuthGuard';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { EmployerWriteError, toEmployerProfileView, type EmployerRow } from '@/lib/employerProfile';
import { employerService } from '@/lib/services/employerService';
import { 
  Building2, Users, FileText, Plus, CheckCircle, Clock, ArrowLeft, 
  Trash2, Send, AlertCircle, CheckSquare, Briefcase, MapPin, Calendar, DollarSign, Download, Plane, ShieldCheck, HeartHandshake, UploadCloud, Check, Video, Star, CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { Language, translations } from '@/lib/dictionary';
import { dateLocale, fill, optionLabel, portalUi, positionLabel } from '@/lib/portal-ui-copy';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import { readStoredLanguage, syncDocumentLanguage, writeStoredLanguage } from '@/lib/site-language';
import { EuropeanCountryOptions } from '@/components/site/EuropeanCountryOptions';

function EmployerPortalInner() {
  const [currentLang, setCurrentLang] = useState<Language>('tr');

  const t = translations[currentLang] || translations.tr;
  const ui = portalUi[currentLang];
  const isRtl = currentLang === 'ar';
  const experienceOptions = [
    { value: 'none', label: t.expOpt1 || '' },
    { value: '1-3', label: t.expOpt2 || '' },
    { value: '3-5', label: t.expOpt3 || '' },
    { value: '5+', label: t.expOpt4 || '' },
  ];

  useEffect(() => {
    const apply = () => {
      const next = readStoredLanguage('tr');
      setCurrentLang(next);
      syncDocumentLanguage(next);
    };
    apply();
    window.addEventListener('storage', apply);
    return () => window.removeEventListener('storage', apply);
  }, []);

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    writeStoredLanguage(lang);
  };

  const [employerProfile, setEmployerProfile] = useState<ReturnType<typeof toEmployerProfileView> | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileErrorCode, setProfileErrorCode] = useState('');
  const [profileErrorDetail, setProfileErrorDetail] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const [editCompanyName, setEditCompanyName] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editCompanyLogo, setEditCompanyLogo] = useState('');

  const rememberEmployer = useCallback((row: EmployerRow) => {
    const synced = toEmployerProfileView(row);
    setEmployerProfile(synced);
    setEditCompanyName(synced.companyName);
    setEditContactPerson(synced.contactPerson);
    setEditEmail(synced.email);
    setEditPhone(synced.phone);
    setEditCountry(synced.country);
    setEditCompanyLogo(synced.companyLogo);
    setProfileErrorCode('');
    setProfileErrorDetail('');
    localStorage.setItem('panova_employer_profile', JSON.stringify(synced));
  }, []);

  const profileMessage = (code: string, fallback = '') => {
    if (code === 'email_taken') return t.profileEmailTaken || fallback;
    if (code === 'not_linked') return t.profileNotLinked || fallback;
    const failed = t.profileSaveFailed || '';
    if ((code === 'invalid' || code === 'write_failed') && fallback) return `${failed} ${fallback}`;
    return failed;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const row = await employerService.getMyEmployer();
        if (cancelled) return;
        rememberEmployer(row);
      } catch (err) {
        console.error('Veri çekme hatası:', err);
        if (cancelled) return;
        setEmployerProfile(null);
        setProfileErrorCode(err instanceof EmployerWriteError ? err.code : 'write_failed');
        setProfileErrorDetail(err instanceof Error ? err.message : '');
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rememberEmployer]);

  const [activeTab, setActiveTab] = useState<
    'home' | 'demands' | 'candidates' | 'interviews' | 'selected' | 'status' | 'travel' | 'employees' | 'support' | 'company'
  >('home');

  const [jobDemands, setJobDemands] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);

  const [selectedSector, setSelectedSector] = useState<'agriculture' | 'construction' | 'trade'>('construction');
  const [selectedPositions, setSelectedPositions] = useState<string[]>(['formwork']);
  const [customPosition, setCustomPosition] = useState('');
  const [demandHeadcount, setDemandHeadcount] = useState(5);
  const [demandCity, setDemandCity] = useState('Struga');
  const [demandSalary, setDemandSalary] = useState('1200 EUR');
  const [demandDuration, setDemandDuration] = useState<string | null>(null);
  const [demandExperience, setDemandExperience] = useState('1-3');
  const [demandLanguageReq, setDemandLanguageReq] = useState('none');
  const durationValue = demandDuration ?? ui.durationDefault;
  const [demandAccommodation, setDemandAccommodation] = useState(true);
  const [demandFood, setDemandFood] = useState(true);
  const [demandTransport, setDemandTransport] = useState(true);
  const [demandNotes, setDemandNotes] = useState('');

  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  const fetchEmployerData = useCallback(async () => {
    if (!employerProfile?.id) return;
    const compName = employerProfile.companyName;
    const filter = compName
      ? `employer_name.ilike.%${compName}%,employer_id.eq.${employerProfile.id}`
      : `employer_id.eq.${employerProfile.id}`;

    const { data: demData } = await supabase
      .from('job_requests')
      .select('*')
      .or(filter)
      .order('created_at', { ascending: false });

    if (demData && demData.length > 0) {
      setJobDemands(demData);
    } else {
      setJobDemands([
        { id: '1', position_title: ui.demoConstruction, sector: 'construction', headcount: 8, city: 'Skopje', salary: '1300 EUR', status: 'searching_candidates', created_at: '2026-09-20' },
        { id: '2', position_title: ui.demoAgriculture, sector: 'agriculture', headcount: 15, city: 'Struga', salary: '950 EUR', status: 'new_request', created_at: '2026-09-22' }
      ]);
    }

    const { data: candData } = await supabase.from('job_candidates').select('*').order('created_at', { ascending: false });
    if (candData) {
      setCandidates(candData);
      setSelectedCandidates(candData.filter((c: any) => c.status === 'approved' || c.status === 'selected' || c.is_selected));
    }

    const { data: intData } = await supabase.from('interviews').select('*').order('created_at', { ascending: false });
    if (intData && intData.length > 0) {
      setInterviews(intData);
    } else {
      setInterviews([
        { id: '1', candidate_name: 'Ahmet Yilmaz', position: ui.demoFormwork, scheduled_at: '2026-11-10T11:00:00Z', status: 'scheduled' },
        { id: '2', candidate_name: 'Mehmet Demir', position: ui.demoHarvestLead, scheduled_at: '2026-11-12T07:30:00Z', status: 'scheduled' }
      ]);
    }

    const { data: ticketData } = await supabase.from('candidate_support_tickets').select('*').order('created_at', { ascending: false });
    if (ticketData) setSupportTickets(ticketData);
  }, [employerProfile, ui]);

  useEffect(() => {
    if (employerProfile) {
      fetchEmployerData();
    }
  }, [employerProfile, fetchEmployerData]);

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
    if (!employerProfile?.id || profileSaving || profileLoading) return;
    setProfileSaving(true);
    setProfileErrorCode('');
    setProfileErrorDetail('');
    try {
      const saved = await employerService.saveMyCompanyProfile({
        companyName: editCompanyName,
        contactPerson: editContactPerson,
        email: editEmail,
        phone: editPhone,
        country: editCountry,
        logo: editCompanyLogo,
      }, employerProfile.id);
      rememberEmployer(saved);
      alert(t.profileUpdatedSuccess || '');
    } catch (err) {
      console.error('Servis Güncelleme Hatası:', err);
      const code = err instanceof EmployerWriteError ? err.code : 'write_failed';
      const detail = err instanceof Error ? err.message : '';
      setProfileErrorCode(code);
      setProfileErrorDetail(detail);
      alert(profileMessage(code, detail));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/employer-login';
  };

  const togglePositionSelection = (pos: string) => {
    if (selectedPositions.includes(pos)) {
      setSelectedPositions(selectedPositions.filter(p => p !== pos));
    } else {
      setSelectedPositions([...selectedPositions, pos]);
    }
  };

  const handleCreateCorporateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerProfile?.id) return;
    if (selectedPositions.length === 0 && !customPosition.trim()) return;

    const newDemandPayload = {
      employer_id: employerProfile.id,
      employer_name: employerProfile.companyName,
      position_title: [...selectedPositions.map((id) => positionLabel(ui, id)), customPosition.trim()].filter(Boolean).join(', '),
      sector: selectedSector,
      headcount: Number(demandHeadcount),
      city: demandCity,
      salary: demandSalary,
      job_description: fill(ui.jobDesc, {
        duration: durationValue,
        experience: optionLabel(experienceOptions, demandExperience),
        language: optionLabel(ui.languageOptions, demandLanguageReq),
        stay: demandAccommodation ? ui.yes : ui.no,
        food: demandFood ? ui.yes : ui.no,
        transport: demandTransport ? ui.yes : ui.no,
        notes: demandNotes,
      }),
      status: 'new_request'
    };

    await supabase.from('job_requests').insert([newDemandPayload]);

    setCustomPosition('');
    setDemandNotes('');
    fetchEmployerData();
    setActiveTab('demands');
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerProfile?.id || !supportSubject.trim() || !supportMessage.trim()) return;

    const ticketPayload = {
      candidate_id: employerProfile.id,
      candidate_name: employerProfile.companyName,
      subject: supportSubject,
      message: supportMessage,
      status: 'open'
    };

    await supabase.from('candidate_support_tickets').insert([ticketPayload]);
    setSupportSubject('');
    setSupportMessage('');
    fetchEmployerData();
  };

  const handleRequestInterview = async (candidate: any) => {
    const isUuid = (v: any) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);
    // Güvenli RPC: yalnızca bu işverenin talebine sunulmuş adaylar için görüşme açar (RLS bypass yok).
    const { error: intErr } = await supabase.rpc('employer_request_interview', {
      p_candidate_id: candidate.id,
      p_request_id: isUuid(candidate.active_request_id) ? candidate.active_request_id : null,
      p_notes: `${ui.interview}: ${candidate.profession || ui.general} · ${ui.onlineMeeting}`,
    });
    if (intErr) {
      console.error('interview request failed', intErr);
      alert(intErr.message?.includes('not_presented') ? ui.interviewNotPresented : `${ui.interviewFailed} ${intErr.message}`);
      return;
    }
    alert(fill(ui.interviewSent, { name: candidate.full_name || candidate.name || '' }));
    fetchEmployerData();
    setActiveTab('interviews');
  };

  const handleSelectCandidate = async (candidate: any) => {
    await supabase.from('job_candidates').update({ status: 'approved', is_selected: true }).eq('id', candidate.id);
    alert(fill(ui.candidateSelectedAlert, { name: candidate.full_name || candidate.name || '' }));
    fetchEmployerData();
    setActiveTab('selected');
  };

  const getDemandMetrics = (demand: any) => {
    const headcount = demand.headcount || 5;
    const bound = candidates.length;
    const offered = candidates.filter(c => c.status === 'reviewing' || c.status === 'approved').length;
    const interviewing = interviews.length;
    const selected = selectedCandidates.length;
    const inProcess = candidates.filter(c => c.status === 'visa_processing' || c.status === 'reviewing').length;
    const travelReady = candidates.filter(c => c.travel_status === 'ticketed' || c.travel_status === 'completed').length;
    const started = 0;

    return { headcount, bound, offered: Math.min(offered, headcount), interviewing, selected, inProcess, travelReady, started };
  };

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        
        {/* ÜST HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PANOVA" width={1051} height={725} className="h-10 w-auto object-contain shrink-0" />
            <div className="border-l pl-3 border-slate-200">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-[11px] uppercase tracking-wider mb-0.5">
                <Building2 className="w-3.5 h-3.5" /> {t.empPortalTitle}
              </div>
              <div className="flex items-center gap-2">
                {editCompanyLogo && (
                  <img src={editCompanyLogo} alt={t.logoPreview || ''} className="h-7 w-auto object-contain rounded border bg-white p-0.5" />
                )}
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">{editCompanyName || employerProfile?.companyName || ''}</h1>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {typeof window !== 'undefined' && JSON.parse(localStorage.getItem('panova_employer_user') || '{}')?.isAdminImpersonation && (
              <button
                onClick={() => {
                  // Staff impersonation return. Keep the Supabase session so /portal
                  // stays signed in; only the employer view flags are dropped.
                  localStorage.removeItem('panova_employer_auth');
                  localStorage.removeItem('panova_employer_user');
                  window.location.href = '/portal';
                }}
                className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow cursor-pointer"
              >
                ← {ui.returnToAdmin}
              </button>
            )}

            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="font-bold text-slate-950">{fill(ui.authorized, { name: editContactPerson || employerProfile?.contactPerson || '' })}</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t.returnHome}
            </Link>

            <LanguageSwitcher currentLang={currentLang} onChange={changeLanguage} />

            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              {t.logout}
            </button>
          </div>
        </div>

        {profileErrorCode && !employerProfile?.id && (
          <p className="text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {profileMessage(profileErrorCode, profileErrorDetail)}
          </p>
        )}

        {/* 10 SEKME */}
        <div className="bg-white p-3 rounded-2xl border shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <button onClick={() => setActiveTab('home')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'home' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              🏠 {t.overview}
            </button>
            <button onClick={() => setActiveTab('demands')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'demands' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              📁 {t.empTabRequests} ({jobDemands.length})
            </button>
            <button onClick={() => setActiveTab('candidates')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'candidates' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              👥 {t.candidatesTab} ({candidates.length})
            </button>
            <button onClick={() => setActiveTab('interviews')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'interviews' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              📅 {t.empTabInterviews || t.interviews} ({interviews.length})
            </button>
            <button onClick={() => setActiveTab('selected')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'selected' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              ⭐ {t.empTabSelected || t.selectedCandidatesTitle} ({selectedCandidates.length})
            </button>
            <button onClick={() => setActiveTab('status')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'status' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              📄 {t.process}
            </button>
            <button onClick={() => setActiveTab('travel')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'travel' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              ✈️ {t.travel}
            </button>
            <button onClick={() => setActiveTab('employees')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'employees' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              👷 {t.employeesTab}
            </button>
            <button onClick={() => setActiveTab('support')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'support' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              💬 {t.support} ({supportTickets.length})
            </button>
            <button onClick={() => setActiveTab('company')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'company' ? 'bg-[#2e7d32] text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              🏢 {t.empTabProfile}
            </button>
          </div>
        </div>

        {/* 1. ANA SAYFA */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">{t.openRequestsCard}</span>
                <div className="text-2xl font-black text-emerald-700">{jobDemands.length}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">{t.totalCandidatesCard}</span>
                <div className="text-2xl font-black text-blue-700">{candidates.length}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">{t.empTabInterviews}</span>
                <div className="text-2xl font-black text-amber-600">{interviews.length}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">{t.empTabSelected}</span>
                <div className="text-2xl font-black text-purple-700">{selectedCandidates.length}</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base border-b pb-3">{t.portalSummaryTitle}</h3>
              <p className="text-xs text-slate-600">
                {t.portalSummaryDesc}
              </p>
            </div>
          </div>
        )}

        {/* 2. PERSONEL TALEPLERİM */}
        {activeTab === 'demands' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-950">{t.corporateDemandTitle}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{t.corporateDemandDesc}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl font-bold text-xs border border-emerald-200">
                  {t.totalActiveFiles}: {jobDemands.length}
                </div>
              </div>

              <form onSubmit={handleCreateCorporateDemand} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">1. {t.selectSectorLabel} *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => { setSelectedSector('agriculture'); setSelectedPositions([]); }}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        selectedSector === 'agriculture' ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500 text-emerald-950 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-700 font-semibold'
                      }`}
                    >
                      <span>🌱 {t.sectorAgriculture}</span>
                      {selectedSector === 'agriculture' && <Check className="w-4 h-4 text-emerald-700" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedSector('construction'); setSelectedPositions([]); }}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        selectedSector === 'construction' ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500 text-emerald-950 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-700 font-semibold'
                      }`}
                    >
                      <span>🏗️ {t.sectorConstruction}</span>
                      {selectedSector === 'construction' && <Check className="w-4 h-4 text-emerald-700" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedSector('trade'); setSelectedPositions([]); }}
                      className={`p-4 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        selectedSector === 'trade' ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500 text-emerald-950 font-extrabold' : 'bg-slate-50 border-slate-200 text-slate-700 font-semibold'
                      }`}
                    >
                      <span>📦 {t.sectorTrade}</span>
                      {selectedSector === 'trade' && <Check className="w-4 h-4 text-emerald-700" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">2. {t.selectPositionsLabel} *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mb-3">
                    {ui.positions[selectedSector].map((pos) => {
                      const isSelected = selectedPositions.includes(pos.id);
                      return (
                        <button
                          type="button"
                          key={pos.id}
                          onClick={() => togglePositionSelection(pos.id)}
                          className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                            isSelected ? 'bg-emerald-700 text-white shadow-md border-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>{pos.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      onChange={(e) => { if (e.target.value) togglePositionSelection(e.target.value); }}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-slate-950 font-semibold cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>📋 {t.universalPositionSelect}</option>
                      {(['agriculture', 'construction', 'trade'] as const).flatMap((key) => ui.positions[key]).map((item) => (
                        <option key={item.id} value={item.id}>{item.label}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder={t.otherPositionPlaceholder}
                      value={customPosition}
                      onChange={(e) => setCustomPosition(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-white text-slate-950 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">⏱️ {t.experienceLabel}</label>
                    <select value={demandExperience} onChange={(e) => setDemandExperience(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold bg-white text-slate-950 cursor-pointer">
                      {experienceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">🗣️ {t.languageReqLabel}</label>
                    <select value={demandLanguageReq} onChange={(e) => setDemandLanguageReq(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold bg-white text-slate-950 cursor-pointer">
                      {ui.languageOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">{t.headcountLabel}</label>
                    <input type="number" min="1" value={demandHeadcount} onChange={(e) => setDemandHeadcount(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold bg-white text-slate-950" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">{t.cityLocationLabel}</label>
                    <input type="text" value={demandCity} onChange={(e) => setDemandCity(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold bg-white text-slate-950" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">{t.salaryOfferLabel}</label>
                    <input type="text" value={demandSalary} onChange={(e) => setDemandSalary(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold bg-white text-slate-950" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">{t.durationLabel}</label>
                    <input type="text" value={durationValue} onChange={(e) => setDemandDuration(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold bg-white text-slate-950" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-4 rounded-xl font-bold transition shadow-lg cursor-pointer text-sm">
                  {t.submitDemandBtn}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <h4 className="font-extrabold text-slate-950 text-base">{t.activeDemandFilesTitle} ({jobDemands.length})</h4>
              <div className="space-y-4">
                {jobDemands.map((dem) => {
                  const metrics = getDemandMetrics(dem);
                  return (
                    <div key={dem.id} className="bg-white rounded-2xl border p-5 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md">{dem.sector}</span>
                            <span className="text-xs font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">{metrics.headcount} {t.peopleUnit}</span>
                          </div>
                          <h4 className="font-extrabold text-slate-950 text-base">{dem.position_title}</h4>
                          <p className="text-xs text-slate-500">📍 {dem.city} | 💰 {dem.salary}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold uppercase text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl text-xs">{t.statusLabel}: {dem.status}</span>
                          <div className="text-[11px] text-slate-400 mt-1">📅 {dem.created_at ? dem.created_at.substring(0, 10) : '2026-09'}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 bg-slate-50/80 p-3 rounded-xl border text-center text-xs">
                        <div className="bg-white p-2 rounded-lg border shadow-xs">
                          <div className="text-[9px] font-bold text-slate-400 uppercase">{t.demandRequested}</div>
                          <div className="text-sm font-black text-slate-900">{metrics.headcount}</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border shadow-xs">
                          <div className="text-[9px] font-bold text-indigo-500 uppercase">{t.demandBound}</div>
                          <div className="text-sm font-black text-indigo-700">{metrics.bound}</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border shadow-xs">
                          <div className="text-[9px] font-bold text-blue-500 uppercase">{t.demandOffered}</div>
                          <div className="text-sm font-black text-blue-700">{metrics.offered}</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border shadow-xs">
                          <div className="text-[9px] font-bold text-amber-500 uppercase">{t.demandInterviewing}</div>
                          <div className="text-sm font-black text-amber-600">{metrics.interviewing}</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border shadow-xs">
                          <div className="text-[9px] font-bold text-emerald-500 uppercase">{t.demandSelected}</div>
                          <div className="text-sm font-black text-emerald-700">{metrics.selected}</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border shadow-xs">
                          <div className="text-[9px] font-bold text-purple-500 uppercase">{t.demandInProcess}</div>
                          <div className="text-sm font-black text-purple-700">{metrics.inProcess}</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border shadow-xs">
                          <div className="text-[9px] font-bold text-sky-500 uppercase">{t.demandTravelReady}</div>
                          <div className="text-sm font-black text-sky-700">{metrics.travelReady}</div>
                        </div>
                        <div className="bg-white p-2 rounded-lg border shadow-xs">
                          <div className="text-[9px] font-bold text-teal-500 uppercase">{t.demandStarted}</div>
                          <div className="text-sm font-black text-teal-700">{metrics.started}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 3. ADAYLAR */}
        {activeTab === 'candidates' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-950 border-b pb-3">{t.candidatesTitle}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-900 font-bold border-b">
                  <tr>
                    <th className="p-4">{t.fullNameCol}</th>
                    <th className="p-4">{t.professionCol}</th>
                    <th className="p-4">{t.nationalityCol}</th>
                    <th className="p-4">{t.actionCol}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {candidates.map((cand) => (
                    <tr key={cand.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-bold text-slate-950">{cand.full_name || cand.name}</td>
                      <td className="p-4">{cand.profession || ui.specialist} ({cand.sector || ui.general})</td>
                      <td className="p-4">{cand.nationality || cand.country}</td>
                      <td className="p-4 flex items-center gap-2">
                        <button onClick={() => handleRequestInterview(cand)} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 cursor-pointer">
                          {t.interviewReqBtn}
                        </button>
                        <button onClick={() => handleSelectCandidate(cand)} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100 cursor-pointer">
                          {t.selectBtn}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. GÖRÜŞMELER (DİNAMİK ÇEVİRİ DESTEKLİ) */}
        {activeTab === 'interviews' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-950 flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-700" /> {t.interviewsTitle}
              </h3>
              <span className="bg-amber-50 text-amber-800 text-xs font-bold px-3 py-1 rounded-xl border border-amber-200">
                {t.activeAppointments}: {interviews.length}
              </span>
            </div>

            <div className="space-y-3">
              {interviews.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">{t.empNoInterviews}</div>
              ) : (
                interviews.map((item, idx) => (
                  <div key={item.id || idx} className="p-4 bg-slate-50 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-950 text-sm">{item.candidate_name || candidates.find((x: any) => x.id === item.candidate_id)?.full_name || ui.candidateWord}</span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">{item.position || candidates.find((x: any) => x.id === item.candidate_id)?.profession || ui.positionWord}</span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString(dateLocale[currentLang]) : '—'} | 💻 {item.platform || ui.onlineMeeting}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-xl uppercase">
                        {ui.intStatus[item.status] || item.status || ui.planned}
                      </span>
                      <a href="#video-call" onClick={(e) => { e.preventDefault(); alert(ui.joiningCall); }} className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
                        <Video className="w-3.5 h-3.5" /> {t.joinInterviewBtn}
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 5. SEÇTİĞİM ADAYLAR */}
        {activeTab === 'selected' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-950 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-600" /> {t.selectedCandidatesTitle}
              </h3>
              <span className="bg-purple-50 text-purple-800 text-xs font-bold px-3 py-1 rounded-xl border border-purple-200">
                {t.totalSelected}: {selectedCandidates.length}
              </span>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border">
              {t.selectedCandidatesDesc}
            </p>

            {selectedCandidates.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">{t.empNoSelected}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCandidates.map((cand, idx) => (
                  <div key={cand.id || idx} className="p-4 bg-white rounded-2xl border shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-slate-950 text-sm">{cand.full_name || cand.name}</h4>
                        <p className="text-xs text-slate-500">{cand.profession || ui.specialist} • {cand.nationality || '—'}</p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {t.approvedAndProcessing}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6. BELGE VE İŞLEM DURUMLARI */}
        {activeTab === 'status' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-950 border-b pb-3">{t.processStatusTitle}</h3>
            <div className="space-y-2 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border flex justify-between items-center">
                <span className="font-bold text-slate-900">{t.statusWorkPermit}</span>
                <span className="bg-blue-100 text-blue-800 px-2.5 py-1 rounded-md font-bold">{t.statusApproved}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border flex justify-between items-center">
                <span className="font-bold text-slate-900">{t.statusVisa}</span>
                <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-md font-bold">{t.statusPending}</span>
              </div>
            </div>
          </div>
        )}

        {/* 7. SEYAHAT VE İŞE BAŞLANGIÇ */}
        {activeTab === 'travel' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-950 border-b pb-3">{t.travelStartTitle}</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border text-xs space-y-2">
              <div className="font-bold text-slate-950 flex items-center gap-1.5"><Plane className="w-4 h-4 text-blue-600" /> {t.groupTravelPlan}</div>
              <p className="text-slate-700">{ui.arrivalSummary}</p>
            </div>
          </div>
        )}

        {/* 8. AKTİF ÇALIŞANLAR */}
        {activeTab === 'employees' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-950 border-b pb-3">{t.activeEmployeesTitle}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border space-y-1">
                <div className="font-extrabold text-slate-950">{ui.employeeName}</div>
                <div className="text-slate-500">{ui.employeeLine}</div>
              </div>
            </div>
          </div>
        )}

        {/* 9. DESTEK / BİLDİRİM */}
        {activeTab === 'support' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4 h-fit">
              <h3 className="text-base sm:text-lg font-bold text-slate-950 border-b pb-3">{t.newSupportTitle}</h3>
              <form onSubmit={handleSendSupport} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.supportSubjectLabel} *</label>
                  <input type="text" required value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} placeholder={ui.supportSubjectPh} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.supportMessageLabel} *</label>
                  <textarea rows={4} required value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)} placeholder={ui.supportMessagePh} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950 resize-none" />
                </div>
                <button type="submit" className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3.5 rounded-xl font-bold cursor-pointer text-xs sm:text-sm">
                  {t.sendBtn}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-950 border-b pb-3">{t.supportHistoryTitle}</h3>
              {supportTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">{t.noSupportYet}</div>
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

        {/* 10. ŞİRKET BİLGİLERİM VE LOGO YÜKLEME */}
        {activeTab === 'company' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-6">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-950 border-b pb-3">{t.companyProfileTitle}</h3>
            
            <form onSubmit={handleUpdateCompanyInfo} className="space-y-4 text-xs max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.companyNameLabel}</label>
                  <input type="text" value={editCompanyName} onChange={(e) => setEditCompanyName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950 font-semibold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.contactPersonLabel}</label>
                  <input type="text" value={editContactPerson} onChange={(e) => setEditContactPerson(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950 font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.emailAddress}</label>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950 font-semibold" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.phoneLabel}</label>
                  <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950 font-semibold" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">{t.countryLabel}</label>
                <select value={editCountry} onChange={(e) => setEditCountry(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950 font-semibold cursor-pointer">
                  <EuropeanCountryOptions lang={currentLang} currentValue={editCountry} />
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">{t.uploadLogoLabel}</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 text-slate-700 font-semibold cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
                />
              </div>

              {editCompanyLogo && (
                <div className="p-3 bg-slate-50 border rounded-xl flex items-center gap-3">
                  <span className="font-bold text-slate-700">{t.logoPreview}:</span>
                  <img src={editCompanyLogo} alt={t.logoPreview || ''} className="h-10 w-auto object-contain bg-white p-1 border rounded shadow-sm" />
                </div>
              )}

              {profileErrorCode && (
                <p className="text-sm font-bold text-red-700">{profileMessage(profileErrorCode, profileErrorDetail)}</p>
              )}

              <button
                type="submit"
                disabled={!employerProfile?.id || profileSaving || profileLoading}
                className="bg-[#2e7d32] hover:bg-[#1b5e20] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition shadow cursor-pointer"
              >
                {profileSaving ? (t.updatingBtn) : (t.saveCompanyBtn)}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

export default function EmployerPortal() {
  return (
    <AuthGuard role="employer">
      <EmployerPortalInner />
    </AuthGuard>
  );
}
