import assert from 'node:assert/strict';
import test from 'node:test';
import {
  emptyPipelineCounts,
  indexPipelineCounts,
  pipelineCountsFor,
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
  assert.equal(pipelineCountsFor(index, 'r1').presented, 4);
  assert.equal(pipelineCountsFor(index, 'r2').presented, 1);
  assert.deepEqual(pipelineCountsFor(index, 'r3', 3), emptyPipelineCounts('r3', 3));
  assert.equal(pipelineCountsFor(index, 'r1', 7).headcount, 7);
  assert.deepEqual(indexPipelineCounts(null), {});
});
