import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const {
  candidateExportRows,
  employerExportRows,
  neutralizeSpreadsheetFormula,
  offerExportRows,
  requestExportRows,
  requestStatusText,
  toCsv,
  toExcelHtml,
  toPrintHtml,
} = await import('./exportLists.ts');
const { translations } = await import('./dictionary.ts');
const { portalUi } = await import('./portal-ui-copy.ts');

const LANGS = ['tr', 'en', 'sq', 'ar', 'mk'] as const;

test('formula guard: real formulas stay inert, phone numbers stay clean', () => {
  // dangerous starts are still quoted
  for (const value of ['=HYPERLINK("https://evil")', '@SUM(A1)', '-cmd|\' /C calc\'!A0', '+cmd|calc', '-1+1', '\t=1', '\r=1', '+A1', '=1+1']) {
    assert.equal(neutralizeSpreadsheetFormula(value).startsWith("'"), true, value);
  }
  // phone numbers and plain signed numbers are not touched
  for (const value of ['+389 70 385 792', '+90 545 364 49 30', '+905453644930', '+880 1805 511473', '+1 (212) 555-0100', '-5', '070-385-792', '+49.30.1234']) {
    assert.equal(neutralizeSpreadsheetFormula(value), value, value);
  }
  assert.equal(neutralizeSpreadsheetFormula(null), '');
});

test('csv uses ";" so Turkish Excel opens columns, quotes when needed, guards formulas', () => {
  const csv = toCsv([{ name: '=HYPERLINK("https://evil")', note: '@SUM(A1)', phone: '+389 70 385 792' }]);
  assert.equal(csv, 'name;note;phone\r\n"\'=HYPERLINK(""https://evil"")";\'@SUM(A1);+389 70 385 792');
  const quoted = toCsv([{ name: 'A; "B"', city: 'Skopje, Centar' }, { name: 'line\n2', city: '' }]);
  assert.equal(quoted, 'name;city\r\n"A; ""B""";"Skopje, Centar"\r\n"line\n2";');
});

test('internal columns never reach CSV, Excel or print', () => {
  const rows = [{ id: 'SECRET-id', is_demo: true, candidate_id: 'SECRET-c', full_name: 'Demo Aday', phone: '+90 545 364 49 30' }];
  for (const output of [toCsv(rows), toExcelHtml('T', rows), toPrintHtml('T', rows)]) {
    assert.equal(/SECRET|is_demo|>id<|candidate_id|^id;/.test(output), false, output.slice(0, 120));
    assert.ok(output.includes('Demo Aday'));
  }
});

test('print never adds a quote; landscape, repeated headings, wrapped cells', () => {
  const html = toPrintHtml('Talepler · 14.11.2026', [{ phone: '+90 545 364 49 30', note: '=1+1' }], 'ltr', { labels: { phone: 'Telefon' } });
  assert.ok(html.includes('<td>+90 545 364 49 30</td>'));
  assert.ok(html.includes('<td>=1+1</td>'), 'print is not a spreadsheet: values as written');
  assert.equal(html.includes("'+90"), false);
  assert.match(html, /@page \{ size: A4 landscape; margin: 0; \}/);
  assert.match(html, /thead \{ display: table-header-group; \}/);
  // long cells wrap between words; a word longer than its column still breaks
  assert.match(html, /overflow-wrap: break-word; word-break: normal;/);
  assert.match(html, /font-size: 12px;/);
  assert.match(html, /<title>Talepler · 14\.11\.2026<\/title>/);
  assert.match(html, /<th>Telefon<\/th>/);
});

test('excel: bold headings, column widths, phone cells as text', () => {
  const html = toExcelHtml('T', [{ company_name: 'Demo Şirket', phone: '+389 70 385 792' }], { labels: { company_name: 'Şirket', phone: 'Telefon' } });
  assert.match(html, /<colgroup>(<col width="\d+" style="width:\d+pt">){2}<\/colgroup>/);
  assert.match(html, /<th style="font-weight:bold[^"]*">Şirket<\/th>/);
  assert.ok(html.includes(`<td style="mso-number-format:'\\@'">+389 70 385 792</td>`));
  assert.ok(html.includes('<td>Demo Şirket</td>'));
});

