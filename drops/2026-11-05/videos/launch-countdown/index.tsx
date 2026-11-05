import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, num, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Launch Countdown',
  category: 'countdown',
  description: 'Vertical story countdown for a launch live stream: huge CRT digits tick down inside a ring of 32 draining dashes, then the screen flashes to “We’re live” with the host and the stream link.',
  tags: ['countdown', 'live', 'launch', 'story', 'vertical', 'terminal'],
};

// 60 fps on a 120 BPM grid: one second = 2 beats. 10 s = 5 bars.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text().default('Mycel Live · launch stream'),
  title: text().default('Mycel 2.0 Live'),
  date: text().default('Thu 20 Nov · 10:00 PT'),
  countFrom: num(3, 7, 1, 'Count from').default(5),
  liveText: text('Hit text').default("WE'RE LIVE"),
  hostName: text('Host name').default('Priya Raman'),
  hostRole: text('Host role').default('CEO, Mycel'),
  hostImage: image('Host photo (optional)').default(''),
  cta: text('Call to action').default('Watch now → mycel.ai/live'),
  font: font('Digit font').default('vt323'),
  background: color().default('#0E1A14'),
  surface: color('Panels').default('#18291F'),
  accent: color().default('#B5E550'),
  accent2: color('Secondary').default('#4E8A5B'),
  pop: color('Live').default('#FF9F43'),
  textColor: color('Text').default('#EAF2DC'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  ember: { accent: '#FF9F43', pop: '#B5E550', accent2: '#8A4B1F', background: '#1A0F08', surface: '#2B1A0E', textColor: '#FFEEDD' },
  acid: { background: '#0B0B0B', surface: '#1A1A1A', accent: '#C6FF00', accent2: '#FF00E5', pop: '#00F0FF', textColor: '#F0FFE0', font: 'pressstart' },
  'black-friday': { eyebrow: 'Black Friday · autopilot', title: 'BFCM goes live', date: 'Fri 28 Nov · 00:00 ET', liveText: 'ADS ARE LIVE', countFrom: 3, cta: 'Watch the spend → mycel.ai/bfcm', hostName: 'Mycel Agent', hostRole: 'running 32 platforms' },
};

type P = z.infer<typeof schema>;

const SEGMENTS = 32;
const START = T.beats(2); // first digit lands on beat 3

