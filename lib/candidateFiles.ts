import { supabase } from '@/lib/supabase';
import {
  isStorageFileUrl,
  storageFileUrl,
  storageObjectPath,
  storagePathFromFileUrl,
  uploadExtension,
  validateUpload,
  type UploadKind,
  type UploadRejection,
} from '@/lib/uploads';
import { isDirectFileUrl, storageRefFor } from '@/lib/documentPreview';

export async function uploadCandidateFile(candidateId: string, slot: string, file: File, kind: UploadKind): Promise<string> {
  const problem = validateUpload(file, kind);
  if (problem) throw problem;
  const extension = uploadExtension(file.type);
  if (!extension) throw 'type' as UploadRejection;
  const path = storageObjectPath(candidateId, slot, extension);
  const { error } = await supabase.storage.from('candidate-files').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return storageFileUrl(path);
}

export async function signedCandidateFileUrl(fileUrl: string | null | undefined): Promise<string | null> {
  if (!fileUrl) return null;
  if (!isStorageFileUrl(fileUrl)) return fileUrl;
  const path = storagePathFromFileUrl(fileUrl);
  if (!path) return null;
  const { data, error } = await supabase.storage.from('candidate-files').createSignedUrl(path, 120);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export type PreviewUrlResult =
  | { ok: true; url: string }
  | { ok: false; code: 'no_file' | 'bad_path' | 'access_denied' | 'sign_failed'; detail?: string };

/**
 * Like openCandidateDocument / signedCandidateFileUrl, but says why it failed.
 * Direct addresses (data:, http(s):) are returned as is. With a
 * candidate_documents id the access is logged first (log_document_access).
 */
export async function candidatePreviewUrl(fileUrl: string | null | undefined, documentId?: string | null): Promise<PreviewUrlResult> {
  let stored = String(fileUrl ?? '').trim();
  if (documentId) {
    const { data, error } = await supabase.rpc('log_document_access', { p_document_id: documentId });
    if (typeof data === 'string' && data) stored = data;
    else if (error && !stored) return { ok: false, code: 'access_denied', detail: error.code || error.message };
  }
  if (!stored) return { ok: false, code: 'no_file' };
  if (isDirectFileUrl(stored)) return { ok: true, url: stored };
  const ref = storageRefFor(stored);
  const path = ref ? storagePathFromFileUrl(ref) : null;
  if (!path) return { ok: false, code: 'bad_path' };
  const { data, error } = await supabase.storage.from('candidate-files').createSignedUrl(path, 120);
  if (error || !data?.signedUrl) {
    const status = (error as { statusCode?: string | number } | null)?.statusCode;
    const denied = status === 400 || status === 403 || status === 404 || status === '400' || status === '403' || status === '404';
    return { ok: false, code: denied ? 'access_denied' : 'sign_failed', detail: error?.message || String(status ?? '') };
  }
  return { ok: true, url: data.signedUrl };
}

export async function openCandidateDocument(documentId: string, fileUrl: string | null | undefined): Promise<string | null> {
  const { data, error } = await supabase.rpc('log_document_access', { p_document_id: documentId });
  const stored = typeof data === 'string' && data ? data : fileUrl;
  if (error && !stored) return null;
  return signedCandidateFileUrl(stored);
}
