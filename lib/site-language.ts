'use client';

import { useEffect, useState } from 'react';
import type { Language } from './dictionary';
import { GEO_LANG_COOKIE, isLanguage } from './geoLanguage';

export { isLanguage } from './geoLanguage';

const STORAGE_KEYS = ['panova_lang', 'panova_portal_lang', 'panova_candidate_lang', 'panova_employer_lang'] as const;

/** Same-tab listeners. The native storage event only fires in other documents. */
export const LANGUAGE_EVENT = 'panova-language';

/** Geo cookie written by middleware (`panova_geo_lang`). */
export function readGeoLanguage(): Language | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${GEO_LANG_COOKIE}=(tr|en|sq|ar|mk)(?:;|$)`));
  return match && isLanguage(match[1]) ? match[1] : null;
}

/**
 * Shared preference. Older pages stored the choice under different keys; any
 * of them still counts. With no stored choice, use the geo cookie from the
 * visitor's country; if that is also missing, English.
 */
export function readStoredLanguage(fallback: Language = 'en'): Language {
  if (typeof window === 'undefined') return fallback;
  for (const key of STORAGE_KEYS) {
    const value = localStorage.getItem(key);
    if (isLanguage(value)) return value;
  }
  const geo = readGeoLanguage();
  if (geo) return geo;
  return fallback;
}

export function syncDocumentLanguage(lang: Language) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

export function writeStoredLanguage(lang: Language) {
  for (const key of STORAGE_KEYS) localStorage.setItem(key, lang);
  syncDocumentLanguage(lang);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<Language>(LANGUAGE_EVENT, { detail: lang }));
    void import('./authLocale')
      .then((mod) => mod.rememberAuthLocale(lang))
      .catch(() => undefined);
  }
}

export function useSiteLanguage(fallback: Language = 'en') {
  const [currentLang, setCurrentLang] = useState<Language>(fallback);

  useEffect(() => {
    const apply = () => {
      const next = readStoredLanguage(fallback);
      setCurrentLang(next);
      syncDocumentLanguage(next);
    };
    apply();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || (STORAGE_KEYS as readonly string[]).includes(event.key)) apply();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(LANGUAGE_EVENT, apply);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LANGUAGE_EVENT, apply);
    };
  }, [fallback]);

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    writeStoredLanguage(lang);
  };

  return { currentLang, changeLanguage, isRtl: currentLang === 'ar' };
}
