import { useEffect, useState } from 'react';
import { loadAsset } from '@/lib/registry';
import type { AssetModule } from '@/lib/types';

export function useAsset(id: string) {
  const [mod, setMod] = useState<AssetModule | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    loadAsset(id).then(
      (m) => live && setMod(m),
      (e) => live && setError(String(e)),
    );
    return () => {
      live = false;
    };
  }, [id]);
  return { mod, error };
}
