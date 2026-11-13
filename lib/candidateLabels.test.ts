import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { translations, type Language } from './dictionary.ts';
import { portalUi } from './portal-ui-copy.ts';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const {
  candidateDocumentTitle,
  candidateFilterLabels,
  candidatePassportLabel,
  candidatePlaceLabel,
  candidateProfessionLabel,
  candidateSectorChoices,
  candidateSectorLabel,
  sameSector,
} = await import('./candidateLabels.ts');

const LOCALES: Language[] = ['tr', 'en', 'sq', 'ar', 'mk'];
const CYRILLIC = /[А-Яа-яЃѓЅѕЈјЉљЊњЌќЏџ]/;
const ARABIC = /[\u0600-\u06FF]/;

test('sector and country filter placeholders follow every locale', () => {
  assert.equal(candidateFilterLabels(translations.mk).allSectors, 'Сите сектори');
  assert.equal(candidateFilterLabels(translations.mk).allCountries, 'Сите држави');
  assert.equal(candidateFilterLabels(translations.tr).allSectors, 'Tüm sektörler');
  assert.equal(candidateFilterLabels(translations.tr).allCountries, 'Tüm ülkeler');
  assert.equal(candidateFilterLabels(translations.en).allSectors, 'All sectors');
  assert.equal(candidateFilterLabels(translations.en).allCountries, 'All countries');
  assert.equal(candidateFilterLabels(translations.sq).allSectors, 'Të gjithë sektorët');
  assert.equal(candidateFilterLabels(translations.sq).allCountries, 'Të gjitha vendet');
  assert.match(candidateFilterLabels(translations.ar).allSectors, ARABIC);
  assert.match(candidateFilterLabels(translations.ar).allCountries, ARABIC);
  for (const lang of LOCALES) {
    const labels = candidateFilterLabels(translations[lang]);
    assert.ok(labels.allSectors.trim());
    assert.ok(labels.allCountries.trim());
    assert.equal(labels.allSectors, translations[lang].empCandAnySector);
    assert.equal(labels.allCountries, translations[lang].empCandAnyCountry);
  }
});

test('candidate sector labels match the register form, including uppercase codes', () => {
  for (const lang of LOCALES) {
    const ui = portalUi[lang];
    for (const sector of ui.formSectors) {
      assert.equal(candidateSectorLabel(sector.value, ui, translations[lang]), sector.label);
      assert.equal(candidateSectorLabel(sector.value.toUpperCase(), ui, translations[lang]), sector.label);
      assert.equal(candidateSectorLabel(sector.label, ui, translations[lang]), sector.label);
    }
    const choices = candidateSectorChoices(ui, translations[lang]);
    assert.deepEqual(choices.slice(0, ui.formSectors.length), ui.formSectors);
    assert.ok(choices.some((item) => item.value === 'hr'));
    assert.ok(choices.some((item) => item.value === 'trade'));
  }
  assert.equal(candidateSectorLabel('CONSTRUCTION', portalUi.mk, translations.mk), 'Градежништво и објекти');
  assert.equal(candidateSectorLabel('Turizm ve otelcilik', portalUi.en, translations.en), 'Hospitality and food services');
  assert.equal(candidateSectorLabel('textile', portalUi.sq, translations.sq), 'Tekstil dhe konfeksione');
  assert.equal(candidateSectorLabel('HOSPITALITY', portalUi.tr, translations.tr), 'Otelcilik ve gıda hizmetleri');
  assert.equal(candidateSectorLabel('HOSPITALITY', portalUi.ar, translations.ar), 'الضيافة والخدمات الغذائية');
  assert.equal(candidateSectorLabel('CONSTRUCTION', portalUi.sq, translations.sq), 'Ndërtim dhe objekte');
  assert.equal(candidateSectorLabel('construction', portalUi.en, translations.en), 'Construction and building');
  assert.equal(candidateSectorLabel('hr', portalUi.mk, translations.mk), 'Човечки ресурси');
  assert.equal(candidateSectorLabel('trade', portalUi.en, translations.en), 'Foreign Trade & Logistics');
  assert.equal(candidateSectorLabel('custom workshop', portalUi.mk, translations.mk), 'custom workshop');
  assert.equal(sameSector('CONSTRUCTION', 'construction'), true);
  assert.equal(sameSector('Градежништво', 'construction'), true);
  assert.equal(sameSector('hospitality', 'construction'), false);
  assert.equal(sameSector('logistics', 'all'), true);
});

