/**
 * WCAG contrast for Panova's light-scheme UI.
 * Tailwind v4 stores palette colors as oklch(); brand tokens in app/globals.css
 * are hex or oklch. Ratios use the WCAG 2 relative-luminance formula.
 */

export type RGB = { r: number; g: number; b: number };

export type Palette = Map<string, RGB>;

export type ContrastFinding = {
  file: string;
  line: number;
  classes: string;
  message: string;
};

const NORMAL = 4.5;
const LARGE = 3;

const BANNED_GRAY = /^(?:slate|gray|zinc|neutral|stone)-(?:200|300|400|500)$/;

const SIZE_PX: Record<string, number> = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  '7xl': 72,
  '8xl': 96,
  '9xl': 128,
};

const TEXT_LAYOUT = new Set([
  'left', 'center', 'right', 'justify', 'start', 'end', 'wrap', 'nowrap', 'balance', 'pretty',
  'ellipsis', 'clip', 'truncate',
]);

const RESPONSIVE = new Set([
  'sm', 'md', 'lg', 'xl', '2xl', 'max-sm', 'max-md', 'max-lg', 'max-xl', 'rtl', 'ltr',
  'motion-safe', 'motion-reduce', 'portrait', 'landscape', 'print', 'contrast-more', 'contrast-less',
]);

const HTML_TAGS = new Set([
  'a', 'abbr', 'article', 'aside', 'b', 'blockquote', 'br', 'button', 'caption', 'code', 'dd',
  'details', 'div', 'dl', 'dt', 'em', 'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'img', 'input', 'label', 'legend',
  'li', 'main', 'nav', 'ol', 'option', 'p', 'pre', 'section', 'select', 'small', 'span', 'strong',
  'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'th', 'thead', 'tr', 'u', 'ul',
  'svg', 'path', 'circle', 'img',
]);

type Layer = {
  bg?: RGB;
  bgAlpha?: number;
  text?: RGB;
  textAlpha?: number;
  textName?: string;
  opacity?: number;
  sizePx?: number;
  bold?: boolean;
};

export function luminance(c: RGB): number {
  const channel = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const hi = Math.max(luminance(a), luminance(b));
  const lo = Math.min(luminance(a), luminance(b));
  return (hi + 0.05) / (lo + 0.05);
}

export function composite(fg: RGB, bg: RGB, alpha: number): RGB {
  const a = Math.min(1, Math.max(0, alpha));
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
  };
}

function gamma(c: number): number {
  const x = Math.min(1, Math.max(0, c));
  return x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
}

export function oklchToRgb(lightnessPercent: number, chroma: number, hue: number): RGB {
  const L = lightnessPercent / 100;
  const h = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(h);
  const b = chroma * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
  return { r: gamma(r), g: gamma(g), b: gamma(bl) };
}

export function hexToRgb(hex: string): RGB | null {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 && h.length !== 8) return null;
  const n = Number.parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return null;
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

export function parseColorValue(raw: string): RGB | null {
  const v = raw.trim();
  if (v.startsWith('#')) return hexToRgb(v);
  const m = v.match(/^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+(-?[\d.]+)\s*\)$/);
  if (!m) return null;
  return oklchToRgb(Number(m[1]), Number(m[2]), Number(m[3]));
}

export function parsePalette(css: string): Palette {
  const palette: Palette = new Map();
  palette.set('white', { r: 1, g: 1, b: 1 });
  palette.set('black', { r: 0, g: 0, b: 0 });
  const re = /--color-([a-z0-9-]+)\s*:\s*([^;]+);/g;
  for (const match of css.matchAll(re)) {
    const color = parseColorValue(match[2]);
    if (color) palette.set(match[1], color);
  }
  return palette;
}

function lookup(palette: Palette, name: string): RGB | null {
  return palette.get(name) ?? null;
}

type ParsedUtility = { state: string; name: string; skip: boolean };

function splitUtility(token: string): ParsedUtility {
  const parts = token.split(':');
  const name = parts.pop() ?? '';
  const states = parts.filter((part) => !RESPONSIVE.has(part));
  const skip = states.some((part) => part.includes('&') || part.includes('::') || part.startsWith('['));
  const state = states.filter((part) => !(part.includes('&') || part.includes('::') || part.startsWith('['))).join(':');
  return { state, name, skip };
}

