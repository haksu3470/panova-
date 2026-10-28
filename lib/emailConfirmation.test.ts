import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyCandidateLinkError, parseVerificationInput } from './emailConfirmation.ts';

test('a numeric code is the OTP the form submits to verifyOtp', () => {
  assert.deepEqual(parseVerificationInput(' 123 456 '), { kind: 'otp', token: '123456' });
  assert.deepEqual(parseVerificationInput('1234-5678'), { kind: 'otp', token: '12345678' });
  assert.deepEqual(parseVerificationInput(''), { kind: 'empty' });
  assert.deepEqual(parseVerificationInput('   '), { kind: 'empty' });
});

test('a confirmation link is exchanged as a token hash', () => {
  const parsed = parseVerificationInput(
    'https://vptcihlhkzfmwxpaituf.supabase.co/auth/v1/verify?token=abc123def4567890&type=signup&redirect_to=https%3A%2F%2Fpanovagroup.org%2Fcandidate',
  );
  assert.equal(parsed.kind, 'hash');
  if (parsed.kind !== 'hash') return;
  assert.equal(parsed.tokenHash, 'abc123def4567890');
  assert.equal(parsed.types[0], 'signup');
  assert.ok(parsed.types.includes('email'));
  assert.ok(parsed.types.includes('magiclink'));
});

test('a magic-link URL prefers the email and magiclink types', () => {
  const parsed = parseVerificationInput(
    'Open https://example.supabase.co/auth/v1/verify?token=deadbeefdeadbeef&type=magiclink please',
  );
  assert.equal(parsed.kind, 'hash');
  if (parsed.kind !== 'hash') return;
  assert.equal(parsed.types[0], 'magiclink');
  assert.equal(parsed.types[1], 'email');
});

test('candidate link errors map to the screen that can finish registration', () => {
  assert.equal(classifyCandidateLinkError('Candidate phone already used'), 'phone');
  assert.equal(classifyCandidateLinkError('Candidate passport already used'), 'passport');
  assert.equal(classifyCandidateLinkError('Candidate already registered'), 'email');
  assert.equal(classifyCandidateLinkError('Email not confirmed'), 'unconfirmed');
  assert.equal(classifyCandidateLinkError('No unmatched candidate for this email'), 'missing');
  assert.equal(classifyCandidateLinkError('permission denied'), 'other');
  assert.equal(classifyCandidateLinkError(undefined), 'other');
});
