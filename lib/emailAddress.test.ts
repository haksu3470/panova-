import assert from 'node:assert/strict';
import test from 'node:test';
import { company, turkeyOfficePhone } from './company.ts';
import { isGmailAddress, isGoogleProvedUser, normalizeEmail } from './emailAddress.ts';

test('Türkiye office phone is one E.164 value', () => {
  assert.equal(turkeyOfficePhone, '+905453644930');
  assert.equal(company.turkey.phone.display, turkeyOfficePhone);
  assert.equal(company.turkey.phone.tel, turkeyOfficePhone);
  assert.equal(company.phones[0].display, '+389 70 385 792');
  assert.equal(company.phones[1].display, '+389 75 818 697');
  assert.equal(company.bangladesh.phone.display, '+880 1805 511473');
  assert.equal(company.bangladesh.phone.tel, '+8801805511473');
});

test('gmail detection ignores other domains', () => {
  assert.equal(isGmailAddress('Ada@Gmail.com'), true);
  assert.equal(isGmailAddress('ada@googlemail.com'), true);
  assert.equal(isGmailAddress('ada@gmail.com.tr'), false);
  assert.equal(isGmailAddress('ada@panovagroup.org'), false);
  assert.equal(normalizeEmail('  A@B.C '), 'a@b.c');
});

test('only a Google identity skips the extra confirmation', () => {
  assert.equal(isGoogleProvedUser(null), false);
  assert.equal(isGoogleProvedUser({ app_metadata: { provider: 'email', providers: ['email'] } }), false);
  assert.equal(isGoogleProvedUser({ identities: [{ provider: 'email' }] }), false);
  assert.equal(isGoogleProvedUser({ identities: [{ provider: 'google' }] }), true);
  assert.equal(isGoogleProvedUser({ app_metadata: { provider: 'google', providers: ['google'] } }), true);
});
