import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Scribble Circle',
  description: 'A loose marker circle gone round twice, for circling the number that matters: a saving, a spike, a price.',
  tags: ['circle', 'highlight', 'annotation', 'doodle', 'marker'],
};

export const schema = stickerSchema({ fill: '#F49CBB', ink: '#E0628F', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#231942' },
  violet: { ink: '#5E4AE3' },
  teal: { ink: '#1E9C90' },
  'die-cut': { border: true, style: 'crayon' },
};

// An ellipse traced ~1.8 times, drifting outward and tilting a little each lap,
// so it reads as one quick hand gesture rather than two neat rings.
function loop(): Pt[] {
  const n = 64;
  const laps = 1.8;
  return Array.from({ length: Math.round(n * laps) + 1 }, (_, i): Pt => {
    const t = i / n;
    const a = -2.3 + t * Math.PI * 2;
    const grow = 1 - t * 0.1;
    const tilt = -0.2 + t * 0.14;
    const x = Math.cos(a) * 100 * grow;
    const y = Math.sin(a) * 66 * grow;
    // the centre drifts as the hand moves, so the laps separate on one side
    return [124 + t * 10 + x * Math.cos(tilt) - y * Math.sin(tilt), 128 + t * 8 + x * Math.sin(tilt) + y * Math.cos(tilt)];
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
