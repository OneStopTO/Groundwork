"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DesignShape, Job } from "@prisma/client";
import { saveShapesAction } from "@/lib/actions";
import { SHAPE_DEFAULT_MATERIAL } from "@/lib/pricing";
import { materialTexture } from "@/lib/textures";
import {
  polygonBounds,
  rectPoints,
  clampPoint,
  shapeQuotedArea,
  wallRunLength,
  type Point,
} from "@/lib/geometry";

type ShapeType = "PATIO" | "WALKWAY" | "WALL" | "BED" | "FIREPIT";

interface EditableShape {
  id: string;
  type: ShapeType;
  material: string;
  label: string;
  points: Point[];
  heightFt?: number | null;
}

const DEFAULT_WALL_HEIGHT_FT = 2;

const SHAPE_DEFAULTS: Record<ShapeType, { width: number; height: number; color: string; name: string }> = {
  PATIO: { width: 14, height: 12, color: "#7dd3fc", name: "Patio" },
  WALKWAY: { width: 20, height: 3, color: "#d4d4d8", name: "Walkway" },
  WALL: { width: 20, height: 1.5, color: "#a8a29e", name: "Retaining Wall" },
  BED: { width: 6, height: 4, color: "#86efac", name: "Planting Bed" },
  FIREPIT: { width: 8, height: 8, color: "#fdba74", name: "Fire Pit" },
};

const MAX_CANVAS_PX = 720;
const MIN_SCALE = 3;
const MAX_SCALE = 50;

function toEditable(shapes: DesignShape[]): EditableShape[] {
  return shapes.map((s) => ({
    id: s.id,
    type: s.type as ShapeType,
    material: s.material,
    label: s.label ?? "",
    points: JSON.parse(s.points) as Point[],
    heightFt: s.heightFt ?? undefined,
  }));
}

function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

type DragMode =
  | { kind: "shape"; shapeId: string; startPx: number; startPy: number; startPoints: Point[] }
  | { kind: "vertex"; shapeId: string; index: number; startPx: number; startPy: number; startPoint: Point };

