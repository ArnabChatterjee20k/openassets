import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Audience Radar',
  description: 'Project card for Towline Audience Radar, which scans every platform for the people a brief should reach: a glossy white radar dish on a pedestal that sweeps side to side, pinging from a glowing emitter. Light is seeded by the project name.',
  tags: ['card', 'audience', 'radar', 'targeting', 'project'],
};

export const schema = beamSchema({ name: 'Audience Radar' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'lookalike-scan': { name: 'Lookalike Scan' },
  'signal-finder': { name: 'Signal Finder' },
  violet: { lightMode: 'custom', light: '#9B5CFF' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F2F0' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} side={THREE.DoubleSide} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" side={THREE.DoubleSide} />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} side={THREE.DoubleSide} />;
}

const R = 0.72; // dish radius
const DEPTH = 0.3; // dish depth
const REST_YAW = -0.5; // at rest the dish looks off to the upper left, so its bowl reads

export default function AudienceRadar(p: P) {
  const light = beamLight(p).color;
  const dish = useMemo(() => {
    // Closed profile: concave inner face out to a rounded lip, back along the shell.
    const pts: THREE.Vector2[] = [];
    const N = 24;
    for (let i = 0; i <= N; i++) {
      const r = (i / N) * R;
      pts.push(new THREE.Vector2(Math.max(r, 0.001), (r / R) ** 2 * DEPTH));
    }
    for (let i = 1; i <= 8; i++) {
      const a = (i / 8) * Math.PI;
      pts.push(new THREE.Vector2(R + 0.035 * Math.sin(a), DEPTH - 0.035 + 0.035 * Math.cos(a)));
    }
    for (let i = N; i >= 0; i--) {
      const r = (i / N) * (R + 0.0);
      pts.push(new THREE.Vector2(Math.max(r, 0.001), (r / R) ** 2 * DEPTH - 0.07));
    }
    return new THREE.LatheGeometry(pts, 72);
  }, []);

  const yaw = useRef<THREE.Group>(null);
  const emit = useRef<THREE.MeshStandardMaterial>(null);
  const ping = useRef<THREE.Mesh>(null);
  const pingMat = useRef<THREE.MeshBasicMaterial>(null);

  // Idle: the dish sweeps left-right once per loop and the emitter pings twice;
  // hover widens the sweep and brightens the ping; click spins the dish a full turn.
  useLoop((m) => {
    const spin = m.pressAge < 1.2 ? THREE.MathUtils.smootherstep(m.pressAge / 1.2, 0, 1) * Math.PI * 2 : 0;
    if (yaw.current) yaw.current.rotation.y = REST_YAW + wave(m.t, 1) * (0.6 + m.hover * 0.2) + spin;
    const u = cycle(m.t, 2);
    if (emit.current) emit.current.emissiveIntensity = 1.8 + Math.exp(-u * 8) * 2.5 + m.hover * 0.8 + Math.abs(pressBounce(m.pressAge)) * 2;
    if (ping.current) ping.current.scale.setScalar(0.3 + u * 2.6);
    if (pingMat.current) pingMat.current.opacity = (1 - u) ** 2 * (0.55 + m.hover * 0.3);
  });

  return (
    <IconMotion seed={71} sway={0.05}>
      <group position={[0, -0.3, 0]} rotation={[0.22, 0.25, 0]} scale={1.08}>
        {/* pedestal */}
        <RoundedBox args={[0.95, 0.2, 0.8]} radius={0.09} smoothness={4} position={[0, -0.72, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.2, 0.28, 0.28, 40]} />
          <Shell finish={p.finish} />
        </mesh>
        <group ref={yaw}>
          {/* mast + tilt hub */}
          <mesh position={[0, -0.22, 0]}>
            <cylinderGeometry args={[0.07, 0.09, 0.4, 24]} />
            <Shell finish={p.finish} color="#E6E4E2" />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.11, 0.11, 0.26, 32]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* dish, facing forward and up */}
          <group position={[0, 0.12, 0.08]} rotation={[0.72, 0, 0]}>
            <mesh geometry={dish}>
              <Shell finish={p.finish} />
            </mesh>
            {/* feed struts to the emitter */}
            {[0, 1, 2].map((i) => {
              const a = (i / 3) * Math.PI * 2 + Math.PI / 2;
              const base = new THREE.Vector3(Math.cos(a) * R * 0.85, DEPTH * 0.72 - 0.01, Math.sin(a) * R * 0.85);
              const tip = new THREE.Vector3(0, 0.56, 0);
              const mid = base.clone().add(tip).multiplyScalar(0.5);
              const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tip.clone().sub(base).normalize());
              return (
                <mesh key={i} position={mid} quaternion={q}>
                  <cylinderGeometry args={[0.016, 0.016, base.distanceTo(tip), 10]} />
                  <Shell finish={p.finish} color="#E6E4E2" />
                </mesh>
              );
            })}
            {/* emitter */}
            <mesh position={[0, 0.6, 0]}>
              <sphereGeometry args={[0.1, 24, 16]} />
              <meshStandardMaterial ref={emit} color={light} emissive={light} emissiveIntensity={2} roughness={0.25} toneMapped={false} />
            </mesh>
            {/* ping wave travelling out of the dish */}
            <mesh ref={ping} position={[0, 0.66, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.18, 0.02, 8, 64]} />
              <meshBasicMaterial ref={pingMat} color={light} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
            </mesh>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
