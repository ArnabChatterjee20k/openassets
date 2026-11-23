import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Hand Arrow',
  description: 'A swooping marker arrow with a loop, for pointing at a price, a spec or the "Book a site survey" button.',
  tags: ['arrow', 'annotation', 'pointer', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FF6B4A', ink: '#E2462A', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#1F1A17' },
  'panel-blue': { ink: '#3D67E0' },
  'charge-green': { ink: '#00A47E' },
  'die-cut': { border: true, style: 'crayon' },
};

export default function HandArrow(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Arrow">
      <Line
        shape={sk.arrow(
          [[30, 206], [58, 176], [96, 156], [134, 136], [158, 98], [142, 62], [108, 68], [102, 108], [134, 136], [180, 132], [224, 86]],
          34,
        )}
        weight={p.weight * 2}
      />
    </Sticker>
  );
}
