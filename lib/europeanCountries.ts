import type { Language } from '@/lib/dictionary';

/**
 * European countries for registration dropdowns.
 *
 * Scope: UN M49 geographical Europe (sovereign states), plus EU member
 * Cyprus, plus Turkey, plus Kosovo (Balkans; already selectable). Dependent
 * territories are omitted.
 *
 * `value` is the English short name written to employers.country. That column
 * is free text and existing rows use these names ("North Macedonia", "Turkey"),
 * not ISO codes. `code` is ISO 3166-1 alpha-2 (XK is the de facto code for
 * Kosovo). Labels come from `names` for tr / en / sq / ar.
 * `dial` is the ITU-T E.164 calling code shown on the employer phone field.
 */
export type EuropeanCountry = {
  code: string;
  value: string;
  dial: string;
  names: Record<Language, string>;
};

export const EUROPEAN_COUNTRIES: readonly EuropeanCountry[] = [
  { code: 'AL', dial: '+355', value: 'Albania', names: { en: 'Albania', tr: 'Arnavutluk', sq: 'Shqipëria', ar: 'ألبانيا' } },
  { code: 'AD', dial: '+376', value: 'Andorra', names: { en: 'Andorra', tr: 'Andorra', sq: 'Andorra', ar: 'أندورا' } },
  { code: 'AT', dial: '+43', value: 'Austria', names: { en: 'Austria', tr: 'Avusturya', sq: 'Austria', ar: 'النمسا' } },
  { code: 'BY', dial: '+375', value: 'Belarus', names: { en: 'Belarus', tr: 'Belarus', sq: 'Bjellorusia', ar: 'بيلاروس' } },
  { code: 'BE', dial: '+32', value: 'Belgium', names: { en: 'Belgium', tr: 'Belçika', sq: 'Belgjika', ar: 'بلجيكا' } },
  { code: 'BA', dial: '+387', value: 'Bosnia and Herzegovina', names: { en: 'Bosnia and Herzegovina', tr: 'Bosna-Hersek', sq: 'Bosnja dhe Hercegovina', ar: 'البوسنة والهرسك' } },
  { code: 'BG', dial: '+359', value: 'Bulgaria', names: { en: 'Bulgaria', tr: 'Bulgaristan', sq: 'Bullgaria', ar: 'بلغاريا' } },
  { code: 'HR', dial: '+385', value: 'Croatia', names: { en: 'Croatia', tr: 'Hırvatistan', sq: 'Kroacia', ar: 'كرواتيا' } },
  { code: 'CY', dial: '+357', value: 'Cyprus', names: { en: 'Cyprus', tr: 'Kıbrıs', sq: 'Qipro', ar: 'قبرص' } },
  { code: 'CZ', dial: '+420', value: 'Czechia', names: { en: 'Czechia', tr: 'Çekya', sq: 'Çekia', ar: 'التشيك' } },
  { code: 'DK', dial: '+45', value: 'Denmark', names: { en: 'Denmark', tr: 'Danimarka', sq: 'Danimarka', ar: 'الدنمارك' } },
  { code: 'EE', dial: '+372', value: 'Estonia', names: { en: 'Estonia', tr: 'Estonya', sq: 'Estonia', ar: 'إستونيا' } },
  { code: 'FI', dial: '+358', value: 'Finland', names: { en: 'Finland', tr: 'Finlandiya', sq: 'Finlanda', ar: 'فنلندا' } },
  { code: 'FR', dial: '+33', value: 'France', names: { en: 'France', tr: 'Fransa', sq: 'Franca', ar: 'فرنسا' } },
  { code: 'DE', dial: '+49', value: 'Germany', names: { en: 'Germany', tr: 'Almanya', sq: 'Gjermania', ar: 'ألمانيا' } },
  { code: 'GR', dial: '+30', value: 'Greece', names: { en: 'Greece', tr: 'Yunanistan', sq: 'Greqia', ar: 'اليونان' } },
  { code: 'HU', dial: '+36', value: 'Hungary', names: { en: 'Hungary', tr: 'Macaristan', sq: 'Hungaria', ar: 'المجر' } },
  { code: 'IS', dial: '+354', value: 'Iceland', names: { en: 'Iceland', tr: 'İzlanda', sq: 'Islanda', ar: 'آيسلندا' } },
  { code: 'IE', dial: '+353', value: 'Ireland', names: { en: 'Ireland', tr: 'İrlanda', sq: 'Irlanda', ar: 'أيرلندا' } },
  { code: 'IT', dial: '+39', value: 'Italy', names: { en: 'Italy', tr: 'İtalya', sq: 'Italia', ar: 'إيطاليا' } },
  { code: 'XK', dial: '+383', value: 'Kosovo', names: { en: 'Kosovo', tr: 'Kosova', sq: 'Kosova', ar: 'كوسوفو' } },
  { code: 'LV', dial: '+371', value: 'Latvia', names: { en: 'Latvia', tr: 'Letonya', sq: 'Letonia', ar: 'لاتفيا' } },
  { code: 'LI', dial: '+423', value: 'Liechtenstein', names: { en: 'Liechtenstein', tr: 'Lihtenştayn', sq: 'Lihtenshtajni', ar: 'ليختنشتاين' } },
  { code: 'LT', dial: '+370', value: 'Lithuania', names: { en: 'Lithuania', tr: 'Litvanya', sq: 'Lituania', ar: 'ليتوانيا' } },
  { code: 'LU', dial: '+352', value: 'Luxembourg', names: { en: 'Luxembourg', tr: 'Lüksemburg', sq: 'Luksemburgu', ar: 'لوكسمبورغ' } },
  { code: 'MT', dial: '+356', value: 'Malta', names: { en: 'Malta', tr: 'Malta', sq: 'Malta', ar: 'مالطا' } },
  { code: 'MD', dial: '+373', value: 'Moldova', names: { en: 'Moldova', tr: 'Moldova', sq: 'Moldavia', ar: 'مولدوفا' } },
  { code: 'MC', dial: '+377', value: 'Monaco', names: { en: 'Monaco', tr: 'Monako', sq: 'Monako', ar: 'موناكو' } },
  { code: 'ME', dial: '+382', value: 'Montenegro', names: { en: 'Montenegro', tr: 'Karadağ', sq: 'Mali i Zi', ar: 'الجبل الأسود' } },
  { code: 'NL', dial: '+31', value: 'Netherlands', names: { en: 'Netherlands', tr: 'Hollanda', sq: 'Holanda', ar: 'هولندا' } },
  { code: 'MK', dial: '+389', value: 'North Macedonia', names: { en: 'North Macedonia', tr: 'Kuzey Makedonya', sq: 'Maqedonia e Veriut', ar: 'مقدونيا الشمالية' } },
  { code: 'NO', dial: '+47', value: 'Norway', names: { en: 'Norway', tr: 'Norveç', sq: 'Norvegjia', ar: 'النرويج' } },
  { code: 'PL', dial: '+48', value: 'Poland', names: { en: 'Poland', tr: 'Polonya', sq: 'Polonia', ar: 'بولندا' } },
  { code: 'PT', dial: '+351', value: 'Portugal', names: { en: 'Portugal', tr: 'Portekiz', sq: 'Portugalia', ar: 'البرتغال' } },
  { code: 'RO', dial: '+40', value: 'Romania', names: { en: 'Romania', tr: 'Romanya', sq: 'Rumania', ar: 'رومانيا' } },
  { code: 'RU', dial: '+7', value: 'Russia', names: { en: 'Russia', tr: 'Rusya', sq: 'Rusia', ar: 'روسيا' } },
  { code: 'SM', dial: '+378', value: 'San Marino', names: { en: 'San Marino', tr: 'San Marino', sq: 'San Marino', ar: 'سان مارينو' } },
  { code: 'RS', dial: '+381', value: 'Serbia', names: { en: 'Serbia', tr: 'Sırbistan', sq: 'Serbia', ar: 'صربيا' } },
  { code: 'SK', dial: '+421', value: 'Slovakia', names: { en: 'Slovakia', tr: 'Slovakya', sq: 'Sllovakia', ar: 'سلوفاكيا' } },
  { code: 'SI', dial: '+386', value: 'Slovenia', names: { en: 'Slovenia', tr: 'Slovenya', sq: 'Sllovenia', ar: 'سلوفينيا' } },
  { code: 'ES', dial: '+34', value: 'Spain', names: { en: 'Spain', tr: 'İspanya', sq: 'Spanja', ar: 'إسبانيا' } },
  { code: 'SE', dial: '+46', value: 'Sweden', names: { en: 'Sweden', tr: 'İsveç', sq: 'Suedia', ar: 'السويد' } },
  { code: 'CH', dial: '+41', value: 'Switzerland', names: { en: 'Switzerland', tr: 'İsviçre', sq: 'Zvicra', ar: 'سويسرا' } },
  { code: 'TR', dial: '+90', value: 'Turkey', names: { en: 'Turkey', tr: 'Türkiye', sq: 'Turqia', ar: 'تركيا' } },
  { code: 'UA', dial: '+380', value: 'Ukraine', names: { en: 'Ukraine', tr: 'Ukrayna', sq: 'Ukraina', ar: 'أوكرانيا' } },
  { code: 'GB', dial: '+44', value: 'United Kingdom', names: { en: 'United Kingdom', tr: 'Birleşik Krallık', sq: 'Mbretëria e Bashkuar', ar: 'المملكة المتحدة' } },
  { code: 'VA', dial: '+379', value: 'Vatican City', names: { en: 'Vatican City', tr: 'Vatikan', sq: 'Vatikani', ar: 'الفاتيكان' } },
];

