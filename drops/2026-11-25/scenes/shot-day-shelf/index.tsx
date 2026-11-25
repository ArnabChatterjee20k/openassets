import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { IsoBox, IsoWindow, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Shot Day Shelf',
  description:
    'Landing-page hero for Satiate: an isometric bathroom corner on shot-day morning. A phone on its stand shows the weekly dose dial beside the injection pen on a tray, a glass of water with rising bubbles, a 7-day organiser, a plant and a scale. Sunlight shimmers, the clock ticks, then the phone pings "dose logged".',
  tags: ['hero', 'isometric', 'landing page', 'health', 'animated svg', 'still life'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  notice: text('Notification').default('dose logged · 2.5 mg'),
  note: text('Sticky note').default('thu 8am'),
  backdrop: color('Backdrop').default('#DADDE3'),
  wallLeft: color('Window wall').default('#C3C8D1'),
  wallRight: color('Back wall').default('#E4E7EE'),
  floor: color('Floor').default('#B8C0CC'),
  cabinet: color('Cabinet').default('#F4F5F8'),
  sky: color('Window sky').default('#BFD3FF'),
  sun: color('Sunlight').default('#FFFFFF'),
  accent: color('Accent').default('#3D5AFE'),
  pop: color('Pop').default('#FF3DB4'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { backdrop: '#FFE3D3', wallLeft: '#F2C6B4', wallRight: '#FFE4D6', floor: '#D9A994', sky: '#FF9A62', sun: '#FFD7A8', accent: '#7B2CBF', pop: '#FF4F6D' },
  night: { backdrop: '#17182A', wallLeft: '#2A2C44', wallRight: '#363955', floor: '#22243A', cabinet: '#C9CCDA', sky: '#0E1030', sun: '#7C8CFF', notice: 'dose logged · sleep well' },
  lilac: { backdrop: '#E9E3F5', wallLeft: '#D6CCEC', wallRight: '#EFEAF8', floor: '#C7BCE3', sky: '#F49CBB', accent: '#5E4AE3', pop: '#2EC4B6' },
  mint: { backdrop: '#E0F2EC', wallLeft: '#BFDDD3', wallRight: '#E8F5F0', floor: '#A9CFC3', sky: '#BFEFFF', accent: '#1F8A70', pop: '#FF7A00' },
};

type P = z.infer<typeof schema>;

const U = 49;
const LOOP = scene.loop;
const OX = 515;
const OY = 372;
const WH = 7.4; // wall height
const INK = 'rgba(16,18,25,0.55)';
const C30 = Math.cos(Math.PI / 6);
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const ink = { stroke: INK, strokeWidth: 1.2 };
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;

/** Transform for drawing flat 2D content (px, U per world unit) on a wall facing +y (plane y = const). `a` runs along x, local y runs down from z. */
const leftFace = (a: number, plane: number, z: number) => {
  const [x, y] = S([a, plane, z]);
  return `matrix(${C30} 0.5 0 1 ${x} ${y})`;
};

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
};
const arcD = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  return `M${x0.toFixed(2)},${y0.toFixed(2)} A${r},${r} 0 0 1 ${x1.toFixed(2)},${y1.toFixed(2)}`;
};

/** Soft contact shadow under an object, toward +x (light comes through the window on the left wall). */
function Shadow({ x, y, w, d, z = 0, k = 0.3 }: { x: number; y: number; w: number; d: number; z?: number; k?: number }) {
  return <polygon points={poly([[x, y, z + 0.01], [x + w + 0.5, y, z + 0.01], [x + w + 0.7, y + d, z + 0.01], [x + 0.2, y + d, z + 0.01]])} fill="#101219" opacity={k} filter="url(#sh-blur)" />;
}

