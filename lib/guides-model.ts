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

/**
 * Portal list a staff role must have for a how-to to be about its work.
 * Same derivation as tabsForStaffRole / canOpenStaffFile: a file screen
 * (dossier, request, employer) counts as its list.
 */
export type StaffNeed = 'candidates' | 'requests' | 'employers';

/** Whose own screen a how-to walks through. */
export type GuidePerspective = 'staff' | 'employer' | 'candidate';

export type GuideDef = {
  id: string;
  /**
   * staff: portal work. employer / candidate: that account's own portal;
   * shown to that account and to upper management only.
   */
  perspective: GuidePerspective;
  audiences: GuideAudience[];
  /** For staff below upper management: only roles with this list see the how-to. */
  staffNeeds?: StaffNeed;
};

export type GuideStep = { title: string; body: string };

/** Who carries out a how-to step: a staff role, or the employer / candidate on their own portal. */
export type StepActor = 'upper_management' | 'source_country' | 'target_country' | 'field_officer' | 'employer' | 'candidate';

const STAFF_ACTORS: readonly StepActor[] = ['upper_management', 'source_country', 'target_country', 'field_officer'];

/** A step as one session reads it. */
export type VisibleStep = GuideStep & {
  /** Who does this step; empty when the how-to has no step roles. */
  actors: StepActor[];
  /** False when the session's role does not do this step itself. */
  own: boolean;
  /** "This step is done by …", or null when nothing needs saying. */
  doneBy: string | null;
};

export type GuideArticle = {
  title: string;
  summary: string;
  where: string;
  steps: GuideStep[];
  flow: string[];
  mock: { caption: string; chrome: string; rows: { label: string; value: string }[] };
  /** Short worked example (demo records only, no real people). */
  example: string;
};

export type ScreenCopy = { name: string; does: string; limitedDoes?: string };

export type RoleCopy = { title: string; summary: string; screens: Record<string, ScreenCopy> };

export type GuidesPrintCopy = {
  /** Button text on /guides and the print toolbar. */
  printButton: string;
  /** Upper management: every role card and every how-to. */
  allRoles: string;
  /** Everyone else: what their own session may read. */
  ownGuide: string;
  back: string;
  coverSubtitle: string;
  languageLabel: string;
  createdLabel: string;
  sessionRoleLabel: string;
  scopeLabel: string;
  roleFilterLabel: string;
  contentsTitle: string;
  hint: string;
  pageLabel: string;
};

export type GuidesCopy = {
  navLabel: string;
  hubTitle: string;
  hubLead: string;
  mapTitle: string;
  mapLead: string;
  mapNote: string;
  /** Shown to staff whose role is unknown: only the sign-in how-to is open. */
  unknownRoleNote: string;
  howToTitle: string;
  howToLead: string;
  sessionLabel: string;
  screensLabel: string;
  upperOnly: string;
  stepsLabel: string;
  whereLabel: string;
  flowLabel: string;
  /** Heading of the example box on every how-to. */
  exampleLabel: string;
  /** Under a step: who does it. {roles} is the list of role names. */
  stepDoneBy: string;
  /** Above the steps when some of them belong to another role. */
  stepOthersNote: string;
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
  /** Print / PDF page (/guides/print). */
  print: GuidesPrintCopy;
  roleLabels: Record<string, string>;
  roles: Record<string, RoleCopy>;
  guides: Record<string, GuideArticle>;
};

