/**
 * Candidate sign-in identifier.
 * Keep phone_key / passport folding in sync with public.phone_key and
 * public.resolve_candidate_login_email in the staff-scope migration.
 */

export type LoginKind = 'email' | 'phone' | 'passport';

export function phoneKey(value: string | null | undefined): string | null {
  let digits = String(value ?? '').replace(/[^0-9+]/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  if (/^0[1-9][0-9]{8,}$/.test(digits)) digits = `+90${digits.slice(1)}`;
  else if (/^90[0-9]{10}$/.test(digits)) digits = `+${digits}`;
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
