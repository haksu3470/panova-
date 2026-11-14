'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import { FilePicker } from '@/components/site/FilePicker';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { isStaff, signOut } from '@/lib/auth';
import { EmployerWriteError, staffViewEmployerId, toEmployerProfileView, type EmployerRow } from '@/lib/employerProfile';
import { offerMoney, offerStatusLabel } from '@/lib/offers';
import { DEFAULT_SALARY_CURRENCY, SALARY_CURRENCIES, SALARY_CURRENCY_SYMBOL, salaryCurrency, type SalaryCurrency } from '@/lib/money';
import { employerService } from '@/lib/services/employerService';
import { 
  Building2, Users, FileText, Plus, CheckCircle, Clock, Trash2, Send, AlertCircle, CheckSquare, Briefcase, MapPin, Calendar, DollarSign, Download, ShieldCheck, HeartHandshake, UploadCloud, Check, Video, Star, CheckCircle2, BookOpen, X
} from 'lucide-react';
import OverviewCard from '@/components/portal/OverviewCard';
import {
  canOfferRequestDelete,
  EMPLOYER_CARD_TARGETS,
  EMPLOYER_OVERVIEW_CARDS,
  employerCardAriaLabel,
  employerCardValue,
  requestDeleteOutcome,
  type EmployerOverviewCard,
} from '@/lib/employerOverview';
import Link from 'next/link';
import { Language, translations } from '@/lib/dictionary';
import { demandStatusLabel } from '@/lib/demandStatus';
import { localizeCatalogTitle, professionLabel, professionsForSector, sectorOptions } from '@/lib/professions';
import { dateLocale, fill, optionLabel, portalUi } from '@/lib/portal-ui-copy';
import {
  benefitPhrase,
  buildEmployerDemandInsert,
  demandFieldMessage,
  demandRuleFromDbError,
  displayedRequestSalary,
  firstInvalidDemandField,
  HEADCOUNT_MAX,
  HEADCOUNT_MIN,
  validateDemandForm,
  type DemandField,
  type DemandFieldErrors,
  type YesNo,
} from '@/lib/workforceRequest';
import {
  DURATION_AMOUNT_MAX,
  DURATION_AMOUNT_MIN,
  canonicalDuration,
  formatContractDuration,
  localIsoDate,
  type DurationUnitChoice,
} from '@/lib/contractDuration';
import { HeaderActions, PageHeader } from '@/components/site/PageHeader';
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
import { officialProcessText, startedEmployees, toPlacements, type EmployerPlacement } from '@/lib/employerPlacements';
import ListExportBar from '@/components/portal/ListExportBar';
import {
  employerEmployeeRows,
  employerOfferRows,
  employerRequestRows,
  employerSelectedRows,
  type EmployerExportCopy,
} from '@/lib/employerExport';
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
  const [demandCurrency, setDemandCurrency] = useState<SalaryCurrency>(DEFAULT_SALARY_CURRENCY);
  // Duration: number + unit (or open-ended), stored as canonical text in contract_type.
  const [demandDurationAmount, setDemandDurationAmount] = useState('');
  const [demandDurationUnit, setDemandDurationUnit] = useState<DurationUnitChoice>('');
  const [demandStartDate, setDemandStartDate] = useState('');
  const [demandExperience, setDemandExperience] = useState('');
  const [demandLanguageReq, setDemandLanguageReq] = useState('');
  const [demandAccommodation, setDemandAccommodation] = useState<YesNo>('');
  const [demandFood, setDemandFood] = useState<YesNo>('');
  /** Form-level message: fields to fix, company name missing, or save failed. */
  const [demandError, setDemandError] = useState<'invalid' | 'company' | 'save' | ''>('');
  /** One message per field, shown under that field. */
  const [demandFieldErrors, setDemandFieldErrors] = useState<DemandFieldErrors>({});

  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  /** Section a summary card asked for; scrolled to and focused once its tab is shown. */
  // n grows on every click, so clicking the same card twice scrolls again; a
  // jump is handled once (later tab changes do not scroll back to it).
  const [cardJump, setCardJump] = useState<{ anchor: string; n: number } | null>(null);
  const handledJump = useRef(0);
  useEffect(() => {
    if (!cardJump || cardJump.n === handledJump.current) return;
    const el = document.getElementById(cardJump.anchor);
    if (!el) return;
    handledJump.current = cardJump.n;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
  }, [cardJump, activeTab]);

  /** Per request: delete in progress, or the message after a refused/failed delete. */
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [requestDeleteMsg, setRequestDeleteMsg] = useState<{ id: string; text: string } | null>(null);

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

  const demandErrorMessage = (code: 'invalid' | 'company' | 'save') => {
    if (code === 'invalid') return t.demandErrSummary || '';
    if (code === 'company') return t.demandErrCompanyName || '';
    return t.demandSaveFailed || '';
  };

  /** Element that gets focus for each field (the first sector button for the sector group). */
  const DEMAND_FIELD_FOCUS: Record<DemandField, string> = {
    sector: 'demand-sector-first',
    position: selectedSector ? 'demand-position-pick' : 'demand-position-custom',
    experience: 'demand-experience',
    language: 'demand-language',
    headcount: 'demand-headcount',
    city: 'demand-city',
    salary: 'demand-salary',
    duration: demandDurationUnit && demandDurationUnit !== 'open' ? 'demand-duration' : 'demand-duration-unit',
    startDate: 'demand-start-date',
    lodging: 'demand-lodging',
    meals: 'demand-meals',
  };
  const demandErrorId = (field: DemandField) => `demand-${field}-error`;
  /** aria-invalid / aria-describedby for a field with an error. */
  const demandAria = (field: DemandField) => (demandFieldErrors[field]
    ? { 'aria-invalid': true as const, 'aria-describedby': demandErrorId(field) }
    : {});
  const demandFieldNote = (field: DemandField) => {
    const error = demandFieldErrors[field];
    if (!error) return null;
    return (
      <p id={demandErrorId(field)} className="mt-1 text-xs font-bold text-status-bad">
        {demandFieldMessage(field, error, t)}
      </p>
    );
  };
  const demandFieldClass = (field: DemandField) => (demandFieldErrors[field] ? 'border-status-bad ring-1 ring-status-bad' : 'border-line');
  /** Editing a field clears its own message (and the form-level summary). */
  const clearDemandField = (field: DemandField) => {
    setDemandFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setDemandError((prev) => (prev === 'save' || prev === 'company' ? prev : ''));
  };
  const showDemandErrors = (errors: DemandFieldErrors) => {
    setDemandFieldErrors(errors);
    setDemandError('invalid');
    const first = firstInvalidDemandField(errors);
    if (first) {
      const id = DEMAND_FIELD_FOCUS[first];
      window.setTimeout(() => document.getElementById(id)?.focus(), 0);
    }
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
    setDemandCurrency(DEFAULT_SALARY_CURRENCY);
    setDemandDurationAmount('');
    setDemandDurationUnit('');
    setDemandStartDate('');
    setDemandExperience('');
    setDemandLanguageReq('');
    setDemandAccommodation('');
    setDemandFood('');
    setDemandError('');
    setDemandFieldErrors({});
  };

  const handleCreateCorporateDemand = async (e: React.FormEvent) => {
    e.preventDefault();

    const headcount = Number(demandHeadcount);
    // Catalog keys (localized wherever the title is shown), then the free text as typed.
    const positionTitle = [...selectedPositions, customPosition.trim()].filter(Boolean).join(', ');
    const fieldErrors = validateDemandForm({
      sector: selectedSector,
      positionTitle,
      experience: demandExperience,
      language: demandLanguageReq,
      headcountText: demandHeadcount,
      city: demandCity,
      salaryText: demandSalary,
      durationUnit: demandDurationUnit,
      durationAmountText: demandDurationAmount,
      startDate: demandStartDate,
      today: localIsoDate(),
      lodging: demandAccommodation,
      meals: demandFood,
    });
    if (firstInvalidDemandField(fieldErrors)) {
      showDemandErrors(fieldErrors);
      return;
    }
    setDemandFieldErrors({});
    if (!employerProfile?.companyName?.trim()) {
      setDemandError('company');
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
      currency: demandCurrency,
      duration: canonicalDuration(demandDurationUnit, demandDurationAmount) || '',
      startDate: demandStartDate,
      experience: demandExperience,
      language: optionLabel(ui.languageOptions, demandLanguageReq),
      lodging: demandAccommodation,
      meals: demandFood,
    });
    if (!built.ok) {
      // validateDemandForm already covers these; kept as a safety net.
      const field: DemandField = built.error === 'salary' ? 'salary' : built.error === 'position' ? 'position' : built.error === 'meals' ? 'meals' : 'lodging';
      showDemandErrors({ [field]: built.error === 'salary' ? 'salary_number' : 'required' });
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
      // A database rule refusal (23514, job_requests_* rule) is shown under its field.
      const rule = demandRuleFromDbError(error);
      if (rule?.field === 'company') setDemandError('company');
      else if (rule) showDemandErrors({ [rule.field]: rule.error });
      else setDemandError('save');
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

  // Summary cards: same totals as before, now at the top and clickable.
  const cardLabel: Record<EmployerOverviewCard, string> = {
    openRequests: t.openRequestsCard || '',
    candidates: t.totalCandidatesCard || '',
    interviews: t.empTabInterviews || '',
    selected: t.empTabSelected || '',
  };
  const cardSection: Record<EmployerOverviewCard, string> = {
    openRequests: t.activeDemandFilesTitle || '',
    candidates: t.candidatesTab || '',
    interviews: t.empTabInterviews || '',
    selected: t.empTabSelected || '',
  };
  const cardStyle: Record<EmployerOverviewCard, { value: string; icon: React.ReactNode }> = {
    openRequests: { value: 'text-emerald-700', icon: <FileText className="w-9 h-9 sm:w-10 sm:h-10 text-emerald-700 bg-emerald-50 p-2 rounded-xl shrink-0" aria-hidden="true" /> },
    candidates: { value: 'text-blue-700', icon: <Users className="w-9 h-9 sm:w-10 sm:h-10 text-blue-700 bg-blue-50 p-2 rounded-xl shrink-0" aria-hidden="true" /> },
    interviews: { value: 'text-amber-700', icon: <Video className="w-9 h-9 sm:w-10 sm:h-10 text-amber-700 bg-amber-50 p-2 rounded-xl shrink-0" aria-hidden="true" /> },
    selected: { value: 'text-purple-700', icon: <Star className="w-9 h-9 sm:w-10 sm:h-10 text-purple-700 bg-purple-50 p-2 rounded-xl shrink-0" aria-hidden="true" /> },
  };
  const openCard = (card: EmployerOverviewCard) => {
    const target = EMPLOYER_CARD_TARGETS[card];
    setActiveTab(target.tab);
    setCardJump((prev) => ({ anchor: target.anchor, n: (prev?.n ?? 0) + 1 }));
  };

  /**
   * Employer deletes their own request. RLS (emp_requests_delete) allows it
   * only while the request has no match, interview or offer; otherwise 0 rows
   * come back and the request stays.
   */
  const handleDeleteRequest = async (requestId: string) => {
    if (!window.confirm(t.empRequestDeleteConfirm || '')) return;
    setDeletingRequestId(requestId);
    setRequestDeleteMsg(null);
    const { data, error } = await supabase.from('job_requests').delete().eq('id', requestId).select('id');
    setDeletingRequestId(null);
    const outcome = requestDeleteOutcome({ error, data });
    if (outcome === 'deleted') {
      fetchEmployerData();
      return;
    }
    if (error) console.error('job request delete failed', error.code || error.message);
    setRequestDeleteMsg({
      id: requestId,
      text: (outcome === 'has_activity' ? t.empRequestHasActivity : t.empRequestDeleteFailed) || '',
    });
  };

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

  // Exports: whitelisted rows (lib/employerExport.ts) from the lists this page
  // already loaded. No audit row: audit_logs only accepts staff inserts.
  const exportCopy: EmployerExportCopy = {
    requestStatus: (status) => requestStatusText(status),
    offerStatus: (status) => offerStatusLabel(status, ui.offerStatus),
    duration: (value) => formatContractDuration(value, currentLang, t),
    officialProcess: (status) => officialProcessText(status, ui.steps, t.plProcessStopped || ui.steps.rejected),
  };
  const exportBar = (filename: string, title: string | undefined, rows: Record<string, unknown>[]) => (
    <ListExportBar
      filename={filename}
      title={title || filename}
      rows={rows}
      audit={false}
      lang={currentLang}
      dir={isRtl ? 'rtl' : 'ltr'}
      labels={{ csv: ui.exportCsv, excel: ui.exportExcel, print: ui.exportPrint, empty: ui.exportEmpty, popupBlocked: ui.exportPopupBlocked }}
    />
  );

  const renderDemandCard = (dem: {
    id?: string;
    employer_id?: string | null;
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
    salary_currency?: string | null;
    contract_type?: string | null;
    target_start_date?: string | null;
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
            <p className="text-xs text-muted-foreground">📍 {dem.city || '—'} | 💰 {displayedRequestSalary(dem, dateLocale[currentLang]) || '—'}</p>
            {dem.contract_type || dem.target_start_date ? (
              <p className="text-xs text-muted-foreground">
                {dem.contract_type ? <>⏳ {t.durationLabel}: {formatContractDuration(dem.contract_type, currentLang, t)}</> : null}
                {dem.contract_type && dem.target_start_date ? ' | ' : null}
                {dem.target_start_date ? <>📅 {t.startDateLabel}: {dem.target_start_date}</> : null}
              </p>
            ) : null}
            <p className="text-xs text-muted-foreground">{t.facilityAccommodation}: {benefitText(dem.accommodation_provided)} · {t.facilityFood}: {benefitText(dem.food_provided)}</p>
          </div>
          <div className="text-end">
            <span className="font-bold text-status-ok bg-status-ok-bg px-3 py-1.5 rounded-xl text-xs">{t.statusLabel}: {requestStatusText(dem.status)}</span>
            <div className="text-[11px] text-muted-foreground mt-1">📅 {dem.created_at ? String(dem.created_at).substring(0, 10) : '—'}</div>
            {/* Only the employer's own request with no activity, never in staff view. */}
            {dem.id && !staffView && dem.employer_id === employerProfile?.id && canOfferRequestDelete(pipelineCountsFor(pipelineCounts, dem.id)) ? (
              <button
                type="button"
                onClick={() => handleDeleteRequest(String(dem.id))}
                disabled={deletingRequestId === dem.id}
                aria-label={`${t.empRequestDelete}: ${title}`}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-800 underline cursor-pointer disabled:cursor-wait"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> {t.empRequestDelete}
              </button>
            ) : null}
          </div>
        </div>
        {requestDeleteMsg && requestDeleteMsg.id === dem.id ? (
          <p role="alert" className="text-xs font-bold text-status-bad bg-status-bad-bg border border-status-bad rounded-xl px-3 py-2">{requestDeleteMsg.text}</p>
        ) : null}
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
        <PageHeader
          start={
          <>
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

            <div data-header-user className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="font-bold text-slate-950">{fill(ui.authorized, { name: editContactPerson || employerProfile?.contactPerson || '' })}</span>
            </div>
          </>
          }
          actions={
            <HeaderActions
              lang={currentLang}
              onLanguageChange={changeLanguage}
              homeLabel={t.returnHome}
              logoutLabel={t.logout}
              onLogout={handleLogout}
              extra={typeof window !== 'undefined' && JSON.parse(localStorage.getItem('panova_employer_user') || '{}')?.isAdminImpersonation && (
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
            />
          }
        />

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

        {/* Summary cards, on every tab: totals of the same request_pipeline_counts
            rows as the request cards (a dash when unknown). Each opens its section. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EMPLOYER_OVERVIEW_CARDS.map((card) => {
            const value = formatCount(employerCardValue(card, pipelineTotals));
            return (
              <OverviewCard
                key={card}
                label={cardLabel[card]}
                value={value}
                valueClassName={cardStyle[card].value}
                icon={cardStyle[card].icon}
                onOpen={() => openCard(card)}
                ariaLabel={employerCardAriaLabel(t.empCardGoTo, cardLabel[card], value, cardSection[card])}
              />
            );
          })}
        </div>

        {/* 1. ANA SAYFA */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 id="employer-requests-heading" tabIndex={-1} className="font-extrabold text-foreground text-base scroll-mt-4 outline-none focus-visible:ring-2 focus-visible:ring-brand-solid rounded">{t.activeDemandFilesTitle} ({jobDemands.length})</h2>
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
              {jobDemands.length > 0 ? exportBar('my-requests', t.activeDemandFilesTitle, employerRequestRows(jobDemands, currentLang, exportCopy)) : null}
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
                  <p id="demand-sector-label" className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">1. {t.selectSectorLabel} *</p>
                  <div role="group" aria-labelledby="demand-sector-label" {...demandAria('sector')} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sectorOptions(currentLang).map((sector, index) => (
                      <button
                        type="button"
                        key={sector.value}
                        id={index === 0 ? 'demand-sector-first' : undefined}
                        aria-pressed={selectedSector === sector.value}
                        aria-describedby={index === 0 && demandFieldErrors.sector ? demandErrorId('sector') : undefined}
                        onClick={() => { setSelectedSector(sector.value); setCatalogPick(''); clearDemandField('sector'); }}
                        className={`p-4 rounded-xl border text-start transition cursor-pointer flex items-center justify-between gap-2 ${
                          selectedSector === sector.value ? 'bg-status-ok-bg border-brand ring-2 ring-brand text-status-ok font-extrabold' : 'bg-slate-50 border-line text-foreground font-semibold'
                        }`}
                      >
                        <span>{SECTOR_ICON[sector.value] || '•'} {sector.label}</span>
                        {selectedSector === sector.value && <Check className="w-4 h-4 shrink-0 text-status-ok" aria-hidden />}
                      </button>
                    ))}
                  </div>
                  {demandFieldNote('sector')}
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
                      {...demandAria('position')}
                      onChange={(e) => {
                        if (e.target.value && !selectedPositions.includes(e.target.value)) togglePositionSelection(e.target.value);
                        setCatalogPick('');
                        clearDemandField('position');
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${demandFieldClass('position')} text-xs bg-card text-foreground font-semibold cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-100`}
                    >
                      <option value="">{selectedSector ? t.positionPickPlaceholder : t.selectSectorFirst}</option>
                      {professionsForSector(selectedSector)
                        .filter((item) => !selectedPositions.includes(item.key))
                        .map((item) => (
                          <option key={item.key} value={item.key}>{item.labels[currentLang]}</option>
                        ))}
                    </select>

                    <input
                      id="demand-position-custom"
                      type="text"
                      placeholder={t.otherPositionPlaceholder}
                      aria-label={t.otherPositionPlaceholder}
                      {...demandAria('position')}
                      value={customPosition}
                      onChange={(e) => { setCustomPosition(e.target.value); clearDemandField('position'); }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${demandFieldClass('position')} text-xs bg-card text-foreground font-medium`}
                    />
                  </div>
                  {demandFieldNote('position')}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="demand-experience" className="block text-xs font-bold uppercase text-foreground mb-1">⏱️ {t.experienceLabel} *</label>
                    <select id="demand-experience" required aria-required="true" {...demandAria('experience')} value={demandExperience} onChange={(e) => { setDemandExperience(e.target.value); clearDemandField('experience'); }} className={`w-full px-3.5 py-2.5 rounded-xl border ${demandFieldClass('experience')} text-xs font-semibold bg-card text-foreground cursor-pointer`}>
                      <option value="">{t.benefitSelectPlaceholder}</option>
                      {experienceOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                    {demandFieldNote('experience')}
                  </div>
                  <div>
                    <label htmlFor="demand-language" className="block text-xs font-bold uppercase text-foreground mb-1">🗣️ {t.languageReqLabel} *</label>
                    <select id="demand-language" required aria-required="true" {...demandAria('language')} value={demandLanguageReq} onChange={(e) => { setDemandLanguageReq(e.target.value); clearDemandField('language'); }} className={`w-full px-3.5 py-2.5 rounded-xl border ${demandFieldClass('language')} text-xs font-semibold bg-card text-foreground cursor-pointer`}>
                      <option value="">{t.benefitSelectPlaceholder}</option>
                      {ui.languageOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                    </select>
                    {demandFieldNote('language')}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label htmlFor="demand-headcount" className="block text-xs font-bold uppercase text-foreground mb-1">{t.headcountLabel} *</label>
                    <input id="demand-headcount" type="number" inputMode="numeric" min={HEADCOUNT_MIN} max={HEADCOUNT_MAX} step="1" required aria-required="true" {...demandAria('headcount')} placeholder={t.headcountPlaceholder} value={demandHeadcount} onChange={(e) => { setDemandHeadcount(e.target.value); clearDemandField('headcount'); }} className={`w-full px-3 py-2.5 rounded-xl border ${demandFieldClass('headcount')} text-xs font-semibold bg-card text-foreground`} />
                    {demandFieldNote('headcount')}
                  </div>
                  <div>
                    <label htmlFor="demand-city" className="block text-xs font-bold uppercase text-foreground mb-1">{t.cityLocationLabel} *</label>
                    <input id="demand-city" type="text" required aria-required="true" {...demandAria('city')} placeholder={t.cityPlaceholder} value={demandCity} onChange={(e) => { setDemandCity(e.target.value); clearDemandField('city'); }} className={`w-full px-3 py-2.5 rounded-xl border ${demandFieldClass('city')} text-xs font-semibold bg-card text-foreground`} />
                    {demandFieldNote('city')}
                  </div>
                  <div>
                    <label htmlFor="demand-salary" className="block text-xs font-bold uppercase text-foreground mb-1">{t.salaryOfferLabel} *</label>
                    {/* Numbers only; the currency has its own list (EUR by default). */}
                    <div className="flex gap-2">
                      <input
                        id="demand-salary"
                        type="text"
                        inputMode="decimal"
                        required
                        aria-required="true"
                        {...demandAria('salary')}
                        aria-describedby={['demand-salary-hint', demandFieldErrors.salary ? demandErrorId('salary') : ''].filter(Boolean).join(' ')}
                        placeholder={fill(t.salaryNumberPlaceholder || '', { symbol: SALARY_CURRENCY_SYMBOL[demandCurrency] })}
                        value={demandSalary}
                        onChange={(e) => { setDemandSalary(e.target.value); clearDemandField('salary'); }}
                        className={`min-w-0 flex-1 px-3 py-2.5 rounded-xl border ${demandFieldClass('salary')} text-xs font-semibold bg-card text-foreground`}
                      />
                      <select
                        id="demand-salary-currency"
                        aria-label={ui.offerCurrency}
                        value={demandCurrency}
                        onChange={(e) => setDemandCurrency(salaryCurrency(e.target.value))}
                        className="w-20 shrink-0 px-2 py-2.5 rounded-xl border border-line text-xs font-bold bg-card text-foreground cursor-pointer"
                      >
                        {SALARY_CURRENCIES.map((code) => <option key={code} value={code}>{code} ({SALARY_CURRENCY_SYMBOL[code]})</option>)}
                      </select>
                    </div>
                    <p id="demand-salary-hint" className="mt-1 text-[11px] font-medium text-muted-foreground">
                      {fill(t.salaryNumberHint || '', { symbol: SALARY_CURRENCY_SYMBOL[demandCurrency] })}
                    </p>
                    {demandFieldNote('salary')}
                  </div>
                  <fieldset>
                    <legend className="block text-xs font-bold uppercase text-foreground mb-1">{t.durationLabel} *</legend>
                    {/* Number (1-999) + unit, or open-ended (the number field is then closed). */}
                    <div className="flex flex-wrap gap-2">
                      <input
                        id="demand-duration"
                        type="number"
                        inputMode="numeric"
                        min={DURATION_AMOUNT_MIN}
                        max={DURATION_AMOUNT_MAX}
                        step={1}
                        aria-label={t.durationAmountLabel}
                        aria-required={demandDurationUnit !== 'open'}
                        {...demandAria('duration')}
                        disabled={demandDurationUnit === 'open'}
                        value={demandDurationUnit === 'open' ? '' : demandDurationAmount}
                        onChange={(e) => { setDemandDurationAmount(e.target.value); clearDemandField('duration'); }}
                        className={`w-24 min-w-0 px-3 py-2.5 rounded-xl border ${demandFieldClass('duration')} text-xs font-semibold bg-card text-foreground disabled:cursor-not-allowed disabled:bg-slate-100`}
                      />
                      <select
                        id="demand-duration-unit"
                        required
                        aria-required="true"
                        aria-label={t.durationUnitLabel}
                        {...demandAria('duration')}
                        value={demandDurationUnit}
                        onChange={(e) => { setDemandDurationUnit(e.target.value as DurationUnitChoice); clearDemandField('duration'); }}
                        className={`min-w-0 flex-1 px-3 py-2.5 rounded-xl border ${demandFieldClass('duration')} text-xs font-semibold bg-card text-foreground cursor-pointer`}
                      >
                        <option value="">{t.durationUnitPlaceholder}</option>
                        <option value="gün">{t.durationUnitDay}</option>
                        <option value="hafta">{t.durationUnitWeek}</option>
                        <option value="ay">{t.durationUnitMonth}</option>
                        <option value="yıl">{t.durationUnitYear}</option>
                        <option value="open">{t.durationOpenEnded}</option>
                      </select>
                    </div>
                    {demandFieldNote('duration')}
                  </fieldset>
                  <div>
                    <label htmlFor="demand-start-date" className="block text-xs font-bold uppercase text-foreground mb-1">{t.startDateLabel}</label>
                    <input
                      id="demand-start-date"
                      type="date"
                      min={localIsoDate()}
                      {...demandAria('startDate')}
                      aria-describedby={['demand-start-date-hint', demandFieldErrors.startDate ? demandErrorId('startDate') : ''].filter(Boolean).join(' ')}
                      value={demandStartDate}
                      onChange={(e) => { setDemandStartDate(e.target.value); clearDemandField('startDate'); }}
                      className={`w-full px-3 py-2.5 rounded-xl border ${demandFieldClass('startDate')} text-xs font-semibold bg-card text-foreground`}
                    />
                    <p id="demand-start-date-hint" className="mt-1 text-[11px] font-medium text-muted-foreground">{t.startDateHint}</p>
                    {demandFieldNote('startDate')}
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
                        {...demandAria('lodging')}
                        value={demandAccommodation}
                        onChange={(e) => { setDemandAccommodation(e.target.value as YesNo); clearDemandField('lodging'); }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border ${demandFieldClass('lodging')} text-xs font-semibold bg-card text-foreground cursor-pointer`}
                      >
                        <option value="">{t.benefitSelectPlaceholder}</option>
                        <option value="yes">{t.benefitProvided}</option>
                        <option value="no">{t.benefitNotProvided}</option>
                      </select>
                      {demandFieldNote('lodging')}
                    </div>
                    <div>
                      <label htmlFor="demand-meals" className="block text-xs font-bold uppercase text-foreground mb-1">{t.facilityFood} *</label>
                      <select
                        id="demand-meals"
                        required
                        aria-required="true"
                        {...demandAria('meals')}
                        value={demandFood}
                        onChange={(e) => { setDemandFood(e.target.value as YesNo); clearDemandField('meals'); }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border ${demandFieldClass('meals')} text-xs font-semibold bg-card text-foreground cursor-pointer`}
                      >
                        <option value="">{t.benefitSelectPlaceholder}</option>
                        <option value="yes">{t.benefitProvided}</option>
                        <option value="no">{t.benefitNotProvided}</option>
                      </select>
                      {demandFieldNote('meals')}
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
          <section id="employer-candidates-section" tabIndex={-1} aria-label={t.candidatesTitle || t.candidatesTab} className="scroll-mt-4 outline-none focus-visible:ring-2 focus-visible:ring-brand-solid rounded-2xl">
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
          </section>
        )}

        {/* 4. GÖRÜŞMELER (DİNAMİK ÇEVİRİ DESTEKLİ) */}
        {activeTab === 'interviews' && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 id="employer-interviews-heading" tabIndex={-1} className="text-base sm:text-lg font-extrabold text-slate-950 flex items-center gap-2 scroll-mt-4 outline-none focus-visible:ring-2 focus-visible:ring-brand-solid rounded">
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
              {employerOffers.length > 0 ? exportBar('my-offers', ui.ioJobOffers, employerOfferRows(employerOffers, currentLang, exportCopy)) : null}
              {employerOffers.map((offer) => (
                <div key={offer.id} className="p-3 bg-slate-50 rounded-xl border text-sm text-slate-900">
                  <div className="font-extrabold">{releaseCopy[currentLang].offerCandidate}: {offer.candidate_name || '—'} — {localizeCatalogTitle(offer.position_title, currentLang) || '—'}</div>
                  <div className="text-xs font-semibold text-slate-800">
                    {ui.offerSalary}: {offerMoney(offer, dateLocale[currentLang]) || ui.salaryNotSet} · {ui.status}: {offerStatusLabel(offer.status, ui.offerStatus)}
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
              <h3 id="employer-selected-heading" tabIndex={-1} className="text-base sm:text-lg font-extrabold text-slate-950 flex items-center gap-2 scroll-mt-4 outline-none focus-visible:ring-2 focus-visible:ring-brand-solid rounded">
                <Star className="w-5 h-5 text-purple-600" /> {t.selectedCandidatesTitle}
              </h3>
              <span className="bg-purple-50 text-purple-800 text-xs font-bold px-3 py-1 rounded-xl border border-purple-200">
                {t.totalSelected}: {selectedCandidates.length}
              </span>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border">
              {t.selectedCandidatesDesc}
            </p>
            {selectedCandidates.length > 0 ? exportBar('selected-candidates', t.selectedCandidatesTitle, employerSelectedRows(selectedCandidates, currentLang)) : null}

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
        {activeTab === 'employees' && placementsLoad === 'ready' && startedEmployees(placements).length > 0 ? (
          <div className="flex justify-end">
            {exportBar('active-employees', t.employeesTab, employerEmployeeRows(startedEmployees(placements), currentLang, exportCopy))}
          </div>
        ) : null}
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
                <div className="flex w-full px-3.5 py-2.5 rounded-xl border bg-slate-50">
                  <FilePicker lang={currentLang} accept="image/*" onChange={handleLogoFileChange} label={t.uploadLogoLabel} />
                </div>
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
