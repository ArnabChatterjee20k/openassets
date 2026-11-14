import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, flicker, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'One-Click Launch',
  description:
    "Project card for Plotwell's one-click launch to 33 platforms: a glossy white rocket with a glowing porthole and a flickering exhaust, lit by beams seeded from the project name.",
  tags: ['card', 'launch', 'rocket', 'publish', 'project'],
};

export const schema = beamSchema({ name: 'One-Click Launch' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'go-live': { name: 'Go Live' },
  autopilot: { name: 'Autopilot' },
  highlighter: { lightMode: 'custom', light: '#FFDD00' },
  cyanotype: { lightMode: 'custom', light: '#7FB2FF', background: '#061634' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshPhysicalMaterial color="#E4E8EF" metalness={0.75} roughness={0.28} clearcoat={1} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F1F4" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F4F6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function OneClickLaunch(p: P) {
  const light = beamLight(p).color;
  const rocket = useRef<THREE.Group>(null);
  const port = useRef<THREE.MeshStandardMaterial>(null);
  const flame = useRef<THREE.Group>(null);
  const flameMat = useRef<THREE.MeshBasicMaterial>(null);

  // Ogive body: lathe profile from the nozzle (y = 0) up to the nose (y = 1.7).
  const bodyGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 40; i++) {
      const y = (i / 40) * 1.7;
      const u = y / 1.7;
      // full width low, rounded taper to a nose point
      const r = 0.36 * Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, u - 0.25) / 0.75, 2))) * (0.9 + 0.1 * Math.min(1, u * 6));
      pts.push(new THREE.Vector2(Math.max(0.001, r), y));
    }
    return new THREE.LatheGeometry(pts, 64);
  }, []);

  // Fin: a swept triangle with bevel.
  const finGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0.62);
    s.quadraticCurveTo(0.22, 0.38, 0.34, 0.02);
    s.lineTo(0.34, -0.08);
    s.lineTo(0, 0.08);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 4, curveSegments: 24 });
    g.translate(0.26, 0, -0.02);
    return g;
  }, []);

  // Idle: hovering thrust (bob + tiny shake), the flame flickers and the porthole
  // blinks. Hover lifts the rocket and grows the flame; click kicks a boost.
  useLoop((m) => {
    const b = pressBounce(m.pressAge);
    const boost = Number.isFinite(m.pressAge) ? Math.exp(-m.pressAge * 2.5) : 0;
    if (rocket.current) {
      rocket.current.position.y = wave(m.t, 2) * 0.04 + m.hover * 0.12 + boost * 0.25;
      rocket.current.rotation.y = wave(m.t, 1) * 0.5;
      rocket.current.rotation.z = -0.32 + wave(m.t, 8) * 0.006 + b * 0.04;
    }
    const f = 0.85 + 0.15 * wave(m.t, 16) + 0.1 * wave(m.t, 12, 0.3);
    if (flame.current) flame.current.scale.set(1, f * (1 + m.hover * 0.4 + boost * 1.2), 1);
    if (flameMat.current) flameMat.current.opacity = 0.75 + 0.2 * wave(m.t, 16);
    if (port.current) port.current.emissiveIntensity = 1.8 + flicker(m.t, 0.7) * 1.5 + m.hover * 0.8 + boost * 3;
  });

  return (
    <IconMotion seed={9} float={0.03}>
      <group position={[0.12, -0.72, 0]} rotation={[0.1, 0, 0]} scale={1.12}>
        <group ref={rocket} rotation={[0, 0, -0.32]}>
          <mesh geometry={bodyGeo}>
            <Shell finish={p.finish} />
          </mesh>
          {/* three fins */}
          {[0, 1, 2].map((i) => (
            <group key={i} rotation={[0, (i / 3) * Math.PI * 2 + 0.3, 0]}>
              <mesh geometry={finGeo}>
                <Shell finish={p.finish} />
              </mesh>
            </group>
          ))}
          {/* nozzle */}
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.22, 0.27, 0.14, 40]} />
            <meshPhysicalMaterial color="#C9CDD5" metalness={0.8} roughness={0.28} clearcoat={1} />
          </mesh>
          {/* porthole: bezel + glowing glass */}
          <mesh position={[0, 0.92, 0.315]} rotation={[-0.12, 0, 0]}>
            <torusGeometry args={[0.13, 0.03, 16, 40]} />
            <meshPhysicalMaterial color="#C9CDD5" metalness={0.8} roughness={0.25} clearcoat={1} />
          </mesh>
          <mesh position={[0, 0.92, 0.31]} rotation={[-0.12, 0, 0]} scale={[1, 1, 0.45]}>
            <sphereGeometry args={[0.12, 32, 16]} />
            <meshStandardMaterial ref={port} color={light} emissive={light} emissiveIntensity={2} roughness={0.15} />
          </mesh>
          {/* band ring */}
          <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.335, 0.018, 12, 64]} />
            <meshStandardMaterial color={light} emissive={light} emissiveIntensity={0.9} />
          </mesh>
          {/* exhaust flame (additive cone hanging below the nozzle) */}
          <group ref={flame} position={[0, -0.1, 0]}>
            {/* outer plume in the light colour */}
            <mesh position={[0, -0.32, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.23, 0.64, 32, 1, true]} />
              <meshBasicMaterial ref={flameMat} color={light} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            {/* hot core */}
            <mesh position={[0, -0.2, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.12, 0.4, 24, 1, true]} />
              <meshBasicMaterial color="#FFF6E0" transparent opacity={0.7} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
            </mesh>
            {/* soft glow ball at the nozzle */}
            <mesh position={[0, -0.06, 0]}>
              <sphereGeometry args={[0.28, 24, 16]} />
              <meshBasicMaterial color={light} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
          </group>
        </group>
      </group>
    </IconMotion>
  );
}
