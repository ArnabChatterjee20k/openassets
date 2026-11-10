import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Face, Flicker, IsoBox, IsoCylinder, IsoGrid, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Brief Foundry',
  description:
    'Landing-page hero for Formwork: a Bauhaus workshop where a campaign brief drops into a hopper, a press stamps it into ad tiles (circle, square, triangle) that ride a conveyor up a tube into a rack of glowing channel screens. On each stamp every screen flashes on.',
  tags: ['hero', 'isometric', 'process', 'machine', 'ads', 'animated svg', 'bauhaus'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Hopper sign').default('FORMWORK'),
  backdrop: color('Backdrop').default('#F2EBDD'),
  wall: color('Walls').default('#EADFCB'),
  floor: color('Floor').default('#D9CBB0'),
  machine: color('Machine').default('#1D4E9E'),
  press: color('Press ram').default('#D9381E'),
  pop: color('Yellow parts').default('#F2B90F'),
  steel: color('Steel').default('#2B2B2B'),
  screen: color('Screen light').default('#FFF4D6'),
  sky: color('Window sky').default('#BFD9EA'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { backdrop: '#EBD3C1', wall: '#E4C7B2', floor: '#C9A88E', sky: '#F29E6D', screen: '#FFE3B0' },
  night: { backdrop: '#141821', wall: '#252B38', floor: '#1D222D', machine: '#2F63C4', steel: '#0E1015', screen: '#FFE9A8', sky: '#0B1430', sign: 'NIGHT SHIFT' },
  swiss: { backdrop: '#F5F5F0', wall: '#E9E9E4', floor: '#D6D6D0', machine: '#0A0A0A', press: '#E3000F', pop: '#E3000F', steel: '#3A3A3A', sky: '#DCE6EC' },
  terracotta: { backdrop: '#F1E4D3', wall: '#EAD6BE', floor: '#D2B394', machine: '#4F6D58', press: '#C8553D', pop: '#F2A541', steel: '#3B1F14', sky: '#CFE0D3' },
};

type P = z.infer<typeof schema>;

const U = 38;
const OX = 522;
const OY = 352;
const LOOP = scene.loop;
const C30 = Math.cos(Math.PI / 6);
const INK = 'rgba(17,17,17,0.62)';
const ink = { stroke: INK, strokeWidth: 1.2 };

const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
/** Points of a circle drawn in a vertical face: left face (plane y) or right face (plane x). */
const ringOn = (face: 'left' | 'right', plane: number, ca: number, cz: number, r: number, n = 28): P3[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const u = ca + Math.cos(a) * r;
    const v = cz + Math.sin(a) * r;
    return face === 'left' ? [u, plane, v] : [plane, u, v];
  });
/** SVG matrix mapping local px (a along the face, b down) onto a face. */
const leftM = (y0: number) => {
  const [tx, ty] = S([0, y0, 0]);
  return `matrix(${C30} 0.5 0 1 ${tx} ${ty})`;
};
const rightM = (x0: number) => {
  const [tx, ty] = S([x0, 0, 0]);
  return `matrix(${-C30} 0.5 0 1 ${tx} ${ty})`;
};
const topM = (z0: number) => {
  const [tx, ty] = S([0, 0, z0]);
  return `matrix(${C30} 0.5 ${-C30} 0.5 ${tx} ${ty})`;
};

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 120;
};

/** Spur gear path centred at 0,0. */
function gearPath(r: number, teeth: number, depth: number) {
  const out: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a0 = (i / teeth) * Math.PI * 2;
    const a1 = a0 + (0.5 / teeth) * Math.PI * 2;
    const s = (0.12 / teeth) * Math.PI * 2;
    const pt = (a: number, rr: number) => `${(Math.cos(a) * rr).toFixed(2)},${(Math.sin(a) * rr).toFixed(2)}`;
    out.push(`${i === 0 ? 'M' : 'L'}${pt(a0, r)}`, `L${pt(a0 + s, r + depth)}`, `L${pt(a1 - s, r + depth)}`, `L${pt(a1, r)}`);
  }
  return out.join(' ') + 'Z';
}

