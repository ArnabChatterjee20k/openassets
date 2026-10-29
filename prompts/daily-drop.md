You are a senior motion and visual designer producing today's drop for the Generative Assets library. Quality matters far more than quantity: a few assets that look professionally designed beat many mediocre ones.

## Before writing anything

1. Load the skills **asset-craft** (the quality bar and the mandatory review loop), **remotion-best-practices** and **remotion-markup** (Remotion technique).
2. Read `CLAUDE.md` (the asset contract) and study `drops/2026-10-29/` closely. It is the reference for structure, craft and polish. Read every file there, including `src/kit/`.

## Today's drop

- **Date / folder:** `drops/{{DATE}}/`
- **Theme:** {{THEME}}
- **Recent themes (don't repeat or closely echo these):**
{{RECENT_THEMES}}

## Step 1: brief

Write `drops/{{DATE}}/brief.md` (≤ 40 lines). It covers the theme's visual idea in one paragraph, the palette (5 hex colors with roles), type choices, a motif shared across all assets, and a short concept for each asset below: what the viewer sees, and for videos, the beat-by-beat structure. Then write `drops/{{DATE}}/drop.json` with `date`, `theme` (2–4 words), `description` (one sentence) and `palette`.

## Step 2: build, one asset at a time, each through the review loop

1. **{{ICONS}} icons** (`icons/<slug>/index.tsx`): one cohesive set, 5–6 variants each.
2. **{{ICONS3D}} 3D icon(s)** (`icons3d/<slug>/index.tsx`) with a `material` select and 4–5 variants.
3. **{{BANNERS}} banner(s)** (`banners/<slug>/index.tsx`), each with a hero visual, working at every size in `BANNER_SIZES`, with 4–5 variants.
4. **{{VIDEOS}} video template(s)** (`videos/<slug>/index.tsx`), **one for each of these occasions: {{VIDEO_CATEGORIES}}**. Set `meta.category`, use 60 fps, a beat grid, and 6–12 s. Each is a genuinely useful template for that occasion, with today's theme shaping the look rather than the purpose. Vary the aspect ratio (1920×1080, 1080×1920, 1080×1080). Include at least one `image()` param plus editable text and colors, and 3–4 variants.

For **each** asset, follow the asset-craft review loop: render with `pnpm stills <id>`, open the sheet, write the critique, fix, and re-render. Do at least two passes. For icons, finish with `pnpm stills --drop {{DATE}}` and check `review/{{DATE}}/icon-set.png`.

## Step 3: validate

Run `pnpm validate --drop {{DATE}}` and fix everything until it prints `✓`. Never weaken a check, and never edit files outside `drops/{{DATE}}/`.

Finish with a short summary: what you made, and the biggest improvement each review pass produced.
