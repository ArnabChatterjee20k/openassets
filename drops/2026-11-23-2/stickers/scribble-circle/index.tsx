import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Scribble Circle',
  description: 'A fast double-looped marker circle to ring a key number ("480 kWh", "6 hrs") on a slide or landing page.',
  tags: ['circle', 'highlight', 'annotation', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FF6B4A', ink: '#E2462A', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#1F1A17' },
  'panel-blue': { ink: '#3D67E0' },
  'charge-green': { ink: '#00A47E' },
  'die-cut': { border: true, style: 'crayon' },
};

// One continuous loop that goes round ~1.8 times, slightly tilted, and
// overshoots its start like a quick hand-drawn ring.
function loop(): Pt[] {
  const out: Pt[] = [];
  const n = 64;
  const turns = 1.8;
  const tilt = -0.18;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = Math.PI * 0.95 + t * turns * Math.PI * 2;
    const rx = 100 - t * 22;
    const ry = 66 - t * 16 + Math.sin(t * 9) * 3;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    out.push([128 + x * Math.cos(tilt) - y * Math.sin(tilt), 130 + x * Math.sin(tilt) + y * Math.cos(tilt) + t * 6]);
  }
  return out;
}

export default function ScribbleCircle(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Scribble circle">
      <Line shape={sk.curve(loop())} weight={p.weight * 1.5} />
    </Sticker>
  );
}