const LOCALE: Record<Language, string> = {
  tr: 'tr',
  en: 'en',
  sq: 'sq',
  ar: 'ar',
};

// Albanian treats these as single letters. Browser Intl data often ignores them,
// so Shqip and SQ options are ordered with this alphabet instead of localeCompare.
const ALBANIAN_DIGRAPHS = ['dh', 'gj', 'll', 'nj', 'rr', 'sh', 'th', 'xh', 'zh'] as const;
const ALBANIAN_LETTERS = [
  'a', 'b', 'c', 'ç', 'd', 'dh', 'e', 'ë', 'f', 'g', 'gj', 'h', 'i', 'j', 'k', 'l', 'll',
  'm', 'n', 'nj', 'o', 'p', 'q', 'r', 'rr', 's', 'sh', 't', 'th', 'u', 'v', 'x', 'xh', 'y', 'z', 'zh',
];
const ALBANIAN_RANK = new Map(ALBANIAN_LETTERS.map((letter, index) => [letter, index]));

function albanianTokens(label: string): string[] {
  const compact = label.toLocaleLowerCase('sq').replace(/[^a-zçë]+/g, '');
  const tokens: string[] = [];
  for (let i = 0; i < compact.length; i += 1) {
    const pair = compact.slice(i, i + 2);
    if ((ALBANIAN_DIGRAPHS as readonly string[]).includes(pair)) {
      tokens.push(pair);
      i += 1;
    } else {
      tokens.push(compact[i]);
    }
  }
  return tokens;
}

