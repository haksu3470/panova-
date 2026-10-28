/** Pure helpers for the password-signup confirmation screen. */

export type OtpType = 'signup' | 'email' | 'magiclink' | 'invite' | 'recovery';

export type VerificationInput =
  | { kind: 'empty' }
  | { kind: 'otp'; token: string }
  | { kind: 'hash'; tokenHash: string; types: OtpType[] };

const OTP_TYPES: OtpType[] = ['signup', 'email', 'magiclink', 'invite', 'recovery'];

function asOtpType(value: string | null): OtpType | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'email_change' || normalized === 'email_change_current' || normalized === 'email_change_new') {
    return 'email';
  }
  return OTP_TYPES.includes(normalized as OtpType) ? (normalized as OtpType) : null;
}

function typeOrder(preferred: OtpType | null): OtpType[] {
  const rest: OtpType[] = preferred === 'magiclink' || preferred === 'email'
    ? ['email', 'magiclink', 'signup', 'invite']
    : ['signup', 'email', 'magiclink', 'invite'];
  if (!preferred) return rest;
  return [preferred, ...rest.filter((type) => type !== preferred)];
}

/**
 * The confirm-signup mail is a link (`/auth/v1/verify?token=…&type=signup`)
 * unless the Auth template also prints `{{ .Token }}`. Accept either shape.
 */
export function parseVerificationInput(raw: string): VerificationInput {
  const text = raw.trim();
  if (!text) return { kind: 'empty' };

  const compact = text.replace(/[\s-]/g, '');
  if (/^\d{6,10}$/.test(compact)) return { kind: 'otp', token: compact };

  const fromUrl = linkParts(text);
  if (fromUrl) return fromUrl;

  if (/^[a-f0-9]{16,}$/i.test(compact)) {
    return { kind: 'hash', tokenHash: compact, types: typeOrder('signup') };
  }

  return { kind: 'otp', token: compact };
}

function linkParts(text: string): VerificationInput | null {
  const match = text.match(/https?:\/\/[^\s<>"']+/i);
  const candidate = match ? match[0] : text;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  const token = url.searchParams.get('token') || url.searchParams.get('token_hash') || '';
  if (!token) return null;
  const preferred = asOtpType(url.searchParams.get('type'));
  return { kind: 'hash', tokenHash: token, types: typeOrder(preferred) };
}

export type CandidateLinkFailure = 'phone' | 'passport' | 'email' | 'missing' | 'unconfirmed' | 'other';

export function classifyCandidateLinkError(message: string | undefined): CandidateLinkFailure {
  const text = message || '';
  if (/phone already used/i.test(text)) return 'phone';
  if (/passport already used/i.test(text)) return 'passport';
  if (/already registered/i.test(text)) return 'email';
  if (/not confirmed/i.test(text)) return 'unconfirmed';
  if (/no unmatched candidate/i.test(text)) return 'missing';
  return 'other';
}
