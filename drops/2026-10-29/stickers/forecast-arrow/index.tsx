import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Loop Arrow',
  description: 'A looping hand-drawn arrow for pointing at a forecast, a price or a call to action on a landing page.',
  tags: ['arrow', 'annotation', 'pointer', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FF5A5F', ink: '#FF5A5F', style: 'marker' }).extend({});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#2B2118' },
  ink: { ink: '#1B1B1B' },
  blue: { ink: '#2F6FED' },
  'die-cut': { border: true, style: 'crayon' },
};

export default function LoopArrow(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Arrow">
      <Line
        shape={sk.arrow(
          [[36, 176], [70, 150], [110, 132], [142, 108], [146, 80], [124, 70], [108, 88], [122, 116], [160, 128], [196, 114], [220, 86]],
          26,
        )}
        weight={p.weight * 1.3}
      />
    </Sticker>
  );
}
