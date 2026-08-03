export interface Point {
  x: number;
  y: number;
}

export interface BaseLayer {
  material: string;
  depthIn: number;
}

/** Shoelace formula. Works for any simple (non-self-intersecting) polygon. */
export function polygonArea(points: Point[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

export function polygonBounds(points: Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

export function rectPoints(cx: number, cy: number, w: number, h: number): Point[] {
  return [
    { x: cx - w / 2, y: cy - h / 2 },
    { x: cx + w / 2, y: cy - h / 2 },
    { x: cx + w / 2, y: cy + h / 2 },
    { x: cx - w / 2, y: cy + h / 2 },
  ];
}

export function clampPoint(p: Point, maxX: number, maxY: number): Point {
  return {
    x: Math.min(Math.max(0, p.x), maxX),
    y: Math.min(Math.max(0, p.y), maxY),
  };
}

/**
 * A wall's footprint (plan-view thickness) isn't what gets priced — its
 * face area is. Approximates the wall's run length as the longer side of
 * its bounding box, which holds for the straight/near-straight segments a
 * wall is expected to be drawn as (a stepped or curved wall is drawn as
 * several separate wall shapes, each with its own height).
 */
export function wallRunLength(points: Point[]): number {
  const bounds = polygonBounds(points);
  return Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
}

/**
 * The area that should actually be quoted for a shape. Every shape type
 * except WALL is flat, so footprint area is correct. A wall is priced by
 * face area (run length x height) since that's what block/cap coverage
 * actually depends on.
 */
export function shapeQuotedArea(
  type: string,
  points: Point[],
  heightFt: number | null | undefined
): number {
  if (type === "WALL" && heightFt) {
    return wallRunLength(points) * heightFt;
  }
  return polygonArea(points);
}

export function centroid(points: Point[]): Point {
  return {
    x: points.reduce((s, p) => s + p.x, 0) / points.length,
    y: points.reduce((s, p) => s + p.y, 0) / points.length,
  };
}

/** Rotates points rigidly around a center by an angle (radians). */
export function rotatePoints(points: Point[], center: Point, angle: number): Point[] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return points.map((p) => {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  });
}

/**
 * A shape's current orientation, in degrees, derived from its own geometry
 * rather than tracked as separate state — the edge from its first to second
 * vertex starts perfectly horizontal for every shape this editor creates
 * (rectPoints' top edge), so any deviation from 0 is exactly how far the
 * rotate handle has turned it. Lets directional textures (deck planks,
 * stair treads, wall coursing) rotate along with the shape.
 */
export function shapeAngleDeg(points: Point[]): number {
  if (points.length < 2) return 0;
  const [a, b] = points;
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

/**
 * Volume, in cubic yards, of a depth_in-thick layer spread across
 * area_sqft — how base-prep materials (crushed stone, sand bedding) are
 * actually bought and priced, unlike surface materials which are per sqft.
 */
export function cubicYards(areaSqft: number, depthIn: number): number {
  if (areaSqft <= 0 || depthIn <= 0) return 0;
  return (areaSqft * (depthIn / 12)) / 27;
}
