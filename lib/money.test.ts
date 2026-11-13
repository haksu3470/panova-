import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import { translations } from './dictionary.ts';
import {
  DEFAULT_SALARY_CURRENCY,
  formatSalary,
  offerDefaultsFromRequest,
  parseSalaryInput,
  requestCurrency,
  SALARY_CURRENCIES,
  salaryCurrency,
} from './money.ts';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);
const { buildEmployerDemandInsert, displayedRequestSalary, validateDemandForm } = await import('./workforceRequest.ts');
const { offerMoney } = await import('./offers.ts');

const ROOT = join(import.meta.dirname, '..');
const LANGS = ['tr', 'en', 'sq', 'ar', 'mk'] as const;
const nbsp = (s: string) => s.replace(/[  ‏؜]/g, ' ').trim();

test('formatSalary shows the currency, by locale, whole amounts without decimals', () => {
  assert.equal(nbsp(formatSalary(1400, 'USD', 'en-GB')), '$1,400');
  assert.equal(nbsp(formatSalary(1400, 'EUR', 'en-GB')), '€1,400');
  assert.match(nbsp(formatSalary(1400, 'EUR', 'tr-TR')), /^€1\.400$/);
  assert.match(nbsp(formatSalary('1400.5', 'EUR', 'mk-MK')), /1\.400,50/);
  assert.match(formatSalary(1400, 'EUR', 'mk-MK'), /€/);
  assert.match(formatSalary(1400, 'USD', 'ar'), /\$|US/);
  assert.equal(formatSalary(null, 'EUR', 'tr-TR'), '');
  assert.equal(formatSalary('', 'EUR', 'tr-TR'), '');
  assert.equal(formatSalary('abc', 'EUR', 'tr-TR'), '');
  assert.equal(nbsp(formatSalary(900, '', 'en-GB')), '€900', 'no currency means EUR');
  assert.equal(formatSalary(900, 'ZZZZ', 'en-GB'), '900 ZZZZ');
});

test('request currency is EUR or USD, EUR by default', () => {
  assert.deepEqual([...SALARY_CURRENCIES], ['EUR', 'USD']);
  assert.equal(DEFAULT_SALARY_CURRENCY, 'EUR');
  assert.equal(salaryCurrency('usd'), 'USD');
  assert.equal(salaryCurrency('GBP'), 'EUR');
  assert.equal(requestCurrency({}), 'EUR');
  assert.equal(requestCurrency(null), 'EUR');
  assert.equal(requestCurrency({ salary_currency: 'USD' }), 'USD');
});

test('salary field accepts numbers only', () => {
  for (const [text, value] of [['1400', 1400], ['1.400', 1400], ['1 400', 1400], ['1400,50', 1400.5], ['1,400.50', 1400.5], ['100000', 100000]] as const) {
    assert.equal(parseSalaryInput(text), value, text);
  }
  for (const text of ['1550 euro', '€1400', '1400€', '$1,400', 'negotiable', '', '0', '-5', '1.2.3']) {
    assert.equal(parseSalaryInput(text), null, text);
  }
});

test('request form: numbers only, more than 0 and at most 100000, currency sent', () => {
  const form = { sector: 's', positionTitle: 'p', experience: '1-3', language: 'l', headcountText: '2', city: 'c', duration: 'd', lodging: 'yes' as const, meals: 'no' as const };
  assert.equal(validateDemandForm({ ...form, salaryText: '1550 euro' }).salary, 'salary_number');
  assert.equal(validateDemandForm({ ...form, salaryText: '0' }).salary, 'salary_range');
  assert.equal(validateDemandForm({ ...form, salaryText: '100001' }).salary, 'salary_range');
  assert.equal(validateDemandForm({ ...form, salaryText: '100000' }).salary, undefined);
  const draft = {
    employerId: 'e', employerName: 'E', country: '', positionTitle: 'p', sector: 's', headcount: 2, city: 'c',
    salaryText: '1400', duration: 'd', experience: '1-3', language: 'l', lodging: 'yes' as const, meals: 'no' as const,
  };
  const usd = buildEmployerDemandInsert({ ...draft, currency: 'USD' });
  assert.ok(usd.ok && usd.row.salary_currency === 'USD' && usd.row.monthly_net_salary === 1400);
  const eur = buildEmployerDemandInsert({ ...draft, currency: 'EUR' });
  assert.ok(eur.ok && eur.row.salary_currency === 'EUR');
  assert.equal(buildEmployerDemandInsert({ ...draft, currency: 'EUR', salaryText: '1550 euro' }).ok, false);
});

