/**
 * Employer portal summary cards (top of /employer) and request deletion.
 * Pure functions only. Counts come from sumPipelineCounts
 * (lib/requestPipelineCounts.ts) unchanged: open requests skip completed and
 * cancelled requests (isClosedRequestStatus), as before.
 */
import type { PipelineTotals, RequestPipelineCounts } from './requestPipelineCounts';

/** Card order, left to right. */
export const EMPLOYER_OVERVIEW_CARDS = ['openRequests', 'candidates', 'interviews', 'selected'] as const;
export type EmployerOverviewCard = (typeof EMPLOYER_OVERVIEW_CARDS)[number];

/** Employer tabs the cards open (ids used by app/employer/page.tsx). */
export type EmployerCardTab = 'home' | 'candidates' | 'interviews' | 'selected';

/**
 * Where each card goes: the tab to open and the section heading to scroll to
 * and focus. Open requests live on the overview tab itself (request list).
 */
export const EMPLOYER_CARD_TARGETS: Record<EmployerOverviewCard, { tab: EmployerCardTab; anchor: string }> = {
  openRequests: { tab: 'home', anchor: 'employer-requests-heading' },
  candidates: { tab: 'candidates', anchor: 'employer-candidates-section' },
  interviews: { tab: 'interviews', anchor: 'employer-interviews-heading' },
  selected: { tab: 'selected', anchor: 'employer-selected-heading' },
};

/** The total each card shows; null when the counts are not known (shown as a dash). */
export function employerCardValue(card: EmployerOverviewCard, totals: PipelineTotals | null): number | null {
  if (!totals) return null;
  if (card === 'openRequests') return totals.open_requests;
  if (card === 'candidates') return totals.presented;
  if (card === 'interviews') return totals.interviews;
  return totals.selected;
}

/** "Open Requests: 3. Go to Requests" from the template "{label}: {value}. {section}". */
export function employerCardAriaLabel(template: string | undefined, label: string, value: string, section: string): string {
  return (template || '{label}: {value}. {section}')
    .replace('{label}', label)
    .replace('{value}', value)
    .replace('{section}', section);
}

/**
 * The delete button is offered only for a request that shows no activity:
 * counts known and every count zero (matched is staff-only; null for an
 * employer, so hidden matches are still refused by the database).
 */
export function canOfferRequestDelete(counts: RequestPipelineCounts | null | undefined): boolean {
  if (!counts) return false;
  const busy = counts.presented + counts.selected + counts.interviews + counts.offers + counts.offers_accepted
    + counts.in_process + counts.travel_ready + counts.started + (counts.matched ?? 0);
  return busy === 0;
}

export type RequestDeleteOutcome = 'deleted' | 'has_activity' | 'failed';

/**
 * Result of `delete().eq('id', …).select('id')` on job_requests. The
 * emp_requests_delete policy allows only requests with no match, interview or
 * offer; for any other request RLS deletes nothing and returns 0 rows (no
 * error), which means "this request has a process".
 */
export function requestDeleteOutcome(result: { error?: unknown; data?: unknown[] | null }): RequestDeleteOutcome {
  if (result.error) return 'failed';
  return Array.isArray(result.data) && result.data.length > 0 ? 'deleted' : 'has_activity';
}
