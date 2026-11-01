import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, clamp, ease, hexA, keys, mix, prog, rand, tempo, typed } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Launch Night',
  category: 'event',
  description:
    'Vertical rave-flyer invite for a launch event or livestream: strobes on every beat, a laser fan, the title slams in arcade letters, the line-up switches on row by row, then a ticket stub with date, venue and optional photo, and an RSVP pill.',
  tags: ['event', 'launch party', 'livestream', 'invite', 'story', 'vertical', 'saas'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30 frames, bar = 120
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  presenter: text('Presented by').default('Strobe 1.0 presents'),
  title1: text('Title line 1').default('Launch'),
  title2: text('Title line 2').default('Night'),
  row1: text('Line-up 1').default('18:00 | Keynote · Mara Okafor, CEO'),
  row2: text('Line-up 2').default('18:40 | Live rollout · 0 → 100%'),
  row3: text('Line-up 3').default('19:30 | Afterparty · DJ Hexcode'),
  date: text('Date (big)').default('18.11'),
  day: text('Day + time').default('Tue · Doors 17:30'),
  venue: text().default('Kraftwerk Berlin + livestream'),
  cta: text('Call to action').default('RSVP → strobe.dev/live'),
  photo: image('Speaker or venue photo (optional)').default(''),
  background: color().default('#0B0B0B'),
  surface: color('Ticket').default('#1A1A1A'),
  textColor: color('Text').default('#F0FFE0'),
  accent: color('Accent').default('#C6FF00'),
  accent2: color('Laser').default('#FF00E5'),
  pop: color('Second laser').default('#00F0FF'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  ultraviolet: { background: '#12001F', surface: '#24003D', textColor: '#FBEFFF', accent: '#B026FF', accent2: '#FF2E88', pop: '#FFD600' },
  livestream: {
    presenter: 'Strobe live',
    title1: 'Ship',
    title2: 'Week',
    row1: 'Mon | Flags 101 · 30 min',
    row2: 'Wed | Rollouts at scale',
    row3: 'Fri | Ask us anything',
    date: '24.11',
    day: 'Mon–Fri · 17:00 CET',
    venue: 'Streaming on strobe.dev/live',
    cta: 'Set a reminder →',
    background: '#021B26',
    surface: '#06303F',
    textColor: '#E6FFFA',
    accent: '#2EF2C4',
    accent2: '#1B7FA6',
    pop: '#FF7A59',
  },
  lava: { background: '#1A0A06', surface: '#2E120B', textColor: '#FFEDE0', accent: '#FF4D00', accent2: '#FFB000', pop: '#FF2E63' },
};

type P = z.infer<typeof schema>;

const shade = (hex: string, t: number) => {
  const n = parseInt(hex.slice(1), 16);
  const to = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  const ch = (v: number) => Math.round(v + (to - v) * k).toString(16).padStart(2, '0');
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
};

const NABLA_CSS = `@font-palette-values --strobe-flat { font-family: 'Nabla'; override-colors: ${Array.from({ length: 32 }, (_, i) => `${i} currentColor`).join(', ')}; }`;

const arcade = (face: string, side: string, laser: string, size: number): CSSProperties => {
  const depth = Math.max(3, Math.round(size * 0.07));
  const s = Array.from({ length: depth }, (_, i) => `${i + 1}px ${i + 1}px 0 ${side}`);
  s.push(`${depth + size * 0.05}px ${depth + size * 0.05}px 0 ${laser}`);
  return { fontFamily: FONTS.nabla, fontPalette: '--strobe-flat', color: face, textShadow: s.join(', '), textTransform: 'uppercase' } as CSSProperties;
};

const HIT = T.bars(1); // title slam
const LINEUP = T.bars(2);
const TICKET = T.bars(3);
const CTA = T.bars(4);
const OUT = T.bars(5) - 36;

export default function LaunchNight(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const out = prog(frame, OUT, 36, ease.in);

  // Bar 1: a strobe on every beat; afterwards on the bar downbeats only.
  const strobeBeats = [0, 1, 2, 3].map((b) => T.beats(b)).concat([HIT, LINEUP, TICKET, CTA]);
  const strobe = Math.max(...strobeBeats.map((b) => keys(frame, [b - 1, b + 1, b + (b === HIT ? 22 : 10)], [0, b === HIT ? 1 : 0.55, 0], [ease.out, ease.outSoft])));

  // Laser fan opens from the bottom during bar 1, then sways.
  const fan = prog(frame, 0, HIT, ease.inOutSoft);
  const lasersOn = (0.4 + fan * 0.6) * (1 - out);

  // Title slam + camera shake
  const t1 = prog(frame, HIT, 16, ease.out);
  const t2 = prog(frame, HIT + 15, 16, ease.out);
  const shakeAmt = Math.max(0, 1 - (frame - HIT) / 18) * (frame >= HIT ? 1 : 0) * 14 + Math.max(0, 1 - (frame - HIT - 15) / 14) * (frame >= HIT + 15 ? 1 : 0) * 8;
  const shake = `${(rand(frame * 1.7) - 0.5) * shakeAmt}px ${(rand(frame * 3.1) - 0.5) * shakeAmt}px`;
  const shock = prog(frame, HIT, 54, ease.out);
  const longest = Math.max(p.title1.length, p.title2.length, 4);
  const TS = Math.min(250, (W - 180) / (longest * 0.62));
  const LINEUP_TOP = 290 + TS * 2.04 + 50;
  const push = mix(1, 1.05, prog(frame, HIT, OUT - HIT, ease.inOutSoft));

  const rows = [p.row1, p.row2, p.row3].filter(Boolean).map((r) => {
    const [a, b] = r.includes('|') ? r.split('|') : ['', r];
    return { time: a.trim(), what: b.trim() };
  });

  const TICKET_TOP = LINEUP_TOP + rows.length * 124 + 56;
  const CTA_TOP = Math.min(H - 200, TICKET_TOP + 340 + 70);
  const ticketIn =prog(frame, TICKET, 30, ease.out);
  const ctaIn = prog(frame, CTA, 26, ease.backOut);

  const label: CSSProperties = { fontFamily: FONTS.pressstart, letterSpacing: '0.16em', textTransform: 'uppercase' };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, overflow: 'hidden' }}>
      <style>{NABLA_CSS}</style>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: 0.07, size: 44, y: -frame * 0.2, color: '240,255,224' }}
        glows={[
          { x: W * 0.5, y: H * 1.02, size: 1500, color: hexA(p.accent2, 0.5), opacity: 0.4 + fan * 0.5 },
          { x: W * 0.5, y: H * 0.28, size: 1100, color: hexA(p.accent, 0.25), opacity: prog(frame, HIT, 40) * (0.6 + 0.2 * Math.sin(frame / 36)) },
        ]}
        grain={0}
        vignette={0.55}
      />

      {/* Laser fan from the bottom centre */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: lasersOn }}>
        <defs>
          {[p.accent2, p.pop, p.accent].map((c, i) => (
            <linearGradient key={i} id={`ln-beam-${i}`} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor={c} stopOpacity="1" />
              <stop offset="1" stopColor={c} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {Array.from({ length: 11 }, (_, i) => {
          const spread = (i - 5) * mix(1.5, 9, fan) + Math.sin(frame / 34 + i * 0.7) * 3 * fan;
          return <rect key={i} x={W / 2 - 3} y={H + 40 - 2400} width={6} height={2400} fill={`url(#ln-beam-${i % 3})`} transform={`rotate(${spread} ${W / 2} ${H + 40})`} />;
        })}
      </svg>

      <AbsoluteFill style={{ scale: String(push * mix(1, 0.95, out)), translate: shake, opacity: 1 - out, filter: out > 0.01 ? `blur(${out * 14}px)` : undefined }}>
        <Dust frame={frame} width={W} height={H} count={60} color={p.accent} seed={3} speed={1.2} opacity={0.35} maxSize={5} />

        {/* Presenter line types in */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 150, textAlign: 'center', ...label, fontSize: 26, color: p.accent }}>
          {typed(frame, 8, FPS, 18, p.presenter)}
          <span style={{ opacity: frame % 30 < 15 && frame < HIT + 60 ? 1 : 0 }}>_</span>
        </div>

        {/* Shockwave behind the title */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={W / 2} cy={290 + TS} r={360 + shock * 700} fill="none" stroke={p.accent} strokeWidth={mix(12, 1, shock)} opacity={frame >= HIT ? (1 - shock) * 0.8 : 0} />
        </svg>

        {/* Title */}
        {[p.title1, p.title2].map((line, i) => {
          const t = i === 0 ? t1 : t2;
          const top = 290 + i * TS * 1.02;
          const style: CSSProperties = { position: 'absolute', left: 0, right: 0, top, textAlign: 'center', fontSize: TS, lineHeight: 1, whiteSpace: 'nowrap' };
          return (
            <div key={i}>
              <div
                style={{
                  ...style,
                  ...arcade(i === 0 ? p.accent : p.textColor, shade(i === 0 ? p.accent : p.textColor, -0.62), i === 0 ? p.accent2 : p.pop, TS),
                  scale: String(mix(1.7, 1, t)),
                  opacity: clamp(t * 3),
                  filter: t < 1 ? `blur(${(1 - t) * 18}px)` : undefined,
                }}
              >
                {line}
              </div>
              <Glint frame={frame} start={CTA + 6 + i * 8} dur={40} style={{ ...style, fontFamily: FONTS.nabla, fontPalette: '--strobe-flat', textTransform: 'uppercase' } as CSSProperties}>
                {line}
              </Glint>
            </div>
          );
        })}

        {/* Line-up: each row switches ON on a beat */}
        <div style={{ position: 'absolute', left: 84, right: 84, top: LINEUP_TOP }}>
          {rows.map((r, i) => {
            const at = LINEUP + T.beats(i);
            const t = prog(frame, at, 24, ease.out);
            const knob = prog(frame, at + 6, 14, ease.backOut);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 28,
                  padding: '20px 0',
                  minHeight: 124,
                  boxSizing: 'border-box',
                  borderTop: `2px solid ${hexA(p.textColor, 0.14)}`,
                  opacity: clamp(t * 1.5),
                  translate: `${mix(-60, 0, t)}px 0`,
                }}
              >
                <span style={{ ...label, fontSize: 28, color: p.accent, minWidth: 150 }}>{r.time}</span>
                <span style={{ flex: 1, minWidth: 0, fontFamily: FONTS.rubikmono, fontSize: r.what.length > 24 ? 34 : 38, lineHeight: 1.2, textTransform: 'uppercase' }}>{r.what}</span>
                {/* the motif: a flag pill flipping ON */}
                <span style={{ flex: 'none', width: 92, height: 50, borderRadius: 50, padding: 5, boxSizing: 'border-box', background: knob > 0.5 ? p.accent : hexA(p.textColor, 0.18), boxShadow: knob > 0.5 ? `0 0 26px ${hexA(p.accent, 0.5)}` : undefined }}>
                  <span style={{ display: 'block', width: 40, height: 40, borderRadius: '50%', background: knob > 0.5 ? p.background : p.textColor, translate: `${mix(0, 42, knob)}px 0` }} />
                </span>
              </div>
            );
          })}
        </div>

        {/* Ticket stub */}
        <div
          style={{
            position: 'absolute',
            left: 84,
            right: 84,
            top: TICKET_TOP,
            height: 340,
            display: 'flex',
            borderRadius: 28,
            background: p.surface,
            border: `2px solid ${hexA(p.textColor, 0.14)}`,
            boxShadow: `14px 14px 0 ${p.accent2}`,
            opacity: clamp(ticketIn * 2),
            translate: `0 ${mix(220, 0, ticketIn)}px`,
            rotate: `${mix(-6, 0, ticketIn)}deg`,
          }}
        >
          <div style={{ flex: 1, padding: '40px 0 36px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
            <div style={{ ...label, fontSize: 20, color: hexA(p.textColor, 0.6) }}>Admit one</div>
            <div style={{ fontSize: 150, lineHeight: 0.9, ...arcade(p.accent, shade(p.accent, -0.62), p.accent2, 150) }}>{p.date}</div>
            <div>
              <div style={{ fontFamily: FONTS.rubikmono, fontSize: 30, textTransform: 'uppercase' }}>{p.day}</div>
              <div style={{ ...label, fontSize: 18, marginTop: 14, color: hexA(p.textColor, 0.7), letterSpacing: '0.08em', lineHeight: 1.5 }}>{p.venue}</div>
            </div>
          </div>
          {/* perforation */}
          <div style={{ width: 0, borderLeft: `4px dashed ${hexA(p.textColor, 0.22)}`, margin: '24px 0' }} />
          <div style={{ width: 280, flex: 'none', padding: 28, boxSizing: 'border-box', display: 'grid', placeItems: 'center' }}>
            {p.photo ? (
              <div style={{ width: 224, height: 274, borderRadius: 18, overflow: 'hidden', background: p.accent2, position: 'relative' }}>
                <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'luminosity', filter: 'contrast(1.2)' }} />
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${hexA(p.background, 0.35)} 1.4px, transparent 1.8px)`, backgroundSize: '7px 7px' }} />
              </div>
            ) : (
              // pixel "barcode" when there's no photo
              <div style={{ display: 'flex', gap: 6, height: 250, alignItems: 'stretch' }}>
                {Array.from({ length: 16 }, (_, i) => (
                  <span key={i} style={{ width: [6, 10, 4, 12][Math.floor(rand(i * 5.3) * 4)], background: i % 5 === 2 ? p.accent : p.textColor, opacity: 0.9 }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RSVP pill */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: CTA_TOP, display: 'flex', justifyContent: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 24,
              height: 104,
              padding: '0 12px 0 48px',
              borderRadius: 104,
              background: p.accent,
              boxShadow: `0 0 ${50 + 20 * Math.sin(frame / 10)}px ${hexA(p.accent, 0.5)}`,
              scale: String(ctaIn),
              opacity: clamp(ctaIn * 2),
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontFamily: FONTS.rubikmono, fontSize: 38, color: p.background, textTransform: 'uppercase' }}>{p.cta}</span>
            <span style={{ width: 80, height: 80, borderRadius: '50%', background: p.background }} />
          </span>
        </div>
      </AbsoluteFill>

      {/* Strobe: scanline bars + white-hot bloom */}
      <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: strobe * 0.55 }}>
        {Array.from({ length: 22 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: (i / 22) * H, height: 12 + (i % 4) * 10, background: i % 6 === 3 ? p.accent2 : p.accent }} />
        ))}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 35%, ${hexA('#ffffff', strobe * 0.5)} 0%, ${hexA(p.accent, strobe * 0.35)} 30%, transparent 70%)`, mixBlendMode: 'screen' }} />
      <FilmOverlay grain={0.06} vignette={0.45} frame={frame} />
    </AbsoluteFill>
  );
}
