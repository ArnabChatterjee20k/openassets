import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Caster Lower Third',
  category: 'lower-third',
  description:
    'Neo-brutalist streamer / caster lower third for particles.io broadcasts: a slab slams in, avatar card pops, the player name sweeps on, stat chips land on the beat, a particle burst, then a staggered exit.',
  tags: ['lower third', 'stream', 'esports', 'caster', 'game', 'neo-brutalist'],
};

// 60 fps on a 120 BPM grid: beat = 30 frames, bar = 120 frames. 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  name: text('Player / caster name').default('NOVA_K'),
  role: text('Role line').default('Team Prism · #1 EU Ranked'),
  initials: text('Initials (no avatar)').default('NK'),
  live: text('Live tag').default('LIVE'),
  stat1: text('Stat 1').default('K/D 4.2'),
  stat2: text('Stat 2').default('1,284 ELIMS'),
  stat3: text('Stat 3').default('RANK #1'),
  avatar: image('Avatar (optional)').default(''),
  footage: image('Gameplay still behind (optional)').default(''),
  font: font('Name font').default('dela'),
  paper: color('Paper / cards').default('#FFFDF2'),
  slab: color('Name slab').default('#FF5C8A'),
  card: color('Avatar card').default('#FFE45C'),
  chips: color('Stat chips').default('#5C8AFF'),
  ink: color('Ink + outlines').default('#000000'),
  pop: color('Live dot').default('#00D1A0'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  acid: { paper: '#F0FFE0', slab: '#C6FF00', card: '#FF00E5', chips: '#00F0FF', ink: '#0B0B0B', pop: '#FF00E5', name: 'PIXELWITCH', initials: 'PW', role: 'Team Hex · Grand Finals MVP' },
  ultraviolet: { paper: '#FBEFFF', slab: '#B026FF', card: '#FFD600', chips: '#FF2E88', ink: '#12001F', pop: '#2EF2C4', font: 'chakra', name: 'Lumen', initials: 'LU', role: 'Shoutcaster · Season 3 Opening Night', stat1: 'CASTER', stat2: 'EU WEST', stat3: '' },
  riso: { paper: '#F4EFE6', slab: '#FFE800', card: '#FF48B0', chips: '#0078BF', ink: '#1F2A6B', pop: '#FF48B0', font: 'bungee', name: 'DEV TEAM', initials: 'P', role: 'particles.io · Patch 3.0 walkthrough', stat1: 'PATCH 3.0', stat2: '60-TICK', stat3: '' },
};

type P = z.infer<typeof schema>;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};
const on = (bg: string, ink: string) => (lum(bg) < 120 ? '#FFFDF2' : ink);

const brut = (p: P, k: number, fill: string): CSSProperties => ({
  background: fill,
  border: `6px solid ${p.ink}`,
  boxShadow: `${k}px ${k}px 0 ${p.ink}`,
});

/** Stand-in "gameplay" when no footage is supplied: the arena on paper, ships drifting. */
function ArenaStandIn({ frame, p, W, H }: { frame: number; p: P; W: number; H: number }) {
  const ships = [
    { x: 1350, y: 300, a: 200, c: p.chips, vx: -0.6, vy: 0.25 },
    { x: 1000, y: 470, a: 30, c: p.slab, vx: 0.7, vy: -0.3 },
    { x: 1620, y: 640, a: -60, c: p.pop, vx: -0.4, vy: -0.45 },
    { x: 700, y: 220, a: 120, c: p.card, vx: 0.5, vy: 0.35 },
  ];
  return (
    <AbsoluteFill style={{ background: p.paper }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle, ${hexA(p.ink, 0.2)} 2px, transparent 2.6px)`,
          backgroundSize: '44px 44px',
          backgroundPosition: `${-frame * 0.4}px ${-frame * 0.2}px`,
        }}
      />
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={1180} cy={420} r={330} fill="none" stroke={p.ink} strokeWidth={3} strokeDasharray="6 14" opacity={0.25} />
        <circle cx={1180} cy={420} r={58} fill={p.card} stroke={p.ink} strokeWidth={5} opacity={0.6} />
        {[
          [820, 330, 120, 40],
          [1460, 520, 44, 140],
          [1300, 170, 150, 40],
        ].map(([x, y, w, h], i) => (
          <g key={i} opacity={0.55}>
            <rect x={x + 8} y={y + 8} width={w} height={h} fill={p.ink} />
            <rect x={x} y={y} width={w} height={h} fill={p.card} stroke={p.ink} strokeWidth={5} />
          </g>
        ))}
        {ships.map((s, i) => {
          const x = s.x + frame * s.vx * 1.6;
          const y = s.y + frame * s.vy * 1.6 + Math.sin(frame / 40 + i) * 8;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${s.a + Math.sin(frame / 60 + i) * 8}) scale(2.2)`} opacity={0.75}>
              <path d="M0 -20 L15 14 L0 6 L-15 14 Z" fill={p.ink} transform="translate(3 4)" />
              <path d="M0 -20 L15 14 L0 6 L-15 14 Z" fill={s.c} stroke={p.ink} strokeWidth={2.6} strokeLinejoin="round" />
            </g>
          );
        })}
        {/* Shots crossing the arena on a loop */}
        {Array.from({ length: 10 }, (_, i) => {
          const u = ((frame * 0.006 + i * 0.1) % 1 + 1) % 1;
          const x = mix(1040, 1560, u);
          const y = mix(440, 280, u) + Math.sin(i) * 20;
          return <circle key={i} cx={x} cy={y} r={7 + (i % 3) * 2} fill={[p.slab, p.chips, p.pop][i % 3]} stroke={p.ink} strokeWidth={3} opacity={0.5} />;
        })}
      </svg>
    </AbsoluteFill>
  );
}

