import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { Language } from './dictionary.ts';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const { portalUi } = await import('./portal-ui-copy');
const { auditActionText, auditEntityLabel, auditStatusLabel } = await import('./auditDisplay');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const LANGS: Language[] = ['tr', 'en', 'sq', 'ar', 'mk'];

test('new portal labels are filled in five languages', () => {
  const entityKeys = Object.keys(portalUi.tr.auditEntities).sort();
  for (const lang of LANGS) {
    const ui = portalUi[lang];
    assert.ok(ui.employerContact.trim() && ui.employerCountry.trim(), lang);
    assert.deepEqual(Object.keys(ui.auditEntities).sort(), entityKeys, `${lang} audit entity keys`);
    for (const [key, value] of Object.entries(ui.auditEntities)) assert.ok(value.trim(), `${lang}.auditEntities.${key}`);
  }
  assert.equal(portalUi.tr.employerContact, 'İlgili kişi');
  assert.equal(portalUi.tr.employerCountry, 'Ülke');
});

test('audit status codes are shown with their labels; unknown codes stay as written', () => {
  assert.equal(
    auditActionText('Üst Yönetim talep durumunu el ile değiştirdi: new_request -> presenting_candidates', 'job_request', 'tr'),
    'Üst Yönetim talep durumunu el ile değiştirdi: Yeni Talep → Adaylar Sunuluyor',
  );
  const en = auditActionText('Talep durumu kayıtlara göre ilerledi: searching_candidates -> interviews', 'job_request', 'en');
  assert.equal(en, `Talep durumu kayıtlara göre ilerledi: ${auditStatusLabel('searching_candidates', 'job_request', 'en')} → ${auditStatusLabel('interviews', 'job_request', 'en')}`);
  assert.equal(/searching_candidates|interviews$/.test(en), false, en);
  // candidate rows use the candidate labels (reviewing is a code of both)
  assert.equal(auditActionText('Üst Yönetim aday durumunu el ile değiştirdi: pending -> reviewing', 'job_candidate', 'tr'), 'Üst Yönetim aday durumunu el ile değiştirdi: Beklemede → İnceleniyor');
  assert.equal(auditActionText('Aday → visa_processing', null, 'tr'), 'Aday → Vize İşlemde');
  // unknown codes and plain text are not touched
  assert.equal(auditActionText('Durum: mystery_code -> other_code', 'job_request', 'tr'), 'Durum: mystery_code → other_code');
  assert.equal(auditActionText('Dışa aktarma: csv', 'export', 'tr'), 'Dışa aktarma: csv');
  assert.equal(auditActionText('', null, 'tr'), '');
  assert.equal(auditActionText(null, null, 'ar'), '');
  for (const lang of LANGS) {
    const shown = auditActionText('x: new_request -> cancelled', 'job_request', lang);
    assert.equal(/new_request|cancelled/.test(shown), false, `${lang}: ${shown}`);
  }
});

test('audit table names are readable; unknown names stay as written', () => {
  assert.equal(auditEntityLabel('job_request', 'tr'), 'Talep');
  assert.equal(auditEntityLabel('job_candidates', 'mk'), 'Кандидат');
  assert.equal(auditEntityLabel('some_new_table', 'ar'), 'some_new_table');
  assert.equal(auditEntityLabel(null, 'tr'), '');
});

test('portal screens: no hard-coded English labels or raw N/A, audit e-mail wraps', () => {
  const page = read('app/portal/page.tsx');
  assert.equal(/>Contact: |\| Country: /.test(page), false, 'employer card labels come from portal-ui-copy');
  assert.match(page, /\{ui\.employerContact\}: <strong>/);
  assert.match(page, /\{ui\.employerCountry\}: \{exportCountry\(emp\.country, currentLang\)/);
  assert.match(page, /auditActionText\(log\.action, log\.entity, currentLang\)/);
  assert.match(page, /<td className="p-4 \[overflow-wrap:anywhere\]">\{log\.performer\}/);
  assert.match(page, /\(\{auditEntityLabel\(log\.entity, currentLang\)\}\)/);
  const file = read('app/portal/candidates/[id]/page.tsx');
  assert.equal(file.includes("'N/A'"), false, 'no raw N/A in the candidate file header');
  assert.match(file, /\[candidate\.country, candidate\.city\]\.some\(Boolean\) \? <span>📍/);
});
