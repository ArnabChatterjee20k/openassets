// Renders every asset variant of a drop.
//
//   pnpm render                       # latest drop
//   pnpm render --drop 2026-10-29
//   pnpm render --kinds icon,banner   # subset of kinds
//   pnpm render --no-video            # skip slow video renders
//
// Full-resolution files go to out/<date>/... (zipped into a GitHub Release by CI).
// Small previews used by the site go to public/previews/<date>/... (committed).
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Resvg } from '@resvg/resvg-js';
import type { Browser } from 'playwright';
import { BANNER_SIZES, CARD3D_SIZE, resolveParams, variantNames, type Kind } from '../src/lib/types';
import { ANGLES } from '../src/renderers/angles';
import { ROOT, argValue, fail, hasFlag, latestDrop, launchBrowser, loadAssets, log, renderUrl, startSite, type LoadedAsset } from './lib/common';
import { bundleVideos, renderPoster, renderVideo } from './lib/remotion';

const date = argValue('drop') ?? latestDrop() ?? fail('no drops found');
const kinds = ((argValue('kinds')?.split(',') as Kind[]) ?? ['icon', 'icon3d', 'card3d', 'banner', 'video', 'scene']).filter(
  (k) => !(k === 'video' && hasFlag('no-video')),
);

const OUT = path.join(ROOT, 'out'); // asset ids already start with the date
// Local batch renders only; the site renders previews live, so nothing goes in public/.
const PREVIEWS = path.join(ROOT, 'out', 'previews');
const ICON_PNG_SIZES = [32, 64, 128, 256, 512];

const write = (file: string, data: string | Buffer) => {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, data);
};

const assets = (await loadAssets(date)).filter((a) => kinds.includes(a.kind));
log(`Rendering ${assets.length} assets from ${date} (${kinds.join(', ')})`);
const t0 = Date.now();

// ---- Icons: pure Node -------------------------------------------------------
for (const a of assets.filter((a) => a.kind === 'icon')) {
  for (const v of variantNames(a.mod)) {
    const svg = renderToStaticMarkup(createElement(a.mod.default, resolveParams(a.mod, v)));
    const dir = path.join(OUT, a.id, v);
    write(path.join(dir, `${a.slug}.svg`), svg);
    for (const px of ICON_PNG_SIZES) {
      const png = new Resvg(svg, { fitTo: { mode: 'width', value: px } }).render().asPng();
      write(path.join(dir, `${a.slug}-${px}.png`), png);
    }
  }
  log(`  ✓ ${a.id}`);
}

