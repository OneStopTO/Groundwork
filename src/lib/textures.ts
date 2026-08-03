/**
 * Generic top-down material textures for the design canvas. Keyed by
 * keyword match against the (free-text, editable) material name, so any
 * price book item named e.g. "Belgard Pavers" still gets the paver look.
 * Falls back to a flat color (handled by the caller) when nothing matches.
 *
 * Every texture is authored at true real-world size (`sizeFtW`/`sizeFtH`),
 * not an arbitrary pixel size — the canvas multiplies these by its
 * px-per-foot scale, so a 2ft paver actually reads as 2ft on the grid.
 */

type Texture = { tile: string; sizeFtW: number; sizeFtH: number; base: string };

/** SVG authoring resolution — purely for crisp joint lines, unrelated to real-world size. */
const PX_PER_FT = 100;

function svgUrl(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A grid of rectangular units (pavers, brick, block) with mortar/sand joints, at true size. */
function unitPavingTexture(base: string, line: string, wFt: number, hFt: number): Texture {
  const w = wFt * PX_PER_FT;
  const h = hFt * PX_PER_FT;
  const strokeW = Math.max(2, PX_PER_FT * 0.02);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${base}"/>
    <rect x="0" y="0" width="${w}" height="${h}" fill="none" stroke="${line}" stroke-width="${strokeW}"/>
  </svg>`;
  return { tile: svgUrl(svg), sizeFtW: wFt, sizeFtH: hFt, base };
}

/** Stacked horizontal courses with vertical joint breaks, for coursed wall block. */
function courseTexture(base: string, line: string, courseHFt: number): Texture {
  const wFt = courseHFt * 3;
  const w = wFt * PX_PER_FT;
  const h = courseHFt * PX_PER_FT;
  const strokeW = Math.max(2, PX_PER_FT * 0.02);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${base}"/>
    <line x1="0" y1="${h}" x2="${w}" y2="${h}" stroke="${line}" stroke-width="${strokeW}"/>
    <line x1="${w / 3}" y1="0" x2="${w / 3}" y2="${h}" stroke="${line}" stroke-width="${strokeW}" opacity="0.7"/>
    <line x1="${(2 * w) / 3}" y1="0" x2="${(2 * w) / 3}" y2="${h}" stroke="${line}" stroke-width="${strokeW}" opacity="0.7"/>
  </svg>`;
  return { tile: svgUrl(svg), sizeFtW: wFt, sizeFtH: courseHFt, base };
}

/** Irregular flagstone/crazy-paving polygons over a base fill. */
function stoneTexture(base: string, line: string, sizeFt: number): Texture {
  const s = 60;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <rect width="${s}" height="${s}" fill="${base}"/>
    <g fill="none" stroke="${line}" stroke-width="1.4">
      <path d="M0 18 L16 12 L28 20 L22 34 L0 32 Z"/>
      <path d="M16 12 L34 4 L46 14 L28 20 Z"/>
      <path d="M34 4 L60 0 L60 16 L46 14 Z"/>
      <path d="M28 20 L46 14 L54 30 L38 38 L22 34 Z"/>
      <path d="M0 32 L22 34 L18 52 L0 56 Z"/>
      <path d="M22 34 L38 38 L36 58 L18 52 Z"/>
      <path d="M38 38 L54 30 L60 44 L60 60 L36 58 Z"/>
    </g>
  </svg>`;
  return { tile: svgUrl(svg), sizeFtW: sizeFt, sizeFtH: sizeFt, base };
}

/** Scattered speckles over a base fill (mulch, gravel, river rock, granite). */
function speckleTexture(base: string, dark: string, light: string, sizeFt: number): Texture {
  const size = 24;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${base}"/>
    <g fill="${dark}">
      <circle cx="${size * 0.15}" cy="${size * 0.2}" r="${size * 0.07}"/>
      <circle cx="${size * 0.7}" cy="${size * 0.1}" r="${size * 0.055}"/>
      <circle cx="${size * 0.4}" cy="${size * 0.45}" r="${size * 0.075}"/>
      <circle cx="${size * 0.85}" cy="${size * 0.55}" r="${size * 0.06}"/>
      <circle cx="${size * 0.2}" cy="${size * 0.75}" r="${size * 0.065}"/>
      <circle cx="${size * 0.55}" cy="${size * 0.85}" r="${size * 0.055}"/>
    </g>
    <g fill="${light}">
      <circle cx="${size * 0.3}" cy="${size * 0.12}" r="${size * 0.045}"/>
      <circle cx="${size * 0.75}" cy="${size * 0.35}" r="${size * 0.045}"/>
      <circle cx="${size * 0.08}" cy="${size * 0.5}" r="${size * 0.045}"/>
      <circle cx="${size * 0.45}" cy="${size * 0.68}" r="${size * 0.045}"/>
    </g>
  </svg>`;
  return { tile: svgUrl(svg), sizeFtW: sizeFt, sizeFtH: sizeFt, base };
}

/** Blade-stroke turf, works for natural sod and artificial turf alike. */
function turfTexture(base: string, blade: string, uniform: boolean, sizeFt: number): Texture {
  const size = 16;
  const rot = uniform ? 0 : 1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${base}"/>
    <g stroke="${blade}" stroke-width="1" stroke-linecap="round">
      <line x1="2" y1="14" x2="${1 + rot}" y2="9"/>
      <line x1="5" y1="15" x2="5" y2="8"/>
      <line x1="8" y1="14" x2="${9 - rot}" y2="8"/>
      <line x1="11" y1="15" x2="11" y2="9"/>
      <line x1="14" y1="14" x2="${15 - rot}" y2="9"/>
    </g>
  </svg>`;
  return { tile: svgUrl(svg), sizeFtW: sizeFt, sizeFtH: sizeFt, base };
}

/**
 * Deck boards as a continuous surface with a thin (~half-inch) joint line
 * between each board and subtle alternating tone — not fine grain detail,
 * which doesn't survive being rendered at the small on-canvas board size
 * (a real ~4-5in board is only a handful of px tall) and was producing
 * rendering noise that read as gaps between boards. The internal viewBox
 * matches the tile's real-world aspect ratio exactly so the browser never
 * has to stretch it non-uniformly, which was the other source of artifacts.
 */
function plankTexture(base: string, joint: string, shade: string): Texture {
  const boardWidthFt = 0.4; // ~4.8in reveal
  const jointFt = 0.045; // ~half inch
  const res = 40; // px per foot, purely for authoring resolution
  const w = res; // 1ft of length — no horizontal detail, so the repeat width is arbitrary
  const boardH = boardWidthFt * res;
  const jointH = jointFt * res;
  const h = boardH * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${base}"/>
    <rect x="0" y="0" width="${w}" height="${boardH}" fill="${shade}" opacity="0.22"/>
    <rect x="0" y="${boardH - jointH}" width="${w}" height="${jointH}" fill="${joint}"/>
    <rect x="0" y="${h - jointH}" width="${w}" height="${jointH}" fill="${joint}"/>
  </svg>`;
  return { tile: svgUrl(svg), sizeFtW: 1, sizeFtH: boardWidthFt * 2, base };
}

/**
 * Stair treads — stacked bands each with a dark riser shadow and a bright
 * nosing highlight, read clearly as steps rather than a flat material fill.
 * Wide enough (20ft) that a typical stair run never needs a horizontal
 * repeat, which would otherwise show as a seam running across the treads.
 */
function stepTreadTexture(base: string, riser: string, treadFt: number): Texture {
  const repeatWFt = 20;
  const w = repeatWFt * PX_PER_FT;
  const h = treadFt * PX_PER_FT;
  const riserH = h * 0.22;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${base}"/>
    <rect x="0" y="0" width="${w}" height="${riserH}" fill="${riser}"/>
    <rect x="0" y="${riserH}" width="${w}" height="${Math.max(2, h * 0.035)}" fill="#ffffff" opacity="0.4"/>
  </svg>`;
  return { tile: svgUrl(svg), sizeFtW: repeatWFt, sizeFtH: treadFt, base };
}

/** Flat fill with a control-joint grid, for poured/stamped concrete and asphalt. */
function slabTexture(base: string, line: string, stamped: boolean, sizeFt: number): Texture {
  const s = stamped ? 24 : 40;
  const stampLines = stamped
    ? `<path d="M0 8 H${s} M0 16 H${s} M8 0 V${s} M16 0 V${s}" stroke="${line}" stroke-width="0.6" opacity="0.5"/>`
    : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <rect width="${s}" height="${s}" fill="${base}"/>
    <line x1="0" y1="0" x2="${s}" y2="0" stroke="${line}" stroke-width="1.5"/>
    <line x1="0" y1="0" x2="0" y2="${s}" stroke="${line}" stroke-width="1.5"/>
    ${stampLines}
  </svg>`;
  return { tile: svgUrl(svg), sizeFtW: sizeFt, sizeFtH: sizeFt, base };
}

/** Rippled water surface, for pools. */
function waterTexture(): Texture {
  const base = "#5fa8c9";
  const s = 40;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <rect width="${s}" height="${s}" fill="${base}"/>
    <path d="M0 8 Q10 4 20 8 T40 8" stroke="#8ecfe8" stroke-width="1.5" fill="none" opacity="0.8"/>
    <path d="M0 20 Q10 16 20 20 T40 20" stroke="#4a90ad" stroke-width="1.5" fill="none" opacity="0.7"/>
    <path d="M0 32 Q10 28 20 32 T40 32" stroke="#8ecfe8" stroke-width="1.5" fill="none" opacity="0.8"/>
  </svg>`;
  return { tile: svgUrl(svg), sizeFtW: 4, sizeFtH: 4, base };
}

// Generic paver fallback (~12x12in unit) — warm tan, used when no more
// specific match (like the 2x2 concrete paver below) applies.
const PAVERS = unitPavingTexture("#d9c9ab", "#b8a483", 1, 1);

// 2x2 concrete pavers — cool concrete grey, drawn at true 2ft x 2ft so a
// patio reads as an actual grid of 2ft slabs at any canvas scale.
const CONCRETE_PAVER_2X2 = unitPavingTexture("#9c9c96", "#767671", 2, 2);

const BRICK_PAVERS = unitPavingTexture("#b5573a", "#8f4029", 0.67, 0.33);
const BELGIAN_BLOCK = unitPavingTexture("#5c5c59", "#3a3a38", 0.4, 0.4);
const BLUESTONE = stoneTexture("#7c8a94", "#5c6a73", 4);
const TRAVERTINE = stoneTexture("#dccdad", "#b8a884", 4);
const NATURAL_STONE = stoneTexture("#c3c7ba", "#8f9385", 4);
const STONE_WALL = stoneTexture("#8a7f6d", "#5f5648", 4);
const WALL_BLOCK = courseTexture("#b3a084", "#8c7a5f", 0.5);
const MULCH = speckleTexture("#6b4226", "#4a2c17", "#8a5a35", 0.5);
const GRAVEL = speckleTexture("#c9c9c2", "#a8a89f", "#e2e2da", 0.4);
const RIVER_ROCK = speckleTexture("#93a3a8", "#6d7d82", "#b8c6ca", 0.6);
const CRUSHED_GRANITE = speckleTexture("#c98f7e", "#a8654f", "#e0b7a8", 0.3);
const SOD = turfTexture("#7cb668", "#5a9146", false, 0.3);
const ARTIFICIAL_TURF = turfTexture("#5fa550", "#3f7d38", true, 0.3);
// Warm honey-maple tone with tight ~4in board reveals, closer to how real
// wood/composite decking (e.g. maple-toned lines like Trex Maplewood) reads
// from above than a flat reddish-cedar fill.
const WOOD_DECKING = plankTexture("#c19a5b", "#8a6a3d", "#96723f");
const COMPOSITE_DECKING = plankTexture("#6e6459", "#443d35", "#4d453d");
const STEPS = stepTreadTexture("#c3c7ba", "#4a4a44", 1);
const POURED_CONCRETE = slabTexture("#c7c9cb", "#aaacae", false, 4);
const STAMPED_CONCRETE = slabTexture("#c2b6a3", "#a4988733", true, 2);
const ASPHALT = slabTexture("#3f4247", "#2a2c2f", false, 5);
const POOL_WATER = waterTexture();

const MATCHERS: Array<{ test: RegExp; texture: Texture }> = [
  { test: /brick/i, texture: BRICK_PAVERS },
  { test: /belgian block/i, texture: BELGIAN_BLOCK },
  { test: /2\s*x\s*2/i, texture: CONCRETE_PAVER_2X2 },
  { test: /paver/i, texture: PAVERS },
  { test: /bluestone/i, texture: BLUESTONE },
  { test: /travertine/i, texture: TRAVERTINE },
  { test: /(natural stone wall|stone wall|boulder wall)/i, texture: STONE_WALL },
  { test: /(wall block|retaining wall|\bblock\b)/i, texture: WALL_BLOCK },
  { test: /(natural stone|flagstone|\bstone\b)/i, texture: NATURAL_STONE },
  { test: /mulch/i, texture: MULCH },
  { test: /artificial turf/i, texture: ARTIFICIAL_TURF },
  { test: /(sod|grass|\blawn\b|\bturf\b)/i, texture: SOD },
  { test: /river rock/i, texture: RIVER_ROCK },
  { test: /crushed granite/i, texture: CRUSHED_GRANITE },
  { test: /(gravel|base fill|aggregate)/i, texture: GRAVEL },
  { test: /composite deck/i, texture: COMPOSITE_DECKING },
  { test: /(cedar|wood).*deck|deck/i, texture: WOOD_DECKING },
  { test: /asphalt/i, texture: ASPHALT },
  { test: /stamped concrete/i, texture: STAMPED_CONCRETE },
  { test: /pool/i, texture: POOL_WATER },
  { test: /concrete/i, texture: POURED_CONCRETE },
];

export function materialTexture(materialName: string): Texture | null {
  for (const { test, texture } of MATCHERS) {
    if (test.test(materialName)) return texture;
  }
  return null;
}

/**
 * STEPS shapes read as stair treads regardless of the chosen material name
 * (their default material, "Natural Stone", would otherwise be visually
 * identical to a flagstone patio) — same base color as the matched
 * material, but with a tread/nosing pattern instead of a flagstone fill.
 */
export function stepsTexture(materialName: string): Texture {
  const matched = materialTexture(materialName);
  if (!matched) return STEPS;
  return stepTreadTexture(matched.base, "#4a4a44", 1);
}
