'use client';

import AuthGuard from '@/components/auth/AuthGuard';
import DocumentStatusPanel from '@/components/portal/DocumentStatusPanel';
import InterviewOfferPanel from '@/components/portal/InterviewOfferPanel';
import PlacementPanel from '@/components/portal/PlacementPanel';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { candidateService } from '@/lib/services/candidateService';
import { User, Save, Camera, Mail, Phone, KeyRound, FileCheck, FileText, Award, Trash2, Upload, Eye, X, Plus, Bell, Send, PlaneTakeoff, FileSignature, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Language, translations } from '@/lib/dictionary';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import { readStoredLanguage, syncDocumentLanguage, writeStoredLanguage } from '@/lib/site-language';

interface CandidateDocument {
  id: string;
  name: string;
  status: 'pending' | 'uploaded' | 'reviewing' | 'approved' | 'rejected' | 're_requested';
  file_url?: string;
  file_name?: string;
}

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
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState('pending');
  const [candidatePhoto, setCandidatePhoto] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const [certificateNo, setCertificateNo] = useState('');
  const [issuingBody, setIssuingBody] = useState('');
  const [videoUrl1, setVideoUrl1] = useState('');
  const [videoUrl2, setVideoUrl2] = useState('');
  const [videoUrl3, setVideoUrl3] = useState('');

  const [travelStatus, setTravelStatus] = useState('planned');
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

  const [newDocName, setNewDocName] = useState('');
  const [hasTableDocs, setHasTableDocs] = useState<boolean | null>(null);
  
  useEffect(() => {
    supabase.from('candidate_documents').select('id', { count: 'exact', head: true }).eq('candidate_id', candidateId)
      .then(({ count }) => setHasTableDocs((count ?? 0) > 0));
  }, [candidateId]);

  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSending, setNotifSending] = useState(false);

  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';
  const isMk = currentLang === 'mk';
  
  useEffect(() => {
    fetchCandidateDetail();
  }, [candidateId]);

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
        setCertificateNo(data.certificate_no || '');
        setIssuingBody(data.issuing_body || '');
        
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

        const defaultDocs: CandidateDocument[] = [
          { id: '1', name: t.docPassportScan || (isMk ? 'Скенирање пасош' : 'Pasaport Taraması'), status: data.passport_number ? 'approved' : 'pending' },
          { id: '2', name: t.docProfessionalCert || (isMk ? 'Професионален сертификат' : 'Mesleki Sertifika / İzin Belgesi'), status: 'pending' },
          { id: '3', name: t.docCriminalRecord || (isMk ? 'Казнена евиденција' : 'Adli Sicil Kaydı (Sabıka Kaydı)'), status: 'pending' },
          { id: '4', name: t.docHealthReport || (isMk ? 'Здравствен извештај' : 'Sağlık Raporu / Akciğer Grafisi'), status: 'pending' },
        ];
        
        try {
          const parsed = data.documents_json ? JSON.parse(data.documents_json) : {};
          const parsedDocs = Array.isArray(parsed) ? parsed : (parsed.docs || defaultDocs);
          setDocuments(parsedDocs);
        } catch {
          setDocuments(defaultDocs);
        }
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

  const handleDocStatusChange = (docId: string, newStatus: CandidateDocument['status']) => {
    setDocuments(documents.map(doc => doc.id === docId ? { ...doc, status: newStatus } : doc));
  };

  const handleFileUpload = (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileUrl = e.target?.result as string;
      setDocuments(documents.map(doc => {
        if (doc.id === docId) {
          return {
            ...doc,
            file_url: fileUrl,
            file_name: file.name,
            status: 'uploaded',
          };
        }
        return doc;
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddDocument = () => {
    if (!newDocName.trim()) return;
    const newDoc: CandidateDocument = {
      id: Date.now().toString(),
      name: newDocName,
      status: 'pending',
    };
    setDocuments([...documents, newDoc]);
    setNewDocName('');
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments(documents.filter(d => d.id !== docId));
  };

  const handleSaveDetail = async () => {
    setSaving(true);

    let existingMeta = {};
    try {
      const parsed = candidate?.documents_json ? JSON.parse(candidate.documents_json) : {};
      if (!Array.isArray(parsed)) existingMeta = parsed;
    } catch (e) {}

    const payloadDocumentsJson = JSON.stringify({
      docs: documents,
      closure_meta: {
        is_closed: isClosed,
        closure_reason: closureReason
      },
      ...existingMeta
    });

    try {
      await candidateService.updateCandidateDetail(candidateId, {
        status: status,
        photo_url: candidatePhoto,
        phone: candidatePhone,
        email: candidateEmail,
        notes: internalNotes,
        certificate_no: certificateNo,
        issuing_body: issuingBody,
        video_url: videoUrl1,
        video_url_1: videoUrl1,
        video_url_2: videoUrl2,
        video_url_3: videoUrl3,
        documents_json: payloadDocumentsJson,
        travel_status: travelStatus,
        flight_date: flightDate,
        flight_number: flightNumber,
        departure_city: departureCity,
        arrival_city: arrivalCity,
        pnr_code: pnrCode,
        accommodation_details: accommodationDetails,
      });

      setSaving(false);
      alert(t.savedSuccess || (isMk ? 'Успешно зачувано!' : 'Başarıyla kaydedildi!'));
    } catch (error: any) {
      setSaving(false);
      alert('Hata: ' + error.message);
    }
  };

  const handleSendJobOffer = async () => {
    if (!offerEmployer || !offerSalary) {
      alert(t.fillEmployerAndSalary || (isMk ? 'Ве молиме пополнете ги името на компанијата и платата.' : 'Lütfen firma adı ve maaş bilgilerini doldurun.'));
      return;
    }

    const { error } = await supabase.from('job_offers').insert([
      {
        candidate_id: candidateId,
        employer_name: offerEmployer,
        position_title: candidate.profession || 'General Position',
        monthly_net_salary: Number(offerSalary),
        start_date: offerDate,
        terms_details: offerTerms,
        status: 'pending',
        is_demo: !!candidate?.is_demo
      }
    ]);

    if (!error) {
      alert(t.offerSentSuccess || (isMk ? 'Официјалната понуда за работа е успешно испратена до кандидатот!' : 'Resmi iş teklifi başarıyla adaya iletildi!'));
      setOfferEmployer('');
      setOfferSalary('');
      setOfferDate('');
      setOfferTerms('');
    } else {
      alert('Hata: ' + error.message);
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
          }),
        });
      }

      setNotifSending(false);
      alert(t.notificationSentSuccess || (isMk ? 'Известувањето е успешно испратено до кандидатот!' : 'Bildirim adaya başarıyla gönderildi!'));
      setNotifTitle('');
      setNotifMessage('');
    } catch (err: any) {
      setNotifSending(false);
      alert('Hata: ' + err.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-700 font-bold">{isMk ? 'Се вчитува...' : 'Yükleniyor...'}</div>;
  }

  if (!candidate) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-600 font-bold">{isMk ? 'Кандидатот не е пронајден.' : 'Aday bulunamadı.'}</div>;
  }

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Üst Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Link href="/portal" className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-800 font-bold text-xs w-fit">
              ← {t.returnToPortal || (isMk ? 'Назад кон порталот' : 'Yönetim Paneline Dön')}
            </Link>
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
                <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                  <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded">PNV-CAND-{candidate.id.substring(0, 6)}</span>
                  <span>📍 {candidate.country || 'N/A'}, {candidate.city || 'N/A'}</span>
                  <span>💼 {candidate.profession || (isMk ? 'Општо' : 'Genel')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <LanguageSwitcher currentLang={currentLang} onChange={changeLanguage} />

            <button onClick={handleSaveDetail} disabled={saving} className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center">
              <Save className="w-4 h-4" /> {saving ? (t.saving || (isMk ? 'Се зачувува...' : 'Kaydediliyor...')) : (t.saveChanges || (isMk ? 'Зачувај промени' : 'Değişiklikleri Kaydet'))}
            </button>
          </div>
        </div>

        {/* Kapanış Uyarısı */}
        {isClosed && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-red-900">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <strong className="text-red-900">{t.dossierClosedNotice || (isMk ? 'Ова досие на кандидат е затворено.' : 'Bu aday dosyası kapatılmıştır.')}</strong> {t.reason || (isMk ? 'Причина:' : 'Sebep:')} <span className="text-red-800 font-medium">{closureReason || (isMk ? 'Не е наведено' : 'Belirtilmemiş')}</span>
              </div>
            </div>
            <button onClick={() => { setIsClosed(false); setClosureReason(''); }} className="bg-white px-3 py-1.5 rounded-lg border border-red-300 font-bold text-red-700 hover:bg-red-100 transition cursor-pointer">
              {t.reopenProcess || (isMk ? 'Отвори го процесот повторно' : 'Süreci Tekrar Aç')}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          
          {/* Sol Kolon */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            
            {/* Profil Yönetimi */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-[#2e7d32]" /> {t.profileCredentialsManagement || (isMk ? 'Управување со фотографија, телефон и е-пошта' : 'Aday Fotoğraf, GSM ve E-Posta Yönetimi')}
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
                  <label className="absolute -bottom-2 -right-2 bg-[#2e7d32] text-white p-2 rounded-xl cursor-pointer shadow hover:bg-[#1b5e20] transition" title="Fotoğraf Yükle">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                </div>

                <div className="flex-1 space-y-3 w-full text-xs">
                  <div>
                    <label className="font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                      <Phone className="w-3 h-3 text-slate-500" /> {t.phoneNumberGsm || (isMk ? 'Телефонски број (GSM)' : 'Telefon Numarası (GSM)')}
                    </label>
                    <input type="tel" value={candidatePhone} onChange={(e) => setCandidatePhone(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none text-xs sm:text-sm" />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                      <Mail className="w-3 h-3 text-slate-500" /> {t.emailAddress || (isMk ? 'Адреса на е-пошта' : 'E-Posta Adresi')}
                    </label>
                    <input type="email" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none text-xs sm:text-sm" />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                      <KeyRound className="w-3 h-3 text-slate-500" /> {t.portalPassword || (isMk ? 'Лозинка за портал' : 'Aday Portalı Şifresi')}
                    </label>
                    <p className="text-[11px] text-slate-600 font-medium">{isMk ? 'Лозинките се управуваат преку Supabase Auth.' : 'Şifreler Supabase Auth ile yönetilir.'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seyahat Lojistiği */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <PlaneTakeoff className="w-5 h-5 text-sky-600" /> {t.travelFlightLogistics || (isMk ? 'Патување, лет и логистика' : 'Seyahat, Uçuş ve Konaklama Lojistiği')}
                </h3>
                <select
                  value={travelStatus}
                  onChange={(e) => setTravelStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase bg-sky-50 text-sky-900 border-sky-300 outline-none cursor-pointer w-fit"
                >
                  <option value="planned">✈️ {t.planned || (isMk ? 'Се планира' : 'Planlanıyor')}</option>
                  <option value="ticketed">🎟️ {t.ticketed || (isMk ? 'Издаден билет' : 'Biletlendi')}</option>
                  <option value="completed">✅ {t.completed || (isMk ? 'Патувањето е завршено' : 'Seyahat Tamamlandı')}</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.flightDateTime || (isMk ? 'Датум и време на лет' : 'Uçuş Tarihi & Saati')}</label>
                  <input type="text" value={flightDate} onChange={(e) => setFlightDate(e.target.value)} placeholder="Örn: 15.10.2026 - 14:30" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.flightNumber || (isMk ? 'Број на лет / Серија' : 'Uçuş Kodu / Sefer No')}</label>
                  <input type="text" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder="Örn: TK-1926" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.departureCityAirport || (isMk ? 'Град / Аеродром на поаѓање' : 'Kalkış Yeri / Havalimanı')}</label>
                  <input type="text" value={departureCity} onChange={(e) => setDepartureCity(e.target.value)} placeholder="Örn: Skopje (SKP)" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.arrivalCityAirport || (isMk ? 'Град / Аеродром на пристигнување' : 'Varış Yeri / Havalimanı')}</label>
                  <input type="text" value={arrivalCity} onChange={(e) => setArrivalCity(e.target.value)} placeholder="Örn: Istanbul (IST)" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.pnrBookingCode || (isMk ? 'PNR / Код за резервација' : 'PNR / Bilet Rezervasyon Kodu')}</label>
                  <input type="text" value={pnrCode} onChange={(e) => setPnrCode(e.target.value)} placeholder="Örn: X79R2A" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none uppercase" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.accommodationTransferDetails || (isMk ? 'Детали за сместување и трансфер' : 'Konaklama & Karşılama Detayları')}</label>
                  <input type="text" value={accommodationDetails} onChange={(e) => setAccommodationDetails(e.target.value)} placeholder="Örn: Otel transferi..." className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900 outline-none" />
                </div>
              </div>
            </div>

            {/* Belge Takip Mekanizması */}
            {hasTableDocs === false && (
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-600" /> {t.documentTrackingMechanism || (isMk ? 'Механизам за следење на документи' : 'Evrak & Belge Takip Mekanizması')}
                </h3>
              </div>

              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                        <div>
                          <div className="font-extrabold text-slate-900">{doc.name}</div>
                          {doc.file_name && <div className="text-[11px] text-slate-600 font-medium truncate max-w-[200px]">{t.file || (isMk ? 'Датотека' : 'Dosya')}: {doc.file_name}</div>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={doc.status}
                          onChange={(e) => handleDocStatusChange(doc.id, e.target.value as any)}
                          className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase cursor-pointer outline-none bg-amber-100 text-amber-900 border-amber-300"
                        >
                          <option value="pending" className="bg-white text-slate-900">🟡 {isMk ? 'Се чека' : 'Bekleniyor'}</option>
                          <option value="uploaded" className="bg-white text-slate-900">📤 {isMk ? 'Прикачено' : 'Yüklendi'}</option>
                          <option value="reviewing" className="bg-white text-slate-900">🔵 {isMk ? 'Се разгледува' : 'İnceleniyor'}</option>
                          <option value="approved" className="bg-white text-slate-900">🟢 {isMk ? 'Одобрено' : 'Onaylandı'}</option>
                          <option value="rejected" className="bg-white text-slate-900">🔴 {isMk ? 'Одбиено' : 'Reddedildi'}</option>
                        </select>
                        <button onClick={() => handleDeleteDocument(doc.id)} className="p-1.5 text-slate-500 hover:text-red-600 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                      {doc.file_url ? (
                        <button type="button" onClick={() => setPreviewDoc({ name: doc.name, url: doc.file_url! })} className="text-emerald-800 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer">
                          <Eye className="w-3.5 h-3.5" /> {isMk ? 'Преглед' : 'Önizle'}
                        </button>
                      ) : <span className="text-slate-500 font-medium italic">{isMk ? 'Датотеката не е прикачена' : 'Dosya yüklenmedi'}</span>}

                      <label className="bg-white hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-300 font-bold cursor-pointer shadow-sm flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" /> {isMk ? 'Прикачи од компјутер' : 'Bilgisayardan Yükle'}
                        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(doc.id, e)} className="hidden" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                <input
                  type="text"
                  placeholder={isMk ? 'Име на нов документ' : 'Yeni Belge Adı'}
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 text-slate-900 bg-white outline-none font-medium"
                />
                <button onClick={handleAddDocument} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer">
                  <Plus className="w-4 h-4" /> {isMk ? 'Додај' : 'Ekle'}
                </button>
              </div>
            </div>
            )}

            {/* Sertifika ve 3'lü Video Alanı */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> {t.professionalEvaluationCertificate || (isMk ? 'Сертификат за професионална оценка' : 'Mesleki Değerlendirme & Sertifika')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 uppercase block">{isMk ? 'Информации за сертификат' : 'Sertifika Bilgileri'}</span>
                  <input type="text" value={certificateNo} onChange={(e) => setCertificateNo(e.target.value)} placeholder={isMk ? 'Број на сертификат' : 'Sertifika No'} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 outline-none" />
                  <input type="text" value={issuingBody} onChange={(e) => setIssuingBody(e.target.value)} placeholder={isMk ? 'Издавач' : 'Veren Kurum'} className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 outline-none" />
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <span className="font-extrabold text-slate-900 uppercase block text-[11px] text-emerald-800">📹 {isMk ? 'Корпоративни YouTube видеа' : 'Kurumsal YouTube Videoları'}</span>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">{isMk ? '1. Видео: Општа презентација' : '1. Video: Genel Tanıtım'}</label>
                    <div className="flex gap-1.5">
                      <input type="url" value={videoUrl1} onChange={(e) => setVideoUrl1(e.target.value)} placeholder="https://youtube.com/..." className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 outline-none" />
                      {videoUrl1 && <button type="button" onClick={() => setPreviewVideo(videoUrl1)} className="bg-emerald-100 text-[#2e7d32] px-2.5 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer">{isMk ? 'Преглед' : 'Önizle'}</button>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">{isMk ? '2. Видео: Професионална вештина' : '2. Video: Mesleki Beceri'}</label>
                    <div className="flex gap-1.5">
                      <input type="url" value={videoUrl2} onChange={(e) => setVideoUrl2(e.target.value)} placeholder="https://youtube.com/..." className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 outline-none" />
                      {videoUrl2 && <button type="button" onClick={() => setPreviewVideo(videoUrl2)} className="bg-emerald-100 text-[#2e7d32] px-2.5 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer">{isMk ? 'Преглед' : 'Önizle'}</button>}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">{isMk ? '3. Видео: Интервју на терен' : '3. Video: Saha Mülakatı'}</label>
                    <div className="flex gap-1.5">
                      <input type="url" value={videoUrl3} onChange={(e) => setVideoUrl3(e.target.value)} placeholder="https://youtube.com/..." className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-900 outline-none" />
                      {videoUrl3 && <button type="button" onClick={() => setPreviewVideo(videoUrl3)} className="bg-emerald-100 text-[#2e7d32] px-2.5 py-1.5 rounded-lg font-bold text-[11px] cursor-pointer">{isMk ? 'Преглед' : 'Önizle'}</button>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* İç Notlar */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> {t.internalNotesAdminOnly || (isMk ? 'Внатрешни белешки (само за администратор)' : 'İç Değerlendirme Notları')}
              </h3>
              <textarea rows={3} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} className="w-full p-4 rounded-xl border border-slate-300 text-xs outline-none text-slate-900 font-medium" />
            </div>
          </div>

          {/* Sağ Kolon */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-2">{t.candidateStatus || (isMk ? 'Статус на кандидат' : 'Aday Süreç Durumu')}</h3>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm font-extrabold bg-slate-900 text-white outline-none cursor-pointer shadow-sm"
              >
                <option value="pending" className="bg-white text-slate-900">🟡 {isMk ? 'Во очекување' : 'Beklemede'}</option>
                <option value="reviewing" className="bg-white text-slate-900">🔵 {isMk ? 'Се разгледува' : 'İncelemede'}</option>
                <option value="visa_processing" className="bg-white text-slate-900">🟣 {isMk ? 'Во визен процес' : 'Vize Sürecinde'}</option>
                <option value="approved" className="bg-white text-slate-900">🟢 {isMk ? 'Одобрено' : 'Onaylandı'}</option>
              </select>
            </div>

            <DocumentStatusPanel candidateId={candidateId} />
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
              <div>
                <p className="font-bold text-slate-900 text-sm">🤝 {isMk ? 'Интервју и понуда за работа' : 'Görüşme & İş Teklifi'}</p>
                <p className="text-xs text-slate-600 font-medium">{isMk ? 'Закажете интервју и испратете понуда.' : 'Görüşme planla ve teklif gönder.'}</p>
              </div>
              <button onClick={() => setShowIO(true)} className="text-xs font-bold px-4 py-2 rounded-lg bg-amber-500 text-white cursor-pointer hover:bg-amber-600 transition shadow">{isMk ? 'Отвори' : 'Aç'}</button>
            </div>
            {showIO && candidate && <InterviewOfferPanel candidate={{ ...candidate, id: candidateId }} onClose={() => setShowIO(false)} />}
            <PlacementPanel candidateId={candidateId} />

            {/* Süreçten Çıkış Paneli */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-amber-200 shadow-sm space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-amber-900 border-b border-amber-100 pb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> {t.processClosureWithdrawal || (isMk ? 'Затворање / повлекување на постапка' : 'Vazgeçme ve Süreçten Çıkış')}
              </h3>
              <textarea 
                rows={2} 
                value={closureReason} 
                onChange={(e) => setClosureReason(e.target.value)} 
                placeholder={isMk ? 'Причина за затворање...' : 'Kapanış sebebi...'} 
                className="w-full p-3 rounded-xl border border-slate-300 text-xs outline-none bg-slate-50 text-slate-900 font-medium" 
              />
              <button 
                type="button" 
                onClick={() => { setIsClosed(true); handleSaveDetail(); }}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shadow"
              >
                {isMk ? 'Затвори / архивирај процес' : 'Aday Sürecini Kapat / Arşivle'}
              </button>
            </div>

            {/* Resmi İş Teklifi */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-[#2e7d32]" /> {isMk ? 'Испрати официјална понуда за работа' : 'Resmi İş Teklifi Gönder'}
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{isMk ? 'Име на компанија' : 'Firma Adı'}</label>
                  <input type="text" value={offerEmployer} onChange={(e) => setOfferEmployer(e.target.value)} placeholder="Örn: Panova Tarim DOO" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 outline-none bg-white font-medium text-slate-900" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{isMk ? 'Месечна нето плата (€)' : 'Aylık Net Ücret (€)'}</label>
                    <input type="number" value={offerSalary} onChange={(e) => setOfferSalary(e.target.value)} placeholder="1200" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 outline-none bg-white font-medium text-slate-900" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{isMk ? 'Датум на почеток' : 'Başlama Tarihi'}</label>
                    <input type="text" value={offerDate} onChange={(e) => setOfferDate(e.target.value)} placeholder="01.11.2026" className="w-full px-3 py-2.5 rounded-xl border border-slate-300 outline-none bg-white font-medium text-slate-900" />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{isMk ? 'Услови и правила' : 'Şartlar'}</label>
                  <textarea rows={2} value={offerTerms} onChange={(e) => setOfferTerms(e.target.value)} placeholder="Konaklama dahil..." className="w-full px-3 py-2.5 rounded-xl border border-slate-300 outline-none bg-white font-medium text-slate-900" />
                </div>
                <button type="button" onClick={handleSendJobOffer} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow">
                  <Send className="w-3.5 h-3.5" /> {isMk ? 'Испрати понуда' : 'Resmi Teklifi İlet'}
                </button>
              </div>
            </div>

            {/* Bildirim Gönder */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#2e7d32]" /> {isMk ? 'Испрати известување до кандидат' : 'Adaya Bildirim Gönder'}
              </h3>
              <form onSubmit={handleSendNotificationToCandidate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{isMk ? 'Наслов' : 'Başlık'}</label>
                  <input type="text" required value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="Örn: Pasaport Hk." className="w-full px-3 py-2.5 rounded-xl border border-slate-300 outline-none bg-white font-medium text-slate-900" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{isMk ? 'Порака' : 'Mesaj'}</label>
                  <textarea rows={3} required value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} placeholder="Mesajınız..." className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none bg-white font-medium text-slate-900" />
                </div>
                <button type="submit" disabled={notifSending} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow">
                  <Send className="w-3.5 h-3.5" /> {notifSending ? (isMk ? 'Се испраќа...' : 'Gönderiliyor...') : (isMk ? 'Испрати известување' : 'Bildirimi Gönder')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Belge Önizleme Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">{previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="p-1.5 bg-slate-800 rounded-full text-slate-300 cursor-pointer hover:bg-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex justify-center items-center bg-slate-100">
              <iframe src={previewDoc.url} className="w-full h-[70vh] rounded-xl border bg-white" title="Önizleme" />
            </div>
          </div>
        </div>
      )}

      {/* Video Önizleme Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">{isMk ? 'Преглед на работно видео' : 'Çalışma Videosu Önizleme'}</h3>
              <button onClick={() => setPreviewVideo(null)} className="p-1.5 bg-slate-800 rounded-full text-slate-300 cursor-pointer hover:bg-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex justify-center items-center bg-slate-100">
              {previewVideo.includes('youtube.com') || previewVideo.includes('youtu.be') ? (
                <iframe src={previewVideo.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} className="w-full h-[70vh] rounded-xl border bg-black" title="Video" allowFullScreen />
              ) : (
                <video src={previewVideo} controls className="w-full h-[70vh] rounded-xl border bg-black" />
              )}
            </div>
          </div>
        </div>
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