import type { Language } from './dictionary';

export const dateLocale: Record<Language, string> = {
  tr: 'tr-TR',
  en: 'en-GB',
  sq: 'sq-AL',
  ar: 'ar',
  mk: 'mk-MK',
};

export function fill(template: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template);
}

type Opt = { value: string; label: string };
type Pos = { id: string; label: string };

export type PortalUi = {
  loading: string;
  candidateNotFound: string;
  employerNotFound: string;
  requestNotFound: string;
  errorPrefix: string;
  noChanges: string;
  demoTitle: string;
  signedIn: string;
  staffDeleted: string;
  general: string;
  specialist: string;
  unspecified: string;
  passwordsManaged: string;
  photoUpload: string;
  interviewOfferTitle: string;
  interviewOfferHint: string;
  exampleFlight: string;
  exampleFlightCode: string;
  exampleDeparture: string;
  exampleArrival: string;
  examplePnr: string;
  exampleStay: string;
  exampleCompany: string;
  exampleTerms: string;
  exampleNotifTitle: string;
  exampleMessage: string;
  certNoPh: string;
  issuerPh: string;
  docTitle: string;
  docApproved: string;
  docEmpty: string;
  docOpen: string;
  docValidUntil: string;
  docRequest: string;
  docTypes: Record<string, string>;
  docStatuses: Record<string, string>;
  officialTitle: string;
  officialUpdated: string;
  needOffer: string;
  followupSaved: string;
  steps: Record<string, string>;
  travelStartTitle: string;
  travel: string;
  flight: string;
  route: string;
  accommodation: string;
  employerStart: string;
  travelPlanned: string;
  travelTicketed: string;
  travelDone: string;
  noOffer: string;
  editFlightHint: string;
  startedBanner: string;
  markStarted: string;
  followupTitle: string;
  day: string;
  recorded: string;
  waiting: string;
  notMarkedStarted: string;
  checkDate: string;
  complianceScore: string;
  salaryOk: string;
  accommodationOk: string;
  employerFeedback: string;
  employeeFeedback: string;
  panovaNote: string;
  updateFollowup: string;
  saveFollowup: string;
  ioTitle: string;
  ioAllRequests: string;
  ioInterviews: string;
  ioJobOffers: string;
  ioEditInterview: string;
  ioNewInterview: string;
  ioEmployerNote: string;
  ioPanovaNote: string;
  ioEditOffer: string;
  ioNewOffer: string;
  ioCompany: string;
  ioPosition: string;
  ioNetSalary: string;
  ioTerms: string;
  ioSendOffer: string;
  ioPlan: string;
  ioScheduleRequired: string;
  ioOfferRequired: string;
  ioNetLine: string;
  intStatus: Record<string, string>;
  intResult: Record<string, string>;
  intNoResult: string;
  offerStatus: Record<string, string>;
  matchTitle: string;
  selectedOf: string;
  linkedCandidates: string;
  noneLinked: string;
  presentedOn: string;
  notPresented: string;
  present: string;
  suggested: string;
  searchCandidates: string;
  yearsFit: string;
  bind: string;
  confirmRemove: string;
  offer: string;
  interview: string;
  remove: string;
  close: string;
  matchResults: Record<string, string>;
  requestFields: Record<string, string>;
  requestBools: Record<string, string>;
  matchCandidates: string;
  requestInfo: string;
  status: string;
  closeReason: string;
  specialTerms: string;
  matchedCandidates: string;
  manage: string;
  noneBound: string;
  statMatched: string;
  statPresented: string;
  statSelected: string;
  statInterviews: string;
  statOffers: string;
  noInterviews: string;
  interviewsTitle: string;
  createdOn: string;
  employerWord: string;
  candidateWord: string;
  positionWord: string;
  employerFields: Record<string, string>;
  activeRequests: string;
  presentedCandidates: string;
  selectedCandidates: string;
  openIssues: string;
  companyContact: string;
  noRequests: string;
  headcountLine: string;
  presentedSelectedTitle: string;
  nonePresented: string;
  presentationOn: string;
  awaitingResult: string;
  interviewCount: string;
  openIssuesTitle: string;
  noOpenRecords: string;
  dueOn: string;
  registeredOn: string;
  employerInvite: {
    title: string;
    send: string;
    resend: string;
    noEmail: string;
    linked: string;
    invitedAt: string;
    sentInvite: string;
    sentReset: string;
    emailFailed: string;
    unavailable: string;
    cooldown: string;
    staffAccount: string;
    emailTaken: string;
    otherRole: string;
    forbidden: string;
    failed: string;
    localeLabel: string;
    consentTitle: string;
    consentLead: string;
    consentSave: string;
    consentFailed: string;
  };
  staffRestricted: string;
  staffInviteHint: string;
  sendInvite: string;
  edit: string;
  save: string;
  activeAccount: string;
  invitePending: string;
  accountUnlinked: string;
  upperManagementOnly: string;
  serverUnreadable: string;
  inviteSent: string;
  staffUpdated: string;
  updateFailed: string;
  confirmDeleteStaff: string;
  exportCsv: string;
  exportExcel: string;
  exportPrint: string;
  exportEmpty: string;
  offersExport: string;
  deleteRecord: string;
  deleteConfirmTitle: string;
  deleteConfirmBody: string;
  deleteDemoNote: string;
  deleteCodedNote: string;
  deleteFailed: string;
  deleted: string;
  empNoDemands: string;
  offerSalary: string;
  offerCurrency: string;
  offerStart: string;
  offerTerms: string;
  offerNetPerMonth: string;
  salaryNotSet: string;
  offerUpdateFailed: string;
  routeDenied: string;
  backToPortal: string;
  selectCountry: string;
  cancelAction: string;
  referralCode: string;
  referralCodeAll: string;
  referralCodeNone: string;
  referralCodeEmpty: string;
  referralCodeYours: string;
  referralCodeCopy: string;
  referralCodeCopied: string;
  referralFilterLabel: string;
  referralCodeImmutable: string;
  referralCodeOnInvite: string;
  referralCodeAutoAttach: string;
  sourceOfficerMissingCode: string;
  deleteOpenCandidate: string;
  confirmDeleteOpenCandidate: string;
  deleteOpenFailed: string;
  deleteOpenDone: string;
  registerCandidate: string;
  registerCandidateHint: string;
  registerCandidateOpenHint: string;
  registerCandidateSaved: string;
  registerCandidateFailed: string;
  unknownSupervisorCode: string;
  candidateListCount: string;
  refresh: string;
  taskSaveFailed: string;
  taskSaved: string;
  noAuditYet: string;
  employerFile: string;
  viewEmployerPortal: string;
  linkedRecord: string;
  noneOption: string;
  selectOption: string;
  linkCandidate: string;
  linkRequest: string;
  linkEmployer: string;
  cancelPrompt: string;
  cancelReasonLabel: string;
  returnToAdmin: string;
  authorized: string;
  languageOptions: Opt[];
  positions: { agriculture: Pos[]; construction: Pos[]; trade: Pos[] };
  durationDefault: string;
  yes: string;
  no: string;
  jobDesc: string;
  interviewNotPresented: string;
  interviewFailed: string;
  interviewSent: string;
  candidateSelectedAlert: string;
  onlineMeeting: string;
  planned: string;
  supportSubjectPh: string;
  supportMessagePh: string;
  demandSuccess: string;
  sectorLabel: string;
  positionLabel: string;
  headcountLabel: string;
  salaryLabel: string;
  experienceLabel: string;
  videoRequired: string;
  videoRequiredHint: string;
  certsWanted: string;
  certificates: Opt[];
  formExperience: Opt[];
  formSectors: Opt[];
  datePrefix: string;
  activeStatus: string;
  demoConstruction: string;
  demoAgriculture: string;
  demoFormwork: string;
  demoHarvestLead: string;
  sectorFallback: string;
};

const positions = {
  agriculture: ['harvest', 'greenhouse', 'pruning', 'tractor', 'mushroom', 'packing'],
  construction: ['formwork', 'rebar', 'masonry', 'welder', 'electrician', 'engineer', 'siteChief'],
  trade: ['warehouse', 'forklift', 'foreignTrade', 'logistics', 'accounting', 'sales'],
} as const;

function pos(labels: Record<(typeof positions.agriculture)[number] | (typeof positions.construction)[number] | (typeof positions.trade)[number], string>): PortalUi['positions'] {
  return {
    agriculture: positions.agriculture.map((id) => ({ id, label: labels[id] })),
    construction: positions.construction.map((id) => ({ id, label: labels[id] })),
    trade: positions.trade.map((id) => ({ id, label: labels[id] })),
  };
}

