import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, tint } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Spark Burst',
  description: 'A hot orange starburst with a lime sparkle, for "New", "Rush" and price callouts.',
  tags: ['burst', 'sparkle', 'new', 'callout', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FF9F43', accent: '#C6EE6A', ink: '#9A4A14' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  lime: { fill: '#C6EE6A', accent: '#FF9F43', ink: '#3E5A17' },
  cola: { fill: '#E3173E', accent: '#F7B32B', ink: '#5E0A18' },
};

export default function SparkBurst(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Spark burst">
      <Doodle shape={sk.burst(128, 132, 98, 74, 14)} />
      <Doodle shape={sk.circle(128, 132, 54)} fill={tint(p.fill, 0.3)} hatch={false} weight={p.weight * 0.6} />
      <Doodle shape={sk.sparkle(128, 132, 40, 0.3)} fill={p.accent} />
      <Doodle shape={sk.sparkle(206, 50, 20, 0.3)} fill={p.accent} />
      <Line shape={[sk.poly([[40, 46], [56, 62]], { closed: false }), sk.poly([[30, 78], [50, 82]], { closed: false })]} weight={p.weight * 0.8} />
    </Sticker>
  );
}
