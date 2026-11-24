import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Sparkle Trio',
  description: 'Three crayon sparkles, one big red and two small, to make a "new" feature or a saving shine.',
  tags: ['sparkle', 'shine', 'new', 'doodle'],
};

export const schema = stickerSchema({ fill: '#E3000F', accent: '#E6E6E1', ink: '#5E0A0E' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  ink: { fill: '#2A2A28', accent: '#E3000F', ink: '#0A0A0A' },
  blueprint: { fill: '#7FB2FF', accent: '#F5F5F0', ink: '#0F3B8C' },
};

export default function SparkleTrio(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Sparkles">
      <Doodle shape={sk.sparkle(110, 140, 82, 0.28)} />
      <Doodle shape={sk.sparkle(196, 70, 34, 0.3)} fill={p.accent} />
      <Doodle shape={sk.sparkle(200, 192, 22, 0.3)} fill={p.accent} />
      <Doodle shape={sk.circle(52, 56, 7)} fill={p.ink} outline={false} hatch={false} />
    </Sticker>
  );
}
