import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoGrid, IsoWindow, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Golden Hour Mix',
  description:
    'Landing-page hero for Crossfade: an isometric DJ deck on a sandstone stage in the desert at dusk. A brief card feeds into the console, faders ride, patch cables carry pulses to platform speaker stacks, a disco ball turns against the setting sun and a banner plane flies past. Moment: the drop, when every meter peaks and "+31 LIVE" pops.',
  tags: ['hero', 'isometric', 'animated svg', 'dj', 'ads', 'desert', 'dusk'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1, 0.75, 0.5 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Console sign').default('CROSSFADE'),
  banner: text('Plane banner').default('NOW ON 31 PLATFORMS'),
  platform1: text('Speaker 1').default('META'),
  platform2: text('Speaker 2').default('TIKTOK'),
  platform3: text('Speaker 3').default('GOOGLE'),
  skyTop: color('Sky top').default('#2B1B2E'),
  skyMid: color('Sky middle').default('#8A2F5E'),
  skyLow: color('Horizon').default('#FF8E5E'),
  sun: color('Sun').default('#FFD27F'),
  mesa: color('Mesas').default('#45293F'),
  sand: color('Desert sand').default('#7A3E46'),
  stage: color('Stage stone').default('#C9845F'),
  body: color('Console / speakers').default('#FFE9D6'),
  accent: color('Faders & meters').default('#FF8E5E'),
  neon: color('Neon').default('#E5487A'),
  stars: toggle('Stars').default(true),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  night: { skyTop: '#0E0A1E', skyMid: '#2B1B2E', skyLow: '#5A2A4A', sun: '#F3E6D0', mesa: '#1C1426', sand: '#2E1E30', stage: '#7A5A6A', neon: '#FF5C9A' },
  daylight: { skyTop: '#7FC4E8', skyMid: '#BFE2F2', skyLow: '#FFE3C2', sun: '#FFF4D6', mesa: '#C8745A', sand: '#E8B887', stage: '#F2D2B0', body: '#FFFFFF', accent: '#FF6F3D', neon: '#E5487A', stars: false },
  ultraviolet: { skyTop: '#12001F', skyMid: '#3A0060', skyLow: '#B026FF', sun: '#FFD600', mesa: '#24003D', sand: '#2A0A40', stage: '#6B3A8C', body: '#FBEFFF', accent: '#FF2E88', neon: '#B026FF' },
  acid: { skyTop: '#0B0B0B', skyMid: '#1A1A1A', skyLow: '#3A4A00', sun: '#C6FF00', mesa: '#1A1A1A', sand: '#141414', stage: '#4A4A4A', body: '#F0FFE0', accent: '#C6FF00', neon: '#FF00E5' },
  'ink-gold': { skyTop: '#0D0D0F', skyMid: '#1C1C20', skyLow: '#6E5A3A', sun: '#E8D9B5', mesa: '#1C1C20', sand: '#2A2620', stage: '#8A7A5C', body: '#F3EDE2', accent: '#C9A45C', neon: '#C9A45C' },
};

type P = z.infer<typeof schema>;

const U = 34;
const LOOP = scene.loop;
const OX = 600;
const OY = 330;
const INK = 'rgba(30,12,28,0.62)';
const C30 = Math.cos(Math.PI / 6);
const ZX = 620; // zoom pivot for the stage group
const ZY = 470;
const ZOOM = 1.42;
const MOMENT = 0.55; // the drop, as a fraction of the loop
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;

const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const ink = { stroke: INK };

/** Times/values for something that spikes at the drop and is calm otherwise. */
const dropAnim = (calm: string, peak: string) => ({
  values: `${calm};${calm};${peak};${calm};${calm}`,
  keyTimes: `0;${MOMENT - 0.01};${MOMENT + 0.01};${MOMENT + 0.12};1`,
  dur: `${LOOP}s`,
  repeatCount: 'indefinite',
});

