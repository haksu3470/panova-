import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CandidateProfileError,
  assertCandidatePersisted,
  candidateAuthMetadata,
  candidateIdentityPayload,
  candidateRegistrationPayload,
  changedCandidateEmail,
  changedCandidatePhoto,
} from './candidateProfile.ts';

const ROW = '7c1a0b2e-4f55-4a1d-9c3e-2b6d8e0a11f4';

test('profile save writes the registration fields onto the existing candidate', () => {
  const payload = candidateIdentityPayload({
    fullName: '  Ayse Yilmaz ',
    passport: ' u1234567 ',
    phone: ' +38970111222 ',
    email: ' Ayse@Example.com ',
    profession: ' Elektrikçi ',
    sector: ' construction ',
  });
  assert.deepEqual(payload, {
    full_name: 'Ayse Yilmaz',
    passport_number: 'U1234567',
    phone: '+38970111222',
    email: 'ayse@example.com',
    profession: 'Elektrikçi',
    sector: 'construction',
  });
  assert.equal('id' in payload, false);
  assert.equal('auth_user_id' in payload, false);
  assert.equal('status' in payload, false);
  assert.equal('is_verified' in payload, false);
  assert.equal('is_demo' in payload, false);
});

test('blank registration fields are rejected before a write', () => {
  assert.throws(
    () => candidateIdentityPayload({
      fullName: ' ',
      passport: '',
      phone: '',
      email: 'not-an-email',
      profession: '',
      sector: '',
    }),
    (error: unknown) => error instanceof CandidateProfileError && error.code === 'invalid',
  );
});

test('auth metadata keeps identity in sync and does not change the login email', () => {
  const identity = candidateIdentityPayload({
    fullName: 'Ayse Yilmaz',
    passport: 'U1234567',
    phone: '+38970111222',
    email: 'ayse@example.com',
    profession: 'Elektrikçi',
    sector: 'construction',
  });
  const metadata = candidateAuthMetadata(identity);
  assert.equal(metadata.full_name, 'Ayse Yilmaz');
  assert.equal(metadata.passport_number, 'U1234567');
  assert.equal(metadata.phone, '+38970111222');
  assert.equal(metadata.profession, 'Elektrikçi');
  assert.equal(metadata.sector, 'construction');
  assert.equal('email' in metadata, false);
  assert.equal('password' in metadata, false);
  assert.equal('role' in metadata, false);
});

test('a phone collision is not treated as a saved profile', () => {
  assert.throws(
    () => assertCandidatePersisted(null, {
      code: '23505',
      message: 'duplicate key value violates unique constraint "unique_candidate_phone"',
    }),
    (error: unknown) => error instanceof CandidateProfileError && error.code === 'phone',
  );
});

test('a passport collision is not treated as a saved profile', () => {
  assert.throws(
    () => assertCandidatePersisted(null, {
      code: '23505',
      message: 'duplicate key value violates unique constraint "unique_candidate_passport"',
    }),
    (error: unknown) => error instanceof CandidateProfileError && error.code === 'passport',
  );
});

test('an email collision is not treated as a saved profile', () => {
  assert.throws(
    () => assertCandidatePersisted(null, {
      code: '23505',
      details: 'Key (lower(email)) already exists.',
      message: 'duplicate key value violates unique constraint "unique_candidate_email"',
    }),
    (error: unknown) => error instanceof CandidateProfileError && error.code === 'email',
  );
});

test('a write that matches no rows is not a success', () => {
  assert.throws(
    () => assertCandidatePersisted(null, null),
    (error: unknown) => error instanceof CandidateProfileError && error.code === 'not_persisted',
  );
});

test('a returned row is the persisted candidate', () => {
  const row = { id: ROW, full_name: 'Ayse Yilmaz', passport_number: 'U1234567' };
  assert.equal(assertCandidatePersisted(row, null), row);
});

test('registration save does not include email, photo, or privileged columns', () => {
  const payload = candidateRegistrationPayload({
    fullName: '  Ayse Yilmaz ',
    passport: ' u1234567 ',
    phone: ' +38970111222 ',
    profession: ' Elektrikçi ',
    sector: ' construction ',
  });
  assert.deepEqual(payload, {
    full_name: 'Ayse Yilmaz',
    passport_number: 'U1234567',
    phone: '+38970111222',
    profession: 'Elektrikçi',
    sector: 'construction',
  });
  assert.equal('email' in payload, false);
  assert.equal('photo_url' in payload, false);
  assert.equal('auth_user_id' in payload, false);
  assert.equal('documents_json' in payload, false);
});

test('an unchanged email is not written again', () => {
  assert.equal(changedCandidateEmail('Ayse@Example.com', ' ayse@example.com '), null);
  assert.equal(changedCandidateEmail('ayse@example.com', 'new@example.com'), 'new@example.com');
  assert.throws(
    () => changedCandidateEmail('ayse@example.com', 'not-an-email'),
    (error: unknown) => error instanceof CandidateProfileError && error.code === 'invalid',
  );
});

test('an unchanged photo is not sent with the profile save', () => {
  assert.equal(changedCandidatePhoto('data:image/png;base64,abc', 'data:image/png;base64,abc'), null);
  assert.equal(changedCandidatePhoto('', ''), null);
  assert.equal(changedCandidatePhoto('data:image/png;base64,abc', ''), '');
  assert.equal(changedCandidatePhoto(null, 'data:image/png;base64,next'), 'data:image/png;base64,next');
});
