import type { Language } from '../dictionary';

/** Site locales. Auth emails read the same codes from user_metadata.locale. */
export const EMAIL_LOCALES = ['tr', 'en', 'sq', 'ar', 'mk'] as const satisfies readonly Language[];

export type EmailLocale = (typeof EMAIL_LOCALES)[number];

export function isEmailLocale(value: unknown): value is EmailLocale {
  return value === 'tr' || value === 'en' || value === 'sq' || value === 'ar' || value === 'mk';
}

/** Known locale, or Turkish when the caller did not send one. */
export function emailLocale(value: unknown, fallback: EmailLocale = 'tr'): EmailLocale {
  return isEmailLocale(value) ? value : fallback;
}

export function emailDir(locale: EmailLocale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function fillEmail(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match));
}

export type EmailShellCopy = {
  brandLine: string;
  places: string;
  automated: string;
};

export const emailShellCopy: Record<EmailLocale, EmailShellCopy> = {
  tr: {
    brandLine: 'Panova Group HR',
    places: 'Bangladeş · Türkiye · Kuzey Makedonya',
    automated: 'Bu ileti otomatik gönderilmiştir.',
  },
  en: {
    brandLine: 'Panova Group HR',
    places: 'Bangladesh · Türkiye · North Macedonia',
    automated: 'This message was sent automatically.',
  },
  sq: {
    brandLine: 'Panova Group HR',
    places: 'Bangladeshi · Turqia · Maqedonia e Veriut',
    automated: 'Ky mesazh është dërguar automatikisht.',
  },
  ar: {
    brandLine: 'Panova Group HR',
    places: 'بنغلاديش · تركيا · مقدونيا الشمالية',
    automated: 'أُرسلت هذه الرسالة تلقائيًا.',
  },
  mk: {
    brandLine: 'Panova Group HR',
    places: 'Бангладеш · Турција · Северна Македонија',
    automated: 'Оваа порака е испратена автоматски.',
  },
};

/** Shown only when an Auth template has no locale. One short line per language. */
export const authFallback = {
  confirmLines: [
    'TR: Kodu yazın veya bağlantıyı açın.',
    'EN: Enter the code or open the link.',
    'SQ: Shkruani kodin ose hapni lidhjen.',
    'AR: أدخل الرمز أو افتح الرابط.',
    'MK: Внесете го кодот или отворете ја врската.',
  ],
  recoveryLines: [
    'TR: Şifre için kodu yazın veya bağlantıyı açın.',
    'EN: Enter the code to reset your password, or open the link.',
    'SQ: Shkruani kodin për fjalëkalimin, ose hapni lidhjen.',
    'AR: أدخل الرمز لإعادة تعيين كلمة المرور، أو افتح الرابط.',
    'MK: Внесете го кодот за лозинката, или отворете ја врската.',
  ],
  title: 'Panova',
  button: 'Panova',
  preheader: 'Panova',
  places: 'Bangladesh · Türkiye · North Macedonia',
  automated: 'This message was sent automatically.',
};

export type AuthMessageCopy = {
  subject: string;
  preheader: string;
  title: string;
  body: string;
  button: string;
};

export const authConfirmCopy: Record<EmailLocale, AuthMessageCopy> = {
  tr: {
    subject: 'Panova güvenlik kodunuz',
    preheader: 'Kayıt ekranına bu 6 haneli kodu yapıştırın.',
    title: 'Güvenlik kodunuz',
    body: 'Bu kodu kimseyle paylaşmayın. Kayıt ekranına yapıştırın.',
    button: 'Bağlantı ile onayla',
  },
  en: {
    subject: 'Your Panova security code',
    preheader: 'Paste this 6-digit code on the registration screen.',
    title: 'Your security code',
    body: 'Do not share this code with anyone. Paste it on the registration screen.',
    button: 'Confirm with the link',
  },
  sq: {
    subject: 'Kodi juaj i sigurisë Panova',
    preheader: 'Ngjiteni këtë kod 6-shifror në ekranin e regjistrimit.',
    title: 'Kodi juaj i sigurisë',
    body: 'Mos e ndani këtë kod me askënd. Ngjiteni në ekranin e regjistrimit.',
    button: 'Konfirmo me lidhjen',
  },
  ar: {
    subject: 'رمز الأمان من Panova',
    preheader: 'الصق هذا الرمز المكوّن من 6 أرقام في شاشة التسجيل.',
    title: 'رمز الأمان',
    body: 'لا تشارك هذا الرمز مع أي شخص. الصقه في شاشة التسجيل.',
    button: 'التأكيد عبر الرابط',
  },
  mk: {
    subject: 'Вашиот безбедносен код за Panova',
    preheader: 'Залепете го овој 6-цифрен код на екранот за регистрација.',
    title: 'Вашиот безбедносен код',
    body: 'Не го споделувајте овој код со никого. Залепете го на екранот за регистрација.',
    button: 'Потврди со врската',
  },
};

