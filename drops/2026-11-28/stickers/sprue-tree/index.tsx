import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, tint } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Sprue Tree',
  description: 'A runner frame of freshly molded parts (knob, ring, star clip) hanging on little gates, like a model kit.',
  tags: ['sprue', 'runner', 'parts', 'model kit', 'doodle'],
};

export const schema = stickerSchema({ fill: '#C6EE6A', accent: '#FF9F43', ink: '#2F4A1E' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  orange: { fill: '#FFB36B', accent: '#C6EE6A', ink: '#7A3A10' },
  frost: { fill: '#BFD9E6', accent: '#E4572E', ink: '#17242E' },
};

export default function SprueTree(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  const runner = tint(p.fill, -0.22);
  return (
    <Sticker p={p} label="Sprue tree">
      {/* Frame and the central runner */}
      <Doodle shape={sk.rect(30, 30, 196, 196, 22)} fill="none" hatch={false} ink={p.ink} />
      <Doodle shape={sk.rect(120, 30, 16, 196, 6)} fill={runner} hatch={false} />
      {/* Gates */}
      <Line shape={[sk.poly([[120, 82], [100, 82]], { closed: false }), sk.poly([[136, 82], [152, 82]], { closed: false }), sk.poly([[120, 170], [104, 170]], { closed: false }), sk.poly([[136, 170], [150, 170]], { closed: false })]} weight={p.weight * 0.7} />
      {/* Parts */}
      <Doodle shape={sk.circle(70, 82, 32)} />
      <Doodle shape={sk.circle(70, 82, 11)} fill={tint(p.fill, 0.5)} hatch={false} />
      <Doodle shape={sk.circle(184, 82, 34)} fill={p.accent} />
      <Doodle shape={sk.circle(184, 82, 16)} fill="#FFFFFF" hatch={false} />
      <Doodle shape={sk.star(74, 172, 36, 18, 5)} fill={p.accent} />
      <Doodle shape={sk.rect(150, 144, 58, 56, 12)} />
      <Line shape={sk.poly([[162, 172], [196, 172]], { closed: false })} weight={p.weight * 0.8} />
    </Sticker>
  );
}
