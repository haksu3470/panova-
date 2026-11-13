import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import {
  contentLength,
  dataUrlByteSize,
  isDirectFileUrl,
  isDocumentRowId,
  looksLikePdf,
  objectUrlHolder,
  PDF_INLINE_MAX_BYTES,
  previewKind,
  previewStrategy,
  storageRefFor,
} from './documentPreview.ts';
import { translations } from './dictionary.ts';

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
  assert.ok(files.includes("type: 'application/pdf'"));
  assert.ok(files.includes("rpc('log_document_access'"));
});

test('staff page never puts the stored address straight into the frame', () => {
  const page = readFileSync(join(ROOT, 'app/portal/candidates/[id]/page.tsx'), 'utf8');
  const modal = readFileSync(join(ROOT, 'components/portal/DocumentPreviewModal.tsx'), 'utf8');
  assert.equal(page.includes('<iframe src={previewDoc'), false);
  assert.ok(page.includes('<DocumentPreviewModal'));
  assert.ok(modal.includes('candidatePreviewUrl('));
  assert.ok(modal.includes('<img src={view.url}'));
  assert.ok(modal.includes('<iframe src={view.url}'));
});

test('preview texts exist in five languages and are translated', () => {
  const keys = ['docPreviewFailed', 'docPreviewErrFetch', 'docPreviewErrNotPdf', 'docPreviewTooLarge', 'docPreviewErrAccess', 'docPreviewErrPath', 'docPreviewErrGeneric', 'docPreviewUnsupported', 'docOpenNewTab', 'docPreviewClose', 'plLoading'] as const;
  for (const lang of LANGS) {
    for (const key of keys) {
      assert.ok(translations[lang][key]?.trim(), `${lang}.${key}`);
      if (lang !== 'en') assert.notEqual(translations[lang][key], translations.en[key], `${lang}.${key}`);
    }
  }
});
