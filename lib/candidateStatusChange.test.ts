import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import {
  CANDIDATE_STATUS_KEYS,
  candidateReasonErrorKey,
  candidateStatusErrorKey,
  candidateStatusLabel,
  isReasonErrorKey,
  normalizeCandidateStatus,
} from './candidateStatusChange.ts';
import { checkStatusReason, STATUS_REASON_MAX } from './requestStatusChange.ts';
import { translations } from './dictionary.ts';

const ROOT = join(import.meta.dirname, '..');
const LANGS = ['tr', 'en', 'sq', 'ar', 'mk'] as const;

test('only the four database statuses are offered', () => {
  assert.deepEqual([...CANDIDATE_STATUS_KEYS], ['pending', 'reviewing', 'visa_processing', 'approved']);
  assert.equal(normalizeCandidateStatus('VISA_PROCESSING'), 'visa_processing');
  assert.equal(normalizeCandidateStatus(null), 'pending');
  assert.equal(normalizeCandidateStatus('rejected'), 'pending');
});

test('reason must be 5..1000 characters after trimming', () => {
  assert.equal(checkStatusReason('  abcd  '), 'required');
  assert.equal(checkStatusReason('abcde'), 'ok');
  assert.equal(checkStatusReason('a'.repeat(STATUS_REASON_MAX + 1)), 'too_long');
  assert.equal(candidateReasonErrorKey(checkStatusReason('')), 'candStatusErrReasonRequired');
  assert.equal(candidateReasonErrorKey(checkStatusReason('a'.repeat(1001))), 'candStatusErrReasonTooLong');
  assert.equal(candidateReasonErrorKey('ok'), null);
});

test('reason boundaries: empty, 4, 5, 1000 and 1001 characters', () => {
  const cases: [string, string | null][] = [
    ['', 'candStatusErrReasonRequired'],
    ['     ', 'candStatusErrReasonRequired'],
    ['abcd', 'candStatusErrReasonRequired'],
    ['abcde', null],
    ['a'.repeat(1000), null],
    ['a'.repeat(1001), 'candStatusErrReasonTooLong'],
  ];
  for (const [reason, expected] of cases) {
    assert.equal(candidateReasonErrorKey(checkStatusReason(reason)), expected, `length ${reason.length}`);
  }
  assert.equal(isReasonErrorKey('candStatusErrReasonRequired'), true);
  assert.equal(isReasonErrorKey('candStatusErrReasonTooLong'), true);
  assert.equal(isReasonErrorKey('candStatusErrVisaOffer'), false);
  assert.equal(isReasonErrorKey(null), false);
});

test('Save is not disabled by the reason; the error is written, linked and focused', () => {
  const src = readFileSync(join(ROOT, 'components/portal/CandidateStatusControl.tsx'), 'utf8');
  assert.match(src, /onClick=\{submit\}\s*disabled=\{busy\}/);
  assert.equal(/disabled=\{[^}]*check/.test(src), false);
  assert.ok(src.includes("aria-invalid={reasonError ? 'true' : 'false'}"));
  assert.ok(src.includes('aria-describedby={reasonError ? `${reasonErrorId} ${hintId}` : hintId}'));
  assert.ok(src.includes('id={reasonErrorId}'));
  assert.ok(src.includes('reasonRef.current?.focus()'));
});

test('every RPC error code maps to its own message, others to the generic one', () => {
  const cases: [string, string][] = [
    ['candidate_status_use_rpc', 'candStatusErrUseRpc'],
    ['staff_role_not_allowed', 'candStatusErrRole'],
    ['invalid_status', 'candStatusErrInvalid'],
    ['status_reason_required', 'candStatusErrReasonRequired'],
    ['status_reason_too_long', 'candStatusErrReasonTooLong'],
    ['visa_requires_accepted_offer', 'candStatusErrVisaOffer'],
    ['candidate_not_found', 'candStatusErrNotFound'],
  ];
  for (const [code, key] of cases) {
    assert.equal(candidateStatusErrorKey({ message: `ERROR: ${code}` }), key);
  }
  assert.equal(candidateStatusErrorKey('candidate_not_found'), 'candStatusErrNotFound');
  assert.equal(candidateStatusErrorKey({ message: 'network down' }), 'candStatusErrGeneric');
  assert.equal(candidateStatusErrorKey(null), 'candStatusErrGeneric');
});

test('candidate status texts exist in all five languages and are translated', () => {
  const keys = [
    'candStatusManualBtn', 'candStatusChangedOk', 'candStatusErrUseRpc', 'candStatusErrRole',
    'candStatusErrInvalid', 'candStatusErrReasonRequired', 'candStatusErrReasonTooLong',
    'candStatusErrVisaOffer', 'candStatusErrNotFound', 'candStatusErrGeneric',
    'officialProcessHint', 'statusReasonLabel', 'statusReasonHint', 'statusCancelBtn', 'saveBtn',
  ] as const;
  for (const lang of LANGS) {
    for (const key of keys) assert.ok(translations[lang][key]?.trim(), `${lang}.${key}`);
    if (lang === 'en') continue;
    for (const key of keys) {
      if (key === 'saveBtn') continue;
      assert.notEqual(translations[lang][key], translations.en[key], `${lang}.${key} is still English`);
    }
  }
  assert.equal(candidateStatusLabel(translations.tr, 'approved'), `🟢 ${translations.tr.approvedStatus}`);
});

test('the portal no longer writes job_candidates.status directly', () => {
  const portal = readFileSync(join(ROOT, 'app/portal/page.tsx'), 'utf8');
  const detail = readFileSync(join(ROOT, 'app/portal/candidates/[id]/page.tsx'), 'utf8');
  const service = readFileSync(join(ROOT, 'lib/services/candidateService.ts'), 'utf8');
  assert.equal(/from\('job_candidates'\)\s*\.update\(\{\s*status/.test(portal + service), false);
  assert.equal(/\.update\(\{\s*status\s*\}\)/.test(service), false);
  assert.equal(/^\s*status:\s*status,/m.test(detail), false);
  assert.ok(service.includes("rpc('staff_set_candidate_status'"));
});
