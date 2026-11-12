import type { Language } from './dictionary';

/**
 * Stable profession keys stored on job_candidates.profession.
 * Free text is still stored when the person picks Other.
 * Sector keys match the registration and staff forms, plus care
 * (health and care is already a placement sector on the public site).
 */

export const PROFESSION_LOCALES: readonly Language[] = ['tr', 'en', 'mk', 'sq', 'ar'];

/** Select value for "Other (please specify)". Never written to the database. */
export const OTHER_PROFESSION = '__other__';

export type Profession = {
  key: string;
  sector: string;
  labels: Record<Language, string>;
};

function job(key: string, sector: string, labels: Record<Language, string>): Profession {
  return { key, sector, labels };
}

export const PROFESSIONS: readonly Profession[] = [
  job('electrician', 'construction', {
    tr: 'Elektrikçi', en: 'Electrician', mk: 'Електричар', sq: 'Elektricist', ar: 'كهربائي',
  }),
  job('plumber', 'construction', {
    tr: 'Tesisatçı', en: 'Plumber', mk: 'Водоинсталатер', sq: 'Hidraulik', ar: 'سبّاك',
  }),
  job('welder', 'construction', {
    tr: 'Kaynakçı', en: 'Welder', mk: 'Заварувач', sq: 'Saldues', ar: 'لحّام',
  }),
  job('mason', 'construction', {
    tr: 'Duvarcı', en: 'Mason', mk: 'Ѕидар', sq: 'Murator', ar: 'بنّاء',
  }),
  job('carpenter', 'construction', {
    tr: 'Kalıpçı / marangoz', en: 'Carpenter / formwork', mk: 'Опажувач / столар', sq: 'Marangoz / kallëp', ar: 'نجار قوالب',
  }),
  job('steel_fixer', 'construction', {
    tr: 'Demirci', en: 'Steel fixer', mk: 'Арматурист', sq: 'Hekurkthyes', ar: 'حدّاد تسليح',
  }),
  job('painter', 'construction', {
    tr: 'Boyacı', en: 'Painter', mk: 'Молер', sq: 'Lyerës', ar: 'دهّان',
  }),
  job('tiler', 'construction', {
    tr: 'Fayansçı', en: 'Tiler', mk: 'Плочкар', sq: 'Pllakaxhi', ar: 'مبلّط',
  }),
  job('plasterer', 'construction', {
    tr: 'Sıvacı', en: 'Plasterer', mk: 'Малтерџија', sq: 'Suvatues', ar: 'مليس',
  }),
  job('scaffolder', 'construction', {
    tr: 'İskeleci', en: 'Scaffolder', mk: 'Скелар', sq: 'Montues skelash', ar: 'عامل سقالات',
  }),
  job('heavy_equipment_operator', 'construction', {
    tr: 'İş makinesi operatörü', en: 'Heavy equipment operator', mk: 'Оператор на градежна механизација', sq: 'Operator i makinerisë së rëndë', ar: 'مشغّل معدات ثقيلة',
  }),
  job('crane_operator', 'construction', {
    tr: 'Vinç operatörü', en: 'Crane operator', mk: 'Оператор на кран', sq: 'Operator vinçi', ar: 'مشغّل رافعة',
  }),
  job('construction_labourer', 'construction', {
    tr: 'İnşaat işçisi', en: 'Construction labourer', mk: 'Градежен работник', sq: 'Punëtor ndërtimi', ar: 'عامل بناء',
  }),
  job('site_foreman', 'construction', {
    tr: 'Şantiye formen', en: 'Site foreman', mk: 'Шеф на градилиште', sq: 'Shef kantieri', ar: 'رئيس موقع',
  }),

  job('farm_worker', 'agriculture', {
    tr: 'Tarım işçisi', en: 'Farm worker', mk: 'Земјоделски работник', sq: 'Punëtor bujqësie', ar: 'عامل زراعي',
  }),
  job('harvest_worker', 'agriculture', {
    tr: 'Hasat işçisi', en: 'Harvest worker', mk: 'Жетвар', sq: 'Punëtor korrjeje', ar: 'عامل حصاد',
  }),
  job('greenhouse_worker', 'agriculture', {
    tr: 'Sera işçisi', en: 'Greenhouse worker', mk: 'Работник во оранжерија', sq: 'Punëtor sere', ar: 'عامل بيوت محمية',
  }),
  job('tractor_operator', 'agriculture', {
    tr: 'Traktör operatörü', en: 'Tractor operator', mk: 'Оператор на трактор', sq: 'Operator traktori', ar: 'مشغّل جرار',
  }),
  job('livestock_worker', 'agriculture', {
    tr: 'Hayvancılık işçisi', en: 'Livestock worker', mk: 'Сточар', sq: 'Punëtor blegtorie', ar: 'عامل ثروة حيوانية',
  }),
  job('irrigation_worker', 'agriculture', {
    tr: 'Sulama işçisi', en: 'Irrigation worker', mk: 'Работник за наводнување', sq: 'Punëtor ujitjeje', ar: 'عامل ري',
  }),
  job('pruning_worker', 'agriculture', {
    tr: 'Budama işçisi', en: 'Pruning worker', mk: 'Работник за кроење', sq: 'Punëtor krasitjeje', ar: 'عامل تقليم',
  }),
  job('packing_worker', 'agriculture', {
    tr: 'Paketleme elemanı', en: 'Packing worker', mk: 'Пакувач', sq: 'Punëtor paketimi', ar: 'عامل تعبئة',
  }),

  job('cook', 'hospitality', {
    tr: 'Aşçı', en: 'Cook', mk: 'Готвач', sq: 'Kuzhinier', ar: 'طبّاخ',
  }),
  job('kitchen_helper', 'hospitality', {
    tr: 'Mutfak yardımcısı', en: 'Kitchen helper', mk: 'Помошник во кујна', sq: 'Ndihmës kuzhine', ar: 'مساعد مطبخ',
  }),
  job('waiter', 'hospitality', {
    tr: 'Garson', en: 'Waiter', mk: 'Келнер', sq: 'Kamarier', ar: 'نادل',
  }),
  job('housekeeper', 'hospitality', {
    tr: 'Kat görevlisi', en: 'Housekeeper', mk: 'Собарица', sq: 'Pastruese katësh', ar: 'عامل نظافة غرف',
  }),
  job('dishwasher', 'hospitality', {
    tr: 'Bulaşıkçı', en: 'Dishwasher', mk: 'Мијач на садови', sq: 'Larës enësh', ar: 'غاسل أطباق',
  }),
  job('baker', 'hospitality', {
    tr: 'Fırıncı', en: 'Baker', mk: 'Пекар', sq: 'Furrtar', ar: 'خبّاز',
  }),

  job('machine_operator', 'manufacturing', {
    tr: 'Makine operatörü', en: 'Machine operator', mk: 'Оператор на машина', sq: 'Operator makinerie', ar: 'مشغّل آلة',
  }),
  job('sewing_operator', 'manufacturing', {
    tr: 'Dikiş operatörü', en: 'Sewing operator', mk: 'Оператор на шиење', sq: 'Operator qepjeje', ar: 'مشغّل خياطة',
  }),
  job('cnc_operator', 'manufacturing', {
    tr: 'CNC operatörü', en: 'CNC operator', mk: 'ЦНЦ оператор', sq: 'Operator CNC', ar: 'مشغّل CNC',
  }),
  job('warehouse_worker', 'manufacturing', {
    tr: 'Depo işçisi', en: 'Warehouse worker', mk: 'Магационер', sq: 'Punëtor magazine', ar: 'عامل مستودع',
  }),
  job('forklift_driver', 'manufacturing', {
    tr: 'Forklift operatörü', en: 'Forklift driver', mk: 'Оператор на вилушкар', sq: 'Operator forklifti', ar: 'سائق رافعة شوكية',
  }),
  job('quality_inspector', 'manufacturing', {
    tr: 'Kalite kontrolcü', en: 'Quality inspector', mk: 'Контролор на квалитет', sq: 'Kontrollues cilësie', ar: 'مفتش جودة',
  }),
  job('textile_cutter', 'manufacturing', {
    tr: 'Kesimci', en: 'Textile cutter', mk: 'Кројач', sq: 'Prerës tekstili', ar: 'قصّاص أقمشة',
  }),

  job('truck_driver', 'logistics', {
    tr: 'Tır şoförü', en: 'Truck driver', mk: 'Возач на камион', sq: 'Shofer kamioni', ar: 'سائق شاحنة',
  }),
  job('delivery_driver', 'logistics', {
    tr: 'Dağıtım şoförü', en: 'Delivery driver', mk: 'Возач за достава', sq: 'Shofer shpërndarjeje', ar: 'سائق توصيل',
  }),
  job('loader', 'logistics', {
    tr: 'Yükleme işçisi', en: 'Loader', mk: 'Товарник', sq: 'Punëtor ngarkimi', ar: 'عامل تحميل',
  }),

  job('caregiver', 'care', {
    tr: 'Bakıcı', en: 'Caregiver', mk: 'Негувател', sq: 'Kujdestar', ar: 'مقدّم رعاية',
  }),
  job('elderly_caregiver', 'care', {
    tr: 'Yaşlı bakıcısı', en: 'Elderly caregiver', mk: 'Негувател на стари лица', sq: 'Kujdestar i të moshuarve', ar: 'مقدّم رعاية للمسنين',
  }),
  job('home_care_assistant', 'care', {
    tr: 'Evde bakım yardımcısı', en: 'Home care assistant', mk: 'Помошник за домашна нега', sq: 'Asistent i kujdesit në shtëpi', ar: 'مساعد رعاية منزلية',
  }),
];

