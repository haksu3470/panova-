import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { translations } from './dictionary.ts';
import {
  canOfferRequestDelete,
  EMPLOYER_CARD_TARGETS,
  EMPLOYER_OVERVIEW_CARDS,
  employerCardAriaLabel,
  employerCardValue,
  requestDeleteOutcome,
} from './employerOverview.ts';
import { emptyPipelineCounts, formatCount, indexPipelineCounts, sumPipelineCounts } from './requestPipelineCounts.ts';

const ROOT = join(import.meta.dirname, '..');
const LANGS = ['tr', 'en', 'sq', 'ar', 'mk'] as const;
const page = () => readFileSync(join(ROOT, 'app/employer/page.tsx'), 'utf8');

test('four cards in a fixed order, each opening its own section', () => {
  assert.deepEqual([...EMPLOYER_OVERVIEW_CARDS], ['openRequests', 'candidates', 'interviews', 'selected']);
  assert.deepEqual(EMPLOYER_CARD_TARGETS.openRequests, { tab: 'home', anchor: 'employer-requests-heading' });
  assert.equal(EMPLOYER_CARD_TARGETS.candidates.tab, 'candidates');
  assert.equal(EMPLOYER_CARD_TARGETS.interviews.tab, 'interviews');
  assert.equal(EMPLOYER_CARD_TARGETS.selected.tab, 'selected');
  const src = page();
  for (const { anchor } of Object.values(EMPLOYER_CARD_TARGETS)) {
    assert.ok(new RegExp(`id="${anchor}" tabIndex=\\{-1\\}`).test(src), `${anchor} exists and can take focus`);
  }
});

test('card numbers are the same totals as before; closed requests are not open', () => {
  const index = indexPipelineCounts([
    { request_id: 'a', presented: 3, interviews: 2, selected: 1 },
    { request_id: 'b', presented: 2, interviews: 1, selected: 1 },
    { request_id: 'c', presented: 1, interviews: 0, selected: 0 },
  ]);
  const requests = [{ id: 'a', status: 'interviews' }, { id: 'b', status: 'completed' }, { id: 'c', status: 'cancelled' }];
  const totals = sumPipelineCounts(index, requests);
  assert.deepEqual(EMPLOYER_OVERVIEW_CARDS.map((card) => employerCardValue(card, totals)), [1, 6, 3, 2]);
  // unknown counts show a dash, never 0
  assert.deepEqual(EMPLOYER_OVERVIEW_CARDS.map((card) => formatCount(employerCardValue(card, sumPipelineCounts(null, requests)))), ['—', '—', '—', '—']);
});

test('cards sit right under the tab bar, before the request list and the form, as buttons', () => {
  const src = page();
  const tabs = src.indexOf('{guideNavLabel[currentLang]}');
  const cards = src.indexOf('EMPLOYER_OVERVIEW_CARDS.map(');
  const list = src.indexOf('id="employer-requests-heading"');
  const form = src.indexOf('onSubmit={handleCreateCorporateDemand}');
  assert.ok(tabs > 0 && cards > tabs && cards < list && cards < form, 'order: tabs, cards, list, form');
  assert.ok(src.includes('<OverviewCard'));
  assert.ok(src.includes('onOpen={() => openCard(card)}'));
  assert.equal(src.split('{t.openRequestsCard}').length - 1, 0, 'old bottom cards are gone');
  assert.ok(src.includes("scrollIntoView({ behavior: 'smooth', block: 'start' })"));
  assert.ok(src.includes('{t.portalSummaryTitle}'), 'the PANOVA summary box is untouched');
});

test('aria label in five languages, no English left in other languages', () => {
  for (const lang of LANGS) {
    const tpl = translations[lang].empCardGoTo;
    assert.ok(tpl && tpl.includes('{label}') && tpl.includes('{value}') && tpl.includes('{section}'), lang);
    if (lang !== 'en') assert.notEqual(tpl, translations.en.empCardGoTo, lang);
    for (const key of ['empRequestDelete', 'empRequestDeleteConfirm', 'empRequestHasActivity', 'empRequestDeleteFailed'] as const) {
      assert.ok(translations[lang][key]?.trim(), `${lang}.${key}`);
      if (lang !== 'en') assert.notEqual(translations[lang][key], translations.en[key], `${lang}.${key}`);
    }
  }
  assert.equal(employerCardAriaLabel(translations.tr.empCardGoTo, 'Açık Talepler', '3', 'Talep dosyaları'), 'Açık Talepler: 3. Talep dosyaları bölümüne git');
  assert.equal(translations.tr.empRequestHasActivity, 'Bu talebe bağlı süreç var, silinemez.');
});

test('delete: 0 rows back means the request has a process; errors are failures', () => {
  assert.equal(requestDeleteOutcome({ data: [{ id: 'a' }], error: null }), 'deleted');
  assert.equal(requestDeleteOutcome({ data: [], error: null }), 'has_activity');
  assert.equal(requestDeleteOutcome({ data: null, error: null }), 'has_activity');
  assert.equal(requestDeleteOutcome({ data: null, error: { code: '42501' } }), 'failed');
});

test('delete button only for a request with no activity', () => {
  assert.equal(canOfferRequestDelete(null), false);
  assert.equal(canOfferRequestDelete(emptyPipelineCounts('a', 3)), true);
  for (const key of ['presented', 'selected', 'interviews', 'offers', 'offers_accepted', 'in_process', 'travel_ready', 'started', 'matched'] as const) {
    assert.equal(canOfferRequestDelete({ ...emptyPipelineCounts('a'), [key]: 1 }), false, key);
  }
  const src = page();
  assert.ok(src.includes('!staffView && dem.employer_id === employerProfile?.id && canOfferRequestDelete('));
  assert.ok(src.includes(".delete().eq('id', requestId).select('id')"));
  assert.ok(src.includes('window.confirm(t.empRequestDeleteConfirm'));
});

test('unused DemandForm and createDemand are removed', () => {
  assert.equal(existsSync(join(ROOT, 'app/employer/components/DemandForm.tsx')), false);
  assert.equal(readFileSync(join(ROOT, 'lib/services/demandService.ts'), 'utf8').includes('createDemand'), false);
});
