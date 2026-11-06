import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, text, toggle } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoGrid, iso, rand, shade, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Creative Foundry',
  description:
    'Landing-page hero for an AI ad agent: a cheerful 70s machine in a sunset-lit hangar swallows one campaign brief and stamps out platform-ready creatives (9:16 story, 1:1 square, 16:9 wide, display banner) that ride a conveyor and get sorted into gate bins for TikTok, Meta, Google and CTV. Gears turn, gauges wobble, steam puffs; once per loop the press slams with a marigold burst and a fresh brief drops in.',
  tags: ['hero', 'isometric', 'machine', 'conveyor', 'ads', 'animated svg'],
};

// Every SMIL duration divides this loop (6, 3, 2, 1.5, 1, 0.75, 0.25 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  sign: text('Machine nameplate').default('CREATIVE FOUNDRY'),
  briefTitle: text('Brief title').default('BRIEF · Q4 SALE'),
  poster: text('Wall poster').default('1 BRIEF · 34 PLATFORMS'),
  gate1: text('Gate 1 (9:16)').default('TIKTOK'),
  gate2: text('Gate 2 (1:1)').default('META'),
  gate3: text('Gate 3 (banner)').default('GOOGLE'),
  gate4: text('Gate 4 (16:9)').default('CTV'),
  wall: color('Wall').default('#FFEDE1'),
  floor: color('Floor').default('#FFD3C2'),
  machine: color('Machine').default('#7B2CBF'),
  trim: color('Cream trim').default('#FFF6EF'),
  accent: color('Accent').default('#FF4F6D'),
  pop: color('Spark').default('#FFB627'),
  ink: color('Outline').default('#3D0E2A'),
  skyTop: color('Window sky top').default('#7B2CBF'),
  skyBottom: color('Window sky bottom').default('#FFB627'),
  night: toggle('Night shift').default(false),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'desert-dusk': { wall: '#45293F', floor: '#2B1B2E', machine: '#E5487A', trim: '#FFE9D6', accent: '#FF8E5E', pop: '#FFD27F', ink: '#1A0E1B', skyTop: '#2B1B2E', skyBottom: '#FF8E5E' },
  'citrus-pop': { wall: '#FFF8E1', floor: '#FFE9A8', machine: '#2BB24C', trim: '#FFFDF4', accent: '#FF7A00', pop: '#FF3D7F', ink: '#1C2B1A', skyTop: '#FF7A00', skyBottom: '#FFE9A8' },
  'lilac-haze': { wall: '#E9E3F5', floor: '#D6CCEC', machine: '#5E4AE3', trim: '#FBF8FF', accent: '#F49CBB', pop: '#2EC4B6', ink: '#231942', skyTop: '#5E4AE3', skyBottom: '#F49CBB' },
  'night-shift': { wall: '#2A1F45', floor: '#1C1533', machine: '#7B2CBF', trim: '#F6E9FF', accent: '#FF4F6D', pop: '#FFB627', ink: '#0E0819', skyTop: '#0B0820', skyBottom: '#3B1F5E', night: true },
};

type P = z.infer<typeof schema>;

const U = 48;
const LOOP = scene.loop;
const OX = 484;
const OY = 216;
const C30 = Math.cos(Math.PI / 6);
const MONO = FONTS.spacemono;

