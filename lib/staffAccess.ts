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
