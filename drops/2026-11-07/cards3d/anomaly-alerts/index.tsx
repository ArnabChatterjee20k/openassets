import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Anomaly Alerts',
  description: 'Project card for Mandate Anomaly Alerts: a glossy white desk bell with a glowing ring band; it dings once per loop when the agent flags overspend, harder when you click.',
  tags: ['card', 'alerts', 'anomaly', 'bell', 'project'],
};

export const schema = beamSchema({ name: 'Anomaly Alerts' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'overspend-watch': { name: 'Overspend Watch' },
  'fatigue-signals': { name: 'Fatigue Signals' },
  gold: { lightMode: 'custom', light: '#C9A45C' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EFEA" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F3F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const Steel = () => <meshPhysicalMaterial color="#E2E4EA" metalness={0.55} roughness={0.2} clearcoat={1} />;

export default function AnomalyAlerts(p: P) {
  const light = beamLight(p).color;
  const dome = useRef<THREE.Group>(null);
  const plunger = useRef<THREE.Group>(null);
  const band = useRef<THREE.MeshStandardMaterial>(null);
  const halo = useRef<THREE.Mesh>(null);

  // Dome profile: a rounded bell shape, slightly flared at the rim.
  const domeGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * (Math.PI / 2);
      pts.push(new THREE.Vector2(Math.sin(a) * 0.62, Math.cos(a) * 0.56));
    }
    pts.push(new THREE.Vector2(0.66, -0.02));
    pts.push(new THREE.Vector2(0.66, -0.06));
    // Lathe winds its faces by point order: bottom → top so the outside faces out.
    return new THREE.LatheGeometry(pts.reverse(), 64);
  }, []);

  // Idle: the plunger dips and the dome rings once per loop (a decaying wobble);
  // the band flashes on the ding. Hover keeps it glowing; a click rings it harder.
  useLoop((m) => {
    const ding = 0.29;// moment in the loop (0..1)
    const u = (((m.t / 4 - ding) % 1) + 1) % 1; // time since the ding, in loops
    const ring = u < 0.45 ? Math.exp(-u * 9) * Math.sin(u * 4 * 22) : 0;
    const press = pressBounce(m.pressAge);
    const tap = Math.max(blink(m.t, ding - 0.02, 0.035), Math.abs(press));
    if (plunger.current) plunger.current.position.y = 0.66 - tap * 0.08;
    if (dome.current) {
      dome.current.rotation.z = ring * 0.05 + press * 0.12;
      dome.current.rotation.x = ring * 0.025 - press * 0.05;
    }
    const flash = Math.max(0, u < 0.3 ? Math.exp(-u * 12) : 0);
    const k = 1.2 + (wave(m.t, 2) * 0.5 + 0.5) * 0.4 + flash * 2.6 + m.hover * 0.8 + Math.abs(press) * 3;
    if (band.current) band.current.emissiveIntensity = k;
    if (halo.current) {
      const s = 1 + flash * 0.12 + Math.abs(press) * 0.25;
      halo.current.scale.set(s, s, 1);
      (halo.current.material as THREE.MeshBasicMaterial).opacity = 0.08 + flash * 0.22 + Math.abs(press) * 0.3;
    }
  });

  return (
    <IconMotion seed={23} float={0.05}>
      <group position={[0, -0.55, 0]} rotation={[0.16, -0.3, 0]} scale={1.45}>
        {/* base plate */}
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.82, 0.86, 0.14, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.74, 0.8, 0.05, 64]} />
          <Steel />
        </mesh>
        {/* dome + glowing ring band at its rim */}
        <group ref={dome}>
          <mesh geometry={domeGeo} position={[0, 0.04, 0]}>
            <Shell finish={p.finish} />
          </mesh>
          <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.645, 0.035, 16, 96]} />
            <meshStandardMaterial ref={band} color={light} emissive={light} emissiveIntensity={1.4} roughness={0.25} toneMapped={false} />
          </mesh>
          {/* plunger button */}
          <group ref={plunger} position={[0, 0.66, 0]}>
            <mesh position={[0, -0.04, 0]}>
              <cylinderGeometry args={[0.045, 0.045, 0.16, 16]} />
              <Steel />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <sphereGeometry args={[0.14, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <Steel />
            </mesh>
            <mesh position={[0, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.14, 32]} />
              <Steel />
            </mesh>
          </group>
        </group>
        {/* soft halo ring that pulses on the ding */}
        <mesh ref={halo} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.84, 64]} />
          <meshBasicMaterial color={light} transparent opacity={0.15} toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
    </IconMotion>
  );
}
