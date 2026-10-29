---
name: asset-craft
description: Quality bar, craft techniques and the mandatory visual review loop for generating assets (icons, 3D icons, banners, Remotion video templates) in this repo. Load before creating or editing anything under drops/.
---

# Asset craft

The bar: someone scrolling past should stop, and a designer should want to use the asset as-is. "Technically renders" is not done. Reference implementations live in `drops/2026-10-29/`; read them before writing anything.

## Real use cases

A drop is a kit for a real job (a SaaS launch, a flash sale, a podcast). Every asset answers "who uses this, where, for what?":
- Icons are the ones that product's UI needs. 3D objects are the hero for its landing page or app store. Banners are the posts or headers it would publish. Videos are the launch, promo, greeting or announcement it would send.
- Use specific, plausible copy: names, prices, dates, CTAs. Templates stay editable, but their defaults should read like a real campaign.
- Theme and palette style the kit; they are not its subject (no "weather" kits unless the business is a weather app).

## The review loop (mandatory)

You cannot judge an asset from its code. For **every** asset:

1. Write it.
2. Render it: `pnpm stills <date>/<kind>/<slug>`. For videos, pass `--frames` at the moments that matter (entrances, the hit, mid-hold, the end), e.g. `--frames 10,60,64,90,180,300`.
3. **Open the sheet** with the Read tool (`review/<id>/sheet.png`) and critique it honestly against the checklist below. Write the critique down as 3–6 bullet points.
4. Fix the worst problems, re-render and look again. Do **at least two** review passes per asset, and keep going while you still see a checklist failure.
5. For icons, also check `review/<date>/icon-set.png` (`pnpm stills --drop <date>`) to confirm the set coheres.

If something is geometrically fiddly (crescents, arcs, arrow heads), render the candidates side by side and pick one. Don't guess the SVG arc flags.

### Critique checklist

- **Hierarchy:** is it obvious what to look at first? Is there one focal point per frame?
- **Depth:** is there a flat single-color background? Then add layers (see below).
- **Motion (video):** do adjacent sampled frames differ? A hold where nothing moves reads as frozen. Is there an entrance, a hit and an exit?
- **Timing (video):** do key moments land on beats? Is any text on screen too briefly to read (~2 words per 0.5 s)?
- **Legibility:** at 1080p, headlines must be ≥ 84 px and supporting text ≥ 44 px. Banner text must still be readable on the 1584×396 strip. Icons must read at 24 px.
- **Collisions:** does anything overlap by accident, get clipped, or run off the edge (chips, long names)? Are elements crossing text unintentionally?
- **Variants:** is each variant meaningfully different and still good?
- **Cheapness tells:** default springs everywhere, linear fades, pure #000/#fff, centred-everything with nothing else on the frame, intersecting primitive seams in 3D.

## Color

Generic color is the fastest way to look AI-made. The dark navy + indigo + one yellow accent combination is banned as a default.

- Start from the day's assigned palette (`src/lib/palettes.ts`; each has roles bg / surface / ink / accent / accent2 / pop and a mood). Variants should borrow *other* palettes from that file rather than lightly tinting the default.
- Proportions are **60 / 30 / 10**: bg dominates, surface supports, accent is the signature. `pop` appears in tiny doses (one dot, one word, a spark). Large flat areas of accent work in poster styles (Bauhaus, Swiss, neo-brutalist), so commit fully when you use them.
- Light and paper palettes are as valid as dark ones, often fresher. Don't default to dark.
- On light palettes, the accent is for shapes and large display type. Small text always uses `ink` (contrast ≥ 4.5:1).
- Make color *do* something: duotone images (`mix-blend-mode`), riso-style overprint (multiply two shapes), offset hard shadows in the ink color, gradient maps, and tinted grain.
- Avoid pure `#000` and `#fff`, except as a deliberate brutalist statement.

## Type

The fonts are in `src/lib/fonts.ts`: 36 bundled faces, each with a role and a `vibe`, plus `FONT_PAIRINGS`.

