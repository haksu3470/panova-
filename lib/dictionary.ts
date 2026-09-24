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
  signUpBtn?: string;
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
  certNo?: string;
  certificateNo?: string;
  issuingBodyLabel?: string;
  issuingBody?: string;
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

  signInMenu?: string;
  signUpMenu?: string;
  loginPortalTitle?: string;
  loginPortalSub?: string;
  companyEmailLabel?: string;
  signUpPortalTitle?: string;
  signUpPortalSub?: string;
  companyNameLabel?: string;
  contactPersonLabel?: string;
  completeRegBtn?: string;
  completeSignUpBtn?: string;
  demoLoginText?: string;
  regSuccessHeader?: string;
  regSuccessText?: string;
  goToSignInBtn?: string;

  employerRegTitle?: string;
  employerRegSub?: string;
  completeReg?: string;

  empTabRequests?: string;
  empTabCandidates?: string;
  empTabInterviews?: string;
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

  profileUpdateTitle?: string;
  profileUpdateDesc?: string;
  countryLocationLabel?: string;
  emailImmutableLabel?: string;
  emailReadonlyLabel?: string;
  updatingBtn?: string;
  saveChangesBtn?: string;
  profileUpdatedSuccess?: string;

  completed?: string;
  approved?: string;
  pending?: string;
  reviewing?: string;
  certificateno?: string;
  issuingbody?: string;
  sendnotification?: string;

  planned?: string;
  ticketed?: string;
  flightNumber?: string;
  flightDateTime?: string;
  departureCityAirport?: string;
  arrivalCityAirport?: string;
  pnrBookingCode?: string;
  accommodationTransferDetails?: string;
  documentTrackingMechanism?: string;
  selectTaskPrompt?: string;
  taskGroupSource?: string;
  taskPassportCheck?: string;
  taskInterviewPlan?: string;
  taskRequestDocs?: string;
  taskUpdateCandidate?: string;
  taskSaveDemand?: string;
  taskMatchCandidate?: string;
  taskPrepareOffer?: string;
  taskTrackPerformance?: string;

  docPassportScan?: string;
  docProfessionalCert?: string;
  docCriminalRecord?: string;
  docHealthReport?: string;
  savedSuccess?: string;
  fillEmployerAndSalary?: string;
  offerSentSuccess?: string;
  notificationSentSuccess?: string;
  returnToPortal?: string;
  saving?: string;
  saveChanges?: string;
  dossierClosedNotice?: string;
  reason?: string;
  reopenProcess?: string;
  profileCredentialsManagement?: string;
  phoneNumberGsm?: string;
  emailAddress?: string;
  portalPassword?: string;
  travelFlightLogistics?: string;
  file?: string;
  uploaded?: string;
  rejected?: string;
  reRequested?: string;
  preview?: string;
  noFileUploaded?: string;
  uploadFromComputer?: string;
  newDocNamePlaceholder?: string;
  add?: string;
  professionalEvaluationCertificate?: string;
  workVideoUrl?: string;
  previewPlayVideo?: string;
  internalNotesAdminOnly?: string;
  visaProcessing?: string;
  processClosureWithdrawal?: string;
  closureDesc?: string;
  closureReasonPlaceholder?: string;
  closeArchiveProcess?: string;
  sendOfficialJobOffer?: string;
  monthlyNetSalary?: string;
  startDate?: string;
  termsConditions?: string;
  sendOfferToCandidate?: string;
  notificationTitle?: string;
  messageBody?: string;
  workVideoPreview?: string;
  demandFilesTitle?: string;
  demandFilesSub?: string;
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
  openDemandFilesBtn?: string;
  taskGroupTarget?: string;
  taskGroupField?: string;
  taskEnterTravelData?: string;
  taskPlanAccommodation?: string;
  taskManageSupport?: string;
  taskUpdateFieldStatus?: string;
  taskGroupManagement?: string;
  taskAuditSystem?: string;
  taskApproveStrategic?: string;

    // ... (diğer mevcut tanımlarınız)
  certificateInfo?: string;
  candidateStatus?: string;
  employerCompanyName?: string;
  sendNotification?: string;
  sending?: string;
  sendNotificationBtn?: string;
}
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
    completeRegBtn: 'Kayıt Ol',
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
    signUpBtn: 'Kayıt Ol',
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
    certNo: 'Sertifika No',
    certificateNo: 'Sertifika No',
    issuingBodyLabel: 'Veren Kurum',
    issuingBody: 'Veren Kurum',
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
    delayAlertsDesc: 'Vize süresi 15 günü aşan veya belgesi eksik olan dosyalar için otomatik sistem uyarıları aktif.',
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

    signInMenu: 'Giriş Yap',
    signUpMenu: 'Kayıt Ol',
    loginPortalTitle: 'İşveren Giriş Portalı',
    loginPortalSub: 'Şirket e-postanız ve şifrenizle giriş yapın.',
    companyEmailLabel: 'Şirket E-Postası',
    signUpPortalTitle: 'İşveren Kaydı',
    signUpPortalSub: 'İş gücü talepleri sunmak için şirketinizi kaydedin.',
    employerRegTitle: 'İşveren Kaydı',
    employerRegSub: 'İş gücü talebi oluşturmak için şirketinizi kaydedin.',
    companyNameLabel: 'Şirket Unvanı',
    contactPersonLabel: 'Yetkili Kişi',
    completeSignUpBtn: 'Kaydı Tamamla',
    demoLoginText: 'Demo Giriş:',
    regSuccessHeader: 'Kayıt Başarılı!',
    regSuccessText: 'Şirket hesabınız oluşturuldu. Artık giriş yapabilirsiniz.',
    goToSignInBtn: 'Giriş Sayfasına Git',

    empTabRequests: 'Personel Taleplerim',
    empTabCandidates: 'Adaylar / Eşleşmeler',
    empTabInterviews: 'Mülakatlar',
    empTabSelected: 'Seçtiğim Adaylar',
    empTabTravel: 'Seyahat ve Başlangıç',
    empTabSupport: 'Destek / Bildirim',
    empTabProfile: 'Şirket Profili',
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
    empProfileTitle: 'Şirket Profili ve Bilgi Güncelleme',
    empProfileCompanyName: 'Şirket Unvanı',
    empProfileContactPerson: 'Yetkili Kişi',

    profileUpdateTitle: 'Şirket Profili ve Bilgi Güncelleme',
    profileUpdateDesc: 'Şirket bilgilerinizi ve şifrenizi buradan güncelleyebilirsiniz.',
    countryLocationLabel: 'Ülke / Konum',
    emailImmutableLabel: 'E-posta (Değiştirilemez)',
    emailReadonlyLabel: 'E-posta (Değiştirilemez)',
    updatingBtn: 'Güncelleniyor...',
    saveChangesBtn: 'Değişiklikleri Kaydet',
    profileUpdatedSuccess: 'Şirket profili başarıyla güncellendi!',

    completed: 'Tamamlandı',
    approved: 'Onaylandı',
    pending: 'Beklemede',
    reviewing: 'İnceleniyor',
    certificateno: 'Sertifika No',
    issuingbody: 'Veren Kurum',
    sendnotification: 'Bildirim Gönder',

    planned: 'Planlandı',
    ticketed: 'Biletlendi',
    flightNumber: 'Uçuş No',
    flightDateTime: 'Uçuş Tarih/Saat',
    departureCityAirport: 'Kalkış Şehri / Havalimanı',
    arrivalCityAirport: 'Varış Şehri / Havalimanı',
    pnrBookingCode: 'PNR / Rezervasyon Kodu',
    accommodationTransferDetails: 'Konaklama ve Transfer Detayları',
    documentTrackingMechanism: 'Belge Takip Mekanizması',
    selectTaskPrompt: 'Görev Seçin',
    taskGroupSource: 'Kaynak Ülke Ekibi',
    taskPassportCheck: 'Pasaport ve Evrak Kontrolü',
    taskInterviewPlan: 'Ön Mülakat Planlaması',
    taskRequestDocs: 'Eksik Evrak Talebi',
    taskUpdateCandidate: 'Aday Durum Güncellemesi',
    taskSaveDemand: 'İşveren Talebini Kaydet',
    taskMatchCandidate: 'Aday Eşleştirme',
    taskPrepareOffer: 'İş Teklifi Hazırla',
    taskTrackPerformance: '30/60/90 Gün Performans Takibi',

    docPassportScan: 'Pasaport Taraması',
    docProfessionalCert: 'Mesleki Sertifika',
    docCriminalRecord: 'Adli Sicil Kaydı',
    docHealthReport: 'Sağlık Raporu',
    savedSuccess: 'Başarıyla Kaydedildi',
    fillEmployerAndSalary: 'Lütfen İşveren ve Maaş Bilgilerini Doldurun',
    offerSentSuccess: 'İş Teklifi Başarıyla Gönderildi',
    notificationSentSuccess: 'Bildirim Başarıyla Gönderildi',
    returnToPortal: 'Portala Dön',
    saving: 'Kaydediliyor...',
    saveChanges: 'Değişiklikleri Kaydet',
    dossierClosedNotice: 'Dosya Kapatıldı',
    reason: 'Gerekçe / Neden',
    reopenProcess: 'Süreci Yeniden Aç',
    profileCredentialsManagement: 'Profil ve Kimlik Bilgileri Yönetimi',
    phoneNumberGsm: 'Telefon Numarası (GSM)',
    emailAddress: 'E-Posta Adresi',
    portalPassword: 'Portal Şifresi',
    travelFlightLogistics: 'Seyahat, Uçuş ve Lojistik',
    file: 'Dosya',
    uploaded: 'Yüklendi',
    rejected: 'Reddedildi',
    reRequested: 'Yeniden İstendi',
    preview: 'Önizleme',
    noFileUploaded: 'Henüz dosya yüklenmedi',
    uploadFromComputer: 'Bilgisayardan Dosya Yükle',
    newDocNamePlaceholder: 'Belge Adı / Türü',
    add: 'Ekle',
    professionalEvaluationCertificate: 'Mesleki Değerlendirme Sertifikası',
    workVideoUrl: 'Çalışma / Tanıtım Videosu URL',
    previewPlayVideo: 'Videoyu Oynat & Önizle',
    internalNotesAdminOnly: 'Dahili Notlar (Yalnızca Admin)',
    visaProcessing: 'Vize İşlemde',
    processClosureWithdrawal: 'Süreç Kapatma / Geri Çekme',
    closureDesc: 'Bu adayın başvuru sürecini sonlandırmak veya kapatmak için gerekçe belirtin.',
    closureReasonPlaceholder: 'Kapatma gerekçesini yazın...',
    closeArchiveProcess: 'Süreci Kapat / Arşivle',
    sendOfficialJobOffer: 'Resmi İş Teklifi Gönder',
    monthlyNetSalary: 'Aylık Net Maaş',
    startDate: 'İşe Başlangıç Tarihi',
    termsConditions: 'Özel Şartlar ve Koşullar',
    sendOfferToCandidate: 'Teklifi Adaya Gönder',
    notificationTitle: 'Bildirim Konusu',
    messageBody: 'Mesaj İçeriği',
    workVideoPreview: 'Aday Çalışma Videosu Önizlemesi',
    demandFilesTitle: 'Talep Dosyaları ve Aday Eşleşmeleri',
    demandFilesSub: 'Bu talebe bağlı süreçleri ve adayları yönetin',
    lifecycleStatusLabel: 'Yaşam Döngüsü Durumu',
    stageNewRequest: 'Yeni Talep',
    stageReviewing: 'İncelemede',
    stageSearchingCandidates: 'Aday Aranıyor',
    stagePresentingCandidates: 'Adaylar Sunuluyor',
    stageInterviews: 'Görüşmeler Yapılıyor',
    stageSelectionCompleted: 'Seçim Tamamlandı',
    stageOfficialProcess: 'Resmi İşlemler / Vize',
    stageTravelPlanning: 'Seyahat Planlanıyor',
    stageCompleted: 'Tamamlandı',
    stageCancelled: 'İptal Edildi',
    openDemandFilesBtn: 'Dosyaları Aç',
    taskGroupTarget: 'Hedef Ülke Ekibi',
    taskGroupField: 'Saha Ekibi',
    taskEnterTravelData: 'Seyahat Verilerini Gir',
    taskPlanAccommodation: 'Konaklama Planla',
    taskManageSupport: 'Destek Yönetimi',
    taskUpdateFieldStatus: 'Saha Durumunu Güncelle',
    taskGroupManagement: 'Yönetim Ekibi',
    taskAuditSystem: 'Sistem Denetimi',
    taskApproveStrategic: 'Stratejik Onaylar',
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
    completeRegBtn: 'Complete Registration',
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
    signUpBtn: 'Sign Up',
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
    certNo: 'Cert No',
    certificateNo: 'Cert No',
    issuingBodyLabel: 'Issuing Body',
    issuingBody: 'Issuing Body',
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

    signInMenu: 'Sign In',
    signUpMenu: 'Sign Up',
    loginPortalTitle: 'Employer Login Portal',
    loginPortalSub: 'Sign in with your company email and password.',
    companyEmailLabel: 'Company Email',
    signUpPortalTitle: 'Employer Registration',
    signUpPortalSub: 'Register your company to submit workforce demands.',
    employerRegTitle: 'Employer Registration',
    employerRegSub: 'Register your company to submit workforce demands.',
    companyNameLabel: 'COMPANY NAME',
    contactPersonLabel: 'CONTACT PERSON',
    completeSignUpBtn: 'Complete Registration',
    demoLoginText: 'Demo Login:',
    regSuccessHeader: 'Registration Successful!',
    regSuccessText: 'Your company account has been created. You can now sign in.',
    goToSignInBtn: 'Go to Sign In',

    empTabRequests: 'Personnel Requests',
    empTabCandidates: 'Candidates / Matching',
    empTabInterviews: 'Interviews',
    empTabSelected: 'Selected Candidates',
    empTabTravel: 'Travel & Start',
    empTabSupport: 'Support / Notices',
    empTabProfile: 'Company Profile',
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
    empProfileTitle: 'Company Profile & Info Update',
    empProfileCompanyName: 'Company Name',
    empProfileContactPerson: 'Contact Person',

    profileUpdateTitle: 'Company Profile & Info Update',
    profileUpdateDesc: 'Update your company details and password here.',
    countryLocationLabel: 'COUNTRY / LOCATION',
    emailImmutableLabel: 'EMAIL (IMMUTABLE)',
    emailReadonlyLabel: 'Email (Read-only)',
    updatingBtn: 'Updating...',
    saveChangesBtn: 'Save Changes',
    profileUpdatedSuccess: 'Changes successfully saved!',

    completed: 'Completed',
    approved: 'Approved',
    pending: 'Pending',
    reviewing: 'Reviewing',
    certificateno: 'Certificate No',
    issuingbody: 'Issuing Body',
    sendnotification: 'Send Notification',

    planned: 'Planned',
    ticketed: 'Ticketed',
    flightNumber: 'Flight No',
    flightDateTime: 'Flight Date/Time',
    departureCityAirport: 'Departure City / Airport',
    arrivalCityAirport: 'Arrival City / Airport',
    pnrBookingCode: 'PNR / Booking Code',
    accommodationTransferDetails: 'Accommodation and Transfer Details',
    documentTrackingMechanism: 'Document Tracking Mechanism',
    selectTaskPrompt: 'Select Task',
    taskGroupSource: 'Source Country Team',
    taskPassportCheck: 'Passport & Document Check',
    taskInterviewPlan: 'Preliminary Interview Planning',
    taskRequestDocs: 'Request Missing Documents',
    taskUpdateCandidate: 'Candidate Status Update',
    taskSaveDemand: 'Save Employer Demand',
    taskMatchCandidate: 'Candidate Matching',
    taskPrepareOffer: 'Prepare Job Offer',
    taskTrackPerformance: '30/60/90 Day Performance Tracking',

    docPassportScan: 'Passport Scan',
    docProfessionalCert: 'Professional Certificate',
    docCriminalRecord: 'Criminal Record',
    docHealthReport: 'Health Report',
    savedSuccess: 'Successfully Saved',
    fillEmployerAndSalary: 'Please Fill Employer and Salary Details',
    offerSentSuccess: 'Job Offer Sent Successfully',
    notificationSentSuccess: 'Notification Sent Successfully',
    returnToPortal: 'Return to Portal',
    saving: 'Saving...',
    saveChanges: 'Save Changes',
    dossierClosedNotice: 'Dossier Closed',
    reason: 'Reason',
    reopenProcess: 'Reopen Process',
    profileCredentialsManagement: 'Profile & Credentials Management',
    phoneNumberGsm: 'Phone Number (GSM)',
    emailAddress: 'Email Address',
    portalPassword: 'Portal Password',
    travelFlightLogistics: 'Travel, Flight & Logistics',
    file: 'File',
    uploaded: 'Uploaded',
    rejected: 'Rejected',
    reRequested: 'Re-requested',
    preview: 'Preview',
    noFileUploaded: 'No files uploaded yet',
    uploadFromComputer: 'Upload File from Computer',
    newDocNamePlaceholder: 'Document Name / Type',
    add: 'Add',
    professionalEvaluationCertificate: 'Professional Evaluation Certificate',
    workVideoUrl: 'Work / Intro Video URL',
    previewPlayVideo: 'Preview & Play Video',
    internalNotesAdminOnly: 'Internal Notes (Admin Only)',
    visaProcessing: 'Visa Processing',
    processClosureWithdrawal: 'Process Closure / Withdrawal',
    closureDesc: 'Provide a reason to terminate or close this candidate application process.',
    closureReasonPlaceholder: 'Type closure reason...',
    closeArchiveProcess: 'Close / Archive Process',
    sendOfficialJobOffer: 'Send Official Job Offer',
    monthlyNetSalary: 'Monthly Net Salary',
    startDate: 'Start Date',
    termsConditions: 'Terms and Conditions',
    sendOfferToCandidate: 'Send Offer to Candidate',
    notificationTitle: 'Notification Title',
    messageBody: 'Message Body',
    workVideoPreview: 'Candidate Work Video Preview',
    demandFilesTitle: 'Demand Files and Candidate Matches',
    demandFilesSub: 'Manage processes and candidates linked to this demand',
    lifecycleStatusLabel: 'Lifecycle Status',
    stageNewRequest: 'New Request',
    stageReviewing: 'Reviewing',
    stageSearchingCandidates: 'Searching Candidates',
    stagePresentingCandidates: 'Presenting Candidates',
    stageInterviews: 'Interviews in Progress',
    stageSelectionCompleted: 'Selection Completed',
    stageOfficialProcess: 'Official Process / Visa',
    stageTravelPlanning: 'Travel Planning',
    stageCompleted: 'Completed',
    stageCancelled: 'Cancelled',
    openDemandFilesBtn: 'Open Files',
    taskGroupTarget: 'Target Country Team',
    taskGroupField: 'Field Team',
    taskEnterTravelData: 'Enter Travel Data',
    taskPlanAccommodation: 'Plan Accommodation',
    taskManageSupport: 'Manage Support',
    taskUpdateFieldStatus: 'Update Field Status',
    taskGroupManagement: 'Management Team',
    taskAuditSystem: 'System Audit',
    taskApproveStrategic: 'Strategic Approvals',
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
    completeRegBtn: 'Përfundo Regjistrimin',
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
    signUpBtn: 'Regjistrohuni',
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
    certNo: 'Nr. Certifikatës',
    certificateNo: 'Nr. Certifikatës',
    issuingBodyLabel: 'Institucioni Lëshues',
    issuingBody: 'Institucioni Lëshues',
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

    signInMenu: 'Hyni',
    signUpMenu: 'Regjistrohuni',
    loginPortalTitle: 'Portali i Hyrjes për Punëdhënësit',
    loginPortalSub: 'Hyni me emailin dhe fjalëkalimin e kompanisë suaj.',
    companyEmailLabel: 'Email i Kompanisë',
    signUpPortalTitle: 'Regjistrimi i Punëdhënësit',
    signUpPortalSub: 'Regjistroni kompaninë tuaj për të paraqitur kërkesa.',
    employerRegTitle: 'Regjistrimi i Punëdhënësit',
    employerRegSub: 'Regjistroni kompaninë tuaj për të paraqitur kërkesa për fuqi punëtore.',
    companyNameLabel: 'EMRI I KOMPANISË',
    contactPersonLabel: 'PERSONI PËRGJEGJËS',
    completeSignUpBtn: 'Përfundo Regjistrimin',
    demoLoginText: 'Demo Hyrje:',
    regSuccessHeader: 'Regjistrimi u Krye me Sukses!',
    regSuccessText: 'Llogaria e kompanisë suaj u krijua. Tani mund të hyni.',
    goToSignInBtn: 'Shko te Hyrja',

    empTabRequests: 'Kërkesat e Personelit',
    empTabCandidates: 'Kandidatët / Përputhja',
    empTabInterviews: 'Intervistat',
    empTabSelected: 'Kandidatët e Zgjedhur',
    empTabTravel: 'Udhëtimi dhe Fillimi',
    empTabSupport: 'Mbështetje / Njoftim',
    empTabProfile: 'Profili i Kompanisë',
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
    empProfileTitle: 'Përditësimi i Profilit',
    empProfileCompanyName: 'Emri i Kompanisë',
    empProfileContactPerson: 'Personi i Kontaktit',

    profileUpdateTitle: 'Përditësimi i Profilit dhe Informacionit të Kompanisë',
    profileUpdateDesc: 'Përditësoni të dhënat e kompanisë tuaj këtu.',
    countryLocationLabel: 'VENDI / LOKACIONI',
    emailImmutableLabel: 'EMAIL (I PACHANGZHUESHËM)',
    emailReadonlyLabel: 'Email (I pandryshueshëm)',
    updatingBtn: 'Duke përditësuar...',
    saveChangesBtn: 'Ruaj Ndryshimet',
    profileUpdatedSuccess: 'Ndryshimet u ruajtën me sukses!',

    completed: 'Përfunduar',
    approved: 'Miratuar',
    pending: 'Në pritje',
    reviewing: 'Duke shqyrtuar',
    certificateno: 'Nr. Certifikatës',
    issuingbody: 'Institucioni Lëshues',
    sendnotification: 'Dërgo Njoftim',

    planned: 'E planifikuar',
    ticketed: 'E prerë (Biletë)',
    flightNumber: 'Nr. i Fluturimit',
    flightDateTime: 'Data / Ora e Fluturimit',
    departureCityAirport: 'Qyteti / Aeroporti i Nisjes',
    arrivalCityAirport: 'Qyteti / Aeroporti i Mbërritjes',
    pnrBookingCode: 'Kodi PNR / Rezervimit',
    accommodationTransferDetails: 'Detajet e Akomodimit dhe Transfertës',
    documentTrackingMechanism: 'Mekanizmi i Gjurmimit të Dokumenteve',
    selectTaskPrompt: 'Zgjidh Detyrën',
    taskGroupSource: 'Ekipi i Vendit Burim',
    taskPassportCheck: 'Kontrolli i Pasaportës dhe Dokumenteve',
    taskInterviewPlan: 'Planifikimi i Paraprak i Intervistës',
    taskRequestDocs: 'Kërko Dokumente Munguese',
    taskUpdateCandidate: 'Përditësimi i Statusit të Kandidatit',
    taskSaveDemand: 'Ruaj Kërkesën e Punëdhënësit',
    taskMatchCandidate: 'Përputhja e Kandidatit',
    taskPrepareOffer: 'Përgatit Ofertën e Punës',
    taskTrackPerformance: 'Gjurmimi i Performancës 30/60/90 Ditë',

    docPassportScan: 'Skanimi i Pasaportës',
    docProfessionalCert: 'Certifikata Profesionale',
    docCriminalRecord: 'Dëshmi Penaliteti',
    docHealthReport: 'Raporti Mjekësor',
    savedSuccess: 'U Ruajt me Sukses',
    fillEmployerAndSalary: 'Ju lutemi plotësoni detajet e punëdhënësit dhe pagës',
    offerSentSuccess: 'Oferta e punës u dërgua me sukses',
    notificationSentSuccess: 'Njoftimi u dërgua me sukses',
    returnToPortal: 'Kthehu te Portali',
    saving: 'Duke ruajtur...',
    saveChanges: 'Ruaj Ndryshimet',
    dossierClosedNotice: 'Dosja u Mbyll',
    reason: 'Arsyeja',
    reopenProcess: 'Rihap Proçesin',
    profileCredentialsManagement: 'Menaxhimi i Profilit dhe Kredencialeve',
    phoneNumberGsm: 'Numri i Telefonit (GSM)',
    emailAddress: 'Adresa e Emailit',
    portalPassword: 'Fjalëkalimi i Portalit',
    travelFlightLogistics: 'Udhëtimi, Fluturimi & Logjistika',
    file: 'Skedari',
    uploaded: 'Ngarkuar',
    rejected: 'Refuzuar',
    reRequested: 'Rikuperuar / Kërkuar Përsëri',
    preview: 'Pamja paraprake',
    noFileUploaded: 'Ende nuk ka skedarë të ngarkuar',
    uploadFromComputer: 'Ngarko Skedar nga Kompjuter',
    newDocNamePlaceholder: 'Emri / Lloji i Dokumentit',
    add: 'Shto',
    professionalEvaluationCertificate: 'Certifikata e Vlerësimit Profesional',
    workVideoUrl: 'URL e Videos së Punës / Prezantimit',
    previewPlayVideo: 'Parapamje & Luaj Videon',
    internalNotesAdminOnly: 'Shënime të Brendshme (Vetëm për Admin)',
    visaProcessing: 'Viza në Proçes',
    processClosureWithdrawal: 'Mbyllja e Proçesit / Tërheqja',
    closureDesc: 'Jepni një arsyetim për të përfunduar ose mbyllur këtë proces aplikimi.',
    closureReasonPlaceholder: 'Shkruani arsyen e mbylljes...',
    closeArchiveProcess: 'Mbyll / Arkivo Proçesin',
    sendOfficialJobOffer: 'Dërgo Ofertë Zyrtare Pune',
    monthlyNetSalary: 'Paga Netë Mujore',
    startDate: 'Data e Fillimit',
    termsConditions: 'Kushtet dhe Afatet',
    sendOfferToCandidate: 'Dërgo Ofertën te Kandidati',
    notificationTitle: 'Titulli i Njoftimit',
    messageBody: 'Trupi i Mesazhit',
    workVideoPreview: 'Parapamje e Videos së Punës të Kandidatit',
    demandFilesTitle: 'Skedarët e Kërkesës dhe Përputhjet e Kandidatëve',
    demandFilesSub: 'Menaxhoni proceset dhe kandidatët e lidhur me këtë kërkesë',
    lifecycleStatusLabel: 'Statusi i Cikli Jetësor',
    stageNewRequest: 'Kërkesë e Re',
    stageReviewing: 'Në Shqyrtim',
    stageSearchingCandidates: 'Kërkohen Kandidatë',
    stagePresentingCandidates: 'Prezantohen Kandidatët',
    stageInterviews: 'Intervistat në Proçes',
    stageSelectionCompleted: 'Përzgjedhja u Përfundua',
    stageOfficialProcess: 'Proçesi Zyrtar / Viza',
    stageTravelPlanning: 'Planifikimi i Udhëtimit',
    stageCompleted: 'Përfunduar',
    stageCancelled: 'Anuluar',
    openDemandFilesBtn: 'Hap Skedarët',
    taskGroupTarget: 'Ekipi i Vendit të Synuar',
    taskGroupField: 'Ekipi i Fushës',
    taskEnterTravelData: 'Fut të dhënat e udhëtimit',
    taskPlanAccommodation: 'Planifiko akomodimin',
    taskManageSupport: 'Menaxho Mbështetjen',
    taskUpdateFieldStatus: 'Përditëso statusin e fushës',
    taskGroupManagement: 'Ekipi i Menaxhimit',
    taskAuditSystem: 'Auditimi i Sistemit',
    taskApproveStrategic: 'Miratimet Strategjike',
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
    completeRegBtn: 'إتمام التسجيل',
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
    signUpBtn: 'إنشاء حساب',
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
    certNo: 'رقم الشهادة',
    certificateNo: 'رقم الشهادة',
    issuingBodyLabel: 'جهة الإصدار',
    issuingBody: 'جهة الإصدار',
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

    signInMenu: 'تسجيل الدخول',
    signUpMenu: 'التسجيل',
    loginPortalTitle: 'بوابة تسجيل دخول أصحاب العمل',
    loginPortalSub: 'قم بتسجيل الدخول بريد الشركة الإلكتروني وكلمة المرور.',
    companyEmailLabel: 'البريد الإلكتروني للشركة',
    signUpPortalTitle: 'تسجيل صاحب العمل',
    signUpPortalSub: 'سجل شركتك لتقديم طلبات القوى العاملة.',
    employerRegTitle: 'تسجيل صاحب العمل',
    employerRegSub: 'سجل شركتك لتقديم طلبات القوى العاملة.',
    companyNameLabel: 'اسم الشركة',
    contactPersonLabel: 'الشخص المسؤول',
    completeSignUpBtn: 'إتمام التسجيل',
    demoLoginText: 'تسجيل تجريبي:',
    regSuccessHeader: 'تم التسجيل بنجاح!',
    regSuccessText: 'تم إنشاء حساب شركتك. يمكنك الآن تسجيل الدخول.',
    goToSignInBtn: 'الانتقال لتسجيل الدخول',

    empTabRequests: 'طلبات الموظفين',
    empTabCandidates: 'المرشحون / المطابقة',
    empTabInterviews: 'المقابلات',
    empTabSelected: 'المرشحون المختارون',
    empTabTravel: 'السفر والبداية',
    empTabSupport: 'الدعم / الإشعارات',
    empTabProfile: 'ملف الشركة',
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
    empProfileTitle: 'تحديث ملف الشركة والمعلومات',
    empProfileCompanyName: 'اسم الشركة',
    empProfileContactPerson: 'الشخص المسؤول',

    profileUpdateTitle: 'تحديث ملف الشركة والمعلومات',
    profileUpdateDesc: 'قم بتحديث تفاصيل شركتك وكلمة المرور من هنا.',
    countryLocationLabel: 'الدولة / الموقع',
    emailImmutableLabel: 'البريد الإلكتروني (ثابت)',
    emailReadonlyLabel: 'البريد الإلكتروني (ثابت)',
    updatingBtn: 'جاري التحديث...',
    saveChangesBtn: 'حفظ التغييرات',
    profileUpdatedSuccess: 'تم تحديث ملف الشركة بنجاح!',

    completed: 'مكتمل',
    approved: 'تم الموافقة',
    pending: 'قيد الانتظار',
    reviewing: 'قيد المراجعة',
    certificateno: 'رقم الشهادة',
    issuingbody: 'جهة الإصدار',
    sendnotification: 'إرسال إشعار',

    planned: 'مخطط',
    ticketed: 'تم اصدار التذكرة',
    flightNumber: 'رقم الرحلة',
    flightDateTime: 'تاريخ/وقت الرحلة',
    departureCityAirport: 'مدينة/مطار المغادرة',
    arrivalCityAirport: 'مدينة/مطار الوصول',
    pnrBookingCode: 'رمز الحجز PNR',
    accommodationTransferDetails: 'تفاصيل الإقامة والنقل',
    documentTrackingMechanism: 'آلية تتبع المستندات',
    selectTaskPrompt: 'اختر المهمة',
    taskGroupSource: 'فريق بلد المصدر',
    taskPassportCheck: 'فحص جواز السفر والمستندات',
    taskInterviewPlan: 'تخطيط المقابلة الأولية',
    taskRequestDocs: 'طلب المستندات المفقودة',
    taskUpdateCandidate: 'تحديث حالة المرشح',
    taskSaveDemand: 'حفظ طلب صاحب العمل',
    taskMatchCandidate: 'مطابقة المرشح',
    taskPrepareOffer: 'إعداد عرض العمل',
    taskTrackPerformance: 'متابعة الأداء 30/60/90 يوم',

    docPassportScan: 'مسح جواز السفر',
    docProfessionalCert: 'الشهادة المهنية',
    docCriminalRecord: 'السجل الجنائي',
    docHealthReport: 'التقرير الطبي',
    savedSuccess: 'تم الحفظ بنجاح',
    fillEmployerAndSalary: 'يرجى ملء تفاصيل صاحب العمل والراتب',
    offerSentSuccess: 'تم إرسال عرض العمل بنجاح',
    notificationSentSuccess: 'تم إرسال الإشعار بنجاح',
    returnToPortal: 'العودة إلى البوابة',
    saving: 'جاري الحفظ...',
    saveChanges: 'حفظ التغييرات',
    dossierClosedNotice: 'تم إغلاق الملف',
    reason: 'السبب',
    reopenProcess: 'إعادة فتح العملية',
    profileCredentialsManagement: 'إدارة الملف الشخصي وبيانات الاعتماد',
    phoneNumberGsm: 'رقم الهاتف (GSM)',
    emailAddress: 'عنوان البريد الإلكتروني',
    portalPassword: 'كلمة مرور البوابة',
    travelFlightLogistics: 'السفر والرحلات والخدمات اللوجستية',
    file: 'ملف',
    uploaded: 'تم الرفع',
    rejected: 'مرفوض',
    reRequested: 'إعادة الطلب',
    preview: 'معاينة',
    noFileUploaded: 'لم يتم رفع أي ملفات بعد',
    uploadFromComputer: 'رفع ملف من الكمبيوتر',
    newDocNamePlaceholder: 'اسم / نوع المستند',
    add: 'إضافة',
    professionalEvaluationCertificate: 'شهادة التقييم المهني',
    workVideoUrl: 'رابط فيديو العمل / التعريف',
    previewPlayVideo: 'معاينة وتشغيل الفيديو',
    internalNotesAdminOnly: 'ملاحظات داخلية (للإدارة فقط)',
    visaProcessing: 'تأشيرة قيد المعالجة',
    processClosureWithdrawal: 'إغلاق العملية / الانسحاب',
    closureDesc: 'أدخل سبباً لإنهاء أو إغلاق عملية طلب المرشح هذا.',
    closureReasonPlaceholder: 'اكتب سبب الإغلاق...',
    closeArchiveProcess: 'إغلاق / أرشفة العملية',
    sendOfficialJobOffer: 'إرسال عرض عمل رسمي',
    monthlyNetSalary: 'الراتب الشهري الصافي',
    startDate: 'تاريخ البدء',
    termsConditions: 'الشروط والأحكام',
    sendOfferToCandidate: 'إرسال العرض للمرشح',
    notificationTitle: 'عنوان الإشعار',
    messageBody: 'نص الرسالة',
    workVideoPreview: 'معاينة فيديو عمل المرشح',
    demandFilesTitle: 'ملفات الطلبات ومطابقات المرشحين',
    demandFilesSub: 'إدارة العمليات والمرشحين المرتبطين بهذا الطلب',
    lifecycleStatusLabel: 'حالة دورة الحياة',
    stageNewRequest: 'طلب جديد',
    stageReviewing: 'قيد المراجعة',
    stageSearchingCandidates: 'البحث عن مرشحين',
    stagePresentingCandidates: 'تقديم المرشحين',
    stageInterviews: 'المقابلات جارية',
    stageSelectionCompleted: 'اكتمل الاختيار',
    stageOfficialProcess: 'الإجراءات الرسمية / التأشيرة',
    stageTravelPlanning: 'تخطيط السفر',
    stageCompleted: 'مكتمل',
    stageCancelled: 'ملغي',
    openDemandFilesBtn: 'فتح الملفات',
    taskGroupTarget: 'فريق البلد المستهدف',
    taskGroupField: 'الفريق الميداني',
    taskEnterTravelData: 'إدخال بيانات السفر',
    taskPlanAccommodation: 'تخطيط الإقامة',
    taskManageSupport: 'إدارة الدعم',
    taskUpdateFieldStatus: 'تحديث الحالة الميدانية',
    taskGroupManagement: 'فريق الإدارة',
    taskAuditSystem: 'تدقيق النظام',
    taskApproveStrategic: 'الموافقات الاستراتيجية',
  },
};