test('request cards show the amount with its currency', () => {
  assert.equal(nbsp(displayedRequestSalary({ monthly_net_salary: 1400, salary_currency: 'USD' }, 'en-GB')), '$1,400');
  assert.equal(nbsp(displayedRequestSalary({ monthly_net_salary: '1000' }, 'en-GB')), '€1,000', 'missing currency is EUR');
  assert.equal(displayedRequestSalary({ salary: '950 EUR', monthly_net_salary: 1 }, 'en-GB'), '950 EUR', 'old free text as typed');
  assert.equal(displayedRequestSalary({ monthly_net_salary: 1300 }), '1300', 'no locale: bare number (exports)');
  assert.equal(nbsp(offerMoney({ monthly_net_salary: 1200, offer_terms: { currency: 'USD' } }, 'en-GB')), '$1,200');
  assert.equal(nbsp(offerMoney({ monthly_net_salary: 1200 }, 'en-GB')), '€1,200');
  assert.equal(offerMoney({ monthly_net_salary: 1200, offer_terms: { currency: 'EUR' } }), '1200 EUR');
});

test('a new offer takes salary and currency from the request; EUR without one', () => {
  assert.deepEqual(offerDefaultsFromRequest({ monthly_net_salary: 1400, salary_currency: 'USD' }), { monthly_net_salary: '1400', currency: 'USD' });
  assert.deepEqual(offerDefaultsFromRequest({ monthly_net_salary: null }), { monthly_net_salary: '', currency: 'EUR' });
  assert.deepEqual(offerDefaultsFromRequest(null), { monthly_net_salary: '', currency: 'EUR' });
  // editing an offer: its own (negotiated) salary, the request's currency
  assert.deepEqual(
    offerDefaultsFromRequest({ monthly_net_salary: 1400, salary_currency: 'USD' }, { monthly_net_salary: 1500, offer_terms: { currency: 'EUR' } }),
    { monthly_net_salary: '1500', currency: 'USD' },
  );
  // no request: the offer keeps what it stored
  assert.deepEqual(offerDefaultsFromRequest(null, { monthly_net_salary: 800, offer_terms: { currency: 'GBP' } }), { monthly_net_salary: '800', currency: 'GBP' });

  const panel = readFileSync(join(ROOT, 'components/portal/InterviewOfferPanel.tsx'), 'utf8');
  assert.ok(panel.includes('...offerDefaultsFromRequest(request)'));
  assert.ok(panel.includes('offerTermsPayload(request ? requestCurrency(request) :'), 'saved currency comes from the request');
  assert.equal(/currency: 'EUR'/.test(panel), false, 'no fixed EUR');
  assert.ok(/\{request \? \([\s\S]{0,300}role="note"/.test(panel), 'currency is not editable when there is a request');
});

test('every salary screen formats with the page locale', () => {
  const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');
  assert.ok(read('app/employer/page.tsx').includes('displayedRequestSalary(dem, dateLocale[currentLang])'));
  assert.ok(read('app/employer/page.tsx').includes('offerMoney(offer, dateLocale[currentLang])'));
  assert.ok(read('app/employer/page.tsx').includes('currency: demandCurrency'));
  assert.ok(read('components/portal/RequestsTab.tsx').includes('displayedRequestSalary(req, dateLocale[currentLang])'));
  assert.ok(read('app/portal/page.tsx').includes('displayedRequestSalary(selectedDemandDetail, dateLocale[currentLang])'));
  assert.ok(read('app/candidate/page.tsx').includes('offerMoney(offer, dateLocale[currentLang])'));
  assert.ok(read('app/portal/requests/[id]/page.tsx').includes("'salary_currency'"));
  assert.ok(read('app/portal/candidates/[id]/page.tsx').includes('offerTermsPayload(DEFAULT_SALARY_CURRENCY)'));
});

test('new texts in five languages, translated', () => {
  for (const lang of LANGS) {
    for (const key of ['salaryNumberPlaceholder', 'salaryNumberHint', 'offerCurrencyFromRequest'] as const) {
      const v = translations[lang][key];
      assert.ok(v?.trim(), `${lang}.${key}`);
      if (key !== 'offerCurrencyFromRequest') assert.ok(v!.includes('{symbol}'), `${lang}.${key}`);
      if (lang !== 'en') assert.notEqual(v, translations.en[key], `${lang}.${key}`);
    }
  }
});

test('SQL record files exist', () => {
  const up = readFileSync(join(ROOT, 'supabase/migrations/20261113190000_job_requests_salary_currency.sql'), 'utf8');
  const down = readFileSync(join(ROOT, 'supabase/rollback/20261113190000_job_requests_salary_currency_rollback.sql'), 'utf8');
  assert.match(up, /add column if not exists salary_currency text not null default 'EUR'/);
  assert.match(up, /check \(salary_currency in \('EUR', 'USD'\)\)/);
  assert.ok(down.indexOf('drop constraint') < down.indexOf('drop column'));
});
