'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import DocumentStatusPanel from '@/components/portal/DocumentStatusPanel';
import CandidateYouTubeEditor from '@/components/portal/CandidateYouTubeEditor';
import InterviewOfferPanel from '@/components/portal/InterviewOfferPanel';
import { offerTermsPayload } from '@/lib/offers';
import { DEFAULT_SALARY_CURRENCY, SALARY_CURRENCY_SYMBOL } from '@/lib/money';
import PlacementPanel from '@/components/portal/PlacementPanel';
import OfficialProcessBadge from '@/components/portal/OfficialProcessBadge';
import CandidateStatusControl from '@/components/portal/CandidateStatusControl';
import DocumentPreviewModal from '@/components/portal/DocumentPreviewModal';
import { useStaffRole } from '@/components/portal/useStaffRole';
import { canUpdateRequestStatus } from '@/lib/staffAccess';
import type { CandidateStatusErrorKey } from '@/lib/candidateStatusChange';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { candidateService } from '@/lib/services/candidateService';
import { keepDocumentsJson, mergeDocumentSlots } from '@/lib/candidateDocuments';
import CandidateDocumentsPanel, { type DocumentPreviewRequest } from '@/components/portal/CandidateDocumentsPanel';
import { useCandidateDocuments } from '@/components/portal/useCandidateDocuments';
import { releaseCopy } from '@/lib/release-copy';
import { canPickTravelStatus, hasFlightInfo, staffTravelDisplay, toTravelFields } from '@/lib/employerPlacements';
import { User, Save, Camera, Mail, Phone, KeyRound, FileText, Video, Bell, Send, PlaneTakeoff, FileSignature, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Language, translations } from '@/lib/dictionary';
import { portalUi } from '@/lib/portal-ui-copy';
import { normalizeReferralCode } from '@/lib/referralCode';
import { ReferralCodeChip } from '@/components/portal/ReferralCodeChip';
import { HeaderActions, PageHeader, headerButtonClass, headerPrimaryClass } from '@/components/site/PageHeader';
import { staffLogoutToPortal as handleStaffLogout } from '@/lib/staffLogout';
import { readStoredLanguage, syncDocumentLanguage, writeStoredLanguage } from '@/lib/site-language';
import { candidatePlaceLabel, candidateProfessionLabel } from '@/lib/candidateLabels';
import {
  YouTubeUrlError,
  canManageCandidateVideo,
  candidateVideoWrite,
  isMissingVideoPermissionRpc,
  youtubeSaveFailure,
} from '@/lib/youtube';

