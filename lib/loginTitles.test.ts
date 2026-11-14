import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { Language } from './dictionary.ts';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const { translations: dictionary } = await import('./dictionary');
const { inviteMailCopy } = await import('./email/email-copy');
const { portalUi } = await import('./portal-ui-copy');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const LANGS: Language[] = ['tr', 'en', 'sq', 'ar', 'mk'];

// Sign-in pages are named after who signs in, like the home menu (Aday / İşveren / Personel).
const EXPECTED = {
  portalTitle: {
    tr: 'Personel Girişi',
    en: 'Staff Login',
    sq: 'Hyrje për stafin',
    ar: 'دخول الموظفين',
    mk: 'Најава за персонал',
  },
  portalSub: {
    tr: 'Panova ekibi için yönetim paneli',
    en: 'Management panel for the Panova team',
    sq: 'Paneli i menaxhimit për ekipin e Panova',
    ar: 'لوحة الإدارة لفريق بانوفا',
    mk: 'Панел за управување за тимот на Panova',
  },
  mgmtTitle: {
    tr: 'Personel Paneli',
    en: 'Staff Panel',
    sq: 'Paneli i stafit',
    ar: 'لوحة الموظفين',
    mk: 'Панел за персонал',
  },
  candidatePortal: {
    tr: 'Aday Girişi',
    en: 'Candidate Login',
    sq: 'Hyrje për kandidatin',
    ar: 'دخول المرشحين',
    mk: 'Најава за кандидати',
  },
  loginPortalTitle: {
    tr: 'İşveren Girişi',
    en: 'Employer Login',
    sq: 'Hyrje për punëdhënësin',
    ar: 'دخول أصحاب العمل',
    mk: 'Најава за работодавачи',
  },
} as const;

test('sign-in and panel titles have the agreed text in all five languages', () => {
  for (const [key, values] of Object.entries(EXPECTED)) {
    for (const lang of LANGS) {
      const dict = dictionary[lang] as Record<string, string>;
      assert.equal(dict[key], values[lang], `${lang}.${key}`);
    }
  }
});

test('the pages take their titles from the dictionary', () => {
  const pages: [string, string[]][] = [
    ['app/portal/page.tsx', ['t.portalTitle', 't.portalSub', 't.mgmtTitle']],
    ['app/candidate/page.tsx', ['t.candidatePortal']],
    ['app/employer-login/page.tsx', ['t.loginPortalTitle']],
  ];
  for (const [file, keys] of pages) {
    const source = read(file);
    for (const key of keys) assert.match(source, new RegExp(`\\b${key.replace('.', '\\.')}\\b`), `${file} should render ${key}`);
    for (const lang of LANGS) {
      for (const key of keys) {
        const value = (dictionary[lang] as Record<string, string>)[key.slice(2)];
        assert.equal(source.includes(value), false, `${file} hard-codes ${lang} ${key}`);
      }
    }
  }
});

test('no old "management portal" name is left on staff-facing texts', () => {
  const old = /Yönetim Portalı|Management Portal|Portali i Menaxhimit|بوابة الإدارة|Портал за управување/;
  for (const lang of LANGS) {
    const dict = dictionary[lang] as Record<string, string>;
    for (const key of Object.keys(EXPECTED)) assert.equal(old.test(dict[key]), false, `${lang}.${key}`);
    const invite = inviteMailCopy[lang];
    assert.equal(old.test(invite.subject) || old.test(invite.title), false, `${lang} invite mail`);
  }
  assert.equal(inviteMailCopy.tr.subject, 'PANOVA Personel Portalı davetiniz');
  assert.equal(portalUi.tr.returnToAdmin, 'Personel paneline dön');
});
