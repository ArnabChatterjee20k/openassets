import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Loop Arrow',
  description: 'A looping marker arrow for pointing at a price, a lead time or the "Get a quote" button.',
  tags: ['arrow', 'annotation', 'pointer', 'doodle'],
};

export const schema = stickerSchema({ fill: '#F2862E', ink: '#E2731F', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#2F4A1E' },
  pine: { ink: '#3E7A4C' },
  lime: { ink: '#8DBE2C', style: 'crayon' },
  'die-cut': { border: true, style: 'crayon' },
};

export default function LoopArrow(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Loop arrow">
      <Line
        shape={sk.arrow(
          [[28, 200], [62, 184], [98, 164], [128, 136], [142, 100], [128, 66], [98, 62], [84, 90], [100, 122], [140, 138], [180, 130], [210, 104], [226, 70]],
          30,
        )}
        weight={p.weight * 1.4}
      />
    </Sticker>
  );
}
