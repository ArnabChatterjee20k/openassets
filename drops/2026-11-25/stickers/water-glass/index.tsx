import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Water Glass',
  description: 'A tall crayon glass of water with a bendy straw and bubbles, for hydration goals and "drink up" nudges.',
  tags: ['water', 'hydration', 'glass', 'habit', 'doodle'],
};

export const schema = stickerSchema({ fill: '#E6EBF5', accent: '#6F8BFF', ink: '#1E2550' }).extend({});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  lilac: { fill: '#EEE8FA', accent: '#B49CFF', ink: '#231942' },
  mint: { fill: '#E4F6EF', accent: '#3CCB9A', ink: '#163B30' },
};

export default function WaterGlass(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Water glass">
      {/* glass body, tapering toward the base */}
      <Doodle shape={sk.poly([[66, 46], [190, 46], [176, 226], [80, 226]])} />
      {/* water */}
      <Doodle shape={sk.poly([[74, 104], [182, 98], [177, 218], [79, 218]])} fill={p.accent} />
      {/* straw: up out of the water, bending over the rim */}
      <Line shape={sk.curve([[118, 200], [134, 110], [146, 40], [156, 22], [188, 18]])} weight={p.weight * 1.6} ink="#FF3DB4" />
      {/* bubbles */}
      <Doodle shape={sk.circle(100, 180, 10)} fill="#FFFFFF" />
      <Doodle shape={sk.circle(156, 150, 8)} fill="#FFFFFF" />
      <Doodle shape={sk.circle(108, 132, 6)} fill="#FFFFFF" hatch={false} />
      {/* glass highlight */}
      <Line shape={sk.curve([[84, 64], [88, 150]])} weight={p.weight * 0.9} ink="#FFFFFF" />
    </Sticker>
  );
}
