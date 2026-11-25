import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Ringing Handset',
  description: 'A chunky crayon phone handset buzzing with ring lines: the hero doodle for "dial four, talk to one".',
  tags: ['phone', 'call', 'ringing', 'dialer', 'doodle'],
};

export const schema = stickerSchema({ fill: '#E07A5F', accent: '#F2A541', ink: '#6E2616' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  sage: { fill: '#8FB096', accent: '#F2A541', ink: '#2F4A36' },
  saffron: { fill: '#F2B45A', accent: '#C8553D', ink: '#7A3E12' },
};

// The handset bows toward the lower-left around a centre at the upper right.
const C: Pt = [178, 78];
const polar = (r: number, deg: number): Pt => [C[0] + Math.cos((deg * Math.PI) / 180) * r, C[1] + Math.sin((deg * Math.PI) / 180) * r];
const range = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

// Grip band between two radii, closed into one outline.
const grip: Pt[] = [...range(98, 172, 10).map((d) => polar(122, d)), ...range(172, 98, 10).map((d) => polar(92, d))];

// Ear and mouth pieces: fat rounded pads at each end, sitting on the inner side.
function pad(deg: number): Pt[] {
  const [cx, cy] = polar(96, deg);
  const a = (deg * Math.PI) / 180;
  // long axis along the tangent, short axis radial
  return Array.from({ length: 22 }, (_, i) => {
    const t = (i / 22) * Math.PI * 2;
    const u = Math.cos(t) * 40;
    const v = Math.sin(t) * 27;
    return [cx - Math.sin(a) * u + Math.cos(a) * v, cy + Math.cos(a) * u + Math.sin(a) * v] as Pt;
  });
}

export default function RingingHandset(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Ringing handset">
      <Doodle shape={sk.curve(grip, true)} />
      <Doodle shape={sk.curve(pad(176), true)} />
      <Doodle shape={sk.curve(pad(94), true)} />
      {/* ring lines radiate into the empty upper-right */}
      <Line shape={sk.arc(116, 140, 70, -78, -12)} ink={p.ink} weight={p.weight * 1.1} />
      <Line shape={sk.arc(116, 140, 100, -74, -16)} ink={p.ink} weight={p.weight * 1.1} />
      <Doodle shape={sk.sparkle(212, 40, 18)} fill={p.accent} />
    </Sticker>
  );
}