function compareAlbanian(a: string, b: string): number {
  const left = albanianTokens(a);
  const right = albanianTokens(b);
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    if (left[i] === undefined) return -1;
    if (right[i] === undefined) return 1;
    const rankA = ALBANIAN_RANK.get(left[i]) ?? left[i].codePointAt(0)! + ALBANIAN_LETTERS.length;
    const rankB = ALBANIAN_RANK.get(right[i]) ?? right[i].codePointAt(0)! + ALBANIAN_LETTERS.length;
    if (rankA !== rankB) return rankA - rankB;
  }
  return 0;
}

export function toLanguage(lang: string | null | undefined): Language {
  if (lang === 'tr' || lang === 'en' || lang === 'sq' || lang === 'ar') return lang;
  return 'en';
}

export type EuropeanCountryOption = {
  code: string;
  value: string;
  label: string;
};

const DIALS_LONGEST_FIRST = [...new Set(EUROPEAN_COUNTRIES.map((country) => country.dial))]
  .sort((a, b) => b.length - a.length);

/** Calling code for an employers.country value, or '' when the name is unknown. */
export function dialCodeForCountry(value: string | null | undefined): string {
  if (!value) return '';
  return EUROPEAN_COUNTRIES.find((country) => country.value === value)?.dial ?? '';
}

/** Digits the user typed after a calling code. A bare prefix counts as empty. */
export function nationalPhoneNumber(raw: string): string {
  let value = raw.trim();
  // A paste can leave the selected code twice ("+90 +90 555…"). Peel each leading code off.
  while (value.startsWith('+')) {
    const match = DIALS_LONGEST_FIRST.find((code) => value === code || value.startsWith(code));
    if (match) {
      value = value.slice(match.length).trim();
      continue;
    }
    value = value.replace(/^\+\d+/, '').trim();
  }
  return value;
}

/**
 * Keep the selected country's calling code in the phone field.
 * A number already typed is preserved; only the prefix changes.
 */
export function phoneWithCountryDial(phone: string, countryValue: string): string {
  const dial = dialCodeForCountry(countryValue);
  if (!dial) return phone;
  const national = nationalPhoneNumber(phone);
  return national ? `${dial} ${national}` : dial;
}

/** Value stored for the employer. A calling code with no subscriber number is omitted. */
export function phoneForStorage(phone: string, countryValue: string): string {
  const formatted = phoneWithCountryDial(phone, countryValue);
  const dial = dialCodeForCountry(countryValue);
  if (!formatted || formatted === dial) return '';
  return formatted;
}

/** Country options sorted by the active locale's display name. */
export function europeanCountryOptions(lang: Language): EuropeanCountryOption[] {
  const locale = LOCALE[lang];
  return EUROPEAN_COUNTRIES.map((country) => ({
    code: country.code,
    value: country.value,
    label: country.names[lang],
  })).sort((a, b) => (
    lang === 'sq'
      ? compareAlbanian(a.label, b.label)
      : a.label.localeCompare(b.label, locale, { sensitivity: 'base' })
  ));
}
