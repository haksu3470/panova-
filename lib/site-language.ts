'use client';

import { useEffect, useState } from 'react';
import type { Language } from '@/lib/dictionary';

const STORAGE_KEYS = ['panova_lang', 'panova_portal_lang', 'panova_candidate_lang', 'panova_employer_lang'] as const;

/** Same-tab listeners. The native storage event only fires in other documents. */
export const LANGUAGE_EVENT = 'panova-language';

export function isLanguage(value: string | null): value is Language {
  return value === 'tr' || value === 'en' || value === 'sq' || value === 'ar';
}

/** Shared preference. Older pages stored the choice under different keys; any of them still counts. */
export function readStoredLanguage(fallback: Language = 'tr'): Language {
  if (typeof window === 'undefined') return fallback;
  for (const key of STORAGE_KEYS) {
    const value = localStorage.getItem(key);
    if (isLanguage(value)) return value;
  }
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
  }
}

export function useSiteLanguage(fallback: Language = 'tr') {
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
