import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'New Mail Sparkles',
  description: 'A cluster of crayon sparkles and a dot to mark something new: a fresh inbox, a feature, a delivered message.',
  tags: ['sparkle', 'new', 'shine', 'mark', 'doodle'],
};

export const schema = stickerSchema({ fill: '#E3C34F', accent: '#8FB35A', ink: '#6B5410' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker' },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  postbox: { fill: '#F28A6E', accent: '#E3C34F', ink: '#7A2A1A' },
  matcha: { fill: '#A8C47A', accent: '#E3C34F', ink: '#33461C' },
};

export default function Sparkles(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Sparkles">
      <Doodle shape={sk.sparkle(108, 146, 80)} />
      <Doodle shape={sk.sparkle(192, 72, 36)} fill={p.accent} />
      <Doodle shape={sk.sparkle(200, 178, 20)} fill={p.accent} />
      <Doodle shape={sk.circle(54, 60, 10)} fill={p.accent} />
    </Sticker>
  );
}
