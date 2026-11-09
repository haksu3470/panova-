/**
 * Company-profile identity for the signed-in employer.
 * The form email is not an id: a new address must update the linked row,
 * not insert a second employers record.
 */

export type EmployerWriteCode = 'not_linked' | 'not_persisted' | 'email_taken' | 'write_failed' | 'invalid';

export class EmployerWriteError extends Error {
  code: EmployerWriteCode;

  constructor(code: EmployerWriteCode, message: string) {
    super(message);
    this.name = 'EmployerWriteError';
    this.code = code;
  }
}

export type EmployerRow = {
  id: string;
  company_name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  logo: string | null;
};

export type CompanyProfileInput = {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  country: string;
  logo: string;
};

function nonempty(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

const EMPLOYER_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Staff "view portal" must open the clicked employer.
 * The query `as` id wins. A stored impersonation id is only a fallback.
 * A hardcoded company is never used.
 */
export function staffViewEmployerId(search: string, stored: unknown): string | null {
  const fromQuery = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('as');
  if (fromQuery && EMPLOYER_UUID.test(fromQuery)) return fromQuery;
  if (!stored || typeof stored !== 'object') return null;
  const record = stored as { isAdminImpersonation?: boolean; id?: string };
  if (record.isAdminImpersonation && record.id && EMPLOYER_UUID.test(record.id)) return record.id;
  return null;
}

/** Profile link first, then the employers row owned by this auth user. Never a form email or "first row". */
export function resolveLinkedEmployerId(input: {
  profileLinkedEmployerId?: string | null;
  authOwnedEmployerId?: string | null;
}): string | null {
  return nonempty(input.profileLinkedEmployerId) ?? nonempty(input.authOwnedEmployerId);
}

export function companyProfilePayload(input: CompanyProfileInput) {
  const company_name = input.companyName.trim();
  const email = input.email.trim();
  if (!company_name) throw new EmployerWriteError('invalid', 'Company name is required');
  if (!email || !email.includes('@')) throw new EmployerWriteError('invalid', 'Email is required');
  return {
    company_name,
    contact_person: input.contactPerson.trim(),
    email,
    phone: input.phone.trim(),
    country: input.country.trim(),
    logo: input.logo,
  };
}

export function toEmployerProfileView(row: EmployerRow) {
  return {
    id: row.id,
    companyName: row.company_name ?? '',
    contactPerson: row.contact_person ?? '',
    email: row.email ?? '',
    phone: row.phone ?? '',
    country: row.country ?? '',
    companyLogo: row.logo ?? '',
  };
}

/** A successful save is a returned row. Zero rows (RLS) and PostgREST errors are failures. */
export function assertEmployerPersisted<T extends { id: string }>(
  row: T | null,
  error: { code?: string; message?: string } | null,
): T {
  if (error) {
    const unique = error.code === '23505' || /employers_email_key/i.test(error.message || '');
    if (unique) throw new EmployerWriteError('email_taken', error.message || 'email taken');
    throw new EmployerWriteError('write_failed', error.message || 'update failed');
  }
  if (!row?.id) throw new EmployerWriteError('not_persisted', 'Employer update matched no rows');
  return row;
}
