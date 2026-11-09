'use client';

import { useRef, useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';
import { VerificationCodeField } from '@/components/auth/VerificationCodeField';
import { Language, translations } from '@/lib/dictionary';
import { EMAIL_OTP_LENGTH } from '@/lib/emailConfirmation';
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
  const busyRef = useRef(false);
  const autoTried = useRef('');

  const resend = async () => {
    if (cooldown || !email || busyRef.current) return;
    setBusy(true);
    setInfo('');
    const result = await resendVerification(email, redirectPath, lang);
    setBusy(false);
    setInfo(result.ok ? (t.verifyEmailResent || '') : (result.message || t.verifyEmailResendFail || ''));
    if (result.ok) {
      setCooldown(true);
      window.setTimeout(() => setCooldown(false), 30000);
    }
  };

  const submitCode = async (token: string, manual: boolean) => {
    const digits = token.replace(/\D/g, '');
    if (digits.length !== EMAIL_OTP_LENGTH) return;
    if (busyRef.current) return;
    if (!manual && autoTried.current === digits) return;
    busyRef.current = true;
    autoTried.current = digits;
    setBusy(true);
    setInfo('');
    try {
      const result = await confirmEmailCode(email, digits);
      if (!result.ok) {
        setInfo(result.reason === 'proof' ? (t.verifyEmailProofFail || '') : (t.verifyEmailCodeFail || ''));
        return;
      }
      await onVerified();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitCode(code, true);
  };

  return (
    <div className="space-y-4 text-left rtl:text-right">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1b5e20] flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">{t.verifyEmailTitle}</h2>
          <p className="text-sm font-semibold text-slate-800 mt-1 leading-relaxed">{t.verifyEmailLinkLead}</p>
        </div>
      </div>
      {email ? <p className="text-sm font-bold text-slate-900 break-all">{email}</p> : null}
      <form onSubmit={onSubmit} className="space-y-2" aria-busy={busy}>
        <VerificationCodeField
          id="email-verify-code"
          label={t.verifyEmailCodeLabel || ''}
          value={code}
          onChange={setCode}
          onComplete={(digits) => { void submitCode(digits, false); }}
          disabled={busy}
        />
        <button
          type="submit"
          disabled={busy || code.length !== EMAIL_OTP_LENGTH}
          className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm cursor-pointer"
        >
          {busy ? (t.submitting || t.verifyEmailCodeBtn) : t.verifyEmailCodeBtn}
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
      {info ? <p className="text-xs text-slate-600" role="status">{info}</p> : null}
    </div>
  );
}
