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

/**
 * Above this size a PDF is not pulled into memory for the inline viewer;
 * the window offers "open in new tab / download" instead.
 */
export const PDF_INLINE_MAX_BYTES = 25 * 1024 * 1024;

/**
 * How a resolved address is shown:
 * - 'direct'    : images and other types use the address as is
 * - 'blob'      : PDFs are fetched, re-wrapped as application/pdf and shown
 *                 from a blob: URL (storage files carry a sandbox CSP that
 *                 Chrome's PDF viewer refuses inside a frame; long data:
 *                 PDFs fail too)
 * - 'too_large' : PDF over the limit (size known up front): link only
 */
export type PreviewStrategy = 'direct' | 'blob' | 'too_large';

export function previewStrategy(kind: PreviewKind, sizeBytes?: number | null): PreviewStrategy {
  if (kind !== 'pdf') return 'direct';
  if (typeof sizeBytes === 'number' && Number.isFinite(sizeBytes) && sizeBytes > PDF_INLINE_MAX_BYTES) return 'too_large';
  return 'blob';
}

/** Decoded size of a base64 data: address, or null when it is not one. */
export function dataUrlByteSize(url: string | null | undefined): number | null {
  const value = String(url ?? '');
  const comma = value.indexOf(',');
  if (!value.startsWith('data:') || comma < 0) return null;
  const head = value.slice(0, comma);
  const body = value.length - comma - 1;
  if (!/;base64$/i.test(head)) return body;
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((body * 3) / 4) - padding);
}

/** Content-Length header as a number, or null when missing or invalid. */
export function contentLength(header: string | null | undefined): number | null {
  const n = Number(String(header ?? '').trim());
  return header != null && String(header).trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null;
}

/** A real PDF starts with "%PDF-" (checked before showing it inline). */
export function looksLikePdf(firstBytes: ArrayLike<number>): boolean {
  const sig = [0x25, 0x50, 0x44, 0x46, 0x2d];
  if (firstBytes.length < sig.length) return false;
  return sig.every((b, i) => firstBytes[i] === b);
}

/**
 * Holds at most one blob: URL and revokes it when replaced or cleared, so a
 * closed or unmounted preview never leaks the file in memory.
 */
export function objectUrlHolder(
  create: (blob: Blob) => string,
  revoke: (url: string) => void,
): { set: (blob: Blob) => string; clear: () => void; current: () => string | null } {
  let url: string | null = null;
  return {
    set(blob) {
      if (url) revoke(url);
      url = create(blob);
      return url;
    },
    clear() {
      if (url) revoke(url);
      url = null;
    },
    current: () => url,
  };
}

/** candidate_documents ids are UUIDs; legacy documents_json ids are not. */
export function isDocumentRowId(id: string | null | undefined): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id ?? ''));
}
