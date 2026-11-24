import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Petri Dish',
  description: 'A crayon petri dish with bright colonies growing on it, for culture runs, screening results and biology posts.',
  tags: ['petri dish', 'biology', 'culture', 'lab', 'doodle'],
};

export const schema = stickerSchema({ fill: '#DDF2EE', accent: '#3FA7A0', ink: '#1D4A46' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil', fill: '#CFE9E3', ink: '#24423F' },
  'die-cut': { border: true },
  agar: { fill: '#FFE9C2', accent: '#E0663F', ink: '#6B3A1C' },
  riso: { fill: '#F6E8F0', accent: '#0078BF', ink: '#1F2A6B' },
};

export default function PetriDish(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Petri dish">
      {/* dish wall seen from above at an angle */}
      <Doodle shape={sk.ellipse(128, 150, 108, 64)} fill={p.accent} hatch={false} />
      <Doodle shape={sk.ellipse(128, 134, 108, 64)} />
      {/* agar surface */}
      <Doodle shape={sk.ellipse(128, 136, 88, 48)} fill="#F4FBF8" outline={false} />
      {/* colonies */}
      <Doodle shape={sk.cloud(96, 128, 58, 42, 6)} fill={p.accent} />
      <Doodle shape={sk.circle(152, 114, 17)} fill="#D4FF3A" />
      <Doodle shape={sk.circle(166, 152, 12)} fill={p.accent} />
      <Doodle shape={sk.circle(124, 162, 9)} fill="#FF5A36" />
      <Doodle shape={sk.circle(188, 126, 7)} fill="#D4FF3A" hatch={false} />
      {/* shine on the lid */}
      <Line shape={sk.curve([[48, 118], [60, 103], [82, 92]])} ink="#FFFFFF" weight={p.weight * 0.9} />
    </Sticker>
  );
}
