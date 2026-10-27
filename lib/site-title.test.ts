import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
const kvkk = readFileSync(new URL('../app/kvkk/page.tsx', import.meta.url), 'utf8');

test('the browser title is the Panova Group brand, not the registry name', () => {
  assert.match(layout, /default: "Panova Group"/);
  assert.match(layout, /template: "%s \| Panova Group"/);
  assert.match(layout, /openGraph: \{[\s\S]*title: "Panova Group"/);
  assert.match(layout, /twitter: \{[\s\S]*title: "Panova Group"/);
  assert.equal(layout.includes('PANOVA TARIM DOO Struga'), false);
  assert.match(kvkk, /title: 'KVKK Aydınlatma Metni',/);
  assert.equal((kvkk.match(/title: 'KVKK Aydınlatma Metni \| Panova Group'/g) || []).length, 2);
  assert.match(kvkk, /PANOVA TARIM DOO Struga/);
});
