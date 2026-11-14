/**
 * Geometry of the schematic office map on the home hero (components/home/HeroVisual.tsx).
 * Plain TypeScript so lib/home-page.test.ts can check it.
 *
 * Not to scale: the drawing only shows the three office countries, west to east
 * (North Macedonia, Türkiye, Bangladesh), and the link between them. Keys are the
 * cities in company.presence (lib/company.ts).
 *
 * Each country name sits under the lowest edge of its own area, never inside it:
 * labelY (the text baseline) = area bottom + LABEL_CLEARANCE + LABEL_ASCENT.
 * The dashed route arcs above the points, so it never reaches a label.
 *
 * The viewBox is cut to the drawing (MAP_TOP / MAP_HEIGHT are computed from the
 * areas, the route and the labels), so the figure has no empty band.
 */
export const MAP_WIDTH = 340;
/**
 * Label size in drawing units on phones. The drawing is about 290-350px wide on
 * a 360-420px screen, so 14 units render at about 12px. From sm the figure is
 * wider and HeroVisual sets LABEL_FONT_SIZE_WIDE with CSS.
 */
export const LABEL_FONT_SIZE = 14;
export const LABEL_FONT_SIZE_WIDE = 12;
/** Free space between an area's lowest edge and the top of its label. */
export const LABEL_CLEARANCE = 14;
/** Height of the tallest letters above the baseline (Latin, Cyrillic, Arabic) at LABEL_FONT_SIZE. */
export const LABEL_ASCENT = 12;
/** Depth below the baseline (Arabic descenders) at LABEL_FONT_SIZE. */
export const LABEL_DESCENT = 5;
/** Space kept between a label and the frame of the drawing. */
export const LABEL_EDGE = 6;
/** Space between the drawing and the top / bottom of the viewBox. */
export const MAP_PADDING = 10;

type Point = { x: number; y: number };

const MAP_AREAS: Readonly<Record<string, { x: number; y: number; area: string }>> = {
  Struga: {
    x: 44, y: 62,
    area: 'M24 52 C28 40 50 36 62 44 C70 52 68 68 58 76 C46 82 30 78 25 68 C22 62 22 58 24 52 Z',
  },
  Sivas: {
    x: 206, y: 60,
    area: 'M172 55 C177 44 205 39 230 44 C245 47 251 57 247 68 C241 78 218 82 196 79 C182 77 169 68 172 55 Z',
  },
  Dhaka: {
    x: 300, y: 66,
    area: 'M284 51 C293 42 311 44 318 52 C323 63 320 78 311 85 C302 90 289 85 286 76 C280 69 278 58 284 51 Z',
  },
};

/** Points along a closed path made of M / C / Z commands (the only ones the areas use). */
export function sampleArea(area: string, steps = 32): Point[] {
  const tokens = area.match(/[MCZ]|-?\d+(?:\.\d+)?/g) ?? [];
  const points: Point[] = [];
  let current: Point = { x: 0, y: 0 };
  let i = 0;
  const next = () => Number(tokens[i++]);
  while (i < tokens.length) {
    const command = tokens[i++];
    if (command === 'M') {
      current = { x: next(), y: next() };
      points.push(current);
    } else if (command === 'C') {
      const [c1, c2, end] = [{ x: next(), y: next() }, { x: next(), y: next() }, { x: next(), y: next() }];
      for (let step = 1; step <= steps; step += 1) {
        const t = step / steps;
        const u = 1 - t;
        points.push({
          x: u ** 3 * current.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t ** 3 * end.x,
          y: u ** 3 * current.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t ** 3 * end.y,
        });
      }
      current = end;
    } else if (command !== 'Z') {
      throw new Error(`hero map areas use M, C and Z only, got ${command}`);
    }
  }
  return points;
}

/** Lowest y reached by the outline of an area. */
export function areaBottom(area: string): number {
  return Math.max(...sampleArea(area).map((point) => point.y));
}

export const HERO_MAP_POINTS: Readonly<Record<string, { x: number; y: number; area: string; bottom: number; labelY: number }>> =
  Object.fromEntries(Object.entries(MAP_AREAS).map(([city, point]) => {
    const bottom = areaBottom(point.area);
    return [city, { ...point, bottom, labelY: Math.ceil(bottom + LABEL_CLEARANCE + LABEL_ASCENT) }];
  }));

/**
 * Rough width of a bold label at LABEL_FONT_SIZE. Generous on purpose: it keeps
 * long names (for example "Северна Македонија") inside the frame and off the areas.
 */
export function estimateLabelWidth(label: string): number {
  return label.length * LABEL_FONT_SIZE * 0.64;
}

/** Label centre: under its own point, moved in just enough to stay inside the frame. */
export function labelX(pointX: number, label: string): number {
  const half = estimateLabelWidth(label) / 2;
  return Math.min(Math.max(pointX, half + LABEL_EDGE), MAP_WIDTH - half - LABEL_EDGE);
}

const lift = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 34 });

/** The dashed route: arcs above the points, west to east. */
export function routePath(points: readonly Point[]): string {
  return points.map((point, index) => {
    if (index === 0) return `M${point.x} ${point.y}`;
    const control = lift(points[index - 1], point);
    return `Q ${control.x} ${control.y} ${point.x} ${point.y}`;
  }).join(' ');
}

/** Points along the route (for the bounds and the tests). */
export function sampleRoute(points: readonly Point[], steps = 32): Point[] {
  const out: Point[] = [];
  points.forEach((point, index) => {
    if (index === 0) return;
    const previous = points[index - 1];
    const control = lift(previous, point);
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const u = 1 - t;
      out.push({
        x: u * u * previous.x + 2 * u * t * control.x + t * t * point.x,
        y: u * u * previous.y + 2 * u * t * control.y + t * t * point.y,
      });
    }
  });
  return out;
}

const ALL_POINTS = Object.values(HERO_MAP_POINTS).sort((a, b) => a.x - b.x);
const contentTop = Math.min(
  ...Object.values(HERO_MAP_POINTS).flatMap((point) => sampleArea(point.area).map((p) => p.y)),
  ...sampleRoute(ALL_POINTS).map((p) => p.y),
);
const contentBottom = Math.max(...Object.values(HERO_MAP_POINTS).map((point) => point.labelY + LABEL_DESCENT));

/** Top of the viewBox (drawing units). */
export const MAP_TOP = Math.floor(contentTop - MAP_PADDING);
/** Height of the viewBox, cut to the drawing. */
export const MAP_HEIGHT = Math.ceil(contentBottom + MAP_PADDING) - MAP_TOP;
