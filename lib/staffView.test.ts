import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { candidatePortalViewHref, staffViewCandidateId } from './staffView.ts';

const id = '7c0e1000-2026-1113-0003-000000000002';

test('staff view id: a UUID from ?as=, nothing else', () => {
  assert.equal(staffViewCandidateId(`?as=${id}`), id);
  assert.equal(staffViewCandidateId(`as=${id}&x=1`), id);
  assert.equal(staffViewCandidateId('?as=abc'), null);
  assert.equal(staffViewCandidateId(''), null);
  assert.equal(staffViewCandidateId(candidatePortalViewHref(id).split('?')[1]), id);
});

test('candidate portal in staff view: staff check, no account linking, read only, no sign-out', () => {
  const page = readFileSync(join(import.meta.dirname, '..', 'app/candidate/page.tsx'), 'utf8');
  assert.ok(page.includes('staffViewCandidateId(window.location.search)'));
  assert.ok(/viewAs && await isStaff\(\)/.test(page), 'is_staff() is checked before the staff view loads');
  assert.ok(page.includes('<fieldset disabled={staffView}'), 'tab content is read only');
  assert.ok(/if \(staffView\) return;[\s\S]{0,40}\n/.test(page), 'offer answers are blocked in staff view');
  assert.ok(page.includes('onLogout={staffView ? backToStaffFile : handleLogout}'), 'staff are never signed out from here');
});