const S = (p: P3): [number, number] => {
  const [a, b] = iso(p, U);
  return [a + OX, b + OY];
};
const poly = (ps: P3[]) =>
  ps
    .map(S)
    .map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`)
    .join(' ');
/** Screen delta for a world delta. */
const dW = (dx: number, dy: number, dz: number): [number, number] => [(dx - dy) * C30 * U, ((dx + dy) / 2 - dz) * U];
/** Local drawing plane on a y = const face (a → +x, b → −z, U px per unit). */
const onY = (x: number, y: number, z: number) => {
  const [X, Y] = S([x, y, z]);
  return `matrix(${C30.toFixed(4)},0.5,0,1,${X.toFixed(1)},${Y.toFixed(1)})`;
};
/** Local drawing plane on an x = const face (a → −y, b → −z). */
const onX = (x: number, y: number, z: number) => {
  const [X, Y] = S([x, y, z]);
  return `matrix(${C30.toFixed(4)},-0.5,0,1,${X.toFixed(1)},${Y.toFixed(1)})`;
};
/** Ground plane (a → +x, b → +y). */
const onFloor = (x: number, y: number, z = 0) => {
  const [X, Y] = S([x, y, z]);
  return `matrix(${C30.toFixed(4)},0.5,${(-C30).toFixed(4)},0.5,${X.toFixed(1)},${Y.toFixed(1)})`;
};
const kt = (...ts: number[]) => ts.map((t) => Math.min(1, Math.max(0, t / LOOP)).toFixed(4)).join(';');
const rep = { repeatCount: 'indefinite' } as const;
const SOFT = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1', keyTimes: '0;0.5;1' } as const;

function Box(props: Omit<Parameters<typeof IsoBox>[0], 'u'>) {
  return (
    <g transform={`translate(${OX} ${OY})`}>
      <IsoBox u={U} {...props} />
    </g>
  );
}
function Cyl(props: Omit<Parameters<typeof IsoCylinder>[0], 'u'>) {
  return (
    <g transform={`translate(${OX} ${OY})`}>
      <IsoCylinder u={U} {...props} />
    </g>
  );
}

/** Soft cast shadow on the floor, thrown toward +y (window light comes from the back wall). */
function Shadow({ x, y, w, d, h, o = 0.2, p }: { x: number; y: number; w: number; d: number; h: number; o?: number; p: P }) {
  const l = h * 0.38;
  return <polygon points={poly([[x, y, 0.01], [x + w, y, 0.01], [x + w + l * 0.35, y + d + l, 0.01], [x + l * 0.35, y + d + l, 0.01]])} fill={p.ink} opacity={o} filter="url(#cf-blur)" />;
}

function gearPath(r: number, teeth: number) {
  const out: string[] = [];
  const ri = r * 0.78;
  const s = (Math.PI * 2) / teeth;
  const P = (rr: number, a: number) => `${(Math.cos(a) * rr).toFixed(2)},${(Math.sin(a) * rr).toFixed(2)}`;
  for (let i = 0; i < teeth; i++) {
    const a = i * s;
    out.push(P(ri, a), P(r, a + s * 0.18), P(r, a + s * 0.5), P(ri, a + s * 0.68));
  }
  return `M${out.join(' L')} Z`;
}

function Gear({ x, y, r, teeth, dur, rev, fill, p }: { x: number; y: number; r: number; teeth: number; dur: number; rev?: boolean; fill: string; p: P }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g>
        <animateTransform attributeName="transform" type="rotate" values={rev ? '360;0' : '0;360'} dur={`${dur}s`} {...rep} />
        <path d={gearPath(r, teeth)} fill={fill} stroke={p.ink} strokeWidth={1.2} strokeLinejoin="round" />
        <circle r={r * 0.42} fill={shade(fill, -0.25)} stroke={p.ink} strokeWidth={1} />
        <rect x={-r * 0.08} y={-r * 0.7} width={r * 0.16} height={r * 1.4} fill={shade(fill, -0.35)} />
        <circle r={r * 0.14} fill={p.ink} />
      </g>
    </g>
  );
}

function Bolt({ x, y, p, r = 1.8 }: { x: number; y: number; p: P; r?: number }) {
  return <circle cx={x} cy={y} r={r} fill={shade(p.trim, -0.2)} stroke={p.ink} strokeWidth={0.7} />;
}

/** Tiny Towline pennant logo. */
function Pennant({ x, y, s, fill, p }: { x: number; y: number; s: number; fill: string; p: P }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <line x1={0} y1={-1} x2={0} y2={10} stroke={p.ink} strokeWidth={1.2} strokeLinecap="round" />
      <path d="M0.6,0 L9,2.6 Q7,3.4 9,5.2 L0.6,6 Z" fill={fill} stroke={p.ink} strokeWidth={0.8} strokeLinejoin="round" />
    </g>
  );
}

// ── Creatives ──────────────────────────────────────────────────────────────
type Kind = 'story' | 'square' | 'banner' | 'wide';
const KINDS: { kind: Kind; w: number; h: number }[] = [
  { kind: 'story', w: 0.62, h: 1.1 },
  { kind: 'square', w: 0.95, h: 0.95 },
  { kind: 'banner', w: 1.12, h: 0.36 },
  { kind: 'wide', w: 1.2, h: 0.68 },
];
const BINS = [10.0, 11.7, 13.4, 15.1]; // gate bins, x origin (1.5 wide)
const BIN_W = 1.5;
const PRESS_X = 9.0; // press head centre
const BELT_Y = 5.1;
const BELT_Z = 1.25;
const SPEED = 1.6; // belt, units per second
const STAMP0 = 0.2; // first stamp of the loop
const STAMP = 0.75; // stamp period
const MOMENT = STAMP0 + 4 * STAMP; // 3.2 s: the big slam
const travel = (j: number) => (BINS[j] + BIN_W / 2 - PRESS_X) / SPEED;

function CardArt({ kind, W, H, bg, fg, sun, p }: { kind: Kind; W: number; H: number; bg: string; fg: string; sun: string; p: P }) {
  const line = { stroke: p.ink, strokeWidth: 0.9 };
  const disc = (cx: number, cy: number, r: number) => (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={sun} />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={cx - r - 1} y={cy + r * (0.12 + i * 0.3)} width={r * 2 + 2} height={r * (0.07 + i * 0.05)} fill={bg} />
      ))}
    </g>
  );
  switch (kind) {
    case 'story':
      return (
        <g>
          <rect width={W} height={H} rx={3} fill={bg} {...line} />
          <rect x={3} y={3} width={W - 6} height={1.6} rx={0.8} fill={fg} opacity={0.6} />
          {disc(W / 2, H * 0.36, W * 0.28)}
          <rect x={4} y={H * 0.6} width={W - 8} height={3} rx={1.5} fill={fg} />
          <rect x={4} y={H * 0.6 + 5} width={(W - 8) * 0.6} height={3} rx={1.5} fill={fg} opacity={0.8} />
          <rect x={4} y={H - 9} width={W - 8} height={5} rx={2.5} fill={p.ink} />
        </g>
      );
    case 'square':
      return (
        <g>
          <rect width={W} height={H} rx={2.5} fill={bg} {...line} />
          {disc(W * 0.62, H * 0.42, H * 0.24)}
          <Pennant x={4} y={4} s={0.75} fill={fg} p={p} />
          <rect x={4} y={H - 11} width={W * 0.55} height={3.4} rx={1.7} fill={fg} />
          <rect x={4} y={H - 6} width={W * 0.35} height={2.6} rx={1.3} fill={fg} opacity={0.75} />
        </g>
      );
    case 'banner':
      return (
        <g>
          <rect width={W} height={H} rx={2} fill={bg} {...line} />
          <Pennant x={4} y={3.2} s={0.95} fill={fg} p={p} />
          <rect x={16} y={H / 2 - 4} width={W * 0.38} height={3.4} rx={1.7} fill={p.ink} />
          <rect x={16} y={H / 2 + 1.5} width={W * 0.24} height={2.4} rx={1.2} fill={p.ink} opacity={0.6} />
          <rect x={W - 16} y={H / 2 - 3.5} width={12} height={7} rx={3.5} fill={fg} stroke={p.ink} strokeWidth={0.7} />
        </g>
      );
    default:
      return (
        <g>
          <rect width={W} height={H} rx={2.5} fill={bg} {...line} />
          {disc(W * 0.3, H * 0.5, H * 0.3)}
          <rect x={W * 0.56} y={H * 0.3} width={W * 0.34} height={3.4} rx={1.7} fill={fg} />
          <rect x={W * 0.56} y={H * 0.3 + 6} width={W * 0.22} height={2.6} rx={1.3} fill={fg} opacity={0.8} />
          <path d={`M${W * 0.56},${H * 0.62} l6,3.5 l-6,3.5 Z`} fill={fg} />
          <rect x={3} y={H - 3.5} width={W - 6} height={1.6} rx={0.8} fill={fg} opacity={0.4} />
        </g>
      );
  }
}

function Card({ k, p }: { k: number; p: P }) {
  const j = k % 4;
  const K = KINDS[j];
  const ts = STAMP0 + STAMP * k;
  const d = travel(j);
  const x0 = PRESS_X - K.w / 2;
  const top = BELT_Z + K.h;
  const dx = BINS[j] + BIN_W / 2 - PRESS_X;
  const ride = dW(dx, 0, 0);
  const push = dW(dx, 1.25, 0);
  const drop = dW(dx, 1.85, -1.0);
  const v = (q: [number, number]) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
  const setB = k >= 4;
  const bg = setB ? p.pop : p.accent;
  const sun = setB ? p.accent : p.pop;
  const fg = setB ? p.ink : p.trim;
  const [shx, shy] = S([PRESS_X, BELT_Y - 0.05, BELT_Z]);
  return (
    <g opacity={0}>
      <animate attributeName="opacity" values="0;1;1;0;0" keyTimes={kt(0, 0.12, d + 0.5, d + 0.56, LOOP)} dur={`${LOOP}s`} begin={`${(ts - LOOP).toFixed(3)}s`} {...rep} />
      <animateTransform
        attributeName="transform"
        type="translate"
        values={`0 0;${v(ride)};${v(push)};${v(drop)};${v(drop)}`}
        keyTimes={kt(0, d, d + 0.3, d + 0.6, LOOP)}
        calcMode="spline"
        keySplines="0 0 1 1;0.3 0 0.3 1;0.55 0 0.9 0.5;0 0 1 1"
        dur={`${LOOP}s`}
        begin={`${(ts - LOOP).toFixed(3)}s`}
        {...rep}
      />
      <ellipse cx={shx + 4} cy={shy + 2} rx={K.w * U * 0.5} ry={5} fill={p.ink} opacity={0.22} filter="url(#cf-blur-s)" />
      {/* card thickness */}
      <polygon points={poly([[x0 + K.w, BELT_Y, BELT_Z], [x0 + K.w, BELT_Y, top], [x0 + K.w, BELT_Y - 0.07, top], [x0 + K.w, BELT_Y - 0.07, BELT_Z]])} fill={shade(bg, -0.45)} stroke={p.ink} strokeWidth={0.8} />
      <polygon points={poly([[x0, BELT_Y, top], [x0 + K.w, BELT_Y, top], [x0 + K.w, BELT_Y - 0.07, top], [x0, BELT_Y - 0.07, top]])} fill={shade(bg, 0.3)} stroke={p.ink} strokeWidth={0.8} />
      <g transform={onY(x0, BELT_Y, top)}>
        <CardArt kind={K.kind} W={K.w * U} H={K.h * U} bg={bg} fg={fg} sun={sun} p={p} />
      </g>
    </g>
  );
}

/** Diverter paddle behind the belt that pushes a creative into its gate bin. */
function Pusher({ j, p }: { j: number; p: P }) {
  const b = BINS[j];
  const tp = STAMP0 + STAMP * j + travel(j);
  const begin = ((tp % 3) - 3).toFixed(3);
  const dy = (y: number) => {
    const [a, c] = dW(0, y, 0);
    return `${a.toFixed(1)} ${c.toFixed(1)}`;
  };
  const ink = { stroke: p.ink, strokeWidth: 1.1 };
  const px = b + 0.38;
  const pw = 0.75;
  return (
    <g>
      <Box x={b + 0.55} y={3.7} z={0.95} w={0.4} d={0.58} h={0.4} color={shade(p.ink, 0.3)} ink={ink} />
      <g>
        <animateTransform attributeName="transform" type="translate" values={`${dy(0.65)};${dy(1.9)};${dy(0)};${dy(0)};${dy(0.65)}`} keyTimes="0;0.1;0.2;0.917;1" calcMode="spline" keySplines="0.3 0 0.3 1;0.4 0 0.6 1;0 0 1 1;0.5 0 0.5 1" dur="3s" begin={`${begin}s`} {...rep} />
        <polyline points={poly([[b + 0.75, 3.6, 1.42], [b + 0.75, 4.3, 1.42]])} stroke={p.ink} strokeWidth={4} strokeLinecap="round" />
        <polyline points={poly([[b + 0.75, 3.6, 1.42], [b + 0.75, 4.3, 1.42]])} stroke={shade(p.trim, -0.15)} strokeWidth={2} strokeLinecap="round" />
        <Box x={px} y={4.3} z={1.3} w={pw} d={0.08} h={0.34} color={shade(p.trim, -0.2)} ink={ink} />
      </g>
    </g>
  );
}

// ── Gate bins (mail carts with canvas sacks) ───────────────────────────────
const BY0 = 6.5;
const BD = 1.3;
const BZ0 = 0.2;
const BZ1 = 1.25;

function BinBack({ j, p }: { j: number; p: P }) {
  const b = BINS[j];
  const ink = { stroke: p.ink, strokeWidth: 1.2 };
  const sack = shade(p.trim, -0.08);
  return (
    <g>
      <Shadow x={b} y={BY0} w={BIN_W} d={BD} h={1.3} p={p} />
      {/* interior: back + left inner walls, then the sack's dark mouth */}
      <polygon points={poly([[b, BY0, BZ0], [b + BIN_W, BY0, BZ0], [b + BIN_W, BY0, BZ1], [b, BY0, BZ1]])} fill={shade(p.machine, -0.35)} {...ink} />
      <polygon points={poly([[b, BY0, BZ0], [b, BY0 + BD, BZ0], [b, BY0 + BD, BZ1], [b, BY0, BZ1]])} fill={shade(p.machine, -0.2)} {...ink} />
      <polygon points={poly([[b + 0.08, BY0 + 0.08, BZ1 - 0.15], [b + BIN_W - 0.08, BY0 + 0.08, BZ1 - 0.15], [b + BIN_W - 0.08, BY0 + BD - 0.08, BZ1 - 0.15], [b + 0.08, BY0 + BD - 0.08, BZ1 - 0.15]])} fill={shade(sack, -0.45)} />
      {/* creatives already sorted, poking out of the sack */}
      {[0, 1, 2].map((i) => {
        const x = b + 0.25 + i * 0.38;
        const lean = (i - 1) * 0.12;
        const h = 0.55 + rand(j * 7 + i) * 0.3;
        const col = [p.accent, p.pop, p.trim][(i + j) % 3];
        return <polygon key={i} points={poly([[x, BY0 + 0.6 + i * 0.1, BZ1 - 0.3], [x + 0.36, BY0 + 0.6 + i * 0.1, BZ1 - 0.3], [x + 0.36 + lean, BY0 + 0.6 + i * 0.1, BZ1 - 0.3 + h], [x + lean, BY0 + 0.6 + i * 0.1, BZ1 - 0.3 + h]])} fill={col} stroke={p.ink} strokeWidth={1} />;
      })}
    </g>
  );
}

function BinFront({ j, label, sub, p }: { j: number; label: string; sub: string; p: P }) {
  const b = BINS[j];
  const ink = { stroke: p.ink, strokeWidth: 1.2 };
  const cart = shade(p.machine, -0.05);
  const sack = shade(p.trim, -0.08);
  const Wf = BIN_W * U;
  const fs = Math.min(11.5, 58 / Math.max(4, label.length * 0.66));
  return (
    <g>
      {/* wheels */}
      {[
        [b + 0.2, BY0 + BD],
        [b + BIN_W - 0.25, BY0 + BD],
        [b + BIN_W, BY0 + 0.25],
      ].map(([x, y], i) => {
        const [wx, wy] = S([x, y, 0.1]);
        return <ellipse key={i} cx={wx} cy={wy} rx={5} ry={5.5} fill={p.ink} stroke={shade(p.ink, 0.3)} strokeWidth={1} />;
      })}
      {/* front + right faces */}
      <polygon points={poly([[b, BY0 + BD, BZ0], [b + BIN_W, BY0 + BD, BZ0], [b + BIN_W, BY0 + BD, BZ1], [b, BY0 + BD, BZ1]])} fill={shade(cart, -0.12)} {...ink} />
      <polygon points={poly([[b + BIN_W, BY0, BZ0], [b + BIN_W, BY0 + BD, BZ0], [b + BIN_W, BY0 + BD, BZ1], [b + BIN_W, BY0, BZ1]])} fill={shade(cart, 0.08)} {...ink} />
      {/* rails on the right face */}
      {[0.45, 0.75].map((zz) => (
        <polyline key={zz} points={poly([[b + BIN_W, BY0 + 0.05, BZ0 + zz], [b + BIN_W, BY0 + BD - 0.05, BZ0 + zz]])} stroke={shade(cart, -0.3)} strokeWidth={1.4} />
      ))}
      {/* canvas sack folded over the rim */}
      <polygon points={poly([[b - 0.03, BY0 + BD + 0.03, BZ1 + 0.02], [b + BIN_W + 0.03, BY0 + BD + 0.03, BZ1 + 0.02], [b + BIN_W + 0.03, BY0 + BD + 0.03, BZ1 - 0.2], [b - 0.03, BY0 + BD + 0.03, BZ1 - 0.26]])} fill={sack} {...ink} />
      <polygon points={poly([[b + BIN_W + 0.03, BY0 - 0.03, BZ1 + 0.02], [b + BIN_W + 0.03, BY0 + BD + 0.03, BZ1 + 0.02], [b + BIN_W + 0.03, BY0 + BD + 0.03, BZ1 - 0.2], [b + BIN_W + 0.03, BY0 - 0.03, BZ1 - 0.24]])} fill={shade(sack, 0.1)} {...ink} />
      <polyline points={poly([[b + 0.05, BY0 + BD + 0.03, BZ1 - 0.12], [b + BIN_W - 0.05, BY0 + BD + 0.03, BZ1 - 0.1]])} stroke={shade(sack, -0.35)} strokeWidth={0.9} strokeDasharray="3 3" fill="none" />
      {/* boarding-pass tag on the front */}
      <g transform={onY(b, BY0 + BD, BZ1 - 0.26)}>
        <rect x={5} y={5} width={Wf - 10} height={29} rx={3} fill={p.ink} opacity={0.5} transform="translate(2 2)" />
        <rect x={5} y={5} width={Wf - 10} height={29} rx={3} fill={p.trim} stroke={p.ink} strokeWidth={1} />
        <rect x={5} y={5} width={Wf - 10} height={5} rx={2} fill={j % 2 ? p.pop : p.accent} />
        <line x1={Wf - 22} y1={11} x2={Wf - 22} y2={33} stroke={p.ink} strokeWidth={0.8} strokeDasharray="1.6 1.6" />
        <text x={9} y={23} fontFamily={MONO} fontWeight={700} fontSize={fs} fill={p.ink}>
          {label}
        </text>
        <text x={9} y={31} fontFamily={MONO} fontSize={5.6} letterSpacing={0.6} fill={p.ink} opacity={0.75}>
          {sub}
        </text>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={Wf - 19 + i * 2} y={15} width={i % 2 ? 0.8 : 1.4} height={14} fill={p.ink} />
        ))}
      </g>
    </g>
  );
}

/** Puffy sealed mail sack with a boarding-pass tag (screen-space drawing). */
function Sack({ x, y, s, label, tag, p }: { x: number; y: number; s: number; label: string; tag: string; p: P }) {
  const body = shade(p.trim, -0.1);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-26,0 C-34,-10 -32,-34 -16,-44 L-8,-50 L8,-50 L16,-44 C32,-34 34,-10 26,0 C12,6 -12,6 -26,0 Z" fill={body} stroke={p.ink} strokeWidth={1.3} strokeLinejoin="round" />
      <path d="M-26,0 C-34,-10 -32,-34 -16,-44 C-20,-30 -18,-10 -8,3 C-14,3 -21,2 -26,0 Z" fill={shade(body, -0.18)} />
      <path d="M-8,-50 L-11,-58 Q0,-62 11,-58 L8,-50 Z" fill={body} stroke={p.ink} strokeWidth={1.2} strokeLinejoin="round" />
      <rect x={-10} y={-52} width={20} height={4} rx={2} fill={p.ink} />
      <text x={0} y={-20} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={8} letterSpacing={0.8} fill={p.ink} opacity={0.8}>
        {label}
      </text>
      <line x1={6} y1={-50} x2={16} y2={-38} stroke={p.ink} strokeWidth={0.9} />
      <g transform="translate(12 -40) rotate(16)">
        <rect width={20} height={11} rx={1.5} fill={tag} stroke={p.ink} strokeWidth={0.9} />
        <line x1={14} y1={1} x2={14} y2={10} stroke={p.ink} strokeWidth={0.6} strokeDasharray="1 1" />
        <rect x={2.5} y={3.5} width={9} height={1.6} fill={p.ink} />
        <rect x={2.5} y={6.5} width={6} height={1.2} fill={p.ink} opacity={0.6} />
      </g>
    </g>
  );
}

function Crate({ x, y, z = 0, w, d, h, p, label }: { x: number; y: number; z?: number; w: number; d: number; h: number; p: P; label?: string }) {
  const wood = '#D49A6A';
  const ink = { stroke: p.ink, strokeWidth: 1.2 };
  return (
    <g>
      <Box x={x} y={y} z={z} w={w} d={d} h={h} color={wood} ink={ink} />
      {[0.33, 0.66].map((t) => (
        <g key={t} stroke={shade(wood, -0.45)} strokeWidth={1}>
          <polyline fill="none" points={poly([[x, y + d, z + h * t], [x + w, y + d, z + h * t]])} />
          <polyline fill="none" points={poly([[x + w, y, z + h * t], [x + w, y + d, z + h * t]])} />
        </g>
      ))}
      <polyline fill="none" stroke={shade(wood, -0.45)} strokeWidth={1.4} points={poly([[x + 0.05, y + d, z + 0.05], [x + w - 0.05, y + d, z + h - 0.05]])} />
      {label && (
        <g transform={onX(x + w, y + d, z + h)}>
          <text x={(d * U) / 2} y={h * U * 0.6} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={7.5} letterSpacing={1} fill={p.ink} opacity={0.7}>
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

// ── The machine ────────────────────────────────────────────────────────────
const MX0 = 3.0;
const MX1 = 7.8;
const MY0 = 3.4;
const MY1 = 6.8;
const MZ0 = 0.35;
const MZ1 = 3.4;
const VR = (MY1 - MY0) / 2;
const VY = (MY0 + MY1) / 2;
const vault = (x: number, th: number, r = VR): P3 => [x, VY + r * Math.cos(th), MZ1 + r * Math.sin(th)];
const arc = (x: number, r: number, a0: number, a1: number, n = 20): P3[] => Array.from({ length: n + 1 }, (_, i) => vault(x, a0 + ((a1 - a0) * i) / n, r));

function Machine({ p }: { p: P }) {
  const ink = { stroke: p.ink, strokeWidth: 1.3 };
  const body = p.machine;
  const cream = p.trim;
  const FW = (MX1 - MX0) * U; // front face width (px)
  const FH = (MZ1 - MZ0) * U;
  const RW = (MY1 - MY0) * U;
  // vault strips, back to front
  const N = 18;
  const strips: ReactNode[] = [];
  const thMax = (140 * Math.PI) / 180;
  for (let i = 0; i < N; i++) {
    const a = thMax - (thMax * i) / N;
    const b = thMax - (thMax * (i + 1)) / N;
    const m = (a + b) / 2;
    const t = 0.1 * Math.sin(m) - 0.28 * Math.max(0, Math.cos(m)) + (Math.cos(m) < 0 ? 0.04 : 0);
    const f = shade(cream, t);
    strips.push(<polygon key={i} points={poly([vault(MX0, a), vault(MX1, a), vault(MX1, b), vault(MX0, b)])} fill={f} stroke={f} strokeWidth={0.6} />);
  }
  const sil = poly([...arc(MX0, VR, (135 * Math.PI) / 180, 0), ...arc(MX1, VR, 0, (135 * Math.PI) / 180)]);
  const cap = (r0: number, r1: number) => poly([...arc(MX1, r1, 0, Math.PI, 28), ...arc(MX1, r0, Math.PI, 0, 28)]);
  const stripeC = [p.accent, p.pop, p.accent];

  return (
    <g>
      {/* plinth */}
      <Box x={MX0 - 0.2} y={MY0 - 0.2} z={0} w={MX1 - MX0 + 0.4} d={MY1 - MY0 + 0.4} h={MZ0} color={shade(p.ink, 0.25)} ink={ink} />
      {/* body */}
      <Box x={MX0} y={MY0} z={MZ0} w={MX1 - MX0} d={MY1 - MY0} h={MZ1 - MZ0} color={body} ink={ink} top={false} />
      {/* vault top */}
      {strips}
      <polygon points={cap(0, VR)} fill={shade(cream, -0.06)} {...ink} />
      {[
        [VR - 0.22, VR - 0.08],
        [VR - 0.5, VR - 0.34],
        [VR - 0.78, VR - 0.62],
      ].map(([r0, r1], i) => (
        <polygon key={i} points={cap(r0, r1)} fill={stripeC[i]} stroke={p.ink} strokeWidth={0.8} />
      ))}
      <polygon points={sil} fill="none" {...ink} />
      {/* seam bolts along the vault */}
      {[0.5, 1.6, 2.7, 3.8].map((dx) =>
        [0.25, 0.85].map((th) => {
          const [bx, by] = S(vault(MX0 + dx, th));
          return <circle key={`${dx}-${th}`} cx={bx} cy={by} r={1.8} fill={shade(cream, -0.25)} stroke={p.ink} strokeWidth={0.6} />;
        }),
      )}
      {/* rivet seam where vault meets body */}
      <polyline points={poly([[MX0, MY1, MZ1], [MX1, MY1, MZ1]])} stroke={p.ink} strokeWidth={2.2} />

      {/* ── front face (y = MY1) ── */}
      <g transform={onY(MX0, MY1, MZ1)}>
        <rect x={0} y={FH - 26} width={FW} height={18} fill="url(#cf-hazard)" stroke={p.ink} strokeWidth={1} />
        {/* nameplate */}
        <rect x={FW / 2 - 56} y={8} width={112} height={17} rx={3} fill={cream} stroke={p.ink} strokeWidth={1.1} />
        <Bolt x={FW / 2 - 51} y={16.5} p={p} r={1.4} />
        <Bolt x={FW / 2 + 51} y={16.5} p={p} r={1.4} />
        <text x={FW / 2} y={19.6} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={Math.min(8.6, 94 / (p.sign.length * 0.66))} letterSpacing={0.9} fill={p.ink}>
          {p.sign}
        </text>
        {/* portholes with gears */}
        {[
          [40, 68, 3, false],
          [FW - 40, 68, 2, true],
        ].map(([cx, cy, dur, rev], i) => (
          <g key={i}>
            <circle cx={cx as number} cy={cy as number} r={29} fill={shade(body, -0.35)} />
            <circle cx={cx as number} cy={cy as number} r={27} fill={cream} stroke={p.ink} strokeWidth={1.3} />
            <circle cx={cx as number} cy={cy as number} r={19} fill={shade(body, -0.55)} stroke={p.ink} strokeWidth={1.2} />
            <g clipPath={`url(#cf-port${i})`}>
              <Gear x={(cx as number) - 4} y={(cy as number) + 3} r={13} teeth={10} dur={dur as number} rev={rev as boolean} fill={p.pop} p={p} />
              <Gear x={(cx as number) + 12} y={(cy as number) - 10} r={8} teeth={6} dur={((dur as number) * 6) / 10} rev={!rev} fill={shade(cream, -0.1)} p={p} />
            </g>
            <path d={`M${(cx as number) - 12},${(cy as number) - 10} A15,15 0 0 1 ${(cx as number) + 4},${(cy as number) - 16}`} stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={3} fill="none" strokeLinecap="round" />
            {Array.from({ length: 8 }, (_, k) => {
              const a = (k / 8) * Math.PI * 2 + 0.3;
              return <Bolt key={k} x={(cx as number) + Math.cos(a) * 23} y={(cy as number) + Math.sin(a) * 23} p={p} r={1.4} />;
            })}
          </g>
        ))}
        {/* striped-sun dial */}
        <g transform={`translate(${FW / 2} 74)`}>
          <path d="M-33,0 A33,33 0 0 1 33,0 Z" fill={p.ink} />
          <path d="M-30,0 A30,30 0 0 1 30,0 Z" fill={cream} />
          <path d="M-24,0 A24,24 0 0 1 24,0 Z" fill={p.pop} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={-26} y={-7 - i * 6.5} width={52} height={1.4 + i * 0.4} fill={cream} />
          ))}
          {Array.from({ length: 9 }, (_, i) => {
            const a = Math.PI + (i / 8) * Math.PI;
            return <line key={i} x1={Math.cos(a) * 26} y1={Math.sin(a) * 26} x2={Math.cos(a) * 30} y2={Math.sin(a) * 30} stroke={p.ink} strokeWidth={1} />;
          })}
          <g>
            <animateTransform attributeName="transform" type="rotate" values="-50;30;10;45;-50" keyTimes="0;0.3;0.5;0.8;1" calcMode="spline" keySplines="0.4 0 0.4 1;0.4 0 0.4 1;0.4 0 0.4 1;0.4 0 0.4 1" dur="3s" {...rep} />
            <line x1={0} y1={0} x2={0} y2={-26} stroke={p.ink} strokeWidth={2} strokeLinecap="round" />
          </g>
          <circle r={3.5} fill={p.accent} stroke={p.ink} strokeWidth={1} />
          <rect x={-34} y={0} width={68} height={3} fill={p.ink} />
        </g>
        {/* small gauges */}
        {[
          [FW / 2 - 22, 98, 1.5, 0],
          [FW / 2 + 22, 98, 2, 0.6],
        ].map(([gx, gy, dur, off], i) => (
          <g key={i} transform={`translate(${gx} ${gy})`}>
            <circle r={10.5} fill={cream} stroke={p.ink} strokeWidth={1.2} />
            <path d="M4.5,-7.8 A9,9 0 0 1 9,0 L0,0 Z" fill={p.accent} opacity={0.85} />
            <g>
              <animateTransform attributeName="transform" type="rotate" values="-60;20;-10;35;-60" dur={`${dur}s`} begin={`-${off}s`} {...rep} />
              <line x1={0} y1={0} x2={0} y2={-8} stroke={p.ink} strokeWidth={1.4} strokeLinecap="round" />
            </g>
            <circle r={1.8} fill={p.ink} />
          </g>
        ))}
        {/* indicator lamps */}
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={FW / 2 - 6 + i * 6} cy={109} r={2.3} fill={[p.accent, p.pop, shade(p.machine, 0.5)][i]} stroke={p.ink} strokeWidth={0.7}>
            <animate attributeName="opacity" values="1;0.25;1" dur="1.5s" begin={`-${i * 0.5}s`} {...rep} />
          </circle>
        ))}
        {/* panel seams + bolts */}
        <line x1={78} y1={30} x2={78} y2={FH - 30} stroke={shade(body, -0.35)} strokeWidth={1.2} />
        <line x1={FW - 78} y1={30} x2={FW - 78} y2={FH - 30} stroke={shade(body, -0.35)} strokeWidth={1.2} />
        {Array.from({ length: 12 }, (_, i) => (
          <Bolt key={i} x={6 + i * ((FW - 12) / 11)} y={FH - 4} p={p} r={1.4} />
        ))}
        {/* clipboard hung on the front */}
        <g transform={`translate(${FW - 96} 36) rotate(-4)`}>
          <rect width={20} height={26} rx={2} fill="#C98E5A" stroke={p.ink} strokeWidth={1} />
          <rect x={2.5} y={4} width={15} height={19} fill={cream} />
          <rect x={6} y={1} width={8} height={4} rx={1} fill={p.ink} />
          {[0, 1, 2, 3].map((k) => (
            <line key={k} x1={5} y1={9 + k * 3.6} x2={k === 3 ? 11 : 15} y2={9 + k * 3.6} stroke={p.ink} strokeWidth={0.9} opacity={0.6} />
          ))}
        </g>
        {/* sticky note */}
        <g transform="translate(86 40) rotate(6)">
          <rect width={13} height={13} fill={p.pop} stroke={p.ink} strokeWidth={0.7} />
          <line x1={3} y1={5} x2={10} y2={5} stroke={p.ink} strokeWidth={0.8} />
          <line x1={3} y1={8} x2={8} y2={8} stroke={p.ink} strokeWidth={0.8} />
        </g>
      </g>

      {/* ── right face (x = MX1) ── */}
      <g transform={onX(MX1, MY1, MZ1)}>
        <rect x={(MY1 - 5.95) * U} y={(MZ1 - 1.95) * U} width={1.75 * U} height={1.3 * U} rx={4} fill={p.ink} />
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={(MY1 - 5.95) * U + 3 + i * 10.3} y={(MZ1 - 1.95) * U + 3} width={8.6} height={0.8 * U} rx={1} fill={shade(p.ink, 0.25)} opacity={0.9} />
        ))}
        <rect x={RW - 36} y={14} width={26} height={44} rx={3} fill={shade(body, -0.3)} stroke={p.ink} strokeWidth={1} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <rect key={i} x={RW - 32} y={19 + i * 6.4} width={18} height={2.6} rx={1.3} fill={p.ink} />
        ))}
        <circle cx={40} cy={38} r={25} fill={shade(body, -0.4)} stroke={p.ink} strokeWidth={1} />
        <Gear x={40} y={38} r={20} teeth={12} dur={3} fill={shade(cream, -0.05)} p={p} />
        <Gear x={73} y={22} r={13.4} teeth={8} dur={2} rev fill={p.accent} p={p} />
        {[8, RW - 8].map((bx) => [8, FH - 8].map((by) => <Bolt key={`${bx}-${by}`} x={bx} y={by} p={p} />))}
      </g>
    </g>
  );
}

