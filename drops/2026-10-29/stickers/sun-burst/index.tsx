import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Sun Burst',
  description: 'A grinning crayon sun with a ring of chunky rays, for sunny forecasts and good-news moments.',
  tags: ['weather', 'sun', 'summer', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FFC93C', accent: '#FF8A3D', ink: '#B5571C' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  lemon: { fill: '#FFF07A', accent: '#FFC93C', ink: '#8A6D12' },
  dusk: { fill: '#FF9E7A', accent: '#E8506A', ink: '#8C2F3E' },
};

export default function SunBurst(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Sun">
      <Doodle shape={sk.burst(128, 128, 98, 70, 11)} fill={p.accent} />
      <Doodle shape={sk.circle(128, 128, 58)} />
      <Doodle shape={sk.ellipse(98, 142, 10, 6)} fill="#FF7B7B" outline={false} hatch={false} />
      <Doodle shape={sk.ellipse(158, 142, 10, 6)} fill="#FF7B7B" outline={false} hatch={false} />
      <Doodle shape={sk.ellipse(108, 118, 5, 7)} fill={p.ink} outline={false} hatch={false} />
      <Doodle shape={sk.ellipse(148, 118, 5, 7)} fill={p.ink} outline={false} hatch={false} />
      <Line shape={sk.arc(128, 132, 16, 25, 155)} weight={p.weight * 0.8} />
    </Sticker>
  );
}
