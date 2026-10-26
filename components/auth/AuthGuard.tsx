'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { isStaff, linkMyEmployer, signOut } from '@/lib/auth';
import { emailAccessOk, rememberVerifyEmail } from '@/lib/emailVerification';
import { homeCopy } from '@/lib/home-copy';
import { useSiteLanguage } from '@/lib/site-language';

type Role = 'staff' | 'employer';

/**
 * Sayfayı Supabase Auth oturumuna bağlar.
 * - staff: oturum + is_staff() zorunlu, aksi halde /portal girişine yönlendirir.
 * - employer: oturum + bağlı işveren kaydı (veya personel yetkisi) zorunlu, aksi halde /employer-login.
 */
export default function AuthGuard({ role, children }: { role: Role; children: ReactNode }) {
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading');
  const { currentLang } = useSiteLanguage('tr');
  const g = homeCopy[currentLang].gate;
  const loginPath = role === 'staff' ? '/portal' : '/employer-login';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        if (!cancelled) setState('denied');
        const pending = typeof window !== 'undefined' && sessionStorage.getItem('panova_verify_email');
        window.location.replace(pending ? `${loginPath}?verify=1` : loginPath);
        return;
      }
      if (!(await emailAccessOk())) {
        if (data.session.user.email) rememberVerifyEmail(data.session.user.email);
        await signOut();
        if (!cancelled) setState('denied');
        window.location.replace(`${loginPath}?verify=1`);
        return;
      }
      // Personel, işveren dosyasını inceleyebilir (portal 'İşveren Dosyasını Aç')
      const ok = role === 'staff' ? await isStaff() : (await isStaff()) || !!(await linkMyEmployer());
      if (cancelled) return;
      if (ok) setState('ok');
      else {
        setState('denied');
        window.location.replace(loginPath);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        const pending = sessionStorage.getItem('panova_verify_email');
        window.location.replace(pending ? `${loginPath}?verify=1` : loginPath);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [role, loginPath]);

  if (state !== 'ok') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm">
        {state === 'loading' ? g.sessionChecking : g.unauthorized}
      </div>
    );
  }
  return <>{children}</>;
}
