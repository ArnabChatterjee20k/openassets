import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Bubbling Flask',
  description: 'A crayon Erlenmeyer flask of glowing chartreuse reagent with bubbles popping out of the neck: the "experiment running" doodle.',
  tags: ['flask', 'experiment', 'lab', 'chemistry', 'doodle'],
};

export const schema = stickerSchema({ fill: '#DDF2EE', accent: '#D4FF3A', ink: '#1D4A46' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil', fill: '#C9E6E0', ink: '#24423F' },
  'die-cut': { border: true },
  coral: { accent: '#FF7A5C', ink: '#5A2A20', fill: '#FFF1EA' },
  teal: { accent: '#3FA7A0', fill: '#F1FAF7', ink: '#123532' },
};

// Inner wall of the flask at height y (the cone runs from the neck at y=110 to the base at y=216).
const wall = (y: number) => (y - 110) * (62 / 106);

export default function BubblingFlask(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  const ly = 158;
  return (
    <Sticker p={p} label="Flask">
      {/* glass body */}
      <Doodle
        shape={sk.poly([[102, 48], [154, 48], [154, 60], [146, 60], [146, 110], [208, 214], [200, 226], [56, 226], [48, 214], [110, 110], [110, 60], [102, 60]])}
      />
      {/* reagent */}
      <Doodle
        shape={sk.poly([[110 - wall(ly) + 4, ly], [118, ly - 8], [142, ly + 4], [146 + wall(ly) - 4, ly - 6], [200, 212], [194, 218], [62, 218], [56, 212]])}
        fill={p.accent}
      />
      {/* bubbles in the liquid and popping out of the neck */}
      <Doodle shape={sk.circle(104, 192, 9)} fill={p.fill} hatch={false} />
      <Doodle shape={sk.circle(150, 182, 12)} fill={p.fill} hatch={false} />
      <Doodle shape={sk.circle(130, 204, 6)} fill={p.fill} hatch={false} />
      <Doodle shape={sk.circle(146, 30, 11)} fill={p.fill} hatch={false} />
      <Doodle shape={sk.circle(116, 22, 7)} fill={p.fill} hatch={false} />
      {/* glass highlight */}
      <Line shape={sk.curve([[124, 70], [124, 112], [94, 166]])} ink="#FFFFFF" weight={p.weight * 0.9} />
    </Sticker>
  );
}
