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
    empPortalTitle: 'İşveren Portalı',
    empPortalSub: 'Personel talepleri ve yönetimi',
    empPortalLabel: 'Firma / Yetkili E-posta',
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
    videoUrlLabel: 'Video Linki',
    expectedSalaryLabel: 'Beklenen Maaş',
    shiftSuitableLabel: 'Vardiyaya Uygunluk',
    emailLabel: 'E-posta',
    phoneLabel: 'Telefon',
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
    empPortalTitle: 'Employer Portal',
    empPortalSub: 'Personnel requests and management',
    empPortalLabel: 'Company / Authorized Email',
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
    videoUrlLabel: 'Video Link',
    expectedSalaryLabel: 'Expected Salary',
    shiftSuitableLabel: 'Shift Suitable',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
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
    empPortalTitle: 'Portali i Punëdhënësit',
    empPortalSub: 'Kërkesat dhe menaxhimi i personelit',
    empPortalLabel: 'Email i Kompanisë',
    passwordLabel: 'Fjalëkalimi',
    submitting: 'Duke dërguar...',
    signInBtn: 'Hyni',
    colSalary: 'Pagë',
    colDemandStatus: 'Statusi i Kërkesës',
    regFormTitle: 'Formulari i Regjistrimit',
    regFormSub: 'Plotësoni të dhënat tuaja',
    regSuccessTitle: 'Regjistrimi u Krye',
    regSuccessDesc: 'Aplikimi juaj u mor.',
    nameLabel: 'Emri Mbiemri',
    passportLabel: 'Nr. Pasaportës',
    sectorLabel: 'Sektori',
    professionLabel: 'Profesioni',
    certNoLabel: 'Nr. Certifikatës',
    issuingBodyLabel: 'Institucioni Lëshues',
    videoUrlLabel: 'Linku i Videos',
    expectedSalaryLabel: 'Paga e Pritur',
    shiftSuitableLabel: 'I përshtatshëm për turne',
    emailLabel: 'Email',
    phoneLabel: 'Telefon',
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
    empPortalTitle: 'بوابة أصحاب العمل',
    empPortalSub: 'طلبات وإدارة الموظفين',
    empPortalLabel: 'البريد الإلكتروني للشركة',
    passwordLabel: 'كلمة المرور',
    submitting: 'جاري الإرسال...',
    signInBtn: 'تسجيل الدخول',
    colSalary: 'الراتب',
    colDemandStatus: 'حالة الطلب',
    regFormTitle: 'استمارة تسجيل المرشح',
    regFormSub: 'املأ بياناتك بالكامل',
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
    shiftSuitableLabel: 'مناسب للعمل بنظام الورديات',
    emailLabel: 'البريد الإلكتروني',
    phoneLabel: 'الهاتف',
  },
};