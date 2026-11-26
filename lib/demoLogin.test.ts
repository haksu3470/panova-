import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { register } from 'node:module';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);
const { demoLoginLabels, demoLoginRedirect, isDemoLoginKind } = await import('./demoLogin.ts');

test('magic link lands on the live site or a preview of this project, never elsewhere', () => {
  assert.equal(demoLoginRedirect('https://panovagroup.org', '/candidate'), 'https://panovagroup.org/candidate');
  assert.equal(
    demoLoginRedirect('https://panova-git-claude-peaceful-volta-v8sxq0-haksu3470.vercel.app', '/portal'),
    'https://panova-git-claude-peaceful-volta-v8sxq0-haksu3470.vercel.app/portal',
  );
  assert.equal(demoLoginRedirect('https://evil.example', '/candidate'), 'https://panovagroup.org/candidate');
  assert.equal(demoLoginRedirect('https://panova-git-x-other.vercel.app', '/employer'), 'https://panovagroup.org/employer');
  assert.equal(demoLoginRedirect(null, '//evil.example'), 'https://panovagroup.org/');
});

test('kinds and labels', () => {
  assert.equal(isDemoLoginKind('candidate'), true);
  assert.equal(isDemoLoginKind('admin'), false);
  for (const [lang, l] of Object.entries(demoLoginLabels)) {
    for (const v of Object.values(l)) assert.ok(v, lang);
  }
});

test('the route checks rights in the database before using the service role', () => {
  const route = readFileSync(join(import.meta.dirname, '..', 'app/api/demo-login/route.ts'), 'utf8');
  const rpc = route.indexOf("rpc('prepare_demo_login'");
  const admin = route.indexOf('createClient(validUrl, serviceKey');
  assert.ok(rpc > 0 && admin > rpc, 'prepare_demo_login runs first, with the caller token');
  assert.ok(route.includes(".eq('is_demo', true)") && route.includes(".is('auth_user_id', null)"), 'only an unlinked demo candidate is linked');
});
