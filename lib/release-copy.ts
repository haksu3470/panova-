import type { Language } from './dictionary';
import { supportTicketStatus } from './supportTickets';

export type ReleaseCopy = {
  kvkkBefore: string;
  kvkkLink: string;
  kvkkAfter: string;
  kvkkRequired: string;
  uploadType: string;
  uploadSize: string;
  uploadFailed: string;
  docReason: string;
  docFile: string;
  supportReply: string;
  supportReplyPh: string;
  supportSendReply: string;
  supportClose: string;
  supportReplied: string;
  supportNoReply: string;
  supportEmailFailed: string;
  statusOpen: string;
  statusAnswered: string;
  statusClosed: string;
  demandBlocked: string;
  pastTarget: string;
  delayNone: string;
  delayVisa: string;
  delayDocs: string;
  delayTasks: string;
  delayDemands: string;
  overdue: string;
  mfaTitle: string;
  mfaOptional: string;
  mfaEnroll: string;
  mfaCode: string;
  mfaConfirm: string;
  mfaDisable: string;
  mfaOn: string;
  mfaChallenge: string;
  mfaFailed: string;
  mfaSecret: string;
  inviteExpired: string;
  inviteCancelled: string;
  inviteCancel: string;
  inviteResend: string;
  inviteExpires: string;
  scopeCountry: string;
  scopeHint: string;
  employerPending: string;
  employerApprove: string;
  visaNeedsOffer: string;
  mustPresent: string;
  offerCandidate: string;
  passwordMin: string;
};

const tr: ReleaseCopy = {
  kvkkBefore: 'KVKK aydınlatma metnini okudum ve kişisel verilerimin bu metindeki amaçlarla işlenmesini kabul ediyorum.',
  kvkkLink: 'Aydınlatma metni',
  kvkkAfter: '',
  kvkkRequired: 'Devam etmek için aydınlatma metnini kabul edin.',
  uploadType: 'Yalnızca PDF, JPG veya PNG yükleyebilirsiniz.',
  uploadSize: 'Dosya çok büyük. Belge en fazla 8 MB, fotoğraf en fazla 2 MB olabilir.',
  uploadFailed: 'Dosya yüklenemedi. Tür ve boyutu kontrol edip yeniden deneyin.',
  docReason: 'Gerekçe',
  docFile: 'Dosya',
  supportReply: 'Personel yanıtı',
  supportReplyPh: 'Yanıtınızı yazın',
  supportSendReply: 'Yanıtla',
  supportClose: 'Kapat',
  supportReplied: 'Yanıtlayan',
  supportNoReply: 'Henüz personel yanıtı yok.',
  supportEmailFailed: 'Yanıt kaydedildi. Adaya e-posta gönderilemedi.',
  statusOpen: 'Açık',
  statusAnswered: 'Yanıtlandı',
  statusClosed: 'Kapatıldı',
  demandBlocked: 'Bu duruma geçilemez. Önce eşleşme, sunum veya görüşme kaydı gerekir.',
  pastTarget: 'Hedef başlangıç tarihi geçmiş.',
  delayNone: 'Gecikmiş dosya veya görev yok.',
  delayVisa: 'Vize işlemi 15 günü aşan adaylar',
  delayDocs: 'Eksik belgesi olan adaylar',
  delayTasks: 'Süresi geçmiş görevler',
  delayDemands: 'Hedef tarihi geçmiş talepler',
  overdue: 'Gecikmiş',
  mfaTitle: 'İki adımlı doğrulama',
  mfaOptional: 'Personel hesapları için isteğe bağlıdır. Zorunlu tutulduğunda bu ekran girişi tamamlamadan açılmaz.',
  mfaEnroll: 'Doğrulamayı aç',
  mfaCode: 'Uygulamadaki 6 haneli kod',
  mfaConfirm: 'Kodu doğrula',
  mfaDisable: 'Doğrulamayı kapat',
  mfaOn: 'İki adımlı doğrulama açık.',
  mfaChallenge: 'Devam etmek için doğrulama kodunu girin.',
  mfaFailed: 'Kod doğrulanamadı.',
  mfaSecret: 'Kurulum anahtarı',
  inviteExpired: 'Davetin süresi doldu',
  inviteCancelled: 'Davet iptal edildi',
  inviteCancel: 'Daveti iptal et',
  inviteResend: 'Yeniden gönder',
  inviteExpires: 'Son gün',
  scopeCountry: 'Kapsam ülkesi',
  scopeHint: 'Kaynak ülke adayın uyruğuyla, hedef ülke işveren ve talebin ülkesiyle eşleşir.',
  employerPending: 'Hesabınız onay bekliyor. Onaydan sonra talep oluşturabilirsiniz.',
  employerApprove: 'İşvereni onayla',
  visaNeedsOffer: 'Vize süreci, kabul edilmiş bir iş teklifi olmadan başlayamaz.',
  mustPresent: 'Görüşme veya teklif için aday önce sunulmalıdır.',
  offerCandidate: 'Aday',
  passwordMin: 'Şifre en az 8 karakter olmalıdır.',
};

