import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Face, Flicker, IsoBox, IsoGrid, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Night Shift Line',
  description:
    'Landing-page hero for Sprue: a cutaway night-shift workshop in a pine forest. Resin pellets rain into the hopper, the flywheel spins, heater bands glow, the CAD screen scans a gear, and once a loop the mold opens with a heat flash and pops a fresh lime part onto the conveyor into a shipping box.',
  tags: ['hero', 'isometric', 'manufacturing', 'injection molding', 'night', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Wall sign').default('SPRUE · LINE 3'),
  skyTop: color('Sky top').default('#07110C'),
  skyBottom: color('Sky bottom').default('#1C3326'),
  forest: color('Pines').default('#0B1A12'),
  wall: color('Walls').default('#2A4433'),
  floor: color('Floor').default('#3B5A45'),
  machine: color('Machine').default('#4E8A5B'),
  steel: color('Steel').default('#B9C4B5'),
  part: color('Fresh part').default('#B5E550'),
  heat: color('Heat').default('#FF9F43'),
  glow: color('Lamp light').default('#FFE2A8'),
  screen: color('Screen').default('#0F241A'),
  box: color('Shipping box').default('#C9A06A'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { skyTop: '#2B1B2E', skyBottom: '#FF8E5E', forest: '#2A1A26', wall: '#45293F', floor: '#5E3D50', glow: '#FFD27F' },
  daylight: { skyTop: '#8FC9E8', skyBottom: '#E9F5E1', forest: '#3E6B4A', wall: '#E8E2D2', floor: '#CFC6B0', machine: '#2C7873', steel: '#DADDE3', screen: '#17242E', glow: '#FFF4CC' },
  citrus: { skyTop: '#1C2B1A', skyBottom: '#2BB24C', wall: '#FFE9A8', floor: '#F2D48A', machine: '#FF7A00', part: '#2BB24C', heat: '#FF3D7F', box: '#E0B070' },
  cherry: { skyTop: '#14040A', skyBottom: '#3F1019', forest: '#1E070C', wall: '#3F1019', floor: '#5A1A24', machine: '#E3173E', part: '#F7B32B', heat: '#F5C6AA', screen: '#1A0508' },
};

type P = z.infer<typeof schema>;

const U = 50;
const OX = 516;
const OY = 300;
const LOOP = scene.loop;
const C30 = Math.cos(Math.PI / 6);
const INK = 'rgba(6,14,10,0.62)';
const ink = { stroke: INK, strokeWidth: 1.2 };
const H = 5.6; // wall height

/** Screen point inside the scene group (which is already translated by OX, OY). */
const S = (p: P3): [number, number] => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);

/** Painter-friendly translate for a world-space move (dx, dy, dz). */
const move = (dx: number, dy: number, dz: number) => {
  const [x, y] = iso([dx, dy, dz], U);
  return `${x.toFixed(1)} ${y.toFixed(1)}`;
};

/** Transform that maps (a, -z) on the back wall plane y = 0 to screen; text reads along the wall. */
const backWall = (a: number, z: number) => {
  const [x, y] = S([a, 0.02, z]);
  return `matrix(${(C30 * U).toFixed(2)} ${(0.5 * U).toFixed(2)} 0 ${U} ${x.toFixed(1)} ${y.toFixed(1)})`;
};
/** Same for the front face plane y = const of a box (faces the viewer, down-left). */
const frontFace = (yPlane: number, a: number, z: number) => {
  const [x, y] = S([a, yPlane, z]);
  return `matrix(${(C30 * U).toFixed(2)} ${(0.5 * U).toFixed(2)} 0 ${U} ${x.toFixed(1)} ${y.toFixed(1)})`;
};
/** Side wall plane x = 0. Content runs from the front end `b` toward the back corner (−y) so text reads left to right. */
const sideWall = (b: number, z: number) => {
  const [x, y] = S([0.02, b, z]);
  return `matrix(${(C30 * U).toFixed(2)} ${(-0.5 * U).toFixed(2)} 0 ${U} ${x.toFixed(1)} ${y.toFixed(1)})`;
};

