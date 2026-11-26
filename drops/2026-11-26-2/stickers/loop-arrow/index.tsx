import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Loop Arrow',
  description: 'A hand-drawn arrow with a loop-de-loop, for pointing at an inbox address, a code snippet or a sign-up button.',
  tags: ['arrow', 'annotation', 'pointer', 'mark', 'doodle'],
};

export const schema = stickerSchema({ fill: '#6A8D3A', ink: '#6A8D3A', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#1E2A1A' },
  postbox: { ink: '#E85D3F' },
  pine: { ink: '#1E2A1A' },
  'die-cut': { border: true, style: 'crayon' },
};

export default function LoopArrow(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Loop arrow">
      <Line
        shape={sk.arrow(
          [[28, 214], [70, 200], [112, 172], [138, 132], [132, 92], [102, 76], [76, 94], [82, 132], [122, 152], [168, 142], [202, 106], [222, 50]],
          32,
        )}
        weight={p.weight * 1.3}
      />
    </Sticker>
  );
}
