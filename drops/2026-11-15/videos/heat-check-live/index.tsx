import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, WordsIn, clamp, displayFace, ease, gradientText, hexA, keys, mix, prog, tempo, typed } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Heat Check Live',
  category: 'event',
  description: 'Live-workshop invite in a magazine-cover style: heat strip and folio build, the title lands huge in italic serif on the downbeat, then the speaker card, agenda, date slam and save-your-seat CTA.',
  tags: ['event', 'webinar', 'workshop', 'live', 'invite', 'editorial'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120. Five bars = 10 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  folio: text('Folio line').default('Firebrand Live · Workshop 04'),
  chip: text('Chip').default('Live workshop'),
  title: text().default('Heat Check'),
  subtitle: text().default('How an AI agent runs your ads on 34 platforms'),
  agenda1: text('Agenda 1').default('Reading channel heat in real time'),
  agenda2: text('Agenda 2').default('Hourly budget rebalancing, live'),
  agenda3: text('Agenda 3').default('Q&A: build your Black Friday plan'),
  speakerName: text('Speaker').default('Maya Okafor'),
  speakerRole: text('Speaker role').default('Head of Growth, Firebrand'),
  speakerPhoto: image('Speaker photo (optional)').default(''),
  date: text().default('Dec 3'),
  time: text().default('11:00 ET · 45 min · Free'),
  cta: text('Call to action').default('Save your seat'),
  url: text('URL').default('firebrand.ai/live'),
  font: font('Display font').default('dmserif'),
  background: color().default('#1A0A06'),
  surface: color('Card').default('#2E120B'),
  textColor: color('Text').default('#FFEDE0'),
  accent: color().default('#FF4D00'),
  accent2: color('Heat top').default('#FFB000'),
  pop: color('Live dot').default('#FF2E63'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  cherry: { background: '#2A0A10', surface: '#3F1019', textColor: '#FFE8E0', accent: '#E3173E', accent2: '#F7B32B', pop: '#F5C6AA' },
  'ink-gold': { background: '#0D0D0F', surface: '#1C1C20', textColor: '#F3EDE2', accent: '#C9A45C', accent2: '#E8D9B5', pop: '#E3173E', font: 'bodoni', title: 'The Spend Salon', chip: 'Invite only' },
  acid: { background: '#0B0B0B', surface: '#1A1A1A', textColor: '#F0FFE0', accent: '#C6FF00', accent2: '#00F0FF', pop: '#FF00E5', font: 'anton', title: 'HEAT CHECK', date: 'Jan 14', agenda3: 'Q&A: your Q1 launch plan' },
};

type P = z.infer<typeof schema>;

const BAR2 = T.bars(1);
const BAR3 = T.bars(2);
const BAR4 = T.bars(3);
const BAR5 = T.bars(4);
const END = T.bars(5);

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

function SpeakerCard({ p, frame }: { p: P; frame: number }) {
  const t = prog(frame, BAR3 + 6, 40, ease.out);
  const x = 1190;
  const y = 196;
  const w = 610;
  const ph = 430;
  const thermal = `linear-gradient(160deg, ${p.accent2} 0%, ${p.accent} 55%, ${p.background} 120%)`;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        opacity: clamp(t * 1.3),
        translate: `${mix(140, 0, t)}px ${Math.sin(frame / 50) * 4}px`,
        rotate: `${mix(4, 0, t)}deg`,
        filter: t < 1 ? `blur(${(1 - t) * 14}px)` : undefined,
      }}
    >
      <div style={{ position: 'relative', width: w, height: ph, borderRadius: 18, overflow: 'hidden', background: thermal, boxShadow: `0 40px 90px rgba(0,0,0,0.55), 0 0 0 1px ${hexA(p.accent2, 0.35)}` }}>
        {p.speakerPhoto ? (
          <>
            {/* Duotone heat treatment: grayscale photo multiplied onto the thermal gradient */}
            <Img src={p.speakerPhoto} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.15)', mixBlendMode: 'multiply', scale: String(mix(1.08, 1, prog(frame, BAR3, 300, ease.inOutSoft))) }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 55%, ${hexA(p.background, 0.7)})` }} />
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', ...displayFace(p.font, { italic: true }), fontSize: 300, lineHeight: 1, letterSpacing: '-0.05em', color: hexA(p.background, 0.82) }}>{initials(p.speakerName)}</div>
        )}
        <div style={{ position: 'absolute', left: 24, top: 22, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 99, background: hexA(p.background, 0.75), fontFamily: FONTS.mono, fontSize: 20, letterSpacing: '0.24em', textTransform: 'uppercase', color: p.textColor }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.pop, boxShadow: `0 0 12px ${p.pop}` }} />
          Speaker
        </div>
      </div>
      <div style={{ ...displayFace(p.font), fontSize: 60, lineHeight: 1.05, letterSpacing: '-0.02em', marginTop: 26, color: p.textColor, whiteSpace: 'nowrap' }}>{p.speakerName}</div>
      <div style={{ fontFamily: FONTS.mono, fontSize: 24, letterSpacing: '0.2em', textTransform: 'uppercase', color: p.accent2, marginTop: 10, whiteSpace: 'nowrap' }}>{p.speakerRole}</div>
    </div>
  );
}

