import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Night Press',
  description:
    'Landing-page hero for an AI ad agent: an isometric blacklit print shop where a four-arm carousel press indexes sheets under a squeegee, prints roll through a glowing dryer, and finished posters for every platform hang on the drying line. Loops seamlessly.',
  tags: ['hero', 'isometric', 'landing page', 'process', 'print', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Wall sign').default('INKRUN PRINT CO.'),
  note: text('Handwritten note').default('31 runs nightly'),
  platforms: text('Poster labels (comma separated)').default('TikTok, Meta, YouTube, LinkedIn, Snap, Reddit'),
  wall: color('Walls').default('#2A0A47'),
  floor: color('Floor').default('#1A0530'),
  machine: color('Press body').default('#E9DDF5'),
  paper: color('Paper').default('#FBEFFF'),
  ink1: color('Ink 1').default('#B026FF'),
  ink2: color('Ink 2').default('#FF2E88'),
  pop: color('Highlighter').default('#FFD600'),
  sky: color('Window sky').default('#0B0420'),
  blacklight: toggle('Blacklight on').default(true),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { wall: '#45293F', floor: '#2B1B2E', sky: '#FF8E5E', ink1: '#E5487A', ink2: '#FF8E5E', pop: '#FFD27F', paper: '#FFE9D6' },
  daylight: { wall: '#EDE4F5', floor: '#CFC3DD', sky: '#9FD4F5', machine: '#FFFFFF', blacklight: false },
  risograph: { wall: '#EAE2D3', floor: '#D8CDB8', sky: '#BFE3F7', machine: '#F4EFE6', paper: '#FFFFFF', ink1: '#0078BF', ink2: '#FF48B0', pop: '#FFE800', blacklight: false },
  lava: { wall: '#2E120B', floor: '#1A0A06', sky: '#3A0E06', ink1: '#FF4D00', ink2: '#FFB000', pop: '#FF2E63', paper: '#FFEDE0' },
};

type P = z.infer<typeof schema>;

const U = 44;
const LOOP = scene.loop;
const OX = 560;
const OY = 235;
const C30 = Math.cos(Math.PI / 6);
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const INK = 'rgba(10,2,22,0.6)';
const spline = (n: number) => Array.from({ length: n }, () => '0.45 0 0.55 1').join(';');

/** 2D group laid in the wall plane y = `y` (x runs along the wall, local y runs down from height z). */
const onBackWall = (x: number, y: number, z: number) => {
  const [a, b] = S([x, y, z]);
  return `translate(${a} ${b}) matrix(${C30} 0.5 0 1 0 0)`;
};
/** 2D group laid in the wall plane x = `x` (local x runs along +y world). */
const onSideWall = (x: number, y: number, z: number) => {
  const [a, b] = S([x, y, z]);
  return `translate(${a} ${b}) matrix(${-C30} 0.5 0 1 0 0)`;
};

/** A little gig poster in 2D (w × h px), stage 0..3 of printing. */
function Print({ w, h, p, stage = 3, label }: { w: number; h: number; p: P; stage?: number; label?: string }) {
  return (
    <g>
      <rect width={w} height={h} rx={2} fill={p.paper} stroke={INK} strokeWidth={1} />
      {stage >= 1 && <circle cx={w * 0.5} cy={h * 0.42} r={Math.min(w, h) * 0.3} fill={p.ink1} />}
      {stage >= 2 && <circle cx={w * 0.5 + 3} cy={h * 0.42 + 2} r={Math.min(w, h) * 0.3} fill={p.ink2} style={{ mixBlendMode: 'multiply' }} />}
      {stage >= 3 && (
        <>
          <rect x={w * 0.14} y={h * 0.76} width={w * 0.72} height={Math.max(2, h * 0.06)} fill={shade(p.ink1, -0.5)} />
          <circle cx={w * 0.82} cy={h * 0.14} r={Math.max(2, w * 0.07)} fill={p.pop} />
        </>
      )}
      {label && (
        <text x={w / 2} y={h * 0.95} textAnchor="middle" fontFamily={FONTS.outfit} fontWeight={800} fontSize={Math.max(6, w * 0.16)} fill={shade(p.ink1, -0.55)}>
          {label}
        </text>
      )}
    </g>
  );
}

