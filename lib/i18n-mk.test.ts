import assert from 'node:assert/strict';
import test from 'node:test';
import { languages, translations, type Language } from './dictionary.ts';
import { EUROPEAN_COUNTRIES, europeanCountryOptions, toLanguage } from './europeanCountries.ts';
import { homeCopy } from './home-copy.ts';
import { isLanguage } from './site-language.ts';

const LOCALES: Language[] = ['tr', 'en', 'mk', 'sq', 'ar'];
const CYRILLIC = /[А-Яа-яЃѓЅѕЈјЉљЊњЌќЏџ]/;

function leafKeys(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => leafKeys(item, `${prefix}[${index}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => leafKeys(child, prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

function sameKeys(left: unknown, right: unknown, label: string) {
  const a = leafKeys(left).sort();
  const b = leafKeys(right).sort();
  assert.deepEqual(b, a, label);
}

test('the switcher lists TR, GB, MK, AL, SA in that order', () => {
  assert.deepEqual(languages.map((lang) => lang.code), LOCALES);
  assert.deepEqual(languages.map((lang) => lang.name), ['TR', 'GB', 'MK', 'AL', 'SA']);
  assert.deepEqual(languages.map((lang) => lang.flag), ['🇹🇷', '🇬🇧', '🇲🇰', '🇦🇱', '🇸🇦']);
  assert.equal(isLanguage('mk'), true);
  assert.equal(toLanguage('mk'), 'mk');
  assert.equal(toLanguage('sq'), 'sq');
  assert.equal(toLanguage('ar'), 'ar');
  assert.equal(toLanguage('xx'), 'en');
});

test('mk dictionaries contain every key used by the other locales', () => {
  for (const lang of LOCALES) {
    if (lang === 'mk') continue;
    sameKeys(translations[lang], translations.mk, `translations ${lang}`);
    sameKeys(homeCopy[lang], homeCopy.mk, `homeCopy ${lang}`);
  }
});

test('mk interface copy is Macedonian Cyrillic', () => {
  const allowed = new Set([
    'Panova HR',
    'Panova Trade',
    'contact@company.com',
    'name@email.com',
    'name@gmail.com',
    'name@panova.com',
    '3',
    '4',
    '8+',
    '30/60/90',
    'construction',
    'agriculture',
    'manufacturing',
    'hospitality',
  ]);
  function visit(value: unknown, key = '') {
    if (typeof value === 'string') {
      if (key === 'value' || allowed.has(value)) return;
      assert.equal(CYRILLIC.test(value), true, value);
      return;
    }
    if (Array.isArray(value)) value.forEach((item) => visit(item, key));
    else if (value && typeof value === 'object') {
      for (const [childKey, child] of Object.entries(value)) visit(child, childKey);
    }
  }
  visit(translations.mk);
  visit(homeCopy.mk);
  assert.equal(translations.mk.loginBtn, 'Најави се');
  assert.equal(homeCopy.mk.nav.employers, 'Работодавачи');
});

test('employer country names include Macedonian and keep the calling code', () => {
  for (const country of EUROPEAN_COUNTRIES) {
    assert.equal(CYRILLIC.test(country.names.mk), true, country.value);
    assert.equal(Object.keys(country.names).sort().join(','), 'ar,en,mk,sq,tr');
  }
  const labels = europeanCountryOptions('mk');
  assert.equal(labels.find((country) => country.value === 'North Macedonia')?.label, 'Северна Македонија');
  const ordered = labels.map((country) => country.label);
  assert.deepEqual(ordered, [...ordered].sort((a, b) => a.localeCompare(b, 'mk', { sensitivity: 'base' })));
});
