import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { z } from 'zod';
import { color, num, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Unit Cell',
  description:
    "Ternary's landing-page hero: a ball-and-stick body-centred cubic lattice on an enamel plinth with a furnace-hot core atom. Atoms jitter thermally, the core breathes, the brass orbit turns; hover heats it, a click pops the lattice.",
  tags: ['materials', 'crystal', 'lattice', 'chemistry', '3d', 'hero'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  atomColor: color('Lattice atoms').default('#2C7873'),
  coreColor: color('Core atom').default('#D96C3D'),
  bondColor: color('Bonds').default('#F4E9D8'),
  plinthColor: color('Plinth').default('#E6D3B3'),
  ringColor: color('Orbit ring').default('#E9B44C'),
  atomSize: num(0.7, 1.3, 0.05, 'Atom size').default(1),
  mood: select(['annealed', 'hot'], 'Mood').default('hot'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', atomColor: '#1D4E9E', coreColor: '#D9381E', ringColor: '#F2B90F', plinthColor: '#F2EBDD' },
  metal: { material: 'metal', atomColor: '#B8BEC6', coreColor: '#E9B44C', bondColor: '#8C8C88', plinthColor: '#3B3A38', ringColor: '#C9A45C' },
  glass: { material: 'glass', atomColor: '#A7D8D2', coreColor: '#FF7A3C', plinthColor: '#F4E9D8' },
  terracotta: { atomColor: '#4F6D58', coreColor: '#C8553D', plinthColor: '#E5CDB2', ringColor: '#F2A541', bondColor: '#F1E4D3' },
  annealed: { mood: 'annealed', coreColor: '#E9B44C' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.42} metalness={1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={0.8} ior={1.45} attenuationColor={c} attenuationDistance={1.5} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.68} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

const H = 0.62; // half edge of the cell
const CORNERS: [number, number, number][] = [];
for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) CORNERS.push([x * H, y * H, z * H]);
const EDGES: [number, number][] = [];
CORNERS.forEach((a, i) =>
  CORNERS.forEach((b, j) => {
    if (j <= i) return;
    const diff = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
    if (Math.abs(diff - 2 * H) < 1e-6) EDGES.push([i, j]);
  }),
);

/** A cylinder bond from a to b. */
function Bond({ a, b, r, c, kind }: { a: THREE.Vector3; b: THREE.Vector3; r: number; c: string; kind: string }) {
  const { pos, quat, len } = useMemo(() => {
    const d = new THREE.Vector3().subVectors(b, a);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    return { pos: new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5), quat: q, len: d.length() };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 20]} />
      <Surface kind={kind === 'glass' ? 'glossy' : kind} c={c} />
    </mesh>
  );
}

