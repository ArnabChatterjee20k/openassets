import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Umbrella',
  description: 'A striped crayon umbrella with a hooked handle, for rain alerts and "bring one today" nudges.',
  tags: ['weather', 'rain', 'umbrella', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FF6B6B', accent: '#FFF4E0', ink: '#6B1F2A' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  ocean: { fill: '#3BA7F0', accent: '#FFE66D', ink: '#163A5F' },
  plum: { fill: '#9B5DE5', accent: '#F9E0FF', ink: '#3A1D5C' },
};

// Canopy: a dome whose lower edge scallops between the rib tips.
const RIB = [44, 86, 128, 170, 212];
function canopy(): Pt[] {
  const top: Pt[] = Array.from({ length: 19 }, (_, i): Pt => {
    const a = Math.PI + (i / 18) * Math.PI;
    return [128 + Math.cos(a) * 84, 132 + Math.sin(a) * 84];
  });
  const hem: Pt[] = [];
  for (let i = RIB.length - 1; i > 0; i--) {
    for (let k = 1; k <= 4; k++) {
      const t = k / 4;
      const x = RIB[i] + (RIB[i - 1] - RIB[i]) * t;
      hem.push([x, 132 - Math.sin(t * Math.PI) * 10]);
    }
  }
  return [...top, ...hem];
}

export default function Umbrella(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Umbrella">
      <Line shape={sk.curve([[128, 132], [128, 176], [128, 200], [134, 214], [148, 214], [154, 202]])} weight={p.weight * 1.1} />
      <Doodle shape={sk.curve(canopy(), true)} />
      {/* Ribs from the tip to each scallop point. */}
      <Line shape={[sk.curve([[128, 50], [104, 84], [86, 130]]), sk.curve([[128, 50], [128, 132]]), sk.curve([[128, 50], [152, 84], [170, 130]])]} weight={p.weight * 0.7} />
      {/* A band of accent colour round the hem. */}
      <Doodle shape={sk.curve([[50, 118], [128, 108], [206, 118], [210, 128], [128, 122], [46, 128]], true)} fill={p.accent} outline={false} />
      <Doodle shape={sk.circle(128, 46, 6)} fill={p.ink} outline={false} hatch={false} />
    </Sticker>
  );
}
