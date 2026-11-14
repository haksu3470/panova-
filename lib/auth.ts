import { linkCandidateAccount } from '@/lib/candidateLink';
import { type CandidateLinkFailure } from '@/lib/emailConfirmation';
import { supabase } from '@/lib/supabase';

/**
 * Supabase Auth yardımcıları.
 * RLS etkin olduğundan eski "tabloda şifre karşılaştırma" girişi artık çalışmaz;
 * tüm girişler Supabase Auth oturumu üzerinden yapılır.
 */

export async function getSessionUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export async function isStaff(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_staff');
  if (error) return false;
  return data === true;
}

/**
 * Daveti bağlar veya staff_members.auth_user_id'si bu oturum olan kayıttan
 * profili role=staff yapar. Personel satırı yoksa RPC hata verir ve profil değişmez.
 */
async function syncLinkedStaff(): Promise<boolean> {
  const linked = await supabase.rpc('link_my_staff');
  if (linked.error) return false;
  return isStaff();
}

/**
 * Personel oturumu:
 * 1. syncLinkedStaff — daveti bağlar veya role'ü ezilmiş profili onarır.
 * 2. isStaff — profil zaten personel (bağlı satır yeniden yazılamasa da).
 * 3. claim_first_staff — yalnızca sistemde hiç personel yokken ilk yöneticiyi açar.
 */
export async function ensureStaff(fullName?: string): Promise<boolean> {
  if (await syncLinkedStaff()) return true;
  if (await isStaff()) return true;
  const { error } = await supabase.rpc('claim_first_staff', {
    p_full_name: fullName || 'Yönetici',
    p_staff_role: 'upper_management',
  });
  if (error) return false;
  return isStaff();
}

export type CandidateLinkResult =
  | { ok: true; id: string }
  | { ok: false; failure: CandidateLinkFailure };

/**
 * Aday portalı: auth kullanıcısını job_candidates kaydına bağlar.
 * Zaten bağlı hesapta RPC çağrılmaz (lib/candidateLink.ts); yalnızca satırı
 * olmayan hesapta link_my_candidate çalışır.
 */
export async function linkMyCandidate(): Promise<CandidateLinkResult> {
  const result = await linkCandidateAccount({
    findOwnCandidateId: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return null;
      const { data, error } = await supabase
        .from('job_candidates')
        .select('id')
        .eq('auth_user_id', uid)
        .limit(1)
        .maybeSingle();
      if (error || !data?.id) return null;
      return String(data.id);
    },
    callLinkRpc: async () => {
      const { data, error } = await supabase.rpc('link_my_candidate');
      return { data, error };
    },
  });
  return result.ok ? { ok: true, id: result.id } : result;
}

/** İşveren portalı: auth kullanıcısını employers kaydına bağlar, işveren id döner. */
export async function linkMyEmployer(): Promise<string | null> {
  const { data, error } = await supabase.rpc('link_my_employer');
  if (error) return null;
  return (data as string) ?? null;
}

export async function signOut(scope: 'global' | 'local' = 'global') {
  await supabase.auth.signOut({ scope });
  if (typeof window !== 'undefined') {
    [
      'panova_admin_auth', 'panova_current_user',
      'panova_candidate_auth', 'panova_current_candidate',
      'panova_employer_auth', 'panova_employer_user', 'panova_employer_profile',
    ].forEach((k) => localStorage.removeItem(k));
  }
}
