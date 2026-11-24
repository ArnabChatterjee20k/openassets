import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, clamp, ease, hexA, keys, mix, prog, rand, tempo, typed } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Live Demo Invite',
  category: 'event',
  description:
    'Event invite for a live product demo: a CRT boots, a command types, the well-plate grid flashes alive and the event title glitches in; date, time and place type on the beat beside a speaker card, then the RSVP pops.',
  tags: ['event', 'webinar', 'demo day', 'invite', 'terminal'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30 frames, bar = 120
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  command: text('Boot command').default('benchwire live --join'),
  eyebrow: text().default('Live demo · Robots run your protocol'),
  title1: text('Title line 1').default('BENCHWIRE'),
  title2: text('Title line 2').default('LIVE'),
  edition: text('Edition').default('03'),
  subtitle: textarea().default('Design an ELISA titration in chat. Watch our Basel robots run it live.'),
  dateLabel: text().default('Date'),
  date: text().default('Thu 11 Dec 2026'),
  timeLabel: text().default('Time'),
  time: text().default('17:00 CET · 45 min'),
  placeLabel: text().default('Where'),
  place: text().default('Online + Basel lab tour'),
  speaker: text().default('Dr. Ines Albrecht'),
  role: text().default('Head of Automation'),
  cta: text('Call to action').default('RSVP → benchwire.bio/live'),
  photo: image('Speaker photo (optional)').default(''),
  background: color().default('#0D1B1E'),
  surface: color('Panel').default('#16302F'),
  textColor: color('Text').default('#EAF4EF'),
  accent: color('Live').default('#D4FF3A'),
  accent2: color('Grid').default('#3FA7A0'),
  pop: color('REC dot').default('#FF5A36'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'deep-sea': { background: '#021B26', surface: '#06303F', textColor: '#E6FFFA', accent: '#2EF2C4', accent2: '#1B7FA6', pop: '#FF7A59' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', textColor: '#EAF2FF', accent: '#FFDD00', accent2: '#7FB2FF', pop: '#FF5A36', edition: '04', date: 'Thu 22 Jan 2027' },
  acid: {
    background: '#0B0B0B',
    surface: '#1A1A1A',
    textColor: '#F0FFE0',
    accent: '#C6FF00',
    accent2: '#FF00E5',
    pop: '#00F0FF',
    eyebrow: 'Demo night · Basel',
    title2: 'AFTER DARK',
    edition: '',
    place: 'Benchwire Lab, Basel',
    time: '19:00 CET · drinks after',
  },
};

type P = z.infer<typeof schema>;

const HIT = T.bars(1); // downbeat of bar 2
const ROWS_AT = T.bars(2);
const CTA_AT = T.bars(3);
const END = video.durationInFrames;

/** A big grid of wells behind everything; columns light in a wave on the hit, then a read head keeps sweeping. */
function WellField({ frame, p, W, H }: { frame: number; p: P; W: number; H: number }) {
  const pitch = 54;
  const cols = Math.ceil(W / pitch) + 1;
  const rows = Math.ceil(H / pitch) + 1;
  const drift = (frame * 0.2) % pitch;
  const head = ((frame - HIT) / 3) % (cols + 18);
  const dots = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const wave = clamp(1 - Math.abs((frame - HIT) * 1.2 - c * 1.6 - r * 0.4) / 10);
      const lit = frame >= HIT && rand(c * 31 + r * 7) > 0.86;
      const sweep = frame >= HIT ? clamp(1 - Math.abs(head - c) / 2.5) * (rand(c * 3 + r * 11) > 0.55 ? 1 : 0) : 0;
      const a = Math.max(wave * 0.9, sweep * 0.3, lit ? 0.26 + 0.1 * Math.sin(frame / 20 + c) : 0);
      dots.push(
        <circle key={`${c}-${r}`} cx={c * pitch + 27 - drift} cy={r * pitch + 27} r={a > 0.05 ? 7 : 6} fill={a > 0.05 ? hexA(p.accent, a) : 'none'} stroke={hexA(p.accent2, 0.22)} strokeWidth={1.4} />,
      );
    }
  }
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, maskImage: 'radial-gradient(ellipse 75% 70% at 60% 50%, black 30%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 60% 50%, black 30%, transparent 100%)' }}>
      {dots}
    </svg>
  );
}