const BY_KEY = new Map(PROFESSIONS.map((item) => [item.key, item]));

export function sectorKey(sector: string | null | undefined): string {
  return (sector ?? '').trim().toLowerCase();
}

export function professionByKey(value: string | null | undefined): Profession | undefined {
  const key = (value ?? '').trim();
  if (!key || key === OTHER_PROFESSION) return undefined;
  return BY_KEY.get(key);
}

export function professionsForSector(sector: string | null | undefined): Profession[] {
  const code = sectorKey(sector);
  if (!code) return [];
  return PROFESSIONS.filter((item) => item.sector === code);
}

export function professionInSector(value: string | null | undefined, sector: string | null | undefined): boolean {
  const item = professionByKey(value);
  return Boolean(item && item.sector === sectorKey(sector));
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

function foldCatalog(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR').replaceAll('ı', 'i');
}

const BY_CATALOG_TEXT = new Map<string, Profession>();
for (const item of PROFESSIONS) {
  const aliases = [item.key, item.key.replaceAll('_', ' '), item.key.replaceAll('_', '-')];
  for (const lang of PROFESSION_LOCALES) aliases.push(item.labels[lang]);
  for (const alias of aliases) {
    const key = foldCatalog(alias);
    if (!key || BY_CATALOG_TEXT.has(key)) continue;
    BY_CATALOG_TEXT.set(key, item);
  }
}

/** Key or any locale label, so a stored English title such as "Cook" can be shown in the active language. */
export function professionFromCatalogText(value: string | null | undefined): Profession | undefined {
  const raw = (value ?? '').trim();
  if (!raw || raw === OTHER_PROFESSION) return undefined;
  return BY_CATALOG_TEXT.get(foldCatalog(raw));
}

/**
 * Localize each comma-separated part that matches the profession catalog.
 * Free text that does not match stays as entered.
 */
export function localizeCatalogTitle(value: string | null | undefined, lang: Language): string {
  const raw = (value ?? '').trim();
  if (!raw) return '';
  return raw.split(/\s*,\s*/).map((part) => {
    const trimmed = part.trim();
    if (!trimmed) return '';
    return professionFromCatalogText(trimmed)?.labels[lang]?.trim() || trimmed;
  }).filter(Boolean).join(', ');
}
