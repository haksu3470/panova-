/**
 * Candidate status (job_candidates.status) is derived from the official
 * process by the database. Upper management may still override it, with a
 * reason, through the RPC staff_set_candidate_status. The database checks
 * everything again; this module keeps the form and the messages in line.
 */

// Reason rules (5..1000 characters) are shared with request status: see
// checkStatusReason in ./requestStatusChange. Type-only import keeps this
// module free of runtime imports for the node test runner.
import type { ReasonCheck } from './requestStatusChange';

export const CANDIDATE_STATUS_KEYS = ['pending', 'reviewing', 'visa_processing', 'approved'] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUS_KEYS)[number];

export function normalizeCandidateStatus(status: string | null | undefined): CandidateStatus {
  const s = String(status ?? '').trim().toLowerCase();
  return (CANDIDATE_STATUS_KEYS as readonly string[]).includes(s) ? (s as CandidateStatus) : 'pending';
}

const STATUS_LABEL_KEYS: Record<CandidateStatus, 'pendingStatus' | 'reviewingStatus' | 'visaProcessingStatus' | 'approvedStatus'> = {
  pending: 'pendingStatus',
  reviewing: 'reviewingStatus',
  visa_processing: 'visaProcessingStatus',
  approved: 'approvedStatus',
};

const STATUS_ICONS: Record<CandidateStatus, string> = {
  pending: '🟡',
  reviewing: '🔵',
  visa_processing: '🟣',
  approved: '🟢',
};

type StatusLabels = Partial<Record<(typeof STATUS_LABEL_KEYS)[CandidateStatus], string>>;

export function candidateStatusLabel(t: StatusLabels, status: string | null | undefined): string {
  const key = normalizeCandidateStatus(status);
  return `${STATUS_ICONS[key]} ${t[STATUS_LABEL_KEYS[key]] || key}`;
}

export type CandidateStatusErrorKey =
  | 'candStatusErrUseRpc'
  | 'candStatusErrRole'
  | 'candStatusErrInvalid'
  | 'candStatusErrReasonRequired'
  | 'candStatusErrReasonTooLong'
  | 'candStatusErrVisaOffer'
  | 'candStatusErrNotFound'
  | 'candStatusErrGeneric';

// Exception names raised by staff_set_candidate_status and by the
// job_candidates status guard.
const CODES: [string, CandidateStatusErrorKey][] = [
  ['candidate_status_use_rpc', 'candStatusErrUseRpc'],
  ['staff_role_not_allowed', 'candStatusErrRole'],
  ['invalid_status', 'candStatusErrInvalid'],
  ['status_reason_required', 'candStatusErrReasonRequired'],
  ['status_reason_too_long', 'candStatusErrReasonTooLong'],
  ['visa_requires_accepted_offer', 'candStatusErrVisaOffer'],
  ['candidate_not_found', 'candStatusErrNotFound'],
];

/** Dictionary key for an error from staff_set_candidate_status. */
export function candidateStatusErrorKey(
  error: { message?: string | null } | string | null | undefined,
): CandidateStatusErrorKey {
  const text = typeof error === 'string' ? error : String(error?.message ?? '');
  for (const [code, key] of CODES) {
    if (text.includes(code)) return key;
  }
  return 'candStatusErrGeneric';
}

export function candidateReasonErrorKey(check: ReasonCheck): CandidateStatusErrorKey | null {
  if (check === 'required') return 'candStatusErrReasonRequired';
  if (check === 'too_long') return 'candStatusErrReasonTooLong';
  return null;
}
