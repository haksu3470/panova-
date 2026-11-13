import type { Language } from './dictionary';

/**
 * The one profession catalog. Candidate forms store the key on
 * job_candidates.profession; the employer request form stores the keys
 * (comma-joined) on job_requests.position_title. Free text is still stored
 * when someone picks Other or types a custom position.
 * Sector keys are what the forms store on `sector`.
 */

export const PROFESSION_LOCALES: readonly Language[] = ['tr', 'en', 'mk', 'sq', 'ar'];

/** Select value for "Other (please specify)". Never written to the database. */
export const OTHER_PROFESSION = '__other__';

export type Sector = {
  key: string;
  labels: Record<Language, string>;
};

export type Profession = {
  key: string;
  sector: string;
  labels: Record<Language, string>;
};

function sector(key: string, labels: Record<Language, string>): Sector {
  return { key, labels };
}

function job(key: string, sectorKey: string, labels: Record<Language, string>): Profession {
  return { key, sector: sectorKey, labels };
}

/** The 11 sectors, in form order. The old 'trade' sector is gone (its jobs moved to logistics and office_engineering). */
export const SECTORS: readonly Sector[] = [
  sector('construction', {
    tr: 'İnşaat ve yapı', en: 'Construction and building', sq: 'Ndërtim dhe objekte',
    ar: 'البناء والتشييد', mk: 'Градежништво и објекти',
  }),
  sector('agriculture', {
    tr: 'Tarım ve hayvancılık', en: 'Agriculture and livestock', sq: 'Bujqësi dhe blegtori',
    ar: 'الزراعة والثروة الحيوانية', mk: 'Земјоделство и сточарство',
  }),
  sector('hospitality', {
    tr: 'Otelcilik ve gıda hizmetleri', en: 'Hospitality and food services', sq: 'Hoteleri dhe shërbime ushqimore',
    ar: 'الضيافة والخدمات الغذائية', mk: 'Угостителство и прехранбени услуги',
  }),
  sector('manufacturing', {
    tr: 'İmalat ve sanayi', en: 'Manufacturing and industry', sq: 'Prodhim dhe industri',
    ar: 'التصنيع والصناعة', mk: 'Производство и индустрија',
  }),
  sector('textile', {
    tr: 'Tekstil ve hazır giyim', en: 'Textiles and garments', sq: 'Tekstil dhe konfeksione',
    ar: 'النسيج والملابس الجاهزة', mk: 'Текстил и конфекција',
  }),
  sector('logistics', {
    tr: 'Lojistik ve taşımacılık', en: 'Logistics and transport', sq: 'Logjistikë dhe transport',
    ar: 'الخدمات اللوجستية والنقل', mk: 'Логистика и транспорт',
  }),
  sector('warehouse_retail', {
    tr: 'Depo ve perakende', en: 'Warehousing and retail', sq: 'Magazinim dhe shitje me pakicë',
    ar: 'المستودعات وتجارة التجزئة', mk: 'Магацинско работење и малопродажба',
  }),
  sector('care', {
    tr: 'Bakım ve sağlık hizmetleri', en: 'Care and health services', sq: 'Kujdes dhe shërbime shëndetësore',
    ar: 'الرعاية والخدمات الصحية', mk: 'Нега и здравствени услуги',
  }),
  sector('cleaning_security', {
    tr: 'Temizlik ve güvenlik', en: 'Cleaning and security', sq: 'Pastrim dhe siguri',
    ar: 'التنظيف والأمن', mk: 'Чистење и обезбедување',
  }),
  sector('automotive', {
    tr: 'Otomotiv ve teknik servis', en: 'Automotive and technical service', sq: 'Automjete dhe shërbim teknik',
    ar: 'السيارات والخدمة الفنية', mk: 'Автомобилски и технички сервис',
  }),
  sector('office_engineering', {
    tr: 'Ofis, mühendislik ve dış ticaret', en: 'Office, engineering and foreign trade', sq: 'Zyrë, inxhinieri dhe tregti e jashtme',
    ar: 'المكاتب والهندسة والتجارة الخارجية', mk: 'Канцелариско работење, инженерство и надворешна трговија',
  }),
];

export const SECTOR_KEYS: readonly string[] = SECTORS.map((item) => item.key);

/**
 * Sector labels the forms showed before the 11-sector list. Older rows may
 * have stored one of these as text; they stay readable aliases of the key.
 */
export const LEGACY_SECTOR_LABELS: Readonly<Record<string, readonly string[]>> = {
  construction: ['Construction', 'İnşaat & Yapı', 'Construction & building', 'Ndërtim', 'Ndërtim & objekte', 'الإنشاءات', 'Градежништво'],
  agriculture: [],
  hospitality: [
    'Turizm ve otelcilik', 'Turizm & Otelcilik', 'Tourism and hospitality', 'Tourism & hospitality',
    'Turizëm dhe hoteleri', 'Turizëm & hoteleri', 'السياحة والفنادق', 'السياحة والضيافة', 'Туризам и хотелиерство',
  ],
  manufacturing: [
    'Genel üretim ve sanayi', 'Üretim & Sanayi', 'Üretim ve Sanayi', 'Manufacturing', 'Manufacturing & industry',
    'Prodhim i përgjithshëm', 'Prodhim & industri', 'التصنيع العام', 'الإنتاج والصناعة', 'Општо производство',
  ],
  logistics: ['Lojistik', 'Lojistik & Taşımacılık', 'Logistics', 'Logistics & transport', 'Logjistikë', 'Logjistikë & transport', 'اللوجستيات والنقل', 'الخدمات اللوجستية', 'Логистика'],
  care: ['Sağlık ve bakım', 'Sağlık & Bakım', 'Health and care', 'Health & care', 'Shëndet dhe kujdes', 'Shëndet & kujdes', 'الصحة والرعاية', 'Здравство и нега'],
};

