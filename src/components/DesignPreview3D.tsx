"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { materialTexture } from "@/lib/textures";
import type { Point } from "@/lib/geometry";

interface PreviewShape {
  id: string;
  type: string;
  material: string;
  points: Point[];
  heightFt?: number | null;
}

const DECK_ELEVATION_FT = 1.5;
const STEPS_TREAD_COUNT = 4;

/** Nominal extrusion thickness/height in feet for shape types with no more specific rule below. */
const FLAT_HEIGHT_FT: Partial<Record<string, number>> = {
  PATIO: 0.3,
  WALKWAY: 0.25,
  DRIVEWAY: 0.35,
  LAWN: 0.06,
  BED: 0.3,
  FIREPIT: 1.2,
  STRUCTURE: 8,
};

const FALLBACK_COLOR: Record<string, string> = {
  PATIO: "#7dd3fc",
  WALKWAY: "#d4d4d8",
  WALL: "#a8a29e",
  BED: "#86efac",
  FIREPIT: "#fdba74",
  DECK: "#c9a876",
  DRIVEWAY: "#54565b",
  POOL: "#5fa8c9",
  STEPS: "#b9b2a4",
  LAWN: "#7cb668",
  TREE: "#3f6b32",
  STRUCTURE: "#a68a64",
};

function shapeColor(shape: PreviewShape): THREE.Color {
  const hex = materialTexture(shape.material)?.base ?? FALLBACK_COLOR[shape.type] ?? "#a0a0a0";
  return new THREE.Color(hex);
}

function polygonCenter(points: Point[]): Point {
  return {
    x: points.reduce((s, p) => s + p.x, 0) / points.length,
    y: points.reduce((s, p) => s + p.y, 0) / points.length,
  };
}

function polygonBoundsFt(points: Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

/** Builds a flat extruded block for a shape's footprint, from baseY up to baseY+heightFt. */
function extrudeBlock(points: Point[], heightFt: number, color: THREE.Color, baseY: number) {
  const shape = new THREE.Shape(points.map((p) => new THREE.Vector2(p.x, -p.y)));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(heightFt, 0.02),
    bevelEnabled: false,
  });
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.02 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = baseY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Stairs as individually staggered tread blocks descending across the shape's shorter axis. */
function buildSteps(shape: PreviewShape, group: THREE.Group) {
  const bounds = polygonBoundsFt(shape.points);
  const w = bounds.maxX - bounds.minX;
  const h = bounds.maxY - bounds.minY;
  const alongX = w >= h; // treads stack along the shape's longer side
  const span = alongX ? w : h;
  const treadDepth = span / STEPS_TREAD_COUNT;
  const color = shapeColor(shape);
  const riseFt = DECK_ELEVATION_FT / STEPS_TREAD_COUNT;

  for (let i = 0; i < STEPS_TREAD_COUNT; i++) {
    const treadTop = DECK_ELEVATION_FT - riseFt * i;
    let treadPoints: Point[];
    if (alongX) {
      const x0 = bounds.minX + treadDepth * i;
      const x1 = bounds.minX + treadDepth * (i + 1);
      treadPoints = [
        { x: x0, y: bounds.minY },
        { x: x1, y: bounds.minY },
        { x: x1, y: bounds.maxY },
        { x: x0, y: bounds.maxY },
      ];
    } else {
      const y0 = bounds.minY + treadDepth * i;
      const y1 = bounds.minY + treadDepth * (i + 1);
      treadPoints = [
        { x: bounds.minX, y: y0 },
        { x: bounds.maxX, y: y0 },
        { x: bounds.maxX, y: y1 },
        { x: bounds.minX, y: y1 },
      ];
    }
    group.add(extrudeBlock(treadPoints, riseFt, color, treadTop - riseFt));
  }
}

function buildTree(shape: PreviewShape, group: THREE.Group) {
  const center = polygonCenter(shape.points);
  const bounds = polygonBoundsFt(shape.points);
  const spread = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, 3);
  const trunkH = spread * 0.9;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(spread * 0.06, spread * 0.09, trunkH, 8),
    new THREE.MeshStandardMaterial({ color: "#5a3d22", roughness: 0.9 })
  );
  trunk.position.set(center.x, trunkH / 2, -center.y);
  trunk.castShadow = true;
  group.add(trunk);

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(spread * 0.55, 12, 10),
    new THREE.MeshStandardMaterial({ color: "#3f6b32", roughness: 0.9 })
  );
  canopy.position.set(center.x, trunkH + spread * 0.35, -center.y);
  canopy.scale.y = 0.85;
  canopy.castShadow = true;
  group.add(canopy);
}

function buildPool(shape: PreviewShape, group: THREE.Group) {
  const depth = 3.2;
  const color = shapeColor(shape);
  // basin walls (a shallow extrude that reads as a recessed volume)
  group.add(extrudeBlock(shape.points, depth, new THREE.Color("#dfe7e6"), -depth));
  // water surface just below grade
  const waterShape = new THREE.Shape(shape.points.map((p) => new THREE.Vector2(p.x, -p.y)));
  const waterGeo = new THREE.ShapeGeometry(waterShape);
  waterGeo.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(
    waterGeo,
    new THREE.MeshStandardMaterial({ color, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.9 })
  );
  water.position.y = -0.15;
  group.add(water);
}

