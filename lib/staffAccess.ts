import { ROLE_CATALOG } from './guides-model';

/** Tabs that exist on /portal. File routes are guarded separately. */
export const PORTAL_TABS = [
  'overview',
  'candidates',
  'requests',
  'staff',
  'tasks',
  'audit',
  'employers',
  'support',
] as const;

export type StaffTab = (typeof PORTAL_TABS)[number];
export type StaffFileRoute = 'dossier' | 'requestFile' | 'employerFile';

const TAB_SET = new Set<string>(PORTAL_TABS);

/**
 * Tabs follow ROLE_CATALOG.
 * A file screen (dossier, request, employer) also shows the list that opens it.
 * Roles outside the catalog (finance, limited) get overview and tasks only.
 */
export function tabsForStaffRole(role: string | null | undefined): StaffTab[] {
  const id = (role || '').trim().toLowerCase();
  const roleDef = ROLE_CATALOG.find((item) => item.id === id);
  if (!roleDef) return ['overview', 'tasks'];
  const screens = new Set(roleDef.screens.map((screen) => screen.id));
  const allowed = new Set<StaffTab>();
  for (const screen of roleDef.screens) {
    if (TAB_SET.has(screen.id)) allowed.add(screen.id as StaffTab);
  }
  if (screens.has('dossier')) allowed.add('candidates');
  if (screens.has('request')) allowed.add('requests');
  if (screens.has('employer')) allowed.add('employers');
  return PORTAL_TABS.filter((tab) => allowed.has(tab));
}

/** Overview summary cards and the tab each one opens. */
export const OVERVIEW_CARD_TABS = {
  candidates: 'candidates',
  requests: 'requests',
  employers: 'employers',
  staff: 'staff',
  support: 'support',
} as const satisfies Record<string, StaffTab>;

export type OverviewCard = keyof typeof OVERVIEW_CARD_TABS;

/**
 * The tab an overview card opens, or null when the user cannot see that tab
 * (the card then stays a plain, non-clickable summary). `canSeeTab` is the
 * page's own tab check, so no new access is granted here.
 */
export function overviewCardTarget(card: OverviewCard, canSeeTab: (tab: StaffTab) => boolean): StaffTab | null {
  const tab = OVERVIEW_CARD_TABS[card];
  return canSeeTab(tab) ? tab : null;
}

export function canOpenStaffFile(role: string | null | undefined, route: StaffFileRoute): boolean {
  const id = (role || '').trim().toLowerCase();
  if (id === 'upper_management') return true;
  const tabs = tabsForStaffRole(id);
  if (route === 'dossier') return tabs.includes('candidates');
  if (route === 'requestFile') return tabs.includes('requests');
  return tabs.includes('employers');
}

export function isUpperManagementRole(role: string | null | undefined): boolean {
  return (role || '').trim().toLowerCase() === 'upper_management';
}

/**
 * Roles that may enter a decision on the employer's behalf. The database
 * (staff_decide_match) enforces the same list and the target-country scope;
 * this only hides the button from everyone else.
 */
export const STAFF_DECISION_ROLES = ['upper_management', 'target_country'] as const;

export function canDecideForEmployer(role: string | null | undefined): boolean {
  return (STAFF_DECISION_ROLES as readonly string[]).includes((role || '').trim().toLowerCase());
}

/**
 * Roles that may add or change an interview's meeting link. The database
 * (trigger interviews_guard_meeting_url) enforces the same list; this only
 * hides the field from everyone else.
 */
export const MEETING_URL_ROLES = ['upper_management', 'target_country'] as const;

export function canEditMeetingUrl(role: string | null | undefined): boolean {
  return (MEETING_URL_ROLES as readonly string[]).includes((role || '').trim().toLowerCase());
}

/**
 * Roles that may create or change interviews and job offers. The database
 * (staff_insert_* / staff_update_* on interviews and job_offers, role from
 * current_staff()) enforces the same list; this only hides the
 * "Interview and offer" button from field officers, finance and limited.
 */
export const INTERVIEW_OFFER_ROLES = ['upper_management', 'source_country', 'target_country'] as const;

export function canWriteInterviewOffer(role: string | null | undefined): boolean {
  return (INTERVIEW_OFFER_ROLES as readonly string[]).includes((role || '').trim().toLowerCase());
}

/**
 * Roles that may change a request's status by hand. The database
 * (staff_set_request_status -> is_portal_manager) enforces the same set:
 * profiles.staff_role or staff_members.role_level = 'upper_management'.
 * Everyone else sees the status as a label; it moves forward on its own.
 */
export const REQUEST_STATUS_ROLES = ['upper_management'] as const;

export function canUpdateRequestStatus(role: string | null | undefined): boolean {
  return (REQUEST_STATUS_ROLES as readonly string[]).includes((role || '').trim().toLowerCase());
}
