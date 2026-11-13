/**
 * What the candidate's own print view shows (/candidate → Print / PDF).
 * Whitelists, built from rows the page already loaded:
 * - one offer: position, employer, salary, start date, terms, status
 * - the document list: type, status, file name, review note
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
