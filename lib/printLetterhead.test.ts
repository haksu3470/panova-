import { test } from 'node:test';
import assert from 'node:assert/strict';
import { register } from 'node:module';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);
const { letterheadHtml, printDocNo, printFooterHtml, printLabels, signatureHtml } = await import('./printLetterhead.ts');
const { toPrintHtml } = await import('./exportLists.ts');

test('letterhead: Panova details, escaped values, optional lines', () => {
  const html = letterheadHtml({
    lang: 'tr',
    origin: 'https://panovagroup.org/',
    title: 'Teklif <x>',
    docNo: printDocNo('TKL', '7c0e1000-2026-1113'),
    printedAt: '26.11.2026',
    preparedFor: 'A & B DOO',
  });
  assert.ok(html.includes('https://panovagroup.org/logo.png'));
  assert.ok(html.includes('Panova Group') && html.includes('EMBS 7758812'));
  assert.ok(html.includes('Teklif &lt;x&gt;') && html.includes('A &amp; B DOO'));
  assert.ok(html.includes('TKL-7C0E1000'));
  assert.equal(html.includes('Yazdıran'), false, 'no printed-by line when not given');
  assert.equal(printDocNo('BLG', null), '');
});

test('signature boxes per party, footer note, labels in five languages', () => {
  const sign = signatureHtml('en', ['Candidate', 'Employer']);
  assert.equal((sign.match(/<b>/g) || []).length, 2);
  assert.ok(sign.includes('--pl-cols:2'));
  assert.ok(printFooterHtml('mk').includes(printLabels.mk.confidential));
  for (const [lang, l] of Object.entries(printLabels)) {
    for (const v of Object.values(l)) assert.ok(v, lang);
  }
});

test('list print: letterhead and footer only when asked, plain heading otherwise', () => {
  const rows = [{ a: 1 }];
  const plain = toPrintHtml('T', rows);
  assert.ok(plain.includes('<h1>T</h1>') && !plain.includes('class="pl-head"') && !plain.includes('class="pl-foot"'));
  const branded = toPrintHtml('T', rows, 'ltr', undefined, { lang: 'en', origin: 'https://panovagroup.org', printedAt: '1/1/2026', preparedFor: 'X' });
  assert.ok(branded.includes('class="pl-head"') && branded.includes('class="pl-foot"') && branded.includes('Prepared for'));
  assert.match(branded, /@page \{ size: A4 landscape; margin: 0; \}/, 'browser header and footer stay off');
});
