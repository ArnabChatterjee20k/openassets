import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Power Burst',
  description: 'A jagged yellow burst with a coral lightning bolt, for "POWER ON" moments, launch posts and price callouts.',
  tags: ['burst', 'lightning', 'power', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FFE45C', accent: '#FF6B4A', ink: '#6B4E00' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  'charge-green': { fill: '#7FF0CF', accent: '#FFE45C', ink: '#0B4D3C' },
  'panel-blue': { fill: '#9DB7FF', accent: '#FFE45C', ink: '#1A2A6B' },
};

export default function PowerBurst(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Power burst">
      <Doodle shape={sk.burst(128, 130, 100, 74, 13)} />
      <Doodle shape={sk.bolt(130, 132, 80)} fill={p.accent} />
    </Sticker>
  );
}
