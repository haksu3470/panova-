import assert from 'node:assert/strict';
import test from 'node:test';
import { translations, type Language } from './dictionary.ts';
import { homeCopy } from './home-copy.ts';
import { portalUi } from './portal-ui-copy.ts';
import {
  OTHER_PROFESSION,
  PROFESSION_LOCALES,
  PROFESSIONS,
  professionByKey,
  professionForSectorChange,
  professionInSector,
  localizeCatalogTitle,
  professionFromCatalogText,
  professionLabel,
  professionSearchBlob,
  professionsForSector,
  catalogTitleKeys,
  foldCatalogText,
  LEGACY_POSITIONS,
  SECTORS,
  SECTOR_KEYS,
  sectorLabel,
  sectorOptions,
} from './professions.ts';

const CYRILLIC = /[А-Яа-яЃѓЅѕЈјЉљЊњЌќЏџ]/;
const ARABIC = /[\u0600-\u06FF]/;

const CONSTRUCTION = [
  'electrician', 'plumber', 'welder', 'mason', 'carpenter', 'steel_fixer', 'painter', 'tiler',
  'plasterer', 'scaffolder', 'heavy_equipment_operator', 'crane_operator', 'construction_labourer', 'site_foreman',
  'site_manager', 'roofer', 'insulation_worker', 'drywall_installer', 'concrete_worker', 'hvac_technician',
  'glazier', 'road_construction_worker', 'floor_layer',
];
const HOSPITALITY = ['cook', 'kitchen_helper', 'waiter', 'housekeeper'];
const MANUFACTURING = ['machine_operator', 'sewing_operator', 'cnc_operator', 'warehouse_worker', 'forklift_driver'];

test('every profession key is unique and has a label in TR, EN, MK, SQ, and AR', () => {
  const keys = new Set<string>();
  assert.ok(PROFESSIONS.length >= 150 && PROFESSIONS.length <= 200, String(PROFESSIONS.length));
  for (const item of PROFESSIONS) {
    assert.equal(keys.has(item.key), false, item.key);
    keys.add(item.key);
    assert.equal(item.key, item.key.trim().toLowerCase());
    assert.equal(item.key.includes(' '), false, item.key);
    assert.match(item.key, /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/, `${item.key} is not snake_case`);
    assert.ok(SECTOR_KEYS.includes(item.sector), `${item.key} has unknown sector ${item.sector}`);
    assert.notEqual(item.key, OTHER_PROFESSION);
    assert.ok(item.sector.trim());
    for (const lang of PROFESSION_LOCALES) {
      const label = item.labels[lang];
      assert.equal(typeof label, 'string', `${item.key}.${lang}`);
      assert.ok(label.trim(), `${item.key}.${lang}`);
      assert.equal(label.includes(','), false, `${item.key}.${lang} must not contain a comma (titles are comma-joined)`);
    }
    assert.match(item.labels.mk, CYRILLIC, item.key);
    assert.match(item.labels.ar, ARABIC, item.key);
    assert.notEqual(item.labels.en, item.labels.tr, `${item.key} should not reuse the Turkish label in English`);
  }
});

test('professions filter by the sector key the forms store', () => {
  const construction = professionsForSector('construction').map((item) => item.key);
  assert.deepEqual(construction, CONSTRUCTION);
  assert.equal(professionsForSector('CONSTRUCTION').some((item) => item.key === 'electrician'), true);
  assert.equal(professionsForSector('construction').some((item) => item.key === 'cook'), false);
  for (const key of HOSPITALITY) assert.equal(professionInSector(key, 'hospitality'), true);
  for (const key of MANUFACTURING) assert.equal(professionInSector(key, 'manufacturing'), true);
  assert.equal(professionsForSector('logistics').some((item) => item.key === 'truck_driver'), true);
  assert.equal(professionsForSector('care').some((item) => item.key === 'caregiver'), true);
  assert.equal(professionsForSector('agriculture').length > 0, true);
  assert.deepEqual(professionsForSector('trade'), []);
  assert.deepEqual(professionsForSector(''), []);
  assert.deepEqual(professionsForSector('unknown-workshop'), []);
});

