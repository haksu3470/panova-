import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
import { translations, type Language } from './dictionary.ts';
import type { EmployerCandidate, EmployerCandidateFilters } from './employerCandidateFilters.ts';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const {
  canDecideOnMatch,
  EMPTY_EMPLOYER_CANDIDATE_FILTERS,
  employerCandidateRowKey,
  filterEmployerCandidates,
  isEmployerCandidateFilterActive,
  isMissingBrowseRpc,
  isValidStaffDecisionReason,
  matchesExperience,
  normalizeEmployerDecision,
  professionFilterOptions,
  sectorFilterLabel,
  toEmployerCandidate,
} = await import('./employerCandidateFilters.ts');

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
  // The electrician catalog key is also found through its Turkish label.
  assert.deepEqual(ids(apply({ query: 'elektrik' })), ['1', '4']);
  assert.deepEqual(ids(apply({ query: 'electric' })), ['4']);
  assert.deepEqual(ids(apply({ query: '  KALIP ' })), ['2']);
  assert.deepEqual(ids(apply({ query: 'istanbul' })), []);
  const narrowed = apply({ profession: 'elektrikçi' });
  assert.deepEqual(ids(narrowed), ['1', '4']);
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

test('the employer profession filter uses the catalog and still shows legacy text', () => {
  const rows = [
    row({ id: 'k', full_name: 'Key', profession: 'electrician', sector: 'construction' }),
    row({ id: 'l', full_name: 'Legacy', profession: 'Elektrikçi', sector: 'construction' }),
    row({ id: 'c', full_name: 'Cook', profession: 'cook', sector: 'hospitality' }),
    row({ id: 'u', full_name: 'Custom', profession: 'Elektrik mühendisi', sector: 'construction' }),
  ];
  assert.deepEqual(ids(filterEmployerCandidates(rows, { ...EMPTY_EMPLOYER_CANDIDATE_FILTERS, profession: 'electrician' })), ['k', 'l']);
  assert.deepEqual(ids(filterEmployerCandidates(rows, { ...EMPTY_EMPLOYER_CANDIDATE_FILTERS, profession: 'elektrik mühendisi' })), ['u']);
  assert.deepEqual(ids(filterEmployerCandidates(rows, { ...EMPTY_EMPLOYER_CANDIDATE_FILTERS, query: 'електричар' })), ['k']);
  const options = professionFilterOptions(rows, 'all', 'tr');
  assert.equal(options.some((option) => option.value === 'electrician' && option.label === 'Elektrikçi'), true);
  assert.equal(options.filter((option) => option.label === 'Elektrikçi').length, 1);
  assert.equal(options.some((option) => option.label === 'Elektrik mühendisi'), true);
  const care = professionFilterOptions(rows, 'care', 'en');
  assert.equal(care.some((option) => option.value === 'caregiver' && option.label === 'Caregiver'), true);
  assert.equal(care.some((option) => option.value === 'electrician'), false);
  assert.equal(care.some((option) => option.label === 'Elektrik mühendisi'), false);
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

test('browse mapping keeps the match and its employer decision', () => {
  const mapped = toEmployerCandidate({
    id: 'abc',
    match_id: 'm-1',
    presented_at: '2026-11-10T09:00:00Z',
    employer_decision: 'selected',
    decided_at: '2026-11-11T09:00:00Z',
  });
  assert.equal(mapped.match_id, 'm-1');
  assert.equal(mapped.employer_decision, 'selected');
  assert.equal(mapped.decided_at, '2026-11-11T09:00:00Z');
  assert.equal(canDecideOnMatch(mapped), true);

  const fallback = toEmployerCandidate({ id: 'abc', status: 'approved' });
  assert.equal(fallback.match_id, null);
  assert.equal(fallback.employer_decision, 'pending');
  assert.equal(canDecideOnMatch(fallback), false);
  assert.equal(canDecideOnMatch({ match_id: 'm-2', presented_at: null }), false);
});

test('decision source and staff reason rules', () => {
  assert.equal(toEmployerCandidate({ id: 'a', decision_source: 'staff' }).decision_source, 'staff');
  assert.equal(toEmployerCandidate({ id: 'a', decision_source: 'EMPLOYER' }).decision_source, 'employer');
  assert.equal(toEmployerCandidate({ id: 'a', decision_source: 'admin' }).decision_source, null);
  assert.equal(toEmployerCandidate({ id: 'a' }).decision_source, null);
  assert.equal(isValidStaffDecisionReason('    '), false);
  assert.equal(isValidStaffDecisionReason(' abcd '), false);
  assert.equal(isValidStaffDecisionReason('Telefonla onay'), true);
  assert.equal(isValidStaffDecisionReason('x'.repeat(1001)), false);
});

test('browse rows are per match: key and request position', () => {
  const a = toEmployerCandidate({ id: 'cand-1', match_id: 'm-a', request_position_title: ' Aşçı ' });
  const b = toEmployerCandidate({ id: 'cand-1', match_id: 'm-b', request_position_title: 'Garson' });
  assert.equal(a.request_position_title, 'Aşçı');
  assert.notEqual(employerCandidateRowKey(a), employerCandidateRowKey(b));
  assert.equal(employerCandidateRowKey(toEmployerCandidate({ id: 'cand-2' })), 'cand-2');
});

test('unknown employer decisions read as pending', () => {
  assert.equal(normalizeEmployerDecision(' Selected '), 'selected');
  assert.equal(normalizeEmployerDecision('rejected'), 'rejected');
  assert.equal(normalizeEmployerDecision('approved'), 'pending');
  assert.equal(normalizeEmployerDecision(null), 'pending');
  assert.equal(normalizeEmployerDecision(3), 'pending');
});