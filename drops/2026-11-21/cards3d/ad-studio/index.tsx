import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import type * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, cycle, pressBounce, useLoop } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Ad Studio',
  description: 'Feature card for Multiball Ad Studio (AI-generated video and image creatives): a glossy white clapperboard whose striped stick claps once per loop as its REC lamp flashes in the seeded light.',
  tags: ['card', 'creatives', 'clapperboard', 'video', 'ad agent'],
};

export const schema = beamSchema({ name: 'Ad Studio' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'ugc-reels': { name: 'UGC Reels' },
  'creative-lab': { name: 'Creative Lab' },
  teal: { lightMode: 'custom', light: '#00B3A4' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.24} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EFEC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F3F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const INK = '#23232E';
const W = 1.6;

/** A clapper stick: white bar with four slanted ink stripes inlaid on its face. */
function Stick({ finish, flip = false }: { finish: P['finish']; flip?: boolean }) {
  return (
    <group>
      <RoundedBox args={[W, 0.24, 0.16]} radius={0.05} smoothness={4} position={[W / 2, 0, 0]}>
        <Shell finish={finish} />
      </RoundedBox>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0.28 + i * 0.36, 0, 0.083]} rotation={[0, 0, flip ? -0.6 : 0.6]}>
          <boxGeometry args={[0.13, 0.27, 0.01]} />
          <meshPhysicalMaterial color={INK} roughness={0.3} clearcoat={1} />
        </mesh>
      ))}
    </group>
  );
}

export default function AdStudio(p: P) {
  const light = beamLight(p).color;
  const clap = useRef<THREE.Group>(null);
  const rec = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the stick lifts and claps shut once per loop ("take!"); the REC lamp
  // breathes and flashes on the clap. Hover raises the stick, a click claps.
  useLoop((m) => {
    const u = cycle(m.t, 1);
    // open 0.42 rad at rest; lift a bit more, then snap shut at u = 0.5, reopen
    let a = 0.42;
    if (u > 0.3 && u < 0.46) a = 0.42 + ((u - 0.3) / 0.16) * 0.18;
    else if (u >= 0.46 && u < 0.5) a = 0.6 * (1 - (u - 0.46) / 0.04);
    else if (u >= 0.5 && u < 0.58) a = 0;
    else if (u >= 0.58 && u < 0.8) a = 0.42 * Math.sin((((u - 0.58) / 0.22) * Math.PI) / 2);
    const press = pressBounce(m.pressAge);
    if (clap.current) clap.current.rotation.z = Math.max(0, a + m.hover * 0.12 - Math.abs(press) * 1.2);
    const hit = blink(m.t, 0.5, 0.05);
    if (rec.current) rec.current.emissiveIntensity = 0.6 + hit * 2.2 + Math.abs(press) * 2 + m.hover * 0.5 + 0.2 * Math.sin((m.t / 4) * Math.PI * 4);
  });

  return (
    <IconMotion seed={53}>
      <group rotation={[0.16, -0.3, 0]} position={[-1.08, 0.02, 0]} scale={1.36}>
        {/* slate */}
        <RoundedBox args={[W, 1.05, 0.18]} radius={0.07} smoothness={5} position={[W / 2, -0.52, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* chalk lines on the slate */}
        {[-0.38, -0.66].map((y) => (
          <mesh key={y} position={[W / 2 + 0.12, y, 0.095]}>
            <boxGeometry args={[1.1, 0.025, 0.01]} />
            <meshStandardMaterial color="#B9BBC4" roughness={0.6} />
          </mesh>
        ))}
        {/* REC lamp */}
        <mesh position={[0.26, -0.8, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.05, 40]} />
          <meshStandardMaterial ref={rec} color={light} emissive={light} emissiveIntensity={1} roughness={0.25} />
        </mesh>
        {/* fixed lower stick */}
        <group position={[0, 0.12, 0]}>
          <Stick finish={p.finish} flip />
        </group>
        {/* hinged clap stick */}
        <group position={[0.02, 0.26, 0]}>
          <group ref={clap} rotation={[0, 0, 0.42]}>
            <group position={[0, 0.12, 0]}>
              <Stick finish={p.finish} />
            </group>
          </group>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.24, 24]} />
            <meshStandardMaterial color="#B8BCC4" metalness={1} roughness={0.25} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
