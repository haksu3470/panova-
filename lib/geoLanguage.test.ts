import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GEO_LANG_COOKIE,
  languageFromAcceptLanguage,
  languageFromCountry,
  suggestLanguage,
} from './geoLanguage.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('country codes map to our five languages; unknown → English', () => {
  assert.equal(languageFromCountry('TR'), 'tr');
  assert.equal(languageFromCountry('tr'), 'tr');
  assert.equal(languageFromCountry('MK'), 'mk');
  assert.equal(languageFromCountry('AL'), 'sq');
  assert.equal(languageFromCountry('XK'), 'sq');
  assert.equal(languageFromCountry('SA'), 'ar');
  assert.equal(languageFromCountry('EG'), 'ar');
  assert.equal(languageFromCountry('DE'), 'en');
  assert.equal(languageFromCountry('BD'), 'en');
  assert.equal(languageFromCountry('US'), 'en');
  assert.equal(languageFromCountry('XX'), 'en');
  assert.equal(languageFromCountry(null), 'en');
  assert.equal(languageFromCountry(''), 'en');
});

test('Accept-Language picks the first supported tag', () => {
  assert.equal(languageFromAcceptLanguage('mk-MK,mk;q=0.9,en;q=0.8'), 'mk');
  assert.equal(languageFromAcceptLanguage('sq,en-US;q=0.8'), 'sq');
  assert.equal(languageFromAcceptLanguage('fr-FR,fr;q=0.9'), null);
  assert.equal(languageFromAcceptLanguage(null), null);
});

test('suggestLanguage prefers country over Accept-Language', () => {
  assert.equal(suggestLanguage({ country: 'TR', acceptLanguage: 'en-US' }), 'tr');
  assert.equal(suggestLanguage({ country: 'DE', acceptLanguage: 'tr-TR' }), 'en');
  assert.equal(suggestLanguage({ country: 'XX', acceptLanguage: 'ar' }), 'ar');
  assert.equal(suggestLanguage({ country: null, acceptLanguage: 'sq-AL' }), 'sq');
  assert.equal(suggestLanguage({ country: null, acceptLanguage: 'de' }), 'en');
});

test('geo cookie name is stable for middleware and the client', () => {
  assert.equal(GEO_LANG_COOKIE, 'panova_geo_lang');
});

test('middleware seeds the geo cookie from country headers', () => {
  const source = readFileSync(join(root, 'middleware.ts'), 'utf8');
  assert.match(source, /x-vercel-ip-country/);
  assert.match(source, /cf-ipcountry/);
  assert.match(source, /GEO_LANG_COOKIE/);
  assert.match(source, /suggestLanguage/);
  assert.equal(source.includes("from '@/lib/site-language'"), false, 'middleware stays server-safe');
});

test('site language falls back to geo then English', () => {
  const source = readFileSync(join(root, 'lib/site-language.ts'), 'utf8');
  assert.match(source, /readGeoLanguage/);
  assert.match(source, /fallback: Language = 'en'/);
  assert.match(source, /GEO_LANG_COOKIE/);
});
