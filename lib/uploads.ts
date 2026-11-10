/** Candidate files: PDF, JPEG, or PNG. Photos are smaller than document scans. */

export const DOCUMENT_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;
export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png'] as const;

export const DOCUMENT_MAX_BYTES = 8 * 1024 * 1024;
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;

export type UploadKind = 'document' | 'photo';
export type UploadRejection = 'type' | 'size' | 'empty';

const EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export function uploadExtension(mime: string): string | null {
  return EXT[mime] ?? null;
}

export function validateUpload(file: { type: string; size: number }, kind: UploadKind): UploadRejection | null {
  if (!file.size) return 'empty';
  const allowed: readonly string[] = kind === 'photo' ? PHOTO_MIME_TYPES : DOCUMENT_MIME_TYPES;
  const max = kind === 'photo' ? PHOTO_MAX_BYTES : DOCUMENT_MAX_BYTES;
  if (!allowed.includes(file.type)) return 'type';
  if (file.size > max) return 'size';
  return null;
}

export function storageObjectPath(candidateId: string, slot: string, extension: string): string {
  const safeSlot = slot.replace(/[^a-z0-9_-]/gi, '').slice(0, 40) || 'file';
  const id = crypto.randomUUID();
  return `${candidateId}/${safeSlot}/${id}.${extension}`;
}

export function isStorageFileUrl(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith('storage:candidate-files/');
}

export function storagePathFromFileUrl(value: string | null | undefined): string | null {
  if (typeof value !== 'string' || !value.startsWith('storage:candidate-files/')) return null;
  return value.slice('storage:candidate-files/'.length);
}

export function storageFileUrl(path: string): string {
  return `storage:candidate-files/${path}`;
}
