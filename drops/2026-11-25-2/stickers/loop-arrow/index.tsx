import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Loop Arrow',
  description: 'A looping marker arrow that points at the "Start dialing" button or a pricing tier on the landing page.',
  tags: ['arrow', 'annotation', 'pointer', 'doodle'],
};

export const schema = stickerSchema({ fill: '#C8553D', ink: '#C8553D', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#3B1F14' },
  sage: { ink: '#4F6D58' },
  saffron: { ink: '#D98A1E', style: 'crayon' },
  'die-cut': { border: true, style: 'crayon' },
};

export default function LoopArrow(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Loop arrow">
      <Line
        shape={sk.arrow(
          [[34, 188], [64, 176], [98, 160], [124, 136], [130, 104], [112, 86], [92, 96], [98, 124], [130, 140], [168, 136], [198, 112], [222, 78]],
          28,
        )}
        weight={p.weight * 1.35}
      />
    </Sticker>
  );
}
