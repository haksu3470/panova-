'use client';

import { Languages } from 'lucide-react';
import { languages, type Language } from '@/lib/dictionary';
import { homeCopy } from '@/lib/home-copy';

export function LanguageSwitcher({
  currentLang,
  onChange,
  tone = 'light',
}: {
  currentLang: Language;
  onChange: (lang: Language) => void;
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <div className={dark
      ? 'flex items-center bg-slate-900 rounded-xl px-2.5 py-2 border border-slate-600'
      : 'relative flex items-center bg-slate-100 rounded-xl px-2.5 py-2 border border-slate-200 shadow-sm'}>
      <Languages className={`w-4 h-4 mr-1.5 rtl:ml-1.5 ${dark ? 'text-slate-300' : 'text-slate-600'}`} aria-hidden />
      <select
        aria-label={homeCopy[currentLang].langLabel}
        value={currentLang}
        onChange={(e) => onChange(e.target.value as Language)}
        className={`bg-transparent text-xs sm:text-sm font-semibold focus:outline-none cursor-pointer ${dark ? 'text-slate-100' : 'text-slate-700'}`}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code} className="text-slate-900 bg-white">
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
