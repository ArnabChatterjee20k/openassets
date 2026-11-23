import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, cycle, pressBounce, shade, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Sparkcrate Unit',
  description:
    'The Sparkcrate hero: a chunky micro-grid crate with two solar wings unfolded, a charge gauge and a status LED. The wings breathe and the gauge fills; hover opens the wings wide, a click snaps them and flashes the charge.',
  tags: ['solar', 'battery', 'micro-grid', 'hero', '3d', 'crate'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  crate: color('Crate').default('#FFD82E'),
  band: color('Stripe').default('#FF6B4A'),
  panel: color('Solar cells').default('#5C8AFF'),
  charge: color('Charge light').default('#00D1A0'),
  trim: color('Trim & skids').default('#1A1A1A'),
  mood: select(['calm', 'lively'], 'Mood').default('lively'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', crate: '#FF6B4A', band: '#FFE45C' },
  metal: { material: 'metal', crate: '#D9DCE2', band: '#FF6B4A', trim: '#2A2C31' },
  lava: { material: 'glossy', crate: '#2E120B', band: '#FF4D00', panel: '#FFB000', charge: '#FF4D00', trim: '#120604' },
  blueprint: { crate: '#2B5BD7', band: '#FFFFFF', panel: '#0F3B8C', charge: '#FFDD00', trim: '#0A1F4D' },
  calm: { mood: 'calm', crate: '#FFFDF2', band: '#00D1A0' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={1} thickness={1} ior={1.4} attenuationColor={c} attenuationDistance={1.5} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.68} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

// Crate: 2.0 wide, 1.1 tall, 1.2 deep, sitting on two skids.
const W = 2.0;
const H = 1.1;
const D = 1.2;
const TOP = H / 2;
const WING = 1.3; // wing length from its hinge
const REST = Math.PI - 0.26; // rest angle: unfolded, tilted up to the sun

/** One solar wing: framed panel with a 3×2 cell grid, hinged at the crate's top edge. */
function Wing({ p, side, refCb }: { p: P; side: -1 | 1; refCb: (g: THREE.Group | null) => void }) {
  return (
    // Mirror group for the side, then the hinge group (rotates about z). The
    // panel extends along local +x; after the ~180° hinge turn local −y faces
    // the sky, so the cells sit on that side.
    <group rotation={[0, side === 1 ? Math.PI : 0, 0]}>
      <group ref={refCb} position={[-(W / 2 - 0.04), TOP + 0.04, 0]} rotation={[0, 0, REST]}>
        <RoundedBox args={[WING, 0.08, D * 0.98]} radius={0.03} smoothness={4} position={[WING / 2, 0, 0]}>
          <meshPhysicalMaterial color={p.trim} roughness={0.4} clearcoat={0.6} />
        </RoundedBox>
        {/* cells: two rows × three columns, on the sun-facing side */}
        {[0, 1, 2].map((i) =>
          [0, 1].map((j) => (
            <RoundedBox key={`${i}-${j}`} args={[WING / 3 - 0.06, 0.03, D * 0.46]} radius={0.012} smoothness={2} position={[0.12 + (i + 0.5) * ((WING - 0.16) / 3), -0.045, (j - 0.5) * D * 0.49]}>
              <meshPhysicalMaterial color={p.panel} roughness={0.12} clearcoat={1} clearcoatRoughness={0.04} metalness={0.25} />
            </RoundedBox>
          )),
        )}
        {/* hinge barrel */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, D * 0.9, 20]} />
          <meshStandardMaterial color={p.trim} roughness={0.35} metalness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

export default function SparkcrateUnit(p: P) {
  const wings = useRef<(THREE.Group | null)[]>([]);
  const bars = useRef<(THREE.Mesh | null)[]>([]);
  const led = useRef<THREE.Mesh>(null);
  const lively = p.mood === 'lively';

  // Idle: wings breathe as if tracking the sun, the gauge fills bar by bar and
  // the LED blinks. Hover opens the wings flatter; a click snaps them and
  // flashes every bar at once.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    // wave(...,1,0.75) starts at its trough, so t = 0 is the rest angle.
    const open = m.hover * 0.22 + (lively ? 0.1 : 0.05) * (wave(m.t, 1, 0.75) + 1) - press * 0.35;
    wings.current.forEach((g) => {
      if (g) g.rotation.z = REST + open;
    });
    // A charge "chase" sweeps across the bars (twice per loop when lively).
    const head = cycle(m.t, lively ? 2 : 1) * 6 - 1;
    bars.current.forEach((b, i) => {
      if (!b) return;
      const mat = b.material as THREE.MeshStandardMaterial;
      const chase = Math.max(0, 1 - Math.abs(head - i) / 1.2);
      mat.emissiveIntensity = 0.9 + chase * 2.2 + m.hover * 0.6 + Math.abs(press) * 4;
    });
    if (led.current) {
      const mat = led.current.material as THREE.MeshStandardMaterial;
      const b = Math.max(blink(m.t, 0.25, 0.05), blink(m.t, 0.75, 0.05));
      mat.emissiveIntensity = 0.6 + b * 3 + Math.abs(press) * 3;
    }
  });

  return (
    <IconMotion seed={41} float={0.05} sway={0.07}>
      <group scale={0.78} position={[0, -0.25, 0]} rotation={[0.28, -0.32, 0]}>
        {/* skids */}
        {[-0.62, 0.62].map((x) => (
          <RoundedBox key={x} args={[0.32, 0.18, D * 1.05]} radius={0.05} smoothness={4} position={[x, -H / 2 - 0.08, 0]}>
            <meshPhysicalMaterial color={p.trim} roughness={0.5} />
          </RoundedBox>
        ))}

        {/* crate body */}
        <RoundedBox args={[W, H, D]} radius={0.1} smoothness={5}>
          <Surface kind={p.material} c={p.crate} />
        </RoundedBox>
        {/* signature stripe wrapped around the body */}
        <RoundedBox args={[W + 0.03, 0.16, D + 0.03]} radius={0.05} smoothness={4} position={[0, -0.3, 0]}>
          <Surface kind={p.material === 'glass' ? 'glossy' : p.material} c={p.band} />
        </RoundedBox>

        {/* front charge gauge: a dark window with four bars */}
        <RoundedBox args={[1.12, 0.42, 0.06]} radius={0.05} smoothness={4} position={[-0.2, 0.15, D / 2 + 0.01]}>
          <meshPhysicalMaterial color={p.trim} roughness={0.25} clearcoat={1} />
        </RoundedBox>
        {[0, 1, 2, 3].map((i) => (
          <RoundedBox
            key={i}
            ref={(el: THREE.Mesh | null) => void (bars.current[i] = el)}
            args={[0.2, 0.28, 0.04]}
            radius={0.03}
            smoothness={3}
            position={[-0.56 + i * 0.24, 0.15, D / 2 + 0.05]}
          >
            <meshStandardMaterial color={shade(p.charge, -0.55)} emissive={p.charge} emissiveIntensity={0.9} roughness={0.3} />
          </RoundedBox>
        ))}
        {/* status LED + bezel */}
        <mesh position={[0.68, 0.15, D / 2 + 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.05, 32]} />
          <meshPhysicalMaterial color={p.trim} roughness={0.3} clearcoat={1} />
        </mesh>
        <mesh ref={led} position={[0.68, 0.15, D / 2 + 0.06]}>
          <sphereGeometry args={[0.075, 24, 24]} />
          <meshStandardMaterial color={p.band} emissive={p.band} emissiveIntensity={0.8} roughness={0.2} />
        </mesh>

        {/* solar wings */}
        <Wing p={p} side={-1} refCb={(g) => void (wings.current[0] = g)} />
        <Wing p={p} side={1} refCb={(g) => void (wings.current[1] = g)} />
      </group>
    </IconMotion>
  );
}
