'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { AuthFooter } from '@/components/site/AuthFooter';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import { translations } from '@/lib/dictionary';
import { completePasswordReset, verifyRecoveryProof } from '@/lib/passwordResetActions';
import {
  clearRecoveryPending,
  passwordResetIssue,
  peekRecoveryError,
  recoveryPending,
  releaseRecoveryRedirect,
  rememberResetAudience,
  resetReturnPath,
  shouldOfferPasswordReset,
  storedResetEmail,
  type ResetAudience,
} from '@/lib/passwordReset';
import { useSiteLanguage } from '@/lib/site-language';
import { supabase } from '@/lib/supabase';

type Phase = 'checking' | 'link-error' | 'prove' | 'choose' | 'google' | 'saved';

export default function ResetPasswordScreen({ audience }: { audience: ResetAudience | null }) {
  const { currentLang, changeLanguage, isRtl } = useSiteLanguage('tr');
  const t = translations[currentLang] || translations.tr;
  const [phase, setPhase] = useState<Phase>('checking');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const returnPath = resetReturnPath(audience);

  const showSession = (user: User) => {
    setPhase(shouldOfferPasswordReset(user) ? 'choose' : 'google');
  };

  useEffect(() => {
    let alive = true;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive || event !== 'PASSWORD_RECOVERY' || !session) return;
      showSession(session.user);
    });
    const boot = async () => {
      if (audience) rememberResetAudience(audience);
      const storedError = peekRecoveryError();
      if (storedError) {
        releaseRecoveryRedirect();
        if (alive) setPhase('link-error');
        window.setTimeout(() => clearRecoveryPending(), 0);
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      if (!alive) return;
      if (recoveryPending() && sessionData.session) {
        showSession(sessionData.session.user);
        return;
      }
      setEmail(storedResetEmail());
      setPhase('prove');
    };
    void boot();
    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, [audience]);

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setInfo('');
    const result = await verifyRecoveryProof(email, code);
    setBusy(false);
    if (result !== 'ok') {
      setInfo(t.resetPasswordCodeFail || '');
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setInfo(t.resetPasswordCodeFail || '');
      return;
    }
    showSession(sessionData.session.user);
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    const issue = passwordResetIssue(password, confirm);
    if (issue === 'short') {
      setInfo(t.passwordTooShort || '');
      return;
    }
    if (issue === 'mismatch') {
      setInfo(t.resetPasswordMismatch || '');
      return;
    }
    setBusy(true);
    setInfo('');
    const result = await completePasswordReset(password);
    setBusy(false);
    if (result !== 'ok') {
      setInfo(t.resetPasswordFail || '');
      return;
    }
    clearRecoveryPending();
    setPhase('saved');
    window.setTimeout(() => {
      window.location.assign(returnPath);
    }, 900);
  };

  const continueWithGoogle = () => {
    clearRecoveryPending();
    window.location.assign(returnPath);
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col justify-between ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="w-full bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="PANOVA" width={1051} height={725} className="h-10 w-auto object-contain shrink-0" />
          <span className="font-extrabold text-slate-800 text-sm tracking-wide">PANOVA PORTAL</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher currentLang={currentLang} onChange={changeLanguage} />
          <Link href="/" onClick={() => clearRecoveryPending()} className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-200">
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" /> {t.returnHome}
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md w-full">
          <div className="w-14 h-14 bg-emerald-100 text-[#2e7d32] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 text-center mb-1">{t.resetPasswordTitle}</h1>
          <p className="text-slate-500 text-xs sm:text-sm text-center mb-6 leading-relaxed">
            {phase === 'checking'
              ? t.resetPasswordChecking
              : phase === 'link-error'
                ? t.resetPasswordLinkError
                : phase === 'prove'
                  ? t.resetPasswordProveLead
                  : t.resetPasswordLead}
          </p>

          {phase === 'prove' ? (
            <form onSubmit={submitCode} className="space-y-4 text-left rtl:text-right">
              <div>
                <label htmlFor="reset-email" className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.emailLabel}</label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium outline-none text-sm"
                />
              </div>
              <div>
                <label htmlFor="reset-code" className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.resetPasswordCode}</label>
                <input
                  id="reset-code"
                  required
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium outline-none text-sm"
                />
              </div>
              <button type="submit" disabled={busy} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm cursor-pointer">
                {t.resetPasswordCodeBtn}
              </button>
            </form>
          ) : null}

          {phase === 'choose' ? (
            <form onSubmit={submitPassword} className="space-y-4 text-left rtl:text-right">
              <div>
                <label htmlFor="reset-password" className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.resetPasswordNew}</label>
                <input
                  id="reset-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium outline-none text-sm"
                />
              </div>
              <div>
                <label htmlFor="reset-password-confirm" className="block text-xs font-bold text-slate-700 uppercase mb-1">{t.resetPasswordConfirm}</label>
                <input
                  id="reset-password-confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 bg-white font-medium outline-none text-sm"
                />
              </div>
              <button type="submit" disabled={busy} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm cursor-pointer">
                {t.resetPasswordSave}
              </button>
            </form>
          ) : null}

          {phase === 'google' ? (
            <div className="space-y-4 text-left rtl:text-right">
              <p className="text-sm text-slate-700 leading-relaxed">{t.resetPasswordGoogle}</p>
              <button type="button" onClick={continueWithGoogle} className="w-full bg-[#2e7d32] hover:bg-[#1b5e20] text-white font-bold py-3.5 rounded-xl text-sm cursor-pointer">
                {t.resetPasswordContinue}
              </button>
            </div>
          ) : null}

          {phase === 'saved' ? (
            <p className="text-sm font-semibold text-slate-800 text-center" role="status">{t.resetPasswordSaved}</p>
          ) : null}

          {info ? <p className="text-xs text-slate-600 mt-3" role="status">{info}</p> : null}

          {phase !== 'saved' ? (
            <Link href={returnPath} onClick={() => clearRecoveryPending()} className="block w-full text-center text-xs font-bold text-slate-500 mt-4">
              {t.verifyEmailBack}
            </Link>
          ) : null}
        </div>
      </main>
      <AuthFooter lang={currentLang} />
    </div>
  );
}
