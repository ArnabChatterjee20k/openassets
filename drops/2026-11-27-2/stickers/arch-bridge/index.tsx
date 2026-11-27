import type { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema, tint, type Pt } from '@/kit';
import { color } from '@/lib/params';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Arch Bridge',
  description: 'A steel arch bridge over a wavy river with one hot spot marked on the span, for structure pages and "we watch this" moments.',
  tags: ['bridge', 'structure', 'river', 'infrastructure', 'doodle'],
};

export const schema = stickerSchema({ fill: '#FF8A3D', accent: '#7FC4E8', ink: '#4A1A0C' }).extend({
  hotspot: color('Hot spot').default('#FF2E63'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  amber: { fill: '#FFB000', accent: '#FFE3CF', ink: '#4A1A0C', hotspot: '#FF4D00' },
  blueprint: { fill: '#EAF2FF', accent: '#7FB2FF', ink: '#0F3B8C', hotspot: '#FFDD00' },
};

// A deck-arch bridge: the arch springs from both banks and carries the deck on columns.
const CX = 128, BASE = 190, RX = 84, RISE = 84, THICK = 18;
const archY = (x: number, r: number, rise: number) => BASE - rise * Math.sqrt(Math.max(0, 1 - ((x - CX) / r) ** 2));
function arch(): Pt[] {
  const outer: Pt[] = Array.from({ length: 19 }, (_, i): Pt => {
    const a = Math.PI + (i / 18) * Math.PI;
    return [CX + Math.cos(a) * RX, BASE + Math.sin(a) * RISE];
  });
  const inner: Pt[] = Array.from({ length: 19 }, (_, i): Pt => {
    const a = (i / 18) * Math.PI;
    return [CX + Math.cos(a) * (RX - THICK), BASE - Math.sin(a) * (RISE - THICK)];
  });
  return [...outer, ...inner];
}

export default function ArchBridge(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  const cols = [62, 86, 170, 194];
  return (
    <Sticker p={p} label="Arch bridge">
      {/* river, full width under the span */}
      <Doodle shape={sk.curve([[26, 196], [76, 188], [128, 194], [180, 188], [230, 196], [226, 222], [128, 228], [30, 222]], true)} fill={p.accent} />
      {/* sloped embankments the arch springs from */}
      <Doodle shape={sk.poly([[24, 104], [42, 104], [62, 196], [22, 206]])} fill={tint(p.fill, -0.22)} />
      <Doodle shape={sk.poly([[214, 104], [232, 104], [234, 206], [194, 196]])} fill={tint(p.fill, -0.22)} />
      <Doodle shape={sk.curve(arch(), true)} />
      {/* spandrel columns from the arch up to the deck */}
      <Line shape={cols.map((x) => sk.curve([[x, archY(x, RX, RISE) + 2], [x, 104]]))} weight={p.weight * 0.75} />
      {/* deck */}
      <Doodle shape={sk.rect(16, 86, 224, 20, 6)} fill={p.fill} />
      {/* ripples */}
      <Line shape={sk.wave(92, 206, 72, 3.5, 2)} weight={p.weight * 0.6} />
      {/* the hot spot at the crown */}
      <Doodle shape={sk.circle(128, 112, 10)} fill={p.hotspot} ink={p.ink} hatch={false} />
    </Sticker>
  );
}
