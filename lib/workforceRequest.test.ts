import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { register } from 'node:module';
import test from 'node:test';
import { translations, type Language } from './dictionary.ts';
import type { DemandFormInput, EmployerDemandDraft } from './workforceRequest.ts';

// workforceRequest imports ./money without an extension (as Next expects).
await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);
const {
  benefitPhrase,
  benefitsAnswered,
  buildEmployerDemandInsert,
  DEMAND_FIELDS,
  demandFieldMessage,
  demandRuleFromDbError,
  displayedRequestSalary,
  firstInvalidDemandField,
  JOB_REQUEST_RULES,
  parseMonthlyNetSalary,
  validateDemandForm,
} = await import('./workforceRequest.ts');

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
  'demandErrRequired',
  'demandErrSector',
  'demandErrPosition',
  'demandErrHeadcount',
  'demandErrCity',
  'demandErrDuration',
  'demandErrSalaryRange',
  'demandErrExperience',
  'demandErrCompanyName',
  'demandErrSummary',
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
  salaryText: '1200',
  currency: 'EUR',
  duration: '12 ay',
  startDate: '',
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
    'salary_currency',
    'sector',
    'status',
    // existing column, null when no start date is picked
    'target_start_date',
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

const form = (overrides: Partial<DemandFormInput> = {}): DemandFormInput => ({
  sector: 'agriculture',
  positionTitle: 'Harvest worker',
  experience: '1-3',
  language: 'english_basic',
  headcountText: '5',
  city: 'Struga',
  salaryText: '1200',
  durationUnit: 'ay',
  durationAmountText: '12',
  startDate: '',
  today: '2026-11-14',
  lodging: 'yes',
  meals: 'no',
  ...overrides,
});

test('a valid form has no field errors', () => {
  assert.deepEqual(validateDemandForm(form()), {});
  assert.equal(firstInvalidDemandField({}), null);
});

test('blank required fields are each reported under their own field', () => {
  const errors = validateDemandForm(form({
    sector: '', positionTitle: '  ', experience: '', language: '', headcountText: '', city: '   ', salaryText: '', durationUnit: '', durationAmountText: '', lodging: '', meals: '',
  }));
  // the start date is optional (target_start_date accepts null)
  assert.deepEqual(Object.keys(errors).sort(), DEMAND_FIELDS.filter((f) => f !== 'startDate').sort());
  assert.ok(Object.values(errors).every((e) => e === 'required'));
  assert.equal(firstInvalidDemandField(errors), 'sector');
  assert.equal(firstInvalidDemandField({ salary: 'salary_range', city: 'required' }), 'city');
});

test('headcount: whole number from 1 to 500', () => {
  for (const ok of ['1', '500', ' 42 ']) assert.equal(validateDemandForm(form({ headcountText: ok })).headcount, undefined, ok);
  for (const bad of ['0', '501', '2.5', '-3', 'abc', '1e2']) assert.equal(validateDemandForm(form({ headcountText: bad })).headcount, 'headcount_range', bad);
});

test('salary: more than 0 and at most 100000', () => {
  for (const ok of ['1', '100000', '100.000', '1.200,50']) assert.equal(validateDemandForm(form({ salaryText: ok })).salary, undefined, ok);
  for (const bad of ['0', '100000.01', '150.000', '250000']) assert.equal(validateDemandForm(form({ salaryText: bad })).salary, 'salary_range', bad);
  assert.equal(validateDemandForm(form({ salaryText: 'negotiable' })).salary, 'salary_number');
});

test('experience: one of the choices (0 to 60 years)', () => {
  for (const ok of ['none', '1-3', '3-5', '5+']) assert.equal(validateDemandForm(form({ experience: ok })).experience, undefined, ok);
  assert.equal(validateDemandForm(form({ experience: '70' })).experience, 'experience_range');
});

test('database rule refusals map to the field they belong to', () => {
  for (const [rule, target] of Object.entries(JOB_REQUEST_RULES)) {
    const error = { code: '23514', message: `new row for relation "job_requests" violates check constraint "${rule}"`, details: null };
    assert.deepEqual(demandRuleFromDbError(error), { ...target, rule }, rule);
  }
  assert.equal(Object.keys(JOB_REQUEST_RULES).length, 8);
  assert.equal(demandRuleFromDbError({ code: '23514', message: 'violates check constraint "other_rule"' }), null);
  assert.equal(demandRuleFromDbError({ code: '42501', message: 'request_fields_staff_only' }), null);
  assert.equal(demandRuleFromDbError({ message: 'check_violation', details: 'job_requests_salary_range' })?.field, 'salary');
  assert.equal(demandRuleFromDbError(null), null);
});