function Gear({ a, b, r, teeth, fill, dur, reverse }: { a: number; b: number; r: number; teeth: number; fill: string; dur: number; reverse?: boolean }) {
  return (
    <g transform={`translate(${a} ${b})`}>
      <g>
        <animateTransform attributeName="transform" type="rotate" from={reverse ? '360' : '0'} to={reverse ? '0' : '360'} dur={`${dur}s`} repeatCount="indefinite" />
        <path d={gearPath(r, teeth, r * 0.2)} fill={fill} stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
        <circle r={r * 0.62} fill={shade(fill, -0.15)} stroke={INK} strokeWidth="1" />
        {[0, 1, 2].map((k) => (
          <line key={k} x1={0} y1={0} x2={Math.cos((k / 3) * Math.PI * 2) * r * 0.6} y2={Math.sin((k / 3) * Math.PI * 2) * r * 0.6} stroke={INK} strokeWidth="2" />
        ))}
        <circle r={r * 0.16} fill={shade(fill, 0.3)} stroke={INK} strokeWidth="1" />
      </g>
    </g>
  );
}

/** A Bauhaus primary drawn flat on a horizontal plane at height z, centred on (x, y). */
function TopShape({ kind, x, y, z, s, fill }: { kind: number; x: number; y: number; z: number; s: number; fill: string }) {
  if (kind === 0) {
    const ring: P3[] = Array.from({ length: 24 }, (_, i) => [x + Math.cos((i / 24) * Math.PI * 2) * s, y + Math.sin((i / 24) * Math.PI * 2) * s, z]);
    return <polygon points={poly(ring)} fill={fill} stroke={INK} strokeWidth="0.8" />;
  }
  if (kind === 1) return <polygon points={poly([[x - s, y - s, z], [x + s, y - s, z], [x + s, y + s, z], [x - s, y + s, z]])} fill={fill} stroke={INK} strokeWidth="0.8" />;
  return <polygon points={poly([[x - s, y + s, z], [x + s, y + s, z], [x, y - s, z]])} fill={fill} stroke={INK} strokeWidth="0.8" />;
}

