import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Defect Circle',
  description: 'A quick scribbled ring, gone round twice, for circling the one flaw on a part photo, a stat or a price.',
  tags: ['circle', 'annotation', 'highlight', 'defect', 'doodle'],
};

export const schema = stickerSchema({ fill: '#F49CBB', accent: '#F49CBB', ink: '#E0568A', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#231942', fill: '#231942' },
  violet: { ink: '#5E4AE3', fill: '#5E4AE3' },
  teal: { ink: '#1E9C90', fill: '#2EC4B6' },
  'die-cut': { border: true, style: 'crayon' },
};

/** An ellipse loop that goes round ~1.8 times, drifting outward like a fast hand. */
function scribble(): Pt[] {
  const out: Pt[] = [];
  const n = 52;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = -2.5 + t * Math.PI * 2 * 1.78;
    // Second lap is wider and tilted, like a fast hand going round again.
    const rx = 82 + t * 22;
    const ry = 58 + t * 16;
    const tilt = -0.12 + t * 0.2;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push([128 + x * Math.cos(tilt) - y * Math.sin(tilt) + t * 8, 132 + x * Math.sin(tilt) + y * Math.cos(tilt) - t * 6]);
  }
  // A flick off the end.
  const [lx, ly] = out[out.length - 1];
  out.push([lx + 20, ly - 22]);
  return out;
}

export default function DefectCircle(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Scribbled circle">
      <Line shape={sk.curve(scribble())} weight={p.weight * 1.25} />
      {/* the tiny flaw it circles */}
      <Doodle shape={sk.circle(130, 132, 9)} fill={p.fill} ink={p.ink} hatch={false} />
    </Sticker>
  );
}