const en: ReleaseCopy = {
  kvkkBefore: 'I have read the privacy notice and I consent to the processing of my personal data for the purposes described in it.',
  kvkkLink: 'Privacy notice',
  kvkkAfter: '',
  kvkkRequired: 'Accept the privacy notice to continue.',
  uploadType: 'Upload a PDF, JPG, or PNG file only.',
  uploadSize: 'That file is too large. Documents can be 8 MB and photos 2 MB.',
  uploadFailed: 'The file could not be uploaded. Check the type and size, then try again.',
  docReason: 'Reason',
  docFile: 'File',
  supportReply: 'Staff reply',
  supportReplyPh: 'Write the reply',
  supportSendReply: 'Reply',
  supportClose: 'Close',
  supportReplied: 'Replied by',
  supportNoReply: 'No staff reply yet.',
  supportEmailFailed: 'The reply was saved. The email to the candidate could not be sent.',
  statusOpen: 'Open',
  statusAnswered: 'Answered',
  statusClosed: 'Closed',
  demandBlocked: 'That status is not allowed yet. A match, a presentation, or an interview has to exist first.',
  pastTarget: 'The target start date is in the past.',
  delayNone: 'No overdue files or tasks.',
  delayVisa: 'Candidates in visa processing for more than 15 days',
  delayDocs: 'Candidates with missing documents',
  delayTasks: 'Tasks past their due date',
  delayDemands: 'Demands past their target date',
  overdue: 'Overdue',
  mfaTitle: 'Two-step verification',
  mfaOptional: 'Optional for staff. When enforcement is turned on, this screen blocks sign-in until it is set up.',
  mfaEnroll: 'Turn on verification',
  mfaCode: '6-digit code from the app',
  mfaConfirm: 'Confirm code',
  mfaDisable: 'Turn off verification',
  mfaOn: 'Two-step verification is on.',
  mfaChallenge: 'Enter the verification code to continue.',
  mfaFailed: 'The code could not be verified.',
  mfaSecret: 'Setup key',
  inviteExpired: 'Invite expired',
  inviteCancelled: 'Invite cancelled',
  inviteCancel: 'Cancel invite',
  inviteResend: 'Send again',
  inviteExpires: 'Expires',
  scopeCountry: 'Scope country',
  scopeHint: 'Source country matches the candidate nationality. Target country matches the employer and the demand.',
  employerPending: 'This account is waiting for approval. You can create a demand after it is approved.',
  employerApprove: 'Approve employer',
  visaNeedsOffer: 'Visa processing cannot start before an offer is accepted.',
  mustPresent: 'Present the candidate before an interview or an offer.',
  offerCandidate: 'Candidate',
  passwordMin: 'Password must be at least 8 characters.',
};

