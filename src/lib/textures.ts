/**
 * Generic top-down material textures for the design canvas. Keyed by
 * keyword match against the (free-text, editable) material name, so any
 * price book item named e.g. "Belgard Pavers" still gets the paver look.
 * Falls back to a flat color (handled by the caller) when nothing matches.
 */

type Texture = { tile: string; tileSize: number; base: string };

function svgUrl(svg: string) {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A grid of rectangular units (pavers, brick, block) with mortar/sand joints. */
function unitPavingTexture(base: string, line: string, unitW: number, unitH: number): Texture {
  const w = unitW * 2;
  const h = unitH;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${base}"/>
    <line x1="0" y1="0" x2="${w}" y2="0" stroke="${line}" stroke-width="1"/>
    <line x1="0" y1="${h}" x2="${w}" y2="${h}" stroke="${line}" stroke-width="1"/>
    <line x1="${w / 2}" y1="0" x2="${w / 2}" y2="${h}" stroke="${line}" stroke-width="1"/>
    <line x1="0" y1="0" x2="0" y2="${h}" stroke="${line}" stroke-width="1"/>
  </svg>`;
  return { tile: svgUrl(svg), tileSize: unitW, base };
}

/** Irregular flagstone/crazy-paving polygons over a base fill. */
function stoneTexture(base: string, line: string, size = 60): Texture {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${base}"/>
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
  return { tile: svgUrl(svg), tileSize: size, base };
}

/** Scattered speckles over a base fill (mulch, gravel, river rock, granite). */
function speckleTexture(base: string, dark: string, light: string, size = 24): Texture {
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
  return { tile: svgUrl(svg), tileSize: size, base };
}

/** Blade-stroke turf, works for natural sod and artificial turf alike. */
function turfTexture(base: string, blade: string, uniform: boolean): Texture {
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
  return { tile: svgUrl(svg), tileSize: size, base };
}

/** Horizontal plank boards with grain lines, for decking. */
function plankTexture(base: string, line: string, grain: string): Texture {
  const w = 60;
  const h = 16;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${base}"/>
    <line x1="0" y1="${h}" x2="${w}" y2="${h}" stroke="${line}" stroke-width="1.5"/>
    <path d="M4 4 h10 M20 7 h14 M40 3 h16" stroke="${grain}" stroke-width="1" fill="none" opacity="0.6"/>
    <path d="M8 11 h20 M34 9 h20" stroke="${grain}" stroke-width="1" fill="none" opacity="0.5"/>
  </svg>`;
  return { tile: svgUrl(svg), tileSize: h, base };
}

/** Flat fill with a control-joint grid, for poured/stamped concrete and asphalt. */
function slabTexture(base: string, line: string, stamped: boolean): Texture {
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
  return { tile: svgUrl(svg), tileSize: s, base };
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
  return { tile: svgUrl(svg), tileSize: s, base };
}

const PAVERS = unitPavingTexture("#d9c9ab", "#b8a483", 20, 20);
const BRICK_PAVERS = unitPavingTexture("#b5573a", "#8f4029", 18, 9);
const BELGIAN_BLOCK = unitPavingTexture("#8f8b86", "#6b6864", 10, 10);
const BLUESTONE = stoneTexture("#7c8a94", "#5c6a73", 60);
const TRAVERTINE = stoneTexture("#dccdad", "#b8a884", 60);
const NATURAL_STONE = stoneTexture("#c9cdc3", "#9a9d92", 60);
const STONE_WALL = unitPavingTexture("#9a9184", "#726b60", 16, 14);
const WALL_BLOCK = unitPavingTexture("#b7ab97", "#8f8570", 24, 16);
const MULCH = speckleTexture("#6b4226", "#4a2c17", "#8a5a35", 24);
const GRAVEL = speckleTexture("#c9c9c2", "#a8a89f", "#e2e2da", 20);
const RIVER_ROCK = speckleTexture("#a3a89a", "#7d8272", "#c7cbbd", 26);
const CRUSHED_GRANITE = speckleTexture("#c98f7e", "#a8654f", "#e0b7a8", 18);
const SOD = turfTexture("#7cb668", "#5a9146", false);
const ARTIFICIAL_TURF = turfTexture("#5fa550", "#3f7d38", true);
const WOOD_DECKING = plankTexture("#b98354", "#8a5f39", "#9c6f45");
const COMPOSITE_DECKING = plankTexture("#7d7266", "#5c5348", "#6b6155");
const POURED_CONCRETE = slabTexture("#c7c9cb", "#aaacae", false);
const STAMPED_CONCRETE = slabTexture("#c2b6a3", "#a4988733", true);
const ASPHALT = slabTexture("#3f4247", "#2a2c2f", false);
const POOL_WATER = waterTexture();

const MATCHERS: Array<{ test: RegExp; texture: Texture }> = [
  { test: /brick/i, texture: BRICK_PAVERS },
  { test: /belgian block/i, texture: BELGIAN_BLOCK },
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
