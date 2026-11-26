import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OFFER_UNDO_BLOCKING_STEPS, OFFER_UNDO_HOURS, candidateCanUndoOffer, offerUndoLabels } from './offerUndo.ts';

const now = Date.parse('2026-11-26T12:00:00Z');
const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

test('candidate may take back an answer within 48 hours, before the work permit application', () => {
  assert.equal(candidateCanUndoOffer({ status: 'accepted', responded_at: hoursAgo(1) }, 'documents_collecting', now), true);
  assert.equal(candidateCanUndoOffer({ status: 'rejected', responded_at: hoursAgo(47) }, null, now), true);
  assert.equal(candidateCanUndoOffer({ status: 'accepted', responded_at: hoursAgo(49) }, null, now), false);
  assert.equal(candidateCanUndoOffer({ status: 'accepted', responded_at: hoursAgo(1) }, 'work_permit_applied', now), false);
  assert.equal(candidateCanUndoOffer({ status: 'pending', responded_at: null }, null, now), false);
  assert.equal(candidateCanUndoOffer({ status: 'accepted', responded_at: null }, null, now), false);
});

test('the database function uses the same window and steps', () => {
  const sql = readFileSync(join(import.meta.dirname, '..', 'supabase/migrations/20261126160000_offer_response_undo.sql'), 'utf8');
  assert.ok(sql.includes(`interval '${OFFER_UNDO_HOURS} hours'`));
  for (const step of OFFER_UNDO_BLOCKING_STEPS) assert.ok(sql.includes(`'${step}'`), step);
});

test('labels in five languages', () => {
  for (const [lang, l] of Object.entries(offerUndoLabels)) {
    for (const v of Object.values(l)) assert.ok(v, lang);
  }
});
