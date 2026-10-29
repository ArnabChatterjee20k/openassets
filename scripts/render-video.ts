// Render one video template with custom props (e.g. exported from the editor).
//
//   pnpm render:video 2026-10-29/videos/birthday-wish --props birthday-wish.props.json [--out my.mp4]
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { resolveParams } from '../src/lib/types';
import { ROOT, argValue, fail, loadAssets, log } from './lib/common';
import { bundleVideos, renderVideo } from './lib/remotion';

const id = process.argv[2];
if (!id || id.startsWith('--')) fail('usage: pnpm render:video <date>/videos/<slug> [--props file.json] [--out file.mp4]');

const asset = (await loadAssets(id.split('/')[0])).find((a) => a.id === id) ?? fail(`unknown asset ${id}`);
if (asset.kind !== 'video') fail(`${id} is not a video template`);

const propsFile = argValue('props');
const overrides = propsFile ? JSON.parse(readFileSync(propsFile, 'utf8')) : {};
const parsed = asset.mod.schema.safeParse({ ...resolveParams(asset.mod), ...overrides });
if (!parsed.success) fail(`invalid props: ${parsed.error.issues.map((i) => `${i.path}: ${i.message}`).join('; ')}`);

const out = path.resolve(argValue('out') ?? path.join(ROOT, 'out', 'custom', `${asset.slug}.mp4`));
log(`Bundling and rendering ${id}…`);
await renderVideo({ serveUrl: await bundleVideos([asset]), id, props: parsed.data, out });
log(`✓ ${out}`);
