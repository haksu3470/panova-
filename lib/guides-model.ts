/** Who may read a map card or a how-to. Staff does not imply upper management. */
export type GuideAudience = 'staff' | 'upper_management' | 'employer' | 'candidate';

export type PortalViewer = {
  kind: 'staff' | 'employer' | 'candidate' | 'unlinked';
  upperManagement: boolean;
  roleId: string;
};

export type ScreenDef = {
  id: string;
  path: string;
  managementOnly?: boolean;
};

export type RoleDef = {
  id: string;
  audiences: GuideAudience[];
  screens: ScreenDef[];
};

export type GuideDef = {
  id: string;
  audiences: GuideAudience[];
};

export type GuideStep = { title: string; body: string };

export type GuideArticle = {
  title: string;
  summary: string;
  where: string;
  steps: GuideStep[];
  flow: string[];
  mock: { caption: string; chrome: string; rows: { label: string; value: string }[] };
};

export type ScreenCopy = { name: string; does: string; limitedDoes?: string };

export type RoleCopy = { title: string; summary: string; screens: Record<string, ScreenCopy> };

export type GuidesCopy = {
  navLabel: string;
  hubTitle: string;
  hubLead: string;
  mapTitle: string;
  mapLead: string;
  mapNote: string;
  howToTitle: string;
  howToLead: string;
  sessionLabel: string;
  screensLabel: string;
  upperOnly: string;
  stepsLabel: string;
  whereLabel: string;
  flowLabel: string;
  loading: string;
  signedOutTitle: string;
  signedOutBody: string;
  signInStaff: string;
  signInEmployer: string;
  signInCandidate: string;
  backStaff: string;
  backEmployer: string;
  backCandidate: string;
  backHome: string;
  unlinkedTitle: string;
  unlinkedBody: string;
  verifyTitle: string;
  verifyBody: string;
  roleLabels: Record<string, string>;
  roles: Record<string, RoleCopy>;
  guides: Record<string, GuideArticle>;
};

/**
 * Role cards follow the live portals.
 * Staff share /portal. The Staff tab is the only one limited to upper management.
 * Employer and candidate cards match the tabs those accounts actually render.
 */
export const ROLE_CATALOG: RoleDef[] = [
  {
    id: 'upper_management',
    audiences: ['staff'],
    screens: [
      { id: 'overview', path: '/portal' },
      { id: 'candidates', path: '/portal' },
      { id: 'requests', path: '/portal' },
      { id: 'staff', path: '/portal', managementOnly: true },
      { id: 'tasks', path: '/portal' },
      { id: 'audit', path: '/portal' },
      { id: 'employers', path: '/portal' },
      { id: 'support', path: '/portal' },
    ],
  },
  {
    id: 'source_country',
    audiences: ['staff'],
    screens: [
      { id: 'candidates', path: '/portal' },
      { id: 'dossier', path: '/portal/candidates/[id]' },
      { id: 'requests', path: '/portal' },
      { id: 'tasks', path: '/portal' },
    ],
  },
  {
    id: 'target_country',
    audiences: ['staff'],
    screens: [
      { id: 'request', path: '/portal/requests/[id]' },
      { id: 'employer', path: '/portal/employers/[id]' },
      { id: 'candidates', path: '/portal' },
      { id: 'tasks', path: '/portal' },
    ],
  },
  {
    id: 'field_officer',
    audiences: ['staff'],
    screens: [
      { id: 'tasks', path: '/portal' },
      { id: 'dossier', path: '/portal/candidates/[id]' },
      { id: 'support', path: '/portal' },
      { id: 'overview', path: '/portal' },
    ],
  },
  {
    id: 'employer',
    audiences: ['staff', 'employer'],
    screens: [
      { id: 'home', path: '/employer' },
      { id: 'demands', path: '/employer' },
      { id: 'candidates', path: '/employer' },
      { id: 'interviews', path: '/employer' },
      { id: 'selected', path: '/employer' },
      { id: 'process', path: '/employer' },
      { id: 'travel', path: '/employer' },
      { id: 'employees', path: '/employer' },
      { id: 'support', path: '/employer' },
      { id: 'company', path: '/employer' },
    ],
  },
  {
    id: 'candidate',
    audiences: ['staff', 'candidate'],
    screens: [
      { id: 'overview', path: '/candidate' },
      { id: 'profile', path: '/candidate' },
      { id: 'documents', path: '/candidate' },
      { id: 'offers', path: '/candidate' },
      { id: 'support', path: '/candidate' },
    ],
  },
];

