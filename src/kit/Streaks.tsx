// Radial light streaks converging on (direction "in") or bursting from a point.
// Great for impacts, reveals and transitions.
import { useLayoutEffect, useRef } from 'react';
import { clamp, ease, rand } from './anim';

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
};

export function Streaks({
  frame,
  start,
  dur,
  width,
  height,
  direction = 'in',
  count = 160,
  cx = width / 2,
  cy = height / 2,
  seed = 1,
  intensity = 1,
  color = '#ffffff',
  highlight = '#ffffff',
}: {
  frame: number;
  start: number;
  dur: number;
  width: number;
  height: number;
  direction?: 'in' | 'out';
  count?: number;
  cx?: number;
  cy?: number;
  seed?: number;
  intensity?: number;
  color?: string;
  highlight?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const u = (frame - start) / dur;
  const active = u > -0.05 && u < 1.05;
  const reach = Math.max(width, height);

  useLayoutEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    if (!active) return;
    ctx.globalCompositeOperation = 'lighter';
    const c1 = rgb(color);
    const c2 = rgb(highlight);
    for (let i = 0; i < count; i++) {
      const r0 = rand(i * 3.7 + seed);
      const r1 = rand(i * 9.1 + seed * 2);
      const r2 = rand(i * 1.3 + seed * 5);
      const angle = r0 * Math.PI * 2;
      const local = clamp((u - r1 * 0.4) / 0.6);
      if (local <= 0 || local >= 1) continue;
      const far = reach * (0.36 + r2 * 0.47);
      const near = 8 + r1 * 30;
      const len = reach * (0.06 + r2 * 0.19) * Math.sin(Math.PI * local);
      let head: number;
      let tail: number;
      if (direction === 'in') {
        head = near + (far - near) * (1 - ease.in(local));
        tail = head + len;
      } else {
        head = near + (far - near) * ease.out(local);
        tail = Math.max(near, head - len);
      }
      const a = Math.sin(Math.PI * local) * (0.35 + r0 * 0.65) * intensity;
      const x1 = cx + Math.cos(angle) * head;
      const y1 = cy + Math.sin(angle) * head;
      const x2 = cx + Math.cos(angle) * tail;
      const y2 = cy + Math.sin(angle) * tail;
      const g = ctx.createLinearGradient(x2, y2, x1, y1);
      const c = i % 5 === 0 ? c2 : c1;
      g.addColorStop(0, `rgba(${c},0)`);
      g.addColorStop(1, `rgba(${c},${a})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1 + r1 * 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }, [u, active, count, cx, cy, direction, seed, intensity, width, height, reach, color, highlight]);

  return <canvas ref={ref} width={width} height={height} style={{ position: 'absolute', inset: 0, width, height, pointerEvents: 'none' }} />;
}
