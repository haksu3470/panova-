'use client';

import OAuthButtons from '@/components/auth/OAuthButtons';
import { AuthFooter } from '@/components/site/AuthFooter';
import CandidateYouTube from '@/components/candidate/CandidateYouTube';
import { SupportRequestList } from '@/components/candidate/SupportRequestList';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { linkMyCandidate, signOut, type CandidateLinkResult } from '@/lib/auth';
import {
  CandidateProfileError,
  assertCandidatePersisted,
  candidateAuthMetadata,
  candidateRegistrationPayload,
  changedCandidateEmail,
  changedCandidatePhoto,
  isPermissionDenied,
} from '@/lib/candidateProfile';
import { AccountExistsNotice } from '@/components/auth/AccountExistsNotice';
import EmailVerifyNotice from '@/components/auth/EmailVerifyNotice';
import ForgotPasswordPanel, { ForgotPasswordLink } from '@/components/auth/ForgotPasswordPanel';
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
  Plane, ArrowLeft, Bell, Check, PlaneTakeoff, Ticket, MapPin, Building, UserPlus, LogIn, ShieldAlert, ShieldCheck, AlertCircle, BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { Language, translations, type Translation } from '@/lib/dictionary';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import { RegistrationCountryOptions } from '@/components/site/RegistrationCountryOptions';
