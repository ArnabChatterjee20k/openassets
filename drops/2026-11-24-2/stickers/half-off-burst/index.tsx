import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, tint } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Half-off Burst',
  description: 'A red price-tag starburst split down the middle with a big down arrow: "your Kafka bill, halved".',
  tags: ['burst', 'price', 'savings', 'sale', 'doodle'],
};

export const schema = stickerSchema({ fill: '#E3000F', accent: '#F5F5F0', ink: '#5E0A0E' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  ink: { fill: '#2A2A28', accent: '#E3000F', ink: '#0A0A0A' },
  cherry: { fill: '#FF8C94', accent: '#FFF4E8', ink: '#6B0A12' },
};

export default function HalfOffBurst(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Half-off burst">
      <Doodle shape={sk.burst(128, 130, 102, 80, 14)} />
      {/* the halving cut: one half of the inner disc is paper */}
      <Doodle shape={sk.poly(sk.arc(128, 130, 68, -90, 90).pts)} fill={p.accent} hatch={false} />
      <Line shape={sk.curve([[128, 50], [128, 210]])} weight={p.weight * 0.9} />
      {/* down arrow on the red half */}
      <Line shape={sk.arrow([[94, 84], [94, 124], [94, 172]], 24)} ink={p.accent} weight={p.weight * 1.7} />
      {/* a short coin stack on the paper half */}
      {[162, 146, 130].map((y) => (
        <Doodle key={y} shape={sk.ellipse(162, y, 22, 9)} fill={tint(p.fill, 0.15)} hatch={false} />
      ))}
    </Sticker>
  );
}
