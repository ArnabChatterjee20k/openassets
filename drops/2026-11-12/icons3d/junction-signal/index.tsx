import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, flicker, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Junction Signal',
  description:
    'Hero object for Junction, the ad agent: a chunky transit signal head whose three lamps report campaign status (orange planning, lime live, grapefruit needs you). Lamps step through the sequence, warm up on hover and all flash on click.',
  tags: ['3d', 'hero', 'signal', 'transit', 'status', 'ads'],
};

export const schema = z.object({
  material: select(['enamel', 'glossy', 'chrome', 'clay'], 'Material').default('enamel'),
  body: color('Housing').default('#1C2B1A'),
  plate: color('Backplate').default('#FFE9A8'),
  planning: color('Top lamp (planning)').default('#FF7A00'),
  live: color('Middle lamp (live)').default('#2BB24C'),
  attention: color('Bottom lamp (needs you)').default('#FF3D7F'),
  mood: select(['calm', 'busy'], 'Mood').default('busy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', body: '#FF7A00', plate: '#FFF8E1', planning: '#FFE14D' },
  chrome: { material: 'chrome', body: '#C9CED6', plate: '#1C2B1A' },
  clay: { material: 'clay', body: '#FFE9A8', plate: '#FF7A00', planning: '#FF5A1F' },
  'night line': { body: '#0E1A14', plate: '#2BB24C', planning: '#FF9F43', live: '#B5E550', attention: '#FF3D7F' },
  calm: { mood: 'calm', material: 'glossy', body: '#FFF8E1', plate: '#2BB24C' },
};

type P = z.infer<typeof schema>;

function Shell({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} />;
    case 'chrome':
      return <meshStandardMaterial color={c} metalness={1} roughness={0.28} />;
    case 'clay':
      return <meshPhysicalMaterial color={c} roughness={0.72} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
    default:
      // Enamel: painted steel, satin with a clear lacquer.
      return <meshPhysicalMaterial color={c} roughness={0.42} metalness={0.15} clearcoat={0.8} clearcoatRoughness={0.25} />;
  }
}

const LAMP_Y = [0.62, 0, -0.62];

