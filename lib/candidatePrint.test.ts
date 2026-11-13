import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { documentPrintRows, offerPrint } from './candidatePrint.ts';

const page = readFileSync(new URL('../app/candidate/page.tsx', import.meta.url), 'utf8');
const view = readFileSync(new URL('../components/candidate/CandidatePrintView.tsx', import.meta.url), 'utf8');

test('offer print is a whitelist of one offer', () => {
  const out = offerPrint(
    {
      id: 'SECRET-ID',
      candidate_id: 'SECRET-CAND',
      employer_name: 'Demo GmbH',
      position_title: 'Welder',
      monthly_net_salary: 2000,
      start_date: '2026-12-01T00:00:00Z',
      terms_details: 'Housing included',
      status: 'pending',
      internal_notes: 'SECRET',
    },
    { position: () => 'Kaynakçı', salary: () => '2.000 EUR', status: () => 'Bekliyor' },
  );
  assert.deepEqual(Object.keys(out).sort(), ['employer', 'position', 'salary', 'startDate', 'status', 'terms']);
  assert.equal(out.startDate, '2026-12-01');
  assert.equal(out.employer, 'Demo GmbH');
  assert.ok(!JSON.stringify(out).includes('SECRET'));
});

test('document print rows never carry the file', () => {
  const rows = documentPrintRows(
    [
      { id: 'SECRET-ID', document_type: 'passport', status: 'rejected', notes: 'pasaport.pdf', review_note: 'Okunmuyor', file_url: 'https://SECRET/x.pdf' },
      { id: 'SECRET-2', document_type: 'cv', status: 'pending', notes: null, review_note: null },
    ],
    { title: (d) => String(d.document_type), status: (d) => String(d.status) },
  );
  assert.equal(rows.length, 2);
  for (const row of rows) assert.deepEqual(Object.keys(row).sort(), ['fileName', 'reviewNote', 'status', 'title']);
  assert.equal(rows[0].fileName, 'pasaport.pdf');
  assert.equal(rows[0].reviewNote, 'Okunmuyor');
  assert.equal(rows[1].fileName, '');
  assert.ok(!JSON.stringify(rows).includes('SECRET'));
});

test('print view shows only on paper and embeds no file', () => {
  assert.match(view, /hidden print:block/);
  assert.doesNotMatch(view, /<iframe|<object|<embed|<img|file_url/);
});

test('candidate page hides everything else when printing', () => {
  assert.match(page, /min-h-screen bg-slate-50[^`]*\$\{printTarget \? 'print:hidden ' : ''\}/);
  assert.match(page, /<CandidatePrintView/);
  assert.match(page, /kind: 'offer'/);
  assert.match(page, /kind: 'documents'/);
  assert.match(page, /window\.print\(\)/);
  assert.match(page, /afterprint/);
});

test('print texts exist in five languages', () => {
  for (const key of ['printDocsBtn', 'printOfferTitle', 'printedAt', 'printCandidate', 'printDocColumn']) {
    const count = page.split(`      ${key}: '`).length - 1;
    assert.equal(count, 5, key);
  }
});
