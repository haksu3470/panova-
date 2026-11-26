import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BENEFIT_KEYS,
  benefitLabels,
  benefitsText,
  cleanBenefits,
  offerBenefits,
  requestBenefits,
  requestOptionalBenefitColumns,
} from './benefits.ts';

test('every language labels every benefit', () => {
  for (const [lang, l] of Object.entries(benefitLabels)) {
    for (const k of BENEFIT_KEYS) assert.ok(l[k], `${lang} ${k}`);
  }
});

test('cleanBenefits keeps known keys in list order without repeats', () => {
  assert.deepEqual(cleanBenefits(['work_gear', 'x', 'meals', 'meals']), ['meals', 'work_gear']);
  assert.deepEqual(cleanBenefits(null), []);
});

test('request benefits come from the old columns and extra_benefits', () => {
  assert.deepEqual(
    requestBenefits({ accommodation_provided: true, food_provided: false, flight_covered: true, extra_benefits: ['permit_fees'] }),
    ['accommodation', 'flight_out', 'permit_fees'],
  );
  assert.deepEqual(requestOptionalBenefitColumns(['transport', 'health_insurance', 'accommodation']), {
    transport_provided: true,
    flight_covered: false,
    extra_benefits: ['health_insurance'],
  });
});

test('offer benefits are read from offer_terms and shown in the page language', () => {
  const offer = { offer_terms: { currency: 'EUR', benefits: ['meals', 'accommodation'] } };
  assert.deepEqual(offerBenefits(offer), ['accommodation', 'meals']);
  assert.equal(benefitsText(offerBenefits(offer), 'tr'), 'Konaklama · Yemek');
  assert.deepEqual(offerBenefits({ offer_terms: null }), []);
});
