/**
 * Approval rule for candidate documents (staff screens).
 *
 * A document can be approved only when it has a file. Records saved before
 * this rule may still say "approved" without a file (the old default list
 * marked the passport as approved whenever a passport number existed); such
 * rows are flagged and are not counted as approved.
 *
 * Works for both stores: candidate_documents rows (file_url) and the legacy
 * job_candidates.documents_json list (file_url, file_name).
 */

export interface DocumentLike {
  status?: string | null;
  file_url?: string | null;
}

export function hasDocumentFile(doc: DocumentLike | null | undefined): boolean {
  return Boolean(String(doc?.file_url ?? '').trim());
}

/** The "approved" choice is offered only for a document with a file. */
export function canApproveDocument(doc: DocumentLike | null | undefined): boolean {
  return hasDocumentFile(doc);
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

/** Slot ids of the default legacy list (see candidateDocumentTitle). */
export const DEFAULT_DOCUMENT_SLOTS = ['1', '2', '3', '4', '5'] as const;

/** Default legacy list: every document starts as pending. */
export function defaultDocumentList(names: readonly string[]): { id: string; name: string; status: 'pending' }[] {
  return DEFAULT_DOCUMENT_SLOTS.map((id, i) => ({ id, name: names[i] ?? '', status: 'pending' as const }));
}