/**
 * Role cards follow the live portals.
 * Staff tabs and file routes follow this catalog (see lib/staffAccess.ts).
 * A dossier, request, or employer screen also shows the list that opens it.
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
  // finance and limited: tabsForStaffRole gives them overview and tasks only;
  // the cards list exactly those two screens so the tabs stay the same.
  {
    id: 'finance',
    audiences: ['staff'],
    screens: [
      { id: 'overview', path: '/portal' },
      { id: 'tasks', path: '/portal' },
    ],
  },
  {
    id: 'limited',
    audiences: ['staff'],
    screens: [
      { id: 'overview', path: '/portal' },
      { id: 'tasks', path: '/portal' },
    ],
  },
  {
    id: 'employer',
    audiences: ['staff', 'employer'],
    screens: [
      { id: 'home', path: '/employer' },
      { id: 'newRequest', path: '/employer' },
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
  { id: 'staff-login', perspective: 'staff', audiences: ['staff'] },
  { id: 'staff-invite', perspective: 'staff', audiences: ['upper_management'] },
  { id: 'dossier-review', perspective: 'staff', audiences: ['staff'], staffNeeds: 'candidates' },
  { id: 'matching-offers', perspective: 'staff', audiences: ['staff'], staffNeeds: 'requests' },
  { id: 'request-to-offer', perspective: 'staff', audiences: ['staff'], staffNeeds: 'requests' },
  { id: 'document-request', perspective: 'staff', audiences: ['staff'], staffNeeds: 'candidates' },
  // These three describe the employer's / candidate's own screens, not staff work:
  // only that account and upper management see them.
  { id: 'employer-request', perspective: 'employer', audiences: ['upper_management', 'employer'] },
  { id: 'employer-browse', perspective: 'employer', audiences: ['upper_management', 'employer'] },
  { id: 'candidate-register', perspective: 'candidate', audiences: ['upper_management', 'candidate'] },
];

const UM: StepActor = 'upper_management';
const SOURCE: StepActor = 'source_country';
const TARGET: StepActor = 'target_country';
const FIELD: StepActor = 'field_officer';

/**
 * Who may do each step, index by index (the step order is the same in every
 * locale). Only the staff how-tos that several roles read are listed; the
 * others are one role's own work. Derived from the permission checks, not
 * decided here:
 * - request file: canOpenStaffFile('requestFile'); RLS staff_can_read_request
 * - bind a candidate: request_matches insert needs the request AND the candidate
 *   readable (staff_can_read_candidate). A target-country officer only reads
 *   candidates already on its country's requests, so new candidates are bound
 *   by upper management or the source-country officer.
 * - present / interview / offer: request_matches update, interviews and
 *   job_offers insert (staff_can_read_candidate; guard_presented_pipeline)
 * - decision for the employer: STAFF_DECISION_ROLES / staff_decide_match
 * - meeting link: MEETING_URL_ROLES / guard_interview_meeting_url
 * - manual candidate status: canUpdateRequestStatus / staff_set_candidate_status
 * - YouTube: canManageCandidateVideo / can_manage_candidate_video
 * - document request, review: candidate_documents insert / update
 *   (staff_can_read_candidate); delete: upper_delete_documents (is_portal_manager)
 */
export const GUIDE_STEP_ACTORS: Record<string, StepActor[][]> = {
  'dossier-review': [
    [UM, SOURCE, TARGET, FIELD],
    [UM, SOURCE, TARGET, FIELD],
    [UM],
    [UM, SOURCE, TARGET, FIELD],
    [UM, SOURCE, TARGET, FIELD],
    [UM, SOURCE, TARGET],
  ],
  'matching-offers': [
    [UM, SOURCE, TARGET],
    [UM, SOURCE],
    [UM, SOURCE, TARGET],
    [UM, TARGET],
    [UM, SOURCE, TARGET],
    [UM, TARGET],
    [UM, SOURCE, TARGET],
  ],
  'request-to-offer': [
    ['employer'],
    [UM, SOURCE],
    [UM, SOURCE, TARGET],
    [UM, SOURCE, TARGET],
    [UM, TARGET],
    [UM, SOURCE, TARGET],
    ['candidate'],
  ],
  'document-request': [
    [UM, SOURCE, TARGET, FIELD],
    [UM, SOURCE, TARGET, FIELD],
    ['candidate'],
    [UM, SOURCE, TARGET, FIELD],
    [UM, SOURCE, TARGET, FIELD],
    [UM],
  ],
};

