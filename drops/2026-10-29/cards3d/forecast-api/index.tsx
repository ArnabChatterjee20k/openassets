import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Forecast API',
  description: 'Project card for the Stormcast Forecast API: a glossy white key with a glowing ring and an API-key tag, lit by beams seeded from the project name.',
  tags: ['card', 'api', 'key', 'developer', 'project'],
};

export const schema = beamSchema({ name: 'Forecast API' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'keyds': { name: 'KeyDS' },
  'webhooks': { name: 'Webhooks' },
  mint: { lightMode: 'custom', light: '#3DDC97' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.5 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1F4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function ForecastApi(p: P) {
  const light = beamLight(p).color;
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  const tag = useRef<THREE.Group>(null);

  // A key-tooth profile, extruded and bevelled.
  const blade = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.09);
    s.lineTo(1.25, -0.09);
    s.lineTo(1.25, 0.09);
    s.lineTo(1.05, 0.09);
    s.lineTo(1.05, 0.26);
    s.lineTo(0.9, 0.26);
    s.lineTo(0.9, 0.09);
    s.lineTo(0.72, 0.09);
    s.lineTo(0.72, 0.2);
    s.lineTo(0.6, 0.2);
    s.lineTo(0.6, 0.09);
    s.lineTo(0, 0.09);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.03, bevelSegments: 4 });
    g.translate(0, 0, -0.06);
    return g;
  }, []);

  // Idle: the ring's glow breathes and the tag swings; hover brightens; click jingles.
  useLoop((m) => {
    if (glow.current) glow.current.emissiveIntensity = 1.2 + (wave(m.t, 1) * 0.5 + 0.5) * 0.8 + m.hover * 0.8;
    if (tag.current) tag.current.rotation.z = -0.35 + wave(m.t, 1, 0.2) * 0.12 + pressBounce(m.pressAge) * 0.6;
  });

  return (
    <IconMotion seed={73}>
      <group rotation={[0.25, -0.35, -0.55]} position={[-0.25, 0.05, 0]} scale={1.05}>
        {/* bow */}
        <mesh>
          <torusGeometry args={[0.42, 0.16, 32, 64]} />
          <Shell finish={p.finish} />
        </mesh>
        {/* glowing inner ring */}
        <mesh position={[0, 0, 0.02]}>
          <torusGeometry args={[0.27, 0.045, 24, 64]} />
          <meshStandardMaterial ref={glow} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
        </mesh>
        {/* shaft + teeth */}
        <mesh geometry={blade} position={[0.52, 0, 0]}>
          <Shell finish={p.finish} />
        </mesh>
        {/* API-key tag on a little loop */}
        <group ref={tag} position={[-0.38, 0.28, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.09, 0.022, 12, 32]} />
            <meshStandardMaterial color="#C9CCD3" metalness={1} roughness={0.25} />
          </mesh>
          <RoundedBox args={[0.42, 0.62, 0.05]} radius={0.04} smoothness={4} position={[-0.05, -0.42, 0]}>
            <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
          </RoundedBox>
          <mesh position={[-0.05, -0.3, 0.031]}>
            <planeGeometry args={[0.26, 0.05]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.9} />
          </mesh>
          <mesh position={[-0.05, -0.42, 0.031]}>
            <planeGeometry args={[0.3, 0.035]} />
            <meshStandardMaterial color="#9EA3AD" />
          </mesh>
          <mesh position={[-0.08, -0.5, 0.031]}>
            <planeGeometry args={[0.24, 0.035]} />
            <meshStandardMaterial color="#9EA3AD" />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
