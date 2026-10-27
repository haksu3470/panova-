import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EmployerWriteError,
  assertEmployerPersisted,
  companyProfilePayload,
  resolveLinkedEmployerId,
  toEmployerProfileView,
} from './employerProfile.ts';

const LINKED = '428c22db-e80e-4bfe-813a-c73cf0129d53';
const ORPHAN = 'bf91d15b-8f29-4ec3-bc66-2c51d2953007';

test('the signed-in profile link is the employer that gets loaded', () => {
  assert.equal(
    resolveLinkedEmployerId({
      profileLinkedEmployerId: LINKED,
      authOwnedEmployerId: ORPHAN,
    }),
    LINKED,
  );
});

test('an auth-owned employer is used only when the profile link is empty', () => {
  assert.equal(
    resolveLinkedEmployerId({
      profileLinkedEmployerId: '  ',
      authOwnedEmployerId: LINKED,
    }),
    LINKED,
  );
});

test('a missing link does not fall back to another employer', () => {
  assert.equal(
    resolveLinkedEmployerId({
      profileLinkedEmployerId: null,
      authOwnedEmployerId: null,
    }),
    null,
  );
});

test('profile save updates the linked row fields, including email, and does not mint an id', () => {
  const payload = companyProfilePayload({
    companyName: ' AKAY EĞİTİM ',
    contactPerson: 'hüseyin aksu',
    email: ' haksu@huseyinaksu.com.tr ',
    phone: ' +38970385792 ',
    country: 'Turkey',
    logo: 'data:image/jpeg;base64,abc',
  });
  assert.deepEqual(payload, {
    company_name: 'AKAY EĞİTİM',
    contact_person: 'hüseyin aksu',
    email: 'haksu@huseyinaksu.com.tr',
    phone: '+38970385792',
    country: 'Turkey',
    logo: 'data:image/jpeg;base64,abc',
  });
  assert.equal('id' in payload, false);
  assert.equal('auth_user_id' in payload, false);
  assert.equal('is_demo' in payload, false);
});

test('loaded rows keep database values instead of a hardcoded company', () => {
  const view = toEmployerProfileView({
    id: LINKED,
    company_name: 'AKAY EĞİTİM',
    contact_person: 'hüseyin aksu',
    email: 'huseyinaksu@gmail.com',
    phone: '+38970385792',
    country: 'Turkey',
    logo: 'data:image/jpeg;base64,abc',
  });
  assert.equal(view.id, LINKED);
  assert.equal(view.email, 'huseyinaksu@gmail.com');
  assert.equal(view.companyName, 'AKAY EĞİTİM');
});

test('a write that matches no rows is not a success', () => {
  assert.throws(
    () => assertEmployerPersisted(null, null),
    (error: unknown) => error instanceof EmployerWriteError && error.code === 'not_persisted',
  );
});

test('a unique email collision is reported and not treated as saved', () => {
  assert.throws(
    () => assertEmployerPersisted(null, {
      code: '23505',
      message: 'duplicate key value violates unique constraint "employers_email_key"',
    }),
    (error: unknown) => error instanceof EmployerWriteError && error.code === 'email_taken',
  );
});

test('a returned row is the persisted employer', () => {
  const row = { id: LINKED, company_name: 'AKAY EĞİTİM' };
  assert.equal(assertEmployerPersisted(row, null), row);
});
