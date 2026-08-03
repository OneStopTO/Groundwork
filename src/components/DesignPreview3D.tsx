"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { materialTexture, stepsTexture } from "@/lib/textures";
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

function shapeTexture2D(shape: PreviewShape) {
  return shape.type === "STEPS" ? stepsTexture(shape.material) : materialTexture(shape.material);
}

function shapeColor(shape: PreviewShape): THREE.Color {
  const hex = shapeTexture2D(shape)?.base ?? FALLBACK_COLOR[shape.type] ?? "#a0a0a0";
  return new THREE.Color(hex);
}

/**
 * Loaded once per data URI and shared — repeat is a function of the
 * material's own tile size, which is constant for a given material name,
 * so every shape using that material wants the same value anyway. Cloning
 * a texture before its async image load finished was leaving clones with
 * no image data forever (Texture.clone() copies .image at call time, not
 * as a live reference), which is what was spamming
 * "Texture marked for update but no image data found" on every frame.
 */
const textureCache = new Map<string, THREE.Texture>();
function loadTiledTexture(dataUri: string, sizeFtW: number, sizeFtH: number): THREE.Texture {
  let tex = textureCache.get(dataUri);
  if (!tex) {
    tex = new THREE.TextureLoader().load(dataUri);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.repeat.set(1 / sizeFtW, 1 / sizeFtH);
    textureCache.set(dataUri, tex);
  }
  return tex;
}

/**
 * A real material surface, not a flat color block — reuses the same SVG
 * pattern the 2D canvas draws (paver grid, plank boards, turf, etc.) as a
 * Three.js texture map. ExtrudeGeometry's default cap UVs equal the raw
 * shape coordinates in feet, so `repeat = 1/tileSizeFt` makes one texture
 * tile cover exactly one real tileSizeFt-foot square, same as the 2D scale.
 */
function shapeSurfaceMaterial(shape: PreviewShape): THREE.MeshStandardMaterial {
  const tex2d = shapeTexture2D(shape);
  if (!tex2d) {
    return new THREE.MeshStandardMaterial({ color: shapeColor(shape), roughness: 0.85, metalness: 0.02 });
  }
  const texture = loadTiledTexture(tex2d.tile, tex2d.sizeFtW, tex2d.sizeFtH);
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9, metalness: 0.02 });
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
function extrudeBlock(points: Point[], heightFt: number, material: THREE.Material, baseY: number) {
  const shape = new THREE.Shape(points.map((p) => new THREE.Vector2(p.x, -p.y)));
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(heightFt, 0.02),
    bevelEnabled: false,
  });
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = baseY;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Individual retaining-wall blocks in a running-bond course pattern, not a
 * single flat-colored box — a block size roughly matching a real unit
 * (18in long x 8in tall x wall thickness), with slight per-block color
 * variation so it reads as masonry rather than a uniform slab.
 */
