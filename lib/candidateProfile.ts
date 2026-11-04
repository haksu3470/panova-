/**
 * Registration identity for the signed-in candidate.
 * Signup stores name, passport, phone, profession, and sector on the
 * job_candidates row. Profile save must update that same row. It must not
 * change the auth email (that flow re-verifies) or privileged columns.
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
};

export type CandidateIdentity = {
  full_name: string;
  passport_number: string;
  phone: string;
  email: string;
  profession: string;
  sector: string;
};

function required(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Columns a candidate may change. No id, auth link, status, or verification flags. */
export function candidateIdentityPayload(input: CandidateIdentityInput): CandidateIdentity {
  const full_name = required(input.fullName);
  const passport_number = required(input.passport)?.toUpperCase() ?? null;
  const phone = required(input.phone);
  const email = required(input.email)?.toLowerCase() ?? null;
  const profession = required(input.profession);
  const sector = required(input.sector);
  if (!full_name || !passport_number || !phone || !email || !email.includes('@') || !profession || !sector) {
    throw new CandidateProfileError('invalid', 'Registration fields are required');
  }
  return { full_name, passport_number, phone, email, profession, sector };
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
  };
}

type WriteError = { code?: string; message?: string; details?: string | null } | null;

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
