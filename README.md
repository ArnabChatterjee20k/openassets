# Generative Assets

A library of icons, 3D icons, banners and video templates that grows every day. Each morning a GitHub Action asks Claude (`claude -p`) to design a new themed **drop**. The drop is validated, rendered and published to the site, and **every asset can be edited in the browser**: colors, text, fonts, uploaded images and variants.

Claude doesn't output pixels. It writes **parametric source code** (SVG/React, react-three-fiber, Remotion), and the pipeline renders that code. As a result, each asset ships with its editable source and an auto-generated editor.

## How it works

```
ideas.md ─► prepare-drop ─► claude -p ─► validate ─► render ─► commit + release ─► GitHub Pages
            (theme +        (writes      (tsc, safety  (SVG/PNG, PNG/GLB,
             occasions)      drops/DATE)  rules, smoke  banner sizes, MP4/GIF)
                                          render)
```

- **Asset = typed params → visuals.** Each `drops/<date>/<kind>/<slug>/index.tsx` exports `meta`, a zod `schema` (every field has a default), named `variants`, and a component. See [CLAUDE.md](CLAUDE.md) for the contract.
- **Editor.** Controls are generated from the schema (`color()`, `text()`, `image()`, `font()`, `num()`, `select()`, `toggle()` in `src/lib/params.ts`). Edits are kept in the URL, so links are shareable. Uploaded images stay in the browser.
- **Video occasions.** Video templates cover launch, tech, greeting, announcement, countdown, promo, quote, event, thank-you, milestone, intro and lower-third. Each day picks the least-used occasions so the library stays varied.

| Kind | Exports |
|---|---|
| Icons | SVG + PNG 32–512 per variant |
| 3D icons | PNG at 3 angles (transparent) + GLB |
| Banners | PNG at OG, X, LinkedIn, YouTube, square |
| Videos | MP4 per variant + GIF preview; customised renders via `pnpm render:video` |

## Local development

```bash
pnpm install
pnpm exec playwright install chromium
pnpm dev                      # http://localhost:5173

./scripts/test-local.sh       # validate, check validator, render (no video), build
./scripts/test-local.sh --full            # + video rendering
./scripts/test-local.sh --generate        # + a real small drop via your local `claude`
./scripts/test-local.sh --generate --serve
```

Other commands:

```bash
pnpm validate [--drop DATE] [--no-browser]
pnpm render [--drop DATE] [--kinds icon,banner] [--no-video]
pnpm render:video 2026-10-29/videos/birthday-wish --props birthday-wish.props.json
DATE=2026-11-01 THEME="Retro Arcade" ./scripts/generate.sh
```

## Setting up the daily job

1. Push this repo to GitHub.
2. Run `claude setup-token` locally and save the token as the repo secret `CLAUDE_CODE_OAUTH_TOKEN`.
3. Under **Settings → Pages**, set Source to **GitHub Actions**.
4. Under **Actions → Daily drop**, click **Run workflow** to test (you can supply an optional theme or date).

The job runs at 06:00 UTC each day. To steer it, edit `ideas.md` (the theme backlog), `prompts/daily-drop.md` (what to make and how many) and `prompts/style-guide.md` (the quality bar).

## Safety

Generated code runs in visitors' browsers, so `pnpm validate` rejects network calls, `eval`, dynamic imports, storage APIs, `dangerouslySetInnerHTML`, external URLs and any import outside a small allowlist. In CI, Claude can only write inside `drops/<today>/` and run `pnpm validate`, and `generate.sh` fails the run if anything else changed.
