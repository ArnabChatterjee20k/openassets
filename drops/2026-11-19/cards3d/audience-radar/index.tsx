import { useRef } from 'react';
import type * as THREE from 'three';
import { Quaternion, Vector3 } from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Audience Radar',
  description: 'Project card for Crossfade Audience Radar, which scans every platform for lookalike audiences: a glossy white satellite dish that sweeps the sky, its receiver gem pulsing in the seeded light.',
  tags: ['card', 'audiences', 'radar', 'dish', 'targeting', 'project'],
};

export const schema = beamSchema({ name: 'Audience Radar' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'lookalike-finder': { name: 'Lookalike Finder' },
  'geo-scout': { name: 'Geo Scout' },
  gold: { lightMode: 'custom', light: '#FFD27F' },
  matte: { finish: 'matte', glow: 0.55 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

const RIM_R = 1.25 * Math.sin(0.72); // dish rim radius
const RIM_Y = 1.25 - 1.25 * Math.cos(0.72); // rim height above the bowl's bottom
const FOCUS_Y = 1.0;

function Shell({ finish, color = '#F4F2F0' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} side={2} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" side={2} />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} side={2} />;
}

export default function AudienceRadar(p: P) {
  const light = beamLight(p).color;
  const head = useRef<THREE.Group>(null);
  const gem = useRef<THREE.MeshStandardMaterial>(null);
  const pings = useRef<(THREE.Mesh | null)[]>([]);
  const pingMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  // Idle: the dish pans left and right, the receiver pulses and rings ping out
  // of it. Hover locks on (dish turns to face you); a click fires a big ping.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    if (head.current) {
      head.current.rotation.y = -0.55 + wave(m.t, 1) * 0.35 * (1 - m.hover * 0.8) + m.hover * 0.45 + press * 0.3;
      head.current.rotation.x = wave(m.t, 2, 0.25) * 0.05;
    }
    const pulse = Math.pow(1 - cycle(m.t, 2), 3);
    if (gem.current) gem.current.emissiveIntensity = 1.8 + pulse * 2.4 + m.hover * 1 + Math.abs(press) * 4;
    pings.current.forEach((r, i) => {
      if (!r) return;
      const u = cycle(m.t, 2, i * 0.5);
      const s = 0.4 + u * 2.4;
      r.scale.set(s, s, s);
      const mat = pingMats.current[i];
      if (mat) mat.opacity = (1 - u) * (0.55 + m.hover * 0.3);
    });
  });

  return (
    <IconMotion seed={38}>
      <group position={[0, -0.5, 0]} rotation={[0.12, -0.3, 0]} scale={1.12}>
        {/* base */}
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.6, 0.68, 0.18, 48]} />
          <Shell finish={p.finish} color="#E9E6E3" />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.12, 0.2, 0.42, 32]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.17, 32, 16]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* the dish head: tilted up toward the sky */}
        <group ref={head} position={[0, 0.25, 0]} rotation={[0, -0.55, 0]}>
          <group rotation={[0.62, 0, 0]}>
            {/* shallow bowl: the bottom cap of a sphere, concave side up (+y) */}
            <mesh position={[0, 1.25, 0]}>
              <sphereGeometry args={[1.25, 64, 24, 0, Math.PI * 2, Math.PI - 0.72, 0.72]} />
              <Shell finish={p.finish} />
            </mesh>
            <mesh position={[0, RIM_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[RIM_R, 0.04, 16, 80]} />
              <Shell finish={p.finish} color="#FBFAF9" />
            </mesh>
            {/* tripod feed arms from the rim to the receiver */}
            {[0, 1, 2].map((k) => {
              const a = (k / 3) * Math.PI * 2 + Math.PI / 2;
              const base = new Vector3(Math.cos(a) * RIM_R * 0.92, RIM_Y, Math.sin(a) * RIM_R * 0.92);
              const top = new Vector3(0, FOCUS_Y + 0.08, 0);
              const dir = top.clone().sub(base);
              const len = dir.length();
              const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize());
              const mid = base.clone().add(top).multiplyScalar(0.5);
              return (
                <mesh key={k} position={mid} quaternion={q}>
                  <cylinderGeometry args={[0.022, 0.022, len, 10]} />
                  <Shell finish={p.finish} color="#E2DFDC" />
                </mesh>
              );
            })}
            {/* receiver: a glowing gem at the focus */}
            <mesh position={[0, FOCUS_Y + 0.08, 0]}>
              <sphereGeometry args={[0.07, 20, 12]} />
              <Shell finish={p.finish} />
            </mesh>
            <mesh position={[0, FOCUS_Y, 0]}>
              <sphereGeometry args={[0.15, 32, 16]} />
              <meshStandardMaterial ref={gem} color={light} emissive={light} emissiveIntensity={2.5} roughness={0.2} toneMapped={false} />
            </mesh>
            {[0, 1].map((i) => (
              <mesh key={i} ref={(el) => void (pings.current[i] = el)} position={[0, FOCUS_Y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.16, 0.008, 8, 48]} />
                <meshBasicMaterial ref={(el) => void (pingMats.current[i] = el)} color={light} transparent opacity={0.4} toneMapped={false} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
