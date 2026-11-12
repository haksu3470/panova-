/**
 * Manual request status change (upper management only), through the RPC
 * staff_set_request_status (supabase/migrations/20261114130000). The
 * database checks everything again; this module keeps the form and the
 * error messages in line with it.
 */

export const STATUS_REASON_MIN = 5;
export const STATUS_REASON_MAX = 1000;

/** Characters as the database counts them (char_length = code points). */
export function reasonLength(reason: string | null | undefined): number {
  return Array.from(String(reason ?? '').trim()).length;
}

export type ReasonCheck = 'ok' | 'required' | 'too_long';

export function checkStatusReason(reason: string | null | undefined): ReasonCheck {
  const n = reasonLength(reason);
  if (n < STATUS_REASON_MIN) return 'required';
  if (n > STATUS_REASON_MAX) return 'too_long';
  return 'ok';
}

export type StatusErrorKey =
  | 'statusErrUseRpc'
  | 'statusErrRole'
  | 'statusErrReasonRequired'
  | 'statusErrReasonTooLong'
  | 'statusErrTransition'
  | 'statusErrInvalid'
  | 'statusErrNotFound'
  | 'statusErrGeneric';

// The exception names raised by the RPC and by guard_demand_status.
const CODES: [string, StatusErrorKey][] = [
  ['demand_status_use_rpc', 'statusErrUseRpc'],
  ['staff_role_not_allowed', 'statusErrRole'],
  ['status_reason_required', 'statusErrReasonRequired'],
  ['status_reason_too_long', 'statusErrReasonTooLong'],
  ['demand_status_transition', 'statusErrTransition'],
  ['invalid_status', 'statusErrInvalid'],
  ['request_not_found', 'statusErrNotFound'],
];

/** Dictionary key for an error from staff_set_request_status. */
export function statusErrorKey(error: { message?: string | null } | string | null | undefined): StatusErrorKey {
  const text = typeof error === 'string' ? error : String(error?.message ?? '');
  for (const [code, key] of CODES) {
    if (text.includes(code)) return key;
  }
  return 'statusErrGeneric';
}

export function reasonCheckErrorKey(check: ReasonCheck): StatusErrorKey | null {
  if (check === 'required') return 'statusErrReasonRequired';
  if (check === 'too_long') return 'statusErrReasonTooLong';
  return null;
}
