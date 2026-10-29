// A 3D icon's idle micro-interaction loop as a Remotion composition, so it can
// be exported as MP4 / transparent WebM / GIF. Motion time = frame / fps.
import { useRef, type ComponentType } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { LOOP_SECONDS, MotionProvider, defaultMotion, type MotionState } from '@/kit/motion3d';
import { Stage } from '@/renderers/Scene3D';

export const LOOP_FPS = 60;
export const LOOP_FRAMES = LOOP_SECONDS * LOOP_FPS;
export const LOOP_SIZE = 1080;

export function makeLoop3D(Component: ComponentType<any>) {
  return function Loop3D({ __background, ...params }: Record<string, unknown> & { __background?: string }) {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();
    const motion = useRef<MotionState>(defaultMotion());
    motion.current.t = frame / fps;
    return (
      <AbsoluteFill style={{ background: __background ?? 'transparent' }}>
        <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 6], fov: 35 }} gl={{ alpha: true, antialias: true }}>
          <MotionProvider value={motion}>
            <Stage Component={Component} params={params} angle="iso" />
          </MotionProvider>
        </ThreeCanvas>
      </AbsoluteFill>
    );
  };
}
