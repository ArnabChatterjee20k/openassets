// Browser-side asset index built from Vite globs. Asset modules load lazily;
// drop.json files are small and loaded eagerly.
import { parseAssetPath, type AssetModule, type AssetRef, type DropInfo } from './types';

const modules = import.meta.glob<AssetModule>('/drops/*/*/*/index.tsx');
const dropFiles = import.meta.glob<DropInfo>('/drops/*/drop.json', { eager: true, import: 'default' });

const refs: AssetRef[] = Object.keys(modules)
  .map(parseAssetPath)
  .filter((r): r is AssetRef => r !== null);

export const drops: DropInfo[] = Object.values(dropFiles).sort((a, b) => b.date.localeCompare(a.date));

export const assetsForDrop = (date: string) => refs.filter((r) => r.date === date);

export const findAsset = (id: string) => refs.find((r) => r.id === id);

const cache = new Map<string, Promise<AssetModule>>();
export function loadAsset(id: string): Promise<AssetModule> {
  if (!cache.has(id)) {
    const loader = modules[`/drops/${id}/index.tsx`];
    if (!loader) return Promise.reject(new Error(`Unknown asset ${id}`));
    cache.set(id, loader());
  }
  return cache.get(id)!;
}


/** Every asset across all drops, newest drop first. */
export const allAssets: AssetRef[] = [...refs].sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));

export const dropInfo = (date: string) => drops.find((d) => d.date === date);
