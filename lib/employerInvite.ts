import { EMAIL_SITE_URL } from './email/layout';

/** Matches public.country_key in supabase/migrations/20261110120000_staff_read_scope.sql. */
const COUNTRY_ALIASES: Record<string, string> = {
  turkey: 'turkey',
  türkiye: 'turkey',
  turkiye: 'turkey',
  tr: 'turkey',
  'north macedonia': 'north macedonia',
  macedonia: 'north macedonia',
  'kuzey makedonya': 'north macedonia',
  mk: 'north macedonia',
  bangladesh: 'bangladesh',
  bangladeş: 'bangladesh',
  banglades: 'bangladesh',
  bd: 'bangladesh',
};

export const EMPLOYER_INVITE_COOLDOWN_SECONDS = 120;

export const EMPLOYER_INVITE_LOCALES = ['tr', 'en', 'sq', 'ar', 'mk'] as const;
export type EmployerInviteLocale = (typeof EMPLOYER_INVITE_LOCALES)[number];

export type EmployerInviteOutcome = 'invite_new' | 'link_existing' | 'already_linked';

export type EmployerInviteErrorCode =
  | 'forbidden'
  | 'employer_email_missing'
  | 'staff_account'
  | 'email_linked_elsewhere'
  | 'account_other_role'
  | 'invite_cooldown'
  | 'not_found'
  | 'email_unavailable'
  | 'email_failed'
  | 'failed';

export function countryKey(value: string | null | undefined): string | null {
  const raw = (value ?? '').trim().toLowerCase();
  if (!raw) return null;
  return COUNTRY_ALIASES[raw] ?? raw;
}

/** Upper management, or a target-country officer whose scope is this employer's country. */
export function canInviteEmployer(input: {
  role: string | null | undefined;
  scopeCountry: string | null | undefined;
  employerCountry: string | null | undefined;
}): boolean {
  const role = (input.role || '').trim().toLowerCase();
  if (role === 'upper_management') return true;
  if (role !== 'target_country') return false;
  const scope = countryKey(input.scopeCountry);
  const country = countryKey(input.employerCountry);
  return Boolean(scope && country && scope === country);
}

export function employerInviteLocale(value: string | null | undefined): EmployerInviteLocale {
  const raw = (value ?? '').trim().toLowerCase();
  return (EMPLOYER_INVITE_LOCALES as readonly string[]).includes(raw) ? raw as EmployerInviteLocale : 'tr';
}

/** Invited employers accept KVKK on first entry when the row has no consent yet. */
export function needsEmployerConsent(row: {
  invited_at?: string | null;
  kvkk_accepted_at?: string | null;
} | null | undefined): boolean {
  if (!row?.invited_at) return false;
  return !row.kvkk_accepted_at;
}

export function siteOrigin(origin?: string): string {
  const configured = (origin ?? process.env.NEXT_PUBLIC_SITE_URL ?? EMAIL_SITE_URL).trim();
  return (configured || EMAIL_SITE_URL).replace(/\/+$/, '');
}

/** Set-password page. No query string, so the Supabase redirect allow list can match the path. */
export function employerPasswordSetupUrl(origin?: string): string {
  return `${siteOrigin(origin)}/auth/reset-password/employer`;
}

export function employerLoginUrl(origin?: string): string {
  return `${siteOrigin(origin)}/employer-login`;
}

/** Supabase action links are https URLs. Anything else is not put in the email. */
export function isSafeActionLink(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !/[\s"'<>]/.test(value);
  } catch {
    return false;
  }
}

export function parseInviteFailure(message: string | undefined, details?: string | null): {
  code: EmployerInviteErrorCode;
  retryAfterSeconds?: number;
} {
  const text = message || '';
  if (/employer_invite_forbidden|Not authenticated|Email not confirmed/i.test(text)) return { code: 'forbidden' };
  if (/employer_not_found/i.test(text)) return { code: 'not_found' };
  if (/employer_email_missing|Invalid email/i.test(text)) return { code: 'employer_email_missing' };
  if (/staff_account/i.test(text)) return { code: 'staff_account' };
  if (/email_linked_elsewhere/i.test(text)) return { code: 'email_linked_elsewhere' };
  if (/account_other_role/i.test(text)) return { code: 'account_other_role' };
  if (/invite_cooldown/i.test(text)) {
    const parsed = Number(details);
    const retryAfterSeconds = Number.isFinite(parsed) && parsed > 0
      ? Math.ceil(parsed)
      : EMPLOYER_INVITE_COOLDOWN_SECONDS;
    return { code: 'invite_cooldown', retryAfterSeconds };
  }
  return { code: 'failed' };
}
