/**
 * What the candidate's own print view shows (/candidate → Print / PDF).
 * Whitelists, built from rows the page already loaded:
 * - one offer: position, employer, salary, start date, terms, status
 * - the document list: type, status, file name, review note
 * - the profile summary: the candidate's own registration details (below)
 * The files themselves are never printed (no file_url, no preview).
 */

export type OfferPrint = {
  position: string;
  employer: string;
  salary: string;
  startDate: string;
  terms: string;
  status: string;
};

export type DocumentPrintRow = {
  title: string;
  status: string;
  fileName: string;
  reviewNote: string;
};

type Row = Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value);
}

export function offerPrint(
  offer: Row,
  format: { position: (offer: Row) => string; salary: (offer: Row) => string; status: (offer: Row) => string },
): OfferPrint {
  return {
    position: format.position(offer),
    employer: text(offer.employer_name),
    salary: format.salary(offer),
    startDate: text(offer.start_date).slice(0, 10),
    terms: text(offer.terms_details),
    status: format.status(offer),
  };
}

export function documentPrintRows(
  docs: readonly Row[],
  format: { title: (doc: Row) => string; status: (doc: Row) => string },
): DocumentPrintRow[] {
  return docs.map((doc) => ({
    title: format.title(doc),
    status: format.status(doc),
    fileName: text(doc.notes),
    reviewNote: text(doc.review_note),
  }));
}

/** Profile summary fields, in print order. Only what the candidate sees and edits on their own profile tab. */
export const PROFILE_PRINT_FIELDS = [
  'full_name', 'passport_number', 'phone', 'email', 'profession', 'sector', 'nationality',
  'emergency_name', 'emergency_relation', 'emergency_phone',
] as const;
export type ProfilePrintField = (typeof PROFILE_PRINT_FIELDS)[number];

/** (label, value) pairs; `format` turns stored keys (profession, sector, country) into the page language. */
export function profilePrintFields(
  candidate: Row,
  emergency: { name: string; relation: string; phone: string },
  labels: Record<ProfilePrintField, string>,
  format: { profession: (value: string) => string; sector: (value: string) => string; nationality: (value: string) => string },
): (readonly [string, string])[] {
  const values: Record<ProfilePrintField, string> = {
    full_name: text(candidate.full_name),
    passport_number: text(candidate.passport_number).toUpperCase(),
    phone: text(candidate.phone),
    email: text(candidate.email),
    profession: text(candidate.profession) ? format.profession(text(candidate.profession)) : '',
    sector: text(candidate.sector) ? format.sector(text(candidate.sector)) : '',
    nationality: text(candidate.nationality) ? format.nationality(text(candidate.nationality)) : '',
    emergency_name: emergency.name.trim(),
    emergency_relation: emergency.relation.trim(),
    emergency_phone: emergency.phone.trim(),
  };
  return PROFILE_PRINT_FIELDS.map((key) => [labels[key], values[key]] as const);
}