/** Vertical cylinder outline in screen space. */
function Cyl({ x, y, z, r, h, fill, top, children }: { x: number; y: number; z: number; r: number; h: number; fill: string; top?: string; children?: ReactNode }) {
  const [cx, cb] = S([x, y, z]);
  const ct = S([x, y, z + h])[1];
  const rx = r * U * 1.2247;
  const ry = r * U * 0.7071;
  return (
    <g>
      <path d={`M${cx - rx},${ct} L${cx - rx},${cb} A${rx},${ry} 0 0 0 ${cx + rx},${cb} L${cx + rx},${ct} Z`} fill={fill} {...ink} />
      {children}
      {top && <ellipse cx={cx} cy={ct} rx={rx} ry={ry} fill={top} {...ink} />}
    </g>
  );
}

function Sparkle({ x, y, s, c, begin }: { x: number; y: number; s: number; c: string; begin: string }) {
  return (
    <path d={`M${x},${y - s} Q${x},${y} ${x + s},${y} Q${x},${y} ${x},${y + s} Q${x},${y} ${x - s},${y} Q${x},${y} ${x},${y - s} Z`} fill={c} opacity="0">
      <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={`0;${begin};0.62;0.75;1`} dur={`${LOOP}s`} repeatCount="indefinite" />
    </path>
  );
}

