import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Face, Flicker, IsoBox, IsoCylinder, IsoWindow, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Brief Press',
  description:
    'How-it-works hero for Junction, the AI ad agent: an isometric process machine. Paper briefs drop down a glass tube into the hopper, gears turn behind the window, finished ads in every format ride a conveyor under a stamp press into the dispatch sorter, and three coloured pneumatic tubes shoot capsules off to the platforms. Once a loop the sorter beacon fires and a "32 platforms" tag pops. Loops seamlessly.',
  tags: ['hero', 'isometric', 'how it works', 'process', 'machine', 'animated svg'],
};

// Every SMIL duration divides this loop (8, 4, 2, 1, 0.5 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 8 };

export const schema = z.object({
  sign: text('Machine sign').default('JUNCTION'),
  sorter: text('Sorter sign').default('DISPATCH'),
  screen: text('Brief screen').default('BRIEF #0412'),
  tube1: text('Tube 1 label').default('SEARCH'),
  tube2: text('Tube 2 label').default('SOCIAL'),
  tube3: text('Tube 3 label').default('CTV'),
  tag: text('Moment tag').default('32 PLATFORMS'),
  skyTop: color('Sky top').default('#FFE3A3'),
  skyBottom: color('Sky bottom').default('#FFF8E1'),
  floor: color('Floor').default('#FFE9A8'),
  slab: color('Slab sides').default('#2E6B34'),
  body: color('Machine body').default('#FFF8E1'),
  ink: color('Ink').default('#1C2B1A'),
  line1: color('Line 1 / sorter').default('#FF7A00'),
  line2: color('Line 2').default('#2BB24C'),
  line3: color('Line 3').default('#FF3D7F'),
  glow: color('Lamp light').default('#FFD45C'),
  night: toggle('Night').default(false),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { skyTop: '#5B2A55', skyBottom: '#FF9E6B', floor: '#F6D7A7', slab: '#5A2E3E', body: '#FFEBD6', glow: '#FFC46B' },
  'night line': { night: true, skyTop: '#07110B', skyBottom: '#1E3424', floor: '#2A3D2C', slab: '#0E1A14', body: '#D9E4CF', ink: '#0B120B', line1: '#FF9F43', line2: '#B5E550' },
  swiss: { skyTop: '#E6E6E1', skyBottom: '#F5F5F0', floor: '#F5F5F0', slab: '#8C8C88', body: '#FFFFFF', ink: '#0A0A0A', line1: '#E3000F', line2: '#0A0A0A', line3: '#8C8C88', glow: '#FFE07A' },
  blueprint: { night: true, skyTop: '#0A2C6B', skyBottom: '#134AA8', floor: '#1B56B8', slab: '#0A2C6B', body: '#EAF2FF', ink: '#061A40', line1: '#FFDD00', line2: '#7FB2FF', line3: '#FF7A9C', glow: '#FFF2A8' },
};

type P = z.infer<typeof schema>;

const U = 36;
const LOOP = scene.loop;
const OX = 520;
const OY = 300;
const C30 = Math.cos(Math.PI / 6);
const S = (p: P3): [number, number] => {
  const [x, y] = iso(p, U);
  return [x + OX, y + OY];
};
const poly = (ps: P3[]) => pts(ps, U);
const MOMENT = 0.5;
// The machine layer is drawn at U and scaled up as a whole around this centre.
const SC = 1.2;
const SC_X = 620;
const SC_Y = 470;
/** Pre-scale x that lands at screen x `x` after the scale. */
const unscaleX = (x: number) => SC_X + (x - SC_X) / SC;
const sp = { calcMode: 'spline' as const };

// World layout
const M = { x: 1.5, y: 2, w: 4, d: 4, h: 4.2 }; // machine
const CV = { x0: 5.5, x1: 10.4, y0: 3.4, y1: 4.6, z: 1.2 }; // conveyor
const SO = { x: 10.4, y: 2.9, w: 3, d: 2.2, h: 2.4 }; // sorter
const PRESS_X = 8;

/** Text in a left-facing wall plane (y = const). `at` is in world units (unshifted). */
function LeftText({ at, children, size, fill, family = FONTS.mono, weight = 700, spacing = 1.5 }: { at: P3; children: ReactNode; size: number; fill: string; family?: string; weight?: number; spacing?: number }) {
  const [x, y] = iso(at, U);
  return (
    <g transform={`translate(${x} ${y}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
      <text textAnchor="middle" fontFamily={family} fontWeight={weight} fontSize={size} letterSpacing={spacing} fill={fill}>
        {children}
      </text>
    </g>
  );
}

/** A gear drawn in the left wall plane: dashed stroke makes the teeth. */
function Gear({ at, r, teeth, c, ink, dur, reverse }: { at: P3; r: number; teeth: number; c: string; ink: string; dur: number; reverse?: boolean }) {
  const [x, y] = iso(at, U);
  const circ = 2 * Math.PI * (r + 4);
  return (
    <g transform={`translate(${x} ${y}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
      <g>
        <animateTransform attributeName="transform" type="rotate" values={reverse ? '360;0' : '0;360'} dur={`${dur}s`} repeatCount="indefinite" />
        <circle r={r + 4} fill="none" stroke={ink} strokeWidth={10} strokeDasharray={`${circ / teeth / 2} ${circ / teeth / 2}`} />
        <circle r={r + 4} fill="none" stroke={c} strokeWidth={7} strokeDasharray={`${circ / teeth / 2 - 2} ${circ / teeth / 2 + 2}`} />
        <circle r={r} fill={c} stroke={ink} strokeWidth={1.5} />
        <circle r={r * 0.35} fill={shade(c, -0.3)} stroke={ink} strokeWidth={1.2} />
        <rect x={-1.5} y={-r * 0.9} width={3} height={r * 1.8} fill={shade(c, -0.25)} />
      </g>
    </g>
  );
}

function Shadow({ x, y, w, d, h }: { x: number; y: number; w: number; d: number; h: number }) {
  const l = h * 0.45;
  return <polygon points={poly([[x + w, y, 0.02], [x + w + l, y + l * 0.25, 0.02], [x + w + l, y + d + l * 0.25, 0.02], [x + w, y + d, 0.02]])} fill="#1C2B1A" opacity="0.16" filter="url(#bp-blur)" />;
}

function Cloud({ x, y, s, dx, p }: { x: number; y: number; s: number; dx: number; p: P }) {
  const c = p.night ? shade(p.skyBottom, 0.12) : '#FFFFFF';
  return (
    <g opacity={p.night ? 0.45 : 0.9}>
      <animateTransform attributeName="transform" type="translate" values={`0 0;${dx} 0;0 0`} dur={`${LOOP}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
      <g fill={c} stroke={p.night ? 'none' : shade(p.skyTop, -0.15)} strokeWidth="1.2">
        <ellipse cx={x} cy={y} rx={60 * s} ry={16 * s} />
        <circle cx={x - 22 * s} cy={y - 12 * s} r={20 * s} />
        <circle cx={x + 10 * s} cy={y - 18 * s} r={26 * s} />
        <circle cx={x + 38 * s} cy={y - 6 * s} r={16 * s} />
      </g>
    </g>
  );
}

export default function BriefPress(p: P) {
  const night = p.night;
  const ink = { stroke: p.ink, strokeWidth: 1.2 };
  const lines = [p.line1, p.line2, p.line3];
  const momentKT = (a: number, b: number, c: number) => `0;${MOMENT};${MOMENT + a};${MOMENT + b};${MOMENT + c};1`;

  // ── Pneumatic tubes: rise from the sorter top, elbow right, leave the frame ──
  const tubeTopY = [205, 285, 365];
  const tubes = [10.9, 11.9, 12.9].map((x, i) => {
    const [sx, sy] = S([x, 4, SO.h]);
    const ty = tubeTopY[i];
    const r = 56;
    const d = `M${sx.toFixed(1)},${sy.toFixed(1)} L${sx.toFixed(1)},${(ty + r).toFixed(1)} Q${sx.toFixed(1)},${ty} ${(sx + r).toFixed(1)},${ty} L1260,${ty}`;
    return { d, sx, sy, ty, c: lines[i], label: [p.tube1, p.tube2, p.tube3][i] };
  });

  // ── Conveyor endpoints on screen (for tiles riding the belt) ──
  const beltA = S([CV.x0 + 0.1, 4, CV.z]);
  const beltB = S([CV.x1 - 0.1, 4, CV.z]);
  const tileShapes = [
    { w: 0.8, d: 0.8 },
    { w: 0.6, d: 1.0 },
    { w: 1.0, d: 0.6 },
    { w: 0.8, d: 0.8 },
  ];

  // ── Night sky ──
  const stars: ReactNode[] = [];
  if (night) {
    for (let i = 0; i < 60; i++) {
      const dur = [2, 4, 8][i % 3];
      stars.push(
        <circle key={i} cx={rand(i * 3.1) * 1200} cy={rand(i * 7.7) * 360} r={0.6 + rand(i * 1.3) * 1.4} fill="#FFFFFF">
          <animate attributeName="opacity" values="0.2;1;0.2" dur={`${dur}s`} begin={`-${(rand(i * 5.9) * dur).toFixed(2)}s`} repeatCount="indefinite" />
        </circle>,
      );
    }
  }

  const beacon = S([SO.x + SO.w / 2, SO.y + SO.d / 2, SO.h + 0.75]);
  const tubeTop = S([3.5, 4, 5.6]);
  const tubeRx = 0.55 * U * 1.2247;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id="bp-sun">
          <stop offset="0" stopColor={night ? '#FFF6DA' : '#FFFFFF'} stopOpacity="0.7" />
          <stop offset="0.4" stopColor={night ? '#FFF6DA' : p.line1} stopOpacity="0.18" />
          <stop offset="1" stopColor={p.line1} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bp-flare">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="0.3" stopColor={p.line3} stopOpacity="0.6" />
          <stop offset="1" stopColor={p.line3} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bp-pool">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bp-glass" x1="0" x2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.15" />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.1" />
        </linearGradient>
        <filter id="bp-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="bp-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <clipPath id="bp-belt">
          <polygon points={poly([[CV.x0, CV.y0, CV.z], [CV.x1, CV.y0, CV.z], [CV.x1, CV.y1, CV.z], [CV.x0, CV.y1, CV.z]])} transform={`translate(${OX} ${OY})`} />
        </clipPath>
      </defs>

      {/* ── Sky ── */}
      <rect width="1200" height="900" fill="url(#bp-sky)" />
      {stars}
      <circle cx="190" cy="150" r="140" fill="url(#bp-sun)" />
      <circle cx="190" cy="150" r="46" fill={night ? '#FFF3D6' : '#FFC94D'} stroke={night ? 'none' : p.line1} strokeWidth="3" />
      <Cloud x={340} y={90} s={0.8} dx={30} p={p} />
      <Cloud x={960} y={110} s={1} dx={-40} p={p} />
      {/* a paper-plane brief crosses the sky */}
      <g>
        <animateMotion dur={`${LOOP}s`} repeatCount="indefinite" rotate="auto" path="M-80,140 C260,40 640,180 1300,70" />
        <path d="M14,0 L-12,-9 L-6,0 L-12,9 Z" fill="#FFFFFF" stroke={p.ink} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M14,0 L-6,0" stroke={p.ink} strokeWidth="1" />
      </g>

      {/* ── Plant floor (scaled up around the composition centre) ── */}
      <g transform={`translate(${SC_X} ${SC_Y}) scale(${SC}) translate(${-SC_X} ${-SC_Y})`}>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -4;0 0" dur={`${LOOP}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
        <g transform={`translate(${OX} ${OY})`}>
          <ellipse cx={iso([7, 4.5, 0], U)[0]} cy={iso([14, 9, 0], U)[1] + 50} rx={420} ry={36} fill="#1C2B1A" opacity="0.08" filter="url(#bp-blur)" />
          <IsoBox x={0} y={0} z={-0.9} w={14} d={9} h={0.9} color={p.slab} u={U} ink={{ stroke: p.ink, strokeWidth: 1.3 }} />
          <IsoBox x={-0.05} y={-0.05} z={-0.12} w={14.1} d={9.1} h={0.12} color={p.floor} u={U} ink={{ stroke: p.ink, strokeWidth: 1.2 }} />
          {/* floor tiles */}
          <g stroke={shade(p.floor, -0.16)} strokeWidth="1" opacity="0.7">
            {Array.from({ length: 13 }, (_, i) => (
              <polyline key={`a${i}`} points={poly([[i + 1, 0, 0.005], [i + 1, 9, 0.005]])} fill="none" />
            ))}
            {Array.from({ length: 8 }, (_, i) => (
              <polyline key={`b${i}`} points={poly([[0, i + 1, 0.005], [14, i + 1, 0.005]])} fill="none" />
            ))}
          </g>
          {/* painted walkway with line-coloured lanes in front of the conveyor */}
          {lines.map((c, i) => (
            <polygon key={i} points={poly([[1.2, 6.9 + i * 0.45, 0.01], [13.6, 6.9 + i * 0.45, 0.01], [13.6, 7.15 + i * 0.45, 0.01], [1.2, 7.15 + i * 0.45, 0.01]])} fill={c} opacity="0.85" />
          ))}
          {/* hazard hatching under the press */}
          {Array.from({ length: 6 }, (_, i) => (
            <polygon key={`hz${i}`} points={poly([[7.2 + i * 0.28, 5.0, 0.01], [7.35 + i * 0.28, 5.0, 0.01], [7.2 + i * 0.28, 5.5, 0.01], [7.05 + i * 0.28, 5.5, 0.01]])} fill={p.ink} opacity="0.7" />
          ))}

          {/* ── Back props: paper stack and potted plant behind the machine ── */}
          <IsoBox x={0.5} y={0.6} w={0.8} d={0.6} h={0.5} color="#FFFFFF" u={U} ink={ink} />
          <IsoBox x={0.55} y={0.65} z={0.5} w={0.7} d={0.5} h={0.18} color={p.line2} u={U} ink={ink} />

          {/* ── The machine ── */}
          <Shadow x={M.x} y={M.y} w={M.w} d={M.d} h={M.h} />
          <IsoBox x={M.x} y={M.y} w={M.w} d={M.d} h={M.h} color={p.body} u={U} ink={{ stroke: p.ink, strokeWidth: 1.4 }} />
          <IsoBox x={M.x - 0.08} y={M.y - 0.08} w={M.w + 0.16} d={M.d + 0.16} h={0.3} color={shade(p.body, -0.3)} u={U} top={false} ink={ink} />
          <IsoBox x={M.x - 0.12} y={M.y - 0.12} z={M.h} w={M.w + 0.24} d={M.d + 0.24} h={0.22} color={p.line1} u={U} ink={ink} />
          {/* sign band */}
          <IsoWindow face="left" plane={M.y + M.d + 0.01} a={M.x + 0.25} z={3.25} w={M.w - 0.5} h={0.7} fill={p.ink} u={U} ink={ink} />
          {lines.map((c, i) => {
            const [bx, by] = iso([M.x + 0.45 + i * 0.26, M.y + M.d + 0.01, 3.6], U);
            return <circle key={i} cx={bx} cy={by} r="5" fill={c} />;
          })}
          <LeftText at={[M.x + 2.35, M.y + M.d + 0.01, 3.44]} size={18} fill={shade(p.body, 0.2)} family={FONTS.shoulders} weight={900} spacing={3}>
            {p.sign}
          </LeftText>
          {/* gear window */}
          <IsoWindow face="left" plane={M.y + M.d + 0.01} a={M.x + 0.3} z={0.6} w={2.1} h={2.3} fill={shade(p.ink, 0.12)} u={U} ink={ink} />
          <IsoWindow face="left" plane={M.y + M.d + 0.01} a={M.x + 0.4} z={0.7} w={1.9} h={2.1} fill={night ? shade(p.glow, -0.55) : shade(p.ink, 0.25)} u={U} ink={{ strokeWidth: 0 }} />
          <Gear at={[M.x + 0.95, M.y + M.d + 0.02, 2.15]} r={16} teeth={10} c={p.line1} ink={p.ink} dur={4} />
          <Gear at={[M.x + 1.75, M.y + M.d + 0.02, 1.45]} r={11} teeth={8} c={p.line2} ink={p.ink} dur={2} reverse />
          <Gear at={[M.x + 0.85, M.y + M.d + 0.02, 1.0]} r={8} teeth={6} c={p.glow} ink={p.ink} dur={2} reverse />
          {/* brief counter screen + status lamps */}
          <IsoWindow face="left" plane={M.y + M.d + 0.01} a={M.x + 2.6} z={1.95} w={1.15} h={0.6} fill={p.ink} u={U} ink={ink} />
          <g>
            <animate attributeName="opacity" values="1;0.55;1" dur="1s" repeatCount="indefinite" />
            <LeftText at={[M.x + 3.17, M.y + M.d + 0.02, 2.17]} size={7.5} fill={p.line2} spacing={0.6}>
              {p.screen}
            </LeftText>
          </g>
          {[0, 1, 2, 3].map((i) => {
            const [lx, ly] = iso([M.x + 2.75 + i * 0.27, M.y + M.d + 0.02, 1.4], U);
            return (
              <g key={`lamp${i}`}>
                <circle cx={lx} cy={ly} r="5.5" fill={[p.line1, p.line2, p.line3, p.glow][i]} stroke={p.ink} strokeWidth="1.2">
                  <Flicker dur={LOOP / 2} seed={i * 5 + 3} low={0.35} />
                </circle>
              </g>
            );
          })}
          {/* hatch with rivets */}
          <IsoWindow face="left" plane={M.y + M.d + 0.01} a={M.x + 2.7} z={0.35} w={1.0} h={0.75} fill={shade(p.body, -0.2)} u={U} ink={ink} />
          {/* right face: gauge, conveyor slot, pipe */}
          <g transform={`translate(${iso([M.x + M.w + 0.01, M.y + 1, 2.6], U).join(' ')}) matrix(${C30}, -0.5, 0, 1, 0, 0)`}>
            <circle r="17" fill={shade(p.body, 0.1)} stroke={p.ink} strokeWidth="3" />
            <path d="M-12,4 A12.6,12.6 0 0 1 12,4" fill="none" stroke={p.line2} strokeWidth="3" />
            <path d="M6,-10 A12,12 0 0 1 12,4" fill="none" stroke={p.line3} strokeWidth="3" />
            <line x1="0" y1="0" x2="0" y2="-12" stroke={p.ink} strokeWidth="2.4" strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" values="-50;20;-10;40;-50" dur="2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.3;0.5;0.8;1" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1" />
            </line>
            <circle r="2.5" fill={p.ink} />
          </g>
          <IsoWindow face="right" plane={M.x + M.w + 0.01} a={CV.y0 - 0.1} z={CV.z - 0.15} w={CV.y1 - CV.y0 + 0.2} h={0.75} fill={p.ink} u={U} ink={ink} />
          <IsoWindow face="right" plane={M.x + M.w + 0.02} a={CV.y0 - 0.2} z={CV.z + 0.6} w={CV.y1 - CV.y0 + 0.4} h={0.14} fill={p.line1} u={U} ink={ink} />
          <IsoWindow face="right" plane={M.x + M.w + 0.01} a={M.y + 3.1} z={0.2} w={0.22} h={3.6} fill={shade(p.line2, -0.1)} u={U} ink={ink} />

          {/* hopper (open frustum) on the roof */}
          <Face u={U} ink={ink} fill={shade(p.line1, -0.3)} p={[[2.9, 4.6, 4.42], [4.1, 4.6, 4.42], [4.8, 5.3, 5.6], [2.2, 5.3, 5.6]]} />
          <Face u={U} ink={ink} fill={shade(p.line1, -0.12)} p={[[4.1, 3.4, 4.42], [4.1, 4.6, 4.42], [4.8, 5.3, 5.6], [4.8, 2.7, 5.6]]} />
          <Face u={U} ink={{ stroke: p.ink, strokeWidth: 2 }} fill={shade(p.ink, 0.15)} p={[[2.2, 2.7, 5.6], [4.8, 2.7, 5.6], [4.8, 5.3, 5.6], [2.2, 5.3, 5.6]]} />
          {/* exhaust chimney with steam */}
          <IsoCylinder x={2.0} y={2.4} z={M.h + 0.22} r={0.28} h={1.5} color={shade(p.body, -0.1)} u={U} ink={ink} />
          {[0, 1, 2].map((i) => {
            const [cx, cy] = iso([2.0, 2.4, M.h + 1.8], U);
            return (
              <circle key={`st${i}`} cx={cx} cy={cy} r="8" fill="#FFFFFF" opacity="0">
                <animate attributeName="cy" values={`${cy};${cy - 70}`} dur="2s" begin={`-${(i * 2) / 3}s`} repeatCount="indefinite" />
                <animate attributeName="r" values="6;20" dur="2s" begin={`-${(i * 2) / 3}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;0.8;0" dur="2s" begin={`-${(i * 2) / 3}s`} repeatCount="indefinite" />
              </circle>
            );
          })}
        </g>

        {/* ── Glass brief tube dropping into the hopper (screen space) ── */}
        <g>
          <rect x={tubeTop[0] - tubeRx} y={-20} width={tubeRx * 2} height={tubeTop[1] + 20} fill={night ? hexWhite(0.12) : hexWhite(0.35)} stroke={p.ink} strokeWidth="1.6" />
          {[0, 1].map((i) => (
            <g key={`br${i}`} opacity="0">
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="2s" begin={`-${i}s`} repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values={`${tubeTop[0]} -20;${tubeTop[0]} ${tubeTop[1] - 6}`} dur="2s" begin={`-${i}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;1" keySplines="0.5 0 0.9 0.6" />
              <g transform={`rotate(${i ? 8 : -6})`}>
                <rect x="-13" y="-17" width="26" height="34" rx="2" fill="#FFFFFF" stroke={p.ink} strokeWidth="1.3" />
                <rect x="-8" y="-11" width="16" height="3" fill={p.line1} />
                <rect x="-8" y="-4" width="16" height="2" fill={p.ink} opacity="0.5" />
                <rect x="-8" y="1" width="12" height="2" fill={p.ink} opacity="0.5" />
                <rect x="-8" y="6" width="14" height="2" fill={p.ink} opacity="0.5" />
              </g>
            </g>
          ))}
          <rect x={tubeTop[0] - tubeRx * 0.55} y={-20} width={tubeRx * 0.35} height={tubeTop[1] + 20} fill="url(#bp-glass)" />
          <ellipse cx={tubeTop[0]} cy={tubeTop[1]} rx={tubeRx + 4} ry={tubeRx * 0.58 + 3} fill="none" stroke={p.ink} strokeWidth="5" />
          <ellipse cx={tubeTop[0]} cy={tubeTop[1]} rx={tubeRx + 4} ry={tubeRx * 0.58 + 3} fill="none" stroke={p.line1} strokeWidth="2.5" />
          {/* collar rings up the tube */}
          {[0.35, 0.68].map((f, i) => (
            <rect key={i} x={tubeTop[0] - tubeRx - 3} y={tubeTop[1] * f - 5} width={tubeRx * 2 + 6} height="10" rx="3" fill={p.ink} />
          ))}
        </g>

        <g transform={`translate(${OX} ${OY})`}>
          {/* ── Conveyor ── */}
          {/* press back legs */}
          <IsoBox x={PRESS_X - 0.45} y={CV.y0 - 0.5} w={0.16} d={0.16} h={2.7} color={p.ink} u={U} ink={ink} />
          <IsoBox x={PRESS_X + 0.3} y={CV.y0 - 0.5} w={0.16} d={0.16} h={2.7} color={p.ink} u={U} ink={ink} />
          {/* legs */}
          {[6, 8.6, 10].map((x, i) => (
            <IsoBox key={`lg${i}`} x={x} y={CV.y1 - 0.25} w={0.16} d={0.16} h={0.75} color={shade(p.ink, 0.25)} u={U} ink={ink} />
          ))}
          <IsoBox x={CV.x0} y={CV.y0} z={0.75} w={CV.x1 - CV.x0} d={CV.y1 - CV.y0} h={CV.z - 0.75} color={shade(p.ink, 0.35)} u={U} ink={ink} />
          {/* belt rails + moving cleats */}
          <g clipPath="url(#bp-belt)" transform={`translate(${-OX} ${-OY})`}>
            <g>
              <animateTransform attributeName="transform" type="translate" values={`0 0;${(C30 * U * 0.5).toFixed(2)} ${(U * 0.25).toFixed(2)}`} dur="0.5s" repeatCount="indefinite" />
              {Array.from({ length: 13 }, (_, k) => {
                const x = CV.x0 - 0.5 + k * 0.5;
                return <polyline key={k} points={poly([[x, CV.y0, CV.z], [x, CV.y1, CV.z]])} transform={`translate(${OX} ${OY})`} stroke={p.ink} strokeWidth="1.4" opacity="0.5" fill="none" />;
              })}
            </g>
          </g>
          <polyline points={poly([[CV.x0, CV.y1, CV.z + 0.02], [CV.x1, CV.y1, CV.z + 0.02]])} stroke={p.line1} strokeWidth="3" fill="none" />
        </g>

        {/* tiles: finished ads in different formats riding the belt (screen space) */}
        {tileShapes.map((t, i) => {
          const c = lines[i % 3];
          const corners: P3[] = [[-t.w / 2, -t.d / 2, 0], [t.w / 2, -t.d / 2, 0], [t.w / 2, t.d / 2, 0], [-t.w / 2, t.d / 2, 0]];
          const inner: P3[] = [[-t.w / 2 + 0.1, -t.d / 2 + 0.1, 0], [t.w / 2 - 0.1, -t.d / 2 + 0.1, 0], [t.w / 2 - 0.1, t.d / 2 - 0.25, 0], [-t.w / 2 + 0.1, t.d / 2 - 0.25, 0]];
          return (
            <g key={`tile${i}`}>
              <animateMotion dur="4s" begin={`-${i}s`} repeatCount="indefinite" path={`M${beltA[0].toFixed(1)},${(beltA[1] - 4).toFixed(1)} L${beltB[0].toFixed(1)},${(beltB[1] - 4).toFixed(1)}`} />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.92;1" dur="4s" begin={`-${i}s`} repeatCount="indefinite" />
              <polygon points={pts(corners.map(([a, b]) => [a, b, -0.1] as P3), U)} fill={p.ink} />
              <polygon points={pts(corners, U)} fill="#FFFFFF" stroke={p.ink} strokeWidth="1.2" />
              <polygon points={pts(inner, U)} fill={c} />
              <circle cx={iso([t.w / 2 - 0.25, -t.d / 2 + 0.3, 0], U)[0]} cy={iso([t.w / 2 - 0.25, -t.d / 2 + 0.3, 0], U)[1]} r="3" fill="#FFFFFF" />
            </g>
          );
        })}

        <g transform={`translate(${OX} ${OY})`}>
          {/* ── Stamp press: head drops onto each tile as it passes ── */}
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 0;0 14;0 0;0 0" keyTimes="0;0.04;0.22;1" dur="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.7 0 1 0.6;0.2 0.8 0.3 1;0 0 1 1" />
            <IsoBox x={PRESS_X - 0.15} y={3.85} z={1.95} w={0.3} d={0.3} h={0.6} color={shade(p.body, -0.2)} u={U} ink={ink} />
            <IsoBox x={PRESS_X - 0.42} y={3.6} z={1.62} w={0.84} d={0.8} h={0.36} color={p.line3} u={U} ink={ink} />
          </g>
          <IsoBox x={PRESS_X - 0.55} y={CV.y0 - 0.55} z={2.55} w={1.1} d={CV.y1 - CV.y0 + 1.1} h={0.3} color={p.line1} u={U} ink={ink} />
          {/* press front legs */}
          <IsoBox x={PRESS_X - 0.45} y={CV.y1 + 0.34} w={0.16} d={0.16} h={2.55} color={p.ink} u={U} ink={ink} />
          <IsoBox x={PRESS_X + 0.3} y={CV.y1 + 0.34} w={0.16} d={0.16} h={2.55} color={p.ink} u={U} ink={ink} />
          {/* stamp spark */}
          {(() => {
            const [x, y] = iso([PRESS_X, 4, CV.z + 0.05], U);
            return (
              <circle cx={x} cy={y} r="6" fill={p.glow} opacity="0" filter="url(#bp-glow)">
                <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.04;0.06;0.2;1" dur="1s" repeatCount="indefinite" />
                <animate attributeName="r" values="4;4;8;26;4" keyTimes="0;0.04;0.06;0.2;1" dur="1s" repeatCount="indefinite" />
              </circle>
            );
          })()}

          {/* ── Sorter ── */}
          <Shadow x={SO.x} y={SO.y} w={SO.w} d={SO.d} h={SO.h} />
          <IsoBox x={SO.x} y={SO.y} w={SO.w} d={SO.d} h={SO.h} color={p.line1} u={U} ink={{ stroke: p.ink, strokeWidth: 1.4 }} />
          <IsoBox x={SO.x - 0.08} y={SO.y - 0.08} z={SO.h} w={SO.w + 0.16} d={SO.d + 0.16} h={0.16} color={p.ink} u={U} ink={ink} />
          <IsoWindow face="left" plane={SO.y + SO.d + 0.01} a={SO.x + 0.25} z={1.35} w={SO.w - 0.5} h={0.6} fill={p.ink} u={U} ink={ink} />
          <LeftText at={[SO.x + SO.w / 2, SO.y + SO.d + 0.01, 1.5]} size={17} fill={shade(p.body, 0.2)} family={FONTS.shoulders} weight={900} spacing={2.5}>
            {p.sorter}
          </LeftText>
          {[0, 1, 2].map((i) => (
            <IsoWindow key={`vent${i}`} face="left" plane={SO.y + SO.d + 0.01} a={SO.x + 0.45 + i * 0.75} z={0.35} w={0.5} h={0.7} fill={shade(p.line1, -0.4)} u={U} ink={ink} />
          ))}
          <IsoWindow face="right" plane={SO.x + SO.w + 0.01} a={SO.y + 0.4} z={0.5} w={1.4} h={1.3} fill={p.ink} u={U} ink={ink} />
          {lines.map((c, i) => (
            <IsoWindow key={`ind${i}`} face="right" plane={SO.x + SO.w + 0.02} a={SO.y + 0.55 + i * 0.42} z={0.95} w={0.3} h={0.4} fill={c} u={U} ink={{ strokeWidth: 0 }}>
              <Flicker dur={LOOP / 4} seed={i + 11} low={0.4} />
            </IsoWindow>
          ))}
        </g>

        {/* ── Pneumatic tubes (screen space, drawn over the sorter) ── */}
        {tubes.map((t, i) => (
          <g key={`tube${i}`}>
            <path d={t.d} fill="none" stroke={p.ink} strokeWidth="28" strokeLinejoin="round" />
            <path d={t.d} fill="none" stroke={t.c} strokeWidth="21" strokeLinejoin="round" />
            <path d={t.d} fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinejoin="round" opacity="0.45" transform="translate(-4 -4)" />
            {[0, 1].map((k) => (
              <g key={k}>
                <animateMotion dur="2s" begin={`-${(k + i * 0.33).toFixed(2)}s`} repeatCount="indefinite" rotate="auto" path={t.d} />
                <rect x="-13" y="-6" width="26" height="12" rx="6" fill="#FFFFFF" stroke={p.ink} strokeWidth="1.5" />
                <rect x="-3" y="-6" width="6" height="12" fill={shade(t.c, -0.2)} />
              </g>
            ))}
            <ellipse cx={t.sx} cy={t.sy} rx="17" ry="8" fill={p.ink} />
            <ellipse cx={t.sx} cy={t.sy - 3} rx="16" ry="7" fill={shade(p.body, -0.15)} stroke={p.ink} strokeWidth="1.5" />
            {/* line tag riding on the tube near the frame edge */}
            <g transform={`translate(${unscaleX(1030 + i * 24)} ${t.ty - 34})`}>
              <rect x="0" y="0" width={t.label.length * 9.5 + 40} height="24" rx="12" fill={p.ink} />
              <circle cx="13" cy="12" r="6" fill={t.c} stroke={shade(p.body, 0.2)} strokeWidth="2" />
              <text x="26" y="17" fontFamily={FONTS.mono} fontWeight={700} fontSize="12" letterSpacing="1.2" fill={shade(p.body, 0.2)}>
                {t.label}
              </text>
              <line x1="20" y1="24" x2="20" y2="34" stroke={p.ink} strokeWidth="2" />
            </g>
          </g>
        ))}

        <g transform={`translate(${OX} ${OY})`}>
          {/* ── Front props: crate stack, lamp, plant ── */}
          <IsoBox x={11.0} y={6.0} w={1} d={1} h={0.8} color="#C98A4B" u={U} ink={ink} />
          <IsoBox x={12.1} y={6.1} w={0.9} d={0.9} h={0.7} color="#C98A4B" u={U} ink={ink} />
          <IsoBox x={11.2} y={6.15} z={0.8} w={0.8} d={0.8} h={0.65} color="#D99A5B" u={U} ink={ink} />
          <IsoWindow face="left" plane={7.0} a={11.25} z={0.25} w={0.5} h={0.3} fill={p.line3} u={U} ink={ink} />
          {(() => {
            const [gx, gy] = iso([9.3, 7.8, 0], U);
            const [hx, hy] = iso([9.3, 7.8, 2.0], U);
            return (
              <g>
                <ellipse cx={gx} cy={gy} rx="32" ry="16" fill="url(#bp-pool)" opacity={night ? 1 : 0.5} />
                <IsoCylinder x={9.3} y={7.8} r={0.05} h={1.95} color={p.ink} u={U} ink={{ stroke: p.ink, strokeWidth: 0.8 }} />
                <circle cx={hx} cy={hy} r="10" fill={p.glow} opacity={night ? 0.5 : 0.25} filter="url(#bp-glow)" />
                <circle cx={hx} cy={hy} r="5" fill={p.glow} stroke={p.ink} strokeWidth="1">
                  <Flicker dur={LOOP} seed={4} low={0.6} />
                </circle>
              </g>
            );
          })()}
          <IsoCylinder x={0.9} y={7.9} r={0.32} h={0.45} color={p.line1} u={U} ink={ink} />
          {(() => {
            const [tx, ty] = iso([0.9, 7.9, 0.95], U);
            return (
              <g>
                <circle cx={tx} cy={ty} r="16" fill={shade('#3FA34D', -0.1)} stroke={p.ink} strokeWidth="1.2" />
                <circle cx={tx - 5} cy={ty - 5} r="8" fill={shade('#3FA34D', 0.2)} />
              </g>
            );
          })()}

          {/* ── Moment: the sorter beacon fires and a tag pops ── */}
          <IsoCylinder x={SO.x + SO.w / 2} y={SO.y + SO.d / 2} z={SO.h + 0.16} r={0.16} h={0.4} color={p.body} u={U} ink={ink} />
        </g>
        <circle cx={beacon[0]} cy={beacon[1]} r="18" fill={p.line3} opacity="0.25" filter="url(#bp-glow)">
          <animate attributeName="opacity" values="0.15;0.45;0.15" dur="1s" repeatCount="indefinite" />
        </circle>
        <circle cx={beacon[0]} cy={beacon[1]} r="7" fill={p.line3} stroke={p.ink} strokeWidth="1.2" />
        <circle cx={beacon[0]} cy={beacon[1]} r="70" fill="url(#bp-flare)" opacity="0">
          <animate attributeName="opacity" values="0;0;1;0.35;0;0" keyTimes={momentKT(0.012, 0.05, 0.1)} dur={`${LOOP}s`} repeatCount="indefinite" />
        </circle>
        <ellipse cx={beacon[0]} cy={beacon[1] + 80} rx="10" ry="5" fill="none" stroke={p.line3} strokeWidth="4" opacity="0">
          <animate attributeName="rx" values="10;10;10;300;300;300" keyTimes={momentKT(0.001, 0.18, 0.19)} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="ry" values="5;5;5;150;150;150" keyTimes={momentKT(0.001, 0.18, 0.19)} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;0.9;0;0;0" keyTimes={momentKT(0.001, 0.18, 0.19)} dur={`${LOOP}s`} repeatCount="indefinite" />
        </ellipse>
        <g opacity="0">
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={momentKT(0.02, 0.16, 0.22)} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0 12;0 12;0 -6;0 -20;0 -20;0 -20" keyTimes={momentKT(0.04, 0.2, 0.21)} dur={`${LOOP}s`} repeatCount="indefinite" {...sp} keySplines="0 0 1 1;0.2 0.8 0.3 1;0.4 0 0.6 1;0 0 1 1;0 0 1 1" />
          <rect x={beacon[0] - 78} y={beacon[1] - 66} width="156" height="34" rx="17" fill={p.line3} stroke={p.ink} strokeWidth="2" />
          <text x={beacon[0]} y={beacon[1] - 43} textAnchor="middle" fontFamily={FONTS.shoulders} fontWeight={900} fontSize="20" letterSpacing="1.5" fill="#FFFFFF">
            {p.tag}
          </text>
        </g>
      </g>
      </g>
    </svg>
  );
}

function hexWhite(a: number) {
  return `rgba(255,255,255,${a})`;
}