export const PROFESSIONS: readonly Profession[] = [
  // Construction
  job('electrician', 'construction', { tr: 'Elektrikçi', en: 'Electrician', mk: 'Електричар', sq: 'Elektricist', ar: 'كهربائي' }),
  job('plumber', 'construction', { tr: 'Tesisatçı', en: 'Plumber', mk: 'Водоинсталатер', sq: 'Hidraulik', ar: 'سبّاك' }),
  job('welder', 'construction', { tr: 'Kaynakçı', en: 'Welder', mk: 'Заварувач', sq: 'Saldues', ar: 'لحّام' }),
  job('mason', 'construction', { tr: 'Duvarcı', en: 'Mason', mk: 'Ѕидар', sq: 'Murator', ar: 'بنّاء' }),
  job('carpenter', 'construction', { tr: 'Kalıpçı / marangoz', en: 'Carpenter / formwork', mk: 'Опажувач / столар', sq: 'Marangoz / kallëp', ar: 'نجار قوالب' }),
  job('steel_fixer', 'construction', { tr: 'Demirci', en: 'Steel fixer', mk: 'Арматурист', sq: 'Hekurkthyes', ar: 'حدّاد تسليح' }),
  job('painter', 'construction', { tr: 'Boyacı', en: 'Painter', mk: 'Молер', sq: 'Lyerës', ar: 'دهّان' }),
  job('tiler', 'construction', { tr: 'Fayansçı', en: 'Tiler', mk: 'Плочкар', sq: 'Pllakaxhi', ar: 'مبلّط' }),
  job('plasterer', 'construction', { tr: 'Sıvacı', en: 'Plasterer', mk: 'Малтерџија', sq: 'Suvatues', ar: 'مليس' }),
  job('scaffolder', 'construction', { tr: 'İskeleci', en: 'Scaffolder', mk: 'Скелар', sq: 'Montues skelash', ar: 'عامل سقالات' }),
  job('heavy_equipment_operator', 'construction', { tr: 'İş makinesi operatörü', en: 'Heavy equipment operator', mk: 'Оператор на градежна механизација', sq: 'Operator i makinerisë së rëndë', ar: 'مشغّل معدات ثقيلة' }),
  job('crane_operator', 'construction', { tr: 'Vinç operatörü', en: 'Crane operator', mk: 'Оператор на кран', sq: 'Operator vinçi', ar: 'مشغّل رافعة' }),
  job('construction_labourer', 'construction', { tr: 'İnşaat işçisi', en: 'Construction labourer', mk: 'Градежен работник', sq: 'Punëtor ndërtimi', ar: 'عامل بناء' }),
  job('site_foreman', 'construction', { tr: 'Şantiye formen', en: 'Site foreman', mk: 'Шеф на градилиште', sq: 'Kryepunëtor kantieri', ar: 'مشرف عمال الموقع' }),
  job('site_manager', 'construction', { tr: 'Şantiye şefi', en: 'Site manager', mk: 'Раководител на градилиште', sq: 'Drejtues kantieri', ar: 'مدير موقع البناء' }),
  job('roofer', 'construction', { tr: 'Çatı ustası', en: 'Roofer', mk: 'Покривач', sq: 'Punëtor çatish', ar: 'عامل أسقف' }),
  job('insulation_worker', 'construction', { tr: 'Yalıtım ustası', en: 'Insulation worker', mk: 'Изолатер', sq: 'Izolues', ar: 'عامل عزل' }),
  job('drywall_installer', 'construction', { tr: 'Alçıpan ustası', en: 'Drywall installer', mk: 'Монтер на гипс-картон', sq: 'Montues gipsi', ar: 'مركّب ألواح الجبس' }),
  job('concrete_worker', 'construction', { tr: 'Betoncu', en: 'Concrete worker', mk: 'Бетонер', sq: 'Punëtor betoni', ar: 'عامل خرسانة' }),
  job('hvac_technician', 'construction', { tr: 'Klima ve havalandırma teknisyeni', en: 'HVAC technician', mk: 'Техничар за климатизација и вентилација', sq: 'Teknik ngrohje-ftohjeje', ar: 'فني تكييف وتهوية' }),
  job('glazier', 'construction', { tr: 'Camcı', en: 'Glazier', mk: 'Стаклар', sq: 'Xhamxhi', ar: 'زجّاج' }),
  job('road_construction_worker', 'construction', { tr: 'Yol yapım işçisi', en: 'Road construction worker', mk: 'Работник за изградба на патишта', sq: 'Punëtor ndërtimi rrugësh', ar: 'عامل إنشاء طرق' }),
  job('floor_layer', 'construction', { tr: 'Zemin döşemecisi', en: 'Floor layer', mk: 'Подополагач', sq: 'Shtrues dyshemesh', ar: 'مركّب أرضيات' }),

  // Agriculture
  job('farm_worker', 'agriculture', { tr: 'Tarım işçisi', en: 'Farm worker', mk: 'Земјоделски работник', sq: 'Punëtor bujqësie', ar: 'عامل زراعي' }),
  job('harvest_worker', 'agriculture', { tr: 'Hasat işçisi', en: 'Harvest worker', mk: 'Жетвар', sq: 'Punëtor korrjeje', ar: 'عامل حصاد' }),
  job('greenhouse_worker', 'agriculture', { tr: 'Sera işçisi', en: 'Greenhouse worker', mk: 'Работник во оранжерија', sq: 'Punëtor sere', ar: 'عامل بيوت محمية' }),
  job('tractor_operator', 'agriculture', { tr: 'Traktör operatörü', en: 'Tractor operator', mk: 'Оператор на трактор', sq: 'Operator traktori', ar: 'مشغّل جرار' }),
  job('livestock_worker', 'agriculture', { tr: 'Hayvancılık işçisi', en: 'Livestock worker', mk: 'Сточар', sq: 'Punëtor blegtorie', ar: 'عامل ثروة حيوانية' }),
  job('irrigation_worker', 'agriculture', { tr: 'Sulama işçisi', en: 'Irrigation worker', mk: 'Работник за наводнување', sq: 'Punëtor ujitjeje', ar: 'عامل ري' }),
  job('pruning_worker', 'agriculture', { tr: 'Budama işçisi', en: 'Pruning worker', mk: 'Работник за кроење', sq: 'Punëtor krasitjeje', ar: 'عامل تقليم' }),
  job('packing_worker', 'agriculture', { tr: 'Paketleme elemanı', en: 'Packing worker', mk: 'Пакувач', sq: 'Punëtor paketimi', ar: 'عامل تعبئة' }),
  job('greenhouse_supervisor', 'agriculture', { tr: 'Sera sorumlusu', en: 'Greenhouse supervisor', mk: 'Одговорен за оранжерии', sq: 'Përgjegjës sere', ar: 'مسؤول البيوت المحمية' }),
  job('mushroom_grower', 'agriculture', { tr: 'Mantar yetiştiricisi', en: 'Mushroom grower', mk: 'Одгледувач на печурки', sq: 'Kultivues kërpudhash', ar: 'مزارع فطر' }),
  job('fruit_picker', 'agriculture', { tr: 'Meyve toplama işçisi', en: 'Fruit picker', mk: 'Берач на овошје', sq: 'Mbledhës frutash', ar: 'عامل قطف الفواكه' }),
  job('dairy_worker', 'agriculture', { tr: 'Süt sağım işçisi', en: 'Dairy worker', mk: 'Молзач', sq: 'Mjelës', ar: 'عامل حلب' }),
  job('poultry_worker', 'agriculture', { tr: 'Kümes hayvanları işçisi', en: 'Poultry worker', mk: 'Работник во живинарство', sq: 'Punëtor shpendësh', ar: 'عامل دواجن' }),
  job('shepherd', 'agriculture', { tr: 'Çoban', en: 'Shepherd', mk: 'Овчар', sq: 'Bari', ar: 'راعي أغنام' }),
  job('vineyard_worker', 'agriculture', { tr: 'Bağ işçisi', en: 'Vineyard worker', mk: 'Лозар', sq: 'Punëtor vreshti', ar: 'عامل كروم' }),
  job('forestry_worker', 'agriculture', { tr: 'Orman işçisi', en: 'Forestry worker', mk: 'Шумски работник', sq: 'Punëtor pyjor', ar: 'عامل غابات' }),
  job('gardener', 'agriculture', { tr: 'Bahçıvan', en: 'Gardener', mk: 'Градинар', sq: 'Kopshtar', ar: 'بستاني' }),

  // Hospitality and food services (food production and processing too)
  job('cook', 'hospitality', { tr: 'Aşçı', en: 'Cook', mk: 'Готвач', sq: 'Kuzhinier', ar: 'طبّاخ' }),
  job('kitchen_helper', 'hospitality', { tr: 'Mutfak yardımcısı', en: 'Kitchen helper', mk: 'Помошник во кујна', sq: 'Ndihmës kuzhine', ar: 'مساعد مطبخ' }),
  job('waiter', 'hospitality', { tr: 'Garson', en: 'Waiter', mk: 'Келнер', sq: 'Kamarier', ar: 'نادل' }),
  job('housekeeper', 'hospitality', { tr: 'Kat görevlisi', en: 'Housekeeper', mk: 'Собарица', sq: 'Pastruese katësh', ar: 'عامل نظافة غرف' }),
  job('dishwasher', 'hospitality', { tr: 'Bulaşıkçı', en: 'Dishwasher', mk: 'Мијач на садови', sq: 'Larës enësh', ar: 'غاسل أطباق' }),
  job('baker', 'hospitality', { tr: 'Fırıncı', en: 'Baker', mk: 'Пекар', sq: 'Furrtar', ar: 'خبّاز' }),
  job('chef', 'hospitality', { tr: 'Şef aşçı', en: 'Head chef', mk: 'Главен готвач', sq: 'Shef kuzhine', ar: 'رئيس طهاة' }),
  job('pastry_cook', 'hospitality', { tr: 'Pastacı', en: 'Pastry cook', mk: 'Слаткар', sq: 'Ëmbëlsirëbërës', ar: 'حلواني' }),
  job('butcher', 'hospitality', { tr: 'Kasap', en: 'Butcher', mk: 'Месар', sq: 'Kasap', ar: 'جزّار' }),
  job('receptionist', 'hospitality', { tr: 'Resepsiyonist', en: 'Receptionist', mk: 'Рецепционер', sq: 'Recepsionist', ar: 'موظف استقبال' }),
  job('bartender', 'hospitality', { tr: 'Barmen', en: 'Bartender', mk: 'Бармен', sq: 'Banakier', ar: 'نادل بار' }),
  job('barista', 'hospitality', { tr: 'Kahve ustası (barista)', en: 'Barista', mk: 'Бариста', sq: 'Barist', ar: 'باريستا' }),
  job('hotel_porter', 'hospitality', { tr: 'Otel bellboy', en: 'Hotel porter', mk: 'Хотелски портир', sq: 'Portier hoteli', ar: 'حمّال فندق' }),
  job('catering_assistant', 'hospitality', { tr: 'Catering elemanı', en: 'Catering assistant', mk: 'Помошник во кетеринг', sq: 'Ndihmës kateringu', ar: 'مساعد خدمات تموين' }),
  job('food_production_worker', 'hospitality', { tr: 'Gıda üretim işçisi', en: 'Food production worker', mk: 'Работник во производство на храна', sq: 'Punëtor në prodhimin e ushqimit', ar: 'عامل إنتاج غذائي' }),
  job('meat_processing_worker', 'hospitality', { tr: 'Et işleme işçisi', en: 'Meat processing worker', mk: 'Работник во преработка на месо', sq: 'Punëtor në përpunimin e mishit', ar: 'عامل تصنيع اللحوم' }),
  job('fish_processing_worker', 'hospitality', { tr: 'Balık işleme işçisi', en: 'Fish processing worker', mk: 'Работник во преработка на риба', sq: 'Punëtor në përpunimin e peshkut', ar: 'عامل تصنيع الأسماك' }),
  job('food_packaging_worker', 'hospitality', { tr: 'Gıda paketleme işçisi', en: 'Food packaging worker', mk: 'Пакувач на храна', sq: 'Paketues ushqimesh', ar: 'عامل تغليف الأغذية' }),

  // Manufacturing and industry
  job('machine_operator', 'manufacturing', { tr: 'Makine operatörü', en: 'Machine operator', mk: 'Оператор на машина', sq: 'Operator makinerie', ar: 'مشغّل آلة' }),
  job('sewing_operator', 'manufacturing', { tr: 'Dikiş operatörü', en: 'Sewing operator', mk: 'Оператор на шиење', sq: 'Operator qepjeje', ar: 'مشغّل خياطة' }),
  job('cnc_operator', 'manufacturing', { tr: 'CNC operatörü', en: 'CNC operator', mk: 'ЦНЦ оператор', sq: 'Operator CNC', ar: 'مشغّل CNC' }),
  job('warehouse_worker', 'manufacturing', { tr: 'Depo işçisi', en: 'Warehouse worker', mk: 'Магационер', sq: 'Punëtor magazine', ar: 'عامل مستودع' }),
  job('forklift_driver', 'manufacturing', { tr: 'Forklift operatörü', en: 'Forklift driver', mk: 'Оператор на вилушкар', sq: 'Operator forklifti', ar: 'سائق رافعة شوكية' }),
  job('quality_inspector', 'manufacturing', { tr: 'Kalite kontrolcü', en: 'Quality inspector', mk: 'Контролор на квалитет', sq: 'Kontrollues cilësie', ar: 'مفتش جودة' }),
  job('textile_cutter', 'manufacturing', { tr: 'Kesimci', en: 'Textile cutter', mk: 'Кројач', sq: 'Prerës tekstili', ar: 'قصّاص أقمشة' }),
  job('assembly_worker', 'manufacturing', { tr: 'Montaj işçisi', en: 'Assembly worker', mk: 'Монтажер', sq: 'Punëtor montimi', ar: 'عامل تجميع' }),
  job('production_worker', 'manufacturing', { tr: 'Üretim işçisi', en: 'Production worker', mk: 'Производствен работник', sq: 'Punëtor prodhimi', ar: 'عامل إنتاج' }),
  job('lathe_operator', 'manufacturing', { tr: 'Torna operatörü', en: 'Lathe operator', mk: 'Стругар', sq: 'Tornitor', ar: 'مشغّل مخرطة' }),
  job('metal_worker', 'manufacturing', { tr: 'Metal işçisi', en: 'Metalworker', mk: 'Металски работник', sq: 'Punëtor metali', ar: 'عامل معادن' }),
  job('industrial_painter', 'manufacturing', { tr: 'Endüstriyel boyacı', en: 'Industrial painter', mk: 'Индустриски молер', sq: 'Bojaxhi industrial', ar: 'دهّان صناعي' }),
  job('plastic_injection_operator', 'manufacturing', { tr: 'Plastik enjeksiyon operatörü', en: 'Plastic injection operator', mk: 'Оператор на машина за бризгање пластика', sq: 'Operator injektimi plastike', ar: 'مشغّل حقن البلاستيك' }),
  job('woodworker', 'manufacturing', { tr: 'Ağaç işleri ustası', en: 'Woodworker', mk: 'Дрводелец', sq: 'Punues druri', ar: 'عامل أخشاب' }),
  job('maintenance_technician', 'manufacturing', { tr: 'Bakım teknisyeni', en: 'Maintenance technician', mk: 'Техничар за одржување', sq: 'Teknik mirëmbajtjeje', ar: 'فني صيانة' }),
  job('industrial_electrician', 'manufacturing', { tr: 'Endüstriyel elektrikçi', en: 'Industrial electrician', mk: 'Индустриски електричар', sq: 'Elektricist industrial', ar: 'كهربائي صناعي' }),

  // Textiles and garments
  job('seamstress', 'textile', { tr: 'Dikişçi', en: 'Seamstress', mk: 'Шивачка', sq: 'Rrobaqepëse', ar: 'خيّاطة' }),
  job('tailor', 'textile', { tr: 'Terzi', en: 'Tailor', mk: 'Шивач по мерка', sq: 'Rrobaqepës', ar: 'خيّاط' }),
  job('garment_presser', 'textile', { tr: 'Ütücü', en: 'Garment presser', mk: 'Пеглач', sq: 'Hekurosës', ar: 'عامل كيّ' }),
  job('textile_quality_controller', 'textile', { tr: 'Tekstil kalite kontrolcüsü', en: 'Textile quality controller', mk: 'Контролор на квалитет на текстил', sq: 'Kontrollues cilësie tekstili', ar: 'مراقب جودة النسيج' }),
  job('knitting_operator', 'textile', { tr: 'Örme makinesi operatörü', en: 'Knitting machine operator', mk: 'Оператор на машина за плетење', sq: 'Operator makine thurjeje', ar: 'مشغّل آلة حياكة' }),
  job('weaver', 'textile', { tr: 'Dokumacı', en: 'Weaver', mk: 'Ткајач', sq: 'Endës', ar: 'نسّاج' }),
  job('embroidery_operator', 'textile', { tr: 'Nakış operatörü', en: 'Embroidery operator', mk: 'Оператор на везење', sq: 'Operator qëndisjeje', ar: 'مشغّل تطريز' }),
  job('pattern_maker', 'textile', { tr: 'Modelist', en: 'Pattern maker', mk: 'Моделар', sq: 'Modelist', ar: 'راسم باترونات' }),
  job('garment_packer', 'textile', { tr: 'Konfeksiyon paketleme elemanı', en: 'Garment packer', mk: 'Пакувач на конфекција', sq: 'Paketues konfeksionesh', ar: 'عامل تغليف الملابس' }),
  job('dyeing_operator', 'textile', { tr: 'Boyahane operatörü', en: 'Dyeing operator', mk: 'Оператор во бојадисување', sq: 'Operator ngjyrosjeje', ar: 'مشغّل صباغة' }),
  job('footwear_worker', 'textile', { tr: 'Ayakkabı imalat işçisi', en: 'Footwear worker', mk: 'Работник во производство на обувки', sq: 'Punëtor në prodhimin e këpucëve', ar: 'عامل صناعة الأحذية' }),
  job('overlock_operator', 'textile', { tr: 'Overlok makinecisi', en: 'Overlock operator', mk: 'Оператор на оверлок', sq: 'Operator overloku', ar: 'مشغّل أوفرلوك' }),

  // Logistics and transport
  job('truck_driver', 'logistics', { tr: 'Tır şoförü', en: 'Truck driver', mk: 'Возач на камион', sq: 'Shofer kamioni', ar: 'سائق شاحنة' }),
  job('delivery_driver', 'logistics', { tr: 'Dağıtım şoförü', en: 'Delivery driver', mk: 'Возач за достава', sq: 'Shofer shpërndarjeje', ar: 'سائق توصيل' }),
  job('loader', 'logistics', { tr: 'Yükleme işçisi', en: 'Loader', mk: 'Товарник', sq: 'Punëtor ngarkimi', ar: 'عامل تحميل' }),
  job('logistics_coordinator', 'logistics', { tr: 'Lojistik sorumlusu', en: 'Logistics coordinator', mk: 'Одговорен за логистика', sq: 'Përgjegjës logjistike', ar: 'مسؤول لوجستيات' }),
  job('bus_driver', 'logistics', { tr: 'Otobüs şoförü', en: 'Bus driver', mk: 'Возач на автобус', sq: 'Shofer autobusi', ar: 'سائق حافلة' }),
  job('van_driver', 'logistics', { tr: 'Kamyonet şoförü', en: 'Van driver', mk: 'Возач на комбе', sq: 'Shofer furgoni', ar: 'سائق شاحنة صغيرة' }),
  job('courier', 'logistics', { tr: 'Kurye', en: 'Courier', mk: 'Курир', sq: 'Korrier', ar: 'ساعي' }),
  job('dispatcher', 'logistics', { tr: 'Sevkiyat sorumlusu', en: 'Dispatcher', mk: 'Диспечер', sq: 'Dispeçer', ar: 'منسّق إرسال' }),
  job('taxi_driver', 'logistics', { tr: 'Taksi şoförü', en: 'Taxi driver', mk: 'Таксист', sq: 'Shofer taksie', ar: 'سائق تاكسي' }),
  job('freight_handler', 'logistics', { tr: 'Kargo elemanı', en: 'Freight handler', mk: 'Работник за товар', sq: 'Punëtor ngarkesash', ar: 'عامل شحن' }),
  job('port_worker', 'logistics', { tr: 'Liman işçisi', en: 'Port worker', mk: 'Пристанишен работник', sq: 'Punëtor porti', ar: 'عامل ميناء' }),
  job('driver_mate', 'logistics', { tr: 'Şoför yardımcısı', en: 'Driver’s mate', mk: 'Совозач', sq: 'Ndihmës shoferi', ar: 'مساعد سائق' }),

  // Warehousing and retail
  job('warehouse_supervisor', 'warehouse_retail', { tr: 'Depo sorumlusu', en: 'Warehouse supervisor', mk: 'Одговорен за магацин', sq: 'Përgjegjës magazine', ar: 'مسؤول مستودع' }),
  job('order_picker', 'warehouse_retail', { tr: 'Sipariş toplayıcı', en: 'Order picker', mk: 'Комисионер', sq: 'Mbledhës porosish', ar: 'عامل تجهيز الطلبات' }),
  job('stock_controller', 'warehouse_retail', { tr: 'Stok kontrol elemanı', en: 'Stock controller', mk: 'Контролор на залиха', sq: 'Kontrollues stoku', ar: 'مراقب مخزون' }),
  job('shelf_stocker', 'warehouse_retail', { tr: 'Reyon görevlisi', en: 'Shelf stocker', mk: 'Полнач на рафтови', sq: 'Furnizues raftesh', ar: 'عامل رفوف' }),
  job('cashier', 'warehouse_retail', { tr: 'Kasiyer', en: 'Cashier', mk: 'Касиер', sq: 'Arkëtar', ar: 'أمين صندوق' }),
  job('sales_assistant', 'warehouse_retail', { tr: 'Mağaza satış elemanı', en: 'Sales assistant', mk: 'Продавач', sq: 'Shitës dyqani', ar: 'مساعد مبيعات' }),
  job('store_manager', 'warehouse_retail', { tr: 'Mağaza müdürü', en: 'Store manager', mk: 'Управител на продавница', sq: 'Menaxher dyqani', ar: 'مدير متجر' }),
  job('warehouse_packer', 'warehouse_retail', { tr: 'Depo paketleme elemanı', en: 'Warehouse packer', mk: 'Пакувач во магацин', sq: 'Paketues magazine', ar: 'عامل تغليف في المستودع' }),
  job('reach_truck_operator', 'warehouse_retail', { tr: 'Reach truck operatörü', en: 'Reach truck operator', mk: 'Оператор на ричтрак', sq: 'Operator reach truck', ar: 'مشغّل رافعة ريتش' }),
  job('inventory_clerk', 'warehouse_retail', { tr: 'Envanter sayım elemanı', en: 'Inventory clerk', mk: 'Попишувач', sq: 'Nëpunës inventari', ar: 'موظف جرد' }),
  job('merchandiser', 'warehouse_retail', { tr: 'Reyon düzenleyici', en: 'Merchandiser', mk: 'Мерчендајзер', sq: 'Merçandajzer', ar: 'منسّق عرض المنتجات' }),
  job('receiving_clerk', 'warehouse_retail', { tr: 'Mal kabul elemanı', en: 'Goods receiving clerk', mk: 'Референт за прием на стока', sq: 'Nëpunës pranimi mallrash', ar: 'موظف استلام البضائع' }),

  // Care and health services
  job('caregiver', 'care', { tr: 'Bakıcı', en: 'Caregiver', mk: 'Негувател', sq: 'Kujdestar', ar: 'مقدّم رعاية' }),
  job('elderly_caregiver', 'care', { tr: 'Yaşlı bakıcısı', en: 'Elderly caregiver', mk: 'Негувател на стари лица', sq: 'Kujdestar i të moshuarve', ar: 'مقدّم رعاية للمسنين' }),
  job('home_care_assistant', 'care', { tr: 'Evde bakım yardımcısı', en: 'Home care assistant', mk: 'Помошник за домашна нега', sq: 'Asistent i kujdesit në shtëpi', ar: 'مساعد رعاية منزلية' }),
  job('nurse', 'care', { tr: 'Hemşire', en: 'Nurse', mk: 'Медицинска сестра', sq: 'Infermier', ar: 'ممرض' }),
  job('nursing_assistant', 'care', { tr: 'Hasta bakıcı', en: 'Nursing assistant', mk: 'Болничар', sq: 'Ndihmës infermier', ar: 'مساعد تمريض' }),
  job('childcare_worker', 'care', { tr: 'Çocuk bakıcısı', en: 'Childcare worker', mk: 'Негувателка на деца', sq: 'Kujdestare fëmijësh', ar: 'مربية أطفال' }),
  job('disability_support_worker', 'care', { tr: 'Engelli bakım elemanı', en: 'Disability support worker', mk: 'Негувател на лица со попреченост', sq: 'Kujdestar për persona me aftësi të kufizuara', ar: 'عامل رعاية ذوي الإعاقة' }),
  job('physiotherapy_assistant', 'care', { tr: 'Fizyoterapi asistanı', en: 'Physiotherapy assistant', mk: 'Асистент за физиотерапија', sq: 'Asistent fizioterapie', ar: 'مساعد علاج طبيعي' }),
  job('medical_secretary', 'care', { tr: 'Tıbbi sekreter', en: 'Medical secretary', mk: 'Медицински секретар', sq: 'Sekretar mjekësor', ar: 'سكرتير طبي' }),
  job('paramedic', 'care', { tr: 'Paramedik', en: 'Paramedic', mk: 'Парамедицинар', sq: 'Ndihmës mjekësor urgjence', ar: 'مسعف' }),
  job('pharmacy_assistant', 'care', { tr: 'Eczane teknisyeni', en: 'Pharmacy assistant', mk: 'Фармацевтски техничар', sq: 'Asistent farmacie', ar: 'مساعد صيدلي' }),
  job('lab_assistant', 'care', { tr: 'Laboratuvar asistanı', en: 'Laboratory assistant', mk: 'Лабораториски асистент', sq: 'Asistent laboratori', ar: 'مساعد مختبر' }),

  // Cleaning and security
  job('cleaner', 'cleaning_security', { tr: 'Temizlik görevlisi', en: 'Cleaner', mk: 'Хигиеничар', sq: 'Pastrues', ar: 'عامل نظافة' }),
  job('industrial_cleaner', 'cleaning_security', { tr: 'Endüstriyel temizlik elemanı', en: 'Industrial cleaner', mk: 'Индустриски хигиеничар', sq: 'Pastrues industrial', ar: 'عامل نظافة صناعية' }),
  job('window_cleaner', 'cleaning_security', { tr: 'Cam silme elemanı', en: 'Window cleaner', mk: 'Чистач на прозорци', sq: 'Pastrues xhamash', ar: 'منظّف نوافذ' }),
  job('hospital_cleaner', 'cleaning_security', { tr: 'Hastane temizlik görevlisi', en: 'Hospital cleaner', mk: 'Хигиеничар во болница', sq: 'Pastrues spitali', ar: 'عامل نظافة مستشفى' }),
  job('laundry_worker', 'cleaning_security', { tr: 'Çamaşırhane elemanı', en: 'Laundry worker', mk: 'Работник во перална', sq: 'Punëtor lavanderie', ar: 'عامل مغسلة' }),
  job('security_guard', 'cleaning_security', { tr: 'Güvenlik görevlisi', en: 'Security guard', mk: 'Обезбедувач', sq: 'Roje sigurie', ar: 'حارس أمن' }),
  job('night_watchman', 'cleaning_security', { tr: 'Gece bekçisi', en: 'Night watchman', mk: 'Ноќен чувар', sq: 'Roje nate', ar: 'حارس ليلي' }),
  job('cctv_operator', 'cleaning_security', { tr: 'Kamera izleme operatörü', en: 'CCTV operator', mk: 'Оператор на видеонадзор', sq: 'Operator kamerash sigurie', ar: 'مشغّل كاميرات المراقبة' }),
  job('pest_control_worker', 'cleaning_security', { tr: 'İlaçlama elemanı', en: 'Pest control worker', mk: 'Работник за дезинсекција', sq: 'Punëtor dezinsektimi', ar: 'عامل مكافحة الآفات' }),
  job('caretaker', 'cleaning_security', { tr: 'Apartman görevlisi', en: 'Caretaker', mk: 'Домар', sq: 'Kujdestar ndërtese', ar: 'حارس عقار' }),
  job('waste_collector', 'cleaning_security', { tr: 'Çöp toplama işçisi', en: 'Waste collector', mk: 'Собирач на отпад', sq: 'Mbledhës mbeturinash', ar: 'عامل جمع النفايات' }),

  // Automotive and technical service
  job('auto_mechanic', 'automotive', { tr: 'Oto tamircisi', en: 'Car mechanic', mk: 'Автомеханичар', sq: 'Mekanik automjetesh', ar: 'ميكانيكي سيارات' }),
  job('auto_electrician', 'automotive', { tr: 'Oto elektrikçisi', en: 'Auto electrician', mk: 'Автоелектричар', sq: 'Elektricist automjetesh', ar: 'كهربائي سيارات' }),
  job('body_repairer', 'automotive', { tr: 'Kaportacı', en: 'Body repairer', mk: 'Автолимар', sq: 'Llamarinist', ar: 'سمكري سيارات' }),
  job('car_painter', 'automotive', { tr: 'Oto boyacı', en: 'Car painter', mk: 'Автолакер', sq: 'Bojaxhi automjetesh', ar: 'دهّان سيارات' }),
  job('tyre_technician', 'automotive', { tr: 'Lastikçi', en: 'Tyre technician', mk: 'Вулканизер', sq: 'Gomist', ar: 'فني إطارات' }),
  job('truck_mechanic', 'automotive', { tr: 'Ağır vasıta tamircisi', en: 'Truck mechanic', mk: 'Механичар за камиони', sq: 'Mekanik kamionësh', ar: 'ميكانيكي شاحنات' }),
  job('car_washer', 'automotive', { tr: 'Oto yıkamacı', en: 'Car washer', mk: 'Перач на возила', sq: 'Larës makinash', ar: 'عامل غسيل سيارات' }),
  job('service_advisor', 'automotive', { tr: 'Servis danışmanı', en: 'Service advisor', mk: 'Сервисен советник', sq: 'Këshilltar servisi', ar: 'مستشار خدمة' }),
  job('car_upholsterer', 'automotive', { tr: 'Oto döşemeci', en: 'Car upholsterer', mk: 'Тапетар за возила', sq: 'Tapicier automjetesh', ar: 'منجّد سيارات' }),
  job('agricultural_machinery_mechanic', 'automotive', { tr: 'Tarım makineleri tamircisi', en: 'Agricultural machinery mechanic', mk: 'Механичар за земјоделска механизација', sq: 'Mekanik makinerish bujqësore', ar: 'ميكانيكي آلات زراعية' }),
  job('motorcycle_mechanic', 'automotive', { tr: 'Motosiklet tamircisi', en: 'Motorcycle mechanic', mk: 'Механичар за мотоцикли', sq: 'Mekanik motoçikletash', ar: 'ميكانيكي دراجات نارية' }),
  job('elevator_technician', 'automotive', { tr: 'Asansör teknisyeni', en: 'Lift technician', mk: 'Техничар за лифтови', sq: 'Teknik ashensorësh', ar: 'فني مصاعد' }),

  // Office, engineering and foreign trade
  job('civil_engineer', 'office_engineering', { tr: 'İnşaat mühendisi', en: 'Civil engineer', mk: 'Градежен инженер', sq: 'Inxhinier ndërtimi', ar: 'مهندس مدني' }),
  job('foreign_trade_specialist', 'office_engineering', { tr: 'Dış ticaret uzmanı', en: 'Foreign trade specialist', mk: 'Специјалист за надворешна трговија', sq: 'Specialist i tregtisë së jashtme', ar: 'أخصائي تجارة خارجية' }),
  job('bookkeeper', 'office_engineering', { tr: 'Ön muhasebe elemanı', en: 'Bookkeeper', mk: 'Книговодител', sq: 'Kontabilist ndihmës', ar: 'محاسب مساعد' }),
  job('sales_representative', 'office_engineering', { tr: 'Satış temsilcisi', en: 'Sales representative', mk: 'Продажен претставник', sq: 'Përfaqësues shitjesh', ar: 'مندوب مبيعات' }),
  job('accountant', 'office_engineering', { tr: 'Muhasebeci', en: 'Accountant', mk: 'Сметководител', sq: 'Kontabilist', ar: 'محاسب' }),
  job('office_assistant', 'office_engineering', { tr: 'Ofis asistanı', en: 'Office assistant', mk: 'Канцелариски асистент', sq: 'Asistent zyre', ar: 'مساعد مكتبي' }),
  job('mechanical_engineer', 'office_engineering', { tr: 'Makine mühendisi', en: 'Mechanical engineer', mk: 'Машински инженер', sq: 'Inxhinier mekanik', ar: 'مهندس ميكانيكي' }),
  job('electrical_engineer', 'office_engineering', { tr: 'Elektrik mühendisi', en: 'Electrical engineer', mk: 'Електроинженер', sq: 'Inxhinier elektrik', ar: 'مهندس كهربائي' }),
  job('architect', 'office_engineering', { tr: 'Mimar', en: 'Architect', mk: 'Архитект', sq: 'Arkitekt', ar: 'مهندس معماري' }),
  job('it_technician', 'office_engineering', { tr: 'Bilgi işlem teknisyeni', en: 'IT technician', mk: 'ИТ техничар', sq: 'Teknik IT', ar: 'فني تقنية معلومات' }),
  job('hr_specialist', 'office_engineering', { tr: 'İnsan kaynakları uzmanı', en: 'HR specialist', mk: 'Специјалист за човечки ресурси', sq: 'Specialist i burimeve njerëzore', ar: 'أخصائي موارد بشرية' }),
  job('translator', 'office_engineering', { tr: 'Tercüman', en: 'Translator', mk: 'Преведувач', sq: 'Përkthyes', ar: 'مترجم' }),
  job('customer_service_agent', 'office_engineering', { tr: 'Müşteri hizmetleri temsilcisi', en: 'Customer service agent', mk: 'Агент за услуги на корисници', sq: 'Agjent i shërbimit ndaj klientit', ar: 'ممثل خدمة العملاء' }),
  job('surveyor', 'office_engineering', { tr: 'Harita teknikeri', en: 'Surveyor', mk: 'Геодет', sq: 'Topograf', ar: 'مسّاح' }),
  job('customs_specialist', 'office_engineering', { tr: 'Gümrük işlemleri uzmanı', en: 'Customs specialist', mk: 'Царински специјалист', sq: 'Specialist doganor', ar: 'أخصائي تخليص جمركي' }),
];

