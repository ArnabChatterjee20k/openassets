import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Parallel Dialer',
  description: 'Project card for Ringside Parallel Dialer: a glossy white phone handset wrapped by four glowing ring bands that pulse in turn, lit by beams seeded from the name.',
  tags: ['card', 'dialer', 'phone', 'calls', 'project'],
};

export const schema = beamSchema({ name: 'Parallel Dialer' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'power-dialer': { name: 'Power Dialer' },
  'sales-floor': { name: 'Sales Floor' },
  terracotta: { lightMode: 'custom', light: '#E8684A' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EEEA" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F2EF" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

export default function ParallelDialer(p: P) {
  const light = beamLight(p).color;
  const rings = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const body = useRef<THREE.Group>(null);

  // The classic handset arch, and four ring bands placed along it facing the tangent.
  const { grip, bands } = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.86, 0, 0), new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(0.86, 0, 0));
    const g = new THREE.TubeGeometry(curve, 64, 0.2, 32, false);
    const b = [0.32, 0.44, 0.56, 0.68].map((t) => {
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), curve.getTangent(t).normalize());
      return { pos: curve.getPoint(t), q };
    });
    return { grip: g, bands: b };
  }, []);

  // Four ring bands pulse in a rolling sweep (four lines dialing); hover speeds it, click rattles the handset.
  useLoop((m) => {
    rings.current.forEach((mat, i) => {
      if (!mat) return;
      const u = (m.t / 4) * 2 - i * 0.25;
      const k = Math.pow(Math.max(0, Math.cos(u * Math.PI * 2)), 4);
      mat.emissiveIntensity = 0.5 + k * 2.2 + m.hover * 0.8;
    });
    if (body.current) body.current.rotation.z = 0.12 +wave(m.t, 4) * 0.015 + pressBounce(m.pressAge) * 0.35;
  });

  return (
    <IconMotion seed={23}>
      <group ref={body} position={[0, -0.1, 0]} rotation={[0.15, -0.35, 0.12]} scale={1.15}>
        {/* arched grip */}
        <mesh geometry={grip}>
          <Shell finish={p.finish} />
        </mesh>
        {[-0.86, 0.86].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <sphereGeometry args={[0.2, 32, 24]} />
            <Shell finish={p.finish} />
          </mesh>
        ))}
        {/* ear and mouth cups, splayed outward and pointing down */}
        {[-0.92, 0.92].map((x) => (
          <group key={x} position={[x, -0.2, 0]} rotation={[0, 0, x > 0 ? 0.35 : -0.35]}>
            <mesh>
              <cylinderGeometry args={[0.38, 0.28, 0.34, 48]} />
              <Shell finish={p.finish} />
            </mesh>
            <mesh position={[0, -0.172, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.3, 40]} />
              <meshStandardMaterial color="#B9B6B1" roughness={0.8} />
            </mesh>
          </group>
        ))}
        {/* four glowing ring bands = four lines dialing at once, following the arch */}
        {bands.map((b, i) => (
          <mesh key={i} position={b.pos} quaternion={b.q}>
            <torusGeometry args={[0.205, 0.03, 16, 48]} />
            <meshStandardMaterial ref={(el) => void (rings.current[i] = el)} color={light} emissive={light} emissiveIntensity={1} roughness={0.3} />
          </mesh>
        ))}
      </group>
    </IconMotion>
  );
}
