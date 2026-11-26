import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Loop Arrow',
  description: 'A looping marker arrow for pointing at a stat, a compound or the "Partner with us" button on a deck slide.',
  tags: ['arrow', 'annotation', 'pointer', 'doodle'],
};

export const schema = stickerSchema({ fill: '#D96C3D', ink: '#D96C3D', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#2E2A24' },
  teal: { ink: '#2C7873' },
  ink: { ink: '#2E2A24' },
  'die-cut': { border: true, style: 'crayon' },
};

export default function LoopArrow(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Loop arrow">
      <Line
        shape={sk.arrow(
          [[30, 196], [64, 186], [104, 166], [136, 132], [140, 96], [118, 82], [98, 98], [110, 128], [148, 140], [188, 126], [222, 92]],
          28,
        )}
        weight={p.weight * 1.35}
      />
    </Sticker>
  );
}
