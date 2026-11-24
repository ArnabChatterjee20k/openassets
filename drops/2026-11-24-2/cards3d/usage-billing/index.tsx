import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Usage Billing',
  description: 'Project card for Halfstream Usage Billing: a stack of glossy white coins with glowing rims, the top coin flipping over: AWS on-demand prices plus 25% on brokers.',
  tags: ['card', 'billing', 'pricing', 'coins', 'project'],
};

export const schema = beamSchema({ name: 'Usage Billing' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'cost-explorer': { name: 'Cost Explorer' },
  'msk-migration': { name: 'MSK Migration' },
  signal: { lightMode: 'custom', light: '#E3000F' },
  matte: { finish: 'matte', beams: 0.6 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F4F2' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const R = 0.62;
const T = 0.16;

function Coin({ finish, light, rim }: { finish: P['finish']; light: string; rim?: (m: THREE.MeshStandardMaterial | null) => void }) {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[R, R, T, 64]} />
        <Shell finish={finish} />
      </mesh>
      {/* glowing rim band */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R + 0.005, 0.035, 12, 64]} />
        <meshStandardMaterial ref={rim} color={light} emissive={light} emissiveIntensity={1.4} roughness={0.3} />
      </mesh>
      {/* embossed face ring */}
      <mesh position={[0, T / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[R * 0.62, R * 0.72, 64]} />
        <meshStandardMaterial color="#D9DADF" roughness={0.5} />
      </mesh>
    </group>
  );
}

export default function UsageBilling(p: P) {
  const light = beamLight(p).color;
  const top = useRef<THREE.Group>(null);
  const rims = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  // Idle: the top coin hops and flips once per loop; rims pulse up the stack.
  // Hover lifts the coin higher; click spins it.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    const u = (m.t % 4) / 4;
    const hop = u > 0.55 && u < 0.85 ? Math.sin(((u - 0.55) / 0.3) * Math.PI) : 0;
    if (top.current) {
      top.current.position.y = 0.52 + hop * 0.38 + m.hover * 0.12 + Math.abs(press) * 0.2;
      top.current.rotation.x = 0.2 + (u > 0.55 && u < 0.85 ? ((u - 0.55) / 0.3) * Math.PI * 2 : 0) + press * 1.5;
    }
    rims.current.forEach((r, i) => {
      if (r) r.emissiveIntensity = 1 + (0.5 + 0.5 * wave(m.t, 2, -i * 0.15)) * 1.2 + m.hover * 0.6;
    });
  });

  return (
    <IconMotion seed={88} sway={0.05}>
      <group rotation={[0.22, -0.3, 0]} position={[0, -0.5, 0]} scale={1.25}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[(i % 2 ? 0.04 : -0.03) * i, i * 0.17, 0]} rotation={[0, i * 0.4, 0]}>
            <Coin finish={p.finish} light={light} rim={(el) => void (rims.current[i] = el)} />
          </group>
        ))}
        <group ref={top} position={[0.05, 0.52, 0.02]} rotation={[0.2, 0, 0]}>
          <Coin finish={p.finish} light={light} rim={(el) => void (rims.current[3] = el)} />
        </group>
      </group>
    </IconMotion>
  );
}
