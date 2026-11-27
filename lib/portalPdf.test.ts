import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);
const { nextSort, sortRows } = await import('./tableSort.ts');
const { pageBreaks } = await import('./pdfExport.ts');
const { profilePrintFields, PROFILE_PRINT_FIELDS } = await import('./candidatePrint.ts');
const { PRINT_CONTACT_LINE, printPageCss } = await import('./printLetterhead.ts');

const src = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('sortable headings: first click ascending, second descending, empty last, numbers in order', () => {
  let state = nextSort(null, 'exp');
  assert.deepEqual(state, { key: 'exp', dir: 'asc' });
  state = nextSort(state, 'exp');
  assert.deepEqual(state, { key: 'exp', dir: 'desc' });
  assert.deepEqual(nextSort(state, 'name'), { key: 'name', dir: 'asc' });
  const rows = [{ n: 'b10', e: 2 }, { n: '', e: null }, { n: 'b2', e: 10 }, { n: 'Ä', e: 0 }];
  const get = (row: { n: string; e: number | null }, key: string) => (key === 'n' ? row.n : row.e);
  assert.deepEqual(sortRows(rows, { key: 'e', dir: 'asc' }, get).map((r) => r.e), [0, 2, 10, null]);
  assert.deepEqual(sortRows(rows, { key: 'e', dir: 'desc' }, get).map((r) => r.e), [10, 2, 0, null]);
  assert.deepEqual(sortRows(rows, { key: 'n', dir: 'asc' }, get, 'en').map((r) => r.n), ['Ä', 'b2', 'b10', '']);
  assert.equal(sortRows(rows, null, get)[0], rows[0], 'no sort keeps the order');
});

test('PDF pages cut at row bottoms, never past the page', () => {
  assert.deepEqual(pageBreaks(500, 1000, []), [], 'one page');
  assert.deepEqual(pageBreaks(2500, 1000, [300, 980, 1010, 1900, 2400]), [980, 1900]);
  assert.deepEqual(pageBreaks(2100, 1000, [100]), [1000, 2000], 'hard cut when no row ends in the lower half');
});

test('footer: contact line and page numbers on every printed page', () => {
  assert.equal(PRINT_CONTACT_LINE, 'panova@panovagroup.org · +389 70 385 792 · panovagroup.org');
  assert.match(printPageCss('A4'), /@bottom-right \{ content: counter\(page\) " \/ " counter\(pages\)/);
  assert.ok(src('components/candidate/CandidatePrintView.tsx').includes("printPageCss('A4')"));
  assert.ok(src('lib/pdfExport.ts').includes('pdf.text(PRINT_CONTACT_LINE'), 'PDF pages carry the same line');
});

test('profile summary is a whitelist of the candidate\'s own fields', () => {
  const labels = Object.fromEntries(PROFILE_PRINT_FIELDS.map((k) => [k, k.toUpperCase()])) as Record<(typeof PROFILE_PRINT_FIELDS)[number], string>;
  const fields = profilePrintFields(
    { full_name: 'Demo Aday', passport_number: 'u123', phone: '+389', email: 'a@b.c', profession: 'welder', sector: 'construction', nationality: 'Bangladesh', panova_notes: 'SECRET', referral_code: 'SECRET', internal_notes: 'SECRET' },
    { name: ' Ana ', relation: 'Anne', phone: '+880' },
    labels,
    { profession: (v) => `P:${v}`, sector: (v) => `S:${v}`, nationality: (v) => `N:${v}` },
  );
  assert.deepEqual(fields.map(([l]) => l), PROFILE_PRINT_FIELDS.map((k) => k.toUpperCase()));
  assert.equal(/SECRET/.test(JSON.stringify(fields)), false);
  assert.deepEqual(fields.find(([l]) => l === 'PASSPORT_NUMBER'), ['PASSPORT_NUMBER', 'U123']);
  assert.deepEqual(fields.find(([l]) => l === 'EMERGENCY_NAME'), ['EMERGENCY_NAME', 'Ana']);
});

test('phones get "Download / share PDF" in place of Print, on both portals', () => {
  assert.ok(src('components/portal/ListExportBar.tsx').includes('pdfMode ? printLabels[lang].pdfShare : labels.print'));
  const candidate = src('app/candidate/page.tsx');
  assert.ok(candidate.includes('sheetToPdf(sheet') && candidate.includes("kind: 'profile'"));
  const browser = src('app/employer/components/EmployerCandidateBrowser.tsx');
  assert.ok(browser.includes("sortTh('name'") && browser.includes('renderExport(filtered)'));
  assert.ok(src('app/employer/page.tsx').includes("exportBar('proposed-candidates'"));
});
