# OpenAssets

A library of parametric, editable assets (SVG icons, 3D icons, banners, video templates). `claude -p` in GitHub Actions generates a new themed kit three times a day, each from a different idea (`drops/<day>`, `drops/<day>-2`, `drops/<day>-3`). The site (Vite + React, GitHub Pages) shows a gallery and an editor that is auto-generated from each asset's schema.

## Asset contract

Each asset lives at `drops/<YYYY-MM-DD>/<kind-dir>/<slug>/index.tsx`, where kind-dir is one of `icons`, `stickers`, `icons3d`, `cards3d`, `banners`, `videos` or `scenes`. The slug is kebab-case. Each drop also has a `drops/<date>/drop.json` with `{ date, theme, description, palette }`.

Every asset module exports:

```tsx
export const meta: AssetMeta = { kind: 'icon' | 'icon3d' | 'banner' | 'video', name, description, tags, category? };
export const schema = z.object({ ... });      // every field has .default()
export const variants: Record<string, Partial<z.input<typeof schema>>> = { ... }; // ≥ 2
export default function Asset(props) { ... }
export const video: VideoConfig = { width, height, fps, durationInFrames }; // videos only
```

- Build schema fields with the helpers in `@/lib/params`: `color()`, `text()`, `textarea()`, `image()`, `font()`, `num(min, max, step)`, `select([...])`, `toggle()`. These carry the UI hints for the editor.
- `image()` values are user-uploaded data URLs. Default to `''` and render nothing when empty.
- Use fonts only via `FONTS[key]` from `@/lib/fonts`.
- Per kind:
  - **icon:** render `IconArt` from `@/kit` with a Phosphor glyph (`@phosphor-icons/react/ssr`) and `iconSchema(...)`. The result is a single root `<svg viewBox="0 0 256 256">` with no width or height. The default is a solid black glyph.
  - **sticker:** a hand-drawn doodle. Render `<Sticker p={p}>` with `<Doodle>`/`<Line>` and `sk.*` shapes from `@/kit`, with a schema from `stickerSchema({ fill, accent, ink })`. The kit adds the crayon wobble, grain, border and the draw-in / boil animation. Draw only original characters.
  - **icon3d:** return react-three-fiber objects (`<group>`, `<mesh>`…). No `<Canvas>`, lights, camera or controls; `src/renderers/Scene3D.tsx` provides those.
  - **card3d:** a light-beam project card. Like icon3d (one small R3F object), with a schema built on `beamSchema({ name })` from `@/kit`. The renderer adds the name-seeded beams, glow and lighting. Use `beamLight(p).color` for the object's glowing accent.
  - **banner:** props also include `width` and `height`. Render a full-bleed element of exactly that size and scale everything from it.
  - **video:** a Remotion component, with `meta.category` set to one of `VIDEO_CATEGORIES` in `src/lib/types.ts`.
  - **scene:** one root `<svg viewBox>` isometric illustration animated with SMIL only, built with `@/kit` iso helpers. `export const scene = { width, height, loop }` is required, and every SMIL `dur` must divide `loop`.
- Allowed imports are `react`, `three`, `@react-three/fiber`, `@react-three/drei`, `remotion`, `zod`, `@/lib/params`, `@/lib/fonts`, `@/lib/types`, `@/lib/palettes`, `@/kit`, `@phosphor-icons/react/ssr`, and relative files inside the asset folder. These are banned: network access, `eval`, dynamic `import()`, storage APIs, `dangerouslySetInnerHTML` and external URLs. Generated code runs in visitors' browsers.

## Commands

- `pnpm dev`: the site at http://localhost:5173 (gallery + editor).
- `pnpm validate [--drop DATE] [--no-browser]`: typecheck, safety rules, contract checks and a headless smoke render of every variant.
- `pnpm render [--drop DATE] [--kinds icon,banner] [--no-video]`: optional local batch render to `out/`. The site never uses pre-rendered files; previews and downloads render in the browser.
- `pnpm render:video <date>/videos/<slug> --props file.json`: renders a customised video.
- `pnpm stills <date>/<kind>/<slug> [--frames ...]` or `pnpm stills --drop DATE`: contact sheets in `review/` for visual critique.
- `./scripts/test-local.sh [--full|--generate|--serve]`: the local test harness.
- `./scripts/generate.sh`: the daily pipeline (prepare → claude → validate). Each run starts a new kit; `APPEND=1` adds assets to the day's latest kit instead (prompt: `prompts/append-drop.md`). `RENDER=1` also batch-renders.
- Claude can't delete files: to discard a scratch asset, replace its `index.tsx` with `// discard` and `generate.sh` removes the folder. `pnpm validate` rejects scratch/test assets.
- `uv run --script scripts/gather/gather.py`: gathers recent YC and Product Hunt launches into `ideas-gathered.md` (biweekly in CI). `prepare-drop` takes kits from it before `ideas.md`.
- `./scripts/regenerate.sh <date>/<kind>/<slug> "note"`: redo one asset through claude -p and the review loop.

Before creating or editing assets, load the **asset-craft** skill (`.claude/skills/asset-craft/`): it has the quality bar and the mandatory `pnpm stills` review loop. Remotion skills live alongside it. Shared craft components (easing, backdrop, grain, streaks, title reveals, dust) are in `@/kit`. `drops/2026-10-29/` is the reference drop.
