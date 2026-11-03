import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoGrid, IsoWindow, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Flash Sale Fulfilment',
  description:
    'Landing-page hero for an online store’s flash sale: taps on a giant phone’s BUY button pop order capsules into a gachapon hopper, parcels ride a conveyor through a ribbon-wrap ring and a stamp press into a pastel delivery truck. Loops seamlessly.',
  tags: ['e-commerce', 'isometric', 'flash sale', 'fulfilment', 'delivery', 'landing page', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1, 0.6, 0.5 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  brand: text('Truck / brand').default('mochi mode'),
  saleLabel: text('Sale label').default('11.11'),
  price: text('Screen price').default('$35.60'),
  discount: text('Big tag').default('-60%'),
  stamp: text('Moment stamp').default('SOLD OUT'),
  skyTop: color('Sky top').default('#FDF3F8'),
  skyBottom: color('Sky bottom').default('#F7DDEB'),
  floor: color('Floor').default('#F4E4F0'),
  machine: color('Machines').default('#8A7BFF'),
  accent: color('Accent').default('#FF7EB6'),
  pop: color('LEDs / spark').default('#4FD1C5'),
  parcel: color('Parcels').default('#FFB3D4'),
  truck: color('Truck').default('#FFFFFF'),
  screen: color('Phone screen').default('#FFF8FB'),
  ink: color('Outline ink').default('#3A1F4A'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  lilac: { skyTop: '#E9E3F5', skyBottom: '#D6CCEC', floor: '#E2DAF2', machine: '#5E4AE3', accent: '#F49CBB', pop: '#2EC4B6', parcel: '#F7C6DA', ink: '#231942' },
  'sorbet dusk': { skyTop: '#FFB38A', skyBottom: '#FFEDE1', floor: '#FFD9C7', machine: '#7B2CBF', accent: '#FF4F6D', pop: '#FFB627', parcel: '#FFC9A8', truck: '#FFF6EE', ink: '#3D0E2A' },
  'night drop': { skyTop: '#0B0014', skyBottom: '#2A0548', floor: '#3A1460', machine: '#B026FF', accent: '#FF2E88', pop: '#FFD600', parcel: '#FF7EB6', truck: '#F4E8FF', screen: '#24003D', ink: '#0B0014', stamp: 'MIDNIGHT DROP' },
  brutal: { skyTop: '#FFFDF2', skyBottom: '#FFF3B0', floor: '#FFE45C', machine: '#5C8AFF', accent: '#FF5C8A', pop: '#00D1A0', parcel: '#FFFDF2', truck: '#FFFFFF', ink: '#000000' },
};

type P = z.infer<typeof schema>;

const U = 41; // pixels per world unit
const LOOP = scene.loop;
const C30 = Math.cos(Math.PI / 6);
const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;

// Centre the world (x 0..15.2, y 0..9.2, z -0.7..7.4) on the canvas.
const EXT = [S([0, 9.2, 0]), S([15.2, 0, 0]), S([0.4, 0.8, 7.4]), S([15.2, 9.2, -0.7])];
const OX = 600 - (EXT[0][0] + EXT[1][0]) / 2;
const OY = 462 - (EXT[2][1] + EXT[3][1]) / 2;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 110;
};

/** Content drawn in a left face (plane y = const): local x runs along +x, local y runs down. */
function OnLeft({ x, plane, z, children }: { x: number; plane: number; z: number; children: ReactNode }) {
  const [sx, sy] = S([x, plane, z]);
  return <g transform={`translate(${sx} ${sy}) matrix(${C30} 0.5 0 1 0 0)`}>{children}</g>;
}

/** Content drawn in a right face (plane x = const): local x runs along -y, local y runs down. */
function OnRight({ plane, y, z, children }: { plane: number; y: number; z: number; children: ReactNode }) {
  const [sx, sy] = S([plane, y, z]);
  return <g transform={`translate(${sx} ${sy}) matrix(${C30} -0.5 0 1 0 0)`}>{children}</g>;
}

/** Soft cast shadow on the floor (light from the upper left → shadows fall toward +x). */
function Shadow({ x, y, w, d, h }: { x: number; y: number; w: number; d: number; h: number }) {
  const l = h * 0.35;
  return <polygon points={poly([[x, y, 0.01], [x + w, y, 0.01], [x + w + l, y + d * 0.2, 0.01], [x + w + l, y + d + l * 0.3, 0.01], [x, y + d, 0.01]])} fill="#2a0f3a" opacity="0.16" filter="url(#ff-blur)" />;
}

/** A floating notched price tag in the sky. */
function SkyTag({ x, y, s, r, c, ink, dur, k }: { x: number; y: number; s: number; r: number; c: string; ink: string; dur: number; k: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -14;0 0" dur={`${dur}s`} begin={`-${k}s`} repeatCount="indefinite" {...spline} />
        <path d="M14,0 H60 V32 H14 L0,16 Z" fill={c} stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />
        <circle cx={11} cy={16} r={3.4} fill="#ffffff" stroke={ink} strokeWidth={1.6} />
        <text x={36} y={22} textAnchor="middle" fontFamily={FONTS.chakra} fontWeight={700} fontSize={15} fill={ink}>
          %
        </text>
      </g>
    </g>
  );
}

