import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Heat Grid',
  description:
    "Ambit's hero object: a chunky 4×4 usage heatmap in clay, with tiles raised by activity, one hot tile and a floating AI sparkle. A glow wave sweeps the grid; tiles hop when clicked.",
  tags: ['heatmap', 'dashboard', 'usage', 'ai', '3d', 'hero'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  slab: color('Base slab').default('#E9E3F5'),
  low: color('Low activity').default('#C9BEEE'),
  high: color('High activity').default('#5E4AE3'),
  hot: color('Hot tile').default('#EE7FA8'),
  spark: color('Sparkle').default('#2EC4B6'),
  mood: select(['calm', 'busy'], 'Mood').default('busy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy' },
  metal: { material: 'metal', slab: '#D8DCE3', low: '#B8C0CC', high: '#3D5AFE', hot: '#FF3DB4', spark: '#FFFFFF' },
  glass: { material: 'glass', low: '#E2DAF5', high: '#8A78EA', spark: '#F49CBB' },
  riso: { slab: '#F4EFE6', low: '#9CC9E6', high: '#0078BF', hot: '#FF48B0', spark: '#FFE800' },
  calm: { mood: 'calm', hot: '#2EC4B6', spark: '#F49CBB' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c, emissive, refFn }: { kind: string; c: string; emissive?: string; refFn?: (m: THREE.MeshPhysicalMaterial | null) => void }) {
  const e = emissive ?? '#000000';
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial ref={refFn} color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.08} emissive={e} emissiveIntensity={0} />;
    case 'metal':
      return <meshPhysicalMaterial ref={refFn} color={c} roughness={0.3} metalness={1} emissive={e} emissiveIntensity={0} />;
    case 'glass':
      return <meshPhysicalMaterial ref={refFn} color={c} roughness={0.06} transmission={0.92} thickness={0.6} ior={1.4} emissive={e} emissiveIntensity={0} />;
    default:
      return <meshPhysicalMaterial ref={refFn} color={c} roughness={0.68} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" emissive={e} emissiveIntensity={0} />;
  }
}

// Activity level per tile, 0..1 (row-major). Index 15 is nearest the camera, 0 farthest:
// tiles step down toward the viewer so the tall hot tile near the front reads clearly.
const LEVELS = [0.6, 0.75, 0.5, 0.65, 0.8, 0.5, 0.7, 0.35, 0.45, 0.6, 1, 0.25, 0.3, 0.2, 0.15, 0.08];
const HOT = 10;
const N = 4;
const TILE = 0.38;
const GAP = 0.1;
const STEP = TILE + GAP;

export default function HeatGrid(p: P) {
  const busy = p.mood === 'busy';
  const tiles = useRef<(THREE.Group | null)[]>([]);
  const mats = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);
  const spark = useRef<THREE.Group>(null);
  const sparkMat = useRef<THREE.MeshPhysicalMaterial>(null);

  const colors = useMemo(() => {
    const lo = new THREE.Color(p.low);
    const hi = new THREE.Color(p.high);
    return LEVELS.map((l, i) => (i === HOT ? p.hot : `#${lo.clone().lerp(hi, l).getHexString()}`));
  }, [p.low, p.high, p.hot]);

  // A chunky four-point sparkle, extruded with soft bevels.
  const sparkGeo = useMemo(() => {
    const s = new THREE.Shape();
    const R = 0.3;
    const r = 0.085;
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 4;
      const k = i % 2 ? r : R;
      const x = Math.cos(a) * k;
      const y = Math.sin(a) * k;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.08, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.04, bevelSegments: 5, curveSegments: 8 });
    g.center();
    return g;
  }, []);

  useLoop((m) => {
    const energy = (busy ? 1 : 0.45) + m.hover * 0.8;
    const press = pressBounce(m.pressAge);
    tiles.current.forEach((g, i) => {
      if (!g) return;
      const r = Math.floor(i / N);
      const c = i % N;
      // A diagonal glow wave sweeps the grid once (busy: twice) per loop.
      const u = cycle(m.t, busy ? 2 : 1, -(r + c) / 8);
      const pulse = Math.max(0, Math.sin(u * Math.PI * 2)) ** 3;
      // The box sits on y = 0 inside the group, so scaling grows it upward from the slab.
      g.scale.y = 1 + pulse * 0.14 * energy;
      g.position.y = Math.max(0, pressBounce(m.pressAge - (r + c) * 0.035)) * 0.3;
      const mat = mats.current[i];
      if (mat) mat.emissiveIntensity = (i === HOT ? 0.3 + 0.3 * (wave(m.t, 2) * 0.5 + 0.5) : 0) + pulse * 0.7 * energy + Math.abs(press) * 0.4;
    });
    if (spark.current) {
      // Rock rather than spin so the sparkle never turns edge-on; a click spins it once.
      spark.current.rotation.y = wave(m.t, 1) * 0.6 + (Number.isFinite(m.pressAge) ? Math.min(1, m.pressAge * 1.5) * Math.PI * 2 : 0);
      spark.current.position.y = 1.72 + wave(m.t, 2) * 0.07 + Math.max(0, press) * 0.25;
      const s = 1 + m.hover * 0.15 + Math.abs(press) * 0.3;
      spark.current.scale.setScalar(s);
    }
    if (sparkMat.current) sparkMat.current.emissiveIntensity = 0.35 + (wave(m.t, 4) * 0.5 + 0.5) * 0.3 * energy + m.hover * 0.4;
  });

  const span = N * STEP - GAP;
  const hotR = Math.floor(HOT / N);
  const hotC = HOT % N;
  const hx = -span / 2 + TILE / 2 + hotC * STEP;
  const hz = -span / 2 + TILE / 2 + hotR * STEP;

  return (
    <IconMotion seed={41} float={0.05} sway={0.06}>
      <group rotation={[0.52, -Math.PI / 4, 0]} position={[0, -0.35, 0]} scale={1.05}>
        {/* the slab the grid is set into */}
        <RoundedBox args={[span + 0.34, 0.24, span + 0.34]} radius={0.1} smoothness={5} position={[0, -0.12, 0]}>
          <Surface kind={p.material === 'glass' ? 'clay' : p.material} c={p.slab} />
        </RoundedBox>
        {LEVELS.map((l, i) => {
          const r = Math.floor(i / N);
          const c = i % N;
          const h = 0.25 + l * 0.9;
          const x = -span / 2 + TILE / 2 + c * STEP;
          const zz = -span / 2 + TILE / 2 + r * STEP;
          return (
            <group key={i} position={[x, 0, zz]}>
              <group ref={(el) => void (tiles.current[i] = el)}>
                <RoundedBox args={[TILE, h, TILE]} radius={0.07} smoothness={4} position={[0, h / 2, 0]}>
                  <Surface kind={p.material} c={colors[i]} emissive={colors[i]} refFn={(m) => void (mats.current[i] = m)} />
                </RoundedBox>
              </group>
            </group>
          );
        })}
        {/* AI sparkle hovering over the hot tile, kept upright to the camera */}
        <group position={[hx, 0, hz]}>
          <group ref={spark} position={[0, 1.72, 0]}>
            <mesh geometry={sparkGeo} rotation={[-0.52, Math.PI / 4, 0]}>
              <meshPhysicalMaterial ref={sparkMat} color={p.spark} emissive={p.spark} emissiveIntensity={0.4} roughness={0.25} clearcoat={1} clearcoatRoughness={0.1} />
            </mesh>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