function buildWallBlocks(shape: PreviewShape, group: THREE.Group) {
  const pts = shape.points;
  const edge01 = { x: pts[1].x - pts[0].x, y: pts[1].y - pts[0].y };
  const edge12 = { x: pts[2].x - pts[1].x, y: pts[2].y - pts[1].y };
  const len01 = Math.hypot(edge01.x, edge01.y);
  const len12 = Math.hypot(edge12.x, edge12.y);
  const runVec = len01 >= len12 ? edge01 : edge12;
  const runLength = Math.max(len01, len12);
  const thickness = Math.max(Math.min(len01, len12), 0.4);
  const dirX = runVec.x / (runLength || 1);
  const dirY = runVec.y / (runLength || 1);
  const angle = Math.atan2(dirY, dirX);
  const center = polygonCenter(pts);
  const heightFt = shape.heightFt ?? 2;
  const baseColor = shapeColor(shape);

  const blockLen = 1.5;
  const blockGap = 0.04;
  const courseH = 0.58;
  const courseCount = Math.max(1, Math.round(heightFt / courseH));
  const actualCourseH = heightFt / courseCount;

  for (let course = 0; course < courseCount; course++) {
    const y0 = course * actualCourseH;
    const offset = course % 2 === 0 ? 0 : blockLen / 2; // running bond
    let along = -offset;
    while (along < runLength) {
      const start = Math.max(along, 0);
      const end = Math.min(along + blockLen - blockGap, runLength);
      const thisLen = end - start;
      along += blockLen;
      if (thisLen < 0.15) continue;

      const centerAlong = (start + end) / 2 - runLength / 2;
      const px = center.x + dirX * centerAlong;
      const py = center.y + dirY * centerAlong;

      const tone = (Math.random() - 0.5) * 0.08;
      const geo = new THREE.BoxGeometry(thisLen, actualCourseH - blockGap, thickness);
      const mat = new THREE.MeshStandardMaterial({
        color: baseColor.clone().offsetHSL(0, 0, tone),
        roughness: 0.95,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(px, y0 + actualCourseH / 2, -py);
      mesh.rotation.y = angle;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
  }
}

/** Stairs as individually staggered tread blocks descending across the shape's shorter axis. */
function buildSteps(shape: PreviewShape, group: THREE.Group) {
  const bounds = polygonBoundsFt(shape.points);
  const w = bounds.maxX - bounds.minX;
  const h = bounds.maxY - bounds.minY;
  const alongX = w >= h; // treads stack along the shape's longer side
  const span = alongX ? w : h;
  const treadDepth = span / STEPS_TREAD_COUNT;
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
    group.add(extrudeBlock(treadPoints, riseFt, shapeSurfaceMaterial(shape), treadTop - riseFt));
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

  // a small cluster of offset spheres instead of one perfect sphere, so the
  // canopy reads as foliage rather than a green ball
  const canopyMat = new THREE.MeshStandardMaterial({ color: "#3f6b32", roughness: 0.95 });
  const lobes: Array<[number, number, number, number]> = [
    [0, 0, 0, 0.55],
    [0.3, 0.15, 0.1, 0.4],
    [-0.28, 0.05, 0.15, 0.4],
    [0.05, 0.25, -0.25, 0.38],
  ];
  for (const [ox, oy, oz, r] of lobes) {
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(spread * r, 10, 8), canopyMat);
    lobe.position.set(center.x + ox * spread, trunkH + spread * (0.35 + oy), -center.y + oz * spread);
    lobe.castShadow = true;
    group.add(lobe);
  }
}

function buildPool(shape: PreviewShape, group: THREE.Group) {
  const depth = 3.2;
  const color = shapeColor(shape);
  const basinMat = new THREE.MeshStandardMaterial({ color: "#dfe7e6", roughness: 0.6 });
  group.add(extrudeBlock(shape.points, depth, basinMat, -depth));
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
    case "WALL":
      buildWallBlocks(shape, group);
      return;
    case "DECK": {
      group.add(extrudeBlock(shape.points, 0.25, shapeSurfaceMaterial(shape), DECK_ELEVATION_FT - 0.25));
      // simple skirt/support down to grade so the platform doesn't float
      const bounds = polygonBoundsFt(shape.points);
      const skirtColor = shapeColor(shape).clone().multiplyScalar(0.5);
      const skirt = new THREE.Mesh(
        new THREE.BoxGeometry(
          Math.max(bounds.maxX - bounds.minX - 0.6, 0.3),
          DECK_ELEVATION_FT - 0.25,
          Math.max(bounds.maxY - bounds.minY - 0.6, 0.3)
        ),
        new THREE.MeshStandardMaterial({ color: skirtColor, roughness: 0.9 })
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
      group.add(extrudeBlock(shape.points, h, shapeSurfaceMaterial(shape), 0));
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
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const cx = lengthFt / 2;
  const cz = widthFt / 2;
  const eyeFt = 5.5;
  const margin = 6;

  const presets: Record<string, { pos: [number, number, number]; look: [number, number, number] }> = {
    south: { pos: [cx, eyeFt, widthFt + margin], look: [cx, 2.5, cz] },
    west: { pos: [-margin, eyeFt, cz], look: [cx, 2.5, cz] },
    north: { pos: [cx, eyeFt, -margin], look: [cx, 2.5, cz] },
    east: { pos: [lengthFt + margin, eyeFt, cz], look: [cx, 2.5, cz] },
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

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    const groundMat = new THREE.MeshStandardMaterial({ color: "#6a9c5a", roughness: 1 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(lengthFt + 60, widthFt + 60), groundMat);
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

  const recordFlythrough = () => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const mount = mountRef.current;
    const canvas = mount?.querySelector("canvas");
    if (!camera || !controls || !canvas || recording) return;

    setVideoUrl(null);
    setRecording(true);
    controls.enabled = false;

    const stream = (canvas as HTMLCanvasElement & { captureStream: (fps?: number) => MediaStream }).captureStream(
      30
    );
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      setVideoUrl(URL.createObjectURL(blob));
      setRecording(false);
      controls.enabled = true;
    };
    recorder.start();

    const sequence = ["south", "west", "north", "east", "top", "south"] as const;
    const segMs = 1900;
    let segIndex = 0;
    let segStart = performance.now();
    let fromPos = camera.position.clone();
    let fromTarget = controls.target.clone();

    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    const step = (now: number) => {
      if (segIndex >= sequence.length) {
        recorder.stop();
        return;
      }
      const key = sequence[segIndex];
      const toPos = new THREE.Vector3(...presets[key].pos);
      const toTarget = new THREE.Vector3(...presets[key].look);
      const t = Math.min(1, (now - segStart) / segMs);
      const eased = ease(t);
      camera.position.lerpVectors(fromPos, toPos, eased);
      controls.target.lerpVectors(fromTarget, toTarget, eased);
      camera.lookAt(controls.target);
      if (t >= 1) {
        segIndex++;
        segStart = now;
        fromPos = toPos.clone();
        fromTarget = toTarget.clone();
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap gap-2">
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
        <button
          onClick={recordFlythrough}
          disabled={recording}
          className="text-sm rounded-md border border-black/15 dark:border-white/20 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-60"
        >
          {recording ? "Recording…" : "Record flythrough video"}
        </button>
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
      {videoUrl && (
        <div className="mt-4 rounded-md border border-black/15 dark:border-white/20 p-3">
          <video src={videoUrl} controls className="w-full rounded-md mb-2" />
          <a
            href={videoUrl}
            download="design-flythrough.webm"
            className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Download video
          </a>
        </div>
      )}
    </div>
  );
}
