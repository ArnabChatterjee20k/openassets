// An animated SVG scene as a Remotion composition: each frame seeks the SVG's
// SMIL timeline to frame / fps, so video exports match the live animation.
import { useLayoutEffect, useRef, type ComponentType } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { seekSvg } from '@/renderers/SceneView';

export const SCENE_FPS = 30;

export function makeSceneLoop(Component: ComponentType<any>) {
  return function SceneLoop(props: Record<string, unknown>) {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const ref = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => seekSvg(ref.current, frame / fps), [frame, fps]);
    return (
      <AbsoluteFill>
        <div ref={ref} style={{ width: '100%', height: '100%' }}>
          <Component {...props} />
        </div>
      </AbsoluteFill>
    );
  };
}
