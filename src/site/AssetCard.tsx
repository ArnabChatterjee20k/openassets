import { useState } from 'react';
import { dropInfo, previewUrl } from '@/lib/registry';
import { KIND_LABELS, resolveParams, type AssetRef } from '@/lib/types';
import { AssetView } from '@/renderers/AssetView';
import { href } from './router';
import { useAsset } from './useAsset';

const MOTION_KINDS = new Set(['icon3d', 'video', 'scene']);

export function AssetCard({ asset, showKit = true }: { asset: AssetRef; showKit?: boolean }) {
  const { mod, error } = useAsset(asset.id);
  const [noPreview, setNoPreview] = useState(false);
  // Cards rest on a still; motion (video, 3D interaction loop, scene) plays on hover.
  const [hover, setHover] = useState(false);
  const animated = MOTION_KINDS.has(asset.kind);

  let body;
  if (error) body = <div className="card-error">Failed to load</div>;
  else if (!mod) body = <div className="skeleton" />;
  else if (animated && !noPreview)
    // CI-rendered previews: avoids many WebGL contexts / live compositions in the grid.
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

  const kit = dropInfo(asset.date);
  return (
    <a
      className={`card card-${asset.kind}`}
      href={href(`/asset/${asset.id}`)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="card-preview">
        <span className="card-tag">{KIND_LABELS[asset.kind]}</span>
        {body}
      </div>
      <div className="card-meta">
        <div className="card-title">
          <span>{mod?.meta.name ?? asset.slug}</span>
          {mod && <span className="muted">{Object.keys(mod.variants).length + 1}</span>}
        </div>
        <span className="eyebrow-sm">
          {mod?.meta.category ? `${mod.meta.category} · ` : ''}
          {showKit && kit ? kit.theme : `${Object.keys(mod?.variants ?? {}).length + 1} variants`}
        </span>
      </div>
    </a>
  );
}