function Press({ p }: { p: P }) {
  const ink = { stroke: p.ink, strokeWidth: 1.3 };
  const [dx, dy] = dW(0, 0, -1.2);
  const down = `${dx.toFixed(1)} ${dy.toFixed(1)}`;
  return (
    <g>
      {/* ram + head (moves) */}
      <g>
        <animateTransform attributeName="transform" type="translate" values={`${down};${down};0 0;0 0;${down}`} keyTimes="0;0.08;0.42;0.82;1" calcMode="spline" keySplines="0 0 1 1;0.2 0.8 0.3 1;0 0 1 1;0.75 0 1 1" dur={`${STAMP}s`} begin={`${(STAMP0 - STAMP).toFixed(2)}s`} {...rep} />
        <Cyl x={PRESS_X} y={BELT_Y} z={2.9} r={0.17} h={1.95} color={shade(p.trim, -0.15)} ink={ink} />
        <Box x={PRESS_X - 0.62} y={BELT_Y - 0.62} z={2.5} w={1.24} d={1.24} h={0.42} color={p.accent} ink={ink} />
        <polygon points={poly([[PRESS_X - 0.62, BELT_Y + 0.62, 2.62], [PRESS_X + 0.62, BELT_Y + 0.62, 2.62], [PRESS_X + 0.62, BELT_Y + 0.62, 2.7], [PRESS_X - 0.62, BELT_Y + 0.62, 2.7]])} fill={p.pop} />
        <polygon points={poly([[PRESS_X + 0.62, BELT_Y - 0.62, 2.62], [PRESS_X + 0.62, BELT_Y + 0.62, 2.62], [PRESS_X + 0.62, BELT_Y + 0.62, 2.7], [PRESS_X + 0.62, BELT_Y - 0.62, 2.7]])} fill={shade(p.pop, -0.1)} />
        <Box x={PRESS_X - 0.5} y={BELT_Y - 0.5} z={2.42} w={1.0} d={1.0} h={0.08} color={shade(p.ink, 0.3)} ink={ink} />
      </g>
      {/* arm out of the vault */}
      <Box x={MX1} y={4.3} z={3.5} w={2.0} d={1.9} h={0.7} color={p.machine} ink={ink} />
      <g transform={onY(MX1, 6.2, 4.2)}>
        <rect x={0} y={4} width={2.0 * U} height={0.7 * U - 8} fill="url(#cf-hazard)" stroke={p.ink} strokeWidth={0.8} />
      </g>
      <Cyl x={PRESS_X} y={BELT_Y} z={4.2} r={0.42} h={0.55} color={shade(p.trim, -0.05)} ink={ink} />
      <Cyl x={PRESS_X} y={BELT_Y} z={4.75} r={0.25} h={0.18} color={p.accent} ink={ink} />
      {/* front support column */}
      <Box x={MX1 + 1.72} y={5.92} z={0} w={0.26} d={0.26} h={3.5} color={shade(p.machine, -0.1)} ink={ink} />
      {[0.8, 1.6, 2.4].map((zz) => (
        <polygon key={zz} points={poly([[MX1 + 1.72, 6.18, zz], [MX1 + 1.98, 6.18, zz], [MX1 + 1.98, 6.18, zz + 0.25], [MX1 + 1.72, 6.18, zz + 0.25]])} fill={p.pop} stroke={p.ink} strokeWidth={0.8} />
      ))}
    </g>
  );
}

