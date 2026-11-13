import { supabase } from '@/lib/supabase';
import { writeAudit } from '@/lib/audit';
import { uploadCandidateFile } from '@/lib/candidateFiles';
import { validateUpload } from '@/lib/uploads';
import {
  canPickDocumentStatus,
  hasOpenRequest,
  isRlsDenied,
  uploadTargetRow,
  type CandidateDocumentRow,
  type DocumentWriteError,
} from '@/lib/candidateDocuments';

/**
 * Staff writes on public.candidate_documents. Each call is one small write
 * that saves at once (no "Save changes"). RLS decides who may write; a
 * refusal, including an update that touched no row, comes back as 'denied'.
 */

export type DocumentWriteResult = { ok: true } | { ok: false; code: DocumentWriteError; detail?: string };

const fail = (error: unknown): DocumentWriteResult => {
  const detail = typeof error === 'object' && error ? String((error as { message?: unknown }).message ?? '') : String(error ?? '');
  if (error) console.error('[candidate-documents]', detail);
  return { ok: false, code: isRlsDenied(error) ? 'denied' : 'failed', detail };
};

export async function loadCandidateDocuments(candidateId: string): Promise<{ rows: CandidateDocumentRow[]; error: string }> {
  const { data, error } = await supabase
    .from('candidate_documents')
    .select('id, candidate_id, doc_type, file_url, notes, status, review_note, valid_until, uploaded_at, created_at, is_demo')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false });
  return { rows: (data as CandidateDocumentRow[] | null) || [], error: error?.message || '' };
}

/** Status, review note or valid-until on one row, with reviewer and time. */
export async function updateCandidateDocument(
  row: CandidateDocumentRow,
  patch: { status?: string; review_note?: string | null; valid_until?: string | null },
  auditLabel: string,
): Promise<DocumentWriteResult> {
  if (patch.status && !canPickDocumentStatus(patch.status, row)) return { ok: false, code: 'failed', detail: 'needs_file' };
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('candidate_documents')
    .update({ ...patch, reviewed_at: new Date().toISOString(), reviewed_by: auth.user?.id ?? null })
    .eq('id', row.id)
    .select('id');
  if (error) return fail(error);
  if (!data?.length) return { ok: false, code: 'denied' };
  await writeAudit(auditLabel, 'candidate', row.candidate_id || undefined, { document_id: row.id, ...patch });
  return { ok: true };
}

/** "+ Request": a pending row of this type, unless one is already open. */
export async function requestCandidateDocument(
  candidateId: string,
  docType: string,
  rows: readonly CandidateDocumentRow[],
  auditLabel: string,
): Promise<DocumentWriteResult> {
  if (hasOpenRequest(rows, docType)) return { ok: false, code: 'already' };
  const { data, error } = await supabase
    .from('candidate_documents')
    .insert({ candidate_id: candidateId, doc_type: docType, status: 'pending' })
    .select('id');
  if (error) return fail(error);
  if (!data?.length) return { ok: false, code: 'denied' };
  await writeAudit(auditLabel, 'candidate', candidateId, { document_id: data[0].id, doc_type: docType });
  return { ok: true };
}

/**
 * Staff upload, same as the candidate flow (app/candidate/page.tsx): check
 * the file, put it in the private bucket under <candidate_id>/, then update
 * the newest pending / uploaded / rerequested / rejected row of that type, or
 * add a new row when there is none (an approved or reviewing row stays).
 */
export async function uploadStaffDocument(
  candidateId: string,
  docType: string,
  file: File,
  rows: readonly CandidateDocumentRow[],
  auditLabel: string,
): Promise<DocumentWriteResult> {
  const problem = validateUpload(file, 'document');
  if (problem) return { ok: false, code: problem };
  let fileUrl: string;
  try {
    fileUrl = await uploadCandidateFile(candidateId, docType, file, 'document');
  } catch (error) {
    if (error === 'type' || error === 'size' || error === 'empty') return { ok: false, code: error };
    return fail(error);
  }
  const payload = { file_url: fileUrl, status: 'uploaded', uploaded_at: new Date().toISOString(), notes: file.name };
  const existing = uploadTargetRow(rows, docType);
  const { data, error } = existing
    ? await supabase.from('candidate_documents').update(payload).eq('id', existing.id).select('id')
    : await supabase.from('candidate_documents').insert({ ...payload, candidate_id: candidateId, doc_type: docType }).select('id');
  if (error) return fail(error);
  if (!data?.length) return { ok: false, code: 'denied' };
  await writeAudit(auditLabel, 'candidate', candidateId, { document_id: data[0].id, doc_type: docType, file_name: file.name });
  return { ok: true };
}
