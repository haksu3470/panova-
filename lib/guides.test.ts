import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { Language } from './dictionary.ts';
import { guidesCopy } from './guides-copy.ts';
import { guideNavLabel } from './guides-nav.ts';
import { register } from 'node:module';
import {
  GUIDE_CATALOG,
  GUIDE_ROUTES,
  GUIDE_STEP_ACTORS,
  ROLE_CATALOG,
  audienceAllows,
  guidePrintView,
  type StepActor,
  guidesHome,
  isKnownStaffRole,
  staffRoleHas,
  portalGuideView,
  type PortalViewer,
} from './guides-model.ts';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);
const {
  INTERVIEW_OFFER_ROLES,
  canWriteInterviewOffer,
  MEETING_URL_ROLES,
  STAFF_DECISION_ROLES,
  canOpenStaffFile,
  canUpdateRequestStatus,
  isUpperManagementRole,
  tabsForStaffRole,
} = await import('./staffAccess.ts');
const { canManageCandidateVideo } = await import('./youtube.ts');
const { translations } = await import('./dictionary.ts');
const { portalUi } = await import('./portal-ui-copy.ts');

const LOCALES: Language[] = ['tr', 'en', 'sq', 'ar', 'mk'];
const TURKISH_LETTERS = /[ğışöüĞİŞÖÜ]/;
const CYRILLIC = /[А-Яа-яЃѓЅѕЈјЉљЊњЌќЏџ]/;
const ARABIC = /[\u0600-\u06FF]/;
const PATH_ONLY = /^\/[A-Za-z0-9[\]/._-]+$/;

function leafKeys(value: unknown, prefix = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => leafKeys(item, `${prefix}[${index}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => leafKeys(child, prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

/**
 * Demo record names exactly as the demo seed stores them (they appear on screen
 * in Turkish in every language), so they are the known exceptions in the
 * language checks below.
 */
const DEMO_NAMES = ['DEMO Balkan Yapı DOO', 'DEMO Adriyatik Otel', 'Demo Aday Bir', 'Demo Aday İki', 'Demo Aday Dört'];
const withoutDemoNames = (text: string) => DEMO_NAMES.reduce((out, name) => out.split(name).join(''), text);

/** Every string leaf with its path. */
function translatedLeaves(value: unknown, prefix = ''): [string, string][] {
  if (typeof value === 'string') return [[prefix, value]];
  if (Array.isArray(value)) return value.flatMap((item, index) => translatedLeaves(item, `${prefix}[${index}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => translatedLeaves(child, prefix ? `${prefix}.${key}` : key));
  }
  return [];
}

const staff: PortalViewer = { kind: 'staff', upperManagement: false, roleId: 'source_country' };
const upper: PortalViewer = { kind: 'staff', upperManagement: true, roleId: 'upper_management' };
const employer: PortalViewer = { kind: 'employer', upperManagement: false, roleId: 'employer' };
const candidate: PortalViewer = { kind: 'candidate', upperManagement: false, roleId: 'candidate' };
const unlinked: PortalViewer = { kind: 'unlinked', upperManagement: false, roleId: 'unlinked' };

test('guide copy has the same keys in every locale and matches the catalog', () => {
  const base = leafKeys(guidesCopy.en).sort();
  for (const lang of LOCALES) {
    assert.deepEqual(leafKeys(guidesCopy[lang]).sort(), base, lang);
    assert.equal(guidesCopy[lang].navLabel, guideNavLabel[lang]);
  }
  assert.deepEqual(
    Object.keys(guidesCopy.en.guides).sort(),
    GUIDE_CATALOG.map((guide) => guide.id).sort(),
  );
  assert.deepEqual(
    Object.keys(guidesCopy.en.roles).sort(),
    ROLE_CATALOG.map((role) => role.id).sort(),
  );
  for (const role of ROLE_CATALOG) {
    assert.deepEqual(
      Object.keys(guidesCopy.en.roles[role.id].screens).sort(),
      role.screens.map((screen) => screen.id).sort(),
      role.id,
    );
  }
});

