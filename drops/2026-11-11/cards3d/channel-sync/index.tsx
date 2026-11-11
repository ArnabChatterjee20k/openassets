import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, cycle, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Channel Sync',
  description: 'Project card for Mimo Channel Sync: a glossy white satellite dish beaming one campaign out to 36 ad platforms, its feed and signal rings glowing in the beam light.',
  tags: ['card', 'channels', 'sync', 'broadcast', 'project'],
};

export const schema = beamSchema({ name: 'Channel Sync' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'ctv-reach': { name: 'CTV Reach' },
  'retail-media': { name: 'Retail Media' },
  aqua: { lightMode: 'custom', light: '#3D5AFE' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#DCE0E8" metalness={1} roughness={0.22} side={THREE.DoubleSide} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F2F5" roughness={0.75} sheen={0.4} sheenColor="#ffffff" side={THREE.DoubleSide} />;
  return <meshPhysicalMaterial color="#F4F5F8" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} side={THREE.DoubleSide} />;
}

export default function ChannelSync(p: P) {
  const light = beamLight(p).color;
  // Shallow paraboloid dish with a thick rolled rim.
  const dish = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const r = (i / 24) * 0.78;
      pts.push(new THREE.Vector2(r, r * r * 0.55));
    }
    return new THREE.LatheGeometry(pts, 64);
  }, []);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const feed = useRef<THREE.MeshStandardMaterial>(null);
  const head = useRef<THREE.Group>(null);

  // Idle: signal rings travel out from the feed, the dish scans gently; hover = stronger
  // signal; click = the dish nods and the feed flares.
  useLoop((m) => {
    const pop = Math.abs(pressBounce(m.pressAge));
    rings.current.forEach((r, i) => {
      if (!r) return;
      const u = cycle(m.t, 2, i / 3);
      r.position.y = 0.55 + u * 0.75;
      r.scale.setScalar(0.4 + u * 1.1);
      (r.material as THREE.MeshStandardMaterial).opacity = Math.sin(Math.PI * u) * (0.75 + m.hover * 0.25);
    });
    if (feed.current) feed.current.emissiveIntensity = 1.4 + (wave(m.t, 2) * 0.5 + 0.5) * 0.8 + pop * 3;
    if (head.current) head.current.rotation.y = wave(m.t, 1) * 0.25;
  });

  return (
    <IconMotion seed={57} sway={0.04}>
      <group position={[0.1, -0.6, 0]} scale={1.12}>
        {/* base + post */}
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.42, 0.5, 0.14, 48]} />
          <Shell finish={p.finish} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.08, 0.11, 0.4, 24]} />
          <Shell finish={p.finish} />
        </mesh>
        <group ref={head} position={[0, 0.52, 0]}>
          <group rotation={[0.25, 0, -0.95]}>
            <mesh geometry={dish}>
              <Shell finish={p.finish} />
            </mesh>
            <mesh position={[0, 0.336, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.78, 0.05, 16, 64]} />
              <Shell finish={p.finish} />
            </mesh>
            {/* feed arm + glowing feed horn */}
            <mesh position={[0, 0.42, 0]}>
              <cylinderGeometry args={[0.025, 0.035, 0.85, 12]} />
              <Shell finish={p.finish} />
            </mesh>
            <mesh position={[0, 0.88, 0]}>
              <sphereGeometry args={[0.14, 32, 32]} />
              <meshStandardMaterial ref={feed} color={light} emissive={light} emissiveIntensity={1.8} roughness={0.3} />
            </mesh>
            {/* signal rings leaving the feed */}
            {[0, 1, 2].map((i) => (
              <mesh key={i} ref={(el) => void (rings.current[i] = el)} position={[0, 1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.24, 0.03, 12, 48]} />
                <meshStandardMaterial color={light} emissive={light} emissiveIntensity={2} transparent opacity={0.6} depthWrite={false} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
