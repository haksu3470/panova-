import type { Language } from '@/lib/dictionary';
import { isLanguage } from '@/lib/site-language';
import { supabase } from '@/lib/supabase';

/**
 * Stores the site language on the signed-in account.
 * Later Auth emails read it as {{ .Data.locale }}. No session means there is nothing to update.
 */
export function rememberAuthLocale(lang: Language): void {
  if (typeof window === 'undefined' || !isLanguage(lang)) return;
  void supabase.auth.getSession().then(({ data }) => {
    if (!data.session) return;
    return supabase.auth.updateUser({ data: { locale: lang } });
  }).catch(() => undefined);
}
