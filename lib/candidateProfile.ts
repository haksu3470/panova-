import { canonicalPassport, canonicalPhone } from './loginIdentifier';
import { canonicalNationality } from './registrationCountries';

/**
 * Registration identity for the signed-in candidate.
 * Signup stores name, passport, phone, profession, sector, and nationality
 * on the job_candidates row. Profile save must update that same row. Email is a
 * separate write: a unique collision must not discard the other fields, and
 * this path must not change the auth email (that flow re-verifies) or
 * privileged columns.
 */

export type CandidateProfileCode =
  | 'invalid'
  | 'phone'
  | 'passport'
  | 'email'
  | 'not_persisted'
  | 'write_failed';

export class CandidateProfileError extends Error {
  code: CandidateProfileCode;

  constructor(code: CandidateProfileCode, message: string) {
    super(message);
    this.name = 'CandidateProfileError';
    this.code = code;
  }
}

export type CandidateIdentityInput = {
  fullName: string;
  passport: string;
  phone: string;
  email: string;
  profession: string;
  sector: string;
  nationality: string;
};

export type CandidateIdentity = {
  full_name: string;
  passport_number: string;
  phone: string;
  email: string;
  profession: string;
  sector: string;
  nationality: string;
};

function required(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export type CandidateRegistration = Omit<CandidateIdentity, 'email'>;

/** Name, passport, phone, profession, sector, and nationality. Email is not in this write. */
export function candidateRegistrationPayload(
  input: Omit<CandidateIdentityInput, 'email'>,
): CandidateRegistration {
  const full_name = required(input.fullName);
  const passport_number = required(canonicalPassport(input.passport));
  const phone = required(canonicalPhone(input.phone));
  const profession = required(input.profession);
  const sector = required(input.sector);
  const nationality = canonicalNationality(input.nationality);
  if (!full_name || !passport_number || !phone || !profession || !sector || !nationality) {
    throw new CandidateProfileError('invalid', 'Registration fields are required');
  }
  return { full_name, passport_number, phone, profession, sector, nationality };
}

/**
 * Email change for the candidate row only.
 * Null means the address is unchanged, so the save must not touch the column.
 */
export function changedCandidateEmail(current: string | null | undefined, next: string): string | null {
  const email = required(next)?.toLowerCase() ?? null;
  if (!email || !email.includes('@')) {
    throw new CandidateProfileError('invalid', 'Registration fields are required');
  }
  const previous = required(current)?.toLowerCase() ?? '';
  return email === previous ? null : email;
}

/** Null means the photo is unchanged and must not be sent again. */
export function changedCandidatePhoto(current: string | null | undefined, next: string): string | null {
  const photo = next ?? '';
  if (photo === (current ?? '')) return null;
  return photo;
}

/** Columns a candidate may change. No id, auth link, status, or verification flags. */
export function candidateIdentityPayload(input: CandidateIdentityInput): CandidateIdentity {
  const registration = candidateRegistrationPayload(input);
  const email = changedCandidateEmail(null, input.email);
  if (!email) throw new CandidateProfileError('invalid', 'Registration fields are required');
  return { ...registration, email };
}

/**
 * Auth user metadata is only a copy used when the candidate row is first created.
 * Email is intentionally absent: changing it here would start an email-change
 * confirmation and must stay on the existing password path.
 */
export function candidateAuthMetadata(identity: CandidateIdentity): Record<string, string> {
  return {
    full_name: identity.full_name,
    passport_number: identity.passport_number,
    phone: identity.phone,
    profession: identity.profession,
    sector: identity.sector,
    nationality: identity.nationality,
  };
}

type WriteError = { code?: string; message?: string; details?: string | null } | null;

/** PostgREST returns this when the browser session was revoked and the call ran as anon. */
export function isPermissionDenied(error: unknown): boolean {
  const record = typeof error === 'object' && error ? error as { code?: string; message?: string } : {};
  const message = error instanceof Error ? error.message : (record.message || '');
  return record.code === '42501' || /permission denied for table/i.test(message);
}

function writeText(error: WriteError): string {
  return `${error?.code || ''} ${error?.message || ''} ${error?.details || ''}`;
}

/** A successful save is a returned row. Zero rows (RLS) and unique collisions are failures. */
export function assertCandidatePersisted<T extends { id: string }>(row: T | null, error: WriteError): T {
  if (error) {
    const text = writeText(error);
    if (/unique_candidate_phone|phone already used/i.test(text)) {
      throw new CandidateProfileError('phone', error.message || 'phone taken');
    }
    if (/unique_candidate_passport|passport already used/i.test(text)) {
      throw new CandidateProfileError('passport', error.message || 'passport taken');
    }
    if (/unique_candidate_email|candidate already registered/i.test(text)) {
      throw new CandidateProfileError('email', error.message || 'email taken');
    }
    throw new CandidateProfileError('write_failed', error.message || 'update failed');
  }
  if (!row?.id) throw new CandidateProfileError('not_persisted', 'Candidate update matched no rows');
  return row;
}
