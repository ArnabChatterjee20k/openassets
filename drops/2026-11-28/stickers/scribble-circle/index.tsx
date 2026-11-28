import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Scribble Circle',
  description: 'A quick double-loop marker circle to ring a price, a spec or "5 days" on a slide or landing page.',
  tags: ['circle', 'highlight', 'annotation', 'doodle'],
};

export const schema = stickerSchema({ fill: '#B5E550', ink: '#8DBE2C', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#2F4A1E' },
  orange: { ink: '#F2862E' },
  pine: { ink: '#3E7A4C', style: 'crayon' },
  'die-cut': { border: true },
};

// Two not-quite-closed loops that drift, like a fast hand ringing a word.
const loop: Pt[] = Array.from({ length: 52 }, (_, i) => {
  const t = i / 51;
  const a = -2.3 + t * Math.PI * 2 * 1.9;
  const rx = 100 - t * 26;
  const ry = 66 - t * 20;
  const tilt = -0.16 + t * 0.22;
  const x = Math.cos(a) * rx;
  const y = Math.sin(a) * ry;
  return [126 + x * Math.cos(tilt) - y * Math.sin(tilt) + t * 12, 132 + x * Math.sin(tilt) + y * Math.cos(tilt) - t * 10];
});
// A flick off the end, the way a quick circle overshoots.
loop.push([loop[loop.length - 1][0] + 30, loop[loop.length - 1][1] - 26]);

export default function ScribbleCircle(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Scribble circle">
      <Line shape={sk.curve(loop)} weight={p.weight * 1.25} />
    </Sticker>
  );
}
