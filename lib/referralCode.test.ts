import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canManagerDeleteOpenCandidate,
  isRegionSupervisor,
  matchesReferralCodeFilter,
  normalizeReferralCode,
  referralFilterCodes,
  supervisorReferralCodes,
} from './referralCode.ts';

test('only source and target country staff are region supervisors', () => {
  assert.equal(isRegionSupervisor('source_country'), true);
  assert.equal(isRegionSupervisor('target_country'), true);
  assert.equal(isRegionSupervisor('SOURCE_COUNTRY'), true);
  assert.equal(isRegionSupervisor('field_officer'), false);
  assert.equal(isRegionSupervisor('upper_management'), false);
  assert.equal(isRegionSupervisor('finance'), false);
  assert.equal(isRegionSupervisor('limited'), false);
  assert.equal(isRegionSupervisor(null), false);
});

test('blank referral codes count as open registration', () => {
  assert.equal(normalizeReferralCode(null), null);
  assert.equal(normalizeReferralCode(undefined), null);
  assert.equal(normalizeReferralCode('   '), null);
  assert.equal(normalizeReferralCode(' PVABC234 '), 'PVABC234');
});

test('managers filter by a code or by no code', () => {
  assert.equal(matchesReferralCodeFilter('PVAAAAAA', 'all'), true);
  assert.equal(matchesReferralCodeFilter(null, 'all'), true);
  assert.equal(matchesReferralCodeFilter(null, 'none'), true);
  assert.equal(matchesReferralCodeFilter('  ', 'none'), true);
  assert.equal(matchesReferralCodeFilter('PVAAAAAA', 'none'), false);
  assert.equal(matchesReferralCodeFilter('PVAAAAAA', 'PVAAAAAA'), true);
  assert.equal(matchesReferralCodeFilter('PVBBBBBB', 'PVAAAAAA'), false);
  assert.equal(matchesReferralCodeFilter(null, 'PVAAAAAA'), false);
});

test('only a manager can delete a candidate with no code', () => {
  assert.equal(canManagerDeleteOpenCandidate(true, null), true);
  assert.equal(canManagerDeleteOpenCandidate(true, ''), true);
  assert.equal(canManagerDeleteOpenCandidate(true, 'PVAAAAAA'), false);
  assert.equal(canManagerDeleteOpenCandidate(false, null), false);
  assert.equal(canManagerDeleteOpenCandidate(false, 'PVAAAAAA'), false);
});

test('assignment lists current supervisors and the filter also keeps historical codes', () => {
  const staff = [
    { role_level: 'source_country', referral_code: 'PVSOURCE1' },
    { role_level: 'target_country', referral_code: 'PVTARGET' },
    { role_level: 'field_officer', referral_code: 'PVFIELD01' },
    { role_level: 'upper_management', referral_code: null },
    { role_level: 'source_country', referral_code: '  ' },
  ];
  assert.deepEqual(supervisorReferralCodes(staff), ['PVSOURCE1', 'PVTARGET']);
  assert.deepEqual(
    referralFilterCodes(staff, [{ referral_code: 'PVOLD999' }, { referral_code: null }, { referral_code: 'PVSOURCE1' }]),
    ['PVOLD999', 'PVSOURCE1', 'PVTARGET'],
  );
});
