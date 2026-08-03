import type { LineItemKind, ProjectType } from "@prisma/client";

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  PATIO: "Patio",
  RETAINING_WALL: "Retaining Wall",
  WALKWAY: "Walkway",
  PLANTING_BED: "Planting Bed",
  FIRE_PIT: "Fire Pit",
  DRIVEWAY: "Driveway",
  OTHER: "Other",
};

/**
 * Rough resale-value recoup ranges by project type, used only for the
 * client-facing "investment" framing on proposals. Loosely based on
 * commonly cited remodeling-ROI ranges for hardscape/landscape work.
 */
export const ROI_RANGES: Record<ProjectType, { low: number; high: number }> = {
  PATIO: { low: 0.55, high: 0.75 },
  RETAINING_WALL: { low: 0.4, high: 0.6 },
  WALKWAY: { low: 0.5, high: 0.7 },
  PLANTING_BED: { low: 0.4, high: 1.0 },
  FIRE_PIT: { low: 0.3, high: 0.5 },
  DRIVEWAY: { low: 0.5, high: 0.7 },
  OTHER: { low: 0.35, high: 0.55 },
};

export interface DefaultPriceBookItem {
  kind: LineItemKind;
  name: string;
  unit: string;
  unitCost: number;
  projectType: ProjectType | null;
}

/**
 * A material's `unit` string decides how it's quantified. Anything
 * mentioning "yard" is treated as a volume (cubic yard) material — priced
 * off area x depth, for base-prep layers like crushed stone or sand
 * bedding — everything else is priced per sqft of footprint/face area.
 */
export function isVolumeUnit(unit: string): boolean {
  return /yard/i.test(unit);
}

/**
 * Seeded into a contractor's price book at onboarding, editable afterward.
 * Material-only unit costs (labor is priced separately, below) — the ones
 * marked below were checked in 2026 against real Canadian supplier/market
 * pricing and adjusted to match; everything else is a reasonable estimate
 * that wasn't specifically re-verified. Every contractor is expected to
 * calibrate these against their own actual supplier quotes in Settings —
 * this is a starting point, not a substitute for that.
 */
