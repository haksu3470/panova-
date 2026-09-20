export type Language = 'tr' | 'en' | 'sq' | 'ar';

export interface Translation {
  returnHome: string;
  candidatePortal: string;
  loginDesc: string;
  emailOrPhone: string;
  password: string;
  loginBtn: string;
  overview: string;
  profile: string;
  documents: string;
  jobs: string;
  interviews: string;
  offers: string;
  process: string;
  travel: string;
  support: string;
  logout: string;
  contactUs?: string;
  candidateRegister?: string;
  portalLogin?: string;
  tagline?: string;
  heroTitle?: string;
  completeReg?: string;
  colTargetStart?: string;
  colBenefits?: string;
  accommodation?: string;
  foodAllowance?: string;
  localTransport?: string;
  flightTicket?: string;
  empPortalTitle?: string;
  empPortalSub?: string;
  empPortalLabel?: string;
  passwordLabel?: string;
  submitting?: string;
  signInBtn?: string;
  colSalary?: string;
  colDemandStatus?: string;
  regFormTitle?: string;
  regFormSub?: string;
  regSuccessTitle?: string;
  regSuccessDesc?: string;
  nameLabel?: string;
  passportLabel?: string;
  sectorLabel?: string;
  professionLabel?: string;
  certNoLabel?: string;
  issuingBodyLabel?: string;
  videoUrlLabel?: string;
  expectedSalaryLabel?: string;
  shiftSuitableLabel?: string;
  emailLabel?: string;
  phoneLabel?: string;
  pendingStatus?: string;
  reviewingStatus?: string;
  visaProcessingStatus?: string;
  approvedStatus?: string;
  colPosSec?: string;
  colHeadcount?: string;
  newDemandBtn?: string;
  modalDemandTitle?: string;
  specifyCustomPos?: string;
  specialReqs?: string;
  creatingDossier?: string;
  submitDossierBtn?: string;
  companies?: any; // Nesne ve index yapıları için esnek tip
  employerPortal?: string;
  selectedCompany?: string;
  candidatePortalLogin?: string;
  registerTitle?: string;
  saveBtn?: string;
  colProfSector?: string;
  dossierTitle?: string;
  searchPlaceholder?: string;
  allstatuses?: string;
  colCandidate?: string;
  colPassportNat?: string;
  colVisaStatus?: string;
  portalTitle?: string;
  portalSub?: string;
  usernameLabel?: string;
  authSystem?: string;
  mgmtTitle?: string;
  submitBtn?: string;
  scopeTitle?: string;
  logoutBtn?: string;
  totalDemands?: string;
  requestedHeadcount?: string;
  activeProcesses?: string;
}

