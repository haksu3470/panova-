/** Status chips. Foreground/background pairs are checked in lib/contrast.test.ts. */

export function matchResultTone(result?: string | null): string {
  if (result === 'selected') return 'bg-status-ok-bg text-status-ok';
  if (result === 'not_suitable') return 'bg-status-bad-bg text-status-bad';
  if (result === 'interview') return 'bg-status-info-bg text-status-info';
  return 'bg-status-pending-bg text-status-pending';
}

export function offerStatusTone(status?: string | null): string {
  if (status === 'accepted') return 'bg-status-ok-bg text-status-ok';
  if (status === 'rejected') return 'bg-status-bad-bg text-status-bad';
  if (status === 'withdrawn') return 'bg-slate-200 text-foreground';
  return 'bg-status-pending-bg text-status-pending';
}

/** Solid control whose disabled state stays white-on-slate instead of fading. */
export const disabledSolid =
  'disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-disabled disabled:text-on-dark';

export const disabledOutline =
  'disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-slate-100 disabled:text-foreground';