export const DEFAULT_PRICE_BOOK: DefaultPriceBookItem[] = [
  // Surface materials — priced per sqft of finished area unless noted
  { kind: "MATERIAL", name: "Concrete Pavers", unit: "sqft", unitCost: 8, projectType: null }, // CAD market-checked: $5-10 standard, $12-20 premium brands
  { kind: "MATERIAL", name: "Brick Pavers", unit: "sqft", unitCost: 10, projectType: null }, // CAD market-checked: same paver category as above
  { kind: "MATERIAL", name: "Belgian Block", unit: "sqft", unitCost: 16, projectType: null },
  { kind: "MATERIAL", name: "Natural Stone", unit: "sqft", unitCost: 8, projectType: null }, // CAD market-checked: $3.90-11/sqft material-only flagstone
  { kind: "MATERIAL", name: "Bluestone", unit: "sqft", unitCost: 26, projectType: null },
  { kind: "MATERIAL", name: "Travertine", unit: "sqft", unitCost: 28, projectType: null },
  { kind: "MATERIAL", name: "Poured Concrete", unit: "sqft", unitCost: 4, projectType: null }, // CAD market-checked: ~$2.50/sqft raw material example, $5-10/sqft installed total
  { kind: "MATERIAL", name: "Stamped Concrete", unit: "sqft", unitCost: 6, projectType: null }, // scaled with poured concrete correction above
  { kind: "MATERIAL", name: "Asphalt", unit: "sqft", unitCost: 3, projectType: null }, // CAD market-checked: $3-8.50/sqft installed total (incl. labor)
  { kind: "MATERIAL", name: "Mulch", unit: "sqft", unitCost: 0.45, projectType: null }, // CAD market-checked: ~$0.30-0.50/sqft at 3in from bulk CAD$35-55/cy
  { kind: "MATERIAL", name: "Sod", unit: "sqft", unitCost: 0.65, projectType: null }, // CAD market-checked: $0.30-0.85/sqft material-only (Ontario)
  { kind: "MATERIAL", name: "Artificial Turf", unit: "sqft", unitCost: 7, projectType: null }, // CAD market-checked: $5-9/sqft material-only typical
  { kind: "MATERIAL", name: "River Rock", unit: "sqft", unitCost: 6, projectType: null },
  { kind: "MATERIAL", name: "Crushed Granite", unit: "sqft", unitCost: 4, projectType: null },
  { kind: "MATERIAL", name: "Gravel / Base Fill", unit: "sqft", unitCost: 3, projectType: null },
  { kind: "MATERIAL", name: "Retaining Wall Block", unit: "sqft", unitCost: 12, projectType: null }, // CAD market-checked: $5-8 basic, $10-18 premium
  { kind: "MATERIAL", name: "Natural Stone Wall", unit: "sqft", unitCost: 24, projectType: null },
  { kind: "MATERIAL", name: "Cedar Decking", unit: "sqft", unitCost: 16, projectType: null },
  { kind: "MATERIAL", name: "Composite Decking", unit: "sqft", unitCost: 12, projectType: null }, // CAD market-checked: Trex-tier $7-12/sqft standard, $15-20+ premium
  { kind: "MATERIAL", name: "Pool Construction", unit: "sqft", unitCost: 65, projectType: null },

  // Base-prep materials — priced per cubic yard, used as an optional
  // sub-layer under a shape (e.g. 4" of 3/4" crush under a patio).
  { kind: "MATERIAL", name: "3/4\" Crushed Stone", unit: "cubic yard", unitCost: 52, projectType: null }, // CAD market-checked: Ontario example $59/cy delivered, general $25-60/cy
  { kind: "MATERIAL", name: "Road Base / Crusher Run", unit: "cubic yard", unitCost: 48, projectType: null }, // scaled with crushed stone correction above
  { kind: "MATERIAL", name: "Sand Bedding", unit: "cubic yard", unitCost: 40, projectType: null },
  { kind: "MATERIAL", name: "Topsoil", unit: "cubic yard", unitCost: 35, projectType: null },

  // Labor — priced per sqft of finished area, varies by project type
  { kind: "LABOR", name: "Patio Installation Labor", unit: "sqft", unitCost: 8, projectType: "PATIO" },
  { kind: "LABOR", name: "Retaining Wall Labor", unit: "sqft", unitCost: 14, projectType: "RETAINING_WALL" },
  { kind: "LABOR", name: "Walkway Installation Labor", unit: "sqft", unitCost: 7, projectType: "WALKWAY" },
  { kind: "LABOR", name: "Planting Bed Labor", unit: "sqft", unitCost: 3, projectType: "PLANTING_BED" },
  { kind: "LABOR", name: "Fire Pit Installation Labor", unit: "sqft", unitCost: 10, projectType: "FIRE_PIT" },
  { kind: "LABOR", name: "Driveway Installation Labor", unit: "sqft", unitCost: 6, projectType: "DRIVEWAY" },
  { kind: "LABOR", name: "General Installation Labor", unit: "sqft", unitCost: 6, projectType: "OTHER" },
];

/** Default materials suggested per shape type when building a design layout. */
export const SHAPE_DEFAULT_MATERIAL: Record<string, string> = {
  PATIO: "Concrete Pavers",
  WALKWAY: "Concrete Pavers",
  WALL: "Retaining Wall Block",
  BED: "Mulch",
  FIREPIT: "Natural Stone",
  DECK: "Cedar Decking",
  DRIVEWAY: "Asphalt",
  POOL: "Pool Construction",
  STEPS: "Natural Stone",
  LAWN: "Sod",
  TREE: "Mulch",
  STRUCTURE: "Cedar Decking",
};

/** Materials suggested for the optional base-prep layer, by shape type. */
export const SHAPE_DEFAULT_BASE_MATERIAL: Partial<Record<string, string>> = {
  PATIO: "3/4\" Crushed Stone",
  WALKWAY: "3/4\" Crushed Stone",
  DRIVEWAY: "Road Base / Crusher Run",
  DECK: "Road Base / Crusher Run",
  POOL: "Sand Bedding",
  STEPS: "3/4\" Crushed Stone",
  BED: "Topsoil",
  LAWN: "Topsoil",
};

export const DEFAULT_MARGIN_PCT = 0.2;
