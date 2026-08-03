import type { PriceBookItem, ProjectType } from "@prisma/client";
import { DEFAULT_MARGIN_PCT } from "./pricing";
import { shapeQuotedArea, cubicYards, type Point, type BaseLayer } from "./geometry";

export interface ComputedLineItem {
  kind: "MATERIAL" | "LABOR" | "MARGIN";
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  lineTotal: number;
}

export interface ComputedQuote {
  lineItems: ComputedLineItem[];
  materialTotal: number;
  laborTotal: number;
  subtotal: number;
  marginPct: number;
  marginAmount: number;
  total: number;
}

export interface TakeoffLine {
  material: string;
  quantity: number;
  unit: string;
}

/**
 * Plain quantity-per-material breakdown with no pricing — the shopping list
 * a contractor actually brings to the supplier counter or hands to a crew,
 * as opposed to the priced quote shown to the client.
 */
export function materialsTakeoff(
  shapes: Array<{
    type: string;
    material: string;
    points: Point[];
    heightFt?: number | null;
    baseLayers?: BaseLayer[] | null;
  }>,
  priceBook: Pick<PriceBookItem, "name" | "unit">[]
): { surface: TakeoffLine[]; base: TakeoffLine[] } {
  const unitByName = new Map(priceBook.map((p) => [p.name, p.unit]));
  const surfaceByName = new Map<string, number>();
  const baseByName = new Map<string, number>();

  for (const shape of shapes) {
    const area = shapeQuotedArea(shape.type, shape.points, shape.heightFt);
    surfaceByName.set(shape.material, (surfaceByName.get(shape.material) ?? 0) + area);

    for (const layer of shape.baseLayers ?? []) {
      if (!layer.material || !layer.depthIn) continue;
      const volume = cubicYards(area, layer.depthIn);
      baseByName.set(layer.material, (baseByName.get(layer.material) ?? 0) + volume);
    }
  }

  const toLines = (map: Map<string, number>, fallbackUnit: string): TakeoffLine[] =>
    Array.from(map.entries())
      .map(([material, quantity]) => ({
        material,
        quantity: Math.round(quantity * 100) / 100,
        unit: unitByName.get(material) ?? fallbackUnit,
      }))
      .sort((a, b) => a.material.localeCompare(b.material));

  return {
    surface: toLines(surfaceByName, "sqft"),
    base: toLines(baseByName, "cubic yard"),
  };
}

/**
 * Builds an itemized quote from a job's design shapes and the contractor's
 * price book. Materials are aggregated by material name across shapes; labor
 * is priced per sqft using the price book's rate for the job's project type
 * (falling back to the generic OTHER labor rate if none is set).
 */
export function computeQuote(
  shapes: Array<{
    type: string;
    material: string;
    points: Point[];
    heightFt?: number | null;
    baseLayers?: BaseLayer[] | null;
  }>,
  priceBook: Pick<PriceBookItem, "kind" | "name" | "unit" | "unitCost" | "projectType">[],
  projectType: ProjectType,
  marginPct: number = DEFAULT_MARGIN_PCT
): ComputedQuote {
  const materialRates = new Map(
    priceBook.filter((p) => p.kind === "MATERIAL").map((p) => [p.name, p])
  );

  const laborItem =
    priceBook.find((p) => p.kind === "LABOR" && p.projectType === projectType) ??
    priceBook.find((p) => p.kind === "LABOR" && p.projectType === "OTHER") ??
    priceBook.find((p) => p.kind === "LABOR");

  const materialAreaByName = new Map<string, number>();
  const baseVolumeByName = new Map<string, number>();
  let totalAreaSqft = 0;

  for (const shape of shapes) {
    const area = shapeQuotedArea(shape.type, shape.points, shape.heightFt);
    totalAreaSqft += area;
    materialAreaByName.set(
      shape.material,
      (materialAreaByName.get(shape.material) ?? 0) + area
    );

    for (const layer of shape.baseLayers ?? []) {
      if (!layer.material || !layer.depthIn) continue;
      const volume = cubicYards(area, layer.depthIn);
      baseVolumeByName.set(
        layer.material,
        (baseVolumeByName.get(layer.material) ?? 0) + volume
      );
    }
  }

  const lineItems: ComputedLineItem[] = [];
  let materialTotal = 0;

  for (const [materialName, area] of materialAreaByName) {
    const rate = materialRates.get(materialName);
    const unitCost = rate?.unitCost ?? 0;
    const unit = rate?.unit ?? "sqft";
    const lineTotal = area * unitCost;
    materialTotal += lineTotal;
    lineItems.push({
      kind: "MATERIAL",
      description: materialName,
      quantity: Math.round(area * 100) / 100,
      unit,
      unitCost,
      lineTotal: Math.round(lineTotal * 100) / 100,
    });
  }

  for (const [materialName, volume] of baseVolumeByName) {
    const rate = materialRates.get(materialName);
    const unitCost = rate?.unitCost ?? 0;
    const unit = rate?.unit ?? "cubic yard";
    const lineTotal = volume * unitCost;
    materialTotal += lineTotal;
    lineItems.push({
      kind: "MATERIAL",
      description: `${materialName} (base prep)`,
      quantity: Math.round(volume * 100) / 100,
      unit,
      unitCost,
      lineTotal: Math.round(lineTotal * 100) / 100,
    });
  }

  let laborTotal = 0;
  if (laborItem && totalAreaSqft > 0) {
    laborTotal = totalAreaSqft * laborItem.unitCost;
    lineItems.push({
      kind: "LABOR",
      description: laborItem.name,
      quantity: Math.round(totalAreaSqft * 100) / 100,
      unit: laborItem.unit,
      unitCost: laborItem.unitCost,
      lineTotal: Math.round(laborTotal * 100) / 100,
    });
  }

  const subtotal = materialTotal + laborTotal;
  const marginAmount = subtotal * marginPct;
  lineItems.push({
    kind: "MARGIN",
    description: `Margin (${Math.round(marginPct * 100)}%)`,
    quantity: 1,
    unit: "job",
    unitCost: Math.round(marginAmount * 100) / 100,
    lineTotal: Math.round(marginAmount * 100) / 100,
  });

  const total = subtotal + marginAmount;

  return {
    lineItems,
    materialTotal: Math.round(materialTotal * 100) / 100,
    laborTotal: Math.round(laborTotal * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    marginPct,
    marginAmount: Math.round(marginAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
