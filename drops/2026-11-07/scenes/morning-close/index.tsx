import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, iso, pts, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Morning Close',
  description:
    'Empty-state and email hero for Mandate’s morning report: an isometric CFO desk at dawn. The agent’s ticker printer spools last night’s trades, coffee steams under a brass lamp, a page of the ledger turns and a gold “Books closed” stamp thumps down as the phone lights up with the result.',
  tags: ['isometric', 'still life', 'desk', 'ledger', 'morning', 'finance', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  header: text('Ledger header').default('MORNING LEDGER · NOV 07'),
  stamp: text('Stamp').default('BOOKS CLOSED'),
  notifTitle: text('Phone headline').default('+4.2× ROAS'),
  notifBody: text('Phone detail').default('Mandate · closed 06:00'),
  total: text('Ledger total').default('$171.4K'),
  rows: text('Ledger rows (comma list)').default('META 41.2K,GOOGLE 33.9K,TIKTOK 24.3K,YOUTUBE 16.4K,AMAZON 14.2K,LINKEDIN 10.4K'),
  spines: text('Past ledgers (comma list)').default('NOV 06,NOV 05,NOV 04,NOV 03'),
  wall: color('Walls').default('#16161A'),
  floor: color('Floor').default('#111114'),
  desk: color('Desk').default('#1C1C20'),
  paper: color('Paper').default('#F3EDE2'),
  gold: color('Gold').default('#C9A45C'),
  glow: color('Lamp light').default('#E8D9B5'),
  sky: color('Dawn sky').default('#E9A86A'),
  ink: color('Wall labels').default('#F3EDE2'),
  outline: color('Outline').default('#050507'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  swiss: { wall: '#E6E6E1', floor: '#CFCFC9', desk: '#F5F5F0', paper: '#FFFFFF', gold: '#E3000F', glow: '#FFF6E0', sky: '#A9CBEA', ink: '#0A0A0A', outline: '#2E2E2C' },
  blueprint: { wall: '#0F3B8C', floor: '#0B2F72', desk: '#134AA8', paper: '#EAF2FF', gold: '#FFDD00', glow: '#EAF2FF', sky: '#7FB2FF', ink: '#EAF2FF', outline: '#071B44' },
  forest: { wall: '#0E1A14', floor: '#0A140F', desk: '#18291F', paper: '#EAF2DC', gold: '#B5E550', glow: '#FFE7B0', sky: '#F2C27B', ink: '#EAF2DC', outline: '#030806' },
  cherry: { wall: '#2A0A10', floor: '#1E070B', desk: '#3F1019', paper: '#FFE8E0', gold: '#F7B32B', glow: '#FFE8E0', sky: '#F58A6A', ink: '#FFE8E0', outline: '#0C0204', stamp: 'Q4 CLOSED', notifTitle: '−31% CPA', header: 'QUARTER CLOSE · DEC 31' },
};

type P = z.infer<typeof schema>;

const U = 64;
const OX = 489;
const OY = 418;
/** Window on the back wall: x from WIN.x, width WIN.w, sill at WIN.z, height WIN.h. */
const WIN = { x: 4, w: 5, z: 4.2, h: 3.1 };
const WW = WIN.w * U;
const WH = WIN.h * U;
/** Phone lying on the desk (x, y, w, d) and its screen size inside the bezel. */
const PHONE = { x: 0.4, y: 3.75, w: 2.1, d: 1.1 };
const PH = { w: PHONE.w - 0.16, d: PHONE.d - 0.16 };
const LOOP = scene.loop;
const C30 = Math.cos(Math.PI / 6);
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const f = (n: number) => n.toFixed(2);
const MONO = FONTS.spacemono;

/** Plane y = const (left-facing): local x runs along +x, local y points down. */
const yPlane = ([x, y, z]: P3) => {
  const [a, b] = S([x, y, z]);
  return `matrix(${C30} 0.5 0 1 ${f(a)} ${f(b)})`;
};
/** Plane x = const (the left wall): local x runs along -y, local y points down. */
const xPlane = ([x, y, z]: P3) => {
  const [a, b] = S([x, y, z]);
  return `matrix(${C30} -0.5 0 1 ${f(a)} ${f(b)})`;
};
/** Ground plane at height z: local x runs along +x, local y along +y. */
const ground = ([x, y, z]: P3) => {
  const [a, b] = S([x, y, z]);
  return `matrix(${C30} 0.5 ${-C30} 0.5 ${f(a)} ${f(b)})`;
};

const DESK = { w: 9, d: 5, top: 3 };
const BOOK = { x0: 2.3, x1: 6.5, y0: 1.5, y1: 4.3, z: 3.24 };
const SPINE = (BOOK.x0 + BOOK.x1) / 2;
const MARK: P3 = [5.45, 2.9, BOOK.z + 0.005];
const STAMP_REST: P3 = [4.9, 0.7, DESK.top];

/** The page turning over the spine: outer edge swings through an arc. */
function pageAt(theta: number) {
  const r = BOOK.x1 - 0.1 - SPINE;
  const ox = SPINE + Math.cos(theta) * r;
  const oz = BOOK.z + Math.sin(theta) * r * 0.9;
  return poly([
    [SPINE, BOOK.y0 + 0.1, BOOK.z],
    [ox, BOOK.y0 + 0.1, oz],
    [ox, BOOK.y1 - 0.1, oz],
    [SPINE, BOOK.y1 - 0.1, BOOK.z],
  ]);
}

export default function MorningClose(p: P) {
  const ink = { stroke: p.outline, strokeWidth: 1.2 };
  const rows = p.rows.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 7);
  const spines = p.spines.split(',').map((s) => s.trim()).slice(0, 4);
  const leather = shade(p.gold, -0.62);
  const paperEdge = shade(p.paper, -0.18);

  // The moment: the page turns (2.7–3.3 s), the stamp lifts, crosses and thumps
  // down at 4.32 s, and the phone buzzes with the result.
  const kStamp = '0;0.55;0.62;0.68;0.72;0.77;0.84;0.93;1';
  const moment = (values: string, keyTimes: string) => ({ values, keyTimes, dur: `${LOOP}s`, repeatCount: 'indefinite' as const });

  const [rx0, ry0] = S(STAMP_REST);
  const [mx, my] = S(MARK);
  const dx = mx - (rx0 + S([0.3, 0.3, 0])[0]);
  const dy = my - (ry0 + S([0.3, 0.3, 0])[1]);

  // Page turn keyframes, sampled along the arc.
  const flipSteps = [0, 0.18, 0.36, 0.5, 0.64, 0.82, 1].map((k) => pageAt(Math.PI * k));
  const flipTimes = [0.45, 0.47, 0.49, 0.5, 0.51, 0.53, 0.55];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${scene.width} ${scene.height}`}>
      <defs>
        <linearGradient id="mc-wallL" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.wall, -0.35)} />
          <stop offset="1" stopColor={shade(p.wall, 0.05)} />
        </linearGradient>
        <linearGradient id="mc-wallR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.wall, -0.15)} />
          <stop offset="1" stopColor={shade(p.wall, 0.16)} />
        </linearGradient>
        <linearGradient id="mc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.wall, -0.2)} />
          <stop offset="0.55" stopColor={shade(p.sky, -0.25)} />
          <stop offset="1" stopColor={shade(p.sky, 0.2)} />
        </linearGradient>
        <radialGradient id="mc-sun">
          <stop offset="0" stopColor={shade(p.sky, 0.7)} stopOpacity="0.95" />
          <stop offset="0.35" stopColor={p.sky} stopOpacity="0.5" />
          <stop offset="1" stopColor={p.sky} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mc-shaft" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(p.sky, 0.4)} stopOpacity="0.28" />
          <stop offset="1" stopColor={shade(p.sky, 0.4)} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="mc-pool">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.5" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mc-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.glow} stopOpacity="0.35" />
          <stop offset="1" stopColor={p.glow} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="mc-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={shade(p.outline, 0.12)} />
          <stop offset="1" stopColor={shade(p.gold, -0.75)} />
        </linearGradient>
        <linearGradient id="mc-gutter" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="0.5" stopColor="#000" stopOpacity="0.28" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <filter id="mc-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="mc-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <clipPath id="mc-win">
          <rect x={0} y={0} width={WW} height={WH} />
        </clipPath>
        <clipPath id="mc-phone">
          <rect x={0} y={0} width={PH.w * U} height={PH.d * U} rx={7} />
        </clipPath>
        <radialGradient id="mc-vig" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      <rect width={scene.width} height={scene.height} fill={shade(p.wall, -0.4)} />

      <g transform={`translate(${OX} ${OY})`}>
        {/* ── room ── */}
        <polygon points={poly([[-1, -1, 0], [-1, 11, 0], [-1, 11, 14], [-1, -1, 14]])} fill="url(#mc-wallL)" />
        <polygon points={poly([[-1, -1, 0], [14, -1, 0], [14, -1, 14], [-1, -1, 14]])} fill="url(#mc-wallR)" />
        {/* wainscot: a panelled lower band with a gold dado rail */}
        <polygon points={poly([[-1, 11, 0], [-1, -1, 0], [14, -1, 0], [14, -1, 2.2], [-1, -1, 2.2], [-1, 11, 2.2]])} fill={shade(p.wall, -0.18)} />
        {Array.from({ length: 8 }, (_, i) => (
          <polyline key={`wl${i}`} points={poly([[-1, 10 - i * 1.5, 0], [-1, 10 - i * 1.5, 2.2]])} stroke={shade(p.wall, -0.42)} strokeWidth={1.4} />
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <polyline key={`wr${i}`} points={poly([[0.5 + i * 1.5, -1, 0], [0.5 + i * 1.5, -1, 2.2]])} stroke={shade(p.wall, -0.42)} strokeWidth={1.4} />
        ))}
        <polyline points={poly([[-1, 11, 2.2], [-1, -1, 2.2], [14, -1, 2.2]])} fill="none" stroke={p.gold} strokeWidth={2.2} opacity={0.75} />
        <polygon points={poly([[-1, -1, 0], [14, -1, 0], [14, 11, 0], [-1, 11, 0]])} fill={p.floor} />
        {/* parquet: herringbone-ish boards */}
        <g stroke={shade(p.floor, 0.12)} strokeWidth={1} opacity={0.7}>
          {Array.from({ length: 16 }, (_, i) => (
            <polyline key={i} points={poly([[-1 + i, -1, 0], [-1 + i, 11, 0]])} />
          ))}
        </g>
        {/* rug in front of the desk */}
        <polygon points={poly([[-0.2, 5.7, 0.01], [12, 5.7, 0.01], [12, 11, 0.01], [-0.2, 11, 0.01]])} fill={shade(p.floor, 0.06)} stroke={p.outline} strokeWidth={1.2} />
        <polygon points={poly([[0.2, 6.1, 0.02], [11.6, 6.1, 0.02], [11.6, 11, 0.02], [0.2, 11, 0.02]])} fill="none" stroke={p.gold} strokeWidth={2} opacity={0.45} />
        <polygon points={poly([[0.6, 6.5, 0.02], [11.2, 6.5, 0.02], [11.2, 11, 0.02], [0.6, 11, 0.02]])} fill="none" stroke={p.gold} strokeWidth={1} opacity={0.25} />

        {/* ── window on the back wall: dawn over the financial district ── */}
        <g transform={yPlane([WIN.x, -0.98, WIN.z + WIN.h])}>
          <rect x={-10} y={-10} width={WW + 20} height={WH + 20} fill={shade(p.wall, -0.45)} stroke={p.outline} strokeWidth={1.5} />
          <g clipPath="url(#mc-win)">
            <rect x={0} y={0} width={WW} height={WH} fill="url(#mc-sky)" />
            <circle cx={WW * 0.72} cy={WH * 0.56} r={120} fill="url(#mc-sun)">
              <animate attributeName="r" values="110;136;110" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx={WW * 0.72} cy={WH * 0.56} r={22} fill={shade(p.sky, 0.65)} />
            {/* drifting clouds */}
            {[0, 1].map((k) => (
              <g key={k} opacity={0.6}>
                <animateTransform attributeName="transform" type="translate" values={`-140 ${26 + k * 44};${WW + 40} ${26 + k * 44}`} dur={`${LOOP}s`} begin={`${-k * 3}s`} repeatCount="indefinite" />
                <ellipse cx={40} cy={10} rx={46} ry={8} fill={shade(p.sky, k ? 0.3 : 0.1)} />
                <ellipse cx={62} cy={4} rx={24} ry={8} fill={shade(p.sky, k ? 0.3 : 0.1)} />
              </g>
            ))}
            {/* birds cross on the moment */}
            <g opacity={0} fill="none" stroke={shade(p.wall, -0.4)} strokeWidth={1.6} strokeLinecap="round">
              <animate attributeName="opacity" {...moment('0;0;1;1;0;0', '0;0.6;0.62;0.86;0.88;1')} />
              <animateTransform attributeName="transform" type="translate" {...moment('-30 70;-30 70;20 60;250 30;270 28;270 28', '0;0.6;0.62;0.86;0.88;1')} />
              <path d="M0,0 q5,-5 10,0 q5,-5 10,0" />
              <path d="M18,12 q4,-4 8,0 q4,-4 8,0" />
            </g>
            {/* skyline: bank towers with lit floors */}
            {[
              [0, 84, 38], [34, 54, 32], [62, 110, 30], [96, 66, 42], [136, 124, 32], [166, 76, 28], [218, 96, 38], [252, 58, 30], [280, 88, 34],
            ].map(([x, h, w], i) => (
              <g key={i}>
                <rect x={x} y={WH - h} width={w} height={h} fill={shade(p.wall, -0.3 - (i % 3) * 0.08)} />
                {i === 4 && <polygon points={`${x + w / 2},${WH - h - 26} ${x + w / 2 + 2.5},${WH - h} ${x + w / 2 - 2.5},${WH - h}`} fill={shade(p.wall, -0.4)} />}
                {Array.from({ length: Math.floor(h / 14) }, (_, k) => (
                  <rect key={k} x={x + 5} y={WH - h + 8 + k * 14} width={w - 10} height={3} fill={p.glow} opacity={(i * 7 + k * 3) % 5 === 0 ? 0.65 : 0.12}>
                    {(i * 7 + k * 3) % 5 === 0 && <Flicker dur={LOOP} seed={i * 3 + k} low={0.2} />}
                  </rect>
                ))}
              </g>
            ))}
          </g>
          {/* frame + mullions */}
          <rect x={0} y={0} width={WW} height={WH} fill="none" stroke={p.gold} strokeWidth={3} />
          <line x1={WW / 2} y1={0} x2={WW / 2} y2={WH} stroke={shade(p.wall, -0.45)} strokeWidth={7} />
          <line x1={0} y1={WH * 0.36} x2={WW} y2={WH * 0.36} stroke={shade(p.wall, -0.45)} strokeWidth={7} />
          <line x1={WW / 2} y1={0} x2={WW / 2} y2={WH} stroke={p.gold} strokeWidth={1.2} opacity={0.6} />
          <line x1={0} y1={WH * 0.36} x2={WW} y2={WH * 0.36} stroke={p.gold} strokeWidth={1.2} opacity={0.6} />
          {/* glass reflection streaks */}
          <polygon points={`${0.3 * U},${WH - 10} ${0.6 * U},${WH - 10} ${1.5 * U},${WH * 0.45} ${1.2 * U},${WH * 0.45}`} fill="#ffffff" opacity={0.08} />
          <polygon points={`${2.8 * U},${WH * 0.33} ${3.0 * U},${WH * 0.33} ${3.5 * U},6 ${3.3 * U},6`} fill="#ffffff" opacity={0.08} />
        </g>
        {/* window sill */}
        <IsoBox x={WIN.x - 0.3} y={-1} w={WIN.w + 0.6} d={0.45} h={0.18} z={WIN.z - 0.18} color={shade(p.desk, 0.2)} u={U} ink={ink} />

        {/* ── left wall: clock at 06:00, desk calendar, framed chart ── */}
        <g transform={xPlane([-0.98, 3.6, 6.1])}>
          <circle r={0.78 * U + 6} fill={p.gold} stroke={p.outline} strokeWidth={1.5} />
          <circle r={0.78 * U} fill={shade(p.wall, -0.4)} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const r0 = i % 3 === 0 ? 0.56 : 0.64;
            return <line key={i} x1={Math.cos(a) * r0 * U} y1={Math.sin(a) * r0 * U} x2={Math.cos(a) * 0.72 * U} y2={Math.sin(a) * 0.72 * U} stroke={p.ink} strokeWidth={i % 3 === 0 ? 3 : 1.4} />;
          })}
          <line x1={0} y1={0} x2={0} y2={0.42 * U} stroke={p.ink} strokeWidth={4} strokeLinecap="round" />
          <line x1={0} y1={0} x2={0} y2={-0.6 * U} stroke={p.ink} strokeWidth={3} strokeLinecap="round" />
          <g>
            <animateTransform attributeName="transform" type="rotate" values="0;360" dur={`${LOOP}s`} repeatCount="indefinite" />
            <line x1={0} y1={8} x2={0} y2={-0.68 * U} stroke={p.gold} strokeWidth={1.5} />
          </g>
          <circle r={4} fill={p.gold} />
        </g>
        <g transform={xPlane([-0.98, 1.3, 5.7])}>
          <rect x={0} y={0} width={1.3 * U} height={1.45 * U} fill={p.paper} stroke={p.outline} strokeWidth={1.2} />
          <rect x={0} y={0} width={1.3 * U} height={0.36 * U} fill={p.gold} stroke={p.outline} strokeWidth={1.2} />
          <text x={0.65 * U} y={15} textAnchor="middle" fontFamily={MONO} fontSize={11} fontWeight={700} fill={p.outline} letterSpacing="2">
            NOV
          </text>
          <text x={0.65 * U} y={1.25 * U} textAnchor="middle" fontFamily={FONTS.archivo} fontSize={44} fill={p.outline} letterSpacing="-2">
            07
          </text>
          {[0.2, 0.55, 0.9].map((k) => (
            <circle key={k} cx={k * 1.3 * U} cy={-3} r={3} fill={p.outline} />
          ))}
        </g>
        <g transform={xPlane([-0.98, 7.6, 5.9])}>
          <rect x={0} y={0} width={2.6 * U} height={1.6 * U} fill={shade(p.wall, -0.3)} stroke={p.gold} strokeWidth={2.5} />
          <rect x={6} y={6} width={2.6 * U - 12} height={1.6 * U - 12} fill="none" stroke={shade(p.gold, -0.3)} strokeWidth={1} />
          {Array.from({ length: 8 }, (_, i) => {
            const h = (0.25 + ((i * 37) % 10) / 18 + i * 0.05) * 0.8 * U;
            return <rect key={i} x={16 + i * 18} y={1.6 * U - 12 - h} width={10} height={h} fill={i === 7 ? p.gold : shade(p.ink, -0.45)} opacity={i === 7 ? 1 : 0.55} />;
          })}
          <text x={14} y={22} fontFamily={MONO} fontSize={12} fontWeight={700} fill={p.ink} letterSpacing="2">
            SPEND · 9 MO
          </text>
        </g>

        {/* window light falling across the desk */}
        <polygon points={poly([[WIN.x, -1, WIN.z + WIN.h], [WIN.x + WIN.w, -1, WIN.z + WIN.h], [WIN.x + WIN.w, -1, WIN.z], [WIN.x + WIN.w, 0.5, 3], [WIN.x + WIN.w, 4.4, 3], [WIN.x, 4.4, 3]])} fill="url(#mc-shaft)" style={{ mixBlendMode: 'screen' }}>
          <animate attributeName="opacity" values="0.8;1;0.8" dur="3s" repeatCount="indefinite" />
        </polygon>

        {/* ── desk ── */}
        <polygon points={poly([[0.4, 0.6, 0.01], [9.6, 0.6, 0.01], [10.4, 5.9, 0.01], [1.0, 5.9, 0.01]])} fill="#000" opacity={0.45} filter="url(#mc-blur)" />
        <IsoBox x={8.6} y={0.15} w={0.3} d={0.3} h={2.7} color={shade(p.desk, -0.1)} u={U} ink={ink} />
        <IsoBox x={2.6} y={0.15} w={6} d={0.15} h={1.4} z={1.3} color={shade(p.desk, -0.2)} u={U} ink={ink} />
        <IsoBox x={0.2} y={0.3} w={2.4} d={4.5} h={2.7} color={p.desk} u={U} ink={ink} />
        {[0.15, 1.05, 1.85].map((z, i) => (
          <g key={i}>
            <polygon points={poly([[0.35, 4.81, z], [2.45, 4.81, z], [2.45, 4.81, z + (i === 0 ? 0.8 : 0.7)], [0.35, 4.81, z + (i === 0 ? 0.8 : 0.7)]])} fill={shade(p.desk, -0.22)} stroke={p.outline} strokeWidth={1} />
            <polyline points={poly([[1.1, 4.82, z + (i === 0 ? 0.48 : 0.42)], [1.7, 4.82, z + (i === 0 ? 0.48 : 0.42)]])} stroke={p.gold} strokeWidth={4} strokeLinecap="round" />
          </g>
        ))}
        <IsoBox x={8.6} y={4.55} w={0.3} d={0.3} h={2.7} color={shade(p.desk, -0.1)} u={U} ink={ink} />
        {/* wastebasket with crumpled drafts */}
        <ellipse cx={S([10.6, 3.2, 0])[0] - 8} cy={S([10.6, 3.2, 0])[1] + 6} rx={42} ry={16} fill="#000" opacity={0.4} filter="url(#mc-soft)" />
        <IsoCylinder x={10.6} y={3.2} r={0.55} h={1.25} color={shade(p.desk, 0.1)} u={U} ink={ink} />
        {[[-10, -4], [8, -8], [0, -12]].map(([ox, oy], i) => {
          const [cx, cy] = S([10.6, 3.2, 1.25]);
          return <circle key={i} cx={cx + ox} cy={cy + oy} r={9} fill={paperEdge} stroke={p.outline} strokeWidth={1} />;
        })}
        {/* the desk slab with a gold edge */}
        <IsoBox x={0} y={0} w={DESK.w} d={DESK.d} h={0.3} z={2.7} color={p.desk} u={U} ink={ink} />
        <polyline points={poly([[0, DESK.d, 2.86], [DESK.w, DESK.d, 2.86], [DESK.w, 0, 2.86]])} fill="none" stroke={p.gold} strokeWidth={1.6} opacity={0.8} />
        {/* desk top lit by the window */}
        <polygon points={poly([[3.5, 0.5, 3], [8.5, 0.5, 3], [8.5, 5, 3], [3.5, 5, 3]])} fill={shade(p.sky, 0.3)} opacity={0.07} />

        {/* lamp pool on the desk */}
        <ellipse cx={S([3.9, 2.8, 3])[0]} cy={S([3.9, 2.8, 3])[1]} rx={250} ry={130} fill="url(#mc-pool)" style={{ mixBlendMode: 'screen' }}>
          <Flicker dur={LOOP} seed={5} low={0.82} />
        </ellipse>

        {/* contact shadows on the desk */}
        <ellipse cx={S([1.3, 1.2, 3])[0]} cy={S([1.3, 1.2, 3])[1]} rx={34} ry={14} fill="#000" opacity={0.4} filter="url(#mc-soft)" />
        <polygon points={poly([[6.6, 0.5, 3], [8.5, 0.5, 3], [8.6, 1.8, 3], [6.7, 1.8, 3]])} fill="#000" opacity={0.4} filter="url(#mc-soft)" />
        <polygon points={poly([[BOOK.x0, BOOK.y0 + 0.2, 3], [BOOK.x1 + 0.1, BOOK.y0 + 0.2, 3], [BOOK.x1 + 0.1, BOOK.y1 + 0.25, 3], [BOOK.x0, BOOK.y1 + 0.25, 3]])} fill="#000" opacity={0.35} filter="url(#mc-soft)" />
        <polygon points={poly([[7.5, 2.6, 3], [8.9, 2.6, 3], [8.9, 3.8, 3], [7.5, 3.8, 3]])} fill="#000" opacity={0.4} filter="url(#mc-soft)" />

        {/* ── back of the desk: lamp, plant, stamp, past ledgers ── */}
        <IsoCylinder x={1.1} y={0.9} z={3} r={0.45} h={0.12} color={p.gold} u={U} ink={ink} />
        {(() => {
          const [bx, by] = S([1.1, 0.9, 3.12]);
          const [ex, ey] = S([1.1, 0.9, 5.3]);
          const [hx, hy] = S([2.3, 1.7, 5.5]);
          return (
            <g>
              <line x1={bx} y1={by} x2={ex} y2={ey} stroke={p.outline} strokeWidth={7} strokeLinecap="round" />
              <line x1={bx} y1={by} x2={ex} y2={ey} stroke={p.gold} strokeWidth={4} strokeLinecap="round" />
              <line x1={ex} y1={ey} x2={hx} y2={hy - 14} stroke={p.outline} strokeWidth={7} strokeLinecap="round" />
              <line x1={ex} y1={ey} x2={hx} y2={hy - 14} stroke={p.gold} strokeWidth={4} strokeLinecap="round" />
              <circle cx={ex} cy={ey} r={6} fill={p.gold} stroke={p.outline} strokeWidth={1.2} />
              {/* light cone onto the ledger */}
              <polygon points={`${hx - 34},${hy + 14} ${hx + 34},${hy + 14} ${hx + 150},${hy + 180} ${hx - 70},${hy + 200}`} fill="url(#mc-cone)" style={{ mixBlendMode: 'screen' }}>
                <Flicker dur={LOOP} seed={5} low={0.82} />
              </polygon>
              <path d={`M${hx - 16},${hy - 22} L${hx + 14},${hy - 22} L${hx + 36},${hy + 12} L${hx - 34},${hy + 12} Z`} fill={p.gold} stroke={p.outline} strokeWidth={1.4} strokeLinejoin="round" />
              <path d={`M${hx - 10},${hy - 20} L${hx - 2},${hy - 20} L${hx - 18},${hy + 10} L${hx - 28},${hy + 10} Z`} fill="#ffffff" opacity={0.25} />
              <ellipse cx={hx + 1} cy={hy + 12} rx={35} ry={8} fill={p.glow} stroke={p.outline} strokeWidth={1}>
                <Flicker dur={LOOP} seed={5} low={0.82} />
              </ellipse>
            </g>
          );
        })()}
        {/* potted plant */}
        <IsoCylinder x={3.4} y={0.55} z={3} r={0.32} h={0.5} color={shade(p.paper, -0.1)} u={U} ink={ink} />
        {[-26, -12, 0, 14, 26].map((a, i) => {
          const [cx, cy] = S([3.4, 0.55, 3.5]);
          return (
            <path key={i} d={`M${cx},${cy} q${a * 0.4},-20 ${a},-${34 + (i % 2) * 12}`} fill="none" stroke={shade(p.gold, -0.35)} strokeWidth={6} strokeLinecap="round">
              <animateTransform attributeName="transform" type="rotate" values={`0 ${f(cx)} ${f(cy)};${i % 2 ? 3 : -3} ${f(cx)} ${f(cy)};0 ${f(cx)} ${f(cy)}`} dur="3s" begin={`${-i * 0.4}s`} repeatCount="indefinite" />
            </path>
          );
        })}
        {/* past ledgers: a stack with dated spines */}
        {spines.map((d, k) => {
          const z = 3 + (spines.length - 1 - k) * 0.3;
          const x = 6.6 + ((k * 13) % 3) * 0.06;
          const c = [leather, shade(p.desk, 0.25), shade(p.gold, -0.45), shade(p.desk, 0.1)][k % 4];
          return (
            <g key={d + k}>
              <IsoBox x={x} y={0.3} w={1.8} d={1.2} h={0.28} z={z} color={c} u={U} ink={ink} />
              <polyline points={poly([[x + 0.08, 1.501, z + 0.06], [x + 0.08, 1.501, z + 0.22]])} stroke={p.gold} strokeWidth={2} />
              <polyline points={poly([[x + 1.72, 1.501, z + 0.06], [x + 1.72, 1.501, z + 0.22]])} stroke={p.gold} strokeWidth={2} />
              <g transform={yPlane([x + 0.24, 1.501, z + 0.2])}>
                <text x={0} y={0} fontFamily={MONO} fontSize={10} fontWeight={700} fill={p.gold} letterSpacing="1.5">
                  {d}
                </text>
              </g>
            </g>
          );
        }).reverse()}

        {/* ── the open ledger ── */}
        <IsoBox x={BOOK.x0} y={BOOK.y0} w={BOOK.x1 - BOOK.x0} d={BOOK.y1 - BOOK.y0} h={0.1} z={3} color={leather} u={U} ink={ink} />
        <IsoBox x={BOOK.x0 + 0.1} y={BOOK.y0 + 0.1} w={SPINE - BOOK.x0 - 0.1} d={BOOK.y1 - BOOK.y0 - 0.2} h={0.14} z={3.1} color={p.paper} u={U} ink={ink} />
        <IsoBox x={SPINE} y={BOOK.y0 + 0.1} w={BOOK.x1 - SPINE - 0.1} d={BOOK.y1 - BOOK.y0 - 0.2} h={0.14} z={3.1} color={p.paper} u={U} ink={ink} />
        {/* page edges: thin lines on the front block */}
        {[0.035, 0.07, 0.105].map((k) => (
          <polyline key={k} points={poly([[BOOK.x0 + 0.1, BOOK.y1 - 0.1, 3.1 + k], [BOOK.x1 - 0.1, BOOK.y1 - 0.1, 3.1 + k]])} stroke={paperEdge} strokeWidth={0.8} />
        ))}
        {/* left page: header and rows */}
        <g transform={ground([BOOK.x0 + 0.25, BOOK.y0 + 0.25, BOOK.z + 0.002])}>
          <text x={0} y={10} fontFamily={MONO} fontSize={7.2} fontWeight={700} fill={p.outline} letterSpacing="0.6">
            {p.header}
          </text>
          <line x1={0} y1={15} x2={1.65 * U} y2={15} stroke={p.gold} strokeWidth={1.6} />
          {rows.map((r, i) => {
            const [name, amt] = r.split(/\s+/);
            return (
              <g key={i}>
                <text x={0} y={30 + i * 15} fontFamily={MONO} fontSize={7.5} fill={p.outline}>
                  {name}
                </text>
                <text x={1.65 * U} y={30 + i * 15} textAnchor="end" fontFamily={MONO} fontSize={7.5} fill={p.outline}>
                  {amt}
                </text>
                <line x1={0} y1={34 + i * 15} x2={1.65 * U} y2={34 + i * 15} stroke={p.gold} strokeWidth={0.6} opacity={0.6} />
              </g>
            );
          })}
        </g>
        {/* right page: columns, figures and the total */}
        <g transform={ground([SPINE + 0.2, BOOK.y0 + 0.25, BOOK.z + 0.002])}>
          {[0.55, 1.1].map((k) => (
            <line key={k} x1={k * U} y1={4} x2={k * U} y2={2.2 * U} stroke={p.gold} strokeWidth={0.7} opacity={0.6} />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <g key={i}>
              <line x1={0} y1={14 + i * 15} x2={1.65 * U} y2={14 + i * 15} stroke={p.gold} strokeWidth={0.6} opacity={0.5} />
              <rect x={4} y={6 + i * 15} width={14 + ((i * 7) % 5) * 3} height={3} fill={p.outline} opacity={0.45} />
              <rect x={0.55 * U + 4} y={6 + i * 15} width={12 + ((i * 3) % 4) * 3} height={3} fill={p.outline} opacity={0.45} />
              <text x={1.65 * U} y={11 + i * 15} textAnchor="end" fontFamily={MONO} fontSize={6.5} fill={i % 3 === 1 ? shade(p.gold, -0.35) : p.outline}>
                {i % 3 === 1 ? '▲' : ''}
                {(1.2 + ((i * 17) % 9) * 0.4).toFixed(1)}
              </text>
            </g>
          ))}
          <line x1={0} y1={2.15 * U - 18} x2={1.65 * U} y2={2.15 * U - 18} stroke={p.gold} strokeWidth={1.6} />
          <line x1={0} y1={2.15 * U - 15} x2={1.65 * U} y2={2.15 * U - 15} stroke={p.gold} strokeWidth={1.6} />
          <text x={1.65 * U} y={2.15 * U} textAnchor="end" fontFamily={FONTS.archivo} fontSize={12} fill={p.outline}>
            {p.total}
          </text>
        </g>
        {/* gutter shadow */}
        <polygon points={poly([[SPINE - 0.25, BOOK.y0 + 0.1, BOOK.z + 0.003], [SPINE + 0.25, BOOK.y0 + 0.1, BOOK.z + 0.003], [SPINE + 0.25, BOOK.y1 - 0.1, BOOK.z + 0.003], [SPINE - 0.25, BOOK.y1 - 0.1, BOOK.z + 0.003]])} fill="#000" opacity={0.12} />
        {/* ribbon bookmark */}
        <polygon points={poly([[SPINE + 0.02, BOOK.y1 - 0.1, BOOK.z], [SPINE + 0.14, BOOK.y1 - 0.1, BOOK.z], [SPINE + 0.2, BOOK.y1 + 0.5, 3.0], [SPINE + 0.08, BOOK.y1 + 0.42, 3.0]])} fill={p.gold} stroke={p.outline} strokeWidth={0.8} />

        {/* the stamp mark: visible from the thump until the next page turn */}
        <g transform={ground(MARK)}>
          <g transform="rotate(-8)">
            <g opacity={1}>
              <animate attributeName="opacity" {...moment('1;1;0;0;1;1', '0;0.45;0.451;0.72;0.721;1')} />
              <animateTransform attributeName="transform" type="scale" {...moment('1;1;1.35;1;1', '0;0.72;0.721;0.76;1')} />
              <rect x={-52} y={-15} width={104} height={30} rx={3} fill="none" stroke={p.gold} strokeWidth={2.6} />
              <rect x={-48} y={-11} width={96} height={22} rx={2} fill="none" stroke={p.gold} strokeWidth={1} />
              <text x={0} y={4} textAnchor="middle" fontFamily={FONTS.archivo} fontSize={11} fill={p.gold} letterSpacing="0.5">
                {p.stamp} ✓
              </text>
            </g>
            {/* impact ring */}
            <ellipse rx={50} ry={20} fill="none" stroke={p.gold} strokeWidth={2} opacity={0}>
              <animate attributeName="opacity" {...moment('0;0;0.9;0;0', '0;0.72;0.721;0.8;1')} />
              <animate attributeName="rx" {...moment('50;50;56;110;110', '0;0.72;0.721;0.8;1')} />
              <animate attributeName="ry" {...moment('20;20;22;48;48', '0;0.72;0.721;0.8;1')} />
            </ellipse>
          </g>
        </g>

        {/* the turning page: lifts off the right page, arcs over the spine, settles on the left */}
        <polygon points={flipSteps[0]} fill={shade(p.paper, -0.04)} stroke={p.outline} strokeWidth={1} opacity={0}>
          <animate attributeName="points" values={[flipSteps[0], ...flipSteps, flipSteps[flipSteps.length - 1]].join(';')} keyTimes={['0', ...flipTimes.map(String), '1'].join(';')} dur={`${LOOP}s`} repeatCount="indefinite" calcMode="linear" />
          <animate attributeName="opacity" {...moment('0;0;1;1;0;0', '0;0.449;0.45;0.56;0.62;1')} />
        </polygon>

        {/* fountain pen in front of the ledger */}
        {(() => {
          const [ax, ay] = S([2.7, 4.75, 3.06]);
          const [bx, by] = S([5.4, 4.55, 3.06]);
          const [cx, cy] = S([4.85, 4.59, 3.06]);
          return (
            <g>
              <line x1={ax + 6} y1={ay + 8} x2={bx + 6} y2={by + 8} stroke="#000" strokeWidth={8} opacity={0.3} filter="url(#mc-soft)" />
              <line x1={ax} y1={ay} x2={bx} y2={by} stroke={p.outline} strokeWidth={9} strokeLinecap="round" />
              <line x1={ax} y1={ay} x2={bx} y2={by} stroke={shade(p.desk, 0.15)} strokeWidth={6.5} strokeLinecap="round" />
              <line x1={cx} y1={cy} x2={bx} y2={by} stroke={p.gold} strokeWidth={4} strokeLinecap="round" />
              <line x1={ax + 6} y1={ay - 1} x2={cx} y2={cy - 2} stroke="#ffffff" strokeWidth={1.2} opacity={0.3} />
              <polygon points={`${ax},${ay - 3} ${ax - 12},${ay + 2} ${ax},${ay + 4}`} fill={p.gold} stroke={p.outline} strokeWidth={1} />
            </g>
          );
        })()}

        {/* the rubber stamp: rests by the lamp, lifts, crosses and thumps on the moment */}
        <g>
          <animateTransform attributeName="transform" type="translate" {...moment(`0 0;0 0;0 -70;${f(dx)} ${f(dy - 70)};${f(dx)} ${f(dy)};${f(dx)} ${f(dy)};${f(dx)} ${f(dy - 60)};0 -40;0 0`, kStamp)} />
          <ellipse cx={S([STAMP_REST[0] + 0.3, STAMP_REST[1] + 0.3, 3])[0]} cy={S([STAMP_REST[0] + 0.3, STAMP_REST[1] + 0.3, 3])[1] + 4} rx={30} ry={11} fill="#000" opacity={0.35} filter="url(#mc-soft)" />
          <IsoBox x={STAMP_REST[0]} y={STAMP_REST[1]} w={0.6} d={0.6} h={0.08} z={3} color={shade(p.gold, -0.6)} u={U} ink={ink} />
          <IsoBox x={STAMP_REST[0]} y={STAMP_REST[1]} w={0.6} d={0.6} h={0.18} z={3.08} color={p.gold} u={U} ink={ink} />
          <IsoCylinder x={STAMP_REST[0] + 0.3} y={STAMP_REST[1] + 0.3} z={3.26} r={0.09} h={0.4} color={shade(p.desk, 0.25)} u={U} ink={ink} />
          {(() => {
            const [kx, ky] = S([STAMP_REST[0] + 0.3, STAMP_REST[1] + 0.3, 3.78]);
            return (
              <g>
                <ellipse cx={kx} cy={ky} rx={15} ry={13} fill={shade(p.desk, 0.3)} stroke={p.outline} strokeWidth={1.2} />
                <ellipse cx={kx - 4} cy={ky - 4} rx={5} ry={3.5} fill="#ffffff" opacity={0.3} />
              </g>
            );
          })()}
        </g>

        {/* ── phone: the morning result arrives ── */}
        <ellipse cx={S([PHONE.x + PHONE.w / 2, PHONE.y + PHONE.d / 2, 3])[0]} cy={S([PHONE.x + PHONE.w / 2, PHONE.y + PHONE.d / 2, 3])[1] + 7} rx={78} ry={24} fill="#000" opacity={0.35} filter="url(#mc-soft)" />
        <g>
          <animateTransform attributeName="transform" type="translate" {...moment('0 0;0 0;-2 0;2 0;-2 0;2 0;0 0;0 0', '0;0.74;0.75;0.76;0.77;0.78;0.79;1')} />
          <IsoBox x={PHONE.x} y={PHONE.y} w={PHONE.w} d={PHONE.d} h={0.09} z={3} color={shade(p.outline, 0.25)} u={U} ink={ink} />
          <g transform={ground([PHONE.x + 0.08, PHONE.y + 0.08, 3.091])}>
            <g clipPath="url(#mc-phone)">
              <rect x={0} y={0} width={PH.w * U} height={PH.d * U} fill="url(#mc-screen)" />
              <rect x={0} y={0} width={PH.w * U} height={PH.d * U} fill={p.gold} opacity={0.12}>
                <animate attributeName="opacity" {...moment('0.12;0.12;0.6;0.12;0.12', '0;0.74;0.75;0.9;1')} />
              </rect>
              <text x={PH.w * U - 8} y={10} textAnchor="end" fontFamily={MONO} fontSize={5.5} fill={shade(p.paper, -0.3)}>
                06:00
              </text>
              <rect x={6} y={14} width={PH.w * U - 12} height={PH.d * U - 22} rx={5} fill={shade(p.outline, 0.25)} stroke={p.gold} strokeWidth={0.9} />
              <rect x={12} y={20} width={8} height={8} rx={1.5} fill={p.gold} />
              <text x={24} y={27} fontFamily={MONO} fontSize={6.2} fill={shade(p.paper, -0.15)} letterSpacing="0.4">
                {p.notifBody}
              </text>
              <text x={12} y={45} fontFamily={FONTS.archivo} fontSize={15} fill={p.gold} letterSpacing="-0.3">
                {p.notifTitle}
              </text>
            </g>
          </g>
          {/* buzz arcs */}
          {(() => {
            const [px, py] = S([PHONE.x + PHONE.w, PHONE.y + 0.1, 3.2]);
            return (
              <g fill="none" stroke={p.gold} strokeWidth={2} strokeLinecap="round" opacity={0}>
                <animate attributeName="opacity" {...moment('0;0;1;0;0', '0;0.74;0.75;0.86;1')} />
                <path d={`M${px + 8},${py - 14} q8,8 0,16`} />
                <path d={`M${px + 16},${py - 20} q12,14 0,28`} />
              </g>
            );
          })()}
        </g>

        {/* ── ticker printer spooling last night's trades ── */}
        <IsoBox x={7.5} y={2.4} w={1.3} d={1.1} h={0.7} z={3} color={shade(p.desk, 0.2)} u={U} ink={ink} />
        <IsoCylinder x={8.15} y={2.95} z={3.7} r={0.36} h={0.14} color={p.gold} u={U} ink={ink} />
        <IsoCylinder x={8.15} y={2.95} z={3.84} r={0.12} h={0.12} color={shade(p.desk, 0.35)} u={U} ink={ink} />
        <polyline points={poly([[7.5, 3.5, 3.6], [8.8, 3.5, 3.6], [8.8, 2.4, 3.6]])} fill="none" stroke={p.gold} strokeWidth={1.5} />
        <g transform={yPlane([7.58, 3.501, 3.25])}>
          <rect x={0} y={-6} width={10} height={6} fill={shade(p.outline, 0.1)} />
          <circle cx={4} cy={6} r={3.2} fill={p.gold}>
            <animate attributeName="opacity" values="1;0.25;1" dur="1s" repeatCount="indefinite" />
          </circle>
        </g>
        {/* the tape: out of the slot, across the desk, over the edge and curling on the rug */}
        <polygon points={poly([[7.8, 3.5, 3.25], [8.3, 3.5, 3.25], [8.3, 3.9, 3.01], [7.8, 3.9, 3.01]])} fill={p.paper} stroke={p.outline} strokeWidth={0.8} />
        <polygon points={poly([[7.8, 3.9, 3.01], [8.3, 3.9, 3.01], [8.3, 5.0, 3.01], [7.8, 5.0, 3.01]])} fill={p.paper} stroke={p.outline} strokeWidth={0.8} />
        <polygon points={poly([[7.8, 5.02, 3.0], [8.3, 5.02, 3.0], [8.3, 5.02, 1.3], [7.8, 5.02, 1.3]])} fill={shade(p.paper, -0.12)} stroke={p.outline} strokeWidth={0.8} />
        {(() => {
          const [ax, ay] = S([7.8, 5.02, 1.3]);
          const [bx, by] = S([8.3, 5.02, 1.3]);
          return (
            <path
              d={`M${f(ax)},${f(ay)} q-6,40 -40,52 q-26,6 -22,-14 q4,-14 18,-8 L${f(bx - 44 + 22 + 22)},${f(by - 2)} Z`}
              fill={shade(p.paper, -0.06)}
              stroke={p.outline}
              strokeWidth={0.8}
              strokeLinejoin="round"
            />
          );
        })()}
        <polyline
          points={poly([[8.05, 3.5, 3.25], [8.05, 3.9, 3.01], [8.05, 5.0, 3.01], [8.05, 5.02, 1.4]])}
          fill="none"
          stroke={p.outline}
          strokeWidth={4}
          strokeDasharray="3 5 10 4 6 6"
          opacity={0.55}
        >
          <animate attributeName="stroke-dashoffset" values="0;-34" dur="1s" repeatCount="indefinite" />
        </polyline>
        <polyline points={poly([[7.86, 3.9, 3.012], [7.86, 5.0, 3.012]])} stroke={p.gold} strokeWidth={1} opacity={0.8} />

        {/* ── coffee: saucer, cup, steam ── */}
        <ellipse cx={S([6.95, 4.2, 3])[0] - 6} cy={S([6.95, 4.2, 3])[1] + 8} rx={44} ry={17} fill="#000" opacity={0.35} filter="url(#mc-soft)" />
        <IsoCylinder x={6.95} y={4.2} z={3} r={0.58} h={0.05} color={p.paper} u={U} ink={ink} />
        {(() => {
          const [hx, hy] = S([7.32, 3.95, 3.42]);
          return <ellipse cx={hx + 8} cy={hy} rx={9} ry={11} fill="none" stroke={p.outline} strokeWidth={7} />;
        })()}
        {(() => {
          const [hx, hy] = S([7.32, 3.95, 3.42]);
          return <ellipse cx={hx + 8} cy={hy} rx={9} ry={11} fill="none" stroke={p.paper} strokeWidth={4.5} />;
        })()}
        <IsoCylinder x={6.95} y={4.2} z={3.05} r={0.37} h={0.62} color={p.paper} u={U} ink={ink} />
        {(() => {
          const [cx, cy] = S([6.95, 4.2, 3.67]);
          const [bx, by] = S([6.95, 4.2, 3.3]);
          const rx = 0.37 * U * 1.2247;
          const ry = 0.37 * U * 0.7071;
          return (
            <g>
              <path d={`M${f(bx - rx)},${f(by)} A${f(rx)},${f(ry)} 0 0 0 ${f(bx + rx)},${f(by)}`} fill="none" stroke={p.gold} strokeWidth={3} />
              <ellipse cx={cx} cy={cy + 1} rx={rx * 0.84} ry={ry * 0.8} fill={shade(p.gold, -0.72)} />
              <ellipse cx={cx - 5} cy={cy} rx={rx * 0.3} ry={ry * 0.2} fill={shade(p.gold, -0.35)} opacity={0.6} />
              {[0, 1, 2].map((k) => (
                <path key={k} d={`M${f(cx - 10 + k * 10)},${f(cy - 6)} q-9,-16 0,-32 q9,-16 0,-32`} fill="none" stroke={p.paper} strokeWidth={3.2} strokeLinecap="round" opacity={0}>
                  <animate attributeName="opacity" values="0;0.5;0" dur="3s" begin={`${-k}s`} repeatCount="indefinite" />
                  <animateTransform attributeName="transform" type="translate" values="0 6;0 -26" dur="3s" begin={`${-k}s`} repeatCount="indefinite" />
                </path>
              ))}
            </g>
          );
        })()}

        {/* motes in the window light */}
        {Array.from({ length: 12 }, (_, i) => {
          const [x0, y0] = S([4 + (i % 6) * 0.8, 1 + (i % 4) * 0.9, 4.2 + (i % 3) * 0.9]);
          const d = i % 2 ? '6s' : '3s';
          return (
            <circle key={i} cx={x0} cy={y0} r={1.7} fill={shade(p.sky, 0.6)} opacity={0}>
              <animate attributeName="cy" values={`${f(y0)};${f(y0 + 24)};${f(y0)}`} dur={d} begin={`${-i * 0.5}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;0.8;0" dur={d} begin={`${-i * 0.5}s`} repeatCount="indefinite" />
            </circle>
          );
        })}
      </g>

      <rect width={scene.width} height={scene.height} fill="url(#mc-vig)" />
    </svg>
  );
}
