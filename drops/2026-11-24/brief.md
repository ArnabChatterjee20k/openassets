# Benchwire Cloud Lab Kit: brief

**Use case.** Benchwire is a cloud lab: scientists send a protocol to an API (`benchwire run assay.yaml`) and robot workcells in a scientific data center run it, then stream data back. Its users are biotech and materials teams who need many more experiments than their own bench can do. They need dashboard icons (run, sample, robot, results), a landing-page hero object, product cards for the API, the robots and the plate library, a launch banner, an event invite for their live demo, a thank-you video for beta labs, a sticker pack for posts and decks, and an isometric hero scene.

**Idea.** "Wet lab, as a terminal." The lab looks like it does on a green-phosphor console: scanlines, a blinking block cursor and readouts. Real lab hardware (flasks, 96-well plates, robot arms) lights up chartreuse when a run is live.

**Reference.** 1980s lab-instrument CRT readouts (HP gas chromatographs, early DNA-synthesizer consoles) crossed with Swiss-grid data sheets. Pixel type is used as hardware UI, not as nostalgia.

**Palette "Storm Teal"** (dark): `#0D1B1E` lab-at-night (bg) · `#16302F` instrument panel (surface) · `#EAF4EF` phosphor white (ink) · `#D4FF3A` live-run chartreuse (accent: only for live wells, cursors and CTAs) · `#3FA7A0` buffer teal (accent2: grids, glass, secondary data) · `#FF5A36` hazard coral (pop: one REC dot or one alert per frame). Variants borrow Deep Sea, Blueprint, Acid, Risograph and Nordic Frost.

**Type "Terminal".** VT323 for hero words and big numbers (integer sizes, caps, tight). JetBrains Mono (`mono`) for copy, code and commands. Silkscreen for eyebrows, chips and status labels (wide-tracked caps).

**Shared motif.** The **96-well plate**: a dot grid of wells where a few light up chartreuse as a run moves along, plus a blinking block cursor. It appears as a grid in the backdrops, a hero element and a progress meter.

**Assets.**
- Icons (dashboard): flask (run), test tube (sample), DNA (sequencing), robot (robot scientist), microscope (imaging), eyedropper (pipette), terminal window (API console), chart scatter (results). Solid black by default; regular, bold, thin, duotone, tile and terminal variants.
- Stickers: Squiggle Arrow, Spark Trio, Eureka Burst (marks); Bubbling Flask, Petri Dish (objects); "Pip", an original CRT-headed lab robot mascot.
- 3D hero "Live Flask": a lathe-turned Erlenmeyer flask of glowing reagent on a robot stage puck with an LED ring, with a ring of data cubes orbiting. Idle: bubbles rise, the liquid glows and the orbit turns. Hover boils it faster; a click pops a bubble burst and flashes the LED ring. Materials: glass, clay, glossy, metal; calm/running mood.
- 3D cards: **Run API** (a rounded console block with a glowing prompt screen), **Robot Scientists** (an articulated arm with a glowing gripper joint), **Plate Library** (a 24-well plate with one glowing row).
- Banner "API Beta Launch": "Your next 1,000 experiments, one API call away." Hero visual: a terminal card (`$ benchwire run elisa-titration.yaml`, live log lines) above a 96-well plate filling with chartreuse, plus chips (`412 runs queued`, `median 6h 20m`). Side by side when wide, the strip drops the body, stacked when square.
- Video "Live Demo Invite" (event, 1920×1080, 10 s, 120 BPM): b1 CRT boots with a scanline wipe, `$ benchwire live --join` types · b2 downbeat: the plate grid flashes alive, and the title "BENCHWIRE LIVE 03" glitches in · b3 date / time / place rows type on beat (Thu 11 Dec 2026 · 17:00 CET · Online + Basel lab) next to the speaker photo slot · b4 the CTA pill pops, with a REC dot, cursor blink, glint and a scanline exit.
- Video "Beta Lab Thank You" (thank-you, 1080×1920, 9 s): b1 log line `run #1000 … complete` with the progress bar filling · b2 hit: "THANK YOU" in giant VT323 with a well burst, then the lab name (logo slot) sweeps in · b3 three stat counters tick up on beats (1,000 runs · 412 plates · 9,800 bench hours) · b4 signed note from the team, plus a cursor and an exit.
- Scene "Robot Lab Hall" (landing hero, **place/diorama**: Benchwire *is* a place, a robotic lab inside a data-center hall; the last kit used a process machine). A cut-away isometric hall floor with two rows of glass workcells, a gantry robot gliding on a ceiling rail, a plate shuttle on a track, an incubator with a door and a monitor wall. Loops: status LEDs blink, the gantry travels, the shuttle carries a plate, the centrifuge spins, the ceiling light hums. Moment: "RUN COMPLETE" as one plate flashes chartreuse.
