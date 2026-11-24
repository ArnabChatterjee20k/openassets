import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Scribble Circle',
  description: 'A loose double-loop marker circle to ring a number on a pricing table or a line on a bill.',
  tags: ['circle', 'highlight', 'annotation', 'doodle'],
};

export const schema = stickerSchema({ fill: '#E3000F', ink: '#E3000F', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  ink: { ink: '#1E1E1C' },
  pencil: { style: 'pencil', ink: '#2A2A28' },
  blueprint: { ink: '#1D4E9E' },
  'die-cut': { border: true, style: 'crayon' },
};

// About 1.85 turns of a slightly drifting ellipse: start low-left, overshoot past the start.
function loop(): Pt[] {
  const n = 44;
  return Array.from({ length: n + 1 }, (_, i): Pt => {
    const t = i / n;
    const a = Math.PI * 0.8 + t * Math.PI * 2 * 1.85;
    // Second pass is smaller, tilted and shifted, like a fast hand going round again.
    const rx = 100 - t * 18;
    const ry = 62 - t * 4;
    const tilt = -0.08 + t * 0.16;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    return [128 + x * Math.cos(tilt) - y * Math.sin(tilt) + t * 10, 132 + x * Math.sin(tilt) + y * Math.cos(tilt) - t * 14];
  });
}

export default function ScribbleCircle(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Scribble circle">
      <Line shape={sk.curve(loop())} weight={p.weight * 1.1} />
    </Sticker>
  );
}
