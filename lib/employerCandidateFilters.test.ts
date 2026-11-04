import assert from 'node:assert/strict';
import test from 'node:test';
import { translations, type Language } from './dictionary.ts';
import {
  EMPTY_EMPLOYER_CANDIDATE_FILTERS,
  filterEmployerCandidates,
  isEmployerCandidateFilterActive,
  isMissingBrowseRpc,
  matchesExperience,
  sectorFilterLabel,
  toEmployerCandidate,
  type EmployerCandidate,
  type EmployerCandidateFilters,
} from './employerCandidateFilters.ts';

const LOCALES: Language[] = ['tr', 'en', 'sq', 'ar', 'mk'];
const COPY_KEYS = [
  'empCandSearch',
  'empCandExperience',
  'empCandAnyExperience',
  'empCandProfession',
  'empCandAnyProfession',
  'empCandSector',
  'empCandAnySector',
  'empCandCountry',
  'empCandAnyCountry',
  'empCandLanguage',
  'empCandAnyLanguage',
  'empCandShift',
  'empCandAnyShift',
  'empCandShiftYes',
  'empCandShiftNo',
  'empCandClear',
  'empCandShowing',
  'empCandNoMatch',
  'empCandYears',
  'sectorHospitality',
  'sectorLogistics',
  'sectorManufacturing',
] as const;

function row(partial: Partial<EmployerCandidate> & Pick<EmployerCandidate, 'id'>): EmployerCandidate {
  return {
    full_name: null,
    profession: null,
    sector: null,
    nationality: null,
    city: null,
    experience_years: null,
    language_skills: null,
    shift_suitable: null,
    status: null,
    travel_status: null,
    created_at: null,
    active_request_id: null,
    video_url: null,
    video_url_1: null,
    video_url_2: null,
    video_url_3: null,
    ...partial,
  };
}

const POOL: EmployerCandidate[] = [
  row({
    id: '1',
    full_name: 'Mehmet Kaya',
    profession: 'Elektrikçi',
    sector: 'construction',
    nationality: 'Türkiye',
    city: 'İstanbul',
    experience_years: 4,
    language_skills: 'Temel İngilizce',
    shift_suitable: true,
  }),
  row({
    id: '2',
    full_name: 'Ahmet Yılmaz',
    profession: 'Kalıpçı',
    sector: 'construction',
    nationality: 'Türkiye',
    city: 'İstanbul',
    experience_years: 3,
    language_skills: 'Temel İngilizce',
    shift_suitable: false,
  }),
  row({
    id: '3',
    full_name: 'Nodir Aliyev',
    profession: 'Tır Şoförü',
    sector: 'logistics',
    nationality: 'Özbekistan',
    city: 'Taşkent',
    experience_years: 9,
    language_skills: 'Temel İngilizce',
    shift_suitable: false,
  }),
  row({
    id: '4',
    full_name: 'Sara Begum',
    profession: 'electrician',
    sector: 'construction',
    nationality: 'Bangladesh',
    experience_years: 0,
    language_skills: 'english',
    shift_suitable: true,
  }),
  row({
    id: '5',
    full_name: 'New Graduate',
    profession: 'Aşçı',
    sector: 'hospitality',
    nationality: 'Turkey',
    experience_years: null,
    language_skills: null,
    shift_suitable: null,
  }),
];

function apply(patch: Partial<EmployerCandidateFilters>) {
  return filterEmployerCandidates(POOL, { ...EMPTY_EMPLOYER_CANDIDATE_FILTERS, ...patch });
}

function ids(rows: EmployerCandidate[]) {
  return rows.map((item) => item.id);
}

test('an empty filter returns the authorized list in its original order', () => {
  assert.deepEqual(ids(apply({})), ['1', '2', '3', '4', '5']);
  assert.equal(isEmployerCandidateFilterActive(EMPTY_EMPLOYER_CANDIDATE_FILTERS), false);
  assert.equal(isEmployerCandidateFilterActive({ ...EMPTY_EMPLOYER_CANDIDATE_FILTERS, query: '   ' }), false);
});

test('name and profession search narrows the list and clear restores it', () => {
  assert.deepEqual(ids(apply({ query: 'elektrik' })), ['1']);
  assert.deepEqual(ids(apply({ query: 'electric' })), ['4']);
  assert.deepEqual(ids(apply({ query: '  KALIP ' })), ['2']);
  assert.deepEqual(ids(apply({ query: 'istanbul' })), []);
  const narrowed = apply({ profession: 'elektrikçi' });
  assert.deepEqual(ids(narrowed), ['1']);
  assert.deepEqual(ids(apply({})), ids(POOL));
});

