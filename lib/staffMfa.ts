import type { SupabaseClient } from '@supabase/supabase-js';

/** UI mode after password/OAuth session exists. */
export type StaffMfaUiMode = 'pending' | 'challenge' | 'optional' | 'done';

export type StaffMfaSnapshot = {
  mode: Exclude<StaffMfaUiMode, 'pending'>;
  required: boolean;
  verified: boolean;
  currentLevel: string | null;
};

/** Pure decision used by portal + StaffGate. */
export function staffMfaMode(input: {
  required: boolean;
  verified: boolean;
  currentLevel: string | null | undefined;
}): StaffMfaSnapshot['mode'] {
  const level = input.currentLevel ?? 'aal1';
  if (input.verified && level !== 'aal2') return 'challenge';
  if (input.required && !input.verified) return 'challenge';
  if (input.required) return 'done';
  return 'optional';
}

export async function loadStaffMfaSnapshot(
  client: SupabaseClient,
): Promise<StaffMfaSnapshot> {
  const [level, factors, required] = await Promise.all([
    client.auth.mfa.getAuthenticatorAssuranceLevel(),
    client.auth.mfa.listFactors(),
    client.rpc('staff_mfa_required'),
  ]);
  const verified = (factors.data?.totp ?? []).some((factor) => factor.status === 'verified');
  const requiredFlag = required.data === true;
  const currentLevel = level.data?.currentLevel ?? null;
  return {
    mode: staffMfaMode({
      required: requiredFlag,
      verified,
      currentLevel,
    }),
    required: requiredFlag,
    verified,
    currentLevel,
  };
}