/** RGB-split glitch that settles: three copies offset in the accent2/pop colours, with random dropouts. */
function GlitchText({ frame, start, style, children, p }: { frame: number; start: number; style: CSSProperties; children: string; p: P }) {
  const t = prog(frame, start, 26, ease.out);
  if (frame < start) return null;
  const jitter = (1 - t) * 34 * (rand(Math.floor(frame / 2) + start) - 0.3);
  const visible = t > 0.25 || rand(Math.floor(frame / 2) * 3.1) > 0.35;
  const slice = (1 - t) * 18;
  return (
    <div style={{ position: 'relative', opacity: visible ? 1 : 0.15 }}>
      {t < 1 && (
        <>
          <div style={{ ...style, position: 'absolute', inset: 0, color: p.accent2, translate: `${jitter}px 0`, mixBlendMode: 'screen', opacity: 0.85 }}>{children}</div>
          <div style={{ ...style, position: 'absolute', inset: 0, color: p.pop, translate: `${-jitter * 0.8}px ${slice * 0.2}px`, mixBlendMode: 'screen', opacity: 0.7 }}>{children}</div>
        </>
      )}
      <div style={{ ...style, position: 'relative', clipPath: t < 1 ? `inset(${slice}% 0 ${slice * 0.6}% 0)` : undefined, filter: t < 0.9 ? `blur(${(1 - t) * 4}px)` : undefined }}>{children}</div>
    </div>
  );
}

function Row({ frame, at, label, value, p }: { frame: number; at: number; label: string; value: string; p: P }) {
  if (!value) return null;
  const t = prog(frame, at, 16, ease.out);
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 28, opacity: t, translate: `${mix(-30, 0, t)}px 0` }}>
      <span style={{ width: 150, fontFamily: FONTS.silkscreen, fontSize: 26, letterSpacing: '0.2em', textTransform: 'uppercase', color: p.accent }}>{label}</span>
      <span style={{ fontFamily: FONTS.mono, fontSize: 46, color: p.textColor, whiteSpace: 'nowrap' }}>
        {typed(frame, at + 2, FPS, 34, value)}
        {frame >= at && frame < at + 40 && <span style={{ color: p.accent }}>█</span>}
      </span>
    </div>
  );
}