const mk: ReleaseCopy = {
  kvkkBefore: 'Го прочитав известувањето за приватност и се согласувам личните податоци да се обработуваат за наведените цели.',
  kvkkLink: 'Известување за приватност',
  kvkkAfter: '',
  kvkkRequired: 'За да продолжите, прифатете го известувањето.',
  uploadType: 'Дозволени се само PDF, JPG или PNG.',
  uploadSize: 'Датотеката е преголема. Документ до 8 MB, фотографија до 2 MB.',
  uploadFailed: 'Датотеката не се прикачи. Проверете го видот и големината.',
  docReason: 'Образложение',
  docFile: 'Датотека',
  supportReply: 'Одговор од персоналот',
  supportReplyPh: 'Напишете го одговорот',
  supportSendReply: 'Одговори',
  supportClose: 'Затвори',
  supportReplied: 'Одговори',
  supportNoReply: 'Сè уште нема одговор.',
  supportEmailFailed: 'Одговорот е зачуван. Е-поштата до кандидатот не можеше да се испрати.',
  statusOpen: 'Отворено',
  statusAnswered: 'Одговорено',
  statusClosed: 'Затворено',
  demandBlocked: 'Оваа состојба не е дозволена. Прво треба да има спојување, презентација или интервју.',
  pastTarget: 'Целниот датум на почеток е поминат.',
  delayNone: 'Нема задоцнети досиеја или задачи.',
  delayVisa: 'Кандидати во виза повеќе од 15 дена',
  delayDocs: 'Кандидати со документите што недостасуваат',
  delayTasks: 'Задачи по рокот',
  delayDemands: 'Барања по целниот датум',
  overdue: 'Задоцнето',
  mfaTitle: 'Проверка во два чекора',
  mfaOptional: 'Изборно за персоналот. Кога ќе се вклучи задолжителноста, влезот чека поставување.',
  mfaEnroll: 'Вклучи проверка',
  mfaCode: '6-цифрен код од апликацијата',
  mfaConfirm: 'Потврди го кодот',
  mfaDisable: 'Исклучи проверка',
  mfaOn: 'Проверката во два чекора е вклучена.',
  mfaChallenge: 'Внесете го кодот за да продолжите.',
  mfaFailed: 'Кодот не е потврден.',
  mfaSecret: 'Клуч за поставување',
  inviteExpired: 'Поканата е истечена',
  inviteCancelled: 'Поканата е откажана',
  inviteCancel: 'Откажи ја поканата',
  inviteResend: 'Испрати повторно',
  inviteExpires: 'Истекува',
  scopeCountry: 'Земја на опфат',
  scopeHint: 'Изворната земја се совпаѓа со националноста. Целната земја се совпаѓа со работодавачот и барањето.',
  employerPending: 'Сметката чека одобрување. Барање може да се создаде по одобрувањето.',
  employerApprove: 'Одобри го работодавачот',
  visaNeedsOffer: 'Визната постапка не започнува пред прифатена понуда.',
  mustPresent: 'Кандидатот прво мора да биде претставен.',
  offerCandidate: 'Кандидат',
  passwordMin: 'Лозинката мора да има најмалку 8 знаци.',
};

const sq: ReleaseCopy = {
  kvkkBefore: 'E kam lexuar njoftimin e privatësisë dhe pranoj përpunimin e të dhënave personale për qëllimet e përshkruara.',
  kvkkLink: 'Njoftimi i privatësisë',
  kvkkAfter: '',
  kvkkRequired: 'Pranoni njoftimin për të vazhduar.',
  uploadType: 'Ngarkoni vetëm PDF, JPG ose PNG.',
  uploadSize: 'Skedari është shumë i madh. Dokumenti deri në 8 MB, foto deri në 2 MB.',
  uploadFailed: 'Skedari nuk u ngarkua. Kontrolloni llojin dhe madhësinë.',
  docReason: 'Arsyeja',
  docFile: 'Skedari',
  supportReply: 'Përgjigjja e stafit',
  supportReplyPh: 'Shkruani përgjigjen',
  supportSendReply: 'Përgjigju',
  supportClose: 'Mbyll',
  supportReplied: 'U përgjigj',
  supportNoReply: 'Ende nuk ka përgjigje nga stafi.',
  supportEmailFailed: 'Përgjigjja u ruajt. E-maili te kandidati nuk u dërgua.',
  statusOpen: 'Hapur',
  statusAnswered: 'Përgjigjur',
  statusClosed: 'Mbyllur',
  demandBlocked: 'Ky status nuk lejohet ende. Duhet fillimisht një përputhje, prezantim ose intervistë.',
  pastTarget: 'Data e synuar e fillimit ka kaluar.',
  delayNone: 'Nuk ka dosje ose detyra të vonuara.',
  delayVisa: 'Kandidatë në proces vize mbi 15 ditë',
  delayDocs: 'Kandidatë me dokumente që mungojnë',
  delayTasks: 'Detyra pas afatit',
  delayDemands: 'Kërkesa pas datës së synuar',
  overdue: 'Vonuar',
  mfaTitle: 'Verifikim me dy hapa',
  mfaOptional: 'Opsionale për stafin. Kur bëhet e detyrueshme, hyrja pret konfigurimin.',
  mfaEnroll: 'Aktivizo verifikimin',
  mfaCode: 'Kodi 6-shifror nga aplikacioni',
  mfaConfirm: 'Konfirmo kodin',
  mfaDisable: 'Çaktivizo verifikimin',
  mfaOn: 'Verifikimi me dy hapa është aktiv.',
  mfaChallenge: 'Vendosni kodin për të vazhduar.',
  mfaFailed: 'Kodi nuk u verifikua.',
  mfaSecret: 'Çelësi i konfigurimit',
  inviteExpired: 'Ftesa ka skaduar',
  inviteCancelled: 'Ftesa u anulua',
  inviteCancel: 'Anulo ftesën',
  inviteResend: 'Dërgo përsëri',
  inviteExpires: 'Skadon',
  scopeCountry: 'Shteti i fushëveprimit',
  scopeHint: 'Shteti burim përputhet me shtetësinë. Shteti pritës përputhet me punëdhënësin dhe kërkesën.',
  employerPending: 'Llogaria pret miratim. Kërkesën mund ta krijoni pas miratimit.',
  employerApprove: 'Mirato punëdhënësin',
  visaNeedsOffer: 'Procesi i vizës nuk fillon pa një ofertë të pranuar.',
  mustPresent: 'Kandidati duhet të prezantohet para intervistës ose ofertës.',
  offerCandidate: 'Kandidati',
  passwordMin: 'Fjalëkalimi duhet të ketë të paktën 8 karaktere.',
};