function Conveyor({ p, part }: { p: P; part: 'base' | 'front' }) {
  const ink = { stroke: p.ink, strokeWidth: 1.2 };
  const X0 = MX1;
  const X1 = 16.8;
  const Y0 = 4.3;
  const Y1 = 5.9;
  const frame = shade(p.machine, 0.12);
  if (part === 'base') {
    const [sx, sy] = dW(0.5, 0, 0);
    return (
      <g>
        <Shadow x={X0} y={Y0} w={X1 - X0} d={Y1 - Y0} h={1.4} p={p} />
        {[8.4, 10.9, 13.4, 15.9].map((lx) =>
          [Y0 + 0.1, Y1 - 0.25].map((ly) => <Box key={`${lx}-${ly}`} x={lx} y={ly} z={0} w={0.15} d={0.15} h={0.8} color={shade(p.ink, 0.35)} ink={ink} />),
        )}
        <Box x={X0} y={Y0} z={0.8} w={X1 - X0} d={Y1 - Y0} h={0.4} color={frame} ink={ink} top={false} />
        {/* belt */}
        <polygon points={poly([[X0, Y0, 1.2], [X1, Y0, 1.2], [X1, Y1, 1.2], [X0, Y1, 1.2]])} fill={shade(p.ink, 0.12)} {...ink} />
        <g clipPath="url(#cf-belt)">
          <g>
            <animateTransform attributeName="transform" type="translate" values={`0 0;${sx.toFixed(2)} ${sy.toFixed(2)}`} dur="0.3125s" {...rep} />
            {Array.from({ length: 22 }, (_, i) => {
              const x = X0 - 0.5 + i * 0.5;
              return <polyline key={i} points={poly([[x, Y0 + 0.08, 1.2], [x + 0.18, (Y0 + Y1) / 2, 1.2], [x, Y1 - 0.08, 1.2]])} fill="none" stroke={shade(p.ink, 0.32)} strokeWidth={2} strokeLinejoin="round" />;
            })}
          </g>
        </g>
        {/* back rail */}
        <Box x={X0} y={Y0 - 0.08} z={1.2} w={X1 - X0} d={0.08} h={0.14} color={p.pop} ink={{ stroke: p.ink, strokeWidth: 0.9 }} />
        {/* rollers on the front side */}
        <g transform={onY(X0, Y1, 1.2)}>
          {Array.from({ length: 9 }, (_, i) => (
            <g key={i} transform={`translate(${(0.55 + i) * U} ${0.2 * U})`}>
              <circle r={7} fill={shade(p.trim, -0.15)} stroke={p.ink} strokeWidth={1} />
              <g>
                <animateTransform attributeName="transform" type="rotate" values="0;360" dur="0.75s" {...rep} />
                <path d="M-6,0 L6,0 M0,-6 L0,6" stroke={p.ink} strokeWidth={1.4} />
              </g>
              <circle r={2} fill={p.accent} stroke={p.ink} strokeWidth={0.6} />
            </g>
          ))}
        </g>
        {/* end cap */}
        <g transform={onX(X1, Y1, 1.2)}>
          <rect x={4} y={3} width={(Y1 - Y0) * U - 8} height={0.4 * U - 6} rx={2} fill="url(#cf-hazard)" />
        </g>
      </g>
    );
  }
  return null;
}

