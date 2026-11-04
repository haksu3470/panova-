import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { Language } from './dictionary.ts';
import { guidesCopy } from './guides-copy.ts';
import { guideNavLabel } from './guides-nav.ts';
import {
  GUIDE_CATALOG,
  GUIDE_ROUTES,
  ROLE_CATALOG,
  audienceAllows,
  guidesHome,
  portalGuideView,
  type PortalViewer,
} from './guides-model.ts';

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

test('non-Turkish guide copy does not use Turkish letters', () => {
  function visit(value: unknown) {
    if (typeof value === 'string') {
      assert.equal(TURKISH_LETTERS.test(value), false, value);
      return;
    }
    if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === 'object') Object.values(value).forEach(visit);
  }
  for (const lang of LOCALES) {
    if (lang === 'tr') continue;
    visit(guidesCopy[lang]);
  }
});

test('Arabic and Macedonian guide copy is in those scripts', () => {
  function visit(value: unknown, script: RegExp) {
    if (typeof value === 'string') {
      if (PATH_ONLY.test(value)) return;
      assert.equal(script.test(value), true, value);
      return;
    }
    if (Array.isArray(value)) value.forEach((item) => visit(item, script));
    else if (value && typeof value === 'object') Object.values(value).forEach((item) => visit(item, script));
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
  assert.equal(ids(staff).includes('employer-request'), true);
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

  const hidden = portalGuideView(guidesCopy.en, staff).roles.find((role) => role.id === 'upper_management');
  const hiddenStaff = hidden?.screens.find((screen) => screen.id === 'staff');
  assert.equal((hiddenStaff?.does || '').includes('Invite'), false);
  assert.match(hiddenStaff?.does || '', /Only upper management/);

  assert.equal(guidesHome(staff), '/portal');
  assert.equal(guidesHome(employer), '/employer');
  assert.equal(guidesHome(candidate), '/candidate');
  assert.equal(guidesHome(unlinked), '/');
  assert.equal(guidesHome(null), '/');
});
