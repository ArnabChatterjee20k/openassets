# Generative Assets

Every day a GitHub Action asks Claude (`claude -p`) to produce a **use-case kit**, a set of assets a real team would ship for a specific job (a SaaS launch, a flash sale, a podcast). Each kit contains icons, an interactive 3D hero icon, banners and video templates. Claude designs them, critiques its own renders, validates them and publishes them to the site. **Every asset is editable in the browser**: colors, copy, fonts, uploaded images and variants.

Claude doesn't output pixels. It writes **parametric source code** (React/SVG, react-three-fiber, Remotion), and the pipeline renders that code, so each asset ships with its editable source.

## How a drop is made

```
ideas.md ─► prepare-drop ─► claude -p ──────────────────────────► validate ─► render ─► commit + release ─► Pages
 (use-case  (kit + palette   1. load skills (asset-craft, Remotion)  (tsc, safety,  (SVG/PNG, banner sizes,
  kits)      + type pairing)  2. write brief.md                       contract,      3D PNG/GLB + loop MP4/WebM,
                              3. build each asset ─► pnpm stills ─┐    smoke render)  video MP4 + posters/GIFs)
                                 ▲   critique the contact sheet  │
                                 └──────── fix, ≥ 2 passes ◄─────┘
```

- **Use-case kits:** `ideas.md` is a backlog of real jobs ("E-commerce Flash Sale: online store. Cart/bag/tag icons, 3D gift box, sale banners, countdown promo"). Assets are named for their job and use realistic copy.
- **Visual direction:** each day is assigned the least-used palette from `src/lib/palettes.ts` (24 palettes with bg/surface/ink/accent/accent2/pop roles) and font pairing from `src/lib/fonts.ts` (36 bundled faces, 20 pairings), so drops don't converge on one look.
- **Skills:** `.claude/skills/` holds the official Remotion skills plus **asset-craft**, which covers the quality bar, layering, motion, color and type rules, per-kind recipes, and the mandatory review loop.
- **Review loop:** `pnpm stills` renders contact sheets (video frames, every icon variant at 256 px and 24 px, banner sizes, 3D angles plus loop samples). Claude must open each sheet and fix what it sees.
- **Craft kit (`@/kit`):** bezier easing and beat timing, layered backdrop, film grain, light streaks, dust, title reveals, `displayFace`, Phosphor-based `IconArt`, and 3D `motion3d`.

## Asset kinds

| Kind | Built from | Exports |
|---|---|---|
| Icons | Phosphor glyphs (MIT) via `IconArt`. Solid black by default; weights, duotone, containers, badges and shadows as variants | SVG + PNG 32–512 |
| 3D icons | react-three-fiber (metaballs, extrusions, physical materials) with **micro-interactions**: a rest pose by default, and on hover/click it floats, tilts toward the cursor, squashes and stretches, plus object-specific blinks and flickers | PNG × 3 angles, GLB, 4 s seamless loop as MP4 + transparent WebM + GIF |
| Banners | React/CSS with a hero visual and adaptive layouts | PNG at OG, X, LinkedIn, YouTube, square |
| Videos | Remotion at 60 fps on a beat grid; occasions rotate (launch, tech, greeting, announcement, …) | MP4 per variant, poster, GIF; customised renders via `pnpm render:video` |

## Local development

```bash
pnpm install
pnpm exec playwright install chromium
pnpm dev                                   # http://localhost:5173

./scripts/test-local.sh                    # validate, validator self-test, render (no video), build
./scripts/test-local.sh --full             # + videos and 3D loops
./scripts/test-local.sh --generate         # + a real small drop via your local `claude`
./scripts/test-local.sh --generate --serve
```

```bash
pnpm validate [--drop DATE] [--no-browser]
pnpm stills <date>/<kind>/<slug> [--frames 0,60,120] | --drop DATE    # contact sheets in review/
pnpm render [--drop DATE] [--kinds icon,banner] [--no-video]
pnpm render:video 2026-10-29/videos/birthday-wish --props birthday-wish.props.json
DATE=2026-11-01 THEME="Podcast Launch" PALETTE="Risograph" FONTS="Art school" ./scripts/generate.sh
```

## Setting up the daily job

1. Push this repo to GitHub.
2. Run `claude setup-token` locally and save the token as the repo secret `CLAUDE_CODE_OAUTH_TOKEN`.
3. Under **Settings → Pages**, set Source to **GitHub Actions**.
4. Under **Actions → Daily drop**, click **Run workflow** to test.

The job runs at 06:00 UTC on Opus with up to 300 turns. To steer it, edit `ideas.md`, `prompts/daily-drop.md` and `.claude/skills/asset-craft/SKILL.md`.

## Safety

Generated code runs in visitors' browsers, so `pnpm validate` rejects network calls, `eval`, dynamic imports, storage APIs, `dangerouslySetInnerHTML`, external URLs and imports outside an allowlist. In CI, Claude can write only inside `drops/<today>/`, run `pnpm validate`/`pnpm stills`, use skills and read Remotion docs. `generate.sh` fails the run if anything else changed.

Glyphs come from [Phosphor Icons](https://phosphoricons.com) (MIT). Remotion is free for individuals and small teams; larger companies need a [company license](https://www.remotion.dev/license).