export default function CasterLowerThird(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const B = T.beat;
  const OUT = T.bars(3) + T.beats(1.5); // exit starts here
  const outT = (delay: number) => prog(frame, OUT + delay, 26, ease.in);

  // Beat-grid entrances
  const SLAB = B * 0.5;
  const CARD = B * 1;
  const NAME = B * 1 + 6;
  const ROLE = B * 2;
  const CHIP = B * 3;
  const BURST = T.bars(2);

  // Slab slam with a small shake on landing
  const slabIn = prog(frame, SLAB, 16, ease.snap);
  const land = frame >= SLAB + 12 ? Math.max(0, 1 - (frame - SLAB - 12) / 14) : 0;
  const burstShake = frame >= BURST ? Math.max(0, 1 - (frame - BURST) / 16) : 0;
  const shake = land + burstShake * 0.6;
  const sx = (rand(frame * 1.7) - 0.5) * 16 * shake;
  const sy = (rand(frame * 3.1) - 0.5) * 10 * shake;

  const NAME_FS = p.name.length > 10 ? 84 : 104;
  const slabW = Math.max(820, p.name.length * NAME_FS * 0.98 + 380);
  const X0 = 120;
  const AV = 230;
  const SLAB_Y = 712;
  const SLAB_H = 156;
  const textOnSlab = on(p.slab, p.ink);

  const cardScale = prog(frame, CARD, 22, ease.backOut);
  const roleIn = prog(frame, ROLE - 4, 18, ease.out);
  const stats = [p.stat1, p.stat2, p.stat3].filter(Boolean);
  const livePulse = 0.5 + 0.5 * Math.sin((frame / B) * Math.PI); // pulses on the beat
  const stripe = frame * 1.2;

  return (
    <AbsoluteFill style={{ backgroundColor: p.paper, overflow: 'hidden' }}>
      {p.footage ? <Img src={p.footage} style={{ position: 'absolute', inset: 0, width: W, height: H, objectFit: 'cover' }} /> : <ArenaStandIn frame={frame} p={p} W={W} H={H} />}
      {/* Soft scrim so the third reads over busy footage */}
      <AbsoluteFill style={{ background: `linear-gradient(180deg, transparent 50%, ${hexA(p.ink, p.footage ? 0.35 : 0.08)} 100%)` }} />

      <AbsoluteFill style={{ translate: `${sx}px ${sy}px` }}>
        {/* Stat chips (above the slab), land on beats */}
        <div style={{ position: 'absolute', left: X0 + AV + 40, top: SLAB_Y - 96, display: 'flex', gap: 22 }}>
          {stats.map((s, i) => {
            const t = prog(frame, CHIP + i * (B / 2), 20, ease.backOut);
            const o = outT(i * 4);
            return (
              <div
                key={i}
                style={{
                  ...brut(p, 8, i === 0 ? p.chips : p.paper),
                  padding: '8px 22px',
                  fontFamily: FONTS.chakra,
                  fontWeight: 700,
                  fontSize: 44,
                  letterSpacing: '0.06em',
                  lineHeight: 1.1,
                  color: on(i === 0 ? p.chips : p.paper, p.ink),
                  whiteSpace: 'nowrap',
                  scale: String(mix(0.4, 1, t) * (1 - o * 0.3)),
                  opacity: clamp(t * 3) * (1 - o),
                  translate: `${-o * 120}px ${mix(30, 0, t)}px`,
                  rotate: `${(1 - t) * -8 + (i === 1 ? 1.5 : i === 2 ? -1.5 : 0)}deg`,
                }}
              >
                {s}
              </div>
            );
          })}
        </div>

        {/* Name slab */}
        <div
          style={{
            position: 'absolute',
            left: X0 + AV * 0.55,
            top: SLAB_Y,
            width: slabW,
            height: SLAB_H,
            ...brut(p, 14, p.slab),
            overflow: 'hidden',
            translate: `${mix(-slabW - 400, 0, slabIn) - outT(10) * (slabW + 500)}px 0`,
          }}
        >
          {/* moving hazard stripe band along the bottom of the slab */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 18,
              borderTop: `5px solid ${p.ink}`,
              backgroundImage: `repeating-linear-gradient(-45deg, ${p.ink} 0 10px, transparent 10px 24px)`,
              backgroundPosition: `${stripe}px 0`,
              opacity: 0.9,
            }}
          />
          {frame >= NAME - 2 && (
            <div style={{ position: 'absolute', left: AV * 0.55 + 36, top: 0, height: SLAB_H - 18, display: 'flex', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <SweepReveal frame={frame} start={NAME} dur={26} blur={14} scaleFrom={1.12}>
                  <div style={{ ...displayFace(p.font), fontSize: NAME_FS, lineHeight: 1, letterSpacing: '-0.01em', color: textOnSlab, whiteSpace: 'nowrap', textShadow: `5px 5px 0 ${hexA(p.ink, lum(p.slab) < 120 ? 0.9 : 0.18)}` }}>
                    {p.name}
                  </div>
                </SweepReveal>
                <Glint frame={frame} start={BURST + 6} dur={40} style={{ position: 'absolute', inset: 0, ...displayFace(p.font), fontSize: NAME_FS, lineHeight: 1, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                  {p.name}
                </Glint>
              </div>
            </div>
          )}
        </div>

        {/* Role bar */}
        <div
          style={{
            position: 'absolute',
            left: X0 + AV + 40,
            top: SLAB_Y + SLAB_H + 4,
            ...brut(p, 10, p.paper),
            borderTop: 'none',
            padding: '10px 28px 12px',
            clipPath: `inset(0 ${(1 - roleIn) * 100}% 0 0)`,
            translate: `${-outT(6) * 1400}px 0`,
          }}
        >
          <WordsIn
            text={p.role}
            frame={frame}
            start={ROLE}
            stagger={4}
            rise={18}
            style={{ fontFamily: FONTS.familjen, fontWeight: 700, fontSize: 46, color: p.ink, whiteSpace: 'nowrap', flexWrap: 'nowrap' }}
          />
        </div>

        {/* Avatar card */}
        <div
          style={{
            position: 'absolute',
            left: X0,
            top: SLAB_Y - (AV - SLAB_H) / 2 - 10,
            width: AV,
            height: AV,
            ...brut(p, 14, p.card),
            overflow: 'hidden',
            rotate: `${-4 + (1 - cardScale) * -14}deg`,
            scale: String(cardScale * (1 - outT(14) * 0.6)),
            opacity: 1 - outT(14),
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {p.avatar ? (
            <Img src={p.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ ...displayFace('dela'), fontSize: p.initials.length > 2 ? 70 : 96, color: on(p.card, p.ink), letterSpacing: '-0.03em' }}>{p.initials}</div>
          )}
        </div>
        {/* LIVE tag pinned to the card */}
        {p.live && (
          <div
            style={{
              position: 'absolute',
              left: X0 - 14,
              top: SLAB_Y - (AV - SLAB_H) / 2 - 44,
              ...brut(p, 6, p.paper),
              padding: '4px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontFamily: FONTS.chakra,
              fontWeight: 700,
              fontSize: 34,
              letterSpacing: '0.2em',
              color: p.ink,
              rotate: '-6deg',
              scale: String(prog(frame, CARD + 10, 18, ease.backOut) * (1 - outT(16))),
            }}
          >
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: p.pop, border: `3px solid ${p.ink}`, scale: String(0.8 + livePulse * 0.35) }} />
            {p.live}
          </div>
        )}

        {/* Bar-3 particle burst from the card corner: drag so dots arc out and hang */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {frame >= BURST &&
            Array.from({ length: 34 }, (_, i) => {
              const t = (frame - BURST) / FPS;
              const a = -Math.PI * (0.02 + rand(i * 2.3) * 0.6);
              const v = 1100 + rand(i * 5.7) * 1500;
              const k = 3.2;
              const d = (v * (1 - Math.exp(-k * t))) / k;
              const x = X0 + AV - 10 + Math.cos(a) * d;
              const y = SLAB_Y - 60 + Math.sin(a) * d + 90 * t * t;
              const life = clamp(1 - t / (1.4 + rand(i) * 0.8));
              const r = (10 + rand(i * 9.1) * 16) * (0.4 + life * 0.6);
              const c = [p.slab, p.chips, p.pop, p.card][i % 4];
              return life > 0 ? <circle key={i} cx={x} cy={y} r={r} fill={c} stroke={p.ink} strokeWidth={4} opacity={clamp(life * 2)} /> : null;
            })}
          {/* shock ring around the card on the burst, starting outside it */}
          {frame >= BURST && frame < BURST + 40 && (
            <circle cx={X0 + AV / 2} cy={SLAB_Y + SLAB_H / 2 - 10} r={170 + prog(frame, BURST, 40) * 220} fill="none" stroke={p.ink} strokeWidth={mix(8, 1, prog(frame, BURST, 40))} opacity={1 - prog(frame, BURST, 40)} />
          )}
        </svg>
      </AbsoluteFill>
      <FilmOverlay grain={0.035} vignette={0} frame={frame} />
    </AbsoluteFill>
  );
}
