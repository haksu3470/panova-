'use client';

import { supabase } from '@/lib/supabase';

/**
 * Google ile giriş (Supabase Auth OAuth).
 * Sağlayıcı Supabase Dashboard > Authentication > Providers altında etkinleştirilmelidir.
 */
export default function OAuthButtons({
  redirectPath,
  orLabel = 'veya',
  googleLabel = 'Google ile devam et',
}: {
  redirectPath: string;
  orLabel?: string;
  googleLabel?: string;
}) {
  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${redirectPath}` },
    });
    if (error) alert('Giriş başlatılamadı: ' + error.message);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2 text-[11px] text-slate-400 uppercase">
        <span className="flex-1 h-px bg-slate-200" />{orLabel}<span className="flex-1 h-px bg-slate-200" />
      </div>
      <button type="button" onClick={signIn} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-bold hover:bg-slate-50 transition cursor-pointer">
        {googleLabel}
      </button>
    </div>
  );
}
