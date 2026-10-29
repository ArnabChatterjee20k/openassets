import { useState } from 'react';
import { previewUrl } from '@/lib/registry';
import { resolveParams, type AssetRef } from '@/lib/types';
import { AssetView } from '@/renderers/AssetView';
import { href } from './router';
import { useAsset } from './useAsset';

export function AssetCard({ asset }: { asset: AssetRef }) {
  const { mod, error } = useAsset(asset.id);
  const [noPreview, setNoPreview] = useState(false);

  let body;
  if (error) body = <div className="card-error">Failed to load</div>;
  else if (!mod) body = <div className="skeleton" />;
  else if (asset.kind === 'icon3d' && !noPreview)
    // Prefer the CI-rendered PNG so a gallery doesn't spin up many WebGL contexts.
    body = <img className="preview-img" src={previewUrl(asset.id, 'default', 'png')} alt="" onError={() => setNoPreview(true)} />;
  else body = <AssetView mod={mod} params={resolveParams(mod)} />;

  return (
    <a className={`card card-${asset.kind}`} href={href(`/asset/${asset.id}`)}>
      <div className="card-preview">{body}</div>
      <div className="card-meta">
        <strong>{mod?.meta.name ?? asset.slug}</strong>
        {mod && <span className="muted">{Object.keys(mod.variants).length + 1} variants</span>}
      </div>
    </a>
  );
}
