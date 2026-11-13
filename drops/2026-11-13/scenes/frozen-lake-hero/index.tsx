import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoGable, IsoWindow, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Frozen Lake Hero',
  description:
    "Landing-page hero for Pike: a cutaway frozen lake where the agent's warm fishing hut tends sixteen ice holes, one per ad platform, wired to it under the ice. Pulses run along the lines, water ripples, smoke curls, a skier crosses the far shore, a fish swims in the cutaway, and once a loop a tip-up flag springs up with a +1 conversion.",
  tags: ['hero', 'isometric', 'landing page', 'winter', 'ad agent', 'animated svg'],
};

// Every SMIL duration divides the loop (6, 3, 2, 1.5, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Hut sign').default('PIKE'),
  chip: text('Conversion chip').default('+1 CONVERSION · TIKTOK'),
  skyTop: color('Sky top').default('#C9DCE6'),
  skyBottom: color('Sky bottom').default('#EEF3F6'),
  snow: color('Snow').default('#F4F7F9'),
  ice: color('Ice').default('#A7C4D4'),
  water: color('Water').default('#17242E'),
  hut: color('Hut walls').default('#2F6F8F'),
  trees: color('Pines').default('#35606B'),
  glow: color('Window light').default('#FFD27F'),
  flag: color('Flags').default('#E4572E'),
  night: toggle('Night (stars + aurora)').default(false),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { skyTop: '#46507A', skyBottom: '#F3B38E', snow: '#F6E9E4', ice: '#9FB3CC', hut: '#2C4A6B', trees: '#2E3E57', glow: '#FFC46B' },
  'polar-night': { skyTop: '#040C14', skyBottom: '#123344', snow: '#C9D8E0', ice: '#5E8597', water: '#06121A', hut: '#1F4E66', trees: '#16323A', night: true },
  blueprint: { skyTop: '#0F3B8C', skyBottom: '#3D6CC4', snow: '#EAF2FF', ice: '#7FB2FF', water: '#0A2A66', hut: '#134AA8', trees: '#0F3B8C', glow: '#FFDD00', flag: '#FFDD00' },
  'mid-century': { skyTop: '#E6D3B3', skyBottom: '#F4E9D8', snow: '#FBF5EA', ice: '#9CC2BE', water: '#2E2A24', hut: '#2C7873', trees: '#4F6D58', glow: '#E9B44C', flag: '#D96C3D' },
};

type P = z.infer<typeof schema>;

const U = 34;
const LOOP = scene.loop;
const OX = 600;
const OY = 262;
const INK = 'rgba(16,30,40,0.7)';
const C30 = Math.cos(Math.PI / 6);
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const N = 14; // lake size in world units

type Hole = { x: number; y: number; state: 'down' | 'up' | 'moment' | 'nibble'; label?: string };
const HOLES: Hole[] = [
  { x: 2, y: 2, state: 'down', label: 'META' },
  { x: 5.5, y: 2, state: 'nibble' },
  { x: 9, y: 2.2, state: 'up', label: 'GOOGLE' },
  { x: 12, y: 2, state: 'down' },
  { x: 2, y: 5.5, state: 'nibble', label: 'REDDIT' },
  { x: 12, y: 5.5, state: 'moment', label: 'TIKTOK' },
  { x: 2.2, y: 9, state: 'down' },
  { x: 12, y: 9.2, state: 'down', label: 'SNAP' },
  { x: 2, y: 12, state: 'up', label: 'LINKEDIN' },
  { x: 5.5, y: 12, state: 'down', label: 'YOUTUBE' },
  { x: 9, y: 12, state: 'nibble' },
  { x: 12, y: 12, state: 'down', label: 'CTV' },
  { x: 4.6, y: 4.4, state: 'down' },
  { x: 10.2, y: 4.5, state: 'down', label: 'X' },
  { x: 4.4, y: 10.2, state: 'down', label: 'AMAZON' },
  { x: 10.4, y: 10.4, state: 'nibble', label: 'PINTEREST' },
];
const HUT = { x: 6, y: 6, w: 2.4, d: 2, h: 1.7 };
const HUB: P3 = [HUT.x + HUT.w / 2, HUT.y + HUT.d + 0.4, 0];

