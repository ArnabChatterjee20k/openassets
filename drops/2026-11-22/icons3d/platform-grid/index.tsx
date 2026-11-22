import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, num, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, cycle, pressBounce, rand, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Platform Grid',
  description:
    'Folio landing-page hero: a 4 × 4 grid of paper-white platform columns, rising like a bar chart, with one glossy red agent block hopping from platform to platform. Hover raises the chart; click sends a ripple from the agent.',
  tags: ['hero', 'ad agent', 'platforms', 'grid', '3d', 'swiss'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('glossy'),
  tileColor: color('Columns').default('#F5F5F0'),
  trayColor: color('Tray').default('#1A1A1A'),
  agentColor: color('Agent block').default('#E3000F'),
  height: num(0.5, 1.5, 0.05, 'Chart height').default(1),
  mood: select(['calm', 'busy'], 'Mood').default('busy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  clay: { material: 'clay', tileColor: '#ECEAE3', trayColor: '#8C8C88' },
  metal: { material: 'metal', tileColor: '#D9DCE1', trayColor: '#2A2A2E' },
  glass: { material: 'glass', tileColor: '#E8F0F2', trayColor: '#1A1A1A', height: 0.8 },
  night: { tileColor: '#4A4A52', trayColor: '#C9A45C', agentColor: '#E3000F', mood: 'calm' },
  bauhaus: { material: 'clay', tileColor: '#F2EBDD', trayColor: '#1D4E9E', agentColor: '#F2B90F' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: string; c: string }) {
  switch (kind) {
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.72} sheen={0.35} sheenRoughness={0.5} sheenColor="#ffffff" />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} envMapIntensity={1.1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={0.8} ior={1.4} attenuationColor={c} attenuationDistance={2} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.22} clearcoat={1} clearcoatRoughness={0.1} />;
  }
}

const N = 4;
const PITCH = 0.5;
const TILE = 0.4;
const at = (i: number) => (i - (N - 1) / 2) * PITCH;
// Bar heights per cell: a real chart spread, so the grid reads as data.
// The agent's route (the centre four) sits on a mid plateau so it's never buried.
const BASE = [
  0.22, 0.48, 0.3, 0.86,
  0.38, 0.56, 0.62, 0.34,
  0.44, 0.5, 0.58, 0.18,
  0.14, 0.32, 0.26, 0.42,
];
// The agent visits four platforms per loop, then returns home.
const ROUTE = [5, 6, 10, 9];

export default function PlatformGrid(p: P) {
  const cols = useRef<(THREE.Group | null)[]>([]);
  const agent = useRef<THREE.Group>(null);
  const agentMat = useRef<THREE.MeshPhysicalMaterial>(null);
  const busy = p.mood === 'busy';
  const hs = useMemo(() => BASE.map((b) => b * p.height), [p.height]);
  const pos = (k: number) => [at(k % N), at(Math.floor(k / N))] as const;

  useLoop((m) => {
    const hops = ROUTE.length;
    const u = cycle(m.t, 1) * hops; // 0..4 across the loop
    const seg = Math.floor(u) % hops;
    const local = u - Math.floor(u);
    const from = ROUTE[seg];
    const to = ROUTE[(seg + 1) % hops];
    // Rest for the first part of each segment, then hop.
    const hopStart = busy ? 0.45 : 0.62;
    const hp = Math.max(0, (local - hopStart) / (1 - hopStart));
    const e = hp < 0.5 ? 2 * hp * hp : 1 - Math.pow(-2 * hp + 2, 2) / 2;
    const [fx, fz] = pos(from);
    const [tx, tz] = pos(to);
    const sinceLand = local < hopStart ? local / hopStart : 1; // 0 = just landed on `from`

    // Columns: idle breathing chart, a ripple from the agent's cell, hover raises everything.
    const press = Math.abs(pressBounce(m.pressAge));
    cols.current.forEach((g, k) => {
      if (!g) return;
      const [cx, cz] = pos(k);
      const d = Math.hypot(cx - fx, cz - fz);
      const ripple = Math.sin(Math.PI * Math.min(1, sinceLand * 1.6)) * Math.exp(-sinceLand * 2) * Math.cos(d * 9 - sinceLand * 12) * Math.exp(-d * 1.6) * (busy ? 0.08 : 0.04);
      const clickRipple = press * Math.cos(d * 8 - (Number.isFinite(m.pressAge) ? m.pressAge : 0) * 18) * 0.12;
      const breathe = wave(m.t, busy ? 2 : 1, rand(k * 9.1)) * 0.025;
      const lift = 1 + m.hover * 0.45 * (0.4 + rand(k * 2.7));
      const h = Math.max(0.06, hs[k] * lift + breathe + ripple + clickRipple);
      g.scale.y = h;
    });

    if (agent.current) {
      const hFrom = hs[from] * (1 + m.hover * 0.45 * (0.4 + rand(from * 2.7)));
      const hTo = hs[to] * (1 + m.hover * 0.45 * (0.4 + rand(to * 2.7)));
      const x = fx + (tx - fx) * e;
      const z = fz + (tz - fz) * e;
      const y = hFrom + (hTo - hFrom) * e + Math.sin(Math.PI * hp) * 0.42;
      agent.current.position.set(x, y, z);
      // Squash on take-off/landing, spin a quarter turn in the air.
      const sq = hp > 0 && hp < 1 ? Math.sin(Math.PI * hp) * 0.12 : Math.exp(-sinceLand * 14) * 0.15;
      agent.current.scale.set(1 + sq * 0.6, 1 - sq + (hp > 0 && hp < 1 ? sq * 1.6 : 0), 1 + sq * 0.6);
      agent.current.rotation.y = e * (Math.PI / 2) + seg * (Math.PI / 2);
    }
    if (agentMat.current) agentMat.current.emissiveIntensity = 0.08 + m.hover * 0.25 + press * 0.8;
  });

  return (
    <IconMotion seed={41} float={0.05} sway={0.06}>
      <group position={[0, -0.55, 0]} rotation={[0, Math.PI / 4, 0]} scale={1.1}>
        {/* Tray with a raised lip, like a type case */}
        <RoundedBox args={[N * PITCH + 0.24, 0.16, N * PITCH + 0.24]} radius={0.06} smoothness={5} position={[0, -0.08, 0]}>
          <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.trayColor} />
        </RoundedBox>
        {/* Columns: unit-height boxes scaled in y from the floor */}
        {hs.map((_, k) => {
          const [x, z] = pos(k);
          return (
            <group key={k} position={[x, 0, z]} ref={(el) => void (cols.current[k] = el)}>
              <RoundedBox args={[TILE, 1, TILE]} radius={0.035} smoothness={4} position={[0, 0.5, 0]}>
                <Surface kind={p.material} c={p.tileColor} />
              </RoundedBox>
            </group>
          );
        })}
        {/* The agent: a glossy red block resting on the active platform */}
        <group ref={agent}>
          <RoundedBox args={[0.34, 0.2, 0.34]} radius={0.05} smoothness={5} position={[0, 0.1, 0]}>
            <meshPhysicalMaterial ref={agentMat} color={p.agentColor} emissive={p.agentColor} emissiveIntensity={0.08} roughness={0.18} clearcoat={1} clearcoatRoughness={0.06} />
          </RoundedBox>
        </group>
      </group>
    </IconMotion>
  );
}
