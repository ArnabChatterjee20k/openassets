// Review loop: render stills of an asset (or a whole drop) and tile them into
// a labelled contact sheet you can open and critique.
//
//   pnpm stills <date>/<kind>/<slug> [--frames 0,30,90] [--variant name]
//   pnpm stills --drop 2026-10-29
//
// Output: review/<id>/sheet.png (+ individual frames). Videos default to 8
// evenly spaced frames of the given variant; other kinds show every variant.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';
import { renderStill, selectComposition } from '@remotion/renderer';
import type { Browser } from 'playwright';
import { BANNER_SIZES, resolveParams, variantNames } from '../src/lib/types';
import { compositionId } from '../src/remotion/Root';
import { ROOT, argValue, fail, launchBrowser, loadAssets, log, renderUrl, startSite, type LoadedAsset } from './lib/common';
import { bundleVideos } from './lib/remotion';

interface Tile {
  file: string;
  label: string;
}

const REVIEW = path.join(ROOT, 'review');
const target = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : undefined;
const drop = argValue('drop') ?? target?.split('/')[0] ?? fail('usage: pnpm stills <date>/<kind>/<slug> | --drop <date>');
const assets = (await loadAssets(drop)).filter((a) => !target || a.id === target);
if (!assets.length) fail(`no assets match ${target ?? drop}`);

let site: Awaited<ReturnType<typeof startSite>> | undefined;
let browser: Browser | undefined;
const getBrowser = async () => (browser ??= await launchBrowser());
const getSite = async () => (site ??= await startSite());

const sheets: string[] = [];
try {
  const videos = assets.filter((a) => a.kind === 'video');
  const serveUrl = videos.length ? await bundleVideos(videos) : '';
  for (const a of assets) {
    const dir = path.join(REVIEW, a.id);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const tiles = a.kind === 'video' ? await videoStills(a, dir, serveUrl) : a.kind === 'icon' ? iconStills(a, dir) : await browserStills(a, dir);
    const sheet = path.join(dir, 'sheet.png');
    await contactSheet(tiles, sheet, `${a.mod.meta.name} — ${a.id}`, a.kind === 'icon' ? 6 : a.kind === 'video' && a.mod.video!.height > a.mod.video!.width ? 4 : 3);
    sheets.push(path.relative(ROOT, sheet));
    log(`  ✓ ${a.id}`);
  }
  // Icons are a set: one sheet with every icon side by side shows whether they cohere.
  const icons = assets.filter((a) => a.kind === 'icon');
  if (icons.length > 1) {
    const tiles = icons.flatMap((a) =>
      ['default', 'filled' in a.mod.variants ? 'filled' : 'default'].flatMap((v, k) =>
        k === 1 && v === 'default' ? [] : [256, 24].map((px) => ({ file: path.join(REVIEW, a.id, `${v}-${px}.png`), label: `${a.slug} · ${v} · ${px}px` })),
      ),
    );
    const sheet = path.join(REVIEW, drop, 'icon-set.png');
    await contactSheet(tiles, sheet, `Icon set — ${drop}`, 8);
    sheets.push(path.relative(ROOT, sheet));
  }
} finally {
  await browser?.close();
  await site?.server.close();
}
log(`\nContact sheets (open these and critique them):\n${sheets.map((s) => `  ${s}`).join('\n')}`);

async function videoStills(a: LoadedAsset, dir: string, serveUrl: string): Promise<Tile[]> {
  const v = a.mod.video!;
  const variant = argValue('variant') ?? 'default';
  const frames = argValue('frames')?.split(',').map(Number) ?? Array.from({ length: 8 }, (_, i) => Math.round((i / 7) * (v.durationInFrames - 1)));
  const props = resolveParams(a.mod, variant);
  const composition = await selectComposition({ serveUrl, id: compositionId(a.id), inputProps: props });
  const tiles: Tile[] = [];
  for (const f of frames) {
    const file = path.join(dir, `${variant}-${String(f).padStart(4, '0')}.png`);
    await renderStill({ serveUrl, composition, frame: f, output: file, inputProps: props, scale: 0.5, overwrite: true });
    tiles.push({ file, label: `${variant} · f${f} · ${(f / v.fps).toFixed(2)}s` });
  }
  return tiles;
}

function iconStills(a: LoadedAsset, dir: string): Tile[] {
  const tiles: Tile[] = [];
  for (const v of variantNames(a.mod)) {
    const svg = renderToStaticMarkup(createElement(a.mod.default, resolveParams(a.mod, v)));
    for (const px of [256, 24]) {
      const file = path.join(dir, `${v}-${px}.png`);
      // 24px is upscaled 8x with nearest-neighbour so legibility at real size is visible.
      const png = new Resvg(svg, { fitTo: { mode: 'width', value: px }, background: '#ffffff' }).render().asPng();
      writeFileSync(file, png);
      tiles.push({ file, label: `${v} · ${px}px` });
    }
  }
  return tiles;
}

async function browserStills(a: LoadedAsset, dir: string): Promise<Tile[]> {
  const b = await getBrowser();
  const { url } = await getSite();
  const shots: { variant: string; q: Record<string, string>; vp: { width: number; height: number }; label: string }[] = [];
  for (const v of variantNames(a.mod)) {
    if (a.kind === 'banner') {
      for (const s of v === 'default' ? Object.keys(BANNER_SIZES) : ['og']) {
        shots.push({ variant: v, q: { variant: v, size: s }, vp: BANNER_SIZES[s], label: `${v} · ${s}` });
      }
    } else {
      for (const angle of v === 'default' ? ['front', 'iso', 'side'] : ['iso']) {
        shots.push({ variant: v, q: { variant: v, size: '512', angle }, vp: { width: 512, height: 512 }, label: `${v} · ${angle}` });
      }
    }
  }
  const tiles: Tile[] = [];
  for (const [i, s] of shots.entries()) {
    const page = await b.newPage({ viewport: s.vp, deviceScaleFactor: a.kind === 'banner' ? 0.5 : 1 });
    await page.goto(renderUrl(url, a.id, s.q));
    await page.waitForSelector('body[data-ready="1"]', { timeout: 60_000 });
    const file = path.join(dir, `${String(i).padStart(2, '0')}.png`);
    await page.locator('#target').screenshot({ path: file });
    await page.close();
    tiles.push({ file, label: s.label });
  }
  return tiles;
}

/** Tile images into one PNG with labels, using the browser as the compositor. */
async function contactSheet(tiles: Tile[], out: string, title: string, cols: number) {
  const b = await getBrowser();
  const cells = tiles
    .map((t) => {
      const data = readFileSync(t.file).toString('base64');
      return `<figure><img style="image-rendering:${t.label.endsWith(' 24px') ? 'pixelated' : 'auto'}" src="data:image/png;base64,${data}"><figcaption>${t.label}</figcaption></figure>`;
    })
    .join('');
  const html = `<!doctype html><html><body style="margin:0;background:#2b2b30;font:14px system-ui;color:#ddd">
    <div style="padding:12px 16px;font-weight:600">${title}</div>
    <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;padding:0 16px 16px">${cells}</div>
    <style>figure{margin:0;background:repeating-conic-gradient(#3a3a40 0 25%,#333338 0 50%) 0 0/16px 16px}
    img{display:block;width:100%}
    figcaption{padding:4px 6px;background:#1e1e22;font-size:12px}</style></body></html>`;
  const page = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await page.setContent(html);
  await page.waitForLoadState('load');
  await page.screenshot({ path: out, fullPage: true });
  await page.close();
}
