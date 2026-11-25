import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, type Pt, type Shape } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Dose Pen',
  description: 'A chunky crayon injection pen with a ridged dose dial, a blue dose window and a pink cap, for shot-day posts.',
  tags: ['injection pen', 'glp-1', 'dose', 'health', 'doodle'],
};

export const schema = stickerSchema({ fill: '#E6EBF5', accent: '#3D5AFE', ink: '#1E2550' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  lilac: { fill: '#EEE8FA', accent: '#7C5CFF', ink: '#231942' },
  sorbet: { fill: '#FFF0E6', accent: '#FF4F6D', ink: '#3D0E2A' },
};

// The pen is drawn level, then everything is tilted -32° around the centre.
const A = (-32 * Math.PI) / 180;
const rot = ([x, y]: Pt): Pt => {
  const dx = x - 128;
  const dy = y - 128;
  return [128 + dx * Math.cos(A) - dy * Math.sin(A), 128 + dx * Math.sin(A) + dy * Math.cos(A)];
};
const R = (s: Shape): Shape => ({ ...s, pts: s.pts.map(rot) });

export default function DosePen(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Dose pen">
      {/* needle, hub, barrel, dial, plunger button */}
      <Line shape={R(sk.curve([[8, 128], [44, 128]]))} weight={p.weight * 0.8} />
      <Doodle shape={R(sk.poly([[36, 116], [62, 106], [62, 150], [36, 140]]))} fill="#FF3DB4" />
      <Doodle shape={R(sk.rect(58, 98, 124, 60, 22))} />
      <Doodle shape={R(sk.rect(176, 92, 44, 72, 12))} fill={p.accent} />
      <Doodle shape={R(sk.rect(216, 110, 28, 36, 10))} fill="#FF3DB4" />
      {/* grip ridges on the dial */}
      <Line shape={[188, 200, 210].map((x) => R(sk.curve([[x, 100], [x, 156]])))} weight={p.weight * 0.6} />
      {/* dose window with a little scale */}
      <Doodle shape={R(sk.rect(98, 112, 54, 32, 8))} fill={p.accent} />
      <Line shape={[110, 124, 138].map((x) => R(sk.curve([[x, 120], [x, 136]])))} weight={p.weight * 0.55} ink="#FFFFFF" />
      {/* highlight along the barrel */}
      <Line shape={R(sk.curve([[74, 108], [150, 106]]))} weight={p.weight * 0.7} ink="#FFFFFF" />
      {/* a drop at the needle tip */}
      <Doodle shape={sk.drop(34, 212, 18)} fill={p.accent} />
    </Sticker>
  );
}
