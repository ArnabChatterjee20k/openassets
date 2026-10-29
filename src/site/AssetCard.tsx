import { useState } from 'react';
import { previewUrl } from '@/lib/registry';
import { resolveParams, type AssetRef } from '@/lib/types';
import { AssetView } from '@/renderers/AssetView';
import { href } from './router';
import { useAsset } from './useAsset';

export function AssetCard({ asset }: { asset: AssetRef }) {
  const { mod, error } = useAsset(asset.id);
  const [noPreview, setNoPreview] = useState(false);
  // Cards rest on a still; motion (video GIF / 3D interaction loop) plays on hover.
  const [hover, setHover] = useState(false);

  let body;
  if (error) body = <div className="card-error">Failed to load</div>;
  else if (!mod) body = <div className="skeleton" />;
  else if ((asset.kind === 'icon3d' || asset.kind === 'video') && !noPreview)
    // CI-rendered previews: avoids many WebGL contexts in the grid.
    body = (
      <img
        className="preview-img"
        src={previewUrl(asset.id, 'default', hover ? 'gif' : 'png')}
        alt=""
        loading="lazy"
        onError={() => setNoPreview(true)}
      />
    );
  else body = <AssetView mod={mod} params={resolveParams(mod)} />;

  return (
    <a className={`card card-${asset.kind}`} href={href(`/asset/${asset.id}`)} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="card-preview">{body}</div>
      <div className="card-meta">
        <strong>
          {mod?.meta.name ?? asset.slug}
          {mod?.meta.category && <span className="chip">{mod.meta.category}</span>}
        </strong>
        {mod && <span className="muted">{Object.keys(mod.variants).length + 1} variants</span>}
      </div>
    </a>
  );
}
