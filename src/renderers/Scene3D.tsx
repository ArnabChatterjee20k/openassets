import { useEffect, useRef, type ComponentType } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import type { Scene, WebGLRenderer } from 'three';
import { MotionProvider, defaultMotion, type MotionState } from '@/kit/motion3d';
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

/**
 * Lights + asset + contact shadow. Shared by the live <Canvas> and Remotion's
 * <ThreeCanvas> (loop exports) so both render identically.
 */
export function Stage({ Component, params, angle = 'iso' }: { Component: ComponentType<any>; params: Record<string, unknown>; angle?: Angle }) {
  return (
    <>
      <Studio />
      {/* Named so exports can take just the asset, not the shadow plane. */}
      <group name="asset" rotation={ANGLES[angle] as unknown as [number, number, number]}>
        <Component {...params} />
      </group>
      <ContactShadows position={[0, -1.35, 0]} opacity={0.32} scale={6} blur={2.6} far={3} resolution={512} />
    </>
  );
}

/** Advances the motion clock (real time, or a fixed `time`) and eases hover. */
function Driver({ motion, time, hoverTarget }: { motion: { current: MotionState }; time?: number; hoverTarget: { current: number } }) {
  const pressAt = useRef(-Infinity);
  useFrame((state, delta) => {
    const m = motion.current;
    const now = time ?? state.clock.elapsedTime;
    if (m.pressAge === 0) pressAt.current = now; // a click just happened
    m.t = now;
    m.pressAge = now - pressAt.current;
    m.hover += (hoverTarget.current - m.hover) * Math.min(1, delta * 8);
  });
  return null;
}

export function Scene3D({
  Component,
  params,
  angle = 'iso',
  controls = false,
  interactive = false,
  animate = true,
  time,
  onReady,
}: {
  Component: ComponentType<any>;
  params: Record<string, unknown>;
  angle?: Angle;
  /** Orbit controls (drag to rotate). */
  controls?: boolean;
  /** Hover tilt + click bounce. */
  interactive?: boolean;
  /** Idle micro-animations on/off. */
  animate?: boolean;
  /** Fixed time in seconds (deterministic stills); omit for real time. */
  time?: number;
  onReady?: (h: SceneHandle) => void;
}) {
  // Keep a stable callback so re-renders don't retrigger readiness.
  const readyRef = useRef(onReady);
  useEffect(() => {
    readyRef.current = onReady;
  }, [onReady]);
  const motion = useRef<MotionState>(defaultMotion());
  motion.current.enabled = animate;
  if (time !== undefined) motion.current.t = time;
  const hoverTarget = useRef(0);

  return (
    <div
      style={{ width: '100%', height: '100%' }}
      onPointerMove={(e) => {
        if (!interactive) return;
        const r = e.currentTarget.getBoundingClientRect();
        motion.current.px = ((e.clientX - r.left) / r.width) * 2 - 1;
        motion.current.py = -(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      onPointerEnter={() => {
        if (interactive) hoverTarget.current = 1;
      }}
      onPointerLeave={() => {
        hoverTarget.current = 0;
        motion.current.px = motion.current.py = 0;
      }}
      onPointerDown={() => {
        if (interactive) motion.current.pressAge = 0;
      }}
    >
      <Canvas
        gl={{ preserveDrawingBuffer: true, alpha: true, antialias: true }}
        camera={{ position: [0, 0, 5.4], fov: 35 }}
        dpr={[1, 2]}
        shadows
        style={{ width: '100%', height: '100%' }}
      >
        <MotionProvider value={motion}>
          <Driver motion={motion} time={time} hoverTarget={hoverTarget} />
          <Stage Component={Component} params={params} angle={angle} />
        </MotionProvider>
        {controls && <OrbitControls enablePan={false} enableZoom={false} minDistance={2.5} maxDistance={8} />}
        <Bridge onReady={(h) => readyRef.current?.(h)} />
      </Canvas>
    </div>
  );
}