test('every field error has a translated message in five languages', () => {
  const cases: [Parameters<typeof demandFieldMessage>[0], Parameters<typeof demandFieldMessage>[1]][] = [
    ...DEMAND_FIELDS.map((f) => [f, 'required'] as [typeof f, 'required']),
    ['headcount', 'headcount_range'], ['salary', 'salary_range'], ['salary', 'salary_number'], ['experience', 'experience_range'], ['company', 'required'],
    ['duration', 'duration_number'], ['startDate', 'date_past'], ['startDate', 'date_invalid'],
  ];
  for (const lang of LOCALES) {
    for (const [field, error] of cases) {
      const text = demandFieldMessage(field, error, translations[lang]);
      assert.ok(text.trim(), `${lang} ${field} ${error}`);
      if (lang !== 'en') assert.notEqual(text, demandFieldMessage(field, error, translations.en), `${lang} ${field} ${error} is English`);
    }
  }
  assert.equal(demandFieldMessage('salary', 'salary_range', translations.tr), translations.tr.demandErrSalaryRange);
  assert.equal(demandFieldMessage('headcount', 'required', translations.tr), translations.tr.demandErrHeadcount);
});

test('employer form: messages under fields, aria wiring, focus, submit never disabled', () => {
  const page = readFileSync(join(import.meta.dirname, '..', 'app/employer/page.tsx'), 'utf8');
  const start = page.indexOf('onSubmit={handleCreateCorporateDemand}');
  const formSrc = page.slice(start, page.indexOf('</form>', start));
  for (const field of DEMAND_FIELDS) {
    assert.ok(formSrc.includes(`demandFieldNote('${field}')`), `note under ${field}`);
    assert.ok(formSrc.includes(`demandAria('${field}')`), `aria on ${field}`);
  }
  assert.ok(page.includes("'aria-describedby': demandErrorId(field)"));
  assert.ok(page.includes('document.getElementById(id)?.focus()'));
  assert.ok(page.includes('validateDemandForm('));
  assert.ok(page.includes('demandRuleFromDbError(error)'));
  const submit = formSrc.slice(formSrc.lastIndexOf('<button type="submit"'));
  assert.equal(/disabled/.test(submit.slice(0, submit.indexOf('>'))), false);
});

test('duration: number + unit, or open-ended; amount 1-999', () => {
  for (const unit of ['gün', 'hafta', 'ay', 'yıl'] as const) {
    assert.equal(validateDemandForm(form({ durationUnit: unit, durationAmountText: '1' })).duration, undefined, unit);
    assert.equal(validateDemandForm(form({ durationUnit: unit, durationAmountText: '999' })).duration, undefined, unit);
  }
  assert.equal(validateDemandForm(form({ durationUnit: '', durationAmountText: '12' })).duration, 'required');
  assert.equal(validateDemandForm(form({ durationUnit: 'ay', durationAmountText: ' ' })).duration, 'required');
  for (const bad of ['0', '1000', '2.5', '-3', 'abc', '1e2']) {
    assert.equal(validateDemandForm(form({ durationUnit: 'ay', durationAmountText: bad })).duration, 'duration_number', bad);
  }
  // open-ended: the number field is closed and ignored
  assert.equal(validateDemandForm(form({ durationUnit: 'open', durationAmountText: '' })).duration, undefined);
  assert.equal(validateDemandForm(form({ durationUnit: 'open', durationAmountText: 'abc' })).duration, undefined);
  assert.equal(demandFieldMessage('duration', 'duration_number', translations.tr), translations.tr.demandErrDurationNumber);
  assert.equal(demandFieldMessage('duration', 'required', translations.tr), translations.tr.demandErrDuration);
});

test('start date: optional, real date, not before today', () => {
  assert.equal(validateDemandForm(form({ startDate: '' })).startDate, undefined);
  assert.equal(validateDemandForm(form({ startDate: '2026-11-14' })).startDate, undefined, 'today is allowed');
  assert.equal(validateDemandForm(form({ startDate: '2027-02-01' })).startDate, undefined);
  assert.equal(validateDemandForm(form({ startDate: '2026-11-13' })).startDate, 'date_past');
  assert.equal(validateDemandForm(form({ startDate: '2026-02-30' })).startDate, 'date_invalid');
  assert.equal(validateDemandForm(form({ startDate: '14.11.2026' })).startDate, 'date_invalid');
});

test('the insert row carries the canonical duration and the start date (or null)', () => {
  const built = buildEmployerDemandInsert(draft({ duration: '90 gün', startDate: '2027-01-10' }));
  assert.ok(built.ok);
  if (built.ok) {
    assert.equal(built.row.contract_type, '90 gün');
    assert.equal(built.row.target_start_date, '2027-01-10');
  }
  const noDate = buildEmployerDemandInsert(draft({ duration: 'süresiz', startDate: '' }));
  assert.ok(noDate.ok && noDate.row.target_start_date === null && noDate.row.contract_type === 'süresiz');
});

test('employer form: duration picker, open-ended closes the number, date input with min today', () => {
  const page = readFileSync(join(import.meta.dirname, '..', 'app/employer/page.tsx'), 'utf8');
  assert.match(page, /id="demand-duration"\s+type="number"/);
  assert.match(page, /disabled=\{demandDurationUnit === 'open'\}/);
  for (const unit of ['gün', 'hafta', 'ay', 'yıl', 'open']) assert.ok(page.includes(`<option value="${unit}">`), unit);
  assert.match(page, /id="demand-start-date"\s+type="date"\s+min=\{localIsoDate\(\)\}/);
  assert.ok(page.includes('canonicalDuration(demandDurationUnit, demandDurationAmount)'));
  assert.ok(page.includes('today: localIsoDate()'));
});