function applyUtility(layer: Layer, name: string, palette: Palette) {
  const slash = name.lastIndexOf('/');
  const bare = slash === -1 ? name : name.slice(0, slash);
  const alpha = slash === -1 ? 1 : Number(name.slice(slash + 1)) / 100;

  if (bare.startsWith('text-')) {
    const key = bare.slice('text-'.length);
    if (SIZE_PX[key] != null) {
      layer.sizePx = SIZE_PX[key];
      return;
    }
    const px = key.match(/^\[(\d+(?:\.\d+)?)px\]$/);
    if (px) {
      layer.sizePx = Number(px[1]);
      return;
    }
    if (TEXT_LAYOUT.has(key) || key.startsWith('[')) {
      if (key.startsWith('[#')) {
        const color = hexToRgb(key.slice(1, -1));
        if (color) {
          layer.text = color;
          layer.textAlpha = alpha;
          layer.textName = key.slice(1, -1);
        }
      }
      return;
    }
    const color = lookup(palette, key);
    if (color) {
      layer.text = color;
      layer.textAlpha = Number.isFinite(alpha) ? alpha : 1;
      layer.textName = key;
    }
    return;
  }

  if (bare.startsWith('bg-')) {
    const key = bare.slice('bg-'.length);
    if (key.startsWith('[#')) {
      const color = hexToRgb(key.slice(1, -1));
      if (color) {
        layer.bg = color;
        layer.bgAlpha = Number.isFinite(alpha) ? alpha : 1;
      }
      return;
    }
    const color = lookup(palette, key);
    if (color) {
      layer.bg = color;
      layer.bgAlpha = Number.isFinite(alpha) ? alpha : 1;
    }
    return;
  }

  if (bare.startsWith('opacity-')) {
    const value = Number(bare.slice('opacity-'.length));
    if (Number.isFinite(value)) layer.opacity = value / 100;
    return;
  }

  if (bare === 'font-bold' || bare === 'font-extrabold' || bare === 'font-black') layer.bold = true;
}

function layersFor(classString: string, palette: Palette): Map<string, Layer> {
  const base: Layer = {};
  const states = new Map<string, Layer>();
  for (const token of classString.split(/\s+/).filter(Boolean)) {
    const util = splitUtility(token);
    if (util.skip || !util.name) continue;
    if (!util.state) {
      applyUtility(base, util.name, palette);
      continue;
    }
    const layer = states.get(util.state) ?? {};
    applyUtility(layer, util.name, palette);
    states.set(util.state, layer);
  }
  const merged = new Map<string, Layer>();
  merged.set('', base);
  for (const [state, layer] of states) {
    merged.set(state, {
      bg: layer.bg ?? base.bg,
      bgAlpha: layer.bg != null ? layer.bgAlpha : base.bgAlpha,
      text: layer.text ?? base.text,
      textAlpha: layer.text != null ? layer.textAlpha : base.textAlpha,
      textName: layer.textName ?? base.textName,
      opacity: layer.opacity ?? base.opacity,
      sizePx: layer.sizePx ?? base.sizePx,
      bold: layer.bold ?? base.bold,
    });
  }
  return merged;
}

function threshold(layer: Layer, graphic: boolean): number {
  if (graphic) return LARGE;
  const size = layer.sizePx ?? 16;
  const large = size >= 24 || (layer.bold === true && size >= 18.67);
  return large ? LARGE : NORMAL;
}

function bannedMessage(name: string, bgIsDark: boolean): string {
  const replacement = bgIsDark ? 'text-on-dark-muted' : 'text-muted-foreground';
  return `text-${name} is below the Panova text scale. Use ${replacement} (or text-foreground / text-on-dark).`;
}

type Ancestor = { bgs: RGB[] };

