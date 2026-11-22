// Hand-drawn sticker toolkit: wobbly crayon / marker / pencil doodles as plain SVG.
//
// An asset describes clean geometry with `sk.*` (circles, clouds, stars, arrows…)
// and renders it with <Doodle> (filled shape + outline) and <Line> (open stroke)
// inside <Sticker>. The kit adds the hand-drawn part: seeded wobble, strokes that
// overshoot their start like a real pen, a double pass, crayon grain, scribble
// hatching, an optional white die-cut border and an optional "boil" (the
// redrawn-every-few-frames jitter of hand-drawn animation).
//
// Everything is deterministic for a given `seed`, so stills, exports and the
// editor agree, and "Redraw" in the editor just changes the seed.
import { createContext, useContext, useId, type ReactNode, type SVGProps } from 'react';
import { z } from 'zod';
import { color, num, select, toggle } from '@/lib/params';

export type Pt = [number, number];
/** A path as points. `sharp` keeps corners (stars, bolts); otherwise it's smoothed. */
export interface Shape {
  pts: Pt[];
  closed: boolean;
  sharp?: boolean;
}

// ---- schema ----------------------------------------------------------------

export const STICKER_STYLES = ['crayon', 'marker', 'pencil'] as const;
/** draw: outlines draw themselves in, colour fills, then the lines boil. boil: just the redraw jitter. */
export const STICKER_MOTIONS = ['draw', 'boil', 'still'] as const;
/** Length of one sticker animation loop, in seconds (also the video length). */
export const STICKER_LOOP = 4;

/** Base schema for every sticker. Extend it with the sticker's own colours. */
export const stickerSchema = (d: { fill: string; ink?: string; accent?: string; style?: (typeof STICKER_STYLES)[number] }) =>
  z.object({
    fill: color('Fill').default(d.fill),
    accent: color('Accent').default(d.accent ?? d.fill),
    ink: color('Outline').default(d.ink ?? '#2B2118'),
    style: select(STICKER_STYLES, 'Style').default(d.style ?? 'crayon'),
    weight: num(2, 14, 0.5, 'Line weight').default(6),
    wobble: num(0, 1, 0.05, 'Wobble').default(0.5),
    grain: num(0, 1, 0.05, 'Texture').default(0.55),
    seed: num(1, 99, 1, 'Redraw').default(7),
    border: toggle('Sticker border').default(false),
    motion: select(STICKER_MOTIONS, 'Motion').default('draw'),
  });

export type StickerParams = z.infer<ReturnType<typeof stickerSchema>>;

// ---- randomness ------------------------------------------------------------

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashShape(s: Shape, salt: number) {
  let h = 2166136261 ^ salt;
  for (const [x, y] of s.pts.slice(0, 6)) {
    h = Math.imul(h ^ Math.round(x * 10), 16777619);
    h = Math.imul(h ^ Math.round(y * 10), 16777619);
  }
  return h >>> 0;
}

// ---- geometry --------------------------------------------------------------

const TAU = Math.PI * 2;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Subdivides edges so wobble bends long straight sides, not just corners. */
function resample(pts: Pt[], closed: boolean, step = 14): Pt[] {
  const out: Pt[] = [];
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % pts.length];
    const k = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step));
    for (let j = 0; j < k; j++) out.push([ax + ((bx - ax) * j) / k, ay + ((by - ay) * j) / k]);
  }
  if (!closed) out.push(pts[pts.length - 1]);
  return out;
}

const ring = (cx: number, cy: number, rx: number, ry: number, n: number, f: (a: number) => number = () => 1, rot = -Math.PI / 2): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const a = rot + (i / n) * TAU;
    const k = f(a);
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });

