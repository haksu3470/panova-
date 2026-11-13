// Demo data tools (management panel, upper management only).
// RPCs: staff_demo_data_summary / staff_seed_demo_data / staff_delete_demo_data
// (supabase/migrations/20261113200000_demo_data_tools.sql). Each returns
// {"<table>": <count>}. No Supabase import here, so this file stays testable.

/** Cards on the "Demo data" panel, in display order. */
export const DEMO_SUMMARY_ROWS = [
  { table: 'employers', label: 'demoDataEmployers' },
  { table: 'job_requests', label: 'demoDataRequests' },
  { table: 'job_candidates', label: 'demoDataCandidates' },
  { table: 'request_matches', label: 'demoDataMatches' },
  { table: 'interviews', label: 'demoDataInterviews' },
  { table: 'job_offers', label: 'demoDataOffers' },
  { table: 'candidate_documents', label: 'demoDataDocuments' },
  { table: 'tasks', label: 'demoDataTasks' },
  { table: 'candidate_support_tickets', label: 'demoDataSupport' },
] as const;

export type DemoLabelKey = (typeof DEMO_SUMMARY_ROWS)[number]['label'];

/** Tables staff_delete_demo_data() deletes from (its order). */
export const DEMO_DELETABLE_TABLES = [
  'job_offers', 'interviews', 'request_matches', 'candidate_documents', 'candidate_notifications',
  'candidate_support_tickets', 'placement_followups', 'tasks', 'job_requests', 'job_candidates', 'employers',
] as const;

/** Counted by the summary RPC but never shown, deleted or changed. */
export const DEMO_UNTOUCHED_TABLES = ['audit_logs', 'staff_members', 'portal_users', 'applicants'] as const;

export type DemoCounts = Record<string, number>;

/** RPC result -> {table: whole number >= 0}. Anything else is dropped. */
export function demoCounts(raw: unknown): DemoCounts {
  const out: DemoCounts = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const n = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
    if (Number.isFinite(n) && n >= 0) out[key] = Math.trunc(n);
  }
  return out;
}

/** Sum over the given tables (default: every table in the result). */
export function demoTotal(counts: DemoCounts, tables?: readonly string[]): number {
  const keys = tables ?? Object.keys(counts);
  return keys.reduce((sum, key) => sum + (counts[key] ?? 0), 0);
}

/** How many rows "delete all" removes at most (linked demo accounts are kept). */
export function demoDeletableTotal(counts: DemoCounts): number {
  return demoTotal(counts, DEMO_DELETABLE_TABLES);
}

export type DemoSeedOutcome = { kind: 'created'; total: number } | { kind: 'already_exists' };

/** Seed result: all zero means the fixed demo rows are already there. */
export function demoSeedOutcome(raw: unknown): DemoSeedOutcome {
  const total = demoTotal(demoCounts(raw));
  return total > 0 ? { kind: 'created', total } : { kind: 'already_exists' };
}

/** staff_role_not_allowed (42501) from any of the three RPCs. */
export function isDemoRoleError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return typeof error === 'string' && error.includes('staff_role_not_allowed');
  const e = error as { code?: unknown; message?: unknown };
  return e.code === '42501' || (typeof e.message === 'string' && e.message.includes('staff_role_not_allowed'));
}

/** Readable text for an error of any shape (never empty). */
export function demoErrorText(error: unknown): string {
  if (typeof error === 'string' && error.trim()) return error.trim();
  if (error && typeof error === 'object') {
    const e = error as { message?: unknown; error?: unknown; code?: unknown };
    for (const v of [e.message, e.error, e.code]) if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return 'unknown error';
}

// --- candidate-files storage --------------------------------------------------
// Files live at candidate-files/<candidate_id>/<slot>/<file>. Storage list()
// is one level deep; a folder comes back with id null.

export const CANDIDATE_FILES_BUCKET = 'candidate-files';
const PAGE = 1000;
const REMOVE_CHUNK = 100;
const MAX_DEPTH = 4;

type StorageEntry = { name: string; id: string | null };
type StorageResult<T> = { data: T | null; error: unknown };

/** The part of supabase.storage.from(bucket) used here. */
export interface DemoFileBucket {
  list(path: string, options: { limit: number; offset: number }): PromiseLike<StorageResult<StorageEntry[]>>;
  remove(paths: string[]): PromiseLike<StorageResult<unknown>>;
}

/** Every file path under prefix (recursive). Throws on a storage error. */
export async function listFolderFiles(bucket: DemoFileBucket, prefix: string, depth = 0): Promise<string[]> {
  const files: string[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await bucket.list(prefix, { limit: PAGE, offset });
    if (error) throw error;
    const entries = data ?? [];
    for (const entry of entries) {
      if (!entry?.name) continue;
      const path = `${prefix}/${entry.name}`;
      if (entry.id === null) {
        if (depth < MAX_DEPTH) files.push(...(await listFolderFiles(bucket, path, depth + 1)));
      } else {
        files.push(path);
      }
    }
    if (entries.length < PAGE) break;
  }
  return files;
}

/**
 * Deletes candidate-files/<id>/... for each candidate. Stops at the first
 * error and throws it (the caller must then not call the delete RPC).
 * Returns the number of files removed.
 */
export async function removeCandidateFolders(bucket: DemoFileBucket, candidateIds: readonly string[]): Promise<number> {
  let removed = 0;
  for (const id of candidateIds) {
    if (!id) continue;
    const paths = await listFolderFiles(bucket, id);
    for (let i = 0; i < paths.length; i += REMOVE_CHUNK) {
      const chunk = paths.slice(i, i + REMOVE_CHUNK);
      const { error } = await bucket.remove(chunk);
      if (error) throw error;
      removed += chunk.length;
    }
  }
  return removed;
}