export default function BriefFoundry(p: P) {
  const night = isDark(p.wall);
  const prim = [p.press, p.machine, p.pop];
  const flashKT = '0;0.49;0.5;0.53;0.62;1';
  const flashV = '0;0;1;0.75;0;0';

  // key positions
  const rimL = S([1.2, 7.4, 3.8]);
  const rimF = S([4.4, 7.4, 3.8]);
  const rimR = S([4.4, 4.2, 3.8]);
  const bed = S([7, 4.5, 1.35]);
  const tubeX = 13.4;
  const tubeY = 5.8;
  const [tcx, tcyBottom] = S([tubeX, tubeY, 0.9]);
  const tcyTop = S([tubeX, tubeY, 5.4])[1];

  // a clip that hides anything below the hopper's front rim (so briefs fall *into* it)
  const hopperClip = `${rimL[0] - 500},-900 ${rimR[0] + 500},-900 ${rimR[0] + 500},${rimR[1]} ${rimR[0]},${rimR[1]} ${rimF[0]},${rimF[1]} ${rimL[0]},${rimL[1]} ${rimL[0] - 500},${rimL[1]}`;

  // conveyor tiles
  const tiles: ReactNode[] = [0, 1, 2, 3].map((i) => {
    const begin = `-${(i * 1.5).toFixed(1)}s`;
    const [dx, dy] = [4.2 * C30 * U, 4.2 * 0.5 * U];
    return (
      <g key={i}>
        <animateTransform attributeName="transform" type="translate" values={`0 0;${dx} ${dy}`} dur={`${LOOP}s`} begin={begin} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.9;1" dur={`${LOOP}s`} begin={begin} repeatCount="indefinite" />
        <IsoBox x={8.55} y={5.45} z={0.9} w={0.75} d={0.75} h={0.14} color={night ? '#D8D2C4' : '#F4EEE2'} u={U} ink={ink} />
        <TopShape kind={i % 3} x={8.92} y={5.82} z={1.05} s={0.26} fill={prim[i % 3]} />
      </g>
    );
  });

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${scene.width} ${scene.height}`}>
      <defs>
        <linearGradient id="bf-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.backdrop, night ? 0.05 : 0.25)} />
          <stop offset="1" stopColor={shade(p.backdrop, night ? -0.2 : -0.06)} />
        </linearGradient>
        <radialGradient id="bf-glow">
          <stop offset="0" stopColor={p.screen} stopOpacity={night ? 0.55 : 0.35} />
          <stop offset="1" stopColor={p.screen} stopOpacity="0" />
        </radialGradient>
        <filter id="bf-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="bf-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <clipPath id="bf-hopper">
          <polygon points={hopperClip} />
        </clipPath>
        <clipPath id="bf-win1">
          <polygon points={poly([[2, 0, 3.4], [4.6, 0, 3.4], [4.6, 0, 6], [2, 0, 6]])} />
        </clipPath>
        <clipPath id="bf-win2">
          <polygon points={poly([[5.6, 0, 3.4], [8.2, 0, 3.4], [8.2, 0, 6], [5.6, 0, 6]])} />
        </clipPath>
      </defs>

      {/* backdrop: paper field with a huge faint Bauhaus circle */}
      <rect width="1200" height="900" fill="url(#bf-bg)" />
      <circle cx="960" cy="190" r="260" fill={p.press} opacity={night ? 0.08 : 0.07} />
      <polygon points="40,860 200,560 360,860" fill={p.pop} opacity={night ? 0.1 : 0.14} />
      {night &&
        Array.from({ length: 40 }, (_, i) => (
          <circle key={i} cx={rand(i * 2.7) * 1200} cy={rand(i * 5.3) * 420} r={0.6 + rand(i * 1.9) * 1.2} fill="#ffffff">
            <animate attributeName="opacity" values="0.2;0.9;0.2" dur={`${[2, 3, 6][i % 3]}s`} begin={`-${(rand(i * 4.1) * 3).toFixed(2)}s`} repeatCount="indefinite" />
          </circle>
        ))}

      <g transform={`translate(${OX} ${OY})`}>
        {/* floor slab */}
        <ellipse cx={S([7.5, 5, 0])[0]} cy={S([7.5, 5, -0.6])[1] + 60} rx="430" ry="80" fill="#000" opacity={night ? 0.35 : 0.12} filter="url(#bf-blur)" />
        <IsoBox x={0} y={0} z={-0.6} w={15} d={10} h={0.6} color={p.floor} u={U} ink={ink} />
        <IsoGrid x={0} y={0} w={15} d={10} u={U} color={night ? '#ffffff' : '#111111'} opacity={night ? 0.06 : 0.1} />

        {/* walls: back-left (plane x=0) and back-right (plane y=0) */}
        <Face u={U} ink={ink} fill={shade(p.wall, -0.1)} p={[[0, 0, 0], [0, 10, 0], [0, 10, 7], [0, 0, 7]]} />
        <Face u={U} ink={ink} fill={shade(p.wall, 0.06)} p={[[-0.35, 0, 7], [0, 0, 7], [0, 10, 7], [-0.35, 10, 7]]} />
        <Face u={U} ink={ink} fill={p.wall} p={[[0, 0, 0], [15, 0, 0], [15, 0, 7], [0, 0, 7]]} />
        <Face u={U} ink={ink} fill={shade(p.wall, 0.12)} p={[[-0.35, -0.35, 7], [15, -0.35, 7], [15, 0, 7], [0, 0, 7], [-0.35, 0, 7]]} />
        {/* skirting */}
        <Face u={U} ink={{ strokeWidth: 0 }} fill={shade(p.wall, -0.25)} p={[[0, 0.02, 0], [15, 0.02, 0], [15, 0.02, 0.3], [0, 0.02, 0.3]]} />
        <Face u={U} ink={{ strokeWidth: 0 }} fill={shade(p.wall, -0.32)} p={[[0.02, 0, 0], [0.02, 10, 0], [0.02, 10, 0.3], [0.02, 0, 0.3]]} />

        {/* windows with drifting clouds */}
        {[
          [2, 'bf-win1'],
          [5.6, 'bf-win2'],
        ].map(([x0, id], k) => {
          const x = x0 as number;
          return (
            <g key={k}>
              <Face u={U} ink={ink} fill={shade(p.wall, -0.4)} p={[[x - 0.12, 0, 3.28], [x + 2.72, 0, 3.28], [x + 2.72, 0, 6.12], [x - 0.12, 0, 6.12]]} />
              <g clipPath={`url(#${id})`}>
                <polygon points={poly([[x, 0, 3.4], [x + 2.6, 0, 3.4], [x + 2.6, 0, 6], [x, 0, 6]])} fill={p.sky} />
                {night ? (
                  <circle cx={S([x + 1.8, 0, 5.2])[0]} cy={S([x + 1.8, 0, 5.2])[1]} r="10" fill="#F5EBD0" opacity={k === 0 ? 1 : 0} />
                ) : (
                  <g fill="#ffffff" opacity="0.9">
                    <animateTransform attributeName="transform" type="translate" values={`-60 -35;${2.6 * C30 * U + 60} ${1.3 * U + 35}`} dur="6s" begin={`-${k * 3}s`} repeatCount="indefinite" />
                    <ellipse cx={S([x, 0, 5.2])[0]} cy={S([x, 0, 5.2])[1]} rx="18" ry="7" />
                    <ellipse cx={S([x, 0, 5.2])[0] + 12} cy={S([x, 0, 5.2])[1] - 4} rx="12" ry="7" />
                  </g>
                )}
              </g>
              <polyline points={poly([[x + 1.3, 0, 3.4], [x + 1.3, 0, 6]])} stroke={shade(p.wall, -0.4)} strokeWidth="2.5" fill="none" />
              <polyline points={poly([[x, 0, 4.7], [x + 2.6, 0, 4.7]])} stroke={shade(p.wall, -0.4)} strokeWidth="2.5" fill="none" />
              <Face u={U} ink={ink} fill={shade(p.wall, 0.15)} p={[[x - 0.25, 0.25, 3.2], [x + 2.85, 0.25, 3.2], [x + 2.85, 0, 3.2], [x - 0.25, 0, 3.2]]} />
              {/* light spill on the floor */}
              {!night && <polygon points={poly([[x + 0.6, 0.6, 0.01], [x + 3.2, 0.6, 0.01], [x + 4.6, 3.6, 0.01], [x + 2, 3.6, 0.01]])} fill="#ffffff" opacity="0.28" filter="url(#bf-blur)" />}
            </g>
          );
        })}

        {/* Bauhaus poster on the left wall */}
        <Face u={U} ink={ink} fill={night ? '#E9E0CE' : '#F7F1E4'} p={[[0, 1.2, 3], [0, 4, 3], [0, 4, 6.4], [0, 1.2, 6.4]]} />
        <polygon points={poly(ringOn('right', 0, 2.2, 5.3, 0.7))} fill={p.press} />
        <polygon points={poly([[0, 2.4, 3.4], [0, 3.7, 3.4], [0, 3.7, 4.7], [0, 2.4, 4.7]])} fill={p.machine} style={{ mixBlendMode: night ? 'normal' : 'multiply' }} />
        <polygon points={poly([[0, 1.5, 3.4], [0, 2.7, 3.4], [0, 2.1, 4.5]])} fill={p.pop} />
        <g transform={rightM(0)}>
          <text x={-3.75 * U} y={-6.05 * U} fontFamily={FONTS.spacemono} fontSize="7.5" letterSpacing="1.5" fill="#111111" transform="scale(-1 1)">
            Nº 34 · DESSAU
          </text>
        </g>

        {/* wall clock: the minute hand runs the loop */}
        {(() => {
          const pts2 = ringOn('left', 0, 10, 5.7, 0.55);
          const [cx, cy] = S([10, 0, 5.7]);
          return (
            <g>
              <polygon points={poly(pts2)} fill="#F7F1E4" stroke={INK} strokeWidth="2.5" />
              <g transform={leftM(0)}>
                <g transform={`translate(${10 * U} ${-5.7 * U})`}>
                  <line x1="0" y1="0" x2="0" y2={-0.38 * U} stroke="#111" strokeWidth="2.4" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite" />
                  </line>
                  <line x1="0" y1="0" x2={0.25 * U} y2="0" stroke={p.press} strokeWidth="2.4" strokeLinecap="round" />
                </g>
              </g>
              <circle cx={cx} cy={cy} r="2" fill="#111" />
            </g>
          );
        })()}

        {/* ── channel rack against the back wall ── */}
        <polygon points={poly([[11.2, 1.3, 0.01], [13.6, 1.3, 0.01], [14.4, 3.2, 0.01], [12, 3.2, 0.01]])} fill="#000" opacity={night ? 0.4 : 0.16} filter="url(#bf-blur)" />
        <IsoBox x={11.2} y={0.3} w={2.4} d={1} h={5.2} color={p.steel} u={U} ink={ink} />
        {Array.from({ length: 8 }, (_, i) => {
          const c = i % 2;
          const r = Math.floor(i / 2);
          const x = 11.38 + c * 1.07;
          const z = 4.0 - r * 1.12;
          const w = 0.95;
          const h = 0.9;
          const face: P3[] = [[x, 1.31, z], [x + w, 1.31, z], [x + w, 1.31, z + h], [x, 1.31, z + h]];
          return (
            <g key={i}>
              <polygon points={poly(face)} fill={p.screen}>
                <Flicker dur={LOOP} seed={i * 3 + 1} low={0.7} />
              </polygon>
              {/* ad thumbnail on each screen */}
              {i % 3 === 0 && <polygon points={poly(ringOn('left', 1.31, x + w / 2, z + h / 2, 0.24, 18))} fill={prim[i % 3]} />}
              {i % 3 === 1 && <polygon points={poly([[x + 0.25, 1.31, z + 0.2], [x + 0.7, 1.31, z + 0.2], [x + 0.7, 1.31, z + 0.65], [x + 0.25, 1.31, z + 0.65]])} fill={prim[i % 3]} />}
              {i % 3 === 2 && <polygon points={poly([[x + 0.2, 1.31, z + 0.18], [x + 0.75, 1.31, z + 0.18], [x + 0.475, 1.31, z + 0.72]])} fill={prim[i % 3]} />}
              <polygon points={poly(face)} fill="#ffffff" opacity="0">
                <animate attributeName="opacity" values={flashV} keyTimes={flashKT} dur={`${LOOP}s`} begin={`${(i % 4) * 0.02}s`} repeatCount="indefinite" />
              </polygon>
            </g>
          );
        })}
        <ellipse cx={S([12.4, 1.8, 2.6])[0]} cy={S([12.4, 1.8, 2.6])[1]} rx="90" ry="110" fill="url(#bf-glow)">
          <animate attributeName="opacity" values="0.6;0.6;1;0.6;0.6" keyTimes="0;0.49;0.52;0.7;1" dur={`${LOOP}s`} repeatCount="indefinite" />
        </ellipse>
        {/* rack label plate */}
        <Face u={U} ink={ink} fill={p.pop} p={[[11.4, 1.31, 4.98], [13.4, 1.31, 4.98], [13.4, 1.31, 5.12], [11.4, 1.31, 5.12]]} />

        {/* ── hopper ── */}
        <polygon points={poly([[1.5, 7.1, 0.01], [4.1, 7.1, 0.01], [5.1, 9.2, 0.01], [2.5, 9.2, 0.01]])} fill="#000" opacity={night ? 0.4 : 0.16} filter="url(#bf-blur)" />
        <IsoBox x={1.5} y={4.5} w={2.6} d={2.6} h={2.4} color={p.machine} u={U} ink={ink} />
        {/* gears on the hopper's right face */}
        <g transform={rightM(4.1)}>
          <Gear a={5.3 * U} b={-1.35 * U} r={0.62 * U} teeth={12} fill={p.pop} dur={3} />
          <Gear a={6.42 * U} b={-0.62 * U} r={0.4 * U} teeth={8} fill={p.press} dur={2} reverse />
        </g>
        {/* sign plate on the hopper's left face */}
        <Face u={U} ink={ink} fill="#151515" p={[[1.75, 7.1, 1.35], [3.85, 7.1, 1.35], [3.85, 7.1, 1.95], [1.75, 7.1, 1.95]]} />
        <g transform={leftM(7.1)}>
          <text x={2.8 * U} y={-1.5 * U} textAnchor="middle" fontFamily={FONTS.spacemono} fontWeight="700" fontSize={p.sign.length > 9 ? 9.5 : 12} letterSpacing="2" fill="#F7F1E4">
            {p.sign}
          </text>
        </g>
        {/* funnel */}
        <polygon points={poly([[1.2, 4.2, 3.8], [4.4, 4.2, 3.8], [4.4, 7.4, 3.8], [1.2, 7.4, 3.8]])} fill="#141414" stroke={INK} strokeWidth="1.2" />
        <Face u={U} ink={ink} fill={shade(p.machine, -0.45)} p={[[1.2, 4.2, 3.8], [1.9, 4.9, 2.4], [3.7, 4.9, 2.4], [4.4, 4.2, 3.8]]} />
        <Face u={U} ink={ink} fill={shade(p.machine, -0.55)} p={[[1.2, 4.2, 3.8], [1.9, 4.9, 2.4], [1.9, 6.7, 2.4], [1.2, 7.4, 3.8]]} />
        {/* falling briefs (two per loop), clipped by the front rim */}
        <g clipPath="url(#bf-hopper)">
          {[0, 1].map((k) => (
            <g key={k}>
              <animateTransform attributeName="transform" type="translate" values="-24 -190;6 -80;0 34;0 34" keyTimes="0;0.4;0.8;1" calcMode="spline" keySplines="0.4 0 0.6 1;0.5 0 0.9 0.6;0 0 1 1" dur="3s" begin={`-${k * 1.5}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.12;0.78;0.82;1" dur="3s" begin={`-${k * 1.5}s`} repeatCount="indefinite" />
              <g transform={topM(3.8)}>
                <g transform={`translate(${2.1 * U} ${5.2 * U}) rotate(${k ? 14 : -10})`}>
                  <rect x="0" y="0" width={1.3 * U} height={1.0 * U} fill="#FBF8F1" stroke={INK} strokeWidth="1" />
                  <rect x="5" y="5" width="12" height="12" rx="6" fill={p.press} />
                  {[0, 1, 2].map((j) => (
                    <rect key={j} x="5" y={21 + j * 5} width={30 - j * 6} height="2" fill="#555" />
                  ))}
                </g>
              </g>
            </g>
          ))}
        </g>
        <Face u={U} ink={ink} fill={shade(p.machine, -0.05)} p={[[4.4, 4.2, 3.8], [3.7, 4.9, 2.4], [3.7, 6.7, 2.4], [4.4, 7.4, 3.8]]} />
        <Face u={U} ink={ink} fill={shade(p.machine, -0.25)} p={[[1.2, 7.4, 3.8], [1.9, 6.7, 2.4], [3.7, 6.7, 2.4], [4.4, 7.4, 3.8]]} />
        <polyline points={poly([[1.2, 7.4, 3.8], [4.4, 7.4, 3.8], [4.4, 4.2, 3.8]])} stroke={shade(p.machine, 0.4)} strokeWidth="2.5" fill="none" />

        {/* feed pipe hopper → press */}
        <IsoBox x={4.1} y={5.3} z={0.8} w={1.4} d={0.6} h={0.6} color={p.steel} u={U} ink={ink} />

        {/* ── press ── */}
        <polygon points={poly([[5.5, 6, 0.01], [8.5, 6, 0.01], [9.6, 8.4, 0.01], [6.6, 8.4, 0.01]])} fill="#000" opacity={night ? 0.4 : 0.16} filter="url(#bf-blur)" />
        <IsoBox x={5.5} y={3} w={3} d={3} h={1.2} color={p.steel} u={U} ink={ink} />
        <IsoBox x={6} y={3.5} z={1.2} w={2} d={2} h={0.15} color={p.pop} u={U} ink={ink} />
        <IsoCylinder x={5.85} y={3.35} z={1.2} r={0.16} h={3.3} color={shade(p.steel, 0.35)} u={U} ink={ink} />
        <IsoCylinder x={8.15} y={3.35} z={1.2} r={0.16} h={3.3} color={shade(p.steel, 0.35)} u={U} ink={ink} />
        {/* ram: thumps on the moment */}
        <g>
          <animateTransform attributeName="transform" type="translate" values={`0 0;0 0;0 ${1.1 * U};0 ${1.1 * U};0 0;0 0`} keyTimes="0;0.42;0.5;0.53;0.68;1" calcMode="spline" keySplines="0 0 1 1;0.7 0 1 1;0 0 1 1;0.3 0 0.3 1;0 0 1 1" dur={`${LOOP}s`} repeatCount="indefinite" />
          <IsoCylinder x={7} y={4.5} z={3.4} r={0.2} h={1.8} color={shade(p.steel, 0.5)} u={U} ink={ink} />
          <IsoBox x={6.2} y={3.7} z={2.6} w={1.6} d={1.6} h={0.8} color={p.press} u={U} ink={ink} />
          <Face u={U} ink={{ strokeWidth: 0 }} fill={shade(p.press, 0.35)} p={[[6.3, 5.3, 3.25], [7.7, 5.3, 3.25], [7.7, 5.3, 3.32], [6.3, 5.3, 3.32]]} />
        </g>
        <IsoBox x={5.5} y={3} z={4.4} w={3} d={3} h={0.8} color={p.machine} u={U} ink={ink} />
        <Face u={U} ink={{ strokeWidth: 0 }} fill={p.pop} p={[[5.7, 6, 4.62], [8.3, 6, 4.62], [8.3, 6, 4.98], [5.7, 6, 4.98]]} />
        <IsoCylinder x={5.85} y={5.65} z={1.2} r={0.16} h={3.3} color={shade(p.steel, 0.35)} u={U} ink={ink} />
        <IsoCylinder x={8.15} y={5.65} z={1.2} r={0.16} h={3.3} color={shade(p.steel, 0.35)} u={U} ink={ink} />
        {/* steam puffs from the crosshead vent */}
        <IsoCylinder x={6.2} y={3.6} z={5.2} r={0.14} h={0.5} color={p.steel} u={U} ink={ink} />
        {[0, 1, 2].map((k) => {
          const [vx, vy] = S([6.2, 3.6, 5.8]);
          return (
            <circle key={k} cx={vx} cy={vy} r="6" fill={night ? '#C9CFDA' : '#FFFFFF'} stroke={INK} strokeWidth="0.8">
              <animate attributeName="cy" values={`${vy};${vy - 70}`} dur="2s" begin={`-${(k * 2) / 3}s`} repeatCount="indefinite" />
              <animate attributeName="r" values="4;14" dur="2s" begin={`-${(k * 2) / 3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0" dur="2s" begin={`-${(k * 2) / 3}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
        {/* the moment: starburst at the press bed */}
        <g transform={`translate(${bed[0]} ${bed[1]})`} opacity="0">
          <animate attributeName="opacity" values={flashV} keyTimes={flashKT} dur={`${LOOP}s`} repeatCount="indefinite" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const r0 = 44;
            const r1 = i % 2 ? 70 : 92;
            return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0 * 0.6} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1 * 0.6} stroke={p.pop} strokeWidth="4" strokeLinecap="round" />;
          })}
        </g>

        {/* gauge on the press base */}
        {(() => {
          const ring = ringOn('left', 6.01, 6.2, 0.62, 0.36, 24);
          return (
            <g>
              <polygon points={poly(ring)} fill="#F7F1E4" stroke={INK} strokeWidth="2" />
              <g transform={leftM(6.01)}>
                <g transform={`translate(${6.2 * U} ${-0.62 * U})`}>
                  <line x1="0" y1="0" x2={0.26 * U} y2="0" stroke={p.press} strokeWidth="2" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" values="-150;-60;-110;-30;-150" dur="2s" repeatCount="indefinite" />
                  </line>
                </g>
              </g>
            </g>
          );
        })()}
        {/* status lamps on the press base */}
        {[0, 1, 2].map((k) => (
          <polygon key={k} points={poly(ringOn('left', 6.01, 7.1 + k * 0.42, 0.62, 0.12, 14))} fill={prim[k]} stroke={INK} strokeWidth="0.8">
            <animate attributeName="opacity" values="1;0.35;1" dur="1s" begin={`-${k * 0.33}s`} repeatCount="indefinite" />
          </polygon>
        ))}

        {/* ── conveyor ── */}
        <polygon points={poly([[8.5, 6.4, 0.01], [12.8, 6.4, 0.01], [13.4, 7.6, 0.01], [9.1, 7.6, 0.01]])} fill="#000" opacity={night ? 0.4 : 0.14} filter="url(#bf-blur)" />
        <IsoBox x={8.5} y={5.2} w={4.4} d={1.2} h={0.9} color={p.steel} u={U} ink={ink} />
        <polygon points={poly([[8.5, 5.3, 0.91], [12.9, 5.3, 0.91], [12.9, 6.3, 0.91], [8.5, 6.3, 0.91]])} fill={shade(p.steel, 0.2)} />
        <line x1={S([8.5, 5.8, 0.92])[0]} y1={S([8.5, 5.8, 0.92])[1]} x2={S([12.9, 5.8, 0.92])[0]} y2={S([12.9, 5.8, 0.92])[1]} stroke={shade(p.steel, 0.5)} strokeWidth="14" strokeDasharray="3 9">
          <animate attributeName="stroke-dashoffset" values="0;-12" dur="0.5s" repeatCount="indefinite" />
        </line>
        {/* rollers on the front face */}
        {Array.from({ length: 6 }, (_, i) => {
          const [rx, ry] = S([8.85 + i * 0.75, 6.4, 0.45]);
          return (
            <g key={i} transform={`translate(${rx} ${ry})`}>
              <ellipse rx="7" ry="8" fill={shade(p.steel, 0.3)} stroke={INK} strokeWidth="1" />
              <line x1="-5" y1="0" x2="5" y2="0" stroke={INK} strokeWidth="1.5">
                <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="1s" repeatCount="indefinite" />
              </line>
            </g>
          );
        })}
        {tiles}

        {/* ── pneumatic tube to the rack ── */}
        <polyline points={poly([[tubeX, tubeY, 5.4], [tubeX, 0.9, 5.4], [13.0, 0.9, 5.2]])} stroke={p.steel} strokeWidth="13" strokeLinejoin="round" fill="none" />
        <polyline points={poly([[tubeX, tubeY, 5.4], [tubeX, 0.9, 5.4], [13.0, 0.9, 5.2]])} stroke={shade(p.steel, 0.35)} strokeWidth="5" strokeLinejoin="round" fill="none" />
        <IsoCylinder x={tubeX} y={tubeY} z={0} r={0.5} h={0.9} color={p.steel} u={U} ink={ink} />
        <path d={`M${tcx - 15},${tcyTop} L${tcx - 15},${tcyBottom} L${tcx + 15},${tcyBottom} L${tcx + 15},${tcyTop} Z`} fill={night ? '#9FB6D8' : '#DDEAF2'} opacity="0.55" stroke={INK} strokeWidth="1.2" />
        {[0, 1, 2].map((k) => (
          <rect key={k} x={tcx - 8} y={tcyBottom - 16} width="16" height="12" fill={prim[k]} stroke={INK} strokeWidth="0.8">
            <animate attributeName="y" values={`${tcyBottom - 16};${tcyTop}`} dur="1.5s" begin={`-${k * 0.5}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="1.5s" begin={`-${k * 0.5}s`} repeatCount="indefinite" />
          </rect>
        ))}
        <path d={`M${tcx - 15},${tcyTop} L${tcx - 15},${tcyBottom}`} stroke="#ffffff" strokeWidth="3" opacity="0.6" />
        <IsoCylinder x={tubeX} y={tubeY} z={5.25} r={0.36} h={0.3} color={p.steel} u={U} ink={ink} />

        {/* ── front details ── */}
        {/* crate of finished briefs */}
        <IsoBox x={0.8} y={8.2} w={1.6} d={1.2} h={0.7} color={shade(p.floor, -0.25)} u={U} ink={ink} />
        {[0, 1, 2].map((k) => (
          <IsoBox key={k} x={1.0 + k * 0.08} y={8.35} z={0.7 + k * 0.12} w={1.2} d={0.9} h={0.1} color={k === 2 ? '#FBF8F1' : shade('#FBF8F1', -0.06)} u={U} ink={ink} />
        ))}
        <TopShape kind={0} x={1.62} y={8.8} z={1.06} s={0.18} fill={p.press} />
        {/* stool + plant */}
        <IsoCylinder x={14} y={8.6} z={0} r={0.42} h={0.7} color={p.press} u={U} ink={ink} />
        {[
          [-12, -36, 14],
          [8, -44, 13],
          [-2, -56, 12],
          [14, -30, 10],
        ].map(([dx, dy, r], k) => {
          const [px, py] = S([14, 8.6, 0.7]);
          return (
            <circle key={k} cx={px + dx} cy={py + dy} r={r} fill={shade(night ? '#3E6B4F' : '#4F7A57', k % 2 ? -0.1 : 0.05)} stroke={INK} strokeWidth="1.1">
              <animateTransform attributeName="transform" type="rotate" values={`-2 ${px} ${py};2 ${px} ${py};-2 ${px} ${py}`} dur="3s" begin={`-${k * 0.7}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      </g>

      {/* caption strip */}
      <g fontFamily={FONTS.spacemono} fontSize="13" letterSpacing="3.5" fill={night ? '#E9E3D6' : '#111111'}>
        <text x="60" y="64">FORMWORK · BRIEF FOUNDRY</text>
        <text x="1140" y="64" textAnchor="end">
          ONE BRIEF → 34 CHANNELS
        </text>
        <line x1="60" y1="80" x2="1140" y2="80" stroke={night ? '#E9E3D6' : '#111111'} strokeOpacity="0.4" />
      </g>
    </svg>
  );
}
