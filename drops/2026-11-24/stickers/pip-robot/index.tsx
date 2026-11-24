import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Pip the Lab Robot',
  description: "Benchwire's original mascot: a small robot with a CRT monitor for a head, pixel eyes and a pipette held up high.",
  tags: ['mascot', 'robot', 'character', 'lab', 'doodle'],
};

export const schema = stickerSchema({ fill: '#CDE8E2', accent: '#D4FF3A', ink: '#1D4A46' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil', fill: '#BFDDD6', ink: '#24423F' },
  'die-cut': { border: true },
  coral: { fill: '#FFD9CC', accent: '#FFE45C', ink: '#6E2A18' },
  night: { fill: '#9FC4BE', accent: '#D4FF3A', ink: '#0F2B28' },
};

export default function PipRobot(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  const screen = '#21504B';
  return (
    <Sticker p={p} label="Pip the lab robot">
      {/* legs, body */}
      <Doodle shape={sk.rect(98, 202, 20, 24, 6)} />
      <Doodle shape={sk.rect(140, 202, 20, 24, 6)} />
      <Doodle shape={sk.rect(82, 146, 94, 62, 16)} />
      <Doodle shape={sk.circle(129, 176, 9)} fill="#FF5A36" hatch={false} />
      {/* arms: one waving low, one holding the pipette up */}
      <Line shape={sk.curve([[84, 162], [62, 178], [52, 202]])} weight={p.weight * 1.4} />
      {/* pipette: coral bulb, glass barrel, tapered tip, one drop falling */}
      <Doodle shape={sk.ellipse(228, 58, 11, 14, 18)} fill="#FF5A36" />
      <Doodle shape={sk.poly([[216, 68], [234, 74], [218, 128], [202, 124]])} fill="#F4FBF8" />
      <Doodle shape={sk.poly([[202, 124], [218, 128], [204, 156]])} fill="#F4FBF8" />
      <Doodle shape={sk.drop(202, 184, 12)} fill={p.accent} />
      <Line shape={sk.curve([[174, 162], [196, 148], [208, 116]])} weight={p.weight * 1.4} />
      {/* CRT head */}
      <Doodle shape={sk.rect(58, 44, 140, 104, 22)} />
      <Doodle shape={sk.rect(76, 60, 104, 72, 12)} fill={screen} hatch={false} />
      <Doodle shape={sk.rect(100, 80, 14, 18, 2)} fill={p.accent} ink={p.accent} weight={p.weight * 0.5} hatch={false} />
      <Doodle shape={sk.rect(142, 80, 14, 18, 2)} fill={p.accent} ink={p.accent} weight={p.weight * 0.5} hatch={false} />
      <Line shape={sk.arc(128, 104, 14, 25, 155)} ink={p.accent} weight={p.weight * 0.8} />
      {/* antenna */}
      <Line shape={sk.curve([[128, 44], [126, 30]])} weight={p.weight} />
      <Doodle shape={sk.circle(126, 22, 9)} fill={p.accent} />
    </Sticker>
  );
}
