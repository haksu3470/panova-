import type { Language } from './dictionary';
import { SITE_ORIGIN } from './siteUrl';

export const DEMO_LOGIN_KINDS = ['candidate', 'employer', 'staff'] as const;
export type DemoLoginKind = (typeof DEMO_LOGIN_KINDS)[number];

export function isDemoLoginKind(value: string): value is DemoLoginKind {
  return (DEMO_LOGIN_KINDS as readonly string[]).includes(value);
}

/** The live site and this project's Vercel previews (also in the Supabase redirect allow list). */
const PREVIEW = /^https:\/\/panova-git-[a-z0-9-]+-haksu3470\.vercel\.app$/;

/**
 * Where the magic link lands: the page the request came from when it is the
 * live site or a preview of this project, else the live site. Never an
 * arbitrary origin, so a link cannot be sent to another host.
 */
export function demoLoginRedirect(origin: string | null | undefined, path: string): string {
  const safePath = path.startsWith('/') && !path.startsWith('//') ? path : '/';
  const o = (origin || '').trim().replace(/\/+$/, '');
  const base = o === SITE_ORIGIN || PREVIEW.test(o) ? o : SITE_ORIGIN;
  return `${base}${safePath}`;
}

export const demoLoginLabels: Record<Language, {
  button: string;
  testAccount: string;
  on: string;
  off: string;
  making: string;
  ready: string;
  copy: string;
  copied: string;
  warning: string;
  failed: string;
}> = {
  tr: {
    button: 'Bu hesapla test girişi',
    testAccount: 'Test hesabı (üst yönetim bu hesapla giriş yapabilir)',
    on: 'Test hesabı',
    off: 'Gerçek hesap',
    making: 'Giriş bağlantısı hazırlanıyor…',
    ready: '{name} için tek kullanımlık giriş bağlantısı hazır.',
    copy: 'Bağlantıyı kopyala',
    copied: 'Kopyalandı',
    warning: 'Bağlantıyı GİZLİ PENCEREDE açın. Bu pencerede açarsanız kendi oturumunuz bu hesapla değişir. Bağlantı bir kez ve kısa süre geçerlidir; giriş işlem geçmişine yazıldı.',
    failed: 'Giriş bağlantısı hazırlanamadı.',
  },
  en: {
    button: 'Test sign-in as this account',
    testAccount: 'Test account (upper management can sign in as it)',
    on: 'Test account',
    off: 'Real account',
    making: 'Preparing the sign-in link…',
    ready: 'One-time sign-in link for {name} is ready.',
    copy: 'Copy link',
    copied: 'Copied',
    warning: 'Open the link in a PRIVATE WINDOW. Opened here, it replaces your own session. The link works once, for a short time; the sign-in was recorded in the audit log.',
    failed: 'The sign-in link could not be prepared.',
  },
  sq: {
    button: 'Hyrje testuese me këtë llogari',
    testAccount: 'Llogari testuese (menaxhimi i lartë mund të hyjë me të)',
    on: 'Llogari testuese',
    off: 'Llogari reale',
    making: 'Po përgatitet lidhja e hyrjes…',
    ready: 'Lidhja njëpërdorimshe e hyrjes për {name} është gati.',
    copy: 'Kopjo lidhjen',
    copied: 'U kopjua',
    warning: 'Hapeni lidhjen në një DRITARE PRIVATE. Nëse e hapni këtu, sesioni juaj zëvendësohet. Lidhja vlen një herë dhe për pak kohë; hyrja u regjistrua.',
    failed: 'Lidhja e hyrjes nuk u përgatit.',
  },
  ar: {
    button: 'دخول تجريبي بهذا الحساب',
    testAccount: 'حساب تجريبي (يمكن للإدارة العليا الدخول به)',
    on: 'حساب تجريبي',
    off: 'حساب حقيقي',
    making: 'جارٍ تجهيز رابط الدخول…',
    ready: 'رابط الدخول لمرة واحدة لـ {name} جاهز.',
    copy: 'نسخ الرابط',
    copied: 'تم النسخ',
    warning: 'افتح الرابط في نافذة خاصة. إذا فتحته هنا فستُستبدل جلستك. الرابط صالح لمرة واحدة ولمدة قصيرة؛ تم تسجيل الدخول في سجل العمليات.',
    failed: 'تعذّر تجهيز رابط الدخول.',
  },
  mk: {
    button: 'Тест најава со оваа сметка',
    testAccount: 'Тест сметка (највисокото раководство може да се најави со неа)',
    on: 'Тест сметка',
    off: 'Вистинска сметка',
    making: 'Се подготвува врската за најава…',
    ready: 'Еднократната врска за најава за {name} е подготвена.',
    copy: 'Копирај врска',
    copied: 'Копирано',
    warning: 'Отворете ја врската во ПРИВАТЕН ПРОЗОРЕЦ. Ако ја отворите тука, вашата сесија се заменува. Врската важи еднаш и кратко; најавата е запишана.',
    failed: 'Врската за најава не може да се подготви.',
  },
};
