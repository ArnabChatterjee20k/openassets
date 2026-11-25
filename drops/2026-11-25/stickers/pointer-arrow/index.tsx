import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Pointer Arrow',
  description: 'A swooping marker arrow with one loop, for pointing at a dose dial, a price or the App Store button.',
  tags: ['arrow', 'annotation', 'pointer', 'doodle'],
};

export const schema = stickerSchema({ fill: '#3D5AFE', ink: '#3D5AFE', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#1E2550' },
  pink: { ink: '#FF3DB4' },
  ink: { ink: '#101219' },
  'die-cut': { border: true, style: 'crayon' },
};

export default function PointerArrow(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Arrow">
      <Line
        shape={sk.arrow(
          [[34, 92], [70, 70], [112, 66], [150, 82], [168, 112], [156, 140], [128, 142], [120, 118], [142, 104], [176, 116], [198, 150], [214, 196]],
          28,
        )}
        weight={p.weight * 1.6}
      />
    </Sticker>
  );
}