test('non-Turkish guide copy does not use Turkish letters (except demo record names)', () => {
  for (const lang of LOCALES) {
    if (lang === 'tr') continue;
    for (const [where, value] of translatedLeaves(guidesCopy[lang])) {
      assert.equal(TURKISH_LETTERS.test(withoutDemoNames(value)), false, `${lang}.${where}: ${value}`);
    }
  }
});

// Turkish words that do not occur in en / sq / ar / mk text; a leftover Turkish sentence trips one.
const TURKISH_WORDS = /(^|[^\p{L}])(ve|veya|bir|için|ile|olarak|sekmesi|sekmesinde|talep|aday|adayı|işveren|personel|seçin|açın|yazın|yalnız|görünür)(?=$|[^\p{L}])/iu;
// Leaves that may read the same as Turkish: paths, codes, product and demo names.
const SAME_AS_TURKISH = /^(\/[A-Za-z0-9[\]/._ -]*|Diploma|Video|E-posta|PDF|YouTube|Google|Panova Group)$/;

test('no Turkish sentence is left in the en, sq, ar and mk guides', () => {
  const tr = new Map(translatedLeaves(guidesCopy.tr));
  for (const lang of LOCALES) {
    if (lang === 'tr') continue;
    for (const [where, value] of translatedLeaves(guidesCopy[lang])) {
      const text = withoutDemoNames(value);
      assert.equal(TURKISH_WORDS.test(text), false, `${lang}.${where}: ${value}`);
      if (tr.get(where) === value && !PATH_ONLY.test(value)) {
        assert.match(value, SAME_AS_TURKISH, `${lang}.${where} is still the Turkish text`);
      }
    }
  }
});

test('every guide has the same number of steps, flow items and frame rows as Turkish', () => {
  for (const lang of LOCALES) {
    for (const [id, source] of Object.entries(guidesCopy.tr.guides)) {
      const article = guidesCopy[lang].guides[id];
      assert.equal(article.steps.length, source.steps.length, `${lang} ${id} steps`);
      assert.equal(article.flow.length, source.flow.length, `${lang} ${id} flow`);
      assert.equal(article.mock.rows.length, source.mock.rows.length, `${lang} ${id} rows`);
      assert.equal(article.where.split(' → ')[0], source.where.split(' → ')[0], `${lang} ${id} where`);
    }
  }
});

test('codes, money and paths survive translation', () => {
  for (const lang of LOCALES) {
    const all = JSON.stringify(guidesCopy[lang]);
    for (const code of ['/portal/requests/[id]', '/portal/candidates/[id]', '/employer', '/candidate', 'EUR', 'USD', '€', '$', '1300', '{roles}', 'http/https', '30/60/90']) {
      assert.ok(all.includes(code), `${lang} ${code}`);
    }
  }
});

test('Arabic and Macedonian guide copy is in those scripts', () => {
  function visit(value: unknown, script: RegExp) {
    for (const [where, text] of translatedLeaves(value)) {
      if (PATH_ONLY.test(text)) continue;
      assert.equal(script.test(text), true, `${where}: ${text}`);
    }
  }
  visit(guidesCopy.ar, ARABIC);
  visit(guidesCopy.mk, CYRILLIC);
  assert.notEqual(guidesCopy.sq.hubTitle, guidesCopy.en.hubTitle);
  assert.match(guidesCopy.sq.hubTitle, /[ëç]/);
});

test('each how-to names its real route in every locale', () => {
  for (const lang of LOCALES) {
    for (const [id, route] of Object.entries(GUIDE_ROUTES)) {
      const article = guidesCopy[lang].guides[id];
      assert.equal(article.where.includes(route), true, `${lang} ${id}`);
      assert.equal(article.steps.length >= 4, true, id);
      assert.equal(article.flow.length >= 4, true, id);
      assert.equal(article.mock.rows.length >= 3, true, id);
    }
  }
});

test('role cards point at pages that exist', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const role of ROLE_CATALOG) {
    for (const screen of role.screens) {
      const file = path.join(root, 'app', screen.path.replace(/^\//, ''), 'page.tsx');
      assert.equal(existsSync(file), true, screen.path);
    }
  }
});