export const authRecoveryCopy: Record<EmailLocale, AuthMessageCopy> = {
  tr: {
    subject: 'Panova şifre yenileme',
    preheader: 'Yeni şifre için 6 haneli kodu yazın.',
    title: 'Şifrenizi yenileyin',
    body: 'Yeni bir şifre seçmek için kodu yazın veya bağlantıyı açın. Bu isteği siz yapmadıysanız iletiyi yok sayın.',
    button: 'Şifreyi yenile',
  },
  en: {
    subject: 'Reset your Panova password',
    preheader: 'Enter the 6-digit code to choose a new password.',
    title: 'Reset your password',
    body: 'Enter the code to choose a new password, or open the link. If you did not ask for this, ignore this message.',
    button: 'Reset password',
  },
  sq: {
    subject: 'Rivendosni fjalëkalimin Panova',
    preheader: 'Shkruani kodin 6-shifror për një fjalëkalim të ri.',
    title: 'Rivendosni fjalëkalimin',
    body: 'Shkruani kodin për një fjalëkalim të ri, ose hapni lidhjen. Nëse nuk e kërkuat këtë, shpërfilleni letrën.',
    button: 'Rivendos fjalëkalimin',
  },
  ar: {
    subject: 'إعادة تعيين كلمة مرور Panova',
    preheader: 'أدخل الرمز المكوّن من 6 أرقام لاختيار كلمة مرور جديدة.',
    title: 'أعد تعيين كلمة المرور',
    body: 'أدخل الرمز لاختيار كلمة مرور جديدة، أو افتح الرابط. إذا لم تطلب ذلك، تجاهل الرسالة.',
    button: 'إعادة تعيين كلمة المرور',
  },
  mk: {
    subject: 'Ресетирајте ја лозинката за Panova',
    preheader: 'Внесете го 6-цифрениот код за нова лозинка.',
    title: 'Ресетирајте ја лозинката',
    body: 'Внесете го кодот за нова лозинка, или отворете ја врската. Ако не го побаравте ова, игнорирајте ја пораката.',
    button: 'Ресетирај ја лозинката',
  },
};

export type ContactMailCopy = {
  subjectPrefix: string;
  preheader: string;
  title: string;
  intro: string;
  labels: {
    name: string;
    email: string;
    phone: string;
    company: string;
    companyKey: string;
    submitted: string;
    id: string;
    notes: string;
  };
};

