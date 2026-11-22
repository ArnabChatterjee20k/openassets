import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Pointer Arrow',
  description: 'A swooping hand-drawn arrow with one loop, for pointing at a spend figure, a chart or the "Start free" button.',
  tags: ['arrow', 'annotation', 'pointer', 'doodle', 'marker'],
};

export const schema = stickerSchema({ fill: '#5E4AE3', ink: '#5E4AE3', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#231942' },
  pink: { ink: '#E0628F' },
  teal: { ink: '#1E9C90' },
  'die-cut': { border: true, style: 'crayon' },
};

export default function PointerArrow(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Arrow">
      <Line
        shape={sk.arrow(
          [[30, 70], [66, 64], [104, 74], [134, 102], [140, 134], [120, 150], [100, 136], [108, 108], [140, 98], [176, 112], [204, 146], [222, 192]],
          28,
        )}
        weight={p.weight * 1.3}
      />
    </Sticker>
  );
}
