import type { CandidateLinkFailure } from './emailConfirmation';
import { classifyCandidateLinkError } from './emailConfirmation';

export type CandidateLinkOutcome =
  | { ok: true; id: string; via: 'existing' | 'rpc' }
  | { ok: false; failure: CandidateLinkFailure };

export type CandidateLinkDeps = {
  /** The signed-in user's own job_candidates id (RLS: own row only), or null. */
  findOwnCandidateId: () => Promise<string | null>;
  /** supabase.rpc('link_my_candidate'). */
  callLinkRpc: () => Promise<{ data: unknown; error: { message?: string } | null }>;
};

/**
 * Candidate portal sign-in: an account that is already linked to its
 * job_candidates row is used as it is, without calling link_my_candidate.
 * The RPC only runs for an account that has no row yet (first sign-in after
 * signup, or a staff-created row with the same e-mail): it links or creates
 * the row and reports phone / passport / e-mail conflicts.
 *
 * Before, every session event (INITIAL_SESSION and SIGNED_IN), every login
 * and every profile save called the RPC, and the live console showed
 * "POST /rpc/link_my_candidate 400" for an already linked candidate.
 */
export async function linkCandidateAccount(deps: CandidateLinkDeps): Promise<CandidateLinkOutcome> {
  let existing: string | null = null;
  try {
    existing = await deps.findOwnCandidateId();
  } catch {
    existing = null;
  }
  if (existing) return { ok: true, id: existing, via: 'existing' };

  const { data, error } = await deps.callLinkRpc();
  if (error || !data) return { ok: false, failure: classifyCandidateLinkError(error?.message) };
  return { ok: true, id: String(data), via: 'rpc' };
}
