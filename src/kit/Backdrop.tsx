// Layered stage background: deep base, soft centre lift, dot grid, colored
// glows, vignette and film grain. Flat single-color backgrounds look cheap;
// build depth with these layers instead. All layers are driven by props
// (including `frame`) so they work in Remotion videos and static banners.
import type { CSSProperties, ReactNode } from 'react';

export interface Glow {
  x: number;
  y: number;
  size: number;
  color: string;
  opacity?: number;
}

const fill: CSSProperties = { position: 'absolute', inset: 0 };

export function Backdrop({
  base,
  glows = [],
  grid = {},
  vignette = 0.6,
  grain = 0.05,
  frame = 0,
  lift = 'rgba(255,255,255,0.06)',
  children,
}: {
  base: string;
  glows?: Glow[];
  grid?: { opacity?: number; size?: number; x?: number; y?: number; fade?: number; color?: string } | false;
  vignette?: number;
  grain?: number;
  frame?: number;
  /** Soft radial highlight in the centre, gives the stage a sense of light. */
  lift?: string;
  children?: ReactNode;
}) {
  const g = grid === false ? null : { opacity: 0.08, size: 36, x: 0, y: 0, fade: 0.78, color: '255,255,255', ...grid };
  return (
    <div style={{ ...fill, backgroundColor: base, overflow: 'hidden' }}>
      <div style={{ ...fill, background: `radial-gradient(ellipse 70% 60% at 50% 45%, ${lift} 0%, transparent 70%)` }} />
      {g && (
        <div
          style={{
            ...fill,
            backgroundImage: `radial-gradient(circle, rgba(${g.color},${g.opacity}) 1.1px, transparent 1.6px)`,
            backgroundSize: `${g.size}px ${g.size}px`,
            backgroundPosition: `${g.x}px ${g.y}px`,
            maskImage: `radial-gradient(ellipse ${g.fade * 100}% ${g.fade * 100}% at 50% 50%, black 30%, transparent 100%)`,
            WebkitMaskImage: `radial-gradient(ellipse ${g.fade * 100}% ${g.fade * 100}% at 50% 50%, black 30%, transparent 100%)`,
          }}
        />
      )}
      {glows.map((glow, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: glow.x - glow.size / 2,
            top: glow.y - glow.size / 2,
            width: glow.size,
            height: glow.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glow.color} 0%, transparent 68%)`,
            opacity: glow.opacity ?? 0.35,
            mixBlendMode: 'screen',
          }}
        />
      ))}
      {children}
      <FilmOverlay grain={grain} vignette={vignette} frame={frame} />
    </div>
  );
}

/** Vignette + grain only; layer it on top of scene content. */
export function FilmOverlay({ grain = 0.05, vignette = 0.5, frame = 0 }: { grain?: number; vignette?: number; frame?: number }) {
  return (
    <div style={{ ...fill, pointerEvents: 'none' }}>
      {vignette > 0 && (
        <div style={{ ...fill, background: `radial-gradient(ellipse 85% 80% at 50% 50%, transparent 52%, rgba(0,0,0,${vignette}) 100%)` }} />
      )}
      {grain > 0 && <Grain opacity={grain} frame={frame} />}
    </div>
  );
}

/** Procedural film grain that re-seeds every 2 frames (deterministic). */
export function Grain({ opacity, frame = 0 }: { opacity: number; frame?: number }) {
  const step = Math.floor(frame / 2);
  const id = `grain-${step % 97}`;
  return (
    <svg style={{ ...fill, width: '100%', height: '100%', opacity, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={step % 97} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}
