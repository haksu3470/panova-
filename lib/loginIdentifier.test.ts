import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyLoginIdentifier, passportKey, phoneKey } from './loginIdentifier.ts';

test('phone numbers fold +90, leading zero, and spaces into one key', () => {
  const expected = '+905321234567';
  assert.equal(phoneKey('+90 532 123 45 67'), expected);
  assert.equal(phoneKey('0532 123 45 67'), expected);
  assert.equal(phoneKey('905321234567'), expected);
  assert.equal(phoneKey('00905321234567'), expected);
  assert.equal(phoneKey('not a phone'), null);
});

test('passport folding ignores case and spaces and rejects digit-only values', () => {
  assert.equal(passportKey('u 1234567'), 'U1234567');
  assert.equal(passportKey('AB-12'), null);
  assert.equal(passportKey('123456789'), null);
});

test('an identifier is email, passport, or phone, and nothing else', () => {
  assert.deepEqual(classifyLoginIdentifier(' Ada@Example.com '), { kind: 'email', key: 'ada@example.com' });
  assert.deepEqual(classifyLoginIdentifier('u1234567'), { kind: 'passport', key: 'U1234567' });
  assert.deepEqual(classifyLoginIdentifier('0532 123 45 67'), { kind: 'phone', key: '+905321234567' });
  assert.equal(classifyLoginIdentifier('   '), null);
  assert.equal(classifyLoginIdentifier('nope'), null);
});