test('changing sector keeps a profession only when it belongs to that sector', () => {
  assert.equal(professionForSectorChange('electrician', 'construction'), 'electrician');
  assert.equal(professionForSectorChange('electrician', 'CONSTRUCTION'), 'electrician');
  assert.equal(professionForSectorChange('electrician', 'agriculture'), '');
  assert.equal(professionForSectorChange('truck_driver', 'hospitality'), '');
  assert.equal(professionForSectorChange('caregiver', 'care'), 'caregiver');
  assert.equal(professionForSectorChange('', 'construction'), '');
  assert.equal(professionForSectorChange('   ', 'construction'), '');
  assert.equal(professionForSectorChange('Elektrik mühendisi', 'construction'), '');
  assert.equal(professionForSectorChange(OTHER_PROFESSION, 'construction'), '');
});

test('catalog keys localize and legacy free text stays as entered', () => {
  assert.equal(professionByKey('electrician')?.sector, 'construction');
  assert.equal(professionByKey(' Electrician '), undefined);
  assert.equal(professionByKey('Elektrikçi'), undefined);
  assert.equal(professionByKey(OTHER_PROFESSION), undefined);
  assert.equal(professionLabel('electrician', 'tr'), 'Elektrikçi');
  assert.equal(professionLabel('electrician', 'en'), 'Electrician');
  assert.equal(professionLabel('cook', 'mk'), 'Готвач');
  assert.equal(professionLabel('caregiver', 'ar'), 'مقدّم رعاية');
  assert.equal(professionLabel('Elektrik mühendisi', 'en'), null);
  assert.equal(professionLabel('', 'tr'), null);
  assert.equal(professionFromCatalogText('Electrician')?.key, 'electrician');
  assert.equal(professionFromCatalogText('COOK')?.key, 'cook');
  assert.equal(professionFromCatalogText('Kitchen helper')?.key, 'kitchen_helper');
  assert.equal(localizeCatalogTitle('Cook', 'tr'), 'Aşçı');
  assert.equal(localizeCatalogTitle('Electrician', 'mk'), 'Електричар');
  assert.equal(localizeCatalogTitle('COOK, Electrician', 'sq'), 'Kuzhinier, Elektricist');
  assert.equal(localizeCatalogTitle('cook', 'ar'), 'طبّاخ');
  assert.equal(localizeCatalogTitle('Kalıp ustası', 'en'), 'Carpenter / formwork');
  assert.equal(localizeCatalogTitle('Kalıp atölyesi', 'en'), 'Kalıp atölyesi');
  assert.equal(localizeCatalogTitle('Elektrikçi, night baker', 'en'), 'Electrician, night baker');
  assert.equal(localizeCatalogTitle('', 'tr'), '');
  assert.match(professionSearchBlob('welder'), /Kaynakçı/);
  assert.match(professionSearchBlob('welder'), /Welder/);
  assert.equal(professionSearchBlob('Kalıp atölyesi'), 'Kalıp atölyesi');
  for (const lang of Object.keys(translations) as Language[]) {
    assert.ok(translations[lang].professionSelect?.trim(), lang);
    assert.ok(translations[lang].professionOther?.trim(), lang);
    assert.ok(translations[lang].professionSpecify?.trim(), lang);
    assert.ok(translations[lang].sectorCare?.trim(), lang);
  }
  assert.equal(translations.en.professionOther, 'Other (please specify)');
  assert.match(translations.mk.professionOther, CYRILLIC);
  assert.match(translations.ar.professionSelect, ARABIC);
});

const OLD_POSITION_IDS = [
  'harvest', 'greenhouse', 'pruning', 'tractor', 'mushroom', 'packing',
  'formwork', 'rebar', 'masonry', 'welder', 'electrician', 'engineer', 'siteChief',
  'warehouse', 'forklift', 'foreignTrade', 'logistics', 'accounting', 'sales',
];

test('there are exactly the 11 sectors, each with a label in every locale and at least 8 professions', () => {
  assert.deepEqual(SECTOR_KEYS, [
    'construction', 'agriculture', 'hospitality', 'manufacturing', 'textile', 'logistics',
    'warehouse_retail', 'care', 'cleaning_security', 'automotive', 'office_engineering',
  ]);
  for (const item of SECTORS) {
    for (const lang of PROFESSION_LOCALES) assert.ok(item.labels[lang]?.trim(), `${item.key}.${lang}`);
    assert.match(item.labels.mk, CYRILLIC, item.key);
    assert.match(item.labels.ar, ARABIC, item.key);
    assert.ok(professionsForSector(item.key).length >= 8, `${item.key} has ${professionsForSector(item.key).length}`);
  }
  assert.equal(sectorLabel('textile', 'tr'), 'Tekstil ve hazır giyim');
  assert.equal(sectorLabel('CARE', 'en'), 'Care and health services');
  assert.equal(sectorLabel('trade', 'tr'), null);
  assert.equal(sectorOptions('sq').length, 11);
});

