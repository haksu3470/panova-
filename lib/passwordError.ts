/**
 * Why a password could not be set or changed, from a Supabase Auth error.
 * Only the kind leaves this module: the raw error text is never shown to the
 * user, and the password itself is never read here.
 */
export type PasswordErrorKind = 'same_password' | 'weak_password' | 'session_expired' | 'rate_limited' | 'unknown';

export type PasswordErrorLike = {
  code?: unknown;
  status?: unknown;
  message?: unknown;
} | null | undefined;

const BY_CODE: Record<string, PasswordErrorKind> = {
  same_password: 'same_password',
  weak_password: 'weak_password',
  session_not_found: 'session_expired',
  refresh_token_not_found: 'session_expired',
  not_authenticated: 'session_expired',
  over_request_rate_limit: 'rate_limited',
};

/** Error codes first, then the HTTP status, then a few known message texts. */
export function passwordErrorKind(error: PasswordErrorLike): PasswordErrorKind {
  if (!error) return 'unknown';
  const code = typeof error.code === 'string' ? error.code.trim().toLowerCase() : '';
  if (code && Object.prototype.hasOwnProperty.call(BY_CODE, code)) return BY_CODE[code];

  const status = typeof error.status === 'number' ? error.status : Number(error.status);
  if (status === 401) return 'session_expired';
  if (status === 429) return 'rate_limited';

  // Older Auth servers send no code; match the stable message texts.
  const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  if (message.includes('different from the old password')) return 'same_password';
  if (message.includes('auth session missing') || message.includes('session not found')) return 'session_expired';
  if (message.includes('rate limit')) return 'rate_limited';
  if (message.includes('password should') || message.includes('weak password')) return 'weak_password';
  return 'unknown';
}

/** Dictionary key for each kind. unknown keeps the existing general message. */
export const PASSWORD_ERROR_MESSAGE_KEY = {
  same_password: 'passwordSameAsOld',
  weak_password: 'passwordWeak',
  session_expired: 'passwordSessionExpired',
  rate_limited: 'passwordRateLimited',
  unknown: 'resetPasswordFail',
} as const satisfies Record<PasswordErrorKind, string>;

type PasswordMessages = Partial<Record<(typeof PASSWORD_ERROR_MESSAGE_KEY)[PasswordErrorKind], string>>;

/** The user-facing text for a kind, falling back to the general message. */
export function passwordErrorMessage(kind: PasswordErrorKind, t: PasswordMessages): string {
  return t[PASSWORD_ERROR_MESSAGE_KEY[kind]] || t.resetPasswordFail || '';
}
