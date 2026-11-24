import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Pointer Arrow',
  description: 'A quick marker arrow that swoops in from the left to point at a price, a CTA or the half-price bar.',
  tags: ['arrow', 'annotation', 'pointer', 'doodle'],
};

export const schema = stickerSchema({ fill: '#E3000F', ink: '#E3000F', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  ink: { ink: '#1E1E1C' },
  pencil: { style: 'pencil', ink: '#2A2A28' },
  blueprint: { ink: '#1D4E9E' },
  'die-cut': { border: true, style: 'crayon' },
};

export default function PointerArrow(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Arrow">
      <Line
        shape={sk.arrow(
          [[34, 196], [58, 150], [92, 112], [134, 88], [176, 80], [218, 88]],
          30,
        )}
        weight={p.weight * 1.4}
      />
    </Sticker>
  );
}
