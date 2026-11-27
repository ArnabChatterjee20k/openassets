import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Callout Arrow',
  description: 'A swooping hand-drawn arrow with a little loop, for pointing from a note to a defect, a yield stat or a "Book a demo" button.',
  tags: ['arrow', 'annotation', 'pointer', 'callout', 'doodle'],
};

export const schema = stickerSchema({ fill: '#5E4AE3', ink: '#5E4AE3', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#231942' },
  pink: { ink: '#E0568A' },
  ink: { ink: '#231942' },
  'die-cut': { border: true, style: 'crayon' },
};

export default function CalloutArrow(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Callout arrow">
      <Line
        shape={sk.arrow(
          [[30, 60], [72, 52], [118, 66], [150, 102], [146, 142], [112, 150], [96, 124], [116, 96], [156, 104], [190, 138], [212, 200]],
          32,
        )}
        weight={p.weight * 1.6}
      />
    </Sticker>
  );
}
