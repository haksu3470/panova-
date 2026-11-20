import type { Language } from '@/lib/dictionary';

/** Cookie set by middleware from the visitor's country (or Accept-Language). */
export const GEO_LANG_COOKIE = 'panova_geo_lang';

/** True when the value is one of the five site languages. Safe for middleware. */
export function isLanguage(value: string | null | undefined): value is Language {
  return value === 'tr' || value === 'en' || value === 'sq' || value === 'ar' || value === 'mk';
}

/**
 * ISO 3166-1 alpha-2 → one of our five site languages.
 * Countries without a matching option resolve to English.
 *
 * Flag countries in the switcher: TR, MK, AL, SA (plus XK for Albanian,
 * and common Arabic-speaking countries for `ar`).
 */
const COUNTRY_LANGUAGE: Record<string, Language> = {
  TR: 'tr',
  MK: 'mk',
  AL: 'sq',
  XK: 'sq',
  SA: 'ar',
  AE: 'ar',
  BH: 'ar',
  KW: 'ar',
  OM: 'ar',
  QA: 'ar',
  YE: 'ar',
  IQ: 'ar',
  JO: 'ar',
  LB: 'ar',
  SY: 'ar',
  EG: 'ar',
  LY: 'ar',
  TN: 'ar',
  DZ: 'ar',
  MA: 'ar',
  MR: 'ar',
  SD: 'ar',
  PS: 'ar',
  EH: 'ar',
  SO: 'ar',
  DJ: 'ar',
  KM: 'ar',
};

/** Map a request country code to a site language; unknown → English. */
export function languageFromCountry(country: string | null | undefined): Language {
  const code = String(country ?? '').trim().toUpperCase();
  if (!code || code === 'XX' || code === 'T1') return 'en';
  return COUNTRY_LANGUAGE[code] ?? 'en';
}

/**
 * First matching tag in an Accept-Language header that is one of our
 * languages, or null when none match (caller then uses English / country).
 */
export function languageFromAcceptLanguage(header: string | null | undefined): Language | null {
  if (!header) return null;
  for (const part of header.split(',')) {
    const tag = part.trim().split(';')[0]?.trim().toLowerCase();
    if (!tag) continue;
    const primary = tag.split('-')[0];
    if (isLanguage(primary)) return primary;
  }
  return null;
}

/**
 * Prefer the IP country when present; otherwise Accept-Language; else English.
 * Used by middleware to seed `panova_geo_lang`.
 */
export function suggestLanguage(input: {
  country?: string | null;
  acceptLanguage?: string | null;
}): Language {
  const country = String(input.country ?? '').trim();
  if (country && country.toUpperCase() !== 'XX' && country.toUpperCase() !== 'T1') {
    return languageFromCountry(country);
  }
  return languageFromAcceptLanguage(input.acceptLanguage) ?? 'en';
}