test('guides stay inside the signed-in role', () => {
  const ids = (viewer: PortalViewer) => portalGuideView(guidesCopy.en, viewer).guides.map((guide) => guide.id);

  assert.deepEqual(ids(unlinked), []);
  assert.equal(audienceAllows(['upper_management'], staff), false);
  assert.equal(ids(staff).includes('staff-invite'), false);
  assert.equal(ids(upper).includes('staff-invite'), true);
  assert.equal(ids(staff).includes('dossier-review'), true);
  // source country has no employers list, so the employer how-tos are not its work
  assert.equal(ids(staff).includes('employer-request'), false);
  assert.equal(ids(employer).includes('staff-invite'), false);
  assert.equal(ids(employer).includes('dossier-review'), false);
  assert.equal(ids(employer).includes('employer-request'), true);
  assert.equal(ids(employer).includes('employer-browse'), true);
  assert.equal(ids(candidate).includes('employer-request'), false);
  assert.equal(ids(candidate).includes('candidate-register'), true);
  assert.equal(ids(candidate).includes('staff-login'), false);

  const upperStaff = portalGuideView(guidesCopy.en, upper).roles.find((role) => role.id === 'upper_management');
  const staffScreen = upperStaff?.screens.find((screen) => screen.id === 'staff');
  assert.match(staffScreen?.does || '', /Invite/);

  // other staff no longer get the upper management card at all
  assert.equal(portalGuideView(guidesCopy.en, staff).roles.some((role) => role.id === 'upper_management'), false);

  assert.equal(guidesHome(staff), '/portal');
  assert.equal(guidesHome(employer), '/employer');
  assert.equal(guidesHome(candidate), '/candidate');
  assert.equal(guidesHome(unlinked), '/');
  assert.equal(guidesHome(null), '/');
});

