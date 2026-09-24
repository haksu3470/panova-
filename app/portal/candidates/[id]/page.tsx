'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, User, Save, Camera, Mail, Phone, KeyRound, FileCheck, FileText, Award, Video, Trash2, Upload, Eye, X, Plus, Languages, Bell, Send, PlaneTakeoff, FileSignature, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';

interface CandidateDocument {
  id: string;
  name: string;
  status: 'pending' | 'uploaded' | 'reviewing' | 'approved' | 'rejected' | 're_requested';
  file_url?: string;
  file_name?: string;
}

export default function CandidateDetailPage() {
  const params = useParams();
  const candidateId = params.id as string;

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

  const [candidate, setCandidate] = useState<any | null>(null);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState('pending');
  const [candidatePassword, setCandidatePassword] = useState('123456');
  const [candidatePhoto, setCandidatePhoto] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Sertifika & Video
  const [certificateNo, setCertificateNo] = useState('');
  const [issuingBody, setIssuingBody] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Seyahat ve Uçuş Lojistik State'leri
  const [travelStatus, setTravelStatus] = useState('planned');
  const [flightDate, setFlightDate] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [departureCity, setDepartureCity] = useState('');
  const [arrivalCity, setArrivalCity] = useState('');
  const [pnrCode, setPnrCode] = useState('');
  const [accommodationDetails, setAccommodationDetails] = useState('');

  // Vazgeçme ve Süreç Kapatma State'leri
  const [closureReason, setClosureReason] = useState('');
  const [isClosed, setIsClosed] = useState(false);

  // İş Teklifi State'leri
  const [offerEmployer, setOfferEmployer] = useState('');
  const [offerSalary, setOfferSalary] = useState('');
  const [offerDate, setOfferDate] = useState('');
  const [offerTerms, setOfferTerms] = useState('');

  // Yeni Belge & Önizleme / Video Önizleme
  const [newDocName, setNewDocName] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);

  // Aday Bildirim Gönderme State'leri
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifSending, setNotifSending] = useState(false);

  const t = translations[currentLang] || translations.en;
  const isRtl = currentLang === 'ar';
  
  const selectableLanguages = languages.filter((lang) => lang.code !== currentLang);
  const activeLangObj = languages.find((l) => l.code === currentLang);

  useEffect(() => {
    fetchCandidateDetail();
  }, [candidateId]);

  const fetchCandidateDetail = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('job_candidates')
      .select('*')
      .eq('id', candidateId)
      .single();

    if (!error && data) {
      setCandidate(data);
      setStatus(data.status || 'pending');
      setCandidatePassword(data.password || '123456');
      setCandidatePhoto(data.photo_url || '');
      setCandidatePhone(data.phone || '');
      setCandidateEmail(data.email || '');
      setInternalNotes(data.notes || '');
      setCertificateNo(data.certificate_no || '');
      setIssuingBody(data.issuing_body || '');
      setVideoUrl(data.video_url || '');

      setTravelStatus(data.travel_status || 'planned');
      setFlightDate(data.flight_date || '');
      setFlightNumber(data.flight_number || '');
      setDepartureCity(data.departure_city || '');
      setArrivalCity(data.arrival_city || '');
      setPnrCode(data.pnr_code || '');
      setAccommodationDetails(data.accommodation_details || '');

      setIsClosed(data.is_closed || false);
      setClosureReason(data.closure_reason || '');

      const defaultDocs: CandidateDocument[] = [
        { id: '1', name: t.docPassportScan || 'Pasaport Taraması', status: data.passport_number ? 'approved' : 'pending' },
        { id: '2', name: t.docProfessionalCert || 'Mesleki Sertifika / İzin Belgesi', status: 'pending' },
        { id: '3', name: t.docCriminalRecord || 'Adli Sicil Kaydı (Sabıka Kaydı)', status: 'pending' },
        { id: '4', name: t.docHealthReport || 'Sağlık Raporu / Akciğer Grafisi', status: 'pending' },
      ];
      
      try {
        setDocuments(data.documents_json ? JSON.parse(data.documents_json) : defaultDocs);
      } catch {
        setDocuments(defaultDocs);
      }
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
    const { error } = await supabase
      .from('job_candidates')
      .update({
        status: status,
        password: candidatePassword,
        photo_url: candidatePhoto,
        phone: candidatePhone,
        email: candidateEmail,
        notes: internalNotes,
        certificate_no: certificateNo,
        issuing_body: issuingBody,
        video_url: videoUrl,
        documents_json: JSON.stringify(documents),
        travel_status: travelStatus,
        flight_date: flightDate,
        flight_number: flightNumber,
        departure_city: departureCity,
        arrival_city: arrivalCity,
        pnr_code: pnrCode,
        accommodation_details: accommodationDetails,
        is_closed: isClosed,
        closure_reason: closureReason,
      })
      .eq('id', candidateId);

    setSaving(false);

    if (!error) {
      alert(t.savedSuccess || 'Başarıyla kaydedildi!');
    } else {
      alert('Hata: ' + error.message);
    }
  };

  const handleSendJobOffer = async () => {
    if (!offerEmployer || !offerSalary) {
      alert(t.fillEmployerAndSalary || 'Lütfen firma adı ve maaş bilgilerini doldurun.');
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
        status: 'pending'
      }
    ]);

    if (!error) {
      alert(t.offerSentSuccess || 'Resmi iş teklifi başarıyla adaya iletildi!');
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
      alert(t.notificationSentSuccess || 'Bildirim adaya başarıyla gönderildi!');
      setNotifTitle('');
      setNotifMessage('');
    } catch (err: any) {
      setNotifSending(false);
      alert('Hata: ' + err.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-bold">Yükleniyor...</div>;
  }

  if (!candidate) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-500 font-bold">Aday bulunamadı.</div>;
  }

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Üst Bar ve Aday Özet Kartı */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <Link href="/portal" className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold text-xs w-fit">
              ← {t.returnToPortal || 'Yönetim Paneline Dön'}
            </Link>
            <div className="flex items-center gap-3">
              {candidatePhoto ? (
                <img src={candidatePhoto} alt="Foto" className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 shadow shrink-0" />
              ) : (
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold shrink-0">
                  {candidate.full_name?.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-base sm:text-xl font-extrabold text-slate-900 truncate max-w-[200px] sm:max-w-none">{candidate.full_name}</h1>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">PNV-CAND-{candidate.id.substring(0, 6)}</span>
                  <span>📍 {candidate.country || 'N/A'}, {candidate.city || 'N/A'}</span>
                  <span>💼 {candidate.profession || 'Genel'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200">
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
                  <option key={lang.code} value={lang.code} className="text-slate-900">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <button onClick={handleSaveDetail} disabled={saving} className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center">
              <Save className="w-4 h-4" /> {saving ? (t.saving || 'Kaydediliyor...') : (t.saveChanges || 'Değişiklikleri Kaydet')}
            </button>
          </div>
        </div>

        {/* Vazgeçme ve Süreç Kapanış Durumu Uyarısı */}
        {isClosed && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm text-red-900">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <strong>{t.dossierClosedNotice || 'Bu aday dosyası kapatılmıştır / süreçten çıkılmıştır.'}</strong> {t.reason || 'Sebep:'} {closureReason || 'Belirtilmemiş'}
              </div>
            </div>
            <button onClick={() => { setIsClosed(false); setClosureReason(''); }} className="bg-white px-3 py-1.5 rounded-lg border border-red-300 font-bold hover:bg-red-100 transition cursor-pointer">
              {t.reopenProcess || 'Süreci Tekrar Aç'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          
          {/* Sol Kolon */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            
            {/* Fotoğraf, GSM, E-Posta ve Şifre Yönetimi */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-[#2e7d32]" /> {t.profileCredentialsManagement || 'Aday Fotoğraf, GSM, E-Posta ve Şifre Yönetimi'}
              </h3>

              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 bg-slate-50 rounded-2xl border">
                <div className="relative shrink-0">
                  {candidatePhoto ? (
                    <img src={candidatePhoto} alt="Profil" className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border shadow" />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-2xl">
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
                    <label className="font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                      <Phone className="w-3 h-3" /> {t.phoneNumberGsm || 'Telefon Numarası (GSM)'}
                    </label>
                    <input type="tel" value={candidatePhone} onChange={(e) => setCandidatePhone(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white font-bold text-slate-900 outline-none text-xs sm:text-sm" />
                  </div>

                  <div>
                    <label className="font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                      <Mail className="w-3 h-3" /> {t.emailAddress || 'E-Posta Adresi'}
                    </label>
                    <input type="email" value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white font-bold text-slate-900 outline-none text-xs sm:text-sm" />
                  </div>

                  <div>
                    <label className="font-bold text-slate-400 uppercase flex items-center gap-1 mb-1">
                      <KeyRound className="w-3 h-3" /> {t.portalPassword || 'Aday Portalı Şifresi'}
                    </label>
                    <input type="text" value={candidatePassword} onChange={(e) => setCandidatePassword(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border bg-white font-bold text-slate-900 outline-none text-xs sm:text-sm" />
                  </div>
                </div>
              </div>
            </div>

            {/* Seyahat ve Uçuş Lojistik Yönetimi */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <PlaneTakeoff className="w-5 h-5 text-sky-600" /> {t.travelFlightLogistics || 'Seyahat, Uçuş ve Konaklama Lojistiği'}
                </h3>
                <select
                  value={travelStatus}
                  onChange={(e) => setTravelStatus(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-bold uppercase bg-sky-50 text-sky-800 border-sky-300 outline-none cursor-pointer w-fit"
                >
                  <option value="planned">✈️ {t.planned || 'Planlanıyor'}</option>
                  <option value="ticketed">🎟️ {t.ticketed || 'Biletlendi'}</option>
                  <option value="completed">✅ {t.completed || 'Seyahat Tamamlandı'}</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">{t.flightDateTime || 'Uçuş Tarihi & Saati'}</label>
                  <input type="text" value={flightDate} onChange={(e) => setFlightDate(e.target.value)} placeholder="Örn: 15.10.2026 - 14:30" className="w-full px-3 py-2.5 rounded-xl border bg-white font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">{t.flightNumber || 'Uçuş Kodu / Sefer No'}</label>
                  <input type="text" value={flightNumber} onChange={(e) => setFlightNumber(e.target.value)} placeholder="Örn: TK-1926" className="w-full px-3 py-2.5 rounded-xl border bg-white font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">{t.departureCityAirport || 'Kalkış Yeri / Havalimanı'}</label>
                  <input type="text" value={departureCity} onChange={(e) => setDepartureCity(e.target.value)} placeholder="Örn: Skopje (SKP)" className="w-full px-3 py-2.5 rounded-xl border bg-white font-bold text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">{t.arrivalCityAirport || 'Varış Yeri / Havalimanı'}</label>
                  <input type="text" value={arrivalCity} onChange={(e) => setArrivalCity(e.target.value)} placeholder="Örn: Istanbul (IST)" className="w-full px-3 py-2.5 rounded-xl border bg-white font-bold text-slate-800 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">{t.pnrBookingCode || 'PNR / Bilet Rezervasyon Kodu'}</label>
                  <input type="text" value={pnrCode} onChange={(e) => setPnrCode(e.target.value)} placeholder="Örn: X79R2A" className="w-full px-3 py-2.5 rounded-xl border bg-white font-bold text-slate-800 outline-none uppercase" />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">{t.accommodationTransferDetails || 'Konaklama & Karşılama Detayları'}</label>
                  <input type="text" value={accommodationDetails} onChange={(e) => setAccommodationDetails(e.target.value)} placeholder="Örn: Otel transferi ve lojman bilgisi..." className="w-full px-3 py-2.5 rounded-xl border bg-white font-bold text-slate-800 outline-none" />
                </div>
              </div>
            </div>

            {/* Evrak & Belge Takip Mekanizması */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-indigo-600" /> {t.documentTrackingMechanism || 'Evrak & Belge Takip Mekanizması'}
                </h3>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-lg">
                  {documents.filter(d => d.status === 'approved').length} / {documents.length} {t.approved || 'Onaylı'}
                </span>
              </div>

              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                        <div>
                          <div className="font-extrabold text-slate-900">{doc.name}</div>
                          {doc.file_name && <div className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-none">{t.file || 'Dosya'}: {doc.file_name}</div>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={doc.status}
                          onChange={(e) => handleDocStatusChange(doc.id, e.target.value as any)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase cursor-pointer outline-none ${
                            doc.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            doc.status === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                            doc.status === 're_requested' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                            'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          <option value="pending">🟡 {t.pending || 'Bekleniyor'}</option>
                          <option value="uploaded">📤 {t.uploaded || 'Yüklendi'}</option>
                          <option value="reviewing">🔵 {t.reviewing || 'İnceleniyor'}</option>
                          <option value="approved">🟢 {t.approved || 'Onaylandı'}</option>
                          <option value="rejected">🔴 {t.rejected || 'Reddedildi'}</option>
                          <option value="re_requested">🔄 {t.reRequested || 'Yeniden istendi'}</option>
                        </select>

                        <button onClick={() => handleDeleteDocument(doc.id)} className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      {doc.file_url ? (
                        <button type="button" onClick={() => setPreviewDoc({ name: doc.name, url: doc.file_url! })} className="text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1 cursor-pointer w-fit">
                          <Eye className="w-3.5 h-3.5" /> {t.preview || 'Önizle'}
                        </button>
                      ) : <span className="text-slate-400 italic">{t.noFileUploaded || 'Dosya yüklenmedi'}</span>}

                      <label className="bg-white hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border font-bold cursor-pointer transition shadow-sm flex items-center gap-1 w-fit">
                        <Upload className="w-3.5 h-3.5 text-indigo-600" /> {t.uploadFromComputer || 'Bilgisayardan Yükle'}
                        <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(doc.id, e)} className="hidden" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder={t.newDocNamePlaceholder || 'Yeni Belge Adı'}
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border text-slate-900 bg-white outline-none"
                />
                <button onClick={handleAddDocument} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer">
                  <Plus className="w-4 h-4" /> {t.add || 'Ekle'}
                </button>
              </div>
            </div>

            {/* Sertifika, Video ve Değerlendirme */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" /> {t.professionalEvaluationCertificate || 'Mesleki Değerlendirme & Sertifika'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border space-y-2">
                  <span className="font-bold text-slate-500 uppercase block">{t.certificateInfo || 'Sertifika Bilgileri'}</span>
                  <input type="text" value={certificateNo} onChange={(e) => setCertificateNo(e.target.value)} placeholder={t.certificateNo || 'Sertifika No'} className="w-full px-3 py-2 rounded-lg border bg-white font-bold text-slate-800" />
                  <input type="text" value={issuingBody} onChange={(e) => setIssuingBody(e.target.value)} placeholder={t.issuingBody || 'Veren Kurum'} className="w-full px-3 py-2 rounded-lg border bg-white font-bold text-slate-800" />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-slate-500 uppercase block mb-1">{t.workVideoUrl || 'Çalışma Videosu URL'}</span>
                    <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className="w-full px-3 py-2 rounded-lg border bg-white font-bold text-slate-800" />
                  </div>
                  {videoUrl && (
                    <button 
                      type="button" 
                      onClick={() => setPreviewVideo(videoUrl)} 
                      className="mt-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200"
                    >
                      <Video className="w-4 h-4" /> {t.previewPlayVideo || 'Videoyu Önizle / Oynat'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* İç Notlar */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b pb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> {t.internalNotesAdminOnly || 'İç Değerlendirme Notları (Sadece PANOVA)'}
              </h3>
              <textarea rows={3} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} className="w-full p-4 rounded-xl border text-xs outline-none text-slate-900" />
            </div>
          </div>

          {/* Sağ Kolon */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6">
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b pb-2">{t.candidateStatus || 'Aday Süreç Durumu'}</h3>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="w-full p-3 rounded-xl border text-xs sm:text-sm font-extrabold bg-slate-900 text-white outline-none cursor-pointer shadow-sm"
              >
                <option value="pending" className="bg-white text-slate-900">🟡 {t.pending || 'Beklemede'}</option>
                <option value="reviewing" className="bg-white text-slate-900">🔵 {t.reviewing || 'İncelemede'}</option>
                <option value="visa_processing" className="bg-white text-slate-900">🟣 {t.visaProcessing || 'Vize Sürecinde'}</option>
                <option value="approved" className="bg-white text-slate-900">🟢 {t.approved || 'Onaylandı'}</option>
              </select>
            </div>

            {/* Vazgeçme ve Süreçten Çıkış Paneli */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-3 border-amber-200">
              <h3 className="text-sm sm:text-base font-bold text-amber-900 border-b pb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" /> {t.processClosureWithdrawal || 'Vazgeçme ve Süreçten Çıkış'}
              </h3>
              <p className="text-[11px] text-slate-500">{t.closureDesc || 'Aday iş teklifini reddederse veya süreç olumsuz sonuçlanırsa kaydı silmeden kapatabilirsiniz.'}</p>
              <textarea 
                rows={2} 
                value={closureReason} 
                onChange={(e) => setClosureReason(e.target.value)} 
                placeholder={t.closureReasonPlaceholder || 'Kapanış / Vazgeçme sebebi...'} 
                className="w-full p-3 rounded-xl border text-xs outline-none bg-slate-50 text-slate-900" 
              />
              <button 
                type="button" 
                onClick={() => { setIsClosed(true); handleSaveDetail(); }}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-sm"
              >
                {t.closeArchiveProcess || 'Aday Sürecini Kapat / Arşivle'}
              </button>
            </div>

            {/* Resmi İş Teklifi Gönderme Kartı */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-[#2e7d32]" /> {t.sendOfficialJobOffer || 'Resmi İş Teklifi Gönder'}
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.employerCompanyName || 'İşveren / Firma Adı'}</label>
                  <input 
                    type="text" 
                    value={offerEmployer} 
                    onChange={(e) => setOfferEmployer(e.target.value)} 
                    placeholder="Örn: Panova Tarim DOO" 
                    className="w-full px-3 py-2.5 rounded-xl border outline-none text-slate-900 font-medium bg-white" 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{t.monthlyNetSalary || 'Aylık Net Ücret (€)'}</label>
                    <input 
                      type="number" 
                      value={offerSalary} 
                      onChange={(e) => setOfferSalary(e.target.value)} 
                      placeholder="1200" 
                      className="w-full px-3 py-2.5 rounded-xl border outline-none text-slate-900 font-medium bg-white" 
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{t.startDate || 'İşe Başlama Tarihi'}</label>
                    <input 
                      type="text" 
                      value={offerDate} 
                      onChange={(e) => setOfferDate(e.target.value)} 
                      placeholder="01.11.2026" 
                      className="w-full px-3 py-2.5 rounded-xl border outline-none text-slate-900 font-medium bg-white" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.termsConditions || 'Teklif / Sözleşme Şartları'}</label>
                  <textarea 
                    rows={2} 
                    value={offerTerms} 
                    onChange={(e) => setOfferTerms(e.target.value)} 
                    placeholder="Konaklama ve yemek dahil..." 
                    className="w-full px-3 py-2.5 rounded-xl border outline-none text-slate-900 font-medium bg-white" 
                  />
                </div>
                <button 
                  type="button" 
                  onClick={handleSendJobOffer}
                  className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" /> {t.sendOfferToCandidate || 'Resmi Teklifi Adaya İlet'}
                </button>
              </div>
            </div>

            {/* Adaya Anlık Bildirim Gönderme Paneli */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl border shadow-sm space-y-4">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 border-b pb-2 flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#2e7d32]" /> {t.sendNotification || 'Adaya Bildirim Gönder'}
              </h3>
              <form onSubmit={handleSendNotificationToCandidate} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.notificationTitle || 'Bildirim Başlığı'}</label>
                  <input 
                    type="text" 
                    required 
                    value={notifTitle} 
                    onChange={(e) => setNotifTitle(e.target.value)} 
                    placeholder="Örn: Pasaport Belgesi Hk." 
                    className="w-full px-3 py-2.5 rounded-xl border outline-none text-slate-900 font-medium bg-white" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.messageBody || 'Mesaj İçeriği'}</label>
                  <textarea 
                    rows={3} 
                    required 
                    value={notifMessage} 
                    onChange={(e) => setNotifMessage(e.target.value)} 
                    placeholder="Adayın panelinde görünecek mesaj..." 
                    className="w-full px-3.5 py-2.5 rounded-xl border outline-none text-slate-900 font-medium bg-white" 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={notifSending} 
                  className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white py-3 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" /> {notifSending ? (t.sending || 'Gönderiliyor...') : (t.sendNotificationBtn || 'Bildirimi Adaya Gönder')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Belge Önizleme Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-xs sm:text-sm truncate max-w-[220px] sm:max-w-md">{previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="p-1.5 bg-slate-800 rounded-full text-slate-300 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-2 sm:p-4 flex-1 overflow-auto flex justify-center items-center bg-slate-100">
              <iframe src={previewDoc.url} className="w-full h-[70vh] rounded-xl border bg-white" title="Önizleme" />
            </div>
          </div>
        </div>
      )}

      {/* Video Önizleme Modal */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-xs sm:text-sm">{t.workVideoPreview || 'Çalışma Videosu Önizleme'}</h3>
              <button onClick={() => setPreviewVideo(null)} className="p-1.5 bg-slate-800 rounded-full text-slate-300 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex justify-center items-center bg-slate-100">
              {previewVideo.includes('youtube.com') || previewVideo.includes('youtu.be') ? (
                <iframe 
                  src={previewVideo.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                  className="w-full h-[70vh] rounded-xl border bg-black" 
                  title="Video Önizleme" 
                  allowFullScreen 
                />
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