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
  const { HERO_MAP_POINTS } = await import('./hero-map');
  const pointCities = Object.keys(HERO_MAP_POINTS).sort();
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
  for (const file of ['components/home/HeroVisual.tsx', 'lib/hero-map.ts', 'lib/home-extra-copy.ts', 'app/page.tsx']) {
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

test('every map label sits under the lowest edge of its own area', async () => {
  const map = await import('./hero-map');
  for (const [city, point] of Object.entries(map.HERO_MAP_POINTS)) {
    const outline = map.sampleArea(point.area);
    const bottom = Math.max(...outline.map((p) => p.y));
    assert.ok(point.labelY > bottom, `${city}: labelY ${point.labelY} must be below the area bottom ${bottom}`);
    const labelTop = point.labelY - map.LABEL_ASCENT;
    assert.ok(labelTop - bottom >= map.LABEL_CLEARANCE - 0.01, `${city}: label top must be ${map.LABEL_CLEARANCE} under the area`);
    assert.ok(point.labelY + map.LABEL_DESCENT <= map.MAP_TOP + map.MAP_HEIGHT - map.LABEL_EDGE, `${city}: label leaves the drawing`);
  }
  // the component draws from this module, not from its own numbers
  const visual = read('components/home/HeroVisual.tsx');
  assert.match(visual, /from '@\/lib\/hero-map'/);
  assert.match(visual, /y=\{point\.labelY\}/);
  assert.match(visual, /viewBox=\{`0 \$\{MAP_TOP\} \$\{MAP_WIDTH\} \$\{MAP_HEIGHT\}`\}/);
  assert.match(visual, /<rect x="0" y=\{MAP_TOP\} width=\{MAP_WIDTH\} height=\{MAP_HEIGHT\}/);
});

test('the map viewBox is cut to the drawing and the labels are readable on phones', async () => {
  const map = await import('./hero-map');
  const points = Object.values(map.HERO_MAP_POINTS);
  const top = Math.min(...points.flatMap((p) => map.sampleArea(p.area).map((q) => q.y)), ...map.sampleRoute([...points].sort((a, b) => a.x - b.x)).map((q) => q.y));
  const bottom = Math.max(...points.map((p) => p.labelY + map.LABEL_DESCENT));
  // no more than the padding (plus rounding) above and below the drawing
  assert.ok(top - map.MAP_TOP <= map.MAP_PADDING + 1, `empty band above: ${top - map.MAP_TOP}`);
  assert.ok(map.MAP_TOP + map.MAP_HEIGHT - bottom <= map.MAP_PADDING + 1, `empty band below: ${map.MAP_TOP + map.MAP_HEIGHT - bottom}`);
  assert.ok(map.MAP_HEIGHT < 140, `viewBox height ${map.MAP_HEIGHT}`);
  // at 360px the drawing is about 290px wide (page, card and figure padding)
  assert.ok(map.LABEL_FONT_SIZE * (290 / map.MAP_WIDTH) >= 11.5, 'phone label renders at about 12px');
  const visual = read('components/home/HeroVisual.tsx');
  assert.match(visual, /fontSize=\{LABEL_FONT_SIZE\}/);
  assert.match(visual, /className="sm:\[font-size:12px\]"/);
  assert.equal(map.LABEL_FONT_SIZE_WIDE, 12, 'keep the CSS class above in step');
});

test('map labels stay inside the frame and clear of areas, points, route and each other in every language', async () => {
  const map = await import('./hero-map');
  const { company } = await import('./company');
  type Box = { left: number; right: number; top: number; bottom: number };
  const inside = (p: { x: number; y: number }, box: Box) => p.x >= box.left && p.x <= box.right && p.y >= box.top && p.y <= box.bottom;
  const overlap = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const cities = company.presence.map((place) => place.city);
  const points = cities.map((city) => map.HERO_MAP_POINTS[city]).sort((a, b) => a.x - b.x);
  // the route, sampled along its arcs
  const route = map.sampleRoute(points);
  for (const lang of LANGS) {
    const boxes = cities.map((city, i) => {
      const point = map.HERO_MAP_POINTS[city];
      const label = homeCopy[lang].about.countries[i];
      const width = map.estimateLabelWidth(label);
      const x = map.labelX(point.x, label);
      const box = { left: x - width / 2, right: x + width / 2, top: point.labelY - map.LABEL_ASCENT, bottom: point.labelY + map.LABEL_DESCENT };
      assert.ok(box.left >= map.LABEL_EDGE - 0.01 && box.right <= map.MAP_WIDTH - map.LABEL_EDGE + 0.01, `${lang} ${label} leaves the drawing`);
      assert.ok(Math.abs(x - point.x) < width / 2, `${lang} ${label} is no longer under its point`);
      return { city, label, box };
    });
    for (const { label, box } of boxes) {
      for (const city of cities) {
        const point = map.HERO_MAP_POINTS[city];
        const outline = map.sampleArea(point.area);
        assert.equal(outline.some((p) => inside(p, box)), false, `${lang} ${label} touches the ${city} area`);
        assert.equal(inside({ x: point.x, y: point.y }, { left: box.left - 9, right: box.right + 9, top: box.top - 9, bottom: box.bottom + 9 }), false, `${lang} ${label} touches the ${city} point`);
      }
      assert.equal(route.some((p) => inside(p, box)), false, `${lang} ${label} touches the route`);
    }
    for (let a = 0; a < boxes.length; a += 1) {
      for (let b = a + 1; b < boxes.length; b += 1) {
        assert.equal(overlap(boxes[a].box, boxes[b].box), false, `${lang}: ${boxes[a].label} and ${boxes[b].label} overlap`);
      }
    }
  }
});

test('how-it-works card: numbered steps with a sentence, joined by a dashed line', () => {
  const visual = read('components/home/HeroVisual.tsx');
  // one column on phones, four from sm; each step: number, icon + title, one sentence
  assert.match(visual, /<ol className="[^"]*grid grid-cols-1[^"]*sm:grid-cols-4/);
  assert.match(visual, /<li key=\{step\} className="[^"]*flex[^"]*sm:flex-col sm:items-center[^"]*sm:text-center/);
  assert.match(visual, /rounded-full bg-brand-solid[^"]*text-white[^"]*">\s*\{index \+ 1\}/);
  assert.match(visual, /\{flowDesc\[index\]\}/);
  // the line: none after the last step; vertical on phones, horizontal through the circle centres from sm.
  // start/end are logical, so the line follows the page direction in Arabic.
  assert.match(visual, /\{last \? null : \(/);
  const cls = (name: string) => new RegExp(`data-connector="${name}" className="([^"]*)"`).exec(visual)?.[1].split(' ') ?? [];
  for (const c of ['absolute', 'border-dashed', 'border-s-2', 'sm:hidden', 'start-[calc(1rem-1px)]']) assert.ok(cls('vertical').includes(c), `vertical line needs ${c}`);
  for (const c of ['absolute', 'hidden', 'sm:block', 'border-dashed', 'border-t-2', 'top-[calc(1rem-1px)]', 'start-[calc(50%+1.25rem)]', 'end-[calc(-50%+0.75rem)]']) assert.ok(cls('horizontal').includes(c), `horizontal line needs ${c}`);
  assert.equal(/\b(left|right)-/.test(visual.slice(visual.indexOf('<ol'))), false, 'no physical left/right in the steps');
  // light green card with a top stripe, title kept
  assert.match(visual, /border-t-4 border-t-brand-solid bg-emerald-50 p-4/);
  assert.match(visual, /\{flowTitle\}/);
  // no animation in the card, so reduced motion has nothing to stop
  assert.equal(/animate-|transition/.test(visual.slice(visual.indexOf('<ol'))), false);
});

test('how-it-works sentences are filled in five languages and match the steps', () => {
  for (const lang of LANGS) {
    const hero = homeExtraCopy[lang].hero;
    assert.equal(hero.flowDesc.length, hero.flow.length, lang);
    for (const sentence of hero.flowDesc) {
      assert.ok(sentence.trim().length > 8, `${lang} sentence is empty`);
      assert.ok(sentence.length <= 48, `${lang} "${sentence}" is longer than one short line`);
    }
  }
  assert.deepEqual(homeExtraCopy.tr.hero.flowDesc, ['İşveren ihtiyacını iletir.', 'Uygun adaylar sunulur.', 'Görüşme yapılır, teklif hazırlanır.', 'Seyahat ve uyum takibi.']);
  assert.match(read('app/page.tsx'), /flowDesc=\{x\.hero\.flowDesc\}/);
});

test('the clear-process card has a second sentence in five languages', () => {
  for (const lang of LANGS) {
    assert.ok(homeExtraCopy[lang].processDetail.trim().length > 40, lang);
  }
  assert.match(read('components/home/HomeSections.tsx'), /desc: `\$\{c\.trust\[3\]\.desc\} \$\{x\.processDetail\}`/);
});
