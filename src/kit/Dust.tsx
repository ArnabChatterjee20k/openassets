// Drifting bokeh/dust particles. Keeps "holding" shots alive: a frame where
// nothing moves reads as a freeze. Deterministic from `seed`.
import { rand } from './anim';

export function Dust({
  frame,
  width,
  height,
  count = 60,
  color = '#ffffff',
  seed = 1,
  speed = 1,
  opacity = 0.5,
  maxSize = 6,
}: {
  frame: number;
  width: number;
  height: number;
  count?: number;
  color?: string;
  seed?: number;
  speed?: number;
  opacity?: number;
  maxSize?: number;
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: number) => rand(i * 13.37 + seed * 7.1 + k);
        const depth = 0.3 + r(1) * 0.7; // nearer particles are bigger, faster, blurrier
        const size = 1 + depth * maxSize;
        const vx = (r(2) - 0.5) * 0.4 * speed * depth;
        const vy = -(0.15 + r(3) * 0.5) * speed * depth;
        const x = (((r(4) * width + frame * vx) % width) + width) % width;
        const y = (((r(5) * height + frame * vy) % height) + height) % height;
        const twinkle = 0.55 + 0.45 * Math.sin(frame / (18 + r(6) * 30) + r(7) * 6.28);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: color,
              opacity: opacity * twinkle * depth,
              filter: depth > 0.75 ? `blur(${(depth - 0.75) * 8}px)` : undefined,
              boxShadow: `0 0 ${size * 3}px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
}
