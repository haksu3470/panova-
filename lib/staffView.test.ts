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

test('candidate portal in staff view: permission check, no account linking, read only, no sign-out', () => {
  const page = readFileSync(join(import.meta.dirname, '..', 'app/candidate/page.tsx'), 'utf8');
  assert.ok(page.includes('staffViewCandidateId(window.location.search)'));
  assert.ok(/viewAs && await canViewCandidatePortal\(\)/.test(page), 'the per-staff permission is checked before the staff view loads');
  assert.ok(page.includes('<fieldset disabled={staffView}'), 'profile, overview and support are read only');
  // documents and offers stay outside the fieldset so viewing and printing work; their writes are hidden and blocked
  assert.ok(page.includes("{offer.status === 'pending' && !staffView && ("), 'no Accept / Reject in staff view');
  assert.ok(/\{!staffView && \(\s*<FilePicker/.test(page), 'no document upload in staff view');
  assert.equal((page.match(/if \(staffView\) return;/g) || []).length >= 2, true, 'offer answers and uploads are blocked in code too');
  assert.ok(page.includes('onLogout={staffView ? backToStaffFile : handleLogout}'), 'staff are never signed out from here');
});
