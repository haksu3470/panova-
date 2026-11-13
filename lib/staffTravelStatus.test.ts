import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { canPickTravelStatus, hasFlightInfo, staffTravelDisplay, toTravelFields, travelView } from './employerPlacements.ts';
import { translations } from './dictionary.ts';

const ROOT = join(import.meta.dirname, '..');
const LANGS = ['tr', 'en', 'sq', 'ar', 'mk'] as const;

test('no flight details: shown as not entered, whatever the default says', () => {
  for (const travel_status of ['planned', '', null, '  ']) {
    const row = toTravelFields({ travel_status, flight_date: '', flight_number: ' ', departure_city: null });
    assert.equal(hasFlightInfo(row), false);
    assert.deepEqual(staffTravelDisplay(row), { kind: 'not_entered' });
    assert.deepEqual(travelView(row), { kind: 'not_entered' });
  }
});

test('with flight details: the chosen status is shown', () => {
  const base = { flight_number: 'TK1883' };
  assert.deepEqual(staffTravelDisplay(toTravelFields({ ...base, travel_status: 'planned' })), { kind: 'status', status: 'planned' });
  assert.deepEqual(staffTravelDisplay(toTravelFields({ ...base, travel_status: 'ticketed' })), { kind: 'status', status: 'ticketed' });
  assert.deepEqual(staffTravelDisplay(toTravelFields({ departure_city: 'Skopje', travel_status: 'completed' })), { kind: 'status', status: 'completed' });
  assert.deepEqual(staffTravelDisplay(toTravelFields({ flight_date: '2026-12-01', travel_status: null })), { kind: 'status', status: null });
});

test('a stored ticketed/completed without flight details is still shown as is', () => {
  // e.g. "started work" sets travel_status = completed on its own
  assert.deepEqual(staffTravelDisplay(toTravelFields({ travel_status: 'completed' })), { kind: 'status', status: 'completed' });
});

test('ticketed and completed need flight details; planned is always allowed', () => {
  const empty = toTravelFields({ travel_status: 'planned' });
  const filled = toTravelFields({ travel_status: 'planned', arrival_city: 'Istanbul' });
  assert.equal(canPickTravelStatus('planned', empty), true);
  assert.equal(canPickTravelStatus('ticketed', empty), false);
  assert.equal(canPickTravelStatus('completed', empty), false);
  assert.equal(canPickTravelStatus('ticketed', filled), true);
  assert.equal(canPickTravelStatus('completed', filled), true);
});

test('staff page and travel card use the shared rule; travel_status only sent when changed', () => {
  const page = readFileSync(join(ROOT, 'app/portal/candidates/[id]/page.tsx'), 'utf8');
  const panel = readFileSync(join(ROOT, 'components/portal/PlacementPanel.tsx'), 'utf8');
  assert.ok(page.includes('staffTravelDisplay(travelFields)'));
  assert.ok(page.includes("disabled={!canPickTravelStatus('ticketed', travelFields)}"));
  assert.ok(page.includes("disabled={!canPickTravelStatus('completed', travelFields)}"));
  const payloadStart = page.indexOf('const payload: Record<string, unknown> = {');
  assert.ok(payloadStart > 0);
  const payloadBlock = page.slice(payloadStart, page.indexOf('};', payloadStart));
  assert.equal(payloadBlock.includes('travel_status'), false);
  assert.ok(page.includes("if (travelStatus !== (candidate?.travel_status || 'planned'))"));
  assert.ok(panel.includes('staffTravelDisplay(toTravelFields(c))'));
  assert.equal(panel.includes("c.travel_status === 'planned'"), false);
});

test('texts exist in five languages and are translated', () => {
  for (const lang of LANGS) {
    for (const key of ['plTravelNotEntered', 'travelNeedsFlightInfo'] as const) {
      assert.ok(translations[lang][key]?.trim(), `${lang}.${key}`);
      if (lang !== 'en') assert.notEqual(translations[lang][key], translations.en[key], `${lang}.${key}`);
    }
  }
});
