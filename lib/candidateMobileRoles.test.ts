import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const { linkCandidateAccount } = await import('./candidateLink.ts');
const { filePickerCopy } = await import('./file-picker-copy.ts');
const { portalUi } = await import('./portal-ui-copy.ts');
const { translations } = await import('./dictionary.ts');
const { guidesCopy } = await import('./guides-copy.ts');
const {
  CANDIDATE_FILE_CONTROLS, candidateFileAccess, canAssignCandidate, canWriteInterviewOffer, isPermissionError,
} = await import('./staffAccess.ts');

const ROOT = join(import.meta.dirname, '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');
const LANGS = ['tr', 'en', 'sq', 'ar', 'mk'] as const;

// --- A5: link_my_candidate ---------------------------------------------------

test('an already linked candidate is used without calling link_my_candidate', async () => {
  let rpcCalls = 0;
  const result = await linkCandidateAccount({
    findOwnCandidateId: async () => 'cand-1',
    callLinkRpc: async () => {
      rpcCalls += 1;
      return { data: null, error: { message: 'should not run' } };
    },
  });
  assert.deepEqual(result, { ok: true, id: 'cand-1', via: 'existing' });
  assert.equal(rpcCalls, 0);
});

test('a candidate without a row still goes through link_my_candidate', async () => {
  let rpcCalls = 0;
  const linked = await linkCandidateAccount({
    findOwnCandidateId: async () => null,
    callLinkRpc: async () => {
      rpcCalls += 1;
      return { data: 'cand-new', error: null };
    },
  });
  assert.deepEqual(linked, { ok: true, id: 'cand-new', via: 'rpc' });
  assert.equal(rpcCalls, 1);

  const phone = await linkCandidateAccount({
    findOwnCandidateId: async () => null,
    callLinkRpc: async () => ({ data: null, error: { message: 'Candidate phone already used' } }),
  });
  assert.deepEqual(phone, { ok: false, failure: 'phone' });

  // a failing lookup falls back to the RPC instead of blocking sign-in
  const fallback = await linkCandidateAccount({
    findOwnCandidateId: async () => {
      throw new Error('network');
    },
    callLinkRpc: async () => ({ data: 'cand-2', error: null }),
  });
  assert.deepEqual(fallback, { ok: true, id: 'cand-2', via: 'rpc' });
});