export default function LiveDemoInvite(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();

  // CRT on / off
  const on = prog(frame, 0, 18, ease.out);
  const offY = prog(frame, END - 30, 14, ease.in);
  const offX = prog(frame, END - 16, 12, ease.in);
  const crtY = Math.max(0.004, on * (1 - offY));
  const crtX = Math.max(0.002, 1 - offX);
  const crtGlow = keys(frame, [0, 10, 26], [1, 0.8, 0]) + keys(frame, [END - 30, END - 14, END], [0, 0.9, 1]);

  const flash = keys(frame, [HIT - 2, HIT + 2, HIT + 28], [0, 1, 0], [ease.out, ease.outSoft]);
  const shock = prog(frame, HIT, 60, ease.out);
  const shake = frame >= HIT && frame < HIT + 14 ? (1 - (frame - HIT) / 14) * 8 * Math.sin(frame * 2.3) : 0;
  const push = mix(1, 1.04, prog(frame, HIT, END - HIT, ease.inOutSoft));

  // Command: big in the centre during bar 1, then docks top-left as a status line.
  const dock = prog(frame, HIT - 26, 24, ease.inOut);
  const cmdSize = mix(72, 28, dock);
  const cmdX = mix(W / 2 - 520, 140, dock);
  const cmdY = mix(H / 2 - 40, 96, dock);
  const cursorOn = Math.floor(frame / 15) % 2 === 0;

  const titleStyle: CSSProperties = { fontFamily: FONTS.vt323, fontSize: 196, lineHeight: 0.86, letterSpacing: '0', whiteSpace: 'nowrap', color: p.textColor };
  const glint = { ...titleStyle, position: 'absolute' as const, inset: 0 };

  const cardX = 1250;
  const cardW = 520;
  const cardT = prog(frame, HIT + T.beats(2), 30, ease.out);
  const ctaT = prog(frame, CTA_AT, 26, ease.backOut);
  const rec = Math.floor(frame / 30) % 2 === 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#050A0B' }}>
      <AbsoluteFill style={{ scale: `${crtX} ${crtY}`, filter: crtGlow > 0.02 ? `brightness(${1 + crtGlow * 2})` : undefined }}>
        <Backdrop
          base={p.background}
          frame={frame}
          grid={false}
          glows={[
            { x: W * 0.68, y: H * 0.45, size: 1400, color: hexA(p.accent2, 0.4), opacity: 0.55 + 0.15 * Math.sin(frame / 40) },
            { x: W * 0.2, y: H * 0.85, size: 1200, color: hexA(p.accent, 0.18), opacity: keys(frame, [0, HIT, HIT + 40, END], [0.2, 1, 0.6, 0.5]) },
          ]}
          grain={0}
          vignette={0.5}
        />
        <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.4}px` }}>
          <WellField frame={frame} p={p} W={W} H={H} />
          <Dust frame={frame} width={W} height={H} count={40} color={p.accent} seed={9} speed={0.6} opacity={0.3} maxSize={4} />

          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <circle cx={W / 2} cy={H / 2} r={120 + shock * 1300} fill="none" stroke={p.accent} strokeWidth={mix(8, 1, shock)} opacity={frame >= HIT ? (1 - shock) * 0.7 : 0} />
          </svg>

          {/* status / command line */}
          <div style={{ position: 'absolute', left: cmdX, top: cmdY, fontFamily: FONTS.mono, fontSize: cmdSize, color: p.textColor, whiteSpace: 'nowrap', opacity: frame < 8 ? 0 : 1 }}>
            <span style={{ color: p.accent }}>$ </span>
            {typed(frame, 20, FPS, 22, p.command)}
            <span style={{ color: p.accent, opacity: cursorOn || frame < HIT ? 1 : 0 }}>█</span>
            {frame >= HIT && (
              <span style={{ marginLeft: 24, fontFamily: FONTS.silkscreen, fontSize: cmdSize * 0.8, letterSpacing: '0.2em', color: p.accent2, opacity: prog(frame, HIT + 20, 20) }}>
                CONNECTED · 1,204 WAITING
              </span>
            )}
          </div>
          {frame >= HIT && (
            <div style={{ position: 'absolute', right: 140, top: 96, display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONTS.silkscreen, fontSize: 24, letterSpacing: '0.24em', color: p.textColor, opacity: prog(frame, HIT + 10, 20) }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: p.pop, opacity: rec ? 1 : 0.25, boxShadow: `0 0 18px ${p.pop}` }} />
              LIVE
            </div>
          )}

          {/* left column */}
          <div style={{ position: 'absolute', left: 140, top: 180, width: 1080 }}>
            {frame >= HIT && (
              <div style={{ fontFamily: FONTS.silkscreen, fontSize: 28, letterSpacing: '0.26em', textTransform: 'uppercase', color: p.accent, opacity: prog(frame, HIT + 8, 20), translate: `0 ${mix(14, 0, prog(frame, HIT + 8, 24))}px` }}>
                {p.eyebrow}
              </div>
            )}
            <div style={{ position: 'relative', marginTop: 26 }}>
              <GlitchText frame={frame} start={HIT} style={titleStyle} p={p}>
                {p.title1}
              </GlitchText>
              {frame >= HIT + T.beats(5) && <Glint frame={frame} start={HIT + T.beats(5)} dur={40} style={glint}>{p.title1}</Glint>}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 36 }}>
              <GlitchText frame={frame} start={HIT + 6} style={titleStyle} p={p}>
                {p.title2}
              </GlitchText>
              {p.edition && (
                <GlitchText frame={frame} start={HIT + 12} style={{ ...titleStyle, color: p.accent, textShadow: `0 0 40px ${hexA(p.accent, 0.6)}` }} p={p}>
                  {p.edition}
                </GlitchText>
              )}
            </div>
            <div style={{ marginTop: 22, maxWidth: 1040, fontFamily: FONTS.mono, fontSize: 44, lineHeight: 1.4, color: p.textColor, opacity: prog(frame, HIT + 30, 24) * 0.85, translate: `0 ${mix(20, 0, prog(frame, HIT + 30, 30))}px` }}>
              {p.subtitle}
            </div>
            <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Row frame={frame} at={ROWS_AT} label={p.dateLabel} value={p.date} p={p} />
              <Row frame={frame} at={ROWS_AT + T.beat} label={p.timeLabel} value={p.time} p={p} />
              <Row frame={frame} at={ROWS_AT + T.beats(2)} label={p.placeLabel} value={p.place} p={p} />
            </div>
          </div>

          {/* speaker card */}
          <div
            style={{
              position: 'absolute',
              left: cardX,
              top: 200,
              width: cardW,
              opacity: cardT,
              translate: `${mix(60, 0, cardT)}px 0`,
              filter: cardT < 1 ? `blur(${(1 - cardT) * 10}px)` : undefined,
            }}
          >
            <div style={{ position: 'relative', width: cardW, height: 470, background: p.surface, border: `2px solid ${hexA(p.accent2, 0.7)}`, boxShadow: `14px 16px 0 ${hexA('#000000', 0.45)}, 0 0 80px ${hexA(p.accent2, 0.25)}`, overflow: 'hidden' }}>
              {p.photo ? (
                <>
                  <Img src={p.photo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.15)', scale: String(mix(1.08, 1, prog(frame, HIT, END - HIT, ease.inOutSoft))) }} />
                  <div style={{ position: 'absolute', inset: 0, background: p.accent2, mixBlendMode: 'multiply', opacity: 0.75 }} />
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 50%, ${hexA(p.background, 0.7)})` }} />
                </>
              ) : (
                <MiniPlate frame={frame} p={p} w={cardW} h={470} />
              )}
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(0deg, ${hexA('#000000', 0.22)} 0 2px, transparent 2px 5px)` }} />
              <div style={{ position: 'absolute', left: 22, top: 20, fontFamily: FONTS.silkscreen, fontSize: 20, letterSpacing: '0.2em', color: p.accent, background: hexA(p.background, 0.7), padding: '6px 10px' }}>CAM 02 · HOST</div>
            </div>
            <div style={{ marginTop: 24, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 44, color: p.textColor, whiteSpace: 'nowrap' }}>{p.speaker}</div>
            <div style={{ marginTop: 6, fontFamily: FONTS.silkscreen, fontSize: 24, letterSpacing: '0.2em', textTransform: 'uppercase', color: p.accent2 }}>{p.role}</div>
          </div>

          {/* CTA */}
          {p.cta && (
            <div style={{ position: 'absolute', right: 150, top: 850, display: 'flex' }}>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontWeight: 700,
                  fontSize: 40,
                  padding: '22px 34px',
                  color: p.background,
                  background: p.accent,
                  boxShadow: `10px 12px 0 ${hexA(p.accent2, 0.6)}, 0 0 60px ${hexA(p.accent, 0.35)}`,
                  whiteSpace: 'nowrap',
                  scale: String(ctaT),
                  opacity: clamp(prog(frame, CTA_AT, 8)),
                }}
              >
                {'> '}
                {p.cta}
              </div>
            </div>
          )}
        </AbsoluteFill>

        {/* scanlines + roll bar */}
        <AbsoluteFill style={{ backgroundImage: `repeating-linear-gradient(0deg, ${hexA('#000000', 0.2)} 0 2px, transparent 2px 5px)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, height: 220, top: ((frame * 6) % (H + 440)) - 220, background: `linear-gradient(180deg, transparent, ${hexA(p.textColor, 0.04)}, transparent)` }} />
        <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${hexA('#ffffff', flash * 0.8)} 0%, ${hexA(p.accent, flash * 0.5)} 25%, transparent 65%)`, mixBlendMode: 'screen' }} />
        <FilmOverlay grain={0.06} vignette={0.5} frame={frame} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

/** Fallback when no photo: a live mini plate being read, with a crosshair. */
function MiniPlate({ frame, p, w, h }: { frame: number; p: P; w: number; h: number }) {
  const cols = 12;
  const rows = 8;
  const pitch = Math.min((w - 60) / cols, (h - 60) / rows);
  const ox = (w - pitch * (cols - 1)) / 2;
  const oy = (h - pitch * (rows - 1)) / 2 + 10;
  const done = Math.floor(Math.max(0, frame - HIT) / 4);
  const cur = done % (cols * rows);
  const cc = Math.floor(cur / rows);
  const cr = cur % rows;
  return (
    <svg width={w} height={h} style={{ position: 'absolute', inset: 0 }}>
      {Array.from({ length: cols * rows }, (_, i) => {
        const c = Math.floor(i / rows);
        const r = i % rows;
        const lit = i < cur;
        return <circle key={i} cx={ox + c * pitch} cy={oy + r * pitch} r={pitch * 0.32} fill={lit ? p.accent : 'none'} opacity={lit ? 0.85 : 1} stroke={hexA(p.accent2, 0.7)} strokeWidth={2} />;
      })}
      <circle cx={ox + cc * pitch} cy={oy + cr * pitch} r={pitch * 0.5} fill="none" stroke={p.pop} strokeWidth={3} />
      <line x1={ox + cc * pitch} y1={0} x2={ox + cc * pitch} y2={h} stroke={hexA(p.pop, 0.45)} strokeWidth={1.5} />
      <line x1={0} y1={oy + cr * pitch} x2={w} y2={oy + cr * pitch} stroke={hexA(p.pop, 0.45)} strokeWidth={1.5} />
    </svg>
  );
}
