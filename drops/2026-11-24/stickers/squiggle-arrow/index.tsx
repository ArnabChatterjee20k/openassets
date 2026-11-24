import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Squiggle Arrow',
  description: 'A loose, double-looped marker arrow for pointing at a CLI command, a price or a "Run it" button.',
  tags: ['arrow', 'annotation', 'pointer', 'doodle'],
};

export const schema = stickerSchema({ fill: '#2C8C84', ink: '#2C8C84', style: 'marker' }).extend({});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#1D4A46' },
  chartreuse: { ink: '#B8E01E', style: 'crayon' },
  coral: { ink: '#FF5A36' },
  'die-cut': { border: true, style: 'crayon' },
};

export default function SquiggleArrow(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Squiggle arrow">
      <Line
        shape={sk.arrow(
          [[30, 196], [58, 186], [84, 160], [80, 132], [60, 134], [62, 158], [96, 168], [128, 150], [134, 118], [116, 106], [104, 124], [124, 142], [164, 134], [196, 104], [222, 64]],
          28,
        )}
        weight={p.weight * 1.3}
      />
    </Sticker>
  );
}
