// Client-side video encoding: draw frames onto a canvas, encode with WebCodecs
// (via Mediabunny), get a Blob. MP4/H.264 when the browser can, else WebM.
import { BufferTarget, CanvasSource, Mp4OutputFormat, Output, QUALITY_HIGH, WebMOutputFormat, canEncodeVideo } from 'mediabunny';

export interface EncodeOptions {
  width: number;
  height: number;
  fps: number;
  frames: number;
  /** Draw frame `i` onto `canvas` (may be async, e.g. image decode or WebGL render). */
  draw: (i: number, canvas: HTMLCanvasElement) => Promise<void> | void;
  onProgress?: (p: number) => void;
}

export async function encodeFrames({ width, height, fps, frames, draw, onProgress }: EncodeOptions): Promise<{ blob: Blob; ext: 'mp4' | 'webm' }> {
  // Even dimensions keep every codec happy.
  const w = width - (width % 2);
  const h = height - (height % 2);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const mp4 = await canEncodeVideo('avc', { width: w, height: h });
  const codec = mp4 ? 'avc' : (await canEncodeVideo('vp9', { width: w, height: h })) ? 'vp9' : 'vp8';
  const target = new BufferTarget();
  const output = new Output({ format: mp4 ? new Mp4OutputFormat() : new WebMOutputFormat(), target });
  const source = new CanvasSource(canvas, { codec, bitrate: QUALITY_HIGH });
  output.addVideoTrack(source, { frameRate: fps });
  await output.start();

  for (let i = 0; i < frames; i++) {
    await draw(i, canvas);
    await source.add(i / fps, 1 / fps);
    onProgress?.((i + 1) / frames);
  }
  await output.finalize();
  const ext = mp4 ? 'mp4' : 'webm';
  return { blob: new Blob([target.buffer!], { type: mp4 ? 'video/mp4' : 'video/webm' }), ext };
}
