import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), 'utf8');

/** Page headers that use the shared component. */
const HEADER_FILES = {
  portal: '../app/portal/page.tsx',
  dossier: '../app/portal/candidates/[id]/page.tsx',
  request: '../app/portal/requests/[id]/page.tsx',
  employerFile: '../app/portal/employers/[id]/page.tsx',
  employer: '../app/employer/page.tsx',
  candidate: '../app/candidate/page.tsx',
  guides: '../components/guides/GuidesScreen.tsx',
  employerLogin: '../app/employer-login/page.tsx',
  reset: '../components/auth/ResetPasswordScreen.tsx',
  kvkk: '../components/home/KvkkView.tsx',
  admin: '../app/admin/page.tsx',
  supplier: '../app/supplier/page.tsx',
} as const;

/** Signed-in screens: the header ends with "log out". */
const SIGNED_IN = ['portal', 'dossier', 'request', 'employerFile', 'employer', 'candidate'] as const;

test('shared header keeps the order: extras, language, home, log out', () => {
  const header = source('../components/site/PageHeader.tsx');
  const body = header.slice(header.indexOf('export function HeaderActions'));
  const order = ['{extra}', '<LanguageSwitcher', '<Link href={homeHref}', 'onClick={() => void onLogout()}'].map((part) => body.indexOf(part));
  assert.ok(order.every((index) => index > 0), String(order));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.match(body, /flex-wrap/, 'buttons wrap to a new row on small screens');
  assert.match(body, /rtl:rotate-180/, 'arrow turns in Arabic');
  const jsx = body.slice(body.indexOf('return ('), body.indexOf(');\n}') > 0 ? body.indexOf(');\n}') : body.indexOf(');\r\n}'));
  assert.ok(jsx.length > 100);
  assert.equal(/>\s*[A-Za-zÇĞİÖŞÜçğıöşü][^<{]*</.test(jsx), false, 'no fixed text; labels come from the page copy');
});

test('every page header uses the shared component, not its own buttons', () => {
  for (const [name, file] of Object.entries(HEADER_FILES)) {
    const text = source(file);
    assert.match(text, /<HeaderActions/, name);
    assert.match(text, /<PageHeader/, name);
    assert.equal(text.includes("from '@/components/site/LanguageSwitcher'"), false, `${name}: language switcher comes from HeaderActions`);
  }
});

test('signed-in pages pass log out; sign-in pages do not', () => {
  for (const name of SIGNED_IN) {
    assert.match(source(HEADER_FILES[name]), /onLogout=\{/, name);
  }
  for (const name of ['employerLogin', 'reset', 'kvkk', 'admin', 'supplier'] as const) {
    assert.equal(/onLogout=\{/.test(source(HEADER_FILES[name])), false, name);
  }
  // same logout behaviour as before
  assert.match(source(HEADER_FILES.portal), /onLogout=\{handleLogout\}/);
  assert.match(source(HEADER_FILES.employer), /onLogout=\{handleLogout\}/);
  assert.match(source(HEADER_FILES.candidate), /onLogout=\{handleLogout\}/);
  const staffLogout = source('./staffLogout.ts');
  assert.match(staffLogout, /await signOut\(\);\s*window\.location\.href = '\/portal';/);
});

test('user labels sit on the start side; page buttons go before the standard three', () => {
  for (const name of ['portal', 'employer'] as const) {
    const text = source(HEADER_FILES[name]);
    const user = text.indexOf('data-header-user');
    assert.ok(user > 0, name);
    const headerStart = text.lastIndexOf('<PageHeader', user);
    assert.ok(headerStart > 0, `${name}: user label is inside a PageHeader`);
    assert.equal(text.slice(headerStart, user).includes('actions={'), false, `${name}: user label is in start, not in actions`);
    assert.ok(text.indexOf('actions={', user) > user, name);
  }
  assert.match(source(HEADER_FILES.employer), /extra=\{[^]*?returnToAdmin/);
  for (const name of ['dossier', 'request', 'employerFile'] as const) {
    const text = source(HEADER_FILES[name]);
    const extra = text.slice(text.indexOf('extra={'));
    assert.ok(extra.indexOf('href="/portal"') > 0, `${name}: back to portal is an extra`);
    assert.ok(/saveChanges|saveBtn/.test(extra.slice(0, 1500)), `${name}: save is an extra`);
  }
  const guides = source(HEADER_FILES.guides);
  assert.ok(guides.indexOf('guidesPrintHref(viewer)') > guides.indexOf('extra={'));
});

test('print page toolbar is untouched and still hidden in print', () => {
  const print = source('../components/guides/GuidesPrintScreen.tsx');
  assert.match(print, /\[data-print-hide\] \{ display: none !important; \}/);
  assert.match(print, /<div data-print-hide/);
  assert.equal(print.includes('<HeaderActions'), false);
});