/** The staff role that does a step, for a session; null for upper management and non-staff. */
function stepRoleOf(viewer: PortalViewer): StepActor | null {
  if (viewer.kind !== 'staff' || viewer.upperManagement) return null;
  return (STAFF_ACTORS as readonly string[]).includes(viewer.roleId) ? (viewer.roleId as StepActor) : null;
}

/**
 * Steps as a session reads them.
 * - upper management: every step in full, each with who does it
 * - a staff role: its own steps in full; a step another staff role does keeps
 *   its title (so the flow still reads) but its body is replaced by who does it
 * - an employer / candidate step stays in full for staff, marked with who does it
 */
export function visibleSteps(copy: GuidesCopy, guideId: string, viewer: PortalViewer): VisibleStep[] {
  const steps = copy.guides[guideId].steps;
  const actorsByStep = GUIDE_STEP_ACTORS[guideId];
  const role = stepRoleOf(viewer);
  return steps.map((step, index) => {
    const actors = actorsByStep?.[index] ?? [];
    if (!actors.length) return { ...step, actors, own: true, doneBy: null };
    const doneBy = copy.stepDoneBy.replace('{roles}', actors.map((actor) => copy.roleLabels[actor] || actor).join(', '));
    if (viewer.kind === 'staff' && viewer.upperManagement) return { ...step, actors, own: true, doneBy };
    if (role && actors.includes(role)) return { ...step, actors, own: true, doneBy: null };
    const staffStep = actors.some((actor) => STAFF_ACTORS.includes(actor));
    return { ...step, body: staffStep ? '' : step.body, actors, own: false, doneBy };
  });
}

const NEED_SCREENS: Record<StaffNeed, string[]> = {
  candidates: ['candidates', 'dossier'],
  requests: ['requests', 'request'],
  employers: ['employers', 'employer'],
};

/** True when the staff role's card (and so its tabs) includes that list. Unknown roles have none. */
export function staffRoleHas(roleId: string, need: StaffNeed): boolean {
  if (roleId === 'employer' || roleId === 'candidate') return false;
  const role = ROLE_CATALOG.find((item) => item.id === roleId);
  return !!role && role.screens.some((screen) => NEED_SCREENS[need].includes(screen.id));
}

/** A staff role id with its own card. 'staff' and unknown values are not. */
export function isKnownStaffRole(roleId: string): boolean {
  return roleId !== 'employer' && roleId !== 'candidate' && ROLE_CATALOG.some((role) => role.id === roleId);
}

/**
 * Role card rule. Upper management: every card. Other staff: their own card
 * only. Employer and candidate: their own card (by audience).
 */
export function roleCardVisible(role: RoleDef, viewer: PortalViewer): boolean {
  if (viewer.kind === 'staff') return viewer.upperManagement || (isKnownStaffRole(viewer.roleId) && role.id === viewer.roleId);
  return audienceAllows(role.audiences, viewer);
}

/**
 * How-to rule. Audience first; then staff below upper management only see
 * how-tos for a list their role has (staffNeeds). An unknown staff role
 * keeps only the how-tos without a need (staff sign-in).
 */
export function guideVisible(guide: GuideDef, viewer: PortalViewer): boolean {
  if (!audienceAllows(guide.audiences, viewer)) return false;
  if (viewer.kind !== 'staff' || viewer.upperManagement) return true;
  // Staff below upper management: only staff-side how-tos, for a list their role has.
  if (guide.perspective !== 'staff') return false;
  return !guide.staffNeeds || staffRoleHas(viewer.roleId, guide.staffNeeds);
}

