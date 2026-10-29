import fg from 'fast-glob';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createServer, type ViteDevServer } from 'vite';
import { chromium, type Browser } from 'playwright';
import { parseAssetPath, type AssetModule, type AssetRef, type DropInfo } from '../../src/lib/types';

export const ROOT = path.resolve(import.meta.dirname, '../..');

export interface LoadedAsset extends AssetRef {
  file: string;
  mod: AssetModule;
}

export function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
export const hasFlag = (name: string) => process.argv.includes(`--${name}`);

export function listDrops(): string[] {
  return fg.sync('drops/*/drop.json', { cwd: ROOT }).map((f) => f.split('/')[1]).sort();
}

export const latestDrop = () => listDrops().at(-1);

export function readDrop(date: string): DropInfo {
  return JSON.parse(readFileSync(path.join(ROOT, 'drops', date, 'drop.json'), 'utf8'));
}

export function assetFiles(date?: string): { file: string; ref: AssetRef | null }[] {
  const pattern = date ? `drops/${date}/*/*/index.tsx` : 'drops/*/*/*/index.tsx';
  return fg.sync(pattern, { cwd: ROOT }).sort().map((file) => ({ file, ref: parseAssetPath(file) }));
}

export async function loadAssets(date?: string): Promise<LoadedAsset[]> {
  const out: LoadedAsset[] = [];
  for (const { file, ref } of assetFiles(date)) {
    if (!ref) throw new Error(`Bad asset path: ${file}`);
    const mod = (await import(pathToFileURL(path.join(ROOT, file)).href)) as AssetModule;
    out.push({ ...ref, file, mod });
  }
  return out;
}

/** Start the Vite dev server for the headless #/render page. */
export async function startSite(): Promise<{ server: ViteDevServer; url: string }> {
  const server = await createServer({ root: ROOT, logLevel: 'error', server: { port: 0, strictPort: false } });
  await server.listen();
  const url = server.resolvedUrls!.local[0];
  return { server, url };
}

export function launchBrowser(): Promise<Browser> {
  // SwiftShader gives deterministic software WebGL on GPU-less CI runners.
  const args = process.env.CI ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] : [];
  return chromium.launch({ args });
}

export const renderUrl = (base: string, id: string, q: Record<string, string>) =>
  `${base}#/render/${id}?${new URLSearchParams(q)}`;

export const log = (...a: unknown[]) => console.log(...a);
export const fail = (msg: string): never => {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
};
