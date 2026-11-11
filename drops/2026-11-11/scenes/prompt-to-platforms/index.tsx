import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoGrid, IsoWindow, iso, pts, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Prompt to Platforms',
  description:
    'Landing-page hero for Mimo: a giant chrome chat screen on a silver plinth. Mimo types, little ad cards fly along glowing rails to six platform kiosks (search, social, video, CTV, shop, audio) which light up as they land; then a pink "Launched" ping pops. Loops seamlessly.',
  tags: ['hero', 'isometric', 'landing page', 'ai agent', 'ads', 'animated svg', 'y2k'],
};

// Every SMIL duration divides this loop (8, 4, 2, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 8 };

export const schema = z.object({
  prompt1: text('Prompt line 1').default('Sell my $38 linen tote'),
  prompt2: text('Prompt line 2').default('in Austin. $150/day.'),
  reply: text('Mimo reply').default('Live on 6 platforms!'),
  launched: text('Moment pill').default('Launched ✓'),
  skyTop: color('Sky top').default('#EEF0F5'),
  skyBottom: color('Sky bottom').default('#C3C8D1'),
  plinth: color('Plinth').default('#C9CED8'),
  device: color('Device shell').default('#F1F3F8'),
  screen: color('Screen').default('#F7F8FB'),
  accent: color().default('#3D5AFE'),
  pop: color('Pop').default('#FF3DB4'),
  ink: color('Ink').default('#101219'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  night: { skyTop: '#0B0018', skyBottom: '#2A0A48', plinth: '#4A3A66', device: '#DCD6EA', screen: '#F4EEFF', accent: '#B026FF', pop: '#FFD600' },
  dusk: { skyTop: '#45293F', skyBottom: '#FF8E5E', plinth: '#B58F92', device: '#FFE9D6', screen: '#FFF6EE', accent: '#E5487A', pop: '#FFD27F' },
  lilac: { skyTop: '#F4F0FB', skyBottom: '#D6CCEC', plinth: '#C9BFE3', accent: '#5E4AE3', pop: '#2EC4B6' },
  frost: { skyTop: '#F4F7F9', skyBottom: '#D3DDE3', plinth: '#B9C7D0', accent: '#2F6F8F', pop: '#E4572E', reply: 'Booked on 6 channels!' },
};

type P = z.infer<typeof schema>;

const U = 45;
const LOOP = scene.loop;
const OX = 566;
const OY = 372;
const C30 = Math.cos(Math.PI / 6);
const INK = 'rgba(16,18,25,0.55)';

const S = (p: P3) => iso(p, U);
const poly = (ps: P3[]) => pts(ps, U);
/** Transform that maps flat 2D drawing (px) onto a left face (plane y = const), with its origin at world point `o`. */
const leftFace = (o: P3) => {
  const [x, y] = S(o);
  return `matrix(${C30} 0.5 0 1 ${x.toFixed(2)} ${y.toFixed(2)})`;
};
const rightFace = (o: P3) => {
  const [x, y] = S(o);
  return `matrix(${C30} -0.5 0 1 ${x.toFixed(2)} ${y.toFixed(2)})`;
};

const TOP = 0.6; // plinth top
const KW = 1.3; // kiosk footprint
const KH = 1.7; // kiosk height
const KIOSKS: { x: number; y: number; kind: number }[] = [
  { x: 0.2, y: 3.2, kind: 0 },
  { x: 3.6, y: 3.4, kind: 1 },
  { x: 7.0, y: 2.8, kind: 2 },
  { x: 9.4, y: 4.8, kind: 3 },
  { x: 1.6, y: 6.9, kind: 4 },
  { x: 5.6, y: 7.1, kind: 5 },
];
const CARD_DUR = 4;

/** Platform glyphs drawn flat (≈ 26 px) for a kiosk screen. */
function KioskGlyph({ kind, c, ink }: { kind: number; c: string; ink: string }) {
  switch (kind) {
    case 0: // search
      return (
        <g>
          <rect x={4} y={14} width={38} height={12} rx={6} fill="#ffffff" stroke={ink} strokeWidth={1.2} />
          <circle cx={34} cy={20} r={3} fill="none" stroke={c} strokeWidth={1.8} />
        </g>
      );
    case 1: // social heart
      return <path d="M23 32 C10 23 10 12 17 12 C20 12 22 14 23 16 C24 14 26 12 29 12 C36 12 36 23 23 32Z" fill={c} />;
    case 2: // video
      return (
        <g>
          <rect x={7} y={9} width={32} height={22} rx={6} fill={c} />
          <path d="M20 14 L29 20 L20 26Z" fill="#ffffff" />
        </g>
      );
    case 3: // CTV
      return (
        <g>
          <rect x={6} y={9} width={34} height={20} rx={3} fill={ink} />
          <rect x={9} y={12} width={28} height={14} rx={2} fill={c} />
          <path d="M17 33 L29 33" stroke={ink} strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    case 4: // shop bag
      return (
        <g>
          <path d="M11 15 H35 L33 34 H13Z" fill={c} />
          <path d="M17 16 C17 8 29 8 29 16" fill="none" stroke={ink} strokeWidth={1.8} />
        </g>
      );
    default: // audio bars
      return (
        <g fill={c}>
          {[0, 1, 2, 3, 4].map((i) => {
            const h = [10, 18, 24, 14, 8][i];
            return (
              <rect key={i} x={8 + i * 7} y={21 - h / 2} width={4} height={h} rx={2}>
                <animate attributeName="height" values={`${h};${h * 0.4};${h}`} dur="1s" begin={`-${i * 0.2}s`} repeatCount="indefinite" />
                <animate attributeName="y" values={`${21 - h / 2};${21 - h * 0.2};${21 - h / 2}`} dur="1s" begin={`-${i * 0.2}s`} repeatCount="indefinite" />
              </rect>
            );
          })}
        </g>
      );
  }
}

function Kiosk({ k, i, p }: { k: (typeof KIOSKS)[number]; i: number; p: P }) {
  const caps = [p.accent, p.pop, '#F4F6FA', p.accent, '#F4F6FA', p.pop];
  const cap = caps[i % caps.length];
  const begin = `-${((i * CARD_DUR) / KIOSKS.length).toFixed(3)}s`;
  const [tx, ty] = S([k.x + KW / 2, k.y + KW / 2, TOP + KH + 0.18]);
  return (
    <g>
      {/* cast shadow */}
      <polygon points={poly([[k.x, k.y + KW, TOP + 0.01], [k.x + KW, k.y + KW, TOP + 0.01], [k.x + KW + 0.3, k.y + KW + 1.2, TOP + 0.01], [k.x + 0.3, k.y + KW + 1.2, TOP + 0.01]])} fill="#30364A" opacity="0.18" filter="url(#ptp-blur)" />
      <IsoBox x={k.x} y={k.y} z={TOP} w={KW} d={KW} h={KH} color="#E7EAF0" u={U} ink={{ stroke: INK }} />
      {/* gel cap */}
      <IsoBox x={k.x - 0.06} y={k.y - 0.06} z={TOP + KH} w={KW + 0.12} d={KW + 0.12} h={0.18} color={cap} u={U} ink={{ stroke: INK }} />
      {/* screen on the left face */}
      <IsoWindow face="left" plane={k.y + KW} a={k.x + 0.12} z={TOP + 0.35} w={KW - 0.24} h={1.15} fill="#1B1F2B" u={U} ink={{ stroke: INK }} />
      <g transform={leftFace([k.x + 0.18, k.y + KW, TOP + 1.44])}>
        <rect x={0} y={0} width={(KW - 0.36) * U} height={1.03 * U} rx={5} fill={p.screen}>
          <Flicker dur={LOOP} seed={i + 3} low={0.82} />
        </rect>
        <g transform="translate(-1 0) scale(0.92)">
          <KioskGlyph kind={k.kind} c={i % 2 ? p.pop : p.accent} ink={p.ink} />
        </g>
      </g>
      {/* speaker slots on the right face */}
      <g transform={rightFace([k.x + KW, k.y + 0.25, TOP + 0.5])}>
        {[0, 1, 2].map((j) => (
          <rect key={j} x={j * 9} y={0} width={5} height={14} rx={2.5} fill={shade('#E7EAF0', -0.35)} />
        ))}
      </g>
      {/* landing pulse, timed with this kiosk's card */}
      <g transform={`translate(${tx} ${ty}) scale(1 0.5)`}>
        <circle r="6" fill="none" stroke={cap === '#F4F6FA' ? p.accent : cap} strokeWidth="3">
          <animate attributeName="r" values="6;6;6;46" keyTimes="0;0.84;0.86;1" dur={`${CARD_DUR}s`} begin={begin} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.84;0.86;1" dur={`${CARD_DUR}s`} begin={begin} repeatCount="indefinite" />
        </circle>
      </g>
    </g>
  );
}

/** A little ad card that flies from the screen to kiosk i. */
function FlyingCard({ i, p }: { i: number; p: P }) {
  const k = KIOSKS[i];
  const [sx, sy] = S([3.5, 0.75, 3.4]);
  const [ex, ey] = S([k.x + KW / 2, k.y + KW / 2, TOP + KH + 0.55]);
  const mx = (sx + ex) / 2;
  const my = Math.min(sy, ey) - 140;
  const path = `M${sx.toFixed(1)},${sy.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
  const begin = `-${((i * CARD_DUR) / KIOSKS.length).toFixed(3)}s`;
  const c = i % 2 ? p.pop : p.accent;
  return (
    <g>
      <path d={path} fill="none" stroke={c} strokeOpacity="0.18" strokeWidth="2" strokeDasharray="3 7" />
      <g opacity="0">
        <animateMotion path={path} dur={`${CARD_DUR}s`} begin={begin} repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;0.06;0.86;1" calcMode="spline" keySplines="0 0 1 1;0.45 0 0.4 1;0 0 1 1" />
        <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.1;0.82;0.87;1" dur={`${CARD_DUR}s`} begin={begin} repeatCount="indefinite" />
        <g>
          <animateTransform attributeName="transform" type="rotate" values="-8;6;-8" dur="2s" begin={begin} repeatCount="indefinite" />
          <rect x={-17} y={-12} width={34} height={24} rx={5} fill="#ffffff" stroke={INK} strokeWidth="1" />
          <rect x={-13} y={-8} width={14} height={16} rx={3} fill={c} />
          <rect x={4} y={-7} width={10} height={3} rx={1.5} fill={p.ink} opacity="0.7" />
          <rect x={4} y={-1} width={8} height={3} rx={1.5} fill={p.ink} opacity="0.35" />
          <rect x={4} y={4} width={9} height={4} rx={2} fill={c} />
        </g>
      </g>
    </g>
  );
}

function Sparkle({ x, y, s, c, dur, begin }: { x: number; y: number; s: number; c: string; dur: number; begin: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g>
        <animateTransform attributeName="transform" type="scale" values="0.3;1;0.3" dur={`${dur}s`} begin={begin} repeatCount="indefinite" />
        <path d={`M0 ${-s} C${s * 0.12} ${-s * 0.24} ${s * 0.24} ${-s * 0.12} ${s} 0 C${s * 0.24} ${s * 0.12} ${s * 0.12} ${s * 0.24} 0 ${s} C${-s * 0.12} ${s * 0.24} ${-s * 0.24} ${s * 0.12} ${-s} 0 C${-s * 0.24} ${-s * 0.12} ${-s * 0.12} ${-s * 0.24} 0 ${-s}Z`} fill={c} />
      </g>
    </g>
  );
}

export default function PromptToPlatforms(p: P) {
  const night = /^#[0-4]/.test(p.skyTop);
  // device: a giant chat screen standing at the back of the plinth
  const D = { x: 0, y: 0, w: 7, d: 0.7, z: TOP + 0.3, h: 6 };
  const scr = { a: 0.5, z: D.z + 0.45, w: 6.0, h: 5.05 };
  const SW = scr.w * U; // 252 px of flat screen width
  const SH = scr.h * U;
  const kioskOrder = KIOSKS.map((k, i) => ({ k, i })).sort((a, b) => a.k.x + a.k.y - (b.k.x + b.k.y));
  const [ringX, ringY] = S([3.5, 0.35, D.z + D.h + 0.7]);
  const [pillX, pillY] = S([6.2, 0.35, D.z + D.h + 1.4]);
  const devFoot = S([3.5, 0.7, TOP]);

  // rails from the device foot to each kiosk, drawn on the plinth top
  const rails = KIOSKS.map((k) => poly([[3.5, D.y + D.d + 0.5, TOP + 0.01], [3.5, k.y + KW / 2, TOP + 0.01], [k.x + KW / 2, k.y + KW / 2, TOP + 0.01]]));

  const stars: ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const dur = [2, 4, 8][i % 3];
    stars.push(<Sparkle key={i} x={60 + rand(i * 3.3) * 1080} y={30 + rand(i * 7.1) * 300} s={5 + rand(i * 1.7) * 9} c={i % 4 === 0 ? p.pop : night ? '#ffffff' : p.accent} dur={dur} begin={`-${(rand(i * 5.3) * dur).toFixed(2)}s`} />);
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${scene.width} ${scene.height}`}>
      <defs>
        <linearGradient id="ptp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id="ptp-orb" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor={shade(p.skyBottom, 0.2)} />
          <stop offset="1" stopColor={shade(p.skyBottom, -0.25)} />
        </radialGradient>
        <radialGradient id="ptp-glowA">
          <stop offset="0" stopColor={p.accent} stopOpacity="0.45" />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ptp-glowB">
          <stop offset="0" stopColor={p.pop} stopOpacity="0.35" />
          <stop offset="1" stopColor={p.pop} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ptp-chrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#C3C8D1" />
          <stop offset="1" stopColor="#8E95A3" />
        </linearGradient>
        <filter id="ptp-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="ptp-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      {/* sky + atmosphere */}
      <rect width="1200" height="900" fill="url(#ptp-sky)" />
      <circle cx="840" cy="300" r="420" fill="url(#ptp-glowA)" />
      <circle cx="260" cy="700" r="360" fill="url(#ptp-glowB)" />
      {/* chrome planet with a ring, Y2K screensaver style */}
      <g transform="translate(1010 150)">
        <g>
          <animateTransform attributeName="transform" type="translate" values="0 0;0 -10;0 0" dur="8s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1" />
          <ellipse rx="96" ry="24" fill="none" stroke={p.accent} strokeOpacity="0.5" strokeWidth="5" transform="rotate(-16)" />
          <circle r="54" fill="url(#ptp-orb)" />
          <path d="M-96 0 A96 24 0 0 0 96 0" fill="none" stroke={p.accent} strokeOpacity="0.8" strokeWidth="5" transform="rotate(-16)" />
        </g>
      </g>
      {stars}
      {/* rising bubbles */}
      {Array.from({ length: 9 }, (_, i) => {
        const x = 80 + rand(i * 9.7) * 1040;
        const r = 6 + rand(i * 2.1) * 14;
        return (
          <circle key={i} cx={x} cy={940} r={r} fill="url(#ptp-orb)" opacity="0.7">
            <animate attributeName="cy" values="940;-40" dur="8s" begin={`-${(rand(i * 4.4) * 8).toFixed(2)}s`} repeatCount="indefinite" />
          </circle>
        );
      })}

      <g transform={`translate(${OX} ${OY})`}>
        {/* plinth: chrome lip + slab */}
        <polygon points={poly([[-1.3, 9.8, -0.4], [11.6, 9.8, -0.4], [11.6, 10.6, -1.2], [-0.5, 10.6, -1.2]])} fill="#30364A" opacity="0.2" filter="url(#ptp-glow)" />
        <IsoBox x={-1.3} y={-1.1} z={-0.35} w={12.9} d={10.9} h={0.35} color={shade(p.plinth, -0.15)} u={U} ink={{ stroke: INK }} />
        <IsoBox x={-1} y={-0.8} z={0} w={12.3} d={10.3} h={TOP} color={p.plinth} u={U} ink={{ stroke: INK }} />
        <g transform={`translate(0 ${-TOP * U})`}>
          <IsoGrid x={-1} y={-0.8} w={12} d={10} u={U} color={p.ink} opacity={0.12} />
        </g>
        {/* front signage plate on the plinth's left face */}
        <g transform={leftFace([0.6, 9.5, TOP - 0.08])}>
          <rect x={0} y={0} width={5.2 * U} height={0.44 * U} rx={6} fill={p.ink} opacity="0.88" />
          <circle cx={14} cy={0.22 * U} r={5} fill={p.pop}>
            <animate attributeName="opacity" values="1;0.35;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x={28} y={0.22 * U + 5} fontFamily={FONTS.fredoka} fontWeight="600" fontSize="14" fill="#ffffff" letterSpacing="1.5">
            MIMO · 36 AD PLATFORMS · ONE CHAT
          </text>
        </g>
        {/* chrome edge highlight */}
        <polyline points={poly([[-1, 9.5, TOP], [11.3, 9.5, TOP], [11.3, -0.8, TOP]])} fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="2" />

        {/* rails with flowing dashes */}
        {rails.map((r, i) => (
          <g key={i}>
            <polyline points={r} fill="none" stroke={shade(p.plinth, -0.2)} strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
            <polyline points={r} fill="none" stroke={i % 2 ? p.pop : p.accent} strokeWidth="2.4" strokeDasharray="6 10" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" values="0;-32" dur="1s" repeatCount="indefinite" />
            </polyline>
          </g>
        ))}

        {/* device shadow + glow pool */}
        <polygon points={poly([[D.x, D.d, TOP + 0.01], [D.x + D.w, D.d, TOP + 0.01], [D.x + D.w + 0.6, D.d + 2.4, TOP + 0.01], [D.x + 0.6, D.d + 2.4, TOP + 0.01]])} fill="#30364A" opacity="0.2" filter="url(#ptp-blur)" />
        <ellipse cx={devFoot[0]} cy={devFoot[1] + 30} rx="200" ry="70" fill={p.accent} opacity="0.18" filter="url(#ptp-glow)">
          <animate attributeName="opacity" values="0.12;0.26;0.12" dur="4s" repeatCount="indefinite" />
        </ellipse>

        {/* device base + body */}
        <IsoBox x={D.x - 0.35} y={D.y - 0.3} z={TOP} w={D.w + 0.7} d={D.d + 0.9} h={0.3} color="#B8C0CC" u={U} ink={{ stroke: INK }} />
        <IsoBox x={D.x} y={D.y} z={D.z} w={D.w} d={D.d} h={D.h} color={p.device} u={U} ink={{ stroke: INK }} />
        {/* buttons on the right edge */}
        <g transform={rightFace([D.w, D.y + 0.12, D.z + D.h - 0.6])}>
          {[0, 1, 2].map((j) => (
            <rect key={j} x={0} y={j * 22} width={12} height={14} rx={6} fill={j === 0 ? p.pop : p.accent} />
          ))}
        </g>
        {/* screen bezel + screen */}
        <IsoWindow face="left" plane={D.d} a={scr.a - 0.15} z={scr.z - 0.15} w={scr.w + 0.3} h={scr.h + 0.3} fill="url(#ptp-chrome)" u={U} ink={{ stroke: INK }} />
        <IsoWindow face="left" plane={D.d} a={scr.a} z={scr.z} w={scr.w} h={scr.h} fill={p.screen} u={U} ink={{ stroke: INK }} />

        {/* flat chat UI mapped onto the screen */}
        <g transform={leftFace([scr.a, D.d, scr.z + scr.h])} fontFamily={FONTS.outfit}>
          <rect x={0} y={0} width={SW} height={26} fill={shade(p.screen, -0.08)} />
          {[p.pop, '#FFC94D', p.accent].map((c, j) => (
            <circle key={j} cx={12 + j * 12} cy={13} r={4} fill={c} />
          ))}
          <text x={SW / 2 + 16} y={17} fontSize="11" fontWeight="500" fill={p.ink} opacity="0.65" textAnchor="middle">
            Mimo · New campaign
          </text>
          {/* user prompt */}
          <rect x={SW - 188} y={38} width={176} height={46} rx={16} fill={p.accent} />
          <text x={SW - 176} y={57} fontSize="12.5" fontWeight="500" fill="#ffffff">
            {p.prompt1}
          </text>
          <text x={SW - 176} y={74} fontSize="12.5" fontWeight="500" fill="#ffffff">
            {p.prompt2}
          </text>
          {/* Mimo avatar */}
          <g transform="translate(20 116)">
            <ellipse rx="11" ry="13" fill="url(#ptp-chrome)" stroke={INK} strokeWidth="0.8" />
            <rect x={-6} y={-6} width={12} height={9} rx={2} fill="#1B1F2B" />
            <rect x={-3.5} y={-4} width={2} height={3} fill="#9FB0FF" />
            <rect x={1.5} y={-4} width={2} height={3} fill="#9FB0FF" />
          </g>
          {/* reply bubble: typing, then the reply at the moment */}
          <rect x={38} y={98} width={150} height={38} rx={14} fill="#ffffff" stroke={INK} strokeWidth="0.6" />
          <g>
            <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.68;0.7;0.98;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            {[0, 1, 2].map((j) => (
              <circle key={j} cx={64 + j * 14} cy={117} r={4.5} fill={p.accent}>
                <animate attributeName="cy" values="117;111;117;117" keyTimes="0;0.25;0.5;1" dur="1s" begin={`-${(1 - j * 0.15).toFixed(2)}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>
          <text x={50} y={122} fontSize="12.5" fontWeight="800" fill={p.ink} opacity="0">
            <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;0.69;0.71;0.97;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            {p.reply}
          </text>
          {/* platform chips lighting up in turn */}
          {['Search', 'Social', 'Video', 'CTV', 'Shop', 'Audio'].map((name, j) => {
            const x = 38 + (j % 3) * 62;
            const y = 148 + Math.floor(j / 3) * 22;
            const on = (0.1 + j * 0.1).toFixed(2);
            const on2 = (0.12 + j * 0.1).toFixed(2);
            return (
              <g key={j}>
                <rect x={x} y={y} width={56} height={17} rx={8.5} fill={j % 2 ? p.pop : p.accent} opacity="0.2">
                  <animate attributeName="opacity" values={`0.2;0.2;1;1;0.2`} keyTimes={`0;${on};${on2};0.97;1`} dur={`${LOOP}s`} repeatCount="indefinite" />
                </rect>
                <text x={x + 28} y={y + 12} fontSize="10" fontWeight="500" fill={p.ink} textAnchor="middle">
                  {name}
                </text>
              </g>
            );
          })}
          {/* launch progress */}
          <rect x={14} y={SH - 22} width={SW - 28} height={9} rx={4.5} fill={shade(p.screen, -0.12)} />
          <rect x={14} y={SH - 22} width={0} height={9} rx={4.5} fill={p.accent}>
            <animate attributeName="width" values={`0;${SW - 28};${SW - 28};0`} keyTimes="0;0.7;0.97;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          </rect>
        </g>

        {/* sync ring floating above the device */}
        <g transform={`translate(${ringX} ${ringY}) scale(1 0.5)`}>
          <circle r="54" fill="none" stroke={p.accent} strokeWidth="5" strokeDasharray="22 12" opacity="0.85">
            <animateTransform attributeName="transform" type="rotate" values="0;360" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle r="36" fill="none" stroke={p.pop} strokeWidth="3" strokeDasharray="8 10" opacity="0.8">
            <animateTransform attributeName="transform" type="rotate" values="360;0" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* kiosks, back to front */}
        {kioskOrder.map(({ k, i }) => (
          <Kiosk key={i} k={k} i={i} p={p} />
        ))}

        {/* budget coin stack on the front-right corner: a coin ticks up as spend is paced */}
        <polygon points={poly([[9.3, 8.1, TOP + 0.01], [10.1, 8.1, TOP + 0.01], [10.3, 9.1, TOP + 0.01], [9.5, 9.1, TOP + 0.01]])} fill="#30364A" opacity="0.18" filter="url(#ptp-blur)" />
        {[0, 1, 2, 3].map((j) => (
          <IsoCylinder key={j} x={9.7} y={7.7} z={TOP + j * 0.16} r={0.42} h={0.13} color={j % 2 ? '#E9ECF2' : '#C3C8D1'} u={U} ink={{ stroke: INK }} />
        ))}
        {(() => {
          const [cx, cy] = S([9.7, 7.7, TOP + 0.66]);
          return (
            <g transform={`translate(${cx} ${cy})`}>
              <g>
                <animateTransform attributeName="transform" type="translate" values="0 0;0 -46;0 -46" keyTimes="0;0.7;1" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;0" keyTimes="0;0.3;1" dur="2s" repeatCount="indefinite" />
                <ellipse rx={0.42 * U * 1.22} ry={0.42 * U * 0.7} fill={p.accent} stroke="#ffffff" strokeWidth="2" />
                <text y={5} textAnchor="middle" fontFamily={FONTS.fredoka} fontWeight="600" fontSize="15" fill="#ffffff">
                  $
                </text>
              </g>
            </g>
          );
        })()}

        {/* ad cards in flight */}
        {KIOSKS.map((_, i) => (
          <FlyingCard key={i} i={i} p={p} />
        ))}

        {/* the moment: a pink "Launched" ping pops above the device */}
        <g transform={`translate(${pillX} ${pillY})`}>
          <circle r="10" fill="none" stroke={p.pop} strokeWidth="4" opacity="0">
            <animate attributeName="r" values="10;10;10;130;130" keyTimes="0;0.7;0.71;0.84;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0;0.9;0;0" keyTimes="0;0.7;0.71;0.84;1" dur={`${LOOP}s`} repeatCount="indefinite" />
          </circle>
          <g>
            <animateTransform attributeName="transform" type="scale" values="0;0;1.18;1;1;0;0" keyTimes="0;0.7;0.73;0.76;0.94;0.97;1" dur={`${LOOP}s`} repeatCount="indefinite" />
            <rect x={-74} y={-24} width={148} height={48} rx={24} fill={p.pop} stroke="#ffffff" strokeWidth="3" />
            <path d="M-46 22 L-56 40 L-30 24Z" fill={p.pop} />
            <text x={0} y={8} textAnchor="middle" fontFamily={FONTS.fredoka} fontWeight="600" fontSize="22" fill="#ffffff">
              {p.launched}
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}
