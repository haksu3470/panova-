import type { Language } from '@/lib/dictionary';

export type CopyPair = { title: string; desc: string };

export type HomeCopy = {
  langLabel: string;
  nav: { employers: string; candidates: string; sectors: string; how: string; group: string; about: string; faq: string };
  ctaHire: string;
  ctaJob: string;
  ctaQuote: string;
  contactDirect: string;
  stats: { value: string; label: string }[];
  employersEyebrow: string;
  employersTitle: string;
  employersDesc: string;
  employerServices: CopyPair[];
  createDemand: string;
  candidatesEyebrow: string;
  candidatesTitle: string;
  candidatesDesc: string;
  applyNow: string;
  candidateLogin: string;
  candidateItems: CopyPair[];
  sectorsEyebrow: string;
  sectorsTitle: string;
  sectorsDesc: string;
  sectorNames: string[];
  howEyebrow: string;
  howTitle: string;
  steps: CopyPair[];
  trustEyebrow: string;
  trustTitle: string;
  trust: CopyPair[];
  partnersNote: string;
  faqEyebrow: string;
  faqTitle: string;
  faqs: { q: string; a: string }[];
  bandTitle: string;
  bandDesc: string;
  getQuote: string;
  footer: {
    employers: string; services: string; employerLogin: string; quote: string;
    candidates: string; apply: string; sectors: string; faq: string;
    corporate: string; registry: string; how: string; staffPortal: string; kvkk: string;
    rights: string; taxNo: string;
  };
  about: {
    eyebrow: string;
    presenceTitle: string;
    presenceDesc: string;
    countries: [string, string, string];
    northMacedonia: string;
    turkeyOffice: string;
    bangladeshOffice: string;
    address: string; email: string; phone: string; registry: string;
    taxNo: string; established: string; establishedValue: string;
    managers: string; mkShort: string;
    vkn: string; siteTaxOffice: string;
  };
  kvkk: {
    title: string; home: string; intro: string; controller: string; shortName: string;
    address: string; email: string; taxId: string; purposeTitle: string; purpose: string;
    rightsTitle: string; rightsBefore: string; rightsOr: string; rightsAfter: string;
  };
  oauthOr: string;
  oauthGoogle: string;
  passwordMin: string;
  signUpAndIn: string;
  formSectors: { value: string; label: string }[];
  supplier: {
    title: string; subtitle: string; success: string; another: string;
    company: string; companyPh: string; name: string; passport: string;
    phone: string; email: string; save: string; saving: string;
  };
  gate: {
    checking: string; loginRequired: string; noAccess: string; loginBody: string;
    noAccessBody: string; staffLogin: string; sessionChecking: string; unauthorized: string;
  };
  admin: {
    title: string; sub: string; home: string;
    tabs: Record<string, string>;
    totalCandidates: string; activeEmployers: string; openRequests: string; travelReady: string;
    employersTitle: string; colCompany: string; colContact: string; colCountry: string; colDemands: string; colOwner: string;
    tasksTitle: string; colTask: string; colAssignee: string; colDue: string; colStatus: string;
    moduleOn: string; moduleDesc: string;
  };
};

export function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '');
}

const sectorsTr = ['İnşaat & Altyapı', 'Tarım & Seracılık', 'Üretim & Sanayi', 'Kaynak & Teknik Ustalık', 'Lojistik & Depo', 'Turizm & Otelcilik', 'Sağlık & Bakım', 'Perakende & Hizmet'];
const sectorsEn = ['Construction & infrastructure', 'Agriculture & greenhouses', 'Manufacturing & industry', 'Welding & skilled trades', 'Logistics & warehousing', 'Tourism & hospitality', 'Health & care', 'Retail & services'];
const sectorsSq = ['Ndërtim & infrastrukturë', 'Bujqësi & serra', 'Prodhim & industri', 'Saldim & zanate', 'Logjistikë & magazinë', 'Turizëm & hoteleri', 'Shëndet & kujdes', 'Shitje & shërbime'];
const sectorsAr = ['البناء والبنية التحتية', 'الزراعة والبيوت المحمية', 'الإنتاج والصناعة', 'اللحام والمهن التقنية', 'اللوجستيات والمستودعات', 'السياحة والفنادق', 'الصحة والرعاية', 'التجزئة والخدمات'];
const sectorsMk = [
  'Градежништво и инфраструктура',
  'Земјоделство и оранжерии',
  'Производство и индустрија',
  'Заварување и стручни занаети',
  'Логистика и магацини',
  'Туризам и хотелиерство',
  'Здравство и нега',
  'Трговија на мало и услуги',
];

