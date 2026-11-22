import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Rain Cloud',
  description: 'A puffy crayon rain cloud with a sleepy face and three falling drops, for forecast cards and empty states.',
  tags: ['weather', 'cloud', 'rain', 'doodle'],
};

export const schema = stickerSchema({ fill: '#CFE3F7', accent: '#4F8FE0', ink: '#30577F' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil', fill: '#7FA9D9', ink: '#3A4F66' },
  'die-cut': { border: true },
  storm: { fill: '#9AA6B8', accent: '#3E5D86', ink: '#2C3442' },
  sunset: { fill: '#FFD7C2', accent: '#F27D52', ink: '#9A4A31' },
};

export default function RainCloud(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Rain cloud">
      {/* Drops first so the cloud overlaps their tops. */}
      <Doodle shape={sk.drop(88, 196, 20)} fill={p.accent} />
      <Doodle shape={sk.drop(130, 210, 22)} fill={p.accent} />
      <Doodle shape={sk.drop(172, 192, 19)} fill={p.accent} />
      <Doodle shape={sk.cloud(128, 116, 184, 118, 7)} />
      {/* Sleepy face: closed-eye arcs, a small smile and blush. */}
      <Doodle shape={sk.ellipse(92, 132, 11, 7)} fill="#F6A6B2" outline={false} hatch={false} />
      <Doodle shape={sk.ellipse(164, 132, 11, 7)} fill="#F6A6B2" outline={false} hatch={false} />
      <Line shape={sk.arc(106, 116, 9, 20, 160)} weight={p.weight * 0.8} />
      <Line shape={sk.arc(150, 116, 9, 20, 160)} weight={p.weight * 0.8} />
      <Line shape={sk.arc(128, 128, 10, 30, 150)} weight={p.weight * 0.7} />
    </Sticker>
  );
}
