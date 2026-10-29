// Motion helpers. Prefer these curves over default springs/linear tweens:
// expo-out entrances, soft in-out moves, eased exits.
import { Easing, interpolate, spring } from 'remotion';

export type EaseFn = (t: number) => number;

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const ease = {
  linear: (t: number) => t,
  out: Easing.bezier(0.16, 1, 0.3, 1), // expo-ish out: fast arrival, long settle
  outSoft: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  inOutSoft: Easing.bezier(0.45, 0, 0.2, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inSoft: Easing.bezier(0.5, 0, 0.75, 0),
  backOut: Easing.bezier(0.34, 1.56, 0.64, 1), // slight overshoot
  snap: Easing.bezier(0.2, 0.9, 0.1, 1),
} as const;

/** Clamped, eased 0..1 progress of `frame` between `start` and `start + dur`. */
export const prog = (frame: number, start: number, dur: number, fn: EaseFn = ease.out) =>
  fn(clamp((frame - start) / Math.max(1, dur)));

/** Clamped interpolate with one easing. */
export const tween = (frame: number, input: [number, number], output: [number, number], fn: EaseFn = ease.out) =>
  interpolate(frame, input, output, { easing: fn, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

/** Multi-stop keyframes; `fns` gives one easing per segment. */
export const keys = (frame: number, input: number[], output: number[], fns?: EaseFn | EaseFn[]) => {
  const list = Array.isArray(fns) ? fns : undefined;
  let i = 0;
  while (i < input.length - 2 && frame > input[i + 1]) i++;
  const fn = list ? list[Math.min(i, list.length - 1)] : ((fns as EaseFn | undefined) ?? ease.inOut);
  return interpolate(frame, [input[i], input[i + 1]], [output[i], output[i + 1]], {
    easing: fn,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

export const springAt = (frame: number, start: number, fps: number, config: { damping?: number; stiffness?: number; mass?: number } = {}) =>
  spring({ frame: frame - start, fps, config: { damping: 18, stiffness: 140, mass: 1, ...config } });

/** 0 → 1 → 0 envelope for elements that enter, hold, and leave. */
export const inOut = (frame: number, start: number, inDur: number, hold: number, outDur: number, fnIn: EaseFn = ease.out, fnOut: EaseFn = ease.in) => {
  if (frame < start + inDur) return prog(frame, start, inDur, fnIn);
  return 1 - prog(frame, start + inDur + hold, outDur, fnOut);
};

/** Deterministic pseudo-random in [0, 1) from a numeric seed. */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};

/** Typewriter: the visible prefix of `text` at `cps` characters per second. */
export const typed = (frame: number, start: number, fps: number, cps: number, text: string) =>
  text.slice(0, Math.max(0, Math.floor(((frame - start) / fps) * cps)));

/** Cubic bezier point, for moving things along curved paths. */
export const bezierPoint = (t: number, p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number]): [number, number] => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
};

/** '#RRGGBB' + alpha → 'rgba(...)'. */
export const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/**
 * Musical timing: cut scenes and land hits on beats so motion feels rhythmic.
 * At 60 fps and 120 BPM one beat is 30 frames and one bar is 120.
 */
export const tempo = (fps: number, bpm = 120) => {
  const beat = (fps * 60) / bpm;
  return { beat, bar: beat * 4, beats: (n: number) => Math.round(n * beat), bars: (n: number) => Math.round(n * beat * 4) };
};