test('linkMyCandidate reads the own row first (auth_user_id) and keeps the RPC for new accounts', () => {
  const auth = read('lib/auth.ts');
  assert.match(auth, /linkCandidateAccount\(/);
  assert.match(auth, /\.eq\('auth_user_id', uid\)/);
  assert.match(auth, /rpc\('link_my_candidate'\)/);
});

// --- A1–A4: candidate portal on phones ---------------------------------------

test('file picker texts exist in five languages and differ from Turkish', () => {
  for (const lang of LANGS) {
    assert.ok(filePickerCopy[lang].choose.trim() && filePickerCopy[lang].none.trim(), lang);
  }
  for (const lang of ['en', 'sq', 'ar', 'mk'] as const) {
    assert.notEqual(filePickerCopy[lang].choose, filePickerCopy.tr.choose, lang);
    assert.notEqual(filePickerCopy[lang].none, filePickerCopy.tr.none, lang);
  }
});

test('native file boxes are replaced by the translated picker', () => {
  const picker = read('components/site/FilePicker.tsx');
  assert.match(picker, /type="file"/);
  assert.match(picker, /className="sr-only"/, 'the real input stays focusable (not display:none)');
  assert.match(picker, /htmlFor=\{id\}/);
  assert.match(picker, /truncate/);
  assert.match(picker, /title=\{fileName \|\| undefined\}/);
  const candidate = read('app/candidate/page.tsx');
  assert.equal((candidate.match(/<FilePicker\b/g) || []).length, 2);
  assert.equal(/file:mr-|type="file"/.test(candidate), false, 'no browser file box left on the candidate page');
  const employer = read('app/employer/page.tsx');
  assert.match(employer, /<FilePicker lang=\{currentLang\} accept="image\/\*"/);
  assert.equal(/file:mr-/.test(employer), false);
  const staffFile = read('app/portal/candidates/[id]/page.tsx');
  assert.equal(staffFile.includes('className="hidden"'), false, 'the staff photo input is reachable by keyboard');
});

test('tab strip wraps, candidate code stays on one line', () => {
  const candidate = read('app/candidate/page.tsx');
  assert.ok(candidate.includes('<div className="flex flex-wrap items-center gap-2 border-b pb-3 text-xs font-bold">'));
  assert.equal(candidate.includes('overflow-x-auto whitespace-nowrap text-xs font-bold scrollbar-none'), false);
  assert.match(candidate, /className="font-mono whitespace-nowrap[^"]*">PNV-CAND-/);
});

test('language menu flips to stay on screen (both directions)', () => {
  const switcher = read('components/site/LanguageSwitcher.tsx');
  assert.match(switcher, /align === 'end' \? 'end-0' : 'start-0'/);
  assert.match(switcher, /rect\.left < margin \|\| rect\.right > window\.innerWidth - margin/);
  assert.match(switcher, /max-w-\[calc\(100vw-1rem\)\]/);
});

// --- B: staff candidate file -------------------------------------------------

test('role -> candidate file controls follow the database rules', () => {
  const upper = candidateFileAccess('upper_management');
  const source = candidateFileAccess('source_country');
  const target = candidateFileAccess('target_country');
  const field = candidateFileAccess('field_officer');
  for (const access of [upper, source, target, field]) {
    assert.deepEqual(Object.keys(access), [...CANDIDATE_FILE_CONTROLS]);
    for (const control of ['profileContact', 'travel', 'documentsUpload', 'internalNotes', 'closure', 'notification'] as const) {
      assert.equal(access[control], 'edit', control);
    }
  }
  assert.equal(upper.documentsDelete, 'edit');
  assert.equal(upper.statusOverride, 'edit');
  for (const access of [source, target, field]) {
    assert.equal(access.documentsDelete, 'hidden');
    assert.equal(access.statusOverride, 'read');
  }
  for (const [role, access] of [['upper_management', upper], ['source_country', source], ['target_country', target]] as const) {
    assert.equal(access.interviewOffer, 'edit', role);
    assert.equal(access.jobOfferForm, 'edit', role);
    assert.equal(access.assignee, 'edit', role);
    assert.equal(canWriteInterviewOffer(role), true);
  }
  assert.equal(field.interviewOffer, 'hidden');
  assert.equal(field.jobOfferForm, 'hidden');
  assert.equal(field.assignee, 'read');
  for (const role of ['finance', 'limited', '', null]) {
    const access = candidateFileAccess(role);
    assert.ok(Object.values(access).every((value) => value === 'hidden'), String(role));
    assert.equal(canAssignCandidate(role), false);
  }
});

test('the candidate file and the list follow the role map', () => {
  const page = read('app/portal/candidates/[id]/page.tsx');
  assert.match(page, /const access = candidateFileAccess\(staffRole\);/);
  assert.match(page, /\{access\.jobOfferForm === 'edit' \? \(/);
  assert.match(page, /\{mayWriteInterviewOffer \? \(/);
  assert.match(page, /ui\.internalNotesStaff/);
  assert.equal(/alert\(error\.message\)/.test(page), false);
  assert.equal((page.match(/ui\.permissionDenied/g) || []).length >= 3, true);
  const list = read('components/portal/CandidatesTab.tsx');
  assert.match(list, /\{canAssign \? \(/);
  const portal = read('app/portal/page.tsx');
  assert.match(portal, /canAssign=\{canAssignCandidate\(userRole\)\}/);
  assert.match(portal, /isPermissionError\(error\) \? ui\.permissionDenied/);
});

test('permission errors are recognised and the message exists in five languages', () => {
  assert.equal(isPermissionError({ code: '42501', message: 'x' }), true);
  assert.equal(isPermissionError({ message: 'new row violates row-level security policy for table "job_offers"' }), true);
  assert.equal(isPermissionError({ message: 'permission denied for table job_candidates' }), true);
  assert.equal(isPermissionError({ message: 'duplicate key value violates unique constraint' }), false);
  assert.equal(isPermissionError(null), false);
  const seen = new Set<string>();
  for (const lang of LANGS) {
    const ui = portalUi[lang];
    for (const key of ['permissionDenied', 'internalNotesStaff', 'internalNotesHint'] as const) {
      assert.ok(ui[key].trim(), `${lang}.${key}`);
    }
    seen.add(ui.permissionDenied);
  }
  assert.equal(seen.size, LANGS.length, 'translated, not copied');
  assert.equal(/row-level|RLS|Postgres/i.test([...seen].join(' ')), false);
});

test('guides name the documents section like the portal, print title follows the language', () => {
  for (const lang of LANGS) {
    const label = translations[lang].documentTrackingMechanism as string;
    const text = JSON.stringify(guidesCopy[lang]);
    assert.ok(text.includes(`/portal/candidates/[id] → ${label}`), `${lang} where`);
    assert.ok(text.includes(`'${label}'`.replaceAll("'", '"')), `${lang} flow`);
  }
  const print = read('components/guides/GuidesPrintScreen.tsx');
  assert.match(print, /document\.title = copy\.print\.coverSubtitle;/);
});
