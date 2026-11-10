import assert from 'node:assert/strict';
import test from 'node:test';
import { translations, type Language } from './dictionary.ts';
import {
  OTHER_PROFESSION,
  PROFESSION_LOCALES,
  PROFESSIONS,
  professionByKey,
  professionForSectorChange,
  professionInSector,
  professionLabel,
  professionSearchBlob,
  professionsForSector,
} from './professions.ts';

const CYRILLIC = /[А-Яа-яЃѓЅѕЈјЉљЊњЌќЏџ]/;
const ARABIC = /[\u0600-\u06FF]/;

const CONSTRUCTION = [
  'electrician', 'plumber', 'welder', 'mason', 'carpenter', 'steel_fixer', 'painter', 'tiler',
  'plasterer', 'scaffolder', 'heavy_equipment_operator', 'crane_operator', 'construction_labourer', 'site_foreman',
];
const HOSPITALITY = ['cook', 'kitchen_helper', 'waiter', 'housekeeper'];
const MANUFACTURING = ['machine_operator', 'sewing_operator', 'cnc_operator', 'warehouse_worker', 'forklift_driver'];

test('every profession key is unique and has a label in TR, EN, MK, SQ, and AR', () => {
  const keys = new Set<string>();
  assert.ok(PROFESSIONS.length >= 30);
  for (const item of PROFESSIONS) {
    assert.equal(keys.has(item.key), false, item.key);
    keys.add(item.key);
    assert.equal(item.key, item.key.trim().toLowerCase());
    assert.equal(item.key.includes(' '), false, item.key);
    assert.notEqual(item.key, OTHER_PROFESSION);
    assert.ok(item.sector.trim());
    for (const lang of PROFESSION_LOCALES) {
      const label = item.labels[lang];
      assert.equal(typeof label, 'string', `${item.key}.${lang}`);
      assert.ok(label.trim(), `${item.key}.${lang}`);
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
  assert.match(professionSearchBlob('welder'), /Kaynakçı/);
  assert.match(professionSearchBlob('welder'), /Welder/);
  assert.equal(professionSearchBlob('Kalıp ustası'), 'Kalıp ustası');
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
