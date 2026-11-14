import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);
const { passwordErrorKind, passwordErrorMessage, PASSWORD_ERROR_MESSAGE_KEY } = await import('./passwordError.ts');
const { translations } = await import('./dictionary.ts');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8').replace(/\r\n/g, '\n');

test('Supabase error codes map to their kind', () => {
  const cases: [string, string][] = [
    ['same_password', 'same_password'],
    ['weak_password', 'weak_password'],
    ['session_not_found', 'session_expired'],
    ['refresh_token_not_found', 'session_expired'],
    ['not_authenticated', 'session_expired'],
    ['over_request_rate_limit', 'rate_limited'],
  ];
  for (const [code, kind] of cases) assert.equal(passwordErrorKind({ code, status: 422, message: 'x' }), kind, code);
});

test('without a known code the status, then the message decides', () => {
  assert.equal(passwordErrorKind({ status: 401, message: 'x' }), 'session_expired');
  assert.equal(passwordErrorKind({ status: 429 }), 'rate_limited');
  assert.equal(passwordErrorKind({ code: 'something_new', status: 429 }), 'rate_limited');
  assert.equal(passwordErrorKind({ status: 422, message: 'New password should be different from the old password.' }), 'same_password');
  assert.equal(passwordErrorKind({ message: 'Auth session missing!' }), 'session_expired');
  assert.equal(passwordErrorKind({ message: 'Password should be at least 8 characters.' }), 'weak_password');
});

test('anything else is unknown', () => {
  assert.equal(passwordErrorKind(null), 'unknown');
  assert.equal(passwordErrorKind(undefined), 'unknown');
  assert.equal(passwordErrorKind({}), 'unknown');
  assert.equal(passwordErrorKind({ code: 'unexpected_failure', status: 500, message: 'Database error' }), 'unknown');
  assert.equal(passwordErrorKind({ code: 'constructor' }), 'unknown');
  assert.equal(passwordErrorKind({ code: 42, status: 'x', message: {} }), 'unknown');
});

test('the raw message never reaches the user text', () => {
  const secret = 'internal detail 7f3a';
  for (const lang of ['tr', 'en', 'sq', 'ar', 'mk'] as const) {
    for (const error of [{ code: 'unexpected', message: secret }, { status: 401, message: secret }, { code: 'same_password', message: secret }]) {
      const text = passwordErrorMessage(passwordErrorKind(error), translations[lang]);
      assert.ok(text.length > 0);
      assert.equal(text.includes(secret), false);
    }
  }
  assert.equal(passwordErrorMessage('unknown', translations.tr), translations.tr.resetPasswordFail);
});

test('every kind has its own text in all five languages', () => {
  for (const lang of ['tr', 'en', 'sq', 'ar', 'mk'] as const) {
    const texts = Object.values(PASSWORD_ERROR_MESSAGE_KEY).map((key) => translations[lang][key]);
    for (const text of texts) assert.ok(text && text.trim().length > 10, `${lang}: empty password message`);
    assert.equal(new Set(texts).size, texts.length, `${lang}: messages must differ`);
  }
  assert.equal(translations.tr.passwordSameAsOld, 'Yeni şifreniz eskisiyle aynı olamaz. Farklı bir şifre seçin.');
  assert.equal(translations.tr.passwordWeak, 'Şifre çok zayıf. En az 8 karakter, harf ve rakam karışımı kullanın.');
  assert.equal(translations.tr.passwordSessionExpired, 'Bağlantının süresi dolmuş. Yeni bir e-posta isteyin.');
  assert.equal(translations.tr.passwordRateLimited, 'Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin.');
});

test('every password update uses the same mapping and shows no raw message', () => {
  const actions = read('lib/passwordResetActions.ts');
  assert.match(actions, /if \(error\) return \{ error: passwordErrorKind\(error\) \};/);
  const screen = read('components/auth/ResetPasswordScreen.tsx');
  assert.match(screen, /setInfo\(passwordErrorMessage\(result\.error, t\)\)/);
  const candidate = read('app/candidate/page.tsx');
  assert.match(candidate, /passError = res\.error \? passwordErrorKind\(res\.error\) : null;/);
  assert.match(candidate, /alert\(passwordErrorMessage\(passError, t\)\)/);
  assert.equal(/passError\.message|Şifre güncellenemedi: '/.test(candidate), false);
  // no password value in a log line
  for (const src of [actions, screen, candidate]) {
    assert.equal(/console\.\w+\([^)]*(newPassword|password\b|confirm\b)/.test(src), false);
  }
});
