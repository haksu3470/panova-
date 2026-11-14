'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { languages, type Language } from '@/lib/dictionary';
import { homeCopy } from '@/lib/home-copy';
import { FlagIcon } from '@/components/site/FlagIcon';

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
  // Which edge of the button the list is pinned to. "end" by default; it flips
  // to "start" when the list would run past the screen edge (the switcher
  // near the left edge in Turkish, near the right edge in Arabic).
  const [align, setAlign] = useState<'end' | 'start'>('end');
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const rect = list.getBoundingClientRect();
    const margin = 8;
    if (rect.left < margin || rect.right > window.innerWidth - margin) {
      setAlign((value) => (value === 'end' ? 'start' : 'end'));
    }
    // measured once per opening; a flip re-renders without re-running this
  }, [open]);
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
        onClick={() => {
          if (!open) setAlign('end');
          setOpen((value) => !value);
        }}
        className={dark
          ? 'inline-flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs font-bold tracking-wide text-on-dark hover:bg-slate-800'
          : 'inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-2 py-1.5 text-xs font-bold tracking-wide text-foreground shadow-sm hover:bg-slate-200 sm:px-2.5 sm:py-2'}
      >
        <span aria-hidden className="inline-flex"><FlagIcon code={current.name} /></span>
        <span aria-hidden>{current.name}</span>
        <ChevronDown aria-hidden className={`h-3 w-3 shrink-0 opacity-70 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={groupLabel}
          data-align={align}
          onKeyDown={onListKeyDown}
          className={`absolute ${align === 'end' ? 'end-0' : 'start-0'} z-50 mt-1 w-max min-w-40 max-w-[calc(100vw-1rem)] rounded-xl border p-1 shadow-xl ${dark ? 'border-slate-600 bg-slate-900' : 'border-slate-200 bg-white'}`}
        >
          {languages.map((lang) => {
            const selected = lang.code === currentLang;
            return (
              <li key={lang.code} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  aria-label={lang.label}
                  autoFocus={selected}
                  onClick={() => choose(lang.code)}
                  className={selected
                    ? 'flex w-full items-center gap-2 whitespace-nowrap rounded-lg bg-emerald-700 px-2 py-1.5 text-start text-xs font-semibold text-on-dark'
                    : dark
                      ? 'flex w-full items-center gap-2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1.5 text-start text-xs font-semibold text-on-dark hover:bg-slate-800'
                      : 'flex w-full items-center gap-2 whitespace-nowrap rounded-lg bg-white px-2 py-1.5 text-start text-xs font-semibold text-foreground hover:bg-slate-100'}
                >
                  <span aria-hidden className="inline-flex"><FlagIcon code={lang.name} /></span>
                  <span aria-hidden className="w-6 shrink-0 tracking-wide">{lang.name}</span>
                  <span className="font-medium">{lang.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
