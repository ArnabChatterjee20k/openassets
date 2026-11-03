import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { FilmOverlay, Glint, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Season 3 Launch',
  category: 'launch',
  description:
    'Vertical season launch reel for particles.io: particles swarm into the arrow ship on the beat, it fires, OVERCLOCK slams in as stacked brutalist blocks, feature cards land, then the date and a Play-free CTA.',
  tags: ['launch', 'game', 'season', 'story', 'vertical', 'neo-brutalist'],
};

// 60 fps, 120 BPM: beat = 30 frames, bar = 120. Five bars = 10 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text().default('particles.io · Season 3'),
  line1: text('Title line 1').default('OVER'),
  line2: text('Title line 2').default('CLOCK'),
  feature1: text('Feature 1').default('New map: Reactor'),
  feature2: text('Feature 2').default('Ranked squads'),
  feature3: text('Feature 3').default('60-tick servers'),
  day: text('Day tag').default('Friday'),
  date: text('Date').default('14.11'),
  time: text('Time line').default('18:00 UTC · All regions'),
  cta: text('Call to action').default('Play free at particles.io'),
  screenshot: image('Gameplay screenshot (optional)').default(''),
  font: font('Title font').default('dela'),
  paper: color('Paper').default('#FFFDF2'),
  panel: color('Panel').default('#FFE45C'),
  ink: color('Ink + outlines').default('#000000'),
  accent: color('Accent (ship, CTA)').default('#FF5C8A'),
  accent2: color('Accent 2').default('#5C8AFF'),
  pop: color('Pop').default('#00D1A0'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  acid: { paper: '#0B0B0B', panel: '#1F1F1F', ink: '#F0FFE0', accent: '#C6FF00', accent2: '#FF00E5', pop: '#00F0FF', eyebrow: 'Night arenas · Season 3' },
  ultraviolet: { paper: '#12001F', panel: '#B026FF', ink: '#FBEFFF', accent: '#FF2E88', accent2: '#FFD600', pop: '#2EF2C4', line1: 'RANK', line2: 'ED', feature1: 'Squads of 4', feature2: 'Weekly ladders', feature3: 'Season rewards' },
  riso: { paper: '#F4EFE6', panel: '#FF48B0', ink: '#1F2A6B', accent: '#FFE800', accent2: '#0078BF', pop: '#FF48B0', font: 'bungee', line1: 'REAC', line2: 'TOR', eyebrow: 'New map · Season 3' },
};

type P = z.infer<typeof schema>;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};
const on = (bg: string, p: P) => (lum(bg) < 120 ? (lum(p.ink) > 160 ? p.ink : '#FFFDF2') : lum(p.ink) > 160 ? '#0B0B0B' : p.ink);

const brut = (p: P, k: number, fill: string, b = 6): CSSProperties => ({
  background: fill,
  border: `${b}px solid ${p.ink}`,
  boxShadow: `${k}px ${k}px 0 ${p.ink}`,
});

const SHIP = 'M0 -20 L15 14 L0 6 L-15 14 Z';

/** Points inside the ship silhouette (deterministic rejection sampling). */
function shipTargets(n: number) {
  const out: [number, number][] = [];
  const inside = (x: number, y: number) => {
    // Triangle (0,-20) (15,14) (-15,14) minus the notch below the line y = 6 + |x| * 8/15
    const inTri = y <= 14 && y >= -20 && Math.abs(x) <= ((y + 20) / 34) * 15;
    const notch = y > 6 + (Math.abs(x) * 8) / 15;
    return inTri && !notch;
  };
  let s = 1;
  while (out.length < n && s < 5000) {
    const x = (rand(s * 1.31) - 0.5) * 30;
    const y = rand(s * 2.71) * 34 - 20;
    if (inside(x, y)) out.push([x, y]);
    s++;
  }
  return out;
}
const TARGETS = shipTargets(46);

