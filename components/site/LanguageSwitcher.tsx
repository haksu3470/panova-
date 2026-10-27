'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';
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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const current = languages.find((lang) => lang.code === currentLang) ?? languages[0];
  const groupLabel = homeCopy[currentLang].langLabel;

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choose = (lang: Language) => {
    onChange(lang);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onListKeyDown = (event: ReactKeyboardEvent<HTMLUListElement>) => {
    const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]'));
    const index = options.findIndex((option) => option === document.activeElement);
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const next = event.key === 'ArrowDown'
        ? options[(index + 1 + options.length) % options.length]
        : options[(index - 1 + options.length) % options.length];
      next?.focus();
    }
    if (event.key === 'Home') {
      event.preventDefault();
      options[0]?.focus();
    }
    if (event.key === 'End') {
      event.preventDefault();
      options[options.length - 1]?.focus();
    }
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${groupLabel}: ${current.label}`}
        onClick={() => setOpen((value) => !value)}
        className={dark
          ? 'inline-flex items-center gap-1 rounded-xl border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs font-bold tracking-wide text-slate-100 hover:bg-slate-800'
          : 'inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 px-2 py-1.5 text-xs font-bold tracking-wide text-slate-800 shadow-sm hover:bg-slate-200 sm:px-2.5 sm:py-2'}
      >
        <span aria-hidden className="text-sm leading-none">{current.flag}</span>
        <span aria-hidden>{current.name}</span>
        <ChevronDown aria-hidden className={`h-3 w-3 opacity-70 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={groupLabel}
          onKeyDown={onListKeyDown}
          className={dark
            ? 'absolute end-0 z-50 mt-1 w-max min-w-40 rounded-xl border border-slate-600 bg-slate-900 p-1 shadow-xl'
            : 'absolute end-0 z-50 mt-1 w-max min-w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-xl'}
        >
          {languages.map((lang) => {
            const selected = lang.code === currentLang;
            return (
              <li key={lang.code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  autoFocus={selected}
                  onClick={() => choose(lang.code)}
                  className={selected
                    ? 'flex w-full items-center gap-2 rounded-lg bg-emerald-700 px-2 py-1.5 text-start text-xs font-semibold text-white'
                    : dark
                      ? 'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-xs font-semibold text-slate-100 hover:bg-slate-800'
                      : 'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start text-xs font-semibold text-slate-800 hover:bg-slate-100'}
                >
                  <span aria-hidden className="text-sm leading-none">{lang.flag}</span>
                  <span aria-hidden className="w-6 shrink-0 tracking-wide">{lang.name}</span>
                  <span className={selected ? 'text-emerald-50' : dark ? 'font-medium text-slate-300' : 'font-medium text-slate-500'}>{lang.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
