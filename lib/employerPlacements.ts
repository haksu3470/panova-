// Rows of public.employer_placements()
// (supabase/migrations/20261115120000_employer_placements.sql): the employer's
// selected candidates, one row per selected match, with only the fields the
// employer may see. The three employer tabs (İşlem Durumu, Seyahat
// Bilgilerim, Aktif Çalışanlar) read this one list. Pure helpers only; no
// personal data from any other source.

export const OFFICIAL_STEPS = [
  'not_started',
  'documents_collecting',
  'work_permit_applied',
  'work_permit_approved',
  'visa_applied',
  'visa_approved',
  'ready_to_travel',
  'started_work',
] as const;

export type OfficialStep = (typeof OFFICIAL_STEPS)[number];
export type PipelineStage = 'in_process' | 'travel_ready' | 'started';
export type FollowupState = 'planned' | 'completed' | 'overdue';

export type PlacementFollowup = {
  period_stage: string;
  check_date: string | null;
  status: 'planned' | 'completed';
};

export type EmployerPlacement = {
  request_id: string;
  request_position_title: string | null;
  match_id: string;
  candidate_id: string;
  full_name: string | null;
  profession: string | null;
  nationality: string | null;
  official_process_status: string | null;
  pipeline_stage: PipelineStage | null;
  travel_status: string | null;
  flight_date: string | null;
  flight_number: string | null;
  departure_city: string | null;
  arrival_city: string | null;
  start_date: string | null;
  followups: PlacementFollowup[];
};

export type PlacementGroup = {
  request_id: string;
  title: string | null;
  rows: EmployerPlacement[];
};

const STAGES: readonly PipelineStage[] = ['in_process', 'travel_ready', 'started'];

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

function toFollowup(value: unknown): PlacementFollowup | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const period = text(row.period_stage);
  if (!period) return null;
  return {
    period_stage: period,
    check_date: text(row.check_date),
    status: row.status === 'completed' ? 'completed' : 'planned',
  };
}

/** One RPC row to a typed placement. Fields the RPC does not return are never read. */
export function toPlacement(value: unknown): EmployerPlacement {
  const row = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const stage = text(row.pipeline_stage);
  const followups = Array.isArray(row.followups)
    ? row.followups.map(toFollowup).filter((f): f is PlacementFollowup => f !== null)
    : [];
  return {
    request_id: text(row.request_id) ?? '',
    request_position_title: text(row.request_position_title),
    match_id: text(row.match_id) ?? '',
    candidate_id: text(row.candidate_id) ?? '',
    full_name: text(row.full_name),
    profession: text(row.profession),
    nationality: text(row.nationality),
    official_process_status: text(row.official_process_status),
    pipeline_stage: STAGES.includes(stage as PipelineStage) ? (stage as PipelineStage) : null,
    travel_status: text(row.travel_status),
    flight_date: text(row.flight_date),
    flight_number: text(row.flight_number),
    departure_city: text(row.departure_city),
    arrival_city: text(row.arrival_city),
    start_date: text(row.start_date),
    followups,
  };
}

export function toPlacements(rows: unknown): EmployerPlacement[] {
  if (!Array.isArray(rows)) return [];
  return rows.map(toPlacement).filter((r) => r.match_id && r.candidate_id);
}

/** Groups by request, in the order the requests first appear. */
export function groupByRequest(rows: EmployerPlacement[]): PlacementGroup[] {
  const groups: PlacementGroup[] = [];
  const byId = new Map<string, PlacementGroup>();
  for (const row of rows) {
    let group = byId.get(row.request_id);
    if (!group) {
      group = { request_id: row.request_id, title: row.request_position_title, rows: [] };
      byId.set(row.request_id, group);
      groups.push(group);
    }
    group.rows.push(row);
  }
  return groups;
}

/**
 * Position of the official process status on the 8-step bar: 0 for an
 * empty status (not started yet), -1 when the process was stopped
 * ('rejected') or the value is unknown.
 */