export const languages = [
  { code: 'tr' as Language, name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en' as Language, name: 'English', flag: '🇬🇧' },
  { code: 'sq' as Language, name: 'Shqip', flag: '🇦🇱' },
  { code: 'ar' as Language, name: 'العربية', flag: '🇸🇦' },
];

export const translations: Record<Language, Translation> = {
  tr: {
    returnHome: 'Ana Sayfaya Dön',
    candidatePortal: 'Aday Giriş Portalı',
    loginDesc: 'E-posta, Telefon (GSM) veya Pasaport numaranız ve şifreniz ile giriş yapın.',
    emailOrPhone: 'E-Posta / Telefon / Pasaport No *',
    password: 'Şifre *',
    loginBtn: 'Sisteme Giriş Yap',
    overview: 'Ana Sayfa',
    profile: 'Profilim',
    documents: 'Belgelerim',
    jobs: 'İş Fırsatlarım',
    interviews: 'Görüşmelerim',
    offers: 'İş Tekliflerim',
    process: 'İşlem Durumu',
    travel: 'Seyahat Bilgilerim',
    support: 'Destek',
    logout: 'Çıkış Yap',
    contactUs: 'İletişim',
    candidateRegister: 'Aday Kayıt',
    portalLogin: 'Portal Giriş',
    tagline: 'Uluslararası İstihdam ve Vize Yönetimi',
    heroTitle: 'Profesyonel İş Gücü Çözümleri',
    completeReg: 'Kayıt Ol',
    colTargetStart: 'Hedef Başlangıç',
    colBenefits: 'Yan Haklar',
    accommodation: 'Konaklama',
    foodAllowance: 'Yemek',
    localTransport: 'Ulaşım',
    flightTicket: 'Uçak Bileti',
    empPortalTitle: 'İşveren Portalı',
    empPortalSub: 'İş gücü taleplerinizi yönetin',
    empPortalLabel: 'İşveren E-Posta',
    passwordLabel: 'Şifre',
    submitting: 'Gönderiliyor...',
    signInBtn: 'Giriş Yap',
    colSalary: 'Maaş',
    colDemandStatus: 'Talep Durumu',
    regFormTitle: 'Aday Kayıt Formu',
    regFormSub: 'Bilgilerinizi eksiksiz doldurun',
    regSuccessTitle: 'Kayıt Başarılı',
    regSuccessDesc: 'Başvurunuz alınmıştır.',
    nameLabel: 'Ad Soyad',
    passportLabel: 'Pasaport No',
    sectorLabel: 'Sektör',
    professionLabel: 'Meslek',
    certNoLabel: 'Sertifika No',
    issuingBodyLabel: 'Veren Kurum',
    videoUrlLabel: 'Video URL',
    expectedSalaryLabel: 'Beklenen Maaş',
    shiftSuitableLabel: 'Vardiyalı Çalışmaya Uygunluk',
    emailLabel: 'E-Posta',
    phoneLabel: 'Telefon',
    pendingStatus: 'Beklemede',
    reviewingStatus: 'İnceleniyor',
    visaProcessingStatus: 'Vize İşlemde',
    approvedStatus: 'Onaylandı',
    colPosSec: 'Pozisyon / Sektör',
    colHeadcount: 'Kişi Sayısı',
    newDemandBtn: 'Yeni Talep Oluştur',
    modalDemandTitle: 'Talep Detayları',
    specifyCustomPos: 'Özel Pozisyon Belirtin',
    specialReqs: 'Özel Şartlar',
    creatingDossier: 'Dosya Oluşturuluyor...',
    submitDossierBtn: 'Talebi Gönder',
    employerPortal: 'İşveren Girişi',
    selectedCompany: 'Seçilen Firma',
    candidatePortalLogin: 'Aday Girişi',
    registerTitle: 'Kayıt Ol',
    saveBtn: 'Kaydet',
    colProfSector: 'Meslek / Sektör',
    dossierTitle: 'Dosya Yönetimi',
    searchPlaceholder: 'Arama yapın...',
    allstatuses: 'Tüm Durumlar',
    colCandidate: 'Aday',
    colPassportNat: 'Pasaport / Uyruk',
    colVisaStatus: 'Vize Durumu',
    portalTitle: 'Yönetim Portalı',
    portalSub: 'Sistem operasyonlarını yönetin',
    usernameLabel: 'Kullanıcı Adı',
    authSystem: 'Yetkilendirme Sistemi',
    mgmtTitle: 'Yönetim Paneli',
    submitBtn: 'Gönder',
    scopeTitle: 'Faaliyet Alanı',
    logoutBtn: 'Çıkış Yap',
    totalDemands: 'Toplam Talep',
    requestedHeadcount: 'Talep Edilen Kişi',
    activeProcesses: 'Aktif Süreçler',
    companies: {
      hr: { name: 'Panova HR', tagline: 'İnsan Kaynakları ve İstihdam' },
      trade: { name: 'Panova Trade', tagline: 'Dış Ticaret ve Lojistik' },
      agriculture: { name: 'Panova Tarım', tagline: 'Tarımsal Üretim ve Bahçe' },
      construction: { name: 'Panova Construction', tagline: 'İnşaat ve Yapı' }
    }
  },
  en: {
    returnHome: 'Return to Home',
    candidatePortal: 'Candidate Login Portal',
    loginDesc: 'Sign in with your email, phone, or passport number and password.',
    emailOrPhone: 'Email / Phone / Passport *',
    password: 'Password *',
    loginBtn: 'Sign In',
    overview: 'Overview',
    profile: 'Profile',
    documents: 'Documents',
    jobs: 'Job Opportunities',
    interviews: 'Interviews',
    offers: 'Job Offers',
    process: 'Process Status',
    travel: 'Travel Info',
    support: 'Support',
    logout: 'Logout',
    contactUs: 'Contact Us',
    candidateRegister: 'Candidate Register',
    portalLogin: 'Portal Login',
    tagline: 'International Employment & Visa Management',
    heroTitle: 'Professional Workforce Solutions',
    completeReg: 'Register',
    colTargetStart: 'Target Start',
    colBenefits: 'Benefits',
    accommodation: 'Accommodation',
    foodAllowance: 'Food',
    localTransport: 'Transport',
    flightTicket: 'Flight Ticket',
    empPortalTitle: 'Employer Portal',
    empPortalSub: 'Manage your workforce demands',
    empPortalLabel: 'Employer Email',
    passwordLabel: 'Password',
    submitting: 'Submitting...',
    signInBtn: 'Sign In',
    colSalary: 'Salary',
    colDemandStatus: 'Demand Status',
    regFormTitle: 'Candidate Registration Form',
    regFormSub: 'Fill in your details completely',
    regSuccessTitle: 'Registration Successful',
    regSuccessDesc: 'Your application has been received.',
    nameLabel: 'Full Name',
    passportLabel: 'Passport No',
    sectorLabel: 'Sector',
    professionLabel: 'Profession',
    certNoLabel: 'Certificate No',
    issuingBodyLabel: 'Issuing Body',
    videoUrlLabel: 'Video URL',
    expectedSalaryLabel: 'Expected Salary',
    shiftSuitableLabel: 'Shift Suitable',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    pendingStatus: 'Pending',
    reviewingStatus: 'Reviewing',
    visaProcessingStatus: 'Visa Processing',
    approvedStatus: 'Approved',
    colPosSec: 'Position / Sector',
    colHeadcount: 'Headcount',
    newDemandBtn: 'Create New Demand',
    modalDemandTitle: 'Demand Details',
    specifyCustomPos: 'Specify Custom Position',
    specialReqs: 'Special Requirements',
    creatingDossier: 'Creating Dossier...',
    submitDossierBtn: 'Submit Demand',
    employerPortal: 'Employer Portal',
    selectedCompany: 'Selected Company',
    candidatePortalLogin: 'Candidate Login',
    registerTitle: 'Register',
    saveBtn: 'Save',
    colProfSector: 'Profession / Sector',
    dossierTitle: 'Dossier Management',
    searchPlaceholder: 'Search...',
    allstatuses: 'All Statuses',
    colCandidate: 'Candidate',
    colPassportNat: 'Passport / Nationality',
    colVisaStatus: 'Visa Status',
    portalTitle: 'Management Portal',
    portalSub: 'Manage system operations',
    usernameLabel: 'Username',
    authSystem: 'Authorization System',
    mgmtTitle: 'Management Panel',
    submitBtn: 'Submit',
    scopeTitle: 'Scope of Activity',
    logoutBtn: 'Logout',
    totalDemands: 'Total Demands',
    requestedHeadcount: 'Requested Headcount',
    activeProcesses: 'Active Processes',
    companies: {
      hr: { name: 'Panova HR', tagline: 'Human Resources & Employment' },
      trade: { name: 'Panova Trade', tagline: 'Foreign Trade & Logistics' },
      agriculture: { name: 'Panova Agriculture', tagline: 'Agricultural Production' },
      construction: { name: 'Panova Construction', tagline: 'Construction & Building' }
    }
  },
  sq: {
    returnHome: 'Kthehu në Faqen Kryesore',
    candidatePortal: 'Portali i Hyrjes për Kandidatët',
    loginDesc: 'Hyni me email, telefon ose numër pasaporte dhe fjalëkalim.',
    emailOrPhone: 'Email / Telefon / Pasaportë *',
    password: 'Fjalëkalimi *',
    loginBtn: 'Hyni në Sistem',
    overview: 'Përmbledhje',
    profile: 'Profili',
    documents: 'Dokumentet',
    jobs: 'Mundësitë e Punës',
    interviews: 'Intervistat',
    offers: 'Ofertat e Punës',
    process: 'Statusi i Proçesit',
    travel: 'Informacioni i Udhëtimit',
    support: 'Mbështetje',
    logout: 'Dilni',
    contactUs: 'Na Kontaktoni',
    candidateRegister: 'Regjistrimi i Kandidatëve',
    portalLogin: 'Hyrja në Portal',
    tagline: 'Punësim Ndërkombëtar dhe Menaxhim Vizash',
    heroTitle: 'Zgjidhje Profesionale të Fuqisë Punëtore',
    completeReg: 'Regjistrohuni',
    colTargetStart: 'Fillimi i Synuar',
    colBenefits: 'Përfitimet',
    accommodation: 'Akomodimi',
    foodAllowance: 'Ushqimi',
    localTransport: 'Transporti',
    flightTicket: 'Bileta e Avionit',
    empPortalTitle: 'Portali i Punëdhënësve',
    empPortalSub: 'Menaxhoni kërkesat tuaja për fuqi punëtore',
    empPortalLabel: 'Email i Punëdhënësit',
    passwordLabel: 'Fjalëkalimi',
    submitting: 'Duke dërguar...',
    signInBtn: 'Hyni',
    colSalary: 'Paga',
    colDemandStatus: 'Statusi i Kërkesës',
    regFormTitle: 'Formulari i Regjistrimit',
    regFormSub: 'Plotësoni të dhënat tuaja',
    regSuccessTitle: 'Regjistrimi u Krye',
    regSuccessDesc: 'Aplikimi juaj u pranua.',
    nameLabel: 'Emri Mbiemri',
    passportLabel: 'Nr. Pasaportës',
    sectorLabel: 'Sektori',
    professionLabel: 'Profesioni',
    certNoLabel: 'Nr. Certifikatës',
    issuingBodyLabel: 'Institucioni Lëshues',
    videoUrlLabel: 'URL e Videos',
    expectedSalaryLabel: 'Paga e Pritur',
    shiftSuitableLabel: 'I përshtatshëm për turne',
    emailLabel: 'Email',
    phoneLabel: 'Telefon',
    pendingStatus: 'Në pritje',
    reviewingStatus: 'Duke u shqyrtuar',
    visaProcessingStatus: 'Viza në proces',
    approvedStatus: 'Miratuar',
    colPosSec: 'Pozicioni / Sektori',
    colHeadcount: 'Numri i Personave',
    newDemandBtn: 'Krijo Kërkesë të Re',
    modalDemandTitle: 'Detajet e Kërkesës',
    specifyCustomPos: 'Specifiko Pozicionin',
    specialReqs: 'Kërkesa Speciale',
    creatingDossier: 'Duke krijuar dosjen...',
    submitDossierBtn: 'Dërgo Kërkesën',
    employerPortal: 'Hyrja e Punëdhënësit',
    selectedCompany: 'Kompania e Zgjedhur',
    candidatePortalLogin: 'Hyrja e Kandidatit',
    registerTitle: 'Regjistrohuni',
    saveBtn: 'Ruaj',
    colProfSector: 'Profesioni / Sektori',
    dossierTitle: 'Menaxhimi i Dosjeve',
    searchPlaceholder: 'Kërko...',
    allstatuses: 'Të gjitha statuset',
    colCandidate: 'Kandidati',
    colPassportNat: 'Pasaporta / Kombësia',
    colVisaStatus: 'Statusi i Vizës',
    portalTitle: 'Portali i Menaxhimit',
    portalSub: 'Menaxhoni operacionet e sistemit',
    usernameLabel: 'Emri i Përdoruesit',
    authSystem: 'Sistemi i Autorizimit',
    mgmtTitle: 'Paneli i Menaxhimit',
    submitBtn: 'Dërgo',
    scopeTitle: 'Fusha e Veprimtarisë',
    logoutBtn: 'Dilni',
    totalDemands: 'Kërkesat Totale',
    requestedHeadcount: 'Personeli i Kërkuar',
    activeProcesses: 'Proceset Aktive',
    companies: {
      hr: { name: 'Panova HR', tagline: 'Burimet Njerëzore dhe Punësimi' },
      trade: { name: 'Panova Trade', tagline: 'Tregti e Jashtme dhe Logjistikë' },
      agriculture: { name: 'Panova Bujqësi', tagline: 'Prodhimi Bujqësor' },
      construction: { name: 'Panova Ndërtim', tagline: 'Ndërtim dhe Objekte' }
    }
  },
  ar: {
    returnHome: 'العودة إلى الرئيسية',
    candidatePortal: 'بوابة تسجيل دخول المرشحين',
    loginDesc: 'قم بتسجيل الدخول بريدك الإلكتروني أو هاتفك أو رقم جواز السفر.',
    emailOrPhone: 'البريد الإلكتروني / الهاتف / جواز السفر *',
    password: 'كلمة المرور *',
    loginBtn: 'تسجيل الدخول',
    overview: 'نظرة عامة',
    profile: 'الملف الشخصي',
    documents: 'المستندات',
    jobs: 'فرص العمل',
    interviews: 'المقابلات',
    offers: 'عروض العمل',
    process: 'حالة العملية',
    travel: 'معلومات السفر',
    support: 'الدعم',
    logout: 'تسجيل الخروج',
    contactUs: 'اتصل بنا',
    candidateRegister: 'تسجيل المرشحين',
    portalLogin: 'تسجيل الدخول للبوابة',
    tagline: 'التوظيف الدولي وإدارة التأشيرات',
    heroTitle: 'حلول القوى العاملة المهنية',
    completeReg: 'التسجيل',
    colTargetStart: 'بداية المستهدف',
    colBenefits: 'المزايا',
    accommodation: 'الإقامة',
    foodAllowance: 'بدل الطعام',
    localTransport: 'المواصلات المحلية',
    flightTicket: 'تذكرة الطيران',
    empPortalTitle: 'بوابة أصحاب العمل',
    empPortalSub: 'إدارة طلبات القوى العاملة الخاصة بك',
    empPortalLabel: 'بريد صاحب العمل',
    passwordLabel: 'كلمة المرور',
    submitting: 'جاري الإرسال...',
    signInBtn: 'تسجيل الدخول',
    colSalary: 'الراتب',
    colDemandStatus: 'حالة الطلب',
    regFormTitle: 'استمارة تسجيل المرشح',
    regFormSub: 'املأ تفاصيلك بالكامل',
    regSuccessTitle: 'تم التسجيل بنجاح',
    regSuccessDesc: 'تم استلام طلبك.',
    nameLabel: 'الاسم الكامل',
    passportLabel: 'رقم جواز السفر',
    sectorLabel: 'القطاع',
    professionLabel: 'المهنة',
    certNoLabel: 'رقم الشهادة',
    issuingBodyLabel: 'جهة الإصدار',
    videoUrlLabel: 'رابط الفيديو',
    expectedSalaryLabel: 'الراتب المتوقع',
    shiftSuitableLabel: 'مناسب للعمل بنظام النوبات',
    emailLabel: 'البريد الإلكتروني',
    phoneLabel: 'الهاتف',
    pendingStatus: 'قيد الانتظار',
    reviewingStatus: 'قيد المراجعة',
    visaProcessingStatus: 'جاري استخراج التأشيرة',
    approvedStatus: 'تم الموافقة',
    colPosSec: 'المنصب / القطاع',
    colHeadcount: 'عدد الأفراد',
    newDemandBtn: 'إنشاء طلب جديد',
    modalDemandTitle: 'تفاصيل الطلب',
    specifyCustomPos: 'حدد منصب مخصص',
    specialReqs: 'متطلبات خاصة',
    creatingDossier: 'جاري إنشاء الملف...',
    submitDossierBtn: 'إرسال الطلب',
    employerPortal: 'بوابة أصحاب العمل',
    selectedCompany: 'الشركة المختارة',
    candidatePortalLogin: 'تسجيل دخول المرشح',
    registerTitle: 'التسجيل',
    saveBtn: 'حفظ',
    colProfSector: 'المهنة / القطاع',
    dossierTitle: 'إدارة الملفات',
    searchPlaceholder: 'بحث...',
    allstatuses: 'جميع الحالات',
    colCandidate: 'المرشح',
    colPassportNat: 'جواز السفر / الجنسية',
    colVisaStatus: 'حالة التأشيرة',
    portalTitle: 'بوابة الإدارة',
    portalSub: 'إدارة عمليات النظام',
    usernameLabel: 'اسم المستخدم',
    authSystem: 'نظام المصادقة',
    mgmtTitle: 'لوحة الإدارة',
    submitBtn: 'إرسال',
    scopeTitle: 'نطاق النشاط',
    logoutBtn: 'تسجيل الخروج',
    totalDemands: 'إجمالي الطلبات',
    requestedHeadcount: 'الأفراد المطلوبين',
    activeProcesses: 'العمليات النشطة',
    companies: {
      hr: { name: 'Panova HR', tagline: 'الموارد البشرية والتوظيف' },
      trade: { name: 'Panova Trade', tagline: 'التجارة الخارجية والخدمات اللوجستية' },
      agriculture: { name: 'Panova Agriculture', tagline: 'الإنتاج الزراعي' },
      construction: { name: 'Panova Construction', tagline: 'البناء والتشييد' }
    }
  },
};