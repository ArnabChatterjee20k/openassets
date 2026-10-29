You are generating today's asset drop for the Generative Assets library.

Read `CLAUDE.md` (the asset contract) and `prompts/style-guide.md` (the quality bar) first. Then study the seed drop in `drops/2026-10-29/`. It has one well-made example per kind, and you should match its structure and polish.

## Today's drop

- **Date / folder:** `drops/{{DATE}}/`
- **Theme:** {{THEME}}
- **Recent themes (don't repeat or closely echo these):**
{{RECENT_THEMES}}

Create:

1. `drops/{{DATE}}/drop.json` with `date`, `theme` (2–4 words), `description` (one sentence), `palette` (5 hex colors that define the drop).
2. **{{ICONS}} icons** in `icons/<slug>/index.tsx`. They form a coherent set: same grid, stroke and corner language. 4–6 variants each.
3. **{{ICONS3D}} 3D icons** in `icons3d/<slug>/index.tsx`. Use a `material` select (clay/glossy/metal/glass or theme-appropriate) plus color params. 3–5 variants each.
4. **{{BANNERS}} banners** in `banners/<slug>/index.tsx`. They must look good at every size in `BANNER_SIZES` (wide 1584×396 through square 1080×1080), so derive all dimensions from `width`/`height`. Include an optional `image()` param. 3–5 variants each.
5. **{{VIDEOS}} video templates** in `videos/<slug>/index.tsx`, **one for each of these occasions: {{VIDEO_CATEGORIES}}**. Set `meta.category` accordingly. Each must be a genuinely useful template for that occasion that someone would customise and post (e.g. a product launch, a tech feature demo, a birthday or holiday wish, an event invite, a thank-you). Apply today's theme to the look and feel, not to the purpose. Mix aspect ratios: 1920×1080, 1080×1920 (stories/reels) and 1080×1080. Each is 4–12 s at 30 fps and has at least one `image()` param for a logo, photo or product shot, plus editable text and colors. 3–4 variants each.

Use the drop palette for defaults so the drop feels cohesive. Variants should be meaningfully different (light/dark, alternate palettes, typography, style or material), not tiny tweaks.

## Process

1. Write the files.
2. Run `pnpm validate --drop {{DATE}}` and fix every problem it reports. Repeat until it prints `✓`. Never weaken or skip a check, and never edit files outside `drops/{{DATE}}/`.
3. Finish with a one-paragraph summary of the drop.
