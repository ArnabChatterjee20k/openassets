// A 3D card: the seeded light-beam backdrop with the asset's 3D object standing
// in the glow pool. Used by the gallery, the editor and the headless render page.
import { Suspense, type ComponentType } from 'react';
import { BeamBackdrop, beamLight, type BeamParams } from '@/kit/beam';
import { CARD3D_SIZE } from '@/lib/types';
import type { MotionMode, SceneHandle } from './Scene3D';
import { LazyScene3D as Scene3D } from './lazy';

/** Camera distance that keeps the object small in its card, like a product mark. */
export const CARD_CAMERA_Z = 6.8;

export function BeamCard({
  Component,
  params,
  snapshot,
  interactive,
  mode = 'default',
  time,
  onReady,
}: {
  Component: ComponentType<any>;
  params: Record<string, unknown>;
  /** A pre-rendered transparent PNG of the object; live WebGL when omitted. */
  snapshot?: string | null;
  interactive?: boolean;
  mode?: MotionMode;
  time?: number;
  onReady?: (h: SceneHandle) => void;
}) {
  const p = params as BeamParams;
  const light = beamLight(p).color;
  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: `${CARD3D_SIZE.width} / ${CARD3D_SIZE.height}`, overflow: 'hidden', borderRadius: 10, background: p.background }}>
      <BeamBackdrop p={p} />
      {/* The object lives in a centred square as tall as the card. */}
      <div style={{ position: 'absolute', left: '50%', top: 0, height: '100%', aspectRatio: '1 / 1', transform: 'translateX(-50%)' }}>
        {snapshot !== undefined ? (
          snapshot ? <img src={snapshot} alt="" style={{ width: '100%', height: '100%', display: 'block' }} /> : null
        ) : (
          <Suspense fallback={null}>
            <Scene3D Component={Component} params={params} light={light} cameraZ={CARD_CAMERA_Z} interactive={interactive} controls={interactive} mode={mode} time={time} onReady={onReady} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
