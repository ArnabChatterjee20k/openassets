import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Sparkles',
  description: 'A cluster of three crayon sparkles to scatter around headlines, new features and clear-sky days.',
  tags: ['sparkle', 'new', 'highlight', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FFD23F', accent: '#7DD3FC', ink: '#7A5A00' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker' },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  candy: { fill: '#FF8FC7', accent: '#B49CFF', ink: '#7A2E5B' },
  mint: { fill: '#8CF0C8', accent: '#FFE07A', ink: '#1F6B52' },
};

export default function Sparkles(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Sparkles">
      <Doodle shape={sk.sparkle(116, 136, 78)} />
      <Doodle shape={sk.sparkle(190, 70, 34)} fill={p.accent} />
      <Doodle shape={sk.sparkle(196, 182, 22)} fill={p.accent} />
    </Sticker>
  );
}
