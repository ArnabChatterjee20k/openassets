import type { ComponentType } from 'react';
import type { z } from 'zod';

export type Kind = 'icon' | 'icon3d' | 'banner' | 'video' | 'scene';

/** Directory name under drops/<date>/ for each kind. */
export const KIND_DIRS: Record<Kind, string> = {
  icon: 'icons',
  icon3d: 'icons3d',
  banner: 'banners',
  video: 'videos',
  scene: 'scenes',
};
export const DIR_KINDS = Object.fromEntries(Object.entries(KIND_DIRS).map(([k, d]) => [d, k])) as Record<string, Kind>;

export const KIND_LABELS: Record<Kind, string> = {
  icon: 'Icons',
  icon3d: '3D Icons',
  banner: 'Banners',
  video: 'Video Templates',
  scene: 'Scenes',
};

/** Occasions/use-cases for video templates. The daily drop rotates through these. */
export const VIDEO_CATEGORIES = [
  'launch',
  'tech',
  'greeting',
  'announcement',
  'countdown',
  'promo',
  'quote',
  'event',
  'thank-you',
  'milestone',
  'intro',
  'lower-third',
] as const;
export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];

export interface AssetMeta {
  kind: Kind;
  name: string;
  /** Required for videos: what occasion the template is for. */
  category?: VideoCategory;
  description?: string;
  tags?: string[];
}

export interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}

/** Animated SVG scenes: canvas size and loop length (SMIL durations must divide it). */
export interface SceneConfig {
  width: number;
  height: number;
  loop: number;
}

/** Banner components receive the target canvas size alongside their params. */
export interface BannerSize {
  width: number;
  height: number;
}

export const BANNER_SIZES: Record<string, BannerSize> = {
  og: { width: 1200, height: 630 },
  x: { width: 1600, height: 900 },
  linkedin: { width: 1584, height: 396 },
  youtube: { width: 2560, height: 1440 },
  square: { width: 1080, height: 1080 },
};

/**
 * The contract every drops/<date>/<kind>/<slug>/index.tsx must satisfy.
 * - icon:   default export renders a single <svg viewBox=...> (no width/height)
 * - icon3d: default export renders react-three-fiber objects (no <Canvas>)
 * - banner: default export renders a full-bleed element of size props.width x props.height
 * - video:  default export is a Remotion composition component; `video` config required
 * - scene:  default export renders one root <svg viewBox> animated with SMIL; `scene` config required
 */
export interface AssetModule<S extends z.AnyZodObject = z.AnyZodObject> {
  meta: AssetMeta;
  schema: S;
  variants: Record<string, Partial<z.input<S>>>;
  default: ComponentType<any>;
  video?: VideoConfig;
  scene?: SceneConfig;
}

export interface DropInfo {
  date: string;
  theme: string;
  description: string;
  palette: string[];
  /** Names from PALETTES / FONT_PAIRINGS the drop started from (used to rotate directions). */
  direction?: { palette: string; fonts: string };
}

export interface AssetRef {
  id: string; // "<date>/<dir>/<slug>"
  date: string;
  kind: Kind;
  slug: string;
}

export function parseAssetPath(path: string): AssetRef | null {
  const m = path.match(/drops\/(\d{4}-\d{2}-\d{2})\/([a-z0-9]+)\/([a-z0-9-]+)\/index\.tsx$/);
  if (!m || !DIR_KINDS[m[2]]) return null;
  return { id: `${m[1]}/${m[2]}/${m[3]}`, date: m[1], kind: DIR_KINDS[m[2]], slug: m[3] };
}

/** Resolve a variant name (or 'default') to fully-parsed params. */
export function resolveParams(mod: AssetModule, variant = 'default'): Record<string, unknown> {
  const overrides = variant === 'default' ? {} : (mod.variants[variant] ?? {});
  return mod.schema.parse(overrides);
}

export const variantNames = (mod: AssetModule) => ['default', ...Object.keys(mod.variants)];
