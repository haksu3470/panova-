import assert from 'node:assert/strict';
import test from 'node:test';
import { translations, type Language } from './dictionary.ts';
import { demandStatusLabel, demandTransitionAllowed, normalizeDemandStatus, targetStartIsPast, taskIsOverdue, type DemandStatus } from './demandStatus.ts';

const empty = { presented: 0, interviews: 0, selected: 0 };
const presented = { presented: 2, interviews: 1, selected: 1 };

test('legacy status names fold into the lifecycle vocabulary', () => {
  assert.equal(normalizeDemandStatus('new'), 'new_request');
  assert.equal(normalizeDemandStatus('INTERVIEWING'), 'interviews');
  assert.equal(normalizeDemandStatus('nope'), null);
});

test('presenting, interviews, and selection require the matching records', () => {
  assert.equal(demandTransitionAllowed('searching_candidates', 'presenting_candidates', empty), false);
  assert.equal(demandTransitionAllowed('searching_candidates', 'presenting_candidates', presented), true);
  assert.equal(demandTransitionAllowed('presenting_candidates', 'interviews', { presented: 1, interviews: 0, selected: 0 }), false);
  assert.equal(demandTransitionAllowed('interviews', 'selection_completed', { presented: 1, interviews: 1, selected: 0 }), false);
  assert.equal(demandTransitionAllowed('new', 'cancelled', empty), true);
  assert.equal(demandTransitionAllowed('completed', 'searching_candidates', presented), false);
  assert.equal(demandTransitionAllowed('presenting_candidates', 'presenting_candidates', empty), true);
});

function statusLabels(lang: Language): Record<DemandStatus, string | undefined> {
  const t = translations[lang];
  return {
    new_request: t.stageNewRequest,
    reviewing: t.stageReviewing,
    searching_candidates: t.stageSearchingCandidates,
    presenting_candidates: t.stagePresentingCandidates,
    interviews: t.stageInterviews,
    selection_completed: t.stageSelectionCompleted,
    official_process: t.stageOfficialProcess,
    travel_planning: t.stageTravelPlanning,
    completed: t.stageCompleted,
    cancelled: t.stageCancelled,
  };
}

test('status codes on employer cards use the active locale', () => {
  assert.equal(demandStatusLabel('NEW_REQUEST', statusLabels('tr')), 'Yeni Talep');
  assert.equal(demandStatusLabel('PRESENTING_CANDIDATES', statusLabels('en')), 'Presenting Candidates');
  assert.equal(demandStatusLabel('presenting_candidates', statusLabels('mk')), translations.mk.stagePresentingCandidates);
  assert.equal(demandStatusLabel('INTERVIEWING', statusLabels('sq')), translations.sq.stageInterviews);
  assert.equal(demandStatusLabel('new', statusLabels('ar')), translations.ar.stageNewRequest);
  assert.equal(demandStatusLabel('not_a_status', statusLabels('en')), 'not_a_status');
  assert.equal(demandStatusLabel('', statusLabels('tr')), '—');
  assert.match(demandStatusLabel('SEARCHING_CANDIDATES', statusLabels('mk')), /[А-Яа-я]/);
  assert.match(demandStatusLabel('OFFICIAL_PROCESS', statusLabels('ar')) || '', /[\u0600-\u06FF]/);
});

test('a past target date and a pending task past its due date are late', () => {
  const today = new Date('2026-11-10T12:00:00.000Z');
  assert.equal(targetStartIsPast('2026-10-01', today), true);
  assert.equal(targetStartIsPast('2026-11-15', today), false);
  assert.equal(taskIsOverdue('2026-10-31', 'pending', today), true);
  assert.equal(taskIsOverdue('2026-10-31', 'completed', today), false);
});