export const homeCopy: Record<Language, HomeCopy> = {
  tr: {
    langLabel: 'Dil',
    nav: { employers: 'İşverenler', candidates: 'Adaylar', sectors: 'Sektörler', how: 'Nasıl Çalışır', group: 'Grup Şirketleri', about: 'Kurumsal', faq: 'SSS' },
    ctaHire: 'Personel arıyorum',
    ctaJob: 'İş arıyorum',
    ctaQuote: 'Kurumsal Teklif Al',
    contactDirect: '{name} ile doğrudan iletişime geçin.',
    stats: [
      { value: '3', label: 'Ülkede faaliyet' },
      { value: '4', label: 'Grup şirketi' },
      { value: '8+', label: 'Ana sektör' },
      { value: '30/60/90', label: 'Gün işe uyum takibi' },
    ],
    employersEyebrow: 'İşverenler için',
    employersTitle: 'Doğru personel, doğru zamanda',
    employersDesc: 'Talebinizden işe uyuma kadar tüm insan kaynakları sürecini tek elden yönetiyoruz.',
    employerServices: [
      { title: 'Yurt Dışı Personel Temini', desc: 'AB ve Türkiye için sertifikalı, akredite yetkinliğe sahip aday havuzundan hızlı kısa liste.' },
      { title: 'Toplu & Proje Bazlı İşe Alım', desc: 'İnşaat, tarım ve üretim projeleri için ekip bazlı planlama ve dalga dalga yerleştirme.' },
      { title: 'Belge & Sertifika Doğrulama', desc: 'Diploma, ustalık belgesi, sağlık ve sabıka kayıtlarının dijital takibi ve kontrolü.' },
      { title: 'Resmî Süreç Yönetimi', desc: 'Çalışma izni, vize ve konsolosluk adımlarının uçtan uca takibi.' },
      { title: 'Seyahat & Karşılama', desc: 'Bilet, transfer, konaklama ve işe ilk gün organizasyonu.' },
      { title: 'İşe Uyum & Takip', desc: '30/60/90 gün değerlendirmeleriyle kalıcılığı ölçen yerleştirme sonrası destek.' },
    ],
    createDemand: 'Personel talebi oluştur',
    candidatesEyebrow: 'Adaylar için',
    candidatesTitle: 'Kariyerinizi Avrupa ve Türkiye’ye taşıyın',
    candidatesDesc: 'Profilinizi oluşturun, belgelerinizi yükleyin; size uygun pozisyonlar açıldığında ilk siz haberdar olun.',
    applyNow: 'Hemen başvur',
    candidateLogin: 'Aday girişi',
    candidateItems: [
      { title: 'Yurt dışı iş fırsatları', desc: 'AB ve Türkiye’deki doğrulanmış işverenlerin açık pozisyonları.' },
      { title: 'Sertifika & kariyer desteği', desc: 'Belgelerinizi tek profilde toplayın, eksiklerinizi görün.' },
      { title: 'Ücretsiz ve güvenli başvuru', desc: 'Kişisel verileriniz KVKK/GDPR ilkelerine uygun korunur.' },
    ],
    sectorsEyebrow: 'Sektörler',
    sectorsTitle: 'Uzmanlaştığımız alanlar',
    sectorsDesc: 'Grup şirketlerimizin saha deneyimiyle, her sektörün yetkinlik ihtiyacını tanıyoruz.',
    sectorNames: sectorsTr,
    howEyebrow: 'Nasıl çalışır',
    howTitle: '5 adımda yerleştirme',
    steps: [
      { title: 'Talep', desc: 'İşveren pozisyon, adet ve yetkinlik ihtiyacını iletir.' },
      { title: 'Eşleştirme', desc: 'Sertifikalı havuzdan uygun adaylar kısa listelenir.' },
      { title: 'Görüşme', desc: 'Online veya yüz yüze mülakat; iş teklifi hazırlanır.' },
      { title: 'Resmî Süreç', desc: 'İzin, vize ve belgeler dijital olarak takip edilir.' },
      { title: 'Yerleştirme', desc: 'Seyahat, karşılama ve 30/60/90 gün uyum takibi.' },
    ],
    trustEyebrow: 'Neden Panova',
    trustTitle: 'Güven üzerine kurulu insan kaynakları',
    trust: [
      { title: 'Akredite yetkinlik odağı', desc: 'Adaylar mesleki belge ve sertifikalarıyla değerlendirilir.' },
      { title: 'Veri güvenliği', desc: 'Rol bazlı erişim, denetim kaydı (audit log) ve şifreli giriş.' },
      { title: 'Çok dilli iletişim', desc: 'Türkçe, İngilizce, Arnavutça, Arapça ve Makedonca destek.' },
      { title: 'Şeffaf süreç', desc: 'İşveren ve aday her adımı portaldan anlık izler.' },
    ],
    partnersNote: 'Referans işverenler ve iş ortakları — logolar izinleri alındıktan sonra burada yer alacaktır.',
    faqEyebrow: 'SSS',
    faqTitle: 'Sık sorulan sorular',
    faqs: [
      { q: 'Adaylar başvuru için ücret öder mi?', a: 'Hayır. Aday başvurusu ve profil oluşturma ücretsizdir.' },
      { q: 'Hangi ülkelere personel temin ediyorsunuz?', a: 'Öncelikli olarak Türkiye ve Avrupa Birliği ülkelerindeki işverenlere hizmet veriyoruz.' },
      { q: 'Bir işe alım süreci ne kadar sürer?', a: 'Pozisyon ve ülkeye göre değişir; resmî süreç adımları portaldan takip edilebilir.' },
      { q: 'Google hesabımla giriş yapabilir miyim?', a: 'Evet. Aday, işveren ve personel portallarında Google ile güvenli giriş desteklenir.' },
    ],
    bandTitle: 'Ekibinizi birlikte kuralım',
    bandDesc: 'Personel ihtiyacınızı iletin, uzman ekibimiz 1 iş günü içinde dönüş yapsın.',
    getQuote: 'Teklif al',
    footer: {
      employers: 'İşverenler', services: 'Hizmetler', employerLogin: 'İşveren girişi', quote: 'Teklif al',
      candidates: 'Adaylar', apply: 'Başvuru & giriş', sectors: 'Sektörler', faq: 'SSS',
      corporate: 'Kurumsal', registry: 'Sicil bilgileri', how: 'Nasıl çalışır', staffPortal: 'Personel portalı',
      kvkk: 'KVKK Aydınlatma Metni', rights: 'Tüm hakları saklıdır.', taxNo: 'Vergi no',
    },
    about: {
      eyebrow: 'Kurumsal',
      presenceTitle: 'Bangladeş, Türkiye ve Kuzey Makedonya',
      presenceDesc: 'Panova Bangladeş (Dhaka), Türkiye (Sivas) ve Kuzey Makedonya’da (Struga) faaliyet gösterir. Sicil kaydı PANOVA TARIM DOO Struga’ya aittir.',
      countries: ['Bangladeş', 'Türkiye', 'Kuzey Makedonya'],
      northMacedonia: 'Kuzey Makedonya',
      turkeyOffice: 'Türkiye Ofisi',
      bangladeshOffice: 'Bangladeş Ofisi',
      address: 'Adres', email: 'E-posta', phone: 'Telefon', registry: 'Sicil',
      taxNo: 'Vergi no', established: 'Kuruluş', establishedValue: '27 Nisan 2024',
      managers: 'Yöneticiler', mkShort: 'Makedonca kısa unvan',
      vkn: 'VKN', siteTaxOffice: 'Site Vergi Dairesi',
    },
    kvkk: {
      title: 'KVKK Aydınlatma Metni',
      home: 'Ana sayfa',
      intro: 'Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında; sitedeki iletişim formu, aday kaydı ve işveren kaydı sırasında paylaşılan kişisel verilere ilişkindir.',
      controller: 'Veri sorumlusu',
      shortName: 'Kısa unvan',
      address: 'Adres',
      email: 'E-posta',
      taxId: 'Vergi kimlik no',
      purposeTitle: 'İşlenen veriler ve amaç',
      purpose: 'İletişim formunda ad soyad, e-posta, telefon ve mesaj; aday kaydında kimlik, pasaport, telefon, e-posta ve meslek bilgileri; işveren kaydında şirket unvanı, yetkili, telefon ve e-posta işlenir. Amaç, taleplere dönüş yapmak ve personel ile işveren süreçlerini yürütmektir.',
      rightsTitle: 'Haklar',
      rightsBefore: 'KVKK madde 11 kapsamındaki taleplerinizi',
      rightsOr: 'veya',
      rightsAfter: 'adresine, sitedeki iletişim formuna veya yukarıdaki telefon numaralarına iletebilirsiniz. Avrupa Birliği’nde bulunan kişiler, GDPR kapsamındaki erişim, düzeltme ve silme taleplerini aynı kanallardan iletebilir.',
    },
    oauthOr: 'veya',
    oauthGoogle: 'Google ile devam et',
    passwordMin: 'Şifre (en az 8 karakter)',
    signUpAndIn: 'Kayıt Ol ve Giriş Yap',
    formSectors: [
      { value: 'construction', label: 'İnşaat & Yapı' },
      { value: 'agriculture', label: 'Tarım ve Hayvancılık' },
      { value: 'manufacturing', label: 'Üretim & Sanayi' },
      { value: 'hospitality', label: 'Turizm & Otelcilik' },
    ],
    supplier: {
      title: 'Yetkili Tedarikçi Aday Kayıt Paneli',
      subtitle: 'Partner ve tedarikçi firmalar üzerinden havuza aday ekleyin.',
      success: 'Aday başarıyla tedarikçi havuzuna eklendi.',
      another: 'Yeni aday kaydet',
      company: 'Tedarikçi / partner firma adınız',
      companyPh: 'Örn: Balkan Global İK',
      name: 'Aday ad soyad',
      passport: 'Pasaport no',
      phone: 'GSM (telefon)',
      email: 'E-posta',
      save: 'Tedarikçi adayını sisteme kaydet',
      saving: 'Kaydediliyor...',
    },
    gate: {
      checking: 'Yetki kontrol ediliyor…',
      loginRequired: 'Giriş gerekli',
      noAccess: 'Yetkiniz yok',
      loginBody: 'Bu sayfa yalnızca Panova personeline açıktır. Lütfen personel portalından giriş yapın.',
      noAccessBody: 'Bu hesap personel olarak tanımlı değil.',
      staffLogin: 'Personel Girişi',
      sessionChecking: 'Oturum doğrulanıyor...',
      unauthorized: 'Yetkisiz erişim. Giriş sayfasına yönlendiriliyorsunuz...',
    },
    admin: {
      title: 'Yönetim Paneli',
      sub: 'Merkez kontrol',
      home: 'Ana Sayfaya Dön',
      tabs: {
        overview: 'Genel Durum', employers: 'İşverenler', demands: 'Personel Talepleri', candidates: 'Adaylar',
        matching: 'Eşleştirmeler', documents: 'Belgeler', official: 'Resmî Süreçler', travel: 'Seyahatler',
        employees: 'Aktif Çalışanlar', followup: '30-60-90 Gün', support: 'Sorunlar / Görevler', reports: 'Raporlar',
        team: 'Kullanıcılar & Yetkiler', settings: 'Ayarlar',
      },
      totalCandidates: 'Toplam Aday', activeEmployers: 'Aktif İşveren', openRequests: 'Açık Talepler', travelReady: 'Seyahate Hazır',
      employersTitle: 'İşveren Şirketler ve Sorumlu Atamaları',
      colCompany: 'Şirket Unvanı', colContact: 'Yetkili Kişi', colCountry: 'Ülke', colDemands: 'Aktif Talep', colOwner: 'PANOVA Sorumlusu',
      tasksTitle: 'Ekip Görevleri ve Operasyon Takibi',
      colTask: 'Görev Başlığı', colAssignee: 'Atanan Kişi', colDue: 'Son Tarih', colStatus: 'Durum',
      moduleOn: 'Modülü Aktif',
      moduleDesc: 'Bu modül üzerinden operasyonel filtreleme, toplu durum güncellemesi ve dosya yönetimi yapılır.',
    },
  },
  en: {
    langLabel: 'Language',
    nav: { employers: 'Employers', candidates: 'Candidates', sectors: 'Sectors', how: 'How it works', group: 'Group companies', about: 'Company', faq: 'FAQ' },
    ctaHire: 'I need staff',
    ctaJob: 'I am looking for work',
    ctaQuote: 'Request a corporate quote',
    contactDirect: 'Contact {name} directly.',
    stats: [
      { value: '3', label: 'Countries' },
      { value: '4', label: 'Group companies' },
      { value: '8+', label: 'Core sectors' },
      { value: '30/60/90', label: 'Day onboarding follow-up' },
    ],
    employersEyebrow: 'For employers',
    employersTitle: 'The right people, at the right time',
    employersDesc: 'We run the whole HR process, from your request through to onboarding.',
    employerServices: [
      { title: 'Overseas recruitment', desc: 'A fast shortlist from a certified, accredited candidate pool for the EU and Türkiye.' },
      { title: 'Bulk & project hiring', desc: 'Crew planning and staged placement for construction, agriculture and production projects.' },
      { title: 'Document & certificate checks', desc: 'Digital tracking of diplomas, trade certificates, health and criminal records.' },
      { title: 'Official process management', desc: 'End-to-end follow-up of work permits, visas and consular steps.' },
      { title: 'Travel & arrival', desc: 'Tickets, transfers, accommodation and first-day organisation.' },
      { title: 'Onboarding & follow-up', desc: 'Post-placement support with 30/60/90 day reviews.' },
    ],
    createDemand: 'Create a staffing request',
    candidatesEyebrow: 'For candidates',
    candidatesTitle: 'Take your career to Europe and Türkiye',
    candidatesDesc: 'Create your profile and upload your documents. You hear first when a matching role opens.',
    applyNow: 'Apply now',
    candidateLogin: 'Candidate sign-in',
    candidateItems: [
      { title: 'Jobs abroad', desc: 'Open roles from verified employers in the EU and Türkiye.' },
      { title: 'Certificates & career support', desc: 'Keep your documents in one profile and see what is missing.' },
      { title: 'Free and secure application', desc: 'Your personal data is protected under KVKK/GDPR principles.' },
    ],
    sectorsEyebrow: 'Sectors',
    sectorsTitle: 'Where we specialise',
    sectorsDesc: 'Field experience across the group means we know what each sector needs.',
    sectorNames: sectorsEn,
    howEyebrow: 'How it works',
    howTitle: 'Placement in 5 steps',
    steps: [
      { title: 'Request', desc: 'The employer sends the role, headcount and skills needed.' },
      { title: 'Matching', desc: 'Suitable candidates are shortlisted from the certified pool.' },
      { title: 'Interview', desc: 'Online or in person, then a job offer is prepared.' },
      { title: 'Official process', desc: 'Permits, visas and documents are tracked digitally.' },
      { title: 'Placement', desc: 'Travel, arrival and 30/60/90 day onboarding follow-up.' },
    ],
    trustEyebrow: 'Why Panova',
    trustTitle: 'Human resources built on trust',
    trust: [
      { title: 'Accredited skills', desc: 'Candidates are assessed with their trade documents and certificates.' },
      { title: 'Data security', desc: 'Role-based access, an audit log and encrypted sign-in.' },
      { title: 'Multilingual contact', desc: 'Turkish, English, Albanian, Arabic and Macedonian.' },
      { title: 'A clear process', desc: 'Employers and candidates follow every step in the portal.' },
    ],
    partnersNote: 'Reference employers and partners — logos will appear here once permission is granted.',
    faqEyebrow: 'FAQ',
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'Do candidates pay to apply?', a: 'No. Applying and creating a profile is free.' },
      { q: 'Which countries do you recruit for?', a: 'We primarily serve employers in Türkiye and the European Union.' },
      { q: 'How long does hiring take?', a: 'It depends on the role and country. Official steps can be followed in the portal.' },
      { q: 'Can I sign in with Google?', a: 'Yes. Candidate, employer and staff portals support secure Google sign-in.' },
    ],
    bandTitle: 'Let us build your team',
    bandDesc: 'Send your staffing need and our team will reply within one business day.',
    getQuote: 'Get a quote',
    footer: {
      employers: 'Employers', services: 'Services', employerLogin: 'Employer sign-in', quote: 'Get a quote',
      candidates: 'Candidates', apply: 'Apply & sign in', sectors: 'Sectors', faq: 'FAQ',
      corporate: 'Company', registry: 'Registry details', how: 'How it works', staffPortal: 'Staff portal',
      kvkk: 'Privacy notice', rights: 'All rights reserved.', taxNo: 'Tax no',
    },
    about: {
      eyebrow: 'Company',
      presenceTitle: 'Bangladesh, Türkiye and North Macedonia',
      presenceDesc: 'Panova operates in Bangladesh (Dhaka), Türkiye (Sivas) and North Macedonia (Struga). The registry belongs to PANOVA TARIM DOO Struga.',
      countries: ['Bangladesh', 'Türkiye', 'North Macedonia'],
      northMacedonia: 'North Macedonia',
      turkeyOffice: 'Türkiye Office',
      bangladeshOffice: 'Bangladesh Office',
      address: 'Address', email: 'Email', phone: 'Phone', registry: 'Registry',
      taxNo: 'Tax no', established: 'Founded', establishedValue: '27 April 2024',
      managers: 'Managers', mkShort: 'Macedonian short name',
      vkn: 'VAT ID', siteTaxOffice: 'Site Tax Office',
    },
    kvkk: {
      title: 'Privacy notice (KVKK)',
      home: 'Home',
      intro: 'This notice covers personal data shared through the contact form, candidate registration and employer registration, under Turkish Law No. 6698 on the Protection of Personal Data.',
      controller: 'Data controller',
      shortName: 'Short name',
      address: 'Address',
      email: 'Email',
      taxId: 'Tax ID',
      purposeTitle: 'Data we process and why',
      purpose: 'The contact form collects name, email, phone and message. Candidate registration collects identity, passport, phone, email and occupation. Employer registration collects company name, contact person, phone and email. The purpose is to reply to requests and to run staffing and employer processes.',
      rightsTitle: 'Your rights',
      rightsBefore: 'You can send requests under KVKK article 11 to',
      rightsOr: 'or',
      rightsAfter: ', the contact form on this site, or the phone numbers above. People in the European Union can send GDPR access, correction and deletion requests through the same channels.',
    },
    oauthOr: 'or',
    oauthGoogle: 'Continue with Google',
    passwordMin: 'Password (min 8 characters)',
    signUpAndIn: 'Sign up and sign in',
    formSectors: [
      { value: 'construction', label: 'Construction & building' },
      { value: 'agriculture', label: 'Agriculture & livestock' },
      { value: 'manufacturing', label: 'Manufacturing & industry' },
      { value: 'hospitality', label: 'Tourism & hospitality' },
    ],
    supplier: {
      title: 'Authorised supplier candidate registration',
      subtitle: 'Add candidates to the pool on behalf of a partner or supplier company.',
      success: 'The candidate was added to the supplier pool.',
      another: 'Register another candidate',
      company: 'Your supplier / partner company',
      companyPh: 'e.g. Balkan Global HR',
      name: 'Candidate full name',
      passport: 'Passport no.',
      phone: 'Mobile phone',
      email: 'Email',
      save: 'Save supplier candidate',
      saving: 'Saving...',
    },
    gate: {
      checking: 'Checking access…',
      loginRequired: 'Sign-in required',
      noAccess: 'No access',
      loginBody: 'This page is only for Panova staff. Please sign in through the staff portal.',
      noAccessBody: 'This account is not registered as staff.',
      staffLogin: 'Staff sign-in',
      sessionChecking: 'Checking your session...',
      unauthorized: 'Unauthorized. Redirecting to the sign-in page...',
    },
    admin: {
      title: 'Admin hub',
      sub: 'Central control',
      home: 'Back to home',
      tabs: {
        overview: 'Overview', employers: 'Employers', demands: 'Staffing requests', candidates: 'Candidates',
        matching: 'Matching', documents: 'Documents', official: 'Official process', travel: 'Travel',
        employees: 'Active employees', followup: '30-60-90 days', support: 'Issues / tasks', reports: 'Reports',
        team: 'Users & permissions', settings: 'Settings',
      },
      totalCandidates: 'Total candidates', activeEmployers: 'Active employers', openRequests: 'Open requests', travelReady: 'Ready to travel',
      employersTitle: 'Employer companies and owners',
      colCompany: 'Company', colContact: 'Contact', colCountry: 'Country', colDemands: 'Active requests', colOwner: 'Panova owner',
      tasksTitle: 'Team tasks and operations',
      colTask: 'Task', colAssignee: 'Assignee', colDue: 'Due', colStatus: 'Status',
      moduleOn: 'module is active',
      moduleDesc: 'This module covers operational filters, bulk status updates and file management.',
    },
  },
  sq: {
    langLabel: 'Gjuha',
    nav: { employers: 'Punëdhënësit', candidates: 'Kandidatët', sectors: 'Sektorët', how: 'Si funksionon', group: 'Kompanitë e grupit', about: 'Kompania', faq: 'Pyetje' },
    ctaHire: 'Kërkoj personel',
    ctaJob: 'Po kërkoj punë',
    ctaQuote: 'Merr ofertë korporative',
    contactDirect: 'Kontaktoni drejtpërdrejt {name}.',
    stats: [
      { value: '3', label: 'Vende ku veprojmë' },
      { value: '4', label: 'Kompani të grupit' },
      { value: '8+', label: 'Sektorë kryesorë' },
      { value: '30/60/90', label: 'Ditë ndjekjeje në punë' },
    ],
    employersEyebrow: 'Për punëdhënësit',
    employersTitle: 'Personeli i duhur, në kohën e duhur',
    employersDesc: 'E menaxhojmë të gjithë procesin e burimeve njerëzore, nga kërkesa deri te përshtatja në punë.',
    employerServices: [
      { title: 'Rekrutim jashtë vendit', desc: 'Listë e shkurtër e shpejtë nga një grup kandidatësh të certifikuar për BE-në dhe Turqinë.' },
      { title: 'Punësim masiv & me projekt', desc: 'Planifikim ekipesh dhe vendosje me faza për ndërtim, bujqësi dhe prodhim.' },
      { title: 'Verifikim dokumentesh & certifikatash', desc: 'Ndjekje dixhitale e diplomave, certifikatave profesionale, shëndetit dhe dëshmisë penale.' },
      { title: 'Menaxhim i procesit zyrtar', desc: 'Ndjekje nga fillimi në fund e lejes së punës, vizës dhe hapave konsullorë.' },
      { title: 'Udhëtim & pritje', desc: 'Bileta, transfer, akomodim dhe organizim i ditës së parë.' },
      { title: 'Përshtatje & ndjekje', desc: 'Mbështetje pas vendosjes me vlerësime 30/60/90 ditë.' },
    ],
    createDemand: 'Krijo kërkesë personeli',
    candidatesEyebrow: 'Për kandidatët',
    candidatesTitle: 'Çojeni karrierën tuaj në Evropë dhe Turqi',
    candidatesDesc: 'Krijoni profilin dhe ngarkoni dokumentet. Ju njoftoni të parët kur hapet një pozicion i përshtatshëm.',
    applyNow: 'Apliko tani',
    candidateLogin: 'Hyrja e kandidatit',
    candidateItems: [
      { title: 'Mundësi pune jashtë', desc: 'Pozicione të hapura nga punëdhënës të verifikuar në BE dhe Turqi.' },
      { title: 'Certifikata & mbështetje karriere', desc: 'Mblidhni dokumentet në një profil dhe shihni çfarë mungon.' },
      { title: 'Aplikim falas dhe i sigurt', desc: 'Të dhënat tuaja mbrohen sipas parimeve KVKK/GDPR.' },
    ],
    sectorsEyebrow: 'Sektorët',
    sectorsTitle: 'Fushat ku specializohemi',
    sectorsDesc: 'Përvoja në terren e grupit na tregon çfarë kompetence kërkon çdo sektor.',
    sectorNames: sectorsSq,
    howEyebrow: 'Si funksionon',
    howTitle: 'Vendosje në 5 hapa',
    steps: [
      { title: 'Kërkesa', desc: 'Punëdhënësi dërgon pozicionin, numrin dhe kompetencat.' },
      { title: 'Përputhja', desc: 'Kandidatët e përshtatshëm përzgjidhen nga grupi i certifikuar.' },
      { title: 'Intervista', desc: 'Online ose ballë për ballë; përgatitet oferta e punës.' },
      { title: 'Procesi zyrtar', desc: 'Leja, viza dhe dokumentet ndiqen në mënyrë dixhitale.' },
      { title: 'Vendosja', desc: 'Udhëtim, pritje dhe ndjekje përshtatjeje 30/60/90 ditë.' },
    ],
    trustEyebrow: 'Pse Panova',
    trustTitle: 'Burime njerëzore të ndërtuara mbi besim',
    trust: [
      { title: 'Kompetencë e akredituar', desc: 'Kandidatët vlerësohen me dokumentet dhe certifikatat profesionale.' },
      { title: 'Siguria e të dhënave', desc: 'Qasje sipas rolit, regjistër auditimi dhe hyrje e koduar.' },
      { title: 'Komunikim shumëgjuhësh', desc: 'Turqisht, anglisht, shqip, arabisht dhe maqedonisht.' },
      { title: 'Proces i qartë', desc: 'Punëdhënësi dhe kandidati ndjekin çdo hap në portal.' },
    ],
    partnersNote: 'Punëdhënës dhe partnerë referencë — logot do të vendosen këtu pasi të merret leja.',
    faqEyebrow: 'Pyetje',
    faqTitle: 'Pyetjet e shpeshta',
    faqs: [
      { q: 'A paguajnë kandidatët për të aplikuar?', a: 'Jo. Aplikimi dhe krijimi i profilit janë falas.' },
      { q: 'Për cilat vende siguroni personel?', a: 'Kryesisht për punëdhënës në Turqi dhe në Bashkimin Evropian.' },
      { q: 'Sa zgjat një proces punësimi?', a: 'Varet nga pozicioni dhe vendi; hapat zyrtarë ndiqen në portal.' },
      { q: 'A mund të hyj me llogarinë Google?', a: 'Po. Portalet e kandidatit, punëdhënësit dhe personelit mbështesin hyrjen e sigurt me Google.' },
    ],
    bandTitle: 'Ta ndërtojmë ekipin tuaj',
    bandDesc: 'Dërgoni nevojën për personel dhe ekipi ynë përgjigjet brenda 1 dite pune.',
    getQuote: 'Merr ofertë',
    footer: {
      employers: 'Punëdhënësit', services: 'Shërbimet', employerLogin: 'Hyrja e punëdhënësit', quote: 'Merr ofertë',
      candidates: 'Kandidatët', apply: 'Aplikim & hyrje', sectors: 'Sektorët', faq: 'Pyetje',
      corporate: 'Kompania', registry: 'Të dhënat e regjistrit', how: 'Si funksionon', staffPortal: 'Portali i personelit',
      kvkk: 'Njoftimi i privatësisë', rights: 'Të gjitha të drejtat e rezervuara.', taxNo: 'Nr. tatimor',
    },
    about: {
      eyebrow: 'Kompania',
      presenceTitle: 'Bangladesh, Turqia dhe Maqedonia e Veriut',
      presenceDesc: 'Panova vepron në Bangladesh (Dhaka), Turqi (Sivas) dhe Maqedoninë e Veriut (Struga). Regjistri i takon PANOVA TARIM DOO Struga.',
      countries: ['Bangladesh', 'Turqia', 'Maqedonia e Veriut'],
      northMacedonia: 'Maqedonia e Veriut',
      turkeyOffice: 'Zyra e Turqisë',
      bangladeshOffice: 'Zyra e Bangladeshit',
      address: 'Adresa', email: 'E-mail', phone: 'Telefon', registry: 'Regjistri',
      taxNo: 'Nr. tatimor', established: 'Themelimi', establishedValue: '27 prill 2024',
      managers: 'Drejtuesit', mkShort: 'Emri i shkurtër në maqedonisht',
      vkn: 'Nr. i TVSH-së', siteTaxOffice: 'Zyra tatimore Site',
    },
    kvkk: {
      title: 'Njoftim privatësie (KVKK)',
      home: 'Faqja kryesore',
      intro: 'Ky tekst lidhet me të dhënat personale të ndara në formularin e kontaktit, regjistrimin e kandidatit dhe regjistrimin e punëdhënësit, sipas ligjit turk nr. 6698 për mbrojtjen e të dhënave personale.',
      controller: 'Kontrolluesi i të dhënave',
      shortName: 'Emri i shkurtër',
      address: 'Adresa',
      email: 'E-mail',
      taxId: 'Numri tatimor',
      purposeTitle: 'Të dhënat që përpunohen dhe qëllimi',
      purpose: 'Formulari i kontaktit merr emrin, e-mailin, telefonin dhe mesazhin. Regjistrimi i kandidatit merr identitetin, pasaportën, telefonin, e-mailin dhe profesionin. Regjistrimi i punëdhënësit merr emrin e kompanisë, personin e kontaktit, telefonin dhe e-mailin. Qëllimi është t’u përgjigjemi kërkesave dhe të zhvillojmë proceset e personelit dhe të punëdhënësve.',
      rightsTitle: 'Të drejtat',
      rightsBefore: 'Kërkesat sipas nenit 11 të KVKK mund t’i dërgoni te',
      rightsOr: 'ose',
      rightsAfter: ', formularin e kontaktit në këtë faqe ose numrat e telefonit më sipër. Personat në Bashkimin Evropian mund të dërgojnë në të njëjtat kanale kërkesat GDPR për qasje, korrigjim dhe fshirje.',
    },
    oauthOr: 'ose',
    oauthGoogle: 'Vazhdo me Google',
    passwordMin: 'Fjalëkalimi (të paktën 8 shenja)',
    signUpAndIn: 'Regjistrohu dhe hyr',
    formSectors: [
      { value: 'construction', label: 'Ndërtim & objekte' },
      { value: 'agriculture', label: 'Bujqësi dhe blegtori' },
      { value: 'manufacturing', label: 'Prodhim & industri' },
      { value: 'hospitality', label: 'Turizëm & hoteleri' },
    ],
    supplier: {
      title: 'Paneli i regjistrimit të kandidatëve për furnitorë',
      subtitle: 'Shtoni kandidatë në grup përmes kompanive partnere dhe furnitore.',
      success: 'Kandidati u shtua në grupin e furnitorit.',
      another: 'Regjistro një kandidat tjetër',
      company: 'Emri i kompanisë suaj furnitore / partnere',
      companyPh: 'P.sh. Balkan Global HR',
      name: 'Emri i plotë i kandidatit',
      passport: 'Nr. i pasaportës',
      phone: 'Telefoni',
      email: 'E-mail',
      save: 'Ruaj kandidatin e furnitorit',
      saving: 'Po ruhet...',
    },
    gate: {
      checking: 'Po kontrollohet qasja…',
      loginRequired: 'Kërkohet hyrja',
      noAccess: 'Nuk keni qasje',
      loginBody: 'Kjo faqe është vetëm për personelin e Panova. Hyni nga portali i personelit.',
      noAccessBody: 'Kjo llogari nuk është e regjistruar si personel.',
      staffLogin: 'Hyrja e personelit',
      sessionChecking: 'Po verifikohet sesioni...',
      unauthorized: 'Qasje e paautorizuar. Po ridrejtoheni te hyrja...',
    },
    admin: {
      title: 'Paneli i administrimit',
      sub: 'Kontrolli qendror',
      home: 'Kthehu në faqen kryesore',
      tabs: {
        overview: 'Përmbledhje', employers: 'Punëdhënësit', demands: 'Kërkesat e personelit', candidates: 'Kandidatët',
        matching: 'Përputhjet', documents: 'Dokumentet', official: 'Proceset zyrtare', travel: 'Udhëtimet',
        employees: 'Punonjësit aktivë', followup: '30-60-90 ditë', support: 'Çështje / detyra', reports: 'Raporte',
        team: 'Përdoruesit & lejet', settings: 'Cilësimet',
      },
      totalCandidates: 'Kandidatë gjithsej', activeEmployers: 'Punëdhënës aktivë', openRequests: 'Kërkesa të hapura', travelReady: 'Gati për udhëtim',
      employersTitle: 'Kompanitë dhe përgjegjësit',
      colCompany: 'Kompania', colContact: 'Personi i kontaktit', colCountry: 'Vendi', colDemands: 'Kërkesa aktive', colOwner: 'Përgjegjësi Panova',
      tasksTitle: 'Detyrat e ekipit dhe operacionet',
      colTask: 'Detyra', colAssignee: 'I caktuari', colDue: 'Afati', colStatus: 'Statusi',
      moduleOn: 'moduli është aktiv',
      moduleDesc: 'Ky modul mbulon filtrat operacionalë, përditësimet masive të statusit dhe menaxhimin e dosjeve.',
    },
  },
  ar: {
    langLabel: 'اللغة',
    nav: { employers: 'أصحاب العمل', candidates: 'المرشحون', sectors: 'القطاعات', how: 'كيف نعمل', group: 'شركات المجموعة', about: 'الشركة', faq: 'الأسئلة' },
    ctaHire: 'أبحث عن موظفين',
    ctaJob: 'أبحث عن عمل',
    ctaQuote: 'اطلب عرضاً مؤسسياً',
    contactDirect: 'تواصلوا مباشرة مع {name}.',
    stats: [
      { value: '3', label: 'بلدان النشاط' },
      { value: '4', label: 'شركات المجموعة' },
      { value: '8+', label: 'قطاعات رئيسية' },
      { value: '30/60/90', label: 'يوم متابعة بعد الالتحاق' },
    ],
    employersEyebrow: 'لأصحاب العمل',
    employersTitle: 'الموظف المناسب في الوقت المناسب',
    employersDesc: 'ندير عملية الموارد البشرية كاملة، من الطلب حتى الالتحاق بالعمل.',
    employerServices: [
      { title: 'توظيف خارجي', desc: 'قائمة مختصرة سريعة من مرشحين معتمدين لأوروبا وتركيا.' },
      { title: 'توظيف جماعي وحسب المشروع', desc: 'تخطيط الفرق والتوظيف على مراحل لمشاريع البناء والزراعة والإنتاج.' },
      { title: 'التحقق من الوثائق والشهادات', desc: 'متابعة رقمية للشهادات ووثائق المهنة والصحة والسجل العدلي.' },
      { title: 'إدارة الإجراءات الرسمية', desc: 'متابعة تصريح العمل والتأشيرة وخطوات القنصلية من البداية إلى النهاية.' },
      { title: 'السفر والاستقبال', desc: 'التذاكر والنقل والسكن وتنظيم اليوم الأول.' },
      { title: 'الالتحاق والمتابعة', desc: 'دعم بعد التوظيف مع تقييمات 30/60/90 يوماً.' },
    ],
    createDemand: 'أنشئ طلب موظفين',
    candidatesEyebrow: 'للمرشحين',
    candidatesTitle: 'انقل مسيرتك إلى أوروبا وتركيا',
    candidatesDesc: 'أنشئ ملفك وارفع وثائقك. تكون أول من يعلم عند فتح وظيفة مناسبة.',
    applyNow: 'قدّم الآن',
    candidateLogin: 'دخول المرشح',
    candidateItems: [
      { title: 'فرص عمل في الخارج', desc: 'وظائف مفتوحة لدى أصحاب عمل موثّقين في الاتحاد الأوروبي وتركيا.' },
      { title: 'الشهادات ودعم المسار', desc: 'اجمع وثائقك في ملف واحد واعرف ما الذي ينقص.' },
      { title: 'تقديم مجاني وآمن', desc: 'تُحمى بياناتك وفق مبادئ KVKK/GDPR.' },
    ],
    sectorsEyebrow: 'القطاعات',
    sectorsTitle: 'المجالات التي نتقنها',
    sectorsDesc: 'خبرة شركات المجموعة في الميدان تعرّفنا على احتياج كل قطاع.',
    sectorNames: sectorsAr,
    howEyebrow: 'كيف نعمل',
    howTitle: 'التوظيف في 5 خطوات',
    steps: [
      { title: 'الطلب', desc: 'يرسل صاحب العمل المسمى والعدد والمهارات المطلوبة.' },
      { title: 'المطابقة', desc: 'تُختار قائمة قصيرة من المرشحين المعتمدين.' },
      { title: 'المقابلة', desc: 'عبر الإنترنت أو وجهاً لوجه، ثم يُعد عرض العمل.' },
      { title: 'الإجراء الرسمي', desc: 'تُتابَع التصاريح والتأشيرات والوثائق رقمياً.' },
      { title: 'الالتحاق', desc: 'السفر والاستقبال ومتابعة 30/60/90 يوماً.' },
    ],
    trustEyebrow: 'لماذا بانوفا',
    trustTitle: 'موارد بشرية مبنية على الثقة',
    trust: [
      { title: 'تركيز على الكفاءة المعتمدة', desc: 'يُقيَّم المرشحون بوثائقهم وشهاداتهم المهنية.' },
      { title: 'أمان البيانات', desc: 'وصول حسب الدور، وسجل تدقيق، ودخول مشفّر.' },
      { title: 'تواصل بعدة لغات', desc: 'التركية والإنجليزية والألبانية والعربية والمقدونية.' },
      { title: 'عملية شفافة', desc: 'يتابع صاحب العمل والمرشح كل خطوة من البوابة.' },
    ],
    partnersNote: 'أصحاب العمل والشركاء المرجعيون — ستظهر الشعارات هنا بعد الحصول على الإذن.',
    faqEyebrow: 'الأسئلة',
    faqTitle: 'الأسئلة الشائعة',
    faqs: [
      { q: 'هل يدفع المرشحون رسوماً للتقديم؟', a: 'لا. التقديم وإنشاء الملف مجانيان.' },
      { q: 'لأي دول توفّرون الموظفين؟', a: 'نخدم أولاً أصحاب العمل في تركيا والاتحاد الأوروبي.' },
      { q: 'كم تستغرق عملية التوظيف؟', a: 'تختلف حسب الوظيفة والبلد، ويمكن متابعة الخطوات الرسمية من البوابة.' },
      { q: 'هل يمكنني الدخول بحساب Google؟', a: 'نعم. بوابات المرشح وصاحب العمل والموظفين تدعم الدخول الآمن عبر Google.' },
    ],
    bandTitle: 'لنبنِ فريقكم معاً',
    bandDesc: 'أرسلوا احتياجكم من الموظفين ويرد فريقنا خلال يوم عمل واحد.',
    getQuote: 'اطلب عرضاً',
    footer: {
      employers: 'أصحاب العمل', services: 'الخدمات', employerLogin: 'دخول أصحاب العمل', quote: 'اطلب عرضاً',
      candidates: 'المرشحون', apply: 'التقديم والدخول', sectors: 'القطاعات', faq: 'الأسئلة',
      corporate: 'الشركة', registry: 'بيانات السجل', how: 'كيف نعمل', staffPortal: 'بوابة الموظفين',
      kvkk: 'إشعار الخصوصية', rights: 'جميع الحقوق محفوظة.', taxNo: 'الرقم الضريبي',
    },
    about: {
      eyebrow: 'الشركة',
      presenceTitle: 'بنغلاديش وتركيا ومقدونيا الشمالية',
      presenceDesc: 'تعمل بانوفا في بنغلاديش (دكا) وتركيا (سيواس) ومقدونيا الشمالية (ستروغا). السجل التجاري يعود إلى PANOVA TARIM DOO Struga.',
      countries: ['بنغلاديش', 'تركيا', 'مقدونيا الشمالية'],
      northMacedonia: 'مقدونيا الشمالية',
      turkeyOffice: 'مكتب تركيا',
      bangladeshOffice: 'مكتب بنغلاديش',
      address: 'العنوان', email: 'البريد', phone: 'الهاتف', registry: 'السجل',
      taxNo: 'الرقم الضريبي', established: 'التأسيس', establishedValue: '27 أبريل 2024',
      managers: 'المديرون', mkShort: 'الاسم المختصر بالمقدونية',
      vkn: 'رقم ضريبة القيمة المضافة', siteTaxOffice: 'دائرة الضرائب Site',
    },
    kvkk: {
      title: 'إشعار الخصوصية (KVKK)',
      home: 'الصفحة الرئيسية',
      intro: 'يتعلق هذا النص بالبيانات الشخصية التي تُشارك عبر نموذج الاتصال وتسجيل المرشح وتسجيل صاحب العمل، وفق القانون التركي رقم 6698 لحماية البيانات الشخصية.',
      controller: 'مسؤول البيانات',
      shortName: 'الاسم المختصر',
      address: 'العنوان',
      email: 'البريد',
      taxId: 'الرقم الضريبي',
      purposeTitle: 'البيانات المعالجة والغرض',
      purpose: 'يجمع نموذج الاتصال الاسم والبريد والهاتف والرسالة. ويجمع تسجيل المرشح الهوية وجواز السفر والهاتف والبريد والمهنة. ويجمع تسجيل صاحب العمل اسم الشركة والمسؤول والهاتف والبريد. الغرض هو الرد على الطلبات وإدارة عمليات الموظفين وأصحاب العمل.',
      rightsTitle: 'الحقوق',
      rightsBefore: 'يمكنكم إرسال طلبات المادة 11 من KVKK إلى',
      rightsOr: 'أو',
      rightsAfter: '، أو عبر نموذج الاتصال في الموقع، أو أرقام الهاتف أعلاه. ويمكن للأشخاص في الاتحاد الأوروبي إرسال طلبات الوصول والتصحيح والحذف بموجب GDPR عبر القنوات نفسها.',
    },
    oauthOr: 'أو',
    oauthGoogle: 'المتابعة باستخدام Google',
    passwordMin: 'كلمة المرور (8 أحرف على الأقل)',
    signUpAndIn: 'إنشاء حساب والدخول',
    formSectors: [
      { value: 'construction', label: 'البناء والتشييد' },
      { value: 'agriculture', label: 'الزراعة والثروة الحيوانية' },
      { value: 'manufacturing', label: 'الإنتاج والصناعة' },
      { value: 'hospitality', label: 'السياحة والفنادق' },
    ],
    supplier: {
      title: 'تسجيل مرشحي الموردين المعتمدين',
      subtitle: 'أضيفوا مرشحين إلى المجموعة عبر شركات الشركاء والموردين.',
      success: 'أُضيف المرشح إلى مجموعة الموردين.',
      another: 'تسجيل مرشح آخر',
      company: 'اسم شركة المورد / الشريك',
      companyPh: 'مثال: Balkan Global HR',
      name: 'الاسم الكامل للمرشح',
      passport: 'رقم الجواز',
      phone: 'الهاتف',
      email: 'البريد',
      save: 'حفظ مرشح المورد',
      saving: 'جارٍ الحفظ...',
    },
    gate: {
      checking: 'جارٍ التحقق من الصلاحية…',
      loginRequired: 'يلزم تسجيل الدخول',
      noAccess: 'ليست لديكم صلاحية',
      loginBody: 'هذه الصفحة لموظفي بانوفا فقط. يُرجى الدخول من بوابة الموظفين.',
      noAccessBody: 'هذا الحساب غير معرّف كموظف.',
      staffLogin: 'دخول الموظفين',
      sessionChecking: 'جارٍ التحقق من الجلسة...',
      unauthorized: 'دخول غير مصرح. سيتم توجيهكم إلى صفحة الدخول...',
    },
    admin: {
      title: 'لوحة الإدارة',
      sub: 'التحكم المركزي',
      home: 'العودة إلى الرئيسية',
      tabs: {
        overview: 'نظرة عامة', employers: 'أصحاب العمل', demands: 'طلبات الموظفين', candidates: 'المرشحون',
        matching: 'المطابقة', documents: 'الوثائق', official: 'الإجراءات الرسمية', travel: 'السفر',
        employees: 'الموظفون النشطون', followup: '30-60-90 يوماً', support: 'المشكلات / المهام', reports: 'التقارير',
        team: 'المستخدمون والصلاحيات', settings: 'الإعدادات',
      },
      totalCandidates: 'إجمالي المرشحين', activeEmployers: 'أصحاب العمل النشطون', openRequests: 'الطلبات المفتوحة', travelReady: 'جاهز للسفر',
      employersTitle: 'الشركات والمسؤولون',
      colCompany: 'الشركة', colContact: 'جهة الاتصال', colCountry: 'الدولة', colDemands: 'الطلبات النشطة', colOwner: 'مسؤول بانوفا',
      tasksTitle: 'مهام الفريق والعمليات',
      colTask: 'المهمة', colAssignee: 'المكلّف', colDue: 'الاستحقاق', colStatus: 'الحالة',
      moduleOn: 'الوحدة نشطة',
      moduleDesc: 'تغطي هذه الوحدة التصفية التشغيلية وتحديث الحالات وإدارة الملفات.',
    },
  },
  mk: {
    langLabel: 'Јазик',
    nav: {
      employers: 'Работодавачи',
      candidates: 'Кандидати',
      sectors: 'Сектори',
      how: 'Како функционира',
      group: 'Компании од групата',
      about: 'Компанија',
      faq: 'ЧПП',
    },
    ctaHire: 'Ми треба персонал',
    ctaJob: 'Барам работа',
    ctaQuote: 'Побарај корпоративна понуда',
    contactDirect: 'Контактирајте директно со {name}.',
    stats: [
      {
        value: '3',
        label: 'Земји',
      },
      {
        value: '4',
        label: 'Компании од групата',
      },
      {
        value: '8+',
        label: 'Клучни сектори',
      },
      {
        value: '30/60/90',
        label: 'Дена следење по вработување',
      },
    ],
    employersEyebrow: 'За работодавачи',
    employersTitle: 'Вистинските луѓе, во вистинско време',
    employersDesc: 'Ја водиме целата постапка за човечки ресурси, од барањето до воведувањето во работа.',
    employerServices: [
      {
        title: 'Регрутирање во странство',
        desc: 'Брза кратка листа од сертифицирана и акредитирана база на кандидати за ЕУ и Турција.',
      },
      {
        title: 'Групно и проектно вработување',
        desc: 'Планирање екипи и етапно распоредување за проекти во градежништво, земјоделство и производство.',
      },
      {
        title: 'Проверка на документи и сертификати',
        desc: 'Дигитално следење на дипломи, стручни сертификати, здравствени извештаи и уверенија за неосудуваност.',
      },
      {
        title: 'Управување со официјалната постапка',
        desc: 'Следење од почеток до крај на дозволи за работа, визи и конзуларни чекори.',
      },
      {
        title: 'Патување и прием',
        desc: 'Билети, трансфери, сместување и организација на првиот ден.',
      },
      {
        title: 'Воведување и следење',
        desc: 'Поддршка по распоредувањето со проверки на 30/60/90 дена.',
      },
    ],
    createDemand: 'Креирај барање за персонал',
    candidatesEyebrow: 'За кандидати',
    candidatesTitle: 'Однесете ја кариерата во Европа и Турција',
    candidatesDesc: 'Создајте профил и прикачете ги документите. Први ќе дознаете кога ќе се отвори соодветна позиција.',
    applyNow: 'Пријави се сега',
    candidateLogin: 'Најава на кандидат',
    candidateItems: [
      {
        title: 'Работа во странство',
        desc: 'Отворени позиции кај проверени работодавачи во ЕУ и Турција.',
      },
      {
        title: 'Сертификати и поддршка за кариера',
        desc: 'Чувајте ги документите во еден профил и видете што недостасува.',
      },
      {
        title: 'Бесплатна и безбедна пријава',
        desc: 'Вашите лични податоци се заштитени според начелата на KVKK/GDPR.',
      },
    ],
    sectorsEyebrow: 'Сектори',
    sectorsTitle: 'Каде се специјализираме',
    sectorsDesc: 'Теренското искуство на групата ни кажува што му треба на секој сектор.',
    sectorNames: sectorsMk,
    howEyebrow: 'Како функционира',
    howTitle: 'Распоредување во 5 чекори',
    steps: [
      {
        title: 'Барање',
        desc: 'Работодавачот ја испраќа позицијата, бројот на лица и потребните вештини.',
      },
      {
        title: 'Спојување',
        desc: 'Соодветните кандидати се избираат на кратка листа од сертифицираната база.',
      },
      {
        title: 'Интервју',
        desc: 'Онлајн или лично, а потоа се подготвува понуда за работа.',
      },
      {
        title: 'Официјална постапка',
        desc: 'Дозволите, визите и документите се следат дигитално.',
      },
      {
        title: 'Распоредување',
        desc: 'Патување, прием и следење на воведувањето на 30/60/90 дена.',
      },
    ],
    trustEyebrow: 'Зошто Panova',
    trustTitle: 'Човечки ресурси изградени на доверба',
    trust: [
      {
        title: 'Акредитирани вештини',
        desc: 'Кандидатите се оценуваат според стручните документи и сертификати.',
      },
      {
        title: 'Безбедност на податоците',
        desc: 'Пристап според улога, дневник на ревизија и шифрирана најава.',
      },
      {
        title: 'Повеќејазичен контакт',
        desc: 'Турски, англиски, албански, арапски и македонски.',
      },
      {
        title: 'Јасна постапка',
        desc: 'Работодавачот и кандидатот ја следат секоја фаза во порталот.',
      },
    ],
    partnersNote: 'Референтни работодавачи и партнери — логоата ќе се појават тука откако ќе се добие дозвола.',
    faqEyebrow: 'ЧПП',
    faqTitle: 'Често поставувани прашања',
    faqs: [
      {
        q: 'Дали кандидатите плаќаат за пријава?',
        a: 'Не. Пријавата и создавањето профил се бесплатни.',
      },
      {
        q: 'За кои земји вршите вработување?',
        a: 'Првенствено им служиме на работодавачи во Турција и Европската Унија.',
      },
      {
        q: 'Колку трае вработувањето?',
        a: 'Зависи од позицијата и земјата. Официјалните чекори се следат во порталот.',
      },
      {
        q: 'Може ли да се најавам со Google?',
        a: 'Да. Порталите за кандидати, работодавачи и персонал поддржуваат безбедна најава со Google.',
      },
    ],
    bandTitle: 'Да го изградиме вашиот тим',
    bandDesc: 'Испратете ја потребата за персонал и нашиот тим ќе одговори во рок од еден работен ден.',
    getQuote: 'Побарај понуда',
    footer: {
      employers: 'Работодавачи',
      services: 'Услуги',
      employerLogin: 'Најава на работодавач',
      quote: 'Побарај понуда',
      candidates: 'Кандидати',
      apply: 'Пријава и најава',
      sectors: 'Сектори',
      faq: 'ЧПП',
      corporate: 'Компанија',
      registry: 'Податоци од регистарот',
      how: 'Како функционира',
      staffPortal: 'Портал за персонал',
      kvkk: 'Известување за приватност',
      rights: 'Сите права се задржани.',
      taxNo: 'Даночен бр.',
    },
    about: {
      eyebrow: 'Компанија',
      presenceTitle: 'Бангладеш, Турција и Северна Македонија',
      presenceDesc: 'Panova работи во Бангладеш (Дака), Турција (Сивас) и Северна Македонија (Струга). Регистарот е на PANOVA TARIM DOO Struga.',
      countries: [
        'Бангладеш',
        'Турција',
        'Северна Македонија',
      ],
      northMacedonia: 'Северна Македонија',
      turkeyOffice: 'Канцеларија во Турција',
      bangladeshOffice: 'Канцеларија во Бангладеш',
      address: 'Адреса',
      email: 'Е-пошта',
      phone: 'Телефон',
      registry: 'Регистар',
      taxNo: 'Даночен бр.',
      established: 'Основана',
      establishedValue: '27 април 2024',
      managers: 'Управители',
      mkShort: 'Кратко име на македонски',
      vkn: 'ДДВ број',
      siteTaxOffice: 'Даночна управа Site',
    },
    kvkk: {
      title: 'Известување за приватност (KVKK)',
      home: 'Почетна',
      intro: 'Ова известување ги опфаќа личните податоци споделени преку контактниот образец, регистрацијата на кандидат и регистрацијата на работодавач, согласно турскиот Закон бр. 6698 за заштита на личните податоци.',
      controller: 'Контролор на податоци',
      shortName: 'Кратко име',
      address: 'Адреса',
      email: 'Е-пошта',
      taxId: 'Даночен број',
      purposeTitle: 'Податоци што ги обработуваме и зошто',
      purpose: 'Контактниот образец ги собира името, е-поштата, телефонот и пораката. Регистрацијата на кандидат ги собира идентитетот, пасошот, телефонот, е-поштата и занимањето. Регистрацијата на работодавач ги собира името на компанијата, лицето за контакт, телефонот и е-поштата. Целта е да се одговори на барањата и да се водат постапките за персонал и работодавачи.',
      rightsTitle: 'Вашите права',
      rightsBefore: 'Барања според член 11 од KVKK можете да испратите на',
      rightsOr: 'или',
      rightsAfter: ', контактниот образец на оваа страница или телефонските броеви погоре. Лицата во Европската Унија можат преку истите канали да испратат барања според GDPR за пристап, исправка и бришење.',
    },
    oauthOr: 'или',
    oauthGoogle: 'Продолжи со Google',
    passwordMin: 'Лозинка (најмалку 8 знаци)',
    signUpAndIn: 'Регистрирај се и најави се',
    formSectors: [
      {
        value: 'construction',
        label: 'Градежништво',
      },
      {
        value: 'agriculture',
        label: 'Земјоделство и сточарство',
      },
      {
        value: 'manufacturing',
        label: 'Производство и индустрија',
      },
      {
        value: 'hospitality',
        label: 'Туризам и хотелиерство',
      },
    ],
    supplier: {
      title: 'Регистрација на кандидати од овластен добавувач',
      subtitle: 'Додајте кандидати во базата во име на партнерска или добавувачка компанија.',
      success: 'Кандидатот е додаден во базата на добавувачот.',
      another: 'Регистрирај уште еден кандидат',
      company: 'Вашата добавувачка / партнерска компанија',
      companyPh: 'на пр. Balkan Global HR',
      name: 'Име и презиме на кандидатот',
      passport: 'Бр. на пасош',
      phone: 'Мобилен телефон',
      email: 'Е-пошта',
      save: 'Зачувај кандидат од добавувач',
      saving: 'Се зачувува...',
    },
    gate: {
      checking: 'Се проверува пристапот…',
      loginRequired: 'Потребна е најава',
      noAccess: 'Нема пристап',
      loginBody: 'Оваа страница е само за персоналот на Panova. Најавете се преку порталот за персонал.',
      noAccessBody: 'Оваа сметка не е регистрирана како персонал.',
      staffLogin: 'Најава на персонал',
      sessionChecking: 'Се проверува сесијата...',
      unauthorized: 'Неовластен пристап. Пренасочување кон страницата за најава...',
    },
    admin: {
      title: 'Административен центар',
      sub: 'Централна контрола',
      home: 'Назад на почетна',
      tabs: {
        overview: 'Преглед',
        employers: 'Работодавачи',
        demands: 'Барања за персонал',
        candidates: 'Кандидати',
        matching: 'Спојување',
        documents: 'Документи',
        official: 'Официјална постапка',
        travel: 'Патување',
        employees: 'Активни вработени',
        followup: '30-60-90 дена',
        support: 'Проблеми / задачи',
        reports: 'Извештаи',
        team: 'Корисници и овластувања',
        settings: 'Поставки',
      },
      totalCandidates: 'Вкупно кандидати',
      activeEmployers: 'Активни работодавачи',
      openRequests: 'Отворени барања',
      travelReady: 'Подготвени за патување',
      employersTitle: 'Компании работодавачи и одговорни',
      colCompany: 'Компанија',
      colContact: 'Контакт',
      colCountry: 'Држава',
      colDemands: 'Активни барања',
      colOwner: 'Одговорен од Panova',
      tasksTitle: 'Задачи и операции на тимот',
      colTask: 'Задача',
      colAssignee: 'Одговорен',
      colDue: 'Рок',
      colStatus: 'Статус',
      moduleOn: 'модулот е активен',
      moduleDesc: 'Овој модул опфаќа оперативни филтри, групно ажурирање на статуси и управување со досиеја.',
    },
  }
};