export const GUIDE_CATALOG: GuideDef[] = [
  { id: 'staff-login', audiences: ['staff'] },
  { id: 'staff-invite', audiences: ['upper_management'] },
  { id: 'dossier-review', audiences: ['staff'] },
  { id: 'matching-offers', audiences: ['staff'] },
  { id: 'employer-request', audiences: ['staff', 'employer'] },
  { id: 'employer-browse', audiences: ['staff', 'employer'] },
  { id: 'candidate-register', audiences: ['staff', 'candidate'] },
];

/** Path fragment each how-to must keep, in every locale, so the steps stay tied to the app. */
export const GUIDE_ROUTES: Record<string, string> = {
  'staff-login': '/portal',
  'staff-invite': '/portal',
  'dossier-review': '/portal/candidates/',
  'matching-offers': '/portal/requests/',
  'employer-request': '/employer',
  'employer-browse': '/employer',
  'candidate-register': '/candidate',
};

export function audienceAllows(audiences: readonly GuideAudience[], viewer: PortalViewer): boolean {
  if (viewer.kind === 'unlinked') return false;
  return audiences.some((audience) => {
    if (audience === 'upper_management') return viewer.kind === 'staff' && viewer.upperManagement;
    if (audience === 'staff') return viewer.kind === 'staff';
    if (audience === 'employer') return viewer.kind === 'employer';
    if (audience === 'candidate') return viewer.kind === 'candidate';
    return false;
  });
}

export function guidesHome(viewer: PortalViewer | null): string {
  if (!viewer || viewer.kind === 'unlinked') return '/';
  if (viewer.kind === 'employer') return '/employer';
  if (viewer.kind === 'candidate') return '/candidate';
  return '/portal';
}

export function sessionName(copy: GuidesCopy, viewer: PortalViewer): string {
  return copy.roleLabels[viewer.roleId] || copy.roleLabels.staff;
}

export type VisibleScreen = {
  id: string;
  path: string;
  name: string;
  does: string;
  managementOnly: boolean;
};

export type VisibleRole = {
  id: string;
  title: string;
  summary: string;
  screens: VisibleScreen[];
};

export type VisibleGuide = GuidesCopy['guides'][string] & { id: string };

export function portalGuideView(copy: GuidesCopy, viewer: PortalViewer): { roles: VisibleRole[]; guides: VisibleGuide[] } {
  const roles = ROLE_CATALOG.filter((role) => audienceAllows(role.audiences, viewer)).map((role) => {
    const text = copy.roles[role.id];
    return {
      id: role.id,
      title: text.title,
      summary: text.summary,
      screens: role.screens.map((screen) => {
        const line = text.screens[screen.id];
        const hideProcedure = !!screen.managementOnly && !viewer.upperManagement;
        return {
          id: screen.id,
          path: screen.path,
          name: line.name,
          does: hideProcedure ? line.limitedDoes || line.does : line.does,
          managementOnly: !!screen.managementOnly,
        };
      }),
    };
  });

  const guides = GUIDE_CATALOG.filter((guide) => audienceAllows(guide.audiences, viewer)).map((guide) => ({
    id: guide.id,
    ...copy.guides[guide.id],
  }));

  return { roles, guides };
}
