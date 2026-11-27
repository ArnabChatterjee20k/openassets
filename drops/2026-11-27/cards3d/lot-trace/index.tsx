import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Fastener QA Card',
  description: "Project card for Loupe's Fastener QA with lot tracing: a glossy white hex nut with a glowing serial ring in its bore, so every part can be traced to its lot. It turns a sixth of a turn per loop and spins up when clicked.",
  tags: ['card', 'nut', 'traceability', 'lot', 'project'],
};

export const schema = beamSchema({ name: 'Fastener QA' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'lot-trace': { name: 'Lot Trace' },
  'supplier-portal': { name: 'Supplier Portal' },
  teal: { lightMode: 'custom', light: '#2EC4B6' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F0F5" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F3F8" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function LotTrace(p: P) {
  const light = beamLight(p).color;
  const nut = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const dashes = useRef<THREE.Group>(null);

  const geo = useMemo(() => {
    const s = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      const x = Math.cos(a) * 0.82, y = Math.sin(a) * 0.82;
      if (i === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.36, 0, Math.PI * 2, true);
    s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.42, bevelEnabled: true, bevelSize: 0.07, bevelThickness: 0.07, bevelSegments: 6, curveSegments: 48 });
    g.translate(0, 0, -0.21);
    return g;
  }, []);

  // Idle: the nut turns one flat (60°) per loop, so the loop is seamless; the
  // serial dashes orbit the bore. Hover brightens; a click spins it a full flat extra.
  useLoop((m) => {
    const hit = pressBounce(m.pressAge);
    if (nut.current) nut.current.rotation.z = -cycle(m.t, 1) * (Math.PI / 3) + hit * 0.5;
    // 12 identical dashes repeat every 30°, so wrapping by 30° per half-loop is seamless.
    if (dashes.current) dashes.current.rotation.z = cycle(m.t, 2) * (Math.PI / 6);
    if (ring.current) ring.current.emissiveIntensity = 1.4 + (wave(m.t, 2) * 0.5 + 0.5) * 0.8 + m.hover * 1 + Math.abs(hit) * 2;
  });

  return (
    <IconMotion seed={89}>
      <group rotation={[0.38, -0.42, 0]} position={[0, -0.05, 0]} scale={1.15}>
        <group ref={nut}>
          <mesh geometry={geo}>
            <Shell finish={p.finish} />
          </mesh>
          {/* thread grooves inside the bore */}
          {[-0.12, 0, 0.12].map((z) => (
            <mesh key={z} position={[0, 0, z]}>
              <torusGeometry args={[0.37, 0.018, 12, 64]} />
              <meshStandardMaterial color="#B9BCC8" metalness={0.6} roughness={0.35} />
            </mesh>
          ))}
          {/* the glowing serial ring at the bore mouth */}
          <mesh position={[0, 0, 0.29]}>
            <torusGeometry args={[0.43, 0.035, 20, 72]} />
            <meshStandardMaterial ref={ring} color={light} emissive={light} emissiveIntensity={1.6} roughness={0.3} />
          </mesh>
          {/* laser-etched serial dashes on the face */}
          <group ref={dashes} position={[0, 0, 0.292]}>
            {Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(a) * 0.58, Math.sin(a) * 0.58, 0]} rotation={[0, 0, a]}>
                  <planeGeometry args={[0.08, 0.024]} />
                  <meshBasicMaterial color={light} transparent opacity={0.75} />
                </mesh>
              );
            })}
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
