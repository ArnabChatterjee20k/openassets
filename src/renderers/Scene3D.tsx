import { useEffect, useRef, type ComponentType } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import type { Scene, WebGLRenderer } from 'three';
import { ANGLES, type Angle } from './angles';

export type { Angle };

export interface SceneHandle {
  gl: WebGLRenderer;
  scene: Scene;
}

/** Fires onReady after a few rendered frames, and exposes the renderer for exports. */
function Bridge({ onReady }: { onReady?: (h: SceneHandle) => void }) {
  const { gl, scene } = useThree();
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    frames.current += 1;
    if (!done.current && frames.current > 3) {
      done.current = true;
      onReady?.({ gl, scene });
    }
  });
  return null;
}

/** Studio lighting built from local Lightformers (no network HDRI fetch). */
function Studio() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} castShadow />
      <directionalLight position={[-4, -2, -3]} intensity={0.5} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 4]} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[6, 4, 1]} />
        <Lightformer form="ring" intensity={2} position={[4, 2, -3]} scale={3} />
        <Lightformer form="rect" intensity={1} position={[0, -4, 2]} rotation-x={Math.PI / 2} scale={[8, 4, 1]} />
      </Environment>
    </>
  );
}

export function Scene3D({
  Component,
  params,
  angle = 'iso',
  controls = false,
  onReady,
}: {
  Component: ComponentType<any>;
  params: Record<string, unknown>;
  angle?: Angle;
  controls?: boolean;
  onReady?: (h: SceneHandle) => void;
}) {
  // Keep a stable callback so re-renders don't retrigger readiness.
  const readyRef = useRef(onReady);
  useEffect(() => {
    readyRef.current = onReady;
  }, [onReady]);

  return (
    <Canvas
      gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
      camera={{ position: [0, 0, 5.4], fov: 35 }}
      dpr={[1, 2]}
      shadows
      style={{ width: '100%', height: '100%' }}
    >
      <Studio />
      <group rotation={ANGLES[angle] as unknown as [number, number, number]}>
        <Component {...params} />
      </group>
      {controls && <OrbitControls enablePan={false} minDistance={2.5} maxDistance={8} />}
      <Bridge onReady={(h) => readyRef.current?.(h)} />
    </Canvas>
  );
}
