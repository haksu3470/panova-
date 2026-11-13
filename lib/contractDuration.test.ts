import assert from 'node:assert/strict';
import test from 'node:test';
import { translations, type Language } from './dictionary.ts';
import {
  canonicalDuration,
  durationChoiceFrom,
  formatContractDuration,
  isIsoDate,
  localIsoDate,
  parseContractDuration,
  parseDurationAmount,
  pluralForm,
} from './contractDuration.ts';

const LOCALES: Language[] = ['tr', 'en', 'sq', 'ar', 'mk'];
const fmt = (text: unknown, lang: Language) => formatContractDuration(text, lang, translations[lang]);

test('canonical form: number + fixed Turkish unit code, or "süresiz"', () => {
  assert.equal(canonicalDuration('ay', '12'), '12 ay');
  assert.equal(canonicalDuration('gün', ' 90 '), '90 gün');
  assert.equal(canonicalDuration('hafta', '6'), '6 hafta');
  assert.equal(canonicalDuration('yıl', '2'), '2 yıl');
  assert.equal(canonicalDuration('open', ''), 'süresiz');
  assert.equal(canonicalDuration('open', '12'), 'süresiz');
  assert.equal(canonicalDuration('', '12'), null);
  for (const bad of ['', '0', '1000', '2.5', '-1', 'abc', '012x']) assert.equal(canonicalDuration('ay', bad), null, bad);
  assert.equal(parseDurationAmount('007'), 7);
});

test('parsing reads only the canonical form', () => {
  assert.deepEqual(parseContractDuration('12 ay'), { kind: 'fixed', amount: 12, unit: 'ay' });
  assert.deepEqual(parseContractDuration(' 1 yıl '), { kind: 'fixed', amount: 1, unit: 'yıl' });
  assert.deepEqual(parseContractDuration('süresiz'), { kind: 'open' });
  for (const old of ['Sezonluk', '12 ay (sezonluk / tam zamanlı)', '12 months', '12 Ay', '0 ay', '1000 gün', '', null, undefined, 12]) {
    assert.equal(parseContractDuration(old), null, String(old));
  }
  assert.deepEqual(durationChoiceFrom('6 hafta'), { unit: 'hafta', amountText: '6' });
  assert.deepEqual(durationChoiceFrom('süresiz'), { unit: 'open', amountText: '' });
  assert.deepEqual(durationChoiceFrom('Sezonluk'), { unit: '', amountText: '' });
});

test('display in five languages with the right plural forms', () => {
  assert.equal(fmt('12 ay', 'tr'), '12 ay');
  assert.equal(fmt('1 yıl', 'tr'), '1 yıl');
  assert.equal(fmt('12 ay', 'en'), '12 months');
  assert.equal(fmt('1 ay', 'en'), '1 month');
  assert.equal(fmt('90 gün', 'en'), '90 days');
  assert.equal(fmt('1 hafta', 'en'), '1 week');
  assert.equal(fmt('12 ay', 'sq'), '12 muaj');
  assert.equal(fmt('1 yıl', 'sq'), '1 vit');
  assert.equal(fmt('2 yıl', 'sq'), '2 vjet');
  assert.equal(fmt('12 ay', 'mk'), '12 месеци');
  assert.equal(fmt('1 ay', 'mk'), '1 месец');
  assert.equal(fmt('21 gün', 'mk'), '21 ден', 'Macedonian: 21 takes the singular');
  assert.equal(fmt('11 gün', 'mk'), '11 дена');
  // Arabic: one, two, few (3-10), many (11-99), other (100+)
  assert.equal(fmt('1 ay', 'ar'), '1 شهر');
  assert.equal(fmt('2 ay', 'ar'), '2 شهران');
  assert.equal(fmt('3 ay', 'ar'), '3 أشهر');
  assert.equal(fmt('12 ay', 'ar'), '12 شهرًا');
  assert.equal(fmt('100 ay', 'ar'), '100 شهر');
  assert.equal(fmt('5 yıl', 'ar'), '5 سنوات');
  for (const lang of LOCALES) assert.equal(fmt('süresiz', lang), translations[lang].durationOpenShort, lang);
});

test('old free text is shown exactly as stored', () => {
  for (const lang of LOCALES) {
    assert.equal(fmt('Sezonluk', lang), 'Sezonluk');
    assert.equal(fmt('12 ay (sezonluk / tam zamanlı)', lang), '12 ay (sezonluk / tam zamanlı)');
    assert.equal(fmt('  6 months ', lang), '6 months');
    assert.equal(fmt(null, lang), '');
  }
  // the demo seed's "1 yıl" is canonical and is translated; "Sezonluk" stays
  assert.equal(fmt('1 yıl', 'en'), '1 year');
  assert.equal(formatContractDuration('12 ay', 'en', {}), '12 ay', 'no copy: stored text');
});

test('plural helper: 1, 2 and 5 forms', () => {
  assert.equal(pluralForm('gün', 7, 'tr'), 'gün');
  assert.equal(pluralForm('day|days', 1, 'en'), 'day');
  assert.equal(pluralForm('day|days', 0, 'en'), 'days');
  assert.equal(pluralForm('a|b|c|d|e', 2, 'ar'), 'b');
  assert.equal(pluralForm('a|b|c|d|e', 0, 'ar'), 'e', 'Arabic zero uses the last form');
});

test('every language has the unit forms, labels and messages', () => {
  const keys = [
    'durationAmountLabel', 'durationUnitLabel', 'durationUnitPlaceholder', 'durationUnitDay', 'durationUnitWeek',
    'durationUnitMonth', 'durationUnitYear', 'durationOpenEnded', 'durationOpenShort', 'durationDayForms',
    'durationWeekForms', 'durationMonthForms', 'durationYearForms', 'demandErrDurationNumber', 'durationLegacyNote',
    'startDateLabel', 'startDateHint', 'demandErrStartDatePast', 'demandErrStartDateInvalid',
  ] as const;
  for (const lang of LOCALES) {
    for (const key of keys) {
      const value = translations[lang][key];
      assert.ok(value?.trim(), `${lang}.${key}`);
      if (lang !== 'en' && lang !== 'tr') assert.notEqual(value, translations.en[key], `${lang}.${key} is English`);
      if (lang !== 'tr') assert.equal(/[ğışöüĞİŞÖÜ]/.test(value!), false, `${lang}.${key} has Turkish letters`);
    }
    assert.ok(translations[lang].durationLegacyNote!.includes('{text}'), lang);
  }
  assert.equal(translations.ar.durationMonthForms!.split('|').length, 5);
});

test('dates', () => {
  assert.equal(localIsoDate(new Date(2026, 0, 5)), '2026-01-05');
  assert.ok(isIsoDate('2028-02-29'));
  assert.equal(isIsoDate('2027-02-29'), false);
  assert.equal(isIsoDate('2026-13-01'), false);
  assert.equal(isIsoDate(''), false);
});
