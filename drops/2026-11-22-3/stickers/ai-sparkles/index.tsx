import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'AI Sparkles',
  description: 'Three crayon sparkles, the universal "AI did this" mark, to scatter beside new features and AI-generated numbers.',
  tags: ['sparkle', 'ai', 'new', 'highlight', 'doodle'],
};

export const schema = stickerSchema({ fill: '#7B68EE', accent: '#F49CBB', ink: '#2A1D6B' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker' },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  teal: { fill: '#2EC4B6', accent: '#FFE07A', ink: '#0F4F49' },
  riso: { fill: '#FF48B0', accent: '#FFE800', ink: '#1F2A6B' },
};

export default function AiSparkles(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="AI sparkles">
      <Doodle shape={sk.sparkle(110, 140, 82)} />
      <Doodle shape={sk.sparkle(192, 66, 36)} fill={p.accent} />
      <Doodle shape={sk.sparkle(200, 186, 24)} fill={p.accent} />
    </Sticker>
  );
}
