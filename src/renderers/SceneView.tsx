// Animated SVG scenes play their SMIL animations live. For deterministic
// output (stills, video frames) we pause the SVG's timeline and seek it.
import { useLayoutEffect, useRef, type ComponentType, type Ref } from 'react';

export function seekSvg(root: Element | null, time?: number, paused?: boolean) {
  const svg = root?.querySelector('svg');
  if (!svg) return;
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  if (time !== undefined) {
    svg.pauseAnimations();
    svg.setCurrentTime(time);
  } else if (paused) svg.pauseAnimations();
  else svg.unpauseAnimations();
}

export function SceneView({
  Component,
  params,
  time,
  paused,
  nodeRef,
}: {
  Component: ComponentType<any>;
  params: Record<string, unknown>;
  /** Seek to this time (seconds) and hold. */
  time?: number;
  paused?: boolean;
  nodeRef?: Ref<HTMLDivElement>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => seekSvg(ref.current, time, paused));
  return (
    <div ref={ref} className="scene-view" style={{ width: '100%', height: '100%' }}>
      <div ref={nodeRef} style={{ width: '100%', height: '100%' }}>
        <Component {...params} />
      </div>
    </div>
  );
}
