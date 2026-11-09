import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const { canonicalNationality, sameNationality } = await import('./registrationCountries.ts');

test('candidate nationality uses the shared country list and rejects the Turkish sentinel', () => {
  assert.equal(canonicalNationality(' Türkiye '), 'Turkey');
  assert.equal(canonicalNationality('Bangladeş'), 'Bangladesh');
  assert.equal(canonicalNationality('Belirtilmedi'), null);
  assert.equal(canonicalNationality(''), null);
  assert.equal(sameNationality('Türkiye', 'Turkey'), true);
  assert.equal(sameNationality('Bangladesh', 'Turkey'), false);
  assert.equal(sameNationality('Özbekistan', 'all'), true);
});