export const contactMailCopy: Record<EmailLocale, ContactMailCopy> = {
  tr: {
    subjectPrefix: 'Yeni iletişim formu',
    preheader: 'Web sitesinden yeni bir iletişim formu geldi.',
    title: 'Yeni iletişim formu',
    intro: 'Panova web sitesinden yeni bir iletişim formu geldi. Bu iletiye yanıt, formu dolduran kişiye gider.',
    labels: {
      name: 'Ad soyad',
      email: 'E-posta',
      phone: 'Telefon',
      company: 'Firma',
      companyKey: 'Firma kodu',
      submitted: 'Gönderim',
      id: 'Kayıt no',
      notes: 'Not',
    },
  },
  en: {
    subjectPrefix: 'New contact form',
    preheader: 'A new contact form arrived from the website.',
    title: 'New contact form',
    intro: 'A new contact form arrived from the Panova website. A reply to this message goes to the person who filled in the form.',
    labels: {
      name: 'Full name',
      email: 'Email',
      phone: 'Phone',
      company: 'Company',
      companyKey: 'Company code',
      submitted: 'Submitted',
      id: 'Record no.',
      notes: 'Note',
    },
  },
  sq: {
    subjectPrefix: 'Formular i ri kontakti',
    preheader: 'Erdhi një formular i ri kontakti nga faqja.',
    title: 'Formular i ri kontakti',
    intro: 'Erdhi një formular i ri kontakti nga faqja e Panova. Përgjigjja e kësaj letre shkon te personi që e plotësoi formularin.',
    labels: {
      name: 'Emri i plotë',
      email: 'E-mail',
      phone: 'Telefoni',
      company: 'Kompania',
      companyKey: 'Kodi i kompanisë',
      submitted: 'Dërguar',
      id: 'Numri i regjistrimit',
      notes: 'Shënim',
    },
  },
  ar: {
    subjectPrefix: 'نموذج اتصال جديد',
    preheader: 'وصل نموذج اتصال جديد من الموقع.',
    title: 'نموذج اتصال جديد',
    intro: 'وصل نموذج اتصال جديد من موقع Panova. الرد على هذه الرسالة يذهب إلى الشخص الذي ملأ النموذج.',
    labels: {
      name: 'الاسم الكامل',
      email: 'البريد',
      phone: 'الهاتف',
      company: 'الشركة',
      companyKey: 'رمز الشركة',
      submitted: 'الإرسال',
      id: 'رقم السجل',
      notes: 'ملاحظة',
    },
  },
  mk: {
    subjectPrefix: 'Нова форма за контакт',
    preheader: 'Пристигна нова форма за контакт од веб-страницата.',
    title: 'Нова форма за контакт',
    intro: 'Пристигна нова форма за контакт од веб-страницата на Panova. Одговорот на оваа порака оди кај лицето што ја пополни формата.',
    labels: {
      name: 'Име и презиме',
      email: 'Е-пошта',
      phone: 'Телефон',
      company: 'Фирма',
      companyKey: 'Код на фирма',
      submitted: 'Испратено',
      id: 'Број на запис',
      notes: 'Белешка',
    },
  },
};

/** Lower-case subject prefixes the inbox forwarder still recognizes. */
export function contactSubjectPrefixes(): string[] {
  return EMAIL_LOCALES.map((locale) => `${contactMailCopy[locale].subjectPrefix}:`.toLowerCase());
}

export const staffRoleLabels: Record<EmailLocale, Record<string, string>> = {
  tr: {
    upper_management: 'Üst Yönetim',
    source_country: 'Kaynak Ülke Sorumlusu',
    target_country: 'Hedef Ülke Sorumlusu',
    field_officer: 'Saha Görevlisi',
    finance: 'Finans',
    limited: 'Sınırlı Erişim',
  },
  en: {
    upper_management: 'Upper management',
    source_country: 'Source-country officer',
    target_country: 'Target-country officer',
    field_officer: 'Field officer',
    finance: 'Finance',
    limited: 'Limited access',
  },
  sq: {
    upper_management: 'Drejtimi i lartë',
    source_country: 'Përgjegjës i vendit burim',
    target_country: 'Përgjegjës i vendit të destinacionit',
    field_officer: 'Zyrtar terreni',
    finance: 'Financa',
    limited: 'Qasje e kufizuar',
  },
  ar: {
    upper_management: 'الإدارة العليا',
    source_country: 'مسؤول بلد المصدر',
    target_country: 'مسؤول بلد الوجهة',
    field_officer: 'موظف الميدان',
    finance: 'المالية',
    limited: 'وصول محدود',
  },
  mk: {
    upper_management: 'Врвно раководство',
    source_country: 'Одговорник за земја на потекло',
    target_country: 'Одговорник за земја на дестинација',
    field_officer: 'Теренски службеник',
    finance: 'Финансии',
    limited: 'Ограничен пристап',
  },
};

export type InviteMailCopy = {
  subject: string;
  preheader: string;
  title: string;
  hello: string;
  role: string;
  body: string;
  button: string;
  ignore: string;
};

