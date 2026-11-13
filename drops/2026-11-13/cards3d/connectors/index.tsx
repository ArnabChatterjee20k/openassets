import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Connectors',
  description: "Project card for Pike's Connectors (32 ad platforms, one click each): a glossy white plug with a glowing collar that pulses as data flows, lit by beams seeded from the project name.",
  tags: ['card', 'integrations', 'plug', 'api', 'project'],
};

export const schema = beamSchema({ name: 'Connectors' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'meta-sync': { name: 'Meta Sync' },
  'ctv-bridge': { name: 'CTV Bridge' },
  frost: { lightMode: 'custom', light: '#A7C4D4' },
  'tip-up': { lightMode: 'custom', light: '#E4572E' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#E4E8EE" metalness={1} roughness={0.34} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#EEF1F3" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F3F5F7" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function Connectors(p: P) {
  const light = beamLight(p).color;
  const collar = useRef<THREE.MeshStandardMaterial>(null);
  const plug = useRef<THREE.Group>(null);
  const pulses = useRef<(THREE.Mesh | null)[]>([]);

  // Cable: a soft S-curve trailing off behind the plug.
  const cable = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.45, 0, 0),
      new THREE.Vector3(-0.8, -0.05, 0),
      new THREE.Vector3(-1.1, -0.35, 0.1),
      new THREE.Vector3(-1.3, -0.6, 0.3),
    ]);
    return { geo: new THREE.TubeGeometry(curve, 64, 0.07, 16, false), curve };
  }, []);

  // Idle: data pulses travel up the cable into the plug and the collar glows
  // as each one arrives. Hover speeds the flow; click jabs the plug forward.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    if (plug.current) plug.current.position.x = press * 0.12;
    const arrive = Math.max(0, 1 - cycle(m.t, 2) * 5);
    if (collar.current) collar.current.emissiveIntensity = 1.3 + arrive * 1.5 + m.hover * 0.8 + Math.abs(press) * 2;
    pulses.current.forEach((mesh, i) => {
      if (!mesh) return;
      const u = cycle(m.t, 2, i * 0.5);
      const pt = cable.curve.getPoint(1 - u);
      mesh.position.copy(pt);
      mesh.scale.setScalar(0.6 + Math.sin(Math.PI * u) * 0.6 + wave(m.t, 4) * 0.05);
    });
  });

  return (
    <IconMotion seed={88} float={0.05}>
      <group rotation={[0.3, -0.55, 0.2]} position={[0.3, 0.05, 0]} scale={1.45}>
        <group ref={plug}>
          {/* Body */}
          <RoundedBox args={[0.7, 0.6, 0.6]} radius={0.16} smoothness={5}>
            <Shell finish={p.finish} />
          </RoundedBox>
          {/* Glowing collar */}
          <mesh position={[0.37, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.24, 0.035, 16, 64]} />
            <meshStandardMaterial ref={collar} color={light} emissive={light} emissiveIntensity={1.5} roughness={0.3} />
          </mesh>
          {/* Face plate */}
          <mesh position={[0.38, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.2, 0.22, 0.06, 48]} />
            <Shell finish={p.finish} />
          </mesh>
          {/* Prongs */}
          {[-0.09, 0.09].map((zz) => (
            <RoundedBox key={zz} args={[0.32, 0.12, 0.035]} radius={0.012} smoothness={3} position={[0.56, 0, zz]}>
              <meshStandardMaterial color="#C9D2D9" metalness={1} roughness={0.25} />
            </RoundedBox>
          ))}
          {/* Strain relief */}
          <mesh position={[-0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.1, 0.14, 0.18, 32]} />
            <Shell finish={p.finish} />
          </mesh>
        </group>
        <mesh geometry={cable.geo}>
          <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
        </mesh>
        {[0, 1].map((i) => (
          <mesh key={i} ref={(el) => void (pulses.current[i] = el)}>
            <sphereGeometry args={[0.085, 20, 20]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={2} transparent opacity={0.9} />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
