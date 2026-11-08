import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Deep Dive Reports',
  description:
    'Project card for Lanternfish Deep Dive Reports: a glossy white mini submarine with glowing portholes and a spinning propeller, lit by beams seeded from the project name. Portholes scan on a loop; hover spins the prop up; a click pings.',
  tags: ['card', 'reports', 'analytics', 'submarine', 'project', 'deep sea'],
};

export const schema = beamSchema({ name: 'Deep Dive Reports' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'morning-brief': { name: 'Morning Brief' },
  attribution: { name: 'Attribution' },
  photophore: { lightMode: 'custom', light: '#2EF2C4', background: '#021B26' },
  sonar: { lightMode: 'custom', light: '#1B7FA6', finish: 'matte' },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish, color = '#F4F4F6' }: { finish: P['finish']; color?: string }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color={color} roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function DeepDiveReports(p: P) {
  const light = beamLight(p).color;
  const prop = useRef<THREE.Group>(null);
  const ports = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const periscope = useRef<THREE.Group>(null);

  // Hull: a lathed teardrop (blunt nose at +x, tapering stern at -x).
  const hull = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const r = i === 0 || i === N ? 0 : 0.4 * Math.pow(Math.sin(Math.PI * Math.pow(t, 1.25)), 0.6);
      pts.push(new THREE.Vector2(r, -0.85 + t * 1.75));
    }
    const g = new THREE.LatheGeometry(pts, 64);
    g.rotateZ(-Math.PI / 2);
    g.computeVertexNormals();
    return g;
  }, []);

  // Idle: portholes scan nose-to-stern, the prop turns, the periscope looks
  // around. Hover spins the prop faster; a click pings every porthole.
  useLoop((m) => {
    const press = Math.abs(pressBounce(m.pressAge));
    if (prop.current) prop.current.rotation.x = (m.t / 4) * Math.PI * 2 * (3 + (m.hover > 0.5 ? 3 : 0));
    if (periscope.current) periscope.current.rotation.y = wave(m.t, 1) * 0.9;
    ports.current.forEach((mat, i) => {
      if (!mat) return;
      const scan = blink(m.t, 0.15 + i * 0.12, 0.08);
      mat.emissiveIntensity = 1.6 + scan * 2 + m.hover * 0.6 + press * 2.5;
    });
  });

  return (
    <IconMotion seed={88}>
      <group rotation={[0.1, -0.35, 0.04]} position={[0.08, -0.2, 0]} scale={1.5}>
        <mesh geometry={hull}>
          <Shell finish={p.finish} />
        </mesh>
        {/* conning tower */}
        <RoundedBox args={[0.5, 0.36, 0.2]} radius={0.09} smoothness={6} position={[0.12, 0.42, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* periscope */}
        <group ref={periscope} position={[0.18, 0.62, 0]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.26, 16]} />
            <Shell finish={p.finish} color="#D5D7DD" />
          </mesh>
          <mesh position={[0.06, 0.25, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.035, 0.035, 0.14, 16]} />
            <Shell finish={p.finish} color="#D5D7DD" />
          </mesh>
        </group>
        {/* glowing portholes along the near side */}
        {[0.42, 0.12, -0.18].map((x, i) => {
          const r = 0.4 * Math.pow(Math.sin(Math.PI * Math.pow((x + 0.85) / 1.75, 1.25)), 0.6);
          return (
            <group key={x} position={[x, 0.02, r + 0.035]}>
              <mesh>
                <torusGeometry args={[0.105, 0.024, 12, 32]} />
                <Shell finish={p.finish} color="#C9CCD3" />
              </mesh>
              <mesh position={[0, 0, 0.005]}>
                <circleGeometry args={[0.095, 32]} />
                <meshStandardMaterial ref={(el) => void (ports.current[i] = el)} color={light} emissive={light} emissiveIntensity={1.4} toneMapped={false} />
              </mesh>
            </group>
          );
        })}
        {/* stern fins */}
        <mesh position={[-0.7, 0, 0]}>
          <boxGeometry args={[0.22, 0.56, 0.04]} />
          <Shell finish={p.finish} color="#E3E4E9" />
        </mesh>
        <mesh position={[-0.7, 0, 0]}>
          <boxGeometry args={[0.22, 0.04, 0.56]} />
          <Shell finish={p.finish} color="#E3E4E9" />
        </mesh>
        {/* propeller */}
        <group ref={prop} position={[-0.93, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.04, 0.1, 16]} />
            <Shell finish={p.finish} color="#C9CCD3" />
          </mesh>
          {[0, 1, 2].map((i) => (
            <group key={i} rotation={[(i / 3) * Math.PI * 2, 0, 0]}>
              <mesh position={[0, 0.13, 0]} rotation={[0, 0.5, 0]} scale={[0.35, 1, 1]}>
                <sphereGeometry args={[0.13, 20, 12]} />
                <Shell finish={p.finish} color="#E3E4E9" />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </IconMotion>
  );
}
