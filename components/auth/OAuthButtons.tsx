'use client';

import { supabase } from '@/lib/supabase';

/**
 * Google / Apple ile giriş (Supabase Auth OAuth).
 * Not: Sağlayıcılar Supabase Dashboard > Authentication > Providers altında etkinleştirilmelidir.
 */
export default function OAuthButtons({ redirectPath }: { redirectPath: string }) {
  const signIn = async (provider: 'google' | 'apple') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${redirectPath}` },
    });
    if (error) alert('Giriş başlatılamadı: ' + error.message);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center gap-2 text-[11px] text-slate-400 uppercase">
        <span className="flex-1 h-px bg-slate-200" />veya<span className="flex-1 h-px bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button type="button" onClick={() => signIn('google')} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-bold hover:bg-slate-50 transition cursor-pointer">
          Google ile devam et
        </button>
        <button type="button" onClick={() => signIn('apple')} className="w-full px-4 py-3 rounded-xl bg-black text-white text-sm font-bold hover:bg-slate-800 transition cursor-pointer">
           Apple ile devam et
        </button>
      </div>
    </div>
  );
}
