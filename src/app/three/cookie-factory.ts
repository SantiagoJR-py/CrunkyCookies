import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  IcosahedronGeometry,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SphereGeometry,
} from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { FlavorId } from '../flavors';

/* ------------------------------------------------------------------
   Galleta procedural estilo New York: gruesa, irregular y con toppings.
   Todo se genera por código (sin modelos ni texturas externas).
------------------------------------------------------------------- */

type ToppingKind = 'chunk' | 'chip' | 'oreo' | 'peanut' | 'crumb';

interface ToppingSpec {
  kind: ToppingKind;
  count: number;
  color: number;
  size: [number, number];
  roughness?: number;
  clearcoat?: number;
  /** Radio máximo (0..1) en el que se reparten. */
  spread?: number;
}

interface Look {
  seed: number;
  dough: number;
  edge: number;
  light: number;
  roughness: number;
  toppings: ToppingSpec[];
  /** Centro relleno brillante (Nutella). */
  pool?: { color: number; radius: number };
}

const LOOKS: Record<FlavorId, Look> = {
  chocochip: {
    seed: 11,
    dough: 0xcf9350,
    edge: 0x8f5a28,
    light: 0xe8bd7e,
    roughness: 0.86,
    toppings: [
      { kind: 'chunk', count: 13, color: 0x321a0c, size: [0.15, 0.23], roughness: 0.42, clearcoat: 0.25 },
      { kind: 'chip', count: 9, color: 0x4a2612, size: [0.08, 0.11], roughness: 0.45, clearcoat: 0.2 },
    ],
  },
  doblechoco: {
    seed: 23,
    dough: 0x4f2915,
    edge: 0x2a1309,
    light: 0x6e3d20,
    roughness: 0.8,
    toppings: [
      { kind: 'chunk', count: 12, color: 0x1d0e06, size: [0.15, 0.23], roughness: 0.36, clearcoat: 0.35 },
      { kind: 'chip', count: 8, color: 0x7d4826, size: [0.08, 0.12], roughness: 0.45, clearcoat: 0.2 },
    ],
  },
  redvelvet: {
    seed: 37,
    dough: 0x7f1a2f,
    edge: 0x4d0c1a,
    light: 0x9c2c41,
    roughness: 0.9,
    toppings: [
      { kind: 'chunk', count: 12, color: 0xf3e9d6, size: [0.13, 0.2], roughness: 0.5, clearcoat: 0.2 },
      { kind: 'chip', count: 9, color: 0xf8f0e0, size: [0.07, 0.1], roughness: 0.5, clearcoat: 0.15 },
    ],
  },
  nutella: {
    seed: 41,
    dough: 0xc98c4a,
    edge: 0x8a5626,
    light: 0xe3b877,
    roughness: 0.86,
    pool: { color: 0x40200c, radius: 0.4 },
    toppings: [
      { kind: 'crumb', count: 18, color: 0xb9813f, size: [0.05, 0.085], roughness: 0.7, spread: 0.8 },
      { kind: 'chip', count: 7, color: 0x40200c, size: [0.08, 0.11], roughness: 0.4, clearcoat: 0.3, spread: 0.8 },
    ],
  },
  oreo: {
    seed: 53,
    dough: 0xe6c999,
    edge: 0xb48a50,
    light: 0xf5e3bf,
    roughness: 0.88,
    toppings: [
      { kind: 'oreo', count: 10, color: 0x1e1816, size: [0.17, 0.25], roughness: 0.8 },
      { kind: 'chip', count: 12, color: 0x241d1a, size: [0.04, 0.07], roughness: 0.85 },
    ],
  },
  manichoco: {
    seed: 67,
    dough: 0xcf9a52,
    edge: 0x8c5a25,
    light: 0xe9c383,
    roughness: 0.86,
    toppings: [
      { kind: 'chunk', count: 7, color: 0x321a0c, size: [0.15, 0.21], roughness: 0.42, clearcoat: 0.25 },
      { kind: 'peanut', count: 14, color: 0xdcaa5c, size: [0.11, 0.14], roughness: 0.55, clearcoat: 0.15 },
    ],
  },
};

/** Altura (semi-grosor) de la galleta; el radio es ~1. */
const HEIGHT = 0.4;

/* ---------- utilidades de ruido deterministas ---------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function noise2(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, seed: number, octaves: number): number {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(x * freq, y * freq, seed + i * 17);
    norm += amp;
    amp *= 0.5;
    freq *= 2.03;
  }
  return sum / norm;
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/* ---------- superficie de la galleta ---------- */

interface Surface {
  outline: (theta: number) => number;
  top: (x: number, z: number) => number;
  crack: (x: number, z: number) => number;
}