const ar: ReleaseCopy = {
  kvkkBefore: 'قرأت إشعار الخصوصية وأوافق على معالجة بياناتي الشخصية للأغراض الواردة فيه.',
  kvkkLink: 'إشعار الخصوصية',
  kvkkAfter: '',
  kvkkRequired: 'يجب قبول إشعار الخصوصية للمتابعة.',
  uploadType: 'يُقبل فقط PDF أو JPG أو PNG.',
  uploadSize: 'الملف كبير جدًا. الحد للوثيقة 8 ميغابايت وللصورة 2 ميغابايت.',
  uploadFailed: 'تعذر رفع الملف. تحقق من النوع والحجم ثم أعد المحاولة.',
  docReason: 'السبب',
  docFile: 'الملف',
  supportReply: 'رد الموظف',
  supportReplyPh: 'اكتب الرد',
  supportSendReply: 'إرسال الرد',
  supportClose: 'إغلاق',
  supportReplied: 'ردّ بواسطة',
  supportNoReply: 'لا يوجد رد من الموظفين بعد.',
  supportEmailFailed: 'حُفظ الرد. تعذر إرسال البريد إلى المرشح.',
  statusOpen: 'مفتوح',
  statusAnswered: 'تم الرد',
  statusClosed: 'مغلق',
  demandBlocked: 'لا يمكن الانتقال إلى هذه الحالة قبل وجود مطابقة أو عرض أو مقابلة.',
  pastTarget: 'تاريخ البدء المستهدف مضى.',
  delayNone: 'لا توجد ملفات أو مهام متأخرة.',
  delayVisa: 'مرشحون في إجراءات التأشيرة لأكثر من 15 يومًا',
  delayDocs: 'مرشحون تنقصهم وثائق',
  delayTasks: 'مهام تجاوزت موعدها',
  delayDemands: 'طلبات تجاوزت تاريخها المستهدف',
  overdue: 'متأخر',
  mfaTitle: 'التحقق بخطوتين',
  mfaOptional: 'اختياري لحسابات الموظفين. عند تفعيل الإلزام تتوقف الدخول حتى يكتمل الإعداد.',
  mfaEnroll: 'تفعيل التحقق',
  mfaCode: 'الرمز المكوّن من 6 أرقام',
  mfaConfirm: 'تأكيد الرمز',
  mfaDisable: 'إيقاف التحقق',
  mfaOn: 'التحقق بخطوتين مفعّل.',
  mfaChallenge: 'أدخل رمز التحقق للمتابعة.',
  mfaFailed: 'تعذر التحقق من الرمز.',
  mfaSecret: 'مفتاح الإعداد',
  inviteExpired: 'انتهت صلاحية الدعوة',
  inviteCancelled: 'أُلغيت الدعوة',
  inviteCancel: 'إلغاء الدعوة',
  inviteResend: 'إعادة الإرسال',
  inviteExpires: 'تنتهي',
  scopeCountry: 'دولة النطاق',
  scopeHint: 'دولة المصدر تطابق جنسية المرشح. دولة الوجهة تطابق صاحب العمل والطلب.',
  employerPending: 'الحساب بانتظار الموافقة. يمكن إنشاء طلب بعد الموافقة.',
  employerApprove: 'اعتماد صاحب العمل',
  visaNeedsOffer: 'لا تبدأ إجراءات التأشيرة قبل قبول عرض العمل.',
  mustPresent: 'يجب عرض المرشح قبل المقابلة أو العرض.',
  offerCandidate: 'المرشح',
  passwordMin: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.',
};

export const releaseCopy: Record<Language, ReleaseCopy> = { tr, en, sq, ar, mk };

export function supportStatusLabel(status: string | null | undefined, copy: ReleaseCopy): string {
  const key = supportTicketStatus(status);
  if (key === 'answered') return copy.statusAnswered;
  if (key === 'closed') return copy.statusClosed;
  return copy.statusOpen;
}
