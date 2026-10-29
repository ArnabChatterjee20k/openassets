// Browser-side export helpers for the editor.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { toPng } from 'html-to-image';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import type { Scene } from 'three';
import type { AssetModule } from '@/lib/types';

export function download(data: Blob | string, filename: string) {
  const url = typeof data === 'string' ? data : URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  if (typeof data !== 'string') setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Static SVG markup for an icon, with explicit pixel size. */
export function iconSvg(mod: AssetModule, params: Record<string, unknown>, size = 24): string {
  const markup = renderToStaticMarkup(createElement(mod.default, params));
  return markup.replace('<svg', `<svg width="${size}" height="${size}"`);
}

export async function svgToPng(svg: string, size: number): Promise<Blob> {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  canvas.getContext('2d')!.drawImage(img, 0, 0, size, size);
  return new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png'));
}

export const nodeToPng = (node: HTMLElement) => toPng(node, { pixelRatio: 1, cacheBust: true });

export function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res) => canvas.toBlob((b) => res(b!), 'image/png'));
}

export async function sceneToGlb(scene: Scene): Promise<ArrayBuffer> {
  const exporter = new GLTFExporter();
  const target = scene.getObjectByName('asset') ?? scene;
  const result = await exporter.parseAsync(target, { binary: true, onlyVisible: true });
  return result as ArrayBuffer;
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
