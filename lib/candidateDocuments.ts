/**
 * Candidate documents on staff screens: one list over public.candidate_documents.
 *
 * The five standard slots (same doc_type values as the candidate page) are
 * always shown; a slot with no row is a virtual "not requested yet" item.
 * Other rows (extra requests such as photo, and older rows of a slot type)
 * follow in the same list. The summary card counts exactly this list.
 *
 * Approval rule: a document can be approved or put under review only when it
 * has a file. Rows saved as approved without a file are flagged and are not
 * counted as approved.
 *
 * Pure functions only (no Supabase); see lib/candidateDocumentActions.ts.
 */

export interface DocumentLike {
  status?: string | null;
  file_url?: string | null;
}

/** A candidate_documents row, only the columns these screens use. */
export interface CandidateDocumentRow extends DocumentLike {
  id: string;
  candidate_id?: string | null;
  doc_type: string;
  notes?: string | null;
  review_note?: string | null;
  valid_until?: string | null;
  uploaded_at?: string | null;
  created_at?: string | null;
  is_demo?: boolean | null;
}

/** Standard slots, in order (app/candidate/page.tsx DOC_SLOT_TYPES). */
export const DOC_SLOT_TYPES = ['passport', 'certificate', 'criminal_record', 'health_report', 'apostille'] as const;

/** Types staff can request ("+ Request"), as in the former request list. */
export const REQUESTABLE_DOC_TYPES = [
  'passport', 'cv', 'certificate', 'diploma', 'criminal_record', 'health_report', 'photo', 'contract', 'apostille', 'other',
] as const;

/** Statuses stored in candidate_documents.status. */
export const DOC_STATUS_KEYS = ['pending', 'uploaded', 'reviewing', 'approved', 'rejected', 'rerequested', 'expiring', 'expired'] as const;

/** Statuses that need a file first. */
const NEEDS_FILE = new Set(['approved', 'reviewing']);

/** Rows the candidate flow overwrites on a new upload instead of adding a new row. */
const REPLACEABLE = new Set(['pending', 'uploaded', 'rerequested', 'rejected']);

/** Open requests: asking again for the same type is not needed. */
const OPEN_REQUEST = new Set(['pending', 'rerequested']);

export function hasDocumentFile(doc: DocumentLike | null | undefined): boolean {
  return Boolean(String(doc?.file_url ?? '').trim());
}

/** The "approved" choice is offered only for a document with a file. */
export function canApproveDocument(doc: DocumentLike | null | undefined): boolean {
  return hasDocumentFile(doc);
}

/** Approved and reviewing need a file; every other status can be set. */
export function canPickDocumentStatus(status: string, doc: DocumentLike | null | undefined): boolean {
  return !NEEDS_FILE.has(status) || hasDocumentFile(doc);
}

/** Approved and backed by a file: the only kind that counts as approved. */
export function isDocumentApproved(doc: DocumentLike | null | undefined): boolean {
  return doc?.status === 'approved' && hasDocumentFile(doc);
}

/** Says "approved" but has no file: show a "no file" warning. */
export function isApprovedWithoutFile(doc: DocumentLike | null | undefined): boolean {
  return doc?.status === 'approved' && !hasDocumentFile(doc);
}

/** total = every document; approved = approved with a file. */
export function documentCounts(docs: readonly DocumentLike[] | null | undefined): { total: number; approved: number } {
  const list = docs ?? [];
  return { total: list.length, approved: list.filter(isDocumentApproved).length };
}

/** One line of the staff list: a stored row, or a virtual slot with no row yet. */
export type DocumentListItem =
  | { key: string; docType: string; slot: boolean; row: CandidateDocumentRow; status: string; file_url: string | null }
  | { key: string; docType: string; slot: true; row: null; status: null; file_url: null };

function newestFirst(a: CandidateDocumentRow, b: CandidateDocumentRow): number {
  return String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''));
}

/**
 * The five slots first (newest row of that type, or a virtual item), then
 * every other row (extra types, older rows of a slot type), newest first.
 * Every stored row appears exactly once.
 */
