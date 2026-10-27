import assert from 'node:assert/strict';
import test from 'node:test';
import { homeCopy } from './home-copy.ts';

test('auth footer place names and tax line follow the locale', () => {
  assert.equal(homeCopy.tr.about.countries[2], 'Kuzey Makedonya');
  assert.equal(homeCopy.tr.about.turkeyOffice, 'Türkiye Ofisi');
  assert.equal(homeCopy.tr.about.siteTaxOffice, 'Site Vergi Dairesi');
  assert.equal(homeCopy.tr.about.vkn, 'VKN');

  assert.equal(homeCopy.en.about.countries[2], 'North Macedonia');
  assert.equal(homeCopy.en.about.turkeyOffice, 'Türkiye Office');
  assert.equal(homeCopy.en.about.siteTaxOffice, 'Site Tax Office');
  assert.equal(homeCopy.en.about.vkn, 'VAT ID');
  assert.equal(homeCopy.en.about.turkeyOffice.includes('Ofisi'), false);
  assert.equal(homeCopy.en.about.vkn.includes('VKN'), false);

  assert.equal(homeCopy.sq.about.countries[2], 'Maqedonia e Veriut');
  assert.equal(homeCopy.sq.about.turkeyOffice, 'Zyra e Turqisë');
  assert.equal(homeCopy.sq.about.siteTaxOffice, 'Zyra tatimore Site');
  assert.equal(homeCopy.sq.about.vkn, 'Nr. i TVSH-së');
  assert.equal(homeCopy.sq.about.vkn.includes('VKN'), false);

  assert.equal(homeCopy.ar.about.countries[2], 'مقدونيا الشمالية');
  assert.equal(homeCopy.ar.about.turkeyOffice, 'مكتب تركيا');
  assert.equal(homeCopy.ar.about.siteTaxOffice, 'دائرة الضرائب Site');
  assert.equal(homeCopy.ar.about.vkn, 'رقم ضريبة القيمة المضافة');
  assert.equal(homeCopy.ar.about.vkn.includes('VKN'), false);

  assert.equal(homeCopy.mk.about.countries[2], 'Северна Македонија');
  assert.equal(homeCopy.mk.about.turkeyOffice, 'Канцеларија во Турција');
  assert.equal(homeCopy.mk.about.siteTaxOffice, 'Даночна управа Site');
  assert.equal(homeCopy.mk.about.vkn, 'ДДВ број');
  assert.equal(homeCopy.mk.about.vkn.includes('VKN'), false);
  assert.equal(homeCopy.mk.langLabel, 'Јазик');
});
