import { materialTexture } from "@/lib/textures";

/**
 * A decorative, static rendering of the actual design canvas — real
 * paver/mulch/stone textures from the product, not a stock photo or
 * generic illustration. What you see here is what the tool draws.
 */
export function HeroCanvas() {
  const patio = materialTexture("Concrete Pavers")!;
  const bed = materialTexture("Mulch")!;
  const walk = materialTexture("Natural Stone")!;

  return (
    <svg
      viewBox="0 0 440 360"
      className="w-full h-auto"
      role="img"
      aria-label="A sample patio and planting bed layout drawn in GroundWork's design canvas"
    >
      <defs>
        <pattern id="hero-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
        </pattern>
        <pattern id="hero-patio" patternUnits="userSpaceOnUse" width={patio.tileSize} height={patio.tileSize}>
          <image href={patio.tile} width={patio.tileSize} height={patio.tileSize} />
        </pattern>
        <pattern id="hero-bed" patternUnits="userSpaceOnUse" width={bed.tileSize} height={bed.tileSize}>
          <image href={bed.tile} width={bed.tileSize} height={bed.tileSize} />
        </pattern>
        <pattern id="hero-walk" patternUnits="userSpaceOnUse" width={walk.tileSize} height={walk.tileSize}>
          <image href={walk.tile} width={walk.tileSize} height={walk.tileSize} />
        </pattern>
      </defs>

      <rect width="440" height="360" fill="url(#hero-grid)" className="text-foreground" />
      <rect
        x="0.5"
        y="0.5"
        width="439"
        height="359"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.15"
        className="text-foreground"
      />

      {/* Walkway */}
      <polygon points="30,40 90,40 250,300 190,320" fill="url(#hero-walk)" stroke="rgba(0,0,0,0.35)" />
      {/* Patio */}
      <polygon points="220,180 400,180 400,320 250,320" fill="url(#hero-patio)" stroke="rgba(0,0,0,0.35)" />
      {/* Planting bed */}
      <polygon points="30,60 130,60 130,140 30,140" fill="url(#hero-bed)" stroke="rgba(0,0,0,0.35)" />

      <text
        x="310"
        y="250"
        textAnchor="middle"
        className="fill-foreground font-mono"
        style={{ fontSize: 12, opacity: 0.75 }}
      >
        Patio · 21 × 8 ft
      </text>
      <text
        x="80"
        y="105"
        textAnchor="middle"
        className="fill-foreground font-mono"
        style={{ fontSize: 11, opacity: 0.7 }}
      >
        Bed
      </text>

      {/* corner + edge handles, like the real editor */}
      {[
        [220, 180],
        [400, 180],
        [400, 320],
        [250, 320],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={5} fill="#ffffff" stroke="#2f4a34" strokeWidth={1.5} />
      ))}
    </svg>
  );
}
