import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { GUIDE_CATALOG } from './guides-model.ts';

function source(relative: string): string {
  return readFileSync(new URL(relative, import.meta.url), 'utf8');
}

const HOW_TOS = [
  'staff-login',
  'staff-invite',
  'dossier-review',
  'matching-offers',
  'employer-request',
  'employer-browse',
  'candidate-register',
] as const;

test('each sign-in screen opens forgot-password for its own audience', () => {
  const candidate = source('../app/candidate/page.tsx');
  const employer = source('../app/employer-login/page.tsx');
  const portal = source('../app/portal/page.tsx');

  assert.match(candidate, /ForgotPasswordLink/);
  assert.match(candidate, /audience="candidate"/);
  assert.match(employer, /ForgotPasswordLink/);
  assert.match(employer, /audience="employer"/);
  assert.match(portal, /ForgotPasswordLink/);
  assert.match(portal, /audience="portal"/);
});

test('signed-in staff, employer, and candidate screens can sign out and open guides', () => {
  for (const file of [
    '../app/portal/page.tsx',
    '../app/employer/page.tsx',
    '../app/candidate/page.tsx',
  ]) {
    const text = source(file);
    assert.match(text, /signOut\(/, file);
    assert.match(text, /href="\/guides"/, file);
  }
  assert.match(source('../app/guides/page.tsx'), /GuidesScreen/);
});

test('candidates read YouTube links and only the dossier writes them', () => {
  const candidate = source('../app/candidate/page.tsx');
  const dossier = source('../app/portal/candidates/[id]/page.tsx');
  assert.equal(candidate.includes('candidateVideoWrite'), false);
  assert.match(candidate, /<CandidateYouTube/);
  assert.match(dossier, /candidateVideoWrite\(/);
  assert.match(dossier, /can_manage_candidate_video/);
});

test('the QA runbook names every in-app how-to and the manual entry routes', () => {
  const doc = source('../docs/portal-qa.md');
  assert.deepEqual(GUIDE_CATALOG.map((guide) => guide.id), [...HOW_TOS]);
  for (const id of HOW_TOS) assert.equal(doc.includes(id), true, id);
  for (const route of ['/portal', '/candidate', '/employer-login', '/employer', '/guides', '/auth/reset-password']) {
    assert.equal(doc.includes(route), true, route);
  }
});
