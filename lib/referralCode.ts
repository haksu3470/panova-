export const SOURCE_COUNTRY_ROLE = 'source_country';
export const FIELD_OFFICER_ROLE = 'field_officer';

/** Roles the database gives a referral code (assign_supervisor_referral_code). */
export const CODE_ISSUING_ROLES: readonly string[] = [SOURCE_COUNTRY_ROLE, FIELD_OFFICER_ROLE];

export type ReferralCodeFilter = 'all' | 'none' | (string & {});

type StaffCodeRow = {
  role_level?: string | null;
  referral_code?: string | null;
};

type CandidateCodeRow = {
  referral_code?: string | null;
};

export function isSourceCountryOfficer(role: string | null | undefined): boolean {
  return (role?.toLowerCase() ?? '') === SOURCE_COUNTRY_ROLE;
}

/** Source-country officers and field officers hold a referral code. */
export function isCodeIssuingRole(role: string | null | undefined): boolean {
  return CODE_ISSUING_ROLES.includes(role?.toLowerCase() ?? '');
}

/** Blank and whitespace-only codes are open registration. */
export function normalizeReferralCode(code: string | null | undefined): string | null {
  const trimmed = code?.trim() ?? '';
  return trimmed ? trimmed : null;
}

export function matchesReferralCodeFilter(
  code: string | null | undefined,
  filter: ReferralCodeFilter,
): boolean {
  if (filter === 'all') return true;
  const normalized = normalizeReferralCode(code);
  if (filter === 'none') return normalized === null;
  return normalized === filter;
}

/** Managers may delete only candidates that have no supervisor code. */
export function canManagerDeleteOpenCandidate(
  isManager: boolean,
  code: string | null | undefined,
): boolean {
  return isManager && normalizeReferralCode(code) === null;
}

/** Codes a manager may attach while registering: current source-country officers and field officers. */
export function supervisorReferralCodes(staff: StaffCodeRow[]): string[] {
  const codes = new Set<string>();
  for (const member of staff) {
    if (!isCodeIssuingRole(member.role_level)) continue;
    const code = normalizeReferralCode(member.referral_code);
    if (code) codes.add(code);
  }
  return [...codes].sort();
}

/** Filter options: live officer codes plus any code already stored on a candidate. */
export function referralFilterCodes(staff: StaffCodeRow[], candidates: CandidateCodeRow[]): string[] {
  const codes = new Set<string>(supervisorReferralCodes(staff));
  for (const candidate of candidates) {
    const code = normalizeReferralCode(candidate.referral_code);
    if (code) codes.add(code);
  }
  return [...codes].sort();
}
