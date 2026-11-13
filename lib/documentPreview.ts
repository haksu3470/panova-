/**
 * Document preview helpers (staff candidate page). Pure functions only.
 *
 * A stored file_url is one of:
 * - a direct address: data: (old base64 uploads), http(s): or blob:  -> used as is
 * - a private storage reference: "storage:candidate-files/<path>" (candidate
 *   uploads, see lib/uploads.ts), or a bare object path                -> needs a signed URL
 */

export type PreviewKind = 'image' | 'pdf' | 'other';

const STORAGE_PREFIX = 'storage:candidate-files/';
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];

/** data:, http(s): or blob: addresses open without signing. */
export function isDirectFileUrl(url: string | null | undefined): boolean {
  return /^(data:|https?:\/\/|blob:)/i.test(String(url ?? '').trim());
}

/**
 * The storage reference to sign, or null for a direct address or an empty
 * value. Bare paths ("<id>/passport/x.pdf", "/candidate-files/...") get the
 * storage prefix so signing never falls back to the raw path.
 */
export function storageRefFor(url: string | null | undefined): string | null {
  const value = String(url ?? '').trim();
  if (!value || isDirectFileUrl(value)) return null;
  if (value.startsWith(STORAGE_PREFIX)) return value.length > STORAGE_PREFIX.length ? value : null;
  const path = value.replace(/^\/+/, '').replace(/^candidate-files\//, '');
  if (!path || /^[a-z][a-z0-9+.-]*:/i.test(path)) return null;
  return STORAGE_PREFIX + path;
}

function extensionOf(value: string | null | undefined): string {
  const clean = String(value ?? '').trim().split(/[?#]/)[0];
  const m = /\.([a-z0-9]{1,5})$/i.exec(clean);
  return m ? m[1].toLowerCase() : '';
}

/**
 * Image, PDF or other, from the file name (file_name / notes) first, then the
 * stored address (a data: MIME type or the path extension).
 */
export function previewKind(fileName: string | null | undefined, url: string | null | undefined): PreviewKind {
  const fromExt = (ext: string): PreviewKind | null => {
    if (ext === 'pdf') return 'pdf';
    if (IMAGE_EXTENSIONS.includes(ext)) return 'image';
    return null;
  };
  const byName = fromExt(extensionOf(fileName));
  if (byName) return byName;
  const value = String(url ?? '').trim();
  const mime = /^data:([^;,]+)/i.exec(value)?.[1]?.toLowerCase();
  if (mime) {
    if (mime === 'application/pdf') return 'pdf';
    if (mime.startsWith('image/')) return 'image';
    return 'other';
  }
  return fromExt(extensionOf(value)) ?? 'other';
}

/** candidate_documents ids are UUIDs; legacy documents_json ids are not. */
export function isDocumentRowId(id: string | null | undefined): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id ?? ''));
}