/** Soft cast shadow toward +y (the sun is behind, so shadows fall forward). */
function Shadow({ x, y, w, d, h }: { x: number; y: number; w: number; d: number; h: number }) {
  const l = h * 0.5;
  return <polygon points={poly([[x, y + d, 0.02], [x + w, y + d, 0.02], [x + w + l * 0.2, y + d + l, 0.02], [x + l * 0.2, y + d + l, 0.02]])} fill="#1A0812" opacity="0.35" filter="url(#gh-blur)" />;
}

/** Speaker stack with pulsing cones on its right face and a platform label. */
function Speaker({ x, y, label, p, k }: { x: number; y: number; label: string; p: P; k: number }) {
  const X = x + 1.4;
  const cone = (a: number, z: number, r: number, beat: string) => {
    const [cx, cy] = S([X, a, z]);
    return (
      <g transform={`translate(${cx} ${cy}) matrix(${-C30}, 0.5, 0, 1, 0, 0)`}>
        <circle r={r * U} fill={shade(p.body, -0.55)} stroke={INK} strokeWidth="1" />
        <circle r={r * U * 0.72} fill={shade(p.body, -0.4)}>
          <animate attributeName="r" values={`${r * U * 0.72};${r * U * 0.8};${r * U * 0.72}`} dur={beat} begin={`-${(k * 0.17).toFixed(2)}s`} repeatCount="indefinite" />
        </circle>
        <circle r={r * U * 0.24} fill={p.accent} />
        <circle r={r * U * 1.05} fill="none" stroke={p.accent} strokeWidth="2" opacity="0">
          <animate attributeName="opacity" {...dropAnim('0', '0.9')} />
          <animate attributeName="r" {...dropAnim(`${r * U}`, `${r * U * 1.9}`)} />
        </circle>
      </g>
    );
  };
  const [lx, ly] = S([X, y + 1.3, 2.38]);
  return (
    <g>
      <Shadow x={x} y={y} w={1.4} d={1.4} h={2.6} />
      <IsoBox x={x} y={y} w={1.4} d={1.4} h={1.5} color={p.body} u={U} ink={ink} />
      <IsoBox x={x + 0.1} y={y + 0.1} z={1.5} w={1.2} d={1.2} h={1.1} color={shade(p.body, -0.05)} u={U} ink={ink} />
      {cone(y + 0.7, 0.78, 0.48, '0.5s')}
      {cone(y + 0.85, 1.95, 0.3, '0.5s')}
      {(() => {
        const [tx, ty] = S([X - 0.1, y + 0.32, 2.1]);
        return <circle cx={tx} cy={ty} r="3.2" fill={p.neon} opacity="0.9"><Flicker dur={LOOP} seed={k + 30} low={0.3} /></circle>;
      })()}
      {/* platform label on the top box, in the face's plane */}
      <g transform={`translate(${lx} ${ly}) matrix(${C30}, -0.5, 0, 1, 0, 0)`}>
        <text x="0" y="0" fontFamily={FONTS.spacemono} fontWeight="700" fontSize="9.5" letterSpacing="1.2" fill={shade(p.body, -0.6)}>
          {label.toUpperCase().slice(0, 7)}
        </text>
      </g>
    </g>
  );
}

function Cactus({ x, y, p }: { x: number; y: number; p: P }) {
  const green = '#4F7A5A';
  const [ax, ay] = S([x, y, 1.4]);
  const [bx, by] = S([x, y, 0.9]);
  return (
    <g>
      <Shadow x={x - 0.3} y={y - 0.3} w={0.6} d={0.6} h={2.2} />
      <IsoCylinder x={x} y={y} r={0.28} h={2.2} color={green} u={U} ink={ink} />
      <path d={`M${ax + 8},${ay} q22,0 22,-22 v-16`} stroke={shade(green, -0.15)} strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d={`M${ax + 8},${ay} q22,0 22,-22 v-16`} stroke={INK} strokeWidth="1" fill="none" opacity="0.5" />
      <path d={`M${bx - 8},${by} q-18,0 -18,-18 v-10`} stroke={shade(green, -0.25)} strokeWidth="11" strokeLinecap="round" fill="none" />
      {[0, 1, 2].map((i) => {
        const [fx, fy] = S([x, y, 2.25]);
        return <circle key={i} cx={fx - 5 + i * 5} cy={fy - 4 - (i % 2) * 3} r="3" fill={p.neon} />;
      })}
    </g>
  );
}

