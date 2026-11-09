import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Switchboard Desk',
  description:
    'Landing-page hero for an AI ad agent: a mid-century walnut desk with a 33-jack switchboard console. Patch cords sway, lamps flicker, the phone dial turns and coffee steams; a campaign brief slides into the in-tray and all 33 lines light up at once. Loops seamlessly.',
  tags: ['hero', 'isometric', 'landing page', 'switchboard', 'mid-century', 'animated svg'],
};

// Every SMIL duration divides this loop (8, 4, 2, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 8 };

export const schema = z.object({
  sign: text('Console sign').default('PATCHWELL'),
  brief: text('Card in the tray').default('Q4 brief'),
  wall: color('Wall').default('#F4E9D8'),
  floor: color('Floor').default('#C9A27A'),
  rug: color('Rug').default('#E6D3B3'),
  wood: color('Walnut').default('#8A5A36'),
  panel: color('Switchboard').default('#2C7873'),
  accent: color('Cords / phone').default('#D96C3D'),
  lamp: color('Lamps').default('#E9B44C'),
  sky: color('Window sky').default('#A9D3D6'),
  night: toggle('Night shift').default(false),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { wall: '#F1DCC4', sky: '#F2A37A', floor: '#B98C66', rug: '#E9C9A6' },
  'night-shift': { night: true, wall: '#3A2E3F', floor: '#5A4038', rug: '#6B4F5A', sky: '#1C1A3A', wood: '#6E4529' },
  terracotta: { wall: '#F1E4D3', floor: '#B88A6A', rug: '#E5CDB2', panel: '#4F6D58', accent: '#C8553D', lamp: '#F2A541', sky: '#BFD8C9' },
  matcha: { wall: '#EEF1E6', floor: '#B9A88A', rug: '#DCE3CC', panel: '#1E2A1A', accent: '#E85D3F', lamp: '#C9A227', sky: '#CFE3E8', wood: '#7B5B3A' },
};

type P = z.infer<typeof schema>;

const U = 52;
const LOOP = scene.loop;
const OX = 560;
const OY = 365;
const INK = 'rgba(30,24,18,0.75)';
const C30 = Math.cos(Math.PI / 6);
// Everything below is drawn inside <g transform="translate(OX OY)">, the same
// space the kit's IsoBox / IsoCylinder use.
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;

/** Local 2D frame on a wall/face plane. `along` = 'x' (plane y=const) or 'y' (plane x=const); origin at a world point. */
function Plane({ at, along, children }: { at: P3; along: 'x' | 'y' | 'top'; children: ReactNode }) {
  const [ox, oy] = S(at);
  const m = along === 'x' ? `matrix(${C30},0.5,0,1,${ox},${oy})` : along === 'y' ? `matrix(${-C30},0.5,0,1,${ox},${oy})` : `matrix(${C30},0.5,${-C30},0.5,${ox},${oy})`;
  return <g transform={m}>{children}</g>;
}

const box = { stroke: INK, strokeWidth: 1.3, strokeLinejoin: 'round' as const };

// Console: x 3..9, y 3..4, z 3.35..7.25; jacks on the front (plane y = 4).
const CON = { x: 3, y: 3, z: 3.35, w: 6, d: 1, h: 3.9 };
const COLS = 11;
const ROWS = 3;
const jackX = (c: number) => CON.x + 0.5 + c * 0.5;
const jackZ = (r: number) => 6.1 - r * 0.85;
const MOMENT = 0.535;

export default function SwitchboardDesk(p: P) {
  const ink = INK;
  const night = p.night;
  const woodTop = shade(p.wood, 0.1);
  const plugAt = (c: number): P3 => [jackX(c), 4.35, 3.95];

  const cords = [
    { from: 1, to: [7, 0], col: p.accent },
    { from: 3, to: [2, 1], col: '#F4E9D8' },
    { from: 5, to: [9, 2], col: p.accent },
    { from: 8, to: [4, 0], col: '#2E2A24' },
    { from: 10, to: [10, 1], col: p.lamp },
  ];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="sd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? shade(p.sky, -0.3) : shade(p.sky, -0.1)} />
          <stop offset="1" stopColor={night ? shade(p.sky, 0.15) : shade(p.sky, 0.45)} />
        </linearGradient>
        <radialGradient id="sd-pool">
          <stop offset="0" stopColor={p.lamp} stopOpacity={night ? 0.75 : 0.45} />
          <stop offset="1" stopColor={p.lamp} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sd-halo">
          <stop offset="0" stopColor={p.lamp} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.lamp} stopOpacity="0" />
        </radialGradient>
        <filter id="sd-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="sd-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="sd-win">
          <polygon points={poly([[8, -1, 4], [12, -1, 4], [12, -1, 8], [8, -1, 8]])} />
        </clipPath>
      </defs>

      {/* ── Room: two walls and a floor ── */}
      <rect width="1200" height="900" fill={p.wall} />
      <g transform={`translate(${OX} ${OY})`}>
      <polygon points={poly([[-1, -1, 0], [-1, 14, 0], [-1, 14, 14], [-1, -1, 14]])} fill={shade(p.wall, -0.07)} />
      <polygon points={poly([[-1, -1, 0], [18, -1, 0], [18, -1, 14], [-1, -1, 14]])} fill={p.wall} />
      {/* picture rail + skirting */}
      <polyline points={poly([[-1, 14, 9], [-1, -1, 9], [18, -1, 9]])} fill="none" stroke={shade(p.wall, -0.2)} strokeWidth="3" />
      <polygon points={poly([[-1, 14, 0], [-1, -1, 0], [18, -1, 0], [18, -1, 0.35], [-1, -1, 0.35], [-1, 14, 0.35]])} fill={shade(p.wood, 0.2)} />
      <polygon points={poly([[-1, -1, 0], [18, -1, 0], [18, 16, 0], [-1, 16, 0]])} fill={p.floor} />
      {/* floorboards */}
      <g stroke={shade(p.floor, -0.18)} strokeWidth="1.2" opacity="0.7">
        {Array.from({ length: 18 }, (_, i) => (
          <polyline key={i} points={poly([[-1, i - 0.5, 0.01], [18, i - 0.5, 0.01]])} fill="none" />
        ))}
      </g>

      {/* ── Window on the right wall ── */}
      <polygon points={poly([[7.8, -1, 3.8], [12.2, -1, 3.8], [12.2, -1, 8.2], [7.8, -1, 8.2]])} fill={shade(p.wood, 0.05)} stroke={ink} strokeWidth="1.3" />
      <g clipPath="url(#sd-win)">
        <polygon points={poly([[8, -1, 4], [12, -1, 4], [12, -1, 8], [8, -1, 8]])} fill="url(#sd-sky)" />
        {night ? (
          <g>
            {Array.from({ length: 14 }, (_, i) => {
              const [sx, sy] = S([8.2 + rand(i * 3.3) * 3.6, -1, 4.4 + rand(i * 5.1) * 3.4]);
              return (
                <circle key={i} cx={sx} cy={sy} r={1 + rand(i) * 1.2} fill="#FFF6DA">
                  <animate attributeName="opacity" values="0.2;1;0.2" dur={`${[2, 4, 8][i % 3]}s`} begin={`-${(rand(i * 7.7) * 4).toFixed(2)}s`} repeatCount="indefinite" />
                </circle>
              );
            })}
            <circle cx={S([10.9, -1, 7.1])[0]} cy={S([10.9, -1, 7.1])[1]} r="20" fill="#FFF3D6" />
            <circle cx={S([10.9, -1, 7.1])[0] + 8} cy={S([10.9, -1, 7.1])[1] - 5} r="17" fill="url(#sd-sky)" />
          </g>
        ) : (
          <g>
            <circle cx={S([11, -1, 7])[0]} cy={S([11, -1, 7])[1]} r="22" fill="#FFF3D6" opacity="0.95" />
            {[0, 1].map((k) => (
              <g key={k}>
                <animateTransform attributeName="transform" type="translate" values={`${k ? 30 : -20} ${k ? 8 : 0};${k ? -30 : 50} ${k ? 8 : 0};${k ? 30 : -20} ${k ? 8 : 0}`} dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
                <g fill="#ffffff" opacity="0.85" transform={`translate(${S([9.2 + k * 1.5, -1, 6.4 - k * 1.2])[0]} ${S([9.2 + k * 1.5, -1, 6.4 - k * 1.2])[1]})`}>
                  <ellipse cx="0" cy="0" rx="26" ry="9" />
                  <circle cx="-6" cy="-6" r="10" />
                  <circle cx="8" cy="-4" r="8" />
                </g>
              </g>
            ))}
            {/* a little paper plane crossing the window */}
            <g>
              <animateMotion dur={`${LOOP}s`} repeatCount="indefinite" path={`M${S([7.6, -1, 5.2]).join(',')} Q${S([10, -1, 7.4]).join(',')} ${S([12.6, -1, 6]).join(',')}`} />
              <path d="M-9,2 L9,-3 L-3,6 Z" fill="#ffffff" stroke={ink} strokeWidth="1" />
            </g>
          </g>
        )}
        {/* mullions */}
        <polyline points={poly([[10, -1, 4], [10, -1, 8]])} stroke={shade(p.wood, 0.05)} strokeWidth="5" fill="none" />
        <polyline points={poly([[8, -1, 6], [12, -1, 6]])} stroke={shade(p.wood, 0.05)} strokeWidth="5" fill="none" />
      </g>
      <polygon points={poly([[7.6, -0.6, 3.8], [12.4, -0.6, 3.8], [12.4, -1, 3.8], [7.6, -1, 3.8]])} fill={shade(p.wood, 0.25)} stroke={ink} strokeWidth="1.2" />

      {/* ── Starburst clock on the left wall (minute hand runs the loop) ── */}
      <Plane at={[-1, 5.2, 6.2]} along="y">
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const L = i % 3 === 0 ? 74 : 56;
          return <line key={i} x1={Math.cos(a) * 30} y1={Math.sin(a) * 30} x2={Math.cos(a) * L} y2={Math.sin(a) * L} stroke={shade(p.wood, -0.1)} strokeWidth={i % 3 === 0 ? 5 : 3} strokeLinecap="round" />;
        })}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const L = i % 3 === 0 ? 74 : 56;
          return <circle key={i} cx={Math.cos(a) * L} cy={Math.sin(a) * L} r={i % 3 === 0 ? 5 : 3.5} fill={p.lamp} stroke={ink} strokeWidth="1" />;
        })}
        <circle r="30" fill="#FFFBF2" stroke={ink} strokeWidth="2" />
        <line x1="0" y1="0" x2="12" y2="-10" stroke="#2E2A24" strokeWidth="3.5" strokeLinecap="round" />
        <g>
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur={`${LOOP}s`} repeatCount="indefinite" />
          <line x1="0" y1="4" x2="0" y2="-22" stroke={p.accent} strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <circle r="3" fill="#2E2A24" />
      </Plane>

      {/* ── Framed print on the left wall: a Harper-ish bird on a branch ── */}
      <Plane at={[-1, 8.2, 6.4]} along="y">
        <rect x="-6" y="-6" width="132" height="102" fill={shade(p.wood, -0.1)} stroke={ink} strokeWidth="1.5" />
        <rect x="4" y="4" width="112" height="82" fill="#FFFBF2" />
        <circle cx="86" cy="30" r="16" fill={p.lamp} />
        <path d="M14 70 Q60 52 108 66" stroke={shade(p.wood, -0.2)} strokeWidth="4" fill="none" />
        <path d="M44 60 L64 40 L82 56 L64 62 Z" fill={p.accent} />
        <path d="M64 40 L74 30 L76 42 Z" fill={p.panel} />
        <circle cx="70" cy="44" r="2" fill="#2E2A24" />
      </Plane>

      {/* ── Rug ── */}
      <polygon points={poly([[0.5, 1.5, 0.02], [12.5, 1.5, 0.02], [12.5, 10.5, 0.02], [0.5, 10.5, 0.02]])} fill={p.rug} stroke={shade(p.rug, -0.2)} strokeWidth="2" />
      <polygon points={poly([[1.2, 2.2, 0.03], [11.8, 2.2, 0.03], [11.8, 9.8, 0.03], [1.2, 9.8, 0.03]])} fill="none" stroke={p.accent} strokeWidth="3" opacity="0.7" />
      <polygon points={poly([[1.7, 2.7, 0.03], [11.3, 2.7, 0.03], [11.3, 9.3, 0.03], [1.7, 9.3, 0.03]])} fill="none" stroke={p.panel} strokeWidth="2" opacity="0.5" />

      {/* desk cast shadow + lamp spill on the floor */}
      <polygon points={poly([[2.2, 3.2, 0.04], [10.2, 3.2, 0.04], [10.9, 8.3, 0.04], [2.9, 8.3, 0.04]])} fill="#1E1812" opacity="0.22" filter="url(#sd-blur)" />

      {/* ── Desk: walnut slab on splayed tapered legs ── */}
      {[
        [2.5, 3.4],
        [9.5, 3.4],
      ].map(([x, y], i) => {
        const [a1, b1] = S([x, y, 3]);
        const [a2, b2] = S([x + (i ? 0.25 : -0.25), y - 0.2, 0]);
        return <line key={i} x1={a1} y1={b1} x2={a2} y2={b2} stroke={shade(p.wood, -0.3)} strokeWidth="9" strokeLinecap="round" />;
      })}
      {/* modesty drawer unit under the slab */}
      <IsoBox x={2.4} y={3.4} z={2.25} w={3} d={3.3} h={0.75} color={p.wood} u={U} ink={{ stroke: ink }} />
      <polygon points={poly([[2.7, 6.7, 2.45], [5.1, 6.7, 2.45], [5.1, 6.7, 2.8], [2.7, 6.7, 2.8]])} fill={shade(p.wood, -0.15)} stroke={ink} strokeWidth="1" />
      <IsoBox x={2} y={3} z={3} w={8} d={4} h={0.35} color={p.wood} u={U} ink={{ stroke: ink }} />
      {[
        [2.5, 6.6],
        [9.5, 6.6],
      ].map(([x, y], i) => {
        const [a1, b1] = S([x, y, 3]);
        const [a2, b2] = S([x + (i ? 0.25 : -0.25), y + 0.3, 0]);
        return (
          <g key={i}>
            <line x1={a1} y1={b1} x2={a2} y2={b2} stroke={shade(p.wood, -0.2)} strokeWidth="10" strokeLinecap="round" />
            <circle cx={a2} cy={b2} r="5" fill="#C9A45C" stroke={ink} strokeWidth="1" />
          </g>
        );
      })}

      {/* lamp pool on the desk top */}
      <ellipse cx={S([8.3, 5.4, 3.36])[0]} cy={S([8.3, 5.4, 3.36])[1]} rx="130" ry="62" fill="url(#sd-pool)">
        <animate attributeName="opacity" values="0.85;1;0.85" dur="4s" repeatCount="indefinite" />
      </ellipse>


      {/* ── Console ── */}
      <polygon points={poly([[CON.x, CON.y + CON.d, CON.z], [CON.x + CON.w, CON.y + CON.d, CON.z], [CON.x + CON.w + 0.6, CON.y + CON.d + 1.3, CON.z], [CON.x + 0.6, CON.y + CON.d + 1.3, CON.z]])} fill="#1E1812" opacity="0.18" filter="url(#sd-blur)" />
      <IsoBox x={CON.x} y={CON.y} z={CON.z} w={CON.w} d={CON.d} h={CON.h} color={p.panel} u={U} ink={{ stroke: ink }} />
      {/* walnut cap + cheeks */}
      <IsoBox x={CON.x - 0.12} y={CON.y - 0.1} z={CON.z + CON.h} w={CON.w + 0.24} d={CON.d + 0.2} h={0.22} color={p.wood} u={U} ink={{ stroke: ink }} />
      {/* sign band */}
      <polygon points={poly([[CON.x + 0.3, 4.001, 6.75], [CON.x + CON.w - 0.3, 4.001, 6.75], [CON.x + CON.w - 0.3, 4.001, 7.1], [CON.x + 0.3, 4.001, 7.1]])} fill={shade(p.panel, -0.55)} stroke={ink} strokeWidth="1" />
      <Plane at={[CON.x + 0.55, 4.001, 6.83]} along="x">
        <text x="0" y="0" fontFamily="'Young Serif', Georgia, serif" fontSize="15" letterSpacing="3" fill={p.lamp} filter="url(#sd-glow)">
          {p.sign}
        </text>
      </Plane>
      <Plane at={[CON.x + CON.w - 1.55, 4.001, 6.83]} along="x">
        <text x="0" y="0" fontFamily="'Familjen Grotesk', sans-serif" fontWeight="700" fontSize="10" letterSpacing="2" fill={shade(p.panel, 0.6)}>
          33 LINES
        </text>
      </Plane>

      {/* jacks + lamps on the console face */}
      <Plane at={[CON.x, 4.001, 7.25]} along="x">
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const c = i % COLS;
          const r = Math.floor(i / COLS);
          const lx = (jackX(c) - CON.x) * U;
          const ly = (7.25 - jackZ(r)) * U;
          const lit = rand(i * 2.9 + 3) > 0.45;
          const s = MOMENT + c * 0.006 + r * 0.004;
          return (
            <g key={i}>
              <circle cx={lx} cy={ly - 18} r="6.5" fill={lit ? p.lamp : shade(p.panel, -0.35)} stroke={ink} strokeWidth="1.2">
                {lit && <Flicker dur={[8, 4, 2][i % 3]} seed={i} low={0.4} />}
              </circle>
              {/* the moment: every line lights at once, rippling left to right */}
              <circle cx={lx} cy={ly - 18} r="9" fill={p.lamp} opacity="0" filter="url(#sd-glow)">
                <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${s.toFixed(3)};${(s + 0.01).toFixed(3)};${(s + 0.12).toFixed(3)};${(s + 0.2).toFixed(3)};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
              </circle>
              <circle cx={lx} cy={ly} r="8" fill="#C9A45C" stroke={ink} strokeWidth="1.2" />
              <circle cx={lx} cy={ly} r="3.8" fill="#2E2A24" />
            </g>
          );
        })}
      </Plane>

      {/* plug shelf in front of the console */}
      <IsoBox x={CON.x} y={4} z={CON.z} w={CON.w} d={0.75} h={0.3} color={shade(p.wood, -0.05)} u={U} ink={{ stroke: ink }} />
      {Array.from({ length: COLS }, (_, c) => {
        const used = cords.some((k) => k.from === c);
        if (used) return null;
        return <IsoCylinder key={c} x={jackX(c)} y={4.38} z={3.65} r={0.09} h={0.32} color={c % 2 ? p.accent : '#3A332B'} u={U} ink={{ stroke: ink }} />;
      })}

      {/* patch cords: plug on the shelf → jack on the face, gently swaying */}
      {cords.map((k, i) => {
        const [ax, ay] = S(plugAt(k.from));
        const [bx, by] = S([jackX(k.to[0]), 4.001, jackZ(k.to[1])]);
        const mx = (ax + bx) / 2;
        const my = Math.max(ay, by) + 40 + i * 6;
        const d1 = `M${ax},${ay} C${ax},${my} ${mx - 10},${my} ${bx},${by + 14} L${bx},${by}`;
        const d2 = `M${ax},${ay} C${ax},${my + 6} ${mx + 14},${my + 4} ${bx},${by + 14} L${bx},${by}`;
        const v = `${d1};${d2};${d1}`;
        return (
          <g key={i}>
            <path d={d1} fill="none" stroke="#1E1812" strokeWidth="6.5" strokeLinecap="round" opacity="0.6">
              <animate attributeName="d" values={v} dur={`${i % 2 ? 4 : 2}s`} begin={`-${i * 0.6}s`} repeatCount="indefinite" {...spline} />
            </path>
            <path d={d1} fill="none" stroke={k.col} strokeWidth="4.5" strokeLinecap="round">
              <animate attributeName="d" values={v} dur={`${i % 2 ? 4 : 2}s`} begin={`-${i * 0.6}s`} repeatCount="indefinite" {...spline} />
            </path>
            <circle cx={bx} cy={by} r="9" fill={k.col} stroke={ink} strokeWidth="1.4" />
            <circle cx={bx - 2.5} cy={by - 3} r="2.5" fill="#ffffff" opacity="0.5" />
            <IsoCylinder x={plugAt(k.from)[0]} y={4.38} z={3.65} r={0.1} h={0.3} color={k.col} u={U} ink={{ stroke: ink }} />
          </g>
        );
      })}

      {/* moment starburst above the console */}
      {(() => {
        const [sx, sy] = S([8.4, 3.5, 8.3]);
        return (
          <g transform={`translate(${sx} ${sy})`} opacity="0">
            <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes={`0;${MOMENT};${MOMENT + 0.012};${MOMENT + 0.08};${MOMENT + 0.16};1`} dur={`${LOOP}s`} repeatCount="indefinite" />
            <g stroke={p.accent} strokeWidth="5" strokeLinecap="round">
              {Array.from({ length: 8 }, (_, i) => {
                const a = (i / 8) * Math.PI * 2 + 0.2;
                const l = i % 2 ? 22 : 40;
                return <line key={i} x1={Math.cos(a) * 9} y1={Math.sin(a) * 9} x2={Math.cos(a) * l} y2={Math.sin(a) * l} />;
              })}
            </g>
          </g>
        );
      })()}

      {/* ── Rotary phone, front-left of the desk ── */}
      <IsoBox x={2.35} y={5.05} z={3.35} w={1.4} d={1.2} h={0.45} color={p.accent} u={U} ink={{ stroke: ink }} />
      <IsoBox x={2.5} y={5.2} z={3.8} w={1.1} d={0.9} h={0.18} color={shade(p.accent, 0.05)} u={U} ink={{ stroke: ink }} />
      <Plane at={[3.05, 5.65, 3.99]} along="top">
        <circle r="14" fill="#FFFBF2" stroke={ink} strokeWidth="1.2" />
        <g>
          <animateTransform attributeName="transform" type="rotate" values="0;0;120;120;0;0" keyTimes="0;0.2;0.32;0.36;0.5;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 1.6;
            return <circle key={i} cx={Math.cos(a) * 9.5} cy={Math.sin(a) * 9.5} r="2.3" fill="#2E2A24" />;
          })}
        </g>
      </Plane>
      {/* handset across the top */}
      {(() => {
        const [a1, b1] = S([2.45, 5.3, 4.15]);
        const [a2, b2] = S([3.65, 5.3, 4.15]);
        return (
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 -3;0 0;0 -3;0 0;0 0" keyTimes="0;0.8;0.82;0.84;0.86;0.88;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <path d={`M${a1},${b1} Q${(a1 + a2) / 2},${(b1 + b2) / 2 - 12} ${a2},${b2}`} stroke={shade(p.accent, -0.1)} strokeWidth="9" strokeLinecap="round" fill="none" />
            <ellipse cx={a1} cy={b1} rx="9" ry="6" fill={p.accent} stroke={ink} strokeWidth="1.2" />
            <ellipse cx={a2} cy={b2} rx="9" ry="6" fill={p.accent} stroke={ink} strokeWidth="1.2" />
          </g>
        );
      })()}

      {/* ── Coffee mug with steam ── */}
      <IsoCylinder x={5.6} y={6.1} z={3.35} r={0.28} h={0.5} color="#FFFBF2" u={U} ink={{ stroke: ink }} />
      {(() => {
        const [mx, my] = S([5.6, 6.1, 3.85]);
        return (
          <g>
            <ellipse cx={mx} cy={my} rx="15" ry="8.5" fill="#5A3A22" />
            <path d={`M${mx + 17},${my + 8} q12,2 10,13 q-2,8 -12,6`} fill="none" stroke="#FFFBF2" strokeWidth="4" />
            <rect x={mx - 17} y={my + 10} width="34" height="5" fill={p.panel} opacity="0.8" />
            {[0, 1, 2].map((k) => (
              <path key={k} d={`M${mx - 6 + k * 6},${my - 4} q-6,-10 0,-20 q6,-10 0,-20`} fill="none" stroke={night ? '#ffffff' : '#ffffff'} strokeWidth="3" strokeLinecap="round" opacity="0">
                <animate attributeName="opacity" values="0;0.75;0" dur="2s" begin={`-${(k * 0.66).toFixed(2)}s`} repeatCount="indefinite" />
                <animateTransform attributeName="transform" type="translate" values="0 6;0 -14" dur="2s" begin={`-${(k * 0.66).toFixed(2)}s`} repeatCount="indefinite" />
              </path>
            ))}
          </g>
        );
      })()}

      {/* ── In-tray with the brief arriving ── */}
      <IsoBox x={7.4} y={5.1} z={3.35} w={1.9} d={1.5} h={0.28} color={shade(p.wood, 0.15)} u={U} ink={{ stroke: ink }} />
      <polygon points={poly([[7.55, 5.25, 3.68], [9.15, 5.25, 3.68], [9.15, 6.45, 3.68], [7.55, 6.45, 3.68]])} fill="#FFFBF2" stroke={ink} strokeWidth="1" />
      <g>
        <animateTransform attributeName="transform" type="translate" values="-430 -210;-430 -210;0 0;0 0" keyTimes="0;0.42;0.53;1" calcMode="spline" keySplines="0 0 1 1;0.2 0.8 0.3 1;0 0 1 1" dur={`${LOOP}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.415;0.43;0.94;1" dur={`${LOOP}s`} repeatCount="indefinite" />
        <polygon points={poly([[7.5, 5.2, 3.76], [9.1, 5.2, 3.76], [9.1, 6.4, 3.76], [7.5, 6.4, 3.76]])} fill="#FFFFFF" stroke={ink} strokeWidth="1.2" />
        <Plane at={[7.7, 5.45, 3.76]} along="top">
          <text x="0" y="14" fontFamily="'Caveat', cursive" fontWeight="700" fontSize="19" fill={p.accent}>
            {p.brief}
          </text>
          {[24, 32, 40].map((y) => (
            <line key={y} x1="0" y1={y} x2={y === 40 ? 44 : 64} y2={y} stroke="#9A8F80" strokeWidth="2" />
          ))}
        </Plane>
      </g>

      {/* ── Desk lamp, front-right corner, arching over the in-tray ── */}
      {(() => {
        const [bx, by] = S([9.6, 4.7, 3.35]);
        const [jx, jy] = S([9.6, 4.7, 5.3]);
        const [hx, hy] = S([9.0, 5.4, 6.1]);
        return (
          <g>
            <ellipse cx={bx} cy={by} rx="18" ry="8" fill={shade(p.wood, -0.35)} stroke={ink} strokeWidth="1.2" />
            <path d={`M${bx},${by} L${jx},${jy} L${hx},${hy}`} stroke="#2E2A24" strokeWidth="4" fill="none" strokeLinejoin="round" />
            <circle cx={jx} cy={jy} r="4" fill="#C9A45C" />
            <circle cx={hx - 4} cy={hy + 24} r="30" fill="url(#sd-halo)" opacity={night ? 0.9 : 0.5}>
              <animate attributeName="opacity" values={night ? '0.8;1;0.8' : '0.45;0.6;0.45'} dur="2s" repeatCount="indefinite" />
            </circle>
            <path d={`M${hx - 30},${hy + 20} L${hx - 6},${hy - 12} L${hx + 18},${hy - 6} L${hx + 22},${hy + 26} Z`} fill={p.accent} stroke={ink} strokeWidth="1.4" strokeLinejoin="round" />
            <ellipse cx={hx - 4} cy={hy + 23} rx="27" ry="7" fill={p.lamp} stroke={ink} strokeWidth="1.2" />
          </g>
        );
      })()}

      {/* ── Plant on the floor, right of the desk ── */}
      <ellipse cx={S([11.3, 5.6, 0])[0] - 20} cy={S([11.3, 5.6, 0])[1] + 8} rx="50" ry="16" fill="#1E1812" opacity="0.2" filter="url(#sd-blur)" />
      {[-1, 1].map((s) => {
        const [a, b] = S([11.3, 5.6, 0.7]);
        return <line key={s} x1={a} y1={b} x2={a + s * 20} y2={b + 40} stroke={shade(p.wood, -0.3)} strokeWidth="4" strokeLinecap="round" />;
      })}
      <IsoCylinder x={11.3} y={5.6} z={0.7} r={0.55} h={0.9} color={p.panel} u={U} ink={{ stroke: ink }} />
      {(() => {
        const [px, py] = S([11.3, 5.6, 1.6]);
        const leaves = [
          [-60, 120],
          [-25, 150],
          [10, 135],
          [40, 110],
          [-80, 80],
          [70, 70],
        ];
        return (
          <g>
            <animateTransform attributeName="transform" type="rotate" values={`-2 ${px} ${py};2 ${px} ${py};-2 ${px} ${py}`} dur="4s" repeatCount="indefinite" {...spline} />
            {leaves.map(([ang, len], i) => (
              <g key={i} transform={`translate(${px} ${py}) rotate(${ang})`}>
                <path d={`M0,0 Q${-14},${-len * 0.5} 0,${-len} Q${14},${-len * 0.5} 0,0 Z`} fill={i % 2 ? '#4F7D5A' : '#3E6B4A'} stroke={ink} strokeWidth="1.1" />
                <path d={`M0,0 L0,${-len * 0.92}`} stroke="#2E4A35" strokeWidth="1" />
              </g>
            ))}
          </g>
        );
      })()}

      </g>
      {/* night: dim the room except the lamps */}
    </svg>
  );
}
