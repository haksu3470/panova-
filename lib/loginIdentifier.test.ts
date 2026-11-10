import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalPassport, canonicalPhone, classifyLoginIdentifier, passportKey, phoneKey, resolveLoginEmail } from './loginIdentifier.ts';

test('phone numbers fold +90, leading zero, and spaces into one key', () => {
  const expected = '+905321234567';
  assert.equal(phoneKey('+90 532 123 45 67'), expected);
  assert.equal(phoneKey('0532 123 45 67'), expected);
  assert.equal(phoneKey('905321234567'), expected);
  assert.equal(phoneKey('00905321234567'), expected);
  assert.equal(phoneKey('not a phone'), null);
});

test('the reported phone shapes and a 10-digit Turkish mobile are one key', () => {
  const expected = '+905324615035';
  assert.equal(phoneKey('+905324615035'), expected);
  assert.equal(phoneKey('05324615035'), expected);
  assert.equal(phoneKey('0532 461 50 35'), expected);
  assert.equal(phoneKey('+90 532 461 50 35'), expected);
  assert.equal(phoneKey('5324615035'), expected);
  assert.equal(phoneKey('532 461 50 35'), expected);
});

test('passport folding ignores case and spaces and rejects digit-only values', () => {
  assert.equal(passportKey('u 1234567'), 'U1234567');
  assert.equal(passportKey('  u1234567 '), 'U1234567');
  assert.equal(passportKey('AB-12'), null);
  assert.equal(passportKey('123456789'), null);
  assert.equal(canonicalPassport('u 1234567'), 'U1234567');
  assert.equal(canonicalPhone('0532 461 50 35'), '+905324615035');
  assert.equal(canonicalPhone('+90 532 461 50 35'), '+905324615035');
});

test('phone and passport sign-in uses the auth email, not a changed profile email', () => {
  assert.equal(resolveLoginEmail([
    { email: 'profile@example.com', authEmail: 'auth@example.com', linked: true },
  ]), 'auth@example.com');
  assert.equal(resolveLoginEmail([
    { email: 'profile@example.com', authEmail: 'auth@example.com', linked: true },
    { email: 'staff-copy@example.com', authEmail: null, linked: false },
  ]), 'auth@example.com');
  assert.equal(resolveLoginEmail([
    { email: 'one@example.com', authEmail: 'a@example.com', linked: true },
    { email: 'two@example.com', authEmail: 'b@example.com', linked: true },
  ]), null);
  assert.equal(resolveLoginEmail([
    { email: 'open@example.com', authEmail: null, linked: false },
  ]), 'open@example.com');
  assert.equal(resolveLoginEmail([
    { email: 'open-a@example.com', authEmail: null, linked: false },
    { email: 'open-b@example.com', authEmail: null, linked: false },
  ]), null);
  assert.equal(resolveLoginEmail([]), null);
  assert.equal(resolveLoginEmail([
    { email: 'profile@example.com', authEmail: null, linked: true },
  ]), 'profile@example.com');
});

test('an identifier is email, passport, or phone, and nothing else', () => {
  assert.deepEqual(classifyLoginIdentifier(' Ada@Example.com '), { kind: 'email', key: 'ada@example.com' });
  assert.deepEqual(classifyLoginIdentifier('u1234567'), { kind: 'passport', key: 'U1234567' });
  assert.deepEqual(classifyLoginIdentifier('0532 123 45 67'), { kind: 'phone', key: '+905321234567' });
  assert.equal(classifyLoginIdentifier('   '), null);
  assert.equal(classifyLoginIdentifier('nope'), null);
});