export const inviteMailCopy: Record<EmailLocale, InviteMailCopy> = {
  tr: {
    subject: 'PANOVA Yönetim Portalı davetiniz',
    preheader: 'Portala bu e-posta adresiyle girin.',
    title: 'Yönetim portalına davet',
    hello: 'Merhaba {name},',
    role: 'Panova ekibine {role} rolüyle eklendiniz.',
    body: 'Hesabınızı etkinleştirmek için bağlantıya gidin ve bu e-posta adresiyle ({email}) Google ile giriş yapın veya e-posta ve şifre ile kayıt olun. Google dışı hesaplar, portala girmeden önce e-postadaki doğrulamayı tamamlar.',
    button: 'Portala git',
    ignore: 'Bu daveti beklemiyorsanız e-postayı yok sayabilirsiniz.',
  },
  en: {
    subject: 'Your invitation to the Panova management portal',
    preheader: 'Sign in to the portal with this email address.',
    title: 'Invitation to the management portal',
    hello: 'Hello {name},',
    role: 'You have been added to the Panova team as {role}.',
    body: 'To activate your account, open the link and sign in with Google, or register with this email address ({email}) and a password. Accounts that do not use Google sign-in must finish the email verification before the portal opens.',
    button: 'Open the portal',
    ignore: 'If you were not expecting this invitation, you can ignore this email.',
  },
  sq: {
    subject: 'Ftesa juaj për portalin e menaxhimit Panova',
    preheader: 'Hyni në portal me këtë adresë e-maili.',
    title: 'Ftesë për portalin e menaxhimit',
    hello: 'Përshëndetje {name},',
    role: 'Ju u shtuat në ekipin Panova me rolin {role}.',
    body: 'Për ta aktivizuar llogarinë, hapni lidhjen dhe hyni me Google ose regjistrohuni me këtë adresë e-maili ({email}) dhe një fjalëkalim. Llogaritë që nuk hyjnë me Google duhet të përfundojnë verifikimin e e-mailit para se të hapet portali.',
    button: 'Hape portalin',
    ignore: 'Nëse nuk e prisnit këtë ftesë, mund ta shpërfillni këtë e-mail.',
  },
  ar: {
    subject: 'دعوتك إلى بوابة إدارة Panova',
    preheader: 'ادخل إلى البوابة بهذا البريد.',
    title: 'دعوة إلى بوابة الإدارة',
    hello: 'مرحبًا {name}،',
    role: 'أُضيفت إلى فريق Panova بدور {role}.',
    body: 'لتفعيل الحساب، افتح الرابط وادخل عبر Google أو سجّل بهذا البريد ({email}) وكلمة مرور. الحسابات التي لا تستخدم Google تكمل التحقق من البريد قبل فتح البوابة.',
    button: 'فتح البوابة',
    ignore: 'إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل الرسالة.',
  },
  mk: {
    subject: 'Покана за порталот за управување на Panova',
    preheader: 'Најавете се на порталот со оваа е-пошта.',
    title: 'Покана за порталот за управување',
    hello: 'Здраво {name},',
    role: 'Додадени сте во тимот на Panova со улога {role}.',
    body: 'За да ја активирате сметката, отворете ја врската и најавете се со Google или регистрирајте се со оваа е-пошта ({email}) и лозинка. Сметките што не користат Google ја завршуваат потврдата на е-поштата пред да се отвори порталот.',
    button: 'Отвори го порталот',
    ignore: 'Ако не ја очекувавте оваа покана, можете да ја игнорирате пораката.',
  },
};

export type NoticeMailCopy = {
  subjectPrefix: string;
  preheader: string;
  title: string;
  greeting: string;
  lead: string;
  fallbackName: string;
  taskSubject: string;
  taskTitle: string;
  taskHello: string;
  taskLead: string;
  taskDue: string;
  taskBackup: string;
  taskUnspecified: string;
  taskAction: string;
  taskButton: string;
  fallbackAssignee: string;
  missingEmail: string;
  sendFailed: string;
};

