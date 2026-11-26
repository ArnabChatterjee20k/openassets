import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Scribble Circle',
  description: 'A quick marker loop drawn around a number or element symbol, the way an engineer circles the result that matters.',
  tags: ['circle', 'highlight', 'annotation', 'doodle'],
};

export const schema = stickerSchema({ fill: '#2C7873', ink: '#2C7873', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#2E2A24' },
  furnace: { ink: '#D96C3D' },
  brass: { ink: '#C8902A', style: 'crayon' },
  'die-cut': { border: true, style: 'crayon' },
};

// A loop that goes round ~1.25 times, drifting so the two passes don't overlap.
function loop(): Pt[] {
  const n = 46;
  return Array.from({ length: n + 1 }, (_, i): Pt => {
    const t = i / n;
    const a = -2.6 + t * Math.PI * 2 * 1.22;
    const rx = 100 - t * 10;
    const ry = 64 - t * 8;
    return [128 + Math.cos(a) * rx + t * 6, 130 + Math.sin(a) * ry - t * 8 + Math.cos(a) * 6];
  });
}

export default function ScribbleCircle(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Scribble circle">
      <Line shape={sk.curve(loop())} weight={p.weight * 1.2} />
      {/* two little emphasis ticks off the top-right */}
      <Line shape={[sk.curve([[206, 58], [222, 40]]), sk.curve([[222, 76], [244, 66]])]} weight={p.weight * 0.9} />
    </Sticker>
  );
}
