import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: '72h Shipping',
  description: 'Project card for Redbrick 72h Shipping: a glossy white parcel wrapped in a glowing tape band, with a shipping label; the flaps peek and it hops when clicked.',
  tags: ['card', 'shipping', 'parcel', 'logistics', 'project'],
};

export const schema = beamSchema({ name: '72h Shipping' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'order-tracking': { name: 'Order Tracking' },
  'made-in-ohio': { name: 'Made in Ohio' },
  sage: { lightMode: 'custom', light: '#6FAE84' },
  matte: { finish: 'matte', glow: 0.55 },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish, c = '#F5F2EE' }: { finish: P['finish']; c?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8D4CE" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={c} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={c} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function ShippingCard(p: P) {
  const light = beamLight(p).color;
  const box = useRef<THREE.Group>(null);
  const flapL = useRef<THREE.Group>(null);
  const flapR = useRef<THREE.Group>(null);
  const tape = useRef<THREE.MeshStandardMaterial>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);

  // Idle: the tape band breathes, the top flaps peek open once per loop, the
  // label LED blinks "scanned". Hover opens the flaps; a click makes it hop.
  useLoop((m) => {
    const press = pressBounce(m.pressAge);
    const peek = blink(m.t, 0.5, 0.12) * 0.35 + m.hover * 0.5 + Math.abs(press) * 0.6;
    if (flapL.current) flapL.current.rotation.z = peek;
    if (flapR.current) flapR.current.rotation.z = -peek;
    if (tape.current) tape.current.emissiveIntensity = 1.1 + (wave(m.t, 2) * 0.5 + 0.5) * 0.9 + m.hover;
    if (led.current) led.current.emissiveIntensity = 0.4 + blink(m.t, 0.2, 0.04) * 3;
    if (box.current) box.current.position.y = Math.max(0, -press) * 0.25;
  });

  const W = 1.5;
  const H = 1.0;
  const D = 1.05;
  return (
    <IconMotion seed={67} float={0.05}>
      <group ref={box} rotation={[0.3, 0.55, 0]} position={[0, -0.15, 0]} scale={1.2}>
        <RoundedBox args={[W, H, D]} radius={0.07} smoothness={5}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* glowing tape band around the box */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.28, H + 0.02, D + 0.02]} />
          <meshStandardMaterial ref={tape} color={light} emissive={light} emissiveIntensity={1.4} roughness={0.35} />
        </mesh>
        {/* shipping label on the front face */}
        <group position={[0.42, -0.08, D / 2 + 0.012]}>
          <mesh>
            <boxGeometry args={[0.46, 0.5, 0.02]} />
            <meshStandardMaterial color="#E7E2DA" roughness={0.6} />
          </mesh>
          {[0.14, 0.06, -0.02].map((y, i) => (
            <mesh key={i} position={[-0.04 + (i === 0 ? 0 : 0.03), y, 0.012]}>
              <boxGeometry args={[i === 0 ? 0.32 : 0.26, 0.035, 0.005]} />
              <meshStandardMaterial color="#8F877C" />
            </mesh>
          ))}
          {/* barcode */}
          {Array.from({ length: 9 }, (_, i) => (
            <mesh key={i} position={[-0.16 + i * 0.04, -0.14, 0.012]}>
              <boxGeometry args={[i % 3 === 0 ? 0.022 : 0.012, 0.12, 0.005]} />
              <meshStandardMaterial color="#3B342E" />
            </mesh>
          ))}
          <mesh position={[0.17, 0.17, 0.014]}>
            <circleGeometry args={[0.03, 20]} />
            <meshStandardMaterial ref={led} color={light} emissive={light} emissiveIntensity={0.6} />
          </mesh>
        </group>
        {/* top flaps, hinged on the long edges */}
        <group ref={flapL} position={[-W / 2 + 0.02, H / 2, 0]}>
          <RoundedBox args={[W / 2 - 0.02, 0.04, D - 0.06]} radius={0.015} smoothness={3} position={[W / 4, 0.02, 0]}>
            <Shell finish={p.finish} c="#ECE8E2" />
          </RoundedBox>
        </group>
        <group ref={flapR} position={[W / 2 - 0.02, H / 2, 0]}>
          <RoundedBox args={[W / 2 - 0.02, 0.04, D - 0.06]} radius={0.015} smoothness={3} position={[-W / 4, 0.02, 0]}>
            <Shell finish={p.finish} c="#ECE8E2" />
          </RoundedBox>
        </group>
      </group>
    </IconMotion>
  );
}
