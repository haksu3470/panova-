import assert from 'node:assert/strict';
import test from 'node:test';
import {
  candidateOfferResponse,
  offerAmount,
  offerCurrency,
  offerMoney,
  offerStatusLabel,
  offerTermsPayload,
} from './offers.ts';

test('offer cards read the stored salary, not an empty salary column', () => {
  const offer = {
    position_title: 'Usta',
    employer_name: 'PANOVA TARIM DOO',
    monthly_net_salary: '1000',
    salary: '',
    offer_terms: { currency: 'eur' },
    terms_details: 'yemek+ulaşım',
    status: 'pending',
  };
  assert.equal(offerAmount(offer), '1000');
  assert.equal(offerCurrency(offer), 'EUR');
  assert.equal(offerMoney(offer), '1000 EUR');
  assert.equal(offerStatusLabel(offer.status, { pending: 'Waiting for the candidate' }), 'Waiting for the candidate');
  assert.equal(offerAmount({ monthly_net_salary: null, salary: null }), '');
  assert.equal(offerMoney({ monthly_net_salary: null }), '');
});

test('a candidate response only sends status and the response time', () => {
  assert.deepEqual(candidateOfferResponse('accepted', '2026-11-09T12:00:00.000Z'), {
    status: 'accepted',
    responded_at: '2026-11-09T12:00:00.000Z',
  });
  assert.deepEqual(offerTermsPayload('MKD', { currency: 'EUR' }), { currency: 'MKD' });
  assert.equal(offerTermsPayload('nope', null), null);
});
