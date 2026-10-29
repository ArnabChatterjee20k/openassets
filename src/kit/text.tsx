// Title treatments: masked sweep reveal with blur-to-sharp, gradient fill,
// and a specular glint. These are what make a title feel "designed".
import type { CSSProperties, ReactNode } from 'react';
import { FONT_INFO, type FontInfo, type FontKey } from '@/lib/fonts';
import { clamp, ease, mix, prog } from './anim';

/** background-clip gradient text. Pads the bottom so descenders aren't clipped. */
export const gradientText = (gradient: string, size: number): CSSProperties => ({
  paddingBottom: size * 0.2,
  backgroundImage: gradient,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
});

/**
 * Reveals children with a soft left→right mask sweep while blurring in and
 * settling from a slight overscale. `start`/`dur` are in frames.
 */
export function SweepReveal({
  frame,
  start,
  dur = 34,
  blur = 16,
  scaleFrom = 1.08,
  angle = 90,
  style,
  children,
}: {
  frame: number;
  start: number;
  dur?: number;
  blur?: number;
  scaleFrom?: number;
  angle?: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const sweep = mix(-14, 114, prog(frame, start, dur, ease.inOutSoft));
  const b = mix(blur, 0, prog(frame, start, dur * 0.9, ease.out));
  const s = mix(scaleFrom, 1, prog(frame, start - 2, dur * 1.5, ease.out));
  const mask = `linear-gradient(${angle}deg, black ${sweep - 12}%, transparent ${sweep + 12}%)`;
  return (
    <div style={{ ...style, scale: String(s), filter: b > 0.2 ? `blur(${b}px)` : undefined, maskImage: mask, WebkitMaskImage: mask }}>
      {children}
    </div>
  );
}

/** A bright diagonal glint passing across text. Render it over an identical copy of the text. */
export function Glint({ frame, start, dur = 40, style, children }: { frame: number; start: number; dur?: number; style?: CSSProperties; children: ReactNode }) {
  const g = mix(-30, 130, prog(frame, start, dur, ease.inOut));
  const mask = `linear-gradient(105deg, transparent ${g - 8}%, black ${g}%, transparent ${g + 8}%)`;
  const visible = frame >= start && frame <= start + dur;
  return (
    <div
      style={{
        ...style,
        color: '#fff',
        opacity: visible ? 0.85 : 0,
        maskImage: mask,
        WebkitMaskImage: mask,
        mixBlendMode: 'plus-lighter',
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  );
}

/** Staggered per-word rise + blur-in. */
export function WordsIn({
  text,
  frame,
  start,
  stagger = 4,
  dur = 22,
  rise = 24,
  style,
  wordStyle,
}: {
  text: string;
  frame: number;
  start: number;
  stagger?: number;
  dur?: number;
  rise?: number;
  style?: CSSProperties;
  wordStyle?: CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '0.28em', ...style }}>
      {text.split(' ').map((w, i) => {
        const t = prog(frame, start + i * stagger, dur, ease.out);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: clamp(t * 1.4),
              translate: `0 ${(1 - t) * rise}px`,
              filter: t < 1 ? `blur(${(1 - t) * 8}px)` : undefined,
              ...wordStyle,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Font styles for a hero face: the font's heaviest bundled weight (avoids faux
 * bold on single-weight faces) and, for faces whose italic is their strength,
 * italic. Spread into a style object.
 */
export function displayFace(key: FontKey, opts: { italic?: boolean; weight?: number } = {}): CSSProperties {
  const info: FontInfo = FONT_INFO[key];
  const weight = opts.weight && info.weights.includes(opts.weight) ? opts.weight : Math.max(...info.weights);
  const italicFaces: FontKey[] = ['instrument', 'bodoni', 'dmserif'];
  const italic = opts.italic ?? (info.italic === true && italicFaces.includes(key));
  return { fontFamily: info.stack, fontWeight: weight, fontStyle: italic ? 'italic' : 'normal' };
}
