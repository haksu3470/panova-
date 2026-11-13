import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { Language } from './dictionary.ts';
import { guidesCopy } from './guides-copy.ts';
import {
  GUIDES_PRINT_PATH,
  ROLE_CATALOG,
  guidePrintView,
  guidesPrintHref,
  portalGuideView,
  printButtonLabel,
  type PortalViewer,
} from './guides-model.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES: Language[] = ['tr', 'en', 'sq', 'ar', 'mk'];
const copy = guidesCopy.tr;

const upper: PortalViewer = { kind: 'staff', upperManagement: true, roleId: 'upper_management' };
const source: PortalViewer = { kind: 'staff', upperManagement: false, roleId: 'source_country' };
const unknownStaff: PortalViewer = { kind: 'staff', upperManagement: false, roleId: 'staff' };
const employer: PortalViewer = { kind: 'employer', upperManagement: false, roleId: 'employer' };
const candidate: PortalViewer = { kind: 'candidate', upperManagement: false, roleId: 'candidate' };
const unlinked: PortalViewer = { kind: 'unlinked', upperManagement: false, roleId: 'unlinked' };

const roleIds = (v: { roles: { id: string }[] }) => v.roles.map((r) => r.id);
const guideIds = (v: { guides: { id: string }[] }) => v.guides.map((g) => g.id);

function assertSubsetOfGuides(viewer: PortalViewer, role?: string) {
  const base = portalGuideView(copy, viewer);
  const print = guidePrintView(copy, viewer, role);
  for (const id of roleIds(print)) assert.ok(roleIds(base).includes(id), `role ${id} not open on /guides`);
  for (const id of guideIds(print)) assert.ok(guideIds(base).includes(id), `guide ${id} not open on /guides`);
}

test('upper management prints every role and every how-to', () => {
  const view = guidePrintView(copy, upper);
  assert.equal(view.scope, 'all');
  assert.deepEqual(roleIds(view), ROLE_CATALOG.map((r) => r.id));
  assert.deepEqual(guideIds(view), guideIds(portalGuideView(copy, upper)));
  assert.ok(guideIds(view).includes('staff-invite'));
});

test('?role= narrows upper management to one role and that role\'s how-tos', () => {
  const emp = guidePrintView(copy, upper, 'employer');
  assert.equal(emp.scope, 'role');
  assert.equal(emp.roleId, 'employer');
  assert.deepEqual(roleIds(emp), ['employer']);
  assert.deepEqual(guideIds(emp), ['employer-request', 'employer-browse']);

  const cand = guidePrintView(copy, upper, 'candidate');
  assert.deepEqual(guideIds(cand), ['candidate-register']);

  const field = guidePrintView(copy, upper, 'field_officer');
  assert.deepEqual(roleIds(field), ['field_officer']);
  assert.equal(guideIds(field).includes('staff-invite'), false, 'invite is upper management only');
  assert.ok(guideIds(field).includes('dossier-review'));

  const um = guidePrintView(copy, upper, 'upper_management');
  assert.ok(guideIds(um).includes('staff-invite'));

  for (const bad of ['nope', '', null, undefined, '__proto__']) {
    const view = guidePrintView(copy, upper, bad as string | null | undefined);
    assert.equal(view.scope, 'all', String(bad));
    assert.equal(view.roles.length, ROLE_CATALOG.length);
  }
});

test('other staff print only their own card; ?role= is ignored', () => {
  const view = guidePrintView(copy, source);
  assert.equal(view.scope, 'own');
  assert.deepEqual(roleIds(view), ['source_country']);
  assert.equal(guideIds(view).includes('staff-invite'), false);
  assert.ok(guideIds(view).includes('dossier-review'));
  assert.deepEqual(guidePrintView(copy, source, 'upper_management'), view);
  assert.deepEqual(guidePrintView(copy, source, 'employer'), view);
  // unknown staff role falls back to what /guides shows staff
  assert.deepEqual(roleIds(guidePrintView(copy, unknownStaff)), roleIds(portalGuideView(copy, unknownStaff)));
});

