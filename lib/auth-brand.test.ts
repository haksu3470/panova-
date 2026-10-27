import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { company } from './company.ts';

const footer = readFileSync(new URL('../components/site/AuthFooter.tsx', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../app/admin/page.tsx', import.meta.url), 'utf8');
const about = readFileSync(new URL('../components/home/HomeSections.tsx', import.meta.url), 'utf8');
const kvkk = readFileSync(new URL('../components/home/KvkkView.tsx', import.meta.url), 'utf8');

test('the public brand is Panova Group and the registry names stay on the company record', () => {
  assert.equal(company.brandName, 'Panova Group');
  assert.equal(company.shortName, 'PANOVA TARIM DOO Struga');
  assert.equal(company.shortNameMk, 'ПАНОВА ТАРИМ ДОО Струга');
  assert.match(company.legalName, /ПАНОВА ТАРИМ ДОО Струга/);
});

test('auth pages use the public brand as the company title', () => {
  assert.match(footer, /<p className="font-semibold">\{company\.brandName\}<\/p>/);
  assert.equal(footer.includes('company.shortName'), false);
  assert.match(admin, /\{company\.brandName\} &bull; \{a\.sub\}/);
  assert.equal(admin.includes('company.shortName'), false);
});

test('about and privacy still identify the registry company', () => {
  assert.match(about, /\{company\.shortName\}/);
  assert.match(about, /\{company\.legalName\}/);
  assert.match(about, /\{company\.shortNameMk\}/);
  assert.match(kvkk, /\{company\.legalName\}/);
  assert.match(kvkk, /\{company\.shortName\} \/ \{company\.shortNameMk\}/);
});