test('experience bands are inclusive and missing years count as none', () => {
  assert.equal(matchesExperience(null, '0'), true);
  assert.equal(matchesExperience(0, '0'), true);
  assert.equal(matchesExperience(3, '1-3'), true);
  assert.equal(matchesExperience(3, '3-5'), true);
  assert.equal(matchesExperience(4, '1-3'), false);
  assert.equal(matchesExperience(4, '3-5'), true);
  assert.equal(matchesExperience(5, '5+'), true);
  assert.equal(matchesExperience(9, '3-5'), false);
  assert.deepEqual(ids(apply({ experience: '0' })), ['4', '5']);
  assert.deepEqual(ids(apply({ experience: '5+' })), ['3']);
  assert.deepEqual(ids(apply({ experience: '1-3' })), ['2']);
});

test('sector, country, language, and shift filters combine and ignore contact fields', () => {
  assert.deepEqual(ids(apply({ sector: 'hospitality' })), ['5']);
  assert.deepEqual(ids(apply({ nationality: 'türkiye' })), ['1', '2']);
  assert.deepEqual(ids(apply({ language: 'english' })), ['4']);
  assert.deepEqual(ids(apply({ shift: 'yes' })), ['1', '4']);
  assert.deepEqual(ids(apply({ shift: 'no' })), ['2', '3']);
  assert.deepEqual(
    ids(apply({ query: 'elektrik', experience: '3-5', sector: 'construction', shift: 'yes' })),
    ['1'],
  );
  const withSecrets = {
    ...POOL[0],
    email: 'elektrik@example.com',
    phone: '+900000000000',
    passport_number: 'U123',
  };
  assert.deepEqual(ids(filterEmployerCandidates([withSecrets], { ...EMPTY_EMPLOYER_CANDIDATE_FILTERS, query: 'u123' })), []);
});

test('browse mapping drops identity columns and keeps filter fields', () => {
  const mapped = toEmployerCandidate({
    id: 'abc',
    full_name: ' Ali Demir ',
    profession: 'Aşçı',
    sector: 'hospitality',
    nationality: 'Türkiye',
    city: 'İstanbul',
    experience_years: '6',
    language_skills: '  Temel İngilizce ',
    shift_suitable: false,
    status: 'approved',
    travel_status: 'planned',
    created_at: '2026-11-01',
    active_request_id: 'req-1',
    video_url: ' https://youtu.be/E4qr4CiDFIw ',
    video_url_1: 'https://www.youtube.com/watch?v=gKy4n9-gEA4',
    passport_number: 'U999',
    phone: '+38970000000',
    email: 'ali@example.com',
    country: 'Ignored because nationality is set',
  });
  assert.equal(mapped.experience_years, 6);
  assert.equal(mapped.language_skills, 'Temel İngilizce');
  assert.equal(mapped.full_name, 'Ali Demir');
  assert.equal(mapped.video_url, 'https://youtu.be/E4qr4CiDFIw');
  assert.equal(mapped.video_url_1, 'https://www.youtube.com/watch?v=gKy4n9-gEA4');
  assert.equal(mapped.video_url_2, null);
  assert.equal('passport_number' in mapped, false);
  assert.equal('phone' in mapped, false);
  assert.equal('email' in mapped, false);
  assert.equal(sectorFilterLabel('hospitality', translations.en), 'Tourism & Hospitality');
  assert.equal(sectorFilterLabel('logistics', translations.mk), 'Логистика');
  assert.equal(sectorFilterLabel('custom-trade', translations.tr), 'custom-trade');
});

test('a missing browse function is the only reason to use the row-level fallback', () => {
  assert.equal(isMissingBrowseRpc(null), false);
  assert.equal(isMissingBrowseRpc({ code: '42501', message: 'permission denied' }), false);
  assert.equal(isMissingBrowseRpc({ code: 'PGRST202', message: 'Could not find the function public.employer_browse_candidates' }), true);
});

test('filter labels exist in TR, EN, SQ, AR, and MK', () => {
  const arabic = /[\u0600-\u06FF]/;
  const cyrillic = /[А-Яа-яЃѓЅѕЈјЉљЊњЌќЏџ]/;
  const turkishLetters = /[ğışöüĞİŞÖÜ]/;
  for (const lang of LOCALES) {
    for (const key of COPY_KEYS) {
      const value = translations[lang][key];
      assert.equal(typeof value, 'string', `${lang}.${key}`);
      assert.ok(value && value.trim().length > 0, `${lang}.${key}`);
    }
    assert.match(String(translations[lang].empCandShowing), /\{shown\}/);
    assert.match(String(translations[lang].empCandShowing), /\{total\}/);
    assert.match(String(translations[lang].empCandYears), /\{years\}/);
    if (lang === 'tr') continue;
    for (const key of COPY_KEYS) {
      assert.equal(turkishLetters.test(String(translations[lang][key])), false, `${lang}.${key}`);
    }
  }
  assert.match(String(translations.ar.empCandNoMatch), arabic);
  assert.match(String(translations.mk.empCandNoMatch), cyrillic);
  assert.notEqual(translations.en.empCandClear, translations.tr.empCandClear);
  assert.notEqual(translations.sq.empCandClear, translations.tr.empCandClear);
});
