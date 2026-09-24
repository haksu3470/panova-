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
  phone?: string;
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
  companies?: any;
  employerPortal?: string;
  selectedCompany?: string;
  candidatePortalLogin?: string;
  candidatePortalBtn?: string;
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
  formTitle?: string;
  successTitle?: string;
  successDesc?: string;
  notesLabel?: string;
  certAndVideo: string;
  salaryAndShift: string;
  trackingPeriod: string;
  noCertificate: string;
  watchVideo: string;
  monthText: string;
  shiftSuitableText: string;
  standardShiftText: string;
  employerCompany: string;
  createdDate: string;
  personCount: string;
  overviewTab: string;
  candidatesTab: string;
  requestsTab: string;
  employersTab: string;
  matchingTab: string;
  travelTab: string;
  employeesTab: string;
  supportTab: string;
  totalCandidatesCard: string;
  activeEmployersCard: string;
  openRequestsCard: string;
  openSupportCard: string;
  portalSummaryTitle: string;
  portalSummaryDesc: string;
  staffTab: string;
  tasksTab: string;
  auditTab: string;
  addStaffTitle: string;
  staffNameLabel: string;
  staffEmailLabel: string;
  staffRoleLabel: string;
  staffPermLabel: string;
  saveStaffBtn: string;
  staffMatrixTitle: string;
  staffMatrixSub: string;
  permLevelText: string;
  newTaskTitleHeader: string;
  taskDescLabel: string;
  taskAssigneeLabel: string;
  taskBackupAssigneeLabel: string;
  taskDueDateLabel: string;
  saveTaskBtn: string;
  taskListHeader: string;
  statusPending: string;
  statusCompleted: string;
  auditLogTitle: string;
  auditLogSub: string;
  colAction: string;
  colPerformer: string;
  colTime: string;
  delayAlertsTitle: string;
  delayAlertsDesc: string;
  roleUpperManagement: string;
  roleSourceCountry: string;
  roleTargetCountry: string;
  roleFieldOfficer: string;
  applicationStatusAndSummary: string;
  currentProcessStage: string;
  assigneeText: string;
  backupText: string;
  dueDateText: string;
  noEmployers: string;
  noSupport: string;
  initialAuditLog: string;
  dateFormatPlaceholder: string;
  message: string;

  // Employer Portal Yeni Anahtarlar
  empTabRequests?: string;
  empTabCandidates?: string;
  empTabSelected?: string;
  empTabTravel?: string;
  empTabSupport?: string;
  empTabProfile?: string;
  empNoRequests?: string;
  empCandidatesPoolTitle?: string;
  empNoCandidates?: string;
  empInterviewRequestBtn?: string;
  empShortlistBtn?: string;
  empInterviewsTitle?: string;
  empNoInterviews?: string;
  empSelectedTitle?: string;
  empNoSelected?: string;
  empTravelTitle?: string;
  empNoTravel?: string;
  empEmployeesTitle?: string;
  empNoEmployees?: string;
  empSupportFormTitle?: string;
  empSupportSubjectLabel?: string;
  empSupportMessageLabel?: string;
  empSupportSubmitBtn?: string;
  empSupportHistoryTitle?: string;
  empNoSupportTickets?: string;
  empProfileTitle?: string;
  empProfileCompanyName?: string;
  empProfileContactPerson?: string;

  selectTaskPrompt?: string;
  taskGroupSource?: string;
  taskGroupTarget?: string;
  taskGroupField?: string;
  taskGroupManagement?: string;
  taskPassportCheck?: string;
  taskInterviewPlan?: string;
  taskUpdateCandidate?: string;
  taskRequestDocs?: string;
  taskSaveDemand?: string;
  taskMatchCandidate?: string;
  taskPrepareOffer?: string;
  taskTrackPerformance?: string;
  taskEnterTravelDate?: string;
  taskPlanAccommodation?: string;
  taskManageSupport?: string;
  taskUpdateFieldStatus?: string;
  taskAuditSystem?: string;
  taskApproveStrategic?: string;

  reportsTab?: string;
  analyticsTab?: string;
  financialsTab?: string;
  exportPdfBtn?: string;
  exportExcelBtn?: string;
  filterBtn?: string;
  clearFiltersBtn?: string;
  statusActive?: string;
  statusInactive?: string;
  statusCancelled?: string;
  actionsLabel?: string;
  detailsLabel?: string;
  editLabel?: string;
  deleteLabel?: string;
  confirmDeleteTitle?: string;
  confirmDeleteDesc?: string;
  yesBtn?: string;
  noBtn?: string;

  // Personel Talebi Yaşam Döngüsü ve Dosya Anahtarları
  demandFilesTitle?: string;
  demandFilesSub?: string;
  openDemandFilesBtn?: string;
  lifecycleStatusLabel?: string;
  stageNewRequest?: string;
  stageReviewing?: string;
  stageSearchingCandidates?: string;
  stagePresentingCandidates?: string;
  stageInterviews?: string;
  stageSelectionCompleted?: string;
  stageOfficialProcess?: string;
  stageTravelPlanning?: string;
  stageCompleted?: string;
  stageCancelled?: string;
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
    phone: 'Telefon',
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
    candidatePortalBtn: 'Aday Portalı & Giriş',
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
      agriculture: { name: 'Panova Tarım ve Hayvancılık', tagline: 'Tarımsal Üretim ve Bahçe' },
      construction: { name: 'Panova Construction', tagline: 'İnşaat ve Yapı' }
    },
    certAndVideo: 'Sertifika & Video',
    salaryAndShift: 'Ücret & Vardiya',
    trackingPeriod: '30-60-90 Gün Takip',
    noCertificate: 'Sertifika Yok',
    watchVideo: 'Videoyu İzle',
    monthText: 'ay',
    shiftSuitableText: 'Vardiyaya Uygun',
    standardShiftText: 'Standart Vardiya',
    employerCompany: 'İşveren Şirket',
    createdDate: 'Tarih',
    personCount: 'Kişi',
    overviewTab: 'Genel Durum',
    candidatesTab: 'Aday Havuzu',
    requestsTab: 'Personel Talepleri',
    employersTab: 'İşverenler',
    matchingTab: 'Eşleştirmeler',
    travelTab: 'Seyahatler & Vize',
    employeesTab: 'Aktif Çalışanlar (30/60/90)',
    supportTab: 'Sorunlar / Bildirimler',
    totalCandidatesCard: 'TOPLAM ADAY',
    activeEmployersCard: 'AKTİF İŞVERENLER',
    openRequestsCard: 'AÇIK TALEPLER',
    openSupportCard: 'AÇIK SORUNLAR / DESTEK',
    portalSummaryTitle: 'PANOVA Operasyon Özeti',
    portalSummaryDesc: 'Sistem üzerinden aday başvurularını yönetebilir, işverenlerin personel taleplerine aday eşleştirmesi yapabilir, vize ve seyahat süreçlerini takip edebilirsiniz.',
    staffTab: 'Ekip & Yetkiler',
    tasksTab: 'Görevler',
    auditTab: 'İşlem Geçmişi (Audit)',
    addStaffTitle: 'Yeni Ekip Üyesi ve Rol Ata',
    staffNameLabel: 'Ad Soyad *',
    staffEmailLabel: 'E-Posta (Giriş için) *',
    staffRoleLabel: 'Rol Açıklaması',
    staffPermLabel: 'Rol / Yetki Seviyesi *',
    saveStaffBtn: 'Ekip Üyesini Kaydet',
    staffMatrixTitle: 'PANOVA Operasyon Kadrosu ve Rol Matrisi',
    staffMatrixSub: 'Üst Yönetim, Kaynak Ülke, Hedef Ülke ve Saha Sorumlusu rolleri',
    permLevelText: 'Rol Seviyesi:',
    newTaskTitleHeader: 'Yeni Görev ve Sorumlu Ata',
    taskDescLabel: 'Görev Açıklaması *',
    taskAssigneeLabel: 'Ana Sorumlu',
    taskBackupAssigneeLabel: 'Yedek Sorumlu',
    taskDueDateLabel: 'Son Tarih',
    saveTaskBtn: 'Görevi Kaydet',
    taskListHeader: 'Ekip Görevleri ve Sorumluluk Takibi',
    statusPending: 'Bekliyor',
    statusCompleted: 'Tamamlandı',
    auditLogTitle: 'Sistem İşlem Geçmişi (Audit Log)',
    auditLogSub: 'Sistemde yapılan kritik işlemler, durum değişiklikleri ve sorumlu atamaları',
    colAction: 'İşlem / Eylem',
    colPerformer: 'İşlemi Yapan',
    colTime: 'Zaman Damgası',
    delayAlertsTitle: '⚠️ Gecikme ve Süre Uyarıları',
    delayAlertsDesc: 'Vize süreci 15 günü aşan veya belgesi eksik olan dosyalar için otomatik sistem uyarıları aktif.',
    roleUpperManagement: 'Üst Yönetim',
    roleSourceCountry: 'Kaynak Ülke Sorumlusu',
    roleTargetCountry: 'Hedef Ülke Sorumlusu',
    roleFieldOfficer: 'Saha Sorumlusu',
    applicationStatusAndSummary: 'Başvuru Durumu ve Özet',
    currentProcessStage: 'GÜNCEL SÜREÇ AŞAMASI',
    assigneeText: 'Sorumlu',
    backupText: 'Yedek',
    dueDateText: 'Son Tarih',
    noEmployers: 'Kayıtlı işveren bulunmuyor.',
    noSupport: 'Aktif sorun bildirimi bulunmuyor.',
    initialAuditLog: 'Sistem Başlatıldı & Rol Matrisi Kuruldu',
    dateFormatPlaceholder: 'gg.aa.yyyy',
    message: 'Mesaj',

    empTabRequests: 'Personel Taleplerim',
    empTabCandidates: 'Adaylar / Eşleşmeler',
    empTabSelected: 'Seçtiğim Adaylar',
    empTabTravel: 'Seyahat ve Başlangıç',
    empTabSupport: 'Destek / Bildirim',
    empTabProfile: 'Şirket Bilgilerim',
    empNoRequests: 'Kayıtlı personel talebiniz bulunmuyor.',
    empCandidatesPoolTitle: 'Taleplerinize Sunulan Aday Havuzu',
    empNoCandidates: 'Henüz eşleşen aday bulunmuyor.',
    empInterviewRequestBtn: 'Görüşme İste',
    empShortlistBtn: 'Kısa Listeye Al',
    empInterviewsTitle: 'Planlanan ve Tamamlanan Görüşmeler',
    empNoInterviews: 'Planlanmış aktif mülakat randevunuz bulunmamaktadır.',
    empSelectedTitle: 'Onayladığınız ve İşlemde Olan Adaylar',
    empNoSelected: 'Henüz onayladığınız bir aday bulunmuyor.',
    empTravelTitle: 'Uçuş, Varış ve Karşılama Bilgileri',
    empNoTravel: 'Vize ve biletleme işlemleri tamamlanan personellerin seyahat detayları burada listelenecektir.',
    empEmployeesTitle: 'İşe Başlayan Personel ve 30/60/90 Gün Takibi',
    empNoEmployees: 'Şirketinizde aktif çalışan personel bulunmuyor.',
    empSupportFormTitle: 'Operasyonel Destek Talebi Aç',
    empSupportSubjectLabel: 'Konu / Başlık',
    empSupportMessageLabel: 'Mesajınız',
    empSupportSubmitBtn: 'Destek Talebi Gönder',
    empSupportHistoryTitle: 'Destek Geçmişim',
    empNoSupportTickets: 'Aktif destek kaydınız yok.',
    empProfileTitle: 'Firma ve İletişim Bilgilerim',
    empProfileCompanyName: 'Şirket Unvanı',
    empProfileContactPerson: 'Yetkili Kişi',

    selectTaskPrompt: 'Görev Seçin...',
    taskGroupSource: '🌍 Kaynak Ülke Sorumlusu',
    taskGroupTarget: '🏢 Hedef Ülke Sorumlusu',
    taskGroupField: '✈️ Saha Sorumlusu',
    taskGroupManagement: '👑 Üst Yönetim',
    taskPassportCheck: 'Pasaportu Kontrol Et',
    taskInterviewPlan: 'Aday Ön Görüşmesi Planla',
    taskUpdateCandidate: 'Aday Bilgilerini Güncelle',
    taskRequestDocs: 'Eksik Evrak Talep Et',
    taskSaveDemand: 'İşveren Talebini Kaydet',
    taskMatchCandidate: 'Aday Eşleştirme Yap',
    taskPrepareOffer: 'İş Teklifi Hazırla (Job Offer)',
    taskTrackPerformance: 'Performans ve Uyum Takibi Yap',
    taskEnterTravelDate: 'Seyahat Tarihini Gir',
    taskPlanAccommodation: 'Konaklama ve Karşılama Planla',
    taskManageSupport: 'Destek Taleplerini Yönet',
    taskUpdateFieldStatus: 'Saha Görev Durumunu Güncelle',
    taskAuditSystem: 'Sistem i Logları Denetle',
    taskApproveStrategic: 'Mali ve Stratejik Kararları Onayla',

    reportsTab: 'Raporlar',
    analyticsTab: 'Analizler',
    financialsTab: 'Mali İşler',
    exportPdfBtn: 'PDF İndir',
    exportExcelBtn: 'Excel İndir',
    filterBtn: 'Filtrele',
    clearFiltersBtn: 'Filtreleri Temizle',
    statusActive: 'Aktif',
    statusInactive: 'Pasif',
    statusCancelled: 'İptal Edildi',
    actionsLabel: 'İşlemler',
    detailsLabel: 'Detaylar',
    editLabel: 'Düzenle',
    deleteLabel: 'Sil',
    confirmDeleteTitle: 'Silme İşlemini Onayla',
    confirmDeleteDesc: 'Bu kaydı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
    yesBtn: 'Evet',
    noBtn: 'Hayır',

    demandFilesTitle: 'Personel Talebi Dosyaları',
    demandFilesSub: 'Her talebin operasyon, çalışma şartları, aday ölçütleri ve seyahat yaşam döngüsü.',
    openDemandFilesBtn: 'Talep Dosyasını Aç (Tüm Detaylar)',
    lifecycleStatusLabel: 'TALEP YAŞAM DÖNGÜSÜ DURUMU (5.1)',
    stageNewRequest: 'Yeni talep (Henüz inceleme başlamadı)',
    stageReviewing: 'İnceleniyor (Şartlar kontrol ediliyor)',
    stageSearchingCandidates: 'Aday aranıyor (Kaynak ülkede çalışma)',
    stagePresentingCandidates: 'Adaylar sunuluyor (İşverene gönderiliyor)',
    stageInterviews: 'Görüşmeler (İşveren görüşmeleri sürüyor)',
    stageSelectionCompleted: 'Seçim tamamlandı (Gerekli aday seçildi)',
    stageOfficialProcess: 'Belge / resmî süreç (İşlemler devam ediyor)',
    stageTravelPlanning: 'Seyahat planlama (Varış ve başlangıç)',
    stageCompleted: 'Tamamlandı (Talep kapanmıştır)',
    stageCancelled: 'İptal edildi (Gerekçe kayıtlı)',
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
    phone: 'Phone',
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
    candidatePortalBtn: 'Candidate Portal & Sign In',
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
      agriculture: { name: 'Panova Agriculture & Livestock', tagline: 'Agricultural Production' },
      construction: { name: 'Panova Construction', tagline: 'Construction & Building' }
    },
    certAndVideo: 'Certificate & Video',
    salaryAndShift: 'Salary & Shift',
    trackingPeriod: '30-60-90 Tracking',
    noCertificate: 'No Cert',
    watchVideo: 'Watch Video',
    monthText: 'mo',
    shiftSuitableText: 'Shift Suitable',
    standardShiftText: 'Standard Shift',
    employerCompany: 'Employer Company',
    createdDate: 'Created',
    personCount: 'Person(s)',
    overviewTab: 'Overview',
    candidatesTab: 'Candidate Pool',
    requestsTab: 'Personnel Requests',
    employersTab: 'Employers',
    matchingTab: 'Matching',
    travelTab: 'Travel & Visa',
    employeesTab: 'Active Employees (30/60/90)',
    supportTab: 'Issues / Support',
    totalCandidatesCard: 'TOTAL CANDIDATES',
    activeEmployersCard: 'ACTIVE EMPLOYERS',
    openRequestsCard: 'OPEN REQUESTS',
    openSupportCard: 'OPEN ISSUES / SUPPORT',
    portalSummaryTitle: 'PANOVA Operations Summary',
    portalSummaryDesc: 'You can manage candidate applications through the system, match candidates to employer workforce requests, and track visa and travel processes.',
    staffTab: 'Staff & Roles',
    tasksTab: 'Tasks',
    auditTab: 'Audit Log',
    addStaffTitle: 'Assign New Staff & Role',
    staffNameLabel: 'Full Name *',
    staffEmailLabel: 'Email (For Login) *',
    staffRoleLabel: 'Role Description',
    staffPermLabel: 'Role / Permission Level *',
    saveStaffBtn: 'Save Staff Member',
    staffMatrixTitle: 'PANOVA Operations Staff & Role Matrix',
    staffMatrixSub: 'Upper Management, Source Country, Target Country and Field Officer roles',
    permLevelText: 'Role Level:',
    newTaskTitleHeader: 'Assign New Task & Assignee',
    taskDescLabel: 'Task Description *',
    taskAssigneeLabel: 'Main Assignee',
    taskBackupAssigneeLabel: 'Backup Assignee',
    taskDueDateLabel: 'Due Date',
    saveTaskBtn: 'Save Task',
    taskListHeader: 'Team Tasks & Responsibility Tracking',
    statusPending: 'Pending',
    statusCompleted: 'Completed',
    auditLogTitle: 'System Audit Log',
    auditLogSub: 'Critical actions, status changes, and staff assignments in the system',
    colAction: 'Action / Event',
    colPerformer: 'Performed By',
    colTime: 'Timestamp',
    delayAlertsTitle: '⚠️ Delay & Deadline Alerts',
    delayAlertsDesc: 'Automatic system alerts are active for files whose visa process exceeds 15 days or has missing documents.',
    roleUpperManagement: 'Upper Management',
    roleSourceCountry: 'Source Country Officer',
    roleTargetCountry: 'Target Country Officer',
    roleFieldOfficer: 'Field Officer',
    applicationStatusAndSummary: 'Application Status and Summary',
    currentProcessStage: 'CURRENT PROCESS STAGE',
    assigneeText: 'Assignee',
    backupText: 'Backup',
    dueDateText: 'Due Date',
    noEmployers: 'No registered employers found.',
    noSupport: 'No active support tickets found.',
    initialAuditLog: 'System Initialized & Role Matrix Established',
    dateFormatPlaceholder: 'dd.mm.yyyy',
    message: 'Message',

    empTabRequests: 'Personnel Requests',
    empTabCandidates: 'Candidates / Matching',
    empTabSelected: 'Selected Candidates',
    empTabTravel: 'Travel & Start',
    empTabSupport: 'Support / Notices',
    empTabProfile: 'Company Info',
    empNoRequests: 'No active workforce requests found.',
    empCandidatesPoolTitle: 'Candidate Pool Offered for Your Demands',
    empNoCandidates: 'No matching candidates found yet.',
    empInterviewRequestBtn: 'Request Interview',
    empShortlistBtn: 'Shortlist',
    empInterviewsTitle: 'Scheduled and Completed Interviews',
    empNoInterviews: 'No active interview appointments scheduled.',
    empSelectedTitle: 'Approved and Processing Candidates',
    empNoSelected: 'No approved candidates yet.',
    empTravelTitle: 'Flight, Arrival and Pickup Info',
    empNoTravel: 'Travel details of personnel whose visa and ticketing are completed will be listed here.',
    empEmployeesTitle: 'Hired Personnel & 30/60/90 Day Tracking',
    empNoEmployees: 'No active employees in your company.',
    empSupportFormTitle: 'Open Operational Support Ticket',
    empSupportSubjectLabel: 'Subject / Title',
    empSupportMessageLabel: 'Your Message',
    empSupportSubmitBtn: 'Send Support Ticket',
    empSupportHistoryTitle: 'Support History',
    empNoSupportTickets: 'No active support records.',
    empProfileTitle: 'Company & Contact Information',
    empProfileCompanyName: 'Company Name',
    empProfileContactPerson: 'Contact Person',

    selectTaskPrompt: 'Select Task...',
    taskGroupSource: '🌍 Source Country Officer',
    taskGroupTarget: '🏢 Target Country Officer',
    taskGroupField: '✈️ Field Officer',
    taskGroupManagement: '👑 Upper Management',
    taskPassportCheck: 'Check Passport',
    taskInterviewPlan: 'Plan Candidate Interview',
    taskUpdateCandidate: 'Update Candidate Info',
    taskRequestDocs: 'Request Missing Documents',
    taskSaveDemand: 'Save Employer Demand',
    taskMatchCandidate: 'Match Candidate',
    taskPrepareOffer: 'Prepare Job Offer (Job Offer)',
    taskTrackPerformance: 'Track Performance & Compliance',
    taskEnterTravelDate: 'Enter Travel Date',
    taskPlanAccommodation: 'Plan Accommodation & Pickup',
    taskManageSupport: 'Manage Support Tickets',
    taskUpdateFieldStatus: 'Update Field Task Status',
    taskAuditSystem: 'Audit System & Logs',
    taskApproveStrategic: 'Approve Financial & Strategic Decisions',

    reportsTab: 'Reports',
    analyticsTab: 'Analytics',
    financialsTab: 'Financials',
    exportPdfBtn: 'Export PDF',
    exportExcelBtn: 'Export Excel',
    filterBtn: 'Filter',
    clearFiltersBtn: 'Clear Filters',
    statusActive: 'Active',
    statusInactive: 'Inactive',
    statusCancelled: 'Cancelled',
    actionsLabel: 'Actions',
    detailsLabel: 'Details',
    editLabel: 'Edit',
    deleteLabel: 'Delete',
    confirmDeleteTitle: 'Confirm Deletion',
    confirmDeleteDesc: 'Are you sure you want to delete this record? This action cannot be undone.',
    yesBtn: 'Yes',
    noBtn: 'No',

    demandFilesTitle: 'Personnel Demand Dossiers',
    demandFilesSub: 'Operations, working conditions, candidate criteria, and travel lifecycle for each demand.',
    openDemandFilesBtn: 'Open Demand Dossier (All Details)',
    lifecycleStatusLabel: 'DEMAND LIFECYCLE STATUS (5.1)',
    stageNewRequest: 'New request (Review not started)',
    stageReviewing: 'Reviewing (Checking conditions)',
    stageSearchingCandidates: 'Searching candidates (Source country work)',
    stagePresentingCandidates: 'Presenting candidates (Sending to employer)',
    stageInterviews: 'Interviews (Employer interviews ongoing)',
    stageSelectionCompleted: 'Selection completed (Required candidate chosen)',
    stageOfficialProcess: 'Official process / Docs (Procedures ongoing)',
    stageTravelPlanning: 'Travel planning (Arrival and start)',
    stageCompleted: 'Completed (Demand closed)',
    stageCancelled: 'Cancelled (Reason recorded)',
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
    phone: 'Telefon',
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
    candidatePortalBtn: 'Portali i Kandidatëve & Hyrja',
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
      agriculture: { name: 'Panova Bujqësi dhe Blegtori', tagline: 'Prodhimi Bujqësor' },
      construction: { name: 'Panova Ndërtim', tagline: 'Ndërtim dhe Objekte' }
    },
    certAndVideo: 'Certifikata & Video',
    salaryAndShift: 'Paga & Turni',
    trackingPeriod: 'Gjurmimi 30-60-90',
    noCertificate: 'Pa Certifikatë',
    watchVideo: 'Shiko Videon',
    monthText: 'muaj',
    shiftSuitableText: 'I përshtatshëm për turne',
    standardShiftText: 'Turni Standard',
    employerCompany: 'Kompania Punëdhënëse',
    createdDate: 'Krijuar',
    personCount: 'Person(a)',
    overviewTab: 'Përmbledhje',
    candidatesTab: 'Grupi i Kandidatëve',
    requestsTab: 'Kërkesat e Personelit',
    employersTab: 'Punëdhënësit',
    matchingTab: 'Përputhjet',
    travelTab: 'Udhëtimet & Vizat',
    employeesTab: 'Punonjësit Aktivë (30/60/90)',
    supportTab: 'Problemet / Mbështetja',
    totalCandidatesCard: 'TOTALI I KANDIDATËVE',
    activeEmployersCard: 'PUNËDHËNËSIT AKTIVË',
    openRequestsCard: 'KËRKESAT E HAPURA',
    openSupportCard: 'PROBLEMET / MBËSHTETJA',
    portalSummaryTitle: 'Përmbledhje e Operacioneve PANOVA',
    portalSummaryDesc: 'Ju mund të menaxhoni aplikimet e kandidatëve, të përputhni kandidatët me kërkesat e punëdhënësve dhe të ndiqni vizat.',
    staffTab: 'Stafi & Rolet',
    tasksTab: 'Detyrat',
    auditTab: 'Regjistri i Auditimit',
    addStaffTitle: 'Cakto Staf & Rol të Ri',
    staffNameLabel: 'Emri Mbiemri *',
    staffEmailLabel: 'Email (Për hyrje) *',
    staffRoleLabel: 'Përshkrimi i Rolit',
    staffPermLabel: 'Niveli i Rolit *',
    saveStaffBtn: 'Ruaj Anëtarin e Stafit',
    staffMatrixTitle: 'Matrica e Stafit dhe Rolet PANOVA',
    staffMatrixSub: 'Rolet: Menaxhimi i Lartë, Vendi Burim, Vendi i Synuar dhe Oficeri i Fushës',
    permLevelText: 'Niveli i Rolit:',
    newTaskTitleHeader: 'Cakto Detyrë & Përgjegjës',
    taskDescLabel: 'Përshkrimi i Detyrës *',
    taskAssigneeLabel: 'Përgjegjësi Kryesor',
    taskBackupAssigneeLabel: 'Përgjegjësi Rezervë',
    taskDueDateLabel: 'Data e Afatit',
    saveTaskBtn: 'Ruaj Detyrën',
    taskListHeader: 'Detyrat e Ekipit & Gjurmimi i Përgjegjësisë',
    statusPending: 'Në pritje',
    statusCompleted: 'Përfunduar',
    auditLogTitle: 'Regjistri i Veprimeve të Sistemit (Audit Log)',
    auditLogSub: 'Veprimet kritike, ndryshimet e statusit dhe caktimet e stafit në sistem',
    colAction: 'Veprimi / Ngjarja',
    colPerformer: 'Kryer nga',
    colTime: 'Koha',
    delayAlertsTitle: '⚠️ Njoftimet e Vonesave & Afateve',
    delayAlertsDesc: 'Alarmet automatike të sistemit janë aktive për skedarët, procesi i vizave të të cilëve kalon 15 ditë.',
    roleUpperManagement: 'Menaxhimi i Lartë',
    roleSourceCountry: 'Oficeri i Vendit Burim',
    roleTargetCountry: 'Oficeri i Vendit të Synuar',
    roleFieldOfficer: 'Oficeri i Fushës',
    applicationStatusAndSummary: 'Application Status and Summary',
    currentProcessStage: 'CURRENT PROCESS STAGE',
    assigneeText: 'Përgjegjës',
    backupText: 'Rezervë',
    dueDateText: 'Afati',
    noEmployers: 'Nuk u gjetën punëdhënës të regjistruar.',
    noSupport: 'Nuk u gjetën njoftime mbështetjeje aktive.',
    initialAuditLog: 'Sistemi u Iniciua & Matrica e Roleve u Krijua',
    dateFormatPlaceholder: 'dd.mm.vvvv',
    message: 'Mesazhi',

    empTabRequests: 'Kërkesat e Personelit',
    empTabCandidates: 'Kandidatët / Përputhjet',
    empTabSelected: 'Kandidatët e Zgjedhur',
    empTabTravel: 'Udhëtimi dhe Fillimi',
    empTabSupport: 'Mbështetje / Njoftim',
    empTabProfile: 'Të Dhënat e Kompanisë',
    empNoRequests: 'Nuk u gjet asnjë kërkesë aktive për personel.',
    empCandidatesPoolTitle: 'Grupi i Kandidatëve për Kërkesat Tuaja',
    empNoCandidates: 'Ende nuk ka kandidatë përputhës.',
    empInterviewRequestBtn: 'Kërko Intervistë',
    empShortlistBtn: 'Shto në Listë të Shkurtër',
    empInterviewsTitle: 'Intervistat e Planifikuara dhe të Përfunduara',
    empNoInterviews: 'Nuk keni asnjë takim interviste aktiv.',
    empSelectedTitle: 'Kandidatët e Miratuar dhe në Proçes',
    empNoSelected: 'Ende nuk keni ndonjë kandidat të miratuar.',
    empTravelTitle: 'Informacioni i Fluturimit, Mbërritjes dhe Pritjes',
    empNoTravel: 'Detajet e udhëtimit të personelit do të listohen këtu.',
    empEmployeesTitle: 'Personeli i Punësuar & Gjurmimi 30/60/90 Ditë',
    empNoEmployees: 'Nuk ka punonjës aktivë në kompaninë tuaj.',
    empSupportFormTitle: 'Hap Ticket Mbështetjeje Operacionale',
    empSupportSubjectLabel: 'Subjekti / Titulli',
    empSupportMessageLabel: 'Mesazhi Juaj',
    empSupportSubmitBtn: 'Dërgo Kërkesën e Mbështetjes',
    empSupportHistoryTitle: 'Historiku i Mbështetjes',
    empNoSupportTickets: 'Nuk keni regjistrime mbështetjeje aktive.',
    empProfileTitle: 'Informacioni i Kompanisë dhe Kontaktit',
    empProfileCompanyName: 'Emri i Kompanisë',
    empProfileContactPerson: 'Personi i Kontaktit',

    selectTaskPrompt: 'Zgjidh Detyrën...',
    taskGroupSource: '🌍 Oficeri i Vendit Burim',
    taskGroupTarget: '🏢 Oficeri i Vendit të Synuar',
    taskGroupField: '✈️ Oficeri i Fushës',
    taskGroupManagement: '👑 Menaxhimi i Lartë',
    taskPassportCheck: 'Kontrollo Pasaportën',
    taskInterviewPlan: 'Planifiko Intervistën e Kandidatit',
    taskUpdateCandidate: 'Përditëso të Dhënat e Kandidatit',
    taskRequestDocs: 'Kërko Dokumentet e Munguara',
    taskSaveDemand: 'Ruaj Kërkesën e Punëdhënësit',
    taskMatchCandidate: 'Përputh Kandidatin',
    taskPrepareOffer: 'Përgatit Ofertën e Punës (Job Offer)',
    taskTrackPerformance: 'Ndiq Performancën & Pajtueshmërinë',
    taskEnterTravelDate: 'Vendos Datën e Udhëtimit',
    taskPlanAccommodation: 'Planifiko Akomodimin & Pritjen',
    taskManageSupport: 'Menaxho Tikat e Mbështetjes',
    taskUpdateFieldStatus: 'Përditëso Statusin e Detyrës në Teren',
    taskAuditSystem: 'Audito Sistemin & Regjistrat',
    taskApproveStrategic: 'Mirato Vendimet Financiare & Strategjike',

    reportsTab: 'Raportet',
    analyticsTab: 'Analitika',
    financialsTab: 'Financiare',
    exportPdfBtn: 'Eksporto PDF',
    exportExcelBtn: 'Eksporto Excel',
    filterBtn: 'Filtro',
    clearFiltersBtn: 'Pastro Filtrat',
    statusActive: 'Aktiv',
    statusInactive: 'Joaktiv',
    statusCancelled: 'Anuluar',
    actionsLabel: 'Veprimet',
    detailsLabel: 'Detajet',
    editLabel: 'Ndrysho',
    deleteLabel: 'Fshi',
    confirmDeleteTitle: 'Konfirmo Fshirjen',
    confirmDeleteDesc: 'A jeni i sigurt që dëshironi ta fshini këtë regjistrim? Ky veprim nuk mund të zhbëhet.',
    yesBtn: 'Po',
    noBtn: 'Jo',

    demandFilesTitle: 'Dosjet e Kërkesave të Personelit',
    demandFilesSub: 'Operacionet, kushtet e punës, kriteret e kandidatëve dhe cikli i jetës së udhëtimit për çdo kërkesë.',
    openDemandFilesBtn: 'Hap Dosjen e Kërkesës (Të Gjitha Detajet)',
    lifecycleStatusLabel: 'STATUSI I CIKLIT TË JETËS SË KËRKESËS (5.1)',
    stageNewRequest: 'Kërkesë e re (Shqyrtimi ende nuk ka filluar)',
    stageReviewing: 'Duke u shqyrtuar (Kontrolli i kushteve)',
    stageSearchingCandidates: 'Duke kërkuar kandidatë (Puna në vendin e burimit)',
    stagePresentingCandidates: 'Duke paraqitur kandidatët (Dërgimi tek punëdhënësi)',
    stageInterviews: 'Intervistat (Intervistat e punëdhënësit vazhdojnë)',
    stageSelectionCompleted: 'Przgjedhja u kompletua (Kandidati i duhur u zgjodh)',
    stageOfficialProcess: 'Procesi zyrtar / Dokumentet (Procedurat vazhdojnë)',
    stageTravelPlanning: 'Planifikimi i udhëtimit (Mbërritja dhe fillimi)',
    stageCompleted: 'Përfunduar (Kërkesa është mbyllur)',
    stageCancelled: 'Anuluar (Arsyeja e regjistruar)',
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
    phone: 'الهاتف',
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
    candidatePortalBtn: 'بوابة المرشحين وتسجيل الدخول',
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
      agriculture: { name: 'Panova للزراعة والثروة الحيوانية', tagline: 'الإنتاج الزراعي' },
      construction: { name: 'Panova Construction', tagline: 'البناء والتشييد' }
    },
    certAndVideo: 'الشهادة والفيديو',
    salaryAndShift: 'الراتب ونظام العمل',
    trackingPeriod: 'متابعة 30-60-90',
    noCertificate: 'لا توجد شهادة',
    watchVideo: 'مشاهدة الفيديو',
    monthText: 'شهر',
    shiftSuitableText: 'مناسب للنوبات',
    standardShiftText: 'نوبة قياسية',
    employerCompany: 'الشركة المصدرة للطلب',
    createdDate: 'التاريخ',
    personCount: 'أشخاص',
    overviewTab: 'نظرة عامة',
    candidatesTab: 'قائمة المرشحين',
    requestsTab: 'طلبات الموظفين',
    employersTab: 'أصحاب العمل',
    matchingTab: 'المطابقة',
    travelTab: 'السفر والتأشيرات',
    employeesTab: 'الموظفون النشطون (30/60/90)',
    supportTab: 'المشكلات / الدعم',
    totalCandidatesCard: 'إجمالي المرشحين',
    activeEmployersCard: 'أصحاب العمل النشطون',
    openRequestsCard: 'الطلبات المفتوحة',
    openSupportCard: 'المشكلات / الدعم المفتوح',
    portalSummaryTitle: 'ملخص عمليات بانوفا',
    portalSummaryDesc: 'يمكنك إدارة طلبات المرشحين ومطابقة الكفاءات مع طلبات أصحاب العمل ومتابعة التأشيرات.',
    staffTab: 'الموظفون والأدوار',
    tasksTab: 'المهام',
    auditTab: 'سجل التدقيق (Audit)',
    addStaffTitle: 'تعيين موظف ودور جديد',
    staffNameLabel: 'الاسم الكامل *',
    staffEmailLabel: 'البريد الإلكتروني (لتسجيل الدخول) *',
    staffRoleLabel: 'وصف الدور',
    staffPermLabel: 'مستوى الصلاحية / الدور *',
    saveStaffBtn: 'حفظ موظف',
    staffMatrixTitle: 'طاقم العمل في بانوفا ومصفوفة الأدوار',
    staffMatrixSub: 'أدوار الإدارة العليا، بلد المصدر، البلد المستهدف، ومسؤول الميدان',
    permLevelText: 'مستوى الدور:',
    newTaskTitleHeader: 'تعيين مهمة ومسؤول جديد',
    taskDescLabel: 'وصف المهمة *',
    taskAssigneeLabel: 'المسؤول الأساسي',
    taskBackupAssigneeLabel: 'المسؤول الاحتياطي',
    taskDueDateLabel: 'تاريخ الاستحقاق',
    saveTaskBtn: 'حفظ المهمة',
    taskListHeader: 'مهام الفريق ومتابعة المسؤوليات',
    statusPending: 'قيد الانتظار',
    statusCompleted: 'مكتمل',
    auditLogTitle: 'سجل عمليات النظام (Audit Log)',
    auditLogSub: 'العمليات الحرجة وتغييرات الحالة وتعيينات الموظفين في النظام',
    colAction: 'العملية / الحدث',
    colPerformer: 'تم بواسطة',
    colTime: 'الوقت',
    delayAlertsTitle: '⚠️ تنبيهات التأخير والمواعيد النهائية',
    delayAlertsDesc: 'تنبيهات النظام التلقائية نشطة للملفات التي تتجاوز فيها عملية التأشيرة 15 يوماً.',
    roleUpperManagement: 'الإدارة العليا',
    roleSourceCountry: 'مسؤول بلد المصدر',
    roleTargetCountry: 'مسؤول البلد المستهدف',
    roleFieldOfficer: 'مسؤول الميدان',
    applicationStatusAndSummary: 'Application Status and Summary',
    currentProcessStage: 'CURRENT PROCESS STAGE',
    assigneeText: 'المسؤول',
    backupText: 'الاحتياطي',
    dueDateText: 'تاريخ الاستحقاق',
    noEmployers: 'لا يوجد أصحاب عمل مسجلين.',
    noSupport: 'لا توجد تذاكر دعم نشطة.',
    initialAuditLog: 'تم بدء النظام وإنشاء مصفوفة الأدوار',
    dateFormatPlaceholder: 'dd.mm.yyyy',
    message: 'الرسالة',

    empTabRequests: 'طلبات الموظفين',
    empTabCandidates: 'المرشحون / المطابقة',
    empTabSelected: 'المرشحون المختارون',
    empTabTravel: 'السفر والبداية',
    empTabSupport: 'الدعم / الإشعارات',
    empTabProfile: 'معلومات الشركة',
    empNoRequests: 'لا توجد طلبات قوى عاملة نشطة.',
    empCandidatesPoolTitle: 'قائمة المرشحين المقدمة لطلباتك',
    empNoCandidates: 'لا يوجد مرشحون مطابقون حتى الآن.',
    empInterviewRequestBtn: 'طلب مقابلة',
    empShortlistBtn: 'إضافة للقائمة المختصرة',
    empInterviewsTitle: 'المقابلات المجدولة والمكتملة',
    empNoInterviews: 'ليس لديك مواعيد مقابلات نشطة مجدولة.',
    empSelectedTitle: 'المرشحون الموافق عليهم وتحت الإجراء',
    empNoSelected: 'لا يوجد مرشحون موافق عليهم حتى الآن.',
    empTravelTitle: 'معلومات الرحلة والوصول والاستقبال',
    empNoTravel: 'سيتم سرد تفاصيل السفر للموظفين هنا.',
    empEmployeesTitle: 'الموظفون المعينون ومتابعة 30/60/90 يوم',
    empNoEmployees: 'لا توجد موظفون نشطون في شركتك.',
    empSupportFormTitle: 'فتح تذكرة دعم تشغيلي',
    empSupportSubjectLabel: 'الموضوع / العنوان',
    empSupportMessageLabel: 'رسالتك',
    empSupportSubmitBtn: 'إرسال تذكرة الدعم',
    empSupportHistoryTitle: 'سجل الدعم',
    empNoSupportTickets: 'لا توجد سجلات دعم نشطة.',
    empProfileTitle: 'معلومات الشركة والاتصال',
    empProfileCompanyName: 'اسم الشركة',
    empProfileContactPerson: 'الشخص المسؤول',

    selectTaskPrompt: 'اختر المهمة...',
    taskGroupSource: '🌍 مسؤول بلد المصدر',
    taskGroupTarget: '🏢 مسؤول البلد المستهدف',
    taskGroupField: '✈️ مسؤول الميدان',
    taskGroupManagement: '👑 الإدارة العليا',
    taskPassportCheck: 'فحص جواز السفر',
    taskInterviewPlan: 'التخطيط لمقابلة المرشح',
    taskUpdateCandidate: 'تحديث بيانات المرشح',
    taskRequestDocs: 'طلب المستندات الناقصة',
    taskSaveDemand: 'حفظ طلب صاحب العمل',
    taskMatchCandidate: 'مطابقة المرشح',
    taskPrepareOffer: 'إعداد عرض العمل (Job Offer)',
    taskTrackPerformance: 'متابعة الأداء والامتثال',
    taskEnterTravelDate: 'إدخال تاريخ السفر',
    taskPlanAccommodation: 'تخطيط الإقامة والترحيب',
    taskManageSupport: 'إدارة تذاكر الدعم',
    taskUpdateFieldStatus: 'تحديث حالة المهمة الميدانية',
    taskAuditSystem: 'تدقيق النظام والسجلات',
    taskApproveStrategic: 'الموافقة على القرارات المالية والاستراتيجية',

    reportsTab: 'التقارير',
    analyticsTab: 'التحليلات',
    financialsTab: 'المالية',
    exportPdfBtn: 'تصدير PDF',
    exportExcelBtn: 'تصدير Excel',
    filterBtn: 'تصفية',
    clearFiltersBtn: 'مسح الفلاتر',
    statusActive: 'نشط',
    statusInactive: 'غير نشط',
    statusCancelled: 'ملغى',
    actionsLabel: 'الإجراءات',
    detailsLabel: 'التفاصيل',
    editLabel: 'تعديل',
    deleteLabel: 'حذف',
    confirmDeleteTitle: 'تأكيد الحذف',
    confirmDeleteDesc: 'هل أنت متأكد أنك تريد حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.',
    yesBtn: 'نعم',
    noBtn: 'لا',

    demandFilesTitle: 'ملفات طلبات الموظفين',
    demandFilesSub: 'العمليات، ظروف العمل، معايير المرشحين، ودورة حياة السفر لكل طلب.',
    openDemandFilesBtn: 'فتح ملف الطلب (جميع التفاصيل)',
    lifecycleStatusLabel: 'حالة دورة حياة الطلب (5.1)',
    stageNewRequest: 'طلب جديد (لم تبدأ المراجعة بعد)',
    stageReviewing: 'قيد المراجعة (جاري التحقق من الشروط)',
    stageSearchingCandidates: 'جاري البحث عن مرشحين (العمل في بلد المصدر)',
    stagePresentingCandidates: 'جاري تقديم المرشحين (إرسالهم إلى صاحب العمل)',
    stageInterviews: 'المقابلات (مقابلات صاحب العمل مستمرة)',
    stageSelectionCompleted: 'اكتمل الاختيار (تم اختيار المرشح المطلوب)',
    stageOfficialProcess: 'العملية الرسمية / المستندات (الإجراءات مستمرة)',
    stageTravelPlanning: 'تخطيط السفر (الوصول والبداية)',
    stageCompleted: 'مكتمل (تم إغلاق الطلب)',
    stageCancelled: 'ملغى (تم تسجيل السبب)',
  },
};