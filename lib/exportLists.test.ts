import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const { offerExportRows, toCsv } = await import('./exportLists.ts');

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
});
