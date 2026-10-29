// Remotion root. scripts/lib/remotion.ts generates an entry file that imports
// every video asset and calls registerRoot(makeRoot([...])).
import { useEffect, useState, type ComponentType } from 'react';
import { Composition, continueRender, delayRender } from 'remotion';
import { resolveParams, type AssetModule } from '@/lib/types';
import { LOOP_FPS, LOOP_FRAMES, LOOP_SIZE, makeLoop3D } from './Loop3D';

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

/** Composition id for a 3D icon's micro-interaction loop. */
export const loopCompositionId = (id: string) => `${compositionId(id)}-loop`;

export function makeRoot(assets: { id: string; mod: AssetModule }[]) {
  return function Root() {
    return (
      <>
        {assets.map(({ id, mod }) =>
          mod.meta.kind === 'icon3d' ? (
            <Composition
              key={id}
              id={loopCompositionId(id)}
              component={makeLoop3D(mod.default)}
              defaultProps={resolveParams(mod)}
              width={LOOP_SIZE}
              height={LOOP_SIZE}
              fps={LOOP_FPS}
              durationInFrames={LOOP_FRAMES}
            />
          ) : (
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
          ),
        )}
      </>
    );
  };
}
