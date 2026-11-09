import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const { canOpenStaffFile, isUpperManagementRole, tabsForStaffRole } = await import('./staffAccess.ts');

test('portal tabs follow the role catalog', () => {
  assert.deepEqual(tabsForStaffRole('upper_management'), [
    'overview', 'candidates', 'requests', 'staff', 'tasks', 'audit', 'employers', 'support',
  ]);
  assert.deepEqual(tabsForStaffRole('source_country'), ['candidates', 'requests', 'tasks']);
  assert.deepEqual(tabsForStaffRole('target_country'), ['candidates', 'requests', 'tasks', 'employers']);
  assert.deepEqual(tabsForStaffRole('field_officer'), ['overview', 'candidates', 'tasks', 'support']);
  assert.deepEqual(tabsForStaffRole('finance'), ['overview', 'tasks']);
  assert.deepEqual(tabsForStaffRole(''), ['overview', 'tasks']);
});

test('file routes stay with the roles that own those screens', () => {
  assert.equal(canOpenStaffFile('source_country', 'dossier'), true);
  assert.equal(canOpenStaffFile('source_country', 'requestFile'), true);
  assert.equal(canOpenStaffFile('source_country', 'employerFile'), false);
  assert.equal(canOpenStaffFile('target_country', 'employerFile'), true);
  assert.equal(canOpenStaffFile('target_country', 'requestFile'), true);
  assert.equal(canOpenStaffFile('field_officer', 'dossier'), true);
  assert.equal(canOpenStaffFile('field_officer', 'requestFile'), false);
  assert.equal(canOpenStaffFile('field_officer', 'employerFile'), false);
  assert.equal(canOpenStaffFile('upper_management', 'employerFile'), true);
  assert.equal(canOpenStaffFile('limited', 'dossier'), false);
  assert.equal(isUpperManagementRole('upper_management'), true);
  assert.equal(isUpperManagementRole('source_country'), false);
});