const tr: PortalUi = {
  loading: 'Yükleniyor...',
  candidateNotFound: 'Aday bulunamadı.',
  employerNotFound: 'İşveren bulunamadı.',
  requestNotFound: 'Talep bulunamadı.',
  errorPrefix: 'Hata:',
  noChanges: 'Değişiklik yok.',
  demoTitle: 'Demo kayıt. Canlıya geçişte silinir.',
  signedIn: 'Supabase Auth ile giriş yapıldı.',
  staffDeleted: 'Personel kaydı silindi.',
  general: 'Genel',
  specialist: 'Uzman',
  unspecified: 'Belirtilmemiş',
  passwordsManaged: 'Şifreler Supabase Auth ile yönetilir.',
  photoUpload: 'Fotoğraf yükle',
  interviewOfferTitle: 'Görüşme ve iş teklifi',
  interviewOfferHint: 'Görüşme planla ve teklif gönder.',
  exampleFlight: 'Örn: 15.10.2026 - 14:30',
  exampleFlightCode: 'Örn: TK-1926',
  exampleDeparture: 'Örn: Üsküp (SKP)',
  exampleArrival: 'Örn: İstanbul (IST)',
  examplePnr: 'Örn: X79R2A',
  exampleStay: 'Örn: Otel transferi dahil',
  exampleCompany: 'Örn: Panova Tarim DOO',
  exampleTerms: 'Konaklama dahil...',
  exampleNotifTitle: 'Örn: Pasaport hakkında',
  exampleMessage: 'Mesajınız...',
  certNoPh: 'Sertifika no',
  issuerPh: 'Veren kurum',
  docTitle: 'Belge durumu',
  docApproved: 'onaylı',
  docEmpty: 'Kayıtlı belge yok.',
  docOpen: 'Aç',
  docValidUntil: 'Geçerlilik:',
  docRequest: '+ Talep et',
  docTypes: {
    passport: 'Pasaport', cv: 'CV', certificate: 'Sertifika', diploma: 'Diploma',
    criminal_record: 'Sabıka kaydı', health_report: 'Sağlık raporu', photo: 'Fotoğraf',
    contract: 'Sözleşme', apostille: 'e-Apostil', other: 'Diğer',
  },
  docStatuses: {
    pending: 'Bekleniyor', uploaded: 'Yüklendi', reviewing: 'İnceleniyor', approved: 'Onaylandı',
    rejected: 'Reddedildi', rerequested: 'Yeniden istendi', expiring: 'Süresi doluyor', expired: 'Süresi doldu',
  },
  officialTitle: 'Resmî süreç durumu',
  officialUpdated: 'Resmî süreç güncellendi.',
  needOffer: 'Takip için önce kabul edilmiş bir iş teklifi (firma) olmalı.',
  followupSaved: 'Takip kaydedildi.',
  steps: {
    not_started: 'Başlamadı', documents_collecting: 'Evrak toplanıyor', work_permit_applied: 'Çalışma izni başvurusu',
    work_permit_approved: 'Çalışma izni onaylandı', visa_applied: 'Vize başvurusu', visa_approved: 'Vize onaylandı',
    ready_to_travel: 'Seyahate hazır', started_work: 'İşe başladı', rejected: 'Reddedildi / durdu',
  },
  travelStartTitle: 'Seyahat ve işe başlangıç',
  travel: 'Seyahat', flight: 'Uçuş', route: 'Güzergâh', accommodation: 'Konaklama', employerStart: 'İşveren / başlangıç',
  travelPlanned: 'Planlanıyor', travelTicketed: 'Biletlendi', travelDone: 'Tamamlandı',
  noOffer: 'Teklif yok',
  editFlightHint: 'Uçuş bilgilerini aşağıdaki seyahat, uçuş ve konaklama bölümünden düzenleyip kaydedin.',
  startedBanner: 'Aday işe başladı — 30/60/90 takibi aktif.',
  markStarted: 'İşe başladı olarak işaretle',
  followupTitle: '30 / 60 / 90 gün takibi',
  day: 'gün', recorded: 'Kaydedildi', waiting: 'Bekliyor',
  notMarkedStarted: 'Not: Aday henüz işe başladı olarak işaretlenmedi.',
  checkDate: 'Kontrol tarihi', complianceScore: 'Uyum puanı (1–5)',
  salaryOk: 'Maaş sözleşmeye uygun', accommodationOk: 'Konaklama uygun',
  employerFeedback: 'İşveren geri bildirimi', employeeFeedback: 'Çalışan geri bildirimi', panovaNote: 'Panova notu',
  updateFollowup: '{stage}. gün takibini güncelle', saveFollowup: '{stage}. gün takibini kaydet',
  ioTitle: 'Görüşme ve teklif', ioAllRequests: 'tüm talepler', ioInterviews: 'Görüşmeler', ioJobOffers: 'İş teklifleri',
  ioEditInterview: 'Görüşmeyi düzenle', ioNewInterview: 'Yeni görüşme planla',
  ioEmployerNote: 'İşveren notu', ioPanovaNote: 'PANOVA iç notu',
  ioEditOffer: 'Teklifi düzenle', ioNewOffer: 'Yeni iş teklifi (aday portalında görünür)',
  ioCompany: 'Firma adı', ioPosition: 'Pozisyon', ioNetSalary: 'Net maaş / ay',
  ioTerms: 'Şartlar: konaklama, yemek, ulaşım, sözleşme süresi, çalışma saatleri…',
  ioSendOffer: 'Teklifi gönder', ioPlan: 'Planla',
  ioScheduleRequired: 'Görüşme tarihi ve saatini girin.', ioOfferRequired: 'Firma adı ve net maaş zorunlu.',
  ioNetLine: '{amount} net/ay · başlangıç {date}',
  intStatus: { scheduled: 'Planlandı', completed: 'Tamamlandı', cancelled: 'İptal', no_show: 'Katılmadı' },
  intResult: { selected: 'Seçildi', backup: 'Yedek', rejected: 'Uygun değil' },
  intNoResult: 'Sonuç yok',
  offerStatus: { pending: 'Adayın yanıtı bekleniyor', accepted: 'Kabul edildi', rejected: 'Reddedildi', withdrawn: 'Geri çekildi' },
  matchTitle: 'Aday eşleştirme', selectedOf: 'Seçilen {selected}/{total}',
  linkedCandidates: 'Bağlı adaylar', noneLinked: 'Henüz aday bağlanmadı.',
  presentedOn: 'Sunuldu {date}', notPresented: 'Sunulmadı', present: 'Sun',
  suggested: 'Önerilen adaylar', searchCandidates: 'İsim, meslek veya uyruk ara…',
  yearsFit: '{years} yıl · uyum {score}/5', bind: 'Bağla',
  confirmRemove: 'Bu eşleşme kaldırılsın mı?', offer: 'Teklif', interview: 'Görüşme', remove: 'Kaldır', close: 'Kapat',
  matchResults: { interview: 'Görüşmeye çağrıldı', selected: 'Seçildi', backup: 'Yedek', later: 'Daha sonra', not_suitable: 'Uygun değil' },
  requestFields: {
    position_title: 'Pozisyon', sector: 'Sektör', headcount: 'Kişi sayısı', target_start_date: 'Hedef başlangıç',
    monthly_net_salary: 'Aylık net maaş', working_hours: 'Çalışma saatleri', weekly_days: 'Haftalık gün',
    overtime_conditions: 'Mesai koşulları', contract_type: 'Sözleşme tipi', required_experience_years: 'Gerekli deneyim (yıl)',
    required_language: 'Dil şartı', country: 'Ülke', city: 'Şehir',
  },
  requestBools: {
    accommodation_provided: 'Konaklama', food_provided: 'Yemek', transport_provided: 'Ulaşım',
    flight_covered: 'Uçak bileti', required_certificate: 'Sertifika şartı',
  },
  matchCandidates: 'Aday eşleştir', requestInfo: 'Talep bilgileri', status: 'Durum', closeReason: 'Kapanış nedeni',
  specialTerms: 'Özel şartlar', matchedCandidates: 'Eşleşen adaylar', manage: 'Yönet', noneBound: 'Henüz aday bağlanmadı.',
  statMatched: 'Eşleşen aday', statPresented: 'Sunulan', statSelected: 'Seçilen', statInterviews: 'Görüşme', statOffers: 'Teklif (kabul)',
  noInterviews: 'Görüşme yok.', interviewsTitle: 'Görüşmeler', createdOn: 'Oluşturma: {date}',
  employerWord: 'İşveren', candidateWord: 'Aday', positionWord: 'Pozisyon',
  employerFields: {
    company_name: 'Şirket unvanı', contact_person: 'Yetkili kişi', contact_name: 'İkinci irtibat', email: 'E-posta', phone: 'Telefon',
    country: 'Ülke', city: 'Şehir', website: 'Web sitesi', address: 'Adres', tax_id: 'Vergi no',
    assigned_sector: 'Sektör', compliance_status: 'Uyum durumu', suitability_status: 'Uygunluk durumu', notes: 'İç notlar',
  },
  activeRequests: 'Aktif talep', presentedCandidates: 'Sunulan aday', selectedCandidates: 'Seçilen aday',
  openIssues: 'Açık sorun / görev', companyContact: 'Firma ve iletişim bilgileri', noRequests: 'Talep yok.',
  headcountLine: '{n} kişi · {place} · Başlangıç {date}',
  presentedSelectedTitle: 'Sunulan / seçilen adaylar', nonePresented: 'Henüz aday sunulmadı.',
  presentationOn: 'Sunum {date}', awaitingResult: 'Sonuç bekleniyor', interviewCount: 'Görüşme kaydı: {n}',
  openIssuesTitle: 'Açık sorunlar ve görevler', noOpenRecords: 'Açık kayıt yok.', dueOn: 'Son {date}',
  registeredOn: 'Kayıt: {date}',
  employerInvite: {
    title: 'Giriş hesabı',
    send: 'Giriş daveti gönder',
    resend: 'Şifre bağlantısı gönder',
    noEmail: 'İletişim e-postası yok. Davet için önce e-posta kaydedin.',
    linked: 'Hesap bağlı',
    invitedAt: 'Davet: {date}',
    sentInvite: 'Davet e-postası gönderildi. Kişi bağlantıyla şifre belirler veya aynı adresle Google ile giriş yapar.',
    sentReset: 'Şifre bağlantısı gönderildi.',
    emailFailed: 'Kayıt güncellendi ancak e-posta gönderilemedi. Kısa bir süre sonra yeniden deneyin.',
    unavailable: 'E-posta servisi şu an kullanılamıyor.',
    cooldown: 'Yeniden göndermek için {seconds} saniye bekleyin.',
    staffAccount: 'Bu e-posta bir personel hesabına ait. Personel hesabı işveren yapılmaz.',
    emailTaken: 'Bu e-posta başka bir işveren kaydına bağlı.',
    otherRole: 'Bu e-posta başka bir portal hesabına ait. Bağlanamaz.',
    forbidden: 'Bu işveren için davet gönderme yetkiniz yok.',
    failed: 'Davet gönderilemedi.',
    localeLabel: 'Davet dili',
    consentTitle: 'Aydınlatma metni',
    consentLead: 'İşveren portalına girmeden önce KVKK aydınlatma metnini kabul edin.',
    consentSave: 'Kabul edip devam et',
    consentFailed: 'Onay kaydedilemedi. Yeniden deneyin.',
  },
  staffRestricted: 'Bu alanı görüntülemek için üst yönetim yetkisi gereklidir.',
  staffInviteHint: 'Şifre belirlenmez. Kişiye davet e-postası gider; aynı e-posta ile Google veya e-posta kaydıyla portala girdiğinde hesabı otomatik bağlanır.',
  sendInvite: 'Davet gönder', edit: 'Düzenle', save: 'Kaydet', activeAccount: 'Aktif hesap',
  invitePending: 'Davet bekliyor ({date})', accountUnlinked: 'Hesap bağlı değil',
  upperManagementOnly: 'Bu işlem için üst yönetim yetkisi gereklidir.',
  serverUnreadable: 'Sunucu yanıtı okunamadı.',
  inviteSent: 'Davet e-postası gönderildi. Personel bu e-posta ile Google veya e-posta kaydıyla portala giriş yaptığında hesabı otomatik bağlanır.',
  staffUpdated: 'Personel bilgileri güncellendi.', updateFailed: 'Güncelleme hatası:',
  confirmDeleteStaff: 'Bu personel kaydını silmek istediğinizden emin misiniz?',
  exportCsv: 'CSV indir',
  exportExcel: 'Excel indir',
  exportPrint: 'Yazdır / PDF',
  exportEmpty: 'Dışa aktarılacak kayıt yok.',
  offersExport: 'Teklifleri dışa aktar',
  deleteRecord: 'Sil',
  deleteConfirmTitle: 'Kayıt silinsin mi?',
  deleteConfirmBody: '{name} kalıcı olarak silinir. Bu işlem geri alınamaz.',
  deleteDemoNote: 'Bu bir demo kaydıdır.',
  deleteCodedNote: 'Bu adayın yönlendirme kodu var: {code}.',
  deleteFailed: 'Silinemedi. Yetkinizi kontrol edin.',
  deleted: 'Kayıt silindi.',
  empNoDemands: 'Henüz işgücü talebi yok. Yukarıdaki formdan ilk talebinizi oluşturun.',
  offerSalary: 'Ücret',
  offerCurrency: 'Para birimi',
  offerStart: 'Başlangıç',
  offerTerms: 'Şartlar',
  offerNetPerMonth: 'net / ay',
  salaryNotSet: 'Ücret girilmemiş',
  offerUpdateFailed: 'Teklif güncellenemedi. Oturumunuzu kontrol edin.',
  routeDenied: 'Bu sayfa sizin rolünüz için açık değil.',
  backToPortal: 'Portala dön',
  selectCountry: 'Ülke seçin',
  cancelAction: 'Vazgeç',
  referralCode: 'Yönlendirme kodu',
  referralCodeAll: 'Tüm kodlar',
  referralCodeNone: 'Kodsuz / açık kayıt',
  referralCodeEmpty: '—',
  referralCodeYours: 'Sizin kodunuz',
  referralCodeCopy: 'Kopyala',
  referralCodeCopied: 'Kopyalandı',
  referralFilterLabel: 'Koda göre süz',
  referralCodeImmutable: 'Sistem atar. Atandıktan sonra değiştirilemez.',
  referralCodeOnInvite: 'Kaynak ülke sorumlusu davet edildiğinde veya bu rol verildiğinde sistem benzersiz bir yönlendirme kodu atar. Kod elle yazılmaz ve sonradan değiştirilemez.',
  referralCodeAutoAttach: 'Bu aday, sistemin size atadığı yönlendirme koduna bağlanır. Kodsuz kayıt seçilemez.',
  sourceOfficerMissingCode: 'Bu kaynak ülke sorumlusunun yönlendirme kodu yok. Rolü yeniden kaydedin ki sistem bir kod atasın.',
  deleteOpenCandidate: 'Açık kaydı sil',
  confirmDeleteOpenCandidate: 'Bu kodsuz açık kaydı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
  deleteOpenFailed: 'Aday silinemedi:',
  deleteOpenDone: 'Açık kayıt silindi.',
  registerCandidate: 'Aday kaydet',
  registerCandidateHint: 'Bu aday sizin yönlendirme kodunuza bağlanır: {code}',
  registerCandidateOpenHint: 'Kod seçilmezse aday açık kayıt olarak kalır. Üst yönetim, mevcut bir kaynak ülke sorumlusu kodunu da seçebilir.',
  registerCandidateSaved: 'Aday kaydedildi.',
  registerCandidateFailed: 'Aday kaydedilemedi:',
  unknownSupervisorCode: 'Bu yönlendirme kodu bir kaynak ülke sorumlusuna ait değil.',
  candidateListCount: 'Aday listesi ({shown} / {total})',
  refresh: 'Yenile',
  taskSaveFailed: 'Görev kaydedilirken hata oluştu:', taskSaved: 'Görev kaydedildi ve sorumlu personele iletildi.',
  noAuditYet: 'Henüz kayıt yok.', employerFile: 'İşveren dosyası', viewEmployerPortal: 'İşveren portalını gör',
  linkedRecord: 'Bağlı kayıt (opsiyonel)', noneOption: 'Yok', selectOption: 'Seçin…',
  linkCandidate: 'Aday', linkRequest: 'Talep', linkEmployer: 'İşveren',
  cancelPrompt: 'İptal nedenini yazın:', cancelReasonLabel: 'İptal nedeni:',
  returnToAdmin: 'Yönetim paneline dön', authorized: 'Yetkili: {name}',
  languageOptions: [
    { value: 'none', label: 'Gerekli değil / temel' },
    { value: 'en-mid', label: 'İngilizce (orta seviye)' },
    { value: 'tr-good', label: 'Türkçe (iyi derece)' },
    { value: 'local', label: 'Yerel dil (Arnavutça / Makedonca)' },
  ],
  positions: pos({
    harvest: 'Hasat işçisi', greenhouse: 'Sera sorumlusu', pruning: 'Budama uzmanı', tractor: 'Traktör operatörü',
    mushroom: 'Mantar yetiştirme uzmanı', packing: 'Paketleme elemanı', formwork: 'Kalıp ustası', rebar: 'Demirci',
    masonry: 'Duvarcı / sıvacı', welder: 'Kaynakçı', electrician: 'Elektrikçi', engineer: 'İnşaat mühendisi',
    siteChief: 'Şantiye şefi', warehouse: 'Depo sorumlusu', forklift: 'Forklift operatörü', foreignTrade: 'Dış ticaret uzmanı',
    logistics: 'Lojistik sorumlusu', accounting: 'Ön muhasebe', sales: 'Satış temsilcisi',
  }),
  durationDefault: '12 ay (sezonluk / tam zamanlı)',
  yes: 'Var', no: 'Yok',
  jobDesc: 'Süre: {duration} | Tecrübe: {experience} | Dil: {language} | Konaklama: {stay} | Yemek: {food} | Ulaşım: {transport} | Notlar: {notes}',
  interviewNotPresented: 'Bu aday henüz talebinize sunulmamış; görüşme talebi oluşturulamadı.',
  interviewFailed: 'Görüşme talebi oluşturulamadı:',
  interviewSent: '"{name}" için görüşme talebi operasyon ekibine iletildi.',
  candidateSelectedAlert: '"{name}" seçilen adaylar listenize eklendi ve vize süreci başlatıldı.',
  onlineMeeting: 'Çevrimiçi video görüşme',
  planned: 'Planlandı',
  supportSubjectPh: 'Örn: Yeni ihtiyaç / çalışan sorunu',
  supportMessagePh: 'Detayları yazın...',
  demandSuccess: 'Talep oluşturuldu ve panele eklendi.',
  sectorLabel: 'Sektör', positionLabel: 'Pozisyon / unvan', headcountLabel: 'Kişi sayısı', salaryLabel: 'Maaş / şartlar',
  experienceLabel: 'Deneyim süresi', videoRequired: 'Zorunlu video mülakat',
  videoRequiredHint: 'Adayların başvururken ön mülakat videosu yüklemesi zorunlu olsun.',
  certsWanted: 'Aranan belge ve sertifikalar',
  certificates: [
    { value: 'license-b', label: 'B sınıfı sürücü belgesi' },
    { value: 'vocational', label: 'Usta öğreticilik / mesleki yeterlilik' },
    { value: 'diploma', label: 'Ziraat / mühendislik diploması' },
    { value: 'welder-iso', label: 'Kaynakçı sertifikası (EN ISO)' },
    { value: 'safety', label: 'İnşaat / iş güvenliği sertifikası' },
    { value: 'travel-clear', label: 'Uluslararası seyahat engeli yok' },
  ],
  formExperience: [
    { value: '1-2', label: '1–2 yıl' },
    { value: '3-5', label: '3–5 yıl' },
    { value: '5-10', label: '5–10 yıl' },
    { value: '10+', label: '10+ yıl (usta)' },
  ],
  formSectors: [
    { value: 'agriculture', label: 'Tarım ve hayvancılık' },
    { value: 'construction', label: 'İnşaat ve yapı' },
    { value: 'hospitality', label: 'Turizm ve otelcilik' },
    { value: 'logistics', label: 'Lojistik ve taşımacılık' },
    { value: 'manufacturing', label: 'Genel üretim ve sanayi' },
    { value: 'care', label: 'Sağlık ve bakım' },
  ],
  datePrefix: 'Tarih:', activeStatus: 'Aktif',
  demoConstruction: 'İnşaat ustası (kalıpçı)', demoAgriculture: 'Tarım işçisi (hasat)',
  demoFormwork: 'Kalıp ustası', demoHarvestLead: 'Hasat sorumlusu',
  sectorFallback: 'Tarım / inşaat',
};