function makeSurface(look: Look): Surface {
  const rng = mulberry32(look.seed * 7919);
  const p1 = rng() * 6.28;
  const p2 = rng() * 6.28;
  const p3 = rng() * 6.28;
  const seed = look.seed;

  const outline = (theta: number) =>
    1 + 0.018 * Math.sin(3 * theta + p1) + 0.016 * Math.sin(5 * theta + p2) + 0.012 * Math.sin(9 * theta + p3);

  const crack = (x: number, z: number) => {
    const n = noise2(x * 2.6 + 31.7, z * 2.6 + 12.3, seed + 101);
    const ridge = 1 - Math.abs(2 * n - 1);
    return smoothstep(0.9, 1, ridge);
  };

  const top = (x: number, z: number) => {
    const theta = Math.atan2(z, x);
    const rho = Math.min(1, Math.hypot(x, z) / outline(theta));
    const dome = HEIGHT * Math.sqrt(Math.max(0, 1 - rho ** 4));
    const mask = 1 - rho ** 6;
    const lumps = (fbm(x * 2.1 + 5.1, z * 2.1 + 9.4, seed, 2) - 0.5) * 0.15;
    const pebble = (noise2(x * 7.5, z * 7.5, seed + 53) - 0.5) * 0.05;
    const grain = (noise2(x * 17, z * 17, seed + 91) - 0.5) * 0.02;
    let h = dome + (lumps + pebble + grain - 0.042 * crack(x, z)) * mask;
    if (look.pool) {
      h -= 0.07 * (1 - smoothstep(look.pool.radius * 0.6, look.pool.radius * 1.2, rho));
    }
    return h;
  };

  return { outline, top, crack };
}

