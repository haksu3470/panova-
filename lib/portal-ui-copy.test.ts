import assert from 'node:assert/strict';
import test from 'node:test';
import type { Language } from './dictionary.ts';
import { portalUi, type PortalUi } from './portal-ui-copy.ts';

const LOCALES: Language[] = ['tr', 'en', 'sq', 'ar', 'mk'];
const TURKISH_LETTERS = /[ğışöüĞİŞÖÜ]/;

function leafKeys(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => leafKeys(item, `${prefix}[${index}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => leafKeys(child, prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

test('portal UI copy covers every locale with the same keys', () => {
  const base = leafKeys(portalUi.tr).sort();
  for (const lang of LOCALES) {
    assert.deepEqual(leafKeys(portalUi[lang]).sort(), base, lang);
  }
});

test('non-Turkish portal UI copy does not fall back to Turkish letters', () => {
  function visit(value: unknown) {
    if (typeof value === 'string') {
      assert.equal(TURKISH_LETTERS.test(value), false, value);
      return;
    }
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  }
  for (const lang of LOCALES) {
    if (lang === 'tr') continue;
    visit(portalUi[lang]);
  }
});

test('screenshot leftovers are translated for Albanian, English, Arabic and Macedonian', () => {
  const checks: [Language, keyof PortalUi, string][] = [
    ['sq', 'passwordsManaged', 'Fjalëkalimet menaxhohen me Supabase Auth.'],
    ['sq', 'docTitle', 'Statusi i dokumenteve'],
    ['sq', 'docEmpty', 'Nuk ka dokumente të regjistruara.'],
    ['sq', 'interviewOfferTitle', 'Intervistë dhe ofertë pune'],
    ['sq', 'officialTitle', 'Statusi zyrtar i procesit'],
    ['en', 'passwordsManaged', 'Passwords are managed with Supabase Auth.'],
    ['ar', 'docEmpty', 'لا توجد مستندات محفوظة.'],
    ['mk', 'passwordsManaged', 'Лозинките се управуваат преку Supabase Auth.'],
  ];
  for (const [lang, key, expected] of checks) {
    assert.equal(portalUi[lang][key], expected);
  }
  assert.equal(portalUi.sq.steps.not_started, 'Nuk ka filluar');
  assert.equal(portalUi.en.steps.not_started, 'Not started');
  assert.equal(portalUi.ar.steps.not_started, 'لم يبدأ');
  assert.equal(portalUi.mk.steps.not_started, 'Не е започнато');
  assert.equal(portalUi.tr.steps.not_started, 'Başlamadı');
  for (const lang of LOCALES) {
    assert.deepEqual(
      portalUi[lang].positions.construction.map((item) => item.id),
      portalUi.en.positions.construction.map((item) => item.id),
    );
    assert.deepEqual(
      portalUi[lang].languageOptions.map((item) => item.value),
      ['none', 'en-mid', 'tr-good', 'local'],
    );
  }
});