test('every form sector list and the dictionary show exactly the catalog sectors', () => {
  const labelKey: Record<string, keyof typeof translations.tr> = {
    construction: 'sectorConstruction', agriculture: 'sectorAgriculture', hospitality: 'sectorHospitality',
    manufacturing: 'sectorManufacturing', textile: 'sectorTextile', logistics: 'sectorLogistics',
    warehouse_retail: 'sectorWarehouseRetail', care: 'sectorCare', cleaning_security: 'sectorCleaningSecurity',
    automotive: 'sectorAutomotive', office_engineering: 'sectorOfficeEngineering',
  };
  for (const lang of PROFESSION_LOCALES) {
    assert.deepEqual(portalUi[lang].formSectors, sectorOptions(lang), `portalUi.${lang}`);
    assert.deepEqual(homeCopy[lang].formSectors, sectorOptions(lang), `homeCopy.${lang}`);
    for (const item of SECTORS) assert.equal(translations[lang][labelKey[item.key]], item.labels[lang], `${lang}.${item.key}`);
  }
});

test('every old request-form position has a catalog counterpart', () => {
  assert.deepEqual(Object.keys(LEGACY_POSITIONS).sort(), [...OLD_POSITION_IDS].sort());
  for (const id of OLD_POSITION_IDS) {
    const legacy = LEGACY_POSITIONS[id];
    assert.ok(professionByKey(legacy.key), `${id} -> ${legacy.key}`);
    for (const lang of PROFESSION_LOCALES) {
      assert.equal(professionFromCatalogText(legacy.labels[lang])?.key, legacy.key, `${id}.${lang}`);
    }
  }
  for (const key of ['civil_engineer', 'foreign_trade_specialist', 'bookkeeper', 'sales_representative']) {
    assert.equal(professionByKey(key)?.sector, 'office_engineering', key);
  }
  assert.equal(professionByKey('mushroom_grower')?.sector, 'agriculture');
});

test('labels and aliases never point at two different professions', () => {
  const owner = new Map<string, string>();
  for (const item of PROFESSIONS) {
    for (const lang of PROFESSION_LOCALES) {
      const folded = foldCatalogText(item.labels[lang]);
      const prev = owner.get(folded);
      assert.ok(!prev || prev === item.key, `"${item.labels[lang]}" is used by ${prev} and ${item.key}`);
      owner.set(folded, item.key);
    }
  }
  for (const [id, legacy] of Object.entries(LEGACY_POSITIONS)) {
    for (const lang of PROFESSION_LOCALES) {
      const prev = owner.get(foldCatalogText(legacy.labels[lang]));
      assert.ok(!prev || prev === legacy.key, `old ${id}.${lang} collides with ${prev}`);
    }
  }
});

test('request titles store keys and localize keys, labels and old labels', () => {
  assert.equal(localizeCatalogTitle('welder, site_manager', 'tr'), 'Kaynakçı, Şantiye şefi');
  assert.equal(localizeCatalogTitle('welder, site_manager', 'mk'), 'Заварувач, Раководител на градилиште');
  assert.equal(localizeCatalogTitle('mushroom_grower, Gece fırıncısı', 'en'), 'Mushroom grower, Gece fırıncısı');
  assert.equal(localizeCatalogTitle('Mantar yetiştirme uzmanı, Ön muhasebe', 'en'), 'Mushroom grower, Bookkeeper');
  assert.equal(localizeCatalogTitle('Formwork carpenter', 'tr'), 'Kalıpçı / marangoz');
  assert.equal(localizeCatalogTitle('Şantiye şefi', 'ar'), 'مدير موقع البناء');
  assert.equal(localizeCatalogTitle('Shef kantieri', 'en'), 'Site manager');
  assert.deepEqual(catalogTitleKeys('Kaynakçı, welder, Dış ticaret uzmanı, serbest metin'), ['welder', 'foreign_trade_specialist']);
  assert.deepEqual(catalogTitleKeys(''), []);
});
