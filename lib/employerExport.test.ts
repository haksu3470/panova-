import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import { EXPORT_COLUMNS, labelExportColumns } from './exportColumns.ts';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);
const {
  EMPLOYER_EXPORT_COLUMNS,
  EMPLOYER_EXPORT_FORBIDDEN,
  employerEmployeeRows,
  employerOfferRows,
  employerRequestRows,
  employerSelectedRows,
} = await import('./employerExport.ts');

const ROOT = join(import.meta.dirname, '..');

const copy = {
  requestStatus: (s: string) => `R:${s}`,
  offerStatus: (s: string) => `O:${s}`,
  duration: (s: string) => `D:${s}`,
  officialProcess: (s: string) => `P:${s}`,
};

// A row that carries every forbidden field plus the real ones: the builders must drop the former.
const poison = Object.fromEntries(EMPLOYER_EXPORT_FORBIDDEN.map((key) => [key, `SECRET-${key}`]));
const followups = [{ day: 30, note: 'SECRET-followup-note' }];

const request = {
  ...poison,
  position_title: 'Kalıpçı', headcount: 2, city: 'Skopje', country: 'North Macedonia',
  monthly_net_salary: 1300, salary_currency: 'EUR', contract_type: '12 ay',
  target_start_date: '2026-12-01', status: 'new_request', created_at: '2026-11-10T08:00:00Z',
};
const selected = {
  ...poison,
  full_name: 'Demo Aday İki', profession: 'Belirtilmedi', nationality: 'Bangladesh', city: 'Dhaka',
  experience_years: 4, language_skills: 'EN', request_position_title: 'Kalıpçı', decided_at: '2026-11-12T10:00:00Z',
};
const employee = {
  ...poison, followups,
  full_name: 'Demo Aday Dört', profession: 'Belirtilmedi', nationality: 'Bangladesh', request_position_title: 'Aşçı',
  official_process_status: 'arrived', flight_date: '2026-11-20', flight_number: 'SECRET-TK123',
  departure_city: 'Dhaka', arrival_city: 'Skopje', start_date: '2026-11-25',
};
const offer = {
  ...poison,
  candidate_name: 'Demo Aday Dört', position_title: 'Aşçı', monthly_net_salary: 1500,
  offer_terms: { currency: 'USD' }, start_date: '2026-11-25', terms_details: 'Konaklama dahil', status: 'accepted',
};

const outputs = {
  requests: employerRequestRows([request], 'tr', copy),
  selected: employerSelectedRows([selected], 'tr'),
  employees: employerEmployeeRows([employee], 'tr', copy),
  offers: employerOfferRows([offer], 'tr', copy),
};

test('each employer list has exactly its whitelisted columns, in order', () => {
  for (const [list, rows] of Object.entries(outputs)) {
    assert.deepEqual(Object.keys(rows[0]), [...EMPLOYER_EXPORT_COLUMNS[list as keyof typeof EMPLOYER_EXPORT_COLUMNS]], list);
  }
});

test('no forbidden field or value reaches an employer export', () => {
  for (const [list, rows] of Object.entries(outputs)) {
    for (const key of EMPLOYER_EXPORT_FORBIDDEN) assert.equal(key in rows[0], false, `${list} has ${key}`);
    assert.equal(/SECRET/.test(JSON.stringify(rows)), false, `${list} leaks a value`);
  }
  for (const columns of Object.values(EMPLOYER_EXPORT_COLUMNS)) {
    for (const column of columns) assert.equal((EMPLOYER_EXPORT_FORBIDDEN as readonly string[]).includes(column), false, column);
  }
});

test('employees: flight date, cities and start date in; flight number and follow-ups out', () => {
  const row = outputs.employees[0];
  assert.equal(row.flight_date, '2026-11-20');
  assert.equal(row.departure_city, 'Dhaka');
  assert.equal(row.arrival_city, 'Skopje');
  assert.equal(row.start_date, '2026-11-25');
  assert.equal(row.official_process_status, 'P:arrived');
  assert.equal('flight_number' in row || 'followups' in row, false);
});

test('values: labels from the page copy, money with currency, dates as days', () => {
  assert.deepEqual(outputs.requests[0], {
    position_title: 'Kalıpçı', headcount: 2, city: 'Skopje', country: 'North Macedonia',
    monthly_net_salary: '1300', currency: 'EUR', contract_type: 'D:12 ay',
    target_start_date: '2026-12-01', status: 'R:new_request', created_at: '2026-11-10',
  });
  assert.equal(outputs.offers[0].currency, 'USD');
  assert.equal(outputs.offers[0].status, 'O:accepted');
  assert.equal(outputs.selected[0].decided_at, '2026-11-12');
});

test('every employer column has a heading in five languages', () => {
  for (const columns of Object.values(EMPLOYER_EXPORT_COLUMNS)) {
    for (const column of columns) assert.ok((EXPORT_COLUMNS as readonly string[]).includes(column), column);
  }
  for (const lang of ['tr', 'en', 'sq', 'ar', 'mk'] as const) {
    const labelled = labelExportColumns(outputs.offers, lang)[0];
    assert.equal(Object.keys(labelled).some((key) => key in outputs.offers[0]), false, lang);
  }
});

test('employer page: four export bars, no audit write, data from the loaded lists', () => {
  const page = readFileSync(join(ROOT, 'app/employer/page.tsx'), 'utf8');
  assert.equal(/writeAudit|@\/lib\/audit/.test(page), false, 'employer page never writes audit_logs');
  assert.match(page, /audit=\{false\}/);
  assert.equal((page.match(/<ListExportBar/g) || []).length, 1, 'one bar definition');
  for (const call of [
    "exportBar('my-requests', t.activeDemandFilesTitle, employerRequestRows(jobDemands,",
    "exportBar('my-offers', ui.ioJobOffers, employerOfferRows(employerOffers,",
    "exportBar('selected-candidates', t.selectedCandidatesTitle, employerSelectedRows(selectedCandidates,",
    "employerEmployeeRows(startedEmployees(placements),",
  ]) assert.ok(page.includes(call), call);
  // the exports never query the database themselves
  const builders = readFileSync(join(ROOT, 'lib/employerExport.ts'), 'utf8');
  assert.equal(/supabase|\.rpc\(|\.from\(/.test(builders), false);
});