- Use the assigned pairing: **display** for hero words, **text** for copy, **label** for eyebrows, data and chips. Variants may switch to another pairing.
- `inter` is for tiny UI copy only. `grotesk` (Space Grotesk) and `serif` (Playfair) are the overused defaults; avoid them as heroes.
- Treat type as image. Set one or two hero words huge (cropped off the edge is fine), mix an italic serif word into a sans headline, outline type (`WebkitTextStroke`), stack lines with tight leading (0.85–0.95 for condensed faces), and use wide-tracked tiny labels against massive display type.
- Respect each face: condensed faces (Anton, Bebas, Big Shoulders) are caps and tight. Monoton and Nabla only work large. Pixel faces need integer-ish sizes. Instrument Serif and Bodoni shine in italic.

## Depth: the layer stack

Never ship a flat background. Build from back to front (all in `@/kit`):

1. `Backdrop` with a deep base color, a soft centre `lift`, an optional dot `grid` (parallax it with `y: -frame * 0.15`), and 2–3 colored `glows` (accent + secondary, screen-blended).
2. The subject.
3. Light effects: `Streaks` (in/out bursts), shockwave rings (SVG circles whose radius grows with `prog` and fade), screen-blended radial flashes, `Dust` for ambient motion.
4. `FilmOverlay` with grain ≈ 0.05 and vignette 0.35–0.6. Pass `frame` so the grain moves.

## Motion

- Use `@/kit` easing, not defaults: `prog(frame, start, dur, ease.out)` for entrances (expo-out), `ease.inOut`/`inOutSoft` for moves, `ease.in` for exits, `ease.backOut` for small overshoot pops (buttons, pills). `keys()` handles multi-stop keyframes, e.g. a flash `[0, 1, 0]`.
- Entrances combine 2–3 channels: opacity, translate (20–40 px) or scale (1.08→1), and blur (8–20 px → 0). Titles use `SweepReveal` (mask sweep + blur + settle) and later a `Glint`. Lines of copy use `WordsIn`.
- Use a slow camera push: wrap the scene in `scale: mix(1, 1.05, prog(...))`, and add a small shake on impacts.
- Run at **60 fps** and cut on a beat grid: `const T = tempo(60, 120)` gives `T.beat` (30 frames) and `T.bars(n)`. Land the hits (flash, title, CTA) on beats. Stagger related elements by 4–6 frames.
- There must be no dead air: keep something moving in every hold (dust, a parallax grid, a glow breathing via `Math.sin(frame / 40)`, a glint).
- Everything must be deterministic: use `rand(seed)` from the kit, never `Math.random()`. No CSS transitions or animations.

## Typography

- Hero type uses tight tracking (`-0.03em` to `-0.04em`). Eyebrows use mono, uppercase, wide tracking (`0.24–0.42em`), in the accent color.
- Use `gradientText()` for titles: white → text color → accent, angled at ~160°.
- Scale the size down for long strings (`name.length > 12 ? 150 : 196`) instead of letting them overflow.
- Inside the safe area, keep key text ≥ 80 px from the sides and ≥ 100 px from the top and bottom (at 1080p).

## Per kind

### Video templates

Each one is a real template for an occasion (launch, tech, greeting, …). It has a clear structure: build → hit → reveal → hold with life → exit. Every visible string, color and image is a param. Make the optional `image()` work both with and without an image, and adjust the layout when one is present.

### Banners

All dimensions derive from `width`/`height`. Switch the layout by aspect ratio: wide (side by side), ultra-wide strip > 3:1 (drop secondary copy), and square/portrait < 1.3 (stack the visual above the copy). Every banner needs a **hero visual** (an illustration built from SVG/CSS shapes, data chips or an abstract scene), not just text. Anchor right-side elements by their right edge so long labels can't overflow.

### Icons

Don't hand-draw glyph paths. Polished icon libraries (Font Awesome, Phosphor, Lucide) get their quality from years of grid and optical work. Build on **Phosphor** (`@phosphor-icons/react/ssr`, ~1,500 glyphs × thin/light/regular/bold/fill/duotone) through `IconArt` + `iconSchema` from `@/kit`:

