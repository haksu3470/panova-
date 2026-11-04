import assert from 'node:assert/strict';
import test from 'node:test';
import { translations, type Language } from './dictionary.ts';
import {
  benefitPhrase,
  benefitsAnswered,
  buildEmployerDemandInsert,
  displayedRequestSalary,
  parseMonthlyNetSalary,
  type EmployerDemandDraft,
} from './workforceRequest.ts';

const LOCALES: Language[] = ['tr', 'en', 'sq', 'ar', 'mk'];
const COPY_KEYS = [
  'benefitSelectPlaceholder',
  'benefitProvided',
  'benefitNotProvided',
  'benefitUnanswered',
  'lodgingRequired',
  'mealsRequired',
  'lodgingAndMealsRequired',
  'salaryAmountRequired',
  'demandSaveFailed',
  'facilityAccommodation',
  'facilityFood',
] as const;
const TURKISH_LETTERS = /[ğışöüĞİŞÖÜ]/;

const draft = (overrides: Partial<EmployerDemandDraft> = {}): EmployerDemandDraft => ({
  employerId: 'emp-1',
  employerName: 'Panova Farm',
  country: 'North Macedonia',
  positionTitle: 'Harvest worker',
  sector: 'agriculture',
  headcount: 5,
  city: 'Struga',
  salaryText: '1200 EUR',
  duration: '12 months',
  experience: '1-3',
  language: 'English (intermediate)',
  lodging: 'yes',
  meals: 'no',
  ...overrides,
});

test('a request cannot be built until lodging and meals are answered', () => {
  assert.equal(buildEmployerDemandInsert(draft({ lodging: '', meals: '' })).ok, false);
  assert.deepEqual(buildEmployerDemandInsert(draft({ lodging: '', meals: '' })), { ok: false, error: 'both' });
  assert.equal(buildEmployerDemandInsert(draft({ lodging: '' })).ok === false && (buildEmployerDemandInsert(draft({ lodging: '' })) as { error: string }).error, 'lodging');
  assert.equal((buildEmployerDemandInsert(draft({ meals: '' })) as { error: string }).error, 'meals');
  assert.equal(benefitsAnswered(null, false), 'lodging');
  assert.equal(benefitsAnswered(true, null), 'meals');
  assert.equal(benefitsAnswered(false, true), null);
});

test('answered lodging and meals are stored on the existing boolean columns', () => {
  const built = buildEmployerDemandInsert(draft());
  assert.equal(built.ok, true);
  if (!built.ok) return;
  assert.equal(built.row.accommodation_provided, true);
  assert.equal(built.row.food_provided, false);
  assert.equal(built.row.monthly_net_salary, 1200);
  assert.equal(built.row.required_experience_years, 1);
  assert.equal(built.row.country, 'North Macedonia');
  assert.equal('salary' in built.row, false);
  assert.equal('job_description' in built.row, false);
  assert.deepEqual(Object.keys(built.row).sort(), [
    'accommodation_provided',
    'city',
    'contract_type',
    'country',
    'employer_id',
    'employer_name',
    'food_provided',
    'headcount',
    'monthly_net_salary',
    'position_title',
    'required_experience_years',
    'required_language',
    'sector',
    'status',
  ]);
});

test('salary text keeps the amount employers already type', () => {
  assert.equal(parseMonthlyNetSalary('1200 EUR'), 1200);
  assert.equal(parseMonthlyNetSalary('1.200 EUR'), 1200);
  assert.equal(parseMonthlyNetSalary('1,200'), 1200);
  assert.equal(parseMonthlyNetSalary('1.200,50'), 1200.5);
  assert.equal(parseMonthlyNetSalary('1,200.50'), 1200.5);
  assert.equal(parseMonthlyNetSalary('negotiable'), null);
  assert.equal(parseMonthlyNetSalary('0'), null);
  assert.equal((buildEmployerDemandInsert(draft({ salaryText: 'included' })) as { error: string }).error, 'salary');
});

test('lodging and meals copy exists in every locale', () => {
  for (const lang of LOCALES) {
    for (const key of COPY_KEYS) {
      const value = translations[lang][key];
      assert.equal(typeof value, 'string', `${lang}.${key}`);
      assert.equal(value?.trim().length ? true : false, true, `${lang}.${key}`);
      if (lang !== 'tr') assert.equal(TURKISH_LETTERS.test(value || ''), false, `${lang}.${key}: ${value}`);
    }
  }
  assert.equal(translations.tr.lodgingRequired, 'Konaklama seçimi zorunludur.');
  assert.equal(translations.en.mealsRequired, 'Choose whether meals are provided.');
  assert.equal(translations.sq.facilityAccommodation?.includes('Konak'), false);
  assert.match(translations.ar.lodgingAndMealsRequired || '', /الإقامة/);
  assert.match(translations.mk.benefitSelectPlaceholder || '', /[А-Яа-я]/);
});

test('view labels distinguish provided, not provided, and unanswered', () => {
  const labels = { provided: 'Provided', notProvided: 'Not provided', unanswered: 'Not specified' };
  assert.equal(benefitPhrase(labels, true), 'Provided');
  assert.equal(benefitPhrase(labels, false), 'Not provided');
  assert.equal(benefitPhrase(labels, null), 'Not specified');
  assert.equal(displayedRequestSalary({ monthly_net_salary: 1300 }), '1300');
  assert.equal(displayedRequestSalary({ salary: '950 EUR', monthly_net_salary: 1 }), '950 EUR');
  assert.equal(displayedRequestSalary({}), '');
});
