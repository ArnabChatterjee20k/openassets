// Validates drops: typecheck, static safety rules, schema/variant checks, and
// a headless browser smoke render of every asset variant.
//
//   pnpm validate                  # all drops
//   pnpm validate --drop 2026-10-29
//   pnpm validate --no-browser     # skip the Playwright smoke test
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import fg from 'fast-glob';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { z } from 'zod';
import { BANNER_SIZES, KIND_DIRS, VIDEO_CATEGORIES, resolveParams, variantNames } from '../src/lib/types';
import { ROOT, argValue, hasFlag, launchBrowser, listDrops, loadAssets, log, renderUrl, startSite } from './lib/common';

const drop = argValue('drop');
const errors: string[] = [];
const err = (where: string, msg: string) => errors.push(`${where}: ${msg}`);

// ---- 1. Typecheck ----------------------------------------------------------
log('→ typecheck');
try {
  execSync('pnpm -s tsc --noEmit', { cwd: ROOT, stdio: 'pipe' });
} catch (e: any) {
  err('tsc', `\n${e.stdout?.toString() ?? ''}${e.stderr?.toString() ?? ''}`);
}

// ---- 2. Static safety rules for generated code -----------------------------
// Generated code runs in visitors' browsers, so keep it self-contained.
log('→ static rules');
const ALLOWED_IMPORTS = [/^react$/, /^three$/, /^@react-three\/(fiber|drei)$/, /^remotion$/, /^zod$/, /^@\/lib\/(params|fonts|types)$/, /^@\/kit$/];
const BANNED: [RegExp, string][] = [
  [/\bfetch\s*\(/, 'fetch() is not allowed'],
  [/XMLHttpRequest|WebSocket|EventSource/, 'network APIs are not allowed'],
  [/\beval\s*\(|new\s+Function\s*\(/, 'eval/new Function is not allowed'],
  [/\bimport\s*\(/, 'dynamic import() is not allowed'],
  [/localStorage|sessionStorage|indexedDB|document\.cookie/, 'storage APIs are not allowed'],
  [/dangerouslySetInnerHTML/, 'dangerouslySetInnerHTML is not allowed'],
  [/https?:\/\/(?!www\.w3\.org\/)/, 'external URLs are not allowed (only the SVG xmlns)'],
];
const DropSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  theme: z.string().min(2),
  description: z.string().min(10),
  palette: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).min(3).max(8),
});

for (const date of drop ? [drop] : listDrops()) {
  try {
    const info = DropSchema.parse(JSON.parse(readFileSync(path.join(ROOT, 'drops', date, 'drop.json'), 'utf8')));
    if (info.date !== date) err(`drops/${date}/drop.json`, `date field "${info.date}" does not match folder`);
  } catch (e) {
    err(`drops/${date}/drop.json`, String(e));
  }
  for (const file of fg.sync(`drops/${date}/**/*`, { cwd: ROOT })) {
    if (file.endsWith('drop.json') || file === `drops/${date}/brief.md`) continue;
    if (!/\/index\.tsx$|\/[a-z0-9-]+\.tsx?$/.test(file)) {
      err(file, 'only .ts/.tsx files (plus drop.json and brief.md) are allowed inside a drop');
      continue;
    }
    const src = readFileSync(path.join(ROOT, file), 'utf8');
    for (const [re, msg] of BANNED) if (re.test(src)) err(file, msg);
    for (const m of src.matchAll(/^\s*import\s[^'"]*?['"]([^'"]+)['"]/gm)) {
      const spec = m[1];
      if (spec.startsWith('.')) continue; // relative helper files within the asset folder
      if (!ALLOWED_IMPORTS.some((re) => re.test(spec))) err(file, `import "${spec}" is not in the allowlist`);
    }
  }
}

// ---- 3. Module contract ----------------------------------------------------
log('→ module contract');
const assets = errors.some((e) => e.startsWith('tsc')) ? [] : await loadAssets(drop).catch((e) => (err('load', String(e)), []));
for (const a of assets) {
  const { mod } = a;
  const where = a.file;
  if (!mod.meta?.name) err(where, 'missing meta.name');
  if (mod.meta?.kind !== a.kind) err(where, `meta.kind "${mod.meta?.kind}" should be "${a.kind}" (folder ${KIND_DIRS[a.kind]})`);
  if (typeof mod.default !== 'function') err(where, 'default export must be a component');
  if (!(mod.schema instanceof z.ZodObject)) {
    err(where, 'schema must be a z.object');
    continue;
  }
  if (!mod.schema.safeParse({}).success) err(where, 'every schema field needs a .default()');
  const names = Object.keys(mod.variants ?? {});
  if (names.length < 2) err(where, 'export at least 2 variants');
  for (const v of names) {
    const r = mod.schema.safeParse(mod.variants[v]);
    if (!r.success) err(where, `variant "${v}" is invalid: ${r.error.issues.map((i) => `${i.path}: ${i.message}`).join('; ')}`);
  }
  if (a.kind === 'video') {
    if (!VIDEO_CATEGORIES.includes(mod.meta?.category as never)) err(where, `meta.category must be one of: ${VIDEO_CATEGORIES.join(', ')}`);
    const v = mod.video;
    if (!v || v.width < 100 || v.height < 100 || v.fps < 1 || v.durationInFrames < 1) err(where, 'video config {width,height,fps,durationInFrames} required');
    else if (v.durationInFrames / v.fps > 20) err(where, 'videos must be 20 seconds or shorter');
  }
  // Server-render the DOM kinds to catch runtime errors cheaply.
  if (a.kind === 'icon' || a.kind === 'banner') {
    for (const v of variantNames(mod)) {
      try {
        const html = renderToStaticMarkup(createElement(mod.default, { ...resolveParams(mod, v), ...BANNER_SIZES.og }));
        if (a.kind === 'icon' && !/^<svg[^>]*viewBox=/.test(html)) err(where, 'icon must render a root <svg> with a viewBox');
      } catch (e) {
        err(where, `variant "${v}" threw during render: ${e}`);
      }
    }
  }
}

// ---- 4. Browser smoke render -----------------------------------------------
if (!hasFlag('no-browser') && assets.length && !errors.length) {
  log('→ browser smoke render');
  const { server, url } = await startSite();
  const browser = await launchBrowser();
  try {
    for (const a of assets) {
      for (const v of variantNames(a.mod)) {
        const page = await browser.newPage({ viewport: { width: 1200, height: 1200 } });
        const pageErrors: string[] = [];
        page.on('pageerror', (e) => pageErrors.push(e.message));
        page.on('console', (m) => m.type() === 'error' && pageErrors.push(m.text()));
        const where = `${a.file} [${v}]`;
        try {
          await page.goto(renderUrl(url, a.id, { variant: v, size: a.kind === 'icon3d' || a.kind === 'icon' ? '512' : 'og' }));
          await page.waitForSelector('body[data-ready="1"]', { timeout: 45_000 });
          if (a.kind === 'icon3d') {
            const painted = await page.evaluate(() => {
              const c = document.querySelector('canvas')!;
              const tmp = document.createElement('canvas');
              tmp.width = tmp.height = 64;
              const ctx = tmp.getContext('2d')!;
              ctx.drawImage(c, 0, 0, 64, 64);
              const d = ctx.getImageData(0, 0, 64, 64).data;
              let n = 0;
              for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
              return n / (64 * 64);
            });
            if (painted < 0.02) err(where, `3D render looks empty (${(painted * 100).toFixed(1)}% pixels painted)`);
          }
        } catch (e) {
          err(where, `did not render: ${String(e).split('\n')[0]}`);
        }
        // Ignore noisy-but-harmless messages from libraries.
        const real = pageErrors.filter((m) => !/Download the React DevTools|THREE\.WebGLRenderer: Context Lost|GPU stall/.test(m));
        if (real.length) err(where, `runtime errors:\n    ${real.join('\n    ')}`);
        await page.close();
      }
      log(`  ✓ ${a.id}`);
    }
  } finally {
    await browser.close();
    await server.close();
  }
}

if (errors.length) {
  console.error(`\n✗ ${errors.length} problem(s):\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
log(`\n✓ ${assets.length} assets valid${drop ? ` in ${drop}` : ''}`);