/** The parcel sprite at the world origin (centre of its footprint). Ribbon + stamp appear along the line. */
function Parcel({ p }: { p: P }) {
  const ink = { stroke: p.ink, strokeWidth: 1.3 };
  const h = 0.78;
  return (
    <g>
      <IsoBox x={-0.48} y={-0.48} z={0} w={0.96} d={0.96} h={h} color={p.parcel} u={U} ink={ink} />
      {/* tape seam before wrapping */}
      <polygon points={poly([[-0.48, -0.05, h], [0.48, -0.05, h], [0.48, 0.05, h], [-0.48, 0.05, h]])} fill={shade(p.parcel, -0.2)} />
      {/* ribbon, switched on when the parcel passes the wrap ring */}
      <g opacity="0">
        <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.44;0.45;1" dur={`${LOOP}s`} repeatCount="indefinite" />
        <polygon points={poly([[-0.09, -0.48, h + 0.005], [0.09, -0.48, h + 0.005], [0.09, 0.48, h + 0.005], [-0.09, 0.48, h + 0.005]])} fill={p.machine} stroke={p.ink} strokeWidth={0.8} />
        <polygon points={poly([[-0.09, 0.48, 0], [0.09, 0.48, 0], [0.09, 0.48, h], [-0.09, 0.48, h]])} fill={shade(p.machine, -0.2)} stroke={p.ink} strokeWidth={0.8} />
        <polygon points={poly([[0.48, -0.09, 0], [0.48, 0.09, 0], [0.48, 0.09, h], [0.48, -0.09, h]])} fill={shade(p.machine, -0.1)} stroke={p.ink} strokeWidth={0.8} />
        {(() => {
          const [bx, by] = S([0, 0, h]);
          return (
            <g stroke={p.ink} strokeWidth={1}>
              <ellipse cx={bx - 6} cy={by - 4} rx={6} ry={4} fill={p.machine} transform={`rotate(-25 ${bx - 6} ${by - 4})`} />
              <ellipse cx={bx + 6} cy={by - 4} rx={6} ry={4} fill={p.machine} transform={`rotate(25 ${bx + 6} ${by - 4})`} />
              <circle cx={bx} cy={by - 3} r={2.6} fill={shade(p.machine, 0.25)} />
            </g>
          );
        })()}
      </g>
      {/* stamp, applied under the press */}
      <g opacity="0">
        <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.735;0.74;1" dur={`${LOOP}s`} repeatCount="indefinite" />
        <OnRight plane={0.485} y={0.4} z={0.62}>
          <rect x={5} y={4} width={24} height={14} rx={3} fill="none" stroke={p.accent} strokeWidth={2.2} transform="rotate(-8 17 11)" />
          <text x={17} y={15} textAnchor="middle" fontFamily={FONTS.chakra} fontWeight={700} fontSize={8} fill={p.accent} transform="rotate(-8 17 11)">
            {p.saleLabel}
          </text>
        </OnRight>
      </g>
    </g>
  );
}