export const noticeMailCopy: Record<EmailLocale, NoticeMailCopy> = {
  tr: {
    subjectPrefix: 'PANOVA Bildirim',
    preheader: 'Yönetim panelinden yeni bir bildirim.',
    title: 'Yeni bildirim',
    greeting: 'Sayın {name},',
    lead: 'Yönetim panelinden size yeni bir bildirim iletildi.',
    fallbackName: 'Adayımız',
    taskSubject: 'Yeni görev: {title}',
    taskTitle: 'Yeni görev atandı',
    taskHello: 'Merhaba {name},',
    taskLead: 'Sisteme yeni bir görev eklendi ve sorumlusu olarak atandınız.',
    taskDue: 'Son tamamlama tarihi',
    taskBackup: 'Yedek sorumlu',
    taskUnspecified: 'Belirtilmedi',
    taskAction: 'Portaldan görevi kontrol edin ve tamamlandığında işaretleyin.',
    taskButton: 'Portalı aç',
    fallbackAssignee: 'Ekip üyesi',
    missingEmail: 'E-posta adresi bulunamadı.',
    sendFailed: 'E-posta gönderilemedi.',
  },
  en: {
    subjectPrefix: 'Panova notice',
    preheader: 'A new notice from the management portal.',
    title: 'New notice',
    greeting: 'Dear {name},',
    lead: 'A new notice was sent to you from the management portal.',
    fallbackName: 'Candidate',
    taskSubject: 'New task: {title}',
    taskTitle: 'A new task was assigned',
    taskHello: 'Hello {name},',
    taskLead: 'A new task was added and you were assigned as the owner.',
    taskDue: 'Due date',
    taskBackup: 'Backup owner',
    taskUnspecified: 'Not specified',
    taskAction: 'Check the task in the portal and mark it when it is done.',
    taskButton: 'Open the portal',
    fallbackAssignee: 'Team member',
    missingEmail: 'Email address is missing.',
    sendFailed: 'The email could not be sent.',
  },
  sq: {
    subjectPrefix: 'Njoftim Panova',
    preheader: 'Një njoftim i ri nga portali i menaxhimit.',
    title: 'Njoftim i ri',
    greeting: 'I nderuar {name},',
    lead: 'Ju u dërgua një njoftim i ri nga portali i menaxhimit.',
    fallbackName: 'Kandidat',
    taskSubject: 'Detyrë e re: {title}',
    taskTitle: 'U caktua një detyrë e re',
    taskHello: 'Përshëndetje {name},',
    taskLead: 'U shtua një detyrë e re dhe ju u caktuat si përgjegjës.',
    taskDue: 'Data e përfundimit',
    taskBackup: 'Përgjegjës rezervë',
    taskUnspecified: 'Nuk është caktuar',
    taskAction: 'Kontrolloni detyrën në portal dhe shënojeni kur të përfundojë.',
    taskButton: 'Hape portalin',
    fallbackAssignee: 'Anëtar i ekipit',
    missingEmail: 'Adresa e e-mailit mungon.',
    sendFailed: 'E-maili nuk u dërgua.',
  },
  ar: {
    subjectPrefix: 'إشعار Panova',
    preheader: 'إشعار جديد من بوابة الإدارة.',
    title: 'إشعار جديد',
    greeting: 'عزيزي {name}،',
    lead: 'أُرسل إليك إشعار جديد من بوابة الإدارة.',
    fallbackName: 'المرشح',
    taskSubject: 'مهمة جديدة: {title}',
    taskTitle: 'عُيّنت مهمة جديدة',
    taskHello: 'مرحبًا {name}،',
    taskLead: 'أُضيفت مهمة جديدة وعُيّنت مسؤولًا عنها.',
    taskDue: 'تاريخ الإنجاز',
    taskBackup: 'المسؤول البديل',
    taskUnspecified: 'غير محدد',
    taskAction: 'راجع المهمة في البوابة وعلّمها عند اكتمالها.',
    taskButton: 'فتح البوابة',
    fallbackAssignee: 'عضو الفريق',
    missingEmail: 'عنوان البريد مفقود.',
    sendFailed: 'تعذر إرسال البريد.',
  },
  mk: {
    subjectPrefix: 'Известување од Panova',
    preheader: 'Ново известување од порталот за управување.',
    title: 'Ново известување',
    greeting: 'Почитуван {name},',
    lead: 'Ви е испратено ново известување од порталот за управување.',
    fallbackName: 'Кандидат',
    taskSubject: 'Нова задача: {title}',
    taskTitle: 'Доделена е нова задача',
    taskHello: 'Здраво {name},',
    taskLead: 'Додадена е нова задача и вие сте назначени за одговорни.',
    taskDue: 'Рок',
    taskBackup: 'Заменик одговорник',
    taskUnspecified: 'Не е наведено',
    taskAction: 'Проверете ја задачата на порталот и означете ја кога ќе заврши.',
    taskButton: 'Отвори го порталот',
    fallbackAssignee: 'Член на тимот',
    missingEmail: 'Недостасува адреса за е-пошта.',
    sendFailed: 'Е-поштата не можеше да се испрати.',
  },
};

