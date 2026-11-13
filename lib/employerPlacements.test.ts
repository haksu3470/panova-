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
} from './employerPlacements.ts';

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
