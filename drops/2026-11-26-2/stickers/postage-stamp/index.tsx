import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Postage Stamp',
  description: 'A perforated crayon postage stamp with a sprouting leaf and a wavy postmark across its corner — the kit’s postmark motif as a doodle.',
  tags: ['stamp', 'postage', 'postmark', 'mail', 'doodle'],
};

export const schema = stickerSchema({ fill: '#F4E6B8', accent: '#6A8D3A', ink: '#5E4A12' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil', fill: '#E9D48C', ink: '#4A3A0E' },
  'die-cut': { border: true },
  postbox: { fill: '#FAD8CC', accent: '#E85D3F', ink: '#7A2A1A' },
  frost: { fill: '#D9E6EE', accent: '#2F6F8F', ink: '#1F3D4D' },
};

/** Rectangle whose edges are notched like stamp perforations. */
function perforated(x: number, y: number, w: number, h: number, step = 15, depth = 5): Pt[] {
  const out: Pt[] = [];
  const edge = (ax: number, ay: number, bx: number, by: number, nx: number, ny: number) => {
    const len = Math.hypot(bx - ax, by - ay);
    const n = Math.round(len / step);
    for (let i = 0; i < n; i++) {
      const t0 = i / n, tm = (i + 0.5) / n;
      out.push([ax + (bx - ax) * t0, ay + (by - ay) * t0]);
      out.push([ax + (bx - ax) * tm + nx * depth, ay + (by - ay) * tm + ny * depth]);
    }
  };
  edge(x, y, x + w, y, 0, 1);
  edge(x + w, y, x + w, y + h, -1, 0);
  edge(x + w, y + h, x, y + h, 0, -1);
  edge(x, y + h, x, y, 1, 0);
  return out;
}

export default function PostageStamp(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Postage stamp">
      <Doodle shape={{ pts: perforated(52, 34, 152, 188), closed: true, sharp: true }} />
      {/* The stamp's picture: a pale window with a two-leaf sprout. */}
      <Doodle shape={sk.rect(72, 56, 112, 124, 6)} fill="#FBF8EE" hatch={false} />
      <Line shape={sk.curve([[128, 166], [126, 140], [128, 112]])} weight={p.weight * 0.8} />
      <Doodle shape={{ pts: [[128, 118], [110, 96], [86, 92], [94, 116], [116, 126]], closed: true }} fill={p.accent} />
      <Doodle shape={{ pts: [[130, 108], [146, 80], [170, 74], [166, 100], [142, 114]], closed: true }} fill={p.accent} />
      <Line shape={sk.poly([[84, 200], [140, 200]], { closed: false })} weight={p.weight * 0.7} />
      {/* Postmark: a ring and three wavy cancellation lines over the corner. */}
      <Doodle shape={sk.circle(196, 66, 32)} fill="#FBF8EE" hatch={false} weight={p.weight * 0.7} />
      <Doodle shape={sk.circle(196, 66, 6)} fill={p.ink} hatch={false} weight={p.weight * 0.5} />
      <Line shape={[sk.wave(132, 124, 100, 5, 2), sk.wave(132, 142, 100, 5, 2), sk.wave(132, 160, 100, 5, 2)]} weight={p.weight * 0.6} />
    </Sticker>
  );
}
