import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

register(new URL('./email/resolve-at.mjs', import.meta.url).href, import.meta.url);

const { translations } = await import('./dictionary.ts');
const {
  isUnknownUserResetError,
  parseResetAudience,
  passwordResetIssue,
  readRecoveryLocation,
  recoveryProofFromInput,
  resetRedirectUrl,
  resetReturnPath,
  shouldOfferPasswordReset,
} = await import('./passwordReset.ts');

type Language = 'tr' | 'en' | 'sq' | 'ar' | 'mk';

const LOCALES: Language[] = ['tr', 'en', 'sq', 'ar', 'mk'];
const COPY_KEYS = [
  'forgotPassword',
  'forgotPasswordTitle',
  'forgotPasswordLead',
  'forgotPasswordGoogle',
  'forgotPasswordSend',
  'forgotPasswordSentTitle',
  'forgotPasswordSent',
  'forgotPasswordFail',
  'forgotPasswordHaveCode',
  'resetPasswordTitle',
  'resetPasswordLead',
  'resetPasswordProveLead',
  'resetPasswordChecking',
  'resetPasswordCode',
  'resetPasswordCodeBtn',
  'resetPasswordCodeFail',
  'resetPasswordNew',
  'resetPasswordConfirm',
  'resetPasswordSave',
  'resetPasswordSaved',
  'resetPasswordMismatch',
  'resetPasswordFail',
  'resetPasswordLinkError',
  'resetPasswordGoogle',
  'resetPasswordContinue',
] as const;

test('reset links stay on the three password portals', () => {
  assert.equal(parseResetAudience('candidate'), 'candidate');
  assert.equal(parseResetAudience('employer'), 'employer');
  assert.equal(parseResetAudience('portal'), 'portal');
  assert.equal(parseResetAudience('admin'), null);
  assert.equal(parseResetAudience('../candidate'), null);
  assert.equal(resetReturnPath('candidate'), '/candidate');
  assert.equal(resetReturnPath('employer'), '/employer-login');
  assert.equal(resetReturnPath('portal'), '/portal');
  assert.equal(resetReturnPath(null), '/candidate');
  assert.equal(
    resetRedirectUrl('https://panovagroup.org/', 'employer'),
    'https://panovagroup.org/auth/reset-password/employer',
  );
  assert.equal(resetRedirectUrl('http://localhost:3000', 'portal').includes('?'), false);
});

test('a new password must be eight characters and match', () => {
  assert.equal(passwordResetIssue('short', 'short'), 'short');
  assert.equal(passwordResetIssue('longenough', 'different'), 'mismatch');
  assert.equal(passwordResetIssue('longenough', 'longenough'), null);
});

test('google-only accounts skip the new-password form', () => {
  assert.equal(shouldOfferPasswordReset(null), true);
  assert.equal(
    shouldOfferPasswordReset({ app_metadata: { provider: 'email', providers: ['email'] }, identities: [{ provider: 'email' }] }),
    true,
  );
  assert.equal(
    shouldOfferPasswordReset({ app_metadata: { provider: 'google', providers: ['google'] }, identities: [{ provider: 'google' }] }),
    false,
  );
  assert.equal(
    shouldOfferPasswordReset({
      app_metadata: { provider: 'google', providers: ['google', 'email'] },
      identities: [{ provider: 'google' }, { provider: 'email' }],
    }),
    true,
  );
  assert.equal(shouldOfferPasswordReset({ app_metadata: { provider: 'google' } }), true);
  assert.equal(shouldOfferPasswordReset({ app_metadata: { provider: 'google', providers: ['google'] } }), false);
});

test('recovery callbacks are recognized and other auth links are not', () => {
  assert.deepEqual(
    readRecoveryLocation('https://panovagroup.org/auth/reset-password/candidate#access_token=a&refresh_token=b&type=recovery'),
    { kind: 'implicit' },
  );
  assert.deepEqual(
    readRecoveryLocation('https://panovagroup.org/#error_description=expired&type=recovery'),
    { kind: 'error', message: 'expired' },
  );
  assert.deepEqual(
    readRecoveryLocation('https://panovagroup.org/auth/reset-password/portal?code=abc'),
    { kind: 'code', code: 'abc' },
  );
  assert.equal(readRecoveryLocation('https://panovagroup.org/candidate?code=abc').kind, 'none');
  assert.deepEqual(
    readRecoveryLocation('https://panovagroup.org/auth/reset-password/employer?token_hash=deadbeefdeadbeef&type=recovery'),
    { kind: 'hash', tokenHash: 'deadbeefdeadbeef' },
  );
});

test('the code field accepts a recovery OTP or link and rejects a signup link', () => {
  assert.deepEqual(recoveryProofFromInput('123 456', 'Person@Example.com'), {
    kind: 'otp',
    email: 'person@example.com',
    token: '123456',
  });
  const link = recoveryProofFromInput(
    'https://vptcihlhkzfmwxpaituf.supabase.co/auth/v1/verify?token=abc123def4567890&type=recovery',
    '',
  );
  assert.equal(link.kind, 'hash');
  assert.equal(recoveryProofFromInput('https://example.supabase.co/auth/v1/verify?token=abc123def4567890&type=signup', '').kind, 'rejected');
  assert.equal(recoveryProofFromInput('123456', 'not-an-email').kind, 'rejected');
});

test('an unknown mailbox is treated like a sent message', () => {
  assert.equal(isUnknownUserResetError('User not found'), true);
  assert.equal(isUnknownUserResetError('For security purposes, you can only request this once every 60 seconds'), false);
});

test('forgot-password copy exists in TR, EN, SQ, AR, and MK', () => {
  for (const lang of LOCALES) {
    for (const key of COPY_KEYS) {
      const value = translations[lang][key];
      assert.equal(typeof value, 'string', `${lang}.${key}`);
      assert.equal((value || '').trim().length > 0, true, `${lang}.${key}`);
    }
  }
  assert.match(translations.ar.forgotPassword || '', /[\u0600-\u06FF]/);
  assert.match(translations.mk.forgotPassword || '', /[А-Яа-яЃѓЅѕЈјЉљЊњЌќЏџ]/);
  assert.match(translations.tr.forgotPassword || '', /Şifre/i);
  assert.match(translations.en.forgotPassword || '', /Forgot password/);
});