function Shadow({ x, y, w, d, h }: { x: number; y: number; w: number; d: number; h: number }) {
  const l = h * 0.35;
  return <polygon points={poly([[x, y + d, 0.01], [x + w, y + d, 0.01], [x + w + l * 0.4, y + d + l, 0.01], [x + l * 0.4, y + d + l, 0.01]])} fill="#020805" opacity="0.4" filter="url(#ns-blur)" />;
}

/** A small molded gear in screen space. */
function Gear({ r, fill }: { r: number; fill: string }) {
  const out: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const s = (Math.PI * 2) / 8;
    for (const [da, rad] of [[-0.5, 0.78], [-0.22, 0.78], [-0.14, 1], [0.14, 1], [0.22, 0.78]] as const) {
      out.push(`${(Math.cos(a + da * s) * rad * r).toFixed(1)},${(Math.sin(a + da * s) * rad * r * 0.62).toFixed(1)}`);
    }
  }
  return (
    <g>
      <path d={`M${out.join(' L')} Z`} fill={shade(fill, -0.3)} transform="translate(0 3)" stroke={INK} strokeWidth="1" />
      <path d={`M${out.join(' L')} Z`} fill={fill} stroke={INK} strokeWidth="1.1" />
      <ellipse rx={r * 0.26} ry={r * 0.16} fill={shade(fill, -0.45)} />
      <ellipse cx={-r * 0.35} cy={-r * 0.25} rx={r * 0.22} ry={r * 0.08} fill="#ffffff" opacity="0.6" />
    </g>
  );
}

function Stars() {
  const out: ReactNode[] = [];
  for (let i = 0; i < 60; i++) {
    const dur = [2, 3, 6][i % 3];
    out.push(
      <circle key={i} cx={rand(i * 3.1) * 1200} cy={rand(i * 7.7) * 380} r={0.6 + rand(i * 1.3) * 1.4} fill="#F4FFE6">
        <animate attributeName="opacity" values="0.15;0.9;0.15" dur={`${dur}s`} begin={`-${(rand(i * 5.9) * dur).toFixed(2)}s`} repeatCount="indefinite" />
      </circle>,
    );
  }
  return <g>{out}</g>;
}

function Pines({ y, h, color: c, seed, step }: { y: number; h: number; color: string; seed: number; step: number }) {
  const out: ReactNode[] = [];
  for (let x = -30, i = 0; x < 1240; x += step, i++) {
    const hh = h * (0.6 + rand(i * 2.3 + seed) * 0.6);
    const w = hh * 0.36;
    out.push(<path key={i} d={`M${x} ${y} L${x + w / 2} ${y - hh} L${x + w} ${y} Z`} fill={c} />);
  }
  return (
    <g>
      {out}
      <rect x="0" y={y - 1} width="1200" height={900 - y} fill={c} />
    </g>
  );
}

