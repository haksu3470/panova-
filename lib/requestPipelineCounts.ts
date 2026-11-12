// Per-request card counts from the public.request_pipeline_counts view
// (supabase/migrations/20261113120000_request_pipeline_counts.sql).
// The employer and management screens both read this one view, so a request
// shows the same numbers everywhere. `matched` includes matches that were never
// presented; the view returns it to staff only (null for an employer).

export type RequestPipelineCounts = {
  request_id: string;
  headcount: number;
  matched: number | null;
  presented: number;
  selected: number;
  interviews: number;
  offers: number;
  offers_accepted: number;
  in_process: number;
  travel_ready: number;
  started: number;
};

const COUNT_KEYS = [
  'presented',
  'selected',
  'interviews',
  'offers',
  'offers_accepted',
  'in_process',
  'travel_ready',
  'started',
] as const;

function count(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

export function emptyPipelineCounts(requestId: string, headcount?: unknown): RequestPipelineCounts {
  return {
    request_id: requestId,
    headcount: count(headcount),
    matched: null,
    presented: 0,
    selected: 0,
    interviews: 0,
    offers: 0,
    offers_accepted: 0,
    in_process: 0,
    travel_ready: 0,
    started: 0,
  };
}

export function toPipelineCounts(row: Record<string, unknown>): RequestPipelineCounts {
  const out = emptyPipelineCounts(String(row.request_id ?? ''), row.headcount);
  for (const key of COUNT_KEYS) out[key] = count(row[key]);
  out.matched = row.matched === null || row.matched === undefined ? null : count(row.matched);
  return out;
}

/** Rows keyed by request id. Rows without a request id are dropped. */
export function indexPipelineCounts(rows: unknown[] | null | undefined): Record<string, RequestPipelineCounts> {
  const out: Record<string, RequestPipelineCounts> = {};
  for (const raw of rows ?? []) {
    const row = toPipelineCounts((raw ?? {}) as Record<string, unknown>);
    if (row.request_id) out[row.request_id] = row;
  }
  return out;
}

/** Counts for one request; zeros (not an error) when the view has no row yet. */
export function pipelineCountsFor(
  index: Record<string, RequestPipelineCounts>,
  requestId: string | null | undefined,
  headcount?: unknown,
): RequestPipelineCounts {
  const id = String(requestId ?? '');
  const row = index[id];
  if (!row) return emptyPipelineCounts(id, headcount);
  // The request row is the source for headcount; the view copies it.
  return headcount === undefined ? row : { ...row, headcount: count(headcount) };
}