export default function ShotDayShelf(p: P) {
  const night = parseInt(p.wallRight.slice(1, 3), 16) < 0x70;
  const lineInk = night ? '#E8EAF5' : '#101219';
  const C = { top: 3.5, cx0: 1.8, cx1: 11.2, cy1: 3.3 }; // counter top surface

  // Phone screen: 1.56 × 3.1 world units on the plane y = 1.25.
  const PW = 1.56 * U;
  const PH = 3.1 * U;
  const dcx = PW / 2;
  const dcy = PH * 0.46;
  const dr = PW * 0.36;
  const seg = 360 / 7;
  const rot = 50 - 3.5 * seg;

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <radialGradient id="sh-bg" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0" stopColor={shade(p.backdrop, night ? 0.08 : 0.5)} />
          <stop offset="1" stopColor={p.backdrop} />
        </radialGradient>
        <linearGradient id="sh-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.sky, -0.1)} />
          <stop offset="1" stopColor={shade(p.sky, 0.5)} />
        </linearGradient>
        <linearGradient id="sh-mirror" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="0.45" stopColor={shade(p.wallRight, -0.12)} />
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="1" stopColor={shade(p.wallRight, -0.2)} />
        </linearGradient>
        <linearGradient id="sh-chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.4" stopColor="#B8C0CC" />
          <stop offset="0.6" stopColor="#F4F6FA" />
          <stop offset="1" stopColor="#8C95A6" />
        </linearGradient>
        <linearGradient id="sh-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DCE1EA" />
        </linearGradient>
        <linearGradient id="sh-beam" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={p.sun} stopOpacity="0.75" />
          <stop offset="1" stopColor={p.sun} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sh-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.accent, 0.55)} stopOpacity="0.85" />
          <stop offset="1" stopColor={shade(p.accent, 0.2)} stopOpacity="0.9" />
        </linearGradient>
        <filter id="sh-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="sh-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id="sh-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Backdrop ── */}
      <rect width="1200" height="900" fill="url(#sh-bg)" />
      <g fill={night ? '#ffffff' : p.accent} opacity={night ? 0.6 : 0.25}>
        {Array.from({ length: 26 }, (_, i) => (
          <circle key={i} cx={rand(i * 3.7) * 1200} cy={rand(i * 9.1) * 900} r={1 + rand(i * 2.3) * 2}>
            <animate attributeName="opacity" values="0.2;1;0.2" dur={`${[2, 3, 6][i % 3]}s`} begin={`-${(rand(i) * 3).toFixed(2)}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </g>
      <ellipse cx="610" cy="842" rx="420" ry="40" fill="#101219" opacity={night ? 0.5 : 0.16} filter="url(#sh-soft)" />

      {/* ── Room (floats very gently) ── */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -5;0 0" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
        <g transform={`translate(${OX} ${OY})`}>
          {/* Floor slab */}
          <IsoBox x={0} y={0} z={-0.5} w={12} d={8} h={0.5} color={shade(p.floor, -0.1)} u={U} top={false} ink={ink} />
          <polygon points={poly([[0, 0, 0], [12, 0, 0], [12, 8, 0], [0, 8, 0]])} fill={p.floor} {...ink} />
          <g stroke={shade(p.floor, -0.18)} strokeWidth="1" opacity="0.7">
            {Array.from({ length: 11 }, (_, i) => (
              <polyline key={`fx${i}`} points={poly([[i + 1, 0, 0.01], [i + 1, 8, 0.01]])} fill="none" />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <polyline key={`fy${i}`} points={poly([[0, i + 1, 0.01], [12, i + 1, 0.01]])} fill="none" />
            ))}
          </g>

          {/* Walls with thickness */}
          <polygon points={poly([[0, 0, 0], [0, 8, 0], [0, 8, WH], [0, 0, WH]])} fill={p.wallLeft} {...ink} />
          <polygon points={poly([[-0.4, -0.4, WH], [0, -0.4, WH], [0, 8, WH], [-0.4, 8, WH]])} fill={shade(p.wallLeft, 0.3)} {...ink} />
          <polygon points={poly([[-0.4, 8, -0.5], [0, 8, -0.5], [0, 8, WH], [-0.4, 8, WH]])} fill={shade(p.wallLeft, -0.25)} {...ink} />
          <polygon points={poly([[0, 0, 0], [12, 0, 0], [12, 0, WH], [0, 0, WH]])} fill={p.wallRight} {...ink} />
          <polygon points={poly([[0, -0.4, WH], [12, -0.4, WH], [12, 0, WH], [0, 0, WH]])} fill={shade(p.wallRight, 0.35)} {...ink} />
          <polygon points={poly([[12, -0.4, -0.5], [12, 0, -0.5], [12, 0, WH], [12, -0.4, WH]])} fill={shade(p.wallRight, -0.2)} {...ink} />
          {/* tiled splashback behind the counter */}
          <polygon points={poly([[1.8, 0.01, 3.5], [11.2, 0.01, 3.5], [11.2, 0.01, 4.4], [1.8, 0.01, 4.4]])} fill={shade(p.wallRight, 0.4)} {...ink} />
          <g stroke={shade(p.wallRight, -0.12)} strokeWidth="1">
            {Array.from({ length: 18 }, (_, i) => (
              <polyline key={i} points={poly([[2.3 + i * 0.5, 0.02, 3.5], [2.3 + i * 0.5, 0.02, 4.4]])} fill="none" />
            ))}
            <polyline points={poly([[1.8, 0.02, 3.95], [11.2, 0.02, 3.95]])} fill="none" />
          </g>

          {/* Window on the left wall + morning light */}
          <IsoWindow face="right" plane={0.01} a={2.2} z={4.2} w={3.4} h={2.9} fill={shade(p.wallLeft, -0.35)} u={U} ink={ink} />
          <IsoWindow face="right" plane={0.02} a={2.35} z={4.35} w={3.1} h={2.6} fill="url(#sh-sky)" u={U} ink={ink} />
          {/* a cloud drifting past outside */}
          <g opacity="0.8">
            <animateTransform attributeName="transform" type="translate" values="40 20;-60 -30" dur={`${LOOP}s`} repeatCount="indefinite" />
            <ellipse cx={S([0, 3.6, 6.4])[0]} cy={S([0, 3.6, 6.4])[1]} rx="16" ry="8" fill="#ffffff" />
          </g>
          <polyline points={poly([[0.03, 3.9, 4.35], [0.03, 3.9, 6.95]])} stroke={shade(p.wallLeft, -0.35)} strokeWidth="3" fill="none" />
          <polyline points={poly([[0.03, 2.35, 5.7], [0.03, 5.45, 5.7]])} stroke={shade(p.wallLeft, -0.35)} strokeWidth="3" fill="none" />
          <IsoBox x={0} y={2.1} z={4.05} w={0.35} d={3.6} h={0.15} color={shade(p.wallLeft, 0.3)} u={U} ink={ink} />
          {/* light beam from the window to the floor */}
          <polygon points={poly([[0.05, 2.35, 6.95], [0.05, 5.45, 6.95], [5.2, 7.4, 0.02], [5.2, 4.2, 0.02]])} fill="url(#sh-beam)" style={{ mixBlendMode: night ? 'screen' : 'soft-light' }} opacity="0.6">
            <animate attributeName="opacity" values="0.45;0.7;0.45" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
          </polygon>
          <polygon points={poly([[2.4, 3.6, 0.02], [5.4, 3.9, 0.02], [5.6, 7.4, 0.02], [2.6, 7.2, 0.02]])} fill={p.sun} opacity="0.35" filter="url(#sh-blur)">
            <animate attributeName="opacity" values="0.25;0.42;0.25" dur="3s" repeatCount="indefinite" {...spline} />
          </polygon>
          {/* dust motes in the beam */}
          {Array.from({ length: 10 }, (_, i) => {
            const [bx, by] = S([1 + rand(i * 2.1) * 3, 3.5 + rand(i * 4.3) * 2.5, 1.5 + rand(i * 7.7) * 4]);
            return (
              <circle key={i} cx={bx} cy={by} r={1.2 + rand(i) * 1.4} fill={night ? '#ffffff' : '#FFF8E8'}>
                <animate attributeName="cy" values={`${by};${by - 26};${by}`} dur="3s" begin={`-${(rand(i * 3) * 3).toFixed(2)}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" dur="3s" begin={`-${(rand(i * 3) * 3).toFixed(2)}s`} repeatCount="indefinite" />
              </circle>
            );
          })}

          {/* Mirror cabinet with chrome frame + sticky note */}
          <IsoWindow face="left" plane={0.03} a={4.9} z={4.75} w={4} h={2.35} fill="url(#sh-chrome)" u={U} ink={ink} />
          <IsoWindow face="left" plane={0.05} a={5.05} z={4.9} w={3.7} h={2.05} fill="url(#sh-mirror)" u={U} ink={ink} />
          <polygon points={poly([[5.6, 0.06, 5.0], [6.1, 0.06, 5.0], [7.2, 0.06, 6.9], [6.7, 0.06, 6.9]])} fill="#ffffff" opacity="0.55" />
          <g transform={leftFace(7.7, 0.07, 6.85)}>
            <g transform="rotate(4)">
              <rect x="0" y="0" width={1.15 * U} height={0.95 * U} fill="#FFE27A" stroke={INK} strokeWidth="1" />
              <rect x="0" y="0" width={1.15 * U} height="7" fill="#F5C94C" />
              <text x={0.575 * U} y={0.6 * U} textAnchor="middle" fontFamily={FONTS.majormono} fontSize="11" fill="#101219">
                {p.note}
              </text>
              <circle cx={0.575 * U} cy={0.8 * U} r="3" fill={p.pop} />
            </g>
          </g>

          {/* Wall clock, second hand ticking */}
          <g transform={leftFace(10.2, 0.04, 7.0)}>
            <circle cx={0.6 * U} cy={0.6 * U} r={0.62 * U} fill="url(#sh-chrome)" stroke={INK} strokeWidth="1.2" />
            <circle cx={0.6 * U} cy={0.6 * U} r={0.5 * U} fill="#FAFBFD" stroke={INK} strokeWidth="1" />
            {Array.from({ length: 12 }, (_, i) => {
              const [x0, y0] = polar(0.6 * U, 0.6 * U, 0.44 * U, i * 30);
              const [x1, y1] = polar(0.6 * U, 0.6 * U, 0.38 * U, i * 30);
              return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#101219" strokeWidth={i % 3 ? 1 : 2} />;
            })}
            <line x1={0.6 * U} y1={0.6 * U} x2={0.6 * U + 9} y2={0.6 * U - 10} stroke="#101219" strokeWidth="3" strokeLinecap="round" />
            <line x1={0.6 * U} y1={0.6 * U} x2={0.6 * U} y2={0.6 * U - 17} stroke="#101219" strokeWidth="2" strokeLinecap="round" />
            <g transform={`translate(${0.6 * U} ${0.6 * U})`}>
              <g>
                <animateTransform attributeName="transform" type="rotate" values={Array.from({ length: 13 }, (_, i) => i * 30).join(';')} keyTimes={Array.from({ length: 13 }, (_, i) => (i / 12).toFixed(4)).join(';')} dur={`${LOOP}s`} calcMode="discrete" repeatCount="indefinite" />
                <line x1="0" y1="4" x2="0" y2={-0.44 * U} stroke={p.pop} strokeWidth="1.5" />
              </g>
              <circle r="2.5" fill={p.pop} />
            </g>
          </g>

          {/* ── Cabinet + counter ── */}
          <Shadow x={2} y={3} w={9} d={1.2} k={0.22} />
          <IsoBox x={2} y={0} w={9} d={3} h={3.2} color={p.cabinet} u={U} ink={ink} />
          {/* doors: three panels on the front face, chrome bar handles */}
          {[2.15, 5.15, 8.15].map((a, i) => (
            <g key={a}>
              <IsoWindow face="left" plane={3.01} a={a} z={0.25} w={2.7} h={2.75} fill={shade(p.cabinet, -0.06)} u={U} ink={{ stroke: shade(p.cabinet, -0.35), strokeWidth: 1 }} />
              <polyline points={poly(i === 1 ? [[a + 0.6, 3.04, 2.6], [a + 2.1, 3.04, 2.6]] : [[a + (i ? 0.25 : 2.45), 3.04, 1.2], [a + (i ? 0.25 : 2.45), 3.04, 2.3]])} stroke="url(#sh-chrome)" strokeWidth="5" strokeLinecap="round" fill="none" />
            </g>
          ))}
          <IsoBox x={1.8} y={0} z={3.2} w={9.4} d={3.3} h={0.3} color="#FFFFFF" u={U} ink={ink} />
          <polyline points={poly([[1.8, 3.3, 3.22], [11.2, 3.3, 3.22], [11.2, 0, 3.22]])} stroke={p.accent} strokeWidth="2.5" fill="none" opacity="0.7" />

          {/* ── Phone on its stand (back left) ── */}
          <Shadow x={2.6} y={1.0} w={1.8} d={0.8} z={C.top} k={0.25} />
          <IsoBox x={2.9} y={1.2} z={C.top} w={1.2} d={0.6} h={0.25} color="#B8C0CC" u={U} ink={ink} />
          <IsoBox x={2.6} y={1.0} z={C.top + 0.2} w={1.8} d={0.22} h={3.4} color="#1B1D26" u={U} ink={ink} />
          <g transform={leftFace(2.72, 1.23, C.top + 3.48)}>
            <rect x="0" y="0" width={PW} height={PH} rx="7" fill="url(#sh-screen)" />
            {/* flash when the dose is logged */}
            <rect x="0" y="0" width={PW} height={PH} rx="7" fill={p.accent} opacity="0">
              <animate attributeName="opacity" values="0;0;0.35;0;0" keyTimes="0;0.55;0.57;0.66;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            </rect>
            <text x={PW / 2} y="14" textAnchor="middle" fontFamily={FONTS.majormono} fontSize="7.5" fill="#101219" opacity="0.7">
              satiate · thu
            </text>
            {/* dose dial */}
            <circle cx={dcx} cy={dcy} r={dr + 5} fill="url(#sh-chrome)" />
            <circle cx={dcx} cy={dcy} r={dr} fill="#F5F6FA" />
            {Array.from({ length: 7 }, (_, i) => (
              <path key={i} d={arcD(dcx, dcy, dr * 0.78, rot + i * seg + 4, rot + (i + 1) * seg - 4)} fill="none" strokeLinecap="round" strokeWidth="4" stroke={i < 3 ? '#9AA2B1' : i === 3 ? shade(p.accent, 0.6) : '#E1E4EA'} />
            ))}
            <path d={arcD(dcx, dcy, dr * 0.78, rot + 3 * seg + 4, rot + 4 * seg - 4)} fill="none" strokeLinecap="round" strokeWidth="5" stroke={p.accent} opacity="0">
              <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.55;0.58;0.95;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            </path>
            <rect x={dcx - 14} y={dcy - 6} width="28" height="12" rx="6" fill={p.accent}>
              <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
            </rect>
            <text x={dcx} y={dcy + 3} textAnchor="middle" fontFamily={FONTS.syne} fontWeight="800" fontSize="7" fill="#ffffff">
              2.5
            </text>
            {/* habit rows */}
            {[0, 1].map((r) => (
              <g key={r}>
                <rect x="8" y={PH * 0.74 + r * 14} width={PW - 16} height="10" rx="5" fill="#E6E9F0" />
                <rect x="8" y={PH * 0.74 + r * 14} width={(PW - 16) * (r ? 0.5 : 0.72)} height="10" rx="5" fill={r ? p.pop : p.accent} opacity="0.85" />
              </g>
            ))}
            {/* the moment: notification drops in */}
            <g opacity="0">
              <animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.55;0.58;0.88;0.93;1" dur={`${LOOP}s`} repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values="0 -14;0 -14;0 2;0 0;0 0" keyTimes="0;0.55;0.6;0.63;1" dur={`${LOOP}s`} repeatCount="indefinite" />
              <rect x="4" y="22" width={PW - 8} height="18" rx="9" fill="#101219" />
              <circle cx="14" cy="31" r="5" fill={p.pop} />
              <path d="M11.5,31 L13.5,33 L16.8,29" stroke="#ffffff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              <text x="23" y="33.5" fontFamily={FONTS.bricolage} fontWeight="700" fontSize="6.6" fill="#ffffff">
                {p.notice}
              </text>
            </g>
          </g>
          {/* sparkles around the phone at the moment */}
          {(() => {
            const [px, py] = S([3.5, 1.1, C.top + 3.8]);
            return (
              <g filter="url(#sh-glow)">
                <Sparkle x={px - 54} y={py - 6} s={10} c={p.pop} begin="0.56" />
                <Sparkle x={px + 58} y={py - 30} s={13} c={p.accent} begin="0.57" />
                <Sparkle x={px + 40} y={py + 40} s={7} c={p.pop} begin="0.58" />
                <Sparkle x={px - 30} y={py - 48} s={8} c={p.accent} begin="0.59" />
              </g>
            );
          })()}

          {/* ── Glass of water with bubbles ── */}
          <Shadow x={6.0} y={0.8} w={0.9} d={0.9} z={C.top} k={0.2} />
          {(() => {
            const gx = 6.5;
            const gy = 1.3;
            const [cx, cb] = S([gx, gy, C.top]);
            const cw = S([gx, gy, C.top + 1.0])[1];
            const ctop = S([gx, gy, C.top + 1.5])[1];
            const rx = 0.48 * U * 1.2247;
            const ry = 0.48 * U * 0.7071;
            return (
              <g>
                <path d={`M${cx - rx},${cw} L${cx - rx * 0.9},${cb} A${rx * 0.9},${ry * 0.9} 0 0 0 ${cx + rx * 0.9},${cb} L${cx + rx},${cw} Z`} fill="url(#sh-water)" />
                <ellipse cx={cx} cy={cw} rx={rx} ry={ry} fill={shade(p.accent, 0.7)} opacity="0.9" />
                {Array.from({ length: 5 }, (_, i) => {
                  const bx = cx - rx * 0.6 + rand(i * 5.5) * rx * 1.2;
                  return (
                    <circle key={i} cx={bx} cy={cb - 4} r={1.6 + rand(i) * 1.6} fill="#ffffff" opacity="0.9">
                      <animate attributeName="cy" values={`${cb - 4};${cw + 3}`} dur="2s" begin={`-${(i * 0.4).toFixed(1)}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0;0.9;0" dur="2s" begin={`-${(i * 0.4).toFixed(1)}s`} repeatCount="indefinite" />
                    </circle>
                  );
                })}
                <path d={`M${cx - rx},${ctop} L${cx - rx * 0.9},${cb} A${rx * 0.9},${ry * 0.9} 0 0 0 ${cx + rx * 0.9},${cb} L${cx + rx},${ctop}`} fill="#ffffff" fillOpacity="0.18" stroke={INK} strokeWidth="1.2" />
                <ellipse cx={cx} cy={ctop} rx={rx} ry={ry} fill="#ffffff" fillOpacity="0.25" stroke={INK} strokeWidth="1.2" />
                <line x1={cx - rx * 0.6} y1={ctop + 6} x2={cx - rx * 0.55} y2={cb - 6} stroke="#ffffff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                {/* straw */}
                <line x1={cx + 4} y1={cb - 8} x2={cx + 16} y2={ctop - 22} stroke={p.pop} strokeWidth="4" strokeLinecap="round" />
              </g>
            );
          })()}

          {/* ── Protein jar ── */}
          <Shadow x={8.3} y={0.7} w={0.8} d={0.8} z={C.top} k={0.2} />
          <Cyl x={8.7} y={1.1} z={C.top} r={0.45} h={1.1} fill={shade(p.cabinet, -0.04)}>
            {(() => {
              const [cx, cy] = S([8.7, 1.1, C.top + 0.55]);
              return <rect x={cx - 0.45 * U * 1.2247} y={cy - 9} width={0.9 * U * 1.2247} height="16" fill={p.pop} opacity="0.9" />;
            })()}
          </Cyl>
          <Cyl x={8.7} y={1.1} z={C.top + 1.1} r={0.47} h={0.25} fill={p.accent} top={shade(p.accent, 0.25)} />

          {/* ── Plant ── */}
          <Shadow x={10} y={0.6} w={0.9} d={0.9} z={C.top} k={0.2} />
          <Cyl x={10.4} y={1.0} z={C.top} r={0.45} h={0.75} fill="#FFFFFF" top={shade('#6B4E3D', 0)} />
          {(() => {
            const [bx, by] = S([10.4, 1.0, C.top + 0.75]);
            const leaves = [-38, -14, 8, 30, 52];
            return (
              <g transform={`translate(${bx} ${by})`}>
                <g>
                  <animateTransform attributeName="transform" type="rotate" values="-3;3;-3" dur="3s" repeatCount="indefinite" {...spline} />
                  {leaves.map((a, i) => (
                    <path key={a} transform={`rotate(${a})`} d={`M0,0 C-9,-${20 + i * 3} -5,-${46 + (i % 2) * 14} 0,-${56 + (i % 2) * 14} C6,-${44 + (i % 2) * 14} 9,-${22 + i * 2} 0,0 Z`} fill={i % 2 ? '#3FA77A' : '#2F8C66'} stroke={INK} strokeWidth="1" />
                  ))}
                </g>
              </g>
            );
          })()}

          {/* ── Tray with the dose pen (front) ── */}
          <Shadow x={4.4} y={2.0} w={3.6} d={1.1} z={C.top} k={0.22} />
          <IsoBox x={4.4} y={2.0} z={C.top} w={3.6} d={1.1} h={0.12} color="#C3C8D1" u={U} ink={ink} />
          {/* pen lying along x: cap · barrel · window · dial · button */}
          <IsoBox x={4.6} y={2.35} z={C.top + 0.12} w={0.7} d={0.42} h={0.42} color={p.pop} u={U} ink={ink} />
          <IsoBox x={5.3} y={2.35} z={C.top + 0.12} w={1.85} d={0.42} h={0.42} color="#F4F5F8" u={U} ink={ink} />
          <IsoWindow face="left" plane={2.78} a={5.75} z={C.top + 0.2} w={0.7} h={0.26} fill={p.accent} u={U} ink={ink}>
            <animate attributeName="opacity" values="0.75;1;0.75" dur="1.5s" repeatCount="indefinite" />
          </IsoWindow>
          <IsoBox x={7.15} y={2.32} z={C.top + 0.1} w={0.45} d={0.48} h={0.48} color="#B8C0CC" u={U} ink={ink} />
          {[7.25, 7.37, 7.49].map((a) => (
            <polyline key={a} points={poly([[a, 2.81, C.top + 0.14], [a, 2.81, C.top + 0.54]])} stroke={INK} strokeWidth="1" fill="none" />
          ))}
          <IsoBox x={7.6} y={2.42} z={C.top + 0.18} w={0.18} d={0.3} h={0.3} color={p.pop} u={U} ink={ink} />

          {/* ── 7-day organiser (front right): Thursday open ── */}
          <Shadow x={8.5} y={2.3} w={2.4} d={0.6} z={C.top} k={0.2} />
          {Array.from({ length: 7 }, (_, i) => {
            const x = 8.5 + i * 0.34;
            const isShot = i === 3;
            return (
              <g key={i}>
                <IsoBox x={x} y={2.3} z={C.top} w={0.32} d={0.6} h={0.32} color="#F4F5F8" u={U} ink={ink} />
                {isShot ? (
                  <polygon points={poly([[x, 2.3, C.top + 0.32], [x + 0.32, 2.3, C.top + 0.32], [x + 0.32, 2.3, C.top + 0.9], [x, 2.3, C.top + 0.9]])} fill={p.accent} {...ink} />
                ) : (
                  <IsoBox x={x} y={2.3} z={C.top + 0.32} w={0.32} d={0.6} h={0.06} color={i < 3 ? '#9AA2B1' : '#DCE1EA'} u={U} ink={ink} />
                )}
              </g>
            );
          })}

          {/* ── Floor: bath mat + scale ── */}
          <polygon points={poly([[3.4, 4.6, 0.02], [7.2, 4.6, 0.02], [7.2, 7.2, 0.02], [3.4, 7.2, 0.02]])} fill={shade(p.pop, 0.55)} {...ink} />
          {[5.0, 5.6, 6.2, 6.8].map((y) => (
            <polyline key={y} points={poly([[3.5, y, 0.03], [7.1, y, 0.03]])} stroke={shade(p.pop, 0.3)} strokeWidth="2" fill="none" />
          ))}
          <Shadow x={8.2} y={4.8} w={2.2} d={2.2} k={0.25} />
          <IsoBox x={8.2} y={4.8} w={2.2} d={2.2} h={0.28} color="#F6F7FA" u={U} ink={ink} />
          <polygon points={poly([[8.5, 5.1, 0.29], [9.15, 5.1, 0.29], [9.15, 6.3, 0.29], [8.5, 6.3, 0.29]])} fill="#D7DCE5" {...ink} />
          <polygon points={poly([[9.45, 5.1, 0.29], [10.1, 5.1, 0.29], [10.1, 6.3, 0.29], [9.45, 6.3, 0.29]])} fill="#D7DCE5" {...ink} />
          <polygon points={poly([[8.9, 6.45, 0.29], [9.7, 6.45, 0.29], [9.7, 6.85, 0.29], [8.9, 6.85, 0.29]])} fill={p.accent} {...ink}>
            <animate attributeName="opacity" values="1;1;0.4;1;1" keyTimes="0;0.3;0.33;0.36;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          </polygon>

          {/* towel hanging on the left wall */}
          <polygon points={poly([[0.05, 6.0, 5.0], [0.05, 7.4, 5.0], [0.05, 7.4, 2.4], [0.05, 6.0, 2.6]])} fill={shade(p.accent, 0.6)} {...ink} />
          <polyline points={poly([[0.06, 6.0, 3.0], [0.06, 7.4, 2.8]])} stroke={p.accent} strokeWidth="3" fill="none" />
          <polyline points={poly([[0.05, 5.8, 5.05], [0.05, 7.6, 5.05]])} stroke="url(#sh-chrome)" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
      </g>
      {/* sign-off label */}
      <text x="70" y="840" fontFamily={FONTS.majormono} fontSize="18" letterSpacing="3" fill={lineInk} opacity="0.55">
        shot day · thursday
      </text>
    </svg>
  );
}
