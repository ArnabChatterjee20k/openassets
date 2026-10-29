// Headless render target used by scripts/render.ts and scripts/validate.ts.
// URL: #/render/<id>?variant=<name>&size=<bannerSize|px>&angle=<angle>&frame=<n>
// Sets document.body.dataset.ready = '1' when the asset is painted, and
// exposes window.__exportGLB() for 3D assets.
import { useEffect } from 'react';
import { BANNER_SIZES, resolveParams } from '@/lib/types';
import { AssetView } from '@/renderers/AssetView';
import type { Angle } from '@/renderers/Scene3D';
import { sceneToGlb } from '@/renderers/export';
import { useAsset } from '../useAsset';

declare global {
  interface Window {
    __exportGLB?: () => Promise<string>;
  }
}

const markReady = async () => {
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => (document.body.dataset.ready = '1')));
};

export function RenderPage({ id, query }: { id: string; query: URLSearchParams }) {
  const { mod, error } = useAsset(id);
  const variant = query.get('variant') ?? 'default';
  const kind = mod?.meta.kind;

  useEffect(() => {
    document.body.classList.add('render-mode');
    if (error) document.body.dataset.error = error;
  }, [error]);

  useEffect(() => {
    if (kind && kind !== 'icon3d') markReady();
  }, [kind]);

  if (!mod) return null;
  const params = resolveParams(mod, variant);

  if (mod.meta.kind === 'icon' || mod.meta.kind === 'icon3d') {
    const px = Number(query.get('size')) || (mod.meta.kind === 'icon' ? 512 : 1024);
    return (
      <div id="target" style={{ width: px, height: px }}>
        <AssetView
          mod={mod}
          params={params}
          opts={{
            angle: (query.get('angle') as Angle) ?? 'iso',
            onSceneReady: ({ scene }) => {
              window.__exportGLB = async () => {
                const buf = new Uint8Array(await sceneToGlb(scene));
                let bin = '';
                for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
                return btoa(bin);
              };
              markReady();
            },
          }}
        />
      </div>
    );
  }

  const size = mod.meta.kind === 'banner' ? BANNER_SIZES[query.get('size') ?? 'og'] : { width: mod.video!.width, height: mod.video!.height };
  return (
    <div id="target" style={{ width: size.width, height: size.height }}>
      <AssetView
        mod={mod}
        params={params}
        opts={{ fit: false, bannerSize: query.get('size') ?? 'og', frame: query.has('frame') ? Number(query.get('frame')) : undefined }}
      />
    </div>
  );
}
