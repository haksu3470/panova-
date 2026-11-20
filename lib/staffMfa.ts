import type { SupabaseClient } from '@supabase/supabase-js';

/** UI mode after password/OAuth session exists. */
export type StaffMfaUiMode = 'pending' | 'challenge' | 'optional' | 'done';

export type StaffMfaSnapshot = {
  mode: Exclude<StaffMfaUiMode, 'pending'>;
  required: boolean;
  verified: boolean;
  currentLevel: string | null;
};

/**
 * Pure decision used by portal + StaffGate.
 * Challenge only when policy requires MFA. A leftover enrolled TOTP must not
 * block the portal when team and person toggles are both Off.
 */
export function staffMfaMode(input: {
  required: boolean;
  verified: boolean;
  currentLevel: string | null | undefined;
}): StaffMfaSnapshot['mode'] {
  const level = input.currentLevel ?? 'aal1';
  if (input.required && input.verified && level !== 'aal2') return 'challenge';
  if (input.required && !input.verified) return 'challenge';
  if (input.required) return 'done';
  return 'optional';
}

/** Org-wide flag OR this staff row's mfa_required. */
export function staffMfaRequiredForUser(input: {
  orgRequired: boolean;
  memberRequired: boolean;
}): boolean {
  return input.orgRequired || input.memberRequired;
}

export async function loadStaffMfaSnapshot(
  client: SupabaseClient,
): Promise<StaffMfaSnapshot> {
  const [level, factors, required] = await Promise.all([
    client.auth.mfa.getAuthenticatorAssuranceLevel(),
    client.auth.mfa.listFactors(),
    client.rpc('current_staff_mfa_required'),
  ]);
  const verified = (factors.data?.totp ?? []).some((factor) => factor.status === 'verified');
  // Fallback if migration not applied yet: org-wide RPC only.
  let requiredFlag = required.data === true;
  if (required.error) {
    const legacy = await client.rpc('staff_mfa_required');
    requiredFlag = legacy.data === true;
  }
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