// ---- Banners & 3D: headless browser ----------------------------------------
const browserAssets = assets.filter((a) => a.kind === 'banner' || a.kind === 'icon3d' || a.kind === 'card3d' || a.kind === 'scene');
if (browserAssets.length) {
  const { server, url } = await startSite();
  const browser = await launchBrowser();
  try {
    for (const a of browserAssets) {
      if (a.kind === 'banner') await renderBanner(browser, url, a);
      else if (a.kind === 'scene') await renderScene(browser, url, a);
      else if (a.kind === 'card3d') await renderCard(browser, url, a);
      else await render3D(browser, url, a);
      log(`  ✓ ${a.id}`);
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

async function shoot(browser: Browser, url: string, size: { width: number; height: number }, scale = 1) {
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: scale });
  await page.goto(url);
  await page.waitForSelector('body[data-ready="1"]', { timeout: 60_000 });
  return page;
}

async function renderBanner(browser: Browser, url: string, a: LoadedAsset) {
  for (const v of variantNames(a.mod)) {
    for (const [sizeName, size] of Object.entries(BANNER_SIZES)) {
      const page = await shoot(browser, renderUrl(url, a.id, { variant: v, size: sizeName }), size);
      write(path.join(OUT, a.id, v, `${a.slug}-${sizeName}.png`), await page.locator('#target').screenshot());
      await page.close();
    }
    // Preview: OG size at half resolution.
    const page = await shoot(browser, renderUrl(url, a.id, { variant: v, size: 'og' }), BANNER_SIZES.og, 0.5);
    write(path.join(PREVIEWS, a.id, `${v}.png`), await page.locator('#target').screenshot());
    await page.close();
  }
}

async function renderCard(browser: Browser, url: string, a: LoadedAsset) {
  for (const v of variantNames(a.mod)) {
    const page = await shoot(browser, renderUrl(url, a.id, { variant: v, t: '0' }), CARD3D_SIZE, 2);
    write(path.join(OUT, a.id, v, `${a.slug}.png`), await page.locator('#target').screenshot());
    await page.close();
  }
}

async function renderScene(browser: Browser, url: string, a: LoadedAsset) {
  const sc = a.mod.scene!;
  for (const v of variantNames(a.mod)) {
    // The animated SVG itself: plays anywhere (SMIL), sized to the scene.
    const markup = renderToStaticMarkup(createElement(a.mod.default, resolveParams(a.mod, v)));
    write(path.join(OUT, a.id, v, `${a.slug}.svg`), markup.replace('<svg', `<svg width="${sc.width}" height="${sc.height}"`));
    // Poster: the resting composition at t = 0.
    const page = await shoot(browser, renderUrl(url, a.id, { variant: v, t: '0' }), { width: sc.width, height: sc.height });
    write(path.join(OUT, a.id, v, `${a.slug}.png`), await page.locator('#target').screenshot());
    await page.close();
    const small = await shoot(browser, renderUrl(url, a.id, { variant: v, t: '0' }), { width: sc.width, height: sc.height }, 0.5);
    write(path.join(PREVIEWS, a.id, `${v}.png`), await small.locator('#target').screenshot());
    await small.close();
  }
}

async function render3D(browser: Browser, url: string, a: LoadedAsset) {
  const px = 1024;
  for (const v of variantNames(a.mod)) {
    for (const angle of Object.keys(ANGLES)) {
      const page = await shoot(browser, renderUrl(url, a.id, { variant: v, size: String(px), angle }), { width: px, height: px });
      const png = await page.locator('#target').screenshot({ omitBackground: true });
      write(path.join(OUT, a.id, v, `${a.slug}-${angle}.png`), png);
      if (angle === 'iso') {
        const glb = await page.evaluate(() => window.__exportGLB!());
        write(path.join(OUT, a.id, v, `${a.slug}.glb`), Buffer.from(glb, 'base64'));
      }
      await page.close();
    }
    const page = await shoot(browser, renderUrl(url, a.id, { variant: v, size: '512', angle: 'iso' }), { width: 512, height: 512 });
    write(path.join(PREVIEWS, a.id, `${v}.png`), await page.locator('#target').screenshot({ omitBackground: true }));
    await page.close();
  }
}

// ---- Videos: Remotion -------------------------------------------------------
const videos = assets.filter((a) => a.kind === 'video');
const loops = assets.filter((a) => a.kind === 'icon3d' && !hasFlag('no-video'));
const scenes = assets.filter((a) => a.kind === 'scene' && !hasFlag('no-video'));
if (videos.length || loops.length || scenes.length) {
  log('  bundling Remotion…');
  const serveUrl = await bundleVideos([...videos, ...loops, ...scenes]);
  // Scenes: the default variant's loop as MP4 + hover GIF.
  for (const a of scenes) {
    const props = resolveParams(a.mod);
    await renderVideo({ serveUrl, id: a.id, props, out: path.join(OUT, a.id, 'default', `${a.slug}-loop.mp4`) });
    await renderVideo({ serveUrl, id: a.id, props, out: path.join(PREVIEWS, a.id, 'default.gif'), codec: 'gif', scale: 400 / a.mod.scene!.width, everyNthFrame: 2 });
    log(`  ✓ ${a.id} loop`);
  }
  // 3D icons: the default variant's micro-interaction loop (seamless, 4 s).
  for (const a of loops) {
    const props = resolveParams(a.mod);
    const dir = path.join(OUT, a.id, 'default');
    await renderVideo({ serveUrl, id: a.id, loop: true, props: { ...props, __background: '#F2F3F1' }, out: path.join(dir, `${a.slug}-loop.mp4`) });
    await renderVideo({ serveUrl, id: a.id, loop: true, props, out: path.join(dir, `${a.slug}-loop.webm`), codec: 'vp8', transparent: true });
    await renderVideo({ serveUrl, id: a.id, loop: true, props: { ...props, __background: '#F2F3F1' }, out: path.join(PREVIEWS, a.id, 'default.gif'), codec: 'gif', scale: 280 / 1080, everyNthFrame: 3 });
    log(`  ✓ ${a.id} loop`);
  }
  for (const a of videos) {
    for (const v of variantNames(a.mod)) {
      const props = resolveParams(a.mod, v);
      await renderVideo({ serveUrl, id: a.id, props, out: path.join(OUT, a.id, v, `${a.slug}.mp4`) });
      await renderPoster({ serveUrl, id: a.id, props, out: path.join(PREVIEWS, a.id, `${v}.png`) });
      await renderVideo({
        serveUrl,
        id: a.id,
        props,
        out: path.join(PREVIEWS, a.id, `${v}.gif`),
        codec: 'gif',
        scale: 320 / a.mod.video!.width,
        everyNthFrame: 3,
      });
    }
    log(`  ✓ ${a.id}`);
  }
}

log(`\n✓ Rendered ${date} in ${((Date.now() - t0) / 1000).toFixed(1)}s → out/${date}, public/previews/${date}`);