function checkWorld(
  file: string,
  line: number,
  classString: string,
  palette: Palette,
  ancestorBgs: RGB[],
  page: RGB,
  graphic: boolean,
): ContrastFinding[] {
  const findings: ContrastFinding[] = [];
  const seen = new Set<string>();
  const push = (message: string) => {
    const key = `${line}:${message}:${classString}`;
    if (seen.has(key)) return;
    seen.add(key);
    findings.push({ file, line, classes: classString.trim(), message });
  };

  for (const token of classString.split(/\s+/).filter(Boolean)) {
    if (token === 'dark' || token.startsWith('dark:')) {
      push('dark: variants are not part of the light color scheme. Set a surface background and text-on-dark instead.');
    }
    const util = splitUtility(token);
    if (util.skip) continue;
    const bare = util.name.replace(/\/\d+$/, '');
    if (bare.startsWith('text-')) {
      const key = bare.slice('text-'.length);
      if (BANNED_GRAY.test(key)) {
        const sampleBg = ancestorBgs[0] ?? page;
        push(bannedMessage(key, luminance(sampleBg) < 0.2));
      }
    }
    if (bare.startsWith('opacity-') && !graphic) {
      const value = Number(bare.slice('opacity-'.length));
      if (Number.isFinite(value) && value < 100) {
        push(`opacity-${value} fades text below the solid color. Use a darker solid background instead of transparency.`);
      }
    }
  }

  const layers = layersFor(classString, palette);
  const fallbackBgs = ancestorBgs.length ? ancestorBgs : [page];

  for (const [state, layer] of layers) {
    if (!layer.text) continue;
    const bgs = layer.bg ? [composite(layer.bg, (ancestorBgs[0] ?? page), layer.bgAlpha ?? 1)] : fallbackBgs;
    const textAlpha = (layer.textAlpha ?? 1) * (layer.opacity ?? 1);
    const limit = threshold(layer, graphic);
    for (const bg of bgs) {
      const shownBg = layer.opacity != null && layer.opacity < 1 && layer.bg
        ? composite(layer.bg, ancestorBgs[0] ?? page, layer.opacity)
        : bg;
      const shownText = composite(layer.text, shownBg, textAlpha);
      const ratio = contrastRatio(shownText, shownBg);
      if (ratio + 1e-6 < limit) {
        const where = state ? `${state} ` : '';
        push(
          `${where}text contrast ${ratio.toFixed(2)}:1 is below ${limit}:1 (${layer.textName ?? 'text'} on its background).`,
        );
      }
    }
  }

  return findings;
}

function lineAt(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i++) if (source[i] === '\n') line += 1;
  return line;
}

type Tag = { raw: string; end: number; closing: boolean; selfClosing: boolean; name: string };

function readTag(source: string, start: number): Tag | null {
  if (source[start] !== '<') return null;
  let i = start + 1;
  const closing = source[i] === '/';
  if (closing) i += 1;
  const nameStart = i;
  while (i < source.length && /[A-Za-z0-9.]/.test(source[i])) i += 1;
  const name = source.slice(nameStart, i);
  if (!name && source[i] !== '>') return null;
  if (!closing && name && name[0] === name[0].toLowerCase() && !HTML_TAGS.has(name)) return null;

  // code | quote | template | ${} interpolation. Interpolation remembers the brace depth to resume the template.
  const frames: Array<{ type: 'code' | "'" | '"' | '`' | 'interp'; braceAt: number }> = [{ type: 'code', braceAt: 0 }];
  let brace = 0;
  for (; i < source.length; i++) {
    const c = source[i];
    const top = frames[frames.length - 1];
    if (top.type === "'" || top.type === '"') {
      if (c === '\\') { i += 1; continue; }
      if (c === top.type) frames.pop();
      continue;
    }
    if (top.type === '`') {
      if (c === '\\') { i += 1; continue; }
      if (c === '`') { frames.pop(); continue; }
      if (c === '$' && source[i + 1] === '{') {
        frames.push({ type: 'interp', braceAt: brace });
        brace += 1;
        i += 1;
        continue;
      }
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      frames.push({ type: c, braceAt: brace });
      continue;
    }
    if (c === '{') { brace += 1; continue; }
    if (c === '}') {
      brace -= 1;
      if (top.type === 'interp' && brace === top.braceAt) frames.pop();
      continue;
    }
    if (c === '>' && brace === 0 && frames.length === 1) {
      const raw = source.slice(start, i + 1);
      const selfClosing = /\/\s*>$/.test(raw);
      return { raw, end: i + 1, closing, selfClosing, name };
    }
  }
  return null;
}

