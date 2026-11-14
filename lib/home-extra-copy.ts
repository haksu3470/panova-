import type { Language } from '@/lib/dictionary';

/**
 * Home page texts added with the 2026-11 redesign (hero map and flow card,
 * sign-in menu, stats, sector cards, "why trust us"). The rest of the home
 * copy is in lib/home-copy.ts.
 *
 * Example positions on the sector cards are profession keys from
 * lib/professions.ts, so their names come from the catalog in every language.
 */
export type HomeExtraCopy = {
  login: { label: string; candidate: string; employer: string; staff: string };
  hero: {
    /** Accessible name of the line drawing of the office countries (company.presence). */
    mapLabel: string;
    flowTitle: string;
    flow: [string, string, string, string];
  };
  statsHeading: string;
  sectionsNav: string;
  sectorsStatHint: string;
  sectorCards: { desc: string }[];
  examplesLabel: string;
  trustTitle: string;
  registryTitle: string;
  /** {shortName}, {embs}, {vkn} come from lib/company.ts. */
  registryDesc: string;
  kvkkTitle: string;
  /** Second sentence of the "clear process" card (only facts the portal shows). */
  processDetail: string;
  contactInfo: string;
};

/** Catalog profession keys shown as examples, in the order of homeCopy[lang].sectorNames. */
export const SECTOR_EXAMPLES: readonly (readonly [string, string, string])[] = [
  ['mason', 'electrician', 'heavy_equipment_operator'],
  ['greenhouse_worker', 'harvest_worker', 'tractor_operator'],
  ['machine_operator', 'cnc_operator', 'assembly_worker'],
  ['welder', 'steel_fixer', 'maintenance_technician'],
  ['truck_driver', 'forklift_driver', 'order_picker'],
  ['cook', 'waiter', 'housekeeper'],
  ['caregiver', 'elderly_caregiver', 'nursing_assistant'],
  ['cashier', 'sales_assistant', 'cleaner'],
];