function Dust() {
  const out: ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const x = 150 + rand(i * 3.7) * 900;
    const y = 250 + rand(i * 9.1) * 520;
    const dur = [3, 6][i % 2];
    out.push(
      <circle key={i} cx={x} cy={y} r={0.8 + rand(i * 1.7) * 1.8} fill="#ffffff">
        <animate attributeName="cy" values={`${y};${y - 60}`} dur={`${dur}s`} begin={`-${(rand(i * 4.3) * dur).toFixed(2)}s`} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0;0.6;0" dur={`${dur}s`} begin={`-${(rand(i * 4.3) * dur).toFixed(2)}s`} repeatCount="indefinite" />
      </circle>,
    );
  }
  return <g>{out}</g>;
}

export default function NightPress(p: P) {
  const dark = p.blacklight;
  const labels = p.platforms.split(',').map((s) => s.trim());
  // Carousel geometry (world units)
  const C: P3 = [8, 7, 0];
  const R = 2.6;
  const PZ = 2.0; // platen height
  const hub = S([C[0], C[1], PZ]);
  const front: P3 = [C[0] + R / Math.SQRT2, C[1] + R / Math.SQRT2, PZ];
  const [fx, fy] = S(front);
  const headZ = 2.75;
  const [hx, hy] = S([front[0], front[1], headZ]);
  // Radial (r) and tangent (t) directions of the front station, for the screen frame.
  const rr = 1 / Math.SQRT2;
  const frameAt = (a: number, b: number, z: number): P3 => [front[0] + rr * a + rr * b, front[1] + rr * a - rr * b, z];
  const pullA = 0.75 * rr * U; // screen-space half-travel of the squeegee (radial dir is straight down)

  const stackAt: P3 = [13.7, 12.3, 0];
  const [tagX, tagY] = S([14.4, 12.85, 1.6]);
  const flashKT = '0;0.72;0.75;0.8;1';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="np-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.floor, -0.35)} />
          <stop offset="1" stopColor={shade(p.floor, -0.1)} />
        </linearGradient>
        <radialGradient id="np-uv" cx="0.5" cy="0.3" r="0.7">
          <stop offset="0" stopColor={p.ink1} stopOpacity={dark ? 0.35 : 0.08} />
          <stop offset="1" stopColor={p.ink1} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="np-pool">
          <stop offset="0" stopColor={p.ink2} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.ink2} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="np-pop">
          <stop offset="0" stopColor={p.pop} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.pop} stopOpacity="0" />
        </radialGradient>
        <filter id="np-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="np-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      <rect width="1200" height="900" fill="url(#np-bg)" />
      <rect width="1200" height="900" fill="url(#np-uv)" />

      <g transform={`translate(${OX} ${OY})`}>
        {/* ── Room: two back walls + floor ── */}
        <polygon points={poly([[0, 0, 0], [0, 14, 0], [0, 14, 7], [0, 0, 7]])} fill={shade(p.wall, -0.18)} stroke={INK} strokeWidth="1.2" />
        <polygon points={poly([[0, 0, 0], [16, 0, 0], [16, 0, 7], [0, 0, 7]])} fill={p.wall} stroke={INK} strokeWidth="1.2" />
        {/* wainscot band */}
        <polygon points={poly([[0, 0, 0], [16, 0, 0], [16, 0, 1.4], [0, 0, 1.4]])} fill={shade(p.wall, -0.25)} />
        <polygon points={poly([[0, 0, 0], [0, 14, 0], [0, 14, 1.4], [0, 0, 1.4]])} fill={shade(p.wall, -0.38)} />
        <polygon points={poly([[0, 0, 0], [16, 0, 0], [16, 14, 0], [0, 14, 0]])} fill={p.floor} stroke={INK} strokeWidth="1.2" />
        <g stroke={shade(p.floor, 0.12)} strokeWidth="1" opacity="0.6">
          {Array.from({ length: 8 }, (_, i) => (
            <polyline key={`a${i}`} points={poly([[i * 2, 0, 0], [i * 2, 14, 0]])} fill="none" />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <polyline key={`b${i}`} points={poly([[0, i * 2, 0], [16, i * 2, 0]])} fill="none" />
          ))}
        </g>
        {/* ink splats on the floor */}
        {[
          [5.2, 11.6, p.ink2, 0.5],
          [11.2, 6.8, p.ink1, 0.4],
          [3.4, 6.2, p.ink1, 0.3],
          [12.6, 9.2, p.ink2, 0.28],
        ].map(([x, y, c, r], i) => {
          const [ex, ey] = S([x as number, y as number, 0]);
          return <ellipse key={i} cx={ex} cy={ey} rx={(r as number) * U * 1.2} ry={(r as number) * U * 0.7} fill={c as string} opacity="0.55" />;
        })}

        {/* ── Left wall: night window + pegboard ── */}
        <g transform={onSideWall(0, 2, 5.4)}>
          <rect x={-6} y={-6} width={4 * U + 12} height={2.8 * U + 12} rx={3} fill={shade(p.wall, -0.5)} />
          <rect width={4 * U} height={2.8 * U} fill={p.sky} />
          {dark &&
            Array.from({ length: 14 }, (_, i) => (
              <circle key={i} cx={rand(i * 2.1) * 4 * U} cy={rand(i * 5.3) * 1.6 * U} r={0.8 + rand(i) * 1.2} fill="#fff">
                <animate attributeName="opacity" values="0.2;1;0.2" dur={`${[2, 3, 6][i % 3]}s`} begin={`-${rand(i * 7.1) * 3}s`} repeatCount="indefinite" />
              </circle>
            ))}
          <circle cx={3.1 * U} cy={0.7 * U} r={11} fill={dark ? '#FFF3D6' : '#FFF9E0'} opacity="0.95" />
          {/* skyline with lit windows */}
          <path d={`M0 ${2.8 * U} V${2.0 * U} h18 v-12 h14 v20 h16 v-30 h18 v24 h20 v-14 h16 v22 h18 v-8 h${4 * U - 120} V${2.8 * U} Z`} fill={shade(p.sky, dark ? 0.12 : -0.35)} />
          {Array.from({ length: 8 }, (_, i) => (
            <rect key={i} x={8 + i * 15} y={2.2 * U + (i % 3) * 5} width="3" height="3" fill={p.pop} opacity="0.8">
              <Flicker dur={LOOP} seed={i + 2} low={0.2} />
            </rect>
          ))}
          <line x1={2 * U} y1={0} x2={2 * U} y2={2.8 * U} stroke={shade(p.wall, -0.5)} strokeWidth="4" />
          <line x1={0} y1={1.4 * U} x2={4 * U} y2={1.4 * U} stroke={shade(p.wall, -0.5)} strokeWidth="4" />
        </g>
        <g transform={onSideWall(0, 7.5, 4.8)}>
          <rect width={3.6 * U} height={2.6 * U} rx={3} fill={shade(p.wall, 0.12)} stroke={INK} />
          {Array.from({ length: 60 }, (_, i) => (
            <circle key={i} cx={8 + (i % 12) * 10} cy={8 + Math.floor(i / 12) * 17} r="1.4" fill={shade(p.wall, -0.4)} />
          ))}
          {[0, 1, 2].map((k) => (
            <g key={k} transform={`translate(${16 + k * 36} 12)`}>
              <rect width="8" height="34" rx="2" fill={shade(p.machine, -0.25)} />
              <rect x="-10" y="34" width="28" height="9" rx="2" fill={k === 1 ? p.ink2 : p.ink1} />
            </g>
          ))}
        </g>

        {/* ── Back wall: blacklight, sign, drying line of finished posters ── */}
        <g>
          <polygon points={poly([[2.2, 0.05, 5.75], [8.2, 0.05, 5.75], [8.2, 0.05, 5.95], [2.2, 0.05, 5.95]])} fill={dark ? '#E7C7FF' : shade(p.wall, 0.4)} filter={dark ? 'url(#np-glow)' : undefined}>
            {dark && <Flicker dur={LOOP} seed={7} low={0.5} />}
          </polygon>
          {dark && (
            <polygon points={poly([[2, 0.05, 4.0], [8.4, 0.05, 4.0], [8.4, 0.05, 5.75], [2, 0.05, 5.75]])} fill={p.ink1} opacity="0.18" filter="url(#np-blur)">
              <animate attributeName="opacity" values="0.14;0.24;0.14" dur="3s" repeatCount="indefinite" />
            </polygon>
          )}
        </g>
        <g transform={onBackWall(1.0, 0.05, 3.9)}>
          <rect width={4.8 * U} height={0.95 * U} rx={4} fill={shade(p.wall, -0.45)} stroke={INK} />
          <text x={2.4 * U} y={0.66 * U} textAnchor="middle" fontFamily={FONTS.fraunces} fontWeight={900} fontSize={Math.min(24, (4.4 * U) / (Math.max(8, p.sign.length) * 0.66))} fill={p.paper}>
            {p.sign}
          </text>
          <text x={4.8 * U - 4} y={0.95 * U + 26} textAnchor="end" fontFamily={FONTS.caveat} fontWeight={700} fontSize={26} fill={p.pop}>
            {p.note}
          </text>
        </g>
        {/* the line sags between two hooks */}
        {(() => {
          const [ax, ay] = S([6.2, 0.4, 5.6]);
          const [bx, by] = S([15.6, 0.4, 5.6]);
          return <path d={`M${ax},${ay} Q${(ax + bx) / 2},${(ay + by) / 2 + 22} ${bx},${by}`} stroke={shade(p.machine, -0.4)} strokeWidth="1.6" fill="none" />;
        })()}
        {labels.slice(0, 6).map((lab, i) => {
          const x = 6.6 + i * 1.5;
          const sag = Math.sin(((x - 6.2) / 9.4) * Math.PI) * 22;
          const [px, py] = S([x + 0.6, 0.4, 5.6]);
          const dur = [3, 2, 3, 6, 2, 3][i];
          return (
            <g key={i} transform={`translate(0 ${sag})`}>
              <g>
                <animateTransform attributeName="transform" type="rotate" values={`-3 ${px} ${py};3 ${px} ${py};-3 ${px} ${py}`} dur={`${dur}s`} begin={`-${(i * 0.7).toFixed(1)}s`} repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines={spline(2)} />
                <g transform={onBackWall(x, 0.4, 5.55)}>
                  <Print w={1.2 * U} h={1.6 * U} p={p} stage={3} label={lab} />
                </g>
                <rect x={px - 3} y={py - 6} width="6" height="10" rx="1.5" fill={i % 2 ? p.ink2 : p.pop} stroke={INK} strokeWidth="0.8" />
              </g>
            </g>
          );
        })}

        {/* ── Back corner: cartons of stock ── */}
        <IsoBox x={0.3} y={0.4} w={1.6} d={1.3} h={1.1} color={dark ? '#6E4A6A' : '#C9A27E'} u={U} ink={{ stroke: INK }} />
        <IsoBox x={0.5} y={0.6} z={1.1} w={1.1} d={1.0} h={0.75} color={dark ? '#7E5878' : '#D8B28C'} u={U} ink={{ stroke: INK }} />
        <IsoBox x={2.1} y={0.4} w={1.0} d={1.0} h={0.7} color={dark ? '#6E4A6A' : '#C9A27E'} u={U} ink={{ stroke: INK }} />
        <polyline points={poly([[0.3, 1.7, 0.75], [1.9, 1.7, 0.75]])} stroke={p.ink2} strokeWidth="3" fill="none" />

        {/* ── Drying rack against the back wall: shelves of fresh prints ── */}
        <polygon points={poly([[12.2, 2.8, 0.01], [15.4, 2.8, 0.01], [16, 3.8, 0.01], [12.8, 3.8, 0.01]])} fill="#05010c" opacity={dark ? 0.35 : 0.12} filter="url(#np-blur)" />
        {[12.3, 15.1].map((x) =>
          [0.9, 2.5].map((y) => <IsoBox key={`${x}-${y}`} x={x} y={y} w={0.12} d={0.12} h={3.4} color={shade(p.machine, -0.45)} u={U} ink={{ stroke: INK }} />),
        )}
        {Array.from({ length: 7 }, (_, k) => {
          const z = 0.35 + k * 0.45;
          const c = [p.ink1, p.ink2, p.paper, p.ink1, p.pop, p.ink2, p.paper][k];
          return (
            <g key={k}>
              <polygon points={poly([[12.3, 0.9, z], [15.22, 0.9, z], [15.22, 2.62, z], [12.3, 2.62, z]])} fill={shade(p.machine, -0.3)} stroke={INK} strokeWidth="0.8" />
              <polygon points={poly([[12.5, 1.05, z + 0.03], [14.9, 1.05, z + 0.03], [14.9, 2.45, z + 0.03], [12.5, 2.45, z + 0.03]])} fill={p.paper} />
              <polygon points={poly([[12.5, 2.45, z + 0.03], [14.9, 2.45, z + 0.03], [14.9, 2.45, z + 0.09], [12.5, 2.45, z + 0.09]])} fill={c} />
            </g>
          );
        })}
        <polygon points={poly([[12.3, 0.9, 3.4], [15.22, 0.9, 3.4], [15.22, 2.62, 3.4], [12.3, 2.62, 3.4]])} fill={shade(p.machine, -0.2)} stroke={INK} strokeWidth="1" />

        {/* rubber mat under the press */}
        <polygon points={poly([[4.4, 3.4, 0.01], [11.6, 3.4, 0.01], [11.6, 10.6, 0.01], [4.4, 10.6, 0.01]])} fill={shade(p.floor, -0.22)} stroke={shade(p.floor, 0.15)} strokeWidth="1.5" />
        <polygon points={poly([[4.7, 3.7, 0.015], [11.3, 3.7, 0.015], [11.3, 10.3, 0.015], [4.7, 10.3, 0.015]])} fill="none" stroke={p.pop} strokeWidth="1.5" strokeDasharray="10 8" opacity="0.5" />

        {/* ── Feed table: the agent's monitor, the brief, blank stock ── */}
        <polygon points={poly([[1.6, 11.6, 0.01], [4.6, 11.6, 0.01], [5.4, 12.6, 0.01], [2.4, 12.6, 0.01]])} fill="#05010c" opacity={dark ? 0.4 : 0.15} filter="url(#np-blur)" />
        <IsoBox x={1.6} y={9.2} w={3} d={2.4} h={1.5} color={shade(p.machine, -0.2)} u={U} ink={{ stroke: INK }} />
        {/* monitor showing the agent at work */}
        <IsoBox x={1.8} y={9.3} z={1.5} w={0.3} d={0.3} h={0.35} color={shade(p.machine, -0.45)} u={U} ink={{ stroke: INK }} />
        <IsoBox x={1.75} y={9.3} z={1.8} w={1.5} d={0.12} h={1.0} color={shade(p.machine, -0.5)} u={U} ink={{ stroke: INK }} />
        <g transform={onBackWall(1.83, 9.425, 2.72)}>
          <rect width={1.34 * U} height={0.84 * U} rx="2" fill="#0E0420" />
          <text x="5" y="11" fontFamily={FONTS.outfit} fontWeight={800} fontSize="8" fill={p.paper}>
            agent · 31 runs
          </text>
          {[0, 1, 2].map((k) => (
            <g key={k}>
              <rect x="5" y={17 + k * 6.5} width={1.34 * U - 10} height="3.5" rx="1.5" fill={shade(p.ink1, -0.6)} />
              <rect x="5" y={17 + k * 6.5} width="2" height="3.5" rx="1.5" fill={[p.ink1, p.ink2, p.pop][k]}>
                <animate attributeName="width" values={`2;${1.34 * U - 10};${1.34 * U - 10}`} keyTimes="0;0.8;1" dur={`${[3, 2, 6][k]}s`} repeatCount="indefinite" />
              </rect>
            </g>
          ))}
        </g>
        <IsoBox x={1.85} y={10.4} z={1.5} w={1.1} d={1.0} h={0.3} color={p.paper} u={U} ink={{ stroke: INK }} />
        {/* brief sheet with lines + pink clip */}
        <polygon points={poly([[3.15, 9.7, 1.51], [4.4, 9.7, 1.51], [4.4, 11.3, 1.51], [3.15, 11.3, 1.51]])} fill={p.paper} stroke={INK} strokeWidth="1" />
        {[0, 1, 2, 3].map((k) => (
          <polyline key={k} points={poly([[3.3, 10.1 + k * 0.28, 1.52], [k === 3 ? 3.8 : 4.25, 10.1 + k * 0.28, 1.52]])} stroke={shade(p.ink1, -0.3)} strokeWidth="1.4" fill="none" />
        ))}
        <polygon points={poly([[3.55, 9.65, 1.55], [4.0, 9.65, 1.55], [4.0, 9.9, 1.55], [3.55, 9.9, 1.55]])} fill={p.ink2} stroke={INK} strokeWidth="0.8" />

        {/* ── Carousel press ── */}
        <ellipse cx={S([C[0], C[1], 0])[0]} cy={S([C[0], C[1], 0])[1] + 8} rx={4 * U} ry={2.2 * U} fill="#05010c" opacity={dark ? 0.4 : 0.15} filter="url(#np-blur)" />
        <IsoCylinder x={C[0]} y={C[1]} r={1.3} h={0.4} color={shade(p.machine, -0.3)} u={U} ink={{ stroke: INK }} />
        <IsoCylinder x={C[0]} y={C[1]} z={0.4} r={0.4} h={PZ - 0.4} color={p.machine} u={U} ink={{ stroke: INK }} />
        {/* rotating platens: inner coords = world ground units × U (rotate 45° then scale = iso projection) */}
        <g transform={`translate(${hub[0]} ${hub[1]}) scale(1.2247 0.7071) rotate(45)`}>
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0;0;90;90;180;180;270;270;360"
              keyTimes="0;0.1667;0.25;0.4167;0.5;0.6667;0.75;0.9167;1"
              calcMode="spline"
              keySplines={spline(8)}
              dur={`${LOOP}s`}
              repeatCount="indefinite"
            />
            {[0, 1, 2, 3].map((k) => {
              const a = 45 + k * 90;
              return (
                <g key={k} transform={`rotate(${a})`}>
                  <rect x={0} y={-0.12 * U} width={R * U} height={0.24 * U} fill={shade(p.machine, -0.35)} stroke={INK} strokeWidth="1" />
                  <rect x={(R - 0.95) * U} y={-0.78 * U} width={1.9 * U} height={1.56 * U} rx={6} fill={shade(p.machine, -0.55)} stroke={INK} strokeWidth="1.2" />
                  <g transform={`translate(${(R - 0.75) * U} ${-0.6 * U})`}>
                    <Print w={1.5 * U} h={1.2 * U} p={p} stage={[1, 0, 3, 2][k]} />
                  </g>
                </g>
              );
            })}
          </g>
        </g>
        {/* hub cap + print head arm reaching to the front station */}
        <IsoCylinder x={C[0]} y={C[1]} z={PZ + 0.05} r={0.55} h={1.6} color={p.machine} u={U} ink={{ stroke: INK }} />
        <polygon points={poly([[C[0], C[1] - 0.2, 3.4], [front[0] + 0.2, front[1] - 0.2, 3.4], [front[0] + 0.2, front[1] - 0.2, 3.65], [C[0], C[1] - 0.2, 3.65]])} fill={shade(p.machine, -0.15)} stroke={INK} strokeWidth="1" />
        <polygon points={poly([[C[0] - 0.2, C[1], 3.4], [front[0] - 0.2, front[1] + 0.2, 3.4], [front[0] - 0.2, front[1] + 0.2, 3.65], [C[0] - 0.2, C[1], 3.65]])} fill={shade(p.machine, -0.32)} stroke={INK} strokeWidth="1" />
        <IsoCylinder x={C[0]} y={C[1]} z={3.65} r={0.35} h={0.25} color={p.ink1} u={U} ink={{ stroke: INK }} />
        {/* hanger posts from arm to screen */}
        {[-0.7, 0.7].map((b) => {
          const [ax, ay] = S(frameAt(0, b, 3.4));
          const [bx2, by2] = S(frameAt(0, b, headZ));
          return <line key={b} x1={ax} y1={ay} x2={bx2} y2={by2} stroke={shade(p.machine, -0.4)} strokeWidth="3" />;
        })}
        {/* print flash on the front sheet at the end of every pull */}
        <ellipse cx={fx} cy={fy} rx={1.5 * U} ry={0.9 * U} fill="url(#np-pool)" opacity="0">
          <animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes="0;0.55;0.62;0.85;1" dur="1.5s" repeatCount="indefinite" />
        </ellipse>
        {/* screen frame + mesh */}
        <polygon points={poly([frameAt(-0.95, -0.8, headZ), frameAt(0.95, -0.8, headZ), frameAt(0.95, 0.8, headZ), frameAt(-0.95, 0.8, headZ)])} fill={shade(p.ink1, 0.55)} fillOpacity="0.35" stroke={shade(p.machine, -0.45)} strokeWidth="5" strokeLinejoin="round" />
        <polygon points={poly([frameAt(-0.5, -0.5, headZ), frameAt(0.5, -0.5, headZ), frameAt(0.5, 0.5, headZ), frameAt(-0.5, 0.5, headZ)])} fill={p.ink2} opacity="0.35" />
        {/* squeegee: pulls toward the viewer during each hold, lifts back during the index */}
        <g>
          <animateTransform attributeName="transform" type="translate" values={`0 ${-pullA};0 ${pullA};0 ${pullA - 10};0 ${-pullA}`} keyTimes="0;0.6;0.7;1" calcMode="spline" keySplines={spline(3)} dur="1.5s" repeatCount="indefinite" />
          <line x1={S(frameAt(0, -0.85, headZ + 0.05))[0]} y1={S(frameAt(0, -0.85, headZ + 0.05))[1]} x2={S(frameAt(0, 0.85, headZ + 0.05))[0]} y2={S(frameAt(0, 0.85, headZ + 0.05))[1]} stroke={p.ink2} strokeWidth="6" strokeLinecap="round" />
          <line x1={S(frameAt(0, -0.5, headZ + 0.05))[0]} y1={S(frameAt(0, -0.5, headZ + 0.05))[1] - 4} x2={S(frameAt(0, -0.5, headZ + 0.6))[0]} y2={S(frameAt(0, -0.5, headZ + 0.6))[1]} stroke={shade(p.machine, -0.2)} strokeWidth="4" strokeLinecap="round" />
          <line x1={S(frameAt(0, 0.5, headZ + 0.05))[0]} y1={S(frameAt(0, 0.5, headZ + 0.05))[1] - 4} x2={S(frameAt(0, 0.5, headZ + 0.6))[0]} y2={S(frameAt(0, 0.5, headZ + 0.6))[1]} stroke={shade(p.machine, -0.2)} strokeWidth="4" strokeLinecap="round" />
          <line x1={S(frameAt(0, -0.55, headZ + 0.6))[0]} y1={S(frameAt(0, -0.55, headZ + 0.6))[1]} x2={S(frameAt(0, 0.55, headZ + 0.6))[0]} y2={S(frameAt(0, 0.55, headZ + 0.6))[1]} stroke={p.machine} strokeWidth="7" strokeLinecap="round" />
        </g>
        {/* status lamp on the head */}
        <circle cx={hx} cy={hy - 0.95 * U} r="4" fill={p.pop} filter="url(#np-glow)">
          <animate attributeName="opacity" values="1;0.25;1" dur="1.5s" repeatCount="indefinite" />
        </circle>

        {/* ── Ink buckets by the press ── */}
        {[
          [5.5, 11.0, p.ink1, 0.4, 0.62],
          [6.4, 11.6, p.ink2, 0.36, 0.55],
          [5.2, 12.2, p.pop, 0.28, 0.42],
        ].map(([x, y, c, r, h], i) => (
          <g key={i}>
            <ellipse cx={S([x as number, y as number, 0])[0] + 8} cy={S([x as number, y as number, 0])[1] + 4} rx={(r as number) * U * 1.5} ry={(r as number) * U * 0.7} fill="#05010c" opacity={dark ? 0.35 : 0.12} filter="url(#np-blur)" />
            <IsoCylinder x={x as number} y={y as number} r={r as number} h={h as number} color={shade(p.machine, -0.15)} u={U} ink={{ stroke: INK }} />
            <IsoCylinder x={x as number} y={y as number} z={(h as number) * 0.25} r={(r as number) * 1.01} h={(h as number) * 0.4} color={c as string} u={U} ink={{ stroke: INK }} />
            <IsoCylinder x={x as number} y={y as number} z={h as number} r={(r as number) * 0.95} h={0.04} color={c as string} u={U} ink={{ stroke: INK }} />
          </g>
        ))}

        {/* ── Conveyor dryer ── */}
        <polygon points={poly([[11, 11.6, 0.01], [15, 11.6, 0.01], [15.6, 12.4, 0.01], [11.6, 12.4, 0.01]])} fill="#05010c" opacity={dark ? 0.4 : 0.15} filter="url(#np-blur)" />
        {[11.2, 14.7].map((x) => (
          <IsoBox key={x} x={x} y={10.1} w={0.2} d={1.4} h={0.9} color={shade(p.machine, -0.45)} u={U} ink={{ stroke: INK }} />
        ))}
        <IsoBox x={11} y={10} w={4.1} d={1.6} z={0.9} h={0.14} color={shade(p.machine, -0.6)} u={U} ink={{ stroke: INK }} />
        {/* sheets riding the belt (two, half a cycle apart) */}
        {[0, 1.5].map((off) => (
          <g key={off}>
            <animateTransform attributeName="transform" type="translate" values={`0 0;${4 * C30 * U} ${2 * U}`} dur="3s" begin={`-${off}s`} repeatCount="indefinite" />
            <polygon points={poly([[11, 10.3, 1.06], [11.9, 10.3, 1.06], [11.9, 11.3, 1.06], [11, 11.3, 1.06]])} fill={p.paper} stroke={INK} strokeWidth="0.8" />
            <polygon points={poly([[11.2, 10.5, 1.07], [11.7, 10.5, 1.07], [11.7, 11.0, 1.07], [11.2, 11.0, 1.07]])} fill={p.ink1} />
          </g>
        ))}
        {/* hood with a hot glowing mouth */}
        <IsoBox x={12.2} y={9.9} z={1.3} w={2.2} d={1.8} h={1.0} color={shade(p.machine, -0.1)} u={U} ink={{ stroke: INK }} />
        <polygon points={poly([[12.2, 11.7, 1.08], [14.4, 11.7, 1.08], [14.4, 11.7, 1.3], [12.2, 11.7, 1.3]])} fill={p.ink2} filter="url(#np-glow)">
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
        </polygon>
        {[0, 1, 2].map((k) => (
          <polyline key={k} points={poly([[12.5 + k * 0.6, 11.71, 1.5], [12.5 + k * 0.6, 11.71, 2.1]])} stroke={shade(p.machine, -0.4)} strokeWidth="2" fill="none" />
        ))}
        <circle cx={S([14.1, 11.7, 2.05])[0]} cy={S([14.1, 11.7, 2.05])[1]} r="3.2" fill={p.pop} filter="url(#np-glow)">
          <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
        </circle>
        {/* heat shimmer */}
        {[0, 1].map((k) => {
          const [sx, sy] = S([13.3 + k * 0.5, 10.8, 2.4]);
          return (
            <path key={k} d={`M${sx},${sy} q6,-10 0,-20 q-6,-10 0,-20`} stroke={p.ink2} strokeWidth="1.5" fill="none" opacity="0">
              <animate attributeName="opacity" values="0;0.6;0" dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
              <animateTransform attributeName="transform" type="translate" values="0 0;0 -16" dur="2s" begin={`-${k}s`} repeatCount="indefinite" />
            </path>
          );
        })}

        {/* ── Output stack + the moment: a print drops, flash, 31/31 tag pops ── */}
        <IsoBox x={stackAt[0]} y={stackAt[1]} w={1.4} d={1.1} h={0.55} color={p.paper} u={U} ink={{ stroke: INK }} />
        {[0.15, 0.3, 0.45].map((z) => (
          <polyline key={z} points={poly([[stackAt[0], stackAt[1] + 1.1, z], [stackAt[0] + 1.4, stackAt[1] + 1.1, z], [stackAt[0] + 1.4, stackAt[1], z]])} stroke={shade(p.paper, -0.25)} strokeWidth="0.8" fill="none" />
        ))}
        <polygon points={poly([[stackAt[0] + 0.25, stackAt[1] + 0.2, 0.56], [stackAt[0] + 1.15, stackAt[1] + 0.2, 0.56], [stackAt[0] + 1.15, stackAt[1] + 0.9, 0.56], [stackAt[0] + 0.25, stackAt[1] + 0.9, 0.56]])} fill={p.ink1} opacity="0.85" />
        <g opacity="0">
          <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.7;0.71;0.75;0.76" dur={`${LOOP}s`} repeatCount="indefinite" />
          <animateTransform attributeName="transform" type="translate" values="0 -50;0 -50;0 0;0 0" keyTimes="0;0.7;0.75;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          <polygon points={poly([[stackAt[0] + 0.05, stackAt[1] + 0.05, 0.6], [stackAt[0] + 1.35, stackAt[1] + 0.05, 0.6], [stackAt[0] + 1.35, stackAt[1] + 1.05, 0.6], [stackAt[0] + 0.05, stackAt[1] + 1.05, 0.6]])} fill={p.paper} stroke={INK} strokeWidth="0.8" />
        </g>
        <ellipse cx={S([14.4, 12.85, 0.6])[0]} cy={S([14.4, 12.85, 0.6])[1]} rx="90" ry="50" fill="url(#np-pop)" opacity="0">
          <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={flashKT} dur={`${LOOP}s`} repeatCount="indefinite" />
        </ellipse>
        <circle cx={S([14.4, 12.85, 0.6])[0]} cy={S([14.4, 12.85, 0.6])[1]} r="10" fill="none" stroke={p.pop} strokeWidth="2" opacity="0">
          <animate attributeName="r" values="10;10;10;80;80" keyTimes={flashKT} dur={`${LOOP}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes={flashKT} dur={`${LOOP}s`} repeatCount="indefinite" />
        </circle>
        <g transform={`translate(${tagX} ${tagY - 18})`}>
          <g>
            <animateTransform attributeName="transform" type="scale" values="0;0;1.25;1;1;0" keyTimes="0;0.75;0.79;0.82;0.97;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <g transform="rotate(-8)">
              <rect x="-38" y="-20" width="76" height="34" rx="5" fill={p.pop} stroke={INK} strokeWidth="1" />
              <text x="0" y="6" textAnchor="middle" fontFamily={FONTS.caveat} fontWeight={700} fontSize="24" fill="#1A0830">
                31/31
              </text>
            </g>
          </g>
        </g>
      </g>

      {dark && <Dust />}
      {/* floor vignette */}
      <rect width="1200" height="900" fill="none" />
    </svg>
  );
}