function extractClassExpression(tag: string): string | null {
  const at = tag.search(/\bclassName\s*=/);
  if (at < 0) return null;
  let i = tag.indexOf('=', at) + 1;
  while (i < tag.length && /\s/.test(tag[i])) i += 1;
  const start = i;
  const first = tag[i];
  if (first === '"' || first === "'") {
    i += 1;
    while (i < tag.length && tag[i] !== first) {
      if (tag[i] === '\\') i += 2;
      else i += 1;
    }
    return tag.slice(start, i + 1);
  }
  if (first === '{') {
    let brace = 0;
    let quote: "'" | '"' | '`' | null = null;
    for (; i < tag.length; i++) {
      const c = tag[i];
      if (quote === '`') {
        if (c === '\\') { i += 1; continue; }
        if (c === '`') quote = null;
        continue;
      }
      if (quote) {
        if (c === '\\') { i += 1; continue; }
        if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
      if (c === '{') brace += 1;
      else if (c === '}') {
        brace -= 1;
        if (brace === 0) return tag.slice(start, i + 1);
      }
    }
  }
  return null;
}

/** Class combinations that can actually apply together (static template part + one branch). */
export function classWorlds(expression: string): string[] {
  const trimmed = expression.trim();
  if (!trimmed) return [];
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return [trimmed.slice(1, -1)];
  }
  const inner = trimmed.startsWith('{') && trimmed.endsWith('}') ? trimmed.slice(1, -1) : trimmed;
  let always = '';
  const alternatives: string[] = [];
  let i = 0;
  let templateStatic = '';
  let brace = 0;
  const frames: Array<{ type: 'code' | "'" | '"' | '`' | 'interp'; braceAt: number }> = [{ type: 'code', braceAt: 0 }];
  const pushTemplate = () => {
    if (templateStatic.trim()) always += ` ${templateStatic} `;
    templateStatic = '';
  };
  while (i < inner.length) {
    const c = inner[i];
    const top = frames[frames.length - 1];
    if (top.type === '`') {
      if (c === '\\') { templateStatic += inner[i + 1] ?? ''; i += 2; continue; }
      if (c === '$' && inner[i + 1] === '{') {
        pushTemplate();
        frames.push({ type: 'interp', braceAt: brace });
        brace += 1;
        i += 2;
        continue;
      }
      if (c === '`') { pushTemplate(); frames.pop(); i += 1; continue; }
      templateStatic += c;
      i += 1;
      continue;
    }
    if (top.type === "'" || top.type === '"') {
      const q = top.type;
      let value = '';
      while (i < inner.length && inner[i] !== q) {
        if (inner[i] === '\\') { value += inner[i + 1] ?? ''; i += 2; continue; }
        value += inner[i];
        i += 1;
      }
      if (value.trim()) alternatives.push(value);
      frames.pop();
      i += 1;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') {
      frames.push({ type: c, braceAt: brace });
      i += 1;
      continue;
    }
    if (c === '{') { brace += 1; i += 1; continue; }
    if (c === '}') {
      brace -= 1;
      if (top.type === 'interp' && brace === top.braceAt) frames.pop();
      i += 1;
      continue;
    }
    i += 1;
  }
  if (!alternatives.length) return always.trim() ? [always.trim()] : [];
  if (!always.trim()) return alternatives;
  return alternatives.map((alt) => `${always} ${alt}`.replace(/\s+/g, ' ').trim());
}

function resolvedBgs(worlds: string[], palette: Palette, ancestor: RGB[], page: RGB): RGB[] {
  const bgs: RGB[] = [];
  for (const world of worlds) {
    for (const layer of layersFor(world, palette).values()) {
      if (!layer.bg) continue;
      bgs.push(composite(layer.bg, ancestor[0] ?? page, layer.bgAlpha ?? 1));
    }
  }
  return bgs.length ? bgs : ancestor;
}