const en: PortalUi = {
  loading: 'Loading...',
  candidateNotFound: 'Candidate not found.',
  employerNotFound: 'Employer not found.',
  requestNotFound: 'Request not found.',
  errorPrefix: 'Error:',
  noChanges: 'No changes.',
  demoTitle: 'Demo record. Removed when live data is wiped.',
  signedIn: 'Signed in with Supabase Auth.',
  staffDeleted: 'Staff record deleted.',
  general: 'General',
  specialist: 'Specialist',
  unspecified: 'Not specified',
  passwordsManaged: 'Passwords are managed with Supabase Auth.',
  photoUpload: 'Upload photo',
  interviewOfferTitle: 'Interview and job offer',
  interviewOfferHint: 'Schedule an interview and send an offer.',
  exampleFlight: 'e.g. 15.10.2026 - 14:30',
  exampleFlightCode: 'e.g. TK-1926',
  exampleDeparture: 'e.g. Skopje (SKP)',
  exampleArrival: 'e.g. Istanbul (IST)',
  examplePnr: 'e.g. X79R2A',
  exampleStay: 'e.g. Hotel transfer included',
  exampleCompany: 'e.g. Panova Tarim DOO',
  exampleTerms: 'Accommodation included...',
  exampleNotifTitle: 'e.g. About the passport',
  exampleMessage: 'Your message...',
  certNoPh: 'Certificate no.',
  issuerPh: 'Issuing body',
  docTitle: 'Document status',
  docApproved: 'approved',
  docEmpty: 'No saved documents.',
  docOpen: 'Open',
  docValidUntil: 'Valid until:',
  docRequest: '+ Request',
  docTypes: {
    passport: 'Passport', cv: 'CV', certificate: 'Certificate', diploma: 'Diploma',
    criminal_record: 'Criminal record', health_report: 'Health report', photo: 'Photo',
    contract: 'Contract', apostille: 'e-Apostille', other: 'Other',
  },
  docStatuses: {
    pending: 'Waiting', uploaded: 'Uploaded', reviewing: 'In review', approved: 'Approved',
    rejected: 'Rejected', rerequested: 'Requested again', expiring: 'Expiring', expired: 'Expired',
  },
  officialTitle: 'Official process status',
  officialUpdated: 'Official process updated.',
  needOffer: 'Follow-up needs an accepted job offer (company) first.',
  followupSaved: 'Follow-up saved.',
  steps: {
    not_started: 'Not started', documents_collecting: 'Collecting documents', work_permit_applied: 'Work permit applied',
    work_permit_approved: 'Work permit approved', visa_applied: 'Visa applied', visa_approved: 'Visa approved',
    ready_to_travel: 'Ready to travel', started_work: 'Started work', rejected: 'Rejected / stopped',
  },
  travelStartTitle: 'Travel and start of work',
  travel: 'Travel', flight: 'Flight', route: 'Route', accommodation: 'Accommodation', employerStart: 'Employer / start',
  travelPlanned: 'Planning', travelTicketed: 'Ticketed', travelDone: 'Completed',
  noOffer: 'No offer',
  editFlightHint: 'Edit flight details in the travel, flight and accommodation section below, then save.',
  startedBanner: 'The candidate has started work — 30/60/90 follow-up is active.',
  markStarted: 'Mark as started work',
  followupTitle: '30 / 60 / 90 day follow-up',
  day: 'day', recorded: 'Saved', waiting: 'Waiting',
  notMarkedStarted: 'Note: The candidate is not marked as started work yet.',
  checkDate: 'Check date', complianceScore: 'Compliance score (1–5)',
  salaryOk: 'Salary matches the contract', accommodationOk: 'Accommodation is suitable',
  employerFeedback: 'Employer feedback', employeeFeedback: 'Employee feedback', panovaNote: 'Panova note',
  updateFollowup: 'Update day {stage} follow-up', saveFollowup: 'Save day {stage} follow-up',
  ioTitle: 'Interview and offer', ioAllRequests: 'all requests', ioInterviews: 'Interviews', ioJobOffers: 'Job offers',
  ioEditInterview: 'Edit interview', ioNewInterview: 'Schedule a new interview',
  ioEmployerNote: 'Employer note', ioPanovaNote: 'PANOVA internal note',
  ioEditOffer: 'Edit offer', ioNewOffer: 'New job offer (visible in the candidate portal)',
  ioCompany: 'Company name', ioPosition: 'Position', ioNetSalary: 'Net salary / month',
  ioTerms: 'Terms: accommodation, meals, transport, contract length, working hours…',
  ioSendOffer: 'Send offer', ioPlan: 'Schedule',
  ioScheduleRequired: 'Enter the interview date and time.', ioOfferRequired: 'Company name and net salary are required.',
  ioNetLine: '{amount} net/month · start {date}',
  intStatus: { scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No show' },
  intResult: { selected: 'Selected', backup: 'Backup', rejected: 'Not suitable' },
  intNoResult: 'No result',
  offerStatus: { pending: 'Waiting for the candidate', accepted: 'Accepted', rejected: 'Rejected', withdrawn: 'Withdrawn' },
  matchTitle: 'Match candidates', selectedOf: 'Selected {selected}/{total}',
  linkedCandidates: 'Linked candidates', noneLinked: 'No candidate linked yet.',
  presentedOn: 'Presented {date}', notPresented: 'Not presented', present: 'Present',
  suggested: 'Suggested candidates', searchCandidates: 'Search name, profession or nationality…',
  yearsFit: '{years} years · fit {score}/5', bind: 'Link',
  confirmRemove: 'Remove this match?', offer: 'Offer', interview: 'Interview', remove: 'Remove', close: 'Close',
  matchResults: { interview: 'Called to interview', selected: 'Selected', backup: 'Backup', later: 'Later', not_suitable: 'Not suitable' },
  requestFields: {
    position_title: 'Position', sector: 'Sector', headcount: 'Headcount', target_start_date: 'Target start',
    monthly_net_salary: 'Monthly net salary', working_hours: 'Working hours', weekly_days: 'Days per week',
    overtime_conditions: 'Overtime terms', contract_type: 'Contract type', required_experience_years: 'Required experience (years)',
    required_language: 'Language requirement', country: 'Country', city: 'City',
  },
  requestBools: {
    accommodation_provided: 'Accommodation', food_provided: 'Meals', transport_provided: 'Transport',
    flight_covered: 'Flight ticket', required_certificate: 'Certificate required',
  },
  matchCandidates: 'Match candidates', requestInfo: 'Request details', status: 'Status', closeReason: 'Closure reason',
  specialTerms: 'Special terms', matchedCandidates: 'Matched candidates', manage: 'Manage', noneBound: 'No candidate linked yet.',
  statMatched: 'Matched candidates', statPresented: 'Presented', statSelected: 'Selected', statInterviews: 'Interviews', statOffers: 'Offers (accepted)',
  noInterviews: 'No interviews.', interviewsTitle: 'Interviews', createdOn: 'Created: {date}',
  employerWord: 'Employer', candidateWord: 'Candidate', positionWord: 'Position',
  employerFields: {
    company_name: 'Company name', contact_person: 'Contact person', contact_name: 'Second contact', email: 'Email', phone: 'Phone',
    country: 'Country', city: 'City', website: 'Website', address: 'Address', tax_id: 'Tax no.',
    assigned_sector: 'Sector', compliance_status: 'Compliance status', suitability_status: 'Suitability', notes: 'Internal notes',
  },
  activeRequests: 'Active requests', presentedCandidates: 'Presented candidates', selectedCandidates: 'Selected candidates',
  openIssues: 'Open issues / tasks', companyContact: 'Company and contact details', noRequests: 'No requests.',
  headcountLine: '{n} people · {place} · Start {date}',
  presentedSelectedTitle: 'Presented / selected candidates', nonePresented: 'No candidate presented yet.',
  presentationOn: 'Presented {date}', awaitingResult: 'Awaiting result', interviewCount: 'Interview records: {n}',
  openIssuesTitle: 'Open issues and tasks', noOpenRecords: 'No open records.', dueOn: 'Due {date}',
  registeredOn: 'Registered: {date}',
  employerInvite: {
    title: 'Portal login',
    send: 'Send login invitation',
    resend: 'Send password link',
    noEmail: 'No contact email. Save an email before sending an invitation.',
    linked: 'Account linked',
    invitedAt: 'Invited: {date}',
    sentInvite: 'Invitation sent. They set a password from the link, or sign in with Google using the same address.',
    sentReset: 'Password link sent.',
    emailFailed: 'The record was updated, but the email was not sent. Try again shortly.',
    unavailable: 'Email delivery is unavailable right now.',
    cooldown: 'Wait {seconds} seconds before sending again.',
    staffAccount: 'This email belongs to a staff account. A staff account is not turned into an employer.',
    emailTaken: 'This email is already linked to another employer.',
    otherRole: 'This email belongs to another portal account and cannot be linked.',
    forbidden: 'You cannot send an invitation for this employer.',
    failed: 'The invitation could not be sent.',
    localeLabel: 'Invitation language',
    consentTitle: 'Privacy notice',
    consentLead: 'Accept the privacy notice before entering the employer portal.',
    consentSave: 'Accept and continue',
    consentFailed: 'Consent could not be saved. Try again.',
  },
  staffRestricted: 'Upper management permission is required to view this area.',
  staffInviteHint: 'No password is set. An invite email is sent. When they sign in with Google or email using that address, the account links automatically.',
  sendInvite: 'Send invite', edit: 'Edit', save: 'Save', activeAccount: 'Active account',
  invitePending: 'Invite pending ({date})', accountUnlinked: 'Account not linked',
  upperManagementOnly: 'Upper management permission is required for this action.',
  serverUnreadable: 'The server response could not be read.',
  inviteSent: 'Invite email sent. The account links automatically when they sign in with Google or email at that address.',
  staffUpdated: 'Staff details updated.', updateFailed: 'Update error:',
  confirmDeleteStaff: 'Delete this staff record?',
  exportCsv: 'Download CSV',
  exportExcel: 'Download Excel',
  exportPrint: 'Print / PDF',
  exportEmpty: 'Nothing to export.',
  offersExport: 'Export offers',
  deleteRecord: 'Delete',
  deleteConfirmTitle: 'Delete this record?',
  deleteConfirmBody: '{name} is deleted permanently. This cannot be undone.',
  deleteDemoNote: 'This is a demo record.',
  deleteCodedNote: 'This candidate has a referral code: {code}.',
  deleteFailed: 'Could not delete. Check your permission.',
  deleted: 'Record deleted.',
  empNoDemands: 'No labour requests yet. Create the first one with the form above.',
  offerSalary: 'Salary',
  offerCurrency: 'Currency',
  offerStart: 'Start',
  offerTerms: 'Terms',
  offerNetPerMonth: 'net / month',
  salaryNotSet: 'Salary not set',
  offerUpdateFailed: 'The offer could not be updated. Check your session.',
  routeDenied: 'This page is not open for your role.',
  backToPortal: 'Back to the portal',
  selectCountry: 'Select a country',
  cancelAction: 'Cancel',
  referralCode: 'Referral code',
  referralCodeAll: 'All codes',
  referralCodeNone: 'No code / open registration',
  referralCodeEmpty: '—',
  referralCodeYours: 'Your code',
  referralCodeCopy: 'Copy',
  referralCodeCopied: 'Copied',
  referralFilterLabel: 'Filter by code',
  referralCodeImmutable: 'Assigned by the system. It cannot be changed.',
  referralCodeOnInvite: 'Inviting a source-country officer, or giving someone that role, assigns a unique referral code. Staff cannot type it, and it cannot be changed later.',
  referralCodeAutoAttach: 'This candidate is linked to the referral code the system assigned to you. Open registration is not available.',
  sourceOfficerMissingCode: 'This source-country officer has no referral code. Save the role again so the system can assign one.',
  deleteOpenCandidate: 'Delete open registration',
  confirmDeleteOpenCandidate: 'Delete this open registration with no code? This cannot be undone.',
  deleteOpenFailed: 'Could not delete the candidate:',
  deleteOpenDone: 'Open registration deleted.',
  registerCandidate: 'Register candidate',
  registerCandidateHint: 'This candidate is linked to your referral code: {code}',
  registerCandidateOpenHint: 'Leave the code empty to keep an open registration. Upper management can also choose an existing source-country officer code.',
  registerCandidateSaved: 'Candidate registered.',
  registerCandidateFailed: 'Could not register the candidate:',
  unknownSupervisorCode: 'That referral code does not belong to a source-country officer.',
  candidateListCount: 'Candidate list ({shown} / {total})',
  refresh: 'Refresh',
  taskSaveFailed: 'The task could not be saved:', taskSaved: 'Task saved and sent to the assignee.',
  noAuditYet: 'No records yet.', employerFile: 'Employer file', viewEmployerPortal: 'View employer portal',
  linkedRecord: 'Linked record (optional)', noneOption: 'None', selectOption: 'Select…',
  linkCandidate: 'Candidate', linkRequest: 'Request', linkEmployer: 'Employer',
  cancelPrompt: 'Enter the cancellation reason:', cancelReasonLabel: 'Cancellation reason:',
  returnToAdmin: 'Back to staff portal', authorized: 'Contact: {name}',
  languageOptions: [
    { value: 'none', label: 'Not required / basic' },
    { value: 'en-mid', label: 'English (intermediate)' },
    { value: 'tr-good', label: 'Turkish (good)' },
    { value: 'local', label: 'Local language (Albanian / Macedonian)' },
  ],
  positions: pos({
    harvest: 'Harvest worker', greenhouse: 'Greenhouse lead', pruning: 'Pruning specialist', tractor: 'Tractor operator',
    mushroom: 'Mushroom growing specialist', packing: 'Packing worker', formwork: 'Formwork carpenter', rebar: 'Rebar worker',
    masonry: 'Mason / plasterer', welder: 'Welder', electrician: 'Electrician', engineer: 'Civil engineer',
    siteChief: 'Site manager', warehouse: 'Warehouse lead', forklift: 'Forklift operator', foreignTrade: 'Foreign trade specialist',
    logistics: 'Logistics lead', accounting: 'Bookkeeping', sales: 'Sales representative',
  }),
  durationDefault: '12 months (seasonal / full time)',
  yes: 'Yes', no: 'No',
  jobDesc: 'Duration: {duration} | Experience: {experience} | Language: {language} | Accommodation: {stay} | Meals: {food} | Transport: {transport} | Notes: {notes}',
  interviewNotPresented: 'This candidate has not been presented to your request yet, so the interview could not be created.',
  interviewFailed: 'Interview request failed:',
  interviewSent: 'The interview request for "{name}" was sent to our operations team.',
  candidateSelectedAlert: '"{name}" was added to your selected candidates and the visa process has started.',
  onlineMeeting: 'Online video meeting',
  planned: 'Scheduled',
  supportSubjectPh: 'e.g. New need / employee issue',
  supportMessagePh: 'Write the details...',
  demandSuccess: 'The request was created and added to the board.',
  sectorLabel: 'Sector', positionLabel: 'Position / title', headcountLabel: 'Headcount', salaryLabel: 'Salary / terms',
  experienceLabel: 'Experience', videoRequired: 'Video interview required',
  videoRequiredHint: 'Candidates must upload a pre-interview video when they apply.',
  certsWanted: 'Required documents and certificates',
  certificates: [
    { value: 'license-b', label: 'Category B driving licence' },
    { value: 'vocational', label: 'Vocational instructor / qualification' },
    { value: 'diploma', label: 'Agriculture / engineering diploma' },
    { value: 'welder-iso', label: 'Welder certificate (EN ISO)' },
    { value: 'safety', label: 'Construction / safety certificate' },
    { value: 'travel-clear', label: 'No international travel restriction' },
  ],
  formExperience: [
    { value: '1-2', label: '1–2 years' },
    { value: '3-5', label: '3–5 years' },
    { value: '5-10', label: '5–10 years' },
    { value: '10+', label: '10+ years (master)' },
  ],
  formSectors: [
    { value: 'agriculture', label: 'Agriculture and livestock' },
    { value: 'construction', label: 'Construction' },
    { value: 'hospitality', label: 'Tourism and hospitality' },
    { value: 'logistics', label: 'Logistics and transport' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'care', label: 'Health and care' },
  ],
  datePrefix: 'Date:', activeStatus: 'Active',
  demoConstruction: 'Construction carpenter (formwork)', demoAgriculture: 'Farm worker (harvest)',
  demoFormwork: 'Formwork carpenter', demoHarvestLead: 'Harvest lead',
  sectorFallback: 'Agriculture / construction',
};

const sq: PortalUi = {
  loading: 'Duke u ngarkuar...',
  candidateNotFound: 'Kandidati nuk u gjet.',
  employerNotFound: 'Punëdhënësi nuk u gjet.',
  requestNotFound: 'Kërkesa nuk u gjet.',
  errorPrefix: 'Gabim:',
  noChanges: 'Nuk ka ndryshime.',
  demoTitle: 'Regjistrim demo. Fshihet kur kalohen të dhënat e gjalla.',
  signedIn: 'Hyrje me Supabase Auth.',
  staffDeleted: 'Regjistrimi i stafit u fshi.',
  general: 'E përgjithshme',
  specialist: 'Specialist',
  unspecified: 'E papërcaktuar',
  passwordsManaged: 'Fjalëkalimet menaxhohen me Supabase Auth.',
  photoUpload: 'Ngarko foto',
  interviewOfferTitle: 'Intervistë dhe ofertë pune',
  interviewOfferHint: 'Planifikoni intervistën dhe dërgoni ofertën.',
  exampleFlight: 'p.sh. 15.10.2026 - 14:30',
  exampleFlightCode: 'p.sh. TK-1926',
  exampleDeparture: 'p.sh. Shkup (SKP)',
  exampleArrival: 'p.sh. Stamboll (IST)',
  examplePnr: 'p.sh. X79R2A',
  exampleStay: 'p.sh. Transferte hoteli e përfshirë',
  exampleCompany: 'p.sh. Panova Tarim DOO',
  exampleTerms: 'Akomodimi i përfshirë...',
  exampleNotifTitle: 'p.sh. Rreth pasaportës',
  exampleMessage: 'Mesazhi juaj...',
  certNoPh: 'Nr. i certifikatës',
  issuerPh: 'Institucioni lëshues',
  docTitle: 'Statusi i dokumenteve',
  docApproved: 'të miratuara',
  docEmpty: 'Nuk ka dokumente të regjistruara.',
  docOpen: 'Hap',
  docValidUntil: 'E vlefshme deri:',
  docRequest: '+ Kërko',
  docTypes: {
    passport: 'Pasaportë', cv: 'CV', certificate: 'Certifikatë', diploma: 'Diplomë',
    criminal_record: 'Dëshmi penaliteti', health_report: 'Raport mjekësor', photo: 'Fotografi',
    contract: 'Kontratë', apostille: 'e-Apostil', other: 'Tjetër',
  },
  docStatuses: {
    pending: 'Në pritje', uploaded: 'Ngarkuar', reviewing: 'Në shqyrtim', approved: 'Miratuar',
    rejected: 'Refuzuar', rerequested: 'Kërkuar sërish', expiring: 'Po skadon', expired: 'Ka skaduar',
  },
  officialTitle: 'Statusi zyrtar i procesit',
  officialUpdated: 'Procesi zyrtar u përditësua.',
  needOffer: 'Për ndjekje duhet së pari një ofertë pune e pranuar (kompani).',
  followupSaved: 'Ndjekja u ruajt.',
  steps: {
    not_started: 'Nuk ka filluar', documents_collecting: 'Po mblidhen dokumentet', work_permit_applied: 'Kërkesë për leje pune',
    work_permit_approved: 'Leja e punës u miratua', visa_applied: 'Kërkesë për vizë', visa_approved: 'Viza u miratua',
    ready_to_travel: 'Gati për udhëtim', started_work: 'Filloi punën', rejected: 'Refuzuar / ndalur',
  },
  travelStartTitle: 'Udhëtimi dhe fillimi i punës',
  travel: 'Udhëtimi', flight: 'Fluturimi', route: 'Itinerari', accommodation: 'Akomodimi', employerStart: 'Punëdhënësi / fillimi',
  travelPlanned: 'Po planifikohet', travelTicketed: 'Bileta u lëshua', travelDone: 'Përfunduar',
  noOffer: 'Nuk ka ofertë',
  editFlightHint: 'Ndryshoni të dhënat e fluturimit te seksioni i udhëtimit, fluturimit dhe akomodimit më poshtë, pastaj ruani.',
  startedBanner: 'Kandidati ka filluar punën — ndjekja 30/60/90 është aktive.',
  markStarted: 'Shëno si ka filluar punën',
  followupTitle: 'Ndjekja 30 / 60 / 90 ditë',
  day: 'ditë', recorded: 'Ruajtur', waiting: 'Në pritje',
  notMarkedStarted: 'Shënim: Kandidati ende nuk është shënuar se ka filluar punën.',
  checkDate: 'Data e kontrollit', complianceScore: 'Pikët e përputhjes (1–5)',
  salaryOk: 'Paga përputhet me kontratën', accommodationOk: 'Akomodimi është i përshtatshëm',
  employerFeedback: 'Reagimi i punëdhënësit', employeeFeedback: 'Reagimi i punonjësit', panovaNote: 'Shënim i Panova',
  updateFollowup: 'Përditëso ndjekjen e ditës {stage}', saveFollowup: 'Ruaj ndjekjen e ditës {stage}',
  ioTitle: 'Intervistë dhe ofertë', ioAllRequests: 'të gjitha kërkesat', ioInterviews: 'Intervistat', ioJobOffers: 'Ofertat e punës',
  ioEditInterview: 'Ndrysho intervistën', ioNewInterview: 'Planifiko intervistë të re',
  ioEmployerNote: 'Shënim i punëdhënësit', ioPanovaNote: 'Shënim i brendshëm PANOVA',
  ioEditOffer: 'Ndrysho ofertën', ioNewOffer: 'Ofertë e re pune (duket te portali i kandidatit)',
  ioCompany: 'Emri i kompanisë', ioPosition: 'Pozicioni', ioNetSalary: 'Paga neto / muaj',
  ioTerms: 'Kushtet: akomodimi, ushqimi, transporti, kohëzgjatja e kontratës, orari…',
  ioSendOffer: 'Dërgo ofertën', ioPlan: 'Planifiko',
  ioScheduleRequired: 'Vendosni datën dhe orën e intervistës.', ioOfferRequired: 'Emri i kompanisë dhe paga neto janë të detyrueshme.',
  ioNetLine: '{amount} neto/muaj · fillimi {date}',
  intStatus: { scheduled: 'Planifikuar', completed: 'Përfunduar', cancelled: 'Anuluar', no_show: 'Nuk erdhi' },
  intResult: { selected: 'Zgjedhur', backup: 'Rezervë', rejected: 'Nuk përshtatet' },
  intNoResult: 'Pa rezultat',
  offerStatus: { pending: 'Pret përgjigjen e kandidatit', accepted: 'Pranuar', rejected: 'Refuzuar', withdrawn: 'Tërhequr' },
  matchTitle: 'Përputhja e kandidatëve', selectedOf: 'Zgjedhur {selected}/{total}',
  linkedCandidates: 'Kandidatë të lidhur', noneLinked: 'Ende nuk është lidhur asnjë kandidat.',
  presentedOn: 'Paraqitur {date}', notPresented: 'Nuk është paraqitur', present: 'Paraqit',
  suggested: 'Kandidatë të sugjeruar', searchCandidates: 'Kërko emër, profesion ose shtetësi…',
  yearsFit: '{years} vite · përputhje {score}/5', bind: 'Lidh',
  confirmRemove: 'Të hiqet kjo përputhje?', offer: 'Ofertë', interview: 'Intervistë', remove: 'Hiq', close: 'Mbyll',
  matchResults: { interview: 'Thirrur në intervistë', selected: 'Zgjedhur', backup: 'Rezervë', later: 'Më vonë', not_suitable: 'Nuk përshtatet' },
  requestFields: {
    position_title: 'Pozicioni', sector: 'Sektori', headcount: 'Numri i personave', target_start_date: 'Fillimi i synuar',
    monthly_net_salary: 'Paga neto mujore', working_hours: 'Orari i punës', weekly_days: 'Ditë në javë',
    overtime_conditions: 'Kushtet e jashtë orarit', contract_type: 'Lloji i kontratës', required_experience_years: 'Përvoja e kërkuar (vite)',
    required_language: 'Kërkesa e gjuhës', country: 'Shteti', city: 'Qyteti',
  },
  requestBools: {
    accommodation_provided: 'Akomodimi', food_provided: 'Ushqimi', transport_provided: 'Transporti',
    flight_covered: 'Bileta e avionit', required_certificate: 'Kërkohet certifikatë',
  },
  matchCandidates: 'Përputh kandidatët', requestInfo: 'Të dhënat e kërkesës', status: 'Statusi', closeReason: 'Arsyeja e mbylljes',
  specialTerms: 'Kushte të veçanta', matchedCandidates: 'Kandidatë të përputhur', manage: 'Menaxho', noneBound: 'Ende nuk është lidhur asnjë kandidat.',
  statMatched: 'Kandidatë të përputhur', statPresented: 'Të paraqitur', statSelected: 'Të zgjedhur', statInterviews: 'Intervista', statOffers: 'Oferta (të pranuara)',
  noInterviews: 'Nuk ka intervista.', interviewsTitle: 'Intervistat', createdOn: 'Krijuar: {date}',
  employerWord: 'Punëdhënësi', candidateWord: 'Kandidati', positionWord: 'Pozicioni',
  employerFields: {
    company_name: 'Emri i kompanisë', contact_person: 'Personi i kontaktit', contact_name: 'Kontakti i dytë', email: 'Email', phone: 'Telefon',
    country: 'Shteti', city: 'Qyteti', website: 'Faqja e internetit', address: 'Adresa', tax_id: 'Nr. tatimor',
    assigned_sector: 'Sektori', compliance_status: 'Statusi i përputhjes', suitability_status: 'Përshtatshmëria', notes: 'Shënime të brendshme',
  },
  activeRequests: 'Kërkesa aktive', presentedCandidates: 'Kandidatë të paraqitur', selectedCandidates: 'Kandidatë të zgjedhur',
  openIssues: 'Çështje / detyra të hapura', companyContact: 'Kompania dhe kontaktet', noRequests: 'Nuk ka kërkesa.',
  headcountLine: '{n} persona · {place} · Fillimi {date}',
  presentedSelectedTitle: 'Kandidatë të paraqitur / të zgjedhur', nonePresented: 'Ende nuk është paraqitur asnjë kandidat.',
  presentationOn: 'Paraqitja {date}', awaitingResult: 'Pret rezultatin', interviewCount: 'Regjistrime intervistash: {n}',
  openIssuesTitle: 'Çështje dhe detyra të hapura', noOpenRecords: 'Nuk ka regjistrime të hapura.', dueOn: 'Afati {date}',
  registeredOn: 'Regjistruar: {date}',
  employerInvite: {
    title: 'Hyrja në portal',
    send: 'Dërgo ftesën e hyrjes',
    resend: 'Dërgo lidhjen e fjalëkalimit',
    noEmail: 'Nuk ka email kontakti. Ruani një email para se të dërgoni ftesën.',
    linked: 'Llogaria është lidhur',
    invitedAt: 'Ftesa: {date}',
    sentInvite: 'Ftesa u dërgua. Vendosin fjalëkalimin nga lidhja ose hyjnë me Google në të njëjtën adresë.',
    sentReset: 'Lidhja e fjalëkalimit u dërgua.',
    emailFailed: 'Regjistrimi u përditësua, por emaili nuk u dërgua. Provoni përsëri pas pak.',
    unavailable: 'Dërgimi i emailit nuk është i disponueshëm tani.',
    cooldown: 'Prisni {seconds} sekonda para se të dërgoni përsëri.',
    staffAccount: 'Ky email i përket një llogarie stafi. Llogaria e stafit nuk kthehet në punëdhënës.',
    emailTaken: 'Ky email është lidhur me një punëdhënës tjetër.',
    otherRole: 'Ky email i përket një llogarie tjetër portali dhe nuk mund të lidhet.',
    forbidden: 'Nuk mund të dërgoni ftesë për këtë punëdhënës.',
    failed: 'Ftesa nuk u dërgua.',
    localeLabel: 'Gjuha e ftesës',
    consentTitle: 'Njoftimi i privatësisë',
    consentLead: 'Pranoni njoftimin e privatësisë para se të hyni në portalin e punëdhënësit.',
    consentSave: 'Prano dhe vazhdo',
    consentFailed: 'Pëlqimi nuk u ruajt. Provoni përsëri.',
  },
  staffRestricted: 'Për ta parë këtë zonë duhet leja e menaxhimit të lartë.',
  staffInviteHint: 'Nuk caktohet fjalëkalim. Dërgohet një email ftese. Kur hyjnë me Google ose email në atë adresë, llogaria lidhet vetë.',
  sendInvite: 'Dërgo ftesën', edit: 'Ndrysho', save: 'Ruaj', activeAccount: 'Llogari aktive',
  invitePending: 'Ftesa në pritje ({date})', accountUnlinked: 'Llogaria nuk është lidhur',
  upperManagementOnly: 'Për këtë veprim duhet leja e menaxhimit të lartë.',
  serverUnreadable: 'Përgjigjja e serverit nuk u lexua.',
  inviteSent: 'Emaili i ftesës u dërgua. Llogaria lidhet vetë kur hyjnë me Google ose email në atë adresë.',
  staffUpdated: 'Të dhënat e stafit u përditësuan.', updateFailed: 'Gabim përditësimi:',
  confirmDeleteStaff: 'Të fshihet ky regjistrim stafi?',
  exportCsv: 'Shkarko CSV',
  exportExcel: 'Shkarko Excel',
  exportPrint: 'Printo / PDF',
  exportEmpty: 'Nuk ka të dhëna për eksport.',
  offersExport: 'Eksporto ofertat',
  deleteRecord: 'Fshi',
  deleteConfirmTitle: 'Të fshihet ky regjistrim?',
  deleteConfirmBody: '{name} fshihet përgjithmonë. Ky veprim nuk kthehet.',
  deleteDemoNote: 'Ky është një regjistrim demo.',
  deleteCodedNote: 'Ky kandidat ka kod referimi: {code}.',
  deleteFailed: 'Nuk u fshi. Kontrolloni lejen.',
  deleted: 'Regjistrimi u fshi.',
  empNoDemands: 'Ende nuk ka kërkesa për punë. Krijoni të parën me formularin më sipër.',
  offerSalary: 'Paga',
  offerCurrency: 'Monedha',
  offerStart: 'Fillimi',
  offerTerms: 'Kushtet',
  offerNetPerMonth: 'neto / muaj',
  salaryNotSet: 'Paga nuk është vendosur',
  offerUpdateFailed: 'Oferta nuk u përditësua. Kontrolloni sesionin.',
  routeDenied: 'Kjo faqe nuk është e hapur për rolin tuaj.',
  backToPortal: 'Kthehu te portali',
  selectCountry: 'Zgjidhni vendin',
  cancelAction: 'Anulo',
  referralCode: 'Kodi i referimit',
  referralCodeAll: 'Të gjitha kodet',
  referralCodeNone: 'Pa kod / regjistrim i hapur',
  referralCodeEmpty: '—',
  referralCodeYours: 'Kodi juaj',
  referralCodeCopy: 'Kopjo',
  referralCodeCopied: 'U kopjua',
  referralFilterLabel: 'Filtro sipas kodit',
  referralCodeImmutable: 'Caktohet nga sistemi. Nuk mund të ndryshohet pasi është caktuar.',
  referralCodeOnInvite: 'Kur ftohet një përgjegjës i vendit burim, ose kur i jepet ai rol, sistemi cakton një kod unik referimi. Personeli nuk e shkruan dhe nuk mund ta ndryshojë më vonë.',
  referralCodeAutoAttach: 'Ky kandidat lidhet me kodin e referimit që sistemi ju ka caktuar. Regjistrimi i hapur nuk është i mundur.',
  sourceOfficerMissingCode: 'Ky përgjegjës i vendit burim nuk ka kod referimi. Ruani rolin sërish që sistemi të caktojë një kod.',
  deleteOpenCandidate: 'Fshi regjistrimin e hapur',
  confirmDeleteOpenCandidate: 'Të fshihet ky regjistrim i hapur pa kod? Veprimi nuk kthehet.',
  deleteOpenFailed: 'Kandidati nuk u fshi:',
  deleteOpenDone: 'Regjistrimi i hapur u fshi.',
  registerCandidate: 'Regjistro kandidatin',
  registerCandidateHint: 'Ky kandidat lidhet me kodin tuaj të referimit: {code}',
  registerCandidateOpenHint: 'Lëreni kodin bosh që të mbetet regjistrim i hapur. Menaxhimi i lartë mund të zgjedhë edhe një kod ekzistues të përgjegjësit të vendit burim.',
  registerCandidateSaved: 'Kandidati u regjistrua.',
  registerCandidateFailed: 'Kandidati nuk u regjistrua:',
  unknownSupervisorCode: 'Ky kod referimi nuk i përket një përgjegjësi të vendit burim.',
  candidateListCount: 'Lista e kandidatëve ({shown} / {total})',
  refresh: 'Rifresko',
  taskSaveFailed: 'Detyra nuk u ruajt:', taskSaved: 'Detyra u ruajt dhe iu dërgua përgjegjësit.',
  noAuditYet: 'Ende nuk ka regjistrime.', employerFile: 'Dosja e punëdhënësit', viewEmployerPortal: 'Shiko portalin e punëdhënësit',
  linkedRecord: 'Regjistrim i lidhur (opsional)', noneOption: 'Asnjë', selectOption: 'Zgjidhni…',
  linkCandidate: 'Kandidati', linkRequest: 'Kërkesa', linkEmployer: 'Punëdhënësi',
  cancelPrompt: 'Shkruani arsyen e anulimit:', cancelReasonLabel: 'Arsyeja e anulimit:',
  returnToAdmin: 'Kthehu te portali i stafit', authorized: 'Kontakt: {name}',
  languageOptions: [
    { value: 'none', label: 'Nuk kërkohet / bazë' },
    { value: 'en-mid', label: 'Anglisht (nivel i mesëm)' },
    { value: 'tr-good', label: 'Turqisht (mirë)' },
    { value: 'local', label: 'Gjuhë lokale (shqip / maqedonisht)' },
  ],
  positions: pos({
    harvest: 'Punëtor korrjeje', greenhouse: 'Përgjegjës sere', pruning: 'Specialist krasitjeje', tractor: 'Operator traktori',
    mushroom: 'Specialist i kultivimit të kërpudhave', packing: 'Punëtor paketimi', formwork: 'Usta kallëpi', rebar: 'Hekurkthyes',
    masonry: 'Murator / suvatues', welder: 'Saldues', electrician: 'Elektricist', engineer: 'Inxhinier ndërtimi',
    siteChief: 'Shef kantieri', warehouse: 'Përgjegjës magazine', forklift: 'Operator forklifti', foreignTrade: 'Specialist i tregtisë së jashtme',
    logistics: 'Përgjegjës logjistike', accounting: 'Kontabilitet bazë', sales: 'Përfaqësues shitjesh',
  }),
  durationDefault: '12 muaj (sezonale / kohë e plotë)',
  yes: 'Po', no: 'Jo',
  jobDesc: 'Kohëzgjatja: {duration} | Përvoja: {experience} | Gjuha: {language} | Akomodimi: {stay} | Ushqimi: {food} | Transporti: {transport} | Shënime: {notes}',
  interviewNotPresented: 'Ky kandidat ende nuk është paraqitur te kërkesa juaj, ndaj intervista nuk u krijua.',
  interviewFailed: 'Kërkesa për intervistë dështoi:',
  interviewSent: 'Kërkesa e intervistës për "{name}" iu dërgua ekipit të operacioneve.',
  candidateSelectedAlert: '"{name}" u shtua te kandidatët e zgjedhur dhe procesi i vizës filloi.',
  onlineMeeting: 'Takim video online',
  planned: 'Planifikuar',
  supportSubjectPh: 'p.sh. Nevojë e re / problem i punonjësit',
  supportMessagePh: 'Shkruani detajet...',
  demandSuccess: 'Kërkesa u krijua dhe u shtua në panel.',
  sectorLabel: 'Sektori', positionLabel: 'Pozicioni / titulli', headcountLabel: 'Numri i personave', salaryLabel: 'Paga / kushtet',
  experienceLabel: 'Kohëzgjatja e përvojës', videoRequired: 'Intervistë video e detyrueshme',
  videoRequiredHint: 'Kandidatët duhet të ngarkojnë një video para-interviste kur aplikojnë.',
  certsWanted: 'Dokumentet dhe certifikatat e kërkuara',
  certificates: [
    { value: 'license-b', label: 'Leje drejtimi kategoria B' },
    { value: 'vocational', label: 'Instruktor zanati / kualifikim profesional' },
    { value: 'diploma', label: 'Diplomë bujqësie / inxhinierie' },
    { value: 'welder-iso', label: 'Certifikatë saldatori (EN ISO)' },
    { value: 'safety', label: 'Certifikatë ndërtimi / sigurie' },
    { value: 'travel-clear', label: 'Pa pengesë për udhëtim ndërkombëtar' },
  ],
  formExperience: [
    { value: '1-2', label: '1–2 vite' },
    { value: '3-5', label: '3–5 vite' },
    { value: '5-10', label: '5–10 vite' },
    { value: '10+', label: '10+ vite (usta)' },
  ],
  formSectors: [
    { value: 'agriculture', label: 'Bujqësi dhe blegtori' },
    { value: 'construction', label: 'Ndërtim' },
    { value: 'hospitality', label: 'Turizëm dhe hoteleri' },
    { value: 'logistics', label: 'Logjistikë dhe transport' },
    { value: 'manufacturing', label: 'Prodhim i përgjithshëm' },
    { value: 'care', label: 'Shëndet dhe kujdes' },
  ],
  datePrefix: 'Data:', activeStatus: 'Aktive',
  demoConstruction: 'Usta ndërtimi (kallëp)', demoAgriculture: 'Punëtor bujqësie (korrje)',
  demoFormwork: 'Usta kallëpi', demoHarvestLead: 'Përgjegjës korrjeje',
  sectorFallback: 'Bujqësi / ndërtim',
};

const ar: PortalUi = {
  loading: 'جارٍ التحميل...',
  candidateNotFound: 'لم يُعثر على المرشح.',
  employerNotFound: 'لم يُعثر على صاحب العمل.',
  requestNotFound: 'لم يُعثر على الطلب.',
  errorPrefix: 'خطأ:',
  noChanges: 'لا توجد تغييرات.',
  demoTitle: 'سجل تجريبي. يُحذف عند مسح بيانات التجربة.',
  signedIn: 'تم تسجيل الدخول عبر Supabase Auth.',
  staffDeleted: 'حُذف سجل الموظف.',
  general: 'عام',
  specialist: 'متخصص',
  unspecified: 'غير محدد',
  passwordsManaged: 'تُدار كلمات المرور عبر Supabase Auth.',
  photoUpload: 'رفع صورة',
  interviewOfferTitle: 'المقابلة وعرض العمل',
  interviewOfferHint: 'حددوا موعد المقابلة وأرسلوا العرض.',
  exampleFlight: 'مثال: 15.10.2026 - 14:30',
  exampleFlightCode: 'مثال: TK-1926',
  exampleDeparture: 'مثال: سكوبيه (SKP)',
  exampleArrival: 'مثال: إسطنبول (IST)',
  examplePnr: 'مثال: X79R2A',
  exampleStay: 'مثال: نقل إلى الفندق مشمول',
  exampleCompany: 'مثال: Panova Tarim DOO',
  exampleTerms: 'السكن مشمول...',
  exampleNotifTitle: 'مثال: بخصوص جواز السفر',
  exampleMessage: 'رسالتكم...',
  certNoPh: 'رقم الشهادة',
  issuerPh: 'الجهة المصدرة',
  docTitle: 'حالة المستندات',
  docApproved: 'معتمدة',
  docEmpty: 'لا توجد مستندات محفوظة.',
  docOpen: 'فتح',
  docValidUntil: 'صالحة حتى:',
  docRequest: '+ طلب',
  docTypes: {
    passport: 'جواز السفر', cv: 'سيرة ذاتية', certificate: 'شهادة', diploma: 'دبلوم',
    criminal_record: 'سجل جنائي', health_report: 'تقرير صحي', photo: 'صورة',
    contract: 'عقد', apostille: 'تصديق إلكتروني', other: 'أخرى',
  },
  docStatuses: {
    pending: 'بانتظار', uploaded: 'مرفوع', reviewing: 'قيد المراجعة', approved: 'معتمد',
    rejected: 'مرفوض', rerequested: 'طُلب مجددًا', expiring: 'قارب على الانتهاء', expired: 'منتهٍ',
  },
  officialTitle: 'حالة الإجراءات الرسمية',
  officialUpdated: 'تم تحديث الإجراءات الرسمية.',
  needOffer: 'المتابعة تحتاج أولًا إلى عرض عمل مقبول (شركة).',
  followupSaved: 'تم حفظ المتابعة.',
  steps: {
    not_started: 'لم يبدأ', documents_collecting: 'جمع المستندات', work_permit_applied: 'طلب تصريح عمل',
    work_permit_approved: 'تصريح العمل معتمد', visa_applied: 'طلب تأشيرة', visa_approved: 'التأشيرة معتمدة',
    ready_to_travel: 'جاهز للسفر', started_work: 'بدأ العمل', rejected: 'مرفوض / متوقف',
  },
  travelStartTitle: 'السفر وبدء العمل',
  travel: 'السفر', flight: 'الرحلة', route: 'المسار', accommodation: 'السكن', employerStart: 'صاحب العمل / البدء',
  travelPlanned: 'قيد التخطيط', travelTicketed: 'صدرت التذكرة', travelDone: 'مكتمل',
  noOffer: 'لا يوجد عرض',
  editFlightHint: 'عدّلوا بيانات الرحلة في قسم السفر والرحلة والسكن أدناه ثم احفظوا.',
  startedBanner: 'بدأ المرشح العمل — متابعة 30/60/90 نشطة.',
  markStarted: 'تعليم كبدء عمل',
  followupTitle: 'متابعة 30 / 60 / 90 يومًا',
  day: 'يوم', recorded: 'محفوظ', waiting: 'بانتظار',
  notMarkedStarted: 'ملاحظة: لم يُعلَّم المرشح بعد بأنه بدأ العمل.',
  checkDate: 'تاريخ المراجعة', complianceScore: 'درجة الالتزام (1–5)',
  salaryOk: 'الراتب مطابق للعقد', accommodationOk: 'السكن مناسب',
  employerFeedback: 'ملاحظات صاحب العمل', employeeFeedback: 'ملاحظات الموظف', panovaNote: 'ملاحظة بانوفا',
  updateFollowup: 'تحديث متابعة اليوم {stage}', saveFollowup: 'حفظ متابعة اليوم {stage}',
  ioTitle: 'المقابلة والعرض', ioAllRequests: 'كل الطلبات', ioInterviews: 'المقابلات', ioJobOffers: 'عروض العمل',
  ioEditInterview: 'تعديل المقابلة', ioNewInterview: 'جدولة مقابلة جديدة',
  ioEmployerNote: 'ملاحظة صاحب العمل', ioPanovaNote: 'ملاحظة داخلية لبانوفا',
  ioEditOffer: 'تعديل العرض', ioNewOffer: 'عرض عمل جديد (يظهر في بوابة المرشح)',
  ioCompany: 'اسم الشركة', ioPosition: 'المنصب', ioNetSalary: 'الراتب الصافي / شهر',
  ioTerms: 'الشروط: السكن، الوجبات، النقل، مدة العقد، ساعات العمل…',
  ioSendOffer: 'إرسال العرض', ioPlan: 'جدولة',
  ioScheduleRequired: 'أدخلوا تاريخ المقابلة ووقتها.', ioOfferRequired: 'اسم الشركة والراتب الصافي مطلوبان.',
  ioNetLine: '{amount} صافٍ/شهر · البدء {date}',
  intStatus: { scheduled: 'مجدولة', completed: 'مكتملة', cancelled: 'ملغاة', no_show: 'لم يحضر' },
  intResult: { selected: 'مختار', backup: 'احتياطي', rejected: 'غير مناسب' },
  intNoResult: 'بلا نتيجة',
  offerStatus: { pending: 'بانتظار رد المرشح', accepted: 'مقبول', rejected: 'مرفوض', withdrawn: 'مسحوب' },
  matchTitle: 'مطابقة المرشحين', selectedOf: 'المختار {selected}/{total}',
  linkedCandidates: 'المرشحون المرتبطون', noneLinked: 'لم يُربط أي مرشح بعد.',
  presentedOn: 'قُدّم {date}', notPresented: 'لم يُقدَّم', present: 'تقديم',
  suggested: 'مرشحون مقترحون', searchCandidates: 'ابحثوا بالاسم أو المهنة أو الجنسية…',
  yearsFit: '{years} سنوات · ملاءمة {score}/5', bind: 'ربط',
  confirmRemove: 'إزالة هذه المطابقة؟', offer: 'عرض', interview: 'مقابلة', remove: 'إزالة', close: 'إغلاق',
  matchResults: { interview: 'دُعي إلى مقابلة', selected: 'مختار', backup: 'احتياطي', later: 'لاحقًا', not_suitable: 'غير مناسب' },
  requestFields: {
    position_title: 'المنصب', sector: 'القطاع', headcount: 'عدد الأشخاص', target_start_date: 'تاريخ البدء المستهدف',
    monthly_net_salary: 'الراتب الشهري الصافي', working_hours: 'ساعات العمل', weekly_days: 'أيام الأسبوع',
    overtime_conditions: 'شروط العمل الإضافي', contract_type: 'نوع العقد', required_experience_years: 'الخبرة المطلوبة (سنوات)',
    required_language: 'شرط اللغة', country: 'الدولة', city: 'المدينة',
  },
  requestBools: {
    accommodation_provided: 'السكن', food_provided: 'الوجبات', transport_provided: 'النقل',
    flight_covered: 'تذكرة الطيران', required_certificate: 'شهادة مطلوبة',
  },
  matchCandidates: 'مطابقة المرشحين', requestInfo: 'بيانات الطلب', status: 'الحالة', closeReason: 'سبب الإغلاق',
  specialTerms: 'شروط خاصة', matchedCandidates: 'المرشحون المطابقون', manage: 'إدارة', noneBound: 'لم يُربط أي مرشح بعد.',
  statMatched: 'مرشحون مطابقون', statPresented: 'المقدمون', statSelected: 'المختارون', statInterviews: 'المقابلات', statOffers: 'العروض (المقبولة)',
  noInterviews: 'لا توجد مقابلات.', interviewsTitle: 'المقابلات', createdOn: 'تاريخ الإنشاء: {date}',
  employerWord: 'صاحب العمل', candidateWord: 'المرشح', positionWord: 'المنصب',
  employerFields: {
    company_name: 'اسم الشركة', contact_person: 'شخص الاتصال', contact_name: 'جهة اتصال ثانية', email: 'البريد', phone: 'الهاتف',
    country: 'الدولة', city: 'المدينة', website: 'الموقع', address: 'العنوان', tax_id: 'الرقم الضريبي',
    assigned_sector: 'القطاع', compliance_status: 'حالة الالتزام', suitability_status: 'الملاءمة', notes: 'ملاحظات داخلية',
  },
  activeRequests: 'طلبات نشطة', presentedCandidates: 'مرشحون مقدمون', selectedCandidates: 'مرشحون مختارون',
  openIssues: 'مشكلات / مهام مفتوحة', companyContact: 'الشركة وبيانات الاتصال', noRequests: 'لا توجد طلبات.',
  headcountLine: '{n} أشخاص · {place} · البدء {date}',
  presentedSelectedTitle: 'المرشحون المقدمون / المختارون', nonePresented: 'لم يُقدَّم أي مرشح بعد.',
  presentationOn: 'التقديم {date}', awaitingResult: 'بانتظار النتيجة', interviewCount: 'سجلات المقابلات: {n}',
  openIssuesTitle: 'المشكلات والمهام المفتوحة', noOpenRecords: 'لا توجد سجلات مفتوحة.', dueOn: 'الاستحقاق {date}',
  registeredOn: 'التسجيل: {date}',
  employerInvite: {
    title: 'دخول البوابة',
    send: 'إرسال دعوة الدخول',
    resend: 'إرسال رابط كلمة المرور',
    noEmail: 'لا يوجد بريد اتصال. احفظ بريدًا قبل إرسال الدعوة.',
    linked: 'الحساب مربوط',
    invitedAt: 'الدعوة: {date}',
    sentInvite: 'أُرسلت الدعوة. يحدد كلمة المرور من الرابط أو يدخل عبر Google بنفس العنوان.',
    sentReset: 'أُرسل رابط كلمة المرور.',
    emailFailed: 'تم تحديث السجل لكن لم يُرسل البريد. أعد المحاولة بعد قليل.',
    unavailable: 'إرسال البريد غير متاح الآن.',
    cooldown: 'انتظر {seconds} ثانية قبل الإرسال مرة أخرى.',
    staffAccount: 'هذا البريد لحساب موظف. لا يُحوَّل حساب الموظف إلى صاحب عمل.',
    emailTaken: 'هذا البريد مربوط بصاحب عمل آخر.',
    otherRole: 'هذا البريد لحساب بوابة آخر ولا يمكن ربطه.',
    forbidden: 'لا يمكنك إرسال دعوة لصاحب العمل هذا.',
    failed: 'تعذر إرسال الدعوة.',
    localeLabel: 'لغة الدعوة',
    consentTitle: 'إشعار الخصوصية',
    consentLead: 'اقبل إشعار الخصوصية قبل دخول بوابة صاحب العمل.',
    consentSave: 'قبول ومتابعة',
    consentFailed: 'تعذر حفظ الموافقة. أعد المحاولة.',
  },
  staffRestricted: 'عرض هذا القسم يتطلب صلاحية الإدارة العليا.',
  staffInviteHint: 'لا تُحدَّد كلمة مرور. يُرسل بريد دعوة. عند الدخول عبر Google أو البريد على ذلك العنوان تُربط الحسابات تلقائيًا.',
  sendInvite: 'إرسال الدعوة', edit: 'تعديل', save: 'حفظ', activeAccount: 'حساب نشط',
  invitePending: 'الدعوة بانتظار ({date})', accountUnlinked: 'الحساب غير مربوط',
  upperManagementOnly: 'هذا الإجراء يتطلب صلاحية الإدارة العليا.',
  serverUnreadable: 'تعذر قراءة رد الخادم.',
  inviteSent: 'أُرسل بريد الدعوة. يُربط الحساب تلقائيًا عند الدخول عبر Google أو البريد على ذلك العنوان.',
  staffUpdated: 'تم تحديث بيانات الموظف.', updateFailed: 'خطأ في التحديث:',
  confirmDeleteStaff: 'حذف سجل الموظف هذا؟',
  exportCsv: 'تنزيل CSV',
  exportExcel: 'تنزيل Excel',
  exportPrint: 'طباعة / PDF',
  exportEmpty: 'لا توجد سجلات للتصدير.',
  offersExport: 'تصدير العروض',
  deleteRecord: 'حذف',
  deleteConfirmTitle: 'حذف هذا السجل؟',
  deleteConfirmBody: 'يُحذف {name} نهائيًا. لا يمكن التراجع.',
  deleteDemoNote: 'هذا سجل تجريبي.',
  deleteCodedNote: 'لهذا المرشح رمز إحالة: {code}.',
  deleteFailed: 'تعذر الحذف. تحقق من الصلاحية.',
  deleted: 'تم حذف السجل.',
  empNoDemands: 'لا توجد طلبات عمالة بعد. أنشئ أول طلب من النموذج أعلاه.',
  offerSalary: 'الأجر',
  offerCurrency: 'العملة',
  offerStart: 'البداية',
  offerTerms: 'الشروط',
  offerNetPerMonth: 'صافي / شهر',
  salaryNotSet: 'الأجر غير محدد',
  offerUpdateFailed: 'تعذر تحديث العرض. تحقق من الجلسة.',
  routeDenied: 'هذه الصفحة غير متاحة لدورك.',
  backToPortal: 'العودة إلى البوابة',
  selectCountry: 'اختر الدولة',
  cancelAction: 'إلغاء',
  referralCode: 'رمز الإحالة',
  referralCodeAll: 'كل الرموز',
  referralCodeNone: 'بدون رمز / تسجيل مفتوح',
  referralCodeEmpty: '—',
  referralCodeYours: 'رمزك',
  referralCodeCopy: 'نسخ',
  referralCodeCopied: 'تم النسخ',
  referralFilterLabel: 'تصفية حسب الرمز',
  referralCodeImmutable: 'يعيّنه النظام. لا يمكن تغييره بعد التعيين.',
  referralCodeOnInvite: 'عند دعوة مسؤول بلد المصدر، أو عند منحه هذا الدور، يعيّن النظام رمز إحالة فريدًا. لا يكتبه الموظفون ولا يمكن تغييره لاحقًا.',
  referralCodeAutoAttach: 'يُربط هذا المرشح برمز الإحالة الذي عيّنه النظام لك. التسجيل المفتوح غير متاح.',
  sourceOfficerMissingCode: 'مسؤول بلد المصدر هذا ليس لديه رمز إحالة. أعد حفظ الدور ليعين النظام رمزًا.',
  deleteOpenCandidate: 'حذف التسجيل المفتوح',
  confirmDeleteOpenCandidate: 'حذف هذا التسجيل المفتوح بلا رمز؟ لا يمكن التراجع.',
  deleteOpenFailed: 'تعذر حذف المرشح:',
  deleteOpenDone: 'تم حذف التسجيل المفتوح.',
  registerCandidate: 'تسجيل مرشح',
  registerCandidateHint: 'يُربط هذا المرشح برمز الإحالة الخاص بك: {code}',
  registerCandidateOpenHint: 'اترك الرمز فارغًا ليبقى التسجيل مفتوحًا. يمكن للإدارة العليا أيضًا اختيار رمز موجود لمسؤول بلد المصدر.',
  registerCandidateSaved: 'تم تسجيل المرشح.',
  registerCandidateFailed: 'تعذر تسجيل المرشح:',
  unknownSupervisorCode: 'هذا الرمز لا يخص مسؤول بلد المصدر.',
  candidateListCount: 'قائمة المرشحين ({shown} / {total})',
  refresh: 'تحديث',
  taskSaveFailed: 'تعذر حفظ المهمة:', taskSaved: 'حُفظت المهمة وأُرسلت إلى المسؤول.',
  noAuditYet: 'لا توجد سجلات بعد.', employerFile: 'ملف صاحب العمل', viewEmployerPortal: 'عرض بوابة صاحب العمل',
  linkedRecord: 'سجل مرتبط (اختياري)', noneOption: 'لا شيء', selectOption: 'اختيار…',
  linkCandidate: 'المرشح', linkRequest: 'الطلب', linkEmployer: 'صاحب العمل',
  cancelPrompt: 'اكتبوا سبب الإلغاء:', cancelReasonLabel: 'سبب الإلغاء:',
  returnToAdmin: 'العودة إلى بوابة الموظفين', authorized: 'جهة الاتصال: {name}',
  languageOptions: [
    { value: 'none', label: 'غير مطلوب / أساسي' },
    { value: 'en-mid', label: 'الإنجليزية (متوسط)' },
    { value: 'tr-good', label: 'التركية (جيد)' },
    { value: 'local', label: 'لغة محلية (الألبانية / المقدونية)' },
  ],
  positions: pos({
    harvest: 'عامل حصاد', greenhouse: 'مسؤول البيوت المحمية', pruning: 'أخصائي تقليم', tractor: 'مشغّل جرار',
    mushroom: 'أخصائي زراعة الفطر', packing: 'عامل تعبئة', formwork: 'نجار قوالب', rebar: 'حداد تسليح',
    masonry: 'بنّاء / مليس', welder: 'لحّام', electrician: 'كهربائي', engineer: 'مهندس مدني',
    siteChief: 'رئيس موقع', warehouse: 'مسؤول مستودع', forklift: 'مشغّل رافعة شوكية', foreignTrade: 'أخصائي تجارة خارجية',
    logistics: 'مسؤول لوجستيات', accounting: 'محاسبة أولية', sales: 'مندوب مبيعات',
  }),
  durationDefault: '12 شهرًا (موسمي / دوام كامل)',
  yes: 'نعم', no: 'لا',
  jobDesc: 'المدة: {duration} | الخبرة: {experience} | اللغة: {language} | السكن: {stay} | الوجبات: {food} | النقل: {transport} | ملاحظات: {notes}',
  interviewNotPresented: 'لم يُقدَّم هذا المرشح لطلبكم بعد، لذلك تعذر إنشاء المقابلة.',
  interviewFailed: 'فشل طلب المقابلة:',
  interviewSent: 'أُرسل طلب مقابلة "{name}" إلى فريق العمليات.',
  candidateSelectedAlert: 'أُضيف "{name}" إلى المرشحين المختارين وبدأت إجراءات التأشيرة.',
  onlineMeeting: 'اجتماع فيديو عبر الإنترنت',
  planned: 'مجدولة',
  supportSubjectPh: 'مثال: احتياج جديد / مشكلة موظف',
  supportMessagePh: 'اكتبوا التفاصيل...',
  demandSuccess: 'أُنشئ الطلب وأُضيف إلى اللوحة.',
  sectorLabel: 'القطاع', positionLabel: 'المنصب / المسمى', headcountLabel: 'عدد الأشخاص', salaryLabel: 'الراتب / الشروط',
  experienceLabel: 'مدة الخبرة', videoRequired: 'مقابلة فيديو إلزامية',
  videoRequiredHint: 'يجب على المرشحين رفع فيديو قبل المقابلة عند التقديم.',
  certsWanted: 'المستندات والشهادات المطلوبة',
  certificates: [
    { value: 'license-b', label: 'رخصة قيادة فئة B' },
    { value: 'vocational', label: 'مدرّب مهني / مؤهل' },
    { value: 'diploma', label: 'دبلوم زراعة / هندسة' },
    { value: 'welder-iso', label: 'شهادة لحام (EN ISO)' },
    { value: 'safety', label: 'شهادة إنشاء / سلامة' },
    { value: 'travel-clear', label: 'لا مانع من السفر الدولي' },
  ],
  formExperience: [
    { value: '1-2', label: '1–2 سنة' },
    { value: '3-5', label: '3–5 سنوات' },
    { value: '5-10', label: '5–10 سنوات' },
    { value: '10+', label: '10+ سنوات (خبير)' },
  ],
  formSectors: [
    { value: 'agriculture', label: 'الزراعة والثروة الحيوانية' },
    { value: 'construction', label: 'الإنشاءات' },
    { value: 'hospitality', label: 'السياحة والفنادق' },
    { value: 'logistics', label: 'اللوجستيات والنقل' },
    { value: 'manufacturing', label: 'التصنيع العام' },
    { value: 'care', label: 'الصحة والرعاية' },
  ],
  datePrefix: 'التاريخ:', activeStatus: 'نشط',
  demoConstruction: 'نجار إنشاء (قوالب)', demoAgriculture: 'عامل زراعة (حصاد)',
  demoFormwork: 'نجار قوالب', demoHarvestLead: 'مسؤول حصاد',
  sectorFallback: 'زراعة / إنشاءات',
};

const mk: PortalUi = {
  loading: 'Се вчитува...',
  candidateNotFound: 'Кандидатот не е пронајден.',
  employerNotFound: 'Работодавачот не е пронајден.',
  requestNotFound: 'Барањето не е пронајдено.',
  errorPrefix: 'Грешка:',
  noChanges: 'Нема промени.',
  demoTitle: 'Демо запис. Се брише кога се чистат демо податоците.',
  signedIn: 'Најава преку Supabase Auth.',
  staffDeleted: 'Записот за персонал е избришан.',
  general: 'Општо',
  specialist: 'Специјалист',
  unspecified: 'Не е наведено',
  passwordsManaged: 'Лозинките се управуваат преку Supabase Auth.',
  photoUpload: 'Прикачи фотографија',
  interviewOfferTitle: 'Интервју и понуда за работа',
  interviewOfferHint: 'Закажете интервју и испратете понуда.',
  exampleFlight: 'пр. 15.10.2026 - 14:30',
  exampleFlightCode: 'пр. TK-1926',
  exampleDeparture: 'пр. Скопје (SKP)',
  exampleArrival: 'пр. Истанбул (IST)',
  examplePnr: 'пр. X79R2A',
  exampleStay: 'пр. Трансфер до хотел',
  exampleCompany: 'пр. Panova Tarim DOO',
  exampleTerms: 'Сместувањето е вклучено...',
  exampleNotifTitle: 'пр. За пасошот',
  exampleMessage: 'Вашата порака...',
  certNoPh: 'Број на сертификат',
  issuerPh: 'Издавач',
  docTitle: 'Статус на документи',
  docApproved: 'одобрени',
  docEmpty: 'Нема снимени документи.',
  docOpen: 'Отвори',
  docValidUntil: 'Валидно до:',
  docRequest: '+ Побарај',
  docTypes: {
    passport: 'Пасош', cv: 'ЦВ', certificate: 'Сертификат', diploma: 'Диплома',
    criminal_record: 'Казнена евиденција', health_report: 'Здравствен извештај', photo: 'Фотографија',
    contract: 'Договор', apostille: 'е-Апостил', other: 'Друго',
  },
  docStatuses: {
    pending: 'Се чека', uploaded: 'Прикачено', reviewing: 'Се разгледува', approved: 'Одобрено',
    rejected: 'Одбиено', rerequested: 'Повторно побарано', expiring: 'Истекува рокот', expired: 'Истечен рок',
  },
  officialTitle: 'Официјален статус на процес',
  officialUpdated: 'Официјалниот процес е ажуриран.',
  needOffer: 'За следење прво мора да има прифатена понуда за работа (компанија).',
  followupSaved: 'Следењето е зачувано.',
  steps: {
    not_started: 'Не е започнато', documents_collecting: 'Се собираат документи', work_permit_applied: 'Апликација за работна дозвола',
    work_permit_approved: 'Одобрена работна дозвола', visa_applied: 'Апликација за виза', visa_approved: 'Одобрена виза',
    ready_to_travel: 'Подготвени за патување', started_work: 'Започнато со работа', rejected: 'Одбиено / прекинато',
  },
  travelStartTitle: 'Патување и започнување со работа',
  travel: 'Патување', flight: 'Лет', route: 'Рута', accommodation: 'Сместување', employerStart: 'Работодавач / почеток',
  travelPlanned: 'Се планира', travelTicketed: 'Издаден билет', travelDone: 'Завршено',
  noOffer: 'Нема понуда',
  editFlightHint: 'Уредете ги податоците за летот во делот за патување, лет и сместување подолу, па зачувајте.',
  startedBanner: 'Кандидатот започна со работа — активен е мониторинг 30/60/90.',
  markStarted: 'Означи како започнато со работа',
  followupTitle: '30 / 60 / 90 дена мониторинг',
  day: 'ден', recorded: 'Запишано', waiting: 'Се чека',
  notMarkedStarted: 'Забелешка: Кандидатот сè уште не е означен како започнат со работа.',
  checkDate: 'Датум на проверка', complianceScore: 'Оценка за усогласеност (1–5)',
  salaryOk: 'Платата е во согласност со договорот', accommodationOk: 'Сместувањето е соодветно',
  employerFeedback: 'Повратна информација од работодавачот', employeeFeedback: 'Повратна информација од работникот', panovaNote: 'Белешка од Панова',
  updateFollowup: 'Ажурирај мониторинг за {stage} ден', saveFollowup: 'Зачувај мониторинг за {stage} ден',
  ioTitle: 'Интервју и понуда', ioAllRequests: 'сите барања', ioInterviews: 'Интервјуа', ioJobOffers: 'Понуди за работа',
  ioEditInterview: 'Уреди интервју', ioNewInterview: 'Закажи ново интервју',
  ioEmployerNote: 'Белешка од работодавач', ioPanovaNote: 'Внатрешна белешка на PANOVA',
  ioEditOffer: 'Уреди понуда', ioNewOffer: 'Нова понуда за работа (се гледа во порталот на кандидатот)',
  ioCompany: 'Име на компанија', ioPosition: 'Позиција', ioNetSalary: 'Нето плата / месец',
  ioTerms: 'Услови: сместување, храна, превоз, траење на договор, работно време…',
  ioSendOffer: 'Испрати понуда', ioPlan: 'Закажи',
  ioScheduleRequired: 'Внесете датум и време на интервјуто.', ioOfferRequired: 'Името на компанијата и нето платата се задолжителни.',
  ioNetLine: '{amount} нето/месец · почеток {date}',
  intStatus: { scheduled: 'Закажано', completed: 'Завршено', cancelled: 'Откажано', no_show: 'Не се појави' },
  intResult: { selected: 'Избран', backup: 'Резерва', rejected: 'Не соодветствува' },
  intNoResult: 'Нема резултат',
  offerStatus: { pending: 'Се чека одговор од кандидатот', accepted: 'Прифатено', rejected: 'Одбиено', withdrawn: 'Повлечено' },
  matchTitle: 'Поврзување кандидати', selectedOf: 'Избрани {selected}/{total}',
  linkedCandidates: 'Поврзани кандидати', noneLinked: 'Сè уште нема поврзан кандидат.',
  presentedOn: 'Презентиран {date}', notPresented: 'Не е презентиран', present: 'Презентирај',
  suggested: 'Предложени кандидати', searchCandidates: 'Пребарај име, професија или државјанство…',
  yearsFit: '{years} години · усогласеност {score}/5', bind: 'Поврзи',
  confirmRemove: 'Да се отстрани ова поврзување?', offer: 'Понуда', interview: 'Интервју', remove: 'Отстрани', close: 'Затвори',
  matchResults: { interview: 'Повикан на интервју', selected: 'Избран', backup: 'Резерва', later: 'Подоцна', not_suitable: 'Не соодветствува' },
  requestFields: {
    position_title: 'Позиција', sector: 'Сектор', headcount: 'Број на лица', target_start_date: 'Целен почеток',
    monthly_net_salary: 'Месечна нето плата', working_hours: 'Работно време', weekly_days: 'Денови неделно',
    overtime_conditions: 'Услови за прекувремена работа', contract_type: 'Вид на договор', required_experience_years: 'Потребно искуство (години)',
    required_language: 'Јазичен услов', country: 'Држава', city: 'Град',
  },
  requestBools: {
    accommodation_provided: 'Сместување', food_provided: 'Храна', transport_provided: 'Превоз',
    flight_covered: 'Авионски билет', required_certificate: 'Потребен сертификат',
  },
  matchCandidates: 'Поврзи кандидати', requestInfo: 'Податоци за барањето', status: 'Статус', closeReason: 'Причина за затворање',
  specialTerms: 'Посебни услови', matchedCandidates: 'Поврзани кандидати', manage: 'Управувај', noneBound: 'Сè уште нема поврзан кандидат.',
  statMatched: 'Поврзани кандидати', statPresented: 'Презентирани', statSelected: 'Избрани', statInterviews: 'Интервјуа', statOffers: 'Понуди (прифатени)',
  noInterviews: 'Нема интервјуа.', interviewsTitle: 'Интервјуа', createdOn: 'Создадено: {date}',
  employerWord: 'Работодавач', candidateWord: 'Кандидат', positionWord: 'Позиција',
  employerFields: {
    company_name: 'Име на компанијата', contact_person: 'Лице за контакт', contact_name: 'Втор контакт', email: 'Е-пошта', phone: 'Телефон',
    country: 'Држава', city: 'Град', website: 'Веб-страница', address: 'Адреса', tax_id: 'Даночен број',
    assigned_sector: 'Сектор', compliance_status: 'Статус на усогласеност', suitability_status: 'Соодветност', notes: 'Внатрешни белешки',
  },
  activeRequests: 'Активни барања', presentedCandidates: 'Презентирани кандидати', selectedCandidates: 'Избрани кандидати',
  openIssues: 'Отворени проблеми / задачи', companyContact: 'Компанија и контакт', noRequests: 'Нема барања.',
  headcountLine: '{n} лица · {place} · Почеток {date}',
  presentedSelectedTitle: 'Презентирани / избрани кандидати', nonePresented: 'Сè уште нема презентиран кандидат.',
  presentationOn: 'Презентација {date}', awaitingResult: 'Се чека резултат', interviewCount: 'Записи за интервју: {n}',
  openIssuesTitle: 'Отворени проблеми и задачи', noOpenRecords: 'Нема отворени записи.', dueOn: 'Рок {date}',
  registeredOn: 'Регистрација: {date}',
  employerInvite: {
    title: 'Најава на порталот',
    send: 'Испрати покана за најава',
    resend: 'Испрати врска за лозинка',
    noEmail: 'Нема контакт е-пошта. Зачувајте е-пошта пред да испратите покана.',
    linked: 'Сметката е поврзана',
    invitedAt: 'Покана: {date}',
    sentInvite: 'Поканата е испратена. Лозинката се поставува од врската, или се најавуваат со Google на истата адреса.',
    sentReset: 'Врската за лозинка е испратена.',
    emailFailed: 'Записот е ажуриран, но е-поштата не е испратена. Обидете се повторно наскоро.',
    unavailable: 'Испраќањето е-пошта моментално не е достапно.',
    cooldown: 'Почекајте {seconds} секунди пред повторно испраќање.',
    staffAccount: 'Оваа е-пошта е на сметка на персонал. Сметка на персонал не се претвора во работодавач.',
    emailTaken: 'Оваа е-пошта е веќе поврзана со друг работодавач.',
    otherRole: 'Оваа е-пошта е на друга порталска сметка и не може да се поврзе.',
    forbidden: 'Не можете да испратите покана за овој работодавач.',
    failed: 'Поканата не може да се испрати.',
    localeLabel: 'Јазик на поканата',
    consentTitle: 'Известување за приватност',
    consentLead: 'Прифатете го известувањето за приватност пред влез во порталот за работодавач.',
    consentSave: 'Прифати и продолжи',
    consentFailed: 'Согласноста не е зачувана. Обидете се повторно.',
  },
  staffRestricted: 'За преглед на оваа област е потребна дозвола на висок менаџмент.',
  staffInviteHint: 'Не се поставува лозинка. Се испраќа покана по е-пошта. Кога ќе се најават со Google или е-пошта на таа адреса, сметката се поврзува автоматски.',
  sendInvite: 'Испрати покана', edit: 'Уреди', save: 'Зачувај', activeAccount: 'Активна сметка',
  invitePending: 'Покана во чекање ({date})', accountUnlinked: 'Сметката не е поврзана',
  upperManagementOnly: 'За оваа акција е потребна дозвола на висок менаџмент.',
  serverUnreadable: 'Одговорот од серверот не може да се прочита.',
  inviteSent: 'Поканата е испратена. Сметката се поврзува автоматски кога ќе се најават со Google или е-пошта на таа адреса.',
  staffUpdated: 'Податоците за персоналот се ажурирани.', updateFailed: 'Грешка при ажурирање:',
  confirmDeleteStaff: 'Да се избрише овој запис за персонал?',
  exportCsv: 'Преземи CSV',
  exportExcel: 'Преземи Excel',
  exportPrint: 'Печати / PDF',
  exportEmpty: 'Нема записи за извоз.',
  offersExport: 'Извези понуди',
  deleteRecord: 'Избриши',
  deleteConfirmTitle: 'Да се избрише овој запис?',
  deleteConfirmBody: '{name} се брише трајно. Ова не може да се врати.',
  deleteDemoNote: 'Ова е демо запис.',
  deleteCodedNote: 'Овој кандидат има код за упатување: {code}.',
  deleteFailed: 'Бришењето не успеа. Проверете ја дозволата.',
  deleted: 'Записот е избришан.',
  empNoDemands: 'Сè уште нема барања за работна сила. Создајте го првото со формуларот погоре.',
  offerSalary: 'Плата',
  offerCurrency: 'Валута',
  offerStart: 'Почеток',
  offerTerms: 'Услови',
  offerNetPerMonth: 'нето / месец',
  salaryNotSet: 'Платата не е внесена',
  offerUpdateFailed: 'Понудата не се ажурира. Проверете ја сесијата.',
  routeDenied: 'Оваа страница не е отворена за вашата улога.',
  backToPortal: 'Назад до порталот',
  selectCountry: 'Изберете држава',
  cancelAction: 'Откажи',
  referralCode: 'Код за упатување',
  referralCodeAll: 'Сите кодови',
  referralCodeNone: 'Без код / отворена регистрација',
  referralCodeEmpty: '—',
  referralCodeYours: 'Вашиот код',
  referralCodeCopy: 'Копирај',
  referralCodeCopied: 'Копирано',
  referralFilterLabel: 'Филтер по код',
  referralCodeImmutable: 'Системот го доделува. По доделување не може да се менува.',
  referralCodeOnInvite: 'При покана на одговорник за земја на потекло, или кога му се дава таа улога, системот доделува единствен код. Вработените не го пишуваат и не може да се менува подоцна.',
  referralCodeAutoAttach: 'Овој кандидат се врзува за кодот што системот ви го доделил. Отворена регистрација не е достапна.',
  sourceOfficerMissingCode: 'Овој одговорник за земја на потекло нема код. Зачувајте ја улогата повторно за системот да додели код.',
  deleteOpenCandidate: 'Избриши отворена регистрација',
  confirmDeleteOpenCandidate: 'Да се избрише оваа отворена регистрација без код? Ова не може да се врати.',
  deleteOpenFailed: 'Кандидатот не е избришан:',
  deleteOpenDone: 'Отворената регистрација е избришана.',
  registerCandidate: 'Регистрирај кандидат',
  registerCandidateHint: 'Овој кандидат се врзува за вашиот код: {code}',
  registerCandidateOpenHint: 'Оставете го кодот празен за отворена регистрација. Високиот менаџмент може да избере и постоечки код на одговорник за земја на потекло.',
  registerCandidateSaved: 'Кандидатот е регистриран.',
  registerCandidateFailed: 'Кандидатот не е регистриран:',
  unknownSupervisorCode: 'Овој код не припаѓа на одговорник за земја на потекло.',
  candidateListCount: 'Листа на кандидати ({shown} / {total})',
  refresh: 'Освежи',
  taskSaveFailed: 'Задачата не е зачувана:', taskSaved: 'Задачата е зачувана и испратена до одговорниот.',
  noAuditYet: 'Сè уште нема записи.', employerFile: 'Досие на работодавач', viewEmployerPortal: 'Види портал на работодавач',
  linkedRecord: 'Поврзан запис (изборно)', noneOption: 'Нема', selectOption: 'Изберете…',
  linkCandidate: 'Кандидат', linkRequest: 'Барање', linkEmployer: 'Работодавач',
  cancelPrompt: 'Напишете причина за откажување:', cancelReasonLabel: 'Причина за откажување:',
  returnToAdmin: 'Назад кон порталот на персоналот', authorized: 'Контакт: {name}',
  languageOptions: [
    { value: 'none', label: 'Не е потребно / основно' },
    { value: 'en-mid', label: 'Англиски (средно ниво)' },
    { value: 'tr-good', label: 'Турски (добро)' },
    { value: 'local', label: 'Локален јазик (албански / македонски)' },
  ],
  positions: pos({
    harvest: 'Жетвар', greenhouse: 'Одговорен за оранжерии', pruning: 'Специјалист за кроење', tractor: 'Оператор на трактор',
    mushroom: 'Специјалист за одгледување печурки', packing: 'Пакувач', formwork: 'Опажувач', rebar: 'Арматурист',
    masonry: 'Ѕидар / малтерџија', welder: 'Заварувач', electrician: 'Електричар', engineer: 'Градежен инженер',
    siteChief: 'Раководител на градилиште', warehouse: 'Одговорен за магацин', forklift: 'Оператор на вилушкар', foreignTrade: 'Специјалист за надворешна трговија',
    logistics: 'Одговорен за логистика', accounting: 'Основно сметководство', sales: 'Продажен претставник',
  }),
  durationDefault: '12 месеци (сезонски / полно работно време)',
  yes: 'Да', no: 'Не',
  jobDesc: 'Траење: {duration} | Искуство: {experience} | Јазик: {language} | Сместување: {stay} | Храна: {food} | Превоз: {transport} | Белешки: {notes}',
  interviewNotPresented: 'Овој кандидат сè уште не е презентиран за вашето барање, па интервјуто не е создадено.',
  interviewFailed: 'Барањето за интервју не успеа:',
  interviewSent: 'Барањето за интервју за „{name}“ е испратено до оперативниот тим.',
  candidateSelectedAlert: '„{name}“ е додаден во избраните кандидати и визниот процес е започнат.',
  onlineMeeting: 'Онлајн видео состанок',
  planned: 'Закажано',
  supportSubjectPh: 'пр. Нова потреба / проблем со вработен',
  supportMessagePh: 'Напишете ги деталите...',
  demandSuccess: 'Барањето е создадено и додадено на таблата.',
  sectorLabel: 'Сектор', positionLabel: 'Позиција / назив', headcountLabel: 'Број на лица', salaryLabel: 'Плата / услови',
  experienceLabel: 'Траење на искуство', videoRequired: 'Задолжително видео интервју',
  videoRequiredHint: 'Кандидатите мора да прикачат видео пред интервју при аплицирање.',
  certsWanted: 'Потребни документи и сертификати',
  certificates: [
    { value: 'license-b', label: 'Возачка дозвола категорија B' },
    { value: 'vocational', label: 'Стручен инструктор / квалификација' },
    { value: 'diploma', label: 'Диплома за земјоделство / инженерство' },
    { value: 'welder-iso', label: 'Сертификат за заварувач (EN ISO)' },
    { value: 'safety', label: 'Сертификат за градежништво / безбедност' },
    { value: 'travel-clear', label: 'Нема пречка за меѓународно патување' },
  ],
  formExperience: [
    { value: '1-2', label: '1–2 години' },
    { value: '3-5', label: '3–5 години' },
    { value: '5-10', label: '5–10 години' },
    { value: '10+', label: '10+ години (мајстор)' },
  ],
  formSectors: [
    { value: 'agriculture', label: 'Земјоделство и сточарство' },
    { value: 'construction', label: 'Градежништво' },
    { value: 'hospitality', label: 'Туризам и хотелиерство' },
    { value: 'logistics', label: 'Логистика и транспорт' },
    { value: 'manufacturing', label: 'Општо производство' },
    { value: 'care', label: 'Здравство и нега' },
  ],
  datePrefix: 'Датум:', activeStatus: 'Активно',
  demoConstruction: 'Градежен мајстор (опажување)', demoAgriculture: 'Земјоделски работник (жетва)',
  demoFormwork: 'Опажувач', demoHarvestLead: 'Одговорен за жетва',
  sectorFallback: 'Земјоделство / градежништво',
};

export const portalUi: Record<Language, PortalUi> = { tr, en, sq, ar, mk };

export function optionLabel(options: Opt[], value: string) {
  return options.find((option) => option.value === value)?.label || value;
}

export function positionLabel(ui: PortalUi, id: string) {
  const all = [...ui.positions.agriculture, ...ui.positions.construction, ...ui.positions.trade];
  return all.find((item) => item.id === id)?.label || id;
}
