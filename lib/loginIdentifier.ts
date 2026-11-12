/**
 * Candidate sign-in identifier.
 * phone_key / passport folding must match public.phone_key and
 * public.resolve_candidate_login_email.
 * A Turkish mobile without a country code (05xx…, 5xxxxxxxxx, or 90…) folds to +90.
 */

export type LoginKind = 'email' | 'phone' | 'passport';

export function phoneKey(value: string | null | undefined): string | null {
  let digits = String(value ?? '').replace(/[^0-9+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  if (/^0[1-9][0-9]{8,}$/.test(digits)) digits = `+90${digits.slice(1)}`;
  else if (/^90[0-9]{10}$/.test(digits)) digits = `+${digits}`;
  else if (/^5[0-9]{9}$/.test(digits)) digits = `+90${digits}`;
  else if (/^[1-9][0-9]{9,14}$/.test(digits)) digits = `+${digits}`;
  if (!/^\+[0-9]{10,15}$/.test(digits)) return null;
  return digits;
}

export function passportKey(value: string | null | undefined): string | null {
  const folded = String(value ?? '').replace(/\s+/g, '').toUpperCase();
  if (folded.length < 5 || folded.length > 20) return null;
  if (!/[A-Z]/.test(folded)) return null;
  if (!/^[A-Z0-9]+$/.test(folded)) return null;
  return folded;
}

export function classifyLoginIdentifier(value: string | null | undefined): { kind: LoginKind; key: string } | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (raw.includes('@')) {
    const email = raw.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return { kind: 'email', key: email };
  }
  if (/[A-Za-z]/.test(raw)) {
    const key = passportKey(raw);
    return key ? { kind: 'passport', key } : null;
  }
  const key = phoneKey(raw);
  return key ? { kind: 'phone', key } : null;
}

/** Value stored on the candidate row. Falls back to a trimmed original when it cannot fold. */
export function canonicalPhone(value: string | null | undefined): string {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  return phoneKey(trimmed) ?? trimmed;
}

/** Uppercase passport with internal spaces removed. Invalid shapes are still stored folded. */
export function canonicalPassport(value: string | null | undefined): string {
  return passportKey(value) ?? String(value ?? '').trim().replace(/\s+/g, '').toUpperCase();
}

export type LoginMatch = {
  email: string | null;
  authEmail: string | null;
  linked: boolean;
};

function mailbox(value: string | null | undefined): string | null {
  const email = String(value ?? '').trim();
  return email.includes('@') ? email : null;
}

/**
 * Mailbox password sign-in must use.
 * A linked row signs in as auth.users.email. The profile email can change on its own.
 * Two linked rows for one phone or passport are ambiguous.
 */
export function resolveLoginEmail(matches: LoginMatch[]): string | null {
  const linked = matches.filter((row) => row.linked && mailbox(row.authEmail || row.email));
  if (linked.length > 1) return null;
  if (linked.length === 1) return mailbox(linked[0].authEmail) || mailbox(linked[0].email);
  const open = matches.filter((row) => !row.linked && mailbox(row.email));
  if (open.length === 1) return mailbox(open[0].email);
  return null;
}
