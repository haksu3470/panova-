'use client';

import { useEffect, useRef, useState } from 'react';
import { ClipboardPaste } from 'lucide-react';
import { readClipboardText } from '@/lib/pasteText';

/**
 * One field for the whole code or the confirmation link.
 * Email clients cannot run a copy button, so the paste action lives here.
 */
export function VerificationCodeField({
  id,
  label,
  value,
  onChange,
  pasteLabel,
  pastedLabel,
  pasteFail,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  pasteLabel: string;
  pastedLabel: string;
  pasteFail: string;
}) {
  const field = useRef<HTMLInputElement>(null);
  const [pasteState, setPasteState] = useState<'idle' | 'pasted' | 'failed'>('idle');
  const timer = useRef<number | null>(null);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const show = (next: 'pasted' | 'failed') => {
    setPasteState(next);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setPasteState('idle'), 4000);
  };

  const paste = async () => {
    const result = await readClipboardText();
    if (!result.ok) {
      field.current?.focus();
      show('failed');
      return;
    }
    onChange(result.value.trim());
    field.current?.focus();
    show('pasted');
  };

  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
        {label}
      </label>
      <div className="mt-1 flex items-stretch gap-2">
        <input
          ref={field}
          id={id}
          name="one-time-code"
          inputMode="text"
          autoComplete="one-time-code"
          required
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setPasteState((current) => (current === 'idle' ? current : 'idle'));
          }}
          onPaste={(event) => {
            const text = event.clipboardData?.getData('text');
            if (!text) return;
            event.preventDefault();
            onChange(text.trim());
            setPasteState('idle');
          }}
          className="min-w-0 flex-1 px-3.5 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium outline-none text-sm tabular-nums tracking-wide"
        />
        <button
          type="button"
          onClick={() => void paste()}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-bold cursor-pointer hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
        >
          <ClipboardPaste className="w-4 h-4" aria-hidden="true" />
          <span className="whitespace-nowrap">{pasteLabel}</span>
        </button>
      </div>
      <p
        role="status"
        aria-live="polite"
        className={pasteState === 'failed' ? 'text-xs font-semibold text-red-700 mt-1' : 'sr-only'}
      >
        {pasteState === 'pasted' ? pastedLabel : pasteState === 'failed' ? pasteFail : ''}
      </p>
    </div>
  );
}
