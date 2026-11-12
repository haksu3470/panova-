import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COUNT_UNKNOWN,
  emptyPipelineCounts,
  formatCount,
  indexPipelineCounts,
  pipelineCountsFor,
  sumPipelineCounts,
  toPipelineCounts,
} from './requestPipelineCounts.ts';

test('maps a view row and keeps matched null for an employer', () => {
  const row = toPipelineCounts({
    request_id: 'r1', headcount: 5, matched: null, presented: '4', selected: 2,
    interviews: 1, offers: 0, offers_accepted: 0, in_process: 1, travel_ready: 0, started: 0,
  });
  assert.equal(row.request_id, 'r1');
  assert.equal(row.headcount, 5);
  assert.equal(row.matched, null);
  assert.equal(row.presented, 4);
  assert.equal(row.selected, 2);
  assert.equal(row.in_process, 1);
});

test('staff rows keep matched; bad values become zero', () => {
  const row = toPipelineCounts({ request_id: 'r1', matched: 5, presented: -3, selected: 'x', started: null });
  assert.equal(row.matched, 5);
  assert.equal(row.presented, 0);
  assert.equal(row.selected, 0);
  assert.equal(row.started, 0);
});

test('counts are per request, and a missing request gives zeros', () => {
  const index = indexPipelineCounts([
    { request_id: 'r1', presented: 4, selected: 2 },
    { request_id: 'r2', presented: 1, selected: 0 },
    { presented: 9 },
    null,
  ]);
  assert.deepEqual(Object.keys(index).sort(), ['r1', 'r2']);
  assert.equal(pipelineCountsFor(index, 'r1')?.presented, 4);
  assert.equal(pipelineCountsFor(index, 'r2')?.presented, 1);
  assert.equal(pipelineCountsFor(index, 'r1', 7)?.headcount, 7);
  assert.deepEqual(indexPipelineCounts(null), {});
});

test('summary totals add up the same view rows as the request cards', () => {
  const index = indexPipelineCounts([
    { request_id: 'r1', presented: 4, interviews: 1, selected: 2 },
    { request_id: 'r2', presented: 1, interviews: 0, selected: 1 },
    { request_id: 'r3', presented: 2, interviews: 2, selected: 0 },
  ]);
  const totals = sumPipelineCounts(index, [
    { id: 'r1', status: 'presenting_candidates' },
    { id: 'r2', status: 'completed' },
    { id: 'r3', status: 'cancelled' },
    { id: 'r1', status: 'presenting_candidates' }, // listed twice: counted once
    { id: 'r9', status: 'new_request' }, // no view row: left out
  ]);
  assert.deepEqual(totals, { open_requests: 1, presented: 7, interviews: 3, selected: 3 });
  assert.deepEqual(sumPipelineCounts(index, []), { open_requests: 0, presented: 0, interviews: 0, selected: 0 });
  // View failed or still loading: every summary card shows a dash.
  assert.equal(sumPipelineCounts(null, [{ id: 'r1' }]), null);
  assert.equal(formatCount(sumPipelineCounts(null, [{ id: 'r1' }])?.selected), COUNT_UNKNOWN);
});

test('unknown counts are null and show a dash, never a made-up zero', () => {
  const index = indexPipelineCounts([{ request_id: 'r1', presented: 0 }]);
  // View failed or still loading.
  assert.equal(pipelineCountsFor(null, 'r1'), null);
  // View answered but has no row for this request.
  assert.equal(pipelineCountsFor(index, 'r3', 3), null);
  // A real zero stays a zero.
  assert.equal(formatCount(pipelineCountsFor(index, 'r1')?.presented), '0');
  assert.equal(formatCount(pipelineCountsFor(null, 'r1')?.presented), COUNT_UNKNOWN);
  assert.equal(formatCount(null), '—');
  assert.equal(formatCount(Number.NaN), '—');
  assert.equal(formatCount(emptyPipelineCounts('r9').selected), '0');
});
