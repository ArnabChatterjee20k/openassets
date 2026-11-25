import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Callback Clock',
  description: 'A wobbly twin-bell alarm clock set for 10:30, for callback reminders, follow-up tips and "never miss a callback" posts.',
  tags: ['clock', 'alarm', 'callback', 'reminder', 'doodle'],
};

export const schema = stickerSchema({ fill: '#9CB89F', accent: '#C8553D', ink: '#2F4A36' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  clay: { fill: '#E07A5F', accent: '#F2A541', ink: '#6E2616' },
  saffron: { fill: '#F2B45A', accent: '#4F6D58', ink: '#7A3E12' },
};

export default function CallbackClock(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Callback clock">
      {/* legs and bells behind the body */}
      <Line shape={sk.poly([[86, 196], [66, 224]], { closed: false })} weight={p.weight * 1.4} />
      <Line shape={sk.poly([[170, 196], [190, 224]], { closed: false })} weight={p.weight * 1.4} />
      <Doodle shape={sk.ellipse(70, 60, 32, 24, -38)} fill={p.accent} />
      <Doodle shape={sk.ellipse(186, 60, 32, 24, 38)} fill={p.accent} />
      <Doodle shape={sk.rect(116, 36, 24, 20, 6)} fill={p.accent} />
      <Doodle shape={sk.circle(128, 136, 86)} />
      <Doodle shape={sk.circle(128, 136, 62)} fill="#F6ECDD" hatch={false} />
      {/* hour ticks at 12 / 3 / 6 / 9 */}
      <Line shape={sk.poly([[128, 82], [128, 92]], { closed: false })} weight={p.weight * 0.8} />
      <Line shape={sk.poly([[182, 136], [172, 136]], { closed: false })} weight={p.weight * 0.8} />
      <Line shape={sk.poly([[128, 190], [128, 180]], { closed: false })} weight={p.weight * 0.8} />
      <Line shape={sk.poly([[74, 136], [84, 136]], { closed: false })} weight={p.weight * 0.8} />
      {/* 10:30, the callback time */}
      <Line shape={sk.poly([[128, 136], [104, 112]], { closed: false })} weight={p.weight * 1.4} />
      <Line shape={sk.poly([[128, 136], [128, 172]], { closed: false })} ink={p.accent} weight={p.weight * 1.1} />
      <Doodle shape={sk.circle(128, 136, 7)} fill={p.ink} outline={false} hatch={false} />
    </Sticker>
  );
}
