import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import {
  canApproveDocument,
  canPickDocumentStatus,
  DOC_SLOT_TYPES,
  documentCounts,
  documentTypeTitle,
  hasDocumentFile,
  hasOpenRequest,
  isApprovedWithoutFile,
  isDocumentApproved,
  isRlsDenied,
  keepDocumentsJson,
  mergeDocumentSlots,
  REQUESTABLE_DOC_TYPES,
  uploadTargetRow,
  type CandidateDocumentRow,
} from './candidateDocuments.ts';
import { translations } from './dictionary.ts';
import { portalUi } from './portal-ui-copy.ts';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);
const { candidateDocumentTitle } = await import('./candidateLabels.ts');

const ROOT = join(import.meta.dirname, '..');
const LANGS = ['tr', 'en', 'sq', 'ar', 'mk'] as const;

const row = (id: string, doc_type: string, status: string, extra: Partial<CandidateDocumentRow> = {}): CandidateDocumentRow => ({
  id, doc_type, status, created_at: `2026-11-${String(10 + Number(id.replace(/\D/g, '') || 0)).padStart(2, '0')}T00:00:00Z`, ...extra,
});

test('a document without a file cannot be approved or put under review', () => {
  assert.equal(hasDocumentFile({ file_url: '' }), false);
  assert.equal(hasDocumentFile({ file_url: '   ' }), false);
  assert.equal(hasDocumentFile({}), false);
  assert.equal(canApproveDocument({ status: 'pending' }), false);
  for (const status of ['approved', 'reviewing']) {
    assert.equal(canPickDocumentStatus(status, { file_url: null }), false, status);
    assert.equal(canPickDocumentStatus(status, { file_url: 'storage:candidate-files/c/p/1.pdf' }), true, status);
  }
  for (const status of ['pending', 'uploaded', 'rejected', 'rerequested', 'expiring', 'expired']) {
    assert.equal(canPickDocumentStatus(status, { file_url: null }), true, status);
  }
});

test('approved without a file is flagged and not counted', () => {
  assert.equal(isApprovedWithoutFile({ status: 'approved' }), true);
  assert.equal(isDocumentApproved({ status: 'approved' }), false);
  assert.equal(isDocumentApproved({ status: 'approved', file_url: 'f' }), true);
});

test('five slots always show; extra and older rows follow; every row once', () => {
  assert.deepEqual([...DOC_SLOT_TYPES], ['passport', 'certificate', 'criminal_record', 'health_report', 'apostille']);
  const empty = mergeDocumentSlots([]);
  assert.equal(empty.length, 5);
  assert.ok(empty.every((item) => item.row === null && item.status === null && item.slot));
  assert.deepEqual(empty.map((i) => i.docType), [...DOC_SLOT_TYPES]);

  const rows = [
    row('r1', 'passport', 'approved', { file_url: 'f1' }),
    row('r2', 'passport', 'uploaded', { file_url: 'f2' }), // newer passport
    row('r3', 'photo', 'pending'),
    row('r4', 'health_report', 'approved'), // no file
  ];
  const items = mergeDocumentSlots(rows);
  assert.equal(items.length, 7); // 5 slots + photo + older passport
  assert.equal(items[0].row?.id, 'r2');
  assert.equal(items[3].row?.id, 'r4');
  assert.equal(items[1].row, null);
  assert.deepEqual(items.slice(5).map((i) => i.row?.id), ['r3', 'r1']);
  const ids = items.filter((i) => i.row).map((i) => i.row!.id).sort();
  assert.deepEqual(ids, ['r1', 'r2', 'r3', 'r4']);
});

test('summary counter is the list: total = all lines, approved = approved with a file', () => {
  const items = mergeDocumentSlots([
    row('r1', 'passport', 'approved', { file_url: 'f1' }),
    row('r4', 'health_report', 'approved'),
    row('r3', 'photo', 'pending'),
  ]);
  const counts = documentCounts(items.map((i) => ({ status: i.status, file_url: i.file_url })));
  assert.deepEqual(counts, { total: 6, approved: 1 });
  // no rows at all: still 0/5, never 0/0 or 0/1
  assert.deepEqual(documentCounts(mergeDocumentSlots([]).map((i) => ({ status: i.status, file_url: i.file_url }))), { total: 5, approved: 0 });
});

test('upload overwrites an open row of that type (candidate flow), else adds one', () => {
  const rows = [
    row('r1', 'passport', 'approved', { file_url: 'f1' }),
    row('r2', 'passport', 'rerequested'),
    row('r3', 'cv', 'reviewing', { file_url: 'f3' }),
  ];
  assert.equal(uploadTargetRow(rows, 'passport')?.id, 'r2');
  assert.equal(uploadTargetRow(rows, 'cv'), null); // reviewing stays; a new row is added
  assert.equal(uploadTargetRow(rows, 'apostille'), null);
  for (const status of ['pending', 'uploaded', 'rerequested', 'rejected']) {
    assert.equal(uploadTargetRow([row('x1', 'photo', status)], 'photo')?.id, 'x1', status);
  }
});

test('"+ Request" is not repeated for an open request of the same type', () => {
  const rows = [row('r1', 'photo', 'pending'), row('r2', 'cv', 'approved', { file_url: 'f' }), row('r3', 'diploma', 'rerequested')];
  assert.equal(hasOpenRequest(rows, 'photo'), true);
  assert.equal(hasOpenRequest(rows, 'diploma'), true);
  assert.equal(hasOpenRequest(rows, 'cv'), false);
  assert.equal(hasOpenRequest(rows, 'passport'), false);
  assert.ok((REQUESTABLE_DOC_TYPES as readonly string[]).includes('photo'));
});