```tsx
import { LightningIcon, WarningIcon } from '@phosphor-icons/react/ssr';
export const schema = iconSchema({ primary: '#0D1B1E' });
export default (p) => <IconArt glyph={LightningIcon} badgeGlyph={WarningIcon} p={p} id="lightning" />;
```

- **The default is a clean solid black glyph** (`primary: '#000000'`, `weight: 'fill'`, no container), like Font Awesome. The user picks the color in the editor, and previews show icons on a light tile. Theme colors belong in variants. Containers, duotone, badges and shadows are optional variants, not the default.
- A set is 6–8 **standalone** glyphs that fit the theme (e.g. weather: lightning, drop, moon, wind, sun…). Don't force every icon into one composite motif (no "everything on a cloud").
- Every icon in a set uses the same `iconSchema` defaults and the same `variants` block (e.g. regular / bold / thin / duotone / tile / brutal), so the set stays consistent.
- Pick glyphs by browsing names (`node -e "import('@phosphor-icons/react/ssr').then(m=>console.log(Object.keys(m).filter(k=>/Rain|Sun/.test(k))))"`). Typecheck catches wrong names.
- Hand-drawn SVG is only for a glyph Phosphor genuinely lacks, on Phosphor's 256 grid with matching stroke (16 at regular).

### 3D icons

- Organic shapes (clouds, blobs, characters): use drei `MarchingCubes`/`MarchingCube` metaballs for one seamless surface, never intersecting spheres. Ball radius ≈ √(strength/subtract) in field units: start with `strength ≈ 0.8–1.2`, `subtract 12`, positions within ±0.4, and scale the group ~1.9. Flatten depth (z scale ~0.7) for icon-like silhouettes.
- Hard shapes: use `ExtrudeGeometry` with generous bevels (`bevelSegments ≥ 4`), `RoundedBox`, or `LatheGeometry`.
- Use materials via a `material` select. Clay is `meshPhysicalMaterial` with roughness ~0.7 and light sheen. Glossy adds clearcoat. Metal is `metalness 1` at roughness ~0.3 (lower turns into a chrome checkerboard). Glass uses transmission.
- Keep accents saturated (heavy emissive washes them out). The renderer supplies lights, environment, contact shadow and camera angles.

#### Micro-interactions (required)

3D icons have two states, like small robot heads that sit still until you poke them:
- **Default:** the rest pose at t = 0. This is what cards, PNG exports and the editor show. It must look finished on its own (balanced, nothing caught mid-motion).
- **Interaction:** the loop. It plays while hovered or for one loop after a click, then settles back on the rest pose. Exports render it as the MP4/WebM/GIF loop.

Make every motion return to the rest pose at loop boundaries (integer `cycles` guarantee this). Use `@/kit` motion3d:
- Wrap the object in `<IconMotion seed={n}>`. This gives a float bob, gentle sway, tilt toward the cursor on hover, and squash-and-stretch on click.
- Add 1–3 object-specific idle details inside `useLoop((m) => ...)` by mutating refs (never set React state per frame). Examples: a `blink()` on eyes or lights, a `flicker()` on a glow, a lid that peeks open, coins that `cycle()` upward, a needle that `wave()`s.
- Hover (`m.hover` 0..1) should intensify something (glow, speed, opening). A click (`pressBounce(m.pressAge)`) gives a reaction (flash, pop, spin).
- Every period must divide `LOOP_SECONDS` (4 s): use `wave(t, cycles)` / `cycle(t, cycles)` with integer cycles so the exported loop is seamless.
- Offer a calm/lively `mood` (or similar) param, like a robot's status.
- Review: `pnpm stills` samples the loop at t = 0.6 / 1.2 / 2.2 / 3.2 s. Those frames must visibly differ.

### Animated scenes (isometric SVG)

Scenes are the product's idea as a living illustration: landing-page heroes, empty states and launch visuals.

**Choose the concept from the product, not a template.** First write one sentence: *what does this product do, as a physical metaphor?* Then pick the archetype that makes that sentence visible. A building is only right when the product really is a place (a café, a hotel, a store, an office). Otherwise a house on an island says nothing.

