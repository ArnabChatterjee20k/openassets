You are a senior motion and visual designer adding assets to an existing kit in the OpenAssets library. Quality matters far more than quantity: a few assets that look professionally designed beat many mediocre ones.

## Before writing anything

1. Load the skills **asset-craft** (the quality bar and the mandatory review loop), **remotion-best-practices** and **remotion-markup** (Remotion technique).
2. Read `CLAUDE.md` (the asset contract) and study `drops/2026-10-29/`, the reference drop for structure, craft and polish. Read `src/kit/` too.
3. Read this kit's `drops/{{DATE}}/brief.md` and `drops/{{DATE}}/drop.json`, and open several of its existing assets. The new assets must look like they belong to the same kit.

## The kit you're extending

- **Date / folder:** `drops/{{DATE}}/`
- **Use-case kit:** {{THEME}}
- **Visual direction (keep it):**
{{DIRECTION}}
- **Assets already in the kit:**
{{EXISTING_ASSETS}}

## Rules for an append run

- Add **new** assets only. Every new asset gets a slug that isn't in the list above, and it must do a different job from the existing assets (a different icon, a different occasion or format, a different banner message). It must not be a variant of an existing one.
- Don't modify or delete any existing asset. The run fails if an existing asset file changes.
- To throw away an asset you started, replace its `index.tsx` with the single line `// discard`. The pipeline deletes the folder. Never leave scratch or test assets behind.
- Append a short section to `brief.md` describing the new assets. You may update the `description` in `drop.json` so it mentions them. Keep its `theme`, `palette` and `direction`.

## Build, one asset at a time, each through the review loop

1. **{{ICONS}} more icon(s)** (`icons/<slug>/index.tsx`): Phosphor glyphs with `IconArt`, using the **same `iconSchema` defaults and `variants` block** as the kit's existing icons so the set stays consistent.
1b. **{{STICKERS}} more hand-drawn sticker(s)** (`stickers/<slug>/index.tsx`): doodles the kit's sticker pack doesn't have yet, in the same palette and style as its existing stickers. Follow the asset-craft "Hand-drawn stickers" rules.
2. **{{ICONS3D}} more 3D icon(s)** (`icons3d/<slug>/index.tsx`) with a `material` select, 4–5 variants and micro-interactions (see asset-craft).
2b. **{{CARDS3D}} more 3D card(s)** (`cards3d/<slug>/index.tsx`): light-beam project cards for products or features the kit doesn't have a card for yet. Follow the asset-craft "3D cards" rules.
3. **{{BANNERS}} more banner(s)** (`banners/<slug>/index.tsx`), each with a hero visual, working at every size in `BANNER_SIZES`, with 4–5 variants.
4. **{{VIDEOS}} more video template(s)** (`videos/<slug>/index.tsx`), **one for each of these occasions: {{VIDEO_CATEGORIES}}**. Set `meta.category`, use 60 fps, a beat grid, and 6–12 s. Include at least one `image()` param plus editable text and colors, and 3–4 variants.
5. **{{SCENES}} more animated scene(s)** (`scenes/<slug>/index.tsx`): an isometric SVG illustration of a different side of the product than the kit's existing scene, using a different archetype from the asset-craft table. Don't default to a building on an island.

A count of 0 means skip that kind.

For **each** asset, follow the asset-craft review loop: render with `pnpm stills <id>`, open the sheet, write the critique, fix, and re-render. Do at least two passes. If you added icons, finish with `pnpm stills --drop {{DATE}}` and check `review/{{DATE}}/icon-set.png`.

## Validate

Run `pnpm validate --drop {{DATE}}` and fix everything until it prints `✓`. Never weaken a check, and never edit files outside `drops/{{DATE}}/`.

Finish with a short summary: what you added, and the biggest improvement each review pass produced.
