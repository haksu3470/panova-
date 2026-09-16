export type Language = 'tr' | 'en' | 'mk' | 'bg' | 'sq' | 'ro' | 'bs' | 'bn' | 'ar';

export const languages: { code: Language; name: string; flag: string; dir?: 'rtl' | 'ltr' }[] = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'mk', name: 'Македонски', flag: '🇲🇰' },
  { code: 'bg', name: 'Български', flag: '🇧🇬' },
  { code: 'sq', name: 'Shqip', flag: '🇦🇱' },
  { code: 'ro', name: 'Română', flag: '🇷🇴' },
  { code: 'bs', name: 'Bosanski', flag: '🇧🇦' },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
];

export const translations = {
  tr: {
    contactUs: 'İletişime Geç',
    tagline: 'Uluslararası Şirketler Topluluğu',
    heroTitle: 'PANOVA GROUP',
    heroDesc: 'İnsan Kaynakları, Dış Ticaret, Tarım ve İnşaat sektörlerinde uluslararası standartlarda kurumsal çözümler.',
    selectedCompany: 'Seçili Grup Şirketi',
    scopeTitle: 'Faaliyet ve Hizmet Kapsamı',
    formTitle: 'İletişim / Başvuru',
    formDesc: 'Talebiniz doğrudan ilgili grup şirketimizin operasyon ekibine iletilecektir.',
    nameLabel: 'Ad Soyad / Firma Adı *',
    emailLabel: 'E-posta *',
    phoneLabel: 'Telefon *',
    notesLabel: 'Talep / Notunuz',
    submitBtn: 'Talebi Gönder',
    submitting: 'Gönderiliyor...',
    successTitle: 'Başvurunuz Alındı!',
    successDesc: 'ekibimiz sizinle en kısa sürede iletişime geçecektir.',
    companies: {
      hr: {
        name: 'PANOVA İnsan Kaynakları',
        tagline: 'Sınır Ötesi İstihdam ve Uluslararası İş Gücü',
        desc: 'Küresel pazarda doğru yeteneği doğru projeyle buluşturan uluslararası seçme, yerleştirme ve danışmanlık hizmetleri.',
        services: [
          'Uluslararası Personel Tedariki',
          'Mavi & Beyaz Yaka Seçme Yerleştirme',
          'Çalışma İzni ve Vize Danışmanlığı',
          'Sektörel İş Gücü Planlaması'
        ]
      },
      trade: {
        name: 'PANOVA Dış Ticaret',
        tagline: 'Küresel Tedarik Zinciri ve Ticaret Köprüsü',
        desc: 'Bölgesel ve uluslararası pazarlarda güvenilir ithalat, ihracat, lojistik ve pazar geliştirme operasyonları.',
        services: [
          'Uluslararası Ürün İthalat & İhracatı',
          'Tedarik Zinciri Yönetimi',
          'Pazar Araştırması ve B2B Eşleştirme',
          'Gümrük ve Lojistik Danışmanlığı'
        ]
      },
      agriculture: {
        name: 'PANOVA Tarım',
        tagline: 'Endüstriyel Üretim ve Tarımsal Danışmanlık',
        desc: 'Balkanlar ve Doğu Avrupa genelinde modern meyvecilik, ceviz ve meyve bahçesi kurulumu, sürdürülebilir tarım projeleri.',
        services: [
          'Arazide Modern Bahçe Kurulumu',
          'Ceviz ve Meyve Yetiştiriciliği Danışmanlığı',
          'Sulama ve Gübreleme Altyapısı',
          'Tarımsal Teşvik ve Devlet Desteği Takibi'
        ]
      },
      construction: {
        name: 'PANOVA İnşaat',
        tagline: 'Endüstriyel Tesis ve Altyapı Çözümleri',
        desc: 'Tarımsal depolar, endüstriyel soğuk hava depoları, arazi alt/üst yapı projeleri ve mühendislik çözümleri.',
        services: [
          'Endüstriyel & Tarımsal Depo İnşaatı',
          'Arazi Düzenleme ve Altyapı Projeleri',
          'Mühendislik ve Proje Taahhüt',
          'Saha Süreç Yönetimi'
        ]
      }
    }
  },
  en: {
    contactUs: 'Contact Us',
    tagline: 'International Group of Companies',
    heroTitle: 'PANOVA GROUP',
    heroDesc: 'Corporate solutions at international standards in Human Resources, Foreign Trade, Agriculture, and Construction.',
    selectedCompany: 'Selected Group Company',
    scopeTitle: 'Scope of Activity & Services',
    formTitle: 'Contact / Application',
    formDesc: 'Your request will be forwarded directly to the operation team of the relevant company.',
    nameLabel: 'Full Name / Company Name *',
    emailLabel: 'Email *',
    phoneLabel: 'Phone *',
    notesLabel: 'Your Request / Notes',
    submitBtn: 'Submit Request',
    submitting: 'Submitting...',
    successTitle: 'Application Received!',
    successDesc: 'team will get in touch with you as soon as possible.',
    companies: {
      hr: {
        name: 'PANOVA Human Resources',
        tagline: 'Cross-Border Employment & International Workforce',
        desc: 'International recruitment, placement, and consultancy services matching the right talent with the right project in global markets.',
        services: [
          'International Staff Supply',
          'Blue & White Collar Recruitment',
          'Work Permit & Visa Consultancy',
          'Sectoral Workforce Planning'
        ]
      },
      trade: {
        name: 'PANOVA Foreign Trade',
        tagline: 'Global Supply Chain & Trade Bridge',
        desc: 'Reliable import, export, logistics, and market development operations in regional and international markets.',
        services: [
          'International Import & Export',
          'Supply Chain Management',
          'Market Research & B2B Matchmaking',
          'Customs & Logistics Consultancy'
        ]
      },
      agriculture: {
        name: 'PANOVA Agriculture',
        tagline: 'Industrial Production & Agricultural Consultancy',
        desc: 'Modern fruit growing, walnut & orchard establishment, and sustainable agricultural projects across the Balkans and Eastern Europe.',
        services: [
          'Modern Orchard Establishment',
          'Walnut & Fruit Cultivation Consultancy',
          'Irrigation & Fertilization Infrastructure',
          'Agricultural Subsidy & State Support Tracking'
        ]
      },
      construction: {
        name: 'PANOVA Construction',
        tagline: 'Industrial Facilities & Infrastructure Solutions',
        desc: 'Agricultural warehouses, industrial cold storage facilities, land infrastructure projects, and engineering solutions.',
        services: [
          'Industrial & Agricultural Warehouse Construction',
          'Land Arrangement & Infrastructure Projects',
          'Engineering & Project Contracting',
          'Field Process Management'
        ]
      }
    }
  },
  mk: {
    contactUs: 'Контакт',
    tagline: 'Меѓународна Групација на Компании',
    heroTitle: 'PANOVA GROUP',
    heroDesc: 'Корпоративни решенија по меѓународни стандарди во Човечки Ресурси, Надворешна Трговија, Земјоделство и Градежништво.',
    selectedCompany: 'Избрана Компанија',
    scopeTitle: 'Опсег на Дејности и Услуги',
    formTitle: 'Контакт / Апликација',
    formDesc: 'Вашето барање ќе биде испратено директно до оперативниот тим.',
    nameLabel: 'Име и Презиме / Фирма *',
    emailLabel: 'Е-пошта *',
    phoneLabel: 'Телефон *',
    notesLabel: 'Барање / Забелешка',
    submitBtn: 'Испрати Барање',
    submitting: 'Се испраќа...',
    successTitle: 'Апликацијата е примена!',
    successDesc: 'тимот ќе ве контактира во најкраток рок.',
    companies: {
      hr: {
        name: 'PANOVA Човечки Ресурси',
        tagline: 'Прекугранично Вработување и Меѓународна Работна Сила',
        desc: 'Меѓународни услуги за регрутирање, пласман и советување што го спојуваат вистинскиот талент со вистинскиот проект на глобалниот пазар.',
        services: [
          'Набавка на Меѓународен Кадар',
          'Регрутација на Сина и Бела Јака',
          'Советување за Работни Дозволи и Визи',
          'Секторско Планирање на Работна Сила'
        ]
      },
      trade: {
        name: 'PANOVA Надворешна Трговија',
        tagline: 'Глобален синџир на набавка и трговски мост',
        desc: 'Сигурни операции за увоз, извоз, логистика и развој на пазарот на регионалните и меѓународните пазари.',
        services: [
          'Меѓународен Увоз и Извоз на Производи',
          'Управување со Синџир на Набавка',
          'Истражување на Пазарот и B2B Поврзување',
          'Советување за Царина и Логистика'
        ]
      },
      agriculture: {
        name: 'PANOVA Земјоделство',
        tagline: 'Индустриско Производство и Земјоделски Советувања',
        desc: 'Модерно овоштарство, подигање на насади со ореви и овошје и одржливи земјоделски проекти ширум Балканот и Источна Европа.',
        services: [
          'Подигање Модерни Овошни Насади',
          'Советување за Одгледување Ореви и Овошје',
          'Инфраструктура за Наводнување и Ѓубрење',
          'Следење на Земјоделски Субвенции и Државна Помош'
        ]
      },
      construction: {
        name: 'PANOVA Градежништво',
        tagline: 'Индустриски Објекти и Инфраструктурни Решенија',
        desc: 'Земјоделски магацини, индустриски ладилници, инфраструктурни проекти на земјиште и инженерски решенија.',
        services: [
          'Изградба на Индустриски и Земјоделски Магацини',
          'Проекти за Уредување на Земјиште и Инфраструктура',
          'Инженерски Проекти и Изведба',
          'Управување со Процеси на Терен'
        ]
      }
    }
  },
  sq: {
    contactUs: 'Na Kontaktoni',
    tagline: 'Grup Ndërkombëtar Kompanish',
    heroTitle: 'PANOVA GROUP',
    heroDesc: 'Zgjidhje korporative me standarde ndërkombëtare në Burimet Njerëzore, Tregtinë e Jashtme, Bujqësi dhe Ndërtim.',
    selectedCompany: 'Kompania e Zgjedhur',
    scopeTitle: 'Fusha e Veprimtarisë dhe Shërbimet',
    formTitle: 'Kontakt / Aplikim',
    formDesc: 'Kërkesa juaj do t\'i dërgohet drejtpërdrejt ekipit operativ.',
    nameLabel: 'Emri Mbiemri / Emri i Kompanisë *',
    emailLabel: 'E-mail *',
    phoneLabel: 'Telefon *',
    notesLabel: 'Kërkesa / Shënimi Juaj',
    submitBtn: 'Dërgo Kërkesën',
    submitting: 'Duke u dërguar...',
    successTitle: 'Aplikimi u Pranua!',
    successDesc: 'ekipi do t\'ju kontaktojë sa më shpejt të jetë e mundur.',
    companies: {
      hr: {
        name: 'PANOVA Burimet Njerëzore',
        tagline: 'Punësim Ndërkufitar dhe Fuqi Punëtore Ndërkombëtare',
        desc: 'Shërbime ndërkombëtare të rekrutimit, vendosjes dhe konsulencës që lidhin talentin e duhur me projektin e duhur në tregun global.',
        services: [
          'Furnizim me Staf Ndërkombëtar',
          'Rekrutim i Punonjësve të Thjeshtë dhe Profesionistëve',
          'Konsulencë për Leje Pune dhe Viza',
          'Planifikim Sektorial i Fuqisë Punëtore'
        ]
      },
      trade: {
        name: 'PANOVA Tregti e Jashtme',
        tagline: 'Zinxhir Global Furnizimi dhe Urë Tregtare',
        desc: 'Operacione të besueshme importi, eksporti, logjistike dhe zhvillimi tregu në tregjet rajonale dhe ndërkombëtare.',
        services: [
          'Import & Eksport Ndërkombëtar',
          'Menaxhim i Zinxhirit të Furnizimit',
          'Kërkim Tregu dhe Bashkëpunim B2B',
          'Konsulencë Doganore dhe Logjistike'
        ]
      },
      agriculture: {
        name: 'PANOVA Bujqësi',
        tagline: 'Prodhim Industrial dhe Konsulencë Bujqësore',
        desc: 'Pemtari moderne, ngritje pemishtesh e arrash dhe projekte bujqësore të qëndrueshme në Ballkan dhe Evropën Lindore.',
        services: [
          'Ngritje Pemishtesh Moderne',
          'Konsulencë për Kultivimin e Arrës dhe Pemëve',
          'Infrastrukturë Ujitjeje dhe Plehërimi',
          'Ndiqje e Subvencioneve dhe Mbështetjes Shtetërore'
        ]
      },
      construction: {
        name: 'PANOVA Ndërtim',
        tagline: 'Ofrim Projektesh Industriale dhe Infrastrukture',
        desc: 'Magazina bujqësore, ambiente frigoriferike industriale, projekte infrastrukturore toke dhe zgjidhje inxhinierike.',
        services: [
          'Ndërtim Magazinash Industriale & Bujqësore',
          'Rregullim Toke dhe Projekte Infrastrukture',
          'Inxhinieri dhe Kontraktim Projektesh',
          'Menaxhim i Proceseve në Terren'
        ]
      }
    }
  },
  bg: {
    contactUs: 'Свържете се с нас',
    tagline: 'Международна Група от Компании',
    heroTitle: 'PANOVA GROUP',
    heroDesc: 'Корпоративни решения по международни стандарти в Човешки Ресурси, Външна Търговия, Земеделие и Строителство.',
    selectedCompany: 'Избрана Компания',
    scopeTitle: 'Обхват на Дейността и Услугите',
    formTitle: 'Контакт / Запитване',
    formDesc: 'Вашето запитване ще бъде препратено директно към оперативния екип.',
    nameLabel: 'Име и Фамилия / Фирма *',
    emailLabel: 'Имейл *',
    phoneLabel: 'Телефон *',
    notesLabel: 'Запитване / Бележка',
    submitBtn: 'Изпрати Запитване',
    submitting: 'Изпращане...',
    successTitle: 'Запитването е получено!',
    successDesc: 'екипът ще се свърже с вас възможно най-скоро.',
    companies: {
      hr: {
        name: 'PANOVA Човешки Ресурси',
        tagline: 'Trans-border Employment & International Workforce',
        desc: 'Международни услуги за подбор на персонал, подбор и консултиране на правилните таланти за правилните проекти.',
        services: [
          'Международна Доставка на Персонал',
          'Подбор на Изпълнителски и Ръководни Кадри',
          'Консултации за Разрешителни за Работа и Визи',
          'Секторно Планиране на Работната Сила'
        ]
      },
      trade: {
        name: 'PANOVA Външна Търговия',
        tagline: 'Глобална верига за доставки и търговски мост',
        desc: 'Надеждни операции по внос, износ, логистика и развитие на пазара на регионални и международни пазари.',
        services: [
          'Международен Внос и Износ на Продукти',
          'Управление на Веригата за Доставки',
          'Пазарни Проучвания и B2B Партньорства',
          'Митнически и Логистични Консултации'
        ]
      },
      agriculture: {
        name: 'PANOVA Земеделие',
        tagline: 'Индустриално Производство и Земеделски Консултации',
        desc: 'Модерно овощарство, създаване на орехови и овощни градини и устойчиви земеделски проекти на Балканите.',
        services: [
          'Създаване на Модерни Градини',
          'Консултации за Отглеждане на Орехи и Овощни Дървета',
          'Инфраструктура за Напояване и Торене',
          'Проследяване на Субсидии и Държавна Помощ'
        ]
      },
      construction: {
        name: 'PANOVA Строителство',
        tagline: 'Индустриални Съоръжения и Инфраструктурни Решения',
        desc: 'Земеделски складове, промишлени хладилни съоръжения, инфраструктурни проекти и инженерни решения.',
        services: [
          'Строителство на Промишлени и Земеделски Складове',
          'Проекти за Устройство на Земята и Инфраструктура',
          'Инженерни Проекти и Изпълнение',
          'Управление на Процеси на Терен'
        ]
      }
    }
  },
  ro: {
    contactUs: 'Contactează-ne',
    tagline: 'Grup Internațional de Companii',
    heroTitle: 'PANOVA GROUP',
    heroDesc: 'Soluții corporative la standarde internaționale în Resurse Umane, Comerț Exterior, Agricultură și Construcții.',
    selectedCompany: 'Compania Selectată',
    scopeTitle: 'Domeniul de Activitate și Servicii',
    formTitle: 'Contact / Aplicare',
    formDesc: 'Solicitarea dumneavoastră va fi direcționată echipei operative.',
    nameLabel: 'Nume și Prenume / Companie *',
    emailLabel: 'E-mail *',
    phoneLabel: 'Telefon *',
    notesLabel: 'Solicitarea / Notele Dumneavoastră',
    submitBtn: 'Trimite Solicitarea',
    submitting: 'Se trimite...',
    successTitle: 'Solicitare Primită!',
    successDesc: 'echipa vă va contacta în cel mai scurt timp.',
    companies: {
      hr: {
        name: 'PANOVA Resurse Umane',
        tagline: 'Angajare Transfrontalieră și Fortă de Muncă Internațională',
        desc: 'Servicii internaționale de recrutare, plasare și consultanță care conectează talentul potrivit cu proiectul potrivit.',
        services: [
          'Furnizare de Personal Internațional',
          'Recrutare Personal Executiv și Muncitori',
          'Consultanță Permise de Muncă și Vize',
          'Planificarea Sectorială a Forței de Muncă'
        ]
      },
      trade: {
        name: 'PANOVA Comerț Exterior',
        tagline: 'Lanț Global de Aprovizionare și Pod Comercial',
        desc: 'Operațiuni de încredere de import, export, logistică și dezvoltare de piață pe piețele regionale și internaționale.',
        services: [
          'Import & Export Internațional de Produse',
          'Managementul Lanțului de Aprovizionare',
          'Cercetare de Piață și Parteneriate B2B',
          'Consultanță Vamală și Logistică'
        ]
      },
      agriculture: {
        name: 'PANOVA Agricultură',
        tagline: 'Producție Industrială și Consultanță Agricolă',
        desc: 'Pomicultură modernă, înființare de livezi de nuci și fructe, proiecte agricole durabile în Balcani.',
        services: [
          'Înființarea de Livezi Moderne',
          'Consultanță Cultură de Nuci și Fructe',
          'Infrastructură de Iriigații și Fertilizare',
          'Monitorizare Subvenții și Sprijin de Stat'
        ]
      },
      construction: {
        name: 'PANOVA Construcții',
        tagline: 'Facilități Industriale și Soluții de Infrastructură',
        desc: 'Depozite agricole, spații frigorifice industriale, proiecte de infrastructură terestră și soluții de inginerie.',
        services: [
          'Construcții Depozite Industriale & Agricole',
          'Amenajare Teren și Proiecte de Infrastructură',
          'Inginerie și Antreprenoriat de Proiect',
          'Managementul Proceselor pe Teren'
        ]
      }
    }
  },
  bs: {
    contactUs: 'Kontaktirajte nas',
    tagline: 'Međunarodna Grupacija Kompanija',
    heroTitle: 'PANOVA GROUP',
    heroDesc: 'Korporativna rješenja po međunarodnim standardima u Ljudskim Resursima, Vanjskoj Trgovini, Poljoprivredi i Građevinarstvu.',
    selectedCompany: 'Odabrana Kompanija',
    scopeTitle: 'Obim Djelatnosti i Usluga',
    formTitle: 'Kontakt / Prijava',
    formDesc: 'Vaš zahtjev će biti proslijeđen direktno operativnom timu.',
    nameLabel: 'Ime i Prezime / Naziv Firme *',
    emailLabel: 'E-mail *',
    phoneLabel: 'Telefon *',
    notesLabel: 'Vaš Zahtjev / Napomena',
    submitBtn: 'Pošalji Zahtjev',
    submitting: 'Slanje u toku...',
    successTitle: 'Prijava Zaprimljena!',
    successDesc: 'tim će vas kontaktirati u najkraćem mogućem roku.',
    companies: {
      hr: {
        name: 'PANOVA Ljudski Resursi',
        tagline: 'Prekogranično Zapošljavanje i Međunarodna Radna Snaga',
        desc: 'Međunarodne usluge regrutovanja, plasmana i savjetovanja koje spajaju pravi talenat sa pravim projektom.',
        services: [
          'Nabavka Međunarodnog Osoblja',
          'Zapošljavanje Radnika i Stručnjaka',
          'Savjetovanje za Radne Dozvole i Vize',
          'Sektorsko Planiranje Radne Snage'
        ]
      },
      trade: {
        name: 'PANOVA Vanjska Trgovina',
        tagline: 'Globalni Lanac Snabdijevanja i Trgovački Most',
        desc: 'Pouzdan uvoz, izvoz, logistika i razvoj tržišta na regionalnim i međunarodnim tržištima.',
        services: [
          'Međunarodni Uvoz i Izvoz Proizvoda',
          'Upravljanje Lancem Snabdijevanja',
          'Istraživanje Tržišta i B2B Povezivanje',
          'Carinsko i Logističko Savjetovanje'
        ]
      },
      agriculture: {
        name: 'PANOVA Poljoprivreda',
        tagline: 'Industrijska Proizvodnja i Savjetovanje',
        desc: 'Moderno voćarstvo, podizanje zasada oraha i voća te održivi poljoprivredni projekti širom Balkana.',
        services: [
          'Podizanje Modernih Voćnjaka',
          'Savjetovanje za Uzgoj Oraha i Voća',
          'Infrastruktura za Navodnjavanje i Đubrenje',
          'Praćenje Subvencija i Državne Pomoći'
        ]
      },
      construction: {
        name: 'PANOVA Građevinarstvo',
        tagline: 'Industrijski Objekti i Infrastrukturna Rješenja',
        desc: 'Poljoprivredna skladišta, industrijske hladnjače, infrastruktura i inženjerska rješenja.',
        services: [
          'Izgradnja Industrijskih i Poljoprivrednih Skladišta',
          'Uređenje Zemljišta i Infrastrukturni Projekti',
          'Inženjering i Izvođenje Projekata',
          'Upravljanje Procesima na Terenu'
        ]
      }
    }
  },
  bn: {
    contactUs: 'যোগাযোগ করুন',
    tagline: 'আন্তর্জাতিক গ্রুপ অব কোম্পানিজ',
    heroTitle: 'PANOVA GROUP',
    heroDesc: 'মানবসম্পদ, বৈদেশিক বাণিজ্য, কৃষি এবং নির্মাণ খাতে আন্তর্জাতিক মানের করপোরেট সমাধান।',
    selectedCompany: 'নির্বাচিত কোম্পানি',
    scopeTitle: 'কার্যক্রম ও সেবাসমূহ',
    formTitle: 'যোগাযোগ / আবেদন',
    formDesc: 'আপনার আবেদনটি সরাসরি সংশ্লিষ্ট কোম্পানির অপারেশন টিমের কাছে পাঠানো হবে।',
    nameLabel: 'পূর্ণ নাম / কোম্পানির নাম *',
    emailLabel: 'ইমেইল *',
    phoneLabel: 'ফোন নম্বর *',
    notesLabel: 'আপনার বক্তব্য / বিবরণ',
    submitBtn: 'আবেদন জমা দিন',
    submitting: 'জমা হচ্ছে...',
    successTitle: 'আবেদন গৃহীত হয়েছে!',
    successDesc: 'আমাদের টিম খুব শিগগিরই আপনার সাথে যোগাযোগ করবে।',
    companies: {
      hr: {
        name: 'PANOVA মানবসম্পদ',
        tagline: 'আন্তর্জাতিক কর্মসংস্থান ও বিশ্বমানের জনশক্তি',
        desc: 'বিশ্ববাজারে সঠিক দক্ষ জনশক্তিকে সঠিক প্রজেক্টের সাথে যুক্ত করার আন্তর্জাতিক রিক্রুটমেন্ট ও কনসালটেন্সি সেবা।',
        services: [
          'আন্তর্জাতিক কর্মী সরবরাহ',
          'দক্ষ ও দক্ষতাহীন কর্মী নিয়োগ',
          'ওয়ার্ক পারমিট ও ভিসা কনসালটেন্সি',
          'খাতভিত্তিক জনশক্তি পরিকল্পনা'
        ]
      },
      trade: {
        name: 'PANOVA বৈদেশিক বাণিজ্য',
        tagline: 'গ্লোবাল সাপ্লাই চেইন ও বাণিজ্যিক সেতু',
        desc: 'আঞ্চলিক ও আন্তর্জাতিক বাজারে নির্ভরযোগ্য আমদানি, রপ্তানি, লজিস্টিকস ও বাজার উন্নয়ন কার্যক্রম।',
        services: [
          'আন্তর্জাতিক পণ্য আমদানি ও রপ্তানি',
          'সাপ্লাই চেইন ম্যানেজমেন্ট',
          'মার্কেট রিসার্চ ও B2B ম্যাচমেকিং',
          'কাস্টমস ও লজিস্টিকস কনসালটেন্সি'
        ]
      },
      agriculture: {
        name: 'PANOVA কৃষি',
        tagline: 'শিল্পভিত্তিক কৃষি উৎপাদন ও পরামৰ্শ',
        desc: 'বলকান ও পূর্ব ইউরোপ জুড়ে আধুনিক ফল চাষ, আখরোট বাগান তৈরি এবং টেকসই কৃষি প্রকল্প।',
        services: [
          'আধুনিক বাগান স্থাপন',
          'আখরোট ও ফল চাষের পরামর্শ',
          'সেচ ও সার ব্যবস্থাপনা পরিকাঠামো',
          'কৃষি প্রণোদনা ও সরকারি সহায়তা পর্যবেক্ষণ'
        ]
      },
      construction: {
        name: 'PANOVA নির্মাণ',
        tagline: 'শিল্প প্রতিষ্ঠান ও অবকাঠামো সমাধান',
        desc: 'কৃষি গুদামজাতকরণ, শিল্পভিত্তিক কোল্ড স্টোরেজ, জমি উন্নয়ন ও ইঞ্জিনিয়ারিং সমাধান।',
        services: [
          'শিল্প ও কৃষি গুদাম নির্মাণ',
          'জমি উন্নয়ন ও অবকাঠামো প্রজেক্ট',
          'ইঞ্জিনিয়ারিং ও প্রজেক্ট কন্ট্রাক্টিং',
          'ফিল্ড প্রসেস ম্যানেজমেন্ট'
        ]
      }
    }
  },
  ar: {
    contactUs: 'اتصل بنا',
    tagline: 'مجموعة شركات دولية',
    heroTitle: 'PANOVA GROUP',
    heroDesc: 'حلول مؤسسية بالمعايير الدولية في الموارد البشرية، التجارة الخارجية، الزراعة، والإنشاءات.',
    selectedCompany: 'الشركة المختارة',
    scopeTitle: 'نطاق الأنشطة والخدمات',
    formTitle: 'التواصل / تقديم الطلب',
    formDesc: 'سيتم توجيه طلبك مباشرة إلى فريق العمليات بالشركة المعنية.',
    nameLabel: 'الاسم الكامل / اسم الشركة *',
    emailLabel: 'البريد الإلكتروني *',
    phoneLabel: 'رقم الهاتف *',
    notesLabel: 'طلبك / ملاحظاتك',
    submitBtn: 'إرسال الطلب',
    submitting: 'جاري الإرسال...',
    successTitle: 'تم استلام طلبك بنجاح!',
    successDesc: 'سيتواصل معك فريقنا في أقرب وقت ممكن.',
    companies: {
      hr: {
        name: 'PANOVA الموارد البشرية',
        tagline: 'التوظيف عبر الحدود والقوى العاملة الدولية',
        desc: 'خدمات التوظيف والاستشارات الدولية التي تربط المواهب المناسبة بالمشروع المناسب في الأسواق العالمية.',
        services: [
          'توفير العمالة الدولية',
          'توظيف العمالة الماهرة والمهنية',
          'استشارات تصاريح العمل والتأشيرات',
          'تخطيط القوى العاملة القطاعية'
        ]
      },
      trade: {
        name: 'PANOVA التجارة الخارجية',
        tagline: 'سلسلة التوريد العالمية وجسر التجارة',
        desc: 'عمليات الاستيراد والتصدير والخدمات اللوجستية وتطوير الأسواق في الأسواق الإقليمية والدولية.',
        services: [
          'الاستيراد والتصدير الدولي للمنتجات',
          'إدارة سلسلة التوريد',
          'أبحاث السوق والربط بين الشركات B2B',
          'استشارات الجمارك واللوجستيات'
        ]
      },
      agriculture: {
        name: 'PANOVA الزراعة',
        tagline: 'الإنتاج الصناعي والاستشارات الزراعية',
        desc: 'زراعة الفاكهة الحديثة، إنشاء بساتين الجوز والفاكهة، والمشاريع الزراعية المستدامة في البلقان.',
        services: [
          'إنشاء البساتين الحديثة',
          'استشارات زراعة الجوز والفاكهة',
          'بنية الري والتسميد التحتية',
          'متابعة الدعم الحكومي والحوافز الزراعية'
        ]
      },
      construction: {
        name: 'PANOVA الإنشاءات',
        tagline: 'المنشآت الصناعية وحلول البنية التحتية',
        desc: 'المستودعات الزراعية، مستودعات التبريد الصناعية، مشاريع البنية التحتية للأراضي والحلول الهندسة.',
        services: [
          'بناء المستودعات الصناعية والزراعية',
          'مشاريع تهيئة الأراضي والبنية التحتية',
          'الهندسة والمقاولات',
          'إدارة العمليات الميدانية'
        ]
      }
    }
  }
};
