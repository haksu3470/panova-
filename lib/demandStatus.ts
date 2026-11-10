/**
 * Demand lifecycle. The database trigger is the authority; this module
 * keeps the staff dropdown on the same graph.
 * Live rows have used both `new` and `interviewing`. Those aliases fold
 * into `new_request` and `interviews`.
 */

export const DEMAND_STATUSES = [
  'new_request',
  'reviewing',
  'searching_candidates',
  'presenting_candidates',
  'interviews',
  'selection_completed',
  'official_process',
  'travel_planning',
  'completed',
  'cancelled',
] as const;

export type DemandStatus = (typeof DEMAND_STATUSES)[number];

const NEXT: Record<DemandStatus, readonly DemandStatus[]> = {
  new_request: ['reviewing', 'searching_candidates', 'cancelled'],
  reviewing: ['new_request', 'searching_candidates', 'cancelled'],
  searching_candidates: ['reviewing', 'presenting_candidates', 'cancelled'],
  presenting_candidates: ['searching_candidates', 'interviews', 'selection_completed', 'cancelled'],
  interviews: ['presenting_candidates', 'selection_completed', 'cancelled'],
  selection_completed: ['interviews', 'official_process', 'cancelled'],
  official_process: ['selection_completed', 'travel_planning', 'cancelled'],
  travel_planning: ['official_process', 'completed', 'cancelled'],
  completed: ['travel_planning'],
  cancelled: ['new_request'],
};

export type DemandFacts = {
  presented: number;
  interviews: number;
  selected: number;
};

export function normalizeDemandStatus(value: string | null | undefined): DemandStatus | null {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === 'new') return 'new_request';
  if (raw === 'interviewing') return 'interviews';
  return (DEMAND_STATUSES as readonly string[]).includes(raw) ? raw as DemandStatus : null;
}

export function demandTransitionAllowed(from: string | null | undefined, to: string, facts: DemandFacts): boolean {
  const next = normalizeDemandStatus(to);
  const current = normalizeDemandStatus(from);
  if (!next) return false;
  if (current === next) return true;
  if (!current) return next === 'new_request' || next === 'reviewing' || next === 'searching_candidates' || next === 'cancelled';
  if (!NEXT[current].includes(next)) return false;
  if (next === 'presenting_candidates' && facts.presented < 1) return false;
  if (next === 'interviews' && facts.interviews < 1) return false;
  if (next === 'selection_completed' && facts.selected < 1) return false;
  return true;
}

export function allowedDemandStatuses(from: string | null | undefined, facts: DemandFacts): DemandStatus[] {
  return DEMAND_STATUSES.filter((status) => demandTransitionAllowed(from, status, facts));
}

export function targetStartIsPast(value: string | null | undefined, today = new Date()): boolean {
  if (!value) return false;
  const day = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const iso = today.toISOString().slice(0, 10);
  return day < iso;
}

export function taskIsOverdue(due: string | null | undefined, status: string | null | undefined, today = new Date()): boolean {
  if (String(status ?? '').toLowerCase() === 'completed') return false;
  return targetStartIsPast(due, today);
}

/** Locale label for a stored status code, including NEW_REQUEST and PRESENTING_CANDIDATES. */
export function demandStatusLabel(
  status: string | null | undefined,
  labels: Partial<Record<DemandStatus, string | undefined>>,
): string {
  const code = normalizeDemandStatus(status);
  const raw = String(status ?? '').trim();
  if (!code) return raw || '—';
  const label = labels[code];
  return typeof label === 'string' && label.trim() ? label : raw || '—';
}
