import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, type Pt } from '@/kit';
import { color } from '@/lib/params';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Watch Camera',
  description: 'A chunky CCTV camera on a wall arm with a glowing lens and a red REC dot: the "your cameras already see it" doodle.',
  tags: ['camera', 'cctv', 'video', 'watch', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FFE3CF', accent: '#FF6A1A', ink: '#4A1A0C' }).extend({
  rec: color('REC dot').default('#FF2E63'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  amber: { fill: '#FFC94D', accent: '#FF4D00', ink: '#4A1A0C', rec: '#FF2E63' },
  steel: { fill: '#DCE4EA', accent: '#2F6F8F', ink: '#17242E', rec: '#E4572E' },
};

// Camera body: a rounded box tilted down-left, as if looking at the street below.
const rot = (pts: Pt[], deg: number, cx: number, cy: number): Pt[] => {
  const a = (deg * Math.PI) / 180;
  return pts.map(([x, y]): Pt => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
};

export default function WatchCamera(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  const body = rot(sk.rect(50, 86, 150, 70, 22).pts, -18, 125, 121);
  const hood = rot(sk.rect(40, 76, 160, 22, 10).pts, -18, 125, 121);
  return (
    <Sticker p={p} label="CCTV camera">
      {/* wall plate + arm first, behind the body */}
      <Doodle shape={sk.rect(200, 120, 28, 92, 8)} fill={p.accent} />
      <Doodle shape={sk.poly([[150, 140], [206, 158], [206, 176], [146, 162]], { sharp: false })} fill={p.accent} />
      <Doodle shape={sk.curve(body, true)} />
      <Doodle shape={sk.curve(hood, true)} fill={p.accent} hatch={false} />
      {/* lens on the front face */}
      <Doodle shape={sk.circle(62, 150, 24)} fill={p.ink} hatch={false} />
      <Doodle shape={sk.circle(62, 150, 12)} fill={p.accent} outline={false} hatch={false} />
      <Doodle shape={sk.circle(57, 145, 4)} fill="#FFFFFF" outline={false} hatch={false} />
      {/* REC dot */}
      <Doodle shape={sk.circle(158, 112, 8)} fill={p.rec} ink={p.ink} hatch={false} />
      {/* "seeing" lines */}
      <Line shape={[sk.curve([[30, 196], [22, 212]]), sk.curve([[52, 204], [48, 224]]), sk.curve([[76, 202], [80, 222]])]} weight={p.weight * 0.8} />
    </Sticker>
  );
}
