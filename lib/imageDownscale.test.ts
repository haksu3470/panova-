import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const {
  DOWNSCALE_MAX_EDGE,
  downscaleSize,
  isImageFile,
  jpegFileName,
  prepareDocumentFile,
} = await import('./imageDownscale.ts');
const { DOCUMENT_MAX_BYTES } = await import('./uploads.ts');
type JpegEncoder = (quality: number) => Promise<Blob>;

test('downscaleSize keeps aspect and never enlarges', () => {
  assert.deepEqual(downscaleSize(800, 600), { width: 800, height: 600 });
  assert.deepEqual(downscaleSize(3200, 2400), { width: DOWNSCALE_MAX_EDGE, height: 1200 });
  assert.deepEqual(downscaleSize(2400, 3200), { width: 1200, height: DOWNSCALE_MAX_EDGE });
});

test('jpegFileName and isImageFile', () => {
  assert.equal(jpegFileName('IMG_0001.HEIC'), 'IMG_0001.jpg');
  assert.equal(jpegFileName(''), 'document.jpg');
  assert.equal(isImageFile({ type: 'image/jpeg', name: 'a.bin' }), true);
  assert.equal(isImageFile({ type: '', name: 'scan.PNG' }), true);
  assert.equal(isImageFile({ type: 'application/pdf', name: 'a.pdf' }), false);
});

test('prepareDocumentFile: empty, pdf and non-image', async () => {
  assert.deepEqual(await prepareDocumentFile(new File([], 'empty.jpg', { type: 'image/jpeg' })), {
    ok: false,
    error: 'empty',
  });
  const pdf = new File([new Uint8Array([1, 2, 3])], 'a.pdf', { type: 'application/pdf' });
  const pdfOk = await prepareDocumentFile(pdf);
  assert.equal(pdfOk.ok, true);
  if (pdfOk.ok) assert.equal(pdfOk.file, pdf);

  const zip = new File([new Uint8Array([1])], 'a.zip', { type: 'application/zip' });
  assert.deepEqual(await prepareDocumentFile(zip), { ok: false, error: 'type' });
});

test('prepareDocumentFile: encoder shrinks oversized JPEG', async () => {
  const big = new File([new Uint8Array(DOCUMENT_MAX_BYTES + 100)], 'cam.jpg', { type: 'image/jpeg' });
  const smallBlob = new Blob([new Uint8Array(100)], { type: 'image/jpeg' });
  const makeEncoder = async (): Promise<JpegEncoder> => async () => smallBlob;
  const prepared = await prepareDocumentFile(big, makeEncoder);
  assert.equal(prepared.ok, true);
  if (prepared.ok) {
    assert.equal(prepared.file.type, 'image/jpeg');
    assert.equal(prepared.file.name, 'cam.jpg');
    assert.ok(prepared.file.size < DOCUMENT_MAX_BYTES);
  }
});

test('prepareDocumentFile: still over limit after retries → size', async () => {
  const big = new File([new Uint8Array(DOCUMENT_MAX_BYTES + 100)], 'cam.jpg', { type: 'image/jpeg' });
  const stillBig = new Blob([new Uint8Array(DOCUMENT_MAX_BYTES + 1)], { type: 'image/jpeg' });
  const makeEncoder = async (): Promise<JpegEncoder> => async () => stillBig;
  assert.deepEqual(await prepareDocumentFile(big, makeEncoder), { ok: false, error: 'size' });
});
