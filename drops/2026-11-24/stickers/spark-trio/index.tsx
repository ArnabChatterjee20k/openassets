import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Spark Trio',
  description: 'Three chartreuse crayon sparkles of different sizes to mark a fresh result, a new feature or a launch line.',
  tags: ['sparkle', 'new', 'highlight', 'doodle'],
};

export const schema = stickerSchema({ fill: '#D4FF3A', accent: '#3FA7A0', ink: '#4A6410' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil', fill: '#C4EE2C', ink: '#3A4F0E' },
  'die-cut': { border: true },
  teal: { fill: '#8FD8CF', accent: '#D4FF3A', ink: '#1D4A46' },
  coral: { fill: '#FF8A6B', accent: '#FFD35C', ink: '#8A2A14' },
};

export default function SparkTrio(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Sparkles">
      <Doodle shape={sk.sparkle(112, 140, 84, 0.26)} />
      <Doodle shape={sk.sparkle(194, 70, 40, 0.28)} fill={p.accent} />
      <Doodle shape={sk.sparkle(196, 196, 26, 0.3)} />
      {/* tiny motion ticks next to the big one */}
      <Line shape={[sk.curve([[40, 56], [52, 68]]), sk.curve([[30, 84], [46, 88]])]} weight={p.weight * 0.8} />
    </Sticker>
  );
}
