import { Suspense, useEffect, useRef, useState } from 'react';
import { dropInfo } from '@/lib/registry';
import { KIND_LABELS, resolveParams, type AssetModule, type AssetRef } from '@/lib/types';
import { AssetView } from '@/renderers/AssetView';
import { SceneView } from '@/renderers/SceneView';
import { BeamCard, CARD_CAMERA_Z } from '@/renderers/BeamCard';
import { beamLight, type BeamParams } from '@/kit/beam';
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
    if (kind !== 'icon3d' && kind !== 'card3d') return;
    let live = true;
    const p = resolveParams(mod);
    // 3D cards render their object under the card's own beam light, sized to the card height.
    const stage = kind === 'card3d' ? { light: beamLight(p as BeamParams).color, cameraZ: CARD_CAMERA_Z } : {};
    loadOffscreen3d()
      .then(({ snapshot3d }) => snapshot3d(id, mod.default, p, stage, kind === 'card3d' ? 420 : undefined))
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

  if (kind === 'card3d') {
    // Live WebGL only while hovered; otherwise the backdrop with a snapshot of the object.
    return (
      <div className="fill card3d-fill">
        <BeamCard Component={mod.default} params={params} snapshot={hover ? undefined : still} mode="interaction" interactive={hover} />
      </div>
    );
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
