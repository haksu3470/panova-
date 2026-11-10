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

export async function openCandidateDocument(documentId: string, fileUrl: string | null | undefined): Promise<string | null> {
  const { data, error } = await supabase.rpc('log_document_access', { p_document_id: documentId });
  const stored = typeof data === 'string' && data ? data : fileUrl;
  if (error && !stored) return null;
  return signedCandidateFileUrl(stored);
}
