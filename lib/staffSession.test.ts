import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { listenerMayRevokeSharedSession } from './staffSession.ts';

const portal = readFileSync(new URL('../app/portal/page.tsx', import.meta.url), 'utf8');

test('a background portal tab must not revoke a candidate sign-in', () => {
  assert.equal(listenerMayRevokeSharedSession(false, false), false);
  assert.equal(listenerMayRevokeSharedSession(false, true), false);
  assert.equal(listenerMayRevokeSharedSession(true, false), false);
});

test('only a visible portal tab that started OAuth may revoke a non-staff session', () => {
  assert.equal(listenerMayRevokeSharedSession(true, true), true);
});

test('the portal listener keeps a candidate session signed in', () => {
  assert.match(portal, /document\.visibilityState !== 'visible'/);
  assert.match(portal, /listenerMayRevokeSharedSession\(consumeOAuthIntent\(PORTAL_OAUTH_PATH\), true\)/);
  assert.match(portal, /if \(revokeOnFailure\) await signOut\(\)/);
  assert.match(portal, /enterStaff\(authData\.user\.id, authData\.user\.email \|\| loginEmail, undefined, true, true, true\)/);
});
