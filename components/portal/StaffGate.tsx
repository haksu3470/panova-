'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { isStaff } from '@/lib/auth';

/** Supabase Auth oturumu + personel (is_staff) yetkisi olmadan içeriği göstermez. */
export default function StaffGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'ok' | 'noauth' | 'denied'>('loading');

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return alive && setState('noauth');
      const ok = await isStaff();
      if (alive) setState(ok ? 'ok' : 'denied');
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => check());
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  if (state === 'ok') return <>{children}</>;
  if (state === 'loading') return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Yetki kontrol ediliyor…</div>;
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white border rounded-2xl p-6 text-center space-y-3 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">{state === 'noauth' ? 'Giriş gerekli' : 'Yetkiniz yok'}</h1>
        <p className="text-xs text-slate-500">
          {state === 'noauth' ? 'Bu sayfa yalnızca Panova personeline açıktır. Lütfen personel portalından giriş yapın.' : 'Bu hesap personel olarak tanımlı değil.'}
        </p>
        <Link href="/portal" className="inline-block bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl">Personel Girişi</Link>
      </div>
    </div>
  );
}
