import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, iso, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Midnight Nightstand',
  description:
    'Landing-page hero for Ardor: a nightstand at 1 a.m. beside the bed. A phone propped on paperbacks glows with a chat, the lamp flickers, the candle dances, tea steams, a rose drops a petal and the moon drifts past the window. When he replies, hearts burst from the screen. Loops seamlessly.',
  tags: ['hero', 'isometric', 'romance', 'night', 'chat', 'animated svg'],
};

// Every SMIL duration divides this loop (8, 4, 2, 1, 0.5 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 8 };

export const schema = z.object({
  name: text('Love interest').default('Lucien'),
  poster: text('Poster title').default('MIDNIGHT COURT'),
  wall: color('Wall').default('#4A1420'),
  floor: color('Floor').default('#2C0B12'),
  wood: color('Nightstand wood').default('#7A3B2E'),
  sky: color('Night sky').default('#14040B'),
  moon: color('Moon').default('#FFE8E0'),
  lamp: color('Lamp light').default('#FFC27A'),
  accent: color('Heart red').default('#E3173E'),
  bubble: color('Chat bubble').default('#F5C6AA'),
  blanket: color('Blanket').default('#B5122F'),
  pop: color('Gold').default('#F7B32B'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dawn: { sky: '#F6A889', moon: '#FFF6E6', wall: '#C9776E', floor: '#7C3F3A', wood: '#B9785A', lamp: '#FFE2B0', blanket: '#E3173E' },
  'ink-gold': { wall: '#1C1C20', floor: '#0D0D0F', wood: '#3A3128', sky: '#07070A', accent: '#C9A45C', bubble: '#E8D9B5', blanket: '#2E2A26', lamp: '#F3D9A0', pop: '#E8D9B5', poster: 'REGENCY HEARTS', name: 'Lord Ashby' },
  'desert-dusk': { wall: '#45293F', floor: '#2B1B2E', wood: '#8A4B3C', sky: '#3A1F45', moon: '#FFD27F', accent: '#E5487A', bubble: '#FFD27F', blanket: '#FF8E5E', lamp: '#FFB27A', poster: 'SALTWIND MIRAGE', name: 'Idris' },
  candy: { wall: '#F7DDEB', floor: '#E9C4D8', wood: '#FFFFFF', sky: '#8A7BFF', moon: '#FFF6FB', accent: '#FF3D7F', bubble: '#8A7BFF', blanket: '#FF7EB6', lamp: '#FFF0B3', pop: '#4FD1C5', poster: 'NEO-SEOUL', name: 'Jun' },
};

type P = z.infer<typeof schema>;

const U = 46;
const OX = 545;
const OY = 535;
const LOOP = scene.loop;
const C30 = Math.cos(Math.PI / 6);
const INK = 'rgba(20,4,10,0.6)';
const TOP = 4.65; // nightstand top height
const BOOKS = 3 * 0.34;
const HEART = 'M50 70 C30 56 24 46 24 38 C24 30 30 25 37 25 C43 25 47 29 50 34 C53 29 57 25 63 25 C70 25 76 30 76 38 C76 46 70 56 50 70Z';
const spline2 = { calcMode: 'spline', keyTimes: '0;0.5;1', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1' } as const;

// World coordinates; the whole world is drawn inside translate(OX OY) so kit Iso* parts line up.
const S = (p: P3): [number, number] => iso(p, U);
const poly = (ps: P3[]) =>
  ps
    .map((p) => S(p))
    .map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`)
    .join(' ');
/** Draw in a y = const plane (faces down-left): local x runs along +x, local y runs down. */
const planeY = (x: number, y: number, z: number) => {
  const [sx, sy] = S([x, y, z]);
  return `matrix(${C30} 0.5 0 1 ${sx.toFixed(1)} ${sy.toFixed(1)})`;
};
/** Draw in an x = const plane (faces down-right): local x runs along -y. */
const planeX = (x: number, y: number, z: number) => {
  const [sx, sy] = S([x, y, z]);
  return `matrix(${C30} -0.5 0 1 ${sx.toFixed(1)} ${sy.toFixed(1)})`;
};
const kt = (...t: number[]) => t.map((v) => (v / LOOP).toFixed(4)).join(';');

function Box(props: { x: number; y: number; z?: number; w: number; d: number; h: number; color: string; top?: boolean }) {
  return <IsoBox {...props} u={U} ink={{ stroke: INK, strokeWidth: 1.2 }} />;
}

/** Soft blurred shadow on a horizontal plane. */
function Shadow({ x, y, w, d, z = 0, o = 0.4 }: { x: number; y: number; w: number; d: number; z?: number; o?: number }) {
  return <polygon points={poly([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]])} fill="#0A0205" opacity={o} filter="url(#mn-blur)" />;
}

function Stars({ p }: { p: P }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const dur = [2, 4, 8][i % 3];
    out.push(
      <circle key={i} cx={8 + rand(i * 3.3) * 170} cy={10 + rand(i * 8.1) * 150} r={0.6 + rand(i * 1.7) * 1.3} fill={p.moon}>
        <animate attributeName="opacity" values="0.2;1;0.2" dur={`${dur}s`} begin={`-${(rand(i * 4.4) * dur).toFixed(2)}s`} repeatCount="indefinite" />
      </circle>,
    );
  }
  return <>{out}</>;
}

/** The window in the back wall (plane y = -3), with sky, moon and clouds. Local units are px. */
function Window({ p }: { p: P }) {
  const w = 4.2 * U;
  const h = 3.8 * U;
  const day = isLight(p.sky);
  return (
    <g transform={planeY(1.1, -3, 9.4)}>
      <defs>
        <clipPath id="mn-win">
          <rect x="0" y="0" width={w} height={h} />
        </clipPath>
        <linearGradient id="mn-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.sky, day ? 0.1 : -0.2)} />
          <stop offset="1" stopColor={shade(p.sky, day ? 0.35 : 0.18)} />
        </linearGradient>
        <radialGradient id="mn-halo">
          <stop offset="0" stopColor={p.moon} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.moon} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* frame + recess */}
      <rect x={-12} y={-12} width={w + 24} height={h + 24} rx="3" fill={shade(p.wall, -0.45)} stroke={INK} strokeWidth="1.2" />
      <g clipPath="url(#mn-win)">
        <rect width={w} height={h} fill="url(#mn-sky)" />
        {!day && <Stars p={p} />}
        <circle cx={w * 0.68} cy={h * 0.32} r="56" fill="url(#mn-halo)" />
        <circle cx={w * 0.68} cy={h * 0.32} r="21" fill={p.moon} />
        <circle cx={w * 0.68 + 6} cy={h * 0.32 - 5} r="4" fill={shade(p.moon, -0.12)} opacity="0.7" />
        <circle cx={w * 0.68 - 7} cy={h * 0.32 + 6} r="2.6" fill={shade(p.moon, -0.12)} opacity="0.7" />
        {/* clouds drifting past */}
        {[0, 1].map((i) => (
          <g key={i} opacity={day ? 0.9 : 0.75}>
            <animateTransform attributeName="transform" type="translate" values={`${-120 - i * 40} 0;${w + 40} 0`} dur={`${LOOP}s`} begin={`-${i * 4}s`} repeatCount="indefinite" />
            <g transform={`translate(0 ${h * (0.42 + i * 0.28)})`} fill={day ? '#FFF1E8' : shade(p.sky, 0.28)}>
              <ellipse cx="0" cy="0" rx="46" ry="11" />
              <ellipse cx="-12" cy="-8" rx="20" ry="12" />
              <ellipse cx="12" cy="-10" rx="16" ry="12" />
            </g>
          </g>
        ))}
        {/* city skyline silhouette with lit windows */}
        <g fill={shade(p.sky, day ? -0.35 : -0.5)}>
          {[0, 18, 30, 52, 70, 96, 112, 134, 150, 170].map((x, i) => (
            <rect key={i} x={x} y={h - 26 - rand(i * 2.9) * 34} width={16 + rand(i * 5.1) * 8} height="80" />
          ))}
        </g>
        {Array.from({ length: 14 }, (_, i) => (
          <rect key={i} x={6 + rand(i * 7.7) * (w - 12)} y={h - 8 - rand(i * 3.1) * 22} width="2.5" height="3" fill={p.lamp} opacity="0.8">
            <Flicker dur={LOOP} seed={i + 40} low={0.2} />
          </rect>
        ))}
      </g>
      {/* mullions + sill */}
      <rect x={w / 2 - 3} y="0" width="6" height={h} fill={shade(p.wall, -0.45)} />
      <rect x="0" y={h * 0.45 - 3} width={w} height="6" fill={shade(p.wall, -0.45)} />
      <rect x="0" y="0" width={w} height={h} fill="none" stroke={shade(p.wall, -0.6)} strokeWidth="2" />
      <rect x={-20} y={h + 10} width={w + 40} height="10" fill={shade(p.wall, 0.15)} stroke={INK} strokeWidth="1" />
      {/* curtain swag on the left, swaying */}
      <path d={`M-30 -24 L30 -24 C26 ${h * 0.4} 6 ${h * 0.7} 14 ${h + 18} L-30 ${h + 18} Z`} fill={p.blanket} stroke={INK} strokeWidth="1.2">
        <animateTransform attributeName="transform" type="skewX" values="0;-1.5;0" dur="4s" repeatCount="indefinite" {...spline2} />
      </path>
      <path d={`M-14 -24 C-12 ${h * 0.4} -4 ${h * 0.7} -2 ${h + 18}`} stroke={shade(p.blanket, -0.3)} strokeWidth="2" fill="none" />
      <path d={`M2 -24 C2 ${h * 0.4} 4 ${h * 0.7} 6 ${h + 18}`} stroke={shade(p.blanket, -0.3)} strokeWidth="2" fill="none" />
      <rect x="-40" y="-30" width={w + 80} height="8" rx="4" fill={shade(p.wood, -0.25)} stroke={INK} strokeWidth="1" />
    </g>
  );
}

/** A framed pulp-romance poster on the left wall (plane x = -3). */
function Poster({ p }: { p: P }) {
  const w = 3.2 * U;
  const h = 4.3 * U;
  return (
    <g transform={planeX(-3, 3.6, 9.6)}>
      <rect x="-8" y="-8" width={w + 16} height={h + 16} fill={shade(p.wood, -0.35)} stroke={INK} strokeWidth="1.2" />
      <rect width={w} height={h} fill={shade(p.accent, -0.15)} />
      <rect width={w} height={h} fill="url(#mn-postergrad)" />
      <circle cx={w / 2} cy={h * 0.42} r={w * 0.36} fill={shade(p.accent, -0.4)} />
      <path d={HEART} transform={`translate(${w / 2 - w * 0.36} ${h * 0.42 - w * 0.34}) scale(${(w * 0.72) / 100})`} fill={p.bubble} opacity="0.95" />
      <text x={w / 2} y={h * 0.82} textAnchor="middle" fontFamily={FONTS.gloock} fontSize="17" fill={p.moon} letterSpacing="-0.3">
        {p.poster.length > 12 ? p.poster.slice(0, 14) : p.poster}
      </text>
      <text x={w / 2} y={h * 0.9} textAnchor="middle" fontFamily={FONTS.spacemono} fontSize="6.5" fill={p.bubble} letterSpacing="2">
        AN ARDOR STORY
      </text>
      <text x="8" y="14" fontFamily={FONTS.spacemono} fontSize="6" fill={p.pop} letterSpacing="1">
        25¢
      </text>
    </g>
  );
}

/** The bed beside the nightstand (to its right). */
function Bed({ p }: { p: P }) {
  const x = 7.2;
  return (
    <g>
      <Shadow x={x - 0.3} y={-2.8} w={8} d={8.5} o={0.45} />
      <Box x={x} y={-3} w={9} d={8.6} h={1.1} color={shade(p.wood, -0.15)} />
      <Box x={x + 0.15} y={-2.85} z={1.1} w={8.7} d={8.3} h={1} color="#F3E3DA" />
      {/* pillows */}
      <path d={pillow(x + 0.6, -2.4, 2.1, 2.4)} fill="#FFF3EE" stroke={INK} strokeWidth="1.2" />
      <path d={pillow(x + 0.6, 0.4, 2.1, 2.4)} fill="#FBE6DE" stroke={INK} strokeWidth="1.2" />
      {/* heart cushion propped on the pillows */}
      {(() => {
        const [hx, hy] = S([x + 1.4, 1.6, 2.6]);
        return (
          <g transform={`translate(${hx - 55} ${hy - 62}) scale(1.1) rotate(-8 50 47)`}>
            <path d={HEART} transform="translate(4 6)" fill="#0A0205" opacity="0.3" />
            <path d={HEART} fill={p.accent} stroke={INK} strokeWidth="1.8" />
            <path d="M34 34 C30 36 30 42 34 46" stroke={shade(p.accent, 0.4)} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d={HEART} transform="translate(50 47) scale(0.8) translate(-50 -47)" fill="none" stroke={shade(p.accent, -0.3)} strokeWidth="1.4" strokeDasharray="3 3" />
          </g>
        );
      })()}
      {/* folded blanket */}
      <polygon points={poly([[x + 3.2, -2.9, 2.14], [x + 8.9, -2.9, 2.14], [x + 8.9, 5.5, 2.14], [x + 3.2, 5.5, 2.14]])} fill={p.blanket} stroke={INK} strokeWidth="1.2" />
      <polygon points={poly([[x + 3.2, 5.5, 2.14], [x + 8.9, 5.5, 2.14], [x + 8.9, 5.5, 0.9], [x + 3.2, 5.5, 0.9]])} fill={shade(p.blanket, -0.3)} stroke={INK} strokeWidth="1.2" />
      <polygon points={poly([[x + 3.2, -2.9, 2.18], [x + 3.9, -2.9, 2.18], [x + 3.9, 5.5, 2.18], [x + 3.2, 5.5, 2.18]])} fill="#FFF3EE" stroke={INK} strokeWidth="1" />
      {/* quilting */}
      <g stroke={shade(p.blanket, -0.28)} strokeWidth="1.2" fill="none" strokeDasharray="3 4">
        {[1, 2, 3, 4, 5, 6, 7].map((k) => (
          <polyline key={k} points={poly([[x + 3.9, -2.9 + k * 1.05, 2.15], [x + 8.9, -2.9 + k * 1.05, 2.15]])} />
        ))}
        {[5, 6.3, 7.6].map((k) => (
          <polyline key={k} points={poly([[x + k, -2.9, 2.15], [x + k, 5.5, 2.15]])} />
        ))}
      </g>
    </g>
  );
}
function pillow(x: number, y: number, w: number, d: number) {
  const z = 2.1;
  const a = S([x, y, z + 0.15]);
  const b = S([x + w, y, z + 0.15]);
  const c = S([x + w, y + d, z + 0.15]);
  const e = S([x, y + d, z + 0.15]);
  const top = S([x + w / 2, y + d / 2, z + 0.9]);
  const q = (m: [number, number], n: [number, number]) => `Q${((m[0] + n[0]) / 2 + (top[0] - (m[0] + n[0]) / 2) * 0.25).toFixed(1)},${((m[1] + n[1]) / 2 + (top[1] - (m[1] + n[1]) / 2) * 0.6).toFixed(1)} ${n[0].toFixed(1)},${n[1].toFixed(1)}`;
  return `M${a[0]},${a[1]} ${q(a, b)} ${q(b, c)} ${q(c, e)} ${q(e, a)}Z`;
}

/** Floor props on the rug: fluffy slippers and a paperback left face-down mid-chapter. */
function FloorProps({ p }: { p: P }) {
  const ground = (x: number, y: number) => {
    const [sx, sy] = S([x, y, 0.02]);
    return `matrix(${C30} 0.5 ${-C30} 0.5 ${sx.toFixed(1)} ${sy.toFixed(1)})`;
  };
  const slipper = (x: number, y: number, rot: number, k: number) => (
    <g key={k} transform={ground(x, y)}>
      <g transform={`rotate(${rot})`}>
        <ellipse cx="4" cy="5" rx="24" ry="44" fill="#0A0205" opacity="0.35" filter="url(#mn-blur)" />
        <ellipse cx="0" cy="0" rx="22" ry="42" fill={shade(p.bubble, -0.1)} stroke={INK} strokeWidth="1.4" />
        <ellipse cx="0" cy="-2" rx="15" ry="32" fill={shade(p.bubble, -0.3)} />
        {/* fluffy band across the toes */}
        <path d="M-23 -10 C-12 -26 12 -26 23 -10 C22 -2 -22 -2 -23 -10Z" fill={p.bubble} stroke={INK} strokeWidth="1.2" />
        <path d={HEART} transform="translate(-7 -22) scale(0.14)" fill={p.accent} />
      </g>
    </g>
  );
  return (
    <g>
      {slipper(0.6, 5.6, 8, 0)}
      {slipper(1.9, 6.1, -14, 1)}
      {/* face-down open paperback: a low tent */}
      <Shadow x={3.5} y={5.1} w={2} d={1.9} o={0.35} />
      <polygon points={poly([[3.6, 5.2, 0.03], [5.4, 5.2, 0.03], [5.4, 6.9, 0.03], [3.6, 6.9, 0.03]])} fill="#FFF1E6" stroke={INK} strokeWidth="1" />
      <polygon points={poly([[5.4, 5.25, 0.04], [5.4, 6.85, 0.04], [5.4, 6.05, 0.42]])} fill="#F3E3DA" stroke={INK} strokeWidth="1" />
      <polygon points={poly([[3.55, 6.95, 0.02], [5.45, 6.95, 0.02], [5.45, 6.05, 0.45], [3.55, 6.05, 0.45]])} fill={p.accent} stroke={INK} strokeWidth="1.2" />
      <polyline points={poly([[3.55, 6.05, 0.45], [5.45, 6.05, 0.45]])} stroke={shade(p.accent, -0.4)} strokeWidth="3" />
      <polyline points={poly([[3.9, 6.75, 0.14], [5.1, 6.75, 0.14]])} stroke={p.pop} strokeWidth="2" />
    </g>
  );
}

function Nightstand({ p }: { p: P }) {
  const wd = p.wood;
  const legs: [number, number][] = [[0.2, 0.2], [5.45, 0.2], [0.2, 2.95], [5.45, 2.95]];
  return (
    <g>
      <Shadow x={-0.2} y={0.2} w={6.6} d={4.4} o={0.55} />
      {legs.map(([x, y], i) => (
        <Box key={i} x={x} y={y} w={0.35} d={0.35} h={0.9} color={shade(wd, -0.2)} />
      ))}
      <Box x={0} y={0} z={0.9} w={6} d={3.5} h={3.5} color={wd} />
      {/* drawers on the front (left) face, y = 3.5 */}
      {[0, 1].map((k) => {
        const z0 = 1.15 + k * 1.65;
        const knob = S([3, 3.5, z0 + 0.7]);
        return (
          <g key={k}>
            <polygon points={poly([[0.3, 3.5, z0], [5.7, 3.5, z0], [5.7, 3.5, z0 + 1.4], [0.3, 3.5, z0 + 1.4]])} fill={shade(wd, -0.22)} stroke={INK} strokeWidth="1.2" />
            <polygon points={poly([[0.45, 3.5, z0 + 0.15], [5.55, 3.5, z0 + 0.15], [5.55, 3.5, z0 + 1.25], [0.45, 3.5, z0 + 1.25]])} fill="none" stroke={shade(wd, -0.45)} strokeWidth="1" />
            <ellipse cx={knob[0]} cy={knob[1]} rx="7" ry="5" fill={p.pop} stroke={INK} strokeWidth="1" />
            <ellipse cx={knob[0] - 2} cy={knob[1] - 1.5} rx="2" ry="1.4" fill="#FFF6DD" />
          </g>
        );
      })}
      {/* wood grain on the side */}
      <g stroke={shade(wd, -0.32)} strokeWidth="1" fill="none" opacity="0.6">
        {[1.6, 2.6, 3.4].map((z, i) => (
          <polyline key={i} points={poly([[6, 0.3 + i * 0.4, z], [6, 1.6, z + 0.12], [6, 3.2 - i * 0.3, z - 0.05]])} />
        ))}
      </g>
      {/* top slab with overhang */}
      <Box x={-0.18} y={-0.18} z={4.4} w={6.36} d={3.86} h={0.25} color={shade(wd, 0.1)} />
    </g>
  );
}

function Lamp({ p }: { p: P }) {
  const [bx, by] = S([1.0, 0.9, TOP]);
  const [, sy] = S([1.0, 0.9, TOP + 2.6]); // shade bottom
  const [, ty] = S([1.0, 0.9, TOP + 4.2]); // shade top
  const rb = 1.25 * U * 1.22;
  const rt = 0.75 * U * 1.22;
  return (
    <g>
      <IsoCylinder x={1.0} y={0.9} z={TOP} r={0.6} h={0.25} color={p.pop} u={U} ink={{ stroke: INK }} />
      <rect x={bx - 3} y={sy} width="6" height={by - sy - 6} fill={shade(p.pop, -0.25)} stroke={INK} strokeWidth="1" />
      {/* shade: a truncated cone, lit from inside */}
      <ellipse cx={bx} cy={sy} rx={rb} ry={rb * 0.58} fill={p.lamp} opacity="0.95">
        <Flicker dur={LOOP} seed={3} low={0.75} />
      </ellipse>
      <path d={`M${bx - rt},${ty} L${bx - rb},${sy} A${rb},${rb * 0.58} 0 0 0 ${bx + rb},${sy} L${bx + rt},${ty} Z`} fill={shade(p.lamp, -0.08)} stroke={INK} strokeWidth="1.2" />
      <path d={`M${bx - rt},${ty} L${bx - rb},${sy} A${rb},${rb * 0.58} 0 0 0 ${bx - rb * 0.2},${sy + rb * 0.57} L${bx - rt * 0.2},${ty + rt * 0.57} Z`} fill={shade(p.lamp, -0.25)} opacity="0.6" />
      <ellipse cx={bx} cy={ty} rx={rt} ry={rt * 0.58} fill={shade(p.lamp, 0.4)} stroke={INK} strokeWidth="1.2" />
      {/* tassel trim */}
      {Array.from({ length: 9 }, (_, i) => {
        const a = Math.PI * (0.08 + (i / 8) * 0.84);
        const x = bx - Math.cos(a) * rb;
        const y = sy + Math.sin(a) * rb * 0.58;
        return <line key={i} x1={x} y1={y} x2={x} y2={y + 9} stroke={p.accent} strokeWidth="2" strokeLinecap="round" />;
      })}
    </g>
  );
}

/** Paperback stack + the phone propped on it, showing the chat. */
function PhoneStack({ p }: { p: P }) {
  const books: [number, number, string][] = [[1.8, 0.55, p.accent], [1.95, 0.75, p.bubble], [1.75, 0.6, shade(p.wall, 0.25)]];
  const phoneZ = TOP + BOOKS;
  const sw = 2.6 * U; // screen size in plane px
  const sh = 4.5 * U;
  return (
    <g>
      <Shadow x={1.9} y={0.8} w={3.2} d={2.1} z={TOP} o={0.5} />
      {books.map(([x, y, c], i) => (
        <g key={i}>
          <Box x={x} y={y} z={TOP + i * 0.34} w={2.9} d={1.8} h={0.34} color={c} />
          {/* page edges on the spine side */}
          <polyline points={poly([[x + 0.2, y + 1.8, TOP + i * 0.34 + 0.17], [x + 2.7, y + 1.8, TOP + i * 0.34 + 0.17]])} stroke={shade(c, 0.45)} strokeWidth="1.4" />
        </g>
      ))}
      {/* the phone: a thin slab standing on the stack, leaning on a little stand */}
      <Box x={2.15} y={1.05} z={phoneZ} w={2.7} d={0.22} h={4.6} color="#1A0A10" />
      <g transform={planeY(2.2, 1.27, phoneZ + 4.55)}>
        <rect x="0" y="0" width={sw} height={sh} rx="12" fill="#12060A" />
        <rect x="4" y="4" width={sw - 8} height={sh - 8} rx="9" fill="url(#mn-screen)" />
        {/* status + header */}
        <rect x={sw / 2 - 16} y="9" width="32" height="7" rx="3.5" fill="#000" />
        <circle cx="22" cy="34" r="10" fill={p.accent} />
        <text x="22" y="38" textAnchor="middle" fontFamily={FONTS.gloock} fontSize="12" fill="#FFE8E0">
          {p.name.charAt(0)}
        </text>
        <text x="38" y="33" fontFamily={FONTS.gloock} fontSize="11" fill="#FFE8E0">
          {p.name.length > 10 ? p.name.slice(0, 10) : p.name}
        </text>
        <circle cx="40" cy="41" r="2" fill="#5BE38A" />
        <rect x="45" y="39.5" width="34" height="3" rx="1.5" fill="#FFE8E0" opacity="0.35" />
        <line x1="10" y1="52" x2={sw - 10} y2="52" stroke="#FFE8E0" strokeOpacity="0.1" />
        {/* his bubble */}
        <rect x="10" y="60" width="78" height="30" rx="8" fill="#FFE8E0" fillOpacity="0.12" />
        <rect x="17" y="68" width="62" height="4" rx="2" fill="#FFE8E0" opacity="0.75" />
        <rect x="17" y="77" width="44" height="4" rx="2" fill="#FFE8E0" opacity="0.75" />
        {/* her bubble */}
        <rect x={sw - 84} y="98" width="74" height="22" rx="8" fill={p.bubble} />
        <rect x={sw - 77} y="107" width="58" height="4" rx="2" fill={shade(p.bubble, -0.6)} opacity="0.7" />
        {/* typing dots, then his reply pops in at the moment */}
        <g>
          <animate attributeName="opacity" values="1;1;0;0;1" keyTimes={kt(0, 3.9, 4.0, 7.8, 8)} dur={`${LOOP}s`} repeatCount="indefinite" />
          <rect x="10" y="128" width="40" height="20" rx="10" fill="#FFE8E0" fillOpacity="0.12" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={21 + i * 9} cy="138" r="3" fill="#FFE8E0">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" begin={`${-1 + i * 0.2}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
        <g transform="translate(10 138)">
          <g>
            <animateTransform attributeName="transform" type="scale" values="0;0;1.12;1;1;0.0001" keyTimes={kt(0, 4.0, 4.25, 4.45, 7.8, 8)} dur={`${LOOP}s`} repeatCount="indefinite" />
            <g transform="translate(0 -10)">
              <rect x="0" y="0" width="92" height="40" rx="9" fill={p.accent} />
              <rect x="8" y="9" width="62" height="4" rx="2" fill="#FFE8E0" />
              <rect x="8" y="18" width="70" height="4" rx="2" fill="#FFE8E0" />
              <rect x="8" y="27" width="36" height="4" rx="2" fill="#FFE8E0" />
              <path d={HEART} transform="translate(64 20) scale(0.26)" fill="#FFE8E0" />
            </g>
          </g>
        </g>
        {/* affection meter at the bottom of the screen */}
        <rect x="10" y={sh - 44} width={sw - 20} height="5" rx="2.5" fill="#FFE8E0" opacity="0.15" />
        <rect x="10" y={sh - 44} width={(sw - 20) * 0.7} height="5" rx="2.5" fill={p.accent}>
          <animate attributeName="width" values={`${(sw - 20) * 0.7};${(sw - 20) * 0.7};${(sw - 20) * 0.86};${(sw - 20) * 0.86};${(sw - 20) * 0.7}`} keyTimes={kt(0, 4.1, 4.6, 7.8, 8)} dur={`${LOOP}s`} repeatCount="indefinite" />
        </rect>
        <text x="10" y={sh - 50} fontFamily={FONTS.spacemono} fontSize="6" fill="#FFE8E0" opacity="0.6" letterSpacing="1.4">
          AFFECTION
        </text>
        {/* choice chips */}
        <rect x="10" y={sh - 32} width={(sw - 26) / 2} height="20" rx="7" fill={p.accent} />
        <rect x={16 + (sw - 26) / 2} y={sh - 32} width={(sw - 26) / 2} height="20" rx="7" fill="none" stroke="#FFE8E0" strokeOpacity="0.35" />
        <rect x="18" y={sh - 24} width="38" height="4" rx="2" fill="#FFE8E0" />
        <rect x={24 + (sw - 26) / 2} y={sh - 24} width="34" height="4" rx="2" fill="#FFE8E0" opacity="0.6" />
        {/* glass sheen */}
        <path d={`M4 4 L${sw * 0.55} 4 L4 ${sh * 0.42} Z`} fill="#FFFFFF" opacity="0.05" />
      </g>
    </g>
  );
}

function Candle({ p }: { p: P }) {
  const x = 5.3;
  const y = 0.9;
  const [fx, fy] = S([x, y, TOP + 1.6]);
  return (
    <g>
      <IsoCylinder x={x} y={y} z={TOP} r={0.45} h={0.12} color={p.pop} u={U} ink={{ stroke: INK }} />
      <IsoCylinder x={x} y={y} z={TOP + 0.12} r={0.3} h={1.25} color="#FFF1E6" u={U} ink={{ stroke: INK }} />
      <path d={`M${fx - 5},${fy + 14} q2,6 5,6 q-1,-6 -5,-6`} fill="#FFF1E6" />
      <line x1={fx} y1={fy + 12} x2={fx} y2={fy + 7} stroke="#2A0A10" strokeWidth="1.4" />
      <circle cx={fx} cy={fy} r="26" fill="url(#mn-flamehalo)">
        <animate attributeName="r" values="24;29;22;27;24" dur="1s" repeatCount="indefinite" />
      </circle>
      <g transform={`translate(${fx} ${fy + 8})`}>
        <g>
          <animateTransform attributeName="transform" type="scale" values="1 1;0.9 1.12;1.05 0.94;0.95 1.08;1 1" dur="0.5s" repeatCount="indefinite" />
          <path d="M0 0 C-7 -4 -6 -12 0 -22 C6 -12 7 -4 0 0Z" fill={p.pop} />
          <path d="M0 -1 C-3.5 -3 -3 -8 0 -13 C3 -8 3.5 -3 0 -1Z" fill="#FFF6DD" />
        </g>
      </g>
    </g>
  );
}

function Tea({ p }: { p: P }) {
  const x = 5.05;
  const y = 2.85;
  const [cx, cy] = S([x, y, TOP + 0.95]);
  const [sx, sy] = S([x, y, TOP]);
  return (
    <g>
      <ellipse cx={sx} cy={sy + 2} rx="34" ry="18" fill="#F3E3DA" stroke={INK} strokeWidth="1.1" />
      <ellipse cx={sx} cy={sy + 1} rx="24" ry="12" fill="none" stroke={shade('#F3E3DA', -0.12)} strokeWidth="1" />
      <path d={`M${cx + 24},${cy + 10} c14,-2 14,20 -2,22`} stroke="#F3E3DA" strokeWidth="5" fill="none" />
      <path d={`M${cx + 24},${cy + 10} c14,-2 14,20 -2,22`} stroke={INK} strokeWidth="1" fill="none" />
      <IsoCylinder x={x} y={y} z={TOP + 0.08} r={0.55} h={0.9} color="#F3E3DA" u={U} ink={{ stroke: INK }} />
      <ellipse cx={cx} cy={cy} rx={0.5 * U * 1.22} ry={0.5 * U * 0.7} fill={shade(p.wood, -0.3)} />
      <path d={HEART} transform={`translate(${cx - 18} ${cy + 14}) scale(0.18)`} fill={p.accent} />
      {/* steam */}
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M${cx - 10 + i * 10},${cy - 6} c-6,-10 6,-16 0,-26 c-6,-10 6,-16 0,-24`} stroke="#FFE8E0" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0">
          <animate attributeName="opacity" values="0;0.45;0" dur="2s" begin={`${-i * 0.66}s`} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0 6;0 -14" dur="2s" begin={`${-i * 0.66}s`} repeatCount="indefinite" />
        </path>
      ))}
    </g>
  );
}

function Rose({ p }: { p: P }) {
  const x = 0.75;
  const y = 2.75;
  const [vx, vy] = S([x, y, TOP + 1.25]);
  const head: [number, number] = [vx - 8, vy - 92];
  return (
    <g>
      <IsoCylinder x={x} y={y} z={TOP} r={0.38} h={1.25} color="#E8B4A8" u={U} ink={{ stroke: INK }} />
      <ellipse cx={vx} cy={vy} rx={0.38 * U * 1.22} ry={0.38 * U * 0.7} fill="#7A2B30" opacity="0.6" />
      <path d={`M${vx},${vy} C${vx + 4},${vy - 40} ${vx - 14},${vy - 60} ${head[0]},${head[1] + 10}`} stroke="#3F7A4A" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d={`M${vx + 1},${vy - 34} c14,-10 26,-6 30,-2 c-10,8 -22,8 -30,2Z`} fill="#4E8A5B" stroke={INK} strokeWidth="1" />
      <path d={`M${vx - 4},${vy - 54} c-12,-8 -22,-4 -26,0 c10,6 20,6 26,0Z`} fill="#4E8A5B" stroke={INK} strokeWidth="1" />
      <g transform={`translate(${head[0]} ${head[1]})`}>
        <animateTransform attributeName="transform" type="rotate" values="-4;4;-4" dur="4s" additive="sum" repeatCount="indefinite" {...spline2} />
        <path d="M-17 2 C-20 -12 -8 -20 0 -16 C8 -20 20 -12 17 2 C14 14 -14 14 -17 2Z" fill={p.accent} stroke={INK} strokeWidth="1.2" />
        <path d="M-10 -2 C-10 -10 -2 -14 4 -10 C10 -8 10 0 4 2 C-2 4 -6 0 -2 -4" fill="none" stroke={shade(p.accent, -0.4)} strokeWidth="1.6" />
        <path d="M-17 2 C-12 12 12 12 17 2 C10 8 -10 8 -17 2Z" fill={shade(p.accent, -0.3)} />
      </g>
      {/* a petal falls once per loop */}
      <path d="M0 0 c-6 -6 -2 -12 4 -10 c6 2 4 10 -4 10Z" fill={p.accent} opacity="0">
        <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={kt(0, 1.2, 1.4, 3.6, 4.2, 8)} dur={`${LOOP}s`} repeatCount="indefinite" />
        <animateMotion
          dur={`${LOOP}s`}
          repeatCount="indefinite"
          keyPoints="0;0;1;1"
          keyTimes={kt(0, 1.2, 4.2, 8)}
          calcMode="linear"
          rotate="auto"
          path={`M${head[0] + 10},${head[1] + 8} C${head[0] + 40},${head[1] + 30} ${head[0] - 10},${head[1] + 60} ${head[0] + 24},${head[1] + 82} S${head[0] + 30},${head[1] + 118} ${head[0] + 40},${vy + 34}`}
        />
      </path>
    </g>
  );
}

function Letter({ p }: { p: P }) {
  const z = TOP + 0.01;
  const x0 = 1.9;
  const y0 = 2.6;
  const w = 2.0;
  const d = 0.95;
  const [sx, sy] = S([x0 + w / 2, y0 + d / 2, z]);
  return (
    <g>
      <polygon points={poly([[x0 + 0.08, y0 + 0.1, z], [x0 + w + 0.08, y0 + 0.1, z], [x0 + w + 0.08, y0 + d + 0.1, z], [x0 + 0.08, y0 + d + 0.1, z]])} fill="#0A0205" opacity="0.35" filter="url(#mn-blur)" />
      <polygon points={poly([[x0, y0, z], [x0 + w, y0, z], [x0 + w, y0 + d, z], [x0, y0 + d, z]])} fill="#FFF1E6" stroke={INK} strokeWidth="1.1" />
      <polyline points={poly([[x0, y0, z], [x0 + w / 2, y0 + d * 0.62, z], [x0 + w, y0, z]])} fill="none" stroke={shade('#FFF1E6', -0.2)} strokeWidth="1.2" />
      <ellipse cx={sx} cy={sy + 3} rx="10" ry="6" fill={p.accent} stroke={shade(p.accent, -0.4)} strokeWidth="1" />
      <path d={HEART} transform={`translate(${sx - 5} ${sy}) scale(0.1 0.06)`} fill={shade(p.accent, 0.35)} />
    </g>
  );
}

/** The moment: he replies, and hearts burst up from the phone. */
function HeartBurst({ p }: { p: P }) {
  const [cx, cy] = S([3.5, 1.27, TOP + BOOKS + 4.0]);
  const kts = kt(0, 4.05, 4.3, 6.2, 8);
  return (
    <g>
      {/* screen bloom */}
      <circle cx={cx} cy={cy + 40} r="150" fill="url(#mn-bloom)" opacity="0">
        <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={kt(0, 4.0, 4.2, 5.4, 8)} dur={`${LOOP}s`} repeatCount="indefinite" />
      </circle>
      {/* shockwave ring starts outside the phone */}
      <ellipse cx={cx} cy={cy + 20} rx="80" ry="80" fill="none" stroke={p.accent} strokeWidth="3" opacity="0">
        <animate attributeName="rx" values="80;80;230;230" keyTimes={kt(0, 4.05, 5.2, 8)} dur={`${LOOP}s`} repeatCount="indefinite" />
        <animate attributeName="ry" values="80;80;230;230" keyTimes={kt(0, 4.05, 5.2, 8)} dur={`${LOOP}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;0.8;0;0" keyTimes={kt(0, 4.04, 4.1, 5.2, 8)} dur={`${LOOP}s`} repeatCount="indefinite" />
      </ellipse>
      {Array.from({ length: 9 }, (_, i) => {
        const a = -Math.PI / 2 + (i - 4) * 0.32 + (rand(i * 2.1) - 0.5) * 0.2;
        const dist = 110 + rand(i * 5.3) * 90;
        const ex = Math.cos(a) * dist * 1.25;
        const ey = Math.sin(a) * dist * 0.8;
        const s = 0.32 + rand(i * 9.7) * 0.3;
        const fill = i % 4 === 0 ? p.pop : i % 3 === 0 ? p.bubble : p.accent;
        return (
          <g key={i} transform={`translate(${cx} ${cy})`}>
            <g opacity="0">
              <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={kts} dur={`${LOOP}s`} repeatCount="indefinite" />
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0 0;0 0;${(ex * 0.7).toFixed(1)} ${(ey * 0.7).toFixed(1)};${ex.toFixed(1)} ${(ey - 30).toFixed(1)};${ex.toFixed(1)} ${(ey - 30).toFixed(1)}`}
                keyTimes={kts}
                calcMode="spline"
                keySplines="0 0 1 1;0.16 1 0.3 1;0.3 0 0.6 1;0 0 1 1"
                dur={`${LOOP}s`}
                repeatCount="indefinite"
              />
              <path d={HEART} transform={`scale(${s}) translate(-50 -47)`} fill={fill} stroke={INK} strokeWidth={3} />
            </g>
          </g>
        );
      })}
    </g>
  );
}

const isLight = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 > 140;
};

export default function MidnightNightstand(p: P) {
  const [lx, ly] = S([1.0, 0.9, TOP + 3.0]);
  const [phx, phy] = S([3.5, 1.3, TOP + 3]);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <filter id="mn-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <radialGradient id="mn-lamp">
          <stop offset="0" stopColor={p.lamp} stopOpacity="0.55" />
          <stop offset="0.4" stopColor={p.lamp} stopOpacity="0.16" />
          <stop offset="1" stopColor={p.lamp} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mn-phoneglow">
          <stop offset="0" stopColor={p.bubble} stopOpacity="0.3" />
          <stop offset="1" stopColor={p.bubble} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mn-bloom">
          <stop offset="0" stopColor={p.accent} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mn-flamehalo">
          <stop offset="0" stopColor={p.pop} stopOpacity="0.6" />
          <stop offset="1" stopColor={p.pop} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mn-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A0E18" />
          <stop offset="1" stopColor="#1E060C" />
        </linearGradient>
        <linearGradient id="mn-postergrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
        <linearGradient id="mn-vig" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.35" />
          <stop offset="0.3" stopColor="#000" stopOpacity="0" />
          <stop offset="0.8" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      <rect width="1200" height="900" fill={p.floor} />
      <g transform={`translate(${OX} ${OY})`}>
      {/* ── Room: two walls and the floor ── */}
      <polygon points={poly([[-3, -3, 14], [-3, -3, 0], [-3, 16, 0], [-3, 16, 14]])} fill={shade(p.wall, -0.18)} />
      <polygon points={poly([[-3, -3, 14], [-3, -3, 0], [18, -3, 0], [18, -3, 14]])} fill={p.wall} />
      {/* wallpaper: tiny hearts on the back wall */}
      <g fill={shade(p.wall, 0.12)} opacity="0.55">
        {Array.from({ length: 9 }, (_, i) =>
          Array.from({ length: 8 }, (_, j) => {
            const [hx, hy] = S([-2 + i * 2.2 + (j % 2) * 1.1, -3, 1.6 + j * 1.5]);
            return <path key={`${i}-${j}`} d={HEART} transform={`translate(${hx - 5} ${hy - 5}) scale(0.1)`} />;
          }),
        )}
      </g>
      {/* wainscot rail + skirting */}
      <polygon points={poly([[-3, -3, 3.2], [18, -3, 3.2], [18, -3, 0], [-3, -3, 0]])} fill={shade(p.wall, -0.12)} />
      <polygon points={poly([[-3, -3, 3.2], [-3, 16, 3.2], [-3, 16, 0], [-3, -3, 0]])} fill={shade(p.wall, -0.28)} />
      <polyline points={poly([[-3, 16, 3.2], [-3, -3, 3.2], [18, -3, 3.2]])} fill="none" stroke={shade(p.wall, 0.2)} strokeWidth="4" />
      <polyline points={poly([[-3, 16, 0.3], [-3, -3, 0.3], [18, -3, 0.3]])} fill="none" stroke={shade(p.wall, -0.45)} strokeWidth="5" />
      <polyline points={poly([[-3, -3, 14], [-3, -3, 0]])} stroke={INK} strokeWidth="1.2" />
      {/* floorboards */}
      <g stroke={shade(p.floor, -0.35)} strokeWidth="1.2" opacity="0.7">
        {Array.from({ length: 16 }, (_, i) => (
          <polyline key={i} points={poly([[-3 + i * 1.3, -3, 0], [-3 + i * 1.3, 18, 0]])} />
        ))}
      </g>
      {/* moonlight through the window on the floor */}
      <polygon points={poly([[1.3, -3, 0], [5.3, -3, 0], [7.4, 2.4, 0], [3.4, 2.4, 0]])} fill={p.moon} opacity="0.07" filter="url(#mn-blur)" />
      {/* rug */}
      <polygon points={poly([[-1.6, 1.8, 0.01], [7.5, 1.8, 0.01], [7.5, 9, 0.01], [-1.6, 9, 0.01]])} fill={shade(p.blanket, -0.4)} stroke={INK} strokeWidth="1" />
      <polygon points={poly([[-1.1, 2.3, 0.02], [7, 2.3, 0.02], [7, 8.5, 0.02], [-1.1, 8.5, 0.02]])} fill="none" stroke={p.pop} strokeWidth="1.5" opacity="0.55" strokeDasharray="6 5" />

      <Window p={p} />
      <Poster p={p} />

      {/* lamp light pooled on the walls (behind everything) */}
      <circle cx={lx} cy={ly} r="330" fill="url(#mn-lamp)">
        <Flicker dur={LOOP} seed={3} low={0.75} />
      </circle>

      <Nightstand p={p} />
      <Bed p={p} />
      <FloorProps p={p} />

      {/* ── On the nightstand, back to front ── */}
      <Shadow x={0.5} y={0.9} w={1.4} d={0.9} z={TOP} o={0.4} />
      <Lamp p={p} />
      <circle cx={phx} cy={phy} r="170" fill="url(#mn-phoneglow)">
        <animate attributeName="opacity" values="0.75;1;0.75" dur="4s" repeatCount="indefinite" {...spline2} />
      </circle>
      <PhoneStack p={p} />
      <Candle p={p} />
      <Letter p={p} />
      <Rose p={p} />
      <Tea p={p} />
      <HeartBurst p={p} />

      {/* drifting dust motes in the lamp light */}
      {Array.from({ length: 14 }, (_, i) => {
        const x0 = lx - 160 + rand(i * 3.9) * 320;
        const y0 = ly - 120 + rand(i * 6.2) * 260;
        const dur = [4, 8][i % 2];
        return (
          <circle key={i} cx={x0} cy={y0} r={1 + rand(i * 1.1) * 1.6} fill={p.lamp}>
            <animateTransform attributeName="transform" type="translate" values={`0 0;${(rand(i) * 16 - 8).toFixed(1)} -26;0 0`} dur={`${dur}s`} begin={`-${(rand(i * 2.2) * dur).toFixed(2)}s`} repeatCount="indefinite" {...spline2} />
            <animate attributeName="opacity" values="0.1;0.7;0.1" dur={`${dur}s`} begin={`-${(rand(i * 2.2) * dur).toFixed(2)}s`} repeatCount="indefinite" />
          </circle>
        );
      })}
      </g>
      <rect width="1200" height="900" fill="url(#mn-vig)" pointerEvents="none" />
    </svg>
  );
}
