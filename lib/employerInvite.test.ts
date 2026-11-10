import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import test from 'node:test';

register(new URL('./email/resolve-at.mjs', import.meta.url).href, import.meta.url);

const {
  EMPLOYER_INVITE_COOLDOWN_SECONDS,
  canInviteEmployer,
  countryKey,
  employerInviteLocale,
  employerLoginUrl,
  employerPasswordSetupUrl,
  isSafeActionLink,
  needsEmployerConsent,
  parseInviteFailure,
} = await import('./employerInvite.ts');

test('country scope matches the staff read-scope aliases', () => {
  assert.equal(countryKey(' Türkiye '), 'turkey');
  assert.equal(countryKey('Kuzey Makedonya'), 'north macedonia');
  assert.equal(countryKey('North Macedonia'), 'north macedonia');
  assert.equal(countryKey(''), null);
  assert.equal(canInviteEmployer({ role: 'upper_management', scopeCountry: null, employerCountry: 'Germany' }), true);
  assert.equal(canInviteEmployer({
    role: 'target_country',
    scopeCountry: 'North Macedonia',
    employerCountry: 'Kuzey Makedonya',
  }), true);
  assert.equal(canInviteEmployer({
    role: 'target_country',
    scopeCountry: 'Turkey',
    employerCountry: 'North Macedonia',
  }), false);
  assert.equal(canInviteEmployer({ role: 'target_country', scopeCountry: null, employerCountry: 'Turkey' }), false);
  assert.equal(canInviteEmployer({ role: 'source_country', scopeCountry: 'Turkey', employerCountry: 'Turkey' }), false);
  assert.equal(canInviteEmployer({ role: 'field_officer', scopeCountry: 'Turkey', employerCountry: 'Turkey' }), false);
});

test('invitation links stay on the employer set-password path', () => {
  assert.equal(employerPasswordSetupUrl('https://panovagroup.org/'), 'https://panovagroup.org/auth/reset-password/employer');
  assert.equal(employerPasswordSetupUrl('https://panovagroup.org').includes('?'), false);
  assert.equal(employerLoginUrl('https://panovagroup.org'), 'https://panovagroup.org/employer-login');
  assert.equal(employerInviteLocale(null), 'tr');
  assert.equal(employerInviteLocale('mk'), 'mk');
  assert.equal(employerInviteLocale('fr'), 'tr');
  assert.equal(isSafeActionLink('https://vptcihlhkzfmwxpaituf.supabase.co/auth/v1/verify?token=abc&type=invite'), true);
  assert.equal(isSafeActionLink('javascript:alert(1)'), false);
  assert.equal(isSafeActionLink('http://panovagroup.org/auth/reset-password/employer'), false);
});

test('an invited employer without consent is stopped on first entry', () => {
  assert.equal(needsEmployerConsent({ invited_at: '2026-11-10T00:00:00Z', kvkk_accepted_at: null }), true);
  assert.equal(needsEmployerConsent({ invited_at: '2026-11-10T00:00:00Z', kvkk_accepted_at: '2026-11-10T01:00:00Z' }), false);
  assert.equal(needsEmployerConsent({ invited_at: null, kvkk_accepted_at: null }), false);
  assert.equal(needsEmployerConsent(null), false);
});

test('database errors become stable invite codes', () => {
  assert.deepEqual(parseInviteFailure('employer_invite_forbidden'), { code: 'forbidden' });
  assert.deepEqual(parseInviteFailure('staff_account'), { code: 'staff_account' });
  assert.deepEqual(parseInviteFailure('email_linked_elsewhere'), { code: 'email_linked_elsewhere' });
  assert.deepEqual(parseInviteFailure('account_other_role'), { code: 'account_other_role' });
  assert.deepEqual(parseInviteFailure('employer_email_missing'), { code: 'employer_email_missing' });
  assert.deepEqual(parseInviteFailure('invite_cooldown', '45'), { code: 'invite_cooldown', retryAfterSeconds: 45 });
  assert.deepEqual(parseInviteFailure('invite_cooldown', ''), {
    code: 'invite_cooldown',
    retryAfterSeconds: EMPLOYER_INVITE_COOLDOWN_SECONDS,
  });
  assert.equal(parseInviteFailure('syntax error at or near').code, 'failed');
});

test('the migration refuses staff conversion and keeps the consent and cooldown gates', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261110140000_employer_login_invite.sql', import.meta.url), 'utf8');
  assert.match(sql, /raise exception 'staff_account'/);
  assert.match(sql, /raise exception 'email_linked_elsewhere'/);
  assert.match(sql, /raise exception 'account_other_role'/);
  assert.match(sql, /raise exception 'invite_cooldown'/);
  assert.match(sql, /staff_can_read_employer/);
  assert.match(sql, /record_my_employer_consent/);
  assert.match(sql, /invited_employer_id/);
  assert.match(sql, /where public\.profiles\.role is distinct from 'staff'/);
  assert.match(sql, /set role = 'staff'/);
  assert.match(sql, /interval '2 minutes'/);
  assert.equal(sql.includes('apply_migration'), false);
});
