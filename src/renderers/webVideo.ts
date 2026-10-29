// Video templates rendered to MP4 in the visitor's browser with Remotion's
// web renderer — from the exact props they edited, nothing pre-rendered.
import { canRenderMediaOnWeb, renderMediaOnWeb } from '@remotion/web-renderer';
import type { AssetModule } from '@/lib/types';
import { slugify } from './export';

export async function renderVideoOnWeb(mod: AssetModule, props: Record<string, unknown>, onProgress?: (p: number) => void): Promise<Blob> {
  const v = mod.video!;
  const composition = {
    id: slugify(mod.meta.name) || 'video',
    component: mod.default,
    width: v.width,
    height: v.height,
    fps: v.fps,
    durationInFrames: v.durationInFrames,
  };
  const result = await renderMediaOnWeb({
    composition,
    inputProps: props,
    container: 'mp4',
    onProgress: ({ progress }) => onProgress?.(progress),
  } as Parameters<typeof renderMediaOnWeb>[0]);
  return result.getBlob();
}

export { canRenderMediaOnWeb };
