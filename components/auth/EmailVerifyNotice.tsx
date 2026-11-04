'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Copy, Mail } from 'lucide-react';
import { copyText } from '@/lib/copyText';
import { Language, translations } from '@/lib/dictionary';
import { confirmEmailCode, resendVerification } from '@/lib/emailVerification';

export default function EmailVerifyNotice({
  email,
  lang,
  redirectPath,
  onVerified,
}: {
  email: string;
  lang: Language;
  redirectPath: string;
  onVerified: () => Promise<void> | void;
}) {
  const t = translations[lang] || translations.tr;
  const [code, setCode] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const codeField = useRef<HTMLInputElement>(null);
  const copyTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
  }, []);

  const showCopyState = (next: 'copied' | 'failed') => {
    setCopyState(next);
    if (copyTimer.current) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyState('idle'), 4000);
  };

  const copyCode = async () => {
    const value = code;
    if (!value.trim()) return;
    const ok = await copyText(value);
    if (!ok) {
      const field = codeField.current;
      field?.focus();
      field?.select();
    }
    showCopyState(ok ? 'copied' : 'failed');
  };

  const resend = async () => {
    if (cooldown || !email) return;
    setBusy(true);
    setInfo('');
    const result = await resendVerification(email, redirectPath);
    setBusy(false);
    setInfo(result.ok ? (t.verifyEmailResent || '') : (result.message || t.verifyEmailResendFail || ''));
    if (result.ok) {
      setCooldown(true);
      window.setTimeout(() => setCooldown(false), 30000);
    }
  };

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setInfo('');
    const result = await confirmEmailCode(email, code);
    setBusy(false);
    if (!result.ok) {
      setInfo(result.reason === 'proof' ? (t.verifyEmailProofFail || '') : (t.verifyEmailCodeFail || ''));
      return;
    }
    await onVerified();
  };

  return (
    <div className="space-y-4 text-left rtl:text-right">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1b5e20] flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">{t.verifyEmailTitle}</h2>
          <p className="text-sm font-semibold text-slate-800 mt-1 leading-relaxed">{t.verifyEmailLinkLead}</p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{t.verifyEmailBody}</p>
        </div>
      </div>
      {email ? <p className="text-sm font-bold text-slate-900 break-all">{email}</p> : null}
      <form onSubmit={submitCode} className="space-y-2">
        <label htmlFor="email-verify-code" className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
          {t.verifyEmailCodeLabel}
        </label>
        <div className="flex items-stretch gap-2">
          <input
            ref={codeField}
            id="email-verify-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              if (copyTimer.current) {
                window.clearTimeout(copyTimer.current);
                copyTimer.current = null;
              }
              setCopyState((current) => (current === 'idle' ? current : 'idle'));
            }}
            className="min-w-0 flex-1 px-3.5 py-3 rounded-xl border border-slate-300 text-slate-900 bg-white font-medium outline-none text-sm tabular-nums tracking-wide"
          />
          <button
            type="button"
            onClick={() => void copyCode()}
            disabled={!code.trim()}
            aria-label={copyState === 'copied' ? (t.verifyEmailCopied || 'Copied') : (t.verifyEmailCopy || 'Copy')}
            className={`shrink-0 inline-flex items-center justify-center gap-1.5 min-h-11 px-3 rounded-xl border text-sm font-bold cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              copyState === 'copied'
                ? 'border-emerald-300 bg-emerald-50 text-[#1b5e20]'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            {copyState === 'copied' ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            <span className="whitespace-nowrap">{copyState === 'copied' ? (t.verifyEmailCopied || 'Copied') : (t.verifyEmailCopy || 'Copy')}</span>
          </button>
        </div>
        <p
          role="status"
          aria-live="polite"
          className={copyState === 'failed' ? 'text-xs font-semibold text-red-700' : 'sr-only'}
        >
          {copyState === 'copied' ? (t.verifyEmailCopied || '') : copyState === 'failed' ? (t.verifyEmailCopyFail || '') : ''}
        </p>
        <button
          type="submit"
          disabled={busy || !code.trim()}
          className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm cursor-pointer"
        >
          {t.verifyEmailCodeBtn}
        </button>
      </form>
      <button
        type="button"
        onClick={resend}
        disabled={busy || cooldown || !email}
        className="w-full border border-slate-300 text-slate-800 font-bold py-3 rounded-xl text-sm cursor-pointer disabled:opacity-60"
      >
        {t.verifyEmailResend}
      </button>
      {info ? <p className="text-xs text-slate-600">{info}</p> : null}
    </div>
  );
}
