import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dayOf,
  followupState,
  groupByRequest,
  hasFlightInfo,
  isoDay,
  isProcessStopped,
  OFFICIAL_STEPS,
  officialStepIndex,
  startedEmployees,
  toPlacement,
  toPlacements,
  travelView,
  acceptedOfferStartDate,
  officialProcessText,
  officialProcessView,
  toTravelFields,
} from './employerPlacements.ts';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { portalUi } from './portal-ui-copy.ts';
import { translations } from './dictionary.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('the official process view numbers the 8 shared steps and flags a stop', () => {
  assert.deepEqual(officialProcessView('ready_to_travel'), { kind: 'step', step: 'ready_to_travel', number: 7, total: 8 });
  assert.deepEqual(officialProcessView(''), { kind: 'step', step: 'not_started', number: 1, total: 8 });
  assert.deepEqual(officialProcessView(null), { kind: 'step', step: 'not_started', number: 1, total: 8 });
  assert.deepEqual(officialProcessView('started_work'), { kind: 'step', step: 'started_work', number: 8, total: 8 });
  assert.deepEqual(officialProcessView('rejected'), { kind: 'stopped' });
  assert.deepEqual(officialProcessView(' odd '), { kind: 'unknown', raw: 'odd' });
  const steps = portalUi.tr.steps;
  assert.equal(officialProcessText('ready_to_travel', steps, 'Süreç durduruldu'), 'Seyahate hazır · 7/8');
  assert.equal(officialProcessText('rejected', steps, 'Süreç durduruldu'), 'Süreç durduruldu');
  assert.equal(officialProcessText('odd', steps, 'x'), 'odd');
});

test('every language labels all 8 steps and the stop; the step list exists once', () => {
  for (const ui of Object.values(portalUi)) {
    for (const step of [...OFFICIAL_STEPS, 'rejected']) assert.ok(ui.steps[step]?.trim(), step);
  }
  const panel = readFileSync(join(ROOT, 'components/portal/PlacementPanel.tsx'), 'utf8');
  assert.equal(panel.includes("'documents_collecting'"), false, 'PlacementPanel must import OFFICIAL_STEPS');
  assert.equal(panel.includes("from '@/lib/employerPlacements'"), true);
});

test('accepted offer start date: latest accepted offer with a date, else null', () => {
  assert.equal(acceptedOfferStartDate([]), null);
  assert.equal(acceptedOfferStartDate(null), null);
  assert.equal(acceptedOfferStartDate([{ status: 'pending', start_date: '2027-01-01' }]), null);
  assert.equal(acceptedOfferStartDate([
    { status: 'accepted', start_date: '2027-02-01', created_at: '2026-10-01' },
    { status: 'accepted', start_date: '2027-03-01', created_at: '2026-11-01' },
    { status: 'accepted', start_date: '', created_at: '2026-12-01' },
  ]), '2027-03-01');
});

test('the candidate travel view reuses travelView and drops PNR and accommodation', () => {
  const own = toTravelFields({ id: 'c', travel_status: 'planned', flight_date: null, pnr_code: 'ABC', accommodation_details: 'Otel', passport_number: 'X' });
  assert.deepEqual(Object.keys(own).sort(), ['arrival_city', 'departure_city', 'flight_date', 'flight_number', 'travel_status']);
  assert.deepEqual(travelView(own), { kind: 'not_entered' });
  assert.deepEqual(travelView(toTravelFields({ travel_status: 'ticketed', flight_number: 'TK1' })), { kind: 'flight', status: 'ticketed' });
  const card = readFileSync(join(ROOT, 'components/candidate/CandidateProcessCard.tsx'), 'utf8');
  assert.equal(/pnr_code|accommodation_details|\.pnr|accommodation/.test(card.replace(/^\/\/.*$/gm, '')), false);
  assert.equal(card.includes('travelView('), true);
  assert.equal(card.includes('OFFICIAL_STEPS'), true);
});

test('new process texts exist in all five languages', () => {
  const keys = ['officialProcessLabel', 'officialProcessHint', 'yourProcessTitle', 'processNotStartedYet', 'processStageLabel', 'startDateNotSet', 'processInfoUnavailable', 'travelInfoLabel'] as const;
  for (const lang of ['tr', 'en', 'sq', 'ar', 'mk'] as const) {
    for (const key of keys) assert.ok(translations[lang][key]?.trim(), `${lang}.${key}`);
    assert.notEqual(translations[lang].colVisaStatus, undefined);
  }
  assert.equal(translations.tr.colVisaStatus, 'Aday durumu');
  assert.equal(translations.tr.candidateStatus, 'Aday durumu');
  assert.equal(translations.en.colVisaStatus, 'Candidate status');
  assert.notEqual(translations.sq.officialProcessHint, translations.en.officialProcessHint);
  assert.notEqual(translations.ar.yourProcessTitle, translations.en.yourProcessTitle);
});

const base = {
  request_id: 'r1', request_position_title: 'Kalıpçı', match_id: 'm1', candidate_id: 'c1',
  full_name: 'Ali Veli', profession: 'Kalıpçı', nationality: 'TR',
  official_process_status: 'visa_applied', pipeline_stage: 'in_process', travel_status: 'planned',
  flight_date: null, flight_number: null, departure_city: null, arrival_city: null,
  start_date: null, followups: [],
};

