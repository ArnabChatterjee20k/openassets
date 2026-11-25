import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Scribble Circle',
  description: 'A fast double-loop marker circle to ring a number ("4× more conversations") or a CTA on a slide or landing page.',
  tags: ['circle', 'highlight', 'annotation', 'doodle'],
};

export const schema = stickerSchema({ fill: '#C8553D', ink: '#C8553D', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#3B1F14' },
  sage: { ink: '#4F6D58' },
  saffron: { ink: '#D98A1E', style: 'crayon' },
  'die-cut': { border: true, style: 'crayon' },
};

// A loose ellipse that goes round ~1.4 times, drifting outward and tilting, like a quick pen loop.
const loop: Pt[] = Array.from({ length: 72 }, (_, i) => {
  const t = i / 71;
  const a = -2.5 + t * Math.PI * 2 * 1.5;
  const grow = 0.9 + t * 0.16;
  const rx = 100 * grow;
  const ry = 60 * grow;
  const rot = -0.2 + t * 0.18;
  const x = Math.cos(a) * rx;
  const y = Math.sin(a) * ry;
  return [128 + x * Math.cos(rot) - y * Math.sin(rot), 130 + x * Math.sin(rot) + y * Math.cos(rot)];
});

export default function ScribbleCircle(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Scribble circle">
      <Line shape={sk.curve(loop)} weight={p.weight * 1.2} />
    </Sticker>
  );
}