test('employer and candidate print only their own role', () => {
  const emp = guidePrintView(copy, employer, 'upper_management');
  assert.deepEqual(roleIds(emp), ['employer']);
  assert.deepEqual(guideIds(emp), ['employer-request', 'employer-browse']);
  const cand = guidePrintView(copy, candidate, 'employer');
  assert.deepEqual(roleIds(cand), ['candidate']);
  assert.deepEqual(guideIds(cand), ['candidate-register']);
  const none = guidePrintView(copy, unlinked, 'employer');
  assert.deepEqual([none.roles, none.guides], [[], []]);
});

test('the print view never opens more than /guides', () => {
  for (const viewer of [upper, source, unknownStaff, employer, candidate, unlinked]) {
    for (const role of [undefined, ...ROLE_CATALOG.map((r) => r.id)]) assertSubsetOfGuides(viewer, role);
  }
});

test('button label and link', () => {
  assert.equal(printButtonLabel(copy, upper), 'Tüm roller');
  assert.equal(printButtonLabel(copy, source), 'Kendi kılavuzum');
  assert.equal(printButtonLabel(copy, employer), 'Kendi kılavuzum');
  assert.equal(guidesPrintHref(upper), GUIDES_PRINT_PATH);
  assert.equal(guidesPrintHref(upper, 'field_officer'), '/guides/print?role=field_officer');
  assert.equal(guidesPrintHref(source, 'upper_management'), GUIDES_PRINT_PATH);
  assert.equal(guidesPrintHref(employer, 'candidate'), GUIDES_PRINT_PATH);
});

test('print texts exist in every locale', () => {
  const keys = Object.keys(guidesCopy.tr.print);
  for (const lang of LOCALES) {
    assert.deepEqual(Object.keys(guidesCopy[lang].print), keys, lang);
    for (const key of keys) assert.ok((guidesCopy[lang].print as Record<string, string>)[key].trim(), `${lang}.${key}`);
    if (lang !== 'tr') assert.notEqual(guidesCopy[lang].print.ownGuide, guidesCopy.tr.print.ownGuide, lang);
  }
  assert.equal(guidesCopy.tr.print.coverSubtitle, 'Panova Group Kullanım Kılavuzu');
});

test('print page: shared session rule, print css, page breaks and hidden toolbar', () => {
  assert.ok(existsSync(path.join(ROOT, 'app/guides/print/page.tsx')));
  const screen = readFileSync(path.join(ROOT, 'components/guides/GuidesPrintScreen.tsx'), 'utf8');
  const hub = readFileSync(path.join(ROOT, 'components/guides/GuidesScreen.tsx'), 'utf8');
  for (const file of [screen, hub]) assert.ok(file.includes('useGuidesViewer()'), 'same session check');
  assert.equal(/resolvePortalViewer|supabase/.test(screen), false, 'no second access path');
  assert.ok(screen.includes('guidePrintView(copy, viewer, requestedRole)'));
  assert.ok(screen.includes("router.replace('/guides')"));
  assert.ok(screen.includes('window.print()'));
  assert.match(screen, /@media print/);
  assert.match(screen, /@page/);
  assert.match(screen, /counter\(page\)/);
  assert.match(screen, /break-before: page/);
  assert.match(screen, /break-inside: avoid/);
  assert.match(screen, /\[data-print-hide\] \{ display: none !important; \}/);
  assert.ok(screen.includes('{copy.exampleLabel}') && screen.includes('{guide.example}'));
  assert.ok(screen.includes("dir={isRtl ? 'rtl' : 'ltr'}"));
  assert.ok(hub.includes('guidesPrintHref(viewer)') && hub.includes('printButtonLabel(copy, viewer)'));
});