export function officialStepIndex(status: string | null | undefined): number {
  const s = (status ?? '').trim();
  if (s === '') return 0;
  return (OFFICIAL_STEPS as readonly string[]).indexOf(s);
}

export function isProcessStopped(status: string | null | undefined): boolean {
  return (status ?? '').trim() === 'rejected';
}

/**
 * Read-only view of job_candidates.official_process_status on the 8-step
 * list: the step and its number (1..8), 'stopped' for 'rejected', or the raw
 * value when it is not one of the steps. Empty means step 1 (not started).
 */
export type OfficialProcessView =
  | { kind: 'step'; step: OfficialStep; number: number; total: number }
  | { kind: 'stopped' }
  | { kind: 'unknown'; raw: string };

export function officialProcessView(status: string | null | undefined): OfficialProcessView {
  if (isProcessStopped(status)) return { kind: 'stopped' };
  const idx = officialStepIndex(status);
  if (idx < 0) return { kind: 'unknown', raw: (status ?? '').trim() };
  return { kind: 'step', step: OFFICIAL_STEPS[idx], number: idx + 1, total: OFFICIAL_STEPS.length };
}

/** "Seyahate hazır · 7/8"; stopped -> the stopped label; unknown -> the stored value. */
export function officialProcessText(
  status: string | null | undefined,
  steps: Record<string, string>,
  stoppedLabel: string,
): string {
  const view = officialProcessView(status);
  if (view.kind === 'stopped') return stoppedLabel;
  if (view.kind === 'unknown') return view.raw;
  return `${steps[view.step] || view.step} · ${view.number}/${view.total}`;
}

/** start_date of the latest accepted offer, or null. */
export function acceptedOfferStartDate(offers: readonly Record<string, unknown>[] | null | undefined): string | null {
  const accepted = (offers ?? [])
    .filter((o) => o && o.status === 'accepted' && text(o.start_date))
    .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
  return accepted.length ? text(accepted[0].start_date) : null;
}

export function startedEmployees(rows: EmployerPlacement[]): EmployerPlacement[] {
  return rows.filter((r) => r.pipeline_stage === 'started');
}

/** The travel fields travelView reads (an employer placement or the candidate's own row). */
export type TravelFields = Pick<EmployerPlacement, 'travel_status' | 'flight_date' | 'flight_number' | 'departure_city' | 'arrival_city'>;

/** Only the travel fields of a row; every other column is dropped. */
export function toTravelFields(value: unknown): TravelFields {
  const row = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    travel_status: text(row.travel_status),
    flight_date: text(row.flight_date),
    flight_number: text(row.flight_number),
    departure_city: text(row.departure_city),
    arrival_city: text(row.arrival_city),
  };
}

export function hasFlightInfo(row: TravelFields): boolean {
  return Boolean(row.flight_date || row.flight_number || row.departure_city || row.arrival_city);
}

export type TravelView =
  | { kind: 'not_entered' }
  | { kind: 'flight'; status: 'ticketed' | 'completed' | null };

/**
 * No flight fields and travel 'planned' (the column default) or empty:
 * nothing was entered yet, so 'planned' is never shown as a status.
 */
export function travelView(row: TravelFields): TravelView {
  const status = (row.travel_status ?? '').trim();
  if (!hasFlightInfo(row) && (status === '' || status === 'planned')) return { kind: 'not_entered' };
  return { kind: 'flight', status: status === 'ticketed' || status === 'completed' ? status : null };
}

const ISO_DAY = /^(\d{4}-\d{2}-\d{2})/;

/** Local calendar day as YYYY-MM-DD. */
export function isoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The YYYY-MM-DD part of a stored date, or null when it is not a date. */
export function dayOf(value: string | null | undefined): string | null {
  const m = ISO_DAY.exec((value ?? '').trim());
  return m ? m[1] : null;
}

/** Planned and its check date is before today: overdue. */
export function followupState(item: PlacementFollowup, today: string): FollowupState {
  if (item.status === 'completed') return 'completed';
  const day = dayOf(item.check_date);
  return day !== null && day < today ? 'overdue' : 'planned';
}
