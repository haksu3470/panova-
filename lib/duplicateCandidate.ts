/**
 * Duplicate registration signals.
 * Supabase signUp on a confirmed email returns a user with identities: [] and sends nothing.
 * An "already registered" error is the same fact when confirmations are off.
 * The check-duplicate route may return only the three booleans below.
 */

import { passportKey, phoneKey } from './loginIdentifier';

export type DuplicateFlags = { email: boolean; passport: boolean; phone: boolean };

export type DuplicateBlock = 'email' | 'passport' | 'phone';

export type SignupUser = { identities?: unknown[] | null } | null | undefined;

export function confirmedSignupObfuscated(user: SignupUser): boolean {
  return Array.isArray(user?.identities) && user.identities.length === 0;
}

export function authErrorMeansExistingAccount(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === 'user_already_exists' || error.code === 'email_exists') return true;
  return /already registered|already exists|user already|email address has already been registered/i.test(error.message || '');
}

/** Accept only the three booleans. Any other shape is refused so a row can never leak through. */
export function duplicateFlags(value: unknown): DuplicateFlags | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  const keys = Object.keys(row);
  if (keys.length !== 3) return null;
  if (!keys.includes('email') || !keys.includes('passport') || !keys.includes('phone')) return null;
  if (typeof row.email !== 'boolean' || typeof row.passport !== 'boolean' || typeof row.phone !== 'boolean') return null;
  return { email: row.email, passport: row.passport, phone: row.phone };
}

export function registrationBlock(flags: DuplicateFlags): DuplicateBlock | null {
  if (flags.email) return 'email';
  if (flags.passport) return 'passport';
  if (flags.phone) return 'phone';
  return null;
}

export type DuplicateLookup = { email: string | null; passport: string | null; phone: string | null };

export function duplicateLookup(input: { email?: unknown; passport?: unknown; phone?: unknown }): DuplicateLookup {
  const emailRaw = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : null;
  const passport = passportKey(typeof input.passport === 'string' ? input.passport : '');
  const phone = phoneKey(typeof input.phone === 'string' ? input.phone : '');
  return { email, passport, phone };
}

export type ExistingIdentifiers = { emails: string[]; passports: string[]; phones: string[] };

/** Same folding the database uses: case-insensitive email, passport key, E.164 phone. */
export function flagsFor(input: { email?: string; passport?: string; phone?: string }, existing: ExistingIdentifiers): DuplicateFlags {
  const lookup = duplicateLookup(input);
  return {
    email: Boolean(lookup.email && existing.emails.some((email) => email.trim().toLowerCase() === lookup.email)),
    passport: Boolean(lookup.passport && existing.passports.some((passport) => passportKey(passport) === lookup.passport)),
    phone: Boolean(lookup.phone && existing.phones.some((phone) => phoneKey(phone) === lookup.phone)),
  };
}

export async function checkCandidateDuplicate(input: { email: string; passport: string; phone: string }): Promise<
  | { ok: true; flags: DuplicateFlags }
  | { ok: false }
> {
  try {
    const response = await fetch('/api/candidates/check-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: input.email,
        passport: input.passport,
        phone: input.phone,
      }),
    });
    if (!response.ok) return { ok: false };
    const flags = duplicateFlags(await response.json());
    if (!flags) return { ok: false };
    return { ok: true, flags };
  } catch {
    return { ok: false };
  }
}
