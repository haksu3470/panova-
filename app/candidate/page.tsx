'use client';

import OAuthButtons from '@/components/auth/OAuthButtons';
import { AuthFooter } from '@/components/site/AuthFooter';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { linkMyCandidate, signOut } from '@/lib/auth';
import EmailVerifyNotice from '@/components/auth/EmailVerifyNotice';
import {
  beginPasswordSignup,
  emailGateListenerPaused,
  gateSession,
  isEmailNotConfirmedMessage,
  pauseEmailGateListener,
  rememberVerifyEmail,
  storedVerifyEmail,
} from '@/lib/emailVerification';
import { 
  User, CheckCircle2, LogOut, Lock, Camera, 
  FileText, Eye, X, Briefcase, Calendar, 
  Plane, Languages, ArrowLeft, Bell, Check, PlaneTakeoff, Ticket, MapPin, Building, UserPlus, LogIn, Video, ShieldAlert, ShieldCheck, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { Language, languages, translations } from '@/lib/dictionary';
import { homeCopy } from '@/lib/home-copy';
import { readStoredLanguage, syncDocumentLanguage, writeStoredLanguage } from '@/lib/site-language';


// Aday belge slotları -> candidate_documents.doc_type
const DOC_SLOT_TYPES = ['passport', 'certificate', 'criminal_record', 'health_report', 'apostille'];
const DONE_STATUSES = ['uploaded', 'reviewing', 'approved'];

export default function CandidateDashboard() {
  const [currentLang, setCurrentLang] = useState<Language>('tr');

  useEffect(() => {
    const handleStorageChange = () => {
      const next = readStoredLanguage('tr');
      setCurrentLang(next);
      syncDocumentLanguage(next);
    };
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [authenticated, setAuthenticated] = useState(false);

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'verify'>('login');
  const [verifyEmail, setVerifyEmail] = useState('');
  
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [docRows, setDocRows] = useState<any[]>([]);

  const [regFullName, setRegFullName] = useState('');
  const [regPassport, setRegPassport] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regProfession, setRegProfession] = useState('Elektrik Mühendisi / Teknisyeni');
  const [regSector, setRegSector] = useState('construction');

  const [candidate, setCandidate] = useState<any | null>(null);
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'documents' | 'jobs' | 'interviews' | 'offers' | 'process' | 'travel' | 'notifications' | 'support'>('overview');
  
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyRelation, setNewEmergencyRelation] = useState('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('');
  
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [jobOffers, setJobOffers] = useState<any[]>([]);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportSending, setSupportSending] = useState(false);

  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null);

  const t = translations[currentLang] || translations.tr;
  const isRtl = currentLang === 'ar';

  const docTitlesByLang: Record<Language, string[]> = {
    tr: ['Pasaport Taraması', 'Mesleki Sertifika / İzin Belgesi', 'Adli Sicil Kaydı (Sabıka Kaydı)', 'Sağlık Raporu / Akciğer Grafisi', 'e-Apostil / Dışişleri Bakanlığı Tasdiki'],
    en: ['Passport Scan', 'Professional Certificate / Permit', 'Criminal Record', 'Health Report / X-Ray', 'e-Apostille / MoFA Legalization'],
    sq: ['Skanimi i Pasaportës', 'Certifikata Profesionale / Leja', 'Dëshmi Penaliteti', 'Raporti Shëndetësor / Rrezet X', 'e-Apostille / Legalizimi i Ministrisë së Jashtme'],
    ar: ['مسح جواز السفر', 'الشهادة المهنية / التصريح', 'السجل الجنائي', 'التقرير الطبي / الأشعة', 'أبوستيل الكتروني / تصديق وزارة الخارجية']
  };

  // Dile duyarlı dinamik metin sözlüğü
  const candidateTexts: Record<Language, any> = {
    tr: {
      overviewTitle: 'Aday Durum ve Eksiklik Özeti',
      overviewDesc: 'Başvurunuzun ve profilinizin onay alabilmesi için tamamlanması gereken eksikler aşağıda listelenmiştir.',
      allComplete: 'Her Şey Tamam',
      hasMissing: 'Eksikler Var',
      profileMissingTitle: 'Profil & Bilgi Eksikleri',
      profileCompleteText: 'Profil bilgileriniz, fotoğraf ve acil durum eksiksiz.',
      missingPhoto: 'Profil Fotoğrafı',
      missingVideo: 'Çalışma/Tanıtım Videosu',
      missingEmergency: 'Acil Durum İletişim Bilgileri',
      notAdded: 'eklenmedi.',
      editProfileBtn: 'Profili Düzenle & Eksikleri Tamamla →',
      docMissingTitle: 'Belge Eksikleri',
      docCompleteText: 'Tüm zorunlu belgeler yüklendi.',
      notUploaded: 'henüz yüklenmedi.',
      uploadDocsBtn: 'Belgeleri Yükle →',
      profileHeader: 'Profil Bilgileri, Fotoğraf, Video & Acil Durum',
      photoLabel: 'Aday Profil Fotoğrafı',
      photoDesc: 'Net ve profesyonel bir vesikalık fotoğraf yükleyin.',
      videoLabel: 'Çalışma / Tanıtım Videosu URL (YouTube / Drive vb.)',
      previewBtn: 'Önizle',
      emailLabel: 'E-Posta Adresi',
      phoneLabel: 'Telefon Numarası',
      emergencyHeader: 'Acil Durum İletişim Bilgileri (Emergency Contact)',
      emergName: 'İlgili Kişi Adı (Name)',
      emergRel: 'Yakınlık Derecesi (Relationship)',
      emergPhone: 'Acil Durum Telefonu (Phone)',
      portalPass: 'Portal Şifresi',
      saveProfileBtn: 'Değişiklikleri Veritabanına Kaydet',
      docsHeader: 'Belgelerim & e-Apostil Takibi',
      uploadedStatus: 'Yüklendi',
      pendingStatus: 'Bekleniyor',
      previewDocBtn: 'Önizle',
      offersHeader: 'İş Tekliflerim',
      noOffers: 'Henüz tarafınıza iletilen aktif bir iş teklifi bulunmamaktadır.',
      acceptBtn: 'Kabul Et',
      rejectBtn: 'Reddet',
      supportHeader: 'PANOVA Destek Talepleri',
      supportSub: 'Konu',
      supportMsg: 'Mesajınız',
      sendSupportBtn: 'Destek Talebi Gönder',
      closeModal: 'Kapat',
      videoPreviewTitle: 'Aday Video Önizlemesi',
      docPreviewTitle: 'Belge Önizlemesi',
      savedSuccess: 'Tüm profil, acil durum ve video bilgileri veritabanına başarıyla kaydedildi!',
      docUploaded: 'Belge yüklendi ve veritabanına kaydedildi!'
    },
    en: {
      overviewTitle: 'Candidate Status & Missing Items Summary',
      overviewDesc: 'The items that need to be completed for your application and profile approval are listed below.',
      allComplete: 'All Complete',
      hasMissing: 'Missing Items',
      profileMissingTitle: 'Profile & Info Missing',
      profileCompleteText: 'Your profile, photo, and emergency info are complete.',
      missingPhoto: 'Profile Photo',
      missingVideo: 'Work/Intro Video',
      missingEmergency: 'Emergency Contact Information',
      notAdded: 'is missing.',
      editProfileBtn: 'Edit Profile & Complete Missing →',
      docMissingTitle: 'Document Missing',
      docCompleteText: 'All required documents uploaded.',
      notUploaded: 'not uploaded yet.',
      uploadDocsBtn: 'Upload Documents →',
      profileHeader: 'Profile Info, Photo, Video & Emergency',
      photoLabel: 'Candidate Profile Photo',
      photoDesc: 'Upload a clear and professional passport-style photo.',
      videoLabel: 'Work / Intro Video URL (YouTube / Drive etc.)',
      previewBtn: 'Preview',
      emailLabel: 'Email Address',
      phoneLabel: 'Phone Number',
      emergencyHeader: 'Emergency Contact Information',
      emergName: 'Contact Name',
      emergRel: 'Relationship',
      emergPhone: 'Emergency Phone',
      portalPass: 'Portal Password',
      saveProfileBtn: 'Save Changes to Database',
      docsHeader: 'My Documents & e-Apostille Tracking',
      uploadedStatus: 'Uploaded',
      pendingStatus: 'Pending',
      previewDocBtn: 'Preview',
      offersHeader: 'My Job Offers',
      noOffers: 'No active job offers sent to you yet.',
      acceptBtn: 'Accept',
      rejectBtn: 'Reject',
      supportHeader: 'PANOVA Support Tickets',
      supportSub: 'Subject',
      supportMsg: 'Your Message',
      sendSupportBtn: 'Send Support Ticket',
      closeModal: 'Close',
      videoPreviewTitle: 'Candidate Video Preview',
      docPreviewTitle: 'Document Preview',
      savedSuccess: 'All profile and emergency data saved successfully!',
      docUploaded: 'Document uploaded and saved to DB!'
    },
    sq: {
      overviewTitle: 'Përmbledhja e Statusit dhe Mungesave të Kandidatit',
      overviewDesc: 'Artikujt që duhet të plotësohen për miratimin e aplikimit dhe profilit tuaj janë listuar më poshtë.',
      allComplete: 'Çdo Gjë në Rregull',
      hasMissing: 'Ka Mungesa',
      profileMissingTitle: 'Mungesat në Profil & Informacion',
      profileCompleteText: 'Profili, fotoja dhe informacioni i urgjencës janë të plota.',
      missingPhoto: 'Foto e Profilit',
      missingVideo: 'Video e Punës / Prezantimit',
      missingEmergency: 'Informacioni i Kontaktit të Urgjencës',
      notAdded: 'nuk është shtuar.',
      editProfileBtn: 'Ndrysho Profilin & Plotëso Mungesat →',
      docMissingTitle: 'Mungesat e Dokumenteve',
      docCompleteText: 'Të gjitha dokumentet e detyrueshme janë ngarkuar.',
      notUploaded: 'ende nuk është ngarkuar.',
      uploadDocsBtn: 'Ngarko Dokumentet →',
      profileHeader: 'Informacioni i Profilit, Fotos, Videos & Urgjencës',
      photoLabel: 'Foto e Profilit të Kandidatit',
      photoDesc: 'Ngarkoni një foto të qartë dhe profesionale.',
      videoLabel: 'URL e Videos së Punës / Prezantimit (YouTube / Drive etj.)',
      previewBtn: 'Parapamje',
      emailLabel: 'Adresa e Emailit',
      phoneLabel: 'Numri i Telefonit',
      emergencyHeader: 'Informacioni i Kontaktit të Urgjencës',
      emergName: 'Emri i Personit',
      emergRel: 'Lidhja (Përkatësia)',
      emergPhone: 'Telefoni i Urgjencës',
      portalPass: 'Fjalëkalimi i Portalit',
      saveProfileBtn: 'Ruaj Ndryshimet në Bazën e të Dhënave',
      docsHeader: 'Dokumentet e Mia & Gjurmimi e-Apostille',
      uploadedStatus: 'Ngarkuar',
      pendingStatus: 'Në pritje',
      previewDocBtn: 'Parapamje',
      offersHeader: 'Ofertat e Mia të Punës',
      noOffers: 'Ende nuk keni oferta pune aktive të dërguara për ju.',
      acceptBtn: 'Prano',
      rejectBtn: 'Refuzo',
      supportHeader: 'Kërkesat e Mbështetjes PANOVA',
      supportSub: 'Subjekti',
      supportMsg: 'Mesazhi Juaj',
      sendSupportBtn: 'Dërgo Kërkesën e Mbështetjes',
      closeModal: 'Mbyll',
      videoPreviewTitle: 'Parapamje e Videos së Kandidatit',
      docPreviewTitle: 'Parapamje e Dokumentit',
      savedSuccess: 'Të gjitha të dhënat e profilit u ruajtën me sukses!',
      docUploaded: 'Dokumenti u ngarkua dhe u ruajt!'
    },
    ar: {
      overviewTitle: 'ملخص حالة المرشح والعناصر المفقودة',
      overviewDesc: 'العناصر التي يجب استكمالها للموافقة على طلبك وملفك الشخصي مدرجة أدناه.',
      allComplete: 'كل شيء مكتمل',
      hasMissing: 'هناك نواقص',
      profileMissingTitle: 'نواقص الملف الشخصي والمعلومات',
      profileCompleteText: 'ملفك الشخصي والصورة ومعلومات الطوارئ مكتملة.',
      missingPhoto: 'صورة الملف الشخصي',
      missingVideo: 'فيديو العمل / التعريف',
      missingEmergency: 'معلومات الاتصال في حالات الطوارئ',
      notAdded: 'لم تتم إضافته.',
      editProfileBtn: 'تعديل الملف الشخصي وإكمال النواقص ←',
      docMissingTitle: 'المستندات المفقودة',
      docCompleteText: 'تم تحميل جميع المستندات المطلوبة.',
      notUploaded: 'لم يتم تحميله بعد.',
      uploadDocsBtn: 'تحميل المستندات ←',
      profileHeader: 'معلومات الملف الشخصي، الصورة، الفيديو والطوارئ',
      photoLabel: 'صورة ملف المرشح الشخصي',
      photoDesc: 'قم بتحميل صورة واضحة واحترافية.',
      videoLabel: 'رابط فيديو العمل / التعريف (يوتيوب / درايف الخ)',
      previewBtn: 'معاينة',
      emailLabel: 'البريد الإلكتروني',
      phoneLabel: 'رقم الهاتف',
      emergencyHeader: 'معلومات الاتصال في حالات الطوارئ',
      emergName: 'اسم الشخص المعني',
      emergRel: 'درجة القرابة',
      emergPhone: 'هاتف الطوارئ',
      portalPass: 'كلمة مرور البوابة',
      saveProfileBtn: 'حفظ التغييرات في قاعدة البيانات',
      docsHeader: 'مستنداتي ومتابعة الأبوستيل',
      uploadedStatus: 'تم التحميل',
      pendingStatus: 'قيد الانتظار',
      previewDocBtn: 'معاينة',
      offersHeader: 'عروض العمل الخاصة بي',
      noOffers: 'لا توجد عروض عمل نشطة مرسلة إليك حتى الآن.',
      acceptBtn: 'قبول',
      rejectBtn: 'رفض',
      supportHeader: 'طلبات دعم بانوفا',
      supportSub: 'الموضوع',
      supportMsg: 'رسالتك',
      sendSupportBtn: 'إرسال طلب الدعم',
      closeModal: 'إغلاق',
      videoPreviewTitle: 'معاينة فيديو المرشح',
      docPreviewTitle: 'معاينة المستند',
      savedSuccess: 'تم حفظ كافة بيانات الملف الشخصي والطوارئ بنجاح!',
      docUploaded: 'تم تحميل المستند وحفظه في قاعدة البيانات!'
    }
  };

  const ct = candidateTexts[currentLang] || candidateTexts.tr;

  useEffect(() => {
    if (authenticated && candidate) {
      fetchCandidateData(candidate.id);
      setNewPhone(candidate.phone || '');
      setNewEmail(candidate.email || '');
      setNewPassword('');
      setNewPhoto(candidate.photo_url || '');
      setNewVideoUrl(candidate.video_url || '');

      try {
        const extra = candidate.documents_json ? JSON.parse(candidate.documents_json) : {};
        if (extra && extra.profile_meta) {
          setNewEmergencyName(extra.profile_meta.emergency_name || '');
          setNewEmergencyRelation(extra.profile_meta.emergency_relation || '');
          setNewEmergencyPhone(extra.profile_meta.emergency_phone || '');
        }
      } catch (e) {}
    }
  }, [authenticated]);

  const applyCandidate = (data: any) => {
    setCandidate(data);
    setNewPhone(data.phone || '');
    setNewEmail(data.email || '');
    setNewPassword('');
    setNewPhoto(data.photo_url || '');
    setNewVideoUrl(data.video_url || '');
    setAuthenticated(true);
    try {
      const extra = data.documents_json ? JSON.parse(data.documents_json) : {};
      if (extra && extra.profile_meta) {
        setNewEmergencyName(extra.profile_meta.emergency_name || '');
        setNewEmergencyRelation(extra.profile_meta.emergency_relation || '');
        setNewEmergencyPhone(extra.profile_meta.emergency_phone || '');
      }
    } catch (e) {}
    fetchCandidateData(data.id);
  };

  const loadLinkedCandidate = async (): Promise<boolean> => {
    const candidateId = await linkMyCandidate();
    if (!candidateId) return false;
    const { data } = await supabase.from('job_candidates').select('*').eq('id', candidateId).maybeSingle();
    if (!data) return false;
    applyCandidate(data);
    return true;
  };

  const showVerify = (email: string) => {
    setVerifyEmail(email);
    setAuthMode('verify');
  };

  useEffect(() => {
    const pending = storedVerifyEmail();
    if (pending && new URLSearchParams(window.location.search).get('verify') === '1') {
      showVerify(pending);
    }
    let alive = true;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return;
      setTimeout(async () => {
        if (!alive || emailGateListenerPaused() || !session) return;
        const gate = await gateSession();
        if (!alive) return;
        if (gate.status === 'verify') {
          showVerify(gate.email);
          setLoading(false);
          return;
        }
        if (gate.status === 'ready') await loadLinkedCandidate();
        setLoading(false);
      }, 0);
    });
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleCandidateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const resume = pauseEmailGateListener();
    const email = loginInput.trim().toLowerCase();
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (isEmailNotConfirmedMessage(error.message)) {
          rememberVerifyEmail(email, 'signup');
          showVerify(email);
          return;
        }
        alert(currentLang === 'tr' ? 'Hatalı e-posta veya şifre!' : 'Incorrect email or password!');
        return;
      }
      const gate = await gateSession();
      if (gate.status === 'verify') {
        showVerify(gate.email || email);
        return;
      }
      const ok = await loadLinkedCandidate();
      if (!ok) {
        await signOut();
        alert(currentLang === 'tr' ? 'Bu e-posta ile eşleşen aday kaydı bulunamadı!' : 'No candidate record linked to this email!');
      }
    } finally {
      resume();
      setLoading(false);
    }
  };

  const handleCandidateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regPassport || !regEmail || !regPassword) {
      alert(currentLang === 'tr' ? 'Lütfen zorunlu alanları doldurun.' : 'Please fill in required fields.');
      return;
    }
    if (regPassword.length < 8) {
      alert(currentLang === 'tr' ? 'Şifre en az 8 karakter olmalıdır.' : 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const resume = pauseEmailGateListener();
    const email = regEmail.trim().toLowerCase();
    try {
      const result = await beginPasswordSignup({
        email,
        password: regPassword,
        redirectPath: '/candidate',
        metadata: {
          role: 'candidate',
          full_name: regFullName,
          passport_number: regPassport.toUpperCase(),
          phone: regPhone,
          profession: regProfession,
          sector: regSector,
          nationality: 'Belirtilmedi',
        },
      });
      if (result.status === 'error') {
        alert((currentLang === 'tr' ? 'Kayıt hatası: ' : 'Signup error: ') + result.message);
        return;
      }
      showVerify(result.email);
    } finally {
      resume();
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setAuthenticated(false);
    setCandidate(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('panova_candidate_auth');
      localStorage.removeItem('panova_current_candidate');
    }
  };

  const fetchCandidateData = async (candId: string) => {
    const { data: docRowsData } = await supabase
      .from('candidate_documents')
      .select('*')
      .eq('candidate_id', candId)
      .order('created_at', { ascending: false });
    setDocRows(docRowsData || []);

    const { data: notifs } = await supabase
      .from('candidate_notifications')
      .select('*')
      .eq('candidate_id', candId)
      .order('created_at', { ascending: false });

    if (notifs) setNotifications(notifs);

    const { data: tickets } = await supabase
      .from('candidate_support_tickets')
      .select('*')
      .eq('candidate_id', candId)
      .order('created_at', { ascending: false });

    if (tickets) setSupportTickets(tickets);

    const { data: offers } = await supabase
      .from('job_offers')
      .select('*')
      .eq('candidate_id', candId)
      .order('created_at', { ascending: false });

    if (offers) setJobOffers(offers);
  };

  const handleUpdateOfferStatus = async (offerId: string, newStatus: 'accepted' | 'rejected') => {
    const { error } = await supabase
      .from('job_offers')
      .update({ status: newStatus })
      .eq('id', offerId);

    if (!error) {
      setJobOffers(jobOffers.map(o => o.id === offerId ? { ...o, status: newStatus } : o));
      alert(currentLang === 'tr' ? 'İş teklifi durumu güncellendi!' : 'Job offer status updated.');
    } else {
      alert('Hata: ' + error.message);
    }
  };

  const handleSendSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMsg.trim()) return;
    setSupportSending(true);

    const { data, error } = await supabase
      .from('candidate_support_tickets')
      .insert([
        {
          candidate_id: candidate.id,
          candidate_name: candidate.full_name,
          subject: supportSubject,
          message: supportMsg,
          status: 'open'
        }
      ])
      .select()
      .single();

    setSupportSending(false);

    if (!error && data) {
      setSupportTickets([data, ...supportTickets]);
      setSupportSubject('');
      setSupportMsg('');
      alert(currentLang === 'tr' ? 'Destek talebiniz oluşturuldu!' : 'Support ticket created successfully!');
    } else {
      alert('Hata: ' + (error?.message || 'Bilinmeyen hata'));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewPhoto(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDocUpload = async (docIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !candidate) return;
    const docType = DOC_SLOT_TYPES[docIndex] || 'other';

    const reader = new FileReader();
    reader.onload = async (e) => {
      const fileUrl = e.target?.result as string;
      const payload = { file_url: fileUrl, status: 'uploaded', uploaded_at: new Date().toISOString(), notes: file.name };
      const existing = docRows.find((r) => r.doc_type === docType && ['pending', 'uploaded', 'rerequested', 'rejected'].includes(r.status));
      const { error } = existing
        ? await supabase.from('candidate_documents').update(payload).eq('id', existing.id)
        : await supabase.from('candidate_documents').insert({ ...payload, candidate_id: candidate.id, doc_type: docType });

      if (!error) {
        await fetchCandidateData(candidate.id);
        alert(ct.docUploaded);
      } else {
        alert('Hata: ' + error.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);

    let currentData = { docs: [
      { id: '1', name: 'Pasaport Taraması', status: 'pending' },
      { id: '2', name: 'Mesleki Sertifika / İzin Belgesi', status: 'pending' },
      { id: '3', name: 'Adli Sicil Kaydı (Sabıka Kaydı)', status: 'pending' },
      { id: '4', name: 'Sağlık Raporu / Akciğer Grafisi', status: 'pending' },
      { id: '5', name: 'e-Apostil / Dışişleri Bakanlığı Tasdiki', status: 'pending' },
    ], profile_meta: {} };

    try {
      if (candidate?.documents_json) {
        const parsed = JSON.parse(candidate.documents_json);
        if (Array.isArray(parsed)) {
          currentData.docs = parsed;
        } else if (parsed.docs) {
          currentData = parsed;
        }
      }
    } catch (err) {}

    currentData.profile_meta = {
      emergency_name: newEmergencyName,
      emergency_relation: newEmergencyRelation,
      emergency_phone: newEmergencyPhone
    };

    const updatePayload: any = {
      phone: newPhone,
      email: newEmail,
      photo_url: newPhoto,
      video_url: newVideoUrl,
      documents_json: JSON.stringify(currentData)
    };

    const { error } = await supabase
      .from('job_candidates')
      .update(updatePayload)
      .eq('id', candidate.id);

    // Şifre değişikliği yalnızca Supabase Auth üzerinden
    let passError: any = null;
    if (newPassword && newPassword.length >= 8) {
      const res = await supabase.auth.updateUser({ password: newPassword });
      passError = res.error;
      if (!passError) setNewPassword('');
    }

    setUpdatingProfile(false);

    if (passError) {
      alert('Şifre güncellenemedi: ' + passError.message);
    }

    if (!error) {
      const updatedCandidate = {
        ...candidate,
        ...updatePayload
      };
      setCandidate(updatedCandidate);
      if (typeof window !== 'undefined') {
        localStorage.setItem('panova_current_candidate', JSON.stringify(updatedCandidate));
      }
      alert(ct.savedSuccess);
    } else {
      alert('Hata: ' + error.message);
    }
  };

  if (!authenticated || !candidate) {
    return (
      <div className={`min-h-screen bg-slate-50 flex flex-col justify-between ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <header className="w-full bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="PANOVA" width={1051} height={725} className="h-10 w-auto object-contain shrink-0" />
            <span className="font-extrabold text-slate-800 text-sm tracking-wide">PANOVA PORTAL</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200">
              <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
              <select 
                value={currentLang} 
                onChange={(e) => {
                  const newLang = e.target.value as Language;
                  setCurrentLang(newLang);
                  writeStoredLanguage(newLang);
                }} 
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <Link href="/" className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-200">
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" /> {t.returnHome}
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full">
            {authMode !== 'verify' && <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 border">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === 'login' ? 'bg-[#2e7d32] text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4" /> {t.signInMenu || 'Giriş Yap'}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === 'signup' ? 'bg-[#2e7d32] text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" /> {t.signUpMenu || 'Kayıt Ol'}
              </button>
            </div>}

            {authMode !== 'verify' && <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto mb-3">
                {authMode === 'login' ? <Lock className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">
                {authMode === 'login' ? t.candidatePortal : t.candidateRegister}
              </h1>
              <p className="text-slate-500 text-xs mt-1">
                {authMode === 'login' ? t.loginDesc : t.regFormSub}
              </p>
            </div>}

            {authMode === 'verify' ? (
              <div className="space-y-4">
                <EmailVerifyNotice
                  email={verifyEmail}
                  lang={currentLang}
                  redirectPath="/candidate"
                  onVerified={async () => {
                    const ok = await loadLinkedCandidate();
                    if (!ok) {
                      alert(currentLang === 'tr'
                        ? 'E-posta doğrulandı. Aday kaydınız ekip tarafından bağlanacak.'
                        : 'Email verified. Your candidate record will be linked by our team.');
                    }
                  }}
                />
                <button type="button" onClick={() => setAuthMode('login')} className="w-full text-xs font-bold text-slate-500 cursor-pointer">
                  {t.verifyEmailBack}
                </button>
                <OAuthButtons redirectPath="/candidate" orLabel={homeCopy[currentLang].oauthOr} googleLabel={homeCopy[currentLang].oauthGoogle} />
              </div>
            ) : authMode === 'login' ? (
              <><form onSubmit={handleCandidateLogin} className="space-y-4 text-left rtl:text-right">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.emailLabel || 'E-posta'}</label>
                  <input 
                    type="email" 
                    value={loginInput} 
                    onChange={(e) => setLoginInput(e.target.value)} 
                    placeholder="omer@gmail.com" 
                    required 
                    className="w-full px-4 py-3 rounded-xl border text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.password}</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••" 
                    required 
                    className="w-full px-4 py-3 rounded-xl border text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium" 
                  />
                </div>


                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold py-3.5 rounded-xl transition shadow-lg cursor-pointer text-sm"
                >
                  {loading ? '...' : t.loginBtn}
                </button>
              </form>
              <div className="mt-4"><OAuthButtons redirectPath="/candidate" orLabel={homeCopy[currentLang].oauthOr} googleLabel={homeCopy[currentLang].oauthGoogle} /></div></>
            ) : (
              <form onSubmit={handleCandidateSignup} className="space-y-3 text-left rtl:text-right text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.nameLabel} *</label>
                  <input 
                    type="text" 
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Hüseyin Aksu"
                    className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium outline-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{t.passportLabel} *</label>
                    <input 
                      type="text" 
                      required
                      value={regPassport}
                      onChange={(e) => setRegPassport(e.target.value)}
                      placeholder="U1234567"
                      className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium uppercase outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{t.phone} *</label>
                    <input 
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+389..."
                      className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium outline-none text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.emailLabel} *</label>
                  <input 
                    type="email" 
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{homeCopy[currentLang].passwordMin} *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium outline-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{t.professionLabel}</label>
                    <input 
                      type="text"
                      value={regProfession}
                      onChange={(e) => setRegProfession(e.target.value)}
                      placeholder="Elektrik Mühendisi"
                      className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{t.sectorLabel}</label>
                    <select
                      value={regSector}
                      onChange={(e) => setRegSector(e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium outline-none cursor-pointer text-sm"
                    >
                      {homeCopy[currentLang].formSectors.map((sector) => (
                        <option key={sector.value} value={sector.value}>{sector.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold py-3.5 rounded-xl transition shadow-lg cursor-pointer text-sm mt-3"
                >
                  {loading ? '...' : t.completeReg}
                </button>
              </form>
            )}
          </div>
        </main>

        <AuthFooter />
      </div>
    );
  }

  const defaultDocs = [
    { id: '1', name: 'Pasaport Taraması', status: 'pending' },
    { id: '2', name: 'Mesleki Sertifika / İzin Belgesi', status: 'pending' },
    { id: '3', name: 'Adli Sicil Kaydı (Sabıka Kaydı)', status: 'pending' },
    { id: '4', name: 'Sağlık Raporu / Akciğer Grafisi', status: 'pending' },
    { id: '5', name: 'e-Apostil / Dışişleri Bakanlığı Tasdiki', status: 'pending' },
  ];

  // Öncelik candidate_documents tablosu; tablo boşsa eski documents_json okunur (salt okuma yedeği).
  let candidateDocs: any[] = defaultDocs;
  if (docRows.length > 0) {
    candidateDocs = defaultDocs.map((d, i) => {
      const row = docRows.find((r) => r.doc_type === DOC_SLOT_TYPES[i]);
      return row ? { ...d, status: row.status, file_url: row.file_url } : d;
    });
  } else {
    try {
      if (candidate?.documents_json) {
        const parsed = JSON.parse(candidate.documents_json);
        if (Array.isArray(parsed)) candidateDocs = parsed;
        else if (parsed.docs) candidateDocs = parsed.docs;
      }
    } catch (e) {}
  }

  const currentLangTitles = docTitlesByLang[currentLang] || docTitlesByLang.tr;

  const missingDocs = candidateDocs.filter((d: any) => !DONE_STATUSES.includes(d.status));
  const missingProfileFields = [];
  if (!newPhoto) missingProfileFields.push(ct.missingPhoto);
  if (!newVideoUrl) missingProfileFields.push(ct.missingVideo);
  if (!newEmergencyName || !newEmergencyPhone) missingProfileFields.push(ct.missingEmergency);

  return (
    <div className={`min-h-screen bg-slate-50 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3 sm:gap-4">
            {newPhoto ? (
              <img src={newPhoto} alt="Profil" className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border shadow" />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl">
                {candidate.full_name?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 truncate max-w-[200px] sm:max-w-none">{candidate.full_name}</h1>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-500">
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">PNV-CAND-{candidate.id.substring(0, 6)}</span>
                <span>{t.passportLabel}: {candidate.passport_number || 'N/A'}</span>
                <span>{t.professionLabel}: {candidate.profession}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center bg-slate-100 rounded-xl px-2.5 py-1.5 border border-slate-200">
              <Languages className="w-4 h-4 text-slate-600 mr-1.5 rtl:ml-1.5" />
              <select 
                value={currentLang}
                onChange={(e) => {
                  const newLang = e.target.value as Language;
                  setCurrentLang(newLang);
                  writeStoredLanguage(newLang);
                }}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <Link href="/" className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border">
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" /> {t.returnHome}
            </Link>

            <button onClick={handleLogout} className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> {t.logout}
            </button>
          </div>
        </div>

        {/* Navigasyon Sekmeleri (Tüm diller destekli) */}
        <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto whitespace-nowrap text-xs font-bold scrollbar-none">
          <button onClick={() => setActiveTab('overview')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'overview' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📊 {t.overview}
          </button>
          <button onClick={() => setActiveTab('profile')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'profile' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            👤 {t.profile}
          </button>
          <button onClick={() => setActiveTab('documents')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'documents' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📁 {t.documents}
          </button>
          <button onClick={() => setActiveTab('offers')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'offers' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            💼 {t.offers} ({jobOffers.length})
          </button>
          <button onClick={() => setActiveTab('support')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'support' ? 'bg-[#2e7d32] text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            💬 {t.support} ({supportTickets.length})
          </button>
        </div>

        {/* Profil Sekmesi */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
            <h3 className="text-lg font-extrabold text-slate-900 border-b pb-3">👤 {ct.profileHeader}</h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border">
                {newPhoto ? (
                  <img src={newPhoto} alt="Önizleme" className="w-20 h-20 rounded-2xl object-cover border shadow-sm" />
                ) : (
                  <div className="w-20 h-20 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center font-bold text-2xl">
                    {candidate.full_name?.charAt(0)}
                  </div>
                )}
                <div className="space-y-1 text-center sm:text-left">
                  <label className="block font-extrabold text-slate-900 uppercase">{ct.photoLabel}</label>
                  <p className="text-slate-500 text-[11px]">{ct.photoDesc}</p>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-[#2e7d32] hover:file:bg-emerald-100 cursor-pointer mt-1" />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border space-y-2">
                <label className="block font-extrabold text-slate-900 uppercase">📹 {ct.videoLabel}</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={newVideoUrl} 
                    onChange={(e) => setNewVideoUrl(e.target.value)} 
                    placeholder="https://www.youtube.com/watch?v=..." 
                    className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                  />
                  {newVideoUrl && (
                    <button 
                      type="button" 
                      onClick={() => setPreviewVideo(newVideoUrl)}
                      className="bg-emerald-100 text-[#2e7d32] px-4 py-2 rounded-xl font-bold hover:bg-emerald-200 transition cursor-pointer shrink-0"
                    >
                      {ct.previewBtn}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{ct.emailLabel}</label>
                  <input 
                    type="email" 
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)} 
                    className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{ct.phoneLabel}</label>
                  <input 
                    type="text" 
                    value={newPhone} 
                    onChange={(e) => setNewPhone(e.target.value)} 
                    className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs text-emerald-800 uppercase border-b pb-1">🚨 {ct.emergencyHeader}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{ct.emergName}</label>
                    <input 
                      type="text" 
                      value={newEmergencyName} 
                      onChange={(e) => setNewEmergencyName(e.target.value)} 
                      placeholder="Örn: Md Samad Bepary" 
                      className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{ct.emergRel}</label>
                    <input 
                      type="text" 
                      value={newEmergencyRelation} 
                      onChange={(e) => setNewEmergencyRelation(e.target.value)} 
                      placeholder="Örn: Father / Baba" 
                      className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{ct.emergPhone}</label>
                    <input 
                      type="text" 
                      value={newEmergencyPhone} 
                      onChange={(e) => setNewEmergencyPhone(e.target.value)} 
                      placeholder="+880..." 
                      className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">{ct.portalPass}</label>
                <input 
                  type="text" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                />
              </div>

              <button 
                type="submit" 
                disabled={updatingProfile}
                className="bg-[#2e7d32] hover:bg-[#1b5e20] text-white px-6 py-3 rounded-xl font-bold transition shadow cursor-pointer text-xs"
              >
                {updatingProfile ? '...' : ct.saveProfileBtn}
              </button>
            </form>
          </div>
        )}

        {/* GENEL BAKIŞ (ÖZET) - DİL DESTEKLİ */}
        {activeTab === 'overview' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
            <div className="border-b pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">📊 {ct.overviewTitle}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{ct.overviewDesc}</p>
              </div>
              <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${missingDocs.length === 0 && missingProfileFields.length === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {missingDocs.length === 0 && missingProfileFields.length === 0 ? `✓ ${ct.allComplete}` : `⚠️ ${ct.hasMissing}`}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                <div className="flex items-center gap-2 font-extrabold text-slate-900 text-xs">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>{ct.profileMissingTitle}</span>
                </div>
                {missingProfileFields.length === 0 ? (
                  <p className="text-xs text-emerald-700 font-medium">✓ {ct.profileCompleteText}</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-amber-800">
                    {missingProfileFields.map((field, i) => (
                      <li key={i} className="flex items-center gap-1.5 bg-amber-50 p-2 rounded-xl border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span><strong>{field}</strong> {ct.notAdded}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={() => setActiveTab('profile')} className="w-full mt-2 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border text-xs transition cursor-pointer">
                  {ct.editProfileBtn}
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                <div className="flex items-center gap-2 font-extrabold text-slate-900 text-xs">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>{ct.docMissingTitle} ({missingDocs.length})</span>
                </div>
                {missingDocs.length === 0 ? (
                  <p className="text-xs text-emerald-700 font-medium">✓ {ct.docCompleteText}</p>
                ) : (
                  <ul className="space-y-1.5 text-xs text-red-800">
                    {missingDocs.map((doc: any, i: number) => (
                      <li key={i} className="flex items-center gap-1.5 bg-red-50 p-2 rounded-xl border border-red-200">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span><strong>{doc.name}</strong> {ct.notUploaded}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={() => setActiveTab('documents')} className="w-full mt-2 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border text-xs transition cursor-pointer">
                  {ct.uploadDocsBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Belgelerim Sekmesi */}
        {activeTab === 'documents' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 border-b pb-3">📁 {ct.docsHeader}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidateDocs.map((doc: any, idx: number) => (
                <div key={doc.id || idx} className="p-4 bg-slate-50 rounded-2xl border space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-900 text-xs">
                    <span>{currentLangTitles[idx] || doc.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${DONE_STATUSES.includes(doc.status) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {DONE_STATUSES.includes(doc.status) ? ct.uploadedStatus : ct.pendingStatus}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="file" 
                      onChange={(e) => handleDocUpload(idx, e)}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-[#2e7d32] hover:file:bg-emerald-100 cursor-pointer"
                    />
                    {doc.file_url && (
                      <button 
                        onClick={() => setPreviewDoc({ name: currentLangTitles[idx] || doc.name, url: doc.file_url })}
                        className="px-3 py-1.5 bg-emerald-100 text-[#2e7d32] font-bold rounded-xl text-xs hover:bg-emerald-200 transition shrink-0 cursor-pointer"
                      >
                        {ct.previewDocBtn}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* İş Tekliflerim Sekmesi */}
        {activeTab === 'offers' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 border-b pb-3">💼 {ct.offersHeader}</h3>
            {jobOffers.length === 0 ? (
              <p className="text-xs text-slate-400">{ct.noOffers}</p>
            ) : (
              jobOffers.map((offer) => (
                <div key={offer.id} className="p-4 bg-slate-50 rounded-2xl border flex justify-between items-center text-xs">
                  <div>
                    <strong>{offer.position_title}</strong> - {offer.employer_name} ({offer.country})
                    <div className="text-[11px] text-slate-500 mt-0.5">Ücret: {offer.salary} | Durum: <strong>{offer.status}</strong></div>
                  </div>
                  {offer.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdateOfferStatus(offer.id, 'accepted')} className="px-3 py-1.5 bg-[#2e7d32] text-white rounded-xl font-bold cursor-pointer">{ct.acceptBtn}</button>
                      <button onClick={() => handleUpdateOfferStatus(offer.id, 'rejected')} className="px-3 py-1.5 bg-red-600 text-white rounded-xl font-bold cursor-pointer">{ct.rejectBtn}</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Destek Sekmesi */}
        {activeTab === 'support' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
            <h3 className="text-lg font-extrabold text-slate-900 border-b pb-3">💬 {ct.supportHeader}</h3>
            <form onSubmit={handleSendSupport} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">{ct.supportSub}</label>
                <input type="text" value={supportSubject} onChange={(e) => setSupportSubject(e.target.value)} required placeholder="Örn: Belge Güncellemesi Hakkında" className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white" />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">{ct.supportMsg}</label>
                <textarea value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)} required rows={3} placeholder="Sorununuzu detaylı yazın..." className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white" />
              </div>
              <button type="submit" className="bg-[#2e7d32] text-white px-6 py-2.5 rounded-xl font-bold cursor-pointer">{ct.sendSupportBtn}</button>
            </form>
          </div>
        )}

      </div>

      {/* Video Önizleme Modalı */}
      {previewVideo && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">📹 {ct.videoPreviewTitle}</h3>
              <button onClick={() => setPreviewVideo(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>
            <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center overflow-hidden">
              <iframe src={previewVideo.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Belge Önizleme Modalı */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl border space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">📁 {ct.docPreviewTitle}: {previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>
            <div className="flex-1 bg-slate-100 rounded-2xl p-4 flex items-center justify-center overflow-auto">
              {previewDoc.url.startsWith('data:image') ? (
                <img src={previewDoc.url} alt={previewDoc.name} className="max-h-[60vh] object-contain rounded-xl shadow" />
              ) : (
                <iframe src={previewDoc.url} className="w-full h-[60vh] rounded-xl border bg-white" title={previewDoc.name} />
              )}
            </div>
            <div className="flex justify-end">
              <button onClick={() => setPreviewDoc(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer">
                {ct.closeModal}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}