export default function FlashSaleFulfilment(p: P) {
  const night = isDark(p.skyTop);
  const INK = p.ink;
  const ink = { stroke: INK, strokeWidth: 1.3 };
  const metal = shade(p.machine, -0.05);
  const frameC = night ? shade(p.floor, 0.25) : shade(p.ink, 0.55);

  // Key screen points
  const BELT_Z = 1.0;
  const start: P3 = [3.3, 6.3, BELT_Z];
  const [p0x, p0y] = S(start);
  const [p1x, p1y] = S([11.3, 6.3, BELT_Z]);
  const [btnX, btnY] = S([1.0, 2.9, 1.55]); // BUY button on the phone screen
  const [domeX, domeY] = S([3.3, 6.3, 3.75]); // gachapon dome centre
  const [scrX, scrY] = S([1.0, 2.85, 3.6]); // screen centre (moment ring)
  const [stX, stY] = S([9.2, 6.3, 3.05]); // stamp press head rest

  // The moment: 0.74–0.86 of the loop (with the 3rd stamp of the cycle).
  const mT = '0;0.735;0.745;0.77;0.8;0.86;1';

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="ff-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id="ff-sun">
          <stop offset="0" stopColor={p.accent} stopOpacity={night ? 0.55 : 0.4} />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ff-sun2">
          <stop offset="0" stopColor={p.machine} stopOpacity={night ? 0.5 : 0.28} />
          <stop offset="1" stopColor={p.machine} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ff-glass" cx="0.35" cy="0.3">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.6" stopColor={p.skyBottom} stopOpacity="0.35" />
          <stop offset="1" stopColor={p.machine} stopOpacity="0.35" />
        </radialGradient>
        <filter id="ff-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="ff-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <clipPath id="ff-belt">
          <polygon points={poly([[2.6, 5.65, BELT_Z], [11.6, 5.65, BELT_Z], [11.6, 6.95, BELT_Z], [2.6, 6.95, BELT_Z]])} transform={`translate(${OX} ${OY})`} />
        </clipPath>
        <clipPath id="ff-dome">
          <circle cx={domeX + OX} cy={domeY + OY} r={41} />
        </clipPath>
      </defs>

      {/* ── Sky ── */}
      <rect width="1200" height="900" fill="url(#ff-sky)" />
      <circle cx="1010" cy="170" r="330" fill="url(#ff-sun)" />
      <circle cx="170" cy="760" r="360" fill="url(#ff-sun2)" />
      <g fill={night ? '#ffffff' : p.machine}>
        {Array.from({ length: 34 }, (_, i) => (
          <circle key={i} cx={rand(i * 3.3) * 1200} cy={rand(i * 7.1) * 520} r={0.8 + rand(i * 1.7) * 1.8} opacity="0.5">
            <animate attributeName="opacity" values="0.15;0.8;0.15" dur={`${[2, 3, 6][i % 3]}s`} begin={`-${(rand(i * 5.5) * 3).toFixed(2)}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </g>
      {/* chevron hazard strip across the sky */}
      <g opacity={night ? 0.5 : 0.35}>
        <rect x="-20" y="64" width="1240" height="20" fill="none" stroke={p.machine} strokeWidth="1.5" />
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 0;-24 0" dur="1s" repeatCount="indefinite" />
          {Array.from({ length: 56 }, (_, i) => (
            <polygon key={i} points={`${i * 24},84 ${i * 24 + 10},84 ${i * 24 + 22},64 ${i * 24 + 12},64`} fill={p.machine} />
          ))}
        </g>
      </g>
      <SkyTag x={90} y={150} s={1.1} r={-14} c={p.accent} ink={INK} dur={3} k={0} />
      <SkyTag x={300} y={70} s={0.8} r={10} c={p.pop} ink={INK} dur={2} k={0.7} />
      <SkyTag x={780} y={120} s={0.9} r={-8} c={p.parcel} ink={INK} dur={3} k={1.4} />
      <SkyTag x={1100} y={420} s={0.85} r={16} c={p.pop} ink={INK} dur={6} k={2} />
      {/* Big floating sale tag (top right), swaying on its string */}
      <g transform="translate(868 128)">
        <g>
          <animateTransform attributeName="transform" type="rotate" values="-5 60 -40;4 60 -40;-5 60 -40" dur="3s" repeatCount="indefinite" {...spline} />
          <path d="M60,-40 C70,0 40,30 38,62" fill="none" stroke={INK} strokeWidth="2" />
          <g transform="translate(-8 60) rotate(-12)">
            <path d="M44,0 H224 V96 H44 L0,48 Z" transform="translate(8 8)" fill={INK} stroke={INK} strokeWidth="6" strokeLinejoin="round" />
            <path d="M44,0 H224 V96 H44 L0,48 Z" fill={p.accent} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
            <path d="M48,8 H216 V88 H48 L12,48 Z" fill="none" stroke={INK} strokeOpacity="0.35" strokeWidth="1.6" strokeDasharray="5 4" />
            <circle cx={30} cy={48} r={8} fill={p.skyTop} stroke={INK} strokeWidth="2.4" />
            <text x={136} y={70} textAnchor="middle" fontFamily={FONTS.chakra} fontStyle="italic" fontWeight={700} fontSize="58" fill={INK} letterSpacing="-2">
              {p.discount}
            </text>
            <text x={60} y={22} fontFamily={FONTS.majormono} fontSize="10" fill={INK} opacity="0.8" letterSpacing="1">
              {p.saleLabel} flash sale
            </text>
          </g>
        </g>
      </g>

      {/* ── World (floats gently) ── */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -6;0 0" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
        <g transform={`translate(${OX} ${OY})`}>
          {/* Floor slab */}
          <ellipse cx={S([7.6, 4.6, 0])[0]} cy={S([15, 9.2, -0.7])[1] + 40} rx="420" ry="40" fill="#2a0f3a" opacity="0.14" filter="url(#ff-blur)" />
          <IsoBox x={0} y={0} z={-0.7} w={15.2} d={9.2} h={0.7} color={p.floor} u={U} ink={ink} />
          <IsoGrid x={0} y={0} w={15} d={9} u={U} color={INK} opacity={0.08} />
          {/* hazard edge along the front */}
          <g>
            {Array.from({ length: 19 }, (_, i) => (
              <polygon key={i} points={poly([[i * 0.8, 9.2, -0.08], [i * 0.8 + 0.35, 9.2, -0.08], [i * 0.8 + 0.6, 9.2, -0.45], [i * 0.8 + 0.25, 9.2, -0.45]])} fill={p.machine} opacity="0.55" />
            ))}
          </g>
          {/* walkway stripe */}
          <polygon points={poly([[1.2, 7.9, 0.01], [14.4, 7.9, 0.01], [14.4, 8.1, 0.01], [1.2, 8.1, 0.01]])} fill={p.accent} opacity="0.5" />

          {/* ── Stock shelf at the back ── */}
          <Shadow x={4.6} y={0.6} w={6} d={1} h={3.4} />
          {[0, 1.15, 2.3].map((z, i) => (
            <g key={z}>
              <IsoBox x={4.6} y={0.6} z={z} w={6} d={1} h={0.12} color={frameC} u={U} ink={ink} />
              {Array.from({ length: 6 }, (_, k) => {
                const hgt = 0.55 + rand(i * 9 + k) * 0.4;
                const cols = [p.parcel, p.machine, p.accent, p.pop, p.screen];
                return <IsoBox key={k} x={4.75 + k * 0.97} y={0.72} z={z + 0.12} w={0.78} d={0.76} h={hgt} color={cols[(i + k * 2) % cols.length]} u={U} ink={ink} />;
              })}
            </g>
          ))}
          {[4.6, 10.5].map((x) => (
            <IsoBox key={x} x={x} y={1.5} z={0} w={0.1} d={0.1} h={3.4} color={frameC} u={U} ink={ink} />
          ))}

          {/* ── Neon sale billboard (back right) ── */}
          <Shadow x={11.9} y={2.0} w={3} d={0.3} h={2} />
          {[12.3, 14.4].map((x) => (
            <IsoBox key={x} x={x} y={2.05} z={0} w={0.16} d={0.16} h={2.0} color={frameC} u={U} ink={ink} />
          ))}
          <IsoBox x={11.9} y={1.95} z={1.9} w={3.0} d={0.3} h={1.75} color={p.machine} u={U} ink={ink} />
          <IsoWindow face="left" plane={2.25} a={12.05} z={2.02} w={2.7} h={1.5} fill={night ? '#12001F' : shade(p.machine, -0.4)} u={U} ink={ink} />
          <OnLeft x={12.15} plane={2.25} z={3.42}>
            <text x={4} y={30} fontFamily={FONTS.chakra} fontStyle="italic" fontWeight={700} fontSize={31} fill={p.accent} filter="url(#ff-glow)" letterSpacing="-1">
              {p.saleLabel}
              <animate attributeName="opacity" values="1;1;0.35;1;0.5;1;1" keyTimes="0;0.3;0.31;0.33;0.34;0.36;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            </text>
            <text x={5} y={48} fontFamily={FONTS.chakra} fontWeight={700} fontSize={12.5} fill={p.pop} letterSpacing="2.4" filter="url(#ff-glow)">
              FLASH SALE
            </text>
            {Array.from({ length: 6 }, (_, i) => (
              <circle key={i} cx={8 + i * 18} cy={56} r={2} fill={i % 2 ? p.accent : p.pop}>
                <animate attributeName="opacity" values="1;0.2;1" dur="1s" begin={`-${(i * 0.17).toFixed(2)}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </OnLeft>

          {/* ── Giant phone ── */}
          <Shadow x={0.4} y={0.8} w={0.6} d={4} h={7} />
          {/* kickstand */}
          <polygon points={poly([[-0.2, 2.4, 0], [0.4, 2.4, 3], [0.4, 3.2, 3], [-0.2, 3.2, 0]])} fill={shade(p.machine, -0.35)} stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
          <IsoBox x={0.4} y={0.8} z={0} w={0.6} d={4} h={7.2} color={p.machine} u={U} ink={ink} />
          <IsoWindow face="right" plane={1.0} a={1.05} z={0.35} w={3.5} h={6.5} fill={shade(p.machine, -0.45)} u={U} ink={ink} />
          <IsoWindow face="right" plane={1.0} a={1.15} z={0.45} w={3.3} h={6.3} fill={p.screen} u={U} ink={{ strokeWidth: 0 }} />
          {/* screen UI, drawn in the screen plane (local 122 × 233 px) */}
          <OnRight plane={1.0} y={4.45} z={6.75}>
            <rect x={0} y={0} width={122} height={14} fill={p.machine} opacity="0.18" />
            <text x={8} y={10.5} fontFamily={FONTS.chakra} fontWeight={700} fontSize={10} fill={night ? '#F4E8FF' : INK}>
              {p.brand}
            </text>
            <circle cx={112} cy={7} r={3.2} fill={p.pop}>
              <animate attributeName="opacity" values="1;0.2;1" dur="1s" repeatCount="indefinite" />
            </circle>
            <text x={8} y={36} fontFamily={FONTS.chakra} fontStyle="italic" fontWeight={700} fontSize={22} fill={p.accent}>
              {p.saleLabel}
            </text>
            <text x={8} y={47} fontFamily={FONTS.majormono} fontSize={7} fill={night ? '#F4E8FF' : INK} opacity="0.7">
              flash sale · ends 47:59
            </text>
            {/* product card */}
            <rect x={8} y={56} width={106} height={76} rx={8} fill={p.skyBottom} stroke={INK} strokeWidth={1.2} />
            <rect x={36} y={74} width={50} height={40} rx={8} fill={p.accent} stroke={INK} strokeWidth={1.4} />
            <rect x={42} y={78} width={38} height={26} rx={6} fill={shade(p.accent, 0.35)} />
            <rect x={78} y={60} width={32} height={14} rx={4} fill={p.machine} />
            <text x={94} y={70.5} textAnchor="middle" fontFamily={FONTS.chakra} fontWeight={700} fontSize={9} fill="#ffffff">
              -60%
            </text>
            <text x={8} y={152} fontFamily={FONTS.sora} fontSize={9} fill={night ? '#F4E8FF' : INK} opacity="0.75">
              Mochi Keycap Set
            </text>
            <text x={8} y={172} fontFamily={FONTS.chakra} fontWeight={700} fontSize={20} fill={night ? '#F4E8FF' : INK}>
              {p.price}
            </text>
            <text x={84} y={170} fontFamily={FONTS.sora} fontSize={10} fill={night ? '#F4E8FF' : INK} opacity="0.5" textDecoration="line-through">
              $89
            </text>
            {/* BUY button: pulses with each tap */}
            <rect x={8} y={186} width={106} height={30} rx={8} fill={p.accent} opacity="0.35">
              <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="x" values="8;2;8" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="width" values="106;118;106" dur="1.5s" repeatCount="indefinite" />
            </rect>
            <rect x={8} y={186} width={106} height={30} rx={8} fill={p.accent} stroke={INK} strokeWidth={1.4} />
            <text x={61} y={206} textAnchor="middle" fontFamily={FONTS.chakra} fontWeight={700} fontSize={13} fill={INK} letterSpacing="1">
              BUY NOW
            </text>
            {/* the moment: stamp slams across the screen */}
            <g opacity="0" transform="rotate(-14 61 120)">
              <animate attributeName="opacity" values="0;0;1;1;1;0;0" keyTimes={mT} dur={`${LOOP}s`} repeatCount="indefinite" />
              <rect x={-6} y={102} width={134} height={36} rx={6} fill={p.screen} stroke={p.accent} strokeWidth={4} />
              <text x={61} y={128} textAnchor="middle" fontFamily={FONTS.chakra} fontWeight={700} fontSize={p.stamp.length > 9 ? 13 : 19} fill={p.accent} letterSpacing="1">
                {p.stamp}
              </text>
            </g>
          </OnRight>
          {/* phone side buttons + camera */}
          <IsoWindow face="left" plane={4.8} a={0.55} z={5.2} w={0.3} h={0.9} fill={shade(p.machine, 0.3)} u={U} ink={ink} />
          {/* tap ripples on the BUY button */}
          {[0, 0.75].map((b) => (
            <ellipse key={b} cx={btnX} cy={btnY} rx="6" ry="6" fill="none" stroke={p.accent} strokeWidth="2.5">
              <animate attributeName="rx" values="4;30" dur="1.5s" begin={`-${b}s`} repeatCount="indefinite" />
              <animate attributeName="ry" values="4;30" dur="1.5s" begin={`-${b}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0" dur="1.5s" begin={`-${b}s`} repeatCount="indefinite" />
            </ellipse>
          ))}

          {/* ── Conveyor (frame, belt, rollers) ── */}
          <Shadow x={2.6} y={5.65} w={9} d={1.3} h={1} />
          {[3, 5.4, 8, 10.6].map((x) => (
            <IsoBox key={x} x={x} y={5.75} z={0} w={0.18} d={0.18} h={BELT_Z - 0.2} color={frameC} u={U} ink={ink} />
          ))}
          <IsoBox x={2.6} y={5.65} z={BELT_Z - 0.25} w={9} d={1.3} h={0.25} color={metal} u={U} ink={ink} />
          <polygon points={poly([[2.6, 5.65, BELT_Z], [11.6, 5.65, BELT_Z], [11.6, 6.95, BELT_Z], [2.6, 6.95, BELT_Z]])} fill={shade(p.ink, 0.3)} stroke={INK} strokeWidth="1.3" />
          <g clipPath="url(#ff-belt)" transform={`translate(${-OX} ${-OY})`}>
            <g transform={`translate(${OX} ${OY})`}>
              <g>
                <animateTransform attributeName="transform" type="translate" values={`0 0;${0.82 * C30 * U} ${0.41 * U}`} dur="0.6s" repeatCount="indefinite" />
                {Array.from({ length: 13 }, (_, i) => {
                  const x = 1.8 + i * 0.82;
                  return <polyline key={i} points={poly([[x, 5.65, BELT_Z], [x, 6.95, BELT_Z]])} stroke={shade(p.ink, 0.5)} strokeWidth="2" fill="none" />;
                })}
              </g>
            </g>
          </g>
          {/* rollers on the front face */}
          {[3.1, 4.5, 5.9, 7.3, 8.7, 10.1, 11.3].map((x, i) => (
            <OnLeft key={x} x={x} plane={6.95} z={BELT_Z - 0.125}>
              <circle r={0.11 * U} fill={shade(p.machine, 0.35)} stroke={INK} strokeWidth="1" />
              <g>
                <animateTransform attributeName="transform" type="rotate" values="0;360" dur="1s" begin={`-${(i * 0.13).toFixed(2)}s`} repeatCount="indefinite" />
                <line x1={-0.1 * U} y1="0" x2={0.1 * U} y2="0" stroke={INK} strokeWidth="1.2" />
              </g>
            </OnLeft>
          ))}

          {/* Hopper legs (back), stamp gantry back post */}
          {[
            [2.75, 5.4],
            [3.85, 5.4],
          ].map(([x, y]) => (
            <IsoBox key={`hb${x}`} x={x} y={y} z={0} w={0.16} d={0.16} h={2.3} color={frameC} u={U} ink={ink} />
          ))}
          <IsoBox x={9.05} y={5.25} z={0} w={0.3} d={0.25} h={3.4} color={p.machine} u={U} ink={ink} />

          {/* ── Parcels riding the belt (3 in flight, 2 s apart) ── */}
          {[0, 2, 4].map((b) => (
            <g key={b} opacity="0">
              <animateTransform attributeName="transform" type="translate" values={`${p0x} ${p0y};${p1x} ${p1y}`} dur={`${LOOP}s`} begin={`-${b}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.05;0.94;1" dur={`${LOOP}s`} begin={`-${b}s`} repeatCount="indefinite" />
              <Parcel p={p} />
            </g>
          ))}

          {/* ── Ribbon-wrap ring around the belt (in the plane x = 6.8) ── */}
          {(() => {
            const [rx, ry] = S([6.8, 6.3, 1.55]);
            return (
              <g>
                <IsoBox x={6.7} y={7.05} z={0} w={0.22} d={0.22} h={0.9} color={frameC} u={U} ink={ink} />
                <g transform={`translate(${rx} ${ry}) matrix(${C30} -0.5 0 1 0 0)`}>
                  <circle r={1.25 * U} fill="none" stroke={INK} strokeWidth="13" opacity="0.9" />
                  <circle r={1.25 * U} fill="none" stroke={p.machine} strokeWidth="10" />
                  <g>
                    <animateTransform attributeName="transform" type="rotate" values="0;360" dur="1s" repeatCount="indefinite" />
                    <circle r={1.25 * U} fill="none" stroke={p.accent} strokeWidth="5" strokeDasharray="14 22" />
                  </g>
                  <circle cx={0} cy={-1.25 * U} r="8" fill={p.pop} stroke={INK} strokeWidth="1.2" filter="url(#ff-glow)">
                    <Flicker dur={2} seed={3} low={0.4} />
                  </circle>
                </g>
              </g>
            );
          })()}

          {/* ── Stamp press: front post, beam, piston (slams as each parcel passes) ── */}
          <IsoBox x={9.05} y={7.05} z={0} w={0.3} d={0.25} h={3.4} color={p.machine} u={U} ink={ink} />
          <IsoBox x={8.95} y={5.2} z={3.4} w={0.5} d={2.15} h={0.42} color={shade(p.machine, 0.08)} u={U} ink={ink} />
          <OnLeft x={9.0} plane={7.35} z={3.72}>
            <text x={2} y={9} fontFamily={FONTS.majormono} fontSize={8} fill={night ? '#F4E8FF' : '#ffffff'}>
              stamp
            </text>
          </OnLeft>
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 0;0 0;0 26;0 26;0 0;0 0" keyTimes="0;0.15;0.2;0.25;0.36;1" dur="2s" repeatCount="indefinite" />
            <line x1={stX} y1={S([9.2, 6.3, 3.4])[1]} x2={stX} y2={stY} stroke={INK} strokeWidth="5" />
            <line x1={stX} y1={S([9.2, 6.3, 3.4])[1]} x2={stX} y2={stY} stroke={shade(p.machine, 0.4)} strokeWidth="2.5" />
            <IsoBox x={8.85} y={5.95} z={2.55} w={0.7} d={0.7} h={0.45} color={p.accent} u={U} ink={ink} />
          </g>
          {/* stamp impact spark */}
          <ellipse cx={S([9.2, 6.3, 1.85])[0]} cy={S([9.2, 6.3, 1.85])[1]} rx="10" ry="5" fill="none" stroke={p.pop} strokeWidth="3" opacity="0">
            <animate attributeName="rx" values="10;10;46;46" keyTimes="0;0.2;0.35;1" dur="2s" repeatCount="indefinite" />
            <animate attributeName="ry" values="5;5;23;23" keyTimes="0;0.2;0.35;1" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes="0;0.2;0.21;0.35;1" dur="2s" repeatCount="indefinite" />
          </ellipse>

          {/* ── Gachapon hopper over the belt start ── */}
          {[
            [2.75, 7.0],
            [3.85, 7.0],
          ].map(([x, y]) => (
            <IsoBox key={`hf${x}`} x={x} y={y} z={0} w={0.16} d={0.16} h={2.3} color={frameC} u={U} ink={ink} />
          ))}
          <IsoBox x={2.6} y={5.4} z={2.3} w={1.5} d={1.8} h={1.2} color={p.accent} u={U} ink={ink} />
          <IsoWindow face="left" plane={7.2} a={2.85} z={2.55} w={1.0} h={0.7} fill={shade(p.accent, 0.4)} u={U} ink={ink} />
          <OnLeft x={2.85} plane={7.2} z={3.25}>
            <text x={5} y={17} fontFamily={FONTS.chakra} fontWeight={700} fontSize={13} fill={INK}>
              ORDERS
            </text>
          </OnLeft>
          {[0, 1, 2].map((k) => {
            const [lx, ly] = S([4.1, 5.8 + k * 0.45, 3.2]);
            return (
              <circle key={k} cx={lx} cy={ly} r="3.6" fill={p.pop} stroke={INK} strokeWidth="1" filter="url(#ff-glow)">
                <animate attributeName="opacity" values="1;0.25;1" dur="1s" begin={`-${k * 0.33}s`} repeatCount="indefinite" />
              </circle>
            );
          })}
          <ellipse cx={domeX} cy={domeY + 30} rx="40" ry="14" fill={shade(p.machine, -0.1)} stroke={INK} strokeWidth="1.3" />
          {/* capsules tumbling inside the dome */}
          <g clipPath="url(#ff-dome)" transform={`translate(${-OX} ${-OY})`}>
            <g transform={`translate(${OX} ${OY})`}>
              {Array.from({ length: 9 }, (_, i) => {
                const cxp = domeX - 28 + (i % 4) * 18 + (i > 3 ? 8 : 0);
                const cyp = domeY + 20 - Math.floor(i / 4) * 16;
                const cols = [p.parcel, p.pop, p.machine, p.accent];
                return (
                  <g key={i}>
                    <animateTransform attributeName="transform" type="translate" values={`0 0;0 ${-4 - (i % 3) * 3};0 0`} dur={i % 2 ? '1s' : '1.5s'} begin={`-${(i * 0.17).toFixed(2)}s`} repeatCount="indefinite" />
                    <circle cx={cxp} cy={cyp} r="8.5" fill={cols[i % 4]} stroke={INK} strokeWidth="1" />
                    <path d={`M${cxp - 8.5},${cyp} A8.5,8.5 0 0 0 ${cxp + 8.5},${cyp} Z`} fill="#ffffff" opacity="0.75" />
                  </g>
                );
              })}
            </g>
          </g>
          <circle cx={domeX} cy={domeY} r="41" fill="url(#ff-glass)" stroke={INK} strokeWidth="1.4" />
          <ellipse cx={domeX - 14} cy={domeY - 18} rx="10" ry="6" fill="#ffffff" opacity="0.8" transform={`rotate(-30 ${domeX - 14} ${domeY - 18})`} />

          {/* order capsules arcing from the phone into the dome */}
          {[0, 0.5, 1].map((b) => (
            <g key={b} opacity="0">
              <animateMotion dur="1.5s" begin={`-${b}s`} repeatCount="indefinite" path={`M${btnX},${btnY - 10} Q${(btnX + domeX) / 2},${Math.min(btnY, domeY) - 170} ${domeX},${domeY - 34}`} />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="1.5s" begin={`-${b}s`} repeatCount="indefinite" />
              <circle r="8" fill={b === 0.5 ? p.pop : p.accent} stroke={INK} strokeWidth="1.2" />
              <path d="M-8,0 A8,8 0 0 0 8,0 Z" fill="#ffffff" opacity="0.8" />
            </g>
          ))}

          {/* ── Delivery truck (idling) ── */}
          <Shadow x={11.8} y={5.3} w={3.35} d={2} h={2.3} />
          <g>
            <animateTransform attributeName="transform" type="translate" values="0 0;0 -1.6;0 0" dur="0.5s" repeatCount="indefinite" />
            <IsoBox x={11.8} y={5.3} z={0.35} w={2.4} d={2.0} h={2.0} color={p.truck} u={U} ink={ink} />
            <polygon points={poly([[11.8, 7.3, 0.7], [14.2, 7.3, 0.7], [14.2, 7.3, 0.95], [11.8, 7.3, 0.95]])} fill={p.accent} stroke={INK} strokeWidth="1" />
            <polygon points={poly([[11.8, 7.3, 1.0], [14.2, 7.3, 1.0], [14.2, 7.3, 1.08], [11.8, 7.3, 1.08]])} fill={p.machine} />
            <OnLeft x={11.98} plane={7.3} z={2.2}>
              <text x={0} y={19} fontFamily={FONTS.chakra} fontWeight={700} fontSize={15} fill={INK === '#0B0014' ? '#24003D' : INK} letterSpacing="0.3">
                {p.brand}
              </text>
              <text x={1} y={31} fontFamily={FONTS.majormono} fontSize={7.5} fill={INK === '#0B0014' ? '#24003D' : INK} opacity="0.7">
                free shipping $35+
              </text>
            </OnLeft>
            <IsoBox x={14.2} y={5.5} z={0.35} w={0.95} d={1.6} h={1.4} color={p.accent} u={U} ink={ink} />
            <IsoWindow face="right" plane={15.15} a={5.68} z={1.05} w={1.25} h={0.55} fill={night ? p.pop : shade(p.skyBottom, -0.05)} u={U} ink={ink} />
            <IsoWindow face="left" plane={7.1} a={14.4} z={1.05} w={0.6} h={0.55} fill={night ? p.pop : shade(p.skyBottom, -0.05)} u={U} ink={ink} />
            {/* headlights */}
            {[5.75, 6.85].map((a, i) => {
              const [hx, hy] = S([15.16, a, 0.6]);
              return (
                <circle key={a} cx={hx} cy={hy} r="3.6" fill={p.pop} stroke={INK} strokeWidth="1" filter="url(#ff-glow)">
                  <animate attributeName="opacity" values="1;0.5;1" dur="1s" begin={`-${i * 0.5}s`} repeatCount="indefinite" />
                </circle>
              );
            })}
            {/* wheels on the visible side */}
            {[12.4, 14.65].map((x) => (
              <OnLeft key={x} x={x} plane={7.31} z={0.35}>
                <circle r={0.36 * U} fill={shade(p.ink, 0.15)} stroke={INK} strokeWidth="1.2" />
                <circle r={0.16 * U} fill={shade(p.machine, 0.5)} />
                <g>
                  <animateTransform attributeName="transform" type="rotate" values="0;360" dur="2s" repeatCount="indefinite" />
                  <line x1={-0.14 * U} y1="0" x2={0.14 * U} y2="0" stroke={INK} strokeWidth="1.4" />
                </g>
              </OnLeft>
            ))}
          </g>
          {/* exhaust puffs drifting back */}
          {[0, 1, 2].map((k) => {
            const [ex, ey] = S([11.75, 7.0, 0.45]);
            return (
              <circle key={k} cx={ex} cy={ey} r="5" fill={night ? '#cdb8ff' : '#ffffff'} stroke={INK} strokeOpacity="0.25" opacity="0">
                <animate attributeName="cx" values={`${ex};${ex - 46}`} dur="1.5s" begin={`-${k * 0.5}s`} repeatCount="indefinite" />
                <animate attributeName="cy" values={`${ey};${ey - 34}`} dur="1.5s" begin={`-${k * 0.5}s`} repeatCount="indefinite" />
                <animate attributeName="r" values="4;12" dur="1.5s" begin={`-${k * 0.5}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.85;0" dur="1.5s" begin={`-${k * 0.5}s`} repeatCount="indefinite" />
              </circle>
            );
          })}

          {/* ── Front props: control kiosk, parcel stack, cone ── */}
          <Shadow x={1.3} y={6.4} w={0.9} d={0.8} h={1.4} />
          <IsoBox x={1.3} y={6.4} z={0} w={0.9} d={0.8} h={1.3} color={p.screen} u={U} ink={ink} />
          <IsoWindow face="left" plane={7.2} a={1.42} z={0.75} w={0.66} h={0.42} fill={shade(p.ink, 0.25)} u={U} ink={ink} />
          <OnLeft x={1.45} plane={7.2} z={1.12}>
            <polyline points="2,10 7,6 11,8 16,2 22,4" fill="none" stroke={p.pop} strokeWidth="1.8">
              <animate attributeName="points" values="2,10 7,6 11,8 16,2 22,4;2,8 7,9 11,4 16,6 22,2;2,10 7,6 11,8 16,2 22,4" dur="2s" repeatCount="indefinite" />
            </polyline>
          </OnLeft>
          {[0, 1, 2].map((k) => {
            const [lx, ly] = S([1.5 + k * 0.25, 7.2, 0.45]);
            return (
              <circle key={k} cx={lx} cy={ly} r="2.8" fill={[p.accent, p.pop, p.machine][k]}>
                <Flicker dur={3} seed={k + 5} low={0.3} />
              </circle>
            );
          })}
          <Shadow x={12.2} y={8.0} w={1.6} d={0.9} h={1.2} />
          <IsoBox x={12.2} y={8.0} z={0} w={0.8} d={0.8} h={0.6} color={p.parcel} u={U} ink={ink} />
          <IsoBox x={13.05} y={8.05} z={0} w={0.7} d={0.7} h={0.5} color={shade(p.parcel, -0.08)} u={U} ink={ink} />
          <IsoBox x={12.35} y={8.1} z={0.6} w={0.6} d={0.6} h={0.45} color={p.machine} u={U} ink={ink} />
          {(() => {
            const [cxn, cyn] = S([6.0, 8.6, 0]);
            return (
              <g stroke={INK} strokeWidth="1.2" strokeLinejoin="round">
                <polygon points={`${cxn - 12},${cyn} ${cxn + 12},${cyn} ${cxn},${cyn - 34}`} fill={p.accent} />
                <polygon points={`${cxn - 7},${cyn - 13} ${cxn + 7},${cyn - 13} ${cxn + 4},${cyn - 21} ${cxn - 4},${cyn - 21}`} fill="#ffffff" strokeWidth="0" />
                <ellipse cx={cxn} cy={cyn} rx="16" ry="6" fill={shade(p.accent, -0.2)} />
              </g>
            );
          })()}

          {/* ── The moment: flash ring from the phone screen ── */}
          <ellipse cx={scrX} cy={scrY} rx="20" ry="20" fill="none" stroke={p.accent} strokeWidth="6" opacity="0">
            <animate attributeName="rx" values="20;20;20;220;260;260;20" keyTimes={mT} dur={`${LOOP}s`} repeatCount="indefinite" />
            <animate attributeName="ry" values="20;20;20;220;260;260;20" keyTimes={mT} dur={`${LOOP}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0;1;0.4;0;0;0" keyTimes={mT} dur={`${LOOP}s`} repeatCount="indefinite" />
          </ellipse>
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return (
              <rect key={i} x={scrX - 4} y={scrY - 2} width="8" height="4" rx="1" fill={[p.accent, p.pop, p.machine][i % 3]} opacity="0">
                <animateTransform attributeName="transform" type="translate" values={`0 0;0 0;0 0;${Math.cos(a) * 120} ${Math.sin(a) * 90 - 40};${Math.cos(a) * 150} ${Math.sin(a) * 90 + 10};0 0;0 0`} keyTimes={mT} dur={`${LOOP}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;0;1;1;0;0;0" keyTimes={mT} dur={`${LOOP}s`} repeatCount="indefinite" />
              </rect>
            );
          })}
        </g>
      </g>

      {/* Scene-wide flash on the moment */}
      <rect width="1200" height="900" fill={p.accent} opacity="0" style={{ mixBlendMode: night ? 'screen' : 'normal' }}>
        <animate attributeName="opacity" values="0;0;0.16;0.04;0;0;0" keyTimes={mT} dur={`${LOOP}s`} repeatCount="indefinite" />
      </rect>
    </svg>
  );
}
