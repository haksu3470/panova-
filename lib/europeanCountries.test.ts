import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EUROPEAN_COUNTRIES,
  dialCodeForCountry,
  phoneForStorage,
  phoneWithCountryDial,
} from './europeanCountries.ts';

test('every European country has one calling code', () => {
  const seen = new Set<string>();
  for (const country of EUROPEAN_COUNTRIES) {
    assert.match(country.dial, /^\+\d{1,4}$/);
    assert.equal(dialCodeForCountry(country.value), country.dial);
    assert.equal(seen.has(country.value), false);
    seen.add(country.value);
  }
  assert.equal(dialCodeForCountry('Montenegro'), '+382');
  assert.equal(dialCodeForCountry('North Macedonia'), '+389');
  assert.equal(dialCodeForCountry('Turkey'), '+90');
  assert.equal(dialCodeForCountry(''), '');
});

test('the phone field keeps the typed number and swaps only the prefix', () => {
  assert.equal(phoneWithCountryDial('', 'North Macedonia'), '+389');
  assert.equal(phoneWithCountryDial('+389', 'Montenegro'), '+382');
  assert.equal(phoneWithCountryDial('+389 67 111 222', 'Turkey'), '+90 67 111 222');
  assert.equal(phoneWithCountryDial('67 111 222', 'Kosovo'), '+383 67 111 222');
  assert.equal(phoneWithCountryDial('+379 06 698', 'Italy'), '+39 06 698');
  assert.equal(phoneWithCountryDial('+39 06 698', 'Vatican City'), '+379 06 698');
  assert.equal(phoneForStorage('+382', 'Montenegro'), '');
  assert.equal(phoneForStorage('+382 67 111 222', 'Montenegro'), '+382 67 111 222');
  assert.equal(phoneWithCountryDial('+90 +90 555 111 22 33', 'Turkey'), '+90 555 111 22 33');
});
