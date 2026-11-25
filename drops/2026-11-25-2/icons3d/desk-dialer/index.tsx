import { useMemo, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { z } from 'zod';
import { color, select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'icon3d',
  name: 'Desk Dialer',
  description:
    'Ringside hero object: a chunky clay desk phone with four line keys. The keys light in a rolling L1→L4 dial sweep while line 3 stays connected; hover speeds the sweep, click makes the handset hop off its cradle.',
  tags: ['phone', 'dialer', 'sales', '3d', 'hero'],
};

export const schema = z.object({
  material: select(['clay', 'glossy', 'metal', 'glass']).default('clay'),
  bodyColor: color('Body').default('#C8553D'),
  handsetColor: color('Handset').default('#F1E4D3'),
  keyColor: color('Line keys').default('#E5CDB2'),
  lightColor: color('Dial light').default('#F2A541'),
  connectColor: color('Connected line').default('#4F6D58'),
  mood: select(['calm', 'rush'], 'Mood').default('rush'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  glossy: { material: 'glossy', bodyColor: '#4F6D58', handsetColor: '#F1E4D3', connectColor: '#C8553D' },
  metal: { material: 'metal', bodyColor: '#C9A27A', handsetColor: '#3B1F14', keyColor: '#E9DCC9' },
  glass: { material: 'glass', bodyColor: '#F2C9B8', handsetColor: '#C8553D', mood: 'calm' },
  midcentury: { bodyColor: '#2C7873', handsetColor: '#F4E9D8', keyColor: '#E6D3B3', lightColor: '#E9B44C', connectColor: '#D96C3D' },
  calm: { mood: 'calm', bodyColor: '#E5CDB2', handsetColor: '#C8553D' },
};

type P = z.infer<typeof schema>;

function Surface({ kind, c }: { kind: P['material']; c: string }) {
  switch (kind) {
    case 'glossy':
      return <meshPhysicalMaterial color={c} roughness={0.2} clearcoat={1} clearcoatRoughness={0.06} />;
    case 'metal':
      return <meshStandardMaterial color={c} roughness={0.3} metalness={1} />;
    case 'glass':
      return <meshPhysicalMaterial color={c} roughness={0.06} transmission={0.92} thickness={1.2} ior={1.4} attenuationColor={c} attenuationDistance={1.6} />;
    default:
      return <meshPhysicalMaterial color={c} roughness={0.68} sheen={0.4} sheenRoughness={0.5} sheenColor="#ffffff" />;
  }
}

/** Coiled cord: a helix swept along a gentle arc from the handset to the base. */
function useCord() {
  return useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const N = 260;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      // spine: from the mouthpiece end, down and around the right side of the base
      const sx = 1.02 + Math.sin(t * Math.PI) * 0.32;
      const sy = 0.02 - t * 0.5;
      const sz = 0.05 + t * 0.32;
      const a = t * Math.PI * 2 * 9;
      pts.push(new THREE.Vector3(sx + Math.cos(a) * 0.06, sy + Math.sin(a) * 0.06, sz + Math.sin(a) * 0.03));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 520, 0.022, 8, false);
  }, []);
}

