import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Swoop Arrow',
  description: 'A single confident swooping arrow that dives down and to the right, for pointing at a reading, a CTA or the one hot spot.',
  tags: ['arrow', 'annotation', 'pointer', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FF4D00', ink: '#FF4D00', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#4A1A0C' },
  pink: { ink: '#FF2E63' },
  ink: { ink: '#2E2A24' },
  'die-cut': { border: true, style: 'crayon' },
};

export default function SwoopArrow(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Arrow">
      <Line
        shape={sk.arrow(
          [[34, 60], [80, 44], [134, 52], [176, 82], [200, 128], [206, 178], [196, 214]],
          30,
        )}
        weight={p.weight * 1.35}
      />
      {/* a short echo stroke, like a quick second flick of the pen */}
      <Line shape={sk.curve([[40, 84], [72, 70], [100, 70]])} weight={p.weight * 0.7} />
    </Sticker>
  );
}