export default function LaunchCountdown(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const cx = W / 2;
  const cy = H * 0.49;
  const n = p.countFrom;
  const SEC = T.beats(2);
  const HIT = START + n * SEC;
  const END = video.durationInFrames;

  const idx = Math.floor((frame - START) / SEC); // 0..n-1 while counting
  const counting = frame >= START && frame < HIT;
  const digit = n - idx;
  const tickAt = START + idx * SEC;
  const local = frame - tickAt;

  // Ring drains as time runs out, eased per tick.
  const remaining = frame < START ? 1 : frame >= HIT ? 0 : (n - idx - prog(frame, tickAt + SEC - 20, 20, ease.inOut)) / n;
  const lit = remaining * SEGMENTS;

  const flash = keys(frame, [HIT - 2, HIT + 2, HIT + 30], [0, 1, 0], [ease.out, ease.outSoft]);
  const shock = prog(frame, HIT, 60, ease.out);
  const shake = frame >= HIT && frame < HIT + 14 ? (rand(frame) - 0.5) * 18 * (1 - (frame - HIT) / 14) : counting && local < 6 ? (rand(frame) - 0.5) * 6 : 0;
  const push = mix(1, 1.06, prog(frame, 0, END, ease.inOutSoft));
  const outro = prog(frame, END - 36, 36, ease.in);
  const live = frame >= HIT;
  const headIn = prog(frame, 6, 30, ease.out);
  const R = 400;

  const digitSize = p.font === 'pressstart' ? 380 : 640;
  const liveSize = p.font === 'pressstart' ? 110 : p.liveText.length > 10 ? 210 : 250;
  const initials = p.hostName.split(' ').map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.mono }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: 0.08, size: 40, y: -frame * 0.2, color: '181,229,80' }}
        lift={hexA(p.accent, 0.06)}
        glows={[
          { x: cx, y: cy, size: mix(1000, 1700, live ? shock : 0) + Math.sin(frame / 20) * 40, color: hexA(live ? p.pop : p.accent, 0.3), opacity: 0.8 },
          { x: cx - 380, y: H * 0.18, size: 900, color: hexA(p.accent2, 0.45), opacity: 0.7 },
          { x: cx + 360, y: H * 0.86, size: 1000, color: hexA(p.accent2, 0.35), opacity: 0.7 },
        ]}
        grain={0}
        vignette={0.55}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.6}px`, opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={70} color={p.accent} seed={3} speed={live ? 1.6 : 0.8} opacity={0.45} maxSize={5} />

        {/* ── Header ── */}
        <div style={{ position: 'absolute', left: 90, right: 90, top: 190, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 16, fontFamily: FONTS.silkscreen, fontSize: 32, letterSpacing: '0.24em', textTransform: 'uppercase', color: p.accent, opacity: headIn, translate: `0 ${(1 - headIn) * 20}px` }}>
            <span style={{ width: 18, height: 18, borderRadius: '50%', background: p.pop, boxShadow: `0 0 20px ${p.pop}`, opacity: live ? (Math.floor(frame / 15) % 2 ? 0.3 : 1) : 0.9 }} />
            {p.eyebrow}
          </div>
          <SweepReveal frame={frame} start={12} dur={34} style={{ marginTop: 26 }}>
            <div style={{ ...displayFace(p.font === 'pressstart' ? 'pressstart' : 'vt323'), fontSize: p.font === 'pressstart' ? 64 : p.title.length > 14 ? 128 : 150, lineHeight: 0.95, textShadow: `0 0 40px ${hexA(p.accent, 0.35)}` }}>{p.title}</div>
          </SweepReveal>
          <div style={{ marginTop: 24, fontSize: 48, opacity: 0.85 * prog(frame, 26, 24) }}>{p.date}</div>
        </div>

        {/* ── Ring of 32 dashes ── */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: SEGMENTS }, (_, i) => {
            const a = (i / SEGMENTS) * Math.PI * 2 - Math.PI / 2;
            const on = clamp(lit - i);
            const appear = prog(frame, 10 + i * 1.2, 16, ease.out);
            const r1 = R * (live ? mix(1, 1.6, shock) : 1);
            const r2 = r1 + (live ? mix(46, 10, shock) : 46);
            const col = live ? p.pop : on > 0 ? p.accent : hexA(p.textColor, 0.14);
            return (
              <line
                key={i}
                x1={cx + Math.cos(a) * r1}
                y1={cy + Math.sin(a) * r1}
                x2={cx + Math.cos(a) * r2}
                y2={cy + Math.sin(a) * r2}
                stroke={col}
                strokeWidth={14}
                strokeLinecap="round"
                opacity={appear * (live ? 1 - shock : 0.35 + on * 0.65)}
                style={on > 0 && !live ? { filter: `drop-shadow(0 0 8px ${hexA(p.accent, 0.8)})` } : undefined}
              />
            );
          })}
          <circle cx={cx} cy={cy} r={R - 40} fill="none" stroke={hexA(p.accent2, 0.6)} strokeWidth={2} strokeDasharray="4 12" opacity={live ? 0 : 0.7} />
          {/* per-tick shockwave, starting outside the digit */}
          {counting && <circle cx={cx} cy={cy} r={R + 64 + prog(frame, tickAt, 30) * 20} fill="none" stroke={p.accent} strokeWidth={mix(6, 0.5, prog(frame, tickAt, 30))} opacity={(1 - prog(frame, tickAt, 30)) * 0.55} />}
          {/* hold: an ember halo that breathes on the beat */}
          {live && frame > HIT + 30 && (
            <circle cx={cx} cy={cy} r={R * 0.95 + Math.sin(((frame - HIT) / T.beat) * Math.PI) ** 2 * 26} fill="none" stroke={p.pop} strokeWidth={3} opacity={0.45 * prog(frame, HIT + 30, 30)} strokeDasharray="2 14" />
          )}
          {live && <circle cx={cx} cy={cy} r={R * 1.1 + shock * 900} fill="none" stroke={p.pop} strokeWidth={mix(14, 1, shock)} opacity={(1 - shock) * 0.85} />}
        </svg>

        {/* T-minus label */}
        <div style={{ position: 'absolute', width: W, top: cy + R + 98, textAlign: 'center', fontFamily: FONTS.silkscreen, fontSize: 34, letterSpacing: '0.4em', color: hexA(p.textColor, 0.7), opacity: (1 - prog(frame, HIT, 12)) * prog(frame, 20, 20) }}>
          T-MINUS 00:0{counting ? digit : frame < START ? n : 0}
        </div>

        {/* Pre-roll: a blinking cursor in the ring */}
        {frame < START && (
          <div style={{ position: 'absolute', left: cx - 50, top: cy - 90, width: 100, height: 180, background: p.accent, opacity: Math.floor(frame / 15) % 2 ? 0.15 : 0.95, boxShadow: `0 0 40px ${p.accent}` }} />
        )}

        {/* Digits: blur-scale in on each second, scanline roll, out before the next */}
        {counting && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              translate: `0 ${cy - H / 2}px`,
            }}
          >
            <div
              style={{
                position: 'relative',
                ...displayFace(p.font),
                fontSize: digitSize,
                lineHeight: 1,
                color: digit === 1 ? p.pop : p.accent,
                textShadow: `0 0 60px ${hexA(digit === 1 ? p.pop : p.accent, 0.6)}`,
                scale: String(mix(1.3, 1, prog(frame, tickAt, 12, ease.out)) * mix(1, 0.9, prog(frame, tickAt + SEC - 10, 10, ease.in))),
                opacity: prog(frame, tickAt, 8) * (1 - prog(frame, tickAt + SEC - 8, 8, ease.in)),
                filter: `blur(${mix(16, 0, prog(frame, tickAt, 12)) + prog(frame, tickAt + SEC - 10, 10) * 12}px)`,
                overflow: 'hidden',
                padding: '0 20px',
              }}
            >
              {digit}
              {/* CRT roll bar sweeping down the digit */}
              <div style={{ position: 'absolute', left: 0, right: 0, height: 90, top: `${mix(-20, 110, prog(frame, tickAt, 26, ease.inOut))}%`, background: `linear-gradient(180deg, transparent, ${hexA('#ffffff', 0.35)}, transparent)`, mixBlendMode: 'plus-lighter' }} />
            </div>
          </div>
        )}

        {/* ── Hit: WE'RE LIVE ── */}
        <Streaks frame={frame} start={HIT} dur={50} direction="out" count={170} width={W} height={H} cx={cx} cy={cy} seed={7} intensity={1.1} color={p.pop} highlight="#ffffff" />
        {live && (
          <>
            <SweepReveal frame={frame} start={HIT} dur={26} blur={20} scaleFrom={1.25} style={{ position: 'absolute', width: W, top: cy - liveSize * 0.95, textAlign: 'center' }}>
              <div style={{ ...displayFace(p.font), fontSize: liveSize, lineHeight: 0.9, color: p.textColor, textShadow: `0 0 60px ${hexA(p.pop, 0.6)}` }}>
                {p.liveText.split(' ').map((w, i) => (
                  <div key={i} style={{ color: i === p.liveText.split(' ').length - 1 ? p.pop : p.textColor }}>{w}</div>
                ))}
              </div>
            </SweepReveal>
            {/* stream timer counting up from zero */}
            <div style={{ position: 'absolute', width: W, top: cy + R * 0.62, display: 'flex', justifyContent: 'center', opacity: prog(frame, HIT + 18, 16) }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 26px', borderRadius: 8, background: hexA(p.pop, 0.14), border: `2px solid ${hexA(p.pop, 0.6)}`, fontFamily: FONTS.silkscreen, fontSize: 38, letterSpacing: '0.12em', color: p.pop, whiteSpace: 'nowrap' }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: p.pop, opacity: Math.floor(frame / 30) % 2 ? 0.25 : 1, boxShadow: `0 0 16px ${p.pop}` }} />
                LIVE 00:00:{String(Math.floor((frame - HIT) / FPS)).padStart(2, '0')}
              </div>
            </div>
            <Glint frame={frame} start={HIT + T.bars(1)} dur={40} style={{ position: 'absolute', width: W, top: cy - liveSize * 0.95, textAlign: 'center', ...displayFace(p.font), fontSize: liveSize, lineHeight: 0.9 }}>
              {p.liveText.split(' ').map((w, i) => (
                <div key={i}>{w}</div>
              ))}
            </Glint>
          </>
        )}

        {/* ── Host chip (always) + CTA (after the hit) ── */}
        <div style={{ position: 'absolute', left: 90, right: 90, top: H - 420, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 26,
              padding: '20px 36px 20px 20px',
              borderRadius: 999,
              background: hexA(p.surface, 0.92),
              border: `2px solid ${hexA(p.accent, 0.3)}`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              opacity: prog(frame, 40, 24),
              translate: `0 ${(1 - prog(frame, 40, 30)) * 30}px`,
            }}
          >
            <div style={{ position: 'relative', width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', background: p.accent2, display: 'grid', placeItems: 'center', flex: 'none', boxShadow: `0 0 0 4px ${live ? p.pop : p.accent}` }}>
              {p.hostImage ? <Img src={p.hostImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ ...displayFace('vt323'), fontSize: 60, color: p.textColor }}>{initials}</span>}
            </div>
            <div>
              <div style={{ fontSize: 46, fontWeight: 700, lineHeight: 1.1 }}>{p.hostName}</div>
              <div style={{ fontFamily: FONTS.silkscreen, fontSize: 24, letterSpacing: '0.14em', textTransform: 'uppercase', color: p.accent, marginTop: 6 }}>{p.hostRole}</div>
            </div>
          </div>
          {live ? (
            <div
              style={{
                fontWeight: 700,
                fontSize: 44,
                padding: '24px 44px',
                borderRadius: 12,
                color: p.background,
                background: p.accent,
                boxShadow: `8px 8px 0 ${p.accent2}, 0 0 60px ${hexA(p.accent, 0.35)}`,
                whiteSpace: 'nowrap',
                scale: String(Math.max(0.001, prog(frame, HIT + T.beats(2), 24, ease.backOut))),
                opacity: clamp(prog(frame, HIT + T.beats(2), 8)),
              }}
            >
              {p.cta}
            </div>
          ) : (
            <WordsIn text="Set a reminder — the stream starts on zero." frame={frame} start={56} style={{ justifyContent: 'center', fontSize: 40, opacity: 0.75, textAlign: 'center' }} />
          )}
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 49%, ${hexA('#ffffff', flash * 0.85)} 0%, ${hexA(p.pop, flash * 0.55)} 30%, transparent 65%)`, mixBlendMode: 'screen' }} />
      <AbsoluteFill style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 2px, transparent 2px, transparent 6px)', pointerEvents: 'none' }} />
      <FilmOverlay grain={0.06} vignette={0.4} frame={frame} />
    </AbsoluteFill>
  );
}