export function mergeDocumentSlots(rows: readonly CandidateDocumentRow[] | null | undefined): DocumentListItem[] {
  const sorted = [...(rows ?? [])].sort(newestFirst);
  const used = new Set<string>();
  const items: DocumentListItem[] = [];
  for (const type of DOC_SLOT_TYPES) {
    const row = sorted.find((r) => r.doc_type === type);
    if (row) {
      used.add(row.id);
      items.push({ key: row.id, docType: type, slot: true, row, status: row.status || 'pending', file_url: row.file_url || null });
    } else {
      items.push({ key: `slot:${type}`, docType: type, slot: true, row: null, status: null, file_url: null });
    }
  }
  for (const row of sorted) {
    if (used.has(row.id)) continue;
    items.push({ key: row.id, docType: row.doc_type, slot: false, row, status: row.status || 'pending', file_url: row.file_url || null });
  }
  return items;
}

/**
 * The row a new upload of this type overwrites (candidate flow: the newest
 * pending / uploaded / rerequested / rejected row), or null to add a new row.
 */
export function uploadTargetRow(rows: readonly CandidateDocumentRow[], docType: string): CandidateDocumentRow | null {
  return [...rows].sort(newestFirst).find((r) => r.doc_type === docType && REPLACEABLE.has(String(r.status ?? ''))) ?? null;
}

/** An open request of this type with no file yet: "+ Request" adds nothing. */
export function hasOpenRequest(rows: readonly CandidateDocumentRow[], docType: string): boolean {
  return rows.some((r) => r.doc_type === docType && OPEN_REQUEST.has(String(r.status ?? '')) && !hasDocumentFile(r));
}

/** Translated slot names (same keys as candidateDocumentTitle). */
const SLOT_TITLE_KEY: Record<string, 'docPassportScan' | 'docProfessionalCert' | 'docCriminalRecord' | 'docHealthReport' | 'docApostille'> = {
  passport: 'docPassportScan',
  certificate: 'docProfessionalCert',
  criminal_record: 'docCriminalRecord',
  health_report: 'docHealthReport',
  apostille: 'docApostille',
};

/** Document title from doc_type only; a stored name is never shown. */
export function documentTypeTitle(
  docType: string,
  t: Partial<Record<(typeof SLOT_TITLE_KEY)[string], string>>,
  typeNames: Record<string, string>,
): string {
  const key = SLOT_TITLE_KEY[docType];
  const slotTitle = key ? t[key] : '';
  return (slotTitle && slotTitle.trim()) || typeNames[docType] || typeNames.other || docType;
}

/**
 * job_candidates.documents_json for the staff Save button. Every stored key
 * (closure_meta, profile_meta, the old `docs` list, anything else) is kept
 * exactly as stored; `docs` is never added. closure_meta is written only when
 * none is stored yet, as before. An old array value is the former `docs` list.
 */
export function keepDocumentsJson(
  stored: string | null | undefined,
  closure: { is_closed: boolean; closure_reason: string },
): string {
  let meta: Record<string, unknown> = {};
  try {
    const parsed: unknown = stored ? JSON.parse(stored) : {};
    if (Array.isArray(parsed)) meta = { docs: parsed };
    else if (parsed && typeof parsed === 'object') meta = parsed as Record<string, unknown>;
  } catch {
    meta = {};
  }
  return JSON.stringify({ closure_meta: closure, ...meta });
}

export type DocumentWriteError = 'denied' | 'type' | 'size' | 'empty' | 'already' | 'failed';

/**
 * RLS refusals: Postgres 42501, PostgREST "row-level security", storage 403,
 * or an update/insert that returned no row.
 */
export function isRlsDenied(error: unknown): boolean {
  if (!error) return false;
  const record = typeof error === 'object' ? (error as { code?: unknown; message?: unknown; statusCode?: unknown; status?: unknown }) : {};
  const message = error instanceof Error ? error.message : String(record.message ?? (typeof error === 'string' ? error : ''));
  const status = String(record.statusCode ?? record.status ?? '');
  return record.code === '42501' || status === '403' || /row-level security|permission denied|not authorized|unauthorized/i.test(message);
}
