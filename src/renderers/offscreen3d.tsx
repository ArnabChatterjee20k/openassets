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

async function mount(Component: ComponentType<any>, params: Record<string, unknown>, size: number) {
  if (!canvas) {
    canvas = document.createElement('canvas');
    root = createRoot(canvas);
  }
  canvas.width = canvas.height = size;
  await root!.configure({
    size: { width: size, height: size, top: 0, left: 0 },
    dpr: 1,
    gl: { preserveDrawingBuffer: true, alpha: true, antialias: true },
    camera: { position: [0, 0, 6], fov: 35 },
    frameloop: 'always',
  });
  root!.render(
    <MotionProvider value={motion}>
      <Stage Component={Component} params={params} angle="iso" />
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

/** PNG data URL of an asset's rest pose (t = 0). Cached per key. */
export function snapshot3d(key: string, Component: ComponentType<any>, params: Record<string, unknown>): Promise<string> {
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);
  return enqueue(async () => {
    motion.current = { ...defaultMotion(), t: 0 };
    const c = await mount(Component, params, SIZE);
    await frame();
    const url = c.toDataURL('image/png');
    cache.set(key, url);
    return url;
  });
}

/** Encode the micro-interaction loop (LOOP_SECONDS) to MP4/WebM in the browser. */
export function render3dLoop(Component: ComponentType<any>, params: Record<string, unknown>, onProgress?: (p: number) => void, size = 1080, fps = 30, background = '#F2F3F1') {
  return enqueue(async () => {
    motion.current = { ...defaultMotion(), t: 0 };
    const c = await mount(Component, params, size);
    return encodeFrames({
      width: size,
      height: size,
      fps,
      frames: LOOP_SECONDS * fps,
      onProgress,
      draw: async (i, out) => {
        motion.current.t = i / fps;
        await frame(); // useFrame callbacks apply the new time
        await frame();
        const ctx = out.getContext('2d')!;
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(c, 0, 0, out.width, out.height);
      },
    });
  });
}
