// Remotion root. scripts/lib/remotion.ts generates an entry file that imports
// every video asset and calls registerRoot(makeRoot([...])).
import { useEffect, useState, type ComponentType } from 'react';
import { Composition, continueRender, delayRender } from 'remotion';
import { resolveParams, type AssetModule } from '@/lib/types';

/** Holds rendering until web fonts used by the composition have loaded. */
function withFonts(Comp: ComponentType<any>) {
  return function FontGate(props: Record<string, unknown>) {
    const [handle] = useState(() => delayRender('fonts'));
    useEffect(() => {
      document.fonts.ready.then(() => continueRender(handle));
    }, [handle]);
    return <Comp {...props} />;
  };
}

export const compositionId = (id: string) => id.replace(/\//g, '-');

export function makeRoot(assets: { id: string; mod: AssetModule }[]) {
  return function Root() {
    return (
      <>
        {assets.map(({ id, mod }) => (
          <Composition
            key={id}
            id={compositionId(id)}
            component={withFonts(mod.default)}
            defaultProps={resolveParams(mod)}
            width={mod.video!.width}
            height={mod.video!.height}
            fps={mod.video!.fps}
            durationInFrames={mod.video!.durationInFrames}
          />
        ))}
      </>
    );
  };
}
