'use client';

import AuthGuard from '@/components/auth/AuthGuard';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isStaff, signOut } from '@/lib/auth';
import { EmployerWriteError, staffViewEmployerId, toEmployerProfileView, type EmployerRow } from '@/lib/employerProfile';
import { offerMoney, offerStatusLabel } from '@/lib/offers';
import { employerService } from '@/lib/services/employerService';
import { 
  Building2, Users, FileText, Plus, CheckCircle, Clock, ArrowLeft, 
  Trash2, Send, AlertCircle, CheckSquare, Briefcase, MapPin, Calendar, DollarSign, Download, ShieldCheck, HeartHandshake, UploadCloud, Check, Video, Star, CheckCircle2, BookOpen, X
} from 'lucide-react';
import Link from 'next/link';
import { Language, translations } from '@/lib/dictionary';
import { demandStatusLabel } from '@/lib/demandStatus';
import { localizeCatalogTitle, professionLabel, professionsForSector, sectorOptions } from '@/lib/professions';
import { dateLocale, fill, optionLabel, portalUi } from '@/lib/portal-ui-copy';
import { benefitPhrase, buildEmployerDemandInsert, displayedRequestSalary, type DemandBlock, type YesNo } from '@/lib/workforceRequest';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import { readStoredLanguage, syncDocumentLanguage, writeStoredLanguage } from '@/lib/site-language';
import { EuropeanCountryOptions } from '@/components/site/EuropeanCountryOptions';
import EmployerCandidateBrowser from './components/EmployerCandidateBrowser';
import { guideNavLabel } from '@/lib/guides-nav';
import CandidateYouTube from '@/components/candidate/CandidateYouTube';
import { releaseCopy, supportStatusLabel } from '@/lib/release-copy';
import EmployerConsentCard from '@/components/auth/EmployerConsentCard';
import { needsEmployerConsent } from '@/lib/employerInvite';
import { candidateProfessionLabel, candidateSectorLabel } from '@/lib/candidateLabels';
import {
  canDecideOnMatch,
  EMPLOYER_CANDIDATE_BROWSE_COLUMNS,
  isMissingBrowseRpc,
  sectorFilterLabel,
  toEmployerCandidate,
  type EmployerCandidate,
  type EmployerDecision,
} from '@/lib/employerCandidateFilters';
import {
  formatCount,
  indexPipelineCounts,
  pipelineCountsFor,
  sumPipelineCounts,
  type PipelineCountsIndex,
} from '@/lib/requestPipelineCounts';
import { formatInterviewTime, joinableMeetingUrl } from '@/lib/interviewMeeting';
import { toPlacements, type EmployerPlacement } from '@/lib/employerPlacements';
import EmployerPlacementTabs, { type PlacementsLoad } from './components/EmployerPlacementTabs';