export default function HeatCheckLive(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();

  const build = prog(frame, 0, BAR2, ease.inSoft);
  const flash = Math.max(keys(frame, [BAR2 - 2, BAR2 + 2, BAR2 + 26], [0, 1, 0], [ease.out, ease.outSoft]), keys(frame, [BAR4 - 2, BAR4 + 2, BAR4 + 20], [0, 0.55, 0], [ease.out, ease.outSoft]));
  const move = prog(frame, BAR3 - 4, 44, ease.inOut); // title docks to the top-left
  const push = mix(1, 1.04, prog(frame, 0, END, ease.inOutSoft));
  const shake = frame >= BAR2 && frame < BAR2 + 14 ? Math.sin(frame * 2.3) * (1 - (frame - BAR2) / 14) * 6 : 0;
  const outro = prog(frame, END - 34, 34, ease.in);

  const TITLE = p.title.length > 12 ? 140 : 180;
  const titleScale = mix(1.5, 1, move);
  const titleTop = mix(300, 186, move);
  // The dock container carries position + scale; SweepReveal sets its own scale inside it.
  const dock: CSSProperties = { position: 'absolute', left: 120, top: titleTop, transformOrigin: 'left top', scale: String(titleScale) };
  const titleBlock: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    ...displayFace(p.font, { italic: true }),
    fontSize: TITLE,
    lineHeight: 1,
    letterSpacing: '-0.035em',
    whiteSpace: 'nowrap',
  };
  const gradient = `linear-gradient(165deg, ${p.textColor} 0%, ${p.textColor} 45%, ${p.accent2} 80%, ${p.accent} 110%)`;
  const mono: CSSProperties = { fontFamily: FONTS.mono, textTransform: 'uppercase', letterSpacing: '0.3em', whiteSpace: 'nowrap' };

  const agenda = [p.agenda1, p.agenda2, p.agenda3].filter(Boolean);
  const dateT = prog(frame, BAR4, 22, ease.backOut);
  const ring = prog(frame, BAR4, 50, ease.out);
  const ctaT = prog(frame, BAR4 + T.beats(2), 26, ease.backOut);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.bricolage }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: 0.05, size: 44, y: -frame * 0.15, color: '255,237,224' }}
        lift={hexA(p.accent, 0.06)}
        glows={[
          { x: W * 0.3, y: H * mix(1.3, 0.95, build), size: 1900, color: hexA(p.accent, 0.5), opacity: 0.75 + 0.15 * Math.sin(frame / 40) },
          { x: W * 0.82, y: H * 0.4, size: 1300, color: hexA(p.accent2, 0.3), opacity: prog(frame, BAR3, 60) * 0.8 },
          { x: W * 0.1, y: H * 0.1, size: 900, color: hexA(p.pop, 0.18), opacity: 0.6 },
        ]}
        grain={0}
        vignette={0.55}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.4}px`, opacity: 1 - outro, filter: outro > 0 ? `blur(${outro * 12}px)` : undefined }}>
        <Dust frame={frame} width={W} height={H} count={60} color={p.accent2} seed={9} speed={mix(0.8, 1.6, build)} opacity={0.55} maxSize={5} />

        {/* Folio + live chip (top-left), page number (top-right) */}
        <div style={{ position: 'absolute', left: 120, top: 92, display: 'flex', alignItems: 'center', gap: 22, ...mono, fontSize: 24, color: p.accent }}>
          <span style={{ width: 70 * prog(frame, 4, 30), height: 3, backgroundImage: `linear-gradient(90deg, ${p.accent}, ${p.accent2})` }} />
          <span>{typed(frame, 10, FPS, 34, p.folio)}</span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 16px',
              borderRadius: 99,
              border: `1px solid ${hexA(p.pop, 0.6)}`,
              background: hexA(p.pop, 0.12),
              color: p.textColor,
              letterSpacing: '0.22em',
              fontSize: 20,
              scale: String(prog(frame, T.beats(2), 20, ease.backOut)),
              opacity: clamp(prog(frame, T.beats(2), 8)),
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.pop, opacity: 0.55 + 0.45 * Math.abs(Math.sin(frame / 14)), boxShadow: `0 0 12px ${p.pop}` }} />
            {p.chip}
          </span>
        </div>
        <div style={{ position: 'absolute', right: 120, top: 92, ...mono, fontSize: 22, opacity: 0.55 * prog(frame, 30, 30) }}>
          {p.date} · {p.url}
        </div>

        {/* Build: heat strip draws across, then becomes the bottom rule */}
        <div style={{ position: 'absolute', left: 120, right: 120, top: H - 92, height: 6, borderRadius: 99, backgroundImage: `linear-gradient(90deg, ${hexA(p.accent, 0.2)}, ${p.accent} 50%, ${p.accent2} 85%, #FFF4DE)`, transformOrigin: 'left center', scale: `${prog(frame, 6, 70, ease.inOutSoft)} 1`, boxShadow: `0 0 24px ${hexA(p.accent, 0.6)}` }} />
        {[0, 0.25, 0.5, 0.75, 1].map((k, i) => (
          <div key={k} style={{ position: 'absolute', left: 120 + (W - 240) * k - 1, top: H - 106, width: 2, height: 34, background: hexA(p.textColor, 0.35), opacity: prog(frame, 20 + i * 6, 16) }} />
        ))}

        {/* Streaks converge during the build, burst on the downbeat */}
        <Streaks frame={frame} start={BAR2 - T.beats(3)} dur={T.beats(3)} direction="in" count={110} width={W} height={H} cx={W * 0.36} cy={H * 0.48} seed={4} intensity={0.45 + build * 0.5} color={p.accent} highlight={p.accent2} />
        <Streaks frame={frame} start={BAR2} dur={46} direction="out" count={170} width={W} height={H} cx={W * 0.36} cy={H * 0.48} seed={12} intensity={1.1} color={p.accent} highlight="#FFF4DE" />

        {/* Title: sweeps in huge on bar 2, docks top-left on bar 3, glints on bar 5 */}
        {/* Build: the heat reading climbs to 100° and hits on the downbeat */}
        {frame < BAR2 + 4 && (
          <div
            style={{
              position: 'absolute',
              left: 120,
              top: 250,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 30,
              opacity: prog(frame, 12, 24) * (1 - prog(frame, BAR2 - 8, 10, ease.in)),
              filter: `blur(${prog(frame, BAR2 - 8, 10, ease.in) * 18}px)`,
              scale: String(mix(1, 1.08, build)),
              transformOrigin: 'left center',
            }}
          >
            <span style={{ ...displayFace(p.font, { italic: true }), fontSize: 400, lineHeight: 1, letterSpacing: '-0.05em', paddingRight: 60, color: 'transparent', WebkitTextStroke: `3px ${hexA(p.accent2, 0.5 + build * 0.5)}`, textShadow: `0 0 ${40 * build}px ${hexA(p.accent, 0.6)}` }}>
              {Math.round(mix(12, 100, prog(frame, 12, BAR2 - 20, ease.inSoft)))}°
            </span>
            <span style={{ ...mono, fontSize: 26, color: p.accent2, marginTop: 90, lineHeight: 1.8 }}>
              Channel heat
              <br />
              <span style={{ color: p.textColor, opacity: 0.6 }}>Rising</span>
            </span>
          </div>
        )}

        {frame >= BAR2 && (
          <div style={dock}>
            <SweepReveal frame={frame} start={BAR2 + 2} dur={32} style={titleBlock}>
              <span style={{ ...gradientText(gradient, TITLE), paddingRight: TITLE * 0.1 }}>{p.title}</span>
            </SweepReveal>
            <Glint frame={frame} start={BAR5} dur={44} style={titleBlock}>
              {p.title}
            </Glint>
          </div>
        )}

        <WordsIn
          text={p.subtitle}
          frame={frame}
          start={BAR2 + 26}
          stagger={4}
          style={{ position: 'absolute', left: 124, width: 1050, top: mix(300 + TITLE * 1.5 + 20, 186 + TITLE + 14, move), fontSize: 44, lineHeight: 1.2, opacity: 0.88 }}
        />

        {/* Agenda: one line per beat on bar 3 */}
        {agenda.map((a, i) => {
          const at = BAR3 + T.beats(1 + i);
          const t = prog(frame, at, 24, ease.out);
          return (
            <div key={i} style={{ position: 'absolute', left: 124, top: 556 + i * 78, display: 'flex', alignItems: 'baseline', gap: 26, opacity: clamp(t * 1.4), translate: `${mix(-30, 0, t)}px 0`, filter: t < 1 ? `blur(${(1 - t) * 8}px)` : undefined }}>
              <span style={{ ...mono, letterSpacing: '0.1em', fontSize: 26, color: p.accent2 }}>0{i + 1}</span>
              <span style={{ width: 46 * t, height: 3, background: p.accent, alignSelf: 'center' }} />
              <span style={{ fontSize: 44, whiteSpace: 'nowrap' }}>{a}</span>
            </div>
          );
        })}

        <SpeakerCard p={p} frame={frame} />

        {/* Date slam on bar 4 with a shock ring */}
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          <circle cx={300} cy={872} r={150 + ring * 620} fill="none" stroke={p.accent2} strokeWidth={mix(6, 0.5, ring)} opacity={frame >= BAR4 ? (1 - ring) * 0.7 : 0} />
        </svg>
        <div style={{ position: 'absolute', left: 120, top: 790, display: 'flex', alignItems: 'center', gap: 36, opacity: clamp(dateT * 2), scale: String(mix(1.5, 1, clamp(dateT))), transformOrigin: 'left center' }}>
          <span style={{ ...displayFace(p.font, { italic: true }), fontSize: 150, lineHeight: 1, letterSpacing: '-0.03em', ...gradientText(`linear-gradient(170deg, #FFF4DE 0%, ${p.accent2} 40%, ${p.accent} 90%)`, 150), paddingBottom: 0, paddingRight: 14 }}>{p.date}</span>
          <span style={{ width: 3, height: 96, background: hexA(p.textColor, 0.3) }} />
          <span style={{ ...mono, letterSpacing: '0.16em', fontSize: 32, color: p.textColor }}>{p.time}</span>
        </div>

        {/* CTA two beats later */}
        <div style={{ position: 'absolute', right: 120, top: 818, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14 }}>
          <div
            style={{
              fontSize: 38,
              fontWeight: 800,
              padding: '22px 40px',
              borderRadius: 999,
              color: p.background,
              background: `linear-gradient(180deg, ${p.accent2}, ${p.accent})`,
              boxShadow: `0 0 0 1px ${hexA('#FFFFFF', 0.25)} inset, 0 18px 50px ${hexA(p.accent, 0.5 + 0.2 * Math.sin(frame / 12))}`,
              whiteSpace: 'nowrap',
              scale: String(ctaT),
              opacity: clamp(prog(frame, BAR4 + T.beats(2), 8)),
            }}
          >
            {p.cta} →
          </div>
          <div style={{ ...mono, fontSize: 24, letterSpacing: '0.22em', opacity: 0.75 * prog(frame, BAR4 + T.beats(3), 20) }}>{p.url}</div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 36% 48%, ${hexA('#FFF4DE', flash)} 0%, ${hexA(p.accent, flash * 0.6)} 24%, transparent 62%)`, mixBlendMode: 'screen' }} />
      <FilmOverlay grain={0.06} vignette={0.45} frame={frame} />
    </AbsoluteFill>
  );
}
