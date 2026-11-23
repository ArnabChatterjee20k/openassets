import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Moon & Zzz',
  description: 'A crayon crescent moon snoozing with three Zs, for "your laptop sleeps, your work doesn\'t".',
  tags: ['moon', 'sleep', 'night', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FFDD00', accent: '#EAF2FF', ink: '#0B2A66' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  blueprint: { fill: '#EAF2FF', accent: '#7FB2FF', ink: '#0F3B8C' },
};

// Crescent: the outer circle's arc outside a second, offset circle, then back along that circle.
function crescent(cx: number, cy: number, R: number): Pt[] {
  const ox = cx + R * 0.42, oy = cy - R * 0.34, r = R * 0.86;
  const inside = (x: number, y: number) => Math.hypot(x - ox, y - oy) < r;
  const outer: Pt[] = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const q: Pt = [cx + Math.cos(a) * R, cy + Math.sin(a) * R];
    if (!inside(q[0], q[1])) outer.push(q);
  }
  // rotate so the run starts right after the gap
  let k = 0;
  for (let i = 1; i < outer.length; i++) {
    const d = Math.hypot(outer[i][0] - outer[i - 1][0], outer[i][1] - outer[i - 1][1]);
    if (d > R * 0.2) k = i;
  }
  const run = [...outer.slice(k), ...outer.slice(0, k)];
  const [ex, ey] = run[run.length - 1];
  const [sx, sy] = run[0];
  const a0 = Math.atan2(ey - oy, ex - ox), a1 = Math.atan2(sy - oy, sx - ox);
  let span = a1 - a0;
  while (span > 0) span -= Math.PI * 2; // go the short way round, inside the moon
  if (span < -Math.PI) span += Math.PI * 2;
  const inner: Pt[] = Array.from({ length: 12 }, (_, i): Pt => {
    const a = a0 + (span * (i + 1)) / 13;
    return [ox + Math.cos(a) * r, oy + Math.sin(a) * r];
  });
  return [...run, ...inner];
}

const zed = (x: number, y: number, s: number) => sk.poly([[x, y], [x + s, y], [x, y + s], [x + s, y + s]], { closed: false });

export default function MoonZzz(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Moon and Zzz">
      <Doodle shape={sk.curve(crescent(108, 146, 82), true)} />
      <Line shape={zed(160, 78, 26)} weight={p.weight * 1.05} />
      <Line shape={zed(196, 46, 20)} weight={p.weight * 0.9} />
      <Line shape={zed(206, 102, 15)} weight={p.weight * 0.8} />
    </Sticker>
  );
}
