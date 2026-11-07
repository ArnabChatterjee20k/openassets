import { useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { z } from 'zod';
import { select } from '@/lib/params';
import type { AssetMeta } from '@/lib/types';
import { IconMotion, beamLight, beamSchema, blink, pressBounce, useLoop, wave } from '@/kit';

export const meta: AssetMeta = {
  kind: 'card3d',
  name: 'Morning Ledger',
  description: 'Project card for Mandate Morning Ledger: a glossy white hardback ledger with a glowing bookmark ribbon draped over its pages; the cover peeks open as the books close each morning.',
  tags: ['card', 'ledger', 'report', 'book', 'project'],
};

export const schema = beamSchema({ name: 'Morning Ledger' }).extend({
  finish: select(['glossy', 'matte', 'chrome'], 'Finish').default('glossy'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'month-end-close': { name: 'Month-End Close' },
  'board-report': { name: 'Board Report' },
  gold: { lightMode: 'custom', light: '#C9A45C' },
  chrome: { finish: 'chrome' },
  matte: { finish: 'matte', glow: 0.55 },
};

type P = z.infer<typeof schema>;

function Shell({ finish }: { finish: P['finish'] }) {
  if (finish === 'chrome') return <meshStandardMaterial color="#D8DCE3" metalness={1} roughness={0.22} />;
  if (finish === 'matte') return <meshPhysicalMaterial color="#F1EFEA" roughness={0.75} sheen={0.4} sheenColor="#ffffff" />;
  return <meshPhysicalMaterial color="#F4F3F0" roughness={0.18} clearcoat={1} clearcoatRoughness={0.08} />;
}

// Hardback: width (x), height (y), thickness (z), board thickness.
const B = { w: 1.12, h: 1.5, t: 0.52, c: 0.06 };
// Page block faces.
const PAGE = { x0: -B.w / 2 + 0.07, x1: B.w / 2 - 0.035, y1: B.h / 2 - 0.035, d: B.t - B.c * 2 - 0.01 };
const RIB = { w: 0.14, hang: 0.78 };

export default function MorningLedger(p: P) {
  const light = beamLight(p).color;
  const cover = useRef<THREE.Group>(null);
  const hang = useRef<THREE.Group>(null);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  // Idle: the cover peeks open once per loop and the ribbon breathes and sways;
  // hover holds the cover ajar; a click flips it wider and flashes the ribbon.
  useLoop((m) => {
    const press = Math.abs(pressBounce(m.pressAge));
    const peek = blink(m.t, 0.55, 0.14);
    if (cover.current) cover.current.rotation.y = -(peek * 0.32 + m.hover * 0.45 + press * 0.5);
    const k = 1.3 + (wave(m.t, 2) * 0.5 + 0.5) * 0.6 + peek * 1.4 + press * 3 + m.hover * 0.6;
    mats.current.forEach((mat) => mat && (mat.emissiveIntensity = k));
    if (hang.current) hang.current.rotation.z = -(wave(m.t, 2, 0.1) * 0.5 + 0.5) * 0.05 - peek * 0.08 - press * 0.2;
  });

  const ribbonMat = (i: number) => (
    <meshStandardMaterial ref={(mat) => void (mats.current[i] = mat)} color={light} emissive={light} emissiveIntensity={1.5} roughness={0.3} toneMapped={false} side={THREE.DoubleSide} />
  );

  const front = B.t / 2;
  const pageCx = (PAGE.x0 + PAGE.x1) / 2;
  const ribX = PAGE.x1 - 0.32;
  return (
    <IconMotion seed={57} float={0.05}>
      <group position={[-0.05, -0.12, 0]} rotation={[0.16, -0.62, 0.05]} scale={1.18}>
        {/* back board */}
        <RoundedBox args={[B.w, B.h, B.c]} radius={0.025} smoothness={4} position={[0, 0, -front + B.c / 2]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* spine */}
        <RoundedBox args={[0.14, B.h, B.t]} radius={0.065} smoothness={6} position={[-B.w / 2 + 0.04, 0, 0]}>
          <Shell finish={p.finish} />
        </RoundedBox>
        {/* page block, with ruled fore-edge and top-edge lines */}
        <mesh position={[pageCx, -0.005, 0]}>
          <boxGeometry args={[PAGE.x1 - PAGE.x0, B.h - 0.07, PAGE.d]} />
          <meshStandardMaterial color="#EFE8D8" roughness={0.85} />
        </mesh>
        {Array.from({ length: 7 }, (_, i) => {
          const z = -PAGE.d / 2 + ((i + 1) * PAGE.d) / 8;
          return (
            <group key={i}>
              <mesh position={[PAGE.x1 + 0.001, -0.005, z]}>
                <boxGeometry args={[0.002, B.h - 0.09, 0.004]} />
                <meshStandardMaterial color="#D2C8B2" roughness={0.9} />
              </mesh>
              <mesh position={[pageCx, PAGE.y1 + 0.001, z]}>
                <boxGeometry args={[PAGE.x1 - PAGE.x0 - 0.02, 0.002, 0.004]} />
                <meshStandardMaterial color="#D2C8B2" roughness={0.9} />
              </mesh>
            </group>
          );
        })}
        {/* front board, hinged on the spine */}
        <group position={[-B.w / 2, 0, front - B.c / 2]}>
          <group ref={cover}>
            <RoundedBox args={[B.w, B.h, B.c]} radius={0.025} smoothness={4} position={[B.w / 2, 0, 0]}>
              <Shell finish={p.finish} />
            </RoundedBox>
            {/* raised label plate and two rules: a ledger's cover */}
            <RoundedBox args={[B.w * 0.56, B.h * 0.22, 0.025]} radius={0.012} smoothness={3} position={[B.w * 0.56, B.h * 0.2, B.c / 2]}>
              <Shell finish={p.finish} />
            </RoundedBox>
            {[-0.38, -0.44].map((y) => (
              <mesh key={y} position={[B.w * 0.56, B.h * y, B.c / 2 + 0.004]}>
                <boxGeometry args={[B.w * 0.56, 0.012, 0.01]} />
                <meshPhysicalMaterial color="#CFCAC0" roughness={0.4} />
              </mesh>
            ))}
          </group>
        </group>
        {/* the glowing ribbon: out of the top of the pages, over the edge, down the fore-edge */}
        <mesh position={[(ribX + PAGE.x1) / 2, PAGE.y1 + 0.008, 0]}>
          <boxGeometry args={[PAGE.x1 - ribX, 0.012, RIB.w]} />
          {ribbonMat(0)}
        </mesh>
        <group ref={hang} position={[PAGE.x1 + 0.012, PAGE.y1, 0]}>
          <mesh position={[0, -RIB.hang / 2, 0]}>
            <boxGeometry args={[0.012, RIB.hang, RIB.w]} />
            {ribbonMat(1)}
          </mesh>
          {/* swallowtail: two angled tips */}
          {[-1, 1].map((s, i) => (
            <mesh key={s} position={[0, -RIB.hang - 0.035, (s * RIB.w) / 4]} rotation={[s * 0.5, 0, 0]}>
              <boxGeometry args={[0.012, 0.09, RIB.w / 2]} />
              {ribbonMat(2 + i)}
            </mesh>
          ))}
        </group>
      </group>
    </IconMotion>
  );
}