export function auditSource(file: string, source: string, palette: Palette): ContrastFinding[] {
  const page = palette.get('background') ?? palette.get('white') ?? { r: 1, g: 1, b: 1 };
  const findings: ContrastFinding[] = [];
  const stack: Ancestor[] = [{ bgs: [page] }];
  const consumed = new Set<string>();

  let i = 0;
  while (i < source.length) {
    if (source.startsWith('{/*', i)) {
      const end = source.indexOf('*/}', i);
      i = end < 0 ? source.length : end + 3;
      continue;
    }
    if (source[i] !== '<') { i += 1; continue; }
    const prev = i > 0 ? source[i - 1] : '';
    if (/[A-Za-z0-9_]/.test(prev)) { i += 1; continue; }
    if (source.startsWith('</>', i)) {
      if (stack.length > 1) stack.pop();
      i += 3;
      continue;
    }
    if (source.startsWith('<>', i)) {
      stack.push(stack[stack.length - 1]);
      i += 2;
      continue;
    }
    const tag = readTag(source, i);
    if (!tag) { i += 1; continue; }
    if (tag.closing) {
      if (stack.length > 1) stack.pop();
      i = tag.end;
      continue;
    }
    const expr = extractClassExpression(tag.raw);
    const iconSized = /\bw-(?:\d+(?:\.\d+)?|\[[^\]]+\])\b/.test(tag.raw) && /\bh-(?:\d+(?:\.\d+)?|\[[^\]]+\])\b/.test(tag.raw);
    const graphic = /aria-hidden/.test(tag.raw) || (iconSized && /^[A-Z]/.test(tag.name));
    const parent = stack[stack.length - 1];
    if (expr) {
      const worlds = classWorlds(expr);
      const line = lineAt(source, i);
      for (const world of worlds) {
        consumed.add(world);
        findings.push(...checkWorld(file, line, world, palette, parent.bgs, page, graphic));
      }
      for (const piece of expr.matchAll(/['"]([^'"]+)['"]/g)) consumed.add(piece[1]);
      if (!tag.selfClosing) {
        const bgs = resolvedBgs(worlds, palette, parent.bgs, page);
        stack.push({ bgs: bgs.length ? bgs : parent.bgs });
      }
    } else if (!tag.selfClosing) {
      stack.push(parent);
    }
    i = tag.end;
  }

  const literal = /(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  for (const match of source.matchAll(literal)) {
    const value = match[2].replace(/\\n/g, ' ');
    if (!/\b(?:text|bg|placeholder|hover:|disabled:|opacity)-/.test(value)) continue;
    if (consumed.has(value)) continue;
    if (value.includes('${') || (value.includes('\n') && value.length > 400)) continue;
    const line = lineAt(source, match.index ?? 0);
    findings.push(...checkWorld(file, line, value, palette, [page], page, false));
  }

  return findings;
}

export const REQUIRED_PAIRS: Array<[string, string]> = [
  ['foreground', 'background'],
  ['foreground', 'card'],
  ['foreground', 'white'],
  ['muted-foreground', 'background'],
  ['muted-foreground', 'card'],
  ['muted-foreground', 'white'],
  ['muted-foreground', 'slate-50'],
  ['muted-foreground', 'slate-100'],
  ['muted-foreground', 'slate-200'],
  ['on-dark', 'slate-700'],
  ['on-dark', 'slate-800'],
  ['on-dark', 'slate-900'],
  ['on-dark', 'slate-950'],
  ['on-dark', 'brand-solid'],
  ['on-dark-muted', 'slate-700'],
  ['on-dark-muted', 'slate-800'],
  ['on-dark-muted', 'slate-900'],
  ['on-dark-muted', 'slate-950'],
  ['brand', 'white'],
  ['brand', 'background'],
  ['brand', 'emerald-50'],
  ['white', 'brand-solid'],
  ['on-dark', 'disabled'],
  ['status-pending', 'status-pending-bg'],
  ['status-ok', 'status-ok-bg'],
  ['status-bad', 'status-bad-bg'],
  ['status-info', 'status-info-bg'],
];