/**
 * The 19 positions of the old employer request form (lib/portal-ui-copy.ts,
 * removed) and the catalog key each one now means. Their labels in every
 * locale stay readable aliases, so request titles saved as those labels
 * still localize.
 */
export const LEGACY_POSITIONS: Readonly<Record<string, { key: string; labels: Record<Language, string> }>> = {
  harvest: { key: 'harvest_worker', labels: { tr: 'Hasat işçisi', en: 'Harvest worker', sq: 'Punëtor korrjeje', ar: 'عامل حصاد', mk: 'Жетвар' } },
  greenhouse: { key: 'greenhouse_supervisor', labels: { tr: 'Sera sorumlusu', en: 'Greenhouse lead', sq: 'Përgjegjës sere', ar: 'مسؤول البيوت المحمية', mk: 'Одговорен за оранжерии' } },
  pruning: { key: 'pruning_worker', labels: { tr: 'Budama uzmanı', en: 'Pruning specialist', sq: 'Specialist krasitjeje', ar: 'أخصائي تقليم', mk: 'Специјалист за кроење' } },
  tractor: { key: 'tractor_operator', labels: { tr: 'Traktör operatörü', en: 'Tractor operator', sq: 'Operator traktori', ar: 'مشغّل جرار', mk: 'Оператор на трактор' } },
  mushroom: { key: 'mushroom_grower', labels: { tr: 'Mantar yetiştirme uzmanı', en: 'Mushroom growing specialist', sq: 'Specialist i kultivimit të kërpudhave', ar: 'أخصائي زراعة الفطر', mk: 'Специјалист за одгледување печурки' } },
  packing: { key: 'packing_worker', labels: { tr: 'Paketleme elemanı', en: 'Packing worker', sq: 'Punëtor paketimi', ar: 'عامل تعبئة', mk: 'Пакувач' } },
  formwork: { key: 'carpenter', labels: { tr: 'Kalıp ustası', en: 'Formwork carpenter', sq: 'Usta kallëpi', ar: 'نجار قوالب', mk: 'Опажувач' } },
  rebar: { key: 'steel_fixer', labels: { tr: 'Demirci', en: 'Rebar worker', sq: 'Hekurkthyes', ar: 'حداد تسليح', mk: 'Арматурист' } },
  masonry: { key: 'mason', labels: { tr: 'Duvarcı / sıvacı', en: 'Mason / plasterer', sq: 'Murator / suvatues', ar: 'بنّاء / مليس', mk: 'Ѕидар / малтерџија' } },
  welder: { key: 'welder', labels: { tr: 'Kaynakçı', en: 'Welder', sq: 'Saldues', ar: 'لحّام', mk: 'Заварувач' } },
  electrician: { key: 'electrician', labels: { tr: 'Elektrikçi', en: 'Electrician', sq: 'Elektricist', ar: 'كهربائي', mk: 'Електричар' } },
  engineer: { key: 'civil_engineer', labels: { tr: 'İnşaat mühendisi', en: 'Civil engineer', sq: 'Inxhinier ndërtimi', ar: 'مهندس مدني', mk: 'Градежен инженер' } },
  siteChief: { key: 'site_manager', labels: { tr: 'Şantiye şefi', en: 'Site manager', sq: 'Shef kantieri', ar: 'رئيس موقع', mk: 'Раководител на градилиште' } },
  warehouse: { key: 'warehouse_supervisor', labels: { tr: 'Depo sorumlusu', en: 'Warehouse lead', sq: 'Përgjegjës magazine', ar: 'مسؤول مستودع', mk: 'Одговорен за магацин' } },
  forklift: { key: 'forklift_driver', labels: { tr: 'Forklift operatörü', en: 'Forklift operator', sq: 'Operator forklifti', ar: 'مشغّل رافعة شوكية', mk: 'Оператор на вилушкар' } },
  foreignTrade: { key: 'foreign_trade_specialist', labels: { tr: 'Dış ticaret uzmanı', en: 'Foreign trade specialist', sq: 'Specialist i tregtisë së jashtme', ar: 'أخصائي تجارة خارجية', mk: 'Специјалист за надворешна трговија' } },
  logistics: { key: 'logistics_coordinator', labels: { tr: 'Lojistik sorumlusu', en: 'Logistics lead', sq: 'Përgjegjës logjistike', ar: 'مسؤول لوجستيات', mk: 'Одговорен за логистика' } },
  accounting: { key: 'bookkeeper', labels: { tr: 'Ön muhasebe', en: 'Bookkeeping', sq: 'Kontabilitet bazë', ar: 'محاسبة أولية', mk: 'Основно сметководство' } },
  sales: { key: 'sales_representative', labels: { tr: 'Satış temsilcisi', en: 'Sales representative', sq: 'Përfaqësues shitjesh', ar: 'مندوب مبيعات', mk: 'Продажен претставник' } },
};