export function DesignEditor({
  job,
  initialShapes,
  materialNames,
}: {
  job: Job;
  initialShapes: DesignShape[];
  materialNames: string[];
}) {
  const router = useRouter();
  const [shapes, setShapes] = useState<EditableShape[]>(() => toEditable(initialShapes));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const dragState = useRef<DragMode | null>(null);

  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, MAX_CANVAS_PX / Math.max(job.lengthFt, 1)));
  const canvasWidthPx = job.lengthFt * scale;
  const canvasHeightPx = job.widthFt * scale;
  const gridFt = scale > 20 ? 2 : scale > 8 ? 5 : 10;

  const addShape = (type: ShapeType) => {
    const def = SHAPE_DEFAULTS[type];
    const width = Math.min(def.width, job.lengthFt);
    const height = Math.min(def.height, job.widthFt);
    const cx = Math.min(Math.max(width / 2, job.lengthFt / 2), job.lengthFt - width / 2);
    const cy = Math.min(Math.max(height / 2, job.widthFt / 2), job.widthFt - height / 2);
    const newShape: EditableShape = {
      id: crypto.randomUUID(),
      type,
      material: SHAPE_DEFAULT_MATERIAL[type] ?? materialNames[0] ?? "Concrete Pavers",
      label: def.name,
      points: rectPoints(cx, cy, width, height),
      heightFt: type === "WALL" ? DEFAULT_WALL_HEIGHT_FT : undefined,
    };
    setShapes((prev) => [...prev, newShape]);
    setSelectedId(newShape.id);
    setSelectedVertex(null);
  };

  const updateShape = (id: string, patch: Partial<EditableShape>) => {
    setShapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const deleteShape = (id: string) => {
    setShapes((prev) => prev.filter((s) => s.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
    setSelectedVertex(null);
  };

  const insertVertex = (shapeId: string, edgeIndex: number) => {
    setShapes((prev) =>
      prev.map((s) => {
        if (s.id !== shapeId) return s;
        const a = s.points[edgeIndex];
        const b = s.points[(edgeIndex + 1) % s.points.length];
        const newPoint = midpoint(a, b);
        const points = [...s.points];
        points.splice(edgeIndex + 1, 0, newPoint);
        return { ...s, points };
      })
    );
  };

  const deleteVertex = (shapeId: string, index: number) => {
    setShapes((prev) =>
      prev.map((s) => {
        if (s.id !== shapeId || s.points.length <= 3) return s;
        return { ...s, points: s.points.filter((_, i) => i !== index) };
      })
    );
    setSelectedVertex(null);
  };

  /** Precise numeric entry for one corner — a companion to dragging, not a replacement. */
  const setVertexPosition = (shapeId: string, index: number, axis: "x" | "y", value: number) => {
    if (Number.isNaN(value)) return;
    setShapes((prev) =>
      prev.map((s) => {
        if (s.id !== shapeId) return s;
        const points = [...s.points];
        const clamped = clampPoint(
          { ...points[index], [axis]: value },
          job.lengthFt,
          job.widthFt
        );
        points[index] = clamped;
        return { ...s, points };
      })
    );
  };

  /** Scales the whole shape's bounding box to an exact width/height, anchored at its top-left. */
  const setShapeSize = (shapeId: string, axis: "width" | "height", value: number) => {
    if (Number.isNaN(value) || value <= 0) return;
    setShapes((prev) =>
      prev.map((s) => {
        if (s.id !== shapeId) return s;
        const bounds = polygonBounds(s.points);
        const currentW = bounds.maxX - bounds.minX || 1;
        const currentH = bounds.maxY - bounds.minY || 1;
        const scaleX = axis === "width" ? value / currentW : 1;
        const scaleY = axis === "height" ? value / currentH : 1;
        const points = s.points.map((p) =>
          clampPoint(
            {
              x: bounds.minX + (p.x - bounds.minX) * scaleX,
              y: bounds.minY + (p.y - bounds.minY) * scaleY,
            },
            job.lengthFt,
            job.widthFt
          )
        );
        return { ...s, points };
      })
    );
  };

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragState.current;
      if (!drag) return;
      const dxFt = (e.clientX - drag.startPx) / scale;
      const dyFt = (e.clientY - drag.startPy) / scale;

      setShapes((prev) =>
        prev.map((s) => {
          if (s.id !== drag.shapeId) return s;
          if (drag.kind === "shape") {
            const xs = drag.startPoints.map((p) => p.x);
            const ys = drag.startPoints.map((p) => p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const clampedDx = Math.min(Math.max(dxFt, -minX), job.lengthFt - maxX);
            const clampedDy = Math.min(Math.max(dyFt, -minY), job.widthFt - maxY);
            return {
              ...s,
              points: drag.startPoints.map((p) => ({ x: p.x + clampedDx, y: p.y + clampedDy })),
            };
          } else {
            const points = [...s.points];
            points[drag.index] = clampPoint(
              { x: drag.startPoint.x + dxFt, y: drag.startPoint.y + dyFt },
              job.lengthFt,
              job.widthFt
            );
            return { ...s, points };
          }
        })
      );
    },
    [scale, job.lengthFt, job.widthFt]
  );

  const endDrag = useCallback(() => {
    dragState.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
    window.removeEventListener("mouseup", endDrag);
    window.removeEventListener("blur", endDrag);
  }, [onPointerMove]);

  const attachDragListeners = () => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    // Defensive: some environments (embedded browsers, automation, a mouse
    // released outside the window) can fail to fire pointerup. Without a
    // fallback the drag would stay "stuck" and keep moving on any later
    // pointer activity.
    window.addEventListener("pointercancel", endDrag);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("blur", endDrag);
  };

  const startShapeDrag = (e: React.PointerEvent, shape: EditableShape) => {
    e.stopPropagation();
    setSelectedId(shape.id);
    setSelectedVertex(null);
    dragState.current = {
      kind: "shape",
      shapeId: shape.id,
      startPx: e.clientX,
      startPy: e.clientY,
      startPoints: shape.points,
    };
    attachDragListeners();
  };

  const startVertexDrag = (e: React.PointerEvent, shape: EditableShape, index: number) => {
    e.stopPropagation();
    setSelectedId(shape.id);
    setSelectedVertex(index);
    dragState.current = {
      kind: "vertex",
      shapeId: shape.id,
      index,
      startPx: e.clientX,
      startPy: e.clientY,
      startPoint: shape.points[index],
    };
    attachDragListeners();
  };

  const selected = shapes.find((s) => s.id === selectedId) ?? null;

  const save = async (andGoToQuote: boolean) => {
    setSaving(true);
    try {
      await saveShapesAction(job.id, shapes);
      if (andGoToQuote) {
        router.push(`/jobs/${job.id}/quote`);
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-6">
      <div>
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(SHAPE_DEFAULTS) as ShapeType[]).map((type) => (
            <button
              key={type}
              onClick={() => addShape(type)}
              className="text-sm rounded-md border border-black/15 dark:border-white/20 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10"
              style={{ borderLeft: `4px solid ${SHAPE_DEFAULTS[type].color}` }}
            >
              + {SHAPE_DEFAULTS[type].name}
            </button>
          ))}
        </div>

        <div
          className="relative border border-black/15 dark:border-white/20 bg-white dark:bg-black/40 overflow-hidden"
          style={{
            width: canvasWidthPx,
            height: canvasHeightPx,
            backgroundImage:
              "linear-gradient(to right, rgba(120,120,120,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(120,120,120,0.15) 1px, transparent 1px)",
            backgroundSize: `${gridFt * scale}px ${gridFt * scale}px`,
          }}
        >
          <svg
            width={canvasWidthPx}
            height={canvasHeightPx}
            className="absolute inset-0"
            onPointerDown={() => {
              setSelectedId(null);
              setSelectedVertex(null);
            }}
          >
            <defs>
              {shapes.map((shape) => {
                const texture = materialTexture(shape.material);
                if (!texture) return null;
                return (
                  <pattern
                    key={shape.id}
                    id={`tex-${shape.id}`}
                    patternUnits="userSpaceOnUse"
                    width={texture.tileSize}
                    height={texture.tileSize}
                  >
                    <image href={texture.tile} width={texture.tileSize} height={texture.tileSize} />
                  </pattern>
                );
              })}
            </defs>

            {shapes.map((shape) => {
              const texture = materialTexture(shape.material);
              const pxPoints = shape.points.map((p) => `${p.x * scale},${p.y * scale}`).join(" ");
              const isSelected = selectedId === shape.id;
              return (
                <g key={shape.id}>
                  <polygon
                    points={pxPoints}
                    fill={texture ? `url(#tex-${shape.id})` : SHAPE_DEFAULTS[shape.type].color}
                    stroke={isSelected ? "#047857" : "rgba(0,0,0,0.35)"}
                    strokeWidth={isSelected ? 2 : 1}
                    className="cursor-move"
                    onPointerDown={(e) => startShapeDrag(e, shape)}
                  />
                  {isSelected &&
                    shape.points.map((p, i) => {
                      const next = shape.points[(i + 1) % shape.points.length];
                      const mid = midpoint(p, next);
                      return (
                        <g key={i}>
                          <circle
                            cx={mid.x * scale}
                            cy={mid.y * scale}
                            r={5}
                            fill="#ffffff"
                            stroke="#047857"
                            strokeWidth={1.5}
                            className="cursor-copy"
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              insertVertex(shape.id, i);
                            }}
                          />
                          <circle
                            cx={p.x * scale}
                            cy={p.y * scale}
                            r={6}
                            fill={selectedVertex === i ? "#047857" : "#ffffff"}
                            stroke="#047857"
                            strokeWidth={2}
                            className="cursor-grab"
                            onPointerDown={(e) => startVertexDrag(e, shape, i)}
                          />
                        </g>
                      );
                    })}
                </g>
              );
            })}
          </svg>

          {shapes.map((shape) => {
            const cx = shape.points.reduce((s, p) => s + p.x, 0) / shape.points.length;
            const cy = shape.points.reduce((s, p) => s + p.y, 0) / shape.points.length;
            return (
              <span
                key={shape.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none truncate bg-white/80 dark:bg-black/70 px-1 rounded-sm text-[11px] font-medium text-black/80"
                style={{ left: cx * scale, top: cy * scale }}
              >
                {shape.label || SHAPE_DEFAULTS[shape.type].name} ·{" "}
                {Math.round(shapeQuotedArea(shape.type, shape.points, shape.heightFt))} sqft
              </span>
            );
          })}

          {shapes.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-black/40 dark:text-white/40 pointer-events-none">
              Add a shape above, then drag to position and reshape it.
            </p>
          )}
        </div>
        <p className="text-xs text-black/50 dark:text-white/50 mt-2">
          Canvas scale: 1 grid square = {gridFt}ft. Drag a corner to reshape (add a
          notch or angle it). Click the small + on an edge to add a new corner
          there.
        </p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="rounded-md border border-black/15 dark:border-white/20 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save design"}
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="rounded-md bg-emerald-700 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-800 disabled:opacity-60"
          >
            Save & generate quote →
          </button>
        </div>
      </div>

      <aside className="space-y-6">
        {job.photoUrl && (
          <div>
            <p className="text-sm font-medium mb-2">Reference photo</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={job.photoUrl}
              alt="Property reference"
              className="w-full rounded-md border border-black/10 dark:border-white/10"
            />
          </div>
        )}

        {selected ? (
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 space-y-3">
            <p className="text-sm font-semibold">Selected element</p>
            <div>
              <label className="block text-xs font-medium mb-1">Label</label>
              <input
                value={selected.label}
                onChange={(e) => updateShape(selected.id, { label: e.target.value })}
                className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Material</label>
              <select
                value={selected.material}
                onChange={(e) => updateShape(selected.id, { material: e.target.value })}
                className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-sm"
              >
                {Array.from(new Set([selected.material, ...materialNames])).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-black/50 dark:text-white/50">
              {selected.points.length} corners ·{" "}
              {Math.round(shapeQuotedArea(selected.type, selected.points, selected.heightFt))} sqft
              {selected.type === "WALL" ? " (wall face)" : ""}
            </p>

            {(() => {
              const bounds = polygonBounds(selected.points);
              const isWall = selected.type === "WALL";
              return (
                <div>
                  <p className="text-xs font-medium mb-1">
                    {isWall
                      ? "Footprint (drag to get close, then set exact numbers)"
                      : "Overall size (drag to get close, then set exact numbers)"}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <NumberField
                      label={isWall ? "Length (ft)" : "Width (ft)"}
                      value={Math.round((bounds.maxX - bounds.minX) * 100) / 100}
                      onChange={(v) => setShapeSize(selected.id, "width", v)}
                    />
                    <NumberField
                      label={isWall ? "Thickness (ft)" : "Height (ft)"}
                      value={Math.round((bounds.maxY - bounds.minY) * 100) / 100}
                      onChange={(v) => setShapeSize(selected.id, "height", v)}
                    />
                  </div>
                </div>
              );
            })()}

            {selected.type === "WALL" && (
              <div>
                <p className="text-xs font-medium mb-1">
                  Wall height (courses + cap)
                </p>
                <NumberField
                  label="Height (ft)"
                  value={selected.heightFt ?? DEFAULT_WALL_HEIGHT_FT}
                  onChange={(v) => updateShape(selected.id, { heightFt: Math.max(0.1, v) })}
                />
                <p className="text-xs text-black/50 dark:text-white/50 mt-1">
                  Face area: {Math.round(wallRunLength(selected.points) * 10) / 10}ft run ×{" "}
                  {(selected.heightFt ?? DEFAULT_WALL_HEIGHT_FT).toFixed(1)}ft ={" "}
                  {Math.round(
                    wallRunLength(selected.points) * (selected.heightFt ?? DEFAULT_WALL_HEIGHT_FT)
                  )}{" "}
                  sqft
                </p>
              </div>
            )}

            {selectedVertex !== null && (
              <div>
                <p className="text-xs font-medium mb-1">
                  Selected corner position
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <NumberField
                    label="X (ft)"
                    value={Math.round(selected.points[selectedVertex].x * 100) / 100}
                    onChange={(v) => setVertexPosition(selected.id, selectedVertex, "x", v)}
                  />
                  <NumberField
                    label="Y (ft)"
                    value={Math.round(selected.points[selectedVertex].y * 100) / 100}
                    onChange={(v) => setVertexPosition(selected.id, selectedVertex, "y", v)}
                  />
                </div>
                <button
                  onClick={() => deleteVertex(selected.id, selectedVertex)}
                  disabled={selected.points.length <= 3}
                  className="mt-2 text-sm text-red-600 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Delete selected corner{selected.points.length <= 3 ? " (min. 3)" : ""}
                </button>
              </div>
            )}
            <button
              onClick={() => deleteShape(selected.id)}
              className="block text-sm text-red-600 hover:underline"
            >
              Delete element
            </button>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-black/15 dark:border-white/15 p-4 text-sm text-black/50 dark:text-white/50">
            Select an element on the canvas to edit its material, or drag a
            corner to reshape it.
          </div>
        )}

        <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm space-y-1">
          <p className="font-semibold mb-1">Layout summary</p>
          {shapes.length === 0 && <p className="text-black/50 dark:text-white/50">No elements yet.</p>}
          {shapes.map((s) => (
            <div key={s.id} className="flex justify-between text-black/70 dark:text-white/70">
              <span>{s.label || SHAPE_DEFAULTS[s.type].name}</span>
              <span>{Math.round(shapeQuotedArea(s.type, s.points, s.heightFt))} sqft</span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1">{label}</label>
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-black/15 dark:border-white/20 bg-transparent px-2 py-1 text-sm"
      />
    </div>
  );
}
