// One shared, hidden react-three-fiber root for everything 3D that doesn't
// need to be interactive: gallery snapshots (rest pose) and loop video
// exports. Jobs run one at a time so we never hold more than one extra WebGL
// context, however many 3D cards are on the page.
import type { ComponentType } from 'react';
import * as THREE from 'three';
import { createRoot, extend, type ReconcilerRoot } from '@react-three/fiber';
import { LOOP_SECONDS, MotionProvider, defaultMotion, type MotionState } from '@/kit/motion3d';
import { Stage } from './Scene3D';
import { encodeFrames } from './encode';

// <Canvas> registers the THREE namespace itself; an imperative root must do it.
extend(THREE as unknown as Parameters<typeof extend>[0]);

const SIZE = 640;
let canvas: HTMLCanvasElement | null = null;
let root: ReconcilerRoot<HTMLCanvasElement> | null = null;
const motion: { current: MotionState } = { current: defaultMotion() };
let queue: Promise<unknown> = Promise.resolve();

const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/** Lighting/camera for a render: the neutral studio, or a 3D card's beam light. */
export interface StageOptions {
  light?: string;
  cameraZ?: number;
}

async function mount(Component: ComponentType<any>, params: Record<string, unknown>, size: number, stage: StageOptions = {}) {
  if (!canvas) {
    canvas = document.createElement('canvas');
    root = createRoot(canvas);
  }
  canvas.width = canvas.height = size;
  await root!.configure({
    size: { width: size, height: size, top: 0, left: 0 },
    dpr: 1,
    gl: { preserveDrawingBuffer: true, alpha: true, antialias: true },
    camera: { position: [0, 0, stage.cameraZ ?? 6], fov: 35 },
    frameloop: 'always',
  });
  root!.render(
    <MotionProvider value={motion}>
      <Stage Component={Component} params={params} angle="iso" light={stage.light} />
    </MotionProvider>,
  );
  // Let the environment map, geometry and shadows settle.
  for (let i = 0; i < 8; i++) await frame();
  return canvas;
}

/** Run jobs sequentially on the shared root. */
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const next = queue.then(job, job);
  queue = next.catch(() => undefined);
  return next;
}

const cache = new Map<string, string>();

/** PNG data URL of an asset's rest pose (t = 0), transparent. Cached per key. */
export function snapshot3d(key: string, Component: ComponentType<any>, params: Record<string, unknown>, stage: StageOptions = {}, size = SIZE): Promise<string> {
  const cacheKey = `${key}|${stage.light ?? ''}|${stage.cameraZ ?? ''}|${size}`;
  const hit = cache.get(cacheKey);
  if (hit) return Promise.resolve(hit);
  return enqueue(async () => {
    motion.current = { ...defaultMotion(), t: 0 };
    const c = await mount(Component, params, size, stage);
    await frame();
    const url = c.toDataURL('image/png');
    cache.set(cacheKey, url);
    return url;
  });
}

export interface LoopOptions extends StageOptions {
  /** Output size (defaults to a 1080 square). */
  width?: number;
  height?: number;
  /** Size of the square 3D render, centred in the output (defaults to the output height). */
  objectSize?: number;
  fps?: number;
  /** Paints each frame's background before the 3D layer (defaults to a flat light stage). */
  drawBackground?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  onProgress?: (p: number) => void;
}

/** Encode the micro-interaction loop (LOOP_SECONDS) to MP4/WebM in the browser. */
export function render3dLoop(Component: ComponentType<any>, params: Record<string, unknown>, opts: LoopOptions = {}) {
  const width = opts.width ?? 1080;
  const height = opts.height ?? 1080;
  const fps = opts.fps ?? 30;
  const objectSize = opts.objectSize ?? height;
  const background = opts.drawBackground ?? ((ctx, w, h) => {
    ctx.fillStyle = '#F2F3F1';
    ctx.fillRect(0, 0, w, h);
  });
  return enqueue(async () => {
    motion.current = { ...defaultMotion(), t: 0 };
    const c = await mount(Component, params, objectSize, opts);
    return encodeFrames({
      width,
      height,
      fps,
      frames: LOOP_SECONDS * fps,
      onProgress: opts.onProgress,
      draw: async (i, out) => {
        motion.current.t = i / fps;
        await frame(); // useFrame callbacks apply the new time
        await frame();
        const ctx = out.getContext('2d')!;
        background(ctx, out.width, out.height);
        ctx.drawImage(c, (out.width - objectSize) / 2, (out.height - objectSize) / 2, objectSize, objectSize);
      },
    });
  });
}
