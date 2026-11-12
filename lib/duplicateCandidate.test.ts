import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import test from 'node:test';
import { translations, type Language } from './dictionary.ts';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const {
  authErrorMeansExistingAccount,
  confirmedSignupObfuscated,
  duplicateFlags,
  flagsFor,
  registrationBlock,
} = await import('./duplicateCandidate.ts');

const LOCALES: Language[] = ['tr', 'en', 'mk', 'sq', 'ar'];

test('an obfuscated confirmed signup is an existing account and is not sent to OTP', () => {
  assert.equal(confirmedSignupObfuscated({ identities: [] }), true);
  assert.equal(confirmedSignupObfuscated({ identities: [{ provider: 'email' }] }), false);
  assert.equal(confirmedSignupObfuscated({ identities: null }), false);
  assert.equal(confirmedSignupObfuscated(undefined), false);
  assert.equal(authErrorMeansExistingAccount({ message: 'User already registered', code: 'user_already_exists' }), true);
  assert.equal(authErrorMeansExistingAccount({ message: 'A user with this email address has already been registered' }), true);
  assert.equal(authErrorMeansExistingAccount({ code: 'email_exists' }), true);
  assert.equal(authErrorMeansExistingAccount({ message: 'Email rate limit exceeded' }), false);
  assert.equal(authErrorMeansExistingAccount(null), false);
});

test('duplicate flags are only the three booleans', () => {
  assert.deepEqual(duplicateFlags({ email: true, passport: false, phone: false }), {
    email: true,
    passport: false,
    phone: false,
  });
  assert.equal(duplicateFlags({ email: true, passport: false, phone: false, email_address: 'secret@example.com' }), null);
  assert.equal(duplicateFlags({ email: 'yes', passport: false, phone: false }), null);
  assert.equal(duplicateFlags({ email: true, passport: false }), null);
  assert.equal(duplicateFlags(null), null);
  assert.equal(duplicateFlags(['email']), null);
});

test('passport and phone duplicates use the same folding as sign-in', () => {
  const existing = {
    emails: ['Ada@Example.com'],
    passports: ['u 1234567'],
    phones: ['+905324615035'],
  };
  assert.deepEqual(flagsFor({
    email: ' ada@example.com ',
    passport: 'U1234567',
    phone: '0532 461 50 35',
  }, existing), { email: true, passport: true, phone: true });
  assert.deepEqual(flagsFor({
    email: 'ada@example.com',
    passport: 'U1234567',
    phone: '+90 532 461 50 35',
  }, existing), { email: true, passport: true, phone: true });
  assert.deepEqual(flagsFor({
    email: 'other@example.com',
    passport: 'X9999999',
    phone: '5324615035',
  }, existing), { email: false, passport: false, phone: true });
  assert.deepEqual(flagsFor({
    email: 'not-an-email',
    passport: '12',
    phone: 'nope',
  }, existing), { email: false, passport: false, phone: false });
});

test('an existing email is reported before a passport or phone collision', () => {
  assert.equal(registrationBlock({ email: true, passport: true, phone: true }), 'email');
  assert.equal(registrationBlock({ email: false, passport: true, phone: true }), 'passport');
  assert.equal(registrationBlock({ email: false, passport: false, phone: true }), 'phone');
  assert.equal(registrationBlock({ email: false, passport: false, phone: false }), null);
});

test('the account-exists copy is present in TR, EN, MK, SQ, and AR', () => {
  assert.equal(translations.tr.accountExists, 'Bu e-posta ile zaten bir hesap var. Giriş yapın veya şifrenizi sıfırlayın.');
  for (const lang of LOCALES) {
    assert.equal(typeof translations[lang].accountExists, 'string');
    assert.equal(typeof translations[lang].passportExists, 'string');
    assert.equal(typeof translations[lang].phoneExists, 'string');
    assert.equal(typeof translations[lang].signInUnavailable, 'string');
    assert.equal(typeof translations[lang].duplicateCheckFailed, 'string');
    assert.ok((translations[lang].accountExists || '').length > 10);
  }
});

test('candidate registration checks duplicates before signUp and does not open OTP for an existing account', () => {
  const page = readFileSync(new URL('../app/candidate/page.tsx', import.meta.url), 'utf8');
  const signup = page.slice(page.indexOf('const handleCandidateSignup'), page.indexOf('const saveCandidateFix'));
  const checkAt = signup.indexOf('checkCandidateDuplicate');
  const signAt = signup.indexOf('beginPasswordSignup');
  assert.ok(checkAt >= 0 && signAt > checkAt);
  assert.match(signup, /status === 'exists'/);
  assert.match(signup, /showDuplicate\('email'\)/);
  assert.equal(signup.includes('showVerify(result.email)'), true);
  const beforeVerify = signup.slice(0, signup.indexOf('showVerify(result.email)'));
  assert.match(beforeVerify, /status === 'exists'/);

  const route = readFileSync(new URL('../app/api/candidates/check-duplicate/route.ts', import.meta.url), 'utf8');
  assert.match(route, /candidate_duplicate_flags/);
  assert.match(route, /email: flags\.email, passport: flags\.passport, phone: flags\.phone/);
  assert.equal(route.includes('.select('), false);
  assert.equal(route.includes('serviceKey'), true);

  const login = readFileSync(new URL('../app/api/auth/candidate-login/route.ts', import.meta.url), 'utf8');
  assert.match(login, /resolve_candidate_login_email/);
  assert.match(login, /candidate login lookup failed/);
  assert.match(login, /status: 503/);

  const notice = readFileSync(new URL('../components/auth/EmailVerifyNotice.tsx', import.meta.url), 'utf8');
  assert.match(notice, /result\.code === 'exists'/);
  assert.match(notice, /accountExists/);
  assert.equal(notice.includes('text-slate-400'), false);
});
