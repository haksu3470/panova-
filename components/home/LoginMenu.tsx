'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import Link from 'next/link';
import { Building2, ChevronDown, Lock, LogIn, User } from 'lucide-react';

export type LoginMenuLabels = { label: string; candidate: string; employer: string; staff: string };

/** The three sign-in pages behind one "Giriş" button (menu button pattern). */
export const LOGIN_LINKS = [
  { key: 'candidate', href: '/candidate', Icon: User },
  { key: 'employer', href: '/employer-login', Icon: Building2 },
  { key: 'staff', href: '/portal', Icon: Lock },
] as const;

export function LoginMenu({ labels }: { labels: LoginMenuLabels }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = useId();
  const buttonId = useId();

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]') ?? []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const openAndFocus = (index: 'first' | 'last') => {
    setOpen(true);
    requestAnimationFrame(() => {
      const list = items();
      (index === 'first' ? list[0] : list[list.length - 1])?.focus();
    });
  };

  const onButtonKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openAndFocus('first');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openAndFocus('last');
    }
  };

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLUListElement>) => {
    const list = items();
    const index = list.findIndex((item) => item === document.activeElement);
    const move = (next: number) => {
      event.preventDefault();
      list[(next + list.length) % list.length]?.focus();
    };
    if (event.key === 'ArrowDown') move(index + 1);
    else if (event.key === 'ArrowUp') move(index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(list.length - 1);
    else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === 'Tab') setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={onButtonKeyDown}
        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-solid px-3.5 py-2.5 text-xs font-bold text-on-dark shadow-md transition hover:bg-brand cursor-pointer"
      >
        <LogIn aria-hidden className="h-3.5 w-3.5" /> {labels.label}
        <ChevronDown aria-hidden className={`h-3.5 w-3.5 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} />
      </button>
      <ul
        ref={menuRef}
        id={menuId}
        role="menu"
        aria-labelledby={buttonId}
        hidden={!open}
        onKeyDown={onMenuKeyDown}
        className="absolute end-0 z-50 mt-2 w-max min-w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
      >
        {LOGIN_LINKS.map(({ key, href, Icon }) => (
          <li key={key} role="none">
            <Link
              href={href}
              role="menuitem"
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
            >
              <Icon aria-hidden className="h-4 w-4 text-brand" /> {labels[key]}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
