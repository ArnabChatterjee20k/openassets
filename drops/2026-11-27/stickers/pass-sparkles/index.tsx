import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Sticker, sk, stickerSchema } from '@/kit';
import { color } from '@/lib/params';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Pass Sparkles',
  description: 'A cluster of three crayon sparkles for "passed inspection", spotless parts and good-news moments.',
  tags: ['sparkle', 'shine', 'pass', 'clean', 'doodle'],
};

export const schema = stickerSchema({ fill: '#2EC4B6', accent: '#F49CBB', ink: '#173F4A' }).extend({
  third: color('Third sparkle').default('#8F7FF0'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  lilac: { fill: '#8F7FF0', accent: '#F49CBB', third: '#2EC4B6', ink: '#231942' },
  gold: { fill: '#F2C14E', accent: '#FF8E5E', third: '#FFF1C9', ink: '#5A3A12' },
};

export default function PassSparkles(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Sparkles">
      <Doodle shape={sk.sparkle(108, 142, 82, 0.3)} />
      <Doodle shape={sk.sparkle(190, 68, 38, 0.32)} fill={p.accent} />
      <Doodle shape={sk.sparkle(196, 190, 26, 0.34)} fill={p.third} />
    </Sticker>
  );
}
