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
 */
export type EuropeanCountry = {
  code: string;
  value: string;
  names: Record<Language, string>;
};

export const EUROPEAN_COUNTRIES: readonly EuropeanCountry[] = [
  { code: 'AL', value: 'Albania', names: { en: 'Albania', tr: 'Arnavutluk', sq: 'Shqipëria', ar: 'ألبانيا' } },
  { code: 'AD', value: 'Andorra', names: { en: 'Andorra', tr: 'Andorra', sq: 'Andorra', ar: 'أندورا' } },
  { code: 'AT', value: 'Austria', names: { en: 'Austria', tr: 'Avusturya', sq: 'Austria', ar: 'النمسا' } },
  { code: 'BY', value: 'Belarus', names: { en: 'Belarus', tr: 'Belarus', sq: 'Bjellorusia', ar: 'بيلاروس' } },
  { code: 'BE', value: 'Belgium', names: { en: 'Belgium', tr: 'Belçika', sq: 'Belgjika', ar: 'بلجيكا' } },
  { code: 'BA', value: 'Bosnia and Herzegovina', names: { en: 'Bosnia and Herzegovina', tr: 'Bosna-Hersek', sq: 'Bosnja dhe Hercegovina', ar: 'البوسنة والهرسك' } },
  { code: 'BG', value: 'Bulgaria', names: { en: 'Bulgaria', tr: 'Bulgaristan', sq: 'Bullgaria', ar: 'بلغاريا' } },
  { code: 'HR', value: 'Croatia', names: { en: 'Croatia', tr: 'Hırvatistan', sq: 'Kroacia', ar: 'كرواتيا' } },
  { code: 'CY', value: 'Cyprus', names: { en: 'Cyprus', tr: 'Kıbrıs', sq: 'Qipro', ar: 'قبرص' } },
  { code: 'CZ', value: 'Czechia', names: { en: 'Czechia', tr: 'Çekya', sq: 'Çekia', ar: 'التشيك' } },
  { code: 'DK', value: 'Denmark', names: { en: 'Denmark', tr: 'Danimarka', sq: 'Danimarka', ar: 'الدنمارك' } },
  { code: 'EE', value: 'Estonia', names: { en: 'Estonia', tr: 'Estonya', sq: 'Estonia', ar: 'إستونيا' } },
  { code: 'FI', value: 'Finland', names: { en: 'Finland', tr: 'Finlandiya', sq: 'Finlanda', ar: 'فنلندا' } },
  { code: 'FR', value: 'France', names: { en: 'France', tr: 'Fransa', sq: 'Franca', ar: 'فرنسا' } },
  { code: 'DE', value: 'Germany', names: { en: 'Germany', tr: 'Almanya', sq: 'Gjermania', ar: 'ألمانيا' } },
  { code: 'GR', value: 'Greece', names: { en: 'Greece', tr: 'Yunanistan', sq: 'Greqia', ar: 'اليونان' } },
  { code: 'HU', value: 'Hungary', names: { en: 'Hungary', tr: 'Macaristan', sq: 'Hungaria', ar: 'المجر' } },
  { code: 'IS', value: 'Iceland', names: { en: 'Iceland', tr: 'İzlanda', sq: 'Islanda', ar: 'آيسلندا' } },
  { code: 'IE', value: 'Ireland', names: { en: 'Ireland', tr: 'İrlanda', sq: 'Irlanda', ar: 'أيرلندا' } },
  { code: 'IT', value: 'Italy', names: { en: 'Italy', tr: 'İtalya', sq: 'Italia', ar: 'إيطاليا' } },
  { code: 'XK', value: 'Kosovo', names: { en: 'Kosovo', tr: 'Kosova', sq: 'Kosova', ar: 'كوسوفو' } },
  { code: 'LV', value: 'Latvia', names: { en: 'Latvia', tr: 'Letonya', sq: 'Letonia', ar: 'لاتفيا' } },
  { code: 'LI', value: 'Liechtenstein', names: { en: 'Liechtenstein', tr: 'Lihtenştayn', sq: 'Lihtenshtajni', ar: 'ليختنشتاين' } },
  { code: 'LT', value: 'Lithuania', names: { en: 'Lithuania', tr: 'Litvanya', sq: 'Lituania', ar: 'ليتوانيا' } },
  { code: 'LU', value: 'Luxembourg', names: { en: 'Luxembourg', tr: 'Lüksemburg', sq: 'Luksemburgu', ar: 'لوكسمبورغ' } },
  { code: 'MT', value: 'Malta', names: { en: 'Malta', tr: 'Malta', sq: 'Malta', ar: 'مالطا' } },
  { code: 'MD', value: 'Moldova', names: { en: 'Moldova', tr: 'Moldova', sq: 'Moldavia', ar: 'مولدوفا' } },
  { code: 'MC', value: 'Monaco', names: { en: 'Monaco', tr: 'Monako', sq: 'Monako', ar: 'موناكو' } },
  { code: 'ME', value: 'Montenegro', names: { en: 'Montenegro', tr: 'Karadağ', sq: 'Mali i Zi', ar: 'الجبل الأسود' } },
  { code: 'NL', value: 'Netherlands', names: { en: 'Netherlands', tr: 'Hollanda', sq: 'Holanda', ar: 'هولندا' } },
  { code: 'MK', value: 'North Macedonia', names: { en: 'North Macedonia', tr: 'Kuzey Makedonya', sq: 'Maqedonia e Veriut', ar: 'مقدونيا الشمالية' } },
  { code: 'NO', value: 'Norway', names: { en: 'Norway', tr: 'Norveç', sq: 'Norvegjia', ar: 'النرويج' } },
  { code: 'PL', value: 'Poland', names: { en: 'Poland', tr: 'Polonya', sq: 'Polonia', ar: 'بولندا' } },
  { code: 'PT', value: 'Portugal', names: { en: 'Portugal', tr: 'Portekiz', sq: 'Portugalia', ar: 'البرتغال' } },
  { code: 'RO', value: 'Romania', names: { en: 'Romania', tr: 'Romanya', sq: 'Rumania', ar: 'رومانيا' } },
  { code: 'RU', value: 'Russia', names: { en: 'Russia', tr: 'Rusya', sq: 'Rusia', ar: 'روسيا' } },
  { code: 'SM', value: 'San Marino', names: { en: 'San Marino', tr: 'San Marino', sq: 'San Marino', ar: 'سان مارينو' } },
  { code: 'RS', value: 'Serbia', names: { en: 'Serbia', tr: 'Sırbistan', sq: 'Serbia', ar: 'صربيا' } },
  { code: 'SK', value: 'Slovakia', names: { en: 'Slovakia', tr: 'Slovakya', sq: 'Sllovakia', ar: 'سلوفاكيا' } },
  { code: 'SI', value: 'Slovenia', names: { en: 'Slovenia', tr: 'Slovenya', sq: 'Sllovenia', ar: 'سلوفينيا' } },
  { code: 'ES', value: 'Spain', names: { en: 'Spain', tr: 'İspanya', sq: 'Spanja', ar: 'إسبانيا' } },
  { code: 'SE', value: 'Sweden', names: { en: 'Sweden', tr: 'İsveç', sq: 'Suedia', ar: 'السويد' } },
  { code: 'CH', value: 'Switzerland', names: { en: 'Switzerland', tr: 'İsviçre', sq: 'Zvicra', ar: 'سويسرا' } },
  { code: 'TR', value: 'Turkey', names: { en: 'Turkey', tr: 'Türkiye', sq: 'Turqia', ar: 'تركيا' } },
  { code: 'UA', value: 'Ukraine', names: { en: 'Ukraine', tr: 'Ukrayna', sq: 'Ukraina', ar: 'أوكرانيا' } },
  { code: 'GB', value: 'United Kingdom', names: { en: 'United Kingdom', tr: 'Birleşik Krallık', sq: 'Mbretëria e Bashkuar', ar: 'المملكة المتحدة' } },
  { code: 'VA', value: 'Vatican City', names: { en: 'Vatican City', tr: 'Vatikan', sq: 'Vatikani', ar: 'الفاتيكان' } },
];

const LOCALE: Record<Language, string> = {
  tr: 'tr',
  en: 'en',
  sq: 'sq',
  ar: 'ar',
};

export function toLanguage(lang: string | null | undefined): Language {
  if (lang === 'tr' || lang === 'en' || lang === 'sq' || lang === 'ar') return lang;
  return 'en';
}

export type EuropeanCountryOption = {
  code: string;
  value: string;
  label: string;
};

/** Country options sorted by the active locale's display name. */
export function europeanCountryOptions(lang: Language): EuropeanCountryOption[] {
  const locale = LOCALE[lang];
  return EUROPEAN_COUNTRIES.map((country) => ({
    code: country.code,
    value: country.value,
    label: country.names[lang],
  })).sort((a, b) => a.label.localeCompare(b.label, locale, { sensitivity: 'base' }));
}
