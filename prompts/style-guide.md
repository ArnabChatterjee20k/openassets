# Style guide

The bar: someone browsing the site should want to download the asset and use it as-is.

## General
- Use one cohesive look per drop: shared palette, consistent shape language and type choices.
- Defaults come from the drop palette. Variants explore alternatives (light/dark, palette swaps, alternate fonts, materials).
- Every visible string, color and image a user would want to change must be a param.
- Keep components deterministic: no `Math.random()` and no `Date`. In videos, use Remotion's `random(seed)`.

## Icons (SVG)
- Use `viewBox="0 0 24 24"` and keep artwork inside a 2px padding (2–22).
- Use `fill="none"` on the root and draw with strokes unless the variant is filled. Params should include `stroke` width and round vs sharp joins.
- A set shares one visual grammar: same stroke, corner radius, perspective and level of detail.
- Icons must read clearly at 24px. Avoid tiny details and text.
- Good variant axes: outline / filled / duotone, stroke weight, mono, alternate accent.

## 3D icons (react-three-fiber)
- Build from primitives (`sphereGeometry`, `boxGeometry`, `torusGeometry`, `capsuleGeometry`, `ExtrudeGeometry` from a `THREE.Shape`, `LatheGeometry`). Use generous segment counts (32–64) and bevels for a soft "toy" feel.
- Keep the object roughly within a 2.4-unit cube centred on the origin. The renderer supplies the camera, lights, environment and rotation angles. Don't add a `<Canvas>`, camera, lights or controls.
- Provide a `material` select. Typical options: clay (`roughness` ~0.9), glossy (`meshPhysicalMaterial` + clearcoat), metal (`metalness: 1`, `roughness` ~0.25), glass (`transmission`).
- Use 2–3 colors at most, so it reads well on both light and dark backgrounds.

## Banners
- Derive every size and spacing from `width`/`height` (e.g. `const u = Math.min(width, height * 1.9) / 100`). Check the 1584×396 LinkedIn strip and the 1080×1080 square mentally.
- Use strong typographic hierarchy: eyebrow, headline, supporting line, and an optional CTA or logo.
- Use CSS gradients, SVG patterns and shapes for richness. External images are only allowed via `image()` params.
- Use fonts only through `FONTS[...]`.

## Videos (Remotion)
- Templates are for **occasions** (launch, tech, greeting, announcement, countdown, promo, quote, event, thank-you, milestone, intro, lower-third). They should be useful to a real person or brand.
- Use `spring()` and `interpolate()` with `extrapolateLeft/Right: 'clamp'`. Use `<Sequence>` to structure scenes.
- Give the opening 0.5 s motion and end with a hold or fade. Text must stay on screen long enough to read (~2 words per 0.5 s).
- Use `<Img>` from remotion for images, and render nothing when an image param is `''`.
- Keep text sizes legible on mobile: titles ≥ 90px and body ≥ 40px at 1080p.