export default function SeasonLaunch(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const B = T.beat;
  const FIRE = T.bars(1);
  const FEAT = T.bars(2);
  const DATE = T.bars(3);
  const END = video.durationInFrames;
  const dark = lum(p.paper) < 110;
  const colors = [p.accent, p.accent2, p.pop, p.panel];

  // Ship: forms at centre in bar 1, fires on bar 2, blasts off at bar 3.
  const SX = W / 2;
  const SY = 1180;
  const S = 11;
  const solid = prog(frame, 104, 10, ease.backOut);
  const recoil = keys(frame, [FIRE, FIRE + 4, FIRE + 26], [0, 46, 0], [ease.out, ease.outSoft]);
  const blast = prog(frame, FEAT - 6, 30, ease.in);
  const shipX = SX + blast * 700;
  const shipY = SY + recoil - blast * 1500 + Math.sin(frame / 22) * 8 * (frame > FIRE ? 1 : 0);
  const shipRot = blast * 28;

  const flash = keys(frame, [FIRE - 1, FIRE + 2, FIRE + 24], [0, 1, 0], [ease.out, ease.outSoft]);
  const shakeAmt = Math.max(frame >= FIRE ? Math.max(0, 1 - (frame - FIRE) / 18) : 0, frame >= DATE ? Math.max(0, 1 - (frame - DATE) / 14) * 0.7 : 0);
  const shx = (rand(frame * 1.9) - 0.5) * 22 * shakeAmt;
  const shy = (rand(frame * 3.3) - 0.5) * 16 * shakeAmt;
  const push = mix(1, 1.04, prog(frame, 0, END, ease.inOutSoft));
  const wipe = prog(frame, END - 34, 34, ease.inOut);

  // Title
  const longest = Math.max(p.line1.length, p.line2.length, 3);
  const TF = Math.min(200, 820 / (longest * 0.98));
  const slam = (at: number) => prog(frame, at, 16, ease.snap);
  const block = (txt: string, at: number, fill: string, top: number, rot: number, alignRight: boolean) => {
    const t = slam(at);
    if (frame < at) return null;
    return (
      <div style={{ position: 'absolute', top, left: 80, right: 80, display: 'flex', justifyContent: alignRight ? 'flex-end' : 'flex-start' }}>
        <div
          style={{
            ...brut(p, 18, fill, 8),
            padding: `${TF * 0.06}px ${TF * 0.16}px ${TF * 0.12}px`,
            ...displayFace(p.font),
            fontSize: TF,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: on(fill, p),
            whiteSpace: 'nowrap',
            scale: String(mix(1.7, 1, t)),
            rotate: `${rot * t}deg`,
            opacity: clamp(t * 4),
            position: 'relative',
          }}
        >
          {txt}
          <Glint frame={frame} start={DATE + B * 2 + (alignRight ? 8 : 0)} dur={40} style={{ position: 'absolute', inset: 0, padding: `${TF * 0.06}px ${TF * 0.16}px ${TF * 0.12}px`, ...displayFace(p.font), fontSize: TF, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {txt}
          </Glint>
        </div>
      </div>
    );
  };

  const feats = [p.feature1, p.feature2, p.feature3].filter(Boolean);
  const hasShot = !!p.screenshot;
  const featOut = (i: number) => prog(frame, DATE - 26 + i * 4, 16, ease.in);
  const DF = Math.min(270, 900 / (Math.max(3, p.date.length) * 0.8));
  // Hold life: a small ship strafes across the bottom, trailing shots.
  const strafe = prog(frame, DATE + B * 2, T.bars(1) + B * 2, ease.inOutSoft);
  const strafeX = mix(-160, W + 160, strafe);
  const strafeY = 1720 + Math.sin(strafe * Math.PI * 2) * 40;
  const cardH = hasShot ? 96 : 150;
  const cardFS = hasShot ? 46 : 58;
  const featTop = hasShot ? 1290 : 930;

  return (
    <AbsoluteFill style={{ backgroundColor: p.paper, overflow: 'hidden' }}>
      <AbsoluteFill style={{ translate: `${shx}px ${shy}px`, scale: String(push) }}>
        {/* Paper + parallax dot grid */}
        <AbsoluteFill
          style={{
            backgroundImage: `radial-gradient(circle, ${hexA(p.ink, dark ? 0.22 : 0.18)} 2.4px, transparent 3px)`,
            backgroundSize: '48px 48px',
            backgroundPosition: `0px ${-frame * 0.3}px`,
          }}
        />
        {/* Panel block behind the title (the 30%), drops in on the fire beat */}
        <div
          style={{
            position: 'absolute',
            left: -20,
            right: -20,
            top: -20,
            height: 840,
            background: p.panel,
            borderBottom: `8px solid ${p.ink}`,
            translate: `0 ${mix(-900, 0, prog(frame, FIRE - 8, 22, ease.out))}px`,
          }}
        />
        {/* Ambient particle trio drifting all through */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 26 }, (_, i) => {
            const depth = 0.4 + rand(i * 3.3) * 0.6;
            const x = (rand(i * 1.7) * W + Math.sin(frame / 50 + i) * 30) % W;
            const y = ((rand(i * 7.1) * (H + 200) - frame * (0.6 + depth) * 1.2) % (H + 200) + H + 200) % (H + 200) - 100;
            return <circle key={i} cx={x} cy={y} r={6 + depth * 10} fill={colors[i % 3]} stroke={p.ink} strokeWidth={3.5} opacity={0.25 + depth * 0.35} />;
          })}
        </svg>

        {/* Eyebrow */}
        <div
          style={{
            position: 'absolute',
            top: 150,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            opacity: prog(frame, 14, 20),
            translate: `0 ${mix(-20, 0, prog(frame, 14, 26))}px`,
          }}
        >
          <div style={{ ...brut(p, 8, p.paper, 5), padding: '10px 26px', display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONTS.chakra, fontWeight: 700, fontSize: 44, letterSpacing: '0.16em', textTransform: 'uppercase', color: on(p.paper, p) }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: p.pop, border: `4px solid ${p.ink}`, scale: String(0.85 + 0.3 * Math.abs(Math.sin((frame / B) * Math.PI))) }} />
            {p.eyebrow}
          </div>
        </div>

        {/* Title blocks slam on the fire beat and the half-beat after */}
        {block(p.line1, FIRE + 2, p.accent, 290, -3, false)}
        {block(p.line2, FIRE + B / 2, p.paper, 290 + TF * 1.18 + 30, 2, true)}

        {/* Swarm → ship */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {frame < 122 &&
            TARGETS.map(([tx, ty], i) => {
              const g = i % 4;
              const lock = g < 3 ? (g + 1) * B : 105; // groups land on beats 1, 2, 3 and just before the downbeat
              const sx0 = rand(i * 4.7) * W;
              const sy0 = 300 + rand(i * 8.3) * 1400;
              const drift = Math.sin(frame / 18 + i) * 14;
              const t = prog(frame, lock - 26, 26, ease.inOutSoft);
              const x = mix(sx0 + drift, SX + tx * S, t);
              const y = mix(sy0 - drift, SY + ty * S, t);
              const pop = keys(frame, [lock, lock + 4, lock + 12], [1, 1.5, 1], [ease.out, ease.outSoft]);
              const r = mix(14, 11, t) * pop * (1 - solid * 0.9);
              return <circle key={i} cx={x} cy={y} r={Math.max(0, r)} fill={colors[i % 4]} stroke={p.ink} strokeWidth={4} opacity={prog(frame, i * 0.8, 16)} />;
            })}
          {/* Muzzle shots streaking up into the title */}
          {frame >= FIRE - 2 &&
            frame < FIRE + 30 &&
            Array.from({ length: 6 }, (_, i) => {
              const u = prog(frame, FIRE - 2 + i * 2, 14, ease.in);
              const y = mix(SY - 20 * S, 520, u);
              return u > 0 && u < 1 ? <circle key={i} cx={SX + (i % 2 ? 18 : -18)} cy={y} r={16 - i} fill={p.accent} stroke={p.ink} strokeWidth={4} /> : null;
            })}
          {/* Ship sprite */}
          {solid > 0 && blast < 1 && (
            <g transform={`translate(${shipX} ${shipY}) rotate(${shipRot}) scale(${S * mix(0.6, 1, solid)})`}>
              {/* thruster flames */}
              {[-7, 7].map((fx, i) => (
                <path key={i} d={`M${fx - 3} 11 L${fx} ${18 + 4 * Math.abs(Math.sin(frame / 4 + i)) + blast * 30} L${fx + 3} 11 Z`} fill={p.accent2} stroke={p.ink} strokeWidth={0.4} />
              ))}
              <path d={SHIP} fill={p.ink} transform="translate(1.6 2)" />
              <path d={SHIP} fill={p.accent} stroke={p.ink} strokeWidth={0.55} strokeLinejoin="round" />
              <circle cx={0} cy={-1} r={3.2} fill={p.pop} stroke={p.ink} strokeWidth={0.45} />
            </g>
          )}
          {/* Shock ring from the nose on fire, starting outside the ship */}
          {frame >= FIRE && frame < FIRE + 44 && (
            <circle cx={SX} cy={SY - 40} r={260 + prog(frame, FIRE, 44) * 420} fill="none" stroke={p.ink} strokeWidth={mix(10, 1, prog(frame, FIRE, 44))} opacity={1 - prog(frame, FIRE, 44)} />
          )}
          {/* Hold: small ship strafing along the bottom with a shot trail */}
          {strafe > 0 && strafe < 1 && (
            <g>
              {Array.from({ length: 7 }, (_, i) => (
                <circle key={i} cx={strafeX - 90 - i * 56} cy={strafeY + Math.sin((strafe - i * 0.03) * Math.PI * 2) * 40 - Math.sin(strafe * Math.PI * 2) * 40} r={16 - i * 1.5} fill={colors[(i + 1) % 3]} stroke={p.ink} strokeWidth={3.5} opacity={1 - i * 0.12} />
              ))}
              <g transform={`translate(${strafeX} ${strafeY}) rotate(${90 + Math.cos(strafe * Math.PI * 2) * 20}) scale(5.6)`}>
                <path d={SHIP} fill={p.ink} transform="translate(1.6 2)" />
                <path d={SHIP} fill={p.accent} stroke={p.ink} strokeWidth={0.9} strokeLinejoin="round" />
                <circle cx={0} cy={-1} r={3.2} fill={p.pop} stroke={p.ink} strokeWidth={0.8} />
              </g>
            </g>
          )}
          {/* Blast-off trail */}
          {blast > 0 &&
            Array.from({ length: 10 }, (_, i) => {
              const k = clamp(blast - i * 0.06);
              return <circle key={i} cx={SX + k * 700} cy={SY - k * 1500 + 200} r={22 - i * 1.6} fill={colors[i % 3]} stroke={p.ink} strokeWidth={4} opacity={(1 - blast) * 0.9} />;
            })}
        </svg>

        {/* Bar 3: optional screenshot window + feature cards on beats */}
        {hasShot && frame >= FEAT && (
          <div
            style={{
              position: 'absolute',
              left: 80,
              right: 80,
              top: 900,
              height: 360,
              ...brut(p, 16, p.paper, 7),
              overflow: 'hidden',
              translate: `${-featOut(0) * 1200}px ${mix(80, 0, prog(frame, FEAT, 20, ease.out))}px`,
              opacity: prog(frame, FEAT, 10),
            }}
          >
            <div style={{ height: 46, background: p.panel, borderBottom: `6px solid ${p.ink}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px' }}>
              {colors.slice(0, 3).map((c, i) => (
                <span key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: `3px solid ${p.ink}` }} />
              ))}
            </div>
            <Img src={p.screenshot} style={{ width: '100%', height: 360 - 52, objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        {feats.map((f, i) => {
          const at = FEAT + (hasShot ? B : 0) + i * B * (hasShot ? 0.5 : 1);
          const t = prog(frame, at, 18, ease.backOut);
          const o = featOut(i + 1);
          if (frame < at) return null;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 80,
                right: 80,
                top: featTop + i * (cardH + (hasShot ? 22 : 40)),
                height: cardH,
                ...brut(p, 14, i === 1 ? p.panel : p.paper, 6),
                display: 'flex',
                alignItems: 'center',
                gap: 30,
                paddingRight: 30,
                translate: `${mix(i % 2 ? 600 : -600, 0, t) - o * 1300}px 0`,
                rotate: `${(i - 1) * 1.2}deg`,
              }}
            >
              <div style={{ width: cardH - 12, height: '100%', flex: 'none', background: colors[i], borderRight: `6px solid ${p.ink}`, display: 'grid', placeItems: 'center', ...displayFace('dela'), fontSize: cardH * 0.4, color: on(colors[i], p) }}>
                0{i + 1}
              </div>
              <div style={{ fontFamily: FONTS.familjen, fontWeight: 700, fontSize: cardFS, letterSpacing: '-0.01em', color: on(i === 1 ? p.panel : p.paper, p), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f}</div>
            </div>
          );
        })}

        {/* Bar 4: date slam, time line, CTA pop */}
        {frame >= DATE && (
          <>
            {p.day && (
              <div style={{ position: 'absolute', left: 0, right: 0, top: 920, display: 'flex', justifyContent: 'center' }}>
                <div
                  style={{
                    ...brut(p, 10, p.accent2, 5),
                    padding: '6px 26px',
                    fontFamily: FONTS.chakra,
                    fontWeight: 700,
                    fontStyle: 'italic',
                    fontSize: 48,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: on(p.accent2, p),
                    rotate: '-3deg',
                    scale: String(prog(frame, DATE + 6, 18, ease.backOut)),
                  }}
                >
                  {p.day}
                </div>
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 1010,
                textAlign: 'center',
                ...displayFace(p.font),
                fontSize: DF,
                lineHeight: 1,
                color: on(p.paper, p),
                textShadow: `12px 12px 0 ${p.accent}`,
                WebkitTextStroke: `3px ${p.ink}`,
                whiteSpace: 'nowrap',
                scale: String(mix(1.6, 1, slam(DATE))),
                opacity: clamp(slam(DATE) * 4),
              }}
            >
              {p.date}
            </div>
            <WordsIn
              text={p.time}
              frame={frame}
              start={DATE + 12}
              style={{ position: 'absolute', left: 0, right: 0, top: 1010 + DF * 1.08, justifyContent: 'center', fontFamily: FONTS.chakra, fontWeight: 700, fontSize: 50, letterSpacing: '0.14em', textTransform: 'uppercase', color: on(p.paper, p) }}
            />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 1010 + DF * 1.08 + 120, display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  ...brut(p, 14, p.accent, 6),
                  padding: '26px 46px',
                  fontFamily: FONTS.familjen,
                  fontWeight: 700,
                  fontSize: 56,
                  color: on(p.accent, p),
                  whiteSpace: 'nowrap',
                  scale: String(prog(frame, DATE + B, 22, ease.backOut) * (1 + 0.03 * Math.max(0, Math.sin(((frame - DATE) / B) * Math.PI)))),
                }}
              >
                {p.cta} →
              </div>
            </div>
          </>
        )}
      </AbsoluteFill>

      {/* Fire flash: radial burst from the ship nose */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${((SY - 200) / H) * 100}%, ${hexA('#FFFDF2', flash)} 0%, ${hexA(p.accent, flash * 0.7)} 25%, transparent 60%)`, mixBlendMode: dark ? 'screen' : 'normal' }} />
      {/* Exit: a panel wipes up from the bottom */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: wipe * H, background: p.accent, borderTop: wipe > 0 ? `10px solid ${p.ink}` : undefined }} />
      <FilmOverlay grain={0.035} vignette={dark ? 0.35 : 0} frame={frame} />
    </AbsoluteFill>
  );
}
