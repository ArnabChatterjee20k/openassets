import { useEffect, useRef, type ComponentType } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei';
import type { Scene, WebGLRenderer } from 'three';
import { LOOP_SECONDS, MotionProvider, defaultMotion, type MotionState } from '@/kit/motion3d';
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

export type MotionMode = 'default' | 'interaction';

/**
 * Advances the motion clock. In 'default' mode the icon rests at its pose for
 * t = 0 and only plays while hovered or for one loop after a click; when the
 * interaction ends it finishes the current loop (at 3x speed) and settles
 * exactly back on the rest pose. 'interaction' mode plays continuously.
 * A fixed `time` freezes motion for deterministic stills.
 */
function Driver({ motion, time, mode, hoverTarget }: { motion: { current: MotionState }; time?: number; mode: MotionMode; hoverTarget: { current: number } }) {
  const wall = useRef(0);
  const pressAt = useRef(-Infinity);
  useFrame((_, delta) => {
    const m = motion.current;
    wall.current += delta;
    if (m.pressAge === 0) pressAt.current = wall.current; // a click just happened
    m.pressAge = wall.current - pressAt.current;
    m.hover += (hoverTarget.current - m.hover) * Math.min(1, delta * 8);
    if (time !== undefined) {
      m.t = time;
      return;
    }
    const playing = mode === 'interaction' || hoverTarget.current > 0 || m.pressAge < LOOP_SECONDS;
    const phase = m.t % LOOP_SECONDS;
    if (playing) m.t += delta;
    else if (phase > 1e-4) {
      const next = m.t + delta * 3;
      m.t = Math.floor(next / LOOP_SECONDS) > Math.floor(m.t / LOOP_SECONDS) ? Math.floor(next / LOOP_SECONDS) * LOOP_SECONDS : next;
    }
  });
  return null;
}

export function Scene3D({
  Component,
  params,
  angle = 'iso',
  controls = false,
  interactive = false,
  mode = 'default',
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
  /** 'default': rest pose, animate on hover/click. 'interaction': loop continuously. */
  mode?: MotionMode;
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
        camera={{ position: [0, 0, 6], fov: 35 }}
        dpr={[1, 2]}
        shadows
        style={{ width: '100%', height: '100%' }}
      >
        <MotionProvider value={motion}>
          <Driver motion={motion} time={time} mode={mode} hoverTarget={hoverTarget} />
          <Stage Component={Component} params={params} angle={angle} />
        </MotionProvider>
        {controls && <OrbitControls enablePan={false} enableZoom={false} minDistance={2.5} maxDistance={8} />}
        <Bridge onReady={(h) => readyRef.current?.(h)} />
      </Canvas>
    </div>
  );
}
