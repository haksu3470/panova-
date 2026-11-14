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
 */
export const MAP_WIDTH = 340;
export const MAP_HEIGHT = 200;
export const LABEL_FONT_SIZE = 11;
/** Free space between an area's lowest edge and the top of its label. */
export const LABEL_CLEARANCE = 14;
/** Height of the tallest letters above the baseline (Latin, Cyrillic, Arabic) at 11px. */
export const LABEL_ASCENT = 9;
/** Depth below the baseline (Arabic descenders) at 11px. */
export const LABEL_DESCENT = 4;
/** Space kept between a label and the frame of the drawing. */
export const LABEL_EDGE = 6;

type Point = { x: number; y: number };

const MAP_AREAS: Readonly<Record<string, { x: number; y: number; area: string }>> = {
  Struga: {
    x: 52, y: 84,
    area: 'M32 74 C36 62 58 58 70 66 C78 74 76 90 66 98 C54 104 38 100 33 90 C30 84 30 80 32 74 Z',
  },
  Sivas: {
    x: 168, y: 92,
    area: 'M118 86 C126 72 166 66 204 72 C226 76 234 88 228 102 C220 114 186 120 154 116 C132 113 114 102 118 86 Z',
  },
  Dhaka: {
    x: 290, y: 102,
    area: 'M272 84 C282 74 302 76 310 86 C316 98 312 116 302 124 C292 130 278 124 274 114 C268 106 266 92 272 84 Z',
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
 * Rough width of a bold 11px label. Generous on purpose: it only keeps long names
 * (for example "Северна Македонија") inside the frame.
 */
export function estimateLabelWidth(label: string): number {
  return label.length * LABEL_FONT_SIZE * 0.64;
}

/** Label centre: under its own point, moved in just enough to stay inside the frame. */
export function labelX(pointX: number, label: string): number {
  const half = estimateLabelWidth(label) / 2;
  return Math.min(Math.max(pointX, half + LABEL_EDGE), MAP_WIDTH - half - LABEL_EDGE);
}

/** The dashed route: arcs above the points, west to east. */
export function routePath(points: readonly Point[]): string {
  return points.map((point, index) => {
    if (index === 0) return `M${point.x} ${point.y}`;
    const previous = points[index - 1];
    const midX = (previous.x + point.x) / 2;
    const liftY = Math.min(previous.y, point.y) - 34;
    return `Q ${midX} ${liftY} ${point.x} ${point.y}`;
  }).join(' ');
}
