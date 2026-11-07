import { z } from 'zod';
import { color, text } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoGrid, iso, pts, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Allocation Engine',
  description:
    'Landing-page hero for Mandate: an isometric coin-sorting machine in a vault room. Budget pours into the hopper, the sorter routes coins down a chute into glass platform tubes filled like a bar chart, and every loop a rebalance flashes the winning tube.',
  tags: ['hero', 'isometric', 'machine', 'finance', 'ads', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Plaque').default('MANDATE · ALLOCATION ENGINE'),
  ticker: text('Wall ticker').default('META ▲2.3   GOOGLE ▲0.9   TIKTOK ▲3.1   YOUTUBE ▼0.4   AMAZON ▲1.2   LINKEDIN ▼1.8   REDDIT ▲0.6   '),
  win: text('Rebalance pop').default('+$12.4K → TIKTOK'),
  labels: text('Tube labels (comma list, 7)').default('META,GOOG,TTOK,YT,AMZN,LNKD,RDDT'),
  wall: color('Walls').default('#16161A'),
  floor: color('Floor').default('#111114'),
  metal: color('Machine').default('#2A2A30'),
  gold: color('Gold').default('#C9A45C'),
  glass: color('Glass').default('#D9DEE6'),
  glow: color('Lamp light').default('#E8D9B5'),
  ink: color('Labels').default('#F3EDE2'),
  outline: color('Outline').default('#050507'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  swiss: { wall: '#E6E6E1', floor: '#D2D2CC', metal: '#F5F5F0', gold: '#E3000F', glass: '#FFFFFF', glow: '#FFF6E0', ink: '#0A0A0A', outline: '#3A3A38' },
  blueprint: { wall: '#0F3B8C', floor: '#0B2F72', metal: '#134AA8', gold: '#FFDD00', glass: '#BFD8FF', glow: '#EAF2FF', ink: '#EAF2FF', outline: '#071B44' },
  forest: { wall: '#0E1A14', floor: '#0A140F', metal: '#18291F', gold: '#B5E550', glass: '#CFE3D3', glow: '#FFE7B0', ink: '#EAF2DC', outline: '#030806' },
  cherry: { wall: '#2A0A10', floor: '#1E070B', metal: '#3F1019', gold: '#F7B32B', glass: '#F5C6AA', glow: '#FFE8E0', ink: '#FFE8E0', outline: '#0C0204' },
};

type P = z.infer<typeof schema>;

const U = 46;
const OX = 520;
const OY = 404;
const LOOP = scene.loop;
const C30 = Math.cos(Math.PI / 6);
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const f = (n: number) => n.toFixed(2);

/** Draw in a plane y = const (reads along +x, local y points down). */
const leftPlane = ([x, y, z]: P3) => {
  const [a, b] = S([x, y, z]);
  return `matrix(${C30} 0.5 0 1 ${f(a)} ${f(b)})`;
};
/** Draw in a plane x = const (reads along -y, local y points down). */
const rightPlane = ([x, y, z]: P3) => {
  const [a, b] = S([x, y, z]);
  return `matrix(${C30} -0.5 0 1 ${f(a)} ${f(b)})`;
};

/** Cylinder body + top ellipse as path strings, so fills can animate their level. */
function cyl(x: number, y: number, r: number, z0: number, h: number) {
  const [cx, by] = S([x, y, z0]);
  const ty = S([x, y, z0 + h])[1];
  const rx = r * U * 1.2247;
  const ry = r * U * 0.7071;
  return {
    body: `M${f(cx - rx)},${f(ty)} L${f(cx - rx)},${f(by)} A${f(rx)},${f(ry)} 0 0 0 ${f(cx + rx)},${f(by)} L${f(cx + rx)},${f(ty)} Z`,
    top: { cx, cy: ty, rx, ry },
  };
}

const TUBES = { x0: 5.7, dx: 0.95, y: 2.5, r: 0.36, z0: 0.45, h: 3.4 };
const LEVELS = [0.78, 0.64, 0.9, 0.46, 0.4, 0.3, 0.55];
const WIN = 2;
const tubeX = (i: number) => TUBES.x0 + i * TUBES.dx;
const CHUTE = { z: 4.45, y0: 2.2, y1: 2.8, x0: 3.2, x1: 12.4 };

function Coin({ fill, edge }: { fill: string; edge: string }) {
  return (
    <g>
      <ellipse cx={0} cy={2} rx={7.5} ry={4.2} fill={edge} />
      <ellipse cx={0} cy={0} rx={7.5} ry={4.2} fill={fill} stroke={edge} strokeWidth={0.8} />
      <ellipse cx={-1.5} cy={-1} rx={3} ry={1.4} fill="#ffffff" opacity={0.35} />
    </g>
  );
}

function Gear({ r, teeth, fill, ink, dur, reverse }: { r: number; teeth: number; fill: string; ink: string; dur: number; reverse?: boolean }) {
  const d = Array.from({ length: teeth * 2 }, (_, i) => {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.8;
    return `${i ? 'L' : 'M'}${f(Math.cos(a) * rr)},${f(Math.sin(a) * rr)}`;
  }).join(' ');
  return (
    <g>
      <animateTransform attributeName="transform" type="rotate" values={reverse ? '360;0' : '0;360'} dur={`${dur}s`} repeatCount="indefinite" />
      <path d={`${d} Z`} fill={fill} stroke={ink} strokeWidth={1.2} strokeLinejoin="round" />
      <circle r={r * 0.32} fill={shade(fill, -0.4)} stroke={ink} strokeWidth={1} />
      <line x1={0} y1={-r * 0.6} x2={0} y2={r * 0.6} stroke={shade(fill, -0.35)} strokeWidth={2} />
    </g>
  );
}

function Gauge({ r, p, dur, begin = 0 }: { r: number; p: P; dur: number; begin?: number }) {
  return (
    <g>
      <circle r={r + 3} fill={p.gold} stroke={p.outline} strokeWidth={1.2} />
      <circle r={r} fill={shade(p.glow, -0.05)} />
      {Array.from({ length: 9 }, (_, i) => {
        const a = Math.PI * (0.8 + (i / 8) * 1.4);
        return <line key={i} x1={Math.cos(a) * r * 0.72} y1={Math.sin(a) * r * 0.72} x2={Math.cos(a) * r * 0.9} y2={Math.sin(a) * r * 0.9} stroke={p.outline} strokeWidth={1} />;
      })}
      <g>
        <animateTransform attributeName="transform" type="rotate" values="-40;35;10;50;-40" keyTimes="0;0.3;0.5;0.8;1" dur={`${dur}s`} begin={`${begin}s`} repeatCount="indefinite" />
        <line x1={0} y1={0} x2={0} y2={-r * 0.82} stroke="#B3261E" strokeWidth={1.8} strokeLinecap="round" />
      </g>
      <circle r={2.2} fill={p.outline} />
    </g>
  );
}

export default function AllocationEngine(p: P) {
  const ink = { stroke: p.outline, strokeWidth: 1.2 };
  const labels = p.labels.split(',').map((s) => s.trim()).slice(0, 7);
  const goldEdge = shade(p.gold, -0.45);

  // Shared timing for the rebalance moment: 4.0–4.9 s of the 6 s loop.
  const mKeys = '0;0.66;0.69;0.8;1';
  const moment = (vals: string) => ({ values: vals, keyTimes: mKeys, dur: `${LOOP}s`, repeatCount: 'indefinite' as const });

  const sorter = { x: 0, y: 0.8, w: 3.2, d: 3.4, h: 5 };
  const hop = { top: 8, bot: sorter.h + 0.1, x0: 0.5, x1: 2.7, y0: 1.4, y1: 3.6, bx0: 1.35, bx1: 1.85, by0: 2.25, by1: 2.75 };
  const hopCenter = S([1.6, 2.5, hop.top]);

  // Chute coins: exit the sorter, ride the chute and drop into a tube.
  const exit = S([CHUTE.x0, 2.5, CHUTE.z + 0.12]);
  const chuteCoins = [0, 2, 4, 1, 6, 2].map((tube, k) => {
    const tx = tubeX(tube);
    const above = S([tx, 2.5, CHUTE.z + 0.12 - (tx - CHUTE.x0) * 0.01]);
    const into = S([tx, 2.5, TUBES.z0 + TUBES.h - 0.1]);
    return { k, d: `M${f(exit[0])},${f(exit[1])} L${f(above[0])},${f(above[1])} L${f(into[0])},${f(into[1])}`, begin: -k * 0.5 };
  });

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${scene.width} ${scene.height}`}>
      <defs>
        <linearGradient id="ae-wallL" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.wall, -0.35)} />
          <stop offset="1" stopColor={shade(p.wall, 0.06)} />
        </linearGradient>
        <linearGradient id="ae-wallR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.wall, -0.2)} />
          <stop offset="1" stopColor={shade(p.wall, 0.14)} />
        </linearGradient>
        <radialGradient id="ae-pool">
          <stop offset="0" stopColor={p.gold} stopOpacity="0.45" />
          <stop offset="1" stopColor={p.gold} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ae-lamp">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ae-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.32" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ae-hole" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.outline} />
          <stop offset="1" stopColor={shade(p.metal, -0.5)} />
        </linearGradient>
        <filter id="ae-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="ae-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <clipPath id="ae-tick">
          <rect x={0} y={-30} width={6.4 * U} height={44} />
        </clipPath>
        <clipPath id="ae-screen">
          <rect x={0} y={0} width={2.4 * U} height={0.9 * U} />
        </clipPath>
      </defs>

      <rect width={scene.width} height={scene.height} fill={shade(p.wall, -0.4)} />

      <g transform={`translate(${OX} ${OY})`}>
        {/* ── room: two back walls and a polished floor ── */}
        <polygon points={poly([[-1, -1, 0], [-1, 9, 0], [-1, 9, 14], [-1, -1, 14]])} fill="url(#ae-wallL)" />
        <polygon points={poly([[-1, -1, 0], [14, -1, 0], [14, -1, 14], [-1, -1, 14]])} fill="url(#ae-wallR)" />
        {/* wall panelling: vertical seams */}
        {Array.from({ length: 7 }, (_, i) => (
          <polyline key={`l${i}`} points={poly([[-1, 8 - i * 1.5, 0], [-1, 8 - i * 1.5, 14]])} stroke={shade(p.wall, -0.45)} strokeWidth={1.4} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <polyline key={`r${i}`} points={poly([[0.6 + i * 1.6, -1, 0], [0.6 + i * 1.6, -1, 14]])} stroke={shade(p.wall, -0.4)} strokeWidth={1.4} />
        ))}
        {/* baseboards: gold rule */}
        <polyline points={poly([[-1, 9, 0.35], [-1, -1, 0.35], [14, -1, 0.35]])} fill="none" stroke={p.gold} strokeWidth={2} opacity={0.7} />
        <polygon points={poly([[-1, -1, 0], [14, -1, 0], [14, 9, 0], [-1, 9, 0]])} fill={p.floor} />
        <IsoGrid x={-1} y={-1} w={15} d={10} u={U} color={p.gold} opacity={0.12} />

        {/* vault door on the back wall, behind the tubes */}
        <g transform={leftPlane([8.6, -0.98, 5.6])}>
          <circle r={2.7 * U} fill={shade(p.wall, -0.25)} stroke={p.outline} strokeWidth={2} />
          <circle r={2.45 * U} fill="none" stroke={p.gold} strokeWidth={3} opacity={0.75} />
          <circle r={2.1 * U} fill={shade(p.wall, -0.1)} stroke={shade(p.wall, -0.45)} strokeWidth={2} />
          {Array.from({ length: 16 }, (_, i) => {
            const a = (i / 16) * Math.PI * 2;
            return <circle key={i} cx={Math.cos(a) * 2.28 * U} cy={Math.sin(a) * 2.28 * U} r={4} fill={p.gold} opacity={0.8} />;
          })}
          <g>
            <animateTransform attributeName="transform" type="rotate" values="0;-30;-30;0;0" keyTimes="0;0.2;0.5;0.7;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            {[0, 60, 120].map((a) => (
              <rect key={a} x={-1.2 * U} y={-5} width={2.4 * U} height={10} rx={5} fill={shade(p.wall, -0.4)} stroke={p.gold} strokeWidth={1.5} transform={`rotate(${a})`} />
            ))}
            <circle r={0.35 * U} fill={p.gold} stroke={p.outline} strokeWidth={1.5} />
          </g>
        </g>

        {/* wall ticker board on the left wall */}
        <g transform={rightPlane([-0.98, 7.6, 9.2])}>
          <rect x={-8} y={-38} width={6.4 * U + 16} height={60} fill={shade(p.metal, -0.45)} stroke={p.gold} strokeWidth={2} />
          <g clipPath="url(#ae-tick)">
            <text x={0} y={2} fontFamily="Space Mono, monospace" fontSize={24} fontWeight={700} fill={p.glow} letterSpacing="2">
              <animateTransform attributeName="transform" type="translate" values="0 0;-760 0" dur={`${LOOP}s`} repeatCount="indefinite" />
              {p.ticker}
              {p.ticker}
              {p.ticker}
            </text>
          </g>
        </g>

        {/* framed performance chart on the left wall */}
        <g transform={rightPlane([-0.98, 7.9, 7.0])}>
          <rect x={0} y={0} width={4.2 * U} height={2.0 * U} fill={shade(p.wall, -0.3)} stroke={p.gold} strokeWidth={2.5} />
          <rect x={6} y={6} width={4.2 * U - 12} height={2.0 * U - 12} fill="none" stroke={shade(p.gold, -0.3)} strokeWidth={1} />
          {[0.3, 0.55, 0.8].map((k) => (
            <line key={k} x1={14} x2={4.2 * U - 14} y1={k * 2 * U} y2={k * 2 * U} stroke={shade(p.wall, 0.15)} strokeWidth={1} strokeDasharray="3 5" />
          ))}
          <polyline
            points={Array.from({ length: 12 }, (_, i) => `${f(14 + (i / 11) * (4.2 * U - 28))},${f(2 * U - 16 - (i / 11) * 1.25 * U - Math.sin(i * 1.7) * 10)}`).join(' ')}
            fill="none"
            stroke={p.gold}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeDasharray="400"
          >
            <animate attributeName="stroke-dashoffset" values="400;0;0;400" keyTimes="0;0.5;0.95;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          </polyline>
          <text x={14} y={22} fontFamily="Space Mono, monospace" fontSize={13} fontWeight={700} fill={p.ink} letterSpacing="2">
            ROAS · 90D
          </text>
        </g>

        {/* pendant lamps: cords, shades and light cones */}
        {[7.2, 10.2].map((x, i) => {
          const [lx, ly] = S([x, 2.5, 9]);
          return (
            <g key={x}>
              <line x1={lx} y1={-OY} x2={lx} y2={ly - 14} stroke={p.outline} strokeWidth={2} />
              <polygon points={`${lx - 110},${ly + 290} ${lx + 110},${ly + 290} ${lx + 22},${ly + 6} ${lx - 22},${ly + 6}`} fill="url(#ae-cone)" style={{ mixBlendMode: 'screen' }}>
                <Flicker dur={LOOP} seed={i + 3} low={0.7} />
              </polygon>
              <path d={`M${lx - 30},${ly + 6} Q${lx - 26},${ly - 22} ${lx},${ly - 24} Q${lx + 26},${ly - 22} ${lx + 30},${ly + 6} Z`} fill={p.gold} stroke={p.outline} strokeWidth={1.4} />
              <ellipse cx={lx} cy={ly + 6} rx={30} ry={7} fill={p.glow} />
            </g>
          );
        })}

        {/* floor glow pool + cast shadows */}
        <ellipse cx={S([8.6, 3.2, 0])[0]} cy={S([8.6, 3.2, 0])[1]} rx={260} ry={110} fill="url(#ae-pool)" />
        <polygon points={poly([[0, 4.2, 0.01], [3.2, 4.2, 0.01], [4.6, 6.2, 0.01], [1.4, 6.2, 0.01]])} fill="#000" opacity={0.35} filter="url(#ae-blur)" />
        <polygon points={poly([[5.2, 3.0, 0.01], [12.3, 3.0, 0.01], [13, 4.6, 0.01], [5.9, 4.6, 0.01]])} fill="#000" opacity={0.3} filter="url(#ae-blur)" />

        {/* ── sorter body ── */}
        <IsoBox x={sorter.x} y={sorter.y} w={sorter.w} d={sorter.d} h={sorter.h} color={p.metal} u={U} ink={ink} />
        {/* plinth band + rivets */}
        <IsoBox x={-0.1} y={0.7} w={3.4} d={3.6} h={0.4} color={shade(p.metal, -0.2)} u={U} ink={ink} />
        {Array.from({ length: 6 }, (_, i) => {
          const [a, b] = S([0.3 + i * 0.52, 4.2, 4.75]);
          return <circle key={i} cx={a} cy={b} r={2.6} fill={p.gold} />;
        })}
        {Array.from({ length: 6 }, (_, i) => {
          const [a, b] = S([3.2, 1.1 + i * 0.56, 4.75]);
          return <circle key={`r${i}`} cx={a} cy={b} r={2.6} fill={p.gold} />;
        })}
        {/* ticker screen on the left face */}
        <g transform={leftPlane([0.4, 4.21, 4.2])}>
          <rect x={-4} y={-4} width={2.4 * U + 8} height={0.9 * U + 8} fill={p.gold} stroke={p.outline} strokeWidth={1.2} />
          <rect x={0} y={0} width={2.4 * U} height={0.9 * U} fill={shade(p.metal, -0.6)} />
          <g clipPath="url(#ae-screen)">
            <polyline points={Array.from({ length: 24 }, (_, i) => `${i * 8},${28 - Math.sin(i * 0.9) * 6 - i * 0.6}`).join(' ')} fill="none" stroke={p.glow} strokeWidth={2}>
              <animateTransform attributeName="transform" type="translate" values="0 0;-50 0;0 0" dur="3s" repeatCount="indefinite" />
            </polyline>
          </g>
          <text x={4} y={12} fontFamily="Space Mono, monospace" fontSize={9} fill={p.gold} letterSpacing="1">
            ROAS 4.2×
          </text>
        </g>
        {/* lever on the left face */}
        <g transform={leftPlane([2.4, 4.22, 2.4])}>
          <rect x={-6} y={-6} width={36} height={36} fill={shade(p.metal, -0.3)} stroke={p.outline} strokeWidth={1.2} />
          <g transform="translate(12 12)">
            <animateTransform attributeName="transform" type="rotate" values="-20 12 12;-20 12 12;25 12 12;-20 12 12" keyTimes="0;0.62;0.7;1" dur={`${LOOP}s`} repeatCount="indefinite" additive="sum" />
            <line x1={0} y1={0} x2={0} y2={-40} stroke={p.gold} strokeWidth={5} strokeLinecap="round" />
            <circle cx={0} cy={-42} r={7} fill={p.gold} stroke={p.outline} strokeWidth={1.2} />
          </g>
        </g>
        {/* status lamps on the left face */}
        {[0, 1, 2].map((i) => (
          <g key={i} transform={leftPlane([0.6 + i * 0.45, 4.22, 2.4])}>
            <circle cx={0} cy={0} r={6} fill={i === 2 ? '#B3261E' : p.glow} stroke={p.outline} strokeWidth={1}>
              <animate attributeName="opacity" values={i === 2 ? '0.3;1;0.3' : '1;0.35;1'} dur={i === 1 ? '1s' : '2s'} begin={`${-i * 0.4}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
        {/* gears + gauges on the right face */}
        <g transform={rightPlane([3.21, 3.9, 3.2])}>
          <g transform="translate(24 10)">
            <Gear r={22} teeth={10} fill={p.gold} ink={p.outline} dur={3} />
          </g>
          <g transform="translate(56 30)">
            <Gear r={15} teeth={8} fill={shade(p.gold, -0.2)} ink={p.outline} dur={2} reverse />
          </g>
          <g transform="translate(100 4)">
            <Gauge r={16} p={p} dur={2} />
          </g>
        </g>
        <g transform={rightPlane([3.21, 2.6, 1.6])}>
          <rect x={0} y={0} width={1.4 * U} height={0.5 * U} fill={shade(p.metal, -0.5)} stroke={p.gold} strokeWidth={1.2} />
          {Array.from({ length: 5 }, (_, i) => (
            <rect key={i} x={6 + i * 10} y={4} width={6} height={0.5 * U - 8} fill={p.gold} opacity={0.35 + (i % 3) * 0.25}>
              <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" begin={`${-i * 0.2}s`} repeatCount="indefinite" />
            </rect>
          ))}
        </g>

        {/* ── hopper on top, coins pouring in ── */}
        <polygon points={poly([[hop.x0, hop.y0, hop.top], [hop.x1, hop.y0, hop.top], [hop.x1, hop.y1, hop.top], [hop.x0, hop.y1, hop.top]])} fill="url(#ae-hole)" stroke={p.outline} strokeWidth={1.2} />
        {[0, 1, 2, 3, 4].map((k) => {
          const dx = (k - 2) * 9;
          return (
            <g key={k}>
              <g>
                <animateMotion path={`M${f(hopCenter[0] + dx)},${f(-OY - 30)} L${f(hopCenter[0] + dx * 0.4)},${f(hopCenter[1] + 6)}`} dur="1.5s" begin={`${-k * 0.3}s`} repeatCount="indefinite" calcMode="spline" keyPoints="0;1" keyTimes="0;1" keySplines="0.5 0 1 1" />
                <g>
                  <animateTransform attributeName="transform" type="rotate" values={`${k * 40};${k * 40 + 360}`} dur="1.5s" begin={`${-k * 0.3}s`} repeatCount="indefinite" />
                  <Coin fill={p.gold} edge={goldEdge} />
                </g>
              </g>
            </g>
          );
        })}
        <polygon points={poly([[hop.x0, hop.y1, hop.top], [hop.x1, hop.y1, hop.top], [hop.bx1, hop.by1, hop.bot], [hop.bx0, hop.by1, hop.bot]])} fill={shade(p.metal, -0.15)} stroke={p.outline} strokeWidth={1.2} strokeLinejoin="round" />
        <polygon points={poly([[hop.x1, hop.y0, hop.top], [hop.x1, hop.y1, hop.top], [hop.bx1, hop.by1, hop.bot], [hop.bx1, hop.by0, hop.bot]])} fill={shade(p.metal, 0.05)} stroke={p.outline} strokeWidth={1.2} strokeLinejoin="round" />
        <polyline points={poly([[hop.x0, hop.y1, hop.top], [hop.x1, hop.y1, hop.top], [hop.x1, hop.y0, hop.top]])} fill="none" stroke={p.gold} strokeWidth={3} strokeLinecap="round" />

        {/* gear housing between sorter and tubes */}
        <IsoBox x={3.4} y={1.9} w={1.5} d={1.2} h={2.4} color={shade(p.metal, 0.08)} u={U} ink={ink} />
        <IsoCylinder x={4.15} y={2.5} z={2.4} r={0.3} h={1.95} color={p.gold} u={U} ink={ink} />
        <g transform={rightPlane([4.91, 2.9, 1.6])}>
          <Gear r={14} teeth={8} fill={p.gold} ink={p.outline} dur={1.5} />
        </g>

        {/* ── tube plinth with brass labels ── */}
        <IsoBox x={5.1} y={1.9} w={7.3} d={1.2} h={TUBES.z0} color={shade(p.metal, -0.1)} u={U} ink={ink} />
        {labels.map((l, i) => (
          <g key={l + i} transform={leftPlane([tubeX(i) - 0.38, 3.11, 0.3])}>
            <text x={0} y={0} fontFamily="Space Mono, monospace" fontSize={12.5} fontWeight={700} fill={i === WIN ? p.gold : p.ink} letterSpacing="0.5">
              {l}
            </text>
          </g>
        ))}

        {/* ── glass tubes, gold fill levels like a bar chart ── */}
        {LEVELS.map((lv, i) => {
          const x = tubeX(i);
          const shell = cyl(x, TUBES.y, TUBES.r, TUBES.z0, TUBES.h);
          const lo = cyl(x, TUBES.y, TUBES.r * 0.86, TUBES.z0 + 0.05, TUBES.h * lv);
          const hi = cyl(x, TUBES.y, TUBES.r * 0.86, TUBES.z0 + 0.05, TUBES.h * Math.min(0.97, lv + 0.04));
          const dur = i % 2 ? '3s' : '2s';
          const breathe = { dur, begin: `${-i * 0.35}s`, repeatCount: 'indefinite' as const, calcMode: 'spline' as const, keyTimes: '0;0.5;1', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1' };
          return (
            <g key={i}>
              <path d={shell.body} fill={p.glass} opacity={0.12} />
              <path d={lo.body} fill={i === WIN ? p.gold : shade(p.gold, -0.18)} stroke={goldEdge} strokeWidth={0.8}>
                <animate attributeName="d" values={`${lo.body};${hi.body};${lo.body}`} {...breathe} />
              </path>
              <ellipse cx={lo.top.cx} cy={lo.top.cy} rx={lo.top.rx} ry={lo.top.ry} fill={shade(p.gold, 0.35)} stroke={goldEdge} strokeWidth={0.8}>
                <animate attributeName="cy" values={`${lo.top.cy};${hi.top.cy};${lo.top.cy}`} {...breathe} />
              </ellipse>
              {/* coin stack texture: rings on the fill */}
              {Array.from({ length: Math.floor(lv * 9) }, (_, k) => {
                const [cx, cy] = S([x, TUBES.y, TUBES.z0 + 0.2 + k * 0.36]);
                return <path key={k} d={`M${f(cx - lo.top.rx)},${f(cy)} A${f(lo.top.rx)},${f(lo.top.ry)} 0 0 0 ${f(cx + lo.top.rx)},${f(cy)}`} fill="none" stroke={goldEdge} strokeWidth={0.8} opacity={0.6} />;
              })}
              {/* glass: rim, outline and a specular streak */}
              <path d={shell.body} fill="none" stroke={p.outline} strokeWidth={1.2} />
              <ellipse cx={shell.top.cx} cy={shell.top.cy} rx={shell.top.rx} ry={shell.top.ry} fill={p.glass} fillOpacity={0.12} stroke={p.glass} strokeWidth={1.5} />
              <line x1={shell.top.cx - shell.top.rx * 0.55} y1={shell.top.cy + 8} x2={shell.top.cx - shell.top.rx * 0.55} y2={S([x, TUBES.y, TUBES.z0 + 0.3])[1]} stroke="#ffffff" strokeWidth={3} strokeLinecap="round" opacity={0.35} />
              {/* brass cap ring at the base */}
              <path d={cyl(x, TUBES.y, TUBES.r * 1.12, TUBES.z0, 0.18).body} fill={p.gold} stroke={p.outline} strokeWidth={1} />
            </g>
          );
        })}

        {/* rebalance moment: the winning tube flashes, a ring rolls out on the floor */}
        {(() => {
          const x = tubeX(WIN);
          const [cx, cy] = S([x, TUBES.y, TUBES.z0 + TUBES.h * 0.5]);
          const [fx, fy] = S([x, TUBES.y, 0.02]);
          return (
            <g>
              {/* standing halo marks the winner at rest */}
              <ellipse cx={cx} cy={cy} rx={34} ry={90} fill={p.gold} filter="url(#ae-blur)" opacity={0.28} style={{ mixBlendMode: 'screen' }} />
              <ellipse cx={cx} cy={cy} rx={70} ry={150} fill={p.glow} filter="url(#ae-blur)" opacity={0} style={{ mixBlendMode: 'screen' }}>
                <animate attributeName="opacity" {...moment('0;0;1;0;0')} />
              </ellipse>
              {/* four-point sparkle above the tube */}
              <g transform={`translate(${f(cx + 30)} ${f(cy - 100)})`}>
                <path d="M0,-22 L5,-5 L22,0 L5,5 L0,22 L-5,5 L-22,0 L-5,-5 Z" fill={p.glow} opacity={0}>
                  <animate attributeName="opacity" {...moment('0;0;1;0;0')} />
                  <animateTransform attributeName="transform" type="scale" {...moment('0.2;0.2;1.3;0.4;0.2')} />
                </path>
              </g>
              <ellipse cx={fx} cy={fy} rx={20} ry={11} fill="none" stroke={p.gold} strokeWidth={3} opacity={0}>
                <animate attributeName="opacity" {...moment('0;0;1;0;0')} />
                <animate attributeName="rx" {...moment('20;20;20;150;150')} />
                <animate attributeName="ry" {...moment('11;11;11;86;86')} />
              </ellipse>
            </g>
          );
        })()}

        {/* ── chute: back wall, coins, front wall ── */}
        <polygon points={poly([[CHUTE.x0, CHUTE.y0, CHUTE.z + 0.35], [CHUTE.x1, CHUTE.y0, CHUTE.z + 0.26], [CHUTE.x1, CHUTE.y0, CHUTE.z - 0.09], [CHUTE.x0, CHUTE.y0, CHUTE.z]])} fill={shade(p.metal, -0.3)} stroke={p.outline} strokeWidth={1.2} />
        <polygon points={poly([[CHUTE.x0, CHUTE.y0, CHUTE.z], [CHUTE.x1, CHUTE.y0, CHUTE.z - 0.09], [CHUTE.x1, CHUTE.y1, CHUTE.z - 0.09], [CHUTE.x0, CHUTE.y1, CHUTE.z]])} fill={shade(p.metal, 0.12)} stroke={p.outline} strokeWidth={1.2} />
        {chuteCoins.map((c) => (
          <g key={c.k}>
            <animateMotion path={c.d} dur="3s" begin={`${c.begin}s`} repeatCount="indefinite" keyPoints="0;0.85;1" keyTimes="0;0.8;1" calcMode="linear" />
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.08;0.92;1" dur="3s" begin={`${c.begin}s`} repeatCount="indefinite" />
            <Coin fill={p.gold} edge={goldEdge} />
          </g>
        ))}
        <polygon points={poly([[CHUTE.x0, CHUTE.y1, CHUTE.z], [CHUTE.x1, CHUTE.y1, CHUTE.z - 0.09], [CHUTE.x1, CHUTE.y1, CHUTE.z + 0.2], [CHUTE.x0, CHUTE.y1, CHUTE.z + 0.29]])} fill={shade(p.metal, -0.05)} stroke={p.outline} strokeWidth={1.2} />
        <polyline points={poly([[CHUTE.x0, CHUTE.y1, CHUTE.z + 0.29], [CHUTE.x1, CHUTE.y1, CHUTE.z + 0.2]])} stroke={p.gold} strokeWidth={2} />
        <polygon points={poly([[CHUTE.x1, CHUTE.y0, CHUTE.z + 0.26], [CHUTE.x1, CHUTE.y1, CHUTE.z + 0.2], [CHUTE.x1, CHUTE.y1, CHUTE.z - 0.09], [CHUTE.x1, CHUTE.y0, CHUTE.z - 0.09]])} fill={shade(p.metal, -0.15)} stroke={p.outline} strokeWidth={1.2} />
        {/* diverter gate over the winning tube swings on the moment */}
        <g transform={leftPlane([tubeX(WIN) - 0.25, CHUTE.y1 + 0.01, CHUTE.z + 0.75])}>
          <g>
            <animateTransform attributeName="transform" type="rotate" values="0 10 0;0 10 0;-35 10 0;0 10 0;0 10 0" keyTimes={mKeys} dur={`${LOOP}s`} repeatCount="indefinite" />
            <rect x={0} y={0} width={20} height={14} fill={p.gold} stroke={p.outline} strokeWidth={1.2} />
          </g>
        </g>
        {/* rebalance pop label */}
        {(() => {
          const [cx, cy] = S([tubeX(WIN), TUBES.y, CHUTE.z + 1.6]);
          return (
            <g opacity={0}>
              <animate attributeName="opacity" {...moment('0;0;1;1;0')} />
              <animateTransform attributeName="transform" type="translate" values="0 16;0 16;0 0;0 -14;0 -14" keyTimes={mKeys} dur={`${LOOP}s`} repeatCount="indefinite" />
              <rect x={cx - 104} y={cy - 22} width={208} height={34} fill={p.gold} stroke={p.outline} strokeWidth={1.5} />
              <rect x={cx - 104 + 5} y={cy - 22 + 5} width={208} height={34} fill="none" stroke={p.outline} strokeWidth={1.5} opacity={0.6} />
              <text x={cx} y={cy + 1} textAnchor="middle" fontFamily="Space Mono, monospace" fontSize={16} fontWeight={700} fill={p.outline}>
                {p.win}
              </text>
            </g>
          );
        })()}

        {/* ── front desk: ledger printer, coin stacks, plaque ── */}
        <IsoBox x={0.6} y={5.4} w={3.0} d={1.4} h={1.25} color={shade(p.metal, 0.05)} u={U} ink={ink} />
        <polyline points={poly([[0.6, 6.8, 1.25], [3.6, 6.8, 1.25], [3.6, 5.4, 1.25]])} fill="none" stroke={p.gold} strokeWidth={2} />
        <g transform={leftPlane([0.8, 6.81, 0.85])}>
          <rect x={0} y={0} width={2.6 * U} height={20} fill={p.gold} stroke={p.outline} strokeWidth={1} />
          <text x={1.3 * U} y={14} textAnchor="middle" fontFamily="Space Mono, monospace" fontSize={10} fontWeight={700} fill={p.outline} letterSpacing="1">
            {p.sign}
          </text>
        </g>
        <IsoBox x={1.0} y={5.65} w={1.3} d={0.9} h={0.5} z={1.25} color={p.glass} u={U} ink={ink} />
        <IsoBox x={1.15} y={5.7} w={1.0} d={0.2} h={0.08} z={1.75} color={shade(p.metal, -0.4)} u={U} ink={ink} />
        {/* paper ledger feeding out of the printer, over the desk edge */}
        <polygon points={poly([[1.3, 6.56, 1.62], [1.95, 6.56, 1.62], [1.95, 6.85, 1.25], [1.3, 6.85, 1.25]])} fill={p.ink} stroke={p.outline} strokeWidth={0.8} />
        <g>
          <polygon fill={p.ink} stroke={p.outline} strokeWidth={0.8} points={poly([[1.3, 6.86, 1.25], [1.95, 6.86, 1.25], [1.95, 6.86, 0.9], [1.3, 6.86, 0.9]])}>
            <animate
              attributeName="points"
              values={`${poly([[1.3, 6.86, 1.25], [1.95, 6.86, 1.25], [1.95, 6.86, 0.95], [1.3, 6.86, 0.95]])};${poly([[1.3, 6.86, 1.25], [1.95, 6.86, 1.25], [1.95, 6.86, 0.25], [1.3, 6.86, 0.25]])};${poly([[1.3, 6.86, 1.25], [1.95, 6.86, 1.25], [1.95, 6.86, 0.95], [1.3, 6.86, 0.95]])}`}
              keyTimes="0;0.95;1"
              dur={`${LOOP}s`}
              repeatCount="indefinite"
            />
          </polygon>
          {[0, 1, 2, 3].map((k) => (
            <polyline key={k} points={poly([[1.38, 6.87, 1.15 - k * 0.15], [1.85, 6.87, 1.15 - k * 0.15]])} stroke={p.outline} strokeWidth={1} opacity={0}>
              <animate attributeName="opacity" values="0;0;0.6;0.6;0" keyTimes={`0;${0.1 + k * 0.2};${0.15 + k * 0.2};0.95;1`} dur={`${LOOP}s`} repeatCount="indefinite" />
            </polyline>
          ))}
        </g>
        {/* coin stacks on the desk */}
        {[
          [2.75, 5.85, 5],
          [3.2, 6.15, 3],
          [2.8, 6.4, 7],
        ].map(([x, y, n], i) => (
          <g key={i}>
            {Array.from({ length: n }, (_, k) => (
              <IsoCylinder key={k} x={x} y={y} z={1.25 + k * 0.1} r={0.2} h={0.1} color={p.gold} u={U} ink={{ stroke: goldEdge, strokeWidth: 0.8 }} />
            ))}
          </g>
        ))}

        {/* brass bank stanchions with a velvet rope, front right */}
        {(() => {
          const posts: [number, number][] = [
            [7.4, 6.4],
            [9.8, 6.4],
            [12.2, 6.4],
          ];
          const tops = posts.map(([x, y]) => S([x, y, 1.25]));
          return (
            <g>
              {posts.map(([x, y], i) => (
                <g key={i}>
                  <ellipse cx={S([x, y, 0])[0] - 10} cy={S([x, y, 0])[1] + 6} rx={26} ry={10} fill="#000" opacity={0.35} filter="url(#ae-soft)" />
                  <IsoCylinder x={x} y={y} r={0.26} h={0.08} color={p.gold} u={U} ink={ink} />
                  <IsoCylinder x={x} y={y} z={0.08} r={0.07} h={1.15} color={p.gold} u={U} ink={ink} />
                  <circle cx={tops[i][0]} cy={tops[i][1] - 3} r={7} fill={shade(p.gold, 0.2)} stroke={p.outline} strokeWidth={1.2} />
                </g>
              ))}
              {tops.slice(1).map(([x, y], i) => {
                const [x0, y0] = tops[i];
                return (
                  <path key={i} d={`M${f(x0)},${f(y0 + 2)} Q${f((x0 + x) / 2)},${f((y0 + y) / 2 + 36)} ${f(x)},${f(y + 2)}`} fill="none" stroke={shade(p.gold, -0.55)} strokeWidth={7} strokeLinecap="round">
                    <animate attributeName="d" values={`M${f(x0)},${f(y0 + 2)} Q${f((x0 + x) / 2)},${f((y0 + y) / 2 + 36)} ${f(x)},${f(y + 2)};M${f(x0)},${f(y0 + 2)} Q${f((x0 + x) / 2 + 4)},${f((y0 + y) / 2 + 40)} ${f(x)},${f(y + 2)};M${f(x0)},${f(y0 + 2)} Q${f((x0 + x) / 2)},${f((y0 + y) / 2 + 36)} ${f(x)},${f(y + 2)}`} dur="3s" repeatCount="indefinite" />
                  </path>
                );
              })}
            </g>
          );
        })()}

        {/* drifting motes in the lamp light */}
        {Array.from({ length: 10 }, (_, i) => {
          const [x0, y0] = S([6 + (i % 5) * 1.3, 2.5, 6 + (i % 3)]);
          return (
            <circle key={i} cx={x0} cy={y0} r={1.6} fill={p.glow} opacity={0.5}>
              <animate attributeName="cy" values={`${y0};${y0 - 30};${y0}`} dur={i % 2 ? '6s' : '3s'} begin={`${-i * 0.6}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.7;0" dur={i % 2 ? '6s' : '3s'} begin={`${-i * 0.6}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      </g>

      {/* vignette */}
      <rect width={scene.width} height={scene.height} fill="url(#ae-vig)" />
      <defs>
        <radialGradient id="ae-vig" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>
    </svg>
  );
}

