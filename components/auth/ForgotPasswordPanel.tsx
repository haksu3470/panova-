'use client';

import { useEffect, useState, type FormEvent } from 'react';
import OAuthButtons from '@/components/auth/OAuthButtons';
import { Language, translations } from '@/lib/dictionary';
import { homeCopy } from '@/lib/home-copy';
import { requestPasswordReset } from '@/lib/passwordResetActions';
import { resetReturnPath, type ResetAudience } from '@/lib/passwordReset';
import Link from 'next/link';
import { getRemember, setRemember } from '@/lib/remember';

export function ForgotPasswordLink({
  label,
  onClick,
  rememberLabel,
}: {
  label: string;
  onClick: () => void;
  rememberLabel?: string;
}) {
  useEffect(() => {
    // Bu sekmede giriş formu açıldı: buradan açılacak oturum bu sekmeye ait.
    setRemember(getRemember());
  }, []);
  return (
    <div className="flex items-center justify-between gap-3">
      {rememberLabel ? (
        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            ref={(el) => {
              if (el) el.checked = getRemember();
            }}
            defaultChecked
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 accent-[#2e7d32] cursor-pointer"
          />
          {rememberLabel}
        </label>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onClick}
        className="text-xs font-bold text-brand underline underline-offset-2 cursor-pointer"
      >
        {label}
      </button>
    </div>
  );
}

export default function ForgotPasswordPanel({
  lang,
  initialEmail,
  audience,
  onBack,
}: {
  lang: Language;
  initialEmail: string;
  audience: ResetAudience;
  onBack: () => void;
}) {
  const t = translations[lang] || translations.tr;
  const ui = homeCopy[lang];
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setInfo('');
    const result = await requestPasswordReset(email, audience);
    setBusy(false);
    if (result === 'failed') {
      setInfo(t.forgotPasswordFail || '');
      return;
    }
    setSent(true);
  };

  return (
    <div className="space-y-4 text-left rtl:text-right">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">{sent ? t.forgotPasswordSentTitle : t.forgotPasswordTitle}</h2>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          {sent ? t.forgotPasswordSent : t.forgotPasswordLead}
        </p>
      </div>
      {sent ? (
        <Link
          href={`/auth/reset-password/${audience}`}
          className="inline-block text-xs font-bold text-brand underline underline-offset-2"
        >
          {t.forgotPasswordHaveCode}
        </Link>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label htmlFor="forgot-password-email" className="block text-xs font-bold text-slate-700 uppercase mb-1">
              {t.emailLabel}
            </label>
            <input
              id="forgot-password-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-brand-solid hover:bg-brand disabled:bg-disabled disabled:text-on-dark disabled:opacity-100 text-white font-bold py-3.5 rounded-xl text-sm cursor-pointer"
          >
            {t.forgotPasswordSend}
          </button>
        </form>
      )}
      {info ? <p className="text-xs text-slate-600" role="status">{info}</p> : null}
      <p className="text-xs text-slate-600 leading-relaxed">{t.forgotPasswordGoogle}</p>
      <OAuthButtons redirectPath={resetReturnPath(audience)} orLabel={ui.oauthOr} googleLabel={ui.oauthGoogle} />
      <button type="button" onClick={onBack} className="w-full text-xs font-bold text-muted-foreground cursor-pointer">
        {t.verifyEmailBack}
      </button>
    </div>
  );
}
