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

const PAVERS: Texture = (() => {
  const base = "#d9c9ab";
  const line = "#b8a483";
  const w = 40,
    h = 20;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${base}"/>
    <line x1="0" y1="0" x2="${w}" y2="0" stroke="${line}" stroke-width="1"/>
    <line x1="0" y1="${h}" x2="${w}" y2="${h}" stroke="${line}" stroke-width="1"/>
    <line x1="${w / 2}" y1="0" x2="${w / 2}" y2="${h}" stroke="${line}" stroke-width="1"/>
    <line x1="0" y1="${h / 2}" x2="0" y2="${h / 2}" stroke="${line}" stroke-width="1"/>
  </svg>`;
  return { tile: svgUrl(svg), tileSize: 20, base };
})();

const NATURAL_STONE: Texture = (() => {
  const base = "#c9cdc3";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60">
    <rect width="60" height="60" fill="${base}"/>
    <g fill="none" stroke="#9a9d92" stroke-width="1.4">
      <path d="M0 18 L16 12 L28 20 L22 34 L0 32 Z"/>
      <path d="M16 12 L34 4 L46 14 L28 20 Z"/>
      <path d="M34 4 L60 0 L60 16 L46 14 Z"/>
      <path d="M28 20 L46 14 L54 30 L38 38 L22 34 Z"/>
      <path d="M0 32 L22 34 L18 52 L0 56 Z"/>
      <path d="M22 34 L38 38 L36 58 L18 52 Z"/>
      <path d="M38 38 L54 30 L60 44 L60 60 L36 58 Z"/>
    </g>
  </svg>`;
  return { tile: svgUrl(svg), tileSize: 60, base };
})();

const MULCH: Texture = (() => {
  const base = "#6b4226";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <rect width="28" height="28" fill="${base}"/>
    <g fill="#4a2c17">
      <ellipse cx="5" cy="6" rx="3" ry="1.3" transform="rotate(20 5 6)"/>
      <ellipse cx="20" cy="4" rx="3" ry="1.2" transform="rotate(-15 20 4)"/>
      <ellipse cx="13" cy="15" rx="3.2" ry="1.3" transform="rotate(45 13 15)"/>
      <ellipse cx="23" cy="20" rx="3" ry="1.2" transform="rotate(-30 23 20)"/>
      <ellipse cx="3" cy="22" rx="2.8" ry="1.1" transform="rotate(10 3 22)"/>
    </g>
    <g fill="#8a5a35">
      <ellipse cx="10" cy="4" rx="2.4" ry="1" transform="rotate(-25 10 4)"/>
      <ellipse cx="22" cy="12" rx="2.6" ry="1" transform="rotate(30 22 12)"/>
      <ellipse cx="6" cy="16" rx="2.4" ry="1" transform="rotate(60 6 16)"/>
      <ellipse cx="17" cy="24" rx="2.6" ry="1" transform="rotate(-10 17 24)"/>
    </g>
  </svg>`;
  return { tile: svgUrl(svg), tileSize: 28, base };
})();

const SOD: Texture = (() => {
  const base = "#7cb668";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <rect width="16" height="16" fill="${base}"/>
    <g stroke="#5a9146" stroke-width="1" stroke-linecap="round">
      <line x1="2" y1="14" x2="1" y2="9"/>
      <line x1="5" y1="15" x2="5" y2="8"/>
      <line x1="8" y1="14" x2="9" y2="8"/>
      <line x1="11" y1="15" x2="11" y2="9"/>
      <line x1="14" y1="14" x2="15" y2="9"/>
    </g>
  </svg>`;
  return { tile: svgUrl(svg), tileSize: 16, base };
})();

const GRAVEL: Texture = (() => {
  const base = "#c9c9c2";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
    <rect width="20" height="20" fill="${base}"/>
    <g fill="#a8a89f">
      <circle cx="3" cy="4" r="1.4"/>
      <circle cx="14" cy="2" r="1.1"/>
      <circle cx="9" cy="9" r="1.5"/>
      <circle cx="17" cy="12" r="1.2"/>
      <circle cx="4" cy="15" r="1.3"/>
      <circle cx="12" cy="17" r="1.1"/>
    </g>
    <g fill="#e2e2da">
      <circle cx="7" cy="3" r="1"/>
      <circle cx="17" cy="7" r="1"/>
      <circle cx="2" cy="11" r="1"/>
      <circle cx="10" cy="14" r="1"/>
    </g>
  </svg>`;
  return { tile: svgUrl(svg), tileSize: 20, base };
})();

const WALL_BLOCK: Texture = (() => {
  const base = "#b7ab97";
  const line = "#8f8570";
  const w = 48,
    h = 16;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h * 2}" viewBox="0 0 ${w} ${h * 2}">
    <rect width="${w}" height="${h * 2}" fill="${base}"/>
    <rect x="0" y="0" width="${w}" height="${h}" fill="${base}"/>
    <rect x="0" y="${h}" width="${w}" height="${h}" fill="#aea283"/>
    <g stroke="${line}" stroke-width="1.2">
      <line x1="0" y1="${h}" x2="${w}" y2="${h}"/>
      <line x1="0" y1="0" x2="0" y2="${h}"/>
      <line x1="${w / 3}" y1="0" x2="${w / 3}" y2="${h}"/>
      <line x1="${(w / 3) * 2}" y1="0" x2="${(w / 3) * 2}" y2="${h}"/>
      <line x1="${w / 6}" y1="${h}" x2="${w / 6}" y2="${h * 2}"/>
      <line x1="${w / 2}" y1="${h}" x2="${w / 2}" y2="${h * 2}"/>
      <line x1="${(w / 6) * 5}" y1="${h}" x2="${(w / 6) * 5}" y2="${h * 2}"/>
    </g>
  </svg>`;
  return { tile: svgUrl(svg), tileSize: 24, base };
})();

const CONCRETE: Texture = (() => {
  const base = "#c7c9cb";
  const line = "#aaacae";
  const s = 40;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <rect width="${s}" height="${s}" fill="${base}"/>
    <line x1="0" y1="0" x2="${s}" y2="0" stroke="${line}" stroke-width="1.5"/>
    <line x1="0" y1="0" x2="0" y2="${s}" stroke="${line}" stroke-width="1.5"/>
  </svg>`;
  return { tile: svgUrl(svg), tileSize: s, base };
})();

const MATCHERS: Array<{ test: RegExp; texture: Texture }> = [
  { test: /paver/i, texture: PAVERS },
  { test: /(wall block|retaining wall|block)/i, texture: WALL_BLOCK },
  { test: /(natural stone|flagstone|\bstone\b)/i, texture: NATURAL_STONE },
  { test: /mulch/i, texture: MULCH },
  { test: /(sod|grass|turf|lawn)/i, texture: SOD },
  { test: /(gravel|base fill|aggregate)/i, texture: GRAVEL },
  { test: /concrete/i, texture: CONCRETE },
];

export function materialTexture(materialName: string): Texture | null {
  for (const { test, texture } of MATCHERS) {
    if (test.test(materialName)) return texture;
  }
  return null;
}
