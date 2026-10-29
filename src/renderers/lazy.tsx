// Heavy renderers (three.js, Remotion) load only when a preview needs them,
// so the gallery shell stays light.
import { lazy } from 'react';

export const LazyScene3D = lazy(() => import('./Scene3D').then((m) => ({ default: m.Scene3D })));
export const LazyPlayer = lazy(() => import('@remotion/player').then((m) => ({ default: m.Player })));
export const LazyThumbnail = lazy(() => import('@remotion/player').then((m) => ({ default: m.Thumbnail })));
export const loadOffscreen3d = () => import('./offscreen3d');
