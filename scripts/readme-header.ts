// Render a banner asset to the README header image. GitHub can't run the
// site's in-browser renderer, so this is the one committed rendered file.
//
//   pnpm readme-header 2026-10-31/banners/readme-header [--variant name] [--size og]
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { BANNER_SIZES } from '../src/lib/types';
import { ROOT, argValue, fail, launchBrowser, loadAssets, log, renderUrl, startSite } from './lib/common';

const id = process.argv[2];
if (!id || id.startsWith('--')) fail('usage: pnpm readme-header <date>/banners/<slug> [--variant name] [--size og]');
const asset = (await loadAssets(id.split('/')[0])).find((a) => a.id === id) ?? fail(`unknown asset ${id}`);
if (asset.kind !== 'banner') fail(`${id} is not a banner`);

const sizeName = argValue('size') ?? 'og';
const size = BANNER_SIZES[sizeName] ?? fail(`unknown size ${sizeName}`);
const out = path.join(ROOT, '.github', 'assets', 'header.png');
mkdirSync(path.dirname(out), { recursive: true });

const { server, url } = await startSite();
const browser = await launchBrowser();
try {
  // 2x for crisp text on high-DPI screens; GitHub scales it to the column width.
  const page = await browser.newPage({ viewport: size, deviceScaleFactor: 2 });
  await page.goto(renderUrl(url, id, { variant: argValue('variant') ?? 'default', size: sizeName }));
  await page.waitForSelector('body[data-ready="1"]', { timeout: 60_000 });
  await page.locator('#target').screenshot({ path: out });
  log(`✓ ${path.relative(ROOT, out)} (${size.width * 2}×${size.height * 2})`);
} finally {
  await browser.close();
  await server.close();
}
