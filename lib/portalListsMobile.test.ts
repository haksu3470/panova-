import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { Language } from './dictionary.ts';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const { portalUi } = await import('./portal-ui-copy');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const LANGS: Language[] = ['tr', 'en', 'sq', 'ar', 'mk'];

test('candidate list: cards on phones, the table from sm', () => {
  const list = read('components/portal/CandidatesTab.tsx');
  // cards only below sm, table only from sm (inside the scroll box with edge fades)
  assert.match(list, /<div className="sm:hidden">[\s\S]*data-list="candidate-cards"/);
  assert.match(list, /<div className="hidden sm:block">\s*<ScrollTable>\s*<table/);
  const cards = list.slice(list.indexOf('data-list="candidate-cards"'), list.indexOf('<ScrollTable>'));
  // each card: name + demo badge, nationality, profession/sector, passport, status, code, open-file link
  for (const part of [
    '<DemoBadge show={candidate.is_demo} />',
    'candidatePlaceLabel(',
    'candidateProfessionLabel(',
    'candidateSectorLabel(',
    'candidatePassportLabel(',
    'statusControl(candidate)',
    'OfficialProcessBadge',
    'ui.referralCode',
    'deleteButton(candidate, code)',
    'assigneeControl(candidate)',
    'ui.openCandidateFile',
  ]) {
    assert.ok(cards.includes(part), `card is missing ${part}`);
  }
  // selection works on cards too: same handlers as the table
  assert.ok(cards.includes('onChange={() => handleSelectOne(candidate.id)}'));
  assert.match(list, /checked=\{allShownSelected\}\s*onChange=\{handleSelectAll\}[\s\S]*\{ui\.selectAllShown\}/);
  assert.equal((list.match(/checked=\{allShownSelected\}/g) || []).length, 2, 'select-all on cards and in the table');
});

test('register box: the long hint is in the box from sm and inside the form on phones', () => {
  const list = read('components/portal/CandidatesTab.tsx');
  assert.match(list, /<p className="hidden sm:block text-xs text-muted-foreground">\{registerHint\}<\/p>/);
  assert.match(list, /<form onSubmit=\{handleRegister\}[^>]*>\s*<p className="sm:hidden text-xs text-muted-foreground">\{registerHint\}<\/p>/);
  // the export buttons and the register button share one wrapping row
  assert.match(list, /<div className="flex flex-wrap items-center gap-2">\s*<ListExportBar/);
  assert.match(read('components/portal/ListExportBar.tsx'), /<div className="flex flex-wrap gap-2">/);
});

test('wide tables scroll with an edge fade; the audit table keeps its first column', () => {
  const box = read('components/portal/ScrollTable.tsx');
  assert.match(box, /Math\.abs\(el\.scrollLeft\)/, 'RTL scrollLeft is negative');
  assert.match(box, /new ResizeObserver\(update\)/);
  assert.match(box, /motion-reduce:transition-none/);
  assert.match(box, /\[&_tr>\*:first-child\]:sticky \[&_tr>\*:first-child\]:start-0/);
  assert.match(box, /end-0 bg-gradient-to-l rtl:bg-gradient-to-r/);
  const page = read('app/portal/page.tsx');
  assert.match(page, /<ScrollTable stickyFirstColumn>\s*<table className="w-full text-left rtl:text-right[^"]*\[&_td:first-child\]:min-w-\[10rem\]/);
  assert.equal(page.includes('<div className="overflow-x-auto">'), false, 'no bare scroll box left on the portal page');
});

test('staff cards wrap long names and e-mails instead of widening the page', () => {
  const staff = read('components/portal/StaffTab.tsx');
  assert.match(staff, /<h4 className="min-w-0 [^"]*\[overflow-wrap:anywhere\]">\{staff\.name\}/);
  assert.match(staff, /<p dir="ltr" className="[^"]*\[overflow-wrap:anywhere\][^"]*">\{staff\.email\}<\/p>/);
});

test('new list texts exist in five languages', () => {
  for (const lang of LANGS) {
    for (const key of ['openCandidateFile', 'selectAllShown'] as const) {
      assert.ok(portalUi[lang][key].trim(), `${lang}.${key}`);
    }
  }
  assert.equal(portalUi.tr.openCandidateFile, 'Dosyayı aç');
});