test('titles come from doc_type and match the candidate page in every language', () => {
  const slotIds = ['1', '2', '3', '4', '5'];
  for (const lang of LANGS) {
    const t = translations[lang];
    const ui = portalUi[lang];
    DOC_SLOT_TYPES.forEach((type, i) => {
      assert.equal(documentTypeTitle(type, t, ui.docTypes), candidateDocumentTitle({ id: slotIds[i] }, t), `${lang} ${type}`);
    });
    assert.equal(documentTypeTitle('photo', t, ui.docTypes), ui.docTypes.photo);
    assert.equal(documentTypeTitle('unknown_type', t, ui.docTypes), ui.docTypes.other);
  }
});

test('documents_json keeps closure_meta, profile_meta and the old docs exactly', () => {
  const stored = JSON.stringify({
    docs: [{ id: '1', file_url: 'data:application/pdf;base64,AA' }],
    profile_meta: { emergency_name: 'A', emergency_phone: '1' },
    closure_meta: { is_closed: true, closure_reason: 'x' },
    other: 5,
  });
  const out = JSON.parse(keepDocumentsJson(stored, { is_closed: false, closure_reason: '' }));
  assert.deepEqual(out, JSON.parse(stored));
  const fresh = JSON.parse(keepDocumentsJson(JSON.stringify({ profile_meta: { emergency_name: 'B' } }), { is_closed: true, closure_reason: 'r' }));
  assert.deepEqual(fresh, { closure_meta: { is_closed: true, closure_reason: 'r' }, profile_meta: { emergency_name: 'B' } });
  assert.equal('docs' in fresh, false);
  assert.deepEqual(JSON.parse(keepDocumentsJson(JSON.stringify([{ id: '1' }]), { is_closed: false, closure_reason: '' })).docs, [{ id: '1' }]);
  assert.deepEqual(JSON.parse(keepDocumentsJson(null, { is_closed: false, closure_reason: '' })), { closure_meta: { is_closed: false, closure_reason: '' } });
});

test('RLS refusals are told apart from other errors', () => {
  assert.equal(isRlsDenied({ code: '42501', message: 'x' }), true);
  assert.equal(isRlsDenied({ message: 'new row violates row-level security policy for table "candidate_documents"' }), true);
  assert.equal(isRlsDenied({ statusCode: '403', message: 'Unauthorized' }), true);
  assert.equal(isRlsDenied({ code: '23514', message: 'document_data_url_rejected' }), false);
  assert.equal(isRlsDenied(new Error('network down')), false);
  assert.equal(isRlsDenied(null), false);
});

test('staff page: one list from candidate_documents, no base64 upload, no free-text add', () => {
  const page = readFileSync(join(ROOT, 'app/portal/candidates/[id]/page.tsx'), 'utf8');
  const list = readFileSync(join(ROOT, 'components/portal/CandidateDocumentsPanel.tsx'), 'utf8');
  const card = readFileSync(join(ROOT, 'components/portal/DocumentStatusPanel.tsx'), 'utf8');
  const actions = readFileSync(join(ROOT, 'lib/candidateDocumentActions.ts'), 'utf8');
  assert.equal(/readAsDataURL[\s\S]{0,200}doc|handleFileUpload|handleAddDocument|newDocName|hasTableDocs|legacyDocs|docs: documents/.test(page), false);
  assert.ok(page.includes('mergeDocumentSlots(docs.rows)'));
  assert.ok(page.includes('<CandidateDocumentsPanel'));
  assert.ok(page.includes('items={docItems}'));
  assert.equal(card.includes("from('candidate_documents')"), false, 'the card reads the shared rows, not its own query');
  assert.ok(list.includes('uploadStaffDocument('));
  assert.ok(actions.includes('uploadCandidateFile(') && actions.includes('validateUpload('));
  assert.equal(/readAsDataURL|['"`]data:/.test(actions), false);
  assert.ok(list.includes('allowed={canDelete}'));
  assert.equal(/passport_number \? 'approved'/.test(page), false);
  assert.equal(/certificate_no|issuing_body/.test(page.replace(/^\s*\/\/.*$/gm, '')), false);
  assert.ok(page.includes('t.videoIntroductionTitle'));
  assert.ok(page.includes('<CandidateYouTubeEditor'));
});

test('texts exist in five languages, translated; removed keys are gone', () => {
  const keys = [
    'docApproveNeedsFile', 'docNoFileWarning', 'docNoFileShort', 'docNotRequested', 'docNoPermission',
    'docAlreadyRequested', 'docSaved', 'docSaveFailed', 'docUploadedOk', 'docRequestedOk', 'videoIntroductionTitle',
  ] as const;
  for (const lang of LANGS) {
    for (const key of keys) {
      assert.ok(translations[lang][key]?.trim(), `${lang}.${key}`);
      if (lang !== 'en') assert.notEqual(translations[lang][key], translations.en[key], `${lang}.${key} is still English`);
    }
    const dict = translations[lang] as Record<string, unknown>;
    const ui = portalUi[lang] as unknown as Record<string, unknown>;
    for (const gone of ['professionalEvaluationCertificate', 'certificateInfo', 'newDocNamePlaceholder']) assert.equal(gone in dict, false, gone);
    assert.equal('certNoPh' in ui, false);
    assert.equal('issuerPh' in ui, false);
  }
});
