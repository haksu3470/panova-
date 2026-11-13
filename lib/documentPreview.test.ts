import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import {
  contentLength,
  dataUrlByteSize,
  downloadFileName,
  downloadHref,
  isDirectFileUrl,
  isDocumentRowId,
  looksLikePdf,
  objectUrlHolder,
  openInTabDownloadAttr,
  PDF_INLINE_MAX_BYTES,
  PDF_MIME,
  pdfBlobFromBytes,
  previewKind,
  previewStrategy,
  storageRefFor,
} from './documentPreview.ts';
import { translations } from './dictionary.ts';
import { contentSecurityPolicy } from './securityHeaders.ts';

const ROOT = join(import.meta.dirname, '..');
const LANGS = ['tr', 'en', 'sq', 'ar', 'mk'] as const;

test('file type from the file name first, then the address', () => {
  assert.equal(previewKind('pasaport.JPG', 'storage:candidate-files/a/passport/x'), 'image');
  assert.equal(previewKind('scan.png', null), 'image');
  assert.equal(previewKind('cv.pdf', null), 'pdf');
  assert.equal(previewKind('cv.docx', 'storage:candidate-files/a/cv/x.docx'), 'other');
  assert.equal(previewKind(null, 'storage:candidate-files/c1/passport/171.pdf'), 'pdf');
  assert.equal(previewKind(null, 'storage:candidate-files/c1/photo/171.jpeg'), 'image');
  assert.equal(previewKind('', 'https://x.supabase.co/object/sign/a/b.png?token=abc'), 'image');
  assert.equal(previewKind(undefined, 'data:application/pdf;base64,JVBER'), 'pdf');
  assert.equal(previewKind(undefined, 'data:image/png;base64,iVBOR'), 'image');
  assert.equal(previewKind(undefined, 'data:application/zip;base64,UEsD'), 'other');
  assert.equal(previewKind(null, 'storage:candidate-files/c1/other/171'), 'other');
});

test('direct address vs storage reference', () => {
  assert.equal(isDirectFileUrl('data:image/png;base64,AA'), true);
  assert.equal(isDirectFileUrl('https://example.com/a.pdf'), true);
  assert.equal(isDirectFileUrl('HTTP://example.com/a.pdf'), true);
  assert.equal(isDirectFileUrl('blob:https://x/1'), true);
  assert.equal(isDirectFileUrl('storage:candidate-files/c1/passport/1.pdf'), false);
  assert.equal(isDirectFileUrl('c1/passport/1.pdf'), false);
  assert.equal(isDirectFileUrl(''), false);

  assert.equal(storageRefFor('storage:candidate-files/c1/passport/1.pdf'), 'storage:candidate-files/c1/passport/1.pdf');
  assert.equal(storageRefFor('c1/passport/1.pdf'), 'storage:candidate-files/c1/passport/1.pdf');
  assert.equal(storageRefFor('/candidate-files/c1/passport/1.pdf'), 'storage:candidate-files/c1/passport/1.pdf');
  assert.equal(storageRefFor('https://example.com/a.pdf'), null);
  assert.equal(storageRefFor('data:image/png;base64,AA'), null);
  assert.equal(storageRefFor('storage:candidate-files/'), null);
  assert.equal(storageRefFor('javascript:alert(1)'), null);
  assert.equal(storageRefFor(null), null);
});

test('candidate_documents ids are told apart from legacy list ids', () => {
  assert.equal(isDocumentRowId('3f0c2b1e-8d4a-4c6b-9e2f-1a2b3c4d5e6f'), true);
  assert.equal(isDocumentRowId('1'), false);
  assert.equal(isDocumentRowId('1731500000000'), false);
});

test('PDFs go through a blob; images and other types use the address; big PDFs are link only', () => {
  assert.equal(previewStrategy('pdf'), 'blob');
  assert.equal(previewStrategy('pdf', null), 'blob');
  assert.equal(previewStrategy('pdf', PDF_INLINE_MAX_BYTES), 'blob');
  assert.equal(previewStrategy('pdf', PDF_INLINE_MAX_BYTES + 1), 'too_large');
  assert.equal(previewStrategy('image', PDF_INLINE_MAX_BYTES * 2), 'direct');
  assert.equal(previewStrategy('other'), 'direct');
  assert.equal(PDF_INLINE_MAX_BYTES, 25 * 1024 * 1024);
});

test('size helpers: data: addresses and Content-Length', () => {
  assert.equal(dataUrlByteSize('data:application/pdf;base64,JVBERi0='), 5); // "%PDF-"
  assert.equal(dataUrlByteSize('data:application/pdf;base64,' + 'A'.repeat(40)), 30);
  assert.equal(dataUrlByteSize('https://x/a.pdf'), null);
  assert.equal(contentLength('1024'), 1024);
  assert.equal(contentLength(null), null);
  assert.equal(contentLength(''), null);
  assert.equal(contentLength('abc'), null);
});

test('PDF signature check', () => {
  assert.equal(looksLikePdf([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]), true);
  assert.equal(looksLikePdf(new Uint8Array([0x3c, 0x68, 0x74, 0x6d, 0x6c])), false); // "<html"
  assert.equal(looksLikePdf([0x25, 0x50]), false);
});

test('blob URLs are revoked when replaced and when cleared', () => {
  const revoked: string[] = [];
  let n = 0;
  const holder = objectUrlHolder(() => `blob:test/${++n}`, (url) => revoked.push(url));
  const blob = new Blob(['%PDF-'], { type: 'application/pdf' });
  assert.equal(holder.set(blob), 'blob:test/1');
  assert.equal(holder.set(blob), 'blob:test/2');
  assert.deepEqual(revoked, ['blob:test/1']);
  holder.clear();
  assert.deepEqual(revoked, ['blob:test/1', 'blob:test/2']);
  assert.equal(holder.current(), null);
  holder.clear();
  assert.equal(revoked.length, 2);
});

