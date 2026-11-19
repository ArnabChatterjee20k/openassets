import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Night Shift Desk',
  description:
    'Empty-state and "while you sleep" hero for Crossfade: a cutaway isometric room at 2:47 a.m. The chair is pushed back and the mug still steams, but the laptop keeps riding the faders. Moment: the phone buzzes, a notification pops ("Agent moved $1.2k → TikTok"), the meters peak and a shooting star crosses the desert window.',
  tags: ['hero', 'isometric', 'animated svg', 'desk', 'still life', 'night', 'ads'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1, 0.5 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  notification: text('Notification').default('Agent moved $1.2k → TikTok'),
  result: text('Result tag').default('ROAS 4.2×'),
  clock: text('Clock').default('02:47'),
  sign: text('Neon sign').default('ALWAYS ON'),
  night: color('Backdrop').default('#2B1B2E'),
  wall: color('Walls').default('#45293F'),
  floor: color('Floor').default('#5A3448'),
  wood: color('Desk').default('#C9845F'),
  body: color('Devices').default('#FFE9D6'),
  accent: color('Faders & meters').default('#FF8E5E'),
  neon: color('Neon').default('#E5487A'),
  gold: color('Lamp & peaks').default('#FFD27F'),
  sky: color('Window sky').default('#1C1030'),
  stars: toggle('Stars').default(true),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dawn: { night: '#F3D9C6', wall: '#E8B887', floor: '#C8745A', wood: '#8A4E3A', sky: '#FFB27F', body: '#FFFFFF', accent: '#E5487A', neon: '#C2283C', gold: '#FFF4D6', clock: '06:12', stars: false },
  ultraviolet: { night: '#12001F', wall: '#24003D', floor: '#3A0060', wood: '#6B3A8C', sky: '#0A0014', body: '#FBEFFF', accent: '#FF2E88', neon: '#B026FF', gold: '#FFD600' },
  'ink-gold': { night: '#0D0D0F', wall: '#1C1C20', floor: '#2A2620', wood: '#8A7A5C', sky: '#0A0A0C', body: '#F3EDE2', accent: '#C9A45C', neon: '#C9A45C', gold: '#E8D9B5', sign: 'MIXING' },
  acid: { night: '#0B0B0B', wall: '#1A1A1A', floor: '#242424', wood: '#4A4A4A', sky: '#050505', body: '#F0FFE0', accent: '#C6FF00', neon: '#FF00E5', gold: '#00F0FF', notification: 'Agent paused 2 tired ads', result: 'CPA −18%' },
};

type P = z.infer<typeof schema>;

const U = 46;
const LOOP = scene.loop;
const OX = 600;
const OY = 372;
const INK = 'rgba(24,10,22,0.6)';
const C30 = Math.cos(Math.PI / 6);
const MOMENT = 0.5; // the buzz, as a fraction of the loop
const DESK_Z = 2.9;

const S = (p: P3): [number, number] => {
  const [x, y] = iso(p, U);
  return [x + OX, y + OY];
};
const poly = (ps: P3[]) =>
  pts(ps, U)
    .split(' ')
    .map((pair) => {
      const [a, b] = pair.split(',').map(Number);
      return `${(a + OX).toFixed(2)},${(b + OY).toFixed(2)}`;
    })
    .join(' ');
const ink = { stroke: INK };

/** SVG transform for drawing flat content in a world plane. Content px: 1 unit = U. */
const planeY = (p: P3) => {
  const [x, y] = S(p);
  return `translate(${x} ${y}) matrix(${C30}, 0.5, 0, 1, 0, 0)`; // along +x, down = −z
};
const planeX = (p: P3) => {
  const [x, y] = S(p);
  return `translate(${x} ${y}) matrix(${C30}, -0.5, 0, 1, 0, 0)`; // along −y, down = −z
};
const planeZ = (p: P3) => {
  const [x, y] = S(p);
  return `translate(${x} ${y}) matrix(${C30}, 0.5, ${-C30}, 0.5, 0, 0)`; // a along +x, b along +y
};

/** Times/values for something that spikes at the moment and is calm otherwise. */
const momentAnim = (calm: string, peak: string, hold = 0.14) => ({
  values: `${calm};${calm};${peak};${peak};${calm};${calm}`,
  keyTimes: `0;${MOMENT - 0.01};${MOMENT + 0.02};${MOMENT + hold};${MOMENT + hold + 0.04};1`,
  dur: `${LOOP}s`,
  repeatCount: 'indefinite',
});

