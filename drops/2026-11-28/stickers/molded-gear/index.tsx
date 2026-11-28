import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, tint, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Molded Gear',
  description: 'A chunky fresh-molded plastic gear, still showing its gate nub, with a glossy shine and heat wiggles.',
  tags: ['gear', 'part', 'plastic', 'molding', 'doodle'],
};

export const schema = stickerSchema({ fill: '#C6EE6A', accent: '#FF9F43', ink: '#2F4A1E' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  orange: { fill: '#FFB36B', accent: '#C6EE6A', ink: '#7A3A10' },
  riso: { fill: '#7FB8E8', accent: '#FF48B0', ink: '#1F2A6B' },
};

/** Gear outline: 8 flat-topped teeth around a rim. */
function gear(cx: number, cy: number, R: number, r: number, n = 8): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const s = (Math.PI * 2) / n;
    for (const [da, rad] of [[-0.5, r], [-0.3, R], [0.06, R], [0.24, r]] as const) {
      const ang = a + da * s;
      out.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]);
    }
  }
  return out;
}

export default function MoldedGear(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Molded gear">
      {/* Gate nub where the part snapped off the runner */}
      <Doodle shape={sk.rect(196, 168, 30, 18, 6)} fill={tint(p.fill, -0.15)} />
      <Doodle shape={sk.poly(gear(124, 126, 98, 76))} />
      <Doodle shape={sk.circle(124, 126, 30)} fill={p.accent} />
      {/* Gloss highlight */}
      <Line shape={sk.arc(124, 126, 58, 200, 250)} ink={tint(p.fill, 0.65)} weight={p.weight * 1.3} />
      {/* Heat wiggles */}
      <Line shape={[sk.wave(30, 40, 30, 4, 1.5), sk.wave(196, 34, 30, 4, 1.5)]} ink={p.accent} weight={p.weight * 0.8} />
    </Sticker>
  );
}
