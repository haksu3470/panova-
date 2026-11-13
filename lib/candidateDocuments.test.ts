import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import {
  canApproveDocument,
  defaultDocumentList,
  documentCounts,
  hasDocumentFile,
  isApprovedWithoutFile,
  isDocumentApproved,
} from './candidateDocuments.ts';
import { translations } from './dictionary.ts';
import { portalUi } from './portal-ui-copy.ts';

const ROOT = join(import.meta.dirname, '..');
const LANGS = ['tr', 'en', 'sq', 'ar', 'mk'] as const;

test('a document without a file cannot be approved', () => {
  assert.equal(hasDocumentFile({ file_url: '' }), false);
  assert.equal(hasDocumentFile({ file_url: '   ' }), false);
  assert.equal(hasDocumentFile({ file_url: null }), false);
  assert.equal(hasDocumentFile({}), false);
  assert.equal(canApproveDocument({ status: 'pending' }), false);
  assert.equal(canApproveDocument({ status: 'uploaded', file_url: 'data:application/pdf;base64,AA' }), true);
});

test('approved without a file is flagged and not counted', () => {
  const noFile = { status: 'approved' };
  const withFile = { status: 'approved', file_url: 'https://x/f.pdf' };
  assert.equal(isApprovedWithoutFile(noFile), true);
  assert.equal(isDocumentApproved(noFile), false);
  assert.equal(isApprovedWithoutFile(withFile), false);
  assert.equal(isDocumentApproved(withFile), true);
  assert.equal(isApprovedWithoutFile({ status: 'pending' }), false);
});

test('counter: total = every document, approved = approved with a file', () => {
  const docs = [
    { status: 'approved' },
    { status: 'approved', file_url: 'f1' },
    { status: 'uploaded', file_url: 'f2' },
    { status: 'pending' },
    { status: 'rejected', file_url: 'f3' },
  ];
  assert.deepEqual(documentCounts(docs), { total: 5, approved: 1 });
  assert.deepEqual(documentCounts([]), { total: 0, approved: 0 });
  assert.deepEqual(documentCounts(undefined), { total: 0, approved: 0 });
});

test('default document list starts as pending, passport included', () => {
  const list = defaultDocumentList(['P', 'C', 'R', 'H', 'A']);
  assert.deepEqual(list.map((d) => d.id), ['1', '2', '3', '4', '5']);
  assert.ok(list.every((d) => d.status === 'pending'));
  assert.equal(list[0].name, 'P');
});

test('staff detail page: no default approval, no certificate inputs, video title', () => {
  const page = readFileSync(join(ROOT, 'app/portal/candidates/[id]/page.tsx'), 'utf8');
  assert.equal(/passport_number \? 'approved'/.test(page), false);
  assert.equal(/certificate_no|issuing_body/.test(page.replace(/^\s*\/\/.*$/gm, '')), false);
  assert.equal(/setCertificateNo|setIssuingBody|certNoPh|issuerPh|professionalEvaluationCertificate/.test(page), false);
  assert.ok(page.includes('t.videoIntroductionTitle'));
  assert.ok(page.includes('<CandidateYouTubeEditor'));
  assert.ok(page.includes('disabled={!canApproveDocument(doc)}'));
});

test('new texts exist in five languages, translated; removed keys are gone', () => {
  const keys = ['docApproveNeedsFile', 'docNoFileWarning', 'videoIntroductionTitle'] as const;
  for (const lang of LANGS) {
    for (const key of keys) {
      assert.ok(translations[lang][key]?.trim(), `${lang}.${key}`);
      if (lang !== 'en') assert.notEqual(translations[lang][key], translations.en[key], `${lang}.${key} is still English`);
    }
    const dict = translations[lang] as Record<string, unknown>;
    const ui = portalUi[lang] as unknown as Record<string, unknown>;
    assert.equal('professionalEvaluationCertificate' in dict, false);
    assert.equal('certificateInfo' in dict, false);
    assert.equal('certNoPh' in ui, false);
    assert.equal('issuerPh' in ui, false);
  }
});