test('no temporary Turkish fallback is left; the todo file waits for native review', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const source = readFileSync(path.join(root, 'lib/guides-copy.ts'), 'utf8');
  assert.equal(/withPendingTr|GUIDES_PENDING_TRANSLATION|LegacyGuidesCopy|isPendingTranslation/.test(source), false);
  const todo = readFileSync(path.join(root, 'docs/guides-translation-todo.md'), 'utf8');
  assert.match(todo, /tamamlandı/i);
  assert.equal(/- \[ \] `/.test(todo), false, 'no open translation item');
  for (const lang of ['en', 'sq', 'ar', 'mk'] as const) {
    assert.notDeepEqual(guidesCopy[lang].guides['request-to-offer'], guidesCopy.tr.guides['request-to-offer'], lang);
    assert.notEqual(guidesCopy[lang].stepDoneBy, guidesCopy.tr.stepDoneBy, lang);
  }
});

test('every how-to has an example and the box heading comes from the copy', () => {
  for (const lang of LOCALES) {
    assert.ok(guidesCopy[lang].exampleLabel.trim(), lang);
    for (const guide of GUIDE_CATALOG) assert.ok(guidesCopy[lang].guides[guide.id].example.trim(), `${lang} ${guide.id}`);
  }
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const hub = readFileSync(path.join(root, 'components/guides/GuidesHub.tsx'), 'utf8');
  assert.ok(hub.includes('{copy.exampleLabel}') && hub.includes('{guide.example}'));
  assert.equal(/>\s*(Örnek|Example)\s*</.test(hub), false, 'no fixed heading');
});

test('Turkish guide copy covers the current screens', () => {
  const tr = guidesCopy.tr;
  const employerScreens = Object.values(tr.roles.employer.screens).map((screen) => screen.name);
  assert.deepEqual(employerScreens.includes('Talepler'), false);
  assert.ok(employerScreens.includes('Yeni Talep'));
  assert.match(tr.mapNote, /role göre/);
  assert.match(tr.mapNote, /Demo verisi/);
  assert.match(tr.guides['employer-request'].steps.map((step) => step.body).join(' '), /EUR veya USD[\s\S]*100\.000/);
  assert.equal(/tarım, inşaat veya ticaret/i.test(JSON.stringify(tr.guides['employer-request'])), false);
  assert.match(JSON.stringify(tr.guides['dossier-review']), /\+ Talep et/);
  assert.match(JSON.stringify(tr.guides['dossier-review']), /gerekçe/);
  assert.match(tr.roles.employer.screens.home.does, /Bu talebe bağlı süreç var, silinemez\./);
  assert.match(tr.roles.upper_management.screens.overview.does, /Demo verisi/);
  assert.match(tr.roles.field_officer.summary, /Talep ve işveren dosyalarını açamaz/);
  // demo records only: no e-mail addresses in any guide text
  assert.equal(/@/.test(JSON.stringify(guidesCopy)), false);
});

test('finance and limited cards list exactly the tabs those roles get', () => {
  for (const id of ['finance', 'limited']) {
    const role = ROLE_CATALOG.find((item) => item.id === id);
    assert.ok(role, id);
    assert.deepEqual(role!.screens.map((screen) => screen.id), tabsForStaffRole(id), id);
  }
  assert.deepEqual(tabsForStaffRole('finance'), ['overview', 'tasks']);
  assert.deepEqual(tabsForStaffRole('limited'), ['overview', 'tasks']);
  assert.ok(guidesCopy.tr.roleLabels.finance && guidesCopy.tr.roleLabels.limited);
});

test('the two new how-tos are for staff and use demo records', () => {
  const ids = portalGuideView(guidesCopy.tr, staff).guides.map((guide) => guide.id);
  assert.ok(ids.includes('request-to-offer') && ids.includes('document-request'));
  assert.equal(portalGuideView(guidesCopy.tr, employer).guides.some((guide) => guide.id === 'request-to-offer'), false);
  const flow = JSON.stringify(guidesCopy.tr.guides['request-to-offer']);
  for (const part of ['DEMO Balkan Yapı DOO', 'Kalıpçı', '2 kişi', '1300', 'EUR', 'konaklama evet', 'Demo Aday İki', 'kabul']) {
    assert.ok(flow.includes(part), part);
  }
  const docs = JSON.stringify(guidesCopy.tr.guides['document-request']);
  for (const part of ['+ Talep et', 'Aday yükler', 'Önizle', 'Onaylandı']) assert.ok(docs.includes(part), part);
});

const ALL_GUIDES = GUIDE_CATALOG.map((guide) => guide.id);
const ALL_ROLES = ROLE_CATALOG.map((role) => role.id);

// What each session sees on /guides (and on the print page, which uses the same function).
const VISIBILITY: [PortalViewer, string[], string[]][] = [
  [upper, ALL_ROLES, ALL_GUIDES],
  [
    { kind: 'staff', upperManagement: false, roleId: 'source_country' },
    ['source_country'],
    ['staff-login', 'dossier-review', 'matching-offers', 'request-to-offer', 'document-request'],
  ],
  [
    { kind: 'staff', upperManagement: false, roleId: 'target_country' },
    ['target_country'],
    ['staff-login', 'dossier-review', 'matching-offers', 'request-to-offer', 'document-request'],
  ],
  [
    { kind: 'staff', upperManagement: false, roleId: 'field_officer' },
    ['field_officer'],
    ['staff-login', 'dossier-review', 'document-request'],
  ],
  [{ kind: 'staff', upperManagement: false, roleId: 'finance' }, ['finance'], ['staff-login']],
  [{ kind: 'staff', upperManagement: false, roleId: 'limited' }, ['limited'], ['staff-login']],
  [{ kind: 'staff', upperManagement: false, roleId: 'staff' }, [], ['staff-login']],
  [{ kind: 'staff', upperManagement: false, roleId: 'employer' }, [], ['staff-login']],
  [employer, ['employer'], ['employer-request', 'employer-browse']],
  [candidate, ['candidate'], ['candidate-register']],
  [unlinked, [], []],
];

test('each role sees its own card and the how-tos for its own work', () => {
  for (const [viewer, roles, guides] of VISIBILITY) {
    for (const lang of LOCALES) {
      const view = portalGuideView(guidesCopy[lang], viewer);
      assert.deepEqual(view.roles.map((role) => role.id), roles, `${lang} ${viewer.roleId} cards`);
      assert.deepEqual(view.guides.map((guide) => guide.id), guides, `${lang} ${viewer.roleId} guides`);
    }
  }
});

test('staff how-to needs follow the real portal tabs and file routes', () => {
  const NEED_TAB = { candidates: 'candidates', requests: 'requests', employers: 'employers' } as const;
  for (const role of ROLE_CATALOG) {
    if (role.id === 'employer' || role.id === 'candidate') continue;
    const tabs: string[] = tabsForStaffRole(role.id);
    for (const need of Object.keys(NEED_TAB) as (keyof typeof NEED_TAB)[]) {
      assert.equal(staffRoleHas(role.id, need), tabs.includes(NEED_TAB[need]), `${role.id} ${need}`);
    }
    if (role.id === 'upper_management') continue;
    const viewer: PortalViewer = { kind: 'staff', upperManagement: false, roleId: role.id };
    const ids = portalGuideView(guidesCopy.en, viewer).guides.map((guide) => guide.id);
    assert.equal(ids.includes('dossier-review'), canOpenStaffFile(role.id, 'dossier'), role.id);
    assert.equal(ids.includes('matching-offers'), canOpenStaffFile(role.id, 'requestFile'), role.id);
    // employer / candidate own-screen how-tos are never staff work, whatever files the role opens
    for (const id of ['employer-request', 'employer-browse', 'candidate-register']) assert.equal(ids.includes(id), false, `${role.id} ${id}`);
    assert.equal(ids.includes('staff-invite'), false, role.id);
  }
  for (const guide of GUIDE_CATALOG) {
    if (guide.audiences.includes('staff') && guide.id !== 'staff-login') assert.ok(guide.staffNeeds, `${guide.id} names a need`);
    // only staff-perspective how-tos are open to staff below upper management
    if (guide.perspective !== 'staff') assert.equal(guide.audiences.includes('staff'), false, guide.id);
  }
  assert.equal(isKnownStaffRole('staff'), false);
  assert.equal(isKnownStaffRole('employer'), false);
  assert.equal(isKnownStaffRole('field_officer'), true);
});

test('unknown staff role gets a note; mapNote says who sees what', () => {
  const hub = readFileSync(path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'components/guides/GuidesHub.tsx'), 'utf8');
  assert.ok(hub.includes('!isKnownStaffRole(viewer.roleId)') && hub.includes('{copy.unknownRoleNote}'));
  for (const lang of LOCALES) assert.ok(guidesCopy[lang].unknownRoleNote.trim(), lang);
  assert.match(guidesCopy.tr.mapNote, /Üst Yönetim burada tüm rollerin kartlarını/);
  assert.match(guidesCopy.tr.mapNote, /yalnızca kendi rolünün kartını/);
  assert.match(guidesCopy.en.mapNote, /only their own role card/);
});

test('perspective: each how-to is tagged with whose screen it walks through', () => {
  const perspectives = Object.fromEntries(GUIDE_CATALOG.map((guide) => [guide.id, guide.perspective]));
  assert.deepEqual(perspectives, {
    'staff-login': 'staff',
    'staff-invite': 'staff',
    'dossier-review': 'staff',
    'matching-offers': 'staff',
    'request-to-offer': 'staff',
    'document-request': 'staff',
    'employer-request': 'employer',
    'employer-browse': 'employer',
    'candidate-register': 'candidate',
  });
  // the employer / candidate how-tos describe those portals
  for (const guide of GUIDE_CATALOG) {
    const where = guidesCopy.tr.guides[guide.id].where;
    if (guide.perspective === 'employer') assert.ok(where.startsWith('/employer'), guide.id);
    if (guide.perspective === 'candidate') assert.ok(where.startsWith('/candidate'), guide.id);
  }
  // upper management keeps every how-to
  assert.deepEqual(portalGuideView(guidesCopy.tr, upper).guides.map((guide) => guide.id), GUIDE_CATALOG.map((guide) => guide.id));
});

const STAFF_STEP_ROLES = ['upper_management', 'source_country', 'target_country', 'field_officer'] as const;
const staffActors = (actors: StepActor[]) => actors.filter((actor) => (STAFF_STEP_ROLES as readonly string[]).includes(actor)).sort();
const rolesWhere = (check: (role: string) => boolean) => STAFF_STEP_ROLES.filter(check).slice().sort();
const viewerOf = (roleId: string): PortalViewer => ({ kind: 'staff', upperManagement: roleId === 'upper_management', roleId });
const guideOf = (viewer: PortalViewer, id: string, lang: Language = 'tr') => {
  const guide = portalGuideView(guidesCopy[lang], viewer).guides.find((item) => item.id === id);
  assert.ok(guide, `${viewer.roleId} sees ${id}`);
  return guide!;
};

test('step roles: one entry per step, in every locale', () => {
  for (const [id, actors] of Object.entries(GUIDE_STEP_ACTORS)) {
    assert.ok(GUIDE_CATALOG.some((guide) => guide.id === id && guide.perspective === 'staff'), id);
    for (const lang of LOCALES) assert.equal(guidesCopy[lang].guides[id].steps.length, actors.length, `${lang} ${id}`);
    for (const step of actors) assert.ok(step.length > 0, id);
  }
});

test('step roles match the permission helpers', () => {
  // [guide, step index, roles that may do it according to the app / database helpers]
  const checks: [string, number, string[]][] = [
    ['matching-offers', 3, [...STAFF_DECISION_ROLES].sort()],
    ['matching-offers', 5, [...MEETING_URL_ROLES].sort()],
    // interview and offer: the role list the database checks (not the field officer)
    ['matching-offers', 4, [...INTERVIEW_OFFER_ROLES].sort()],
    ['matching-offers', 6, [...INTERVIEW_OFFER_ROLES].sort()],
    ['request-to-offer', 3, [...INTERVIEW_OFFER_ROLES].sort()],
    ['request-to-offer', 5, [...INTERVIEW_OFFER_ROLES].sort()],
    ['request-to-offer', 4, [...MEETING_URL_ROLES].sort()],
    ['dossier-review', 2, rolesWhere(canUpdateRequestStatus)],
    ['dossier-review', 5, rolesWhere(canManageCandidateVideo)],
    ['document-request', 5, rolesWhere(isUpperManagementRole)],
  ];
  for (const [id, index, roles] of checks) {
    assert.deepEqual(staffActors(GUIDE_STEP_ACTORS[id][index]), roles, `${id} step ${index + 1}`);
  }
  // request-file steps only for roles that open the request file
  for (const id of ['matching-offers', 'request-to-offer']) {
    for (const step of GUIDE_STEP_ACTORS[id]) {
      for (const actor of staffActors(step)) assert.ok(canOpenStaffFile(actor, 'requestFile'), `${id} ${actor}`);
    }
  }
  // dossier steps only for roles that open the dossier
  for (const id of ['dossier-review', 'document-request']) {
    for (const step of GUIDE_STEP_ACTORS[id]) {
      for (const actor of staffActors(step)) assert.ok(canOpenStaffFile(actor, 'dossier'), `${id} ${actor}`);
    }
  }
  // binding a new candidate: not the target-country officer (it only reads candidates already on its requests)
  assert.deepEqual(staffActors(GUIDE_STEP_ACTORS['matching-offers'][1]), ['source_country', 'upper_management']);
  assert.deepEqual(staffActors(GUIDE_STEP_ACTORS['request-to-offer'][1]), ['source_country', 'upper_management']);
});

test('interview and offer writes: field officer, finance and limited are out, in the app and the migration', () => {
  for (const role of ['upper_management', 'source_country', 'target_country']) assert.equal(canWriteInterviewOffer(role), true, role);
  for (const role of ['field_officer', 'finance', 'limited', 'staff', '', null]) assert.equal(canWriteInterviewOffer(role), false, String(role));
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const page = readFileSync(path.join(root, 'app/portal/candidates/[id]/page.tsx'), 'utf8');
  assert.ok(page.includes('canWriteInterviewOffer(staffRole)'));
  assert.match(page, /\{mayWriteInterviewOffer \? \([\s\S]*?ui\.interviewOfferTitle/);
  assert.match(page, /mayWriteInterviewOffer && showIO && candidate && <InterviewOfferPanel/);
  const sql = readFileSync(path.join(root, 'supabase/migrations/20261116120000_interview_offer_write_roles.sql'), 'utf8');
  const roles = `in (${INTERVIEW_OFFER_ROLES.map((role) => `'${role}'`).join(', ')})`;
  assert.equal(sql.split(roles).length - 1, 4, 'four with check clauses use the same role list');
  assert.ok(!/field_officer'\s*[,)]/.test(sql.replace(/--.*$/gm, '')), 'field_officer is not in a role list');
  const rollback = readFileSync(path.join(root, 'supabase/rollback/20261116120000_interview_offer_write_roles_rollback.sql'), 'utf8');
  assert.equal(rollback.includes('current_staff'), false);
});

test('a role does not read the steps it cannot do', () => {
  for (const lang of LOCALES) {
    for (const [id, actors] of Object.entries(GUIDE_STEP_ACTORS)) {
      for (const roleId of STAFF_STEP_ROLES) {
        const viewer = viewerOf(roleId);
        const guide = portalGuideView(guidesCopy[lang], viewer).guides.find((item) => item.id === id);
        if (!guide) continue;
        guide.steps.forEach((step, index) => {
          const source = guidesCopy[lang].guides[id].steps[index];
          const stepActors = actors[index];
          const where = `${lang} ${roleId} ${id} step ${index + 1}`;
          assert.equal(step.title, source.title, where);
          if (roleId === 'upper_management') {
            // nothing is lost for upper management: full text plus who does it
            assert.equal(step.body, source.body, where);
            assert.ok(step.doneBy, where);
            return;
          }
          if (stepActors.includes(roleId)) {
            assert.equal(step.own, true, where);
            assert.equal(step.body, source.body, where);
            assert.equal(step.doneBy, null, where);
          } else if (staffActors(stepActors).length) {
            assert.equal(step.own, false, where);
            assert.equal(step.body, '', where);
            assert.ok(step.doneBy, where);
          } else {
            // the employer / candidate does it: kept for context, with who does it
            assert.equal(step.own, false, where);
            assert.equal(step.body, source.body, where);
            assert.ok(step.doneBy, where);
          }
        });
      }
    }
  }
});

test('source and target country: the matching how-to names who does the other steps', () => {
  const source = guideOf(viewerOf('source_country'), 'matching-offers');
  assert.deepEqual(source.steps.map((step) => step.own), [true, true, true, false, true, false, true]);
  assert.equal(source.steps[3].doneBy, 'Bu adımı Üst Yönetim, Hedef Ülke Sorumlusu yapar.');
  assert.equal(source.steps[5].body, '');
  assert.equal(source.hasOthersSteps, true);

  const target = guideOf(viewerOf('target_country'), 'matching-offers');
  assert.deepEqual(target.steps.map((step) => step.own), [true, false, true, true, true, true, true]);
  assert.equal(target.steps[1].doneBy, 'Bu adımı Üst Yönetim, Kaynak Ülke Sorumlusu yapar.');

  const flow = guideOf(viewerOf('source_country'), 'request-to-offer');
  assert.equal(flow.steps[0].doneBy, 'Bu adımı İşveren yapar.');
  assert.ok(flow.steps[0].body.includes('DEMO Balkan Yapı DOO'));
  assert.equal(flow.steps[4].body, '');

  const field = guideOf(viewerOf('field_officer'), 'document-request');
  assert.equal(field.steps[5].body, '');
  assert.equal(field.steps[2].doneBy, 'Bu adımı Aday yapar.');
  const fieldDossier = guideOf(viewerOf('field_officer'), 'dossier-review');
  assert.equal(fieldDossier.steps[2].body, '');
  assert.equal(fieldDossier.steps[5].body, '');

  const upperView = guideOf(upper, 'matching-offers');
  assert.equal(upperView.hasOthersSteps, false);
  assert.equal(upperView.steps.every((step) => step.own && step.body), true);
  // how-tos without step roles stay as written
  assert.deepEqual(guideOf(viewerOf('source_country'), 'staff-login').steps.map((step) => step.doneBy), [null, null, null, null]);
});

test('print uses the same step rule; a role print shows that role\'s steps', () => {
  for (const roleId of ['source_country', 'target_country', 'field_officer']) {
    const own = portalGuideView(guidesCopy.tr, viewerOf(roleId)).guides;
    assert.deepEqual(guidePrintView(guidesCopy.tr, viewerOf(roleId)).guides, own, roleId);
    assert.deepEqual(guidePrintView(guidesCopy.tr, upper, roleId).guides, own, `upper ?role=${roleId}`);
  }
  assert.deepEqual(guidePrintView(guidesCopy.tr, upper).guides, portalGuideView(guidesCopy.tr, upper).guides);
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const file of ['components/guides/GuidesHub.tsx', 'components/guides/GuidesPrintScreen.tsx']) {
    const source = readFileSync(path.join(root, file), 'utf8');
    assert.ok(source.includes('{step.doneBy}') && source.includes('{copy.stepOthersNote}'), file);
  }
  for (const lang of LOCALES) assert.ok(guidesCopy[lang].stepDoneBy.includes('{roles}'), lang);
});

// ---- Turkish guide names the screens exactly as the Turkish portal does ----

function stringLeaves(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(stringLeaves);
  if (value && typeof value === 'object') return Object.values(value).flatMap(stringLeaves);
  return [];
}
/** Every Turkish text of the portal UI (tab, button, status and message labels). */
const PORTAL_TR = new Set([...stringLeaves(translations.tr), ...stringLeaves(portalUi.tr)].map((text) => text.trim()));
/** Role cards that describe a file page, not a tab; their names are not on a tab bar. */
const FILE_SCREENS = new Set(['source_country.dossier', 'target_country.request', 'target_country.employer', 'field_officer.dossier']);
const guideTextTr = () => [
  guidesCopy.tr.mapNote,
  ...stringLeaves(guidesCopy.tr.roles),
  ...stringLeaves(guidesCopy.tr.guides),
];

test('Turkish role cards use the Turkish portal tab names', () => {
  for (const [roleId, role] of Object.entries(guidesCopy.tr.roles)) {
    for (const [screenId, screen] of Object.entries(role.screens)) {
      if (FILE_SCREENS.has(`${roleId}.${screenId}`)) continue;
      assert.ok(PORTAL_TR.has(screen.name), `${roleId}.${screenId}: "${screen.name}" is not a portal label`);
    }
  }
});

test('Turkish guide text: every "<name> sekmesi" is a portal tab name', () => {
  const mention = /([\p{Lu}][\p{L}]*(?: (?:& )?[\p{Lu}][\p{L}()0-9/]*)*) sekme(?:si|sinde|sini|sinden|sindeki|nizde)\b/gu;
  const found: string[] = [];
  for (const text of guideTextTr()) {
    for (const match of text.matchAll(mention)) {
      const words = match[1].split(' ');
      // a sentence may start right before the name ("Girişte Aday Havuzu sekmesi"): match the longest portal label at the end
      const label = words.map((_, index) => words.slice(index).join(' ')).find((candidate) => PORTAL_TR.has(candidate));
      assert.ok(label, `"${match[0]}" names no portal tab`);
      found.push(label!);
    }
  }
  for (const tab of ['Aday Havuzu', 'Personel Talepleri', 'Ekip & Yetkiler', 'Genel Durum', 'Yeni Talep', 'Mülakatlar', 'Ana Sayfa', 'Belgelerim', 'İş Tekliflerim']) {
    assert.ok(found.includes(tab), `guide mentions the ${tab} tab`);
  }
  // the old short names are gone
  for (const text of guideTextTr()) {
    assert.equal(/(^|[^\p{L}])(Adaylar|Talepler|Personel|Genel bakış|Belgeler|Teklifler|Ana sayfa|Yeni talep|Profil) sekme/u.test(text), false, text);
  }
});

test('Turkish guide text: quoted button, status and message names exist in the portal', () => {
  // quoted text that is not a portal label: a guide title, a typed demo name and a wrong input
  const NOT_LABELS = new Set(['Personel olarak giriş', 'Demo Personel', '1300 euro']);
  const quoted = guideTextTr().flatMap((text) => [...text.matchAll(/"([^"]+)"/g)].map((match) => match[1]));
  assert.ok(quoted.length >= 15, 'the guide quotes the screen labels it names');
  for (const label of quoted) {
    if (NOT_LABELS.has(label)) continue;
    assert.ok(PORTAL_TR.has(label), `"${label}" is not a portal label`);
  }
});

test('Turkish staff role names match the portal badge and role list', () => {
  const t = translations.tr;
  assert.equal(guidesCopy.tr.roleLabels.upper_management, t.roleUpperManagement);
  assert.equal(guidesCopy.tr.roleLabels.source_country, t.roleSourceCountry);
  assert.equal(guidesCopy.tr.roleLabels.target_country, t.roleTargetCountry);
  assert.equal(guidesCopy.tr.roleLabels.field_officer, t.roleFieldOfficer);
});
