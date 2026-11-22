import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Loop Arrow',
  description: 'A looping cherry marker arrow for pointing at a love interest, a new chapter or the "Start story" button.',
  tags: ['arrow', 'annotation', 'pointer', 'doodle'],
};

export const schema = stickerSchema({ fill: '#E3173E', ink: '#E3173E', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#5A0E1E' },
  velvet: { ink: '#3F1019' },
  gold: { ink: '#F7B32B', style: 'crayon' },
  'die-cut': { border: true, style: 'crayon' },
};

export default function LoopArrow(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Loop arrow">
      {/* A lazy swoop with one loop-the-loop, ending in a confident head up-right. */}
      <Line
        shape={sk.arrow(
          [[30, 220], [64, 210], [100, 190], [130, 160], [142, 124], [126, 98], [100, 104], [100, 136], [132, 154], [172, 144], [202, 110], [222, 60]],
          30,
        )}
        weight={p.weight * 1.35}
      />
    </Sticker>
  );
}