/** Clean geometry. Coordinates are in the sticker's 256 × 256 viewBox. */
export const sk = {
  circle: (cx: number, cy: number, r: number): Shape => ({ pts: ring(cx, cy, r, r, Math.max(10, Math.round(r / 3.5))), closed: true }),
  ellipse: (cx: number, cy: number, rx: number, ry: number, rotDeg = 0): Shape => {
    const a = (rotDeg * Math.PI) / 180;
    const pts = ring(0, 0, rx, ry, Math.max(12, Math.round((rx + ry) / 7))).map(([x, y]): Pt => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]);
    return { pts, closed: true };
  },
  /** Rounded rectangle. */
  rect: (x: number, y: number, w: number, h: number, r = 0): Shape => {
    r = Math.min(r, w / 2, h / 2);
    if (r <= 0) return { pts: resample([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true), closed: true, sharp: true };
    const pts: Pt[] = [];
    const corner = (cx: number, cy: number, a0: number) => {
      for (let i = 0; i <= 4; i++) {
        const a = a0 + (i / 4) * (Math.PI / 2);
        pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    };
    corner(x + w - r, y + r, -Math.PI / 2);
    corner(x + w - r, y + h - r, 0);
    corner(x + r, y + h - r, Math.PI / 2);
    corner(x + r, y + r, Math.PI);
    return { pts: resample(pts, true, 16), closed: true };
  },
  /** Any polygon or polyline; `sharp` keeps its corners crisp. */
  poly: (pts: Pt[], { closed = true, sharp = true } = {}): Shape => ({ pts: resample(pts, closed), closed, sharp }),
  /** A smooth curve through the given points. */
  curve: (pts: Pt[], closed = false): Shape => ({ pts, closed }),
  star: (cx: number, cy: number, R: number, r = R * 0.45, n = 5, rotDeg = -90): Shape => {
    const pts: Pt[] = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (rotDeg * Math.PI) / 180 + (i / (n * 2)) * TAU;
      const k = i % 2 ? r : R;
      pts.push([cx + Math.cos(a) * k, cy + Math.sin(a) * k]);
    }
    return { pts: resample(pts, true, 12), closed: true, sharp: true };
  },
  /** Four-point sparkle with curved, pinched sides. */
  sparkle: (cx: number, cy: number, R: number, pinch = 0.32): Shape => {
    // Four points joined by inward-curving sides (a concave diamond).
    const pts: Pt[] = [];
    for (let q = 0; q < 4; q++) {
      const a0 = -Math.PI / 2 + (q * Math.PI) / 2, a1 = a0 + Math.PI / 2;
      const p0: Pt = [cx + Math.cos(a0) * R, cy + Math.sin(a0) * R];
      const p1: Pt = [cx + Math.cos(a1) * R, cy + Math.sin(a1) * R];
      const c: Pt = [cx + Math.cos((a0 + a1) / 2) * R * pinch, cy + Math.sin((a0 + a1) / 2) * R * pinch];
      for (let i = 0; i < 8; i++) {
        const t = i / 8;
        pts.push([(1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]]);
      }
    }
    return { pts, closed: true, sharp: true };
  },
  heart: (cx: number, cy: number, s: number): Shape => ({
    pts: Array.from({ length: 36 }, (_, i): Pt => {
      const t = (i / 36) * TAU;
      const x = 16 * Math.sin(t) ** 3;
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      return [cx + (x * s) / 17, cy - (y * s) / 17];
    }),
    closed: true,
  }),
  /** Puffy cloud: an ellipse with scalloped bumps. */
  cloud: (cx: number, cy: number, w: number, h: number, bumps = 7): Shape => ({
    pts: ring(cx, cy, w / 2, h / 2, bumps * 10, (a) => 0.82 + 0.18 * Math.abs(Math.sin((bumps * (a + Math.PI / 2)) / 2)), -Math.PI / 2),
    closed: true,
  }),
  /** Sun-style burst: a jagged ring of rays. */
  burst: (cx: number, cy: number, R: number, r = R * 0.72, n = 12): Shape => sk.star(cx, cy, R, r, n),
  /** Teardrop pointing up. */
  drop: (cx: number, cy: number, s: number): Shape => {
    // A round belly centred low, swept up to a point at the top.
    const r = s * 0.55, by = cy + s * 0.3;
    // Two points near the tip keep it pointed after smoothing.
    const pts: Pt[] = [[cx - s * 0.04, cy - s * 1.05], [cx + s * 0.04, cy - s * 1.05]];
    for (let i = 0; i <= 20; i++) {
      const a = (-30 + (i / 20) * 240) * (Math.PI / 180);
      pts.push([cx + Math.cos(a) * r, by + Math.sin(a) * r]);
    }
    return { pts: pts.reverse().map(([x, y]): Pt => [x, y]), closed: true };
  },
  /** Lightning bolt, top-right to bottom-left. */
  bolt: (cx: number, cy: number, s: number): Shape =>
    sk.poly(
      ([[0.12, -1], [-0.42, 0.08], [-0.02, 0.08], [-0.16, 1], [0.44, -0.18], [0.04, -0.18], [0.22, -1]] as Pt[]).map(([x, y]): Pt => [cx + x * s, cy + y * s]),
    ),
  spiral: (cx: number, cy: number, r: number, turns = 2.5): Shape => ({
    pts: Array.from({ length: Math.round(turns * 18) + 1 }, (_, i): Pt => {
      const t = i / Math.round(turns * 18);
      const ang = t * turns * TAU;
      return [cx + Math.cos(ang) * r * t, cy + Math.sin(ang) * r * t];
    }),
    closed: false,
  }),
  wave: (x: number, y: number, w: number, amp = 10, n = 3): Shape => ({
    pts: Array.from({ length: n * 8 + 1 }, (_, i): Pt => [x + (i / (n * 8)) * w, y + Math.sin((i / 8) * TAU) * amp]),
    closed: false,
  }),
  zigzag: (x: number, y: number, w: number, h = 16, n = 5): Shape => ({
    pts: Array.from({ length: n * 2 + 1 }, (_, i): Pt => [x + (i / (n * 2)) * w, y + (i % 2 ? h / 2 : -h / 2)]),
    closed: false,
    sharp: true,
  }),
  arc: (cx: number, cy: number, r: number, fromDeg: number, toDeg: number): Shape => {
    const n = Math.max(6, Math.round(Math.abs(toDeg - fromDeg) / 12));
    return {
      pts: Array.from({ length: n + 1 }, (_, i): Pt => {
        const a = ((fromDeg + ((toDeg - fromDeg) * i) / n) * Math.PI) / 180;
        return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      }),
      closed: false,
    };
  },
  /** A curved arrow through `pts`, with an open two-stroke head at the end. */
  arrow: (pts: Pt[], head = 22): Shape[] => {
    const [ax, ay] = pts[pts.length - 2];
    const [bx, by] = pts[pts.length - 1];
    const a = Math.atan2(by - ay, bx - ax);
    const wing = (d: number): Pt => [bx - Math.cos(a + d) * head, by - Math.sin(a + d) * head];
    return [
      { pts, closed: false },
      { pts: [wing(0.5), [bx, by], wing(-0.5)], closed: false, sharp: true },
    ];
  },
};

