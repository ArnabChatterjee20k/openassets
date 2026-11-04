// Renders any asset kind for on-screen preview. Used by gallery cards, the
// editor and the headless render page.
import { Suspense, useEffect, useRef, useState, type CSSProperties, type Ref } from 'react';
import { BANNER_SIZES, type AssetModule } from '@/lib/types';
import type { Angle, MotionMode, SceneHandle } from './Scene3D';
import { LazyPlayer as Player, LazyScene3D as Scene3D, LazyThumbnail as Thumbnail } from './lazy';
import { SceneView } from './SceneView';
import { BeamCard } from './BeamCard';

export interface ViewOptions {
  /** Key of BANNER_SIZES for banners. */
  bannerSize?: string;
  /** Interactive: orbit controls for 3D, playback controls for video. */
  interactive?: boolean;
  angle?: Angle;
  /** Frame to show for non-interactive video. */
  frame?: number;
  /** 3D: fixed motion time in seconds (deterministic stills). */
  time?: number;
  /** Scenes: hold the animation (live view). */
  paused?: boolean;
  /** 3D: 'default' rests and animates on interaction; 'interaction' loops. */
  motion?: MotionMode;
  /** Scale banner/video down to fit parent width (true) or render at native size (false). */
  fit?: boolean;
  onSceneReady?: (h: SceneHandle) => void;
  nodeRef?: Ref<HTMLDivElement>;
}

/** Scales a fixed-size child to the width of its container. */
function FitBox({ width, height, fit, children }: { width: number; height: number; fit: boolean; children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!fit || !outer.current) return;
    const el = outer.current;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit, width]);
  if (!fit) return <>{children}</>;
  return (
    <div ref={outer} style={{ width: '100%', aspectRatio: `${width} / ${height}`, overflow: 'hidden', position: 'relative' }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute' }}>{children}</div>
    </div>
  );
}

export function AssetView({ mod, params, opts = {} }: { mod: AssetModule; params: Record<string, unknown>; opts?: ViewOptions }) {
  const { kind } = mod.meta;
  const Comp = mod.default;
  const fit = opts.fit ?? true;

  if (kind === 'icon') {
    // Sizing lives in CSS (.icon-view) so each context can size the icon.
    return (
      <div ref={opts.nodeRef} className="icon-view">
        <Comp {...params} />
      </div>
    );
  }

  if (kind === 'card3d') {
    return (
      <div ref={opts.nodeRef} style={{ width: '100%' }}>
        <BeamCard Component={Comp} params={params} interactive={opts.interactive} mode={opts.motion ?? 'default'} time={opts.time} onReady={opts.onSceneReady} />
      </div>
    );
  }

  if (kind === 'icon3d') {
    return (
      <div ref={opts.nodeRef} style={{ width: '100%', height: '100%' }}>
        <Suspense fallback={<div className="skeleton" />}>
        <Scene3D
          Component={Comp}
          params={params}
          angle={opts.angle}
          controls={opts.interactive}
          interactive={opts.interactive}
          mode={opts.motion ?? 'default'}
          time={opts.time}
          onReady={opts.onSceneReady}
        />
        </Suspense>
      </div>
    );
  }

  if (kind === 'scene') {
    const sc = mod.scene!;
    return (
      <div style={{ width: '100%', aspectRatio: `${sc.width} / ${sc.height}`, ...(fit ? {} : { width: sc.width, height: sc.height }) }}>
        <SceneView Component={Comp} params={params} time={opts.time} paused={opts.paused} nodeRef={opts.nodeRef} />
      </div>
    );
  }

  if (kind === 'banner') {
    const size = BANNER_SIZES[opts.bannerSize ?? 'og'] ?? BANNER_SIZES.og;
    return (
      <FitBox width={size.width} height={size.height} fit={fit}>
        <div ref={opts.nodeRef} style={{ width: size.width, height: size.height }}>
          <Comp {...params} width={size.width} height={size.height} />
        </div>
      </FitBox>
    );
  }

  const v = mod.video!;
  // Vertical (story) videos fit to height instead of width.
  const vertical = v.height > v.width;
  const fitStyle: CSSProperties = vertical
    ? { height: '100%', aspectRatio: `${v.width} / ${v.height}`, margin: '0 auto' }
    : { width: '100%' };
  const common = {
    component: Comp,
    inputProps: params,
    compositionWidth: v.width,
    compositionHeight: v.height,
    durationInFrames: v.durationInFrames,
    fps: v.fps,
    style: fit ? fitStyle : { width: v.width, height: v.height },
  };
  return (
    <div ref={opts.nodeRef} style={fit && vertical ? { height: opts.interactive ? '70vh' : '100%' } : undefined}>
      <Suspense fallback={<div className="skeleton" />}>
        {opts.interactive ? (
          <Player {...common} controls loop autoPlay acknowledgeRemotionLicense />
        ) : (
          <Thumbnail {...common} frameToDisplay={opts.frame ?? Math.floor(v.durationInFrames / 2)} />
        )}
      </Suspense>
    </div>
  );
}
