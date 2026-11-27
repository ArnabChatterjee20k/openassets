import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, tint, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Hex Nut',
  description: 'A chunky crayon hex nut with a threaded hole and a shine, for fastener lots, hardware pages and spec sheets.',
  tags: ['nut', 'fastener', 'hardware', 'part', 'doodle'],
};

export const schema = stickerSchema({ fill: '#C9BEEA', accent: '#F4EFFF', ink: '#3B2E7A' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil', fill: '#9C8FD6' },
  'die-cut': { border: true },
  brass: { fill: '#E8C36A', accent: '#FFF3CF', ink: '#6B4A12' },
  steel: { fill: '#B9C6D2', accent: '#EEF3F7', ink: '#2C3A47' },
};

const hex = (cx: number, cy: number, r: number): Pt[] => Array.from({ length: 6 }, (_, i) => [cx + Math.cos((i * Math.PI) / 3) * r, cy + Math.sin((i * Math.PI) / 3) * r]);

export default function HexNut(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Hex nut">
      {/* side thickness peeking below, then the face */}
      <Doodle shape={sk.poly(hex(128, 142, 96))} fill={tint(p.fill, -0.3)} />
      <Doodle shape={sk.poly(hex(128, 124, 96))} />
      {/* threaded hole */}
      <Doodle shape={sk.circle(128, 124, 40)} fill={p.accent} hatch={false} />
      <Line shape={[sk.arc(128, 124, 30, 160, 380), sk.arc(128, 124, 20, 190, 400)]} weight={p.weight * 0.6} />
      {/* shine */}
      <Line shape={sk.arc(128, 124, 76, 200, 245)} ink={p.accent} weight={p.weight * 1.2} />
    </Sticker>
  );
}
