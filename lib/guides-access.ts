import { isStaff } from '@/lib/auth';
import type { PortalViewer } from '@/lib/guides-model';
import { supabase } from '@/lib/supabase';

const KNOWN_STAFF_ROLES = new Set(['upper_management', 'source_country', 'target_country', 'field_officer', 'finance', 'limited']);

/**
 * Reads the signed-in portal role. Does not call link/claim RPCs, so opening
 * the guides never attaches an account that was not already linked.
 */
export async function resolvePortalViewer(userId: string): Promise<PortalViewer> {
  if (await isStaff()) {
    const { data } = await supabase.from('staff_members').select('role_level').eq('auth_user_id', userId).maybeSingle();
    const role = String(data?.role_level || '').toLowerCase();
    return {
      kind: 'staff',
      upperManagement: role === 'upper_management',
      roleId: KNOWN_STAFF_ROLES.has(role) ? role : 'staff',
    };
  }

  const [profileRes, employerRes, candidateRes] = await Promise.all([
    supabase.from('profiles').select('role, linked_employer_id, linked_candidate_id').eq('id', userId).maybeSingle(),
    supabase.from('employers').select('id').eq('auth_user_id', userId).limit(1),
    supabase.from('job_candidates').select('id').eq('auth_user_id', userId).limit(1),
  ]);

  const profile = profileRes.data;
  const employerLinked = Boolean(profile?.linked_employer_id) || (employerRes.data?.length ?? 0) > 0;
  const candidateLinked = Boolean(profile?.linked_candidate_id) || (candidateRes.data?.length ?? 0) > 0;

  if (profile?.role === 'employer' || (employerLinked && profile?.role !== 'candidate')) {
    return { kind: 'employer', upperManagement: false, roleId: 'employer' };
  }
  if (profile?.role === 'candidate' || candidateLinked) {
    return { kind: 'candidate', upperManagement: false, roleId: 'candidate' };
  }
  if (employerLinked) {
    return { kind: 'employer', upperManagement: false, roleId: 'employer' };
  }
  return { kind: 'unlinked', upperManagement: false, roleId: 'unlinked' };
}