function buildDough(look: Look, surface: Surface, detail: number): BufferGeometry {
  let geo: BufferGeometry = new IcosahedronGeometry(1, detail);
  geo.deleteAttribute('uv');
  geo.deleteAttribute('normal');
  geo = mergeVertices(geo, 1e-5);

  const pos = geo.getAttribute('position') as BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const dough = new Color(look.dough);
  const edge = new Color(look.edge);
  const light = new Color(look.light);
  const c = new Color();

  for (let i = 0; i < pos.count; i++) {
    const dx = pos.getX(i);
    const dy = pos.getY(i);
    const dz = pos.getZ(i);
    const theta = Math.atan2(dz, dx);
    const rhoS = Math.min(1, Math.hypot(dx, dz));
    const R = surface.outline(theta);
    const x = dx * R;
    const z = dz * R;
    let y: number;

    if (dy >= 0) {
      y = surface.top(x, z);
    } else {
      const under = (noise2(x * 5, z * 5, look.seed + 7) - 0.5) * 0.02;
      y = -0.34 * HEIGHT * Math.sqrt(Math.max(0, 1 - rhoS ** 8)) + under * (1 - rhoS ** 6);
    }
    pos.setXYZ(i, x, y, z);

    // Color: dorado al centro, tostado en el borde y la base, claro en las grietas.
    const speck = noise2(x * 9 + 3, z * 9 + 8, look.seed + 211) - 0.5;
    const blotch = fbm(x * 2.3 + 40, z * 2.3 + 17, look.seed + 29, 2) - 0.5;
    c.copy(dough);
    if (dy >= 0) {
      c.lerp(light, Math.max(0, Math.min(1, 0.55 * surface.crack(x, z) + blotch * 0.9)));
      c.lerp(edge, smoothstep(0.62, 1, rhoS) * 0.85);
    } else {
      c.lerp(edge, 0.9);
    }
    c.multiplyScalar(1 + speck * 0.12);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  geo.setAttribute('color', new BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/* ---------- toppings ---------- */

/** Trozo redondeado e irregular (un cubo "derretido"). */
function chunkGeometry(seed: number, sx = 1, sy = 0.62, sz = 0.9, squareness = 0.72): BufferGeometry {
  let geo: BufferGeometry = new IcosahedronGeometry(1, 3);
  geo.deleteAttribute('uv');
  geo.deleteAttribute('normal');
  geo = mergeVertices(geo, 1e-5);
  const pos = geo.getAttribute('position') as BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const m = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
    const k = 0.72 / Math.pow(m, squareness);
    const wobble = 1 + (noise2(x * 1.7 + y * 2.3 + 10, z * 1.7 - y * 1.1 + 10, seed) - 0.5) * 0.42;
    pos.setXYZ(i, x * k * wobble * sx, y * k * wobble * sy, z * k * wobble * sz);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Charco irregular y brillante para el relleno. */
function poolGeometry(seed: number): BufferGeometry {
  const geo = new SphereGeometry(1, 72, 24);
  const pos = geo.getAttribute('position') as BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const theta = Math.atan2(z, x);
    const r = 1 + 0.08 * Math.sin(3 * theta + seed) + 0.05 * Math.sin(5 * theta + seed * 2.1) + 0.03 * Math.sin(8 * theta);
    pos.setXYZ(i, x * r, y, z * r);
  }
  geo.computeVertexNormals();
  return geo;
}

export interface BuiltCookie {
  group: Group;
  /** Geometría y material del topping principal, para las migas flotantes. */
  bitGeometry: BufferGeometry;
  bitMaterial: Material;
  dispose: () => void;
}

export function buildCookie(id: FlavorId, detail = 44): BuiltCookie {
  const look = LOOKS[id];
  const surface = makeSurface(look);
  const rng = mulberry32(look.seed * 104729 + 1);
  const group = new Group();
  const disposables: { dispose: () => void }[] = [];

  const doughGeo = buildDough(look, surface, detail);
  const doughMat = new MeshStandardMaterial({
    vertexColors: true,
    roughness: look.roughness,
    metalness: 0,
    envMapIntensity: 0.7,
  });
  const dough = new Mesh(doughGeo, doughMat);
  dough.castShadow = true;
  dough.receiveShadow = true;
  group.add(dough);
  disposables.push(doughGeo, doughMat);

  if (look.pool) {
    const poolGeo = poolGeometry(look.seed);
    const poolMat = new MeshPhysicalMaterial({
      color: look.pool.color,
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.2,
    });
    const pool = new Mesh(poolGeo, poolMat);
    const r = look.pool.radius;
    pool.scale.set(r * 0.95, 0.06, r * 0.88);
    pool.position.set(0.01, surface.top(0, 0) + 0.03, -0.01);
    pool.receiveShadow = true;
    group.add(pool);
    disposables.push(poolGeo, poolMat);
  }

  const chunkGeos = [chunkGeometry(look.seed + 1), chunkGeometry(look.seed + 2), chunkGeometry(look.seed + 3)];
  const chipGeo = chunkGeometry(look.seed + 5, 0.8, 0.6, 0.8, 0.3);
  const peanutGeo = new SphereGeometry(0.6, 18, 12);
  const oreoDark = chunkGeometry(look.seed + 9, 1.15, 0.2, 0.95, 0.85);
  const oreoCream = chunkGeometry(look.seed + 10, 1.2, 0.2, 1, 0.85);
  disposables.push(...chunkGeos, chipGeo, peanutGeo, oreoDark, oreoCream);

  const creamMat = new MeshStandardMaterial({ color: 0xf8f1e4, roughness: 0.6 });
  disposables.push(creamMat);

  const placed: { x: number; z: number; r: number }[] = [];
  let bitGeometry: BufferGeometry = chunkGeos[0];
  let bitMaterial: Material = doughMat;

  look.toppings.forEach((spec, specIndex) => {
    const mat = new MeshPhysicalMaterial({
      color: spec.color,
      roughness: spec.roughness ?? 0.4,
      clearcoat: spec.clearcoat ?? 0,
      clearcoatRoughness: 0.25,
      
      envMapIntensity: 1,
    });
    disposables.push(mat);
    if (specIndex === 0) {
      bitMaterial = mat;
      bitGeometry = spec.kind === 'peanut' ? peanutGeo : spec.kind === 'crumb' ? chipGeo : chunkGeos[0];
    }

    const spread = spec.spread ?? 0.74;
    const inner = look.pool ? look.pool.radius * 1.05 : 0;
    let done = 0;
    let attempts = 0;

    while (done < spec.count && attempts < 400) {
      attempts++;
      const size = spec.size[0] + rng() * (spec.size[1] - spec.size[0]);
      const rad = inner + (spread - inner) * Math.sqrt(rng());
      const ang = rng() * Math.PI * 2;
      const x = Math.cos(ang) * rad;
      const z = Math.sin(ang) * rad;
      if (placed.some((p) => Math.hypot(p.x - x, p.z - z) < (p.r + size) * 1.05)) continue;
      placed.push({ x, z, r: size });

      let mesh: Mesh | Group;
      if (spec.kind === 'oreo') {
        const piece = new Group();
        const a = new Mesh(oreoDark, mat);
        const b = new Mesh(oreoCream, creamMat);
        const cDark = new Mesh(oreoDark, mat);
        a.position.y = 0.2;
        cDark.position.y = -0.2;
        [a, b, cDark].forEach((m) => {
          m.castShadow = true;
          m.receiveShadow = true;
          piece.add(m);
        });
        piece.rotation.set((rng() - 0.5) * 0.9, rng() * 6.28, (rng() - 0.5) * 0.9);
        mesh = piece;
      } else if (spec.kind === 'peanut') {
        mesh = new Mesh(peanutGeo, mat);
        mesh.scale.set(1.35, 0.8, 0.85);
        mesh.rotation.set((rng() - 0.5) * 0.6, rng() * 6.28, (rng() - 0.5) * 0.6);
      } else if (spec.kind === 'chunk') {
        mesh = new Mesh(chunkGeos[Math.floor(rng() * chunkGeos.length)], mat);
        mesh.rotation.set((rng() - 0.5) * 0.5, rng() * 6.28, (rng() - 0.5) * 0.5);
      } else {
        mesh = new Mesh(chipGeo, mat);
        mesh.rotation.set((rng() - 0.5) * 0.6, rng() * 6.28, (rng() - 0.5) * 0.6);
      }

      mesh.scale.multiplyScalar(size);
      const sink = spec.kind === 'oreo' ? 0.12 : spec.kind === 'peanut' ? 0.12 : 0.1;
      mesh.position.set(x, surface.top(x, z) + size * sink, z);
      if (mesh instanceof Mesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
      group.add(mesh);
      done++;
    }
  });

  return {
    group,
    bitGeometry,
    bitMaterial,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}
