import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Integrations',
  description: 'Feature card for Multiball integrations (connect 34 ad accounts in one click): a glossy white power plug standing prongs-up with a coiled cable and a glowing status ring that blinks "connecting" then locks on.',
  tags: ['card', 'integrations', 'plug', 'connect', 'ad agent'],
};

export const schema = beamSchema({ name: 'Integrations' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'one-click-connect': { name: 'One-Click Connect' },
  'shopify-sync': { name: 'Shopify Sync' },
  bubblegum: { lightMode: 'custom', light: '#FF6F91' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.24} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EFEC" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F5F3F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function Integrations(p: P) {
  const light = beamLight(p).color;
  const plug = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshStandardMaterial>(null);

  const geo = useMemo(() => {
    // Plug housing: a softened cylinder that necks in towards the cable boot.
    const body = new THREE.LatheGeometry(
      [
        [0, -0.62],
        [0.14, -0.62],
        [0.17, -0.5],
        [0.3, -0.3],
        [0.4, -0.16],
        [0.42, 0.2],
        [0.41, 0.3],
        [0.37, 0.34],
        [0, 0.34],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      64,
    );
    // Cable: drops out of the boot and curls forward across the floor.
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.6, 0),
      new THREE.Vector3(0, -0.85, 0.05),
      new THREE.Vector3(0.2, -1.0, 0.3),
      new THREE.Vector3(0.75, -1.02, 0.35),
      new THREE.Vector3(1.05, -1.02, -0.05),
      new THREE.Vector3(0.8, -1.02, -0.4),
      new THREE.Vector3(0.35, -1.02, -0.35),
    ]);
    const cable = new THREE.TubeGeometry(curve, 96, 0.06, 16, false);
    return { body, cable };
  }, []);

  // Idle: the status ring blinks twice ("connecting…") then locks on; the
  // plug gives a small push on each blink. Hover brightens, a click jolts it.
  useLoop((m) => {
    const b = Math.max(blink(m.t, 0.2, 0.05), blink(m.t, 0.4, 0.05));
    const locked = m.t / 4 > 0.55 ? 1 : 0;
    const press = pressBounce(m.pressAge);
    if (ring.current) ring.current.emissiveIntensity = 0.35 + b * 1.6 + locked * (0.9 + wave(m.t, 2) * 0.15) + m.hover * 0.6 + Math.abs(press) * 2;
    if (plug.current) {
      plug.current.position.y = b * 0.04 + press * 0.12;
      // Slow turn on the cable so the prongs catch the beams; one cycle per loop.
      plug.current.rotation.y = wave(m.t, 1) * (0.32 + m.hover * 0.12);
    }
  });

  return (
    <IconMotion seed={73}>
      <group rotation={[0.28, -0.35, 0]} position={[-0.25, 0.12, 0]} scale={1.42}>
        <mesh geometry={geo.cable}>
          <Shell finish={p.finish === 'chrome' ? 'glossy' : p.finish} />
        </mesh>
        <group ref={plug}>
          <mesh geometry={geo.body}>
            <Shell finish={p.finish} />
          </mesh>
          {/* glowing status ring */}
          <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.425, 0.035, 16, 72]} />
            <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1} roughness={0.25} />
          </mesh>
          {/* grip ribs */}
          {[-0.22, -0.32].map((y, i) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[i === 0 ? 0.375 : 0.31, 0.018, 12, 64]} />
              <Shell finish={p.finish} />
            </mesh>
          ))}
          {/* prongs */}
          {[-0.14, 0.14].map((x) => (
            <RoundedBox key={x} args={[0.14, 0.42, 0.05]} radius={0.02} smoothness={4} position={[x, 0.52, 0]}>
              <meshStandardMaterial color="#ECEEF2" metalness={0.75} roughness={0.32} />
            </RoundedBox>
          ))}
        </group>
      </group>
    </IconMotion>
  );
}