test('unspecified sentinels localize and typed professions stay as entered', () => {
  for (const lang of LOCALES) {
    const unspecified = portalUi[lang].unspecified;
    assert.equal(candidatePlaceLabel('Belirtilmedi', '', lang, unspecified), unspecified);
    assert.equal(candidatePlaceLabel('Belirtilmemiş', null, lang, unspecified), unspecified);
    assert.equal(candidateProfessionLabel('Belirtilmedi', unspecified), unspecified);
    assert.equal(candidatePassportLabel('N/A', unspecified), unspecified);
    assert.equal(candidatePassportLabel('', unspecified), unspecified);
  }
  assert.equal(candidateProfessionLabel('Elektrik mühendisi', portalUi.mk.unspecified), 'Elektrik mühendisi');
  assert.equal(candidateProfessionLabel('electrician', portalUi.mk.unspecified, 'mk'), 'Електричар');
  assert.equal(candidateProfessionLabel('electrician', portalUi.en.unspecified, 'en'), 'Electrician');
  assert.equal(candidateProfessionLabel('cook', portalUi.ar.unspecified, 'ar'), 'طبّاخ');
  assert.equal(candidateProfessionLabel('Kalıp ustası', portalUi.tr.unspecified, 'tr'), 'Kalıp ustası');
  assert.equal(candidatePlaceLabel('Belirtilmedi', 'Turkey', 'mk', portalUi.mk.unspecified), 'Турција');
  assert.equal(candidatePlaceLabel('Türkiye', '', 'mk', portalUi.mk.unspecified), 'Турција');
  assert.equal(candidatePlaceLabel('North Macedonia', '', 'sq', portalUi.sq.unspecified), 'Maqedonia e Veriut');
  assert.equal(candidatePlaceLabel('Özbekistan', '', 'en', portalUi.en.unspecified), 'Uzbekistan');
  assert.equal(candidatePlaceLabel('Bangladesh', '', 'tr', portalUi.tr.unspecified), 'Bangladeş');
  assert.equal(candidatePlaceLabel('Belirtilmedi', '', 'en', portalUi.en.unspecified), portalUi.en.unspecified);
  assert.equal(candidatePlaceLabel('', '', 'ar', portalUi.ar.unspecified), portalUi.ar.unspecified);
  assert.match(portalUi.mk.refresh, CYRILLIC);
  assert.match(portalUi.mk.unspecified, CYRILLIC);
});

test('the candidates tab no longer hardcodes English sector, country, or refresh labels', () => {
  const source = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../components/portal/CandidatesTab.tsx'),
    'utf8',
  );
  assert.equal(source.includes('All Sectors'), false);
  assert.equal(source.includes('All Countries'), false);
  assert.equal(source.includes('General HR'), false);
  assert.equal(source.includes('> Refresh'), false);
  assert.equal(source.includes("'N/A'"), false);
  assert.equal(source.includes('candidateSectorLabel'), true);
  assert.equal(source.includes('candidateFilterLabels'), true);
  assert.equal(source.includes('ui.formSectors.map'), true);
});

test('document names follow the slot number in every language; hand-added documents keep their name', () => {
  const langs = Object.keys(translations) as Language[];
  for (const lang of langs) {
    const t = translations[lang];
    assert.equal(candidateDocumentTitle({ id: '1', name: 'Pasaport Taraması' }, t), t.docPassportScan, lang);
    assert.equal(candidateDocumentTitle({ id: '2', name: 'Professional Certificate' }, t), t.docProfessionalCert, lang);
    assert.equal(candidateDocumentTitle({ id: '3', name: 'Criminal Record' }, t), t.docCriminalRecord, lang);
    assert.equal(candidateDocumentTitle({ id: '4', name: 'Health Report' }, t), t.docHealthReport, lang);
    assert.equal(candidateDocumentTitle({ id: '5', name: 'e-Apostille' }, t), t.docApostille, lang);
    // A table row has a uuid id; the slot number decides.
    assert.equal(candidateDocumentTitle({ id: '7c9e6679-7425-40de-944b-e07fc1f90ae7', slot: '3', name: 'x' }, t), t.docCriminalRecord, lang);
    assert.equal(candidateDocumentTitle({ id: 6, name: 'Diploma (elle eklendi)' }, t), 'Diploma (elle eklendi)', lang);
    assert.equal(candidateDocumentTitle({ id: 'extra-1', name: '  Referans mektubu ' }, t), 'Referans mektubu', lang);
  }
  assert.equal(candidateDocumentTitle({ id: '2', name: 'Professional Certificate' }, translations.mk), 'Професионален сертификат');
  assert.equal(candidateDocumentTitle({ id: 2, name: 'x' }, translations.tr), 'Mesleki Sertifika');
  assert.equal(candidateDocumentTitle(null, translations.tr), '');
  assert.equal(candidateDocumentTitle({ id: '9' }, translations.tr), '');
});

test('the candidate page and the staff page both use the shared document title helper', () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const candidatePage = readFileSync(join(root, 'app/candidate/page.tsx'), 'utf8');
  const staffPage = readFileSync(join(root, 'app/portal/candidates/[id]/page.tsx'), 'utf8');
  assert.equal(candidatePage.includes('candidateDocumentTitle('), true);
  // The staff list is keyed by doc_type (candidate_documents) and uses the same title keys.
  const staffList = readFileSync(join(root, 'components/portal/CandidateDocumentsPanel.tsx'), 'utf8');
  assert.equal(staffList.includes('documentTypeTitle('), true);
  assert.equal(candidatePage.includes('docTitlesByLang'), false);
  assert.equal(candidatePage.includes('<strong>{doc.name}</strong>'), false);
  assert.equal(staffPage.includes("'1': t.docPassportScan"), false);
});
