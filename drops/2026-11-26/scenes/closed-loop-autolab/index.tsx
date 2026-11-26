import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoWindow, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Closed-Loop Autolab',
  description:
    "Landing-page hero for Ternary: a cut-away isometric autolab. Hoppers dose powders into crucibles riding a conveyor, a robot arm tends the line, the tube furnace glows, an XRD dome scans, the Atlas screen picks the next recipe and qualified ingots drop into a crate stamped with an element tile. Loops seamlessly.",
  tags: ['hero', 'isometric', 'process', 'factory', 'materials', 'animated svg'],
};

// Every SMIL duration divides this loop (8, 4, 2, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 8 };

export const schema = z.object({
  sign: text('Wall sign').default('TERNARY · AUTOLAB LINE 1'),
  symbol: text('Crate element').default('Ga'),
  number: text('Atomic number').default('31'),
  next: text('Screen readout').default('NEXT · Ga₂O₃–In 4%'),
  backdrop: color('Backdrop').default('#F4E9D8'),
  rays: color('Sunburst').default('#E6D3B3'),
  wall: color('Walls').default('#EFE2CC'),
  floor: color('Floor').default('#D8C29C'),
  machine: color('Machines').default('#2C7873'),
  body: color('Enclosures').default('#F6EFE3'),
  molten: color('Heat').default('#D96C3D'),
  brass: color('Brass').default('#E9B44C'),
  ink: color('Ink').default('#2E2A24'),
  lamp: color('Lamp light').default('#FFE3A3'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-shift': { backdrop: '#1E1A17', rays: '#2A241F', wall: '#3A332C', floor: '#4A4036', body: '#E8DFD0', lamp: '#FFC970' },
  dusk: { backdrop: '#F2C9A0', rays: '#E8AE80', wall: '#F0D8BC', floor: '#C9A57E', molten: '#C8452D' },
  bauhaus: { backdrop: '#F2EBDD', rays: '#E4D9C4', wall: '#F7F1E4', floor: '#E4D9C4', machine: '#1D4E9E', molten: '#D9381E', brass: '#F2B90F', ink: '#111111', symbol: 'Nd', number: '60', next: 'NEXT · Nd₂Fe₁₄B +Dy' },
  blueprint: { backdrop: '#0F3B8C', rays: '#134AA8', wall: '#1A55B8', floor: '#2763C4', machine: '#7FB2FF', body: '#EAF2FF', molten: '#FFDD00', brass: '#FFDD00', ink: '#0A2558', lamp: '#FFF3B0' },
};

type P = z.infer<typeof schema>;

const U = 50;
const OX = 494;
const OY = 248;
const D = 9; // floor depth
const LOOP = scene.loop;
const C30 = Math.cos(Math.PI / 6);
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const dur = (s: number) => `${s}s`;

/** Group whose local x runs along a y = const wall (left-face plane) and local y runs down. */
const leftPlane = (x: number, y: number, z: number) => {
  const [a, b] = S([x, y, z]);
  return `matrix(${C30} 0.5 0 1 ${a} ${b})`;
};

function Shadow({ x, y, w, d, k = 0.9 }: { x: number; y: number; w: number; d: number; k?: number }) {
  return <polygon points={poly([[x + 0.3, y + 0.3, 0], [x + w + 0.6, y + 0.3, 0], [x + w + 0.6, y + d + 0.7, 0], [x + 0.3, y + d + 0.7, 0]])} fill="#2E2A24" opacity={0.18 * k} filter="url(#al-blur)" />;
}

/** A crucible riding the belt: steel cup whose contents change from powder → molten → cooled. */
function Crucible({ p, begin }: { p: P; begin: number }) {
  const [cx, cy] = S([1.7, 5.6, 1.17]);
  const rx = 0.3 * U * 1.2247;
  const ry = 0.3 * U * 0.7071;
  const h = 0.42 * U;
  const [ex, ey] = S([11.9, 5.6, 1.17]);
  const fillVals = [shade(p.floor, 0.35), shade(p.floor, 0.35), p.molten, p.brass, p.molten, shade(p.machine, 0.4), shade(p.machine, 0.4)].join(';');
  return (
    <g opacity="0">
      <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.92;1" dur="4s" begin={`${begin}s`} repeatCount="indefinite" />
      <animateTransform attributeName="transform" type="translate" values={`0 0;${ex - cx} ${ey - cy}`} dur="4s" begin={`${begin}s`} repeatCount="indefinite" />
      <path d={`M${cx - rx} ${cy - h} L${cx - rx * 0.8} ${cy} A${rx * 0.8} ${ry * 0.8} 0 0 0 ${cx + rx * 0.8} ${cy} L${cx + rx} ${cy - h} Z`} fill={shade(p.body, -0.12)} stroke={p.ink} strokeWidth="1.3" strokeLinejoin="round" />
      <ellipse cx={cx} cy={cy - h} rx={rx} ry={ry} fill={shade(p.body, -0.3)} stroke={p.ink} strokeWidth="1.3" />
      <ellipse cx={cx} cy={cy - h + 2} rx={rx * 0.78} ry={ry * 0.7}>
        <animate attributeName="fill" values={fillVals} keyTimes="0;0.44;0.52;0.6;0.7;0.82;1" dur="4s" begin={`${begin}s`} repeatCount="indefinite" />
      </ellipse>
    </g>
  );
}

function Lamp({ x, len, p, phase }: { x: number; len: number; p: P; phase: number }) {
  const y = len;
  return (
    <g>
      <animateTransform attributeName="transform" type="rotate" values={`-1.5 ${x} 0;1.5 ${x} 0;-1.5 ${x} 0`} dur="4s" begin={`${-phase}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
      <polygon points={`${x - 26},${y + 22} ${x + 26},${y + 22} ${x + 150},${y + 330} ${x - 150},${y + 330}`} fill="url(#al-cone)" opacity="0.55">
        <animate attributeName="opacity" values="0.55;0.42;0.55" dur="2s" begin={`${-phase}s`} repeatCount="indefinite" />
      </polygon>
      <line x1={x} y1={0} x2={x} y2={y} stroke={p.ink} strokeWidth="2" />
      <path d={`M${x - 8} ${y} L${x + 8} ${y} L${x + 30} ${y + 24} L${x - 30} ${y + 24} Z`} fill={p.molten} stroke={p.ink} strokeWidth="1.6" strokeLinejoin="round" />
      <ellipse cx={x} cy={y + 25} rx={20} ry={4} fill={p.lamp} />
      <rect x={x - 3} y={y - 6} width={6} height={6} fill={p.brass} stroke={p.ink} strokeWidth="1" />
    </g>
  );
}

export default function ClosedLoopAutolab(p: P) {
  const ink = { stroke: p.ink, strokeWidth: 1.2 };

  // Key anchor points.
  const [furnTopX, furnTopY] = S([8.0, 5.6, 2.7]);
  const [chimX, chimY] = S([8.6, 5.0, 3.6]);
  const [domeX, domeY] = S([11.1, 5.6, 1.5]);
  const [crateX, crateY] = S([12.8, 8.0, 0.95 + 0.5]);
  const [armX, armY] = S([4.6, 3.6, 1.9]);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${scene.width} ${scene.height}`}>
      <defs>
        <filter id="al-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="al-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="al-bg" cx="0.5" cy="0.42" r="0.75">
          <stop offset="0" stopColor={shade(p.backdrop, 0.25)} />
          <stop offset="1" stopColor={shade(p.backdrop, -0.08)} />
        </radialGradient>
        <linearGradient id="al-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.lamp} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.lamp} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="al-heat">
          <stop offset="0" stopColor={p.molten} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.molten} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── Backdrop: paper + slowly turning mid-century sunburst ── */}
      <rect width={scene.width} height={scene.height} fill="url(#al-bg)" />
      <g opacity="0.6">
        <animateTransform attributeName="transform" type="rotate" values="0 600 380;15 600 380" dur={dur(LOOP)} repeatCount="indefinite" />
        {Array.from({ length: 24 }, (_, i) => {
          const a = (i / 24) * Math.PI * 2;
          const a2 = a + Math.PI / 48;
          return <path key={i} d={`M600 380 L${600 + Math.cos(a) * 1100} ${380 + Math.sin(a) * 1100} L${600 + Math.cos(a2) * 1100} ${380 + Math.sin(a2) * 1100}Z`} fill={p.rays} />;
        })}
      </g>
      {/* four-point stars in the sky */}
      {[
        [150, 120, 16, 0],
        [1060, 150, 11, 1],
        [980, 70, 7, 2],
        [250, 230, 8, 3],
      ].map(([x, y, r, k]) => (
        <path key={k} d={`M${x} ${y - r} Q${x + r * 0.2} ${y - r * 0.2} ${x + r} ${y} Q${x + r * 0.2} ${y + r * 0.2} ${x} ${y + r} Q${x - r * 0.2} ${y + r * 0.2} ${x - r} ${y} Q${x - r * 0.2} ${y - r * 0.2} ${x} ${y - r}Z`} fill={p.brass}>
          <animate attributeName="opacity" values="1;0.35;1" dur="2s" begin={`${-k * 0.5}s`} repeatCount="indefinite" />
        </path>
      ))}

      <g transform={`translate(${OX} ${OY})`}>
        {/* ── Slab + cut-away walls ── */}
        <IsoBox x={0} y={0} z={-0.6} w={14} d={D} h={0.6} color={shade(p.floor, -0.1)} u={U} ink={ink} top={false} />
        <polygon points={poly([[0, 0, 0], [14, 0, 0], [14, D, 0], [0, D, 0]])} fill={p.floor} {...ink} />
        <g stroke={shade(p.floor, -0.18)} strokeWidth="1" opacity="0.7">
          {Array.from({ length: 13 }, (_, i) => (
            <polyline key={`gx${i}`} points={poly([[i + 1, 0, 0], [i + 1, D, 0]])} fill="none" />
          ))}
          {Array.from({ length: D - 1 }, (_, i) => (
            <polyline key={`gy${i}`} points={poly([[0, i + 1, 0], [14, i + 1, 0]])} fill="none" />
          ))}
        </g>
        {/* walkway stripe */}
        <polyline points={poly([[0.4, 8.6, 0.01], [13.6, 8.6, 0.01]])} stroke={p.brass} strokeWidth="4" strokeDasharray="18 12" fill="none" />

        {/* back wall (y = 0) and side wall (x = 0) */}
        <polygon points={poly([[0, 0, 0], [14, 0, 0], [14, 0, 4.2], [0, 0, 4.2]])} fill={p.wall} {...ink} />
        <polygon points={poly([[0, 0, 0], [0, D, 0], [0, D, 4.2], [0, 0, 4.2]])} fill={shade(p.wall, -0.08)} {...ink} />
        {/* teal dado band */}
        <polygon points={poly([[0, 0, 0], [14, 0, 0], [14, 0, 0.9], [0, 0, 0.9]])} fill={shade(p.machine, 0.15)} opacity="0.85" />
        <polygon points={poly([[0, 0, 0], [0, D, 0], [0, D, 0.9], [0, 0, 0.9]])} fill={shade(p.machine, 0)} opacity="0.85" />
        {/* wall caps */}
        <polygon points={poly([[0, 0, 4.2], [14, 0, 4.2], [14, -0.3, 4.2], [-0.3, -0.3, 4.2], [-0.3, D, 4.2], [0, D, 4.2]])} fill={shade(p.wall, 0.15)} {...ink} />
        {/* clerestory windows on the side wall */}
        {[0.8, 3.6, 6.4].map((a, i) => (
          <g key={a}>
            <IsoWindow face="right" plane={0} a={a} z={2.4} w={2.0} h={1.3} fill={shade(p.ink, 0.2)} u={U} ink={ink} />
            <IsoWindow face="right" plane={0} a={a + 0.12} z={2.52} w={1.76} h={1.06} fill={shade(p.lamp, 0.2)} u={U} ink={{ strokeWidth: 0 }}>
              <Flicker dur={LOOP} seed={i + 3} low={0.75} />
            </IsoWindow>
            <polyline points={poly([[0, a + 1.0, 2.52], [0, a + 1.0, 3.58]])} stroke={shade(p.ink, 0.2)} strokeWidth="2" fill="none" />
          </g>
        ))}
        {/* wall sign on a brass plate */}
        <g transform={leftPlane(0.7, 0, 3.8)}>
          <rect x={0} y={0} width={420} height={48} rx={4} fill={p.ink} />
          <rect x={4} y={4} width={412} height={40} rx={3} fill="none" stroke={p.brass} strokeWidth="1.5" />
          <text x={210} y={35} textAnchor="middle" fontFamily={FONTS.shoulders} fontWeight={900} fontSize={31} letterSpacing="2" fill={p.body}>
            {p.sign}
          </text>
        </g>

        {/* ── Atlas model screen on the back wall ── */}
        <Shadow x={9} y={0.6} w={3} d={0.6} />
        <IsoBox x={9} y={0.3} w={3.2} d={0.5} h={3.3} color={shade(p.ink, 0.15)} u={U} ink={ink} />
        <g transform={leftPlane(9.15, 0.8, 3.15)}>
          <rect x={0} y={0} width={U * 2.9} height={U * 2.2} fill={shade(p.machine, -0.55)} />
          <text x={8} y={18} fontFamily={FONTS.mono} fontSize={11} fill={p.brass} letterSpacing="1">
            ATLAS · CANDIDATES
          </text>
          {Array.from({ length: 7 }, (_, i) => {
            const base = 20 + rand(i * 3.7) * 30;
            const v = [base, base + 18 + rand(i) * 12, base - 6, base].map((n) => Math.max(8, n));
            const top = (h: number) => U * 2.2 - 22 - h;
            return (
              <rect key={i} x={10 + i * 15} width={10} y={top(v[0])} height={v[0]} fill={i === 3 ? p.molten : shade(p.machine, 0.35)}>
                <animate attributeName="height" values={v.join(';')} dur="2s" begin={`${-i * 0.25}s`} repeatCount="indefinite" />
                <animate attributeName="y" values={v.map(top).join(';')} dur="2s" begin={`${-i * 0.25}s`} repeatCount="indefinite" />
              </rect>
            );
          })}
          <text x={8} y={U * 2.2 - 8} fontFamily={FONTS.mono} fontSize={10} fill={p.body}>
            {p.next}
          </text>
          <rect x={U * 2.9 - 14} y={8} width={6} height={6} fill={p.molten}>
            <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
          </rect>
        </g>

        {/* ── Robot arm base (behind the belt) ── */}
        <Shadow x={4.1} y={3.1} w={1} d={1} />
        <IsoBox x={4.15} y={3.15} w={0.9} d={0.9} h={0.5} color={p.machine} u={U} ink={ink} />
        <ellipse cx={S([4.6, 3.6, 0.5])[0]} cy={S([4.6, 3.6, 0.5])[1]} rx={0.42 * U * 1.22} ry={0.42 * U * 0.7} fill={shade(p.machine, 0.2)} {...ink} />
        <rect x={S([4.6, 3.6, 0.5])[0] - 9} y={armY} width={18} height={S([4.6, 3.6, 0.5])[1] - armY} fill={shade(p.body, -0.1)} {...ink} />

        {/* ── Conveyor ── */}
        <Shadow x={1} y={5} w={11} d={1.2} k={0.7} />
        {[1.4, 4, 6.8, 9.6, 11.6].map((x) => (
          <g key={x}>
            <polyline points={poly([[x, 5.1, 0], [x, 5.1, 0.9]])} stroke={p.ink} strokeWidth="3" />
            <polyline points={poly([[x, 6.1, 0], [x, 6.1, 0.9]])} stroke={p.ink} strokeWidth="3" />
          </g>
        ))}
        <IsoBox x={1} y={5} z={0.9} w={11} d={1.2} h={0.25} color={shade(p.ink, 0.35)} u={U} ink={ink} />
        {/* moving belt treads */}
        <g stroke={shade(p.ink, 0.55)} strokeWidth="1.5">
          <animateTransform attributeName="transform" type="translate" values={`0 0;${0.5 * C30 * U} ${0.5 * 0.5 * U}`} dur="0.5s" repeatCount="indefinite" />
          {Array.from({ length: 21 }, (_, i) => (
            <polyline key={i} points={poly([[1.1 + i * 0.5, 5.05, 1.151], [1.1 + i * 0.5, 6.15, 1.151]])} fill="none" />
          ))}
        </g>
        {[0, -1, -2, -3].map((b) => (
          <Crucible key={b} p={p} begin={b} />
        ))}

        {/* ── Hoppers dosing powder ── */}
        {[
          [1.4, p.machine, 0],
          [2.9, p.molten, 1],
        ].map(([x, c, k]) => {
          const xx = x as number;
          const col = c as string;
          const [sx, sy] = S([xx + 0.5, 5.6, 2.3]);
          const [bx, by] = S([xx + 0.5, 5.6, 1.3]);
          return (
            <g key={k as number}>
              <polyline points={poly([[xx, 5.1, 0.9], [xx, 5.1, 3.0]])} stroke={p.ink} strokeWidth="2.5" />
              <polyline points={poly([[xx + 1, 6.1, 1.15], [xx + 1, 6.1, 3.0]])} stroke={p.ink} strokeWidth="2.5" />
              {/* falling powder */}
              <g fill={shade(col, 0.3)}>
                {[0, 1, 2, 3].map((j) => (
                  <circle key={j} cx={sx + (j % 2 ? 3 : -3)} cy={sy} r="2.6" opacity="0">
                    <animate attributeName="cy" values={`${sy};${by}`} dur="1s" begin={`${-j * 0.25}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;0.8;0" dur="1s" begin={`${-j * 0.25}s`} repeatCount="indefinite" />
                  </circle>
                ))}
              </g>
              {/* funnel */}
              <polygon points={poly([[xx, 6.1, 3.0], [xx + 1, 6.1, 3.0], [xx + 0.62, 5.72, 2.3], [xx + 0.38, 5.72, 2.3]])} fill={shade(p.body, -0.28)} {...ink} />
              <polygon points={poly([[xx + 1, 5.1, 3.0], [xx + 1, 6.1, 3.0], [xx + 0.62, 5.72, 2.3], [xx + 0.62, 5.48, 2.3]])} fill={shade(p.body, -0.15)} {...ink} />
              <IsoBox x={xx} y={5.1} z={3.0} w={1} d={1} h={0.9} color={p.body} u={U} ink={ink} />
              <IsoWindow face="left" plane={6.1} a={xx + 0.15} z={3.2} w={0.7} h={0.18} fill={col} u={U} ink={ink} />
            </g>
          );
        })}

        {/* ── Robot arm limbs (over the belt), swinging ── */}
        <g transform={`translate(${armX} ${armY}) scale(1.35) translate(${-armX} ${-armY})`}>
        <g>
          <animateTransform attributeName="transform" type="rotate" values={`-8 ${armX} ${armY};10 ${armX} ${armY};-8 ${armX} ${armY}`} dur="2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
          <line x1={armX} y1={armY} x2={armX + 38} y2={armY - 34} stroke={p.ink} strokeWidth="16" strokeLinecap="round" />
          <line x1={armX} y1={armY} x2={armX + 38} y2={armY - 34} stroke={p.molten} strokeWidth="11" strokeLinecap="round" />
          <g>
            <animateTransform attributeName="transform" type="rotate" values={`10 ${armX + 38} ${armY - 34};-14 ${armX + 38} ${armY - 34};10 ${armX + 38} ${armY - 34}`} dur="2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
            <line x1={armX + 38} y1={armY - 34} x2={armX + 70} y2={armY + 4} stroke={p.ink} strokeWidth="13" strokeLinecap="round" />
            <line x1={armX + 38} y1={armY - 34} x2={armX + 70} y2={armY + 4} stroke={p.body} strokeWidth="8" strokeLinecap="round" />
            <path d={`M${armX + 62} ${armY + 4} l-4 12 M${armX + 78} ${armY + 4} l4 12`} stroke={p.ink} strokeWidth="4" strokeLinecap="round" />
            <circle cx={armX + 70} cy={armY + 4} r="6" fill={p.brass} {...ink} />
          </g>
          <circle cx={armX + 38} cy={armY - 34} r="9" fill={p.brass} {...ink} />
          <circle cx={armX} cy={armY} r="10" fill={p.machine} {...ink} />
        </g>
        </g>

        {/* ── Feedstock pallet: drums of oxide powder, front-left ── */}
        <Shadow x={0.8} y={6.9} w={2.8} d={1.6} />
        <IsoBox x={0.8} y={6.9} w={2.8} d={1.7} h={0.18} color={shade(p.floor, -0.3)} u={U} ink={ink} />
        {[
          [1.4, 7.4, p.machine],
          [2.5, 7.4, p.molten],
          [1.4, 8.1, p.molten],
          [2.5, 8.1, p.machine],
        ].map(([x, y, c], i) => (
          <g key={i}>
            <IsoCylinder x={x as number} y={y as number} z={0.18} r={0.42} h={1.0} color={c as string} u={U} ink={ink} />
            {[0.45, 0.85].map((z) => {
              const [bx, by] = S([x as number, y as number, 0.18 + z]);
              return <path key={z} d={`M${bx - 0.42 * U * 1.2247} ${by} A${0.42 * U * 1.2247} ${0.42 * U * 0.7071} 0 0 0 ${bx + 0.42 * U * 1.2247} ${by}`} stroke={p.brass} strokeWidth="2.2" fill="none" />;
            })}
          </g>
        ))}
        <g transform={leftPlane(2.15, 8.52, 0.95)}>
          <rect x={0} y={0} width={30} height={16} rx={2} fill={p.body} stroke={p.ink} strokeWidth="1" />
          <text x={15} y={12} textAnchor="middle" fontFamily={FONTS.mono} fontSize={9} fill={p.ink}>
            Ga₂O₃
          </text>
        </g>

        {/* ── Tube furnace straddling the belt ── */}
        <Shadow x={6.4} y={4.5} w={2.8} d={2.2} />
        <ellipse cx={S([7.8, 6.9, 0])[0]} cy={S([7.8, 6.9, 0])[1]} rx={110} ry={40} fill="url(#al-heat)">
          <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
        </ellipse>
        <IsoBox x={6.4} y={4.5} w={2.8} d={2.2} h={2.7} color={p.body} u={U} ink={ink} />
        {/* bands */}
        {[0.5, 2.2].map((z) => (
          <polygon key={z} points={poly([[6.4, 6.7, z], [9.2, 6.7, z], [9.2, 4.5, z], [9.2, 4.5, z + 0.15], [9.2, 6.7, z + 0.15], [6.4, 6.7, z + 0.15]])} fill={p.machine} {...ink} />
        ))}
        {/* belt tunnel mouth on the right face */}
        <polygon points={poly([[9.2, 5.0, 0.9], [9.2, 6.2, 0.9], [9.2, 6.2, 1.7], [9.2, 5.0, 1.7]])} fill={shade(p.ink, 0.1)} {...ink} />
        <polygon points={poly([[9.2, 5.1, 0.95], [9.2, 6.1, 0.95], [9.2, 6.1, 1.6], [9.2, 5.1, 1.6]])} fill={p.molten} opacity="0.9" filter="url(#al-glow)">
          <animate attributeName="opacity" values="0.9;0.6;0.9" dur="1s" repeatCount="indefinite" />
        </polygon>
        {/* glowing sight slot on the front face */}
        <IsoWindow face="left" plane={6.7} a={6.75} z={1.05} w={2.1} h={0.75} fill={shade(p.ink, 0.1)} u={U} ink={ink} />
        <g filter="url(#al-glow)">
          <IsoWindow face="left" plane={6.7} a={6.85} z={1.15} w={1.9} h={0.55} fill={p.molten} u={U} ink={{ strokeWidth: 0 }}>
            <Flicker dur={2} seed={7} low={0.7} />
          </IsoWindow>
        </g>
        {/* dial + label plate */}
        <g transform={leftPlane(6.85, 6.7, 2.05)}>
          <rect x={0} y={0} width={U * 1.3} height={18} rx={2} fill={p.ink} />
          <text x={U * 0.65} y={13} textAnchor="middle" fontFamily={FONTS.mono} fontSize={10.5} fill={p.brass}>
            1,450 °C
          </text>
          <circle cx={U * 1.75} cy={9} r={10} fill={p.body} stroke={p.ink} strokeWidth="1.5" />
          <line x1={U * 1.75} y1={9} x2={U * 1.75 + 6} y2={4} stroke={p.molten} strokeWidth="2" strokeLinecap="round">
            <animateTransform attributeName="transform" type="rotate" values={`-30 ${U * 1.75} 9;40 ${U * 1.75} 9;-30 ${U * 1.75} 9`} dur="4s" repeatCount="indefinite" />
          </line>
        </g>
        {/* chimney + heat shimmer */}
        <IsoBox x={8.3} y={4.7} z={2.7} w={0.6} d={0.6} h={0.9} color={shade(p.body, -0.1)} u={U} ink={ink} />
        {[0, 1, 2].map((k) => (
          <circle key={k} cx={chimX} cy={chimY} r="8" fill={shade(p.wall, 0.3)} opacity="0">
            <animate attributeName="cy" values={`${chimY - 4};${chimY - 90}`} dur="4s" begin={`${-k * 1.33}s`} repeatCount="indefinite" />
            <animate attributeName="cx" values={`${chimX};${chimX + 26}`} dur="4s" begin={`${-k * 1.33}s`} repeatCount="indefinite" />
            <animate attributeName="r" values="7;20" dur="4s" begin={`${-k * 1.33}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.75;0" dur="4s" begin={`${-k * 1.33}s`} repeatCount="indefinite" />
          </circle>
        ))}
        {[-34, 0, 30].map((dx, k) => (
          <path key={k} d={`M${furnTopX + dx - 30} ${furnTopY} q6 -8 0 -16 q-6 -8 0 -16`} stroke={p.molten} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0">
            <animateTransform attributeName="transform" type="translate" values="0 0;0 -26" dur="2s" begin={`${-k * 0.66}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.8;0" dur="2s" begin={`${-k * 0.66}s`} repeatCount="indefinite" />
          </path>
        ))}

        {/* ── XRD dome ── */}
        <Shadow x={10.2} y={4.8} w={1.8} d={1.6} />
        <IsoBox x={10.2} y={4.75} w={1.8} d={1.7} h={1.5} color={p.machine} u={U} ink={ink} />
        <g transform={leftPlane(10.35, 6.45, 1.25)}>
          <rect x={0} y={0} width={U * 1.5} height={20} rx={3} fill={p.ink} />
          <text x={U * 0.75} y={15} textAnchor="middle" fontFamily={FONTS.shoulders} fontWeight={900} fontSize={15} letterSpacing="2" fill={p.body}>
            XRD · PASS
          </text>
          <rect x={2} y={2} width={U * 1.5 - 4} height={16} rx={2} fill={p.brass} opacity="0">
            <animate attributeName="opacity" values="0;0;0.85;0.85;0;0" keyTimes="0;0.74;0.75;0.84;0.85;1" dur={dur(LOOP)} repeatCount="indefinite" />
          </rect>
        </g>
        {(() => {
          const r = 0.78;
          const rx = r * U * 1.2247;
          const ry = r * U * 0.7071;
          return (
            <g>
              <path d={`M${domeX - rx} ${domeY} A${rx} ${r * U * 1.05} 0 0 1 ${domeX + rx} ${domeY} A${rx} ${ry} 0 0 1 ${domeX - rx} ${domeY} Z`} fill={shade(p.body, 0.1)} fillOpacity="0.85" {...ink} />
              <path d={`M${domeX - rx * 0.6} ${domeY - r * U * 0.7} A${rx * 0.8} ${r * U} 0 0 1 ${domeX + rx * 0.1} ${domeY - r * U * 0.95}`} stroke="#ffffff" strokeWidth="3" fill="none" opacity="0.7" />
              {/* sample stage + sweeping beam */}
              <ellipse cx={domeX} cy={domeY - 4} rx={12} ry={6} fill={p.ink} />
              <g>
                <animateTransform attributeName="transform" type="rotate" values={`-40 ${domeX} ${domeY - 4};40 ${domeX} ${domeY - 4};-40 ${domeX} ${domeY - 4}`} dur="2s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
                <line x1={domeX} y1={domeY - 4} x2={domeX} y2={domeY - r * U * 0.9} stroke={p.molten} strokeWidth="2.5" filter="url(#al-glow)" />
              </g>
              {/* PASS lamp on a mast */}
              <line x1={domeX + rx * 0.8} y1={domeY - 4} x2={domeX + rx * 0.8} y2={domeY - 58} stroke={p.ink} strokeWidth="2.5" />
              <circle cx={domeX + rx * 0.8} cy={domeY - 64} r="8" fill={p.brass} {...ink} opacity="0.4">
                <animate attributeName="opacity" values="0.4;0.4;1;1;0.4;0.4" keyTimes="0;0.74;0.75;0.84;0.85;1" dur={dur(LOOP)} repeatCount="indefinite" />
              </circle>
              <circle cx={domeX + rx * 0.8} cy={domeY - 64} r="10" fill="none" stroke={p.brass} strokeWidth="3" opacity="0">
                <animate attributeName="r" values="10;10;10;40;40" keyTimes="0;0.75;0.751;0.85;1" dur={dur(LOOP)} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.75;0.751;0.85;1" dur={dur(LOOP)} repeatCount="indefinite" />
              </circle>
            </g>
          );
        })()}

        {/* ── Crate of qualified ingots ── */}
        <Shadow x={12} y={7.2} w={1.7} d={1.7} />
        <IsoBox x={12} y={7.2} w={1.7} d={1.7} h={0.95} color={shade(p.floor, -0.05)} u={U} ink={ink} />
        {[0.3, 0.62].map((z) => (
          <g key={z}>
            <polyline points={poly([[12, 8.9, z], [13.7, 8.9, z]])} stroke={shade(p.floor, -0.35)} strokeWidth="1.2" fill="none" />
            <polyline points={poly([[13.7, 7.2, z], [13.7, 8.9, z]])} stroke={shade(p.floor, -0.35)} strokeWidth="1.2" fill="none" />
          </g>
        ))}
        {/* element tile stamped on the crate */}
        <g transform={leftPlane(12.3, 8.9, 0.85)}>
          <rect x={0} y={0} width={34} height={30} rx={3} fill={p.machine} stroke={p.ink} strokeWidth="1.2" />
          <text x={4} y={9} fontFamily={FONTS.mono} fontSize={7} fill={p.body}>
            {p.number}
          </text>
          <text x={17} y={26} textAnchor="middle" fontFamily={FONTS.shoulders} fontWeight={900} fontSize={19} fill={p.body}>
            {p.symbol}
          </text>
        </g>
        {/* ingot stack */}
        {[
          [12.2, 7.45, 0.95],
          [12.95, 7.45, 0.95],
          [12.2, 8.15, 0.95],
          [12.95, 8.15, 0.95],
          [12.55, 7.8, 1.2],
        ].map(([x, y, z], i) => (
          <IsoBox key={i} x={x} y={y} z={z} w={0.6} d={0.55} h={0.25} color={shade(p.body, -0.22)} u={U} ink={ink} />
        ))}
        {/* the moment: a fresh, still-hot ingot drops on the stack */}
        <g opacity="0">
          <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.69;0.7;0.97;1" dur={dur(LOOP)} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0 -110;0 -110;0 0;0 0" keyTimes="0;0.7;0.75;1" dur={dur(LOOP)} repeatCount="indefinite" calcMode="spline" keySplines="0 0 1 1;0.55 0 1 0.6;0 0 1 1" />
          <IsoBox x={12.55} y={7.8} z={1.45} w={0.6} d={0.55} h={0.25} color={p.brass} u={U} ink={ink} />
        </g>
        <g>
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i / 8) * Math.PI * 2;
            return (
              <line key={i} x1={crateX + Math.cos(a) * 18} y1={crateY - 18 + Math.sin(a) * 9} x2={crateX + Math.cos(a) * 40} y2={crateY - 18 + Math.sin(a) * 20} stroke={p.brass} strokeWidth="3" strokeLinecap="round" opacity="0">
                <animate attributeName="opacity" values="0;0;1;0;0" keyTimes="0;0.75;0.755;0.85;1" dur={dur(LOOP)} repeatCount="indefinite" />
              </line>
            );
          })}
        </g>

        {/* rising sparks over the furnace */}
        {Array.from({ length: 6 }, (_, i) => {
          const x0 = furnTopX - 50 + rand(i * 5.1) * 100;
          return (
            <rect key={i} x={x0} y={furnTopY} width="4" height="4" fill={p.brass} transform={`rotate(45 ${x0} ${furnTopY})`} opacity="0">
              <animate attributeName="y" values={`${furnTopY};${furnTopY - 120}`} dur="2s" begin={`${-i * 0.33}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;0" dur="2s" begin={`${-i * 0.33}s`} repeatCount="indefinite" />
            </rect>
          );
        })}
      </g>

      {/* ── Mid-century pendant lamps hanging into the room ── */}
      <Lamp x={OX + (8 - 5.6) * C30 * U} len={OY + (6.8 - 2.7) * U - 300} p={p} phase={0} />
      <Lamp x={OX + (12.8 - 8) * C30 * U} len={OY + (10.4 - 1.5) * U - 330} p={p} phase={1.3} />
    </svg>
  );
}
