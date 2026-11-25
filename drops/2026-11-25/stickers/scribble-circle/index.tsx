import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Scribble Circle',
  description: 'A quick marker loop that goes round one and a half times, for circling a dose, a streak or a price.',
  tags: ['circle', 'highlight', 'annotation', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FF3DB4', ink: '#FF3DB4', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#1E2550' },
  blue: { ink: '#3D5AFE' },
  ink: { ink: '#101219' },
  'die-cut': { border: true, style: 'crayon' },
};

// An ellipse that over-runs its start, drifting outward a little, like a fast hand.
function loop(): Pt[] {
  const out: Pt[] = [];
  const n = 34;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = -Math.PI * 0.85 + t * Math.PI * 2 * 1.3;
    const grow = 1 + t * 0.16;
    // tilted a few degrees, like a quick hand
    const x = Math.cos(a) * 94 * grow;
    const y = Math.sin(a) * 62 * grow - t * 16;
    out.push([128 + x * 0.99 - y * 0.14, 132 + x * 0.14 + y * 0.99]);
  }
  return out;
}

export default function ScribbleCircle(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Circle">
      <Line shape={sk.curve(loop())} weight={p.weight * 1.15} />
    </Sticker>
  );
}
