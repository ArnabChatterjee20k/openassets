// 3D card downloads, rendered in the browser: the beam backdrop rasterised from
// its SVG, with the 3D object from the shared offscreen root composited on top.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BeamBackdrop, beamLight, type BeamParams } from '@/kit/beam';
import { CARD3D_SIZE, type AssetModule } from '@/lib/types';
import { drawSvg } from './bakeSvg';
import { CARD_CAMERA_Z } from './BeamCard';
import { render3dLoop, snapshot3d } from './offscreen3d';

const { width: W, height: H } = CARD3D_SIZE;

/** The backdrop as a canvas at `scale` × the card size. */
async function backdrop(p: BeamParams, scale: number) {
  const svg = renderToStaticMarkup(createElement(BeamBackdrop, { p, id: 'x' })).replace('<svg', `<svg width="${W}" height="${H}"`);
  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  await drawSvg(svg, canvas);
  return canvas;
}

export async function cardPng(mod: AssetModule, params: Record<string, unknown>, scale = 2): Promise<Blob> {
  const p = params as BeamParams;
  const canvas = await backdrop(p, scale);
  const size = H * scale;
  const url = await snapshot3d(`export-${mod.meta.name}-${JSON.stringify(params)}`, mod.default, params, { light: beamLight(p).color, cameraZ: CARD_CAMERA_Z }, size);
  const img = new Image();
  img.src = url;
  await img.decode();
  canvas.getContext('2d')!.drawImage(img, (canvas.width - size) / 2, 0, size, size);
  return new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png'));
}

export async function cardLoop(mod: AssetModule, params: Record<string, unknown>, onProgress?: (p: number) => void, scale = 2) {
  const p = params as BeamParams;
  const bg = await backdrop(p, scale);
  return render3dLoop(mod.default, params, {
    light: beamLight(p).color,
    cameraZ: CARD_CAMERA_Z,
    width: W * scale,
    height: H * scale,
    objectSize: H * scale,
    drawBackground: (ctx, w, h) => ctx.drawImage(bg, 0, 0, w, h),
    onProgress,
  });
}
