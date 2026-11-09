import type { Language } from './dictionary';
import { EUROPEAN_COUNTRIES, europeanCountryOptions, type EuropeanCountry } from './europeanCountries';

/**
 * Candidate nationality uses the European registration list plus the source
 * countries already stored on candidates (Bangladesh, Uzbekistan).
 * `value` stays the English name, matching employers.country.
 */
export const SOURCE_COUNTRIES: readonly EuropeanCountry[] = [
  {
    code: 'BD',
    dial: '+880',
    value: 'Bangladesh',
    names: { en: 'Bangladesh', tr: 'Bangladeş', sq: 'Bangladeshi', ar: 'بنغلاديش', mk: 'Бангладеш' },
  },
  {
    code: 'UZ',
    dial: '+998',
    value: 'Uzbekistan',
    names: { en: 'Uzbekistan', tr: 'Özbekistan', sq: 'Uzbekistani', ar: 'أوزبكستان', mk: 'Узбекистан' },
  },
];

export function registrationCountries(): readonly EuropeanCountry[] {
  return [...EUROPEAN_COUNTRIES, ...SOURCE_COUNTRIES];
}

function fold(value: string): string {
  return value.trim().toLocaleLowerCase('tr-TR').replaceAll('ı', 'i');
}

const BY_NAME = new Map<string, EuropeanCountry>();
for (const country of registrationCountries()) {
  BY_NAME.set(fold(country.value), country);
  BY_NAME.set(fold(country.code), country);
  for (const name of Object.values(country.names)) BY_NAME.set(fold(name), country);
}

/** English country value, or null when the text is blank or not on the list. */
export function canonicalNationality(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  return BY_NAME.get(fold(raw))?.value ?? null;
}

export function sameNationality(stored: string | null | undefined, selected: string): boolean {
  if (selected === 'all') return true;
  const left = canonicalNationality(stored);
  const right = canonicalNationality(selected);
  if (left && right) return left === right;
  return fold(stored || '') === fold(selected);
}

export function registrationCountryOptions(lang: Language): { code: string; value: string; label: string }[] {
  const extra = SOURCE_COUNTRIES.map((country) => ({
    code: country.code,
    value: country.value,
    label: country.names[lang],
  }));
  const locale = lang === 'sq' ? 'sq' : lang;
  return [...europeanCountryOptions(lang), ...extra].sort((a, b) => (
    a.label.localeCompare(b.label, locale, { sensitivity: 'base' })
  ));
}