test('request status is shown in the export language', () => {
  for (const lang of LANGS) {
    const t = translations[lang];
    assert.equal(requestStatusText('interviews', lang), t.stageInterviews, lang);
    assert.equal(requestStatusText('presenting_candidates', lang), t.stagePresentingCandidates, lang);
    assert.equal(requestStatusText('searching_candidates', lang), t.stageSearchingCandidates, lang);
    const [row] = requestExportRows([{ status: 'interviews' }], lang);
    assert.equal(row.status, t.stageInterviews, lang);
    assert.notEqual(row.status, 'interviews', lang);
  }
});

test('staff request, employer and offer rows: localized values, no internal fields', () => {
  const [request] = requestExportRows([{
    id: 'r1', is_demo: true, employer_name: 'Demo İşveren', position_title: 'welder', sector: 'construction',
    headcount: 3, country: 'North Macedonia', city: 'Skopje', monthly_net_salary: 1300, salary_currency: 'EUR',
    target_start_date: '2026-12-01', status: 'searching_candidates',
  }], 'tr');
  assert.deepEqual(Object.keys(request), ['employer_name', 'position_title', 'sector', 'headcount', 'country', 'city', 'monthly_net_salary', 'currency', 'target_start_date', 'status']);
  assert.equal(request.country, 'Kuzey Makedonya');
  assert.equal(request.monthly_net_salary, '1.300');
  assert.equal(request.currency, 'EUR');
  assert.equal(request.target_start_date, '01.12.2026');
  assert.equal(request.status, translations.tr.stageSearchingCandidates);
  assert.notEqual(request.sector, 'construction');

  const [employer] = employerExportRows([{ id: 'e1', is_demo: true, company_name: 'Demo', country: 'Albania', phone: '+355 69 000 0000' }], 'mk');
  assert.equal('id' in employer || 'is_demo' in employer, false);
  assert.equal(employer.country, 'Албанија');
  assert.equal(employer.phone, '+355 69 000 0000');

  const [offer] = offerExportRows([{ id: 'o', candidate_id: 'c', is_demo: true, position_title: 'Usta', monthly_net_salary: 800, offer_terms: { currency: 'EUR' }, status: 'accepted' }], 'en');
  assert.equal('id' in offer || 'candidate_id' in offer || 'is_demo' in offer, false);
  assert.equal(offer.monthly_net_salary, '800');
  assert.equal(offer.currency, 'EUR');
  assert.equal(offer.status, (portalUi.en.offerStatus as Record<string, string>).accepted);
  assert.equal(offer.position_title, 'Usta');
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
    { id: 'a', is_demo: true, status: 'reviewing', official_process_status: 'ready_to_travel' },
    { id: 'b', status: 'approved', official_process_status: 'rejected' },
  ], 'tr', {
    candidateStatus: 'Aday durumu',
    officialProcess: 'Resmî süreç',
    statusLabels: { reviewing: 'İnceleniyor', approved: 'Onaylandı' },
    steps: { ready_to_travel: 'Seyahate hazır' },
    stopped: 'Süreç durduruldu',
  });
  assert.equal('status' in rows[0], false);
  assert.equal('id' in rows[0] || 'is_demo' in rows[0], false);
  assert.equal(rows[0]['Aday durumu'], 'İnceleniyor');
  assert.equal(rows[0]['Resmî süreç'], 'Seyahate hazır · 7/8');
  assert.equal(rows[1]['Resmî süreç'], 'Süreç durduruldu');
  assert.ok(toCsv(rows).startsWith('full_name;nationality;profession;sector;Aday durumu;Resmî süreç;'));
});
