import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Ring Sparkles',
  description: 'A saffron sparkle cluster with little ring ticks, for "connected!" moments, feature callouts and launch posts.',
  tags: ['sparkle', 'shine', 'highlight', 'doodle'],
};

export const schema = stickerSchema({ fill: '#F2A541', accent: '#C8553D', ink: '#7A3E12' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker' },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  sage: { fill: '#9CB89F', accent: '#F2A541', ink: '#2F4A36' },
  clay: { fill: '#E88B6E', accent: '#F2A541', ink: '#6E2616' },
};

export default function RingSparkles(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Sparkles">
      <Doodle shape={sk.sparkle(112, 140, 80)} />
      <Doodle shape={sk.sparkle(192, 66, 34)} fill={p.accent} />
      <Doodle shape={sk.sparkle(198, 186, 22)} fill={p.accent} />
      {/* ring ticks, like a phone buzzing */}
      <Line shape={sk.arc(112, 140, 104, 200, 232)} weight={p.weight * 0.9} />
      <Line shape={sk.arc(112, 140, 104, 128, 160)} weight={p.weight * 0.9} />
    </Sticker>
  );
}
