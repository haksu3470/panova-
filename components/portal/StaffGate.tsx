'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { isStaff, signOut } from '@/lib/auth';
import { LanguageSwitcher } from '@/components/site/LanguageSwitcher';
import { homeCopy } from '@/lib/home-copy';
import { translations } from '@/lib/dictionary';
import { useSiteLanguage } from '@/lib/site-language';
import { emailAccessOk, rememberVerifyEmail, storedVerifyEmail } from '@/lib/emailVerification';
import { loadStaffMfaSnapshot, type StaffMfaSnapshot } from '@/lib/staffMfa';
import { releaseCopy } from '@/lib/release-copy';
import StaffMfaPanel from '@/components/portal/StaffMfaPanel';
import { HeaderActions } from '@/components/site/PageHeader';

/** Supabase Auth oturumu + personel (is_staff) + MFA (gerekirse aal2) olmadan içeriği göstermez. */
export default function StaffGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'ok' | 'noauth' | 'denied' | 'verify' | 'mfa'>('loading');
  const [mfaSnap, setMfaSnap] = useState<StaffMfaSnapshot | null>(null);
  const { currentLang, changeLanguage, isRtl } = useSiteLanguage();
  const g = homeCopy[currentLang].gate;
  const t = translations[currentLang] || translations.tr;
  const mfaCopy = releaseCopy[currentLang];

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return alive && setState(storedVerifyEmail() ? 'verify' : 'noauth');
      if (!(await emailAccessOk())) {
        if (data.session.user.email) rememberVerifyEmail(data.session.user.email);
        await signOut();
        return alive && setState('verify');
      }
      const ok = await isStaff();
      if (!ok) return alive && setState('denied');
      const snap = await loadStaffMfaSnapshot(supabase);
      if (!alive) return;
      if (snap.mode === 'challenge') {
        setMfaSnap(snap);
        setState('mfa');
        return;
      }
      setMfaSnap(snap);
      setState('ok');
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (state === 'ok') return <>{children}</>;
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        {g.checking}
      </div>
    );
  }
  if (state === 'mfa' && mfaSnap) {
    return (
      <div className={`min-h-screen bg-slate-50 p-4 sm:p-8 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex justify-end">
            <HeaderActions
              lang={currentLang}
              onLanguageChange={changeLanguage}
              homeLabel={t.returnHome}
              logoutLabel={t.logoutBtn}
              onLogout={async () => {
                await signOut();
                setState('noauth');
              }}
            />
          </div>
          <StaffMfaPanel
            copy={mfaCopy}
            blocking
            required={mfaSnap.required}
            hasVerifiedFactor={mfaSnap.verified}
            onVerified={async () => {
              const snap = await loadStaffMfaSnapshot(supabase);
              setMfaSnap(snap);
              setState(snap.mode === 'challenge' ? 'mfa' : 'ok');
            }}
          />
        </div>
      </div>
    );
  }
  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-sm w-full bg-white border rounded-2xl p-6 text-center space-y-3 shadow-sm">
        <div className="flex justify-center">
          <LanguageSwitcher currentLang={currentLang} onChange={changeLanguage} />
        </div>
        <h1 className="text-lg font-bold text-slate-900">
          {state === 'verify' ? t.verifyEmailTitle : state === 'noauth' ? g.loginRequired : g.noAccess}
        </h1>
        <p className="text-xs text-muted-foreground">
          {state === 'verify' ? t.verifyEmailLinkLead : state === 'noauth' ? g.loginBody : g.noAccessBody}
        </p>
        <Link
          href={state === 'verify' ? '/portal?verify=1' : '/portal'}
          className="inline-block bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          {state === 'verify' ? t.verifyEmailBack : g.staffLogin}
        </Link>
      </div>
    </div>
  );
}