function buildShape(shape: PreviewShape, group: THREE.Group) {
  if (shape.points.length < 3) return;

  switch (shape.type) {
    case "WALL": {
      const h = shape.heightFt ?? 2;
      group.add(extrudeBlock(shape.points, h, shapeColor(shape), 0));
      return;
    }
    case "DECK": {
      const color = shapeColor(shape);
      group.add(extrudeBlock(shape.points, 0.25, color, DECK_ELEVATION_FT - 0.25));
      // simple skirt/support down to grade so the platform doesn't float
      const bounds = polygonBoundsFt(shape.points);
      const skirt = new THREE.Mesh(
        new THREE.BoxGeometry(
          Math.max(bounds.maxX - bounds.minX - 0.6, 0.3),
          DECK_ELEVATION_FT - 0.25,
          Math.max(bounds.maxY - bounds.minY - 0.6, 0.3)
        ),
        new THREE.MeshStandardMaterial({ color: color.clone().multiplyScalar(0.55), roughness: 0.9 })
      );
      const c = polygonCenter(shape.points);
      skirt.position.set(c.x, (DECK_ELEVATION_FT - 0.25) / 2, -c.y);
      skirt.castShadow = true;
      group.add(skirt);
      return;
    }
    case "STEPS":
      buildSteps(shape, group);
      return;
    case "TREE":
      buildTree(shape, group);
      return;
    case "POOL":
      buildPool(shape, group);
      return;
    default: {
      const h = FLAT_HEIGHT_FT[shape.type] ?? 0.25;
      group.add(extrudeBlock(shape.points, h, shapeColor(shape), 0));
    }
  }
}

export function DesignPreview3D({
  shapes,
  lengthFt,
  widthFt,
}: {
  shapes: PreviewShape[];
  lengthFt: number;
  widthFt: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [activePreset, setActivePreset] = useState("south");

  const cx = lengthFt / 2;
  const cz = widthFt / 2;
  const eyeFt = 5.5;
  const margin = 6;

  const presets: Record<string, { pos: [number, number, number]; look: [number, number, number] }> = {
    south: { pos: [cx, eyeFt, widthFt + margin], look: [cx, 2.5, cz] },
    north: { pos: [cx, eyeFt, -margin], look: [cx, 2.5, cz] },
    east: { pos: [lengthFt + margin, eyeFt, cz], look: [cx, 2.5, cz] },
    west: { pos: [-margin, eyeFt, cz], look: [cx, 2.5, cz] },
    top: { pos: [cx, Math.max(lengthFt, widthFt) * 1.1, cz + 0.01], look: [cx, 0, cz] },
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#cfe0e8");
    scene.fog = new THREE.Fog("#cfe0e8", Math.max(lengthFt, widthFt) * 1.5, Math.max(lengthFt, widthFt) * 4);

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 500);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(lengthFt + 60, widthFt + 60),
      new THREE.MeshStandardMaterial({ color: "#6a9c5a", roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(cx, -0.05, cz);
    ground.receiveShadow = true;
    scene.add(ground);

    const group = new THREE.Group();
    for (const shape of shapes) buildShape(shape, group);
    scene.add(group);

    const ambient = new THREE.AmbientLight("#ffffff", 0.55);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight("#fff4e0", 1.1);
    sun.position.set(lengthFt * 0.6, 40, widthFt * 0.3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -Math.max(lengthFt, widthFt);
    sun.shadow.camera.right = Math.max(lengthFt, widthFt);
    sun.shadow.camera.top = Math.max(lengthFt, widthFt);
    sun.shadow.camera.bottom = -Math.max(lengthFt, widthFt);
    scene.add(sun);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...presets[activePreset].look);
    camera.position.set(...presets[activePreset].pos);
    controls.update();
    controlsRef.current = controls;

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shapes, lengthFt, widthFt]);

  const goTo = (key: string) => {
    setActivePreset(key);
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;
    camera.position.set(...presets[key].pos);
    controls.target.set(...presets[key].look);
    controls.update();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {(["south", "west", "north", "east", "top"] as const).map((key) => (
          <button
            key={key}
            onClick={() => goTo(key)}
            className={`text-sm rounded-md border px-3 py-1.5 capitalize ${
              activePreset === key
                ? "bg-emerald-700 text-white border-emerald-700"
                : "border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"
            }`}
          >
            {key === "top" ? "Top-down" : `${key} view`}
          </button>
        ))}
      </div>
      <div
        ref={mountRef}
        className="w-full rounded-md border border-black/15 dark:border-white/20 overflow-hidden"
        style={{ height: 480 }}
      />
      <p className="text-xs mt-2" style={{ color: "var(--ink-muted)" }}>
        Drag to look around, scroll to zoom. Nominal heights for shapes without a real one — walls use their
        actual height, everything else is a representative estimate.
      </p>
    </div>
  );
}