function Window({ p }: { p: P }) {
  const X = 9.8;
  const W = 4.4 * U;
  const H = 3.2 * U;
  const Z = 6.6;
  const frame = shade(p.wall, -0.5);
  const sun = { cx: W * 0.5, cy: H * 0.66, r: H * 0.4 };
  return (
    <g>
      <g transform={onY(X, 0, Z)}>
        <rect x={-8} y={-8} width={W + 16} height={H + 16} rx={10} fill={frame} stroke={p.ink} strokeWidth={1.3} />
        <g clipPath="url(#cf-win)">
          <rect width={W} height={H} fill="url(#cf-sky)" />
          {p.night &&
            Array.from({ length: 24 }, (_, i) => (
              <circle key={i} cx={rand(i * 4.1) * W} cy={rand(i * 9.3) * H * 0.6} r={0.6 + rand(i * 2.2) * 1.1} fill="#FFFFFF">
                <animate attributeName="opacity" values="0.2;1;0.2" dur={`${[2, 3, 6][i % 3]}s`} begin={`-${(rand(i) * 2).toFixed(2)}s`} {...rep} />
              </circle>
            ))}
          <circle cx={sun.cx} cy={sun.cy} r={sun.r * 1.7} fill="url(#cf-halo)" />
          <circle cx={sun.cx} cy={sun.cy} r={sun.r} fill={p.night ? shade(p.trim, -0.05) : p.accent} />
          <circle cx={sun.cx} cy={sun.cy} r={sun.r * 0.7} fill={p.night ? p.trim : p.pop} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={sun.cx - sun.r - 2} y={sun.cy + sun.r * (0.02 + i * 0.22)} width={sun.r * 2 + 4} height={sun.r * (0.05 + i * 0.035)} fill={p.skyBottom} />
          ))}
          {/* distant hills + hangar roofs */}
          <path d={`M0,${H} L0,${H - 22} Q${W * 0.2},${H - 40} ${W * 0.42},${H - 24} Q${W * 0.7},${H - 8} ${W},${H - 30} L${W},${H} Z`} fill={shade(p.skyTop, -0.25)} opacity={0.9} />
          <path d={`M${W * 0.62},${H} L${W * 0.62},${H - 18} Q${W * 0.74},${H - 34} ${W * 0.86},${H - 18} L${W * 0.86},${H} Z`} fill={shade(p.skyTop, -0.45)} />
          {/* drifting cloud */}
          <g opacity={p.night ? 0.35 : 0.9}>
            <animateTransform attributeName="transform" type="translate" values="0 0;24 0;0 0" dur="6s" {...SOFT} {...rep} />
            <path d={`M30,52 q8,-14 22,-8 q8,-12 22,-2 q14,0 12,10 Z`} fill={shade(p.wall, 0.4)} />
            <path d={`M140,34 q6,-10 16,-6 q6,-8 16,0 q10,0 8,6 Z`} fill={shade(p.wall, 0.4)} />
          </g>
          {/* tiny tow plane crossing the sunset */}
          <g>
            <animateTransform attributeName="transform" type="translate" values={`${W + 70} 0;-120 0`} dur="6s" {...rep} />
            <g transform="translate(0 30)">
              <path d="M0,0 L-6,-3 L-6,3 Z M0,0 L16,-1.5 L16,1.5 Z" fill={p.ink} />
              <path d="M5,-5 L8,0 L5,5 Z" fill={p.ink} />
              <line x1={16} y1={0} x2={24} y2={0} stroke={p.ink} strokeWidth={0.6} />
              <path d="M24,-3.5 L62,-3.5 L58,0 L62,3.5 L24,3.5 Z" fill={p.accent} stroke={p.ink} strokeWidth={0.6} />
            </g>
          </g>
        </g>
        {/* mullions + glass glints */}
        <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke={frame} strokeWidth={6} />
        <line x1={0} y1={H * 0.45} x2={W} y2={H * 0.45} stroke={frame} strokeWidth={6} />
        <rect width={W} height={H} fill="none" stroke={p.ink} strokeWidth={1.1} />
        <path d={`M14,${H * 0.4} L${W * 0.18},8 L${W * 0.26},8 L22,${H * 0.4} Z`} fill="#FFFFFF" opacity={0.18} />
        <path d={`M${W * 0.55},${H * 0.95} L${W * 0.8},${H * 0.5} L${W * 0.84},${H * 0.5} L${W * 0.59},${H * 0.95} Z`} fill="#FFFFFF" opacity={0.12} />
      </g>
      {/* sill */}
      <Box x={X - 0.25} y={0} z={Z - 3.2 - 0.32} w={4.4 + 0.5} d={0.32} h={0.14} color={shade(p.wall, -0.2)} ink={{ stroke: p.ink, strokeWidth: 1.1 }} />
      {/* plant on the sill */}
      {(() => {
        const [px, py] = S([X + 3.9, 0.17, Z - 3.38]);
        return (
          <g>
            <path d={`M${px - 8},${py - 14} L${px + 8},${py - 14} L${px + 6},${py} L${px - 6},${py} Z`} fill={p.accent} stroke={p.ink} strokeWidth={1} />
            {[-30, -5, 20].map((a, i) => (
              <path key={i} d={`M${px},${py - 14} q${a * 0.3},-14 ${a * 0.5},-24 q${-a * 0.1},10 ${-a * 0.5},24 Z`} fill={shade('#3E9A5E', i * 0.1)} stroke={p.ink} strokeWidth={0.9} />
            ))}
          </g>
        );
      })()}
    </g>
  );
}

