import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { SITE_ORIGIN, siteUrl } from './siteUrl.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

test('siteUrl builds absolute panovagroup.org addresses', () => {
  assert.equal(SITE_ORIGIN, 'https://panovagroup.org');
  assert.equal(siteUrl(), 'https://panovagroup.org/');
  assert.equal(siteUrl('/'), 'https://panovagroup.org/');
  assert.equal(siteUrl('/kvkk'), 'https://panovagroup.org/kvkk');
  assert.equal(siteUrl('guides'), 'https://panovagroup.org/guides');
});

test('robots.ts allows public pages and blocks portals', () => {
  const source = read('app/robots.ts');
  assert.match(source, /allow: \['\/', '\/kvkk', '\/guides'\]/);
  for (const path of ['/api/', '/portal', '/admin', '/candidate', '/employer', '/auth/']) {
    assert.ok(source.includes(`'${path}'`) || source.includes(`"${path}"`), path);
  }
  assert.match(source, /sitemap: `\$\{SITE_ORIGIN\}\/sitemap\.xml`/);
});

test('sitemap.ts lists only the public marketing pages', () => {
  const source = read('app/sitemap.ts');
  assert.match(source, /siteUrl\('\/'\)/);
  assert.match(source, /siteUrl\('\/kvkk'\)/);
  assert.match(source, /siteUrl\('\/guides'\)/);
  assert.equal(source.includes('/portal'), false);
  assert.equal(source.includes('/candidate'), false);
});
