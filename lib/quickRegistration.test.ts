import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const {
  duplicateQueryTerms,
  findVisibleDuplicates,
  isDuplicateInsertError,
  quickDocumentRow,
  quickRegistrationPayload,
  quickRegistrationProblem,
  withDocState,
} = await import('./quickRegistration.ts');

test('quickRegistrationProblem: KVKK required first', () => {
  assert.equal(
    quickRegistrationProblem({
      fullName: 'A',
      nationality: 'BD',
      phone: '+8801712345678',
      email: '',
      profession: 'welder',
      sector: 'construction',
      passport: '',
      birthYear: '',
      kvkk: false,
      referralCode: '',
    }),
    'kvkk',
  );
});

test('quickRegistrationProblem: birth year and passport shapes', () => {
  const base = {
    fullName: 'A',
    nationality: 'BD',
    phone: '+8801712345678',
    email: '',
    profession: 'welder',
    sector: 'construction',
    passport: '',
    birthYear: '',
    kvkk: true,
    referralCode: '',
  };
  assert.equal(quickRegistrationProblem({ ...base, birthYear: '90' }), 'birth_year');
  assert.equal(quickRegistrationProblem({ ...base, birthYear: '2015' }, new Date('2026-01-01')), 'birth_year');
  assert.equal(quickRegistrationProblem({ ...base, passport: '12345' }), 'passport');
  assert.equal(quickRegistrationProblem({ ...base, passport: 'AB12345', birthYear: '1990' }), null);
});

test('quickRegistrationPayload: optional fields and KVKK stamp', () => {
  const now = new Date('2026-11-17T10:00:00.000Z');
  const payload = quickRegistrationPayload(
    {
      fullName: '  Md Samad  ',
      nationality: 'ignored',
      phone: ' 01712345678 ',
      email: ' Samad@Example.COM ',
      profession: 'welder',
      sector: 'construction',
      passport: 'ab 12345',
      birthYear: '1990',
      kvkk: true,
      referralCode: 'PVABCDEF',
    },
    { nationality: 'Bangladesh', allowReferralCode: true, now },
  );
  assert.equal(payload.full_name, 'Md Samad');
  assert.equal(payload.nationality, 'Bangladesh');
  assert.equal(payload.phone, '01712345678');
  assert.equal(payload.email, 'samad@example.com');
  assert.equal(payload.passport_number, 'AB12345');
  assert.equal(payload.birth_year, 1990);
  assert.equal(payload.referral_code, 'PVABCDEF');
  assert.equal(payload.kvkk_accepted_at, now.toISOString());
  assert.equal(payload.status, 'pending');
});

test('quickRegistrationPayload: referral only when allowed', () => {
  const payload = quickRegistrationPayload(
    {
      fullName: 'A',
      nationality: 'x',
      phone: '1',
      email: '',
      profession: 'welder',
      sector: 'construction',
      passport: '',
      birthYear: '',
      kvkk: true,
      referralCode: 'PVABCDEF',
    },
    { nationality: 'Bangladesh', allowReferralCode: false },
  );
  assert.equal('referral_code' in payload, false);
  assert.equal(payload.email, null);
});

test('findVisibleDuplicates and query terms', () => {
  const rows = [
    { id: '1', full_name: 'Ali', phone: '+905551112233', passport_number: 'AB12345' },
    { id: '2', full_name: 'Veli', phone: '05552223344', passport_no: 'CD99999' },
  ];
  const hits = findVisibleDuplicates({ phone: '05551112233', passport: 'ab12345' }, rows);
  assert.deepEqual(
    hits.map((h) => `${h.field}:${h.id}`),
    ['phone:1', 'passport:1'],
  );
  assert.deepEqual(duplicateQueryTerms({ phone: '+905551112233', passport: 'AB12345' }), {
    phoneSuffix: '2233',
    passport: 'AB12345',
  });
});

test('isDuplicateInsertError and document helpers', () => {
  assert.equal(isDuplicateInsertError({ code: '23505' }), true);
  assert.equal(isDuplicateInsertError({ message: 'unique_candidate_phone_key' }), true);
  assert.equal(isDuplicateInsertError({ code: '42501' }), false);
  const row = quickDocumentRow('c1', 'passport', 'storage:candidate-files/c1/passport/a.jpg', 'a.jpg', new Date('2026-11-17T12:00:00.000Z'));
  assert.equal(row.candidate_id, 'c1');
  assert.equal(row.doc_type, 'passport');
  assert.equal(row.status, 'uploaded');
  assert.equal(row.notes, 'a.jpg');
  const next = withDocState({ passport: { status: 'idle' }, certificate: { status: 'idle' } }, 'passport', {
    status: 'done',
    fileName: 'a.jpg',
  });
  assert.equal(next.passport.status, 'done');
  assert.equal(next.certificate.status, 'idle');
});