| Archetype | When it fits | Example |
|---|---|---|
| **Process machine** | The product transforms inputs into outputs (pipelines, AI, feeds, dev tools, payments) | A reading feed: articles flutter in from source towers, pass a sieve, get stamped into today's page, which lands on a shelf of dated volumes |
| **Object still life** | A calm, personal or daily-ritual product (reading, notes, journaling, music, food) | A desk at dawn: lamp, steaming cup, today's paper unfolding, a stack of past issues |
| **Place / diorama** | The product is or serves a physical place | A restaurant opening, a hotel, an office, a shop, a campus |
| **Network / system** | The product connects many parties (APIs, marketplaces, social) | Floating platforms joined by bridges, with packets travelling between them |
| **Vehicle / journey** | Delivery, travel, logistics, onboarding, progress | A tiny cargo ship or train carrying parcels between islands |
| **Interface as stage** | The UI itself is the hero (dashboards, mobile apps) | A giant isometric phone or screen with little characters using its widgets |
| **Character / mascot** | A playful brand, games, kids, communities | The mascot doing the product's job in its own little world |

The brief must name the archetype and say why it fits ("openfeed → process machine, because it gathers, filters and binds"). If the last kit's scene used the same archetype, prefer a different one unless the fit is clearly better.

- Use `IsoBox`, `IsoGable` / `IsoRoof`, `IsoCylinder` (with a `cone` cap for trees and turrets), `IsoWindow` on box faces, and `IsoGrid` floors. `iso()` / `pts()` handle custom polygons. Draw back to front (smaller x + y first).
- Composition: the subject (machine, still life, place…) is centred and fills ~60% of the canvas, with a background and atmosphere that suit it (sky and weather outdoors, wall and lamp light indoors), plus a dark outline ink. Floating platforms are one option, not the default.
- Animate only with SMIL (`<animate>`, `<animateTransform>`, `<animateMotion>`) so the exported `.svg` plays anywhere and the pipeline can seek it. No CSS keyframes. Every `dur` must divide `scene.loop`; use negative `begin` offsets to desync repeated elements.
- Layer 4–6 small loops (window `Flicker`, spinning parts, pulses, drifting clouds, rain, a gentle bob) plus one punctuating moment per loop (a lightning double-flash, a door opening, a bat flying past).
- Review: `pnpm stills` samples t = 0, ¼, ½, the moment, and ¾ of the loop. The t = 0 frame is the poster, so it must be a good still.
- **Density is the difference between "toy" and "illustration".** Bare surfaces look cheap. Every area needs supporting detail that belongs to the concept: gears, pipes, gauges and conveyors for a machine; cup, pen, plant and lamp for a still life; paths, lamps and signage for a place.
- **Architecture needs trim:** roof overhangs with tile rows, ridge caps and fascia; framed windows with mullions and sills; plinths, door awnings. Put text (signs) in a wall's plane with `matrix(cos30, 0.5, 0, 1, x, y)` for left faces, on a backing plate in the band between the window tops and the eave.
- **Light makes it:** soft cast shadows (blurred polygons offset away from the light), window light spilling onto the ground, a moon or sun halo, glow filters on lamps and neon.
- **Spin things in the right plane:** turbine blades and fans live in an isometric face plane (`matrix(-cos30, 0.5, 0, 1, …)` for planes facing right). Fake a horizontal rotation with `scale(1 0.5)` around a rotating group.
- Give the sky its own life: a character or vehicle crossing the moon (`animateMotion`), twinkling stars, drifting clouds.

## Pitfalls already hit (don't repeat)

- Shockwave rings that start smaller than the digit or text they surround and cut through it. Start the radius outside the glyph.
- Second halves of videos where sampled frames are identical.
- Confetti with plain gravity falls off-screen in 1 s. Use linear drag and terminal velocity so pieces arc high, hang, and drift down.
- Chips and labels anchored by their left edge overflowing the right side of banners.
- A "stacked" layout forced onto landscape sizes.
- Crescent moons whose thick side faces into the cloud covering them (another reason to use Phosphor glyphs).
- Defaulting icons to elaborate composites: users want a solid icon they can recolor.
