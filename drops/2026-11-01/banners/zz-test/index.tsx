// SCRATCH — this folder must be deleted before publishing (left over from a font test).
import { z } from 'zod';
import { color } from '@/lib/params';
import type { AssetMeta, BannerSize } from '@/lib/types';

export const meta: AssetMeta = { kind: 'banner', name: 'Scratch (delete me)', description: 'Leftover scratch file; delete this folder.', tags: ['scratch'] };
export const schema = z.object({ background: color().default('#0B0B0B') });
export const variants: Record<string, Partial<z.input<typeof schema>>> = { a: {}, b: { background: '#1A1A1A' } };

export default function Scratch(p: z.infer<typeof schema> & BannerSize) {
  return <div style={{ width: p.width, height: p.height, background: p.background }} />;
}
