import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { languages } from './dictionary.ts';

const switcher = readFileSync(new URL('../components/site/LanguageSwitcher.tsx', import.meta.url), 'utf8');
const flagIcon = readFileSync(new URL('../components/site/FlagIcon.tsx', import.meta.url), 'utf8');

test('the switcher shows one short code and does not print the emoji flag', () => {
  assert.equal(/[\u{1F1E6}-\u{1F1FF}]/u.test(switcher), false);
  assert.equal(switcher.includes('.flag'), false);
  assert.equal((switcher.match(/>\{current\.name\}</g) || []).length, 1);
  assert.equal((switcher.match(/>\{lang\.name\}</g) || []).length, 1);
  assert.equal((switcher.match(/>\{lang\.label\}</g) || []).length, 1);
  assert.match(switcher, /aria-label=\{lang\.label\}/);
  assert.match(switcher, /\$\{current\.label\}/);
  assert.equal((switcher.match(/<FlagIcon /g) || []).length, 2);
});

test('each language has one svg flag and its code appears once in the row text', () => {
  assert.deepEqual(languages.map((lang) => lang.name), ['TR', 'GB', 'MK', 'AL', 'SA']);
  for (const lang of languages) {
    const row = `${lang.name} ${lang.label}`;
    assert.equal(row.split(lang.name).length - 1, 1, row);
    assert.equal(row.includes(lang.flag), false);
    const file = new URL(`../public/flags/${lang.name.toLowerCase()}.svg`, import.meta.url);
    assert.equal(existsSync(file), true, lang.name);
    assert.match(flagIcon, new RegExp(`${lang.name}: '/flags/${lang.name.toLowerCase()}\\.svg'`));
  }
});
