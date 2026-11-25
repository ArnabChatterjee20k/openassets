import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Talk Bubble',
  description: 'A hand-drawn speech bubble with three typing dots: a live human picked up. For "connected" callouts and social posts.',
  tags: ['speech', 'bubble', 'conversation', 'chat', 'doodle'],
};

export const schema = stickerSchema({ fill: '#F1E4D3', accent: '#C8553D', ink: '#3B1F14' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  sage: { fill: '#B9CDB9', accent: '#3F5A47', ink: '#24382A' },
  saffron: { fill: '#F7C873', accent: '#C8553D', ink: '#6E3A10' },
};

const tail: Pt[] = [[70, 160], [54, 214], [112, 168]];

export default function TalkBubble(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Talk bubble">
      {/* tail first so the bubble covers its root */}
      <Doodle shape={sk.poly(tail)} />
      <Doodle shape={sk.rect(30, 50, 196, 126, 46)} />
      <Doodle shape={sk.circle(82, 113, 15)} fill={p.accent} />
      <Doodle shape={sk.circle(128, 113, 15)} fill={p.accent} />
      <Doodle shape={sk.circle(174, 113, 15)} fill={p.accent} />
    </Sticker>
  );
}