test('the preview component frames PDFs only from its own blob URL and logs access first', () => {
  const modal = readFileSync(join(ROOT, 'components/portal/DocumentPreviewModal.tsx'), 'utf8');
  const files = readFileSync(join(ROOT, 'lib/candidateFiles.ts'), 'utf8');
  assert.ok(modal.includes('holder.set(pdf.blob)'));
  assert.ok(modal.includes('holder.clear()'));
  const pdfAt = modal.indexOf('candidatePdfBlob(');
  assert.ok(pdfAt > modal.indexOf('candidatePreviewUrl('), 'access is logged before the PDF is fetched');
  assert.ok(files.includes('pdfBlobFromBytes(bytes)'));
  assert.ok(files.includes("rpc('log_document_access'"));
});

test('staff page never puts the stored address straight into the frame', () => {
  const page = readFileSync(join(ROOT, 'app/portal/candidates/[id]/page.tsx'), 'utf8');
  const modal = readFileSync(join(ROOT, 'components/portal/DocumentPreviewModal.tsx'), 'utf8');
  assert.equal(page.includes('<iframe src={previewDoc'), false);
  assert.ok(page.includes('<DocumentPreviewModal'));
  assert.ok(modal.includes('candidatePreviewUrl('));
  assert.ok(modal.includes('<img src={view.url}'));
  assert.ok(modal.includes('<object data={view.url} type="application/pdf"'));
});

test('preview texts exist in five languages and are translated', () => {
  const keys = ['docPreviewFailed', 'docPreviewErrFetch', 'docPreviewErrNotPdf', 'docPreviewTooLarge', 'docPreviewErrAccess', 'docPreviewErrPath', 'docPreviewErrGeneric', 'docPreviewUnsupported', 'docOpenNewTab', 'docDownload', 'docPreviewPdfFallback', 'docPreviewClose', 'plLoading'] as const;
  for (const lang of LANGS) {
    for (const key of keys) {
      assert.ok(translations[lang][key]?.trim(), `${lang}.${key}`);
      if (lang !== 'en') assert.notEqual(translations[lang][key], translations.en[key], `${lang}.${key}`);
    }
  }
});

test('PDF blob is rebuilt from the bytes as application/pdf, even from octet-stream', async () => {
  const bytes = new TextEncoder().encode('%PDF-1.7\n%test');
  const stored = new Blob([bytes], { type: 'application/octet-stream' });
  const blob = pdfBlobFromBytes(new Uint8Array(await stored.arrayBuffer()));
  assert.equal(PDF_MIME, 'application/pdf');
  assert.equal(blob.type, 'application/pdf');
  assert.equal(blob.size, bytes.length);
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), bytes);
  assert.equal(pdfBlobFromBytes(bytes.buffer as ArrayBuffer).type, 'application/pdf');
  assert.equal(looksLikePdf(new Uint8Array(await blob.slice(0, 5).arrayBuffer())), true);
});

test('open in a new tab never downloads; download is a separate link', () => {
  assert.equal(openInTabDownloadAttr('blob:https://panova/1', 'p.pdf'), undefined);
  assert.equal(openInTabDownloadAttr('https://x.supabase.co/storage/v1/object/sign/candidate-files/a.jpg?token=t', 'a.jpg'), undefined);
  assert.equal(openInTabDownloadAttr('data:application/pdf;base64,AA', 'p.pdf'), 'p.pdf');
  const signed = 'https://x.supabase.co/storage/v1/object/sign/candidate-files/c1/passport/1.pdf?token=abc';
  assert.equal(downloadHref(signed, 'pasaport taraması.pdf'), `${signed}&download=${encodeURIComponent('pasaport taraması.pdf')}`);
  assert.equal(downloadHref(`${signed}&download=`, 'x.pdf'), `${signed}&download=`);
  assert.equal(downloadHref('blob:https://panova/1', 'p.pdf'), 'blob:https://panova/1');
  assert.equal(downloadFileName('scan.PDF', 'Pasaport', 'pdf'), 'scan.PDF');
  assert.equal(downloadFileName(null, 'Pasaport Taraması', 'pdf'), 'Pasaport Taraması.pdf');
  assert.equal(downloadFileName('', '', 'image'), 'document');

  const modal = readFileSync(join(ROOT, 'components/portal/DocumentPreviewModal.tsx'), 'utf8');
  assert.equal(/sandbox=/.test(modal), false, 'no sandbox on the PDF frame');
  assert.equal(/download=\{downloadFor|download=\{fileName \|\| name/.test(modal), false);
  assert.ok(modal.includes('t.docPreviewPdfFallback'), 'fallback with links instead of an empty frame');
  assert.ok(modal.includes('{t.docDownload}'));
});

test('site CSP lets the page show its own blob: PDF, and nothing else is loosened', () => {
  const csp = contentSecurityPolicy();
  const directive = (name: string) => csp.split('; ').find((d) => d.startsWith(`${name} `)) ?? '';
  assert.equal(directive('object-src'), 'object-src blob:');
  assert.match(directive('frame-src'), /^frame-src 'self' blob: /);
  assert.doesNotMatch(csp, /(frame|object)-src[^;]*(\*|data:|https?:(?!\/\/)|'unsafe)/);
  assert.match(csp, /frame-ancestors 'none'/);
});