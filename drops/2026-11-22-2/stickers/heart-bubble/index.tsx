import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Heart Bubble',
  description: 'A chat bubble holding a cherry heart: "he replied", the typing moment, the core of an Ardor conversation.',
  tags: ['chat', 'message', 'heart', 'reply', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FFE8E0', accent: '#E3173E', ink: '#5A0E1E' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  peach: { fill: '#F5C6AA', accent: '#E3173E', ink: '#5A0E1E' },
  sorbet: { fill: '#FFD3C2', accent: '#7B2CBF', ink: '#3D0E2A' },
};

// Rounded bubble with a tail sweeping out to the lower left.
function bubble(): Pt[] {
  const cx = 138, cy = 112, rx = 92, ry = 72;
  // From the tail's right root (just left of bottom centre), clockwise on screen
  // round the right, top and left, back to the tail's left root.
  const pts: Pt[] = Array.from({ length: 33 }, (_, i): Pt => {
    const a = ((100 - (i / 32) * 335) * Math.PI) / 180;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  });
  return [...pts, [50, 216], [52, 214]];
}

export default function HeartBubble(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Heart chat bubble">
      <Doodle shape={sk.curve(bubble(), true)} />
      <Doodle shape={sk.heart(136, 112, 42)} fill={p.accent} />
      {/* Pulse ticks: the heart is beating */}
      <Line shape={[sk.curve([[206, 30], [218, 16]]), sk.curve([[222, 50], [240, 44]])]} ink={p.accent} weight={p.weight * 0.8} />
    </Sticker>
  );
}
