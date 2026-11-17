import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const { staffMfaMode } = await import('./staffMfa.ts');

test('challenges when a verified factor still needs aal2', () => {
  assert.equal(
    staffMfaMode({ required: false, verified: true, currentLevel: 'aal1' }),
    'challenge',
  );
});

test('challenges enroll when MFA is required and no factor exists', () => {
  assert.equal(
    staffMfaMode({ required: true, verified: false, currentLevel: 'aal1' }),
    'challenge',
  );
});

test('is done when required and session is aal2', () => {
  assert.equal(
    staffMfaMode({ required: true, verified: true, currentLevel: 'aal2' }),
    'done',
  );
});

test('is optional when not required and no factor', () => {
  assert.equal(
    staffMfaMode({ required: false, verified: false, currentLevel: 'aal1' }),
    'optional',
  );
});

test('is optional when not required but already aal2', () => {
  assert.equal(
    staffMfaMode({ required: false, verified: true, currentLevel: 'aal2' }),
    'optional',
  );
});