// ---- hand-drawn path ---------------------------------------------------------

/** Low-frequency wobble: random offsets, then averaged with neighbours. */
function wobble(pts: Pt[], amt: number, rnd: () => number, closed: boolean, sharp = false): Pt[] {
  const raw = pts.map(([x, y]): Pt => [x + (rnd() - 0.5) * 2 * amt, y + (rnd() - 0.5) * 2 * amt]);
  // Averaging would round off corners (and flatten a zigzag into a line).
  if (sharp) return raw;
  const n = raw.length;
  return raw.map((p, i) => {
    const prev = raw[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const next = raw[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    return [(prev[0] + 2 * p[0] + next[0]) / 4, (prev[1] + 2 * p[1] + next[1]) / 4];
  });
}

/** Catmull-Rom spline as cubic béziers, or straight segments for sharp shapes. */
function toPath(pts: Pt[], closed: boolean, sharp: boolean): string {
  if (pts.length < 2) return '';
  const P = (p: Pt) => `${r2(p[0])} ${r2(p[1])}`;
  if (sharp) return `M${pts.map(P).join('L')}${closed ? 'Z' : ''}`;
  const n = pts.length;
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${P(pts[0])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return d + (closed ? 'Z' : '');
}

/** One hand-drawn rendition of a shape. Closed outlines overshoot their start like a pen. */
function drawn(s: Shape, seed: number, amt: number, { overshoot = false } = {}): string {
  const rnd = mulberry32(seed);
  let pts = wobble(s.pts, amt, rnd, s.closed, s.sharp);
  if (overshoot && s.closed) {
    // Carry on a little past the start, drifting outward, instead of closing neatly.
    const extra = Math.max(2, Math.round(pts.length * 0.12));
    pts = [...pts, ...pts.slice(0, extra).map(([x, y], i): Pt => [x + (i + 1) * 0.5 * (rnd() - 0.3), y + (i + 1) * 0.5 * (rnd() - 0.3)])];
    return toPath(pts, false, !!s.sharp);
  }
  return toPath(pts, s.closed, !!s.sharp);
}

// ---- rendering --------------------------------------------------------------

interface Ctx {
  p: StickerParams;
  grainId: string;
  boilFrames: number;
  /** Next drawing-order slot; elements draw in on a stagger in render order. */
  next: () => number;
}
const StickerCtx = createContext<Ctx | null>(null);
const useSticker = () => {
  const c = useContext(StickerCtx);
  if (!c) throw new Error('<Doodle>/<Line> must be inside <Sticker>');
  return c;
};

const safeId = (id: string) => 'sk' + id.replace(/[^a-zA-Z0-9]/g, '');

const BOIL_FRAMES = 3;
const BOIL_DUR = '0.5s'; // divides STICKER_LOOP
const STAGGER = 0.3; // seconds between elements drawing in
const LAST_START = 2.2; // everything has started by here, leaving a hold before the loop restarts
const STROKE_TIME = 0.55;
const FILL_TIME = 0.35;

const kt = (...ts: number[]) => ts.map((t) => r2(Math.min(1, Math.max(0, t / STICKER_LOOP)))).join(';');

/**
 * A path that, depending on the sticker's motion, draws itself in (`reveal`) at
 * second `at` and redraws itself with new wobble a few times a second. Without
 * SMIL (PNG export, resvg) it is simply the finished drawing.
 */
function BoilPath({ make, reveal, at = 0, ...rest }: { make: (frame: number) => string; reveal?: 'stroke' | 'fill'; at?: number } & SVGProps<SVGPathElement>) {
  const { boilFrames, p } = useSticker();
  const d0 = make(0);
  const draw = p.motion === 'draw' && reveal;
  const frames = boilFrames > 1 ? Array.from({ length: boilFrames }, (_, i) => make(i)) : [];
  const dur = `${STICKER_LOOP}s`;
  return (
    <path d={d0} {...rest} {...(draw === 'stroke' ? { pathLength: 1 } : {})}>
      {draw === 'stroke' && (
        <animate attributeName="stroke-dasharray" values="0 1;0 1;1 0;1 0" keyTimes={`0;${kt(at, at + STROKE_TIME)};1`} dur={dur} repeatCount="indefinite" />
      )}
      {draw === 'fill' && <animate attributeName="opacity" values="0;0;1;1" keyTimes={`0;${kt(at, at + FILL_TIME)};1`} dur={dur} repeatCount="indefinite" />}
      {frames.length > 0 && <animate attributeName="d" values={[...frames, frames[0]].join(';')} dur={BOIL_DUR} calcMode="discrete" repeatCount="indefinite" />}
    </path>
  );
}

const styleOf = (p: StickerParams) => ({
  stroke: p.style === 'pencil' ? p.weight * 0.45 : p.style === 'marker' ? p.weight * 0.9 : p.weight,
  wobble: (p.style === 'marker' ? 1.6 : 2.6) * p.wobble + 0.4,
  solidFill: p.style !== 'pencil',
  hatch: p.style !== 'marker',
});

/**
 * A filled, outlined shape. `fill` defaults to the sticker's fill colour; pass
 * `outline={false}` for blobs of colour (cheeks, highlights) and `hatch={false}`
 * to skip the scribble texture.
 */
export function Doodle({ shape, fill, ink, outline = true, hatch = true, weight }: { shape: Shape; fill?: string; ink?: string; outline?: boolean; hatch?: boolean; weight?: number }) {
  const { p, grainId, next } = useSticker();
  const st = styleOf(p);
  const clipId = safeId(useId());
  const at = Math.min(next() * STAGGER, LAST_START);
  // Shapes without an outline (blush, highlights) just fade in.
  const fillAt = outline ? at + STROKE_TIME * 0.6 : at;
  const base = hashShape(shape, p.seed * 7919);
  const f = fill ?? p.fill;
  const w = weight ?? st.stroke;
  const fillPath = (k: number) => drawn(shape, base + k * 101, st.wobble * 0.7);
  // Scribble hatch: a back-and-forth stroke across the shape's bounds, clipped to it.
  const xs = shape.pts.map((q) => q[0]), ys = shape.pts.map((q) => q[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const gap = Math.max(5, w * 1.15);
  const zig: Pt[] = [];
  for (let x = x0 - (y1 - y0), i = 0; x < x1 + gap; x += gap, i++) zig.push(i % 2 ? [x + (y1 - y0) * 0.6, y0 - 4] : [x, y1 + 4]);
  const hatchShape: Shape = { pts: resample(zig, false, 18), closed: false, sharp: true };
  return (
    <g filter={`url(#${grainId})`}>
      {st.solidFill && <BoilPath make={fillPath} fill={f} reveal="fill" at={fillAt} />}
      {hatch && st.hatch && zig.length > 1 && (
        <>
          <clipPath id={clipId}>
            <path d={fillPath(0)} />
          </clipPath>
          <g clipPath={`url(#${clipId})`}>
            <BoilPath
              make={(k) => drawn(hatchShape, base + 7 + k * 31, st.wobble)}
              reveal="stroke"
              at={fillAt + 0.1}
              fill="none"
              stroke={p.style === 'pencil' ? tint(f, -0.3) : tint(f, -0.18)}
              strokeOpacity={p.style === 'pencil' ? 0.9 : 0.45}
              strokeWidth={p.style === 'pencil' ? w * 0.9 : w * 0.55}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </>
      )}
      {outline && <Strokes shape={shape} seed={base + 3} ink={ink ?? p.ink} w={w} at={at} />}
    </g>
  );
}

/** Two passes of the same outline with different wobble, like a pen gone round twice. */
function Strokes({ shape, seed, ink, w, at = 0 }: { shape: Shape; seed: number; ink: string; w: number; at?: number }) {
  const { p } = useSticker();
  const st = styleOf(p);
  const common = { fill: 'none', stroke: ink, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <>
      <BoilPath make={(k) => drawn(shape, seed + k * 13, st.wobble, { overshoot: true })} reveal="stroke" at={at} {...common} strokeWidth={w} />
      {p.style !== 'marker' && <BoilPath make={(k) => drawn(shape, seed + 977 + k * 17, st.wobble * 1.2, { overshoot: true })} reveal="stroke" at={at + 0.15} {...common} strokeWidth={w * 0.45} strokeOpacity={0.7} />}
    </>
  );
}

/** An open stroke (or several): arrows, underlines, rays, mouths, motion lines. */
export function Line({ shape, ink, weight }: { shape: Shape | Shape[]; ink?: string; weight?: number }) {
  const { p, grainId, next } = useSticker();
  const st = styleOf(p);
  const shapes = Array.isArray(shape) ? shape : [shape];
  const at = Math.min(next() * STAGGER, LAST_START);
  return (
    <g filter={`url(#${grainId})`}>
      {shapes.map((s, i) => (
        <Strokes key={i} shape={s} seed={hashShape(s, p.seed * 104729 + i)} ink={ink ?? p.ink} w={weight ?? st.stroke} at={at + i * 0.18} />
      ))}
    </g>
  );
}

/** Lightens (amt > 0) or darkens (amt < 0) a #RRGGBB colour. */
export function tint(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt)));
  return '#' + ch.map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');
}

/**
 * The sticker root: one <svg viewBox="0 0 256 256">. Keep the drawing within
 * about 28–228 so the die-cut border and shadow have room.
 */
export function Sticker({ p, children, label }: { p: StickerParams; children: ReactNode; label?: string }) {
  const id = safeId(useId());
  const grainId = `${id}g`, cutId = `${id}c`, artId = `${id}a`;
  const g = p.style === 'marker' ? p.grain * 0.25 : p.grain;
  // Crayon: wax skips over paper tooth, leaving speckled gaps. Pencil: finer tooth.
  // Streaky noise (stretched horizontally) thresholded into sparse gaps.
  const freq = p.style === 'pencil' ? '0.5 1.6' : '0.18 0.55';
  const k = 10;
  const threshold = 0.74 - 0.16 * g;
  let order = 0;
  const ctx: Ctx = { p, grainId, boilFrames: p.motion === 'still' ? 1 : BOIL_FRAMES, next: () => order++ };
  return (
    <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={label}>
      <defs>
        <filter id={grainId} filterUnits="userSpaceOnUse" x="-16" y="-16" width="288" height="288" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed={p.seed} result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale={1 + g * 3} xChannelSelector="R" yChannelSelector="G" result="wobbled" />
          <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2" seed={p.seed + 1} result="tooth" />
          <feColorMatrix in="tooth" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${-k} 0 0 0 ${r2(k * threshold)}`} result="mask" />
          <feComposite in="wobbled" in2="mask" operator="in" />
        </filter>
        {p.border && (
          <filter id={cutId} filterUnits="userSpaceOnUse" x="-16" y="-16" width="288" height="288">
            <feMorphology in="SourceAlpha" operator="dilate" radius="9" result="fat" />
            <feGaussianBlur in="fat" stdDeviation="1" result="soft" />
            <feFlood floodColor="#FFFFFF" />
            <feComposite in2="soft" operator="in" result="paper" />
            <feDropShadow in="paper" dx="0" dy="3" stdDeviation="3" floodColor="#000000" floodOpacity="0.16" />
          </filter>
        )}
      </defs>
      <StickerCtx.Provider value={ctx}>
        {p.border && (
          <g filter={`url(#${cutId})`}>
            <use href={`#${artId}`} />
          </g>
        )}
        <g id={artId}>{children}</g>
      </StickerCtx.Provider>
    </svg>
  );
}
