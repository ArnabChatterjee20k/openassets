import { Suspense, useEffect, useRef, useState } from 'react';
import { dropInfo } from '@/lib/registry';
import { KIND_LABELS, resolveParams, type AssetModule, type AssetRef } from '@/lib/types';
import { AssetView } from '@/renderers/AssetView';
import { SceneView } from '@/renderers/SceneView';
import { LazyPlayer as Player, LazyScene3D as Scene3D, LazyThumbnail as Thumbnail, loadOffscreen3d } from '@/renderers/lazy';
import { href } from './router';
import { useAsset } from './useAsset';

/** True once the element has come near the viewport (and stays true). */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [inView]);
  return { ref, inView };
}

/**
 * Everything is rendered live from source, lazily: nothing until the card is
 * near the viewport, a still at rest, motion only on hover. No preview files.
 */
function LivePreview({ id, mod, hover }: { id: string; mod: AssetModule; hover: boolean }) {
  const params = resolveParams(mod);
  const kind = mod.meta.kind;
  const [still, setStill] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== 'icon3d') return;
    let live = true;
    loadOffscreen3d()
      .then(({ snapshot3d }) => snapshot3d(id, mod.default, resolveParams(mod)))
      .then((url) => live && setStill(url));
    return () => {
      live = false;
    };
  }, [id, mod, kind]);

  if (kind === 'icon3d') {
    if (hover)
      return (
        <Suspense fallback={still ? <img className="preview-img" src={still} alt="" /> : <div className="skeleton" />}>
          <Scene3D Component={mod.default} params={params} mode="interaction" interactive />
        </Suspense>
      );
    return still ? <img className="preview-img" src={still} alt="" /> : <div className="skeleton" />;
  }

  if (kind === 'scene') {
    // Rest on the first frame; play the SMIL timeline while hovered.
    return <SceneView Component={mod.default} params={params} time={hover ? undefined : 0} />;
  }

  if (kind === 'video') {
    const v = mod.video!;
    const common = {
      component: mod.default,
      inputProps: params,
      compositionWidth: v.width,
      compositionHeight: v.height,
      durationInFrames: v.durationInFrames,
      fps: v.fps,
      style: { width: '100%', height: '100%' },
    };
    return (
      <div className="fill">
        <Suspense fallback={<div className="skeleton" />}>
        {hover ? (
          <Player {...common} autoPlay loop initiallyMuted acknowledgeRemotionLicense />
        ) : (
          <Thumbnail {...common} frameToDisplay={Math.round(v.durationInFrames * 0.7)} />
        )}
        </Suspense>
      </div>
    );
  }

  return <AssetView mod={mod} params={params} />;
}

export function AssetCard({ asset, showKit = true }: { asset: AssetRef; showKit?: boolean }) {
  const { ref, inView } = useInView<HTMLAnchorElement>();
  const { mod, error } = useAsset(asset.id, inView);
  const [hover, setHover] = useState(false);
  const kit = dropInfo(asset.date);

  return (
    <a
      ref={ref}
      className={`card card-${asset.kind}`}
      href={href(`/asset/${asset.id}`)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="card-preview">
        <span className="card-tag">{KIND_LABELS[asset.kind]}</span>
        {error ? <div className="card-error">Failed to load</div> : mod ? <LivePreview id={asset.id} mod={mod} hover={hover} /> : <div className="skeleton" />}
      </div>
      <div className="card-meta">
        <div className="card-title">
          <span>{mod?.meta.name ?? asset.slug.replace(/-/g, ' ')}</span>
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
