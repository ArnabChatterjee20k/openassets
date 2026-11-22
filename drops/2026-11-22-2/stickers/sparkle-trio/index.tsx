import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';
import { color } from '@/lib/params';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Sparkle Trio',
  description: 'Three crayon sparkles in gold, cherry and blush, for a swoon moment, a new outfit or a premium scene.',
  tags: ['sparkle', 'shine', 'magic', 'doodle'],
};

export const schema = stickerSchema({ fill: '#F7B32B', accent: '#E3173E', ink: '#5A0E1E' }).extend({
  third: color('Small sparkle').default('#F5C6AA'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  dusk: { fill: '#FF8E5E', accent: '#E5487A', third: '#FFD27F', ink: '#45293F' },
  lilac: { fill: '#F49CBB', accent: '#5E4AE3', third: '#2EC4B6', ink: '#231942' },
};

export default function SparkleTrio(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Sparkles">
      <Doodle shape={sk.sparkle(104, 136, 78, 0.3)} />
      <Doodle shape={sk.sparkle(190, 70, 38, 0.32)} fill={p.accent} />
      <Doodle shape={sk.sparkle(188, 186, 26, 0.34)} fill={p.third} />
      {/* A couple of glint ticks off the big one */}
      <Line shape={[sk.curve([[36, 74], [52, 88]]), sk.curve([[62, 50], [70, 70]]), sk.curve([[28, 108], [46, 112]])]} weight={p.weight * 0.8} />
    </Sticker>
  );
}
