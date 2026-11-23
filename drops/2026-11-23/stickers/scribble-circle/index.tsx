import type { z } from 'zod';
import type { AssetMeta, } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Scribble Circle',
  description: 'A quick marker loop gone round one and a half times, for circling a commit hash, a price or a feature name.',
  tags: ['circle', 'highlight', 'annotation', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FFDD00', ink: '#134AA8', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  yellow: { ink: '#F2C400' },
  crayon: { style: 'crayon', ink: '#0B2A66' },
  pencil: { style: 'pencil', ink: '#0B2A66' },
  'die-cut': { border: true, ink: '#134AA8' },
};

// A loose ellipse that overshoots its start and drifts outward on the second lap.
const loop: Pt[] = Array.from({ length: 36 }, (_, i): Pt => {
  const t = i / 22;
  const a = -2.6 + t * Math.PI * 2;
  const grow = 1 + t * 0.12;
  const x = Math.cos(a) * 92 * grow, y = Math.sin(a) * 58 * grow;
  const tilt = -0.12; // a hand-drawn loop leans
  return [128 + t * 8 + x * Math.cos(tilt) - y * Math.sin(tilt), 132 - t * 12 + x * Math.sin(tilt) + y * Math.cos(tilt)];
});

export default function ScribbleCircle(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Scribble circle">
      <Line shape={sk.curve(loop)} weight={p.weight * 1.2} />
    </Sticker>
  );
}
