import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { register } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import type { Language } from './dictionary.ts';

await register(new URL('./test-resolve-hook.mjs', import.meta.url), import.meta.url);

const { homeCopy } = await import('./home-copy');
const { homeExtraCopy, SECTOR_EXAMPLES } = await import('./home-extra-copy');
const { professionByKey, professionLabel } = await import('./professions');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');
const LANGS: Language[] = ['tr', 'en', 'sq', 'ar', 'mk'];

function sourceFiles(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(join(root, path)).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !name.endsWith('.test.ts') ? [path] : [];
  });
}

test('the sign-in menu holds the candidate, employer and staff links', () => {
  const menu = read('components/home/LoginMenu.tsx');
  for (const href of ['/candidate', '/employer-login', '/portal']) {
    assert.ok(menu.includes(`href: '${href}'`), `LoginMenu is missing ${href}`);
  }
  assert.match(menu, /aria-haspopup="menu"/);
  assert.match(menu, /aria-expanded=\{open\}/);
  assert.match(menu, /role="menuitem"/);
  assert.match(menu, /'Escape'/);
  for (const lang of LANGS) {
    const login = homeExtraCopy[lang].login;
    for (const key of ['label', 'candidate', 'employer', 'staff'] as const) {
      assert.ok(login[key].trim(), `${lang}.login.${key} is empty`);
    }
  }
});

test('the home header uses one language switcher and the sign-in menu', () => {
  const page = read('app/page.tsx');
  assert.equal(page.match(/<LanguageSwitcher\b/g)?.length, 1);
  assert.match(page, /<LoginMenu labels=\{x\.login\}/);
  assert.equal(page.includes('t.candidatePortalBtn'), false);
  assert.equal(page.includes('t.portalLogin'), false);
});

test('the reference-employer placeholder is gone', () => {
  const files = [...sourceFiles('app'), ...sourceFiles('components'), ...sourceFiles('lib')];
  for (const file of files) {
    const text = read(file);
    assert.equal(text.includes('logolar izinleri alındıktan sonra'), false, file);
    assert.equal(text.includes('partnersNote'), false, file);
  }
});

test('new home texts exist in all five languages', () => {
  const shape = (value: unknown, path = ''): string[] => {
    if (typeof value === 'string') return [path];
    if (Array.isArray(value)) return value.flatMap((item, index) => shape(item, `${path}[${index}]`));
    if (value && typeof value === 'object') {
      return Object.entries(value).flatMap(([key, item]) => shape(item, path ? `${path}.${key}` : key));
    }
    return [`${path}:${typeof value}`];
  };
  const trKeys = shape(homeExtraCopy.tr);
  for (const lang of LANGS) {
    const copy = homeExtraCopy[lang];
    assert.deepEqual(shape(copy), trKeys, `${lang} keys differ from tr`);
    const strings: string[] = [];
    const collect = (value: unknown) => {
      if (typeof value === 'string') strings.push(value);
      else if (value && typeof value === 'object') Object.values(value).forEach(collect);
    };
    collect(copy);
    assert.ok(strings.every((value) => value.trim().length > 0), `${lang} has an empty text`);
    assert.equal(copy.sectorCards.length, homeCopy[lang].sectorNames.length, `${lang} sector cards`);
    assert.equal(copy.hero.flow.length, 4);
    assert.ok(copy.registryDesc.includes('{embs}') && copy.registryDesc.includes('{vkn}'), `${lang} registryDesc placeholders`);
  }
});

test('sector examples are catalog professions named in every language', () => {
  assert.equal(SECTOR_EXAMPLES.length, homeCopy.tr.sectorNames.length);
  for (const keys of SECTOR_EXAMPLES) {
    for (const key of keys) {
      assert.ok(professionByKey(key), `unknown profession ${key}`);
      for (const lang of LANGS) assert.ok(professionLabel(key, lang), `${key} has no ${lang} label`);
    }
  }
});

test('the sectors stat counts the sectors listed on the page', () => {
  for (const lang of LANGS) {
    const stat = homeCopy[lang].stats[2];
    assert.equal(stat.value, String(homeCopy[lang].sectorNames.length));
  }
});