function CandidateDetailPageInner() {
  const params = useParams();
  const candidateId = params.id as string;

  const [currentLang, setCurrentLang] = useState<Language>('en');

  useEffect(() => {
    const apply = () => {
      const next = readStoredLanguage('en');
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

  const [candidate, setCandidate] = useState<any | null>(null);
  const [showIO, setShowIO] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState('pending');
  const { role: staffRole, upper: isUpperStaff } = useStaffRole();
  const mayChangeStatus = canUpdateRequestStatus(staffRole);
  const [candidatePhoto, setCandidatePhoto] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const [videoUrl1, setVideoUrl1] = useState('');
  const [videoUrl2, setVideoUrl2] = useState('');
  const [videoUrl3, setVideoUrl3] = useState('');

  const [travelStatus, setTravelStatus] = useState('planned');
  // Bumped after a save so the travel card on the right reads the row again.
  const [placementRefresh, setPlacementRefresh] = useState(0);
  const [flightDate, setFlightDate] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [pnrCode, setPnrCode] = useState('');
  const [accommodationDetails, setAccommodationDetails] = useState('');

  const [closureReason, setClosureReason] = useState('');
  const [isClosed, setIsClosed] = useState(false);

  const [offerEmployer, setOfferEmployer] = useState('');
  const [offerSalary, setOfferSalary] = useState('');
  const [offerDate, setOfferDate] = useState('');
  const [offerTerms, setOfferTerms] = useState('');

  // One document list (candidate_documents) for the body section and the
  // summary card on the right.
  const docs = useCandidateDocuments(candidateId);
  const docItems = mergeDocumentSlots(docs.rows);

  // file_url may be a private storage reference; DocumentPreviewModal signs it.
  const [previewDoc, setPreviewDoc] = useState<DocumentPreviewRequest | null>(null);
  const [canEditVideo, setCanEditVideo] = useState(false);

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSending, setNotifSending] = useState(false);

  const t = translations[currentLang] || translations.en;
  const ui = portalUi[currentLang];
  const isRtl = currentLang === 'ar';

  // Same rule as the candidate's "Your process" card and the employer tabs
  // (lib/employerPlacements): no flight details means "not entered".
  const travelFields = toTravelFields({
    travel_status: travelStatus,
    flight_date: flightDate,
    flight_number: flightNumber,
    departure_city: departureCity,
    arrival_city: arrivalCity,
  });
  const travelDisplay = staffTravelDisplay(travelFields);
  const flightEntered = hasFlightInfo(travelFields);
  
  useEffect(() => {
    fetchCandidateDetail();
  }, [candidateId]);

  useEffect(() => {
    let alive = true;
    const loadPermission = async () => {
      const { data, error } = await supabase.rpc('can_manage_candidate_video');
      if (!alive) return;
      if (!error) {
        setCanEditVideo(data === true);
        return;
      }
      if (!isMissingVideoPermissionRpc(error)) return;
      const { data: session } = await supabase.auth.getSession();
      const uid = session.session?.user.id;
      if (!uid) return;
      const { data: profile } = await supabase.from('profiles').select('staff_role').eq('id', uid).maybeSingle();
      if (!alive) return;
      setCanEditVideo(canManageCandidateVideo(profile?.staff_role));
    };
    loadPermission();
    return () => {
      alive = false;
    };
  }, []);

  const fetchCandidateDetail = async () => {
    setLoading(true);
    try {
      const data = await candidateService.getCandidateById(candidateId);
      if (data) {
        setCandidate(data);
        setStatus(data.status || 'pending');
        
        setCandidatePhoto(data.photo_url || '');
        setCandidatePhone(data.phone || '');
        setCandidateEmail(data.email || '');
        setInternalNotes(data.notes || '');
        
        setVideoUrl1(data.video_url_1 || data.video_url || '');
        setVideoUrl2(data.video_url_2 || '');
        setVideoUrl3(data.video_url_3 || '');

        setTravelStatus(data.travel_status || 'planned');
        setFlightDate(data.flight_date || '');
        setFlightNumber(data.flight_number || '');
        setDepartureCity(data.departure_city || '');
        setArrivalCity(data.arrival_city || '');
        setPnrCode(data.pnr_code || '');
        setAccommodationDetails(data.accommodation_details || '');

        try {
          const parsedMeta = data.documents_json ? JSON.parse(data.documents_json) : {};
          if (parsedMeta && parsedMeta.closure_meta) {
            setIsClosed(parsedMeta.closure_meta.is_closed || false);
            setClosureReason(parsedMeta.closure_meta.closure_reason || '');
          }
        } catch (e) {}
      }
    } catch (err: any) {
      console.error('Aday detay yükleme hatası:', err.message);
    }
    setLoading(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCandidatePhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upper management only (canUpdateRequestStatus). The RPC checks the role
  // and the reason; the stored status is read back afterwards.
  const changeStatus = async (next: string, reason: string): Promise<CandidateStatusErrorKey | null> => {
    const result = await candidateService.setStatus(candidateId, next, reason);
    if (result.errorKey) return result.errorKey;
    await refreshStatus(result.status);
    return null;
  };

  // The status follows the official process in the database; read it again.
  const refreshStatus = async (fallback?: string) => {
    const { data } = await supabase.from('job_candidates').select('status').eq('id', candidateId).maybeSingle();
    const next = data?.status || fallback;
    if (!next) return;
    setStatus(next);
    setCandidate((prev: Record<string, unknown> | null) => (prev ? { ...prev, status: next } : prev));
  };

  const handleSaveDetail = async () => {
    // documents_json also holds closure_meta and profile_meta (emergency
    // contact). Documents now live in candidate_documents: the old `docs`
    // key is neither read nor written here, but kept exactly as stored.
    const payloadDocumentsJson = keepDocumentsJson(candidate?.documents_json, {
      is_closed: isClosed,
      closure_reason: closureReason,
    });

    const payload: Record<string, unknown> = {
      // status is not sent: the database derives it from the official
      // process; upper management overrides it with changeStatus.
      photo_url: candidatePhoto,
      phone: candidatePhone,
      email: candidateEmail,
      notes: internalNotes,
      // certificate_no / issuing_body are no longer edited here and are not
      // sent, so the stored values stay as they are.
      documents_json: payloadDocumentsJson,
      flight_date: flightDate,
      flight_number: flightNumber,
      departure_city: departureCity,
      arrival_city: arrivalCity,
      pnr_code: pnrCode,
      accommodation_details: accommodationDetails,
    };

    // travel_status is written only when staff changed it (an empty stored
    // value is shown as 'planned', so that alone is not a change).
    if (travelStatus !== (candidate?.travel_status || 'planned')) {
      payload.travel_status = travelStatus;
    }

    if (canEditVideo) {
      try {
        const videos = candidateVideoWrite({ videoUrl1, videoUrl2, videoUrl3 });
        Object.assign(payload, videos);
        setVideoUrl1(videos.video_url_1 ?? '');
        setVideoUrl2(videos.video_url_2 ?? '');
        setVideoUrl3(videos.video_url_3 ?? '');
      } catch (error) {
        if (error instanceof YouTubeUrlError) {
          alert(t.youtubeVideoInvalid);
          return;
        }
        throw error;
      }
    }

    setSaving(true);
    try {
      await candidateService.updateCandidateDetail(candidateId, payload);
      setCandidate((prev: Record<string, unknown> | null) => (prev ? { ...prev, ...payload } : prev));
      setPlacementRefresh((n) => n + 1);

      setSaving(false);
      alert(t.savedSuccess);
    } catch (error: any) {
      setSaving(false);
      const failure = youtubeSaveFailure(error?.message);
      const detail = failure === 'forbidden'
        ? t.youtubeVideoReadOnly
        : failure === 'invalid'
          ? t.youtubeVideoInvalid
          : error.message;
      alert(`${ui.errorPrefix} ${detail}`);
    }
  };

  const handleSendJobOffer = async () => {
    if (!offerEmployer || !offerSalary) {
      alert(t.fillEmployerAndSalary);
      return;
    }

    const { error } = await supabase.from('job_offers').insert([
      {
        candidate_id: candidateId,
        employer_name: offerEmployer,
        position_title: candidateProfessionLabel(candidate.profession, ui.general, currentLang),
        monthly_net_salary: Number(offerSalary),
        // Not tied to a request (no request_id): the currency is EUR.
        offer_terms: offerTermsPayload(DEFAULT_SALARY_CURRENCY),
        start_date: offerDate,
        terms_details: offerTerms,
        status: 'pending',
        is_demo: !!candidate?.is_demo
      }
    ]);

    if (!error) {
      alert(t.offerSentSuccess);
      setOfferEmployer('');
      setOfferSalary('');
      setOfferDate('');
      setOfferTerms('');
    } else {
      alert(`${ui.errorPrefix} ${error.message}`);
    }
  };

  const handleSendNotificationToCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    setNotifSending(true);

    try {
      const { error: dbError } = await supabase.from('candidate_notifications').insert([
        {
          candidate_id: candidateId,
          title: notifTitle,
          message: notifMessage,
          type: 'warning',
          is_read: false
        }
      ]);

      if (dbError) throw dbError;

      if (candidate?.email) {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: candidate.email,
            candidateName: candidate.full_name,
            subject: notifTitle,
            message: notifMessage,
            locale: currentLang,
          }),
        });
      }

      setNotifSending(false);
      alert(t.notificationSentSuccess);
      setNotifTitle('');
      setNotifMessage('');
    } catch (err: any) {
      setNotifSending(false);
      alert(`${ui.errorPrefix} ${err.message}`);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-700 font-bold">{ui.loading}</div>;
  }

  if (!candidate) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-600 font-bold">{ui.candidateNotFound}</div>;
  }

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Üst Bar */}
        <PageHeader
          className="border-slate-200"
          start={
            <div className="flex items-center gap-3">
              {candidatePhoto ? (
                <img src={candidatePhoto} alt="Foto" className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 shadow shrink-0" />
              ) : (
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-700 font-bold shrink-0">
                  {candidate.full_name?.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-base sm:text-xl font-extrabold text-slate-900 truncate max-w-[200px] sm:max-w-none">{candidate.full_name}</h1>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 font-medium">
                  <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">PNV-CAND-{candidate.id.substring(0, 6)}</span>
                  {normalizeReferralCode(candidate.referral_code) ? (
                    <ReferralCodeChip
                      code={normalizeReferralCode(candidate.referral_code) as string}
                      label={ui.referralCode}
                      copyLabel={ui.referralCodeCopy}
                      copiedLabel={ui.referralCodeCopied}
                    />
                  ) : (
                    <span className="bg-slate-100 text-muted-foreground px-1.5 py-0.5 rounded">{ui.referralCodeNone}</span>
                  )}
                  <span>📍 {candidate.country || 'N/A'}, {candidate.city || 'N/A'}</span>
                  <span>💼 {candidateProfessionLabel(candidate.profession, ui.general, currentLang)}</span>
                  <span>🌍 {candidatePlaceLabel(candidate.nationality, candidate.country, currentLang, ui.unspecified)}</span>
                </div>
              </div>
            </div>
          }
          actions={
            <HeaderActions
              lang={currentLang}
              onLanguageChange={changeLanguage}
              homeLabel={t.returnHome}
              logoutLabel={t.logoutBtn}
              onLogout={handleStaffLogout}
              extra={
                <>
                  <Link href="/portal" className={headerButtonClass.light}>
                    ← {t.returnToPortal}
                  </Link>
                  <button onClick={handleSaveDetail} disabled={saving} className={headerPrimaryClass}>
                    <Save className="w-4 h-4" /> {saving ? (t.saving) : (t.saveChanges)}
                  </button>
                </>
              }
            />
          }
        />

        {/* Kapanış Uyarısı */}
        {isClosed && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-red-900">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <strong className="text-red-900">{t.dossierClosedNotice}</strong> {t.reason} <span className="text-red-800 font-medium">{closureReason || ui.unspecified}</span>
              </div>
            </div>
            <button onClick={() => { setIsClosed(false); setClosureReason(''); }} className="bg-white px-3 py-1.5 rounded-lg border border-red-300 font-bold text-red-700 hover:bg-red-100 transition cursor-pointer">
              {t.reopenProcess}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          
          {/* Sol Kolon */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            
            {/* Profil Yönetimi */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-brand" /> {t.profileCredentialsManagement}
              </h3>

              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="relative shrink-0">
                  {candidatePhoto ? (
                    <img src={candidatePhoto} alt="Profil" className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border shadow" />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-600 font-bold text-2xl">
                      {candidate.full_name?.charAt(0)}
                    </div>
                  )}
                  <label className="absolute -bottom-2 -end-2 bg-brand-solid text-white p-2 rounded-xl cursor-pointer shadow hover:bg-brand transition" title={ui.photoUpload}>
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>

                <div className="flex-1 space-y-3 w-full text-xs">
                  <div>
                    <label className="font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                      <Phone className="w-3 h-3 text-muted-foreground" /> {t.phoneNumberGsm}
                    </label>
                    <input type="tel" value={candidatePhone} onChange={(e) => setCandidatePhone(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none text-xs sm:text-sm" />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                      <Mail className="w-3 h-3 text-muted-foreground" /> {t.emailAddress}
                    </label>
                    <input type="email" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none text-xs sm:text-sm" />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                      <KeyRound className="w-3 h-3 text-muted-foreground" /> {t.portalPassword}
                    </label>
                    <p className="text-[11px] text-slate-600 font-medium">{ui.passwordsManaged}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seyahat Lojistiği */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <PlaneTakeoff className="w-5 h-5 text-sky-600" /> {t.travelFlightLogistics}
                </h3>
                <div className="flex flex-col items-start sm:items-end gap-1">
                  <select
                    value={travelStatus}
                    onChange={(e) => {
                      if (canPickTravelStatus(e.target.value, travelFields)) setTravelStatus(e.target.value);
                    }}
                    aria-label={ui.travel}
                    aria-describedby={flightEntered ? undefined : 'travel-needs-flight-hint'}
                    className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase bg-sky-50 text-sky-900 border-sky-300 outline-none cursor-pointer w-fit"
                  >
                    {/* Shown as "not entered" while there are no flight details (the stored value stays 'planned'). */}
                    <option value="planned">{travelDisplay.kind === 'not_entered' ? `— ${t.plTravelNotEntered}` : `✈️ ${t.planned}`}</option>
                    <option value="ticketed" disabled={!canPickTravelStatus('ticketed', travelFields)}>🎟️ {t.ticketed}</option>
                    <option value="completed" disabled={!canPickTravelStatus('completed', travelFields)}>✅ {t.completed}</option>
                  </select>
                  {!flightEntered ? (
                    <span id="travel-needs-flight-hint" className="text-[11px] font-semibold text-slate-600">{t.travelNeedsFlightInfo}</span>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.flightDateTime}</label>
                  <input type="text" value={flightDate} onChange={(e) => setFlightDate(e.target.value)} placeholder={ui.exampleFlight} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.flightNumber}</label>
                  <input type="text" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder={ui.exampleFlightCode} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.departureCityAirport}</label>
                  <input type="text" value={departureCity} onChange={(e) => setDepartureCity(e.target.value)} placeholder={ui.exampleDeparture} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.arrivalCityAirport}</label>
                  <input type="text" value={arrivalCity} onChange={(e) => setArrivalCity(e.target.value)} placeholder={ui.exampleArrival} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.pnrBookingCode}</label>
                  <input type="text" value={pnrCode} onChange={(e) => setPnrCode(e.target.value)} placeholder={ui.examplePnr} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none uppercase" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.accommodationTransferDetails}</label>
                  <input type="text" value={accommodationDetails} onChange={(e) => setAccommodationDetails(e.target.value)} placeholder={ui.exampleStay} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none" />
                </div>
              </div>
            </div>

            {/* Belge Takip Mekanizması: candidate_documents (aday ekranıyla aynı kayıtlar) */}
            <CandidateDocumentsPanel
              candidateId={candidateId}
              items={docItems}
              rows={docs.rows}
              loaded={docs.loaded}
              loadError={docs.error}
              reload={docs.reload}
              t={t}
              ui={ui}
              copy={releaseCopy[currentLang]}
              canDelete={isUpperStaff}
              onPreview={setPreviewDoc}
            />

            {/* Video tanıtımı (3 YouTube videosu) */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Video className="w-5 h-5 text-red-700" aria-hidden="true" /> {t.videoIntroductionTitle}
              </h3>
              <CandidateYouTubeEditor
                canEdit={canEditVideo}
                slots={[
                  { id: 'candidate-video-1', label: t.video1GenIntro || '', value: videoUrl1, onChange: setVideoUrl1 },
                  { id: 'candidate-video-2', label: t.video2Skill || '', value: videoUrl2, onChange: setVideoUrl2 },
                  { id: 'candidate-video-3', label: t.video3Field || '', value: videoUrl3, onChange: setVideoUrl3 },
                ]}
                labels={{
                  title: t.youtubeVideoTitle || t.corporateYouTubeVideos || '',
                  empty: t.youtubeVideoEmpty || '',
                  watch: t.youtubeVideoWatch || t.watchVideo,
                  open: t.youtubeVideoOpen || '',
                  field: t.youtubeVideoLabel || '',
                  clear: t.youtubeVideoClear || '',
                  invalid: t.youtubeVideoInvalid || '',
                  supervisorNote: t.youtubeVideoSupervisorNote || '',
                  readOnly: t.youtubeVideoReadOnly || '',
                }}
                preview={{ video_url_1: videoUrl1, video_url_2: videoUrl2, video_url_3: videoUrl3 }}
              />
            </div>

            {/* İç Notlar */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> {t.internalNotesAdminOnly}
              </h3>
              <textarea rows={3} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} className="w-full p-4 rounded-xl border border-slate-300 bg-white text-xs outline-none text-slate-900 font-medium scheme-light" />
            </div>
          </div>

          {/* Sağ Kolon */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-2">{t.candidateStatus}</h3>
              <CandidateStatusControl
                t={t}
                status={status}
                canChange={mayChangeStatus}
                onSubmit={changeStatus}
              />
              <p className="text-xs sm:text-sm font-semibold text-slate-900" aria-live="polite">
                {t.officialProcessLabel}:{' '}
                <OfficialProcessBadge status={candidate?.official_process_status} steps={ui.steps} stoppedLabel={t.plProcessStopped || ui.steps.rejected} />
              </p>
              <p className="text-[11px] text-slate-600 font-medium">{t.officialProcessHint}</p>
            </div>

            <DocumentStatusPanel candidateId={candidateId} items={docItems} rows={docs.rows} reload={docs.reload} t={t} ui={ui} />
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
              <div>
                <p className="font-bold text-slate-900 text-sm">🤝 {ui.interviewOfferTitle}</p>
                <p className="text-xs text-slate-600 font-medium">{ui.interviewOfferHint}</p>
              </div>
              <button onClick={() => setShowIO(true)} className="text-xs font-bold px-4 py-2 rounded-lg bg-amber-800 text-white cursor-pointer hover:bg-amber-900 transition shadow">{ui.docOpen}</button>
            </div>
            {showIO && candidate && <InterviewOfferPanel candidate={{ ...candidate, id: candidateId }} onClose={() => setShowIO(false)} />}
            <PlacementPanel
              candidateId={candidateId}
              refreshKey={placementRefresh}
              onOfficialChange={(value) => {
                // "Started work" also stores travel_status = completed (PlacementPanel).
                const travelPatch = value === 'started_work' ? { travel_status: 'completed' } : {};
                if (value === 'started_work') setTravelStatus('completed');
                setCandidate((prev: Record<string, unknown> | null) => (prev ? { ...prev, official_process_status: value, ...travelPatch } : prev));
                refreshStatus();
              }}
            />

            {/* Süreçten Çıkış Paneli */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-amber-200 shadow-sm space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-amber-900 border-b border-amber-100 pb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> {t.processClosureWithdrawal}
              </h3>
              <textarea 
                rows={2} 
                value={closureReason} 
                onChange={(e) => setClosureReason(e.target.value)} 
                placeholder={t.closureReasonPlaceholder} 
                className="w-full p-3 rounded-xl border border-slate-300 text-xs outline-none bg-slate-50 text-slate-900 font-medium" 
              />
              <button 
                type="button" 
                onClick={() => { setIsClosed(true); handleSaveDetail(); }}
                className="w-full bg-amber-800 hover:bg-amber-900 text-white py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shadow"
              >
                {t.closeArchiveProcess}
              </button>
            </div>

            {/* Resmi İş Teklifi */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-brand" /> {t.sendOfficialJobOffer}
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.employerCompanyName}</label>
                  <input type="text" value={offerEmployer} onChange={(e) => setOfferEmployer(e.target.value)} placeholder={ui.exampleCompany} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 outline-none bg-white font-medium text-slate-900" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{t.monthlyNetSalary} ({SALARY_CURRENCY_SYMBOL[DEFAULT_SALARY_CURRENCY]})</label>
                    <input type="number" value={offerSalary} onChange={(e) => setOfferSalary(e.target.value)} placeholder="1200" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 outline-none bg-white font-medium text-slate-900" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{t.startDate}</label>
                    <input type="text" value={offerDate} onChange={(e) => setOfferDate(e.target.value)} placeholder="01.11.2026" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 outline-none bg-white font-medium text-slate-900" />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.termsConditions}</label>
                  <textarea rows={2} value={offerTerms} onChange={(e) => setOfferTerms(e.target.value)} placeholder={ui.exampleTerms} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 outline-none bg-white font-medium text-slate-900" />
                </div>
                <button type="button" onClick={handleSendJobOffer} className="w-full bg-brand-solid hover:bg-brand text-white py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow">
                  <Send className="w-3.5 h-3.5" /> {t.sendOfferToCandidate}
                </button>
              </div>
            </div>

            {/* Bildirim Gönder */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand" /> {t.sendNotification}
              </h3>
              <form onSubmit={handleSendNotificationToCandidate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.notificationTitle}</label>
                  <input type="text" required value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder={ui.exampleNotifTitle} className="w-full px-3 py-2.5 rounded-xl border border-slate-300 outline-none bg-white font-medium text-slate-900" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.message}</label>
                  <textarea rows={3} required value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} placeholder={ui.exampleMessage} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none bg-white font-medium text-slate-900" />
                </div>
                <button type="submit" disabled={notifSending} className="w-full bg-brand-solid hover:bg-brand text-white py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow">
                  <Send className="w-3.5 h-3.5" /> {notifSending ? t.sending : t.sendNotificationBtn}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Belge Önizleme Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          key={previewDoc.key}
          t={t}
          name={previewDoc.name}
          fileUrl={previewDoc.fileUrl}
          fileName={previewDoc.fileName}
          documentId={previewDoc.documentId}
          onClose={() => setPreviewDoc(null)}
        />
      )}

    </div>
  );
}

export default function CandidateDetailPage() {
  return (
    <AuthGuard role="staff">
      <CandidateDetailPageInner />
    </AuthGuard>
  );
}