test('toPlacement keeps only the RPC fields and drops anything else', () => {
  const row = toPlacement({ ...base, passport_number: 'X1', phone: '555', pnr_code: 'P', accommodation_details: 'A' });
  assert.deepEqual(Object.keys(row).sort(), Object.keys(base).sort());
  assert.equal((row as Record<string, unknown>).passport_number, undefined);
});

test('toPlacement trims, nulls empty text and rejects unknown stages', () => {
  const row = toPlacement({ ...base, flight_date: '  ', full_name: ' Ali ', pipeline_stage: 'planned' });
  assert.equal(row.flight_date, null);
  assert.equal(row.full_name, 'Ali');
  assert.equal(row.pipeline_stage, null);
  assert.equal(toPlacement({ ...base, pipeline_stage: 'started' }).pipeline_stage, 'started');
});

test('toPlacement normalises follow-ups: only period, date, status', () => {
  const row = toPlacement({
    ...base,
    followups: [
      { period_stage: '30', check_date: '2026-12-20', status: 'completed', notes: 'x' },
      { period_stage: 60, check_date: null, status: 'weird' },
      { check_date: '2027-01-01' },
      null,
    ],
  });
  assert.deepEqual(row.followups, [
    { period_stage: '30', check_date: '2026-12-20', status: 'completed' },
    { period_stage: '60', check_date: null, status: 'planned' },
  ]);
  assert.deepEqual(toPlacement({ ...base, followups: 'nope' }).followups, []);
});

test('toPlacements ignores non-arrays and rows without keys', () => {
  assert.deepEqual(toPlacements(null), []);
  assert.deepEqual(toPlacements({}), []);
  assert.equal(toPlacements([base, { ...base, match_id: '' }, 5]).length, 1);
});

test('groupByRequest keeps first-appearance order and the title', () => {
  const rows = toPlacements([
    { ...base, request_id: 'r2', request_position_title: 'Aşçı', match_id: 'a' },
    { ...base, match_id: 'b' },
    { ...base, request_id: 'r2', request_position_title: 'Aşçı', match_id: 'c' },
  ]);
  const groups = groupByRequest(rows);
  assert.deepEqual(groups.map((g) => [g.request_id, g.title, g.rows.map((r) => r.match_id)]), [
    ['r2', 'Aşçı', ['a', 'c']],
    ['r1', 'Kalıpçı', ['b']],
  ]);
  assert.deepEqual(groupByRequest([]), []);
});

test('officialStepIndex: 8 steps, empty = first, stopped/unknown = -1', () => {
  assert.equal(OFFICIAL_STEPS.length, 8);
  assert.equal(officialStepIndex(null), 0);
  assert.equal(officialStepIndex(''), 0);
  assert.equal(officialStepIndex('not_started'), 0);
  assert.equal(officialStepIndex('visa_applied'), 4);
  assert.equal(officialStepIndex('started_work'), 7);
  assert.equal(officialStepIndex('rejected'), -1);
  assert.equal(officialStepIndex('something'), -1);
  assert.equal(isProcessStopped('rejected'), true);
  assert.equal(isProcessStopped('visa_applied'), false);
});

test('startedEmployees keeps only pipeline_stage started', () => {
  const rows = toPlacements([
    { ...base, match_id: 'a', pipeline_stage: 'started' },
    { ...base, match_id: 'b', pipeline_stage: 'travel_ready' },
    { ...base, match_id: 'c', pipeline_stage: null },
  ]);
  assert.deepEqual(startedEmployees(rows).map((r) => r.match_id), ['a']);
});

test('travelView: planned without flight is "not entered", never a raw planned', () => {
  assert.deepEqual(travelView(toPlacement(base)), { kind: 'not_entered' });
  assert.deepEqual(travelView(toPlacement({ ...base, travel_status: null })), { kind: 'not_entered' });
  const flight = toPlacement({ ...base, flight_date: '2026-11-28 14:30' });
  assert.equal(hasFlightInfo(flight), true);
  assert.deepEqual(travelView(flight), { kind: 'flight', status: null });
  assert.deepEqual(travelView(toPlacement({ ...base, travel_status: 'ticketed' })), { kind: 'flight', status: 'ticketed' });
  assert.deepEqual(
    travelView(toPlacement({ ...base, travel_status: 'completed', arrival_city: 'Belgrad' })),
    { kind: 'flight', status: 'completed' },
  );
});

test('isoDay and dayOf', () => {
  assert.equal(isoDay(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(dayOf('2026-12-20'), '2026-12-20');
  assert.equal(dayOf('2026-12-20T10:00:00+00:00'), '2026-12-20');
  assert.equal(dayOf('20.12.2026'), null);
  assert.equal(dayOf(null), null);
});

test('followupState: completed stays, planned in the past is overdue', () => {
  const today = '2026-11-15';
  assert.equal(followupState({ period_stage: '30', check_date: '2026-11-01', status: 'completed' }, today), 'completed');
  assert.equal(followupState({ period_stage: '30', check_date: '2026-11-14', status: 'planned' }, today), 'overdue');
  assert.equal(followupState({ period_stage: '30', check_date: '2026-11-15', status: 'planned' }, today), 'planned');
  assert.equal(followupState({ period_stage: '60', check_date: '2026-12-15', status: 'planned' }, today), 'planned');
  assert.equal(followupState({ period_stage: '90', check_date: null, status: 'planned' }, today), 'planned');
  assert.equal(followupState({ period_stage: '90', check_date: 'yakında', status: 'planned' }, today), 'planned');
});