export default function JunctionSignal(p: P) {
  const lamps = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);
  const bullets = useRef<(THREE.Group | null)[]>([]);
  const busy = p.mood === 'busy';
  const colors = [p.planning, p.live, p.attention];
  // An unlit lens is the same glass, much darker: so "one lamp on" reads clearly.
  const lit = useMemo(() => colors.map((c) => new THREE.Color(c)), [p.planning, p.live, p.attention]);
  const off = useMemo(() => lit.map((c) => c.clone().lerp(new THREE.Color('#0B110A'), 0.68)), [lit]);

  // Rest pose (t = 0): live lamp on, the others dim. The loop steps through
  // planning → live → needs-you; hover warms every lens, a click flashes them all.
  useLoop((m) => {
    const press = Math.min(1, Math.abs(pressBounce(m.pressAge)) * 2.5);
    const on = [
      blink(m.t, 0.3, busy ? 0.1 : 0.06),
      0.75 + 0.25 * (0.5 + 0.5 * wave(m.t, busy ? 2 : 1, 0.25)),
      busy ? Math.max(flicker(m.t, 0.62), blink(m.t, 0.7, 0.05)) : blink(m.t, 0.66, 0.04) * 0.6,
    ];
    on.forEach((v, i) => {
      const lvl = Math.min(1, Math.max(v, m.hover * 0.7, press));
      const mat = lamps.current[i];
      if (mat) {
        mat.emissiveIntensity = 0.04 + lvl * 0.95;
        mat.color.copy(lit[i]).lerp(off[i], 1 - lvl);
      }
    });
    bullets.current.forEach((b, i) => {
      if (!b) return;
      const s = 1 + blink(m.t, 0.15 + i * 0.12, 0.05) * 0.35 + press * 0.3;
      b.scale.setScalar(s);
    });
  });

  return (
    <IconMotion seed={41} sway={0.06}>
      <group position={[0, 0.1, 0]} scale={0.82} rotation={[0, -0.32, 0]}>
        {/* Backplate: the signal's contrast board */}
        <RoundedBox args={[1.32, 2.22, 0.08]} radius={0.04} smoothness={4} position={[0, 0, -0.34]}>
          <Shell kind={p.material === 'chrome' ? 'enamel' : p.material} c={p.plate} />
        </RoundedBox>
        <RoundedBox args={[1.42, 2.32, 0.05]} radius={0.05} smoothness={4} position={[0, 0, -0.4]}>
          <Shell kind={p.material} c={p.body} />
        </RoundedBox>
        {/* Housing */}
        <RoundedBox args={[0.96, 1.92, 0.62]} radius={0.2} smoothness={6}>
          <Shell kind={p.material} c={p.body} />
        </RoundedBox>
        {/* Lamps: bezel, domed lens, visor, halo */}
        {LAMP_Y.map((y, i) => (
          <group key={i} position={[0, y, 0.31]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.005]}>
              <cylinderGeometry args={[0.27, 0.27, 0.04, 48]} />
              <meshStandardMaterial color="#0B110A" roughness={0.6} />
            </mesh>
            <mesh scale={[1, 1, 0.42]} position={[0, 0, 0.02]}>
              <sphereGeometry args={[0.22, 48, 32]} />
              <meshPhysicalMaterial
                ref={(el) => void (lamps.current[i] = el)}
                color={i === 1 ? lit[i] : off[i]}
                emissive={colors[i]}
                emissiveIntensity={i === 1 ? 0.99 : 0.04}
                roughness={0.15}
                clearcoat={1}
                clearcoatRoughness={0.05}
              />
            </mesh>
            {/* Visor: half tube hooded over the top of the lens */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.12]}>
              <cylinderGeometry args={[0.29, 0.29, 0.26, 48, 1, true, Math.PI / 2, Math.PI]} />
              <meshPhysicalMaterial color={p.body} roughness={0.4} clearcoat={0.6} side={THREE.DoubleSide} metalness={p.material === 'chrome' ? 1 : 0.1} />
            </mesh>
          </group>
        ))}
        {/* Top cap */}
        <mesh position={[0, 1.02, 0]}>
          <cylinderGeometry args={[0.16, 0.22, 0.12, 32]} />
          <Shell kind={p.material} c={p.body} />
        </mesh>
        {/* Route plate: three line bullets on the side arm */}
        <group position={[0.86, 0.46, -0.02]}>
          <RoundedBox args={[0.5, 0.92, 0.1]} radius={0.05} smoothness={4}>
            <Shell kind={p.material === 'chrome' ? 'enamel' : p.material} c={p.plate} />
          </RoundedBox>
          {colors.map((c, i) => (
            <group key={i} ref={(el) => void (bullets.current[i] = el)} position={[0, 0.27 - i * 0.27, 0.06]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.05, 32]} />
                <meshPhysicalMaterial color={c} emissive={c} emissiveIntensity={0.35} roughness={0.25} clearcoat={1} />
              </mesh>
              <mesh position={[0, 0, 0.027]}>
                <circleGeometry args={[0.045, 24]} />
                <meshStandardMaterial color="#FFF8E1" />
              </mesh>
            </group>
          ))}
        </group>
        {/* Post and base */}
        <mesh position={[0, -1.32, -0.05]}>
          <cylinderGeometry args={[0.11, 0.11, 0.72, 32]} />
          <Shell kind={p.material} c={p.body} />
        </mesh>
        <mesh position={[0, -1.66, -0.05]}>
          <cylinderGeometry args={[0.36, 0.42, 0.1, 48]} />
          <Shell kind={p.material} c={p.body} />
        </mesh>
      </group>
    </IconMotion>
  );
}