function DepartureBoard({ p, labels }: { p: P; labels: string[] }) {
  const W = 2.9 * U;
  const H = 2.0 * U;
  const rows = [
    [labels[0], '9:16', 'BOARDING'],
    [labels[1], '1:1', 'ON TIME'],
    [labels[2], '728×90', 'ON TIME'],
    [labels[3], '16:9', 'GATE ALL'],
  ];
  return (
    <g transform={onY(6.4, 0, 6.5)}>
      <rect x={3} y={3} width={W} height={H} rx={5} fill={p.ink} opacity={0.35} />
      <rect width={W} height={H} rx={5} fill={shade(p.ink, 0.08)} stroke={p.ink} strokeWidth={1.2} />
      <text x={8} y={14} fontFamily={MONO} fontWeight={700} fontSize={8} letterSpacing={1.6} fill={p.pop}>
        DEPARTURES
      </text>
      <circle cx={W - 10} cy={11} r={2.6} fill={p.accent}>
        <animate attributeName="opacity" values="1;0.2;1" dur="1s" {...rep} />
      </circle>
      {rows.map(([a, b, c], i) => (
        <g key={i} transform={`translate(0 ${26 + i * 17})`}>
          <rect x={6} y={-9} width={W - 12} height={13} rx={1.5} fill={shade(p.ink, 0.2)} />
          <text x={9} y={0} fontFamily={MONO} fontWeight={700} fontSize={6.6} fill={p.trim}>
            {a.slice(0, 8)}
          </text>
          <text x={W * 0.43} y={0} fontFamily={MONO} fontSize={6.2} fill={p.trim} opacity={0.75}>
            {b}
          </text>
          <text x={W - 9} y={0} textAnchor="end" fontFamily={MONO} fontWeight={700} fontSize={6.2} fill={i === 0 ? p.pop : p.trim}>
            {i === 0 && <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" {...rep} />}
            {c}
          </text>
        </g>
      ))}
    </g>
  );
}

export default function CreativeFoundry(p: P) {
  const ink = { stroke: p.ink, strokeWidth: 1.2 };
  const gates = [p.gate1, p.gate2, p.gate3, p.gate4];
  const subs = ['9:16 · GATE 01', '1:1 · GATE 02', '728×90 · GATE 03', '16:9 · GATE 04'];
  const night = p.night;
  const dark = parseInt(p.wall.slice(1, 3), 16) < 0x80;
  const WALL_H = 12;
  const wallR = p.wall; // y = 0 plane
  const wallL = shade(p.wall, -0.07); // x = 0 plane

  // Lamp over the press
  const LX = 652;
  const LY = 150;
  const [pressX, pressY] = S([PRESS_X, BELT_Y, BELT_Z + 0.1]);
  // Steam stack on the vault
  const [stX, stY] = S([6.9, 5.6, 5.55]);

  // Brief: stands in the intake slot, gets swallowed before the big slam, then a new one drops from the chute
  const SLOT_Z = 5.25;
  const BW = 1.3 * U;
  const BH = 1.6 * U;
  const brief = { values: '0 0;0 0;0 85;0 -200;0 -200;0 0;0 -9;0 0;0 0', keyTimes: kt(0, 2.7, 3.05, 3.06, 3.85, 4.25, 4.4, 4.55, LOOP), keySplines: '0 0 1 1;0.6 0 1 1;0 0 1 1;0 0 1 1;0.55 0 1 1;0.2 0.8 0.4 1;0.6 0 0.8 1;0 0 1 1' };

  const burstKT = kt(0, MOMENT - 0.01, MOMENT, MOMENT + 0.55, LOOP);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <filter id="cf-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="cf-blur-s" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <filter id="cf-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="cf-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="0.55" stopColor={night ? shade(p.skyTop, 0.12) : p.accent} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id="cf-halo">
          <stop offset="0" stopColor={p.pop} stopOpacity={0.6} />
          <stop offset="1" stopColor={p.pop} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="cf-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.pop} stopOpacity={night || dark ? 0.5 : 0.38} />
          <stop offset="1" stopColor={p.pop} stopOpacity={0} />
        </linearGradient>
        <radialGradient id="cf-pool">
          <stop offset="0" stopColor={p.pop} stopOpacity={night || dark ? 0.4 : 0.28} />
          <stop offset="1" stopColor={p.pop} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="cf-vig" cx="0.5" cy="0.48" r="0.75">
          <stop offset="0.55" stopColor={p.ink} stopOpacity={0} />
          <stop offset="1" stopColor={p.ink} stopOpacity={night || dark ? 0.55 : 0.28} />
        </radialGradient>
        <pattern id="cf-hazard" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
          <rect width="12" height="12" fill={p.pop} />
          <rect width="6" height="12" fill={p.ink} />
        </pattern>
        <clipPath id="cf-win">
          <rect width={4.4 * U} height={3.2 * U} />
        </clipPath>
        <clipPath id="cf-port0">
          <circle cx={40} cy={68} r={18.4} />
        </clipPath>
        <clipPath id="cf-port1">
          <circle cx={(MX1 - MX0) * U - 40} cy={68} r={18.4} />
        </clipPath>
        <clipPath id="cf-belt">
          <polygon points={poly([[MX1, 4.3, 1.2], [16.8, 4.3, 1.2], [16.8, 5.9, 1.2], [MX1, 5.9, 1.2]])} />
        </clipPath>
        <clipPath id="cf-slot">
          <rect x={-100} y={-400} width={300} height={400} />
        </clipPath>
      </defs>

      <rect width="1200" height="900" fill={p.floor} />
      <g transform="translate(600 440) scale(1.1) translate(-600 -420)">
      {/* ── Room ── */}
      <polygon points={poly([[0, 0, 0], [30, 0, 0], [30, 0, WALL_H], [0, 0, WALL_H]])} fill={wallR} stroke={p.ink} strokeWidth={1.2} />
      <polygon points={poly([[0, 0, 0], [0, 30, 0], [0, 30, WALL_H], [0, 0, WALL_H]])} fill={wallL} stroke={p.ink} strokeWidth={1.2} />
      {/* wall panel seams */}
      {Array.from({ length: 10 }, (_, i) => (
        <polyline key={`r${i}`} points={poly([[2.5 + i * 2.5, 0, 2.2], [2.5 + i * 2.5, 0, WALL_H]])} stroke={shade(wallR, -0.1)} strokeWidth={1.2} fill="none" />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <polyline key={`l${i}`} points={poly([[0, 2.5 + i * 2.5, 2.2], [0, 2.5 + i * 2.5, WALL_H]])} stroke={shade(wallL, -0.1)} strokeWidth={1.2} fill="none" />
      ))}
      {/* 70s stripe band */}
      {[
        [1.5, 1.75, p.accent],
        [1.78, 1.98, p.pop],
        [2.01, 2.16, p.machine],
      ].map(([z0, z1, c], i) => (
        <g key={i}>
          <polygon points={poly([[0, 0, z0 as number], [30, 0, z0 as number], [30, 0, z1 as number], [0, 0, z1 as number]])} fill={c as string} />
          <polygon points={poly([[0, 0, z0 as number], [0, 30, z0 as number], [0, 30, z1 as number], [0, 0, z1 as number]])} fill={shade(c as string, -0.08)} />
        </g>
      ))}
      {/* baseboards */}
      <polygon points={poly([[0, 0, 0], [30, 0, 0], [30, 0, 0.28], [0, 0, 0.28]])} fill={shade(wallR, -0.25)} stroke={p.ink} strokeWidth={1} />
      <polygon points={poly([[0, 0, 0], [0, 30, 0], [0, 30, 0.28], [0, 0, 0.28]])} fill={shade(wallL, -0.3)} stroke={p.ink} strokeWidth={1} />

      <Window p={p} />
      <DepartureBoard p={p} labels={gates} />

      {/* left wall: poster, pegboard, clock */}
      <g transform={onX(0, 9.6, 6.3)}>
        <rect x={3} y={3} width={2.2 * U} height={2.9 * U} rx={2} fill={p.ink} opacity={0.3} />
        <rect width={2.2 * U} height={2.9 * U} rx={2} fill={p.trim} stroke={p.ink} strokeWidth={1.2} />
        <rect x={6} y={6} width={2.2 * U - 12} height={2.9 * U - 50} fill={p.machine} />
        <circle cx={1.1 * U} cy={2.9 * U - 52} r={34} fill={p.accent} />
        <circle cx={1.1 * U} cy={2.9 * U - 52} r={24} fill={p.pop} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={1.1 * U - 36} y={2.9 * U - 52 - 6 - i * 9} width={72} height={2 + i} fill={p.machine} />
        ))}
        <rect x={6} y={2.9 * U - 50} width={2.2 * U - 12} height={4} fill={p.machine} />
        <Pennant x={14} y={14} s={1.6} fill={p.trim} p={p} />
        <text x={1.1 * U} y={2.9 * U - 30} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={Math.min(8, 96 / (p.poster.length * 0.64))} letterSpacing={0.4} fill={p.ink}>
          {p.poster}
        </text>
        <text x={1.1 * U} y={2.9 * U - 16} textAnchor="middle" fontFamily={MONO} fontSize={6} letterSpacing={1.4} fill={p.ink} opacity={0.7}>
          TOWLINE.AI
        </text>
      </g>
      <g transform={onX(0, 5.2, 4.8)}>
        <rect width={3.4 * U} height={2.1 * U} rx={3} fill="#D9A877" stroke={p.ink} strokeWidth={1.2} />
        {Array.from({ length: 14 }, (_, i) =>
          Array.from({ length: 8 }, (_, k) => <circle key={`${i}-${k}`} cx={8 + i * 11.5} cy={8 + k * 12} r={1.2} fill={shade('#D9A877', -0.4)} />),
        )}
        {/* clipboards with creative proofs */}
        {[
          [14, 14, -4, p.accent],
          [62, 10, 3, p.pop],
        ].map(([x, y, r, c], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <rect width={36} height={48} rx={3} fill="#A86B3C" stroke={p.ink} strokeWidth={1} />
            <rect x={4} y={7} width={28} height={37} fill={p.trim} />
            <rect x={7} y={10} width={22} height={16} fill={c as string} />
            <circle cx={18} cy={20} r={5} fill={i ? p.accent : p.pop} />
            <rect x={7} y={30} width={18} height={2.4} fill={p.ink} opacity={0.6} />
            <rect x={7} y={35} width={12} height={2.4} fill={p.ink} opacity={0.4} />
            <rect x={12} y={1} width={12} height={6} rx={1.5} fill={p.ink} />
          </g>
        ))}
        {/* sticky notes */}
        {[
          [112, 12, 6, p.pop],
          [132, 18, -5, p.accent],
          [116, 40, -3, shade(p.machine, 0.5)],
          [138, 46, 7, p.pop],
        ].map(([x, y, r, c], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <rect width={18} height={18} fill={c as string} stroke={p.ink} strokeWidth={0.7} />
            <line x1={4} y1={7} x2={14} y2={7} stroke={p.ink} strokeWidth={0.9} />
            <line x1={4} y1={11} x2={11} y2={11} stroke={p.ink} strokeWidth={0.9} />
          </g>
        ))}
        {/* hanging tools */}
        <path d="M108,70 l0,20 M104,70 l8,0" stroke={p.ink} strokeWidth={2} strokeLinecap="round" />
        <path d="M128,68 a5,5 0 1 1 0.1,0 l0,24" fill="none" stroke={p.ink} strokeWidth={2} />
        <g transform="translate(148 72)">
          <rect x={-3} y={0} width={6} height={20} rx={2} fill={p.accent} stroke={p.ink} strokeWidth={0.8} />
          <rect x={-1} y={-8} width={2} height={8} fill={p.ink} />
        </g>
      </g>

      {/* ── Floor ── */}
      <IsoGrid x={0} y={0} w={26} d={22} u={U} color={p.ink} opacity={0.13} />
      {/* sunlight from the window spilling onto the floor */}
      <g opacity={night ? 0.12 : 0.32} filter="url(#cf-blur-s)">
        <polygon points={poly([[10.6, 3.2, 0.01], [15.0, 3.2, 0.01], [16.6, 7.6, 0.01], [12.2, 7.6, 0.01]])} fill={shade(p.pop, 0.3)} />
      </g>
      <g opacity={night ? 0.05 : 0.14}>
        <polyline points={poly([[12.8, 3.2, 0.01], [14.4, 7.6, 0.01]])} stroke={p.ink} strokeWidth={6} />
        <polyline points={poly([[11.4, 5.2, 0.01], [15.8, 5.2, 0.01]])} stroke={p.ink} strokeWidth={6} />
      </g>
      {/* floor tape: hazard border around the press, lane line + gate numbers */}
      <polygon points={poly([[7.4, 6.2, 0.01], [17.0, 6.2, 0.01], [17.0, 6.34, 0.01], [7.4, 6.34, 0.01]])} fill="url(#cf-hazard)" opacity={0.85} />
      {BINS.map((b, i) => (
        <g key={i} transform={onFloor(b + 0.2, BY0 + BD + 0.45)}>
          <rect x={0} y={0} width={1.1 * U} height={0.55 * U} rx={3} fill="none" stroke={p.ink} strokeOpacity={0.45} strokeWidth={1.6} strokeDasharray="5 4" />
          <text x={0.55 * U} y={0.4 * U} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={15} fill={p.ink} opacity={0.4}>
            A{i + 1}
          </text>
        </g>
      ))}
      <polyline points={poly([[2.4, 8.6, 0.01], [8.6, 8.6, 0.01]])} stroke={p.pop} strokeWidth={4} strokeDasharray="14 10" opacity={0.8} />

      {/* ── Behind the machine ── */}
      {/* crate stack in the back corner */}
      <Shadow x={0.3} y={0.4} w={2.2} d={1.5} h={2} p={p} />
      <Crate x={0.3} y={0.4} w={1.5} d={1.4} h={1.1} p={p} label="BRIEFS" />
      <Crate x={0.45} y={0.55} z={1.1} w={1.2} d={1.1} h={0.85} p={p} />
      <Crate x={1.85} y={0.5} w={0.9} d={0.9} h={0.75} p={p} />
      {/* pipes: along the left wall into the machine, and up to the ceiling */}
      {[
        [[0.15, 6.0, 9], [0.15, 6.0, 2.8], [MX0 + 0.3, 6.0, 2.8]],
        [[0.15, 6.6, 9], [0.15, 6.6, 1.0], [MX0 + 0.3, 6.6, 1.0]],
      ].map((pp, i) => {
        const pts2 = poly(pp as P3[]);
        return (
          <g key={i} fill="none" strokeLinejoin="round" strokeLinecap="round">
            <polyline points={pts2} stroke={p.ink} strokeWidth={15} />
            <polyline points={pts2} stroke={i ? shade(p.trim, -0.12) : p.accent} strokeWidth={12} />
            <polyline points={pts2} stroke="#FFFFFF" strokeOpacity={0.35} strokeWidth={3} transform="translate(-3 0)" />
          </g>
        );
      })}
      {[
        [0.15, 6.0, 6.2],
        [1.6, 6.0, 2.8],
        [0.15, 6.6, 4.5],
        [1.4, 6.6, 1.0],
      ].map((q, i) => {
        const [fx, fy] = S(q as P3);
        return <rect key={i} x={fx - 10} y={fy - 4} width={20} height={8} rx={2} fill={shade(p.trim, -0.25)} stroke={p.ink} strokeWidth={1} transform={i % 2 ? `rotate(-60 ${fx} ${fy})` : undefined} />;
      })}
      {/* valve wheel on the red pipe */}
      {(() => {
        return (
          <g transform={onX(0.4, 6.0, 4.2)}>
            <g transform="translate(0 0)">
              <circle r={11} fill="none" stroke={p.ink} strokeWidth={4} />
              <circle r={11} fill="none" stroke={p.pop} strokeWidth={2} />
              <path d="M-11,0 L11,0 M0,-11 L0,11" stroke={p.ink} strokeWidth={1.6} />
              <circle r={2.4} fill={p.ink} />
            </g>
          </g>
        );
      })()}
      {/* vertical exhaust to the ceiling */}
      <Cyl x={6.3} y={3.75} z={3.2} r={0.24} h={9} color={shade(p.trim, -0.12)} ink={ink} />
      {[6.2, 8.2].map((zz) => (
        <Cyl key={zz} x={6.3} y={3.75} z={zz} r={0.3} h={0.16} color={p.accent} ink={ink} />
      ))}

      {/* ── Machine ── */}
      <Shadow x={MX0 - 0.2} y={MY0 - 0.2} w={MX1 - MX0 + 0.4} d={MY1 - MY0 + 0.4} h={4.5} o={0.24} p={p} />
      <Machine p={p} />

      {/* intake housing + slot on the ridge */}
      <Box x={3.85} y={4.82} z={4.9} w={1.9} d={0.56} h={0.35} color={p.machine} ink={ink} />
      <polygon points={poly([[4.0, 5.0, SLOT_Z], [5.6, 5.0, SLOT_Z], [5.6, 5.2, SLOT_Z], [4.0, 5.2, SLOT_Z]])} fill={p.ink} />

      {/* the brief */}
      <g transform={onY(4.15, 5.1, SLOT_Z)}>
        <g clipPath="url(#cf-slot)">
          <g>
            <animateTransform attributeName="transform" type="translate" values={brief.values} keyTimes={brief.keyTimes} calcMode="spline" keySplines={brief.keySplines} dur={`${LOOP}s`} {...rep} />
            <g transform="translate(0 -50)">
              <rect x={3} y={2} width={BW} height={BH} rx={2} fill={p.ink} opacity={0.35} />
              <rect width={BW} height={BH} rx={2} fill={shade(p.trim, 0.3)} stroke={p.ink} strokeWidth={1.1} />
              <path d={`M${BW - 12},0 L${BW},0 L${BW},12 Z`} fill={shade(p.trim, -0.15)} stroke={p.ink} strokeWidth={0.8} />
              <Pennant x={5} y={5} s={1.05} fill={p.accent} p={p} />
              <text x={17} y={12.5} fontFamily={MONO} fontWeight={700} fontSize={Math.min(6.4, 44 / (p.briefTitle.length * 0.62))} fill={p.ink}>
                {p.briefTitle}
              </text>
              {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={5} y={20 + i * 5.5} width={i === 3 ? 30 : BW - 12} height={2.2} rx={1} fill={p.ink} opacity={0.45} />
              ))}
              <circle cx={BW - 13} cy={40} r={7} fill="none" stroke={p.accent} strokeWidth={1.4} transform={`rotate(-15 ${BW - 13} 40)`} />
              <text x={BW - 13} y={42} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={5} fill={p.accent}>
                OK
              </text>
            </g>
          </g>
        </g>
      </g>
      <polyline points={poly([[3.85, 5.38, SLOT_Z], [5.75, 5.38, SLOT_Z]])} stroke={p.ink} strokeWidth={1.2} />

      {/* chute from the ceiling */}
      <Box x={3.82} y={4.42} z={7.25} w={1.96} d={1.36} h={0.38} color={p.trim} ink={ink} />
      <Box x={3.95} y={4.55} z={7.63} w={1.7} d={1.1} h={7} color={shade(p.machine, 0.15)} ink={ink} />
      {[9.0, 10.6].map((zz) => (
        <Box key={zz} x={3.9} y={4.5} z={zz} w={1.8} d={1.2} h={0.16} color={p.accent} ink={ink} />
      ))}
      <g transform={onY(3.95, 5.65, 8.85)}>
        <rect x={10} y={4} width={62} height={18} rx={3} fill={p.trim} stroke={p.ink} strokeWidth={1} />
        <text x={41} y={16.5} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={8} letterSpacing={1} fill={p.ink}>
          BRIEF IN
        </text>
      </g>

      {/* steam stack */}
      <Cyl x={6.9} y={5.6} z={4.6} r={0.16} h={0.95} color={shade(p.trim, -0.15)} ink={ink} />
      <Cyl x={6.9} y={5.6} z={5.45} r={0.22} h={0.12} color={p.accent} ink={ink} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={stX} cy={stY} r={5} fill={night || dark ? shade(p.trim, -0.1) : '#FFFFFF'} opacity={0}>
          <animate attributeName="cy" values={`${stY - 4};${stY - 70}`} dur="2s" begin={`-${(i * 2) / 3}s`} {...rep} />
          <animate attributeName="cx" values={`${stX};${stX + 14}`} dur="2s" begin={`-${(i * 2) / 3}s`} {...rep} />
          <animate attributeName="r" values="4;16" dur="2s" begin={`-${(i * 2) / 3}s`} {...rep} />
          <animate attributeName="opacity" values="0;0.85;0" keyTimes="0;0.2;1" dur="2s" begin={`-${(i * 2) / 3}s`} {...rep} />
        </circle>
      ))}

      {/* crate stack at the end of the line */}
      <Shadow x={17.3} y={3.0} w={1.4} d={1.4} h={2} p={p} />
      <Crate x={17.3} y={3.0} w={1.4} d={1.4} h={1.0} p={p} label="34 GATES" />
      <Crate x={17.45} y={3.15} z={1.0} w={1.05} d={1.05} h={0.8} p={p} />
      <Crate x={17.6} y={4.7} w={0.9} d={0.9} h={0.7} p={p} />

      {/* ── Conveyor, sorting and creatives ── */}
      <Conveyor p={p} part="base" />
      {[0, 1, 2, 3].map((j) => (
        <Pusher key={j} j={j} p={p} />
      ))}
      {[0, 1, 2, 3].map((j) => (
        <BinBack key={j} j={j} p={p} />
      ))}
      {Array.from({ length: 8 }, (_, k) => (
        <Card key={k} k={k} p={p} />
      ))}
      <Press p={p} />
      {[0, 1, 2, 3].map((j) => (
        <BinFront key={j} j={j} label={gates[j]} sub={subs[j]} p={p} />
      ))}

      {/* ── The moment: the big slam ── */}
      <g>
        <ellipse cx={pressX} cy={pressY} rx={30} ry={17} fill="none" stroke={p.pop} strokeWidth={4} opacity={0}>
          <animate attributeName="rx" values="40;40;40;170;170" keyTimes={burstKT} dur={`${LOOP}s`} {...rep} />
          <animate attributeName="ry" values="23;23;23;98;98" keyTimes={burstKT} dur={`${LOOP}s`} {...rep} />
          <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={burstKT} dur={`${LOOP}s`} {...rep} />
        </ellipse>
        <circle cx={pressX} cy={pressY - 10} r={120} fill="url(#cf-halo)" opacity={0}>
          <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={burstKT} dur={`${LOOP}s`} {...rep} />
        </circle>
        {Array.from({ length: 9 }, (_, i) => {
          const a = Math.PI + (i / 8) * Math.PI + (rand(i) - 0.5) * 0.25;
          const R = 95 + rand(i * 3.3) * 70;
          const tx = Math.cos(a) * R * 1.2;
          const ty = Math.sin(a) * R * 0.75 - 10;
          const s = 0.9 + rand(i * 1.7) * 0.8;
          return (
            <g key={i} transform={`translate(${pressX} ${pressY - 14})`}>
              <g opacity={0}>
                <animateTransform attributeName="transform" type="translate" values={`0 0;0 0;0 0;${tx.toFixed(1)} ${ty.toFixed(1)};${tx.toFixed(1)} ${ty.toFixed(1)}`} keyTimes={burstKT} calcMode="spline" keySplines="0 0 1 1;0 0 1 1;0.1 0.8 0.3 1;0 0 1 1" dur={`${LOOP}s`} {...rep} />
                <animate attributeName="opacity" values="0;0;1;0;0" keyTimes={burstKT} dur={`${LOOP}s`} {...rep} />
                <path d="M0,-11 L2.6,-2.6 L11,0 L2.6,2.6 L0,11 L-2.6,2.6 L-11,0 L-2.6,-2.6 Z" fill={p.pop} stroke={p.ink} strokeWidth={1} transform={`scale(${s.toFixed(2)})`} />
              </g>
            </g>
          );
        })}
      </g>

      {/* ── Foreground ── */}
      {/* control console with cable to the machine */}
      <path d={(() => {
        const [ax, ay] = S([3.2, 7.0, 0.05]);
        const [bx, by] = S([2.4, 8.1, 0.05]);
        return `M${ax},${ay} C${ax - 10},${ay + 40} ${bx + 40},${by - 10} ${bx},${by}`;
      })()} stroke={p.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
      <Shadow x={1.2} y={7.6} w={1.1} d={0.9} h={1.6} p={p} />
      <Box x={1.2} y={7.6} z={0} w={1.1} d={0.9} h={1.05} color={shade(p.machine, 0.1)} ink={ink} />
      <polygon points={poly([[1.2, 7.6, 1.45], [2.3, 7.6, 1.45], [2.3, 8.5, 1.05], [1.2, 8.5, 1.05]])} fill={shade(p.machine, 0.35)} {...ink} />
      <polygon points={poly([[2.3, 7.6, 1.05], [2.3, 7.6, 1.45], [2.3, 8.5, 1.05]])} fill={shade(p.machine, 0.0)} {...ink} />
      <polygon points={poly([[1.3, 7.7, 1.42], [2.2, 7.7, 1.42], [2.2, 8.2, 1.2], [1.3, 8.2, 1.2]])} fill={shade(p.ink, 0.1)} stroke={p.ink} strokeWidth={1} />
      {[0, 1, 2].map((i) => {
        const y0 = 7.78 + i * 0.13;
        const zz = 1.42 - (i * 0.13 * 0.4) / 0.9 - 0.02;
        return (
          <polyline key={i} points={poly([[1.38, y0, zz], [1.38 + 0.6, y0, zz]])} stroke={[p.accent, p.pop, p.trim][i]} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="40" strokeDashoffset={0}>
            <animate attributeName="stroke-dashoffset" values={`${30 - i * 6};0;${30 - i * 6}`} dur="3s" begin={`-${i}s`} {...rep} />
          </polyline>
        );
      })}
      {[0, 1, 2].map((i) => {
        const [bx, by] = S([1.45 + i * 0.3, 8.38, 1.12]);
        return <ellipse key={i} cx={bx} cy={by} rx={4} ry={2.4} fill={[p.accent, p.pop, p.machine][i]} stroke={p.ink} strokeWidth={0.8} />;
      })}
      <g transform={onY(1.2, 8.5, 0.95)}>
        <rect x={8} y={8} width={13} height={13} fill={p.pop} stroke={p.ink} strokeWidth={0.7} transform="rotate(-6 14 14)" />
        <rect x={28} y={12} width={22} height={6} rx={2} fill={p.trim} stroke={p.ink} strokeWidth={0.7} />
      </g>

      {/* toolbox + a ream of fresh briefs */}
      <Shadow x={3.2} y={10.2} w={1.1} d={0.6} h={0.9} p={p} />
      <Box x={3.2} y={10.2} z={0} w={1.1} d={0.6} h={0.5} color={p.accent} ink={ink} />
      <polyline points={poly([[3.2, 10.8, 0.36], [4.3, 10.8, 0.36]])} stroke={p.ink} strokeWidth={1} />
      <polyline points={poly([[3.5, 10.5, 0.5], [3.5, 10.5, 0.68], [4.0, 10.5, 0.68], [4.0, 10.5, 0.5]])} fill="none" stroke={p.ink} strokeWidth={2.6} strokeLinejoin="round" />
      <Shadow x={4.1} y={11.6} w={0.9} d={1.1} h={0.6} p={p} />
      {[0, 1, 2].map((i) => (
        <Box key={i} x={4.1 + (i % 2) * 0.06} y={11.6 - (i % 2) * 0.05} z={i * 0.16} w={0.9} d={1.1} h={0.16} color={i === 1 ? p.pop : shade(p.trim, 0.2)} ink={{ stroke: p.ink, strokeWidth: 1 }} />
      ))}
      <polygon points={poly([[4.5, 12.7, 0.0], [4.68, 12.7, 0.0], [4.68, 12.7, 0.48], [4.5, 12.7, 0.48]])} fill={p.accent} />

      {/* sealed sacks on a pallet, ready to fly */}
      <Shadow x={6.0} y={10.0} w={2.6} d={1.6} h={1.4} p={p} />
      <Box x={6.0} y={10.0} z={0} w={2.6} d={1.6} h={0.2} color="#C98E5A" ink={ink} />
      {(() => {
        const [a1, b1] = S([6.7, 10.4, 0.2]);
        const [a2, b2] = S([7.9, 10.4, 0.2]);
        const [a3, b3] = S([7.2, 11.2, 0.2]);
        return (
          <g>
            <Sack x={a1} y={b1} s={0.95} label={p.gate2} tag={p.accent} p={p} />
            <Sack x={a2} y={b2} s={0.9} label={p.gate4} tag={p.pop} p={p} />
            <Sack x={a3} y={b3} s={1.05} label={p.gate1} tag={p.pop} p={p} />
          </g>
        );
      })()}
      {/* front-right crate stack */}

      {/* ── Hanging lamp ── */}
      <g>
        <animateTransform attributeName="transform" type="rotate" values={`-1.2 ${LX} 0;1.2 ${LX} 0;-1.2 ${LX} 0`} dur="6s" {...SOFT} {...rep} />
        <polygon points={`${LX - 26},${LY + 4} ${LX + 26},${LY + 4} ${LX + 170},${pressY + 30} ${LX - 170},${pressY + 30}`} fill="url(#cf-cone)">
          <Flicker dur={LOOP} seed={4} low={0.75} />
        </polygon>
        <ellipse cx={pressX} cy={pressY + 10} rx={170} ry={70} fill="url(#cf-pool)">
          <Flicker dur={LOOP} seed={4} low={0.75} />
        </ellipse>
        <line x1={LX} y1={-10} x2={LX} y2={LY - 26} stroke={p.ink} strokeWidth={2} />
        <rect x={LX - 4} y={LY - 30} width={8} height={8} rx={1.5} fill={p.ink} />
        <path d={`M${LX - 36},${LY + 2} C${LX - 34},${LY - 26} ${LX + 34},${LY - 26} ${LX + 36},${LY + 2} Z`} fill={p.accent} stroke={p.ink} strokeWidth={1.3} />
        <path d={`M${LX - 30},${LY - 8} C${LX - 20},${LY - 14} ${LX + 20},${LY - 14} ${LX + 30},${LY - 8}`} stroke={p.pop} strokeWidth={3} fill="none" />
        <ellipse cx={LX} cy={LY + 2} rx={36} ry={6} fill={shade(p.accent, -0.3)} stroke={p.ink} strokeWidth={1.2} />
        <ellipse cx={LX} cy={LY + 5} rx={12} ry={6} fill={shade(p.pop, 0.4)} filter="url(#cf-glow)">
          <Flicker dur={LOOP} seed={4} low={0.6} />
        </ellipse>
      </g>

      {/* dust motes in the lamp light */}
      {Array.from({ length: 14 }, (_, i) => {
        const x = LX - 110 + rand(i * 2.1) * 220;
        const y = LY + 60 + rand(i * 5.7) * 220;
        return (
          <circle key={i} cx={x} cy={y} r={1 + rand(i * 9.1) * 1.4} fill={shade(p.pop, 0.5)} opacity={0.7}>
            <animateTransform attributeName="transform" type="translate" values={`0 0;${(rand(i) * 16 - 8).toFixed(1)} -14;0 0`} dur={`${[3, 6][i % 2]}s`} begin={`-${(rand(i * 3) * 3).toFixed(2)}s`} {...rep} />
            <animate attributeName="opacity" values="0.1;0.8;0.1" dur={`${[2, 3, 6][i % 3]}s`} begin={`-${(rand(i * 7) * 2).toFixed(2)}s`} {...rep} />
          </circle>
        );
      })}

      </g>
      {/* vignette */}
      <rect width="1200" height="900" fill="url(#cf-vig)" pointerEvents="none" />
    </svg>
  );
}