export default function NightShiftLine(p: P) {
  const night = !/^#[89a-fA-F]/.test(p.skyTop);
  const dark = shade(p.machine, -0.35);

  // Clamp cycle (once per loop): closed and hot 0–2.4 s, opens 2.4–3.0 s, POP at 3.0 s, recloses 5.2–5.9 s.
  const clampKT = '0;0.4;0.5;0.86;0.98;1';
  const clampV = ['0 0', '0 0', move(0.8, 0, 0), move(0.8, 0, 0), '0 0', '0 0'].join(';');
  const popKT = '0;0.499;0.5;0.56;0.62;0.68;1';

  // Points used by animations
  const [fwX, fwY] = S([2.2, 3.72, 1.65]);
  const [hopX, hopY] = S([3.2, 3.1, 4.75]);
  const [gapX, gapY] = S([7.0, 3.2, 1.6]);
  const [cvA, cvB] = [S([7.0, 4.3, 0.95]), S([7.0, 6.9, 0.95])];
  const [boxX, boxY] = S([7.0, 7.4, 0.8]);
  const [lampX, lampY] = S([4.6, 4.2, 5.4]);
  const [andX, andY] = S([8.55, 2.9, 3.0]);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="ns-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id="ns-moon">
          <stop offset="0" stopColor="#FFF6DC" stopOpacity="0.5" />
          <stop offset="0.4" stopColor="#FFF6DC" stopOpacity="0.12" />
          <stop offset="1" stopColor="#FFF6DC" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ns-pool">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.5" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ns-heat">
          <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="0.3" stopColor={p.heat} stopOpacity="0.8" />
          <stop offset="1" stopColor={p.heat} stopOpacity="0" />
        </radialGradient>
        <clipPath id="ns-window">
          <polygon points={poly([[0.7, 0.02, 2.3], [2.7, 0.02, 2.3], [2.7, 0.02, 4.9], [0.7, 0.02, 4.9]])} />
        </clipPath>
        <filter id="ns-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="ns-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Sky and forest ── */}
      <rect width="1200" height="900" fill="url(#ns-sky)" />
      {night && <Stars />}
      <circle cx="1030" cy="130" r="150" fill="url(#ns-moon)" />
      <circle cx="1030" cy="130" r="46" fill={night ? '#FFF2D0' : '#FFFBEA'} />
      {/* owl-shaped cloud wisp drifting across the moon */}
      <g opacity="0.55">
        <animateTransform attributeName="transform" type="translate" values="-160 0;160 0" dur={`${LOOP}s`} repeatCount="indefinite" />
        <ellipse cx="1030" cy="160" rx="70" ry="10" fill={shade(p.skyBottom, 0.15)} />
      </g>
      <Pines y={430} h={170} color={shade(p.forest, 0.12)} seed={3} step={46} />
      <Pines y={520} h={150} color={p.forest} seed={9} step={38} />

      <g transform={`translate(${OX} ${OY})`}>
        {/* ── Floor slab ── */}
        <IsoBox x={0} y={0} z={-0.5} w={12} d={8} h={0.5} color={p.floor} u={U} ink={ink} />
        <IsoGrid x={0} y={0} w={12} d={8} u={U} color={shade(p.floor, -0.45)} opacity={0.35} />
        {/* safety lane */}
        <polygon points={poly([[1.1, 1.9, 0.01], [9.2, 1.9, 0.01], [9.2, 4.3, 0.01], [1.1, 4.3, 0.01]])} fill="none" stroke={p.heat} strokeWidth="2" strokeDasharray="10 8" opacity="0.55" />

        {/* ── Back walls ── */}
        <IsoBox x={-0.3} y={0} z={0} w={0.3} d={8} h={H} color={shade(p.wall, -0.08)} u={U} ink={ink} />
        <IsoBox x={0} y={-0.3} z={0} w={12} d={0.3} h={H} color={p.wall} u={U} ink={ink} />
        {/* skirting stripe: the 70s triple stripe running along the back wall */}
        {[p.part, p.machine, p.heat].map((c, i) => (
          <Face key={c} u={U} fill={c} ink={{ strokeWidth: 0 }} p={[[0.1, 0.02, 0.5 + i * 0.22], [11.9, 0.02, 0.5 + i * 0.22], [11.9, 0.02, 0.64 + i * 0.22], [0.1, 0.02, 0.64 + i * 0.22]]} />
        ))}

        {/* Window to the forest */}
        <Face u={U} fill={shade(p.wall, -0.55)} p={[[0.55, 0.01, 2.15], [2.85, 0.01, 2.15], [2.85, 0.01, 5.05], [0.55, 0.01, 5.05]]} ink={ink} />
        <g clipPath="url(#ns-window)">
          <rect x={-OX} y={-OY} width="1200" height="900" fill={shade(p.skyBottom, 0.12)} />
          <circle cx={S([2.1, 0, 4.4])[0]} cy={S([2.1, 0, 4.4])[1]} r="50" fill="url(#ns-moon)" />
          {night && (
            <g transform={`translate(${-OX} ${-OY})`}>
              <Stars />
            </g>
          )}
          <circle cx={S([2.1, 0, 4.4])[0]} cy={S([2.1, 0, 4.4])[1]} r="11" fill="#FFF2D0" />
          {[0.6, 1.1, 1.6, 2.2, 2.6].map((a, i) => {
            const [bx, by] = S([a, 0.02, 2.3]);
            const hh = (1.1 + rand(i * 4.1) * 1.1) * U;
            return <path key={a} d={`M${bx - 14} ${by + 10} L${bx} ${by - hh} L${bx + 14} ${by + 10} Z`} fill={p.forest} />;
          })}
        </g>
        <polyline points={poly([[1.7, 0.02, 2.3], [1.7, 0.02, 4.9]])} stroke={shade(p.wall, -0.55)} strokeWidth="3" fill="none" />
        <polyline points={poly([[0.7, 0.02, 3.6], [2.7, 0.02, 3.6]])} stroke={shade(p.wall, -0.55)} strokeWidth="3" fill="none" />

        {/* CAD screen with a gear wireframe and a scanline */}
        <Face u={U} fill={shade(p.screen, 0.25)} p={[[5.2, 0.01, 2.9], [8.8, 0.01, 2.9], [8.8, 0.01, 5.1], [5.2, 0.01, 5.1]]} ink={ink} />
        <Face u={U} fill={p.screen} p={[[5.35, 0.015, 3.05], [8.65, 0.015, 3.05], [8.65, 0.015, 4.95], [5.35, 0.015, 4.95]]} ink={{ strokeWidth: 0 }} />
        <g transform={backWall(5.35, 4.95)}>
          {/* coordinates: x along the wall, y down, in world units */}
          <g fill="none" stroke={p.part} strokeWidth="0.035" opacity="0.9" filter="url(#ns-glow)">
            <circle cx="1.05" cy="0.95" r="0.62" strokeDasharray="0.18 0.1">
              <animateTransform attributeName="transform" type="rotate" values="0 1.05 0.95;360 1.05 0.95" dur="6s" repeatCount="indefinite" />
            </circle>
            <circle cx="1.05" cy="0.95" r="0.22" />
          </g>
          {[0.35, 0.6, 0.85, 1.1].map((y, i) => (
            <rect key={y} x="2.0" y={y} width={[1.0, 0.7, 0.85, 0.5][i]} height="0.1" rx="0.05" fill={i === 3 ? p.heat : p.part} opacity={0.75} />
          ))}
          <rect x="2.0" y="1.45" width="0.9" height="0.26" rx="0.13" fill={p.part} />
          <rect x="0" y="0" width="3.3" height="0.08" fill={p.part} opacity="0.25">
            <animateTransform attributeName="transform" type="translate" values="0 0;0 1.82" dur="2s" repeatCount="indefinite" />
          </rect>
        </g>

        {/* Neon sign on the back wall */}
        <Face u={U} fill={shade(p.wall, -0.5)} p={[[9.2, 0.01, 4.1], [11.7, 0.01, 4.1], [11.7, 0.01, 4.95], [9.2, 0.01, 4.95]]} ink={ink} />
        <g transform={backWall(9.35, 4.68)}>
          <text x="0" y="0" fontFamily="Outfit, sans-serif" fontWeight="800" fontSize="0.42" letterSpacing="0.04" fill={p.part} filter="url(#ns-glow)">
            {p.sign}
            <Flicker dur={LOOP} seed={4} low={0.5} />
          </text>
        </g>

        {/* Right wall: wall lamp + sunrise poster + clock */}
        <g transform={sideWall(3.8, 4.6)}>
          <rect x="0" y="0" width="1.6" height="2.1" fill={shade(p.wall, 0.2)} stroke={INK} strokeWidth="0.03" />
          <g fill="none" strokeWidth="0.16">
            <path d="M0.2 1.6 A0.6 0.6 0 0 1 1.4 1.6" stroke={p.part} />
            <path d="M0.38 1.6 A0.42 0.42 0 0 1 1.22 1.6" stroke={p.machine} />
            <path d="M0.56 1.6 A0.24 0.24 0 0 1 1.04 1.6" stroke={p.heat} />
          </g>
          <text x="0.8" y="0.5" textAnchor="middle" fontFamily="Shrikhand, serif" fontSize="0.34" fill={shade(p.wall, -0.6)}>5 days</text>
        </g>
        <g transform={sideWall(6.2, 4.4)}>
          <circle cx="0.4" cy="0.4" r="0.4" fill={shade(p.wall, 0.3)} stroke={INK} strokeWidth="0.04" />
          <line x1="0.4" y1="0.4" x2="0.4" y2="0.15" stroke={INK} strokeWidth="0.05" strokeLinecap="round" />
          <line x1="0.4" y1="0.4" x2="0.6" y2="0.4" stroke={INK} strokeWidth="0.04" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" values="0 0.4 0.4;360 0.4 0.4" dur="6s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Lamp light pooling on the floor */}
        <ellipse cx={S([5, 5, 0])[0]} cy={S([5, 5, 0])[1]} rx={5 * U} ry={2.6 * U} fill="url(#ns-pool)">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
        </ellipse>

        {/* ── Resin feed pipe from the wall + falling pellets ── */}
        <IsoBox x={3.0} y={0} z={4.9} w={0.4} d={3.3} h={0.35} color={p.steel} u={U} ink={ink} />

        {/* ── Machine ── */}
        <Shadow x={1.4} y={2.2} w={7.6} d={1.8} h={3} />
        <IsoBox x={1.4} y={2.2} z={0} w={7.6} d={1.8} h={0.9} color={p.machine} u={U} ink={ink} />
        {[p.part, dark, p.heat].map((c, i) => (
          <Face key={i} u={U} fill={c} ink={{ strokeWidth: 0 }} p={[[1.6, 4.01, 0.2 + i * 0.17], [8.8, 4.01, 0.2 + i * 0.17], [8.8, 4.01, 0.3 + i * 0.17], [1.6, 4.01, 0.3 + i * 0.17]]} />
        ))}
        {/* motor + flywheel */}
        <IsoBox x={1.6} y={2.5} z={0.9} w={1.0} d={1.2} h={1.5} color={dark} u={U} ink={ink} />
        <g transform={`translate(${fwX} ${fwY})`}>
          <g transform={`matrix(${C30 * U} ${0.5 * U} 0 ${-U} 0 0)`}>
            <circle r="0.48" fill={shade(p.steel, -0.2)} stroke={INK} strokeWidth="0.03" />
            <g>
              <animateTransform attributeName="transform" type="rotate" values="0;-360" dur="1s" repeatCount="indefinite" />
              {[0, 60, 120].map((a) => (
                <rect key={a} x="-0.42" y="-0.05" width="0.84" height="0.1" fill={shade(p.steel, -0.45)} transform={`rotate(${a})`} />
              ))}
            </g>
            <circle r="0.1" fill={p.heat} />
          </g>
        </g>
        {/* barrel supports, barrel, heater bands */}
        <IsoBox x={3.1} y={2.9} z={0.9} w={0.3} d={0.4} h={1.1} color={shade(p.steel, -0.3)} u={U} ink={ink} />
        <IsoBox x={5.4} y={2.9} z={0.9} w={0.3} d={0.4} h={1.1} color={shade(p.steel, -0.3)} u={U} ink={ink} />
        <IsoBox x={2.6} y={2.8} z={2.0} w={3.6} d={0.6} h={0.6} color={p.steel} u={U} ink={ink} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <IsoBox x={3.6 + i * 0.8} y={2.74} z={1.95} w={0.34} d={0.72} h={0.72} color={p.heat} u={U} ink={ink} />
            <polygon points={poly([[3.6 + i * 0.8, 3.46, 1.95], [3.94 + i * 0.8, 3.46, 1.95], [3.94 + i * 0.8, 3.46, 2.67], [3.6 + i * 0.8, 3.46, 2.67]])} fill="#FFF1D6" opacity="0.5" filter="url(#ns-glow)">
              <animate attributeName="opacity" values="0.1;0.6;0.1" dur="2s" begin={`-${i * 0.6}s`} repeatCount="indefinite" />
            </polygon>
          </g>
        ))}
        {/* heat shimmer rising off the barrel */}
        {[0, 1, 2].map((i) => {
          const [sx, sy] = S([4.0 + i * 0.7, 3.1, 2.7]);
          return (
            <path key={i} d={`M${sx} ${sy} q6 -10 0 -20 q-6 -10 0 -20`} fill="none" stroke={p.heat} strokeWidth="2" strokeLinecap="round" opacity="0">
              <animateTransform attributeName="transform" type="translate" values="0 0;0 -26" dur="2s" begin={`-${i * 0.66}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.7;0" dur="2s" begin={`-${i * 0.66}s`} repeatCount="indefinite" />
            </path>
          );
        })}
        {/* gauge on the barrel */}
        {(() => {
          const [gx, gy] = S([2.9, 3.4, 2.95]);
          return (
            <g transform={`translate(${gx} ${gy})`}>
              <line x1="0" y1="10" x2="0" y2="20" stroke={INK} strokeWidth="3" />
              <circle r="11" fill="#F4F6EE" stroke={INK} strokeWidth="1.5" />
              <line x1="0" y1="0" x2="0" y2="-8" stroke={p.heat} strokeWidth="2" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" values="-50;40;-20;-50" dur="3s" repeatCount="indefinite" />
              </line>
            </g>
          );
        })()}
        {/* hopper funnel with a pellet heap */}
        <Face u={U} fill={shade(p.machine, 0.1)} p={[[2.6, 3.7, 4.2], [3.8, 3.7, 4.2], [3.4, 3.3, 2.6], [3.0, 3.3, 2.6]]} ink={ink} />
        <Face u={U} fill={shade(p.machine, -0.12)} p={[[3.8, 2.5, 4.2], [3.8, 3.7, 4.2], [3.4, 3.3, 2.6], [3.4, 2.9, 2.6]]} ink={ink} />
        <Face u={U} fill={shade(p.machine, -0.55)} p={[[2.6, 2.5, 4.2], [3.8, 2.5, 4.2], [3.8, 3.7, 4.2], [2.6, 3.7, 4.2]]} ink={ink} />
        <ellipse cx={S([3.2, 3.1, 4.15])[0]} cy={S([3.2, 3.1, 4.15])[1]} rx="22" ry="9" fill={p.part} stroke={INK} strokeWidth="1" />
        {/* pellets raining from the feed pipe */}
        {Array.from({ length: 7 }, (_, i) => (
          <circle key={i} cx={hopX + (rand(i * 2.1) - 0.5) * 10} cy={hopY} r="3.2" fill={p.part} stroke={INK} strokeWidth="0.8">
            <animateTransform attributeName="transform" type="translate" values="0 0;0 34" dur="1s" begin={`-${(i / 7).toFixed(2)}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.8;1" dur="1s" begin={`-${(i / 7).toFixed(2)}s`} repeatCount="indefinite" />
          </circle>
        ))}

        {/* ── Clamp unit ── */}
        <polyline points={poly([[6.4, 2.55, 3.0], [8.6, 2.55, 3.0]])} stroke={shade(p.steel, -0.2)} strokeWidth="5" strokeLinecap="round" />
        <IsoBox x={6.2} y={2.4} z={0.9} w={0.4} d={1.6} h={2.3} color={dark} u={U} ink={ink} />
        {/* the cavity face glows while the mold is hot */}
        <Face u={U} fill={p.heat} p={[[6.6, 2.7, 1.2], [6.6, 3.7, 1.2], [6.6, 3.7, 2.1], [6.6, 2.7, 2.1]]} ink={{ strokeWidth: 0 }} opacity="0.85" />
        {/* moving platen */}
        <g>
          <animateTransform attributeName="transform" type="translate" values={clampV} keyTimes={clampKT} dur={`${LOOP}s`} calcMode="spline" keySplines="0 0 1 1;0.3 0 0.2 1;0 0 1 1;0.5 0 0.5 1;0 0 1 1" repeatCount="indefinite" />
          <IsoBox x={6.6} y={2.4} z={0.9} w={0.4} d={1.6} h={2.3} color={p.machine} u={U} ink={ink} />
        </g>
        <IsoBox x={8.2} y={2.6} z={0.9} w={0.7} d={1.2} h={2.0} color={dark} u={U} ink={ink} />
        <polyline points={poly([[6.4, 3.85, 3.0], [8.6, 3.85, 3.0]])} stroke={p.steel} strokeWidth="5" strokeLinecap="round" />
        <polyline points={poly([[6.4, 3.85, 1.1], [8.6, 3.85, 1.1]])} stroke={p.steel} strokeWidth="5" strokeLinecap="round" />
        {/* andon light stack */}
        <g>
          <line x1={andX} y1={andY} x2={andX} y2={andY - 14} stroke={INK} strokeWidth="3" />
          <rect x={andX - 6} y={andY - 46} width="12" height="14" rx="3" fill={p.heat} stroke={INK}>
            <animate attributeName="opacity" values="1;0.25;1" dur="1.5s" repeatCount="indefinite" />
          </rect>
          <rect x={andX - 6} y={andY - 32} width="12" height="14" rx="3" fill={p.part} stroke={INK} filter="url(#ns-glow)" />
        </g>

        {/* ── Conveyor to the box ── */}
        <Shadow x={6.5} y={4.0} w={1.0} d={3.0} h={1.4} />
        {[4.5, 6.6].map((y) => (
          <IsoBox key={y} x={6.65} y={y} z={0} w={0.2} d={0.2} h={0.7} color={shade(p.steel, -0.4)} u={U} ink={ink} />
        ))}
        <IsoBox x={6.5} y={4.0} z={0.7} w={1.0} d={3.0} h={0.18} color={shade(p.steel, -0.25)} u={U} ink={ink} />
        <polyline points={poly([[6.6, 4.05, 0.89], [6.6, 6.95, 0.89]])} stroke={shade(p.steel, -0.6)} strokeWidth="3" strokeDasharray="6 6" fill="none">
          <animate attributeName="stroke-dashoffset" values="0;-12" dur="0.5s" repeatCount="indefinite" />
        </polyline>
        {/* parts riding the belt */}
        {[0, 1].map((i) => (
          <g key={i}>
            <animateMotion dur="3s" begin={`-${i * 1.5}s`} repeatCount="indefinite" path={`M${cvA[0]},${cvA[1]} L${cvB[0]},${cvB[1]} L${boxX},${boxY}`} keyPoints="0;0.85;1" keyTimes="0;0.85;1" calcMode="linear" />
            <Gear r={14} fill={p.part} />
          </g>
        ))}

        {/* ── The moment: heat flash as the mold opens, and the fresh part pops out toward us and lands on the belt ── */}
        <circle cx={gapX} cy={gapY} r="150" fill="url(#ns-heat)" opacity="0" style={{ mixBlendMode: 'screen' }}>
          <animate attributeName="opacity" values="0;0;1;0.3;0;0" keyTimes="0;0.495;0.505;0.53;0.6;1" dur={`${LOOP}s`} repeatCount="indefinite" />
        </circle>
        <g opacity="0">
          <animate attributeName="opacity" values="0;0;1;1;1;0;0" keyTimes={popKT} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animateTransform
            attributeName="transform"
            type="translate"
            values={[`${gapX} ${gapY}`, `${gapX} ${gapY}`, `${gapX} ${gapY}`, `${gapX + 14} ${gapY - 110}`, `${(gapX + cvA[0]) / 2 + 10} ${cvA[1] - 70}`, `${cvA[0]} ${cvA[1]}`, `${cvA[0]} ${cvA[1]}`].join(';')}
            keyTimes={popKT}
            dur={`${LOOP}s`}
            repeatCount="indefinite"
          />
          <Gear r={20} fill={p.part} />
        </g>

        {/* ── Shipping box ── */}
        <IsoBox x={6.3} y={7.0} z={0} w={1.4} d={0.9} h={0.8} color={p.box} u={U} ink={ink} />
        <Face u={U} fill={shade(p.box, -0.4)} p={[[6.4, 7.1, 0.8], [7.6, 7.1, 0.8], [7.6, 7.8, 0.8], [6.4, 7.8, 0.8]]} ink={ink} />
        <ellipse cx={S([7.0, 7.45, 0.8])[0]} cy={S([7.0, 7.45, 0.8])[1]} rx="22" ry="8" fill={p.part} opacity="0.9" />
        <Face u={U} fill={shade(p.box, 0.15)} p={[[6.3, 7.0, 0.8], [7.7, 7.0, 0.8], [7.9, 6.7, 1.15], [6.5, 6.7, 1.15]]} ink={ink} />
        <g transform={frontFace(7.91, 6.55, 0.58)}>
          <rect x="0" y="0" width="0.9" height="0.34" fill="#F4F1E6" stroke={INK} strokeWidth="0.02" />
          <text x="0.08" y="0.24" fontFamily="Outfit, sans-serif" fontWeight="800" fontSize="0.2" fill={shade(p.box, -0.7)}>SHIP 12/3</text>
        </g>

        {/* ── Resin bags on a pallet ── */}
        <Shadow x={1.0} y={5.0} w={1.8} d={1.4} h={1.4} />
        <IsoBox x={1.0} y={5.0} z={0} w={1.8} d={1.4} h={0.18} color="#8A6A45" u={U} ink={ink} />
        {[[1.05, 5.05, 0.18], [1.95, 5.05, 0.18], [1.05, 5.75, 0.18], [1.95, 5.75, 0.18], [1.5, 5.4, 0.58]].map(([x, y, z], i) => (
          <IsoBox key={i} x={x} y={y} z={z} w={0.82} d={0.62} h={0.4} color={i === 4 ? p.part : shade(p.steel, 0.15)} u={U} ink={ink} />
        ))}

        {/* ── Potted fern ── */}
        {(() => {
          const [fx, fy] = S([0.9, 7.2, 0.6]);
          return (
            <g>
              <IsoBox x={0.6} y={6.9} z={0} w={0.6} d={0.6} h={0.6} color={p.heat} u={U} ink={ink} />
              {[-50, -25, 0, 25, 50].map((a, i) => (
                <path key={a} d={`M${fx} ${fy} q${a * 0.5} -30 ${a} -${44 - Math.abs(a) * 0.25}`} fill="none" stroke={shade(p.machine, 0.2)} strokeWidth="5" strokeLinecap="round">
                  <animateTransform attributeName="transform" type="rotate" values={`0 ${fx} ${fy};${i % 2 ? 2 : -2} ${fx} ${fy};0 ${fx} ${fy}`} dur="3s" repeatCount="indefinite" />
                </path>
              ))}
            </g>
          );
        })()}

        {/* ── Pendant lamp ── */}
        <line x1={lampX} y1={-OY} x2={lampX} y2={lampY - 12} stroke={INK} strokeWidth="2" />
        <circle cx={lampX} cy={lampY} r="26" fill={p.glow} opacity="0.35" filter="url(#ns-blur)">
          <animate attributeName="opacity" values="0.3;0.45;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
        <path d={`M${lampX - 18} ${lampY} L${lampX - 8} ${lampY - 14} L${lampX + 8} ${lampY - 14} L${lampX + 18} ${lampY} Z`} fill={p.machine} stroke={INK} strokeWidth="1.2" />
        <ellipse cx={lampX} cy={lampY} rx="10" ry="4" fill={p.glow} />
      </g>
    </svg>
  );
}
