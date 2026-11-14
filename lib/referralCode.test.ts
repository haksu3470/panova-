import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canManagerDeleteOpenCandidate,
  CODE_ISSUING_ROLES,
  isCodeIssuingRole,
  isSourceCountryOfficer,
  matchesReferralCodeFilter,
  normalizeReferralCode,
  referralFilterCodes,
  supervisorReferralCodes,
} from './referralCode.ts';

test('isSourceCountryOfficer is still source_country only', () => {
  assert.equal(isSourceCountryOfficer('source_country'), true);
  assert.equal(isSourceCountryOfficer('SOURCE_COUNTRY'), true);
  assert.equal(isSourceCountryOfficer('target_country'), false);
  assert.equal(isSourceCountryOfficer('field_officer'), false);
  assert.equal(isSourceCountryOfficer('upper_management'), false);
  assert.equal(isSourceCountryOfficer('finance'), false);
  assert.equal(isSourceCountryOfficer('limited'), false);
  assert.equal(isSourceCountryOfficer(null), false);
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

test('source-country officers and field officers are the code-issuing roles', () => {
  assert.equal(isCodeIssuingRole('source_country'), true);
  assert.equal(isCodeIssuingRole('field_officer'), true);
  assert.equal(isCodeIssuingRole('FIELD_OFFICER'), true);
  assert.equal(isCodeIssuingRole('target_country'), false);
  assert.equal(isCodeIssuingRole('upper_management'), false);
  assert.equal(isCodeIssuingRole('finance'), false);
  assert.equal(isCodeIssuingRole('limited'), false);
  assert.equal(isCodeIssuingRole(''), false);
  assert.equal(isCodeIssuingRole(null), false);
  assert.equal(isCodeIssuingRole(undefined), false);
  assert.deepEqual([...CODE_ISSUING_ROLES].sort(), ['field_officer', 'source_country']);
});

test('assignment lists source-country and field officer codes; the filter keeps historical codes', () => {
  const staff = [
    { role_level: 'source_country', referral_code: 'PVSOURCE1' },
    { role_level: 'target_country', referral_code: 'PVTARGET' },
    { role_level: 'field_officer', referral_code: 'PVFIELD01' },
    { role_level: 'field_officer', referral_code: null },
    { role_level: 'upper_management', referral_code: null },
    { role_level: 'finance', referral_code: 'PVFINANCE' },
    { role_level: 'source_country', referral_code: '  ' },
  ];
  assert.deepEqual(supervisorReferralCodes(staff), ['PVFIELD01', 'PVSOURCE1']);
  assert.deepEqual(
    referralFilterCodes(staff, [{ referral_code: 'PVOLD999' }, { referral_code: null }, { referral_code: 'PVSOURCE1' }]),
    ['PVFIELD01', 'PVOLD999', 'PVSOURCE1'],
  );
});
