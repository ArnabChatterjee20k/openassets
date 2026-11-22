import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { color } from '@/lib/params';
import { Doodle, Line, Sticker, sk, stickerSchema, tint, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Long-Stem Rose',
  description: 'A single crayon rose on a long stem: the daily rose reward, a gift from a love interest, a Valentine nod.',
  tags: ['rose', 'flower', 'gift', 'valentine', 'doodle'],
};

export const schema = stickerSchema({ fill: '#E3173E', accent: '#5E9E5A', ink: '#5A0E1E' }).extend({
  stemInk: color('Stem outline').default('#24461F'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  blush: { fill: '#F5A3B5', ink: '#7A2338' },
  gold: { fill: '#F7B32B', ink: '#6B3A0A', accent: '#6E9E4F' },
};

// Bloom: a tulip-ish cup with three points along the top rim.
const BLOOM: Pt[] = [
  [76, 86], [74, 50], [84, 46], [104, 64], [124, 30], [132, 30], [152, 62], [172, 44], [182, 48], [182, 88], [172, 118], [152, 136], [128, 142], [104, 136], [86, 118],
];

export default function LongStemRose(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Rose">
      {/* Stem first, then leaves, then the bloom on top */}
      <Line shape={sk.curve([[128, 138], [122, 172], [132, 204], [124, 234]])} ink={p.stemInk} weight={p.weight * 1.2} />
      <Doodle shape={sk.curve([[126, 180], [152, 156], [196, 150], [184, 176], [146, 192]], true)} fill={p.accent} ink={p.stemInk} />
      <Doodle shape={sk.curve([[128, 212], [100, 190], [60, 192], [76, 216], [112, 222]], true)} fill={p.accent} ink={p.stemInk} />
      <Doodle shape={sk.curve(BLOOM, true)} />
      {/* The rose's tight spiral heart, then the two wrapping side petals */}
      <Doodle shape={sk.ellipse(128, 74, 30, 20, -6)} fill={tint(p.fill, -0.18)} />
      <Line shape={sk.spiral(128, 74, 22, 1.6)} weight={p.weight * 0.7} />
      <Line shape={[sk.curve([[82, 62], [90, 100], [118, 132]]), sk.curve([[178, 60], [170, 100], [140, 132]])]} weight={p.weight * 0.7} />
      <Doodle shape={sk.ellipse(162, 104, 7, 3.5, -55)} fill={tint(p.fill, 0.55)} outline={false} hatch={false} />
    </Sticker>
  );
}
