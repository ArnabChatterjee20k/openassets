import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Multiball Table',
  description:
    'Landing-page hero for Multiball: an isometric Memphis pinball table in an arcade, where the bumpers are ad platforms and the balls are budget. Balls ricochet on loops, bumpers and flippers flash, lane lights chase, and once per loop the backglass flashes MULTIBALL as a third ball pops out with confetti.',
  tags: ['hero', 'isometric', 'pinball', 'arcade', 'memphis', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Backglass title').default('MULTIBALL'),
  score: text('Score display').default('ROAS 4.8x'),
  neon: text('Wall neon').default('INSERT COIN'),
  wall: color('Wall').default('#FFF6E9'),
  floor: color('Floor').default('#FFE3D3'),
  cabinet: color('Cabinet').default('#FF6F91'),
  playfield: color('Playfield').default('#FFF1E4'),
  accent2: color('Second color').default('#00B3A4'),
  pop: color('Pop').default('#FFC93C'),
  ink: color('Ink').default('#1A1A2E'),
  glow: color('Neon').default('#FF6F91'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'after-hours': { wall: '#1E0B33', floor: '#2C1450', cabinet: '#FF2E88', playfield: '#3A1C5E', accent2: '#B026FF', pop: '#FFD600', ink: '#0B0414', glow: '#FF2E88' },
  riso: { wall: '#F4EFE6', floor: '#EAE2D3', cabinet: '#0078BF', playfield: '#FBF7EF', accent2: '#FF48B0', pop: '#FFE800', ink: '#1F2A6B', glow: '#FF48B0' },
  citrus: { wall: '#FFF8E1', floor: '#FFE9A8', cabinet: '#FF7A00', playfield: '#FFFBEF', accent2: '#2BB24C', pop: '#FF3D7F', ink: '#1C2B1A', glow: '#2BB24C', neon: 'FREE PLAY' },
  mint: { wall: '#E9F6F2', floor: '#CDEDE4', cabinet: '#00B3A4', playfield: '#F6FFFC', accent2: '#FF6F91', pop: '#FFC93C', glow: '#00B3A4', neon: 'HIGH SCORE' },
};

type P = z.infer<typeof schema>;

const U = 48;
const LOOP = scene.loop;
const OX = 725;
const OY = 430;
const C30 = Math.cos(Math.PI / 6);
const ZT = 3; // playfield height

const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const top = (x: number, y: number, z = ZT + 0.02): P3 => [x, y, z];

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Screen-space path through world points, plus the cumulative length fraction at each vertex. */
function route(points: [number, number][], z = ZT + 0.22) {
  const sp = points.map(([x, y]) => S([x, y, z]));
  const closed = [...sp, sp[0]];
  const lens = closed.slice(1).map((q, i) => Math.hypot(q[0] - closed[i][0], q[1] - closed[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  let acc = 0;
  const fr = [0, ...lens.map((l) => (acc += l) / total)];
  const d = `M${closed.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' L')}`;
  return { d, fr, sp };
}

/** One-shot flash opacity at loop fractions `times`. */
function flashVals(times: number[], w = 0.05) {
  const kt: number[] = [0];
  const v: number[] = [0];
  [...times].sort((a, b) => a - b).forEach((t) => {
    const a = Math.max(kt[kt.length - 1] + 0.001, t - 0.002);
    const b = Math.min(0.998, t + w);
    if (a >= b) return;
    kt.push(a, Math.min(b - 0.001, t + 0.004), b);
    v.push(0, 1, 0);
  });
  kt.push(1);
  v.push(0);
  return { keyTimes: kt.map((k) => k.toFixed(4)).join(';'), values: v.join(';') };
}

// Ball 1 (3 s): a cycle off all three bumpers and both flippers.
const R1 = route([
  [3.0, 2.0],
  [3.55, 3.45],
  [2.35, 4.7],
  [2.45, 6.35],
  [2.2, 10.3],
  [3.7, 10.3],
  [4.4, 6.0],
]);
// Ball 2 (6 s): wider loop through the sling and lanes.
const R2 = route([
  [1.2, 3.2],
  [2.25, 3.65],
  [3.1, 2.1],
  [4.55, 3.55],
  [3.4, 6.45],
  [3.85, 10.3],
  [1.1, 8.2],
]);
const BUMPERS = [
  { x: 1.8, y: 4.2, key: 'cabinet' as const, hits: [[R1.fr[2]], [R2.fr[1]]] },
  { x: 4.0, y: 4.0, key: 'accent2' as const, hits: [[R1.fr[1]], [R2.fr[3]]] },
  { x: 2.9, y: 6.0, key: 'pop' as const, hits: [[R1.fr[3]], [R2.fr[4]]] },
];
const MOMENT = 0.7;

function Ball({ id, d, dur, keyPoints, keyTimes, extra }: { id: string; d: string; dur: number; keyPoints?: string; keyTimes?: string; extra?: ReactNode }) {
  return (
    <g>
      {extra}
      <ellipse cx="6" cy="10" rx="12" ry="6" fill="#000" opacity="0.25" />
      <circle r="12" fill={`url(#${id})`} stroke="rgba(10,10,20,0.7)" strokeWidth="1.6" />
      <circle cx="-3.5" cy="-3.5" r="2.6" fill="#ffffff" />
      <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={d} {...(keyPoints ? { keyPoints, keyTimes, calcMode: 'linear' } : {})} />
    </g>
  );
}

export default function MultiballTable(p: P) {
  const night = isDark(p.wall);
  const INK = night ? 'rgba(4,2,10,0.85)' : shade(p.ink, 0) + 'CC';
  const ink = { stroke: INK, strokeWidth: 1.4 };
  const colors = { cabinet: p.cabinet, accent2: p.accent2, pop: p.pop };

  // Floor tiles (checkerboard laminate).
  const tiles: ReactNode[] = [];
  for (let x = -5; x < 16; x++)
    for (let y = -4; y < 22; y++)
      tiles.push(<polygon key={`${x}:${y}`} points={poly([[x, y, 0], [x + 1, y, 0], [x + 1, y + 1, 0], [x, y + 1, 0]])} fill={(x + y) % 2 === 0 ? p.floor : shade(p.floor, night ? 0.08 : -0.06)} />);

  // Backglass art panel: local coords, a along +x (0..6U), b downward from z = 7.8.
  const BG = { w: 6 * U, h: 4.6 * U };
  const [bgx, bgy] = S([0, 0.6, 7.8]);
  const leftFace = (tx: number, ty: number) => `matrix(${C30} 0.5 0 1 ${tx.toFixed(1)} ${ty.toFixed(1)})`;
  const rightFace = (tx: number, ty: number) => `matrix(${-C30} 0.5 0 1 ${tx.toFixed(1)} ${ty.toFixed(1)})`;
  const topPlane = (tx: number, ty: number) => `matrix(${C30} 0.5 ${-C30} 0.5 ${tx.toFixed(1)} ${ty.toFixed(1)})`;

  const kt1 = R1.fr.map((_, i) => (i / (R1.fr.length - 1)).toFixed(4)).join(';');
  const kp1 = R1.fr.map((f) => f.toFixed(4)).join(';');
  const kt2 = R2.fr.map((_, i) => (i / (R2.fr.length - 1)).toFixed(4)).join(';');
  const kp2 = R2.fr.map((f) => f.toFixed(4)).join(';');
  // Vertex i of route N is reached at time i / (n - 1) of its loop. Convert to the 6 s loop.
  const t1 = (i: number) => i / (R1.fr.length - 1); // in a 3 s loop
  const t2 = (i: number) => i / (R2.fr.length - 1);

  // Third ball (the moment): kicked out of the saucer at 0.7, drains just before the loop ends.
  const R3 = [S([1.0, 2.4, ZT + 0.22]), S([2.0, 3.9, ZT + 0.22]), S([3.3, 7.2, ZT + 0.22]), S([2.9, 11.3, ZT + 0.22])];
  const d3 = `M${R3.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' L')}`;

  const flipL = S([1.6, 10.35, ZT + 0.05]);
  const flipR = S([4.2, 10.35, ZT + 0.05]);
  const fl1 = flashVals([t1(4) / 2, t1(4) / 2 + 0.5], 0.06); // left flipper, ball 1 (twice per 6 s)
  const fr1 = flashVals([t1(5) / 2, t1(5) / 2 + 0.5, t2(5)], 0.06); // right flipper: ball 1 + ball 2

  const confettiOrigin = S([3, 0.3, 8.1]);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <radialGradient id="mt-ball" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#D5D9E2" />
          <stop offset="1" stopColor="#6E748A" />
        </radialGradient>
        <filter id="mt-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="mt-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="mt-dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="7" cy="7" r="1.8" fill={night ? 'rgba(255,255,255,0.12)' : shade(p.ink, 0) + '22'} />
        </pattern>
        <linearGradient id="mt-wallR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.wall, night ? 0.04 : -0.02)} />
          <stop offset="1" stopColor={shade(p.wall, night ? 0.1 : -0.07)} />
        </linearGradient>
      </defs>

      <rect width="1200" height="900" fill={p.wall} />
      <g transform={`translate(${OX} ${OY})`}>
        {/* Back walls */}
        <polygon points={poly([[-5, -4, 0], [12, -4, 0], [12, -4, 16], [-5, -4, 16]])} fill="url(#mt-wallR)" />
        <polygon points={poly([[-5, -4, 0], [-5, 17, 0], [-5, 17, 16], [-5, -4, 16]])} fill={shade(p.wall, night ? -0.12 : -0.05)} />
        <polygon points={poly([[-5, -4, 0], [12, -4, 0], [12, -4, 16], [-5, -4, 16]])} fill="url(#mt-dots)" />
        {/* skirting */}
        <polygon points={poly([[-5, -4, 0], [12, -4, 0], [12, -4, 0.5], [-5, -4, 0.5]])} fill={p.accent2} />
        <polygon points={poly([[-5, -4, 0], [-5, 17, 0], [-5, 17, 0.5], [-5, -4, 0.5]])} fill={shade(p.accent2, -0.2)} />

        {/* Memphis wall art: left wall (plane x = -5) */}
        {(() => {
          const [tx, ty] = S([-5, 4, 7]);
          return (
            <g transform={rightFace(tx, ty)}>
              <circle cx="-40" cy="10" r="58" fill={p.pop} />
              <path d="M-170,90 q20,-30 40,0 t40,0 t40,0 t40,0 t40,0" fill="none" stroke={p.cabinet} strokeWidth="10" strokeLinecap="round" />
              <path d="M-230,-60 L-170,-130 L-130,-50 Z" fill={p.accent2} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
              <rect x="-300" y="20" width="70" height="70" fill="none" stroke={INK} strokeWidth="5" />
            </g>
          );
        })()}
        {/* right wall (plane y = -4): neon sign + shapes */}
        {(() => {
          const [tx, ty] = S([2.2, -4, 6.4]);
          const [sx, sy] = S([-3.5, -4, 11]);
          return (
            <>
              <g transform={leftFace(sx, sy)}>
                <circle cx="20" cy="20" r="40" fill="none" stroke={p.cabinet} strokeWidth="9" />
                <path d="M100,60 q16,-24 32,0 t32,0 t32,0" fill="none" stroke={p.accent2} strokeWidth="9" strokeLinecap="round" />
                <path d="M210,-10 L250,50 L170,50 Z" fill={p.pop} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
              </g>
              <g transform={leftFace(tx, ty)}>
                <rect x="-14" y="-40" width={p.neon.length * 19 + 28} height="58" rx="10" fill={night ? '#0B0414' : shade(p.ink, 0)} opacity={night ? 0.75 : 0.94} />
                <text x="0" y="0" fontFamily={FONTS.rubikmono} fontSize="19" fill={shade(p.glow, 0.25)} filter="url(#mt-glow)">
                  {p.neon}
                  <Flicker dur={LOOP} seed={3} low={0.35} />
                </text>
              </g>
            </>
          );
        })()}

        {/* Floor */}
        {tiles}
        {/* table cast shadow (light from upper left) */}
        <polygon points={poly([[0.4, 0.6, 0], [7.6, 0.6, 0], [8.4, 12.4, 0], [1.2, 12.4, 0]])} fill="#000" opacity={night ? 0.4 : 0.16} filter="url(#mt-blur)" />
        {night && <ellipse cx={S([3, 6, 0])[0]} cy={S([3, 6, 0])[1]} rx="330" ry="170" fill={p.glow} opacity="0.16" filter="url(#mt-blur)" />}

        {/* tokens on the floor */}
        {[[8.6, 2.2], [9.3, 3.0], [-1.5, 12.5]].map(([x, y], i) => {
          const [cx, cy] = S([x, y, 0]);
          return (
            <g key={i}>
              <ellipse cx={cx} cy={cy + 2} rx="11" ry="6" fill={shade(p.pop, -0.4)} />
              <ellipse cx={cx} cy={cy} rx="11" ry="6" fill={p.pop} stroke={INK} strokeWidth="1.2" />
            </g>
          );
        })}

        {/* Legs */}
        {[[0.2, 0.8], [5.4, 0.8], [0.2, 11.1], [5.4, 11.1]].map(([x, y], i) => (
          <IsoBox key={i} x={x} y={y} w={0.4} d={0.4} h={1.8} color={night ? '#5A4F78' : '#9EA3B4'} u={U} ink={ink} />
        ))}

        {/* Backglass (behind the body) */}
        <IsoBox x={0} y={0} z={1.8} w={6} d={0.6} h={6.4} color={shade(p.ink, night ? 0.15 : 0.1)} u={U} ink={ink} />
        {/* marquee bulbs along the top front edge */}
        {Array.from({ length: 13 }, (_, i) => {
          const [cx, cy] = S([0.2 + i * 0.46, 0.6, 8.05]);
          return (
            <circle key={i} cx={cx} cy={cy} r="3.6" fill={p.pop} stroke={INK} strokeWidth="0.8">
              <animate attributeName="opacity" values="1;0.25;1" dur="1s" begin={`-${((i % 4) * 0.25).toFixed(2)}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
        <g transform={leftFace(bgx, bgy)}>
          <rect x="10" y="10" width={BG.w - 20} height={BG.h - 20} rx="10" fill={p.cabinet} stroke={INK} strokeWidth="3" />
          <rect x="10" y="10" width={BG.w - 20} height={BG.h - 20} rx="10" fill="url(#mt-dots)" />
          <circle cx={BG.w - 46} cy="44" r="26" fill={p.accent2} stroke={INK} strokeWidth="3" />
          <path d="M22,150 q10,-14 20,0 t20,0 t20,0" fill="none" stroke={p.pop} strokeWidth="5" strokeLinecap="round" />
          <text x={BG.w / 2} y="74" textAnchor="middle" fontFamily={FONTS.rubikmono} fontSize={p.sign.length > 9 ? 22 : 26} fill={p.pop} stroke={INK} strokeWidth="1.5" paintOrder="stroke">
            {p.sign}
          </text>
          {/* score display */}
          <rect x="40" y="98" width={BG.w - 80} height="44" rx="6" fill="#120A1E" stroke={INK} strokeWidth="3" />
          <text x={BG.w / 2} y="127" textAnchor="middle" fontFamily={FONTS.pressstart} fontSize="15" fill={p.pop}>
            {p.score}
            <animate attributeName="opacity" values="1;1;0;1;1" keyTimes="0;0.68;0.7;0.86;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          </text>
          <text x={BG.w / 2} y="127" textAnchor="middle" fontFamily={FONTS.pressstart} fontSize="15" fill={p.accent2} opacity="0">
            MULTIBALL!
            <animate attributeName="opacity" values="0;0;1;0;1;1;0;0" keyTimes="0;0.69;0.7;0.73;0.76;0.85;0.86;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          </text>
          {/* the moment: backglass flash */}
          <rect x="10" y="10" width={BG.w - 20} height={BG.h - 20} rx="10" fill="#FFFFFF" opacity="0">
            <animate attributeName="opacity" values="0;0;0.95;0.15;0.8;0;0" keyTimes="0;0.695;0.7;0.715;0.73;0.78;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          </rect>
        </g>

        {/* Cabinet body */}
        <IsoBox x={0} y={0.6} z={1.8} w={6} d={11.4} h={1.2} color={p.cabinet} u={U} ink={ink} top={false} />
        {/* side art: teal zigzag along the long right face (plane x = 6) */}
        {(() => {
          const [tx, ty] = S([6, 0.9, 2.75]);
          const zig = Array.from({ length: 22 }, (_, i) => `${i * 20},${i % 2 ? 26 : 8}`).join(' ');
          return (
            <g transform={rightFace(tx, ty)}>
              <polyline points={zig} fill="none" stroke={p.accent2} strokeWidth="6" strokeLinejoin="round" />
              {[60, 180, 300].map((x) => (
                <circle key={x} cx={x} cy="18" r="5" fill={p.pop} stroke={INK} strokeWidth="1.2" />
              ))}
            </g>
          );
        })()}
        {/* coin door on the front (plane y = 12) */}
        {(() => {
          const [tx, ty] = S([2.0, 12, 2.85]);
          return (
            <g transform={leftFace(tx, ty)}>
              <rect x="0" y="0" width="82" height="38" rx="4" fill={shade(p.ink, 0.15)} stroke={INK} strokeWidth="2" />
              {[16, 50].map((x, i) => (
                <rect key={x} x={x} y="9" width="16" height="20" rx="2" fill={p.glow}>
                  <Flicker dur={3} seed={i + 5} low={0.4} />
                </rect>
              ))}
            </g>
          );
        })()}

        {/* Playfield top: rail, inset field */}
        <polygon points={poly([top(0, 0.6, ZT), top(6, 0.6, ZT), top(6, 12, ZT), top(0, 12, ZT)])} fill={shade(p.cabinet, 0.15)} stroke={INK} strokeWidth="1.4" />
        <polygon points={poly([top(0.3, 0.9), top(5.7, 0.9), top(5.7, 11.7), top(0.3, 11.7)])} fill={p.playfield} stroke={INK} strokeWidth="1.4" />
        <polygon points={poly([top(0.3, 0.9), top(5.7, 0.9), top(5.7, 11.7), top(0.3, 11.7)])} fill="url(#mt-dots)" />
        {/* top arch + plunger lane */}
        <polyline points={poly([top(5.1, 11.7), top(5.1, 2.4), top(4.6, 1.4), top(3.6, 1.0)])} fill="none" stroke={INK} strokeWidth="2.4" />
        <polyline points={poly([top(5.4, 11.3), top(5.4, 10.1)])} stroke={shade(p.ink, 0.5)} strokeWidth="5" strokeLinecap="round" />
        {/* hatched corner insert */}
        <polygon points={poly([top(0.3, 9.4), top(0.3, 11.7), top(1.6, 11.7)])} fill={p.accent2} opacity="0.85" />
        {/* lane lights chase */}
        {[1.4, 2.2, 3.0, 3.8].map((x, i) => {
          const [cx, cy] = S(top(x, 1.8));
          return (
            <g key={i}>
              <polygon points={`${cx},${cy - 6} ${cx + 9},${cy} ${cx},${cy + 6} ${cx - 9},${cy}`} fill={p.pop} stroke={INK} strokeWidth="1.2">
                <animate attributeName="opacity" values="1;0.2;0.2;1" dur="1s" begin={`-${(i * 0.25).toFixed(2)}s`} repeatCount="indefinite" />
              </polygon>
            </g>
          );
        })}
        {/* arrow inserts */}
        {[0, 1, 2].map((i) => {
          const a = S(top(2.9, 8.6 - i * 0.6));
          return (
            <polygon key={i} points={`${a[0]},${a[1] - 7} ${a[0] + 10},${a[1] + 4} ${a[0] - 10},${a[1] + 4}`} fill={p.cabinet} stroke={INK} strokeWidth="1">
              <animate attributeName="opacity" values="0.25;1;0.25" dur="1.5s" begin={`-${(i * 0.5).toFixed(2)}s`} repeatCount="indefinite" />
            </polygon>
          );
        })}
        {/* target insert in the lower field: rings on the playfield plane with a pulsing centre */}
        {(() => {
          const [ix, iy] = S(top(4.2, 7.8));
          return (
            <g transform={topPlane(ix, iy)}>
              <circle r="26" fill="none" stroke={p.accent2} strokeWidth="5" />
              <circle r="14" fill="none" stroke={p.cabinet} strokeWidth="4" />
              <circle r="6" fill={p.pop} stroke={INK} strokeWidth="1.2">
                <animate attributeName="r" values="5;8;5" dur="1s" repeatCount="indefinite" />
              </circle>
            </g>
          );
        })()}
        {/* kickout saucer + drain */}
        {(() => {
          const [kx, ky] = S(top(1.0, 2.4));
          const [dx, dy] = S(top(2.9, 11.5));
          return (
            <>
              <ellipse cx={kx} cy={ky} rx="14" ry="8" fill={shade(p.ink, 0.1)} stroke={p.pop} strokeWidth="2" />
              <ellipse cx={dx} cy={dy} rx="22" ry="11" fill={shade(p.ink, 0.1)} />
            </>
          );
        })()}
        {/* spinner gate */}
        {(() => {
          const [sx, sy] = S(top(4.6, 2.7, ZT + 0.35));
          return (
            <g transform={`translate(${sx} ${sy})`}>
              <line x1="-12" y1="-6" x2="12" y2="6" stroke={INK} strokeWidth="2" />
              <g>
                <rect x="-10" y="-8" width="20" height="14" fill={p.pop} stroke={INK} strokeWidth="1.2" transform="skewY(27)" />
                <animateTransform attributeName="transform" type="scale" values="1 1;1 0.1;1 -1;1 0.1;1 1" dur="0.5s" repeatCount="indefinite" />
              </g>
            </g>
          );
        })()}
        {/* slingshots */}
        <polygon points={poly([top(0.9, 8.6, ZT + 0.3), top(0.9, 9.8, ZT + 0.3), top(1.6, 10.0, ZT + 0.3)])} fill={p.accent2} stroke={INK} strokeWidth="1.4" />
        <polygon points={poly([top(4.9, 8.6, ZT + 0.3), top(4.9, 9.8, ZT + 0.3), top(4.2, 10.0, ZT + 0.3)])} fill={p.accent2} stroke={INK} strokeWidth="1.4" />

        {/* Bumpers with per-ball hit flashes */}
        {BUMPERS.map((b, i) => {
          const c = colors[b.key];
          const [cx, cy] = S([b.x, b.y, ZT + 0.5]);
          const h1 = flashVals([b.hits[0][0] / 2 * 1, b.hits[0][0] / 2 + 0.5].map((t) => t), 0.05); // ball 1 runs twice per 6 s
          const h2 = flashVals([b.hits[1][0]], 0.05);
          return (
            <g key={i}>
              <IsoCylinder x={b.x} y={b.y} z={ZT} r={0.66} h={0.5} color={c} u={U} ink={ink} />
              <ellipse cx={cx} cy={cy} rx={0.4 * U * 1.2247} ry={0.4 * U * 0.7071} fill="#FFFFFF" stroke={INK} strokeWidth="1.2" />
              {[h1, h2].map((h, k) => (
                <g key={k} opacity="0">
                  <ellipse cx={cx} cy={cy} rx={0.66 * U * 1.2247 + 6} ry={0.66 * U * 0.7071 + 4} fill="none" stroke={p.pop} strokeWidth="4" />
                  <ellipse cx={cx} cy={cy} rx={0.4 * U * 1.2247} ry={0.4 * U * 0.7071} fill={p.pop} />
                  <animate attributeName="opacity" values={h.values} keyTimes={h.keyTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
                </g>
              ))}
            </g>
          );
        })}

        {/* Flippers: flick when a ball arrives */}
        {[
          { at: flipL, dir: 1, f: fl1 },
          { at: flipR, dir: -1, f: fr1 },
        ].map(({ at, dir, f }, i) => {
          const vals = f.values.split(';').map((v) => (v === '1' ? `${-28 * dir} ${at[0]} ${at[1]}` : `0 ${at[0]} ${at[1]}`)).join(';');
          return (
            <g key={i}>
              <path d={`M${at[0]},${at[1] - 6} L${at[0] + dir * 40},${at[1] + 20} a4,4 0 0 ${dir > 0 ? 1 : 0} ${-dir * 4},${7} L${at[0] - dir * 2},${at[1] + 8} a7,7 0 0 ${dir > 0 ? 1 : 0} ${dir * 2},-14 Z`} fill={p.cabinet} stroke={INK} strokeWidth="1.6" strokeLinejoin="round">
                <animateTransform attributeName="transform" type="rotate" values={vals} keyTimes={f.keyTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
              </path>
              <circle cx={at[0]} cy={at[1]} r="3.4" fill="#FFFFFF" stroke={INK} strokeWidth="1" />
            </g>
          );
        })}

        {/* Balls */}
        <Ball id="mt-ball" d={R1.d} dur={LOOP / 2} keyPoints={kp1} keyTimes={kt1} />
        <Ball id="mt-ball" d={R2.d} dur={LOOP} keyPoints={kp2} keyTimes={kt2} />
        {/* the third ball: hidden until the moment */}
        <g opacity="0">
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.699;0.7;0.96;0.97;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          <Ball id="mt-ball" d={d3} dur={LOOP} keyPoints="0;0;0;0.3;0.7;1;1" keyTimes="0;0.7;0.71;0.78;0.88;0.96;1" />
        </g>
        {/* saucer pop ring at the moment */}
        {(() => {
          const [kx, ky] = S(top(1.0, 2.4));
          return (
            <ellipse cx={kx} cy={ky} rx="14" ry="8" fill="none" stroke={p.pop} strokeWidth="3" opacity="0">
              <animate attributeName="rx" values="14;14;60;60" keyTimes="0;0.7;0.78;1" dur={`${LOOP}s`} repeatCount="indefinite" />
              <animate attributeName="ry" values="8;8;34;34" keyTimes="0;0.7;0.78;1" dur={`${LOOP}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.699;0.7;0.78;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            </ellipse>
          );
        })()}

        {/* Stool (in front, nearer than the table's right side) */}
        <IsoCylinder x={8.8} y={7.4} r={0.12} h={1.6} color={night ? '#5A4F78' : '#9EA3B4'} u={U} ink={ink} />
        <IsoCylinder x={8.8} y={7.4} z={1.6} r={0.85} h={0.28} color={p.accent2} u={U} ink={ink} />

        {/* Confetti burst from the backglass at the moment */}
        {Array.from({ length: 18 }, (_, i) => {
          // Fan out sideways and slightly up, then fall onto the playfield.
          const a = -Math.PI / 2 + (rand(i * 3.1) - 0.5) * 3.4;
          const dist = 110 + rand(i * 5.7) * 150;
          const dx = Math.cos(a) * dist * 1.3;
          const dy = Math.sin(a) * dist * 0.4 + 260;
          const c = [p.cabinet, p.accent2, p.pop, p.ink][i % 4];
          const kt = `0;${MOMENT};${MOMENT + 0.08};0.98;1`;
          return (
            <g key={i} opacity="0">
              <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={kt} dur={`${LOOP}s`} repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values={`${confettiOrigin[0]} ${confettiOrigin[1]};${confettiOrigin[0]} ${confettiOrigin[1]};${confettiOrigin[0] + dx * 0.7} ${confettiOrigin[1] + Math.sin(a) * dist * 0.7};${confettiOrigin[0] + dx} ${confettiOrigin[1] + dy};${confettiOrigin[0]} ${confettiOrigin[1]}`} keyTimes={kt} dur={`${LOOP}s`} repeatCount="indefinite" />
              {i % 3 === 0 ? (
                <path d="M-14,0 q3.5,-6 7,0 t7,0 t7,0 t7,0" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" />
              ) : i % 3 === 1 ? (
                <path d="M0,-9 L9,7 L-9,7 Z" fill={c} stroke={INK} strokeWidth="1.4" />
              ) : (
                <rect x="-3" y="-9" width="6" height="18" rx="3" fill={c} />
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
