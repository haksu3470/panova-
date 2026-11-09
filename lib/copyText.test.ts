import assert from 'node:assert/strict';
import test from 'node:test';
import { translations, type Language } from './dictionary.ts';
import { copyText } from './copyText.ts';

const LOCALES: Language[] = ['tr', 'en', 'sq', 'ar', 'mk'];

test('copyText writes through the clipboard API', async () => {
  let written = '';
  const ok = await copyText('1234567890', {
    write: async (value) => {
      written = value;
    },
  });
  assert.equal(ok, true);
  assert.equal(written, '1234567890');
});

test('copyText keeps the current input value, including spaces', async () => {
  let written = '';
  await copyText('1234 5678 90', {
    write: async (value) => {
      written = value;
    },
  });
  assert.equal(written, '1234 5678 90');
});

test('copyText falls back when the clipboard API rejects', async () => {
  let fallback = '';
  const ok = await copyText('99887766', {
    write: async () => {
      throw new Error('NotAllowedError');
    },
    fallback: (value) => {
      fallback = value;
      return true;
    },
  });
  assert.equal(ok, true);
  assert.equal(fallback, '99887766');
});

test('copyText uses the fallback when the clipboard API is missing', async () => {
  let fallback = '';
  const ok = await copyText('42', {
    write: null,
    fallback: (value) => {
      fallback = value;
      return true;
    },
  });
  assert.equal(ok, true);
  assert.equal(fallback, '42');
});

test('copyText returns false when the clipboard API and the fallback both fail', async () => {
  const ok = await copyText('1', {
    write: async () => {
      throw new Error('denied');
    },
    fallback: () => false,
  });
  assert.equal(ok, false);
});

test('copyText falls back when the clipboard API never settles', async () => {
  let fallback = '';
  const ok = await copyText('555444', {
    write: () => new Promise(() => {}),
    timeoutMs: 30,
    fallback: (value) => {
      fallback = value;
      return true;
    },
  });
  assert.equal(ok, true);
  assert.equal(fallback, '555444');
});

test('copyText returns false when the fallback throws', async () => {
  const ok = await copyText('1', {
    write: null,
    fallback: () => {
      throw new Error('execCommand missing');
    },
  });
  assert.equal(ok, false);
});

test('email code paste labels exist in TR, EN, SQ, AR, and MK', () => {
  assert.equal(translations.tr.verifyEmailPaste, 'Kodu yapıştır');
  assert.equal(translations.tr.verifyEmailPasted, 'Kod yapıştırıldı');
  assert.equal(translations.en.verifyEmailPaste, 'Paste code');
  assert.equal(translations.en.verifyEmailPasted, 'Code pasted');
  assert.equal(translations.sq.verifyEmailPasted, 'Kodi u ngjit');
  assert.equal(translations.ar.verifyEmailPasted, 'تم لصق الرمز');
  assert.equal(translations.mk.verifyEmailPasted, 'Кодот е залепен');
  for (const lang of LOCALES) {
    assert.ok(translations[lang].verifyEmailPaste);
    assert.ok(translations[lang].verifyEmailPasted);
    assert.ok(translations[lang].verifyEmailPasteFail);
    assert.ok(translations[lang].resetPasswordPaste);
    assert.ok(translations[lang].resetPasswordPasteFail);
  }
});
