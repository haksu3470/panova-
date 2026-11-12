import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const {
  canDecideForEmployer, canEditMeetingUrl, canOpenStaffFile, canUpdateRequestStatus, isUpperManagementRole, tabsForStaffRole,
} = await import('./staffAccess.ts');

test('only upper management may change a request status by hand', () => {
  assert.equal(canUpdateRequestStatus('upper_management'), true);
  assert.equal(canUpdateRequestStatus(' Upper_Management '), true);
  assert.equal(canUpdateRequestStatus('target_country'), false);
  assert.equal(canUpdateRequestStatus('source_country'), false);
  assert.equal(canUpdateRequestStatus('field_officer'), false);
  assert.equal(canUpdateRequestStatus('finance'), false);
  assert.equal(canUpdateRequestStatus('limited'), false);
  assert.equal(canUpdateRequestStatus(''), false);
  assert.equal(canUpdateRequestStatus(null), false);
  assert.equal(canUpdateRequestStatus(undefined), false);
});

test('only upper management and target country may edit the meeting link', () => {
  assert.equal(canEditMeetingUrl('upper_management'), true);
  assert.equal(canEditMeetingUrl(' Target_Country '), true);
  assert.equal(canEditMeetingUrl('source_country'), false);
  assert.equal(canEditMeetingUrl('field_officer'), false);
  assert.equal(canEditMeetingUrl('finance'), false);
  assert.equal(canEditMeetingUrl(''), false);
  assert.equal(canEditMeetingUrl(null), false);
});

test('only upper management and target country may decide for an employer', () => {
  assert.equal(canDecideForEmployer('upper_management'), true);
  assert.equal(canDecideForEmployer(' Target_Country '), true);
  assert.equal(canDecideForEmployer('source_country'), false);
  assert.equal(canDecideForEmployer('field_officer'), false);
  assert.equal(canDecideForEmployer('finance'), false);
  assert.equal(canDecideForEmployer('limited'), false);
  assert.equal(canDecideForEmployer(''), false);
  assert.equal(canDecideForEmployer(null), false);
});

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