function Box(props: { x: number; y: number; z?: number; w: number; d: number; h: number; color: string }) {
  const { x, y, z = 0, w, d, h, color } = props;
  // IsoBox works around the origin; shift it to the scene origin.
  return (
    <g transform={`translate(${OX} ${OY})`}>
      <IsoBox x={x} y={y} z={z} w={w} d={d} h={h} color={color} u={U} ink={ink} />
    </g>
  );
}

function Stars({ p }: { p: P }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const sx = 6 + rand(i * 3.1) * 150;
    const sy = 6 + rand(i * 7.7) * 70;
    const d = [1, 1.5, 2, 3][i % 4];
    out.push(
      <circle key={i} cx={sx} cy={sy} r={0.7 + rand(i * 1.9) * 1.1} fill={p.body}>
        <animate attributeName="opacity" values="0.9;0.25;0.9" dur={`${d}s`} begin={`-${(rand(i * 5.3) * d).toFixed(2)}s`} repeatCount="indefinite" />
      </circle>,
    );
  }
  return <g>{out}</g>;
}

export default function NightShiftDesk(p: P) {
  // ---- window (on the back-right wall, plane y = 0) ----
  const WIN = { x: 2.4, z: 4.35, w: 3.6, h: 2.5 };
  const winW = WIN.w * U;
  const winH = WIN.h * U;
  // ---- laptop ----
  const LAP = { x: 3.5, y: 1.0, w: 2.9, d: 1.6 };
  const scrW = LAP.w * U;
  const scrH = 1.75 * U;
  const STRIPS = 7;

  const [phx, phy] = S([7.1, 2.1, DESK_Z + 0.08]);
  const [mgx, mgy] = S([7.75, 0.95, DESK_Z]);
  const [lpx, lpy] = S([3.3, 1.3, DESK_Z]);
  const note = p.notification.slice(0, 34);
  const cardW = 96 + note.length * 11.2; // Syne 800 runs wide
  const [ctx, cty] = S([5.2, 6.4, 0]); // the cat on the rug

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <radialGradient id="ns-bg" cx="0.5" cy="0.4" r="0.8">
          <stop offset="0" stopColor={shade(p.night, 0.1)} />
          <stop offset="1" stopColor={shade(p.night, -0.35)} />
        </radialGradient>
        <linearGradient id="ns-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky} />
          <stop offset="0.75" stopColor={shade(p.neon, -0.45)} />
          <stop offset="1" stopColor={shade(p.accent, -0.2)} />
        </linearGradient>
        <radialGradient id="ns-lamp">
          <stop offset="0" stopColor={p.gold} stopOpacity="0.75" />
          <stop offset="0.5" stopColor={p.gold} stopOpacity="0.22" />
          <stop offset="1" stopColor={p.gold} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ns-screen">
          <stop offset="0" stopColor={p.accent} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ns-phone">
          <stop offset="0" stopColor={p.neon} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.neon} stopOpacity="0" />
        </radialGradient>
        <filter id="ns-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ns-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="ns-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <clipPath id="ns-win">
          <rect x="0" y="0" width={winW} height={winH} />
        </clipPath>
        <clipPath id="ns-scr">
          <rect x="0" y="0" width={scrW} height={scrH} rx="4" />
        </clipPath>
      </defs>

      {/* ---------- backdrop ---------- */}
      <rect width="1200" height="900" fill="url(#ns-bg)" />
      <g opacity="0.14">
        {Array.from({ length: 22 }, (_, i) => (
          <circle key={i} cx={60 + (i % 11) * 108} cy={i < 11 ? 760 : 820} r="1.6" fill={p.body} />
        ))}
      </g>
      <circle cx="980" cy="160" r="260" fill={p.neon} opacity="0.12" filter="url(#ns-blur)" />
      <circle cx="220" cy="760" r="300" fill={p.accent} opacity="0.1" filter="url(#ns-blur)" />

      {/* ---------- room shell: floor slab and two walls ---------- */}
      <polygon points={poly([[0, 10.6, -0.6], [10.6, 10.6, -0.6], [10.6, 0, -0.6], [10.6, 0, 0], [10.6, 10.6, 0], [0, 10.6, 0]])} fill="#000" opacity="0.25" filter="url(#ns-blur)" transform="translate(0 26)" />
      <Box x={-0.4} y={-0.4} z={-0.6} w={10.8} d={10.8} h={0.6} color={shade(p.floor, -0.25)} />
      <polygon points={poly([[0, 0, 0], [10.4, 0, 0], [10.4, 10.4, 0], [0, 10.4, 0]])} fill={p.floor} stroke={INK} strokeWidth="1" />
      {/* floorboards */}
      <g stroke={shade(p.floor, -0.18)} strokeWidth="1" opacity="0.7">
        {Array.from({ length: 10 }, (_, i) => {
          const [a1, b1] = S([0, i + 1, 0]);
          const [a2, b2] = S([10.4, i + 1, 0]);
          return <line key={i} x1={a1} y1={b1} x2={a2} y2={b2} />;
        })}
      </g>
      {/* left wall (plane x = 0) */}
      <polygon points={poly([[0, 0, 0], [0, 10.4, 0], [0, 10.4, 7.2], [0, 0, 7.2]])} fill={shade(p.wall, -0.12)} stroke={INK} strokeWidth="1" />
      <polygon points={poly([[-0.4, -0.4, 7.2], [0, -0.4, 7.2], [0, 10.4, 7.2], [-0.4, 10.4, 7.2]])} fill={shade(p.wall, 0.2)} stroke={INK} strokeWidth="1" />
      <polygon points={poly([[0, 10.4, 0], [-0.4, 10.4, 0], [-0.4, 10.4, 7.2], [0, 10.4, 7.2]])} fill={shade(p.wall, -0.35)} stroke={INK} strokeWidth="1" />
      {/* back wall (plane y = 0) */}
      <polygon points={poly([[0, 0, 0], [10.4, 0, 0], [10.4, 0, 7.2], [0, 0, 7.2]])} fill={p.wall} stroke={INK} strokeWidth="1" />
      <polygon points={poly([[0, -0.4, 7.2], [10.4, -0.4, 7.2], [10.4, 0, 7.2], [0, 0, 7.2]])} fill={shade(p.wall, 0.2)} stroke={INK} strokeWidth="1" />
      <polygon points={poly([[10.4, 0, 0], [10.4, -0.4, 0], [10.4, -0.4, 7.2], [10.4, 0, 7.2]])} fill={shade(p.wall, -0.2)} stroke={INK} strokeWidth="1" />
      {/* skirting boards */}
      <polygon points={poly([[0, 0, 0], [10.4, 0, 0], [10.4, 0, 0.3], [0, 0, 0.3]])} fill={shade(p.wall, -0.25)} />
      <polygon points={poly([[0, 0, 0], [0, 10.4, 0], [0, 10.4, 0.3], [0, 0, 0.3]])} fill={shade(p.wall, -0.32)} />

      {/* ---------- the window: desert night ---------- */}
      <g transform={planeY([WIN.x, 0, WIN.z + WIN.h])}>
        <rect x="-8" y="-8" width={winW + 16} height={winH + 16} rx="3" fill={shade(p.wall, 0.25)} stroke={INK} />
        <g clipPath="url(#ns-win)">
          <rect width={winW} height={winH} fill="url(#ns-sky)" />
          {p.stars && <Stars p={p} />}
          <circle cx={winW * 0.74} cy={winH * 0.3} r="22" fill={p.gold} opacity="0.18" />
          <circle cx={winW * 0.74} cy={winH * 0.3} r="12" fill={shade(p.gold, 0.5)} />
          {/* shooting star at the moment */}
          <line x1="0" y1="0" x2="-48" y2="-20" stroke={p.body} strokeWidth="3" strokeLinecap="round" opacity="0" filter="url(#ns-glow)">
            <animate attributeName="opacity" {...momentAnim('0', '1', 0.08)} />
            <animateMotion dur={`${LOOP}s`} repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes={`0;${MOMENT};${MOMENT + 0.1};1`} calcMode="linear" path={`M${winW * 0.25},${winH * 0.12} L${winW * 0.85},${winH * 0.38}`} />
          </line>
          {/* mesas */}
          <path d={`M0,${winH} L0,${winH * 0.72} L${winW * 0.12},${winH * 0.72} L${winW * 0.16},${winH * 0.62} L${winW * 0.36},${winH * 0.62} L${winW * 0.4},${winH * 0.74} L${winW * 0.62},${winH * 0.76} L${winW * 0.66},${winH * 0.68} L${winW * 0.82},${winH * 0.68} L${winW * 0.86},${winH * 0.8} L${winW},${winH * 0.8} L${winW},${winH} Z`} fill={shade(p.night, -0.3)} />
          <rect y={winH * 0.88} width={winW} height={winH * 0.12} fill={shade(p.night, -0.45)} />
        </g>
        {/* mullions */}
        <rect x={winW / 2 - 3} y="0" width="6" height={winH} fill={shade(p.wall, 0.25)} stroke={INK} strokeWidth="0.8" />
        <rect x="0" y={winH * 0.45 - 3} width={winW} height="6" fill={shade(p.wall, 0.25)} stroke={INK} strokeWidth="0.8" />
        {/* sill */}
        <rect x="-14" y={winH + 6} width={winW + 28} height="9" rx="2" fill={shade(p.wall, 0.35)} stroke={INK} strokeWidth="0.8" />
      </g>

      {/* ---------- wall shelf with clock and mini speakers ---------- */}
      <Box x={7.0} y={0} z={4.55} w={2.8} d={0.7} h={0.14} color={p.wood} />
      <Box x={7.2} y={0.1} z={4.69} w={0.55} d={0.5} h={0.75} color={shade(p.body, -0.05)} />
      <Box x={9.0} y={0.1} z={4.69} w={0.55} d={0.5} h={0.75} color={shade(p.body, -0.05)} />
      {[7.2, 9.0].map((x, i) => {
        const [cx, cy] = S([x + 0.27, 0.6, 5.0]);
        return (
          <g key={i} transform={`translate(${cx} ${cy}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
            <circle r="7" fill={shade(p.body, -0.55)} />
            <circle r="3" fill={p.accent}>
              <animate attributeName="r" values="3;4.4;3" dur="0.5s" repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}
      <Box x={7.95} y={0.15} z={4.69} w={0.85} d={0.42} h={0.5} color={shade(p.night, -0.2)} />
      <g transform={planeY([8.0, 0.57, 5.14])}>
        <text x="2" y="16" fontFamily={FONTS.spacemono} fontWeight="700" fontSize="14" fill={p.accent} filter="url(#ns-glow)">
          {p.clock.slice(0, 5)}
          <animate attributeName="opacity" values="1;1;0.6;1" keyTimes="0;0.5;0.52;1" dur="1s" repeatCount="indefinite" />
        </text>
      </g>

      {/* ---------- left wall: neon sign and framed gold record ---------- */}
      <g transform={planeX([0, 7.2, 5.9])}>
        <rect x="-10" y="-34" width={Math.max(150, p.sign.length * 21) + 20} height="50" rx="8" fill={shade(p.wall, -0.3)} opacity="0.7" />
        <text x="0" y="0" fontFamily={FONTS.monoton} fontSize="26" letterSpacing="2" fill={p.neon} filter="url(#ns-glow)">
          {p.sign.toUpperCase().slice(0, 12)}
          <Flicker dur={LOOP} seed={4} low={0.35} />
        </text>
      </g>
      <g transform={planeX([0, 3.6, 5.4])}>
        <rect x="0" y="0" width="76" height="76" rx="3" fill={shade(p.wood, -0.35)} stroke={INK} />
        <rect x="6" y="6" width="64" height="64" fill={shade(p.night, -0.2)} />
        <circle cx="38" cy="38" r="26" fill={p.gold} />
        <circle cx="38" cy="38" r="20" fill="none" stroke={shade(p.gold, -0.25)} strokeWidth="1" />
        <circle cx="38" cy="38" r="14" fill="none" stroke={shade(p.gold, -0.25)} strokeWidth="1" />
        <circle cx="38" cy="38" r="8" fill={p.neon} />
        <circle cx="38" cy="38" r="1.8" fill={shade(p.night, -0.3)} />
      </g>
      {/* neon spill on the wall */}
      <ellipse cx={S([0, 5.5, 5.6])[0]} cy={S([0, 5.5, 5.6])[1]} rx="120" ry="70" fill={p.neon} opacity="0.12" filter="url(#ns-blur)" />

      {/* ---------- moonlight on the floor ---------- */}
      <polygon points={poly([[2.4, 0.2, 0.01], [6.0, 0.2, 0.01], [7.4, 3.8, 0.01], [3.8, 3.8, 0.01]])} fill={p.gold} opacity="0.07" filter="url(#ns-soft)" />

      {/* ---------- rug ---------- */}
      <g transform={planeZ([3.2, 4.4, 0.01])}>
        <rect width={5.8 * U} height={3.8 * U} rx="10" fill={shade(p.neon, -0.35)} />
        <rect x="10" y="10" width={5.8 * U - 20} height={3.8 * U - 20} rx="6" fill="none" stroke={p.gold} strokeOpacity="0.5" strokeWidth="2" strokeDasharray="10 6" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={40 + i * 40} y="40" width="18" height={3.8 * U - 80} rx="4" fill={i === 2 ? p.gold : p.accent} opacity={0.35} />
        ))}
      </g>

      {/* ---------- corner cactus ---------- */}
      <g transform={`translate(${OX} ${OY})`}>
        <IsoCylinder x={1.0} y={1.0} r={0.5} h={0.9} color={p.accent} u={U} ink={ink} />
        <IsoCylinder x={1.0} y={1.0} r={0.24} h={3.2} z={0.9} color="#4F7A5A" u={U} ink={ink} />
      </g>
      {(() => {
        const [ax, ay] = S([1.0, 1.0, 2.6]);
        return (
          <g>
            <path d={`M${ax + 9},${ay} q20,0 20,-20 v-18`} stroke="#41664B" strokeWidth="12" strokeLinecap="round" fill="none" />
            <path d={`M${ax - 9},${ay + 18} q-16,0 -16,-16 v-10`} stroke="#3A5C44" strokeWidth="10" strokeLinecap="round" fill="none" />
            <circle cx={ax} cy={S([1.0, 1.0, 4.15])[1]} r="4" fill={p.neon} />
          </g>
        );
      })()}

      {/* ---------- record crate on the floor ---------- */}
      <Box x={0.4} y={5.2} w={1.6} d={1.7} h={1.0} color={p.wood} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const y = 5.35 + i * 0.25;
        const c = [p.neon, p.gold, p.accent, p.body, p.neon, p.accent][i];
        return <polygon key={i} points={poly([[0.5, y, 1.0], [1.9, y, 1.0], [1.9, y + 0.06, 1.55 + (i % 2) * 0.12], [0.5, y + 0.06, 1.55 + (i % 2) * 0.12]])} fill={shade(c, -0.1)} stroke={INK} strokeWidth="0.8" />;
      })}

      {/* ---------- desk: legs, drawer unit, top ---------- */}
      <Box x={2.2} y={0.15} w={0.18} d={0.18} h={2.6} color={shade(p.wood, -0.2)} />
      <Box x={2.2} y={2.95} w={0.18} d={0.18} h={2.6} color={shade(p.wood, -0.2)} />
      <Box x={7.1} y={0.1} w={1.5} d={3.0} h={2.6} color={shade(p.wood, -0.05)} />
      {[0.5, 1.35].map((z, i) => (
        <g key={i}>
          <polygon points={poly([[8.6, 0.3, z], [8.6, 2.9, z], [8.6, 2.9, z + 0.7], [8.6, 0.3, z + 0.7]])} fill={shade(p.wood, -0.12)} stroke={INK} strokeWidth="0.8" />
          {(() => {
            const [hx, hy] = S([8.6, 1.6, z + 0.45]);
            return <line x1={hx - 8} y1={hy + 4.6} x2={hx + 8} y2={hy - 4.6} stroke={p.gold} strokeWidth="3" strokeLinecap="round" />;
          })()}
        </g>
      ))}
      <Box x={2.0} y={0} z={2.6} w={6.8} d={3.3} h={0.3} color={p.wood} />
      {/* lamp light pool on the desk + screen spill */}
      <ellipse cx={lpx + 20} cy={lpy + 16} rx="150" ry="62" fill="url(#ns-lamp)">
        <animate attributeName="opacity" values="0.9;1;0.9" dur="3s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx={S([4.95, 2.2, DESK_Z])[0]} cy={S([4.95, 2.2, DESK_Z])[1]} rx="120" ry="44" fill="url(#ns-screen)" />

      {/* ---------- desk lamp ---------- */}
      <g transform={`translate(${OX} ${OY})`}>
        <IsoCylinder x={2.65} y={0.55} z={DESK_Z} r={0.32} h={0.12} color={p.body} u={U} ink={ink} />
      </g>
      {(() => {
        const [bx, by] = S([2.65, 0.55, DESK_Z + 0.12]);
        const [jx, jy] = S([2.5, 0.4, DESK_Z + 1.5]);
        const [hx, hy] = S([3.15, 1.0, DESK_Z + 2.1]);
        return (
          <g>
            <polyline points={`${bx},${by} ${jx},${jy} ${hx},${hy}`} fill="none" stroke={shade(p.body, -0.25)} strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={jx} cy={jy} r="4" fill={p.body} stroke={INK} />
            {/* light cone */}
            <polygon points={`${hx - 10},${hy + 8} ${hx + 26},${hy + 14} ${lpx + 110},${lpy + 30} ${lpx - 60},${lpy + 10}`} fill={p.gold} opacity="0.1" filter="url(#ns-soft)" />
            <path d={`M${hx - 20},${hy + 4} Q${hx},${hy - 22} ${hx + 30},${hy + 8} Q${hx + 6},${hy + 22} ${hx - 20},${hy + 4} Z`} fill={p.body} stroke={INK} />
            <ellipse cx={hx + 4} cy={hy + 12} rx="20" ry="7" fill={p.gold} filter="url(#ns-glow)" />
          </g>
        );
      })()}

      {/* ---------- laptop: screen in plane y = LAP.y, live mix on it ---------- */}
      <polygon points={poly([[LAP.x - 0.05, LAP.y - 0.08, DESK_Z + 0.12], [LAP.x + LAP.w + 0.05, LAP.y - 0.08, DESK_Z + 0.12], [LAP.x + LAP.w + 0.05, LAP.y - 0.08, DESK_Z + 2.0], [LAP.x - 0.05, LAP.y - 0.08, DESK_Z + 2.0]])} fill={shade(p.body, -0.2)} stroke={INK} />
      <g transform={planeY([LAP.x, LAP.y, DESK_Z + 1.93])}>
        <g clipPath="url(#ns-scr)">
          <rect width={scrW} height={scrH} fill={shade(p.night, -0.45)} />
          <rect width={scrW} height="13" fill={shade(p.night, -0.15)} />
          <text x="5" y="9.5" fontFamily={FONTS.spacemono} fontSize="7.5" fontWeight="700" letterSpacing="0.8" fill={p.body} opacity="0.85">
            CROSSFADE · LIVE MIX
          </text>
          <circle cx={scrW - 8} cy="6.5" r="3" fill={p.neon}>
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          </circle>
          {Array.from({ length: STRIPS }, (_, i) => {
            const sw = (scrW - 10) / STRIPS;
            const x0 = 5 + i * sw;
            const top = 20;
            const bot = scrH - 8;
            const rest = 0.3 + rand(i * 2.3) * 0.4;
            const capRest = bot - (bot - top) * rest;
            const segs = 7;
            const segH = (bot - top) / segs;
            return (
              <g key={i}>
                <rect x={x0 + sw * 0.28 - 1} y={top} width="2" height={bot - top} fill="#000" opacity="0.6" />
                <rect x={x0 + sw * 0.28 - 6} y={capRest - 3} width="12" height="6" rx="1.5" fill={i === 2 ? p.accent : p.body}>
                  <animateTransform attributeName="transform" type="translate" values={`0 0;0 ${-6 - (i % 3) * 3};0 0`} dur={`${[3, 6, 2][i % 3]}s`} begin={`-${(i * 0.4).toFixed(1)}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
                  <animateTransform attributeName="transform" type="translate" additive="sum" {...momentAnim('0 0', `0 ${-(capRest - top) + 4}`)} />
                </rect>
                {Array.from({ length: segs }, (_, s) => {
                  const c = s === segs - 1 ? p.gold : s >= segs - 3 ? p.neon : p.accent;
                  const lit = s < 2 + (i % 3);
                  return (
                    <rect key={s} x={x0 + sw * 0.6} y={bot - (s + 1) * segH + 1} width={sw * 0.24} height={segH - 2} rx="1" fill={c} opacity={lit ? 0.95 : 0.12}>
                      {!lit && s < 5 && <animate attributeName="opacity" values="0.12;0.95;0.12;0.12" keyTimes="0;0.15;0.5;1" dur="0.5s" begin={`-${((i * 0.07 + s * 0.03) % 0.5).toFixed(2)}s`} repeatCount="indefinite" />}
                      {s >= 5 && <animate attributeName="opacity" {...momentAnim('0.12', '1')} />}
                    </rect>
                  );
                })}
              </g>
            );
          })}
        </g>
        <rect width={scrW} height={scrH} rx="4" fill="none" stroke={INK} strokeWidth="1" />
      </g>
      {/* screen glow onto the wall */}
      <ellipse cx={S([4.95, 0, DESK_Z + 1.1])[0]} cy={S([4.95, 0, DESK_Z + 1.1])[1]} rx="130" ry="80" fill={p.accent} opacity="0.12" filter="url(#ns-blur)">
        <animate attributeName="opacity" {...momentAnim('0.12', '0.3')} />
      </ellipse>
      {/* base + keyboard */}
      <Box x={LAP.x} y={LAP.y} z={DESK_Z} w={LAP.w} d={LAP.d} h={0.12} color={p.body} />
      <g transform={planeZ([LAP.x + 0.25, LAP.y + 0.18, DESK_Z + 0.121])}>
        {Array.from({ length: 4 }, (_, r) =>
          Array.from({ length: 10 }, (_, c) => <rect key={`${r}-${c}`} x={c * 11.5} y={r * 9} width="9" height="7" rx="1.2" fill={shade(p.body, -0.25)} />),
        )}
        <rect x="38" y="40" width="40" height="22" rx="3" fill={shade(p.body, -0.12)} />
      </g>

      {/* ---------- headphones resting on the desk ---------- */}
      {(() => {
        const [ax, ay] = S([2.85, 2.25, DESK_Z + 0.05]);
        const [bx, by] = S([2.75, 3.05, DESK_Z + 0.05]);
        return (
          <g>
            <path d={`M${ax},${ay - 6} Q${(ax + bx) / 2 + 34},${(ay + by) / 2 - 20} ${bx},${by - 6}`} fill="none" stroke={shade(p.body, -0.3)} strokeWidth="7" strokeLinecap="round" />
            <ellipse cx={ax} cy={ay} rx="15" ry="9" fill={p.body} stroke={INK} />
            <ellipse cx={ax} cy={ay - 1} rx="9" ry="5" fill={p.accent} />
            <ellipse cx={bx} cy={by} rx="15" ry="9" fill={p.body} stroke={INK} />
            <ellipse cx={bx} cy={by - 1} rx="9" ry="5" fill={p.accent} />
          </g>
        );
      })()}

      {/* ---------- mug + steam ---------- */}
      <g transform={`translate(${OX} ${OY})`}>
        <IsoCylinder x={7.75} y={0.95} z={DESK_Z} r={0.32} h={0.6} color={p.neon} u={U} ink={ink} />
      </g>
      <path d={`M${mgx + 15},${mgy - 18} q12,2 10,12 q-2,8 -12,6`} fill="none" stroke={shade(p.neon, -0.2)} strokeWidth="4" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${mgx - 6 + i * 6},${mgy - 34} c-6,-10 6,-16 0,-26 c-6,-10 6,-16 0,-24`} fill="none" stroke={p.body} strokeWidth="2.4" strokeLinecap="round" opacity="0">
          <animate attributeName="opacity" values="0;0.55;0" dur="3s" begin={`-${i}s`} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0 6;0 -14" dur="3s" begin={`-${i}s`} repeatCount="indefinite" />
        </path>
      ))}

      {/* ---------- phone, face up; buzzes at the moment ---------- */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 0;-2 0;2 0;-2 0;2 0;0 0;0 0" keyTimes={`0;${MOMENT};${MOMENT + 0.01};${MOMENT + 0.02};${MOMENT + 0.03};${MOMENT + 0.04};${MOMENT + 0.05};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
        <ellipse cx={phx} cy={phy + 4} rx="58" ry="26" fill="url(#ns-phone)" opacity="0">
          <animate attributeName="opacity" {...momentAnim('0', '1', 0.3)} />
        </ellipse>
        <g transform={planeZ([6.75, 1.65, DESK_Z + 0.02])}>
          <rect width={0.75 * U} height={1.3 * U} rx="6" fill={shade(p.night, -0.4)} stroke={INK} strokeWidth="1.2" />
          <rect x="3" y="3" width={0.75 * U - 6} height={1.3 * U - 6} rx="4" fill={p.neon} opacity="0.08">
            <animate attributeName="opacity" {...momentAnim('0.08', '0.95', 0.3)} />
          </rect>
        </g>
      </g>

      {/* ---------- the cat, asleep on the rug (you should be too) ---------- */}
      <g transform={`translate(${ctx} ${cty})`}>
        <ellipse cx="0" cy="12" rx="40" ry="13" fill="#000" opacity="0.25" filter="url(#ns-soft)" />
        <path d="M28,6 C46,10 40,26 14,22" fill="none" stroke={shade(p.night, 0.25)} strokeWidth="9" strokeLinecap="round" />
        <g>
          <animateTransform attributeName="transform" type="scale" values="1 1;1.03 1.06;1 1" dur="3s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
          <ellipse cx="0" cy="0" rx="34" ry="20" fill={shade(p.night, 0.3)} stroke={INK} />
          <ellipse cx="-4" cy="-6" rx="20" ry="9" fill={shade(p.night, 0.42)} />
        </g>
        <g transform="translate(-26 -4)">
          <circle r="14" fill={shade(p.night, 0.35)} stroke={INK} />
          <path d="M-12,-6 L-10,-20 L-2,-12 Z M2,-13 L10,-20 L12,-6 Z" fill={shade(p.night, 0.35)} stroke={INK} strokeWidth="1" />
          <path d="M-8,0 q3,3 6,0 M2,0 q3,3 6,0" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
        </g>
        <text x="8" y="-30" fontFamily={FONTS.spacemono} fontWeight="700" fontSize="12" fill={p.body} opacity="0">
          z
          <animate attributeName="opacity" values="0;0.8;0" dur="3s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0 6;8 -12" dur="3s" repeatCount="indefinite" />
        </text>
        <text x="18" y="-42" fontFamily={FONTS.spacemono} fontWeight="700" fontSize="9" fill={p.body} opacity="0">
          z
          <animate attributeName="opacity" values="0;0.7;0" dur="3s" begin="-1.5s" repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0 6;8 -12" dur="3s" begin="-1.5s" repeatCount="indefinite" />
        </text>
      </g>

      {/* ---------- empty chair, pushed back ---------- */}
      <g transform={`translate(${OX} ${OY})`}>
        <IsoCylinder x={8.3} y={5.0} r={0.75} h={0.12} color={shade(p.body, -0.45)} u={U} ink={ink} />
        <IsoCylinder x={8.3} y={5.0} z={0.12} r={0.1} h={1.5} color={shade(p.body, -0.3)} u={U} ink={ink} />
      </g>
      <Box x={7.55} y={4.25} z={1.62} w={1.5} d={1.5} h={0.32} color={p.accent} />
      <Box x={7.6} y={5.6} z={1.94} w={1.4} d={0.24} h={1.9} color={p.accent} />

      {/* ---------- floating notification (screen-aligned UI) ---------- */}
      <g transform={`translate(${phx} ${phy - 150})`}>
        <g opacity="0">
          <animate attributeName="opacity" {...momentAnim('0', '1', 0.32)} />
          <animateTransform attributeName="transform" type="translate" {...momentAnim('0 16', '0 0', 0.32)} />
          <path d={`M-12,74 L0,90 L12,74`} fill={p.body} />
          <rect x={-cardW / 2} y="0" width={cardW} height="76" rx="16" fill={p.body} stroke={INK} />
          <rect x={-cardW / 2 + 12} y="14" width="48" height="48" rx="12" fill={p.night} />
          <text x={-cardW / 2 + 36} y="47" textAnchor="middle" fontFamily={FONTS.monoton} fontSize="26" fill={p.accent}>
            C
          </text>
          <text x={-cardW / 2 + 72} y="30" fontFamily={FONTS.spacemono} fontSize="11" fontWeight="700" letterSpacing="1.4" fill={shade(p.night, 0.1)} opacity="0.65">
            CROSSFADE · NOW
          </text>
          <text x={-cardW / 2 + 72} y="54" fontFamily={FONTS.syne} fontSize="14" fontWeight="800" fill={shade(p.night, -0.2)}>
            {note}
          </text>
          {p.result && (
            <g transform={`translate(${cardW / 2 - Math.max(84, p.result.length * 9 + 24) + 16} -14)`}>
              <rect x="-6" y="0" width={Math.max(84, p.result.length * 9 + 24)} height="28" rx="14" fill={p.gold} stroke={INK} />
              <text x={Math.max(84, p.result.length * 9 + 24) / 2 - 6} y="19" textAnchor="middle" fontFamily={FONTS.spacemono} fontWeight="700" fontSize="13" fill={shade(p.night, -0.3)}>
                {p.result}
              </text>
            </g>
          )}
        </g>
      </g>

      {/* ---------- floating dust in the lamp light ---------- */}
      {Array.from({ length: 10 }, (_, i) => {
        const x = lpx - 40 + rand(i * 4.1) * 160;
        const y = lpy - 30 - rand(i * 2.7) * 120;
        return (
          <circle key={i} cx={x} cy={y} r={1 + rand(i) * 1.4} fill={p.gold} opacity="0.5">
            <animateTransform attributeName="transform" type="translate" values="0 0;6 -18;0 0" dur={`${[3, 6, 2][i % 3]}s`} begin={`-${(rand(i * 9) * 3).toFixed(2)}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.7;0" dur={`${[3, 6, 2][i % 3]}s`} begin={`-${(rand(i * 9) * 3).toFixed(2)}s`} repeatCount="indefinite" />
          </circle>
        );
      })}
    </svg>
  );
}
