import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const { candidateExportRows, offerExportRows, requestExportRows, toCsv } = await import('./exportLists.ts');

test('csv keeps formula text from executing and escapes quotes', () => {
  const csv = toCsv([{ name: '=HYPERLINK("https://evil")', note: '@SUM(A1)' }]);
  assert.equal(csv, 'name,note\r\n"\'=HYPERLINK(""https://evil"")",\'@SUM(A1)');
});

test('csv escapes quotes and keeps the salary column', () => {
  const csv = toCsv([
    { name: 'A, "B"', salary: 1000 },
    { name: 'line\n2', salary: '' },
  ]);
  assert.equal(csv, 'name,salary\r\n"A, ""B""",1000\r\n"line\n2",');
});

test('offer export uses monthly net salary and currency', () => {
  const rows = offerExportRows([{
    id: '1',
    employer_name: 'Demo',
    position_title: 'Usta',
    monthly_net_salary: 800,
    offer_terms: { currency: 'EUR' },
    status: 'pending',
    is_demo: true,
  }]);
  assert.equal(rows[0].monthly_net_salary, '800');
  assert.equal(rows[0].currency, 'EUR');
  assert.equal(rows[0].is_demo, true);
  assert.equal(rows[0].position_title, 'Usta');
});

test('exports translate catalog keys and keep free text', () => {
  const requests = requestExportRows([{ id: 'r', position_title: 'welder, Gece bekçisi, özel iş' }], 'en');
  assert.equal(requests[0].position_title, 'Welder, Night watchman, özel iş');
  const candidates = candidateExportRows([{ id: 'c', profession: 'site_manager' }, { id: 'd', profession: 'Kendi mesleği' }], 'mk');
  assert.equal(candidates[0].profession, 'Раководител на градилиште');
  assert.equal(candidates[1].profession, 'Kendi mesleği');
});

test('candidate export names the status column "Aday durumu" and adds the official process', () => {
  const rows = candidateExportRows([
    { id: 'a', status: 'reviewing', official_process_status: 'ready_to_travel' },
    { id: 'b', status: 'approved', official_process_status: 'rejected' },
  ], 'tr', {
    candidateStatus: 'Aday durumu',
    officialProcess: 'Resmî süreç',
    statusLabels: { reviewing: 'İnceleniyor', approved: 'Onaylandı' },
    steps: { ready_to_travel: 'Seyahate hazır' },
    stopped: 'Süreç durduruldu',
  });
  assert.equal('status' in rows[0], false);
  assert.equal(rows[0]['Aday durumu'], 'İnceleniyor');
  assert.equal(rows[0]['Resmî süreç'], 'Seyahate hazır · 7/8');
  assert.equal(rows[1]['Resmî süreç'], 'Süreç durduruldu');
  assert.ok(toCsv(rows).startsWith('id,full_name,nationality,profession,sector,Aday durumu,Resmî süreç,'));
});
