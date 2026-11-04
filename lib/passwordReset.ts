import { parseVerificationInput } from '@/lib/emailConfirmation';
import { isGoogleProvedUser, normalizeEmail } from '@/lib/emailAddress';

/** Password accounts that can receive a recovery email. Google-only accounts have no password. */
export const RESET_AUDIENCES = ['candidate', 'employer', 'portal'] as const;
export type ResetAudience = (typeof RESET_AUDIENCES)[number];

export const MIN_PASSWORD_LENGTH = 8;

const AUDIENCE_KEY = 'panova_password_reset_audience';
const EMAIL_KEY = 'panova_password_reset_email';
export const RECOVERY_FLAG = 'panova_recovery_pending';
const RECOVERY_ERROR_KEY = 'panova_recovery_error';

export type RecoveryLocation =
  | { kind: 'implicit' }
  | { kind: 'code'; code: string }
  | { kind: 'hash'; tokenHash: string }
  | { kind: 'error'; message: string }
  | { kind: 'none' };

type IdentityUser = {
  identities?: { provider?: string | null }[] | null;
  app_metadata?: { provider?: unknown; providers?: unknown } | null;
};

export function parseResetAudience(value: string | null | undefined): ResetAudience | null {
  if (value === 'candidate' || value === 'employer' || value === 'portal') return value;
  return null;
}

/** Where the user lands after a new password is saved. Internal paths only. */
export function resetReturnPath(audience: ResetAudience | null): string {
  if (audience === 'employer') return '/employer-login';
  if (audience === 'portal') return '/portal';
  return '/candidate';
}

/**
 * Stable redirect used by resetPasswordForEmail.
 * No query string, so the Supabase allow list can match the path exactly.
 */
export function resetRedirectUrl(origin: string, audience: ResetAudience): string {
  const base = origin.replace(/\/+$/, '');
  return `${base}/auth/reset-password/${audience}`;
}

export function passwordResetIssue(password: string, confirm: string): 'short' | 'mismatch' | null {
  if (password.length < MIN_PASSWORD_LENGTH) return 'short';
  if (password !== confirm) return 'mismatch';
  return null;
}

/**
 * Google sign-in does not create a password. A linked email identity means
 * the person can still choose a new password; a Google-only account skips that.
 */
export function shouldOfferPasswordReset(user: IdentityUser | null | undefined): boolean {
  if (!user || !isGoogleProvedUser(user)) return true;
  const providers = Array.isArray(user.app_metadata?.providers) ? user.app_metadata.providers : [];
  const hasEmail = providers.includes('email') || Boolean(user.identities?.some((identity) => identity.provider === 'email'));
  if (hasEmail) return true;
  if (user.identities && user.identities.length > 0) return false;
  if (providers.length > 0) return false;
  return true;
}

export function readRecoveryLocation(href: string): RecoveryLocation {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { kind: 'none' };
  }
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
  const type = (hash.get('type') || url.searchParams.get('type') || '').toLowerCase();
  const error = hash.get('error_description') || url.searchParams.get('error_description') || hash.get('error') || url.searchParams.get('error') || '';
  if (type === 'recovery' && error) return { kind: 'error', message: error };

  const accessToken = hash.get('access_token') || '';
  const refreshToken = hash.get('refresh_token') || '';
  if (type === 'recovery' && accessToken && refreshToken) return { kind: 'implicit' };

  const tokenHash = url.searchParams.get('token_hash') || hash.get('token_hash') || '';
  if (type === 'recovery' && tokenHash) return { kind: 'hash', tokenHash };

  const code = url.searchParams.get('code') || '';
  if (code && url.pathname.startsWith('/auth/reset-password')) return { kind: 'code', code };

  if (type === 'recovery') return { kind: 'error', message: error || 'recovery' };
  return { kind: 'none' };
}

export type RecoveryProof =
  | { kind: 'hash'; tokenHash: string }
  | { kind: 'otp'; email: string; token: string }
  | { kind: 'rejected' };

/** Numeric code, or the recovery link from the email. Signup links are rejected. */
export function recoveryProofFromInput(raw: string, email: string): RecoveryProof {
  const parsed = parseVerificationInput(raw);
  if (parsed.kind === 'empty') return { kind: 'rejected' };
  if (parsed.kind === 'hash') {
    const typed = /[?&#]type=/i.test(raw);
    if (typed && parsed.types[0] !== 'recovery') return { kind: 'rejected' };
    return { kind: 'hash', tokenHash: parsed.tokenHash };
  }
  const target = normalizeEmail(email);
  if (!target.includes('@') || target.startsWith('@')) return { kind: 'rejected' };
  return { kind: 'otp', email: target, token: parsed.token };
}

export function isUnknownUserResetError(message: string | undefined): boolean {
  if (!message) return false;
  return /user not found|not registered|no user|unable to find/i.test(message);
}

export function rememberResetAudience(audience: ResetAudience) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AUDIENCE_KEY, audience);
}

export function storedResetAudience(): ResetAudience | null {
  if (typeof window === 'undefined') return null;
  return parseResetAudience(sessionStorage.getItem(AUDIENCE_KEY));
}

export function rememberResetEmail(email: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(EMAIL_KEY, normalizeEmail(email));
}

export function storedResetEmail(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(EMAIL_KEY) || '';
}

export function recoveryPending(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(RECOVERY_FLAG) === '1';
}

export function markRecoveryPending() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(RECOVERY_FLAG, '1');
}

export function clearRecoveryPending() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(RECOVERY_FLAG);
  sessionStorage.removeItem(RECOVERY_ERROR_KEY);
}

export function peekRecoveryError(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(RECOVERY_ERROR_KEY);
}

/** Stops the site-wide bounce without erasing the message the reset page still shows. */
export function releaseRecoveryRedirect() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(RECOVERY_FLAG);
}

/**
 * Call before the Supabase client reads the URL. The client strips the hash
 * during startup, and the reset page still needs to know this visit was a recovery.
 */
export function captureRecoveryFromWindow() {
  if (typeof window === 'undefined') return;
  const found = readRecoveryLocation(window.location.href);
  if (found.kind === 'implicit' || found.kind === 'hash') markRecoveryPending();
  if (found.kind === 'error') {
    markRecoveryPending();
    sessionStorage.setItem(RECOVERY_ERROR_KEY, found.message);
  }
}
