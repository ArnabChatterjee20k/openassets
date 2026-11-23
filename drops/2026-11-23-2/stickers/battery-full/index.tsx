import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Battery Full',
  description: 'A chunky crayon battery with three green charge bars and a bolt, for "480 kWh stored" and overnight-power callouts.',
  tags: ['battery', 'storage', 'charge', 'energy', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FFFDF2', accent: '#00D1A0', ink: '#0B4D3C' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  sunny: { fill: '#FFE45C', accent: '#FF6B4A', ink: '#6B4E00' },
  blue: { fill: '#DCE6FF', accent: '#5C8AFF', ink: '#1A2A6B' },
};

export default function BatteryFull(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Battery">
      <Doodle shape={sk.rect(30, 74, 178, 112, 22)} />
      <Doodle shape={sk.rect(206, 106, 24, 48, 8)} fill={p.ink} hatch={false} />
      {[0, 1, 2].map((i) => (
        <Doodle key={i} shape={sk.rect(48 + i * 52, 92, 40, 76, 8)} fill={p.accent} />
      ))}
      <Doodle shape={sk.bolt(122, 132, 58)} fill="#FFE45C" />
    </Sticker>
  );
}
