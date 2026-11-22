import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Lightning Bolt',
  description: 'A zigzag crayon bolt with spark ticks, for storm warnings, alerts and anything fast.',
  tags: ['weather', 'storm', 'alert', 'energy', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FFE14D', accent: '#FF9F1C', ink: '#3B2F12' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.3 },
  pencil: { style: 'pencil', fill: '#F2B807' },
  'die-cut': { border: true },
  electric: { fill: '#7DF9FF', accent: '#3B82F6', ink: '#1E2A5A' },
  hot: { fill: '#FF6B6B', accent: '#FFD166', ink: '#5A1A1A' },
};

export default function LightningBolt(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Lightning bolt">
      <Doodle shape={sk.bolt(128, 128, 96)} />
      {/* Spark ticks around the bolt. */}
      <Line shape={[sk.poly([[184, 66], [204, 52]], { closed: false }), sk.poly([[192, 92], [216, 90]], { closed: false }), sk.poly([[62, 172], [40, 186]], { closed: false }), sk.poly([[66, 146], [42, 142]], { closed: false })]} ink={p.accent} weight={p.weight * 0.9} />
    </Sticker>
  );
}
