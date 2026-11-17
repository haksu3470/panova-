/**
 * Shrinks a photo of a document in the browser before upload.
 *
 * Images: long edge at most 1600 px, re-encoded as JPEG at quality 0.8 on a
 * canvas. If the result is still over the document limit (validateUpload,
 * 8 MB) it is encoded once more at a lower quality; if that fails too the
 * upload is refused with 'size'. PDFs are passed through untouched.
 *
 * Phone cameras store the rotation in EXIF; createImageBitmap with
 * imageOrientation 'from-image' applies it, so the canvas gets the upright
 * picture.
 */
import { validateUpload, type UploadRejection } from './uploads';

export const DOWNSCALE_MAX_EDGE = 1600;
export const DOWNSCALE_QUALITY = 0.8;
export const DOWNSCALE_RETRY_QUALITY = 0.6;

/** Target size: the long edge capped at maxEdge, aspect kept, never enlarged. */
export function downscaleSize(width: number, height: number, maxEdge = DOWNSCALE_MAX_EDGE): { width: number; height: number } {
  const w = Math.max(1, Math.round(width) || 1);
  const h = Math.max(1, Math.round(height) || 1);
  const long = Math.max(w, h);
  if (long <= maxEdge) return { width: w, height: h };
  const scale = maxEdge / long;
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

/** "IMG_0001.HEIC" -> "IMG_0001.jpg"; blank -> "document.jpg". */
export function jpegFileName(name: string): string {
  const base = String(name ?? '').trim().replace(/\.[^./\\]+$/, '');
  return `${base || 'document'}.jpg`;
}

const IMAGE_EXT = /\.(jpe?g|png|heic|heif|webp)$/i;

export function isImageFile(file: { type: string; name: string }): boolean {
  if (file.type) return file.type.startsWith('image/');
  return IMAGE_EXT.test(file.name);
}

/** Encodes the already scaled picture at the given JPEG quality. */
export type JpegEncoder = (quality: number) => Promise<Blob>;

export type PreparedUpload = { ok: true; file: File } | { ok: false; error: UploadRejection };

/**
 * File ready for uploadCandidateFile(…, 'document'). makeEncoder returns null
 * when the browser cannot decode the picture; then an original JPEG / PNG
 * within the limit is uploaded as is.
 */
export async function prepareDocumentFile(
  file: File,
  makeEncoder: (file: File) => Promise<JpegEncoder | null> = canvasJpegEncoder,
): Promise<PreparedUpload> {
  if (!file.size) return { ok: false, error: 'empty' };
  if (file.type === 'application/pdf') {
    const problem = validateUpload(file, 'document');
    return problem ? { ok: false, error: problem } : { ok: true, file };
  }
  if (!isImageFile(file)) return { ok: false, error: 'type' };

  const original = (): PreparedUpload => {
    const problem = validateUpload(file, 'document');
    return problem ? { ok: false, error: problem } : { ok: true, file };
  };

  let encode: JpegEncoder | null = null;
  try {
    encode = await makeEncoder(file);
  } catch {
    encode = null;
  }
  if (!encode) return original();

  const name = jpegFileName(file.name);
  for (const quality of [DOWNSCALE_QUALITY, DOWNSCALE_RETRY_QUALITY]) {
    let blob: Blob;
    try {
      blob = await encode(quality);
    } catch {
      return original();
    }
    const shrunk = new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
    if (validateUpload(shrunk, 'document') === null) return { ok: true, file: shrunk };
  }
  return { ok: false, error: 'size' };
}

/** Browser encoder: decode with EXIF rotation, scale on a canvas, JPEG out. */
export async function canvasJpegEncoder(file: File): Promise<JpegEncoder | null> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return null;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return null;
  }
  const size = downscaleSize(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return null;
  }
  // JPEG has no transparency: a transparent PNG gets a white page, not black.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, size.width, size.height);
  context.drawImage(bitmap, 0, 0, size.width, size.height);
  bitmap.close();
  return (quality) =>
    new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode_failed'))), 'image/jpeg', quality);
    });
}