function HoleGround({ h, p, k }: { h: Hole; p: P; k: number }) {
  const [cx, cy] = S([h.x, h.y, 0]);
  const rx = 0.55 * U * 1.2247;
  const ry = 0.55 * U * 0.7071;
  const begin = `-${(rand(k * 3.3) * 2).toFixed(2)}s`;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx * 1.55} ry={ry * 1.55} fill={p.snow} opacity={0.9} />
      <ellipse cx={cx} cy={cy + 1} rx={rx} ry={ry} fill={p.water} stroke={INK} strokeWidth={1.2} />
      <ellipse cx={cx - rx * 0.3} cy={cy - ry * 0.25} rx={rx * 0.35} ry={ry * 0.18} fill={p.ice} opacity={0.5} />
      <ellipse cx={cx} cy={cy + 1} rx={4} ry={2} fill="none" stroke={p.ice} strokeWidth={1.2}>
        <animate attributeName="rx" values={`3;${rx * 0.9}`} dur="2s" begin={begin} repeatCount="indefinite" />
        <animate attributeName="ry" values={`1.5;${ry * 0.9}`} dur="2s" begin={begin} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0" dur="2s" begin={begin} repeatCount="indefinite" />
      </ellipse>
      {h.label && (
        <g transform={`translate(${S([h.x + 0.95, h.y - 0.35, 0])[0]} ${S([h.x + 0.95, h.y - 0.35, 0])[1]}) matrix(${C30}, 0.5, ${-C30}, 0.5, 0, 0)`}>
          <text x={0} y={0} fontFamily="'Space Mono', ui-monospace, monospace" fontWeight={700} fontSize={11} letterSpacing={1.4} fill={p.water} opacity={0.65}>
            {h.label}
          </text>
        </g>
      )}
      {h.state === 'moment' && (
        <g>
          {[0, 1].map((j) => (
            <ellipse key={j} cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={j ? p.ice : p.flag} strokeWidth={3 - j} opacity="0">
              <animate attributeName="rx" values={`${rx};${rx};${rx * (4 - j)};${rx * (4 - j)}`} keyTimes="0;0.55;0.75;1" dur={`${LOOP}s`} repeatCount="indefinite" />
              <animate attributeName="ry" values={`${ry};${ry};${ry * (4 - j)};${ry * (4 - j)}`} keyTimes="0;0.55;0.75;1" dur={`${LOOP}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes="0;0.55;0.56;0.75;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            </ellipse>
          ))}
        </g>
      )}
    </g>
  );
}

/** The tip-up over a hole: cross frame + spring staff (rotate 80 = lying, 0 = sprung). */
function TipUp({ h, p, k }: { h: Hole; p: P; k: number }) {
  const [cx, cy] = S([h.x, h.y, 0]);
  const a1 = S([h.x - 0.75, h.y, 0.06]);
  const a2 = S([h.x + 0.75, h.y, 0.06]);
  const b1 = S([h.x, h.y - 0.75, 0.12]);
  const b2 = S([h.x, h.y + 0.75, 0.12]);
  // Only sprung flags wear the hot colour; set (lying) flags stay frost-grey.
  const hot = h.state === 'up' || h.state === 'moment';
  const staff = (
    <>
      <line x1={0} y1={0} x2={0} y2={-46} stroke={p.water} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M0,-46 L24,-39 L0,-32 Z" fill={hot ? p.flag : shade(p.ice, -0.15)} stroke={INK} strokeWidth={1.1} strokeLinejoin="round">
        {h.state === 'moment' && <animate attributeName="fill" values={`${shade(p.ice, -0.15)};${shade(p.ice, -0.15)};${p.flag};${p.flag};${shade(p.ice, -0.15)}`} keyTimes="0;0.55;0.57;0.93;1" dur={`${LOOP}s`} calcMode="discrete" repeatCount="indefinite" />}
      </path>
    </>
  );
  let anim: ReactNode = null;
  let rest = 80;
  if (h.state === 'up') {
    rest = 0;
    anim = <animateTransform attributeName="transform" type="rotate" values="-3;4;-3" dur="2s" begin={`-${k * 0.3}s`} repeatCount="indefinite" {...spline} />;
  } else if (h.state === 'nibble') {
    anim = <animateTransform attributeName="transform" type="rotate" values="80;80;72;80;76;80;80" keyTimes="0;0.2;0.25;0.3;0.34;0.4;1" dur="3s" begin={`-${(rand(k * 7.7) * 3).toFixed(2)}s`} repeatCount="indefinite" />;
  } else if (h.state === 'moment') {
    anim = <animateTransform attributeName="transform" type="rotate" values="80;80;-12;6;-3;0;0;80" keyTimes="0;0.55;0.585;0.61;0.635;0.66;0.93;1" dur={`${LOOP}s`} repeatCount="indefinite" />;
  }
  return (
    <g>
      <line x1={a1[0]} y1={a1[1]} x2={a2[0]} y2={a2[1]} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <line x1={a1[0]} y1={a1[1]} x2={a2[0]} y2={a2[1]} stroke={p.snow} strokeWidth={2.6} strokeLinecap="round" />
      <line x1={b1[0]} y1={b1[1]} x2={b2[0]} y2={b2[1]} stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <line x1={b1[0]} y1={b1[1]} x2={b2[0]} y2={b2[1]} stroke={p.snow} strokeWidth={2.6} strokeLinecap="round" />
      <g transform={`translate(${cx} ${cy - 4})`}>
        <g transform={`rotate(${rest})`}>
          {anim}
          {staff}
        </g>
        <circle r={3} fill={p.water} />
      </g>
    </g>
  );
}

function Pine({ x, y, s, p }: { x: number; y: number; s: number; p: P }) {
  const [cx, cy] = S([x, y, 0.5]);
  return (
    <g>
      <ellipse cx={cx + 10 * s} cy={cy + 4} rx={16 * s} ry={6 * s} fill={p.water} opacity={0.15} />
      <IsoCylinder x={x} y={y} z={0.5} r={0.08 * s} h={0.4 * s} color="#5A4A3E" u={U} ink={{ stroke: INK }} />
      <path d={`M${cx - 15 * s},${cy - 10 * s} L${cx},${cy - 62 * s} L${cx + 15 * s},${cy - 10 * s} Z`} fill={p.trees} stroke={INK} strokeWidth={1} strokeLinejoin="round" />
      <path d={`M${cx},${cy - 62 * s} L${cx + 15 * s},${cy - 10 * s} L${cx + 4 * s},${cy - 8 * s} Z`} fill={shade(p.trees, -0.25)} />
      <path d={`M${cx - 6 * s},${cy - 44 * s} L${cx},${cy - 62 * s} L${cx + 6 * s},${cy - 44 * s} Q${cx},${cy - 40 * s} ${cx - 6 * s},${cy - 44 * s} Z`} fill={p.snow} />
      <path d={`M${cx - 12 * s},${cy - 22 * s} Q${cx - 4 * s},${cy - 27 * s} ${cx + 2 * s},${cy - 22 * s}`} stroke={p.snow} strokeWidth={2.4 * s} fill="none" strokeLinecap="round" />
    </g>
  );
}

export default function FrozenLakeHero(p: P) {
  const night = p.night;
  const hub = S(HUB);
  const moment = HOLES.find((h) => h.state === 'moment')!;
  const mPos = S([moment.x, moment.y, 0]);
  const [chX, chY] = S([HUT.x + 0.6, HUT.y + 0.6, HUT.h + 0.95]);
  const [anX, anY] = S([HUT.x + 1.8, HUT.y + 0.9, HUT.h + 0.5]);
  const signAt = S([HUT.x + 0.35, HUT.y + HUT.d + 0.01, 1.22]);

  const lines = HOLES.map((h) => {
    const [x, y] = S([h.x, h.y, 0]);
    // gentle curve through a midpoint nudged sideways: lines under the ice aren't ruler-straight
    const mx = (x + hub[0]) / 2 + (h.y - h.x) * 3;
    const my = (y + hub[1]) / 2 + 6;
    return `M${x.toFixed(1)},${y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${hub[0].toFixed(1)},${hub[1].toFixed(1)}`;
  });

  // Upright things sorted back to front (x + y).
  const uprights: { key: number; node: ReactNode }[] = [
    ...HOLES.map((h, k) => ({ key: h.x + h.y, node: <TipUp key={`t${k}`} h={h} p={p} k={k} /> })),
    {
      key: HUT.x + HUT.y + HUT.w + 0.5,
      node: (
        <g key="hut">
          {/* window light spilling on the snow */}
          <polygon points={poly([[HUT.x + 1.3, HUT.y + HUT.d, 0.02], [HUT.x + 2.1, HUT.y + HUT.d, 0.02], [HUT.x + 2.6, HUT.y + HUT.d + 1.7, 0.02], [HUT.x + 1.1, HUT.y + HUT.d + 1.7, 0.02]])} fill={p.glow} opacity={night ? 0.35 : 0.2} filter="url(#fl-blur)" />
          <polygon points={poly([[HUT.x, HUT.y + HUT.d, 0.02], [HUT.x + HUT.w, HUT.y + HUT.d, 0.02], [HUT.x + HUT.w + 0.8, HUT.y + HUT.d + 0.9, 0.02], [HUT.x + 0.8, HUT.y + HUT.d + 0.9, 0.02]])} fill={p.water} opacity={0.18} filter="url(#fl-blur)" />
          {/* skids */}
          <IsoBox x={HUT.x - 0.1} y={HUT.y + 0.1} w={HUT.w + 0.2} d={0.2} h={0.12} color={shade(p.hut, -0.4)} u={U} ink={{ stroke: INK }} />
          <IsoBox x={HUT.x - 0.1} y={HUT.y + HUT.d - 0.3} w={HUT.w + 0.2} d={0.2} h={0.12} color={shade(p.hut, -0.4)} u={U} ink={{ stroke: INK }} />
          <IsoBox x={HUT.x} y={HUT.y} z={0.12} w={HUT.w} d={HUT.d} h={HUT.h - 0.12} color={p.hut} u={U} ink={{ stroke: INK }} />
          {/* plank lines */}
          {[0.5, 0.9, 1.3].map((zz) => (
            <polyline key={zz} points={poly([[HUT.x, HUT.y + HUT.d, zz], [HUT.x + HUT.w, HUT.y + HUT.d, zz], [HUT.x + HUT.w, HUT.y, zz]])} stroke={shade(p.hut, -0.45)} strokeWidth={1} fill="none" opacity={0.6} />
          ))}
          {/* door + windows */}
          <IsoWindow face="left" plane={HUT.y + HUT.d} a={HUT.x + 0.25} z={0.14} w={0.62} h={1.15} fill={shade(p.hut, -0.55)} u={U} ink={{ stroke: INK }} />
          <circle cx={S([HUT.x + 0.78, HUT.y + HUT.d, 0.7])[0]} cy={S([HUT.x + 0.78, HUT.y + HUT.d, 0.7])[1]} r={1.8} fill={p.glow} />
          <IsoWindow face="left" plane={HUT.y + HUT.d} a={HUT.x + 1.25} z={0.62} w={0.95} h={0.6} fill={shade(p.snow, -0.1)} u={U} ink={{ stroke: INK }} />
          <IsoWindow face="left" plane={HUT.y + HUT.d} a={HUT.x + 1.32} z={0.68} w={0.81} h={0.48} fill={p.glow} u={U} ink={{ strokeWidth: 0 }}>
            <Flicker dur={LOOP} seed={3} low={0.7} />
          </IsoWindow>
          <IsoWindow face="right" plane={HUT.x + HUT.w} a={HUT.y + 0.6} z={0.62} w={0.8} h={0.6} fill={shade(p.snow, -0.1)} u={U} ink={{ stroke: INK }} />
          <IsoWindow face="right" plane={HUT.x + HUT.w} a={HUT.y + 0.67} z={0.68} w={0.66} h={0.48} fill={p.glow} u={U} ink={{ strokeWidth: 0 }}>
            <Flicker dur={LOOP} seed={8} low={0.7} />
          </IsoWindow>
          {/* the moment: windows flash as the flag springs */}
          <g opacity="0">
            <animate attributeName="opacity" values="0;0;0.8;0;0" keyTimes="0;0.55;0.57;0.66;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <IsoWindow face="left" plane={HUT.y + HUT.d} a={HUT.x + 1.32} z={0.68} w={0.81} h={0.48} fill="#FFFFFF" u={U} ink={{ strokeWidth: 0 }} />
          </g>
          {/* sign plate in the wall's plane */}
          <IsoWindow face="left" plane={HUT.y + HUT.d + 0.01} a={HUT.x + 0.2} z={1.32} w={2.0} h={0.3} fill={p.snow} u={U} ink={{ stroke: INK }} />
          <g transform={`translate(${signAt[0] + 4} ${signAt[1] + 13}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
            <text x={0} y={0} fontFamily="'Climate Crisis', 'Familjen Grotesk', system-ui, sans-serif" fontSize={11} letterSpacing={2} fill={p.hut}>
              {p.sign}
            </text>
          </g>
          {/* snowy gable roof with overhang */}
          <IsoGable x={HUT.x - 0.2} y={HUT.y - 0.2} z={HUT.h} w={HUT.w + 0.4} d={HUT.d + 0.4} h={0.85} color={p.snow} u={U} ink={{ stroke: INK }} />
          <polygon points={poly([[HUT.x - 0.2, HUT.y + HUT.d + 0.2, HUT.h], [HUT.x + HUT.w + 0.2, HUT.y + HUT.d + 0.2, HUT.h], [HUT.x + HUT.w + 0.2, HUT.y + HUT.d + 0.2, HUT.h - 0.12], [HUT.x - 0.2, HUT.y + HUT.d + 0.2, HUT.h - 0.12]])} fill={shade(p.hut, -0.5)} stroke={INK} strokeWidth={1} />
          {[0.2, 0.45, 0.7].map((t, i) => (
            <circle key={i} cx={S([HUT.x + 0.3 + i * 0.8, HUT.y + HUT.d + 0.2, HUT.h - 0.18])[0]} cy={S([HUT.x + 0.3 + i * 0.8, HUT.y + HUT.d + 0.2, HUT.h - 0.18])[1] + t * 4} r={1.6} fill={p.snow} opacity={0.9} />
          ))}
          {/* chimney + smoke */}
          <IsoBox x={HUT.x + 0.45} y={HUT.y + 0.45} z={HUT.h + 0.3} w={0.32} d={0.32} h={0.7} color={shade(p.hut, -0.2)} u={U} ink={{ stroke: INK }} />
          {[0, 1, 2].map((k) => (
            <circle key={k} cx={chX} cy={chY} r="5" fill={night ? '#9FB3C0' : '#FFFFFF'} opacity="0">
              <animate attributeName="cy" values={`${chY};${chY - 70}`} dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
              <animate attributeName="cx" values={`${chX};${chX + 26}`} dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
              <animate attributeName="r" values="4;15" dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0" dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
            </circle>
          ))}
          {/* antenna: the agent is listening */}
          <line x1={anX} y1={anY} x2={anX} y2={anY - 34} stroke={p.water} strokeWidth={2} />
          <path d={`M${anX - 9},${anY - 30} Q${anX},${anY - 22} ${anX + 9},${anY - 30}`} stroke={p.water} strokeWidth={2} fill="none" />
          <circle cx={anX} cy={anY - 36} r={3.5} fill={p.flag} filter="url(#fl-glow)">
            <animate attributeName="opacity" values="1;1;0.15;0.15;1" keyTimes="0;0.4;0.5;0.9;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
          {[0, 1].map((j) => (
            <circle key={j} cx={anX} cy={anY - 36} r="4" fill="none" stroke={p.flag} strokeWidth="1.4">
              <animate attributeName="r" values="4;26" dur="1.5s" begin={`-${j * 0.75}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.7;0" dur="1.5s" begin={`-${j * 0.75}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      ),
    },
    {
      key: 8.8 + 8.6,
      node: (
        <g key="sled">
          {/* gear sled with a crate and a lantern */}
          <polyline points={poly([[8.75, 8.55, 0.02], [9.95, 8.55, 0.02], [10.15, 8.55, 0.2]])} stroke={p.water} strokeWidth={2} fill="none" />
          <polyline points={poly([[8.75, 9.05, 0.02], [9.95, 9.05, 0.02], [10.15, 9.05, 0.2]])} stroke={p.water} strokeWidth={2} fill="none" />
          <IsoBox x={8.8} y={8.5} z={0.1} w={1.15} d={0.6} h={0.12} color={shade(p.hut, 0.3)} u={U} ink={{ stroke: INK }} />
          <IsoBox x={8.9} y={8.55} z={0.22} w={0.55} d={0.5} h={0.4} color="#B98B5E" u={U} ink={{ stroke: INK }} />
          <IsoCylinder x={9.7} y={8.8} z={0.22} r={0.1} h={0.3} color={p.glow} u={U} ink={{ stroke: INK }} />
        </g>
      ),
    },
    {
      key: 4.4 + 8.6,
      node: (
        <g key="auger">
          {/* ice auger stuck in the snow */}
          <line x1={S([4.4, 8.6, 0])[0]} y1={S([4.4, 8.6, 0])[1]} x2={S([4.4, 8.6, 1.6])[0]} y2={S([4.4, 8.6, 1.6])[1]} stroke={p.water} strokeWidth={3} />
          <line x1={S([4.1, 8.6, 1.6])[0]} y1={S([4.1, 8.6, 1.6])[1]} x2={S([4.7, 8.6, 1.6])[0]} y2={S([4.7, 8.6, 1.6])[1]} stroke={p.water} strokeWidth={3} strokeLinecap="round" />
          {[0.2, 0.4, 0.6].map((zz) => (
            <ellipse key={zz} cx={S([4.4, 8.6, zz])[0]} cy={S([4.4, 8.6, zz])[1]} rx={5} ry={2.4} fill="none" stroke={shade(p.snow, -0.4)} strokeWidth={1.4} />
          ))}
        </g>
      ),
    },
  ];
  uprights.sort((a, b) => a.key - b.key);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="fl-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <linearGradient id="fl-ice" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={shade(p.ice, 0.45)} />
          <stop offset="1" stopColor={shade(p.ice, 0.1)} />
        </linearGradient>
        <linearGradient id="fl-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.ice, -0.25)} />
          <stop offset="1" stopColor={p.water} />
        </linearGradient>
        <linearGradient id="fl-mtn1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.skyTop, -0.12)} stopOpacity="0.85" />
          <stop offset="1" stopColor={p.skyBottom} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fl-mtn2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.skyTop, -0.2)} stopOpacity="0.85" />
          <stop offset="1" stopColor={p.skyBottom} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="fl-halo">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="0.4" stopColor="#FFFFFF" stopOpacity="0.2" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <filter id="fl-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="fl-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="fl-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </defs>

      {/* ── Sky ── */}
      <rect width="1200" height="900" fill="url(#fl-sky)" />
      {night && (
        <g>
          {Array.from({ length: 70 }, (_, i) => {
            const dur = [2, 3, 6][i % 3];
            return (
              <circle key={i} cx={rand(i * 3.1) * 1200} cy={rand(i * 7.7) * 330} r={0.6 + rand(i * 1.3) * 1.4} fill="#FFFFFF">
                <animate attributeName="opacity" values="0.2;1;0.2" dur={`${dur}s`} begin={`-${(rand(i * 5.9) * dur).toFixed(2)}s`} repeatCount="indefinite" />
              </circle>
            );
          })}
          {[0, 1, 2].map((k) => (
            <path key={k} d={`M-40 ${190 + k * 34} C 260 ${90 + k * 30}, 640 ${260 - k * 20}, 1240 ${120 + k * 40}`} stroke={['#3DF2B0', '#2EF2C4', '#8A7BFF'][k]} strokeWidth={46 - k * 10} fill="none" opacity="0.18" filter="url(#fl-soft)">
              <animate attributeName="opacity" values="0.12;0.3;0.12" dur={`${[6, 3, 6][k]}s`} begin={`-${k}s`} repeatCount="indefinite" {...spline} />
            </path>
          ))}
        </g>
      )}
      {/* low winter sun / moon */}
      <circle cx="930" cy="150" r="140" fill="url(#fl-halo)" />
      <circle cx="930" cy="150" r="34" fill={night ? '#EEF3F6' : '#FFF8EC'} />
      {/* drifting clouds */}
      {!night &&
        [0, 1].map((k) => (
          <g key={k} opacity={0.85}>
            <animateTransform attributeName="transform" type="translate" values={`0 0;${k ? -24 : 30} 0;0 0`} dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
            <ellipse cx={k ? 260 : 760} cy={k ? 120 : 84} rx={90} ry={16} fill="#FFFFFF" opacity={0.75} />
            <ellipse cx={k ? 230 : 790} cy={k ? 108 : 74} rx={46} ry={16} fill="#FFFFFF" opacity={0.75} />
          </g>
        ))}
      {/* distant mountains */}
      <polygon points="0,300 120,190 210,250 330,150 460,260 560,200 650,270 700,520 0,520" fill="url(#fl-mtn1)" />
      <polygon points="540,300 700,170 800,240 930,160 1060,250 1200,190 1200,520 540,520" fill="url(#fl-mtn2)" />
      <polygon points="330,150 300,178 318,174 336,184 352,170 364,176" fill={p.snow} opacity={0.9} />
      <polygon points="700,170 676,190 694,186 706,196 720,184" fill={p.snow} opacity={0.9} />
      <polygon points="930,160 904,184 924,180 938,190 952,178 960,184" fill={p.snow} opacity={0.9} />
      {/* skier crossing the far ridge */}
      <g>
        <animateMotion dur={`${LOOP}s`} repeatCount="indefinite" path="M120,262 C320,250 520,272 760,258" />
        <line x1="-7" y1="2" x2="9" y2="0" stroke={p.water} strokeWidth="1.6" />
        <line x1="0" y1="-12" x2="1" y2="1" stroke={p.water} strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="0" cy="-15" r="2.6" fill={p.flag} />
        <line x1="-2" y1="-9" x2="-7" y2="2" stroke={p.water} strokeWidth="1" />
      </g>

      <g transform={`translate(${OX} ${OY})`}>
        {/* soft ground shadow under the cutaway */}
        <ellipse cx={0} cy={S([N, N, 0])[1] + 34} rx={470} ry={50} fill={p.water} opacity={0.18} filter="url(#fl-soft)" />

        {/* back snow banks with pines */}
        <IsoBox x={-2} y={-2} w={N + 2} d={2} h={0.5} color={p.snow} u={U} ink={{ stroke: INK }} />
        <IsoBox x={-2} y={0} w={2} d={N} h={0.5} color={p.snow} u={U} ink={{ stroke: INK }} />
        {[
          [-1.2, -1.3, 1.1],
          [0.8, -1.4, 0.9],
          [2.6, -1.1, 1.2],
          [4.8, -1.5, 0.85],
          [7.2, -1.2, 1.1],
          [9.6, -1.5, 0.9],
          [11.8, -1.2, 1.05],
          [13.4, -1.4, 0.8],
          [-1.4, 1.4, 0.95],
          [-1.1, 3.6, 1.15],
          [-1.5, 6.0, 0.85],
          [-1.2, 8.3, 1.05],
          [-1.4, 10.8, 0.9],
          [-1.1, 12.9, 1.1],
        ]
          .sort((a, b) => a[0] + a[1] - (b[0] + b[1]))
          .map(([x, y, s], i) => (
            <Pine key={i} x={x} y={y} s={s} p={p} />
          ))}

        {/* cutaway lake: ice crust over dark water */}
        <IsoBox x={0} y={0} z={-1.6} w={N} d={N} h={1.25} color={p.water} u={U} top={false} ink={{ stroke: INK }} />
        <polygon points={poly([[0, N, -1.6], [N, N, -1.6], [N, N, -0.35], [0, N, -0.35]])} fill="url(#fl-water)" opacity={0.9} />
        <IsoBox x={0} y={0} z={-0.35} w={N} d={N} h={0.35} color={p.ice} u={U} top={false} ink={{ stroke: INK }} />
        {/* fishing lines hanging into the water on the cutaway faces */}
        {[2, 5.5, 9, 12].map((x) => (
          <g key={x}>
            <line x1={S([x, N, -0.35])[0]} y1={S([x, N, -0.35])[1]} x2={S([x, N, -1.2])[0]} y2={S([x, N, -1.2])[1]} stroke={shade(p.ice, 0.4)} strokeWidth={1} opacity={0.7} />
            <circle cx={S([x, N, -1.22])[0]} cy={S([x, N, -1.22])[1]} r={2.4} fill={p.flag} />
          </g>
        ))}
        {/* a pike patrolling the cutaway */}
        <g>
          <animateMotion dur={`${LOOP}s`} repeatCount="indefinite" path={`M${S([1, N, -0.95])[0]},${S([1, N, -0.95])[1]} L${S([13, N, -0.95])[0]},${S([13, N, -0.95])[1]}`} keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="spline" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
          <g transform={`matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
            <ellipse cx="0" cy="0" rx="17" ry="5" fill={shade(p.ice, 0.2)} opacity={0.75} />
            <path d="M-15,0 L-25,-6 L-25,6 Z" fill={shade(p.ice, 0.2)} opacity={0.75} />
            <circle cx="10" cy="-1" r="1.2" fill={p.water} />
          </g>
        </g>

        {/* lake surface */}
        <polygon points={poly([[0, 0, 0], [N, 0, 0], [N, N, 0], [0, N, 0]])} fill="url(#fl-ice)" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
        {/* wind-blown snow drifts + cracks */}
        {Array.from({ length: 10 }, (_, i) => {
          const [x, y] = S([1 + rand(i * 2.7) * 12, 1 + rand(i * 6.1) * 12, 0]);
          return <ellipse key={i} cx={x} cy={y} rx={30 + rand(i) * 40} ry={8 + rand(i * 3) * 8} fill={p.snow} opacity={0.55} />;
        })}
        {Array.from({ length: 8 }, (_, i) => {
          const [x, y] = S([1 + rand(i * 9.1) * 12, 1 + rand(i * 4.3) * 12, 0]);
          return <path key={i} d={`M${x},${y} l${18 + rand(i) * 20},${6 + rand(i * 2) * 6} l${10 + rand(i * 5) * 16},-5`} stroke={shade(p.ice, -0.3)} strokeWidth={1.1} fill="none" opacity={0.6} />;
        })}
        {/* footpath from the door */}
        {Array.from({ length: 9 }, (_, i) => {
          const [x, y] = S([HUT.x + 0.55 - i * 0.18, HUT.y + HUT.d + 0.5 + i * 0.5, 0]);
          return <ellipse key={i} cx={x + (i % 2 ? 4 : -4)} cy={y} rx={3} ry={1.6} fill={shade(p.ice, -0.25)} opacity={0.6} />;
        })}

        {/* lines under the ice, with pulses travelling to the agent */}
        {lines.map((d, i) => {
          const hot = HOLES[i].state === 'moment' || HOLES[i].state === 'up';
          return (
            <g key={i}>
              <path d={d} stroke={hot ? p.flag : shade(p.ice, -0.35)} strokeWidth={hot ? 2 : 1.4} strokeDasharray="3 6" strokeLinecap="round" fill="none" opacity={0.85}>
                <animate attributeName="stroke-dashoffset" values="0;-18" dur="1s" repeatCount="indefinite" />
              </path>
              <circle r={2.6} fill={hot ? p.flag : p.hut}>
                <animateMotion dur="3s" begin={`-${(rand(i * 4.7) * 3).toFixed(2)}s`} repeatCount="indefinite" path={d} />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="3s" begin={`-${(rand(i * 4.7) * 3).toFixed(2)}s`} repeatCount="indefinite" />
              </circle>
            </g>
          );
        })}
        <ellipse cx={hub[0]} cy={hub[1]} rx={10} ry={5} fill={p.hut} stroke={INK} strokeWidth={1} />

        {/* holes */}
        {HOLES.map((h, k) => (
          <HoleGround key={k} h={h} p={p} k={k} />
        ))}

        {/* upright things, back to front */}
        {uprights.map((u) => u.node)}

        {/* the moment's chip rises from the sprung flag */}
        <g opacity="0">
          <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.58;0.62;0.85;0.92;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0 10;0 10;0 0;0 -16;0 -16" keyTimes="0;0.58;0.64;0.92;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          {(() => {
            const w = p.chip.length * 8 + 36;
            // keep the chip inside the canvas (local coords are offset by OX)
            const x0 = Math.min(mPos[0] - w / 2, 1200 - OX - 24 - w);
            const y0 = mPos[1] - 104;
            return (
              <g>
                <rect x={x0 + 3} y={y0 + 4} width={w} height={28} rx={6} fill={p.water} />
                <rect x={x0} y={y0} width={w} height={28} rx={6} fill={p.snow} stroke={p.water} strokeWidth={1.6} />
                <circle cx={x0 + 14} cy={y0 + 14} r={4.5} fill={p.flag} />
                <text x={x0 + 26} y={y0 + 18.5} fontFamily="'Space Mono', ui-monospace, monospace" fontWeight={700} fontSize={13} fill={p.water}>
                  {p.chip}
                </text>
              </g>
            );
          })()}
        </g>
      </g>

      {/* ── Snowfall (tiled, seamless) ── */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;14 0;0 0" dur="3s" repeatCount="indefinite" {...spline} />
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 -450;0 0" dur={`${LOOP}s`} repeatCount="indefinite" />
          {[0, 450, 900].flatMap((off) =>
            Array.from({ length: 34 }, (_, i) => <circle key={`${off}-${i}`} cx={rand(i * 2.9) * 1200} cy={rand(i * 8.3) * 450 + off} r={1.2 + rand(i * 4.1) * 2.6} fill="#FFFFFF" opacity={0.55 + rand(i * 1.9) * 0.4} />),
          )}
        </g>
      </g>
    </svg>
  );
}
