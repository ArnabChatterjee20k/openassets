import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Sparkles',
  description: 'Three hand-drawn sparkles for "new", "saved" and launch-day moments.',
  tags: ['sparkle', 'new', 'shine', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FFDD00', accent: '#EAF2FF', ink: '#0B2A66' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  blueprint: { fill: '#EAF2FF', accent: '#7FB2FF', ink: '#0F3B8C' },
};

export default function Sparkles(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Sparkles">
      <Doodle shape={sk.sparkle(112, 140, 82, 0.3)} />
      <Doodle shape={sk.sparkle(196, 70, 36, 0.32)} fill={p.accent} />
      <Doodle shape={sk.sparkle(198, 186, 22, 0.34)} fill={p.accent} />
    </Sticker>
  );
}