function Stars() {
  const out: ReactNode[] = [];
  for (let i = 0; i < 60; i++) {
    const dur = [2, 3, 6][i % 3];
    out.push(
      <circle key={i} cx={rand(i * 3.1) * 1200} cy={rand(i * 7.7) * 230} r={0.6 + rand(i * 1.3) * 1.4} fill="#FFF4E6">
        <animate attributeName="opacity" values="0.15;0.9;0.15" dur={`${dur}s`} begin={`-${(rand(i * 5.9) * dur).toFixed(2)}s`} repeatCount="indefinite" />
      </circle>,
    );
  }
  return <g>{out}</g>;
}

export default function GoldenHourMix(p: P) {
  // Console footprint
  const CX = 1.4;
  const CY = 3;
  const CW = 4.4;
  const CD = 2.4;
  const CH = 1.6;
  const TOPZ = CH;
  const faderXs = [3.5, 3.9, 4.3, 4.7, 5.1];
  const [ballX, ballY] = S([3.6, 4.2, 6.1]);
  const [ttX, ttY] = S([2.4, 4.2, TOPZ + 0.06]); // turntable centre
  const ttRx = 0.78 * U * 1.2247;
  const ttRy = 0.78 * U * 0.7071;
  const signAt = S([1.75, CY + CD, 0.92]);
  const [liveX, liveY] = S([8.1, 2.2, 4.1]);
  const [slotX, slotY] = S([2.2, CY + 0.25, TOPZ]);

  // String lights hang between two poles across the back of the stage.
  const [l1x, l1y] = S([0.3, 0.3, 4.2]);
  const [l2x, l2y] = S([9.7, 0.3, 4.2]);
  const sag = 46;
  const bulbs = Array.from({ length: 15 }, (_, i) => {
    const t = (i + 0.5) / 15;
    return { x: l1x + (l2x - l1x) * t, y: l1y + (l2y - l1y) * t + Math.sin(Math.PI * t) * sag };
  });

  // Patch cables from the console to each stack, lying on the stage.
  const cables = [
    { from: [5.8, 3.6, 0.03] as P3, to: [7.4, 1.1, 0.03] as P3 },
    { from: [5.8, 4.2, 0.03] as P3, to: [7.4, 2.9, 0.03] as P3 },
    { from: [5.8, 4.8, 0.03] as P3, to: [7.4, 4.7, 0.03] as P3 },
  ].map((c) => {
    const [ax, ay] = S(c.from);
    const [bx, by] = S(c.to);
    return `M${ax.toFixed(1)},${ay.toFixed(1)} C${(ax + 40).toFixed(1)},${(ay + 30).toFixed(1)} ${(bx - 30).toFixed(1)},${(by + 24).toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`;
  });

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="gh-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="0.55" stopColor={p.skyMid} />
          <stop offset="1" stopColor={p.skyLow} />
        </linearGradient>
        <linearGradient id="gh-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.sun, 0.35)} />
          <stop offset="0.6" stopColor={p.sun} />
          <stop offset="1" stopColor={p.accent} />
        </linearGradient>
        <linearGradient id="gh-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.sand, 0.12)} />
          <stop offset="1" stopColor={shade(p.sand, -0.35)} />
        </linearGradient>
        <radialGradient id="gh-halo">
          <stop offset="0" stopColor={p.sun} stopOpacity="0.55" />
          <stop offset="0.45" stopColor={p.sun} stopOpacity="0.15" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="gh-ball" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#C9C6D2" />
          <stop offset="1" stopColor="#6E6880" />
        </radialGradient>
        <radialGradient id="gh-pool">
          <stop offset="0" stopColor={p.neon} stopOpacity="0.5" />
          <stop offset="1" stopColor={p.neon} stopOpacity="0" />
        </radialGradient>
        <mask id="gh-sunmask">
          <rect width="1200" height="900" fill="#fff" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x="0" y={262 + i * 34 - i * i * 2} width="1200" height={5 + i * 4} fill="#000" />
          ))}
        </mask>
        <clipPath id="gh-ballclip">
          <circle cx={ballX} cy={ballY} r="30" />
        </clipPath>
        <filter id="gh-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="gh-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* ── Sky, sun, mesas, desert ── */}
      <rect width="1200" height="900" fill="url(#gh-sky)" />
      {p.stars && <Stars />}
      <circle cx="610" cy="250" r="380" fill="url(#gh-halo)">
        <animate attributeName="r" values="370;400;370" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
      </circle>
      <circle cx="610" cy="250" r="190" fill="url(#gh-sun)" mask="url(#gh-sunmask)" />
      {/* banner plane crossing the sky */}
      <g>
        <animateMotion dur={`${LOOP}s`} begin="-2.2s" repeatCount="indefinite" path="M1500,110 C1100,90 700,130 -500,100" />
        <g>
          <line x1="0" y1="0" x2="34" y2="0" stroke={shade(p.mesa, -0.3)} strokeWidth="1.2" />
          <rect x="34" y="-14" width={Math.max(160, p.banner.length * 11.4 + 18)} height="28" fill={p.body} stroke={INK} strokeWidth="1" />
          <text x={43} y="6" fontFamily={FONTS.spacemono} fontWeight="700" fontSize="16" letterSpacing="0.8" fill={shade(p.mesa, -0.2)}>
            {p.banner}
          </text>
          <path d="M-30,0 L-6,-4 L0,0 L-6,4 Z" fill={p.body} stroke={INK} strokeWidth="1" />
          <path d="M-20,-1 L-16,-14 L-12,-14 L-12,-1 Z M-20,1 L-16,12 L-12,12 L-12,1 Z" fill={shade(p.body, -0.15)} stroke={INK} strokeWidth="0.8" />
        </g>
      </g>
      {/* distant mesas */}
      <polygon points="0,452 0,392 70,384 92,350 250,346 268,372 330,376 372,452" fill={shade(p.mesa, 0.12)} />
      <polygon points="40,452 62,412 120,406 136,388 190,386 214,452" fill={shade(p.mesa, -0.12)} />
      <polygon points="800,452 846,386 900,380 918,342 1080,338 1100,366 1200,370 1200,452" fill={shade(p.mesa, 0.12)} />
      <polygon points="980,452 1004,404 1080,398 1096,420 1150,452" fill={shade(p.mesa, -0.12)} />
      <rect x="0" y="448" width="1200" height="452" fill="url(#gh-sand)" />
      <g stroke={shade(p.sand, 0.25)} strokeWidth="1.2" opacity="0.5" fill="none">
        <path d="M0,520 Q200,505 380,525" />
        <path d="M820,560 Q1000,540 1200,555" />
        <path d="M60,700 Q260,680 420,705" />
        <path d="M900,760 Q1060,742 1200,756" />
      </g>

      {/* ── Stage (scaled up so the subject fills ~60% of the frame) ── */}
      <g transform={`translate(${ZX} ${ZY}) scale(${ZOOM}) translate(${-ZX} ${-ZY})`}>
      <g transform={`translate(${OX} ${OY})`}>
        <polygon points={poly([[0, 8, -0.8], [10, 8, -0.8], [10.6, 8.6, -0.8], [0.6, 8.6, -0.8]])} fill="#1A0812" opacity="0.3" filter="url(#gh-blur)" />
        <IsoBox x={0} y={0} z={-0.8} w={10} d={8} h={0.8} color={p.stage} u={U} ink={ink} />
        <IsoGrid x={0} y={0} w={10} d={8} u={U} color={shade(p.stage, -0.45)} opacity={0.35} />
        {/* stone courses on the stage sides */}
        <g stroke={shade(p.stage, -0.45)} strokeWidth="1" opacity="0.55" fill="none">
          {Array.from({ length: 10 }, (_, i) => (
            <polyline key={`a${i}`} points={poly([[i + 0.5, 8, -0.8], [i + 0.5, 8, -0.4]])} />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <polyline key={`b${i}`} points={poly([[10, i + 0.5, -0.4], [10, i + 0.5, 0]])} />
          ))}
          <polyline points={poly([[0, 8, -0.4], [10, 8, -0.4], [10, 0, -0.4]])} />
        </g>
        {/* neon pool under the console */}
        <ellipse cx={S([3.6, 4.4, 0])[0]} cy={S([3.6, 4.4, 0])[1]} rx="190" ry="95" fill="url(#gh-pool)">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="0.5s" repeatCount="indefinite" />
        </ellipse>

        {/* string-light poles */}
        {[[0.3, 0.3], [9.7, 0.3]].map(([x, y], i) => (
          <IsoCylinder key={i} x={x} y={y} r={0.07} h={4.2} color={shade(p.mesa, 0.2)} u={U} ink={ink} />
        ))}

        {/* patch cables with signal pulses */}
        {cables.map((d, i) => (
          <g key={i}>
            <path d={d} stroke={shade(p.mesa, -0.2)} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d={d} stroke={i === 1 ? p.neon : p.accent} strokeWidth="1.6" fill="none" opacity="0.7" />
            {[0, 1].map((j) => (
              <circle key={j} r="4" fill={p.sun} filter="url(#gh-glow)">
                <animateMotion dur="1.5s" begin={`-${((i * 0.4 + j * 0.75) % 1.5).toFixed(2)}s`} repeatCount="indefinite" path={d} />
              </circle>
            ))}
          </g>
        ))}

        <Cactus x={0.7} y={4.4} p={p} />

        {/* back speaker stacks */}
        <Speaker x={7.4} y={0.4} label={p.platform1} p={p} k={0} />
        <Speaker x={7.4} y={2.2} label={p.platform2} p={p} k={1} />

        {/* ── Console ── */}
        <Shadow x={CX} y={CY} w={CW} d={CD} h={CH} />
        <IsoBox x={CX} y={CY} w={CW} d={CD} h={CH} color={p.body} u={U} ink={ink} />
        {/* top panel */}
        <polygon points={poly([[CX + 0.2, CY + 0.2, TOPZ], [CX + CW - 0.2, CY + 0.2, TOPZ], [CX + CW - 0.2, CY + CD - 0.2, TOPZ], [CX + 0.2, CY + CD - 0.2, TOPZ]])} fill={shade(p.mesa, -0.1)} stroke={INK} strokeWidth="1" />
        {/* brief slot + card feeding in */}
        <polygon points={poly([[1.9, CY + 0.32, TOPZ], [3.0, CY + 0.32, TOPZ], [3.0, CY + 0.42, TOPZ], [1.9, CY + 0.42, TOPZ]])} fill="#0E060C" />
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 -70;0 -70;0 6;0 6" keyTimes="0;0.15;0.4;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.08;0.33;0.4;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          <g transform={`translate(${slotX} ${slotY}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
            <rect x="-2" y="-38" width="30" height="38" fill="#FFFDF8" stroke={INK} strokeWidth="1" />
            <rect x="3" y="-33" width="14" height="3" fill={p.accent} />
            <rect x="3" y="-26" width="20" height="2" fill="#B9A9A0" />
            <rect x="3" y="-21" width="18" height="2" fill="#B9A9A0" />
            <rect x="3" y="-16" width="20" height="2" fill="#B9A9A0" />
            <text x="3" y="-6" fontFamily={FONTS.spacemono} fontSize="5" fill={shade(p.mesa, -0.2)}>BRIEF</text>
          </g>
        </g>
        {/* turntable */}
        <ellipse cx={ttX} cy={ttY} rx={ttRx} ry={ttRy} fill="#140A12" stroke={INK} strokeWidth="1" />
        <ellipse cx={ttX} cy={ttY} rx={ttRx * 0.72} ry={ttRy * 0.72} fill="none" stroke="#3A2834" strokeWidth="1" />
        <ellipse cx={ttX} cy={ttY} rx={ttRx * 0.5} ry={ttRy * 0.5} fill="none" stroke="#3A2834" strokeWidth="1" />
        <ellipse cx={ttX} cy={ttY} rx={ttRx * 0.3} ry={ttRy * 0.3} fill={p.neon} />
        <circle r="3.4" fill={p.body}>
          <animateMotion dur="1.5s" repeatCount="indefinite" path={`M${ttX + ttRx * 0.3},${ttY} A${ttRx * 0.3},${ttRy * 0.3} 0 1 1 ${ttX - ttRx * 0.3},${ttY} A${ttRx * 0.3},${ttRy * 0.3} 0 1 1 ${ttX + ttRx * 0.3},${ttY}`} />
        </circle>
        <path d={`M${ttX - ttRx * 0.15},${ttY - ttRy * 0.05} l${ttRx * 0.95},-${ttRy * 0.55}`} stroke={p.body} strokeWidth="3" strokeLinecap="round" />
        <circle cx={ttX + ttRx * 0.8} cy={ttY - ttRy * 0.6} r="5" fill={shade(p.body, -0.2)} stroke={INK} strokeWidth="1" />
        {/* fader slots + riding caps */}
        {faderXs.map((x, i) => {
          const [a1, b1] = S([x, CY + 0.55, TOPZ]);
          const [a2, b2] = S([x, CY + CD - 0.45, TOPZ]);
          const rest = [0.3, 0.6, 0.2, 0.75, 0.45][i];
          const [cx0, cy0] = S([x, CY + 0.55 + rest * 1.4, TOPZ + 0.04]);
          const dy = 0.42; // ride distance in world units
          const dX = (-C30 * U * dy).toFixed(1);
          const dY = (0.5 * U * dy).toFixed(1);
          return (
            <g key={i}>
              <line x1={a1} y1={b1} x2={a2} y2={b2} stroke="#0E060C" strokeWidth="2.6" strokeLinecap="round" />
              <g>
                <animateTransform attributeName="transform" type="translate" values={`0 0;${dX} ${dY};0 0`} dur={i % 2 ? '3s' : '2s'} begin={`-${(i * 0.37).toFixed(2)}s`} repeatCount="indefinite" {...spline} />
                <polygon points={poly([[x - 0.14, CY + 0.47 + rest * 1.4, TOPZ + 0.08], [x + 0.14, CY + 0.47 + rest * 1.4, TOPZ + 0.08], [x + 0.14, CY + 0.63 + rest * 1.4, TOPZ + 0.08], [x - 0.14, CY + 0.63 + rest * 1.4, TOPZ + 0.08]])} fill={i === 2 ? p.accent : p.body} stroke={INK} strokeWidth="1" />
                <circle cx={cx0} cy={cy0 - 3} r="1.4" fill={i === 2 ? p.body : p.accent} />
              </g>
            </g>
          );
        })}
        {/* knob row along the back of the panel */}
        {[3.5, 3.9, 4.3, 4.7, 5.1].map((x, i) => {
          const [kx, ky] = S([x, CY + 0.32, TOPZ + 0.05]);
          return <ellipse key={i} cx={kx} cy={ky} rx="5" ry="3" fill={shade(p.body, -0.1)} stroke={INK} strokeWidth="0.8" />;
        })}
        {/* front face: sign plate + LED meter row */}
        <IsoWindow face="left" plane={CY + CD + 0.01} a={1.65} z={0.82} w={3.9} h={0.56} fill={shade(p.mesa, -0.25)} u={U} />
        <g transform={`translate(${signAt[0]} ${signAt[1]}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
          <text x="0" y="-2" fontFamily={FONTS.monoton} fontSize="15" letterSpacing="1.5" fill={p.neon} filter="url(#gh-glow)">
            {p.sign}
            <animate attributeName="opacity" values="1;1;0.3;1;0.45;1;1" keyTimes="0;0.2;0.21;0.23;0.24;0.26;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          </text>
        </g>
        {Array.from({ length: 12 }, (_, i) => {
          const a = 1.75 + i * 0.32;
          const c = i > 9 ? p.sun : i > 6 ? p.neon : p.accent;
          const lit = 0.3 + (i / 12) * 0.5; // fraction of the beat a cell stays lit
          return (
            <IsoWindow key={i} face="left" plane={CY + CD + 0.01} a={a} z={0.3} w={0.22} h={0.32} fill={c} u={U} ink={{ strokeWidth: 0.6, stroke: INK }}>
              <animate attributeName="opacity" values={`1;1;0.18;0.18;1`} keyTimes={`0;${(1 - lit).toFixed(2)};${(1 - lit + 0.02).toFixed(2)};0.98;1`} dur="0.5s" repeatCount="indefinite" />
            </IsoWindow>
          );
        })}

        {/* front speaker stack + crates of records */}
        <Speaker x={7.4} y={4.0} label={p.platform3} p={p} k={2} />
        <IsoBox x={0.5} y={6.2} w={1.1} d={1.1} h={0.75} color="#8A5A3C" u={U} ink={ink} />
        <IsoBox x={1.75} y={6.5} w={1.1} d={1.1} h={0.75} color="#7A4E34" u={U} ink={ink} />
        {[0, 1, 2, 3, 4].map((i) => (
          <polygon key={i} points={poly([[0.62 + i * 0.2, 6.3, 0.75], [0.62 + i * 0.2, 7.2, 0.75], [0.62 + i * 0.2, 7.2, 1.3], [0.62 + i * 0.2, 6.3, 1.3]])} fill={i === 2 ? p.neon : i % 2 ? '#1A0E16' : p.accent} stroke={INK} strokeWidth="0.8" />
        ))}
        {/* floor lamp cans pointing at the console */}
        {[[6.6, 7.2], [3.2, 7.4]].map(([x, y], i) => {
          const [fx, fy] = S([x, y, 0.3]);
          return (
            <g key={i}>
              <IsoBox x={x - 0.2} y={y - 0.2} w={0.4} d={0.4} h={0.3} color="#2A1A26" u={U} ink={ink} />
              <circle cx={fx} cy={fy - 4} r="6" fill={p.sun} filter="url(#gh-glow)">
                <Flicker dur={LOOP} seed={i + 11} low={0.55} />
              </circle>
            </g>
          );
        })}
      </g>

      {/* ── String lights across the stage (in front of the sun) ── */}
      <g transform={`translate(${OX} ${OY})`}>
        <path d={`M${l1x},${l1y} Q${(l1x + l2x) / 2},${(l1y + l2y) / 2 + sag * 2} ${l2x},${l2y}`} stroke={shade(p.mesa, -0.3)} strokeWidth="1.4" fill="none" />
        {bulbs.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r="3.6" fill={i % 3 === 0 ? p.neon : p.sun} filter="url(#gh-glow)">
            <Flicker dur={LOOP} seed={i + 50} low={0.45} />
          </circle>
        ))}
      </g>

      {/* ── Disco ball against the sun ── */}
      <g transform={`translate(${OX} ${OY})`}>
        <g opacity="0.13" filter="url(#gh-blur)">
          <animateTransform attributeName="transform" type="rotate" values={`0 ${ballX} ${ballY};360 ${ballX} ${ballY}`} dur={`${LOOP}s`} repeatCount="indefinite" />
          {Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2;
            const a2 = a + 0.05;
            return <polygon key={i} points={`${ballX},${ballY} ${ballX + Math.cos(a) * 300},${ballY + Math.sin(a) * 300} ${ballX + Math.cos(a2) * 300},${ballY + Math.sin(a2) * 300}`} fill={i % 2 ? p.sun : p.neon} />;
          })}
        </g>
        <line x1={ballX} y1={-OY} x2={ballX} y2={ballY - 30} stroke={shade(p.mesa, -0.3)} strokeWidth="1.5" />
        <circle cx={ballX} cy={ballY} r="30" fill="url(#gh-ball)" stroke={INK} strokeWidth="1.2" />
        <g clipPath="url(#gh-ballclip)" opacity="0.75">
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 0;-10 0" dur="0.75s" repeatCount="indefinite" />
            {Array.from({ length: 9 }, (_, r) =>
              Array.from({ length: 10 }, (_, c) => {
                const fx = ballX - 34 + c * 10 + (r % 2) * 5;
                const fy = ballY - 34 + r * 8;
                const v = rand(r * 13 + c);
                return <rect key={`${r}-${c}`} x={fx} y={fy} width="8.5" height="6.5" fill={v > 0.82 ? '#FFFFFF' : v > 0.55 ? p.sun : 'rgba(40,30,60,0.35)'} opacity={v > 0.55 ? 0.9 : 0.6} />;
              }),
            )}
          </g>
        </g>
        <circle cx={ballX - 10} cy={ballY - 11} r="7" fill="#FFFFFF" opacity="0.7" />
        {/* sparkles that fire on the drop */}
        {Array.from({ length: 14 }, (_, i) => {
          const a = rand(i * 2.9) * Math.PI * 2;
          const d = 70 + rand(i * 6.1) * 260;
          const sx = ballX + Math.cos(a) * d;
          const sy = ballY + Math.sin(a) * d * 0.8 + 40;
          return (
            <path key={i} d={`M${sx},${sy - 9} L${sx + 2},${sy - 2} L${sx + 9},${sy} L${sx + 2},${sy + 2} L${sx},${sy + 9} L${sx - 2},${sy + 2} L${sx - 9},${sy} L${sx - 2},${sy - 2} Z`} fill="#FFFFFF" opacity="0">
              <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={`0;${(MOMENT + i * 0.004).toFixed(3)};${(MOMENT + 0.02 + i * 0.004).toFixed(3)};${(MOMENT + 0.12 + i * 0.004).toFixed(3)};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
            </path>
          );
        })}
        {/* "+31 LIVE" tag pops above the speakers */}
        <g opacity="0">
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${MOMENT};${MOMENT + 0.02};${MOMENT + 0.3};${MOMENT + 0.36};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values={`0 14;0 14;0 -4;0 0;0 -12;0 14`} keyTimes={`0;${MOMENT};${MOMENT + 0.03};${MOMENT + 0.06};${MOMENT + 0.36};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
          <rect x={liveX - 52} y={liveY - 18} width="104" height="34" rx="17" fill={p.neon} stroke={INK} strokeWidth="1.2" />
          <circle cx={liveX - 34} cy={liveY - 1} r="5" fill={p.sun} />
          <text x={liveX + 6} y={liveY + 5} textAnchor="middle" fontFamily={FONTS.spacemono} fontWeight="700" fontSize="15" fill="#FFFFFF">
            +31 LIVE
          </text>
          <path d={`M${liveX - 6},${liveY + 16} L${liveX},${liveY + 24} L${liveX + 6},${liveY + 16} Z`} fill={p.neon} />
        </g>
      </g>
      </g>

      {/* the drop: a warm flash over everything */}
      <rect width="1200" height="900" fill={p.sun} opacity="0" style={{ mixBlendMode: 'screen' }}>
        <animate attributeName="opacity" values="0;0;0.28;0.05;0" keyTimes={`0;${MOMENT};${MOMENT + 0.01};${MOMENT + 0.08};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
      </rect>
    </svg>
  );
}
