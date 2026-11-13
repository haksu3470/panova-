import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { register } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import { countOpenRequests, isClosedRequestStatus } from './requestPipelineCounts.ts';
import { translations } from './dictionary.ts';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);
const { OVERVIEW_CARD_TABS, overviewCardTarget, tabsForStaffRole } = await import('./staffAccess.ts');

const ROOT = join(import.meta.dirname, '..');
const LANGS = ['tr', 'en', 'sq', 'ar', 'mk'] as const;

test('open requests: completed and cancelled are left out, the total keeps them', () => {
  const rows = [
    { status: 'new_request' },
    { status: 'searching_candidates' },
    { status: 'travel_planning' },
    { status: 'completed' },
    { status: 'cancelled' },
    { status: null },
  ];
  assert.deepEqual(countOpenRequests(rows), { open: 4, total: 6 });
  assert.deepEqual(countOpenRequests([]), { open: 0, total: 0 });
  assert.equal(isClosedRequestStatus('completed'), true);
  assert.equal(isClosedRequestStatus('cancelled'), true);
  assert.equal(isClosedRequestStatus('official_process'), false);
});

test('each card opens its own tab', () => {
  assert.deepEqual({ ...OVERVIEW_CARD_TABS }, {
    candidates: 'candidates',
    requests: 'requests',
    employers: 'employers',
    staff: 'staff',
    support: 'support',
  });
  const all = () => true;
  for (const card of Object.keys(OVERVIEW_CARD_TABS) as (keyof typeof OVERVIEW_CARD_TABS)[]) {
    assert.equal(overviewCardTarget(card, all), OVERVIEW_CARD_TABS[card]);
  }
});

test('a card for a tab the role cannot see does not open it', () => {
  for (const role of ['finance', 'source_country', 'target_country', 'field_officer', 'upper_management']) {
    const tabs = tabsForStaffRole(role);
    const canSee = (tab: string) => tabs.includes(tab as never);
    for (const card of Object.keys(OVERVIEW_CARD_TABS) as (keyof typeof OVERVIEW_CARD_TABS)[]) {
      const target = overviewCardTarget(card, canSee);
      assert.equal(target === null, !tabs.includes(OVERVIEW_CARD_TABS[card]), `${role} ${card}`);
    }
  }
  // roles outside the catalog see overview and tasks only: no card opens anything
  const limited = tabsForStaffRole('finance');
  assert.equal(overviewCardTarget('requests', (tab) => limited.includes(tab)), null);
});

test('overview uses buttons only for reachable tabs, with the shared checks', () => {
  const page = readFileSync(join(ROOT, 'app/portal/page.tsx'), 'utf8');
  const card = readFileSync(join(ROOT, 'components/portal/OverviewCard.tsx'), 'utf8');
  assert.ok(page.includes("const canSeeTab = (tab: StaffTabId) => showTab(tab) && (tab !== 'staff' || isUpperManagement);"));
  assert.ok(page.includes('countOpenRequests(jobRequests)'));
  assert.ok(card.includes('type="button"'));
  assert.ok(card.includes('focus-visible:ring-2'));
  assert.ok(card.includes('if (!onOpen) return <div'));
});

test('overview texts exist in five languages and are translated', () => {
  for (const lang of LANGS) {
    for (const key of ['overviewTotalOf', 'overviewGoToTab'] as const) {
      const value = translations[lang][key];
      assert.ok(value?.trim(), `${lang}.${key}`);
      if (lang !== 'en') assert.notEqual(value, translations.en[key], `${lang}.${key}`);
    }
    assert.ok(translations[lang].overviewTotalOf?.includes('{n}'));
    assert.ok(translations[lang].overviewGoToTab?.includes('{tab}'));
  }
});