const BY_KEY = new Map(PROFESSIONS.map((item) => [item.key, item]));
const SECTOR_BY_KEY = new Map(SECTORS.map((item) => [item.key, item]));

export function sectorKey(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

/** Sector label in the given locale; null for an unknown key. */
export function sectorLabel(value: string | null | undefined, lang: Language): string | null {
  const item = SECTOR_BY_KEY.get(sectorKey(value));
  return item?.labels[lang]?.trim() || null;
}

/** The 11 sectors as select options in the given locale. */
export function sectorOptions(lang: Language): { value: string; label: string }[] {
  return SECTORS.map((item) => ({ value: item.key, label: item.labels[lang] }));
}

export function professionByKey(value: string | null | undefined): Profession | undefined {
  const key = (value ?? '').trim();
  if (!key || key === OTHER_PROFESSION) return undefined;
  return BY_KEY.get(key);
}

export function professionsForSector(value: string | null | undefined): Profession[] {
  const code = sectorKey(value);
  if (!code) return [];
  return PROFESSIONS.filter((item) => item.sector === code);
}

export function professionInSector(value: string | null | undefined, sectorValue: string | null | undefined): boolean {
  const item = professionByKey(value);
  return Boolean(item && item.sector === sectorKey(sectorValue));
}

/** Drop a catalog choice that does not belong to the newly selected sector. Custom text is cleared too. */
export function professionForSectorChange(current: string | null | undefined, nextSector: string | null | undefined): string {
  const value = (current ?? '').trim();
  if (!value) return '';
  return professionInSector(value, nextSector) ? value : '';
}

/** Key, plus every locale label, so search can find a stored key in the active language. */
export function professionSearchBlob(value: string | null | undefined): string {
  const raw = (value ?? '').trim();
  const item = professionByKey(raw);
  if (!item) return raw;
  return [item.key, ...PROFESSION_LOCALES.map((lang) => item.labels[lang])].join(' ');
}

export function professionLabel(value: string | null | undefined, lang: Language): string | null {
  const item = professionByKey(value);
  if (!item) return null;
  const label = item.labels[lang]?.trim();
  return label || null;
}

export function foldCatalogText(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR').replaceAll('ı', 'i');
}

// Keys and labels first, so a catalog label always wins over a legacy alias.
const BY_CATALOG_TEXT = new Map<string, Profession>();
function remember(alias: string, item: Profession) {
  const key = foldCatalogText(alias);
  if (!key || BY_CATALOG_TEXT.has(key)) return;
  BY_CATALOG_TEXT.set(key, item);
}
for (const item of PROFESSIONS) {
  remember(item.key, item);
  remember(item.key.replaceAll('_', ' '), item);
  remember(item.key.replaceAll('_', '-'), item);
  for (const lang of PROFESSION_LOCALES) remember(item.labels[lang], item);
}
for (const legacy of Object.values(LEGACY_POSITIONS)) {
  const item = BY_KEY.get(legacy.key);
  if (!item) continue;
  for (const lang of PROFESSION_LOCALES) remember(legacy.labels[lang], item);
}

/** Key, any locale label, or an old request-form label, so stored text can be shown in the active language. */
export function professionFromCatalogText(value: string | null | undefined): Profession | undefined {
  const raw = (value ?? '').trim();
  if (!raw || raw === OTHER_PROFESSION) return undefined;
  return BY_CATALOG_TEXT.get(foldCatalogText(raw));
}

/** Split a stored request title into its comma-separated parts. */
export function catalogTitleParts(value: string | null | undefined): string[] {
  return (value ?? '').split(/\s*,\s*/).map((part) => part.trim()).filter(Boolean);
}

/** Catalog keys found in a stored request title (codes, labels or old labels). */
export function catalogTitleKeys(value: string | null | undefined): string[] {
  const keys: string[] = [];
  for (const part of catalogTitleParts(value)) {
    const key = professionFromCatalogText(part)?.key;
    if (key && !keys.includes(key)) keys.push(key);
  }
  return keys;
}

/**
 * Localize each comma-separated part that matches the profession catalog:
 * a key (site_foreman), a label in any locale, or an old request-form label.
 * Free text that does not match stays as entered.
 */
export function localizeCatalogTitle(value: string | null | undefined, lang: Language): string {
  return catalogTitleParts(value)
    .map((part) => professionFromCatalogText(part)?.labels[lang]?.trim() || part)
    .join(', ');
}
