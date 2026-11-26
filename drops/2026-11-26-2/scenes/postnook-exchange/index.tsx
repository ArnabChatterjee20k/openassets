import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Face, Flicker, IsoBox, IsoCylinder, IsoWindow, iso, pts, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Postnook Exchange',
  description:
    'Landing-page hero for an email-for-agents product: a floating post exchange with a wall of labelled pigeonholes, linked by mail routes to a human’s desk, a bot rack and an app server. Envelopes travel the routes, the robot blinks, tea steams, the webhook dish pings — and once per loop a letter drops into its pigeonhole and the flag pops.',
  tags: ['hero', 'isometric', 'email', 'agents', 'network', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1, 0.5 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Sign').default('POSTNOOK'),
  skyTop: color('Sky top').default('#DCE6C8'),
  skyBottom: color('Sky bottom').default('#F3F0DF'),
  grass: color('Platform top').default('#9DB86C'),
  stone: color('Platform rock').default('#A89A7C'),
  wood: color('Pigeonholes').default('#B8875A'),
  paper: color('Envelopes').default('#FAF8EE'),
  route: color('Mail routes').default('#6A8D3A'),
  brass: color('Brass & seals').default('#C9A227'),
  pop: color('Flag').default('#E85D3F'),
  glow: color('Lamp & screens').default('#FFE7A3'),
  ink: color('Outline').default('#1E2A1A'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { skyTop: '#3B2F4F', skyBottom: '#F2A97A', grass: '#7E9A5A', stone: '#7A5E5A', route: '#FFD27F', glow: '#FFD27F' },
  night: { skyTop: '#0E1A14', skyBottom: '#23402F', grass: '#4E8A5B', stone: '#4A4F45', wood: '#8A6440', route: '#B5E550', glow: '#FFE07A', paper: '#EAF2DC', ink: '#0A120D' },
  riso: { skyTop: '#F4EFE6', skyBottom: '#F4EFE6', grass: '#FF48B0', stone: '#0078BF', wood: '#FFE800', route: '#1F2A6B', brass: '#FF48B0', pop: '#0078BF', ink: '#1F2A6B' },
  frost: { skyTop: '#C9D8E2', skyBottom: '#EEF2F4', grass: '#A7C4D4', stone: '#8A97A0', wood: '#C9B79C', route: '#2F6F8F', pop: '#E4572E' },
};

type P = z.infer<typeof schema>;

const U = 38;
const LOOP = scene.loop;
const OX = 600;
const OY = 225;
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const spline = (n: number) => ({ calcMode: 'spline' as const, keySplines: Array(n).fill('0.45 0 0.55 1').join(';') });

/** A floating island: rock underside, stone slab, grass top with a lip. */
function Platform({ x, y, w, d, p, t = 1, depth = 2.4 }: { x: number; y: number; w: number; d: number; p: P; t?: number; depth?: number }) {
  const X = x + w;
  const Y = y + d;
  const apex: P3 = [x + w * 0.55, y + d * 0.55, -t - depth];
  const ink = { stroke: p.ink, strokeWidth: 1.4 };
  return (
    <g>
      <Face u={U} ink={ink} fill={shade(p.stone, -0.42)} p={[[x, Y, -t], [X, Y, -t], apex]} />
      <Face u={U} ink={ink} fill={shade(p.stone, -0.25)} p={[[X, y, -t], [X, Y, -t], apex]} />
      <IsoBox x={x} y={y} z={-t} w={w} d={d} h={t} color={p.stone} u={U} ink={ink} top={false} />
      <Face u={U} ink={ink} fill={p.grass} p={[[x, y, 0], [X, y, 0], [X, Y, 0], [x, Y, 0]]} />
      <Face u={U} ink={{ strokeWidth: 0 }} fill={shade(p.grass, -0.2)} p={[[x, Y, 0], [X, Y, 0], [X, Y, -0.22], [x, Y, -0.22]]} />
      <Face u={U} ink={{ strokeWidth: 0 }} fill={shade(p.grass, -0.1)} p={[[X, y, 0], [X, Y, 0], [X, Y, -0.22], [X, y, -0.22]]} />
    </g>
  );
}

/** Gentle vertical bob for a whole island. */
const Bob = ({ dur, begin, amp = 5, children }: { dur: number; begin: number; amp?: number; children: ReactNode }) => (
  <g>
    <animateTransform attributeName="transform" type="translate" values={`0 0;0 ${-amp};0 0`} keyTimes="0;0.5;1" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" {...spline(2)} />
    {children}
  </g>
);

function Envelope({ p, s = 1 }: { p: P; s?: number }) {
  return (
    <g transform={`scale(${s})`}>
      <rect x={-11} y={-7.5} width={22} height={15} rx={2} fill={p.paper} stroke={p.ink} strokeWidth={1.4} />
      <path d="M -10 -6.5 L 0 1 L 10 -6.5" fill="none" stroke={p.ink} strokeWidth={1.2} strokeLinejoin="round" />
      <circle cx={0} cy={1} r={2.2} fill={p.brass} />
    </g>
  );
}

function Sparkle({ x, y, r, c, begin, dur = 2 }: { x: number; y: number; r: number; c: string; begin: number; dur?: number }) {
  const d = `M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={d} fill={c}>
        <animateTransform attributeName="transform" type="scale" values="0.3;1;0.3" keyTimes="0;0.5;1" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.3;1;0.3" keyTimes="0;0.5;1" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
      </path>
    </g>
  );
}

/** Quadratic arc between two world points, bowed upward on screen. */
function route(a: P3, b: P3, lift: number) {
  const [ax, ay] = S(a);
  const [bx, by] = S(b);
  const cx = (ax + bx) / 2;
  const cy = Math.min(ay, by) - lift;
  return `M ${ax.toFixed(1)} ${ay.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
}

// Route anchors (world space)
const HUB_DESK: P3 = [3.4, 3.2, 1.9];
const A_DESK: P3 = [-4.4, 8.4, 1.2];
const B_RACK: P3 = [8.4, -4.4, 1.6];
const C_DISH: P3 = [10.2, 10.0, 2.4];
const HUB_FRONT: P3 = [5.6, 5.6, 0.8];
const HOLE: P3 = [1.5, 3.1, 1.9]; // the pigeonhole the moment's letter drops into

export default function PostnookExchange(p: P) {
  const ink = { stroke: p.ink, strokeWidth: 1.4 };
  const thin = { stroke: p.ink, strokeWidth: 1 };
  const night = parseInt(p.skyTop.slice(1, 3), 16) < 80;
  const rAH = route(A_DESK, HUB_DESK, 120);
  const rHB = route(HUB_DESK, B_RACK, 120);
  const rCH = route(C_DISH, HUB_FRONT, 70);
  const rBH = route(B_RACK, [4.6, 1.4, 1.4], 70);

  // Pigeonhole grid on the cabinet's right face (plane x = 1.5).
  const holes: ReactNode[] = [];
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 4; i++) {
      const a = 0.95 + i * 1.08;
      const z = 0.45 + j * 0.98;
      const filled = (i * 3 + j * 5) % 4 !== 0;
      holes.push(
        <g key={`${i}-${j}`}>
          <IsoWindow face="right" plane={1.5} a={a} z={z} w={0.86} h={0.74} fill={shade(p.wood, -0.62)} u={U} ink={thin} />
          {filled && <IsoWindow face="right" plane={1.52} a={a + 0.12} z={z + 0.02} w={0.62} h={0.42} fill={p.paper} u={U} ink={thin} />}
          <IsoWindow face="right" plane={1.52} a={a + 0.22} z={z - 0.16} w={0.42} h={0.1} fill={p.brass} u={U} ink={{ strokeWidth: 0 }} />
        </g>,
      );
    }
  }

  const [hx, hy] = S(HOLE);
  const [signX, signY] = S([1.52, 4.6, 3.6]);
  const [cupX, cupY] = S([-3.7, 8.2, 1.05]);
  const [lampX, lampY] = S([5.3, 5.3, 2.6]);
  const [aLampX, aLampY] = S([-5.4, 7.6, 2.1]);
  const [dishX, dishY] = S([10.1, 9.9, 2.2]);
  const [botX, botY] = S([9.0, -3.7, 1.6]);
  const [flagX, flagY] = S([1.0, 5.3, 3.4]);

  return (
    <svg viewBox={`0 0 ${scene.width} ${scene.height}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pn-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id="pn-sun">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="pn-pool">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <filter id="pn-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <pattern id="pn-dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.3" fill={p.ink} opacity={night ? 0.12 : 0.08} />
        </pattern>
      </defs>

      {/* Sky */}
      <rect width={scene.width} height={scene.height} fill="url(#pn-sky)" />
      <rect width={scene.width} height={scene.height} fill="url(#pn-dots)" />
      <circle cx={1105} cy={95} r={150} fill="url(#pn-sun)">
        <animate attributeName="r" values="140;160;140" dur="3s" repeatCount="indefinite" {...spline(2)} keyTimes="0;0.5;1" />
      </circle>
      <circle cx={1105} cy={95} r={42} fill={night ? '#F3F0DF' : p.glow} stroke={p.ink} strokeWidth={1.4} />
      {night && <circle cx={1122} cy={84} r={36} fill={p.skyTop} />}
      {[
        [130, 150, 0],
        [880, 330, -2],
        [300, 760, -4],
        [960, 720, -1],
      ].map(([x, y, b], i) => (
        <g key={i} opacity={night ? 0.25 : 0.9}>
          <animateTransform attributeName="transform" type="translate" values="0 0;26 0;0 0" keyTimes="0;0.5;1" dur="6s" begin={`${b}s`} repeatCount="indefinite" {...spline(2)} />
          <g transform={`translate(${x} ${y})`} fill={night ? '#DCE6C8' : '#FFFFFF'} stroke={p.ink} strokeWidth={1.2} strokeOpacity={0.35}>
            <ellipse cx={0} cy={0} rx={52} ry={16} />
            <ellipse cx={-14} cy={-12} rx={24} ry={16} />
            <ellipse cx={14} cy={-16} rx={28} ry={20} />
          </g>
        </g>
      ))}
      <Sparkle x={210} y={330} r={9} c={p.brass} begin={0} />
      <Sparkle x={1080} y={470} r={7} c={p.route} begin={-0.7} />
      <Sparkle x={760} y={90} r={8} c={p.brass} begin={-1.3} />
      <Sparkle x={460} y={130} r={6} c={p.route} begin={-0.4} dur={1.5} />

      <g transform={`translate(${OX} ${OY})`}>
        {/* Routes behind the hub (to the back islands) */}
        {[rAH, rHB, rBH].map((d, i) => (
          <path key={i} d={d} fill="none" stroke={p.route} strokeWidth={4} strokeDasharray="2 10" strokeLinecap="round" opacity={0.85}>
            <animate attributeName="stroke-dashoffset" values="24;0" dur="1s" repeatCount="indefinite" />
          </path>
        ))}

        {/* --- Island B: the bot rack (back right) --- */}
        <Bob dur={3} begin={-1}>
          <Platform x={7} y={-6} w={3.2} d={3.2} p={p} />
          <IsoBox x={7.3} y={-5.7} w={1.0} d={1.3} h={2.3} color={shade(p.ink, 0.25)} u={U} ink={ink} />
          {[0, 1, 2, 3].map((k) => (
            <g key={k}>
              <IsoWindow face="right" plane={8.31} a={-5.55} z={0.35 + k * 0.5} w={1.0} h={0.3} fill={shade(p.ink, 0.12)} u={U} ink={thin} />
              <IsoWindow face="right" plane={8.32} a={-5.4 + (k % 2) * 0.3} z={0.43 + k * 0.5} w={0.14} h={0.14} fill={k % 2 ? p.route : p.glow} u={U} ink={{ strokeWidth: 0 }}>
                <Flicker dur={k % 2 ? 1.5 : 2} seed={k + 3} low={0.2} />
              </IsoWindow>
            </g>
          ))}
          {/* the robot sorter */}
          <IsoBox x={8.7} y={-4.0} w={0.7} d={0.7} h={0.6} color={shade(p.paper, -0.12)} u={U} ink={ink} />
          <IsoBox x={8.6} y={-4.1} z={0.6} w={0.9} d={0.9} h={0.75} color={p.paper} u={U} ink={ink} />
          <g>
            <IsoWindow face="right" plane={9.51} a={-3.95} z={0.85} w={0.6} h={0.36} fill={p.ink} u={U} ink={thin} />
            {[0, 1].map((e) => (
              <IsoWindow key={e} face="right" plane={9.52} a={-3.85 + e * 0.28} z={0.95} w={0.12} h={0.16} fill={p.glow} u={U} ink={{ strokeWidth: 0 }}>
                <animate attributeName="opacity" values="1;1;0.05;1;1" keyTimes="0;0.6;0.63;0.66;1" dur="3s" repeatCount="indefinite" />
              </IsoWindow>
            ))}
          </g>
          <line x1={botX} y1={botY - 12} x2={botX} y2={botY - 30} stroke={p.ink} strokeWidth={1.6} />
          <circle cx={botX} cy={botY - 33} r={4.5} fill={p.pop} stroke={p.ink} strokeWidth={1.2}>
            <animate attributeName="r" values="4.5;6;4.5" dur="1s" repeatCount="indefinite" />
          </circle>
        </Bob>

        {/* --- Island A: the human's desk (back left) --- */}
        <Bob dur={3} begin={0}>
          <Platform x={-6.2} y={7} w={3.4} d={3.2} p={p} />
          {/* lamp post */}
          <IsoCylinder x={-5.4} y={7.6} r={0.06} h={2.0} color={shade(p.ink, 0.3)} u={U} ink={thin} />
          <circle cx={aLampX} cy={aLampY} r={26} fill="url(#pn-pool)">
            <Flicker dur={LOOP} seed={2} low={0.5} />
          </circle>
          <circle cx={aLampX} cy={aLampY} r={6} fill={p.glow} stroke={p.ink} strokeWidth={1.2} />
          {/* desk + laptop + tea */}
          <IsoBox x={-5.0} y={7.8} w={1.8} d={1.0} h={1.0} color={p.wood} u={U} ink={ink} />
          <Face u={U} ink={thin} fill={shade(p.ink, 0.35)} p={[[-4.6, 8.0, 1.0], [-3.9, 8.0, 1.0], [-3.9, 8.55, 1.0], [-4.6, 8.55, 1.0]]} />
          <Face u={U} ink={thin} fill={p.glow} p={[[-4.6, 8.0, 1.0], [-3.9, 8.0, 1.0], [-3.9, 8.0, 1.5], [-4.6, 8.0, 1.5]]}>
            <Flicker dur={2} seed={7} low={0.75} />
          </Face>
          <IsoCylinder x={-3.55} y={8.25} z={1.0} r={0.14} h={0.18} color={p.paper} u={U} ink={thin} />
          {[0, 1].map((k) => (
            <path key={k} d={`M ${cupX - 3 + k * 6} ${cupY - 8} q -4 -6 0 -12 q 4 -6 0 -12`} fill="none" stroke={p.ink} strokeOpacity={0.45} strokeWidth={1.4} strokeLinecap="round">
              <animate attributeName="opacity" values="0;0.9;0" dur="2s" begin={`${-k}s`} repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values="0 4;0 -8" dur="2s" begin={`${-k}s`} repeatCount="indefinite" />
            </path>
          ))}
          {/* the human, standing at the desk */}
          <IsoCylinder x={-3.6} y={9.4} r={0.3} h={0.95} color={p.route} u={U} ink={ink} />
          <circle cx={S([-3.6, 9.4, 1.25])[0]} cy={S([-3.6, 9.4, 1.25])[1]} r={8.5} fill="#E9C3A0" stroke={p.ink} strokeWidth={1.3} />
          <IsoCylinder x={-2.9} y={7.6} r={0.25} h={0.35} color={shade(p.wood, -0.2)} u={U} ink={thin} cone={{ h: 0.9, color: p.grass }} />
        </Bob>

        {/* --- The hub: Postnook exchange --- */}
        <Platform x={0} y={0} w={6} d={6} p={p} t={1.2} depth={3.2} />
        {/* soft shadow of the cabinet */}
        <polygon points={poly([[1.5, 0.7, 0.02], [2.9, 1.2, 0.02], [2.9, 5.8, 0.02], [1.5, 5.3, 0.02]])} fill={p.ink} opacity={0.18} filter="url(#pn-blur)" />
        {/* pigeonhole cabinet */}
        <IsoBox x={0.5} y={0.7} w={1.0} d={4.6} h={3.4} color={p.wood} u={U} ink={ink} />
        {holes}
        {/* sign board on the cabinet */}
        <IsoBox x={0.7} y={1.4} z={3.4} w={0.8} d={3.4} h={0.65} color={p.paper} u={U} ink={ink} />
        <text transform={`matrix(0.866 -0.5 0 1 ${signX} ${signY})`} fontFamily={FONTS.youngserif} fontSize={U * 0.5} fill={p.ink} textLength={U * 2.9} lengthAdjust="spacingAndGlyphs">
          {p.sign}
        </text>
        {/* the moment: a letter drops into its pigeonhole, the flag pops */}
        <g opacity="0">
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.5;0.51;0.62;0.66;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          <g transform={`translate(${hx + 8} ${hy - 10})`}>
            <animateTransform attributeName="transform" type="translate" values={`${hx + 8} ${hy - 40};${hx + 8} ${hy - 40};${hx + 8} ${hy - 6};${hx + 8} ${hy - 6}`} keyTimes="0;0.5;0.55;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <Envelope p={p} s={1.2} />
          </g>
        </g>
        <g transform={`translate(${flagX} ${flagY})`}>
          <line x1={0} y1={0} x2={0} y2={-48} stroke={p.ink} strokeWidth={2.4} />
          <g>
            <animateTransform attributeName="transform" type="rotate" values="80;80;-8;4;0;0;80" keyTimes="0;0.53;0.57;0.6;0.62;0.92;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <path d="M 0 -48 L 32 -39 L 0 -29 Z" fill={p.pop} stroke={p.ink} strokeWidth={1.5} strokeLinejoin="round" />
          </g>
          <circle cx={0} cy={-44} r={30} fill="none" stroke={p.pop} strokeWidth={3} opacity="0">
            <animate attributeName="r" values="8;8;48;48" keyTimes="0;0.55;0.65;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes="0;0.55;0.56;0.66;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          </circle>
        </g>
        {/* sorting desk with the postmark press */}
        <IsoBox x={2.7} y={2.0} w={1.6} d={2.4} h={1.1} color={shade(p.wood, 0.18)} u={U} ink={ink} />
        <IsoBox x={2.9} y={3.7} z={1.1} w={0.7} d={0.5} h={0.12} color={p.paper} u={U} ink={thin} />
        <IsoBox x={2.95} y={3.72} z={1.22} w={0.62} d={0.46} h={0.1} color={p.paper} u={U} ink={thin} />
        <IsoCylinder x={3.6} y={2.6} z={1.1} r={0.32} h={0.12} color={p.brass} u={U} ink={thin} />
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 -10;0 -10;0 0;0 -10" keyTimes="0;0.6;0.7;1" dur="1.5s" repeatCount="indefinite" />
          <IsoCylinder x={3.6} y={2.6} z={1.3} r={0.22} h={0.5} color={shade(p.ink, 0.35)} u={U} ink={thin} />
          <circle cx={S([3.6, 2.6, 2.0])[0]} cy={S([3.6, 2.6, 2.0])[1]} r={7} fill={p.pop} stroke={p.ink} strokeWidth={1.2} />
        </g>
        {/* potted plant + lamp post */}
        <IsoCylinder x={5.1} y={0.9} r={0.32} h={0.4} color={shade(p.wood, -0.25)} u={U} ink={thin} cone={{ h: 1.3, color: shade(p.grass, -0.15) }} />
        <IsoCylinder x={5.3} y={5.3} r={0.06} h={2.5} color={shade(p.ink, 0.3)} u={U} ink={thin} />
        <circle cx={lampX} cy={lampY} r={34} fill="url(#pn-pool)">
          <Flicker dur={LOOP} seed={5} low={0.55} />
        </circle>
        <circle cx={lampX} cy={lampY} r={7} fill={p.glow} stroke={p.ink} strokeWidth={1.2} />
        <polygon points={poly([[4.6, 4.6, 0.02], [6, 4.6, 0.02], [6, 6, 0.02], [4.6, 6, 0.02]])} fill={p.glow} opacity={0.25} filter="url(#pn-blur)" />

        {/* Route to the front island (drawn over the hub's edge) */}
        <path d={rCH} fill="none" stroke={p.route} strokeWidth={4} strokeDasharray="2 10" strokeLinecap="round" opacity={0.85}>
          <animate attributeName="stroke-dashoffset" values="24;0" dur="1s" repeatCount="indefinite" />
        </path>

        {/* --- Island C: app server + webhook dish (front) --- */}
        <Bob dur={2} begin={-0.5} amp={4}>
          <Platform x={9} y={9} w={3} d={3} p={p} />
          <IsoBox x={9.4} y={9.4} w={1.5} d={1.3} h={1.4} color={p.paper} u={U} ink={ink} />
          {[0, 1].map((k) => (
            <IsoWindow key={k} face="left" plane={10.7} a={9.6 + k * 0.65} z={0.4} w={0.45} h={0.6} fill={p.glow} u={U} ink={thin}>
              <Flicker dur={3} seed={k + 11} low={0.6} />
            </IsoWindow>
          ))}
          <IsoWindow face="right" plane={10.9} a={9.6} z={0.5} w={0.9} h={0.18} fill={p.route} u={U} ink={{ strokeWidth: 0 }} />
          <line x1={dishX} y1={dishY + 6} x2={dishX} y2={dishY - 10} stroke={p.ink} strokeWidth={2} />
          <g transform={`translate(${dishX} ${dishY - 14})`}>
            {[0, 1].map((k) => (
              <circle key={k} cx={0} cy={0} r={10} fill="none" stroke={p.route} strokeWidth={2}>
                <animate attributeName="r" values="10;42" dur="1.5s" begin={`${-k * 0.75}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0" dur="1.5s" begin={`${-k * 0.75}s`} repeatCount="indefinite" />
              </circle>
            ))}
            <g>
              <animateTransform attributeName="transform" type="scale" values="1 1;0.35 1;1 1" keyTimes="0;0.5;1" dur="3s" repeatCount="indefinite" {...spline(2)} />
              <ellipse cx={0} cy={0} rx={15} ry={9} fill={p.paper} stroke={p.ink} strokeWidth={1.4} transform="rotate(-25)" />
              <circle cx={0} cy={0} r={2.6} fill={p.pop} />
            </g>
          </g>
        </Bob>

        {/* Envelopes travelling the routes */}
        {[
          { d: rHB, dur: 3, begin: 0 },
          { d: rHB, dur: 3, begin: -1.5 },
          { d: rCH, dur: 2, begin: -0.4 },
          { d: rBH, dur: 3, begin: -0.8 },
          { d: rAH, dur: 3, begin: -2.2 },
        ].map((e, i) => (
          <g key={i}>
            <animateMotion path={e.d} dur={`${e.dur}s`} begin={`${e.begin}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.85;1" dur={`${e.dur}s`} begin={`${e.begin}s`} repeatCount="indefinite" />
            <Envelope p={p} s={1.25} />
          </g>
        ))}
        {/* the moment's letter: flies from the human's desk to its pigeonhole */}
        <g opacity="0">
          <animateMotion path={route(A_DESK, [HOLE[0], HOLE[1], HOLE[2] + 1.2], 150)} keyPoints="0;0;1;1" keyTimes="0;0.2;0.5;1" calcMode="linear" dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.2;0.24;0.48;0.5;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          <Envelope p={p} s={1.5} />
        </g>
        {/* sparkle burst on arrival */}
        <g transform={`translate(${hx + 30} ${hy - 50})`} opacity="0">
          <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.55;0.58;0.7;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          {[0, 1, 2, 3, 4, 5].map((k) => {
            const a = (k / 6) * Math.PI * 2;
            return (
              <line key={k} x1={Math.cos(a) * 14} y1={Math.sin(a) * 14} x2={Math.cos(a) * 32} y2={Math.sin(a) * 32} stroke={p.brass} strokeWidth={4} strokeLinecap="round" />
            );
          })}
        </g>
      </g>
    </svg>
  );
}
