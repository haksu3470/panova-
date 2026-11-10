import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { translations, type Language } from './dictionary.ts';

const LOCALES: Language[] = ['tr', 'en', 'mk', 'sq', 'ar'];
const COPY_KEYS = [
  'empTabNewRequest',
  'newDemandBtn',
  'empNoRequests',
  'headcountPlaceholder',
  'cityPlaceholder',
  'durationPlaceholder',
  'selectSectorFirst',
  'benefitSelectPlaceholder',
  'activeDemandFilesTitle',
] as const;

test('the empty demand form and home request list copy exists in every locale', () => {
  for (const lang of LOCALES) {
    for (const key of COPY_KEYS) {
      const value = translations[lang][key];
      assert.equal(typeof value, 'string', `${lang}.${key}`);
      assert.ok(value?.trim(), `${lang}.${key}`);
    }
  }
  assert.equal(translations.tr.empTabNewRequest, 'Yeni Talep');
  assert.equal(translations.tr.benefitSelectPlaceholder, 'Seçin');
  assert.equal(translations.en.empTabNewRequest, 'New Request');
  assert.equal(translations.mk.newDemandBtn, 'Креирај ново барање');
  assert.match(translations.mk.selectSectorFirst || '', /[А-Яа-я]/);
  assert.match(translations.ar.empTabNewRequest || '', /[\u0600-\u06FF]/);
  assert.equal(/[ğışöüĞİŞÖÜ]/.test(translations.en.durationPlaceholder || ''), false);
  assert.equal(/[ğışöüĞİŞÖÜ]/.test(translations.sq.cityPlaceholder || ''), false);
});

test('the employer home shows request files and the form opens without sample values', () => {
  const source = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../app/employer/page.tsx'),
    'utf8',
  );
  const homeAt = source.indexOf("{activeTab === 'home' &&");
  const formAt = source.indexOf("{activeTab === 'newRequest' &&");
  const filesAt = source.indexOf('activeDemandFilesTitle');
  const formTitleAt = source.indexOf('corporateDemandTitle');
  assert.ok(homeAt >= 0 && formAt > homeAt);
  assert.ok(filesAt > homeAt && filesAt < formAt);
  assert.ok(formTitleAt > formAt);
  assert.equal(source.slice(formAt).includes('activeDemandFilesTitle'), false);
  assert.equal(source.includes("useState('construction')"), false);
  assert.equal(source.includes("useState<string[]>(['formwork'])"), false);
  assert.equal(source.includes("useState('Struga')"), false);
  assert.equal(source.includes("useState('1200 EUR')"), false);
  assert.equal(source.includes("useState('1-3')"), false);
  assert.equal(source.includes('durationDefault'), false);
  assert.equal(source.includes('demandStatusLabel'), true);
  assert.equal(source.includes('localizeCatalogTitle'), true);
  assert.equal(source.includes('candidateSectorLabel'), true);
  assert.equal(source.includes('empTabNewRequest'), true);
  assert.equal(source.includes('newDemandBtn'), true);
  assert.equal(source.includes('empNoRequests'), true);
  assert.equal(source.includes('{dem.status}'), false);
  assert.equal(source.includes('{dem.sector}'), false);
  assert.equal(source.includes('{dem.position_title}'), false);
  assert.equal(source.includes("activeTab === 'demands'"), false);
});