export type ForwardMailCopy = {
  intro: string;
  contactIntro: string;
  from: string;
  to: string;
  cc: string;
  subject: string;
  date: string;
  original: string;
  emptyBody: string;
  noSubject: string;
};

export const forwardMailCopy: Record<EmailLocale, ForwardMailCopy> = {
  tr: {
    intro: 'Panova gelen kutusu iletisi. Yanıt, özgün gönderene gider.',
    contactIntro: 'Panova iletişim formu. Yanıt, formu dolduran kişiye gider.',
    from: 'Kimden',
    to: 'Kime',
    cc: 'Cc',
    subject: 'Konu',
    date: 'Tarih',
    original: 'Özgün ileti',
    emptyBody: '(gövde yok)',
    noSubject: '(konu yok)',
  },
  en: {
    intro: 'Panova inbox message. A reply goes to the original sender.',
    contactIntro: 'Panova contact form. A reply goes to the person who filled in the form.',
    from: 'From',
    to: 'To',
    cc: 'Cc',
    subject: 'Subject',
    date: 'Date',
    original: 'Original message',
    emptyBody: '(no body)',
    noSubject: '(no subject)',
  },
  sq: {
    intro: 'Letër e kutisë Panova. Përgjigjja shkon te dërguesi fillestar.',
    contactIntro: 'Formular kontakti Panova. Përgjigjja shkon te personi që e plotësoi formularin.',
    from: 'Nga',
    to: 'Për',
    cc: 'Cc',
    subject: 'Subjekti',
    date: 'Data',
    original: 'Letra fillestare',
    emptyBody: '(pa tekst)',
    noSubject: '(pa subjekt)',
  },
  ar: {
    intro: 'رسالة من صندوق Panova. الرد يذهب إلى المرسِل الأصلي.',
    contactIntro: 'نموذج اتصال Panova. الرد يذهب إلى الشخص الذي ملأ النموذج.',
    from: 'من',
    to: 'إلى',
    cc: 'نسخة',
    subject: 'الموضوع',
    date: 'التاريخ',
    original: 'الرسالة الأصلية',
    emptyBody: '(لا يوجد نص)',
    noSubject: '(بدون موضوع)',
  },
  mk: {
    intro: 'Порака од сандачето на Panova. Одговорот оди кај оригиналниот испраќач.',
    contactIntro: 'Форма за контакт на Panova. Одговорот оди кај лицето што ја пополни формата.',
    from: 'Од',
    to: 'До',
    cc: 'Cc',
    subject: 'Наслов',
    date: 'Датум',
    original: 'Оригинална порака',
    emptyBody: '(нема текст)',
    noSubject: '(нема наслов)',
  },
};

export type EmployerInviteMailCopy = {
  inviteSubject: string;
  resetSubject: string;
  preheader: string;
  inviteTitle: string;
  resetTitle: string;
  hello: string;
  inviteBody: string;
  resetBody: string;
  google: string;
  button: string;
  ignore: string;
};