export const homeExtraCopy: Record<Language, HomeExtraCopy> = {
  tr: {
    login: { label: 'Giriş', candidate: 'Aday', employer: 'İşveren', staff: 'Personel' },
    hero: {
      mapLabel: 'Kuzey Makedonya, Türkiye ve Bangladeş’i birbirine bağlayan şematik hat çizimi',
      flowTitle: 'İşleyiş',
      flow: ['Talep', 'Aday', 'Mülakat', 'İşe başlama'],
    },
    statsHeading: 'Rakamlarla Panova',
    sectionsNav: 'Sayfa bölümleri',
    sectorsStatHint: 'Sektörleri gör',
    sectorCards: [
      { desc: 'Şantiye ve altyapı projeleri için usta, operatör ve ekip.' },
      { desc: 'Sera, hasat ve tarla işleri için mevsimlik ve sürekli personel.' },
      { desc: 'Fabrika hatları için makine ve montaj personeli.' },
      { desc: 'Belgeli kaynak, demir ve bakım ustaları.' },
      { desc: 'Depo, yükleme ve taşımacılık için şoför ve operatör.' },
      { desc: 'Otel ve restoranlar için mutfak, servis ve kat personeli.' },
      { desc: 'Yaşlı, hasta ve evde bakım için bakım personeli.' },
      { desc: 'Mağaza, kasa ve temizlik hizmetleri için personel.' },
    ],
    examplesLabel: 'Örnek pozisyonlar',
    trustTitle: 'Neden güvenilir?',
    registryTitle: 'Resmî şirket kaydı',
    registryDesc: 'Sicil: {shortName}, EMBS {embs}. Türkiye ofisi: VKN {vkn}.',
    kvkkTitle: 'KVKK ve veri güvenliği',
    processDetail: 'Talep durumu aday sunumu, mülakat ve seçimle kendiliğinden ilerler; resmî süreç sekiz adımda gösterilir.',
    contactInfo: 'İletişim bilgileri',
  },
  en: {
    login: { label: 'Sign in', candidate: 'Candidate', employer: 'Employer', staff: 'Staff' },
    hero: {
      mapLabel: 'Schematic line drawing linking North Macedonia, Türkiye and Bangladesh',
      flowTitle: 'How it works',
      flow: ['Request', 'Candidate', 'Interview', 'Start of work'],
    },
    statsHeading: 'Panova in numbers',
    sectionsNav: 'Page sections',
    sectorsStatHint: 'See the sectors',
    sectorCards: [
      { desc: 'Tradespeople, operators and crews for building and infrastructure sites.' },
      { desc: 'Seasonal and permanent staff for greenhouse, harvest and field work.' },
      { desc: 'Machine and assembly staff for factory lines.' },
      { desc: 'Certified welders, steel fixers and maintenance technicians.' },
      { desc: 'Drivers and operators for warehousing, loading and transport.' },
      { desc: 'Kitchen, service and housekeeping staff for hotels and restaurants.' },
      { desc: 'Care staff for elderly, patient and home care.' },
      { desc: 'Staff for shops, checkouts and cleaning services.' },
    ],
    examplesLabel: 'Example positions',
    trustTitle: 'Why you can trust us',
    registryTitle: 'Official company registration',
    registryDesc: 'Registry: {shortName}, EMBS {embs}. Türkiye office: VAT ID {vkn}.',
    kvkkTitle: 'KVKK and data security',
    processDetail: 'The request status moves on by itself as candidates are presented, interviewed and selected; the official process is shown in eight steps.',
    contactInfo: 'Contact details',
  },
  sq: {
    login: { label: 'Hyrja', candidate: 'Kandidat', employer: 'Punëdhënës', staff: 'Staf' },
    hero: {
      mapLabel: 'Vizatim skematik me vija i lidhjes Maqedonia e Veriut – Turqia – Bangladesh',
      flowTitle: 'Si funksionon',
      flow: ['Kërkesa', 'Kandidati', 'Intervista', 'Fillimi i punës'],
    },
    statsHeading: 'Panova në shifra',
    sectionsNav: 'Pjesët e faqes',
    sectorsStatHint: 'Shih sektorët',
    sectorCards: [
      { desc: 'Mjeshtër, operatorë dhe ekipe për kantiere ndërtimi dhe infrastrukture.' },
      { desc: 'Personel sezonal dhe i përhershëm për serra, korrje dhe punë në fushë.' },
      { desc: 'Personel makinerie dhe montimi për linjat e fabrikave.' },
      { desc: 'Saldatorë, hekurpunues dhe teknikë mirëmbajtjeje me certifikatë.' },
      { desc: 'Shoferë dhe operatorë për magazinim, ngarkim dhe transport.' },
      { desc: 'Personel kuzhine, shërbimi dhe dhomash për hotele dhe restorante.' },
      { desc: 'Personel kujdesi për të moshuarit, pacientët dhe kujdesin në shtëpi.' },
      { desc: 'Personel për dyqane, arka dhe shërbime pastrimi.' },
    ],
    examplesLabel: 'Pozicione shembull',
    trustTitle: 'Pse të na besoni?',
    registryTitle: 'Regjistrim zyrtar i kompanisë',
    registryDesc: 'Regjistri: {shortName}, EMBS {embs}. Zyra e Turqisë: Nr. i TVSH-së {vkn}.',
    kvkkTitle: 'KVKK dhe siguria e të dhënave',
    processDetail: 'Statusi i kërkesës ecën vetë me paraqitjen, intervistën dhe zgjedhjen e kandidatëve; procesi zyrtar shfaqet në tetë hapa.',
    contactInfo: 'Të dhënat e kontaktit',
  },
  ar: {
    login: { label: 'تسجيل الدخول', candidate: 'المرشح', employer: 'صاحب العمل', staff: 'الموظفون' },
    hero: {
      mapLabel: 'رسم تخطيطي بالخطوط يربط مقدونيا الشمالية وتركيا وبنغلاديش',
      flowTitle: 'كيف نعمل',
      flow: ['الطلب', 'المرشح', 'المقابلة', 'بدء العمل'],
    },
    statsHeading: 'بانوفا بالأرقام',
    sectionsNav: 'أقسام الصفحة',
    sectorsStatHint: 'عرض القطاعات',
    sectorCards: [
      { desc: 'حرفيون ومشغّلون وفرق لمواقع البناء والبنية التحتية.' },
      { desc: 'عمالة موسمية ودائمة للبيوت المحمية والحصاد والعمل الحقلي.' },
      { desc: 'عاملون على الآلات والتجميع لخطوط المصانع.' },
      { desc: 'لحّامون وحدّادون وفنيو صيانة حاصلون على شهادات.' },
      { desc: 'سائقون ومشغّلون للمستودعات والتحميل والنقل.' },
      { desc: 'عاملون في المطبخ والخدمة والغرف للفنادق والمطاعم.' },
      { desc: 'عاملو رعاية لكبار السن والمرضى والرعاية المنزلية.' },
      { desc: 'عاملون للمتاجر والصناديق وخدمات التنظيف.' },
    ],
    examplesLabel: 'أمثلة على الوظائف',
    trustTitle: 'لماذا يمكنكم الوثوق بنا؟',
    registryTitle: 'تسجيل رسمي للشركة',
    registryDesc: 'السجل: {shortName}، EMBS {embs}. مكتب تركيا: رقم ضريبة القيمة المضافة {vkn}.',
    kvkkTitle: 'KVKK وأمان البيانات',
    processDetail: 'تتقدّم حالة الطلب تلقائيًا مع تقديم المرشحين ومقابلتهم واختيارهم، وتُعرض الإجراءات الرسمية في ثماني خطوات.',
    contactInfo: 'بيانات الاتصال',
  },
  mk: {
    login: { label: 'Најава', candidate: 'Кандидат', employer: 'Работодавач', staff: 'Персонал' },
    hero: {
      mapLabel: 'Шематски цртеж со линии што ги поврзува Северна Македонија, Турција и Бангладеш',
      flowTitle: 'Како работи',
      flow: ['Барање', 'Кандидат', 'Интервју', 'Почеток на работа'],
    },
    statsHeading: 'Panova во бројки',
    sectionsNav: 'Делови на страницата',
    sectorsStatHint: 'Види ги секторите',
    sectorCards: [
      { desc: 'Мајстори, оператори и екипи за градежни и инфраструктурни градилишта.' },
      { desc: 'Сезонски и постојан персонал за оранжерии, берба и полска работа.' },
      { desc: 'Персонал за машини и монтажа на фабрички линии.' },
      { desc: 'Сертифицирани заварувачи, арматурачи и техничари за одржување.' },
      { desc: 'Возачи и оператори за магацини, товарање и транспорт.' },
      { desc: 'Персонал за кујна, услуга и соби во хотели и ресторани.' },
      { desc: 'Персонал за нега на стари лица, пациенти и нега во дома.' },
      { desc: 'Персонал за продавници, каси и услуги за чистење.' },
    ],
    examplesLabel: 'Примерни позиции',
    trustTitle: 'Зошто да ни верувате?',
    registryTitle: 'Официјална регистрација на компанијата',
    registryDesc: 'Регистар: {shortName}, ЕМБС {embs}. Канцеларија во Турција: ДДВ број {vkn}.',
    kvkkTitle: 'KVKK и безбедност на податоците',
    processDetail: 'Статусот на барањето напредува сам со претставување, интервју и избор на кандидатите; официјалната постапка се прикажува во осум чекори.',
    contactInfo: 'Податоци за контакт',
  },
};
