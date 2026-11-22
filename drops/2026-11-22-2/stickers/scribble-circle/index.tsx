import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Scribble Circle',
  description: 'A quick marker ring gone round twice, for circling a price, a reply or "Chapter 1 free".',
  tags: ['circle', 'highlight', 'annotation', 'doodle'],
};

export const schema = stickerSchema({ fill: '#E3173E', ink: '#E3173E', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#5A0E1E' },
  gold: { ink: '#F7B32B' },
  velvet: { ink: '#3F1019', style: 'crayon' },
  'die-cut': { border: true },
};

// A tilted ellipse traced ~1.8 times; the radius drifts so the passes don't sit on top of each other.
function loop(): Pt[] {
  const n = 46;
  const tilt = -0.18;
  return Array.from({ length: n + 1 }, (_, i): Pt => {
    const t = i / n;
    const a = Math.PI * 0.85 + t * Math.PI * 2 * 1.8;
    const rx = 98 - t * 12 + Math.sin(t * 9) * 3;
    const ry = 64 - t * 6;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    return [128 + x * Math.cos(tilt) - y * Math.sin(tilt), 130 + x * Math.sin(tilt) + y * Math.cos(tilt)];
  });
}

export default function ScribbleCircle(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Scribble circle">
      <Line shape={sk.curve(loop())} weight={p.weight * 1.15} />
    </Sticker>
  );
}