export const employerInviteMailCopy: Record<EmailLocale, EmployerInviteMailCopy> = {
  tr: {
    inviteSubject: 'Panova işveren portalı davetiniz',
    resetSubject: 'Panova işveren portalı şifre bağlantısı',
    preheader: 'Şifrenizi belirleyin veya aynı adresle Google ile giriş yapın.',
    inviteTitle: 'İşveren portalına davet',
    resetTitle: 'İşveren portalı şifresi',
    hello: 'Merhaba {name},',
    inviteBody: '{company} için Panova işveren portalı hazır. Bu adres ({email}) ile şifrenizi belirleyin. Bağlantı sizi şifre ekranına götürür.',
    resetBody: '{company} işveren portalı hesabınız bağlı. Şifrenizi belirlemek veya yenilemek için bağlantıyı kullanın. Adres: {email}.',
    google: 'Aynı adresle Google üzerinden de giriş yapabilirsiniz: {login}',
    button: 'Şifrenizi belirleyin',
    ignore: 'Bu daveti beklemiyorsanız e-postayı yok sayabilirsiniz.',
  },
  en: {
    inviteSubject: 'Your invitation to the Panova employer portal',
    resetSubject: 'Panova employer portal password link',
    preheader: 'Set your password, or sign in with Google using this address.',
    inviteTitle: 'Invitation to the employer portal',
    resetTitle: 'Employer portal password',
    hello: 'Hello {name},',
    inviteBody: 'The Panova employer portal is ready for {company}. Set your password for this address ({email}). The link opens the password screen.',
    resetBody: 'Your employer portal account for {company} is linked. Use the link to set or reset your password. Address: {email}.',
    google: 'You can also sign in with Google using the same address: {login}',
    button: 'Set your password',
    ignore: 'If you were not expecting this message, you can ignore it.',
  },
  sq: {
    inviteSubject: 'Ftesa juaj për portalin e punëdhënësit Panova',
    resetSubject: 'Lidhja e fjalëkalimit për portalin e punëdhënësit Panova',
    preheader: 'Vendosni fjalëkalimin ose hyni me Google në këtë adresë.',
    inviteTitle: 'Ftesë për portalin e punëdhënësit',
    resetTitle: 'Fjalëkalimi i portalit të punëdhënësit',
    hello: 'Përshëndetje {name},',
    inviteBody: 'Portali i punëdhënësit Panova është gati për {company}. Vendosni fjalëkalimin për këtë adresë ({email}). Lidhja hap ekranin e fjalëkalimit.',
    resetBody: 'Llogaria juaj për {company} është lidhur. Përdorni lidhjen për të vendosur ose rivendosur fjalëkalimin. Adresa: {email}.',
    google: 'Mund të hyni edhe me Google në të njëjtën adresë: {login}',
    button: 'Vendosni fjalëkalimin',
    ignore: 'Nëse nuk e prisnit këtë mesazh, mund ta shpërfillni.',
  },
  ar: {
    inviteSubject: 'دعوتك إلى بوابة صاحب العمل في Panova',
    resetSubject: 'رابط كلمة مرور بوابة صاحب العمل في Panova',
    preheader: 'حدد كلمة المرور أو ادخل عبر Google بهذا العنوان.',
    inviteTitle: 'دعوة إلى بوابة صاحب العمل',
    resetTitle: 'كلمة مرور بوابة صاحب العمل',
    hello: 'مرحبًا {name}،',
    inviteBody: 'بوابة صاحب العمل في Panova جاهزة لـ {company}. حدد كلمة المرور لهذا العنوان ({email}). يفتح الرابط شاشة كلمة المرور.',
    resetBody: 'حساب بوابة صاحب العمل لـ {company} مربوط. استخدم الرابط لتحديد كلمة المرور أو إعادة تعيينها. العنوان: {email}.',
    google: 'يمكنك أيضًا الدخول عبر Google بنفس العنوان: {login}',
    button: 'تحديد كلمة المرور',
    ignore: 'إذا لم تكن تتوقع هذه الرسالة، يمكنك تجاهلها.',
  },
  mk: {
    inviteSubject: 'Покана за порталот за работодавачи на Panova',
    resetSubject: 'Врска за лозинка на порталот за работодавачи на Panova',
    preheader: 'Поставете лозинка или најавете се со Google на оваа адреса.',
    inviteTitle: 'Покана за порталот за работодавачи',
    resetTitle: 'Лозинка за порталот за работодавачи',
    hello: 'Здраво {name},',
    inviteBody: 'Порталот за работодавачи на Panova е подготвен за {company}. Поставете лозинка за оваа адреса ({email}). Врската ја отвора страницата за лозинка.',
    resetBody: 'Сметката за {company} е поврзана. Користете ја врската за да поставите или ресетирате лозинка. Адреса: {email}.',
    google: 'Можете да се најавите и со Google на истата адреса: {login}',
    button: 'Поставете лозинка',
    ignore: 'Ако не ја очекувавте оваа порака, можете да ја игнорирате.',
  },
};