test('the hero map shows the office countries from lib/company.ts', async () => {
  const { company } = await import('./company');
  const visual = read('components/home/HeroVisual.tsx');
  const pointCities = [...visual.matchAll(/^  (\w+): \{$/gm)].map((match) => match[1]).sort();
  const officeCities = company.presence.map((place) => place.city).sort();
  assert.deepEqual(pointCities, officeCities, 'HERO_MAP_POINTS must have exactly the office cities');

  // the page feeds the drawing from company.presence and the matching country names
  const page = read('app/page.tsx');
  assert.match(page, /registry\.presence\.map\(\(place, i\) => \(\{ city: place\.city, country: h\.about\.countries\[i\] \}\)\)/);
  assert.match(page, /places=\{heroPlaces\}/);
  assert.equal(page.includes('EUROPEAN_COUNTRIES'), false);
  company.presence.forEach((place, i) => assert.equal(homeCopy.tr.about.countries[i], place.country));
  for (const lang of LANGS) {
    assert.equal(homeCopy[lang].about.countries.length, company.presence.length);
    for (const name of homeCopy[lang].about.countries) {
      assert.ok(homeExtraCopy[lang].hero.mapLabel.includes(name), `${lang}.hero.mapLabel should name ${name}`);
    }
  }
});

test('Albania is not on the home map', () => {
  const albania = /Arnavutluk|Albania|Shqipëri|ألبانيا|Албанија/;
  for (const file of ['components/home/HeroVisual.tsx', 'lib/home-extra-copy.ts', 'app/page.tsx']) {
    assert.equal(albania.test(read(file)), false, file);
  }
});

test('motion is opt-in and reduced motion stays static', () => {
  const css = read('app/globals.css');
  assert.match(css, /\.home-motion \.home-reveal:not\(\[data-visible\]\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.equal(/^\.home-reveal[^{]*\{[^}]*opacity:\s*0/m.test(css), false, 'reveal must not hide without .home-motion');
  const motion = read('components/home/HomeMotion.tsx');
  assert.match(motion, /prefers-reduced-motion: reduce/);
  assert.match(motion, /aria-hidden="true"/);
  assert.match(motion, /className="sr-only"/);
});

test('office phones: one source, same spaced international style, tel: without spaces', async () => {
  const { company, formatPhoneDisplay, turkeyOfficePhone } = await import('./company');
  assert.equal(formatPhoneDisplay('+905453644930'), '+90 545 364 49 30');
  assert.equal(formatPhoneDisplay('+38970385792'), '+389 70 385 792');
  assert.equal(formatPhoneDisplay('+8801805511473'), '+880 1805 511473');
  assert.equal(formatPhoneDisplay('+4912'), '+4912', 'unknown numbers stay as written');
  const phones = [...company.phones, company.turkey.phone, company.bangladesh.phone];
  for (const phone of phones) {
    assert.match(phone.tel, /^\+\d+$/, phone.tel);
    assert.match(phone.display, /^\+\d{2,3}( \d+)+$/, phone.display);
    assert.equal(phone.display.replaceAll(' ', ''), phone.tel);
  }
  assert.equal(company.turkey.phone.tel, turkeyOfficePhone);
  // no screen writes an office number by hand
  const files = [...sourceFiles('app'), ...sourceFiles('components'), ...sourceFiles('lib')].filter((file) => !file.endsWith('company.ts'));
  for (const file of files) {
    const text = read(file);
    for (const phone of phones) {
      assert.equal(text.includes(phone.tel) || text.includes(phone.display), false, `${file} hard-codes ${phone.display}`);
    }
  }
});

test('stats cards fit on phones and the page never scrolls sideways', () => {
  const sections = read('components/home/HomeSections.tsx');
  assert.match(sections, /flex h-full min-w-0 flex-col items-start gap-2[^"]*sm:flex-row/);
  assert.match(sections, /text-\[clamp\(1\.25rem,6vw,1\.875rem\)\][^"]*whitespace-nowrap/);
  assert.match(sections, /\[overflow-wrap:anywhere\]">\{s\.label\}/);
  assert.match(read('app/page.tsx'), /min-h-screen overflow-x-clip/);
});

test('every map label sits the same distance under its own point', () => {
  const visual = read('components/home/HeroVisual.tsx');
  const gap = Number(/export const LABEL_GAP = (\d+);/.exec(visual)?.[1]);
  assert.ok(gap > 0);
  const points = [...visual.matchAll(/x: (\d+), y: (\d+), labelY: (\d+),/g)];
  assert.equal(points.length, 3);
  for (const [, , y, labelY] of points) assert.equal(Number(labelY) - Number(y), gap);
});

test('the clear-process card has a second sentence in five languages', () => {
  for (const lang of LANGS) {
    assert.ok(homeExtraCopy[lang].processDetail.trim().length > 40, lang);
  }
  assert.match(read('components/home/HomeSections.tsx'), /desc: `\$\{c\.trust\[3\]\.desc\} \$\{x\.processDetail\}`/);
});
