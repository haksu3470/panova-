import assert from 'node:assert/strict';
import test from 'node:test';
import { contentSecurityPolicy, securityHeaders } from './securityHeaders.ts';

test('security headers frame-bust, type-sniff, and keep the integrations the site uses', () => {
  const headers = Object.fromEntries(securityHeaders().map((header) => [header.key, header.value]));
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.match(headers['Strict-Transport-Security'], /max-age=/);
  assert.equal(headers['Access-Control-Allow-Origin'], undefined);

  const csp = contentSecurityPolicy();
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src blob:;/); // staff PDF preview only (lib/documentPreview.test.ts)
  assert.match(csp, /https:\/\/\*\.supabase\.co/);
  assert.match(csp, /wss:\/\/\*\.supabase\.co/);
  assert.match(csp, /https:\/\/accounts\.google\.com/);
  assert.match(csp, /https:\/\/www\.youtube\.com/);
  assert.match(csp, /https:\/\/www\.youtube-nocookie\.com/);
  assert.match(csp, /https:\/\/va\.vercel-scripts\.com/);
  assert.doesNotMatch(csp, /default-src \*/);
  assert.doesNotMatch(csp, /unsafe-eval/);
});