export default function DeskDialer(p: P) {
  const cord = useCord();
  const handset = useRef<THREE.Group>(null);
  const keys = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  const rush = p.mood === 'rush';

  // Life loop: the four line keys light in a rolling dial sweep; line 3 holds steady (connected).
  // Hover speeds the sweep and brightens the ring LED; a click makes the handset hop.
  useLoop((m) => {
    const cycles = rush || m.hover > 0.5 ? 2 : 1;
    keys.current.forEach((mat, i) => {
      if (!mat) return;
      if (i === 2) {
        mat.emissiveIntensity = 0.9 + (wave(m.t, 2) * 0.5 + 0.5) * 0.5 + m.hover * 0.4;
        return;
      }
      // a travelling wave across L1→L4: always one key lit, moving on every frame
      const u = (m.t / 4) * cycles - i * 0.25;
      const k = Math.pow(Math.max(0, Math.cos(u * Math.PI * 2)), 6);
      mat.emissiveIntensity = 0.03 + k * 2.4;
    });
    if (led.current) {
      const ring = Math.max(blink(m.t, 0.2, 0.03), blink(m.t, 0.28, 0.03), blink(m.t, 0.7, 0.03) * (rush ? 1 : 0), blink(m.t, 0.78, 0.03) * (rush ? 1 : 0));
      led.current.emissiveIntensity = 0.15 + ring * 2.2 + m.hover * 0.8 + Math.abs(pressBounce(m.pressAge)) * 3;
    }
    if (handset.current) {
      // ring-rattle: a tiny shiver when the LED blinks, a real hop on click
      const ring = Math.max(blink(m.t, 0.2, 0.06), blink(m.t, 0.7, 0.06) * (rush ? 1 : 0));
      const hop = Math.abs(pressBounce(m.pressAge));
      handset.current.position.y = 0.36 + hop * 0.45 + ring * 0.02;
      handset.current.rotation.z = Math.sin(m.t * 60) * ring * 0.03 + hop * 0.25;
    }
  });

  const keyX = [-0.72, -0.36, 0, 0.36];

  return (
    <IconMotion seed={41}>
      <group position={[0, -0.25, 0]} rotation={[0.18, -0.42, 0]} scale={1.05}>
        {/* base: a soft wedge (a lower deck plus a raised rear deck for the cradle) */}
        <RoundedBox args={[2.3, 0.46, 1.5]} radius={0.18} smoothness={6} position={[0, -0.23, 0]}>
          <Surface kind={p.material} c={p.bodyColor} />
        </RoundedBox>
        <RoundedBox args={[2.1, 0.34, 0.78]} radius={0.15} smoothness={6} position={[0, 0.08, -0.3]}>
          <Surface kind={p.material} c={p.bodyColor} />
        </RoundedBox>

        {/* line keys on the front deck */}
        {keyX.map((x, i) => (
          <group key={i} position={[x + 0.18, 0.04, 0.42]}>
            <RoundedBox args={[0.28, 0.12, 0.3]} radius={0.05} smoothness={4}>
              <meshPhysicalMaterial color={p.keyColor} roughness={0.35} clearcoat={0.6} />
            </RoundedBox>
            {/* lamp in the key */}
            <mesh position={[0, 0.062, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.2, 0.2]} />
              <meshStandardMaterial
                ref={(el) => void (keys.current[i] = el)}
                color={i === 2 ? p.connectColor : '#4A2E22'}
                emissive={i === 2 ? p.connectColor : p.lightColor}
                emissiveIntensity={i === 2 ? 1.1 : 0.02}
                roughness={0.3}
              />
            </mesh>
          </group>
        ))}
        {/* hold / mute paddle */}
        <RoundedBox args={[0.24, 0.1, 0.3]} radius={0.045} smoothness={4} position={[-0.92, 0.03, 0.42]}>
          <Surface kind={p.material} c={p.handsetColor} />
        </RoundedBox>

        {/* ring LED, top-right corner of the rear deck */}
        <mesh position={[0.86, 0.27, -0.08]}>
          <sphereGeometry args={[0.07, 24, 24]} />
          <meshStandardMaterial ref={led} color={p.lightColor} emissive={p.lightColor} emissiveIntensity={0.15} roughness={0.25} />
        </mesh>

        {/* cradle prongs */}
        {[-0.72, 0.72].map((x) => (
          <RoundedBox key={x} args={[0.34, 0.18, 0.5]} radius={0.08} smoothness={4} position={[x, 0.28, -0.3]}>
            <Surface kind={p.material} c={p.bodyColor} />
          </RoundedBox>
        ))}

        {/* handset: grip + ear cup + mouth cup, resting on the prongs */}
        <group ref={handset} position={[0, 0.36, -0.3]}>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.1, 0]}>
            <capsuleGeometry args={[0.18, 1.3, 12, 32]} />
            <Surface kind={p.material} c={p.handsetColor} />
          </mesh>
          {[-0.78, 0.78].map((x) => (
            <group key={x} position={[x, 0.06, 0]}>
              <mesh>
                <cylinderGeometry args={[0.3, 0.24, 0.24, 40]} />
                <Surface kind={p.material} c={p.handsetColor} />
              </mesh>
              {/* the speaker grille face, a slightly darker disc underneath */}
              <mesh position={[0, -0.121, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.22, 32]} />
                <meshStandardMaterial color={p.keyColor} roughness={0.8} />
              </mesh>
            </group>
          ))}
        </group>

        {/* coiled cord from the handset down to the base */}
        <mesh geometry={cord} position={[0, 0.34, -0.3]}>
          <meshPhysicalMaterial color={p.handsetColor} roughness={0.45} clearcoat={0.4} />
        </mesh>
      </group>
    </IconMotion>
  );
}
