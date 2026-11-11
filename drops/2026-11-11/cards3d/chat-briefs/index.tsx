import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Chat Briefs',
  description: 'Project card for Mimo Chat Briefs: a glossy white speech bubble whose typing dots glow in the beam light, as if Mimo is drafting your campaign.',
  tags: ['card', 'chat', 'prompt', 'ai agent', 'project'],
};

export const schema = beamSchema({ name: 'Chat Briefs' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'brief-builder': { name: 'Brief Builder' },
  'ask-mimo': { name: 'Ask Mimo' },
  aqua: { lightMode: 'custom', light: '#3D5AFE' },
  bubblegum: { lightMode: 'custom', light: '#FF3DB4', finish: 'matte' },
  chrome: { finish: 'chrome' },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#DCE0E8" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1F2F5" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F5F8" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

/** Rounded-rectangle bubble with a tail at the lower left. */
function bubbleShape() {
  const w = 1.7;
  const h = 1.05;
  const r = 0.42;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const s = new THREE.Shape();
  s.moveTo(x0 + r, y0);
  s.lineTo(x0 + w - r, y0);
  s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  s.lineTo(x0 + w, y0 + h - r);
  s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  s.lineTo(x0 + r, y0 + h);
  s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  s.lineTo(x0, y0 + r * 0.6);
  // tail
  s.quadraticCurveTo(x0 - 0.05, y0 - 0.28, x0 - 0.22, y0 - 0.38);
  s.quadraticCurveTo(x0 + 0.18, y0 - 0.32, x0 + r, y0);
  return s;
}

export default function ChatBriefs(p: P) {
  const light = beamLight(p).color;
  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(bubbleShape(), { depth: 0.32, bevelEnabled: true, bevelSize: 0.1, bevelThickness: 0.12, bevelSegments: 8, curveSegments: 32 });
    g.translate(0, 0, -0.16);
    return g;
  }, []);
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  const body = useRef<THREE.Group>(null);

  // Idle: typing dots rise and glow in sequence; hover types faster; click sends (the bubble hops).
  useLoop((m) => {
    const speed = m.hover > 0.5 ? 4 : 2;
    dots.current.forEach((d, i) => {
      if (!d) return;
      const k = Math.max(0, wave(m.t, speed, -i * 0.14));
      d.position.y = k * 0.09;
      (d.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.9 + k * 1.6 + m.hover * 0.4;
    });
    if (body.current) body.current.position.y = Math.max(0, pressBounce(m.pressAge)) * 0.25;
  });

  return (
    <IconMotion seed={23}>
      <group ref={body}>
        <group rotation={[0.12, -0.42, 0.04]} position={[0.05, -0.1, 0]} scale={1.12}>
          <mesh geometry={geo} castShadow>
            <Shell finish={p.finish} />
          </mesh>
          {[-0.42, 0, 0.42].map((x, i) => (
            <mesh key={i} ref={(el) => void (dots.current[i] = el)} position={[x, 0, 0.3]}>
              <sphereGeometry args={[0.13, 32, 32]} />
              <meshStandardMaterial color={light} emissive={light} emissiveIntensity={1.4} roughness={0.3} />
            </mesh>
          ))}
        </group>
      </group>
    </IconMotion>
  );
}
