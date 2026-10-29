import { useEffect, useState } from 'react';
import { loadAsset } from '@/lib/registry';
import type { AssetModule } from '@/lib/types';

/** Load an asset module; with `enabled = false` it waits (lazy cards). */
export function useAsset(id: string, enabled = true) {
  const [mod, setMod] = useState<AssetModule | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    loadAsset(id).then(
      (m) => live && setMod(m),
      (e) => live && setError(String(e)),
    );
    return () => {
      live = false;
    };
  }, [id, enabled]);
  return { mod, error };
}
