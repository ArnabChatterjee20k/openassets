// Animated scenes → MP4/WebM in the browser: mount the scene off-screen, bake
// each frame of its SMIL timeline to a static SVG, rasterise, encode.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { AssetModule } from '@/lib/types';
import { bakeSvgAt, drawSvg } from './bakeSvg';
import { encodeFrames } from './encode';

/** Mount the scene off-screen; the SVG must be in the document for computed styles and CTMs. */
function mountScene(mod: AssetModule, params: Record<string, unknown>) {
  const sc = mod.scene!;
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-99999px;top:0;width:${sc.width}px;height:${sc.height}px;`;
  host.innerHTML = renderToStaticMarkup(createElement(mod.default, params));
  document.body.appendChild(host);
  const svg = host.querySelector('svg')!;
  svg.setAttribute('width', String(sc.width));
  svg.setAttribute('height', String(sc.height));
  return { host, svg, sc };
}

/** One frame of the scene at time t, as a PNG blob at `scale` × the scene size. */
export async function sceneFrame(mod: AssetModule, params: Record<string, unknown>, t: number, scale = 2): Promise<Blob> {
  const { host, svg, sc } = mountScene(mod, params);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = sc.width * scale;
    canvas.height = sc.height * scale;
    await drawSvg(bakeSvgAt(svg, t, sc), canvas);
    return await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png'));
  } finally {
    host.remove();
  }
}

export async function renderSceneLoop(mod: AssetModule, params: Record<string, unknown>, onProgress?: (p: number) => void, fps = 30) {
  const { host, svg, sc } = mountScene(mod, params);
  try {
    return await encodeFrames({
      width: sc.width,
      height: sc.height,
      fps,
      frames: Math.round(sc.loop * fps),
      onProgress,
      draw: (i, canvas) => drawSvg(bakeSvgAt(svg, i / fps, sc), canvas),
    });
  } finally {
    host.remove();
  }
}
