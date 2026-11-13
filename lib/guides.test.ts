import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { Language } from './dictionary.ts';
import { GUIDES_PENDING_TRANSLATION, guidesCopy, isPendingTranslation } from './guides-copy.ts';
import { guideNavLabel } from './guides-nav.ts';
import { register } from 'node:module';
import {
  GUIDE_CATALOG,
  GUIDE_ROUTES,
  ROLE_CATALOG,
  audienceAllows,
  guidesHome,
  isKnownStaffRole,
  staffRoleHas,
  portalGuideView,
  type PortalViewer,
} from './guides-model.ts';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);
const { canOpenStaffFile, tabsForStaffRole } = await import('./staffAccess.ts');

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

/** Every string leaf with its path, minus the Turkish text still waiting for translation. */
function translatedLeaves(value: unknown, prefix = ''): [string, string][] {
  if (typeof value === 'string') return isPendingTranslation(prefix) ? [] : [[prefix, value]];
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

test('non-Turkish guide copy does not use Turkish letters (except pending translations)', () => {
  for (const lang of LOCALES) {
    if (lang === 'tr') continue;
    for (const [where, value] of translatedLeaves(guidesCopy[lang])) {
      assert.equal(TURKISH_LETTERS.test(value), false, `${lang}.${where}: ${value}`);
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

test('pending translations show the Turkish text and are listed in the todo file', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const todo = readFileSync(path.join(root, 'docs/guides-translation-todo.md'), 'utf8');
  for (const entry of GUIDES_PENDING_TRANSLATION) {
    assert.ok(todo.includes(`\`${entry}\``), `todo lists ${entry}`);
    const pick = (lang: Language) => entry.split('.').reduce<unknown>((v, key) => (v as Record<string, unknown>)[key], guidesCopy[lang]);
    for (const lang of LOCALES) assert.deepEqual(pick(lang), pick('tr'), `${lang} ${entry}`);
  }
  assert.equal(isPendingTranslation('guides.request-to-offer.steps[0].body'), true);
  assert.equal(isPendingTranslation('guides.staff-login.title'), false);
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
  assert.ok(employerScreens.includes('Yeni talep'));
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
