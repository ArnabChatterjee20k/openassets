import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Lights-Out Cell',
  description:
    'Landing-page hero for Redbrick Works: a cutaway brick factory bay running itself — a 5-axis CNC with a glowing window and andon tower, a robot arm moving parts to a conveyor, an AGV shuttling parcels to the dock, a painted wall sign. A finished part pops out with a flash every loop.',
  tags: ['hero', 'isometric', 'factory', 'manufacturing', 'robot', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1, 0.5 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Wall sign').default('REDBRICK'),
  board: text('Status board').default('CELL 04 · RUN 94%'),
  skyTop: color('Backdrop top').default('#F1E4D3'),
  skyBottom: color('Backdrop bottom').default('#E5CDB2'),
  windowSky: color('Window sky').default('#F6C27A'),
  brick: color('Brick walls').default('#C8553D'),
  floor: color('Floor').default('#D8C3A8'),
  machine: color('Machine enamel').default('#4F6D58'),
  arm: color('Robot arm').default('#E07A3F'),
  glow: color('Machine light').default('#F2A541'),
  neon: color('Sign paint').default('#F1E4D3'),
  ink: color('Outline ink').default('#3B1F14'),
  parcel: color('Parcels').default('#E5CDB2'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-shift': { skyTop: '#140C10', skyBottom: '#2E1A18', windowSky: '#1D2240', brick: '#8E3A2A', floor: '#5C4A40', machine: '#3E5A48', arm: '#D9663A', glow: '#FFB547', neon: '#FFD27F', ink: '#120806', parcel: '#C9AE8E' },
  dusk: { skyTop: '#2B1B2E', skyBottom: '#FF8E5E', windowSky: '#FF9E6E', brick: '#A84A3A', floor: '#C7A88C', machine: '#45293F', arm: '#FFD27F', glow: '#FF8E5E', neon: '#FFE9D6', ink: '#2B1B2E' },
  blueprint: { skyTop: '#0F3B8C', skyBottom: '#134AA8', windowSky: '#7FB2FF', brick: '#2A5DB8', floor: '#9DB8E0', machine: '#EAF2FF', arm: '#FFDD00', glow: '#FFDD00', neon: '#FFFFFF', ink: '#0A2459', parcel: '#EAF2FF' },
  sage: { skyTop: '#EEF1E6', skyBottom: '#DCE3CC', windowSky: '#E8D9A0', brick: '#6A8D3A', floor: '#D7D2BC', machine: '#C8553D', arm: '#4F6D58', glow: '#E85D3F', neon: '#EEF1E6', ink: '#1E2A1A' },
};

type P = z.infer<typeof schema>;

const U = 44;
const LOOP = scene.loop;
const OX = 562;
const OY = 322;
const C30 = Math.cos(Math.PI / 6);
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;
/** Screen offset for a move of (dx, dy) world units on the floor. */
const mv = (dx: number, dy: number) => `${((dx - dy) * C30 * U).toFixed(1)} ${(((dx + dy) / 2) * U).toFixed(1)}`;

function isDark(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 120;
}

/** Brick coursing on a wall plane: 'x0' = plane x=0 (left wall), 'y0' = plane y=0 (back wall). */
function Bricks({ plane, len, h, p }: { plane: 'x0' | 'y0'; len: number; h: number; p: P }) {
  const at = (a: number, z: number): P3 => (plane === 'x0' ? [0.001, a, z] : [a, 0.001, z]);
  const rows = Math.floor(h / 0.33);
  const out: ReactNode[] = [];
  for (let r = 1; r <= rows; r++) {
    const z = r * 0.33;
    out.push(<polyline key={`r${r}`} points={poly([at(0, z), at(len, z)])} />);
    for (let a = (r % 2) * 0.35; a < len; a += 0.7) out.push(<polyline key={`v${r}-${a.toFixed(2)}`} points={poly([at(a, z - 0.33), at(a, z)])} />);
  }
  return (
    <g stroke={shade(p.brick, -0.32)} strokeWidth={1} fill="none" opacity={0.55}>
      {out}
    </g>
  );
}

/** Steel factory window on the back wall (plane y=0): sky, panes, sill. */
function FactoryWindow({ x, z, w, h, p, k }: { x: number; z: number; w: number; h: number; p: P; k: number }) {
  const night = isDark(p.skyTop);
  const frame = shade(p.ink, 0.15);
  const at = (a: number, zz: number): P3 => [a, 0.01, zz];
  const cols = 4;
  const rows = 4;
  return (
    <g>
      <polygon points={poly([at(x - 0.12, z - 0.12), at(x + w + 0.12, z - 0.12), at(x + w + 0.12, z + h + 0.12), at(x - 0.12, z + h + 0.12)])} fill={frame} />
      <polygon points={poly([at(x, z), at(x + w, z), at(x + w, z + h), at(x, z + h)])} fill="url(#lo-win)" />
      {night &&
        Array.from({ length: 7 }, (_, i) => {
          const [sx, sy] = S(at(x + 0.2 + rand(i * 3.1 + k) * (w - 0.4), z + h * 0.35 + rand(i * 7.3 + k) * h * 0.6));
          return (
            <circle key={i} cx={sx} cy={sy} r={1.3} fill="#FFF6E0">
              <animate attributeName="opacity" values="0.2;1;0.2" dur={`${[2, 3, 6][i % 3]}s`} begin={`-${(rand(i * 5.9 + k) * 3).toFixed(2)}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      <g stroke={frame} strokeWidth={2.2}>
        {Array.from({ length: cols - 1 }, (_, i) => (
          <polyline key={`c${i}`} points={poly([at(x + ((i + 1) * w) / cols, z), at(x + ((i + 1) * w) / cols, z + h)])} />
        ))}
        {Array.from({ length: rows - 1 }, (_, i) => (
          <polyline key={`r${i}`} points={poly([at(x, z + ((i + 1) * h) / rows), at(x + w, z + ((i + 1) * h) / rows)])} />
        ))}
      </g>
      {/* one tilted-open pane */}
      <polygon points={poly([[x + w / cols, 0.01, z + h / 2], [x + (2 * w) / cols, 0.01, z + h / 2], [x + (2 * w) / cols, 0.35, z + h / 2 + h / rows - 0.1], [x + w / cols, 0.35, z + h / 2 + h / rows - 0.1]])} fill={shade(p.windowSky, 0.25)} stroke={frame} strokeWidth={1.6} opacity={0.9} />
      <polygon points={poly([[x - 0.2, 0.01, z - 0.12], [x + w + 0.2, 0.01, z - 0.12], [x + w + 0.2, 0.2, z - 0.12], [x - 0.2, 0.2, z - 0.12]])} fill={shade(p.brick, 0.25)} stroke={p.ink} strokeWidth={1} />
    </g>
  );
}

function Parcel({ x, y, z, s, p }: { x: number; y: number; z: number; s: number; p: P }) {
  return (
    <g>
      <IsoBox x={x} y={y} z={z} w={s} d={s * 0.8} h={s * 0.7} color={p.parcel} u={U} ink={{ stroke: p.ink, strokeWidth: 1.2 }} />
      <polygon points={poly([[x + s * 0.42, y, z + s * 0.7 + 0.001], [x + s * 0.58, y, z + s * 0.7 + 0.001], [x + s * 0.58, y + s * 0.8, z + s * 0.7 + 0.001], [x + s * 0.42, y + s * 0.8, z + s * 0.7 + 0.001]])} fill={p.brick} />
      <polygon points={poly([[x + s * 0.42, y + s * 0.8, z], [x + s * 0.58, y + s * 0.8, z], [x + s * 0.58, y + s * 0.8, z + s * 0.7], [x + s * 0.42, y + s * 0.8, z + s * 0.7]])} fill={shade(p.brick, -0.2)} />
    </g>
  );
}

export default function LightsOutCell(p: P) {
  const night = isDark(p.skyTop);
  const ink = { stroke: p.ink, strokeWidth: 1.3 };
  const moment = { keyTimes: '0;0.54;0.56;0.6;0.7;1', dur: `${LOOP}s`, repeatCount: 'indefinite' } as const;

  // anchor points
  const [shX, shY] = S([6.4, 2.6, 1.0]); // robot shoulder
  const [anX, anY] = S([4.55, 1.35, 3.2]); // andon tower base
  const [popX, popY] = S([6.4, 4.9, 0.95]); // part drop point on the conveyor
  const signAt = S([0.02, 9.0, 4.25]);
  const boardAt = S([5.6, 0.02, 4.55]);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="lo-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <linearGradient id="lo-win" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.windowSky, night ? -0.2 : 0.2)} />
          <stop offset="1" stopColor={p.windowSky} />
        </linearGradient>
        <radialGradient id="lo-sun">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.55" />
          <stop offset="0.5" stopColor={p.glow} stopOpacity="0.15" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="lo-pool">
          <stop offset="0" stopColor={p.glow} stopOpacity={night ? 0.55 : 0.4} />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <filter id="lo-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="lo-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* ── Backdrop ── */}
      <rect width="1200" height="900" fill="url(#lo-sky)" />
      <circle cx="960" cy="190" r="260" fill="url(#lo-sun)" />
      <circle cx="960" cy="190" r="70" fill={night ? '#FFF1D6' : p.glow} opacity={night ? 0.9 : 0.55} />
      {/* drifting smoke from the stack */}
      <g opacity={night ? 0.25 : 0.4}>
        {[0, 1, 2].map((k) => (
          <circle key={k} cx="455" cy="60" r="20" fill={night ? '#B9A9A0' : '#FFFFFF'}>
            <animate attributeName="cy" values="62;-20" dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
            <animate attributeName="cx" values="455;515" dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
            <animate attributeName="r" values="12;36" dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0" dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </g>
      {/* ground shadow */}
      <ellipse cx="610" cy="842" rx="440" ry="42" fill={p.ink} opacity="0.2" filter="url(#lo-blur)" />

      <g transform={`translate(${OX} ${OY})`}>
        {/* chimney stack behind the left wall */}
        <IsoCylinder x={-0.6} y={2.2} z={0} r={0.55} h={6.6} color={shade(p.brick, -0.1)} u={U} ink={ink} />
        {[6.0, 6.35].map((z) => {
          const [a, b] = S([-0.6, 2.2, z]);
          return <ellipse key={z} cx={a} cy={b} rx={0.55 * U * 1.2247} ry={0.55 * U * 0.7071} fill="none" stroke={p.neon} strokeWidth={3} opacity={0.8} />;
        })}

        {/* ── Shell: slab, left wall, back wall ── */}
        <IsoBox x={-0.4} y={-0.4} z={-0.6} w={12.4} d={10.4} h={0.6} color={shade(p.floor, -0.15)} u={U} ink={ink} />
        <IsoBox x={-0.4} y={-0.4} z={0} w={0.4} d={10.4} h={6} color={p.brick} u={U} ink={ink} />
        <IsoBox x={0} y={-0.4} z={0} w={12} d={0.4} h={6} color={p.brick} u={U} ink={ink} />
        {/* inner wall faces, lit */}
        <polygon points={poly([[0, 0, 0], [0, 10, 0], [0, 10, 6], [0, 0, 6]])} fill={shade(p.brick, -0.08)} {...ink} />
        <polygon points={poly([[0, 0, 0], [12, 0, 0], [12, 0, 6], [0, 0, 6]])} fill={shade(p.brick, 0.08)} {...ink} />
        <Bricks plane="x0" len={10} h={6} p={p} />
        <Bricks plane="y0" len={12} h={6} p={p} />
        {/* floor */}
        <polygon points={poly([[0, 0, 0], [12, 0, 0], [12, 10, 0], [0, 10, 0]])} fill={p.floor} {...ink} />
        <g stroke={shade(p.floor, -0.12)} strokeWidth={1}>
          {Array.from({ length: 5 }, (_, i) => (
            <polyline key={`a${i}`} points={poly([[(i + 1) * 2, 0, 0.002], [(i + 1) * 2, 10, 0.002]])} />
          ))}
          {Array.from({ length: 4 }, (_, i) => (
            <polyline key={`b${i}`} points={poly([[0, (i + 1) * 2, 0.002], [12, (i + 1) * 2, 0.002]])} />
          ))}
        </g>
        {/* AGV lane markings */}
        <g stroke={p.glow} strokeWidth={3} strokeDasharray="12 9" opacity={0.9}>
          <polyline points={poly([[0.6, 7.2, 0.003], [9.2, 7.2, 0.003]])} />
          <polyline points={poly([[0.6, 9.0, 0.003], [9.2, 9.0, 0.003]])} />
        </g>
        {/* hazard hatch at the robot cell */}
        <polygon points={poly([[5.5, 1.6, 0.003], [7.4, 1.6, 0.003], [7.4, 3.6, 0.003], [5.5, 3.6, 0.003]])} fill="none" stroke={p.glow} strokeWidth={2.5} />

        {/* ── Back wall details: windows, status board ── */}
        <FactoryWindow x={6.6} z={2.2} w={2.2} h={2.8} p={p} k={1} />
        <FactoryWindow x={9.3} z={2.2} w={2.2} h={2.8} p={p} k={2} />
        <g transform={`translate(${boardAt[0]} ${boardAt[1]}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
          <rect x={-4.6 * U} y={-0.75 * U} width={4.5 * U} height={1.1 * U} rx={4} fill={p.ink} stroke={shade(p.ink, 0.3)} strokeWidth={2} />
          <text x={-4.4 * U} y={0.05 * U} fontFamily={FONTS.vt323} fontSize={25} fill={p.glow} letterSpacing="1">
            {p.board}
            <Flicker dur={3} seed={7} low={0.5} />
          </text>
        </g>
        {/* ceiling lamps hanging from the back wall top */}
        {[3.2, 8.2].map((x, i) => {
          const [a, b] = S([x, 3.5, 5.6]);
          const [g1, g2] = S([x, 3.5, 0]);
          return (
            <g key={x}>
              <line x1={a} y1={b - 70} x2={a} y2={b} stroke={p.ink} strokeWidth={1.5} />
              <ellipse cx={g1} cy={g2} rx={2.2 * U} ry={1.2 * U} fill="url(#lo-pool)">
                <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin={`-${i}s`} repeatCount="indefinite" />
              </ellipse>
              <path d={`M${a - 16},${b + 10} L${a - 8},${b} L${a + 8},${b} L${a + 16},${b + 10} Z`} fill={shade(p.machine, -0.2)} stroke={p.ink} strokeWidth={1.2} />
              <ellipse cx={a} cy={b + 11} rx={14} ry={4} fill={p.glow} filter="url(#lo-glow)" />
            </g>
          );
        })}

        {/* ── Left wall: painted sign (reads along −y) ── */}
        <g transform={`translate(${signAt[0]} ${signAt[1]}) matrix(${C30}, -0.5, 0, 1, 0, 0)`}>
          <rect x={-0.3 * U} y={-1.05 * U} width={7.6 * U} height={1.4 * U} fill={shade(p.brick, -0.35)} opacity={0.6} />
          <text x={0} y={0} fontFamily={FONTS.bungee} fontSize={44} fill={p.neon} letterSpacing="2" filter={night ? 'url(#lo-glow)' : undefined}>
            {p.sign}
            {night && <Flicker dur={6} seed={3} low={0.45} />}
          </text>
          <text x={2} y={0.75 * U} fontFamily={FONTS.vt323} fontSize={20} fill={p.neon} letterSpacing="4" opacity={0.85}>
            DAYTON · OHIO · EST. 2024
          </text>
        </g>

        {/* ── Bar-stock rack against the left wall ── */}
        <polygon points={poly([[0.2, 6.8, 0], [1.4, 6.8, 0], [2.0, 7.4, 0], [0.8, 7.4, 0]])} fill={p.ink} opacity={0.2} filter="url(#lo-blur)" />
        {[4.3, 6.6].map((y) => (
          <g key={y}>
            <IsoBox x={0.25} y={y} z={0} w={0.12} d={0.12} h={1.9} color={shade(p.machine, -0.2)} u={U} ink={ink} />
            <IsoBox x={1.2} y={y} z={0} w={0.12} d={0.12} h={1.9} color={shade(p.machine, -0.2)} u={U} ink={ink} />
          </g>
        ))}
        {[0.55, 1.25, 1.9].map((z, i) => (
          <g key={z}>
            <IsoBox x={0.2} y={4.3} z={z} w={1.2} d={2.42} h={0.08} color={shade(p.machine, -0.1)} u={U} ink={ink} />
            {[0.4, 0.62, 0.84, 1.06].slice(0, 4 - i).map((x) => (
              <g key={x}>
                <polyline points={poly([[x, 4.2, z + 0.16], [x, 6.85, z + 0.16]])} stroke={p.ink} strokeWidth={7} strokeLinecap="round" />
                <polyline points={poly([[x, 4.2, z + 0.16], [x, 6.85, z + 0.16]])} stroke={i === 1 ? p.glow : '#D9D3C9'} strokeWidth={4.5} strokeLinecap="round" />
              </g>
            ))}
          </g>
        ))}
        {(() => {
          const [lx, ly] = S([1.32, 6.0, 0.25]);
          return (
            <g transform={`translate(${lx} ${ly}) matrix(${C30}, -0.5, 0, 1, 0, 0)`}>
              <rect x={-2} y={-14} width={58} height={18} fill={p.ink} />
              <text x={2} y={0} fontFamily={FONTS.vt323} fontSize={16} fill={p.glow}>
                6061-T6
              </text>
            </g>
          );
        })()}

        {/* ── CNC machine ── */}
        <polygon points={poly([[1.5, 3.5, 0], [5, 3.5, 0], [6.4, 4.9, 0], [2.9, 4.9, 0]])} fill={p.ink} opacity={0.22} filter="url(#lo-blur)" />
        <IsoBox x={1.4} y={0.9} z={0} w={3.7} d={2.7} h={0.25} color={shade(p.machine, -0.35)} u={U} ink={ink} />
        <IsoBox x={1.5} y={1} z={0.25} w={3.5} d={2.5} h={3.0} color={p.machine} u={U} ink={ink} />
        {/* brand stripe */}
        <polygon points={poly([[1.5, 3.5, 2.85], [5, 3.5, 2.85], [5, 3.5, 3.05], [1.5, 3.5, 3.05]])} fill={p.brick} />
        <polygon points={poly([[5, 1, 2.85], [5, 3.5, 2.85], [5, 3.5, 3.05], [5, 1, 3.05]])} fill={shade(p.brick, -0.15)} />
        {/* door window (plane y=3.5) with the cutting chamber */}
        <polygon points={poly([[1.9, 3.5, 0.75], [4.0, 3.5, 0.75], [4.0, 3.5, 2.55], [1.9, 3.5, 2.55]])} fill={shade(p.ink, 0.1)} {...ink} />
        <polygon points={poly([[2.0, 3.5, 0.85], [3.9, 3.5, 0.85], [3.9, 3.5, 2.45], [2.0, 3.5, 2.45]])} fill={p.glow} opacity={0.35}>
          <Flicker dur={1.5} seed={2} low={0.6} />
        </polygon>
        {(() => {
          const [sx, sy] = S([2.95, 3.5, 2.45]);
          const [tx, ty] = S([2.95, 3.5, 1.35]);
          const [bx, by] = S([2.95, 3.5, 0.95]);
          return (
            <g>
              {/* fixture + part inside */}
              <polygon points={`${bx - 26},${by - 4} ${bx + 26},${by + 11} ${bx + 26},${by + 1} ${bx - 26},${by - 14}`} fill={shade(p.machine, -0.4)} />
              <polygon points={`${bx - 12},${by - 16} ${bx + 12},${by - 2} ${bx + 12},${by + 8} ${bx - 12},${by - 6}`} fill="#D6D0C6" stroke={p.ink} strokeWidth={1} />
              {/* spindle head + spinning cutter */}
              <rect x={sx - 10} y={sy} width={20} height={ty - sy - 14} fill={shade(p.machine, -0.25)} stroke={p.ink} strokeWidth={1} />
              <line x1={sx} y1={ty - 14} x2={sx} y2={ty} stroke="#E6E0D6" strokeWidth={6} strokeDasharray="3 3">
                <animate attributeName="stroke-dashoffset" values="0;6" dur="0.5s" repeatCount="indefinite" />
              </line>
              <circle cx={tx} cy={ty} r={12} fill={p.glow} opacity={0.7} filter="url(#lo-glow)">
                <animate attributeName="r" values="9;14;9" dur="0.5s" repeatCount="indefinite" />
              </circle>
              {/* sparks */}
              {Array.from({ length: 8 }, (_, i) => {
                const a = -0.4 - (i / 7) * 2.4;
                const l = 16 + (i % 3) * 7;
                return (
                  <line key={i} x1={tx} y1={ty} x2={tx + Math.cos(a) * l} y2={ty - Math.sin(a) * l * -1} stroke={p.glow} strokeWidth={2} strokeLinecap="round" opacity={0}>
                    <animate attributeName="opacity" values="0;1;0" dur="0.5s" begin={`-${(i * 0.06).toFixed(2)}s`} repeatCount="indefinite" />
                  </line>
                );
              })}
              {/* the moment: chamber flash */}
              <polygon points={poly([[2.0, 3.5, 0.85], [3.9, 3.5, 0.85], [3.9, 3.5, 2.45], [2.0, 3.5, 2.45]])} fill="#FFF8EA" opacity={0}>
                <animate attributeName="opacity" values="0;0;0.95;0.2;0;0" {...moment} />
              </polygon>
            </g>
          );
        })()}
        {/* door handle + seam */}
        <polyline points={poly([[4.2, 3.5, 0.6], [4.2, 3.5, 2.7]])} stroke={p.ink} strokeWidth={1.4} fill="none" />
        <polyline points={poly([[4.35, 3.5, 1.3], [4.35, 3.5, 2.0]])} stroke={shade(p.machine, 0.5)} strokeWidth={4} strokeLinecap="round" fill="none" />
        {/* control screen on the right face (plane x=5) */}
        <polygon points={poly([[5, 1.4, 1.5], [5, 2.9, 1.5], [5, 2.9, 2.5], [5, 1.4, 2.5]])} fill={p.ink} {...ink} />
        {[0, 1, 2].map((i) => (
          <polyline key={i} points={poly([[5.001, 1.55, 2.3 - i * 0.22], [5.001, 1.55 + [1.1, 0.7, 0.9][i], 2.3 - i * 0.22]])} stroke={i === 0 ? p.glow : shade(p.machine, 0.5)} strokeWidth={3} fill="none">
            <Flicker dur={2} seed={i + 11} low={0.35} />
          </polyline>
        ))}
        {/* andon light tower */}
        <IsoCylinder x={4.55} y={1.35} z={3.25} r={0.07} h={0.3} color={shade(p.ink, 0.3)} u={U} ink={ink} />
        {[
          ['#6FBF73', 3.55, '0;1;1;0;1'],
          [p.glow, 3.85, '0.3;0.3;0.3;0.3;0.3'],
          ['#D9472B', 4.15, '0.25;0.25;0.25;0.25;0.25'],
        ].map(([c, z, vals], i) => (
          <g key={i}>
            <IsoCylinder x={4.55} y={1.35} z={z as number} r={0.17} h={0.28} color={c as string} u={U} ink={ink} />
            {i === 0 && (
              <circle cx={anX} cy={anY - 0.48 * U} r={13} fill={c as string} opacity={0.6} filter="url(#lo-glow)">
                <animate attributeName="opacity" values={vals as string} dur="1s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        ))}

        {/* ── Robot arm (moves parts from the CNC to the conveyor) ── */}
        <IsoCylinder x={6.4} y={2.6} z={0} r={0.6} h={0.3} color={shade(p.machine, -0.2)} u={U} ink={ink} />
        <IsoCylinder x={6.4} y={2.6} z={0.3} r={0.38} h={0.55} color={p.arm} u={U} ink={ink} />
        <g transform={`translate(${shX} ${shY}) scale(0.62)`}>
          <g>
            <animateTransform attributeName="transform" type="rotate" values="-30;-30;34;34;-30" keyTimes="0;0.15;0.5;0.65;1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1;0.45 0 0.55 1;0 0 1 1;0.45 0 0.55 1" />
            <rect x={-13} y={-112} width={26} height={118} rx={13} fill={p.arm} stroke={p.ink} strokeWidth={1.4} />
            <rect x={-4} y={-104} width={8} height={90} rx={4} fill={shade(p.arm, 0.25)} />
            <circle r={15} fill={shade(p.machine, -0.3)} stroke={p.ink} strokeWidth={1.4} />
            <circle r={6} fill={shade(p.arm, 0.4)} />
            <g transform="translate(0 -106)">
              <g>
                <animateTransform attributeName="transform" type="rotate" values="72;72;110;110;72" keyTimes="0;0.15;0.5;0.65;1" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1;0.45 0 0.55 1;0 0 1 1;0.45 0 0.55 1" />
                <rect x={-10} y={-92} width={20} height={98} rx={10} fill={p.arm} stroke={p.ink} strokeWidth={1.4} />
                <circle r={12} fill={shade(p.machine, -0.3)} stroke={p.ink} strokeWidth={1.4} />
                <g transform="translate(0 -92)">
                  <rect x={-14} y={-14} width={28} height={12} rx={3} fill={shade(p.machine, -0.3)} stroke={p.ink} strokeWidth={1.2} />
                  <rect x={-14} y={-28} width={5} height={16} fill="#BDB6AA" stroke={p.ink} strokeWidth={1} />
                  <rect x={9} y={-28} width={5} height={16} fill="#BDB6AA" stroke={p.ink} strokeWidth={1} />
                  <rect x={-8} y={-26} width={16} height={11} fill="#E3DDD3" stroke={p.ink} strokeWidth={1}>
                    <animate attributeName="opacity" values="1;1;1;0;0;1" keyTimes="0;0.15;0.55;0.56;0.98;1" dur="3s" repeatCount="indefinite" />
                  </rect>
                </g>
              </g>
            </g>
          </g>
        </g>

        {/* ── Conveyor ── */}
        <polygon points={poly([[6, 5.4, 0], [11.2, 5.4, 0], [11.8, 6.0, 0], [6.6, 6.0, 0]])} fill={p.ink} opacity={0.2} filter="url(#lo-blur)" />
        {[6.3, 8.6, 10.9].map((x) => (
          <IsoBox key={x} x={x} y={4.55} z={0} w={0.15} d={0.7} h={0.55} color={shade(p.machine, -0.25)} u={U} ink={ink} />
        ))}
        <IsoBox x={6} y={4.4} z={0.55} w={5.4} d={1} h={0.3} color={shade(p.ink, 0.35)} u={U} ink={ink} />
        {/* belt slats moving +x */}
        <g>
          <animateTransform attributeName="transform" type="translate" values={`0 0;${mv(0.6, 0)}`} dur="0.5s" repeatCount="indefinite" />
          {Array.from({ length: 9 }, (_, i) => (
            <polyline key={i} points={poly([[6.1 + i * 0.6, 4.45, 0.851], [6.1 + i * 0.6, 5.35, 0.851]])} stroke={shade(p.ink, 0.6)} strokeWidth={1.5} />
          ))}
        </g>
        {/* parts riding the belt */}
        {[0, 1, 2].map((k) => (
          <g key={k} opacity={0}>
            <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.9;1" dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
            <animateTransform attributeName="transform" type="translate" values={`0 0;${mv(4.4, 0)}`} dur="3s" begin={`-${k}s`} repeatCount="indefinite" />
            <IsoBox x={6.3} y={4.65} z={0.85} w={0.55} d={0.5} h={0.28} color="#D6D0C6" u={U} ink={ink} />
          </g>
        ))}
        {/* the moment: finished part pops onto the belt */}
        <g opacity={0}>
          <animate attributeName="opacity" values="0;0;1;1;0;0" {...moment} />
          <circle cx={popX} cy={popY} r={10} fill="none" stroke={p.glow} strokeWidth={4}>
            <animate attributeName="r" values="10;10;10;70;90;10" {...moment} />
          </circle>
          <g transform={`translate(${popX + 10} ${popY - 120})`}>
            <rect x={-6} y={-30} width={168} height={40} rx={8} fill={p.ink} />
            <text x={8} y={-2} fontFamily={FONTS.vt323} fontSize={26} fill={p.glow}>
              ✓ RB-0412 PASS
            </text>
            <path d="M14,10 L24,22 L34,10 Z" fill={p.ink} />
          </g>
        </g>

        {/* ── AGV shuttling a parcel to the dock ── */}
        <g>
          <animateTransform attributeName="transform" type="translate" values={`0 0;0 0;${mv(5.6, 0)};${mv(5.6, 0)};0 0`} keyTimes="0;0.1;0.45;0.6;1" dur={`${LOOP}s`} repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1;0.45 0 0.55 1;0 0 1 1;0.45 0 0.55 1" />
          <polygon points={poly([[1.6, 8.6, 0], [3.2, 8.6, 0], [3.5, 8.9, 0], [1.9, 8.9, 0]])} fill={p.ink} opacity={0.25} filter="url(#lo-blur)" />
          <IsoBox x={1.6} y={7.5} z={0.08} w={1.6} d={1.1} h={0.35} color={p.machine} u={U} ink={ink} />
          <polygon points={poly([[1.6, 8.6, 0.2], [3.2, 8.6, 0.2], [3.2, 8.6, 0.28], [1.6, 8.6, 0.28]])} fill={p.glow} />
          <g>
            <animate attributeName="opacity" values="1;1;0;0;0;1" keyTimes="0;0.1;0.45;0.6;0.99;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <Parcel x={1.85} y={7.65} z={0.43} s={1.0} p={p} />
          </g>
          {(() => {
            const [bx, by] = S([3.0, 7.7, 0.45]);
            return (
              <circle cx={bx} cy={by - 4} r={5} fill={p.glow} filter="url(#lo-glow)">
                <animate attributeName="opacity" values="1;0.2;1" dur="0.5s" repeatCount="indefinite" />
              </circle>
            );
          })()}
        </g>

        {/* ── Dock: pallet of parcels ready to ship ── */}
        <polygon points={poly([[9.4, 9.4, 0], [11.6, 9.4, 0], [12, 9.9, 0], [9.8, 9.9, 0]])} fill={p.ink} opacity={0.22} filter="url(#lo-blur)" />
        <IsoBox x={9.4} y={7.0} z={0} w={2.2} d={2.4} h={0.22} color="#B98B5E" u={U} ink={ink} />
        <Parcel x={9.5} y={7.15} z={0.22} s={1.0} p={p} />
        <Parcel x={10.55} y={7.15} z={0.22} s={1.0} p={p} />
        <Parcel x={9.5} y={8.2} z={0.22} s={1.0} p={p} />
        <Parcel x={10.55} y={8.2} z={0.22} s={1.0} p={p} />
        <Parcel x={10.0} y={7.7} z={0.92} s={1.0} p={p} />
        {/* the delivered parcel appears on the stack when the AGV arrives */}
        <g opacity={0}>
          <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.47;0.5;0.95;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          <Parcel x={10.0} y={7.7} z={1.62} s={0.9} p={p} />
        </g>
        {(() => {
          const [lx, ly] = S([10.55, 9.2, 0.5]);
          return (
            <g transform={`translate(${lx} ${ly}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
              <text x={-8} y={0} fontFamily={FONTS.bungee} fontSize={15} fill={p.ink}>
                72H
              </text>
            </g>
          );
        })()}

        {/* safety bollards at the front edge */}
        {[
          [4.6, 9.6],
          [6.4, 9.6],
          [11.6, 6.4],
        ].map(([x, y]) => (
          <IsoCylinder key={`${x}-${y}`} x={x} y={y} r={0.12} h={0.8} color={p.glow} u={U} ink={ink} />
        ))}
      </g>
    </svg>
  );
}
