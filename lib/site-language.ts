'use client';

import { useEffect, useState } from 'react';
import type { Language } from '@/lib/dictionary';

const STORAGE_KEYS = ['panova_lang', 'panova_portal_lang', 'panova_candidate_lang', 'panova_employer_lang'] as const;

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

export function writeStoredLanguage(lang: Language) {
  for (const key of STORAGE_KEYS) localStorage.setItem(key, lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

export function useSiteLanguage(fallback: Language = 'tr') {
  const [currentLang, setCurrentLang] = useState<Language>(fallback);

  useEffect(() => {
    const apply = () => {
      const next = readStoredLanguage(fallback);
      setCurrentLang(next);
      document.documentElement.lang = next;
      document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    };
    apply();
    const onStorage = (event: StorageEvent) => {
      if (!event.key || (STORAGE_KEYS as readonly string[]).includes(event.key)) apply();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [fallback]);

  const changeLanguage = (lang: Language) => {
    setCurrentLang(lang);
    writeStoredLanguage(lang);
  };

  return { currentLang, changeLanguage, isRtl: currentLang === 'ar' };
}