export default function UnitCell(p: P) {
  const hot = p.mood === 'hot';
  const lattice = useRef<THREE.Group>(null);
  const atoms = useRef<(THREE.Mesh | null)[]>([]);
  const core = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Group>(null);
  const sparks = useRef<(THREE.Mesh | null)[]>([]);
  const ra = 0.17 * p.atomSize;
  const rc = 0.27 * p.atomSize;

  const plinth = useMemo(() => {
    // Turned enamel plinth: a soft-edged drum with a step, like a mid-century lamp base.
    const prof = [
      [0, 0],
      [0.78, 0],
      [0.86, 0.04],
      [0.88, 0.12],
      [0.84, 0.18],
      [0.62, 0.2],
      [0.58, 0.26],
      [0.58, 0.3],
      [0, 0.3],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(prof, 64);
  }, []);

  const corners = useMemo(() => CORNERS.map((c) => new THREE.Vector3(...c)), []);
  const centre = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  // Idle: thermal jitter on each corner atom, the core breathes, the orbit turns, sparks rise.
  // Hover heats everything; a click pops the lattice outward and flashes the core.
  useLoop((m) => {
    const heat = (hot ? 1 : 0.35) + m.hover * 0.9;
    const pop = pressBounce(m.pressAge);
    if (lattice.current) lattice.current.scale.setScalar(1 + Math.max(0, -pop) * 0.12 + Math.max(0, pop) * 0.05);
    atoms.current.forEach((a, i) => {
      if (!a) return;
      const [x, y, z] = CORNERS[i];
      const amp = 0.022 * heat;
      a.position.set(x + wave(m.t, 4 + (i % 3), i * 0.13) * amp, y + wave(m.t, 5 + (i % 2), i * 0.29) * amp, z + wave(m.t, 3 + (i % 4), i * 0.41) * amp);
    });
    if (core.current) {
      const mat = core.current.material as THREE.MeshPhysicalMaterial;
      const breathe = 0.5 + 0.5 * wave(m.t, 2);
      mat.emissiveIntensity = 0.35 + breathe * 0.5 * heat + blink(m.t, 0.5, 0.04) * 0.8 + Math.abs(pop) * 3;
      core.current.scale.setScalar(1 + breathe * 0.04 * heat + Math.abs(pop) * 0.15);
    }
    if (halo.current) {
      const mat = halo.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + 0.1 * heat * (0.5 + 0.5 * wave(m.t, 2)) + Math.abs(pop) * 0.4;
    }
    if (ring.current) ring.current.rotation.z = cycle(m.t, 1) * Math.PI * 2;
    sparks.current.forEach((s, i) => {
      if (!s) return;
      const u = cycle(m.t, 2, i / 3);
      s.position.y = 0.95 + u * 0.75;
      s.position.x = Math.sin(i * 2.1) * 0.55 + wave(m.t, 2, i * 0.3) * 0.05;
      s.scale.setScalar(Math.max(0.001, Math.sin(Math.PI * u) * (hot ? 1 : 0.5) * (1 + m.hover)));
    });
  });

  return (
    <IconMotion seed={31} sway={0.06}>
      <group position={[0, -0.08, 0]}>
        {/* Plinth */}
        <mesh geometry={plinth} position={[0, -1.32, 0]} receiveShadow castShadow>
          <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.plinthColor} />
        </mesh>
        {/* brass band on the plinth */}
        <mesh position={[0, -1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.875, 0.025, 12, 96]} />
          <meshStandardMaterial color={p.ringColor} metalness={0.9} roughness={0.3} />
        </mesh>
        {/* post */}
        <mesh position={[0, -0.98, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 0.3, 24]} />
          <meshStandardMaterial color={p.ringColor} metalness={0.9} roughness={0.3} />
        </mesh>

        {/* Lattice, stood on a corner-ish angle so it reads as a cube */}
        <group position={[0, 0.16, 0]} rotation={[0.42, Math.PI / 4, 0]}>
          <group ref={lattice}>
            {EDGES.map(([i, j], k) => (
              <Bond key={`e${k}`} a={corners[i]} b={corners[j]} r={0.035} c={p.bondColor} kind={p.material} />
            ))}
            {corners.map((c, k) => (
              <Bond key={`d${k}`} a={centre} b={c} r={0.028} c={p.bondColor} kind={p.material} />
            ))}
            {CORNERS.map((c, i) => (
              <mesh key={i} ref={(el) => void (atoms.current[i] = el)} position={c} castShadow>
                <sphereGeometry args={[ra, 40, 40]} />
                <Surface kind={p.material} c={p.atomColor} />
              </mesh>
            ))}
            <mesh ref={core}>
              <sphereGeometry args={[rc, 48, 48]} />
              <meshPhysicalMaterial color={p.coreColor} emissive={p.coreColor} emissiveIntensity={0.6} roughness={0.3} clearcoat={1} />
            </mesh>
            <mesh ref={halo}>
              <sphereGeometry args={[rc * 1.7, 32, 32]} />
              <meshBasicMaterial color={p.coreColor} transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
          </group>
        </group>

        {/* Brass orbit ring, tilted like an atomic-age emblem */}
        <group position={[0, 0.16, 0]} rotation={[1.22, 0.2, 0]}>
          <group ref={ring}>
            <mesh>
              <torusGeometry args={[1.42, 0.022, 12, 128]} />
              <meshStandardMaterial color={p.ringColor} metalness={0.85} roughness={0.28} />
            </mesh>
            <mesh position={[1.42, 0, 0]}>
              <sphereGeometry args={[0.07, 24, 24]} />
              <meshStandardMaterial color={p.ringColor} emissive={p.ringColor} emissiveIntensity={0.6} metalness={0.5} roughness={0.3} />
            </mesh>
          </group>
        </group>

        {/* heat sparks rising off the cell */}
        {[0, 1, 2].map((i) => (
          <mesh key={i} ref={(el) => void (sparks.current[i] = el)} position={[0, 1, 0.3]}>
            <octahedronGeometry args={[0.045, 0]} />
            <meshStandardMaterial color={p.ringColor} emissive={p.ringColor} emissiveIntensity={1.2} />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
