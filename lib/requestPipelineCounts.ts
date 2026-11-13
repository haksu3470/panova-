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

/**
 * Index state on screen: null while loading or after the view failed (the
 * cards then show COUNT_UNKNOWN), otherwise the rows keyed by request id.
 */
export type PipelineCountsIndex = Record<string, RequestPipelineCounts> | null;

/**
 * Counts for one request, or null when they are not known: the view failed,
 * is still loading, or returned no row for this request. Never zeros made up
 * on the client.
 */
export function pipelineCountsFor(
  index: PipelineCountsIndex,
  requestId: string | null | undefined,
  headcount?: unknown,
): RequestPipelineCounts | null {
  if (!index) return null;
  const row = index[String(requestId ?? '')];
  if (!row) return null;
  // The request row is the source for headcount; the view copies it.
  return headcount === undefined ? row : { ...row, headcount: count(headcount) };
}

export type PipelineTotals = {
  /** Requests among those given that the view returned and that are still open. */
  open_requests: number;
  presented: number;
  interviews: number;
  selected: number;
};

const CLOSED_STATUSES = new Set(['completed', 'cancelled']);

/** Completed and cancelled requests are closed; every other status is open. */
export function isClosedRequestStatus(status: string | null | undefined): boolean {
  return CLOSED_STATUSES.has(String(status ?? ''));
}

/** Open and total request counts for the overview card (same rule as the cards above). */
export function countOpenRequests(requests: ReadonlyArray<{ status?: string | null }>): { open: number; total: number } {
  return { open: requests.filter((r) => !isClosedRequestStatus(r.status)).length, total: requests.length };
}

/**
 * Summary cards: totals over the given requests, from the same view rows as
 * the request cards. Null when the view failed or is still loading, so the
 * cards show a dash. Requests the view returned no row for are left out.
 */
export function sumPipelineCounts(
  index: PipelineCountsIndex,
  requests: ReadonlyArray<{ id?: string | null; status?: string | null }>,
): PipelineTotals | null {
  if (!index) return null;
  const totals: PipelineTotals = { open_requests: 0, presented: 0, interviews: 0, selected: 0 };
  const seen = new Set<string>();
  for (const request of requests) {
    const id = String(request.id ?? '');
    const row = index[id];
    if (!row || seen.has(id)) continue;
    seen.add(id);
    if (!isClosedRequestStatus(request.status)) totals.open_requests += 1;
    totals.presented += row.presented;
    totals.interviews += row.interviews;
    totals.selected += row.selected;
  }
  return totals;
}

/** Shown instead of a number when the count is not known. */
export const COUNT_UNKNOWN = '—';

export function formatCount(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : COUNT_UNKNOWN;
}
