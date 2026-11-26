import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Scribble Circle',
  description: 'A quick double-loop marker circle to ring a price, an unread count or a “needs review” message, with a tick of emphasis.',
  tags: ['circle', 'highlight', 'annotation', 'mark', 'doodle'],
};

export const schema = stickerSchema({ fill: '#E85D3F', ink: '#E85D3F', style: 'marker' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  crayon: { style: 'crayon' },
  pencil: { style: 'pencil', ink: '#1E2A1A' },
  matcha: { ink: '#6A8D3A' },
  brass: { ink: '#B08A14' },
  'die-cut': { border: true, style: 'crayon' },
};

/** An ellipse drawn round ~1.75 times, drifting so the passes don't overlap. */
function scribble(cx: number, cy: number, rx: number, ry: number, rot: number): Pt[] {
  const n = 44;
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const a = -2.3 + t * Math.PI * 2 * 1.75;
    const k = 1.04 - t * 0.16;
    const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    return [cx + x * Math.cos(rot) - y * Math.sin(rot) + t * 14, cy + x * Math.sin(rot) + y * Math.cos(rot) - t * 12] as Pt;
  });
}

export default function ScribbleCircle(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Scribble circle">
      <Line shape={sk.curve(scribble(124, 136, 96, 66, -0.12))} weight={p.weight * 1.1} />
      {/* Three emphasis ticks off the top-right. */}
      <Line
        shape={[
          sk.poly([[196, 56], [210, 34]], { closed: false }),
          sk.poly([[214, 70], [236, 58]], { closed: false }),
          sk.poly([[178, 50], [180, 26]], { closed: false }),
        ]}
        weight={p.weight}
      />
    </Sticker>
  );
}
