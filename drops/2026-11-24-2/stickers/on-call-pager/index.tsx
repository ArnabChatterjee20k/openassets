import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, tint } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'On-call Pager',
  description: 'A chunky buzzing pager with a red LED and a little screen: the 3 a.m. page Halfstream answers for you.',
  tags: ['pager', 'on-call', 'alert', 'incident', 'doodle'],
};

export const schema = stickerSchema({ fill: '#DCDCD5', accent: '#E3000F', ink: '#2A2A28' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  cherry: { fill: '#FFB3B8', accent: '#E3000F', ink: '#6B0A12' },
  blueprint: { fill: '#A9C8FF', accent: '#FFDD00', ink: '#0F3B8C' },
};

export default function OnCallPager(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  const screen = '#2E3A2E';
  return (
    <Sticker p={p} label="Pager">
      {/* belt clip, then body */}
      <Doodle shape={sk.rect(100, 52, 56, 30, 8)} fill={tint(p.fill, -0.18)} hatch={false} />
      <Doodle shape={sk.rect(46, 70, 164, 130, 28)} />
      {/* screen with a log line */}
      <Doodle shape={sk.rect(66, 90, 124, 54, 9)} fill={screen} hatch={false} />
      <Line shape={sk.curve([[80, 108], [126, 108]])} ink="#B8F5A0" weight={p.weight * 1.1} />
      <Line shape={sk.curve([[80, 126], [168, 126]])} ink="#B8F5A0" weight={p.weight * 1.1} />
      {/* buttons + LED */}
      <Doodle shape={sk.rect(68, 160, 38, 22, 9)} fill={p.fill} hatch={false} />
      <Doodle shape={sk.rect(114, 160, 38, 22, 9)} fill={p.fill} hatch={false} />
      <Doodle shape={sk.circle(182, 171, 13)} fill={p.accent} hatch={false} />
      {/* buzz lines hug the body */}
      <Line shape={[sk.curve([[30, 102], [22, 134], [30, 166]]), sk.curve([[16, 92], [6, 134], [16, 176]])]} weight={p.weight * 0.9} />
      <Line shape={[sk.curve([[226, 102], [234, 134], [226, 166]]), sk.curve([[240, 92], [250, 134], [240, 176]])]} weight={p.weight * 0.9} />
    </Sticker>
  );
}
