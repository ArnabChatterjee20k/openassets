import { useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Autopilot Budgets',
  description: 'Feature card for Mycel Autopilot Budgets: a glossy white coin stack with a standing coin that spins, its rim glowing in the card light. Light is seeded from the project name.',
  tags: ['card', 'budget', 'coins', 'ads', 'feature'],
};

export const schema = beamSchema({ name: 'Autopilot Budgets' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
  coins: select(['3', '4', '5'], 'Stack height').default('4'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'spend-guard': { name: 'Spend Guard' },
  'roas-pacing': { name: 'ROAS Pacing' },
  foxfire: { lightMode: 'custom', light: '#B5E550' },
  chrome: { finish: 'chrome', coins: '5' },
  matte: { finish: 'matte', glow: 0.55, coins: '3' },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F5F2' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCD6" metalness={1} roughness={0.34} envMapIntensity={1.8} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

const R = 0.5;
const H = 0.14;

/** One coin: body + raised rim + inset face. */
function Coin({ finish }: { finish: P['finish'] }) {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[R, R, H, 64]} />
        <Shell finish={finish} />
      </mesh>
      <mesh position={[0, H / 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R * 0.86, 0.022, 12, 64]} />
        <Shell finish={finish} color="#E3E5DF" />
      </mesh>
    </group>
  );
}

export default function AutopilotBudgets(p: P) {
  const light = beamLight(p).color;
  const n = Number(p.coins);
  const spinner = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const topCoin = useRef<THREE.Group>(null);

  // Idle: the standing coin spins once per loop, its glowing inlay breathes and
  // the top coin of the stack bobs. Hover spins faster; a click flips the coin.
  useLoop((m) => {
    const kick = Number.isFinite(m.pressAge) ? Math.exp(-m.pressAge * 2.5) : 0;
    if (spinner.current) spinner.current.rotation.y = cycle(m.t, m.hover > 0.5 ? 2 : 1) * Math.PI * 2 + kick * Math.PI * 4;
    if (ring.current) ring.current.emissiveIntensity = 0.45 + (wave(m.t, 2) * 0.5 + 0.5) * 0.5 + m.hover * 0.4 + kick * 1.2;
    if (topCoin.current) topCoin.current.position.y = (n - 1) * H * 1.02 + 0.03 + (wave(m.t, 2) * 0.5 + 0.5) * 0.05 + Math.abs(pressBounce(m.pressAge)) * 0.15;
  });

  return (
    <IconMotion seed={53} float={0.04}>
      <group position={[0.05, -0.55, 0]} rotation={[0.3, -0.42, 0]} scale={1.4}>
        {/* stack, slightly staggered like a real pile */}
        <group position={[-0.45, 0, 0.1]}>
          {Array.from({ length: n - 1 }, (_, i) => (
            <group key={i} position={[Math.sin(i * 2.1) * 0.035, i * H * 1.02, Math.cos(i * 1.7) * 0.03]}>
              <Coin finish={p.finish} />
            </group>
          ))}
          <group ref={topCoin} position={[0, (n - 1) * H * 1.02, 0]}>
            <Coin finish={p.finish} />
            <mesh position={[0, H / 2 + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[R * 0.42, R * 0.62, 64]} />
              <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.6} />
            </mesh>
          </group>
        </group>
        {/* standing coin with a glowing inlay ring */}
        <group ref={spinner} position={[0.55, R + 0.02, -0.05]}>
          <group rotation={[Math.PI / 2, 0, 0]}>
            <Coin finish={p.finish} />
            <group rotation={[Math.PI, 0, 0]}>
              <Coin finish={p.finish} />
            </group>
          </group>
          <mesh>
            <torusGeometry args={[R * 0.55, 0.095, 20, 64]} />
            <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={0.6} roughness={0.3} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[R * 0.2, R * 0.2, H * 1.25, 32]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.45} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </IconMotion>
  );
}