import { candidateDocumentTitle, candidatePlaceLabel, candidateProfessionLabel } from '@/lib/candidateLabels';
import CandidateProcessCard from '@/components/candidate/CandidateProcessCard';
import { ProfessionField } from '@/components/site/ProfessionField';
import { localizeCatalogTitle, professionForSectorChange } from '@/lib/professions';
import { homeCopy } from '@/lib/home-copy';
import { checkCandidateDuplicate, registrationBlock } from '@/lib/duplicateCandidate';
import { canonicalPassport, canonicalPhone } from '@/lib/loginIdentifier';
import { canonicalNationality } from '@/lib/registrationCountries';
import { candidateOfferResponse, offerMoney, offerStatusLabel } from '@/lib/offers';
import { offerStatusTone } from '@/lib/status-tone';
import { dateLocale, portalUi } from '@/lib/portal-ui-copy';
import { readStoredLanguage, syncDocumentLanguage, writeStoredLanguage } from '@/lib/site-language';
import { guideNavLabel } from '@/lib/guides-nav';
import KvkkConsent from '@/components/site/KvkkConsent';
import { kvkkMetadata } from '@/lib/kvkk';
import { releaseCopy } from '@/lib/release-copy';
import { supportBadgeCount, supportThreadCopy, type SupportMessage } from '@/lib/supportTickets';
import { openCandidateDocument, signedCandidateFileUrl, uploadCandidateFile } from '@/lib/candidateFiles';
import { validateUpload } from '@/lib/uploads';


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

  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'verify' | 'forgot' | 'exists'>('login');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [duplicateKind, setDuplicateKind] = useState<'email' | 'phone' | 'passport'>('email');
  const [linkIssue, setLinkIssue] = useState<'phone' | 'passport' | null>(null);
  const [fixValue, setFixValue] = useState('');
  
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [docRows, setDocRows] = useState<any[]>([]);

  const [regFullName, setRegFullName] = useState('');
  const [regPassport, setRegPassport] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regProfession, setRegProfession] = useState('');
  const [regSector, setRegSector] = useState('construction');
  const [regNationality, setRegNationality] = useState('');

  const [candidate, setCandidate] = useState<any | null>(null);
  const [regPassword, setRegPassword] = useState('');
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'documents' | 'jobs' | 'interviews' | 'offers' | 'process' | 'travel' | 'notifications' | 'support'>('overview');
  
  const [newFullName, setNewFullName] = useState('');
  const [newPassport, setNewPassport] = useState('');
  const [newProfession, setNewProfession] = useState('');
  const [newSector, setNewSector] = useState('construction');
  const [newNationality, setNewNationality] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhoto, setNewPhoto] = useState('');

  useEffect(() => {
    let cancelled = false;
    signedCandidateFileUrl(newPhoto).then((url) => {
      if (!cancelled && url) setPhotoPreview(url);
    });
    return () => {
      cancelled = true;
    };
  }, [newPhoto]);

  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyRelation, setNewEmergencyRelation] = useState('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('');
  
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const profileDirty = useRef(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [jobOffers, setJobOffers] = useState<any[]>([]);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportSending, setSupportSending] = useState(false);

  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null);

  const t = translations[currentLang] || translations.tr;
  const isRtl = currentLang === 'ar';

  const candidateTexts: Record<Language, any> = {
    tr: {
      overviewTitle: 'Aday Durum ve Eksiklik Özeti',
      overviewDesc: 'Başvurunuzun ve profilinizin onay alabilmesi için tamamlanması gereken eksikler aşağıda listelenmiştir.',
      allComplete: 'Her Şey Tamam',
      hasMissing: 'Eksikler Var',
      profileMissingTitle: 'Profil & Bilgi Eksikleri',
      profileCompleteText: 'Profil bilgileriniz, fotoğraf ve acil durum eksiksiz.',
      missingPhoto: 'Profil Fotoğrafı',
      missingVideo: 'Tanıtım / Mülakat Videoları',
      missingEmergency: 'Acil Durum İletişim Bilgileri',
      notAdded: 'eklenmedi.',
      editProfileBtn: 'Profili Düzenle & Eksikleri Tamamla →',
      docMissingTitle: 'Belge Eksikleri',
      docCompleteText: 'Tüm zorunlu belgeler yüklendi.',
      notUploaded: 'henüz yüklenmedi.',
      uploadDocsBtn: 'Belgeleri Yükle →',
      profileHeader: 'Profil Bilgileri, Fotoğraf, YouTube Videoları & Acil Durum',
      photoLabel: 'Aday Profil Fotoğrafı',
      photoDesc: 'Net ve profesyonel bir vesikalık fotoğraf yükleyin.',
      videoHeader: 'Kurumsal YouTube Kanalı Mülakat / Tanıtım Videoları (3 Hak)',
      video1Label: '1. Video: Genel Tanıtım ve Özgeçmiş Videosu',
      video2Label: '2. Video: Mesleki Beceri / Uygulama Videosu',
      video3Label: '3. Video: Saha Mülakatı / Ek Değerlendirme Videosu',
      videoPlaceholder: 'https://www.youtube.com/watch?v=...',
      previewBtn: 'Önizle',
      registrationHeader: 'Kayıt Bilgileri',
      profileNotSaved: 'Profil kaydedilemedi. Oturumunuzu kontrol edip tekrar deneyin.',
      profileEmailKept: 'Diğer bilgiler kaydedildi. Bu e-posta başka bir adayda kayıtlı olduğu için e-posta değişmedi.',
      profilePhotoNotSaved: 'Diğer bilgiler kaydedildi. Fotoğraf kaydedilemedi. Daha küçük bir görsel deneyin.',
      sessionRequired: 'Oturumunuz kapandı. Kayıt bilgilerini ve belgeleri kaydetmek için tekrar giriş yapın.',
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
      savedSuccess: 'Profil ve acil durum bilgileri veritabanına kaydedildi.',
      docUploaded: 'Belge yüklendi ve veritabanına kaydedildi!',
      offerUpdated: 'İş teklifi durumu güncellendi!',
      supportCreated: 'Destek talebiniz oluşturuldu!',
    },
    en: {
      overviewTitle: 'Candidate Status & Missing Items Summary',
      overviewDesc: 'The items that need to be completed for your application and profile approval are listed below.',
      allComplete: 'All Complete',
      hasMissing: 'Missing Items',
      profileMissingTitle: 'Profile & Info Missing',
      profileCompleteText: 'Your profile, photo, and emergency info are complete.',
      missingPhoto: 'Profile Photo',
      missingVideo: 'Interview / Intro Videos',
      missingEmergency: 'Emergency Contact Information',
      notAdded: 'is missing.',
      editProfileBtn: 'Edit Profile & Complete Missing →',
      docMissingTitle: 'Document Missing',
      docCompleteText: 'All required documents uploaded.',
      notUploaded: 'not uploaded yet.',
      uploadDocsBtn: 'Upload Documents →',
      profileHeader: 'Profile Info, Photo, YouTube Videos & Emergency',
      photoLabel: 'Candidate Profile Photo',
      photoDesc: 'Upload a clear and professional passport-style photo.',
      videoHeader: 'Corporate YouTube Channel Interview / Intro Videos (3 Slots)',
      video1Label: '1. Video: General Intro & Resume Video',
      video2Label: '2. Video: Professional Skill / Practice Video',
      video3Label: '3. Video: Field Interview / Extra Assessment Video',
      videoPlaceholder: 'https://www.youtube.com/watch?v=...',
      previewBtn: 'Preview',
      registrationHeader: 'Registration Details',
      profileNotSaved: 'Profile could not be saved. Check your session and try again.',
      profileEmailKept: 'The other details were saved. That email belongs to another candidate, so the email was not changed.',
      profilePhotoNotSaved: 'The other details were saved. The photo could not be saved. Try a smaller image.',
      sessionRequired: 'Your session has ended. Sign in again to save your registration and documents.',
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
      savedSuccess: 'Profile and emergency details were saved.',
      docUploaded: 'Document uploaded and saved to DB!',
      offerUpdated: 'Job offer status updated.',
      supportCreated: 'Support ticket created successfully!',
    },
    sq: {
      overviewTitle: 'Përmbledhja e Statusit dhe Mungesave të Kandidatit',
      overviewDesc: 'Artikujt që duhet të plotësohen për miratimin e aplikimit dhe profilit tuaj janë listuar më poshtë.',
      allComplete: 'Çdo Gjë në Rregull',
      hasMissing: 'Ka Mungesa',
      profileMissingTitle: 'Mungesat në Profil & Informacion',
      profileCompleteText: 'Profili, fotoja dhe informacioni i urgjencës janë të plota.',
      missingPhoto: 'Foto e Profilit',
      missingVideo: 'Videot e Intervistës / Prezantimit',
      missingEmergency: 'Informacioni i Kontaktit të Urgjencës',
      notAdded: 'nuk është shtuar.',
      editProfileBtn: 'Ndrysho Profilin & Plotëso Mungesat →',
      docMissingTitle: 'Mungesat e Dokumenteve',
      docCompleteText: 'Të gjitha dokumentet e detyrueshme janë ngarkuar.',
      notUploaded: 'ende nuk është ngarkuar.',
      uploadDocsBtn: 'Ngarko Dokumentet →',
      profileHeader: 'Informacioni i Profilit, Fotos, Videove YouTube & Urgjencës',
      photoLabel: 'Foto e Profilit të Kandidatit',
      photoDesc: 'Ngarkoni një foto të qartë dhe profesionale.',
      videoHeader: 'Videot e Kanalit Zyrtar YouTube (3 Slotet)',
      video1Label: '1. Video: Prezantimi i Përgjithshëm',
      video2Label: '2. Video: Aftësia Profesionale / Praktika',
      video3Label: '3. Video: Intervista në Terren / Vlerësim Shtesë',
      videoPlaceholder: 'https://www.youtube.com/watch?v=...',
      previewBtn: 'Parapamje',
      registrationHeader: 'Të dhënat e regjistrimit',
      profileNotSaved: 'Profili nuk u ruajt. Kontrolloni sesionin dhe provoni përsëri.',
      profileEmailKept: 'Të dhënat e tjera u ruajtën. Ky email i përket një kandidati tjetër, ndaj email-i nuk u ndryshua.',
      profilePhotoNotSaved: 'Të dhënat e tjera u ruajtën. Fotoja nuk u ruajt. Provoni një imazh më të vogël.',
      sessionRequired: 'Sesioni juaj ka përfunduar. Identifikohuni përsëri për të ruajtur regjistrimin dhe dokumentet.',
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
      savedSuccess: 'Të dhënat e profilit dhe të urgjencës u ruajtën.',
      docUploaded: 'Dokumenti u ngarkua dhe u ruajt!',
      offerUpdated: 'Statusi i ofertës së punës u përditësua!',
      supportCreated: 'Kërkesa për mbështetje u krijua me sukses!',
    },
    ar: {
      overviewTitle: 'ملخص حالة المرشح والعناصر المفقودة',
      overviewDesc: 'العناصر التي يجب استكمالها للموافقة على طلبك وملفك الشخصي مدرجة أدناه.',
      allComplete: 'كل شيء مكتمل',
      hasMissing: 'هناك نواقص',
      profileMissingTitle: 'نواقص الملف الشخصي والمعلومات',
      profileCompleteText: 'ملفك الشخصي والصورة ومعلومات الطوارئ مكتملة.',
      missingPhoto: 'صورة الملف الشخصي',
      missingVideo: 'فيديوهات المقابلة / التعريف',
      missingEmergency: 'معلومات الاتصال في حالات الطوارئ',
      notAdded: 'لم تتم إضافته.',
      editProfileBtn: 'تعديل الملف الشخصي وإكمال النواقص ←',
      docMissingTitle: 'المستندات المفقودة',
      docCompleteText: 'تم تحميل جميع المستندات المطلوبة.',
      notUploaded: 'لم يتم تحميله بعد.',
      uploadDocsBtn: 'تحميل المستندات ←',
      profileHeader: 'معلومات الملف الشخصي، الصورة، فيديوهات يوتيوب والطوارئ',
      photoLabel: 'صورة ملف المرشح الشخصي',
      photoDesc: 'قم بتحميل صورة واضحة واحترافية.',
      videoHeader: 'فيديوهات قناة يوتيوب الرسمية (3 خانات)',
      video1Label: '1. فيديو: التعريف العام والسيرة الذاتية',
      video2Label: '2. فيديو: المهارة المهنية / التطبيق',
      video3Label: '3. فيديو: المقابلة الميدانية / التقييم الإضافي',
      videoPlaceholder: 'https://www.youtube.com/watch?v=...',
      previewBtn: 'معاينة',
      registrationHeader: 'بيانات التسجيل',
      profileNotSaved: 'تعذر حفظ الملف الشخصي. تحقق من الجلسة وحاول مرة أخرى.',
      profileEmailKept: 'تم حفظ البيانات الأخرى. هذا البريد مرتبط بمرشح آخر، لذلك لم يتغير البريد.',
      profilePhotoNotSaved: 'تم حفظ البيانات الأخرى. تعذر حفظ الصورة. جرب صورة أصغر.',
      sessionRequired: 'انتهت جلستك. سجّل الدخول مرة أخرى لحفظ بيانات التسجيل والمستندات.',
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
      savedSuccess: 'تم حفظ بيانات الملف الشخصي والطوارئ.',
      docUploaded: 'تم تحميل المستند وحفظه في قاعدة البيانات!',
      offerUpdated: 'تم تحديث حالة عرض العمل!',
      supportCreated: 'تم إنشاء طلب الدعم بنجاح!',
    },
    mk: {
      overviewTitle: 'Преглед на статус и недостатоци на кандидатот',
      overviewDesc: 'Подолу се наведени работите што треба да се дополнат за пријавата и профилот да бидат одобрени.',
      allComplete: 'Сè е целосно',
      hasMissing: 'Има недостатоци',
      profileMissingTitle: 'Недостатоци во профилот и податоците',
      profileCompleteText: 'Профилот, фотографијата и податоците за итни случаи се целосни.',
      missingPhoto: 'Фотографија на профилот',
      missingVideo: 'Видео интервјуа / претставувања',
      missingEmergency: 'Контакт за итни случаи',
      notAdded: 'не е додадено.',
      editProfileBtn: 'Уреди го профилот и дополни ги недостатоците →',
      docMissingTitle: 'Недостасувачки документи',
      docCompleteText: 'Сите задолжителни документи се прикачени.',
      notUploaded: 'сè уште не е прикачено.',
      uploadDocsBtn: 'Прикачи документи →',
      profileHeader: 'Профил, фотографија, YouTube видеа и итни случаи',
      photoLabel: 'Фотографија на профилот на кандидатот',
      photoDesc: 'Прикачете јасна и професионална фотографија за документ.',
      videoHeader: 'YouTube видео интервјуa од официјалниот канал (3 места)',
      video1Label: '1. Видео: Општо претставување',
      video2Label: '2. Видео: Професионална вештина / практична работа',
      video3Label: '3. Видео: Теренско интервју / дополнителна оценка',
      videoPlaceholder: 'https://www.youtube.com/watch?v=...',
      previewBtn: 'Преглед',
      registrationHeader: 'Податоци од регистрацијата',
      profileNotSaved: 'Профилот не можеше да се зачува. Проверете ја сесијата и обидете се повторно.',
      profileEmailKept: 'Останатите податоци се зачувани. Оваа е-пошта е на друг кандидат, па е-поштата не е сменета.',
      profilePhotoNotSaved: 'Останатите податоци се зачувани. Фотографијата не е зачувана. Обидете се со помала слика.',
      sessionRequired: 'Вашата сесија заврши. Најавете се повторно за да ги зачувате регистрацијата и документите.',
      emailLabel: 'Е-пошта',
      phoneLabel: 'Телефонски број',
      emergencyHeader: 'Контакт за итни случаи',
      emergName: 'Име на лицето',
      emergRel: 'Сродство',
      emergPhone: 'Телефон за итни случаи',
      portalPass: 'Лозинка за порталот',
      saveProfileBtn: 'Зачувај ги промените во базата',
      docsHeader: 'Мои документи и следење на е-апостил',
      uploadedStatus: 'Прикачено',
      pendingStatus: 'Во чекање',
      previewDocBtn: 'Преглед',
      offersHeader: 'Мои понуди за работа',
      noOffers: 'Сè уште нема активна понуда за работа испратена до вас.',
      acceptBtn: 'Прифати',
      rejectBtn: 'Одбиј',
      supportHeader: 'Барања за поддршка до PANOVA',
      supportSub: 'Предмет',
      supportMsg: 'Вашата порака',
      sendSupportBtn: 'Испрати барање за поддршка',
      closeModal: 'Затвори',
      videoPreviewTitle: 'Преглед на видеото на кандидатот',
      docPreviewTitle: 'Преглед на документ',
      savedSuccess: 'Профилот и податоците за итни случаи се зачувани.',
      docUploaded: 'Документот е прикачен и зачуван!',
      offerUpdated: 'Статусот на понудата за работа е ажуриран!',
      supportCreated: 'Барањето за поддршка е успешно создадено!',
    },
  };

  const ct = candidateTexts[currentLang] || candidateTexts.tr;

  useEffect(() => {
    if (!authenticated || !candidate || profileDirty.current) return;
    setNewFullName(candidate.full_name || '');
    setNewPassport(candidate.passport_number || '');
    setNewProfession(candidate.profession || '');
    setNewSector(candidate.sector || 'construction');
    setNewNationality(canonicalNationality(candidate.nationality) || '');
    setNewPhone(candidate.phone || '');
    setNewEmail(candidate.email || '');
    setNewPassword('');
    setNewPhoto(candidate.photo_url || '');

    try {
      const extra = candidate.documents_json ? JSON.parse(candidate.documents_json) : {};
      if (extra && extra.profile_meta) {
        setNewEmergencyName(extra.profile_meta.emergency_name || '');
        setNewEmergencyRelation(extra.profile_meta.emergency_relation || '');
        setNewEmergencyPhone(extra.profile_meta.emergency_phone || '');
      }
    } catch (e) {}
  }, [authenticated]);

  const applyCandidate = (data: any) => {
    setCandidate(data);
    setAuthenticated(true);
    if (profileDirty.current) {
      fetchCandidateData(data.id);
      return;
    }
    setNewFullName(data.full_name || '');
    setNewPassport(data.passport_number || '');
    setNewProfession(data.profession || '');
    setNewSector(data.sector || 'construction');
    setNewNationality(canonicalNationality(data.nationality) || '');
    setNewPhone(data.phone || '');
    setNewEmail(data.email || '');
    setNewPassword('');
    setNewPhoto(data.photo_url || '');
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

  const explainLinkFailure = (failure: Exclude<CandidateLinkResult, { ok: true }>['failure'], copy: Translation) => {
    if (failure === 'phone') return copy.candidatePhoneTaken || '';
    if (failure === 'passport') return copy.candidatePassportTaken || '';
    if (failure === 'email') return copy.candidateEmailTaken || '';
    if (failure === 'unconfirmed') return copy.verifyEmailBanner || '';
    return copy.candidateRecordMissing || '';
  };

  const loadLinkedCandidate = async (): Promise<'ok' | Exclude<CandidateLinkResult, { ok: true }>['failure']> => {
    const storedKvkk = typeof window !== 'undefined' ? sessionStorage.getItem('panova_kvkk') : null;
    if (storedKvkk) {
      try {
        await supabase.auth.updateUser({ data: JSON.parse(storedKvkk) });
      } catch {
        /* The link function reports a missing consent. */
      }
    }
    const linked = await linkMyCandidate();
    if (!linked.ok) {
      setLinkIssue(linked.failure === 'phone' || linked.failure === 'passport' ? linked.failure : null);
      return linked.failure;
    }
    const { data } = await supabase.from('job_candidates').select('*').eq('id', linked.id).maybeSingle();
    if (!data) {
      setLinkIssue(null);
      return 'missing';
    }
    setLinkIssue(null);
    setFixValue('');
    applyCandidate(data);
    return 'ok';
  };

  const handleLinkResult = async (
    result: 'ok' | Exclude<CandidateLinkResult, { ok: true }>['failure'],
    announce: boolean,
  ) => {
    if (result === 'ok' || result === 'phone' || result === 'passport') return;
    if (result === 'kvkk') {
      alert(releaseCopy[readStoredLanguage('tr')].kvkkRequired);
      await signOut('local');
      return;
    }
    if (!announce) return;
    const lang = readStoredLanguage('tr');
    alert(explainLinkFailure(result, translations[lang] || translations.tr));
    await signOut('local');
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
      if (event === 'SIGNED_OUT') {
        profileDirty.current = false;
        setAuthenticated(false);
        setCandidate(null);
        return;
      }
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
        if (gate.status === 'ready' && !profileDirty.current) await handleLinkResult(await loadLinkedCandidate(), false);
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
    const identifier = loginInput.trim();
    try {
      const response = await fetch('/api/auth/candidate-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const body = await response.json().catch(() => ({} as { error?: string; email?: string; access_token?: string; refresh_token?: string }));
      if (response.status === 503 && !identifier.includes('@')) {
        alert(t.signInUnavailable);
        return;
      }
      if (response.status === 503 && identifier.includes('@')) {
        const email = identifier.toLowerCase();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (isEmailNotConfirmedMessage(error.message)) {
            rememberVerifyEmail(email, 'signup');
            showVerify(email);
            return;
          }
          alert(t.authInvalidCredentials);
          return;
        }
      } else if (body.error === 'email_not_confirmed' && body.email) {
        rememberVerifyEmail(body.email, 'signup');
        showVerify(body.email);
        return;
      } else if (!response.ok || !body.access_token || !body.refresh_token) {
        alert(t.authInvalidCredentials);
        return;
      } else {
        const { error } = await supabase.auth.setSession({
          access_token: body.access_token,
          refresh_token: body.refresh_token,
        });
        if (error) {
          alert(t.authInvalidCredentials);
          return;
        }
      }
      const gate = await gateSession();
      if (gate.status === 'verify') {
        showVerify(gate.email || identifier);
        return;
      }
      await handleLinkResult(await loadLinkedCandidate(), true);
    } finally {
      resume();
      setLoading(false);
    }
  };

  const handleCandidateSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regPassport || !regEmail || !regPassword || !canonicalNationality(regNationality)) {
      alert(t.fillRequiredFields);
      return;
    }
    if (regPassword.length < 8) {
      alert(t.passwordTooShort);
      return;
    }
    if (!kvkkAccepted) {
      alert(releaseCopy[currentLang].kvkkRequired);
      return;
    }
    const consent = kvkkMetadata();
    if (typeof window !== 'undefined') sessionStorage.setItem('panova_kvkk', JSON.stringify(consent));

    setLoading(true);
    const resume = pauseEmailGateListener();
    const email = regEmail.trim().toLowerCase();
    const passport = canonicalPassport(regPassport);
    const phone = canonicalPhone(regPhone);
    const showDuplicate = (kind: 'email' | 'phone' | 'passport') => {
      setDuplicateKind(kind);
      if (kind === 'email') setLoginInput(email);
      else if (kind === 'phone') setLoginInput(phone || regPhone.trim());
      else setLoginInput(passport);
      setAuthMode('exists');
    };
    try {
      const checked = await checkCandidateDuplicate({ email, passport, phone });
      if (!checked.ok) {
        alert(t.duplicateCheckFailed);
        return;
      }
      const block = registrationBlock(checked.flags);
      if (block) {
        showDuplicate(block);
        return;
      }
      const result = await beginPasswordSignup({
        email,
        password: regPassword,
        redirectPath: '/candidate',
        metadata: {
          role: 'candidate',
          full_name: regFullName,
          passport_number: passport,
          phone,
          profession: regProfession,
          sector: regSector,
          nationality: canonicalNationality(regNationality) || '',
          ...consent,
        },
        locale: currentLang,
      });
      if (result.status === 'exists') {
        showDuplicate('email');
        return;
      }
      if (result.status === 'error') {
        alert((t.signupError || '{message}').replace('{message}', result.message));
        return;
      }
      showVerify(result.email);
    } finally {
      resume();
      setLoading(false);
    }
  };

  const saveCandidateFix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkIssue) return;
    const value = fixValue.trim();
    if (!value) return;
    setLoading(true);
    const resume = pauseEmailGateListener();
    try {
      const data = linkIssue === 'phone'
        ? { phone: canonicalPhone(value) }
        : { passport_number: canonicalPassport(value) };
      const { error } = await supabase.auth.updateUser({ data });
      if (error) {
        alert(error.message);
        return;
      }
      await handleLinkResult(await loadLinkedCandidate(), true);
    } finally {
      resume();
      setLoading(false);
    }
  };

  const cancelCandidateFix = async () => {
    setLinkIssue(null);
    setFixValue('');
    await signOut('local');
    setAuthMode('login');
  };

  const handleLogout = async () => {
    profileDirty.current = false;
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

    if (tickets) {
      setSupportTickets(tickets);
      const ids = tickets.map((ticket: { id?: string }) => ticket.id).filter(Boolean);
      if (ids.length) {
        const { data: msgs } = await supabase
          .from('support_ticket_messages')
          .select('id, ticket_id, author_role, author_name, body, created_at, read_at')
          .in('ticket_id', ids)
          .order('created_at', { ascending: true });
        if (msgs) setSupportMessages(msgs);
      } else {
        setSupportMessages([]);
      }
    }

    const { data: offers } = await supabase
      .from('job_offers')
      .select('*')
      .eq('candidate_id', candId)
      .order('created_at', { ascending: false });

    if (offers) setJobOffers(offers);
  };

  const handleUpdateOfferStatus = async (offerId: string, newStatus: 'accepted' | 'rejected') => {
    const ui = portalUi[currentLang];
    const { data, error } = await supabase
      .from('job_offers')
      .update(candidateOfferResponse(newStatus, new Date().toISOString()))
      .eq('id', offerId)
      .select('id, status, responded_at')
      .maybeSingle();

    if (!error && data?.id) {
      setJobOffers(jobOffers.map(o => o.id === offerId ? { ...o, status: data.status, responded_at: data.responded_at } : o));
      alert(ct.offerUpdated);
    } else {
      alert(error?.message ? `${ui.offerUpdateFailed} ${error.message}` : ui.offerUpdateFailed);
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
      alert(ct.supportCreated);
    } else {
      alert('Hata: ' + (error?.message || 'Bilinmeyen hata'));
    }
  };

  const handleFollowUp = async (ticketId: string, body: string) => {
    if (!candidate?.id) return;
    const text = body.trim();
    if (!text) return;
    const { error: messageError } = await supabase.from('support_ticket_messages').insert({
      ticket_id: ticketId,
      author_role: 'candidate',
      author_name: candidate.full_name,
      body: text,
    });
    const { error: statusError } = await supabase
      .from('candidate_support_tickets')
      .update({ status: 'open' })
      .eq('id', ticketId);
    if (messageError || statusError) {
      alert(supportThreadCopy[currentLang].replyFailed);
      return;
    }
    await fetchCandidateData(candidate.id);
  };

  useEffect(() => {
    if (activeTab !== 'support' || !candidate?.id) return;
    const unreadIds = supportMessages
      .filter((message) => message.author_role === 'staff' && !message.read_at)
      .map((message) => message.id);
    if (!unreadIds.length) return;
    let cancel = false;
    void (async () => {
      const readAt = new Date().toISOString();
      const { error } = await supabase
        .from('support_ticket_messages')
        .update({ read_at: readAt })
        .in('id', unreadIds);
      if (error || cancel) return;
      setSupportMessages((current) => current.map((message) => (
        unreadIds.includes(message.id) ? { ...message, read_at: readAt } : message
      )));
    })();
    return () => { cancel = true; };
  }, [activeTab, candidate?.id, supportMessages]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !candidate?.id) return;
    const problem = validateUpload(file, 'photo');
    const copy = releaseCopy[currentLang];
    if (problem) {
      alert(problem === 'size' ? copy.uploadSize : copy.uploadType);
      return;
    }
    const local = URL.createObjectURL(file);
    setPhotoPreview(local);
    try {
      const stored = await uploadCandidateFile(candidate.id, 'photo', file, 'photo');
      setNewPhoto(stored);
      const signed = await signedCandidateFileUrl(stored);
      if (signed) setPhotoPreview(signed);
    } catch {
      setPhotoPreview('');
      alert(copy.uploadFailed);
    }
  };

  const loseCandidateSession = () => {
    profileDirty.current = false;
    setAuthenticated(false);
    setCandidate(null);
    alert(ct.sessionRequired);
  };

  const requireCandidateSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return true;
    loseCandidateSession();
    return false;
  };

  const handleDocUpload = async (docIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !candidate) return;
    const copy = releaseCopy[currentLang];
    const problem = validateUpload(file, 'document');
    if (problem) {
      alert(problem === 'size' ? copy.uploadSize : copy.uploadType);
      return;
    }
    if (!(await requireCandidateSession())) return;
    const docType = DOC_SLOT_TYPES[docIndex] || 'other';
    try {
      const fileUrl = await uploadCandidateFile(candidate.id, docType, file, 'document');
      const payload = { file_url: fileUrl, status: 'uploaded', uploaded_at: new Date().toISOString(), notes: file.name };
      const existing = docRows.find((r) => r.doc_type === docType && ['pending', 'uploaded', 'rerequested', 'rejected'].includes(r.status));
      const { error } = existing
        ? await supabase.from('candidate_documents').update(payload).eq('id', existing.id)
        : await supabase.from('candidate_documents').insert({ ...payload, candidate_id: candidate.id, doc_type: docType });
      if (!error) {
        await fetchCandidateData(candidate.id);
        alert(ct.docUploaded);
      } else if (isPermissionDenied(error)) {
        loseCandidateSession();
      } else {
        alert(copy.uploadFailed);
      }
    } catch (error) {
      if (error === 'type') alert(copy.uploadType);
      else if (error === 'size') alert(copy.uploadSize);
      else alert(copy.uploadFailed);
    }
  };

  const explainProfileError = (error: unknown) => {
    if (error instanceof CandidateProfileError) {
      if (error.code === 'phone') return t.candidatePhoneTaken || error.message;
      if (error.code === 'passport') return t.candidatePassportTaken || error.message;
      if (error.code === 'email') return t.candidateEmailTaken || error.message;
      if (error.code === 'invalid') return t.fillRequiredFields || error.message;
      if (error.code === 'not_persisted') return ct.profileNotSaved;
    }
    return error instanceof Error ? error.message : ct.profileNotSaved;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate?.id) return;
    if (!(await requireCandidateSession())) return;

    let registration;
    let emailUpdate: string | null = null;
    try {
      registration = candidateRegistrationPayload({
        fullName: newFullName,
        passport: newPassport,
        phone: newPhone,
        profession: newProfession,
        sector: newSector,
        nationality: newNationality,
      });
      emailUpdate = changedCandidateEmail(candidate.email, newEmail);
    } catch (error) {
      alert(explainProfileError(error));
      return;
    }
    const photoUpdate = changedCandidatePhoto(candidate.photo_url, newPhoto);

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

    const { data: savedRow, error } = await supabase
      .from('job_candidates')
      .update({ ...registration, documents_json: JSON.stringify(currentData) })
      .eq('id', candidate.id)
      .select('*')
      .maybeSingle();

    let persisted: any = null;
    try {
      persisted = assertCandidatePersisted(savedRow, error);
    } catch (writeError) {
      setUpdatingProfile(false);
      console.error("Panova HR Log - Veritabanı Kayıt Hatası:", writeError);
      if (isPermissionDenied(writeError)) {
        loseCandidateSession();
        return;
      }
      alert(explainProfileError(writeError));
      return;
    }

    let emailNote = '';
    if (emailUpdate) {
      const { data: emailRow, error: emailError } = await supabase
        .from('job_candidates')
        .update({ email: emailUpdate })
        .eq('id', candidate.id)
        .select('id, email')
        .maybeSingle();
      try {
        const savedEmail = assertCandidatePersisted(emailRow, emailError);
        persisted = { ...persisted, email: savedEmail.email };
      } catch (writeError) {
        console.error("Panova HR Log - E-posta güncellenemedi:", writeError);
        if (isPermissionDenied(writeError)) {
          setUpdatingProfile(false);
          loseCandidateSession();
          return;
        }
        const detail = explainProfileError(writeError);
        emailNote = writeError instanceof CandidateProfileError && writeError.code === 'email'
          ? ct.profileEmailKept
          : `${ct.profileEmailKept}\n${detail}`;
      }
    }

    let photoNote = '';
    if (photoUpdate !== null) {
      const { data: photoRow, error: photoError } = await supabase
        .from('job_candidates')
        .update({ photo_url: photoUpdate })
        .eq('id', candidate.id)
        .select('id, photo_url')
        .maybeSingle();
      try {
        const savedPhoto = assertCandidatePersisted(photoRow, photoError);
        persisted = { ...persisted, photo_url: savedPhoto.photo_url };
      } catch (writeError) {
        console.error("Panova HR Log - Fotoğraf güncellenemedi:", writeError);
        if (isPermissionDenied(writeError)) {
          setUpdatingProfile(false);
          loseCandidateSession();
          return;
        }
        photoNote = ct.profilePhotoNotSaved;
      }
    }

    let passError: any = null;
    if (newPassword && newPassword.length >= 8) {
      const res = await supabase.auth.updateUser({ password: newPassword });
      passError = res.error;
      if (!passError) setNewPassword('');
    }

    // A failed email edit must stay on screen. A session reload would put the old address back.
    profileDirty.current = Boolean(emailNote);
    // Metadata is the copy link_my_candidate reads only when creating the row.
    // Email is omitted so this does not start an address-change confirmation.
    const meta = await supabase.auth.updateUser({
      data: candidateAuthMetadata({ ...registration, email: persisted.email || candidate.email || newEmail }),
    });
    if (meta.error) console.error("Panova HR Log - Kimlik metadata güncellenemedi:", meta.error);
    await linkMyCandidate();

    setUpdatingProfile(false);

    if (passError) {
      console.error("Panova HR Log - Şifre Güncelleme Hatası:", passError);
      alert('Şifre güncellenemedi: ' + passError.message);
    }

    const updatedCandidate = { ...candidate, ...persisted };
    setCandidate(updatedCandidate);
    setNewFullName(persisted.full_name || registration.full_name);
    setNewPassport(persisted.passport_number || registration.passport_number);
    setNewProfession(persisted.profession || registration.profession);
    setNewSector(persisted.sector || registration.sector);
    setNewNationality(canonicalNationality(persisted.nationality) || registration.nationality);
    setNewPhone(persisted.phone || registration.phone);
    setNewEmail(emailNote ? newEmail : (persisted.email || newEmail));
    setNewPhoto(persisted.photo_url || '');
    if (typeof window !== 'undefined') {
      localStorage.setItem('panova_current_candidate', JSON.stringify(updatedCandidate));
    }
    alert([emailNote, photoNote].filter(Boolean).join('\n') || ct.savedSuccess);
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
            <LanguageSwitcher currentLang={currentLang} onChange={(lang) => { setCurrentLang(lang); writeStoredLanguage(lang); }} />
            <Link href="/" className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-200">
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" /> {t.returnHome}
            </Link>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full">
            {(authMode === 'login' || authMode === 'signup') && !linkIssue && <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6 border">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === 'login' ? 'bg-brand-solid text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4" /> {t.signInMenu}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === 'signup' ? 'bg-brand-solid text-white shadow' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4" /> {t.signUpMenu}
              </button>
            </div>}

            {(authMode === 'login' || authMode === 'signup') && !linkIssue && <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-100 text-brand rounded-2xl flex items-center justify-center mx-auto mb-3">
                {authMode === 'login' ? <Lock className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              </div>
              <h1 className="text-xl font-extrabold text-slate-900">
                {authMode === 'login' ? t.candidatePortal : t.candidateRegister}
              </h1>
              <p className="text-muted-foreground text-xs mt-1">
                {authMode === 'login' ? t.loginDesc : t.regFormSub}
              </p>
            </div>}

            {linkIssue ? (
              <form onSubmit={saveCandidateFix} className="space-y-4 text-left rtl:text-right">
                <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                  {linkIssue === 'phone' ? t.candidatePhoneTaken : t.candidatePassportTaken}
                </p>
                <div>
                  <label htmlFor="candidate-fix-value" className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {linkIssue === 'phone' ? t.candidateFixPhoneLabel : t.candidateFixPassportLabel}
                  </label>
                  <input
                    id="candidate-fix-value"
                    value={fixValue}
                    onChange={(e) => setFixValue(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !fixValue.trim()}
                  className="w-full bg-brand-solid hover:bg-brand disabled:bg-disabled disabled:text-on-dark disabled:opacity-100 text-white font-bold py-3.5 rounded-xl text-sm cursor-pointer"
                >
                  {linkIssue === 'phone' ? t.candidateFixPhoneBtn : t.candidateFixPassportBtn}
                </button>
                <button type="button" onClick={cancelCandidateFix} className="w-full text-xs font-bold text-muted-foreground cursor-pointer">
                  {t.verifyEmailBack}
                </button>
              </form>
            ) : authMode === 'verify' ? (
              <div className="space-y-4">
                <EmailVerifyNotice
                  email={verifyEmail}
                  lang={currentLang}
                  redirectPath="/candidate"
                  onVerified={async () => {
                    await handleLinkResult(await loadLinkedCandidate(), true);
                  }}
                  onSignIn={() => { setLoginInput(verifyEmail); setAuthMode('login'); }}
                  onResetPassword={() => { setLoginInput(verifyEmail); setAuthMode('forgot'); }}
                />
                <button type="button" onClick={() => setAuthMode('login')} className="w-full text-xs font-bold text-muted-foreground cursor-pointer">
                  {t.verifyEmailBack}
                </button>
                <OAuthButtons redirectPath="/candidate" orLabel={homeCopy[currentLang].oauthOr} googleLabel={homeCopy[currentLang].oauthGoogle} />
              </div>
            ) : authMode === 'exists' ? (
              <AccountExistsNotice
                message={(duplicateKind === 'phone' ? t.phoneExists : duplicateKind === 'passport' ? t.passportExists : t.accountExists) || ''}
                signInLabel={t.signInMenu || ''}
                resetLabel={duplicateKind === 'email' ? (t.forgotPassword || '') : undefined}
                onSignIn={() => setAuthMode('login')}
                onReset={duplicateKind === 'email' ? () => setAuthMode('forgot') : undefined}
              />
            ) : authMode === 'forgot' ? (
              <ForgotPasswordPanel
                lang={currentLang}
                initialEmail={loginInput}
                audience="candidate"
                onBack={() => setAuthMode('login')}
              />
            ) : authMode === 'login' ? (
              <><form onSubmit={handleCandidateLogin} className="space-y-4 text-left rtl:text-right">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.emailOrPhone}</label>
                  <input 
                    type="text" 
                    value={loginInput} 
                    onChange={(e) => setLoginInput(e.target.value)} 
                    autoComplete="username"
                    placeholder={t.loginDesc} 
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

                <ForgotPasswordLink label={t.forgotPassword || ''} onClick={() => setAuthMode('forgot')} />

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-brand-solid hover:bg-brand text-white font-bold py-3.5 rounded-xl transition shadow-lg cursor-pointer text-sm"
                >
                  {loading ? '...' : t.loginBtn}
                </button>
                <p className="text-[11px] text-muted-foreground leading-snug">{t.loginDesc}</p>
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
                    placeholder={t.examplePersonName}
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
                    placeholder={t.exampleEmail}
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
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.nationalityCol} *</label>
                  <select
                    required
                    value={regNationality}
                    onChange={(e) => setRegNationality(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium outline-none cursor-pointer text-sm"
                  >
                    <option value="">{portalUi[currentLang].selectCountry}</option>
                    <RegistrationCountryOptions lang={currentLang} currentValue={regNationality} />
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1" htmlFor="reg-profession">{t.professionLabel}</label>
                    <ProfessionField
                      id="reg-profession"
                      lang={currentLang}
                      sector={regSector}
                      value={regProfession}
                      onChange={setRegProfession}
                      className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium outline-none cursor-pointer text-sm"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{t.sectorLabel}</label>
                    <select
                      value={regSector}
                      onChange={(e) => {
                        const next = e.target.value;
                        setRegSector(next);
                        setRegProfession((current) => professionForSectorChange(current, next));
                      }}
                      className="w-full px-3.5 py-3 rounded-xl border text-slate-900 bg-white font-medium outline-none cursor-pointer text-sm"
                    >
                      {homeCopy[currentLang].formSectors.map((sector) => (
                        <option key={sector.value} value={sector.value}>{sector.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <KvkkConsent id="candidate-kvkk" checked={kvkkAccepted} onChange={(checked) => {
                  setKvkkAccepted(checked);
                  if (typeof window === 'undefined') return;
                  if (checked) sessionStorage.setItem('panova_kvkk', JSON.stringify(kvkkMetadata()));
                  else sessionStorage.removeItem('panova_kvkk');
                }} copy={releaseCopy[currentLang]} />
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-brand-solid hover:bg-brand text-white font-bold py-3.5 rounded-xl transition shadow-lg cursor-pointer text-sm mt-3"
                >
                  {loading ? '...' : t.completeReg}
                </button>
              </form>
            )}
          </div>
        </main>

        <AuthFooter lang={currentLang} />
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

  let candidateDocs: any[] = defaultDocs;
  if (docRows.length > 0) {
    candidateDocs = defaultDocs.map((d, i) => {
      const row = docRows.find((r) => r.doc_type === DOC_SLOT_TYPES[i]);
      return row ? { ...d, slot: d.id, id: row.id, status: row.status, file_url: row.file_url, notes: row.notes, review_note: row.review_note } : d;
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

  const docTitle = (doc: { id?: unknown; slot?: unknown; name?: unknown }) => candidateDocumentTitle(doc, t);

  const missingDocs = candidateDocs.filter((d: any) => !DONE_STATUSES.includes(d.status));
  const missingProfileFields = [];
  if (!newPhoto) missingProfileFields.push(ct.missingPhoto);
  if (!newEmergencyName || !newEmergencyPhone) missingProfileFields.push(ct.missingEmergency);

  const youtubeLabels = {
    title: t.youtubeVideoTitle || t.corporateYouTubeVideos || '',
    empty: t.youtubeVideoEmpty || '',
    watch: t.youtubeVideoWatch || t.watchVideo,
    open: t.youtubeVideoOpen || '',
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 p-3 sm:p-6 lg:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-3 sm:gap-4">
            {photoPreview || (newPhoto.startsWith('data:') ? newPhoto : '') ? (
              <img src={photoPreview || newPhoto} alt="Profil" className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border shadow" />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-100 text-brand rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl">
                {candidate.full_name?.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-base sm:text-xl font-extrabold text-slate-900 truncate max-w-[200px] sm:max-w-none">{candidate.full_name}</h1>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">PNV-CAND-{candidate.id.substring(0, 6)}</span>
                <span>{t.passportLabel}: {candidate.passport_number || 'N/A'}</span>
                <span>{t.professionLabel}: {candidateProfessionLabel(candidate.profession, portalUi[currentLang].unspecified, currentLang)}</span>
                <span>{t.nationalityCol}: {candidatePlaceLabel(candidate.nationality, '', currentLang, portalUi[currentLang].unspecified)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <LanguageSwitcher currentLang={currentLang} onChange={(lang) => { setCurrentLang(lang); writeStoredLanguage(lang); }} />

            <Link href="/" className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border">
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" /> {t.returnHome}
            </Link>

            <button onClick={handleLogout} className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer">
              <LogOut className="w-3.5 h-3.5" /> {t.logout}
            </button>
          </div>
        </div>

        {/* Navigasyon Sekmeleri */}
        <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto whitespace-nowrap text-xs font-bold scrollbar-none">
          <button onClick={() => setActiveTab('overview')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'overview' ? 'bg-brand-solid text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📊 {t.overview}
          </button>
          <button onClick={() => setActiveTab('profile')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'profile' ? 'bg-brand-solid text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            👤 {t.profile}
          </button>
          <button onClick={() => setActiveTab('documents')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'documents' ? 'bg-brand-solid text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            📁 {t.documents}
          </button>
          <button onClick={() => setActiveTab('offers')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'offers' ? 'bg-brand-solid text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            💼 {t.offers} ({jobOffers.length})
          </button>
          <button onClick={() => setActiveTab('support')} className={`px-3.5 py-2 rounded-xl cursor-pointer transition shrink-0 ${activeTab === 'support' ? 'bg-brand-solid text-white shadow' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}>
            💬 {t.support}{supportBadgeCount(supportTickets, supportMessages) > 0 ? ` (${supportBadgeCount(supportTickets, supportMessages)})` : ''}
          </button>
          <Link href="/guides" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition shrink-0 bg-white border text-slate-700 hover:bg-slate-50">
            <BookOpen className="w-3.5 h-3.5" aria-hidden /> {guideNavLabel[currentLang]}
          </Link>
        </div>

        {/* Profil Sekmesi */}
        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
            <h3 className="text-lg font-extrabold text-slate-900 border-b pb-3">👤 {ct.profileHeader}</h3>
            
            <form onSubmit={handleUpdateProfile} onChange={() => { profileDirty.current = true; }} autoComplete="off" className="space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border">
                {newPhoto ? (
                  <img src={photoPreview || newPhoto} alt="Önizleme" className="w-20 h-20 rounded-2xl object-cover border shadow-sm" />
                ) : (
                  <div className="w-20 h-20 bg-emerald-100 text-brand rounded-2xl flex items-center justify-center font-bold text-2xl">
                    {candidate.full_name?.charAt(0)}
                  </div>
                )}
                <div className="space-y-1 text-center sm:text-left">
                  <label className="block font-extrabold text-slate-900 uppercase">{ct.photoLabel}</label>
                  <p className="text-muted-foreground text-[11px]">{ct.photoDesc}</p>
                  <input type="file" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={handlePhotoUpload} className="block w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-brand hover:file:bg-emerald-100 cursor-pointer mt-1" />
                </div>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <CandidateYouTube videos={candidate} labels={youtubeLabels} />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs text-emerald-800 uppercase border-b pb-1">{ct.registrationHeader}</h4>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">{t.nameLabel} *</label>
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder={t.examplePersonName}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{t.passportLabel} *</label>
                    <input
                      type="text"
                      required
                      value={newPassport}
                      onChange={(e) => setNewPassport(e.target.value)}
                      placeholder="U1234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium uppercase"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{ct.phoneLabel} *</label>
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+389..."
                      className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1" htmlFor="profile-profession">{t.professionLabel} *</label>
                    <ProfessionField
                      id="profile-profession"
                      lang={currentLang}
                      sector={newSector}
                      value={newProfession}
                      onChange={setNewProfession}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium outline-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase mb-1">{t.sectorLabel} *</label>
                    <select
                      required
                      value={newSector}
                      onChange={(e) => {
                        const next = e.target.value;
                        setNewSector(next);
                        setNewProfession((current) => professionForSectorChange(current, next));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium outline-none cursor-pointer"
                    >
                      {homeCopy[currentLang].formSectors.some((sector) => sector.value === newSector) ? null : (
                        <option value={newSector}>{newSector}</option>
                      )}
                      {homeCopy[currentLang].formSectors.map((sector) => (
                        <option key={sector.value} value={sector.value}>{sector.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 uppercase mb-1">{t.nationalityCol} *</label>
                    <select
                      required
                      value={newNationality}
                      onChange={(e) => setNewNationality(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium outline-none cursor-pointer"
                    >
                      <option value="">{portalUi[currentLang].selectCountry}</option>
                      <RegistrationCountryOptions lang={currentLang} currentValue={newNationality} />
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 uppercase mb-1">{ct.emailLabel} *</label>
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-slate-900 bg-white font-medium"
                    />
                  </div>
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
                className="bg-brand-solid hover:bg-brand text-white px-6 py-3 rounded-xl font-bold transition shadow cursor-pointer text-xs"
              >
                {updatingProfile ? '...' : ct.saveProfileBtn}
              </button>
            </form>
          </div>
        )}

        {/* GENEL BAKIŞ (ÖZET) */}
        {activeTab === 'overview' && (
          <CandidateProcessCard
            candidate={candidate}
            offers={jobOffers}
            loading={!candidate}
            t={t}
            steps={portalUi[currentLang].steps}
            lang={currentLang}
            isRtl={isRtl}
          />
        )}
        {activeTab === 'overview' && (
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-6">
            <div className="border-b pb-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">📊 {ct.overviewTitle}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{ct.overviewDesc}</p>
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
                        <span><strong>{docTitle(doc)}</strong> {ct.notUploaded}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={() => setActiveTab('documents')} className="w-full mt-2 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border text-xs transition cursor-pointer">
                  {ct.uploadDocsBtn}
                </button>
              </div>
            </div>
            <div className="rounded-2xl border bg-slate-50 p-4">
              <CandidateYouTube videos={candidate} labels={youtubeLabels} />
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
                    <span>{docTitle(doc)}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${doc.status === 'rejected' ? 'bg-red-100 text-red-800' : DONE_STATUSES.includes(doc.status) ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {portalUi[currentLang].docStatuses[doc.status] || (DONE_STATUSES.includes(doc.status) ? ct.uploadedStatus : ct.pendingStatus)}
                    </span>
                  </div>
                  {doc.notes ? <p className="text-[11px] text-slate-600">{releaseCopy[currentLang].docFile}: {doc.notes}</p> : null}
                  {doc.review_note ? <p className="text-[11px] text-slate-800">{releaseCopy[currentLang].docReason}: {doc.review_note}</p> : null}
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocUpload(idx, e)}
                      className="block w-full text-xs text-muted-foreground file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-brand hover:file:bg-emerald-100 cursor-pointer"
                    />
                    {doc.file_url && (
                      <button 
                        onClick={async () => {
                          const url = doc.id ? await openCandidateDocument(doc.id, doc.file_url) : await signedCandidateFileUrl(doc.file_url);
                          if (url) setPreviewDoc({ name: docTitle(doc), url });
                        }}
                        className="px-3 py-1.5 bg-emerald-100 text-brand font-bold rounded-xl text-xs hover:bg-emerald-200 transition shrink-0 cursor-pointer"
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
              <p className="text-xs text-muted-foreground">{ct.noOffers}</p>
            ) : (
              jobOffers.map((offer) => {
                const offerUi = portalUi[currentLang];
                const money = offerMoney(offer, dateLocale[currentLang]);
                const statusLabel = offerStatusLabel(offer.status, offerUi.offerStatus);
                return (
                <div key={offer.id} className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm text-slate-900">
                  <div className="space-y-1 min-w-0">
                    <div className="font-extrabold text-slate-950">{localizeCatalogTitle(offer.position_title, currentLang) || '—'} — {offer.employer_name || '—'}</div>
                    <div className="text-xs font-semibold text-slate-800">
                      {offerUi.offerSalary}: {money ? `${money} ${offerUi.offerNetPerMonth}` : offerUi.salaryNotSet}
                      {offer.start_date ? ` · ${offerUi.offerStart}: ${String(offer.start_date).slice(0, 10)}` : ''}
                    </div>
                    {offer.terms_details ? (
                      <div className="text-xs text-slate-700">{offerUi.offerTerms}: {offer.terms_details}</div>
                    ) : null}
                    <div className="text-xs font-bold text-foreground">{offerUi.status}: <span className={`inline-flex rounded-lg px-2 py-0.5 ${offerStatusTone(offer.status)}`}>{statusLabel}</span></div>
                  </div>
                  {offer.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleUpdateOfferStatus(offer.id, 'accepted')} className="px-3 py-1.5 bg-brand-solid text-white rounded-xl font-bold cursor-pointer">{ct.acceptBtn}</button>
                      <button onClick={() => handleUpdateOfferStatus(offer.id, 'rejected')} className="px-3 py-1.5 bg-red-600 text-white rounded-xl font-bold cursor-pointer">{ct.rejectBtn}</button>
                    </div>
                  )}
                </div>
                );
              })
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
              <button type="submit" className="bg-brand-solid text-white px-6 py-2.5 rounded-xl font-bold cursor-pointer">{ct.sendSupportBtn}</button>
            </form>
            <SupportRequestList
              lang={currentLang}
              tickets={supportTickets}
              messages={supportMessages}
              statusCopy={releaseCopy[currentLang]}
              onFollowUp={handleFollowUp}
            />
          </div>
        )}

      </div>

      {/* Belge Önizleme Modalı */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl border space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-sm">📁 {ct.docPreviewTitle}: {previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="text-muted-foreground hover:text-slate-600 font-bold text-lg cursor-pointer">✕</button>
            </div>
            <div className="flex-1 bg-slate-100 rounded-2xl p-4 flex items-center justify-center overflow-auto">
              {previewDoc.url.startsWith('data:image') || /\.(jpe?g|png)(\?|$)/i.test(previewDoc.url) ? (
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