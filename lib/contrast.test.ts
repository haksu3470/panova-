import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { REQUIRED_PAIRS, auditSource, classWorlds, contrastRatio, parsePalette } from './contrast.ts';

const root = join(import.meta.dirname, '..');
const palette = parsePalette(
  `${readFileSync(join(root, 'node_modules/tailwindcss/theme.css'), 'utf8')}\n${readFileSync(join(root, 'app/globals.css'), 'utf8')}`,
);

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name === 'scripts') continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, out);
    else if (/\.(tsx|css)$/.test(name)) out.push(path);
  }
}

test('design tokens meet WCAG AA on their surfaces', () => {
  for (const [fg, bg] of REQUIRED_PAIRS) {
    const foreground = palette.get(fg);
    const background = palette.get(bg);
    assert.ok(foreground, `missing --color-${fg}`);
    assert.ok(background, `missing --color-${bg}`);
    const ratio = contrastRatio(foreground, background);
    assert.ok(ratio >= 4.5, `${fg} on ${bg} is ${ratio.toFixed(2)}:1`);
  }
});

test('the site stays on one light color scheme', () => {
  const files: string[] = [];
  walk(join(root, 'app'), files);
  walk(join(root, 'components'), files);
  for (const path of files.filter((file) => file.endsWith('.css'))) {
    const css = readFileSync(path, 'utf8');
    assert.equal(/@media\s*\(\s*prefers-color-scheme/.test(css), false, relative(root, path));
  }
  const globals = readFileSync(join(root, 'app/globals.css'), 'utf8');
  assert.match(globals, /color-scheme:\s*light/);
  assert.match(globals, /--color-muted-foreground:/);
  assert.match(globals, /--color-on-dark-muted:/);
  assert.match(globals, /--font-sans:/);
});

test('template branches keep the static background', () => {
  const worlds = classWorlds("{`min-h bg-slate-950 ${isRtl ? 'rtl' : 'ltr'} text-on-dark`}");
  assert.ok(worlds.every((world) => world.includes('bg-slate-950') && world.includes('text-on-dark')));
  assert.equal(worlds.length, 2);
});

test('slate-400 text on a white card is rejected', () => {
  const findings = auditSource(
    'fixture.tsx',
    'export function T(){ return <section className="bg-white"><p className="text-xs text-slate-400">Açık kayıt yok</p></section> }',
    palette,
  );
  assert.ok(findings.some((finding) => finding.message.includes('slate-400')));
});

test('semantic muted text and dark-panel text pass', () => {
  const source = `
    export function T(){
      return <footer className="bg-slate-950 text-on-dark-muted">
        <a className="hover:text-on-dark" href="/">mail</a>
        <p className="text-sm text-on-dark">PANOVA</p>
        <section className="bg-card text-foreground">
          <p className="text-xs text-muted-foreground">Sonuç bekleniyor</p>
        </section>
      </footer>
    }
  `;
  assert.deepEqual(auditSource('fixture.tsx', source, palette), []);
});

test('disabled opacity and emerald-600 button text are rejected when they miss AA', () => {
  const faded = auditSource(
    'fixture.tsx',
    'export function T(){ return <button className="bg-brand-solid text-on-dark disabled:opacity-60">Kaydet</button> }',
    palette,
  );
  assert.ok(faded.some((finding) => finding.message.includes('opacity-60')));
  const emerald = auditSource(
    'fixture.tsx',
    'export function T(){ return <button className="bg-emerald-600 text-white text-xs font-bold">Sekme</button> }',
    palette,
  );
  assert.ok(emerald.some((finding) => finding.message.includes('below')));
});

test('UI source meets WCAG AA and the text scale', () => {
  const files: string[] = [];
  walk(join(root, 'app'), files);
  walk(join(root, 'components'), files);
  const findings = files
    .filter((file) => file.endsWith('.tsx'))
    .flatMap((file) => auditSource(relative(root, file), readFileSync(file, 'utf8'), palette));
  assert.deepEqual(
    findings,
    [],
    findings.map((finding) => `${finding.file}:${finding.line} ${finding.message} [${finding.classes}]`).join('\n'),
  );
});
