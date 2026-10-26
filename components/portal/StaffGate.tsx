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

/** Supabase Auth oturumu + personel (is_staff) yetkisi olmadan içeriği göstermez. */
export default function StaffGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'ok' | 'noauth' | 'denied' | 'verify'>('loading');
  const { currentLang, changeLanguage, isRtl } = useSiteLanguage('tr');
  const g = homeCopy[currentLang].gate;
  const t = translations[currentLang] || translations.tr;

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
      if (alive) setState(ok ? 'ok' : 'denied');
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  if (state === 'ok') return <>{children}</>;
  if (state === 'loading') return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">{g.checking}</div>;
  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-sm w-full bg-white border rounded-2xl p-6 text-center space-y-3 shadow-sm">
        <div className="flex justify-center"><LanguageSwitcher currentLang={currentLang} onChange={changeLanguage} /></div>
        <h1 className="text-lg font-bold text-slate-900">{state === 'verify' ? t.verifyEmailTitle : state === 'noauth' ? g.loginRequired : g.noAccess}</h1>
        <p className="text-xs text-slate-500">
          {state === 'verify' ? t.verifyEmailBody : state === 'noauth' ? g.loginBody : g.noAccessBody}
        </p>
        <Link href={state === 'verify' ? '/portal?verify=1' : '/portal'} className="inline-block bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl">{state === 'verify' ? t.verifyEmailBack : g.staffLogin}</Link>
      </div>
    </div>
  );
}