/** Path fragment each how-to must keep, in every locale, so the steps stay tied to the app. */
export const GUIDE_ROUTES: Record<string, string> = {
  'staff-login': '/portal',
  'staff-invite': '/portal',
  'dossier-review': '/portal/candidates/',
  'matching-offers': '/portal/requests/',
  'request-to-offer': '/portal/requests/',
  'document-request': '/portal/candidates/',
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

export type VisibleGuide = Omit<GuidesCopy['guides'][string], 'steps'> & {
  id: string;
  steps: VisibleStep[];
  /** True when some steps are done by another role (they keep only their title). */
  hasOthersSteps: boolean;
};

export function portalGuideView(copy: GuidesCopy, viewer: PortalViewer): { roles: VisibleRole[]; guides: VisibleGuide[] } {
  const roles = ROLE_CATALOG.filter((role) => roleCardVisible(role, viewer)).map((role) => {
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

  const guides = GUIDE_CATALOG.filter((guide) => guideVisible(guide, viewer)).map((guide) => {
    const steps = visibleSteps(copy, guide.id, viewer);
    return {
      id: guide.id,
      ...copy.guides[guide.id],
      steps,
      hasOthersSteps: steps.some((step) => !step.own),
    };
  });

  return { roles, guides };
}

export const GUIDES_PRINT_PATH = '/guides/print';

/** The session a role card stands for, used to pick that role's how-tos. */
export function viewerForRole(roleId: string): PortalViewer {
  if (roleId === 'employer') return { kind: 'employer', upperManagement: false, roleId };
  if (roleId === 'candidate') return { kind: 'candidate', upperManagement: false, roleId };
  return { kind: 'staff', upperManagement: roleId === 'upper_management', roleId };
}

export type GuidePrintScope = 'all' | 'role' | 'own';

export type GuidePrintView = {
  scope: GuidePrintScope;
  /** The role picked with ?role=, when upper management asked for one. */
  roleId: string | null;
  roles: VisibleRole[];
  guides: VisibleGuide[];
};

/** Button text on /guides: "all roles" for upper management, "my guide" for everyone else. */
export function printButtonLabel(copy: GuidesCopy, viewer: PortalViewer): string {
  return viewer.kind === 'staff' && viewer.upperManagement ? copy.print.allRoles : copy.print.ownGuide;
}

/**
 * What the print page shows. It only ever narrows portalGuideView (the /guides
 * rule), so it never opens anything the session cannot already read there.
 * - upper management: everything, or one role with ?role=<id> (that role's how-tos and steps)
 * - other staff: their own role card (all staff cards if the role is unknown) and their how-tos
 * - employer / candidate: their own role (portalGuideView already limits it)
 * ?role= is ignored for everyone but upper management.
 */
export function guidePrintView(copy: GuidesCopy, viewer: PortalViewer, requestedRole?: string | null): GuidePrintView {
  const base = portalGuideView(copy, viewer);
  if (viewer.kind === 'unlinked') return { scope: 'own', roleId: null, roles: [], guides: [] };

  if (viewer.kind === 'staff' && viewer.upperManagement) {
    const role = requestedRole ? base.roles.find((item) => item.id === requestedRole) : undefined;
    if (!role) return { scope: 'all', roleId: null, ...base };
    // That role's how-tos, with the steps as that role reads them (the print is for that role).
    return {
      scope: 'role',
      roleId: role.id,
      roles: [role],
      guides: portalGuideView(copy, viewerForRole(role.id)).guides,
    };
  }

  if (viewer.kind === 'staff') {
    const own = base.roles.filter((role) => role.id === viewer.roleId);
    return { scope: 'own', roleId: null, roles: own.length ? own : base.roles, guides: base.guides };
  }

  return { scope: 'own', roleId: null, ...base };
}

/** Link to the print page; the role filter is only kept for upper management. */
export function guidesPrintHref(viewer: PortalViewer, roleId?: string | null): string {
  if (roleId && viewer.kind === 'staff' && viewer.upperManagement) {
    return `${GUIDES_PRINT_PATH}?role=${encodeURIComponent(roleId)}`;
  }
  return GUIDES_PRINT_PATH;
}