const SECTOR_ICON: Record<string, string> = {
  construction: '🏗️', agriculture: '🌱', hospitality: '🍽️', manufacturing: '🏭', textile: '🧵', logistics: '🚚',
  warehouse_retail: '📦', care: '🩺', cleaning_security: '🛡️', automotive: '🔧', office_engineering: '💼',
};

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
  const [staffView, setStaffView] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [employerOffers, setEmployerOffers] = useState<any[]>([]);

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
        let stored: unknown = null;
        try {
          stored = JSON.parse(localStorage.getItem('panova_employer_user') || 'null');
        } catch {
          stored = null;
        }
        const viewId = staffViewEmployerId(window.location.search, stored);
        const row = await employerService.loadEmployerForPortal(viewId);
        if (cancelled) return;
        const viewingAsStaff = Boolean(viewId) && row.id === viewId && await isStaff();
        setStaffView(viewingAsStaff);
        rememberEmployer(row);
        if (!viewingAsStaff) {
          const consent = await supabase.from('employers').select('invited_at, kvkk_accepted_at').eq('id', row.id).maybeSingle();
          if (!consent.error && needsEmployerConsent(consent.data)) setNeedsConsent(true);
        }
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
    'home' | 'newRequest' | 'candidates' | 'interviews' | 'selected' | 'status' | 'travel' | 'employees' | 'support' | 'company'
  >('home');

  const [jobDemands, setJobDemands] = useState<any[]>([]);
  const [pipelineCounts, setPipelineCounts] = useState<PipelineCountsIndex>(null);
  const [countsFailed, setCountsFailed] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  // İşlem Durumu / Seyahat / Aktif Çalışanlar: only from employer_placements().
  const [placements, setPlacements] = useState<EmployerPlacement[]>([]);
  const [placementsLoad, setPlacementsLoad] = useState<PlacementsLoad>('loading');

  const [selectedSector, setSelectedSector] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [customPosition, setCustomPosition] = useState('');
  const [catalogPick, setCatalogPick] = useState('');
  const [demandHeadcount, setDemandHeadcount] = useState('');
  const [demandCity, setDemandCity] = useState('');
  const [demandSalary, setDemandSalary] = useState('');
  const [demandDuration, setDemandDuration] = useState('');
  const [demandExperience, setDemandExperience] = useState('');
  const [demandLanguageReq, setDemandLanguageReq] = useState('');
  const [demandAccommodation, setDemandAccommodation] = useState<YesNo>('');
  const [demandFood, setDemandFood] = useState<YesNo>('');
  const [demandError, setDemandError] = useState<DemandBlock | 'save' | ''>('');

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

    setJobDemands(demData || []);

    // Per-request card counts, only from request_pipeline_counts. On an error
    // the cards show a dash and a notice, never client-side or zero counts.
    const { data: countRows, error: countError } = await supabase.from('request_pipeline_counts').select('*');
    if (countError) console.error('request pipeline counts failed', countError.code || countError.message);
    setPipelineCounts(countError ? null : indexPipelineCounts(countRows));
    setCountsFailed(!!countError);

    const { data: pooled, error: poolError } = await supabase.rpc('employer_browse_candidates');
    let candData: unknown[] | null = pooled;
    if (poolError) {
      if (isMissingBrowseRpc(poolError)) {
        const { data } = await supabase
          .from('job_candidates')
          .select(EMPLOYER_CANDIDATE_BROWSE_COLUMNS)
          .is('archived_at', null)
          .order('created_at', { ascending: false });
        candData = data;
      } else {
        console.error('employer candidate browse failed', poolError.code || poolError.message);
        candData = [];
      }
    }
    const rows = (candData ?? [])
      .map((row) => toEmployerCandidate((row ?? {}) as Record<string, unknown>))
      .filter((row) => row.id);
    setCandidates(rows);
    setSelectedCandidates(rows.filter((c) => c.employer_decision === 'selected'));

    // On an error the three tabs show a notice, never placeholder rows.
    const { data: placementRows, error: placementError } = await supabase.rpc('employer_placements');
    if (placementError) console.error('employer placements failed', placementError.code || placementError.message);
    setPlacements(placementError ? [] : toPlacements(placementRows));
    setPlacementsLoad(placementError ? 'error' : 'ready');

    const { data: intData } = await supabase.from('interviews').select('*').eq('employer_id', employerProfile.id).order('created_at', { ascending: false });
    setInterviews(intData || []);

    const { data: offerRows } = await supabase
      .from('job_offers')
      .select('id, candidate_id, candidate_name, position_title, employer_name, monthly_net_salary, status, terms_details, start_date, offer_terms, is_demo')
      .eq('employer_id', employerProfile.id)
      .order('created_at', { ascending: false });
    setEmployerOffers(offerRows || []);

    const { data: ticketData } = await supabase
      .from('candidate_support_tickets')
      .select('id, subject, message, status, created_at, admin_reply, replied_at, replied_by_name, employer_id, candidate_name')
      .eq('employer_id', employerProfile.id)
      .order('created_at', { ascending: false });
    if (ticketData) setSupportTickets(ticketData);
  }, [employerProfile]);

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
      }, employerProfile.id, { staffView });
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

  const demandErrorMessage = (code: DemandBlock | 'save') => {
    if (code === 'position') return t.fillRequiredFields || '';
    if (code === 'lodging') return t.lodgingRequired || '';
    if (code === 'meals') return t.mealsRequired || '';
    if (code === 'both') return t.lodgingAndMealsRequired || '';
    if (code === 'salary') return t.salaryAmountRequired || '';
    return t.demandSaveFailed || '';
  };

  const benefitText = (value: unknown) => benefitPhrase({
    provided: t.benefitProvided || '',
    notProvided: t.benefitNotProvided || '',
    unanswered: t.benefitUnanswered || '',
  }, value);

  const resetDemandForm = () => {
    setSelectedSector('');
    setSelectedPositions([]);
    setCustomPosition('');
    setCatalogPick('');
    setDemandHeadcount('');
    setDemandCity('');
    setDemandSalary('');
    setDemandDuration('');
    setDemandExperience('');
    setDemandLanguageReq('');
    setDemandAccommodation('');
    setDemandFood('');
    setDemandError('');
  };

  const handleCreateCorporateDemand = async (e: React.FormEvent) => {
    e.preventDefault();

    const headcount = Number(demandHeadcount);
    // Catalog keys (localized wherever the title is shown), then the free text as typed.
    const positionTitle = [...selectedPositions, customPosition.trim()].filter(Boolean).join(', ');
    if (
      !selectedSector
      || !positionTitle
      || !demandExperience
      || !demandLanguageReq
      || !demandCity.trim()
      || !demandDuration.trim()
      || !Number.isFinite(headcount)
      || headcount < 1
    ) {
      setDemandError('position');
      return;
    }

    const built = buildEmployerDemandInsert({
      employerId: employerProfile?.id || '',
      employerName: employerProfile?.companyName || '',
      country: employerProfile?.country || '',
      positionTitle,
      sector: selectedSector,
      headcount,
      city: demandCity,
      salaryText: demandSalary,
      duration: demandDuration,
      experience: demandExperience,
      language: optionLabel(ui.languageOptions, demandLanguageReq),
      lodging: demandAccommodation,
      meals: demandFood,
    });
    if (!built.ok) {
      setDemandError(built.error);
      return;
    }
    if (!employerProfile?.id) {
      setDemandError('save');
      return;
    }
    if (employerProfile.complianceStatus === 'pending') {
      setDemandError('save');
      alert(releaseCopy[currentLang].employerPending);
      return;
    }

    const { error } = await supabase.from('job_requests').insert([built.row]);
    if (error) {
      console.error('job request insert failed', error);
      setDemandError('save');
      return;
    }

    resetDemandForm();
    fetchEmployerData();
    setActiveTab('home');
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employerProfile?.id || !supportSubject.trim() || !supportMessage.trim()) return;

    const ticketPayload = {
      employer_id: employerProfile.id,
      candidate_id: null,
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
      p_notes: `${ui.interview}: ${candidateProfessionLabel(candidate.profession, ui.general, currentLang)} · ${ui.onlineMeeting}`,
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

  const [decidingMatchId, setDecidingMatchId] = useState<string | null>(null);

  // Saves the employer decision on the request match through the guarded RPC.
  const saveDecision = async (candidate: EmployerCandidate, decision: EmployerDecision) => {
    const name = candidate.full_name || '';
    if (!canDecideOnMatch(candidate)) {
      alert(t.selectionNotPresented || '');
      return;
    }
    const previous = candidate.employer_decision;
    const confirmingStaff = candidate.decision_source === 'staff' && previous === decision;
    if (decision === 'rejected' && !confirmingStaff && !confirm(fill(t.rejectConfirm || '', { name }))) return;
    setDecidingMatchId(candidate.match_id);
    const { error } = await supabase.rpc('employer_decide_match', {
      p_match_id: candidate.match_id,
      p_decision: decision,
    });
    setDecidingMatchId(null);
    if (error) {
      console.error('employer decision failed', error.code || error.message);
      alert(error.message?.includes('not_presented') ? t.selectionNotPresented || '' : t.selectionSaveFailed || '');
      return;
    }
    const message =
      confirmingStaff ? t.candidateDecisionConfirmed
      : decision === 'selected' ? t.candidateSelectedSaved
      : decision === 'rejected' ? t.candidateRejectedSaved
      : previous === 'selected' ? t.candidateSelectionRemoved
      : t.candidateDecisionReset;
    alert(fill(message || '', { name }));
    await fetchEmployerData();
    if (decision === 'selected' && !confirmingStaff) setActiveTab('selected');
  };

  const handleSelectCandidate = (candidate: EmployerCandidate) => saveDecision(candidate, 'selected');
  const handleRejectCandidate = (candidate: EmployerCandidate) => saveDecision(candidate, 'rejected');
  const handleUnselectCandidate = (candidate: EmployerCandidate) => saveDecision(candidate, 'pending');
  // Makes a decision staff entered on the employer's behalf the employer's own.
  const handleConfirmDecision = (candidate: EmployerCandidate) => saveDecision(candidate, candidate.employer_decision);

  // Counts for this one request, from request_pipeline_counts (same numbers as
  // the management screens). The matched count is staff-only and not shown here.
  const pipelineTotals = sumPipelineCounts(pipelineCounts, jobDemands);

  // A dash replaces any count the view did not return.
  const getDemandMetrics = (demand: { id?: string; headcount?: unknown }) => {
    const c = pipelineCountsFor(pipelineCounts, demand.id, demand.headcount);
    const parsedHeadcount = Number(demand.headcount);
    return {
      headcount: Number.isFinite(parsedHeadcount) && parsedHeadcount > 0 ? parsedHeadcount : 0,
      presented: formatCount(c?.presented),
      interviewing: formatCount(c?.interviews),
      selected: formatCount(c?.selected),
      inProcess: formatCount(c?.in_process),
      travelReady: formatCount(c?.travel_ready),
      started: formatCount(c?.started),
    };
  };

  const requestStatusText = (status?: string | null) => demandStatusLabel(status, {
    new_request: t.stageNewRequest,
    reviewing: t.stageReviewing,
    searching_candidates: t.stageSearchingCandidates,
    presenting_candidates: t.stagePresentingCandidates,
    interviews: t.stageInterviews,
    selection_completed: t.stageSelectionCompleted,
    official_process: t.stageOfficialProcess,
    travel_planning: t.stageTravelPlanning,
    completed: t.stageCompleted,
    cancelled: t.stageCancelled,
  });

  const renderDemandCard = (dem: {
    id?: string;
    sector?: string;
    position_title?: string;
    city?: string;
    status?: string;
    created_at?: string;
    accommodation_provided?: unknown;
    food_provided?: unknown;
    headcount?: number;
    salary?: string | null;
    monthly_net_salary?: number | string | null;
  }) => {
    const metrics = getDemandMetrics(dem);
    const title = localizeCatalogTitle(dem.position_title, currentLang) || '—';
    return (
      <article key={dem.id} className="bg-card rounded-2xl border border-line p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-bold bg-status-info-bg text-status-info px-2.5 py-1 rounded-md">{candidateSectorLabel(dem.sector, ui, t)}</span>
              <span className="text-xs font-extrabold bg-status-ok-bg text-status-ok px-2.5 py-1 rounded-lg">{metrics.headcount} {t.peopleUnit}</span>
            </div>
            <h3 className="font-extrabold text-foreground text-base">{title}</h3>
            <p className="text-xs text-muted-foreground">📍 {dem.city || '—'} | 💰 {displayedRequestSalary(dem) || '—'}</p>
            <p className="text-xs text-muted-foreground">{t.facilityAccommodation}: {benefitText(dem.accommodation_provided)} · {t.facilityFood}: {benefitText(dem.food_provided)}</p>
          </div>
          <div className="text-end">
            <span className="font-bold text-status-ok bg-status-ok-bg px-3 py-1.5 rounded-xl text-xs">{t.statusLabel}: {requestStatusText(dem.status)}</span>
            <div className="text-[11px] text-muted-foreground mt-1">📅 {dem.created_at ? String(dem.created_at).substring(0, 10) : '—'}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 bg-slate-50 p-3 rounded-xl border border-line text-center text-xs">
          <div className="bg-card p-2 rounded-lg border border-line">
            <div className="text-[9px] font-bold text-muted-foreground uppercase">{t.demandRequested}</div>
            <div className="text-sm font-black text-foreground">{metrics.headcount}</div>
          </div>
          <div className="bg-card p-2 rounded-lg border border-line">
            <div className="text-[9px] font-bold text-blue-800 uppercase">{t.demandOffered}</div>
            <div className="text-sm font-black text-blue-700">{metrics.presented}</div>
          </div>
          <div className="bg-card p-2 rounded-lg border border-line">
            <div className="text-[9px] font-bold text-amber-800 uppercase">{t.demandInterviewing}</div>
            <div className="text-sm font-black text-amber-800">{metrics.interviewing}</div>
          </div>
          <div className="bg-card p-2 rounded-lg border border-line">
            <div className="text-[9px] font-bold text-emerald-800 uppercase">{t.demandSelected}</div>
            <div className="text-sm font-black text-emerald-700">{metrics.selected}</div>
          </div>
          <div className="bg-card p-2 rounded-lg border border-line">
            <div className="text-[9px] font-bold text-purple-800 uppercase">{t.demandInProcess}</div>
            <div className="text-sm font-black text-purple-700">{metrics.inProcess}</div>
          </div>
          <div className="bg-card p-2 rounded-lg border border-line">
            <div className="text-[9px] font-bold text-sky-800 uppercase">{t.demandTravelReady}</div>
            <div className="text-sm font-black text-sky-700">{metrics.travelReady}</div>
          </div>
          <div className="bg-card p-2 rounded-lg border border-line">
            <div className="text-[9px] font-bold text-teal-800 uppercase">{t.demandStarted}</div>
            <div className="text-sm font-black text-teal-700">{metrics.started}</div>
          </div>
        </div>
      </article>
    );
  };

  if (!profileLoading && needsConsent && employerProfile?.id) {
    return (
      <div className={`min-h-screen bg-slate-50 flex items-center justify-center p-4 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <EmployerConsentCard lang={currentLang} onAccepted={() => setNeedsConsent(false)} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
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
                className="inline-flex items-center gap-1.5 bg-amber-800 hover:bg-amber-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow cursor-pointer"
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

        {employerProfile?.complianceStatus === 'pending' ? (
          <p className="text-sm font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">{releaseCopy[currentLang].employerPending}</p>
        ) : null}

        {profileErrorCode && !employerProfile?.id && (
          <p className="text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {profileMessage(profileErrorCode, profileErrorDetail)}
          </p>
        )}

        {/* 10 SEKME */}
        <div className="bg-white p-3 rounded-2xl border shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <button onClick={() => setActiveTab('home')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'home' ? 'bg-brand-solid text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              🏠 {t.overview}
            </button>
            <button onClick={() => setActiveTab('newRequest')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'newRequest' ? 'bg-brand-solid text-on-dark shadow' : 'bg-slate-50 border text-foreground hover:bg-slate-100'}`}>
              ➕ {t.empTabNewRequest}
            </button>
            <button onClick={() => setActiveTab('candidates')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'candidates' ? 'bg-brand-solid text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              👥 {t.candidatesTab} ({candidates.length})
            </button>
            <button onClick={() => setActiveTab('interviews')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'interviews' ? 'bg-brand-solid text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              📅 {t.empTabInterviews || t.interviews} ({interviews.length})
            </button>
            <button onClick={() => setActiveTab('selected')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'selected' ? 'bg-brand-solid text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              ⭐ {t.empTabSelected || t.selectedCandidatesTitle} ({selectedCandidates.length})
            </button>
            <button onClick={() => setActiveTab('status')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'status' ? 'bg-brand-solid text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              📄 {t.process}
            </button>
            <button onClick={() => setActiveTab('travel')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'travel' ? 'bg-brand-solid text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              ✈️ {t.travel}
            </button>
            <button onClick={() => setActiveTab('employees')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'employees' ? 'bg-brand-solid text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              👷 {t.employeesTab}
            </button>
            <button onClick={() => setActiveTab('support')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'support' ? 'bg-brand-solid text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              💬 {t.support} ({supportTickets.length})
            </button>
            <button onClick={() => setActiveTab('company')} className={`px-3.5 py-2.5 rounded-xl cursor-pointer transition ${activeTab === 'company' ? 'bg-brand-solid text-white shadow' : 'bg-slate-50 border text-slate-700 hover:bg-slate-100'}`}>
              🏢 {t.empTabProfile}
            </button>
            <Link href="/guides" className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition bg-slate-50 border text-slate-700 hover:bg-slate-100">
              <BookOpen className="w-3.5 h-3.5" aria-hidden /> {guideNavLabel[currentLang]}
            </Link>
          </div>
        </div>

        {/* 1. ANA SAYFA */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-extrabold text-foreground text-base">{t.activeDemandFilesTitle} ({jobDemands.length})</h2>
                {jobDemands.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('newRequest')}
                    className="inline-flex items-center justify-center gap-2 bg-brand-solid hover:bg-brand text-on-dark px-4 py-2.5 rounded-xl text-sm font-bold shadow cursor-pointer"
                  >
                    <Plus className="w-4 h-4" aria-hidden /> {t.newDemandBtn}
                  </button>
                ) : null}
              </div>
              {jobDemands.length === 0 ? (
                <div className="bg-card rounded-2xl border border-line p-8 text-center space-y-4">
                  <p className="text-sm font-semibold text-foreground">{t.empNoRequests}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('newRequest')}
                    className="inline-flex items-center justify-center gap-2 bg-brand-solid hover:bg-brand text-on-dark px-4 py-2.5 rounded-xl text-sm font-bold shadow cursor-pointer"
                  >
                    <Plus className="w-4 h-4" aria-hidden /> {t.newDemandBtn}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {countsFailed ? (
                    <p role="status" className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{t.countsUnavailable}</p>
                  ) : null}
                  {jobDemands.map((dem) => renderDemandCard(dem))}
                </div>
              )}
            </section>

            {/* Summary cards: totals of the same request_pipeline_counts rows as
                the request cards above; a dash when those counts are unknown. */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">{t.openRequestsCard}</span>
                <div className="text-2xl font-black text-emerald-700">{formatCount(pipelineTotals?.open_requests)}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">{t.totalCandidatesCard}</span>
                <div className="text-2xl font-black text-blue-700">{formatCount(pipelineTotals?.presented)}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">{t.empTabInterviews}</span>
                <div className="text-2xl font-black text-amber-600">{formatCount(pipelineTotals?.interviews)}</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-1">
                <span className="text-xs font-bold text-muted-foreground uppercase">{t.empTabSelected}</span>
                <div className="text-2xl font-black text-purple-700">{formatCount(pipelineTotals?.selected)}</div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="font-extrabold text-foreground text-base border-b border-line pb-3">{t.portalSummaryTitle}</h3>
              <p className="text-xs text-muted-foreground">
                {t.portalSummaryDesc}
              </p>
            </div>
          </div>
        )}

        {/* 2. PERSONEL TALEPLERİM */}
        {activeTab === 'newRequest' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">{t.corporateDemandTitle}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.corporateDemandDesc}</p>
                </div>
              </div>

              <form noValidate onSubmit={handleCreateCorporateDemand} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">1. {t.selectSectorLabel} *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sectorOptions(currentLang).map((sector) => (
                      <button
                        type="button"
                        key={sector.value}
                        aria-pressed={selectedSector === sector.value}
                        onClick={() => { setSelectedSector(sector.value); setCatalogPick(''); }}
                        className={`p-4 rounded-xl border text-start transition cursor-pointer flex items-center justify-between gap-2 ${
                          selectedSector === sector.value ? 'bg-status-ok-bg border-brand ring-2 ring-brand text-status-ok font-extrabold' : 'bg-slate-50 border-line text-foreground font-semibold'
                        }`}
                      >
                        <span>{SECTOR_ICON[sector.value] || '•'} {sector.label}</span>
                        {selectedSector === sector.value && <Check className="w-4 h-4 shrink-0 text-status-ok" aria-hidden />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="demand-position-pick" className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">2. {t.selectPositionsLabel} *</label>
                  {!selectedSector && (
                    <p className="text-xs font-semibold text-muted-foreground mb-3">{t.selectSectorFirst}</p>
                  )}

                  <div className="mb-3">
                    <p className="text-xs font-bold text-foreground mb-1.5">{t.selectedPositionsLabel}</p>
                    {selectedPositions.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{t.noPositionsSelected}</p>
                    ) : (
                      <ul className="flex flex-wrap gap-2">
                        {selectedPositions.map((key) => {
                          const label = professionLabel(key, currentLang) || key;
                          return (
                            <li key={key} className="inline-flex items-center gap-1.5 ps-3 pe-1 py-1 rounded-full bg-brand-solid text-on-dark text-xs font-bold">
                              <span>{label}</span>
                              <button
                                type="button"
                                onClick={() => togglePositionSelection(key)}
                                aria-label={fill(t.removePositionAria || '', { name: label })}
                                className="w-6 h-6 rounded-full inline-flex items-center justify-center hover:bg-white/20 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" aria-hidden />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      id="demand-position-pick"
                      value={catalogPick}
                      disabled={!selectedSector}
                      onChange={(e) => {
                        if (e.target.value && !selectedPositions.includes(e.target.value)) togglePositionSelection(e.target.value);
                        setCatalogPick('');
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs bg-card text-foreground font-semibold cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="">{selectedSector ? t.positionPickPlaceholder : t.selectSectorFirst}</option>
                      {professionsForSector(selectedSector)
                        .filter((item) => !selectedPositions.includes(item.key))
                        .map((item) => (
                          <option key={item.key} value={item.key}>{item.labels[currentLang]}</option>
                        ))}
                    </select>

                    <input
                      type="text"
                      placeholder={t.otherPositionPlaceholder}
                      value={customPosition}
                      onChange={(e) => setCustomPosition(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs bg-card text-foreground font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-foreground mb-1">⏱️ {t.experienceLabel} *</label>
                    <select required value={demandExperience} onChange={(e) => setDemandExperience(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs font-semibold bg-card text-foreground cursor-pointer">
                      <option value="">{t.benefitSelectPlaceholder}</option>
                      {experienceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-foreground mb-1">🗣️ {t.languageReqLabel} *</label>
                    <select required value={demandLanguageReq} onChange={(e) => setDemandLanguageReq(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs font-semibold bg-card text-foreground cursor-pointer">
                      <option value="">{t.benefitSelectPlaceholder}</option>
                      {ui.languageOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-foreground mb-1">{t.headcountLabel} *</label>
                    <input type="number" min="1" required placeholder={t.headcountPlaceholder} value={demandHeadcount} onChange={(e) => setDemandHeadcount(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-line text-xs font-semibold bg-card text-foreground" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-foreground mb-1">{t.cityLocationLabel} *</label>
                    <input type="text" required placeholder={t.cityPlaceholder} value={demandCity} onChange={(e) => setDemandCity(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-line text-xs font-semibold bg-card text-foreground" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-foreground mb-1">{t.salaryOfferLabel} *</label>
                    <input type="text" required placeholder={t.salaryPlaceholder} value={demandSalary} onChange={(e) => { setDemandSalary(e.target.value); setDemandError(''); }} className="w-full px-3 py-2.5 rounded-xl border border-line text-xs font-semibold bg-card text-foreground" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-foreground mb-1">{t.durationLabel} *</label>
                    <input type="text" required placeholder={t.durationPlaceholder} value={demandDuration} onChange={(e) => setDemandDuration(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-line text-xs font-semibold bg-card text-foreground" />
                  </div>
                </div>

                <fieldset className="space-y-2">
                  <legend className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">{t.providedFacilitiesLabel} *</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="demand-lodging" className="block text-xs font-bold uppercase text-foreground mb-1">{t.facilityAccommodation} *</label>
                      <select
                        id="demand-lodging"
                        required
                        aria-required="true"
                        aria-invalid={demandError === 'lodging' || demandError === 'both'}
                        value={demandAccommodation}
                        onChange={(e) => { setDemandAccommodation(e.target.value as YesNo); setDemandError(''); }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs font-semibold bg-card text-foreground cursor-pointer"
                      >
                        <option value="">{t.benefitSelectPlaceholder}</option>
                        <option value="yes">{t.benefitProvided}</option>
                        <option value="no">{t.benefitNotProvided}</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="demand-meals" className="block text-xs font-bold uppercase text-foreground mb-1">{t.facilityFood} *</label>
                      <select
                        id="demand-meals"
                        required
                        aria-required="true"
                        aria-invalid={demandError === 'meals' || demandError === 'both'}
                        value={demandFood}
                        onChange={(e) => { setDemandFood(e.target.value as YesNo); setDemandError(''); }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs font-semibold bg-card text-foreground cursor-pointer"
                      >
                        <option value="">{t.benefitSelectPlaceholder}</option>
                        <option value="yes">{t.benefitProvided}</option>
                        <option value="no">{t.benefitNotProvided}</option>
                      </select>
                    </div>
                  </div>
                </fieldset>

                {demandError && (
                  <p role="alert" className="text-xs font-bold text-status-bad bg-status-bad-bg border border-status-bad rounded-xl px-3 py-2">
                    {demandErrorMessage(demandError)}
                  </p>
                )}

                <button type="submit" className="w-full bg-brand-solid hover:bg-brand text-on-dark py-4 rounded-xl font-bold transition shadow-lg cursor-pointer text-sm">
                  {t.submitDemandBtn}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 3. ADAYLAR */}
        {activeTab === 'candidates' && (
          <EmployerCandidateBrowser
            candidates={candidates as EmployerCandidate[]}
            labels={{
              title: t.candidatesTitle || '',
              search: t.empCandSearch || '',
              experience: t.empCandExperience || '',
              anyExperience: t.empCandAnyExperience || '',
              experienceNone: t.expOpt1 || '',
              experience1to3: t.expOpt2 || '',
              experience3to5: t.expOpt3 || '',
              experience5plus: t.expOpt4 || '',
              profession: t.empCandProfession || '',
              anyProfession: t.empCandAnyProfession || '',
              sector: t.empCandSector || '',
              anySector: t.empCandAnySector || '',
              country: t.empCandCountry || '',
              anyCountry: t.empCandAnyCountry || '',
              language: t.empCandLanguage || '',
              anyLanguage: t.empCandAnyLanguage || '',
              shift: t.empCandShift || '',
              anyShift: t.empCandAnyShift || '',
              shiftYes: t.empCandShiftYes || '',
              shiftNo: t.empCandShiftNo || '',
              clear: t.empCandClear || '',
              showing: t.empCandShowing || '{shown} / {total}',
              empty: t.empNoCandidates || '',
              noMatch: t.empCandNoMatch || '',
              years: t.empCandYears || '{years}',
              fullName: t.fullNameCol || '',
              professionCol: t.professionCol || '',
              nationality: t.nationalityCol || '',
              action: t.actionCol || '',
              interview: t.interviewReqBtn || '',
              select: t.selectBtn || '',
              selected: t.selectedBtn || '',
              unselect: t.unselectBtn || '',
              notPresented: t.selectionNotPresented || '',
              reject: t.rejectBtn || '',
              rejected: t.rejectedBtn || '',
              undo: t.undoDecisionBtn || '',
              enteredByStaff: t.enteredByStaffBadge || '',
              confirm: t.confirmDecisionBtn || '',
              forRequest: t.forRequestLabel || '{position}',
              specialist: ui.specialist,
              general: ui.general,
              videoTitle: t.youtubeVideoTitle || '',
              videoEmpty: t.youtubeVideoEmpty || '',
              videoWatch: t.youtubeVideoWatch || t.watchVideo,
              videoOpen: t.youtubeVideoOpen || '',
            }}
            lang={currentLang}
            sectorLabel={(sector) => sectorFilterLabel(sector, t)}
            onInterview={handleRequestInterview}
            onSelect={handleSelectCandidate}
            onUnselect={handleUnselectCandidate}
            onReject={handleRejectCandidate}
            onConfirm={handleConfirmDecision}
            busyMatchId={decidingMatchId}
          />
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
                <div className="p-8 text-center text-muted-foreground text-xs">{t.empNoInterviews}</div>
              ) : (
                interviews.map((item, idx) => (
                  <div key={item.id || idx} className="p-4 bg-slate-50 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-950 text-sm">{item.candidate_name || candidates.find((x: any) => x.id === item.candidate_id)?.full_name || ui.candidateWord}</span>
                        <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">{candidateProfessionLabel(item.position || candidates.find((x: any) => x.id === item.candidate_id)?.profession, ui.positionWord, currentLang)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> {formatInterviewTime(item.scheduled_at, dateLocale[currentLang])} | 💻 {item.platform || ui.onlineMeeting}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-xl uppercase">
                        {ui.intStatus[item.status] || item.status || ui.planned}
                      </span>
                      {joinableMeetingUrl(item.meeting_url) ? (
                        <a
                          href={joinableMeetingUrl(item.meeting_url) || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={t.meetingOpensNewTab}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Video className="w-3.5 h-3.5" aria-hidden /> {t.joinInterviewBtn}
                          <span className="sr-only"> ({t.meetingOpensNewTab})</span>
                        </a>
                      ) : (
                        <span className="text-xs font-semibold text-slate-700">{t.meetingLinkPending}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t pt-4 space-y-2">
              <h4 className="text-sm font-extrabold text-slate-950">{ui.ioJobOffers} ({employerOffers.length})</h4>
              {employerOffers.map((offer) => (
                <div key={offer.id} className="p-3 bg-slate-50 rounded-xl border text-sm text-slate-900">
                  <div className="font-extrabold">{releaseCopy[currentLang].offerCandidate}: {offer.candidate_name || '—'} — {localizeCatalogTitle(offer.position_title, currentLang) || '—'}</div>
                  <div className="text-xs font-semibold text-slate-800">
                    {ui.offerSalary}: {offerMoney(offer) || ui.salaryNotSet} · {ui.status}: {offerStatusLabel(offer.status, ui.offerStatus)}
                  </div>
                </div>
              ))}
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
              <div className="p-8 text-center text-muted-foreground text-xs">{t.empNoSelected}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCandidates.map((cand, idx) => (
                  <div key={cand.match_id || cand.id || idx} className="p-4 bg-white rounded-2xl border shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-slate-950 text-sm">{cand.full_name || cand.name}</h4>
                        <p className="text-xs text-muted-foreground">{candidateProfessionLabel(cand.profession, ui.specialist, currentLang)} • {cand.nationality || '—'}</p>
                        {cand.request_position_title && (
                          <p className="text-xs font-semibold text-slate-700">
                            {fill(t.forRequestLabel || '{position}', { position: localizeCatalogTitle(cand.request_position_title, currentLang) })}
                          </p>
                        )}
                      </div>
                      <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {t.approvedAndProcessing}
                      </span>
                    </div>
                    <CandidateYouTube
                      videos={cand}
                      labels={{
                        title: t.youtubeVideoTitle || '',
                        empty: t.youtubeVideoEmpty || '',
                        watch: t.youtubeVideoWatch || t.watchVideo,
                        open: t.youtubeVideoOpen || '',
                      }}
                      compact
                    />
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {cand.decision_source === 'staff' && (
                        <>
                          <span className="mr-auto rounded-full bg-status-info-bg px-2.5 py-1 text-[10px] font-extrabold text-status-info">
                            {t.enteredByStaffBadge}
                          </span>
                          <button
                            type="button"
                            disabled={decidingMatchId === cand.match_id}
                            onClick={() => handleConfirmDecision(cand)}
                            className="cursor-pointer rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:bg-disabled disabled:text-on-dark"
                          >
                            {t.confirmDecisionBtn}
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        disabled={decidingMatchId === cand.match_id}
                        onClick={() => handleUnselectCandidate(cand)}
                        className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 disabled:cursor-wait disabled:border-transparent disabled:bg-disabled disabled:text-on-dark"
                      >
                        {t.unselectBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 6-8. İŞLEM DURUMU, SEYAHAT, AKTİF ÇALIŞANLAR (employer_placements) */}
        {(activeTab === 'status' || activeTab === 'travel' || activeTab === 'employees') && (
          <EmployerPlacementTabs
            tab={activeTab}
            rows={placements}
            load={placementsLoad}
            staffView={staffView}
            t={t}
            steps={ui.steps}
            isRtl={isRtl}
            lang={currentLang}
          />
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
                <button type="submit" className="w-full bg-brand-solid hover:bg-brand text-white py-3.5 rounded-xl font-bold cursor-pointer text-xs sm:text-sm">
                  {t.sendBtn}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-950 border-b pb-3">{t.supportHistoryTitle}</h3>
              {supportTickets.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-xs">{t.noSupportYet}</div>
              ) : (
                <div className="space-y-3">
                  {supportTickets.map((tkt) => (
                    <div key={tkt.id} className="p-4 bg-slate-50 rounded-2xl border space-y-1 text-xs">
                      <div className="flex justify-between font-bold text-slate-950">
                        <span>{tkt.subject}</span>
                        <span className="text-emerald-700 uppercase text-[10px]">{supportStatusLabel(tkt.status, releaseCopy[currentLang])}</span>
                      </div>
                      <p className="text-muted-foreground">{tkt.created_at ? new Date(tkt.created_at).toLocaleString(dateLocale[currentLang]) : ''}</p>
                      <p className="text-slate-700">{tkt.message}</p>
                      <p className="text-slate-800 font-semibold">{releaseCopy[currentLang].supportReply}: {tkt.admin_reply || releaseCopy[currentLang].supportNoReply}</p>
                      {tkt.replied_by_name ? <p className="text-muted-foreground">{releaseCopy[currentLang].supportReplied}: {tkt.replied_by_name}{tkt.replied_at ? ` · ${new Date(tkt.replied_at).toLocaleString(dateLocale[currentLang])}` : ''}</p> : null}
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
                  <input type="text" required value={editCompanyName} onChange={(e) => setEditCompanyName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-950 font-semibold" />
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
                className="bg-brand-solid hover:bg-brand disabled:bg-disabled disabled:text-on-dark disabled:opacity-100 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition shadow cursor-pointer"
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
