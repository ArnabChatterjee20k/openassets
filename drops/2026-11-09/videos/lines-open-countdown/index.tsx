import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, SweepReveal, clamp, displayFace, ease, hexA, keys, mix, prog, rand, shade, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Lines Open Countdown',
  category: 'countdown',
  description:
    'Launch-day countdown story: a big mid-century rotary dial dials 5-4-3-2-1 on the beat, then a sunburst opens behind it as "Lines are open." lands with the date, host cameo and CTA.',
  tags: ['countdown', 'launch', 'story', 'rotary', 'mid-century', 'event'],
};

// 60 fps, 120 BPM: 1 beat = 30 frames. 5 bars = 10 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text('Handwritten note').default('Patchwell Live · launch day'),
  before: text('Headline while counting').default('Lines open in'),
  after: text('Headline at zero').default('Lines are open.'),
  date: text('Date line').default('Tue 18 Nov · 10:00 PT'),
  ctaBefore: text('CTA while counting').default('Set a reminder'),
  ctaAfter: text('CTA at zero').default('Watch live  →  patchwell.ai/live'),
  host: text('Host caption').default('with Mara Quill, founder'),
  hostImage: image('Host photo (optional)').default(''),
  font: font('Headline font').default('youngserif'),
  background: color().default('#F4E9D8'),
  surface: color('Paper / disc').default('#E6D3B3'),
  dial: color('Dial wheel').default('#2C7873'),
  accent: color().default('#D96C3D'),
  lamp: color('Lamps').default('#E9B44C'),
  textColor: color('Ink').default('#2E2A24'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-shift': { background: '#2A0A10', surface: '#3F1019', dial: '#F5C6AA', accent: '#E3173E', lamp: '#F7B32B', textColor: '#FFE8E0' },
  terracotta: { background: '#F1E4D3', surface: '#E5CDB2', dial: '#4F6D58', accent: '#C8553D', lamp: '#F2A541', textColor: '#3B1F14', font: 'fraunces' },
  nordic: { background: '#E9EEF1', surface: '#D3DDE3', dial: '#17242E', accent: '#E4572E', lamp: '#F2C14E', textColor: '#17242E', eyebrow: 'Patchwell × CTV · live demo', date: 'Thu 4 Dec · 9:00 ET' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 120;
};

const CX = 540;
const CY = 760;
const R = 340;
const STOP = 60; // finger stop, degrees clockwise from 3 o'clock
const holeAngle = (k: number) => STOP - 28 * k - 8; // hole for digit k (1..10, 10 = "0")
const rad = (d: number) => (d * Math.PI) / 180;

const DIGITS = [5, 4, 3, 2, 1];
const FIRST = T.bars(1); // first digit lands on the downbeat of bar 2
const STEP = T.beats(2);
const IMPACT = FIRST + STEP * DIGITS.length; // 420: "Lines are open."

function Starburst({ x, y, r, c, sw, k }: { x: number; y: number; r: number; c: string; sw: number; k: number }) {
  if (k <= 0) return null;
  return (
    <g stroke={c} strokeWidth={sw} strokeLinecap="round" opacity={clamp(k * 1.5)}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        const l = (i % 2 ? r * 0.55 : r) * k;
        return <line key={i} x1={x + Math.cos(a) * r * 0.25 * k} y1={y + Math.sin(a) * r * 0.25 * k} x2={x + Math.cos(a) * l} y2={y + Math.sin(a) * l} />;
      })}
    </g>
  );
}

export default function LinesOpenCountdown(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const ink = p.textColor;
  const paper = dark ? shade(p.background, 0.92) : '#FFFBF2';

  // Which digit is being dialled, and the wheel's rotation (out to the stop on the beat, then spring back).
  let rot = mix(-120, 0, prog(frame, 0, 50, ease.out));
  let current: number | null = null;
  let landedAt = -999;
  DIGITS.forEach((n, i) => {
    const at = FIRST + STEP * i;
    const full = 28 * n + 8;
    if (frame >= at - 24 && frame < at + 34) {
      rot = frame < at ? full * prog(frame, at - 24, 24, ease.inOut) : full * (1 - prog(frame, at + 4, 28, ease.inOutSoft));
    }
    if (frame >= at) {
      current = n;
      landedAt = at;
    }
  });
  // At zero the wheel makes one celebratory full turn.
  if (frame >= IMPACT - 10) rot = 360 * prog(frame, IMPACT - 10, 50, ease.inOut);
  const live = frame >= IMPACT;

  const digitPop = prog(frame, landedAt, 16, ease.backOut);
  const pulse = prog(frame, landedAt, 40, ease.out);
  const push = mix(1, 1.05, prog(frame, 0, end, ease.inOutSoft));
  const shakeK = live ? Math.exp(-(frame - IMPACT) / 6) : 0;
  const shake = `${(rand(Math.floor(frame / 2) * 1.3) - 0.5) * 16 * shakeK}px ${(rand(Math.floor(frame / 2) * 2.9) - 0.5) * 12 * shakeK}px`;
  const outro = prog(frame, end - 40, 40, ease.inOut);
  const rays = prog(frame, IMPACT, 40, ease.out);
  const burst = prog(frame, IMPACT, 30, ease.out) * (1 - prog(frame, IMPACT + 40, 40, ease.in));
  const ring = prog(frame, IMPACT, 60, ease.out);

  // Headline swap: counting copy exits just before zero, the "open" copy sweeps in on it.
  const beforeK = prog(frame, 20, 30, ease.out) * (1 - prog(frame, IMPACT - 14, 14, ease.in));
  const ctaK = live ? prog(frame, IMPACT + T.beats(2), 24, ease.backOut) : prog(frame, T.beats(3), 24, ease.backOut) * (1 - prog(frame, IMPACT - 14, 12, ease.in));
  const headTop = 1250;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: ink, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.1, size: 44, y: -frame * 0.15, color: dark ? '255,255,255' : '46,42,36' }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,250,240,0.7)'}
        glows={[]}
        grain={0}
        vignette={dark ? 0.45 : 0.1}
      />

      <AbsoluteFill style={{ scale: String(push), translate: shake, opacity: 1 - outro }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {/* sunburst rays open behind the dial at zero, then turn slowly */}
          {rays > 0 && (
            <g transform={`translate(${CX} ${CY}) rotate(${frame * 0.12}) scale(${rays})`} opacity={rays}>
              {Array.from({ length: 24 }, (_, i) => {
                const a0 = rad(i * 15);
                const a1 = rad(i * 15 + 7.5);
                const L = 1300;
                return <path key={i} d={`M0,0 L${Math.cos(a0) * L},${Math.sin(a0) * L} L${Math.cos(a1) * L},${Math.sin(a1) * L} Z`} fill={hexA(p.lamp, dark ? 0.22 : 0.35)} />;
              })}
            </g>
          )}
          <circle cx={CX} cy={CY} r={mix(0, 470, prog(frame, 0, 50, ease.out)) + Math.sin(frame / 40) * 6} fill={p.surface} />

          {/* pulse ring on each dialled beat */}
          {current !== null && !live && <circle cx={CX} cy={CY} r={R + 30 + pulse * 140} fill="none" stroke={p.accent} strokeWidth={mix(10, 1, pulse)} opacity={(1 - pulse) * 0.8} />}
          {live && <circle cx={CX} cy={CY} r={R + 30 + ring * 420} fill="none" stroke={p.accent} strokeWidth={mix(12, 1, ring)} opacity={(1 - ring) * 0.85} />}

          <g transform={`translate(${CX} ${CY}) scale(${prog(frame, 0, 40, ease.backOut)})`}>
            {/* hard print shadow + bezel */}
            <circle cx={14} cy={16} r={R + 22} fill={ink} />
            <circle r={R + 22} fill="#7A4E2D" stroke={ink} strokeWidth={5} />
            {/* "33 lines" lamps around the bezel: light up one by one after zero */}
            {Array.from({ length: 33 }, (_, i) => {
              const a = rad(-90 + (i / 33) * 360);
              const on = live ? prog(frame, IMPACT + 6 + i * 2.5, 10) : current !== null ? (i < Math.round(((5 - (current as number)) / 5) * 33) ? 1 : 0) : 0;
              const shimmer = live ? 0.75 + 0.25 * Math.sin(frame / 8 + i) : 1;
              return <circle key={i} cx={Math.cos(a) * (R + 11)} cy={Math.sin(a) * (R + 11)} r={8.5} stroke={ink} strokeWidth={1.5} fill={on > 0.5 ? p.lamp : shade('#7A4E2D', -0.35)} opacity={on > 0.5 ? shimmer : 1} />;
            })}
            {/* number plate */}
            <circle r={R} fill={paper} stroke={ink} strokeWidth={4} />
            {Array.from({ length: 10 }, (_, j) => {
              const k = j + 1;
              const a = rad(holeAngle(k));
              const lit = current === k && !live && frame - landedAt < 40;
              return (
                <text key={k} x={Math.cos(a) * (R * 0.72)} y={Math.sin(a) * (R * 0.72) + 26} textAnchor="middle" fontFamily={FONTS.youngserif} fontSize={70} fill={lit ? p.accent : ink}>
                  {k % 10}
                </text>
              );
            })}
            {/* finger wheel with holes */}
            <defs>
              <mask id="loc-holes">
                <rect x={-R} y={-R} width={R * 2} height={R * 2} fill="#fff" />
                {Array.from({ length: 10 }, (_, j) => {
                  const a = rad(holeAngle(j + 1));
                  return <circle key={j} cx={Math.cos(a) * R * 0.72} cy={Math.sin(a) * R * 0.72} r={R * 0.15} fill="#000" />;
                })}
                <circle r={R * 0.44} fill="#000" />
              </mask>
            </defs>
            <g transform={`rotate(${rot})`}>
              <circle r={R * 0.97} fill={p.dial} mask="url(#loc-holes)" />
              <circle r={R * 0.97} fill="none" stroke={ink} strokeWidth={4} />
              <circle r={R * 0.88} fill="none" stroke="#ffffff" strokeWidth={3} opacity={0.18} />
              {Array.from({ length: 10 }, (_, j) => {
                const a = rad(holeAngle(j + 1));
                return <circle key={j} cx={Math.cos(a) * R * 0.72} cy={Math.sin(a) * R * 0.72} r={R * 0.15} fill="none" stroke={ink} strokeWidth={4} />;
              })}
              <circle r={R * 0.44} fill="none" stroke={ink} strokeWidth={4} />
            </g>
            {/* finger stop */}
            <path d={`M${Math.cos(rad(STOP)) * R * 0.86},${Math.sin(rad(STOP)) * R * 0.86} L${Math.cos(rad(STOP)) * R * 1.04},${Math.sin(rad(STOP)) * R * 1.04}`} stroke="#C9A45C" strokeWidth={18} strokeLinecap="round" />
            <path d={`M${Math.cos(rad(STOP)) * R * 0.86},${Math.sin(rad(STOP)) * R * 0.86} L${Math.cos(rad(STOP)) * R * 1.04},${Math.sin(rad(STOP)) * R * 1.04}`} stroke={ink} strokeWidth={4} strokeLinecap="round" opacity={0.5} />
            {/* centre card */}
            <circle r={R * 0.4} fill={paper} stroke={ink} strokeWidth={4} />
          </g>

          <Starburst x={CX + 300} y={CY - 330} r={110} c={p.accent} sw={9} k={burst} />
          <Starburst x={CX - 330} y={CY + 280} r={70} c={p.lamp} sw={7} k={prog(frame, IMPACT + 6, 30, ease.out) * (1 - prog(frame, IMPACT + 46, 40, ease.in))} />
        </svg>

        {/* centre card content: the dialled digit, then LIVE */}
        <div style={{ position: 'absolute', left: CX - 140, top: CY - 140, width: 280, height: 280, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
          {live ? (
            <div style={{ ...displayFace(p.font), fontSize: 92, color: p.accent, letterSpacing: '-0.02em', scale: String(prog(frame, IMPACT, 20, ease.backOut)) }}>Live</div>
          ) : current !== null ? (
            <div key={current} style={{ ...displayFace(p.font), fontSize: 220, lineHeight: 1, color: ink, scale: String(mix(1.4, 1, digitPop)), opacity: clamp(digitPop * 2), filter: `blur(${(1 - prog(frame, landedAt, 10)) * 10}px)`, translate: '0 -6px' }}>
              {current}
            </div>
          ) : (
            <div style={{ fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 64, color: p.accent, rotate: '-6deg', opacity: prog(frame, 30, 20) }}>ring ring…</div>
          )}
        </div>

        <Dust frame={frame} width={W} height={H} count={40} color={p.lamp} seed={4} speed={0.8} opacity={dark ? 0.5 : 0.7} maxSize={6} />

        {/* eyebrow */}
        <div style={{ position: 'absolute', width: W, top: 190, textAlign: 'center', fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 72, color: p.accent, rotate: '-2deg', opacity: prog(frame, 10, 24), translate: `0 ${mix(-24, 0, prog(frame, 10, 30, ease.out))}px` }}>
          {p.eyebrow}
        </div>

        {/* headline: counting → open */}
        <div style={{ position: 'absolute', width: W, top: headTop, textAlign: 'center', ...displayFace(p.font), fontSize: 112, letterSpacing: '-0.02em', lineHeight: 1, opacity: beforeK, translate: `0 ${mix(30, 0, beforeK)}px`, filter: `blur(${(1 - beforeK) * 10}px)` }}>
          {p.before}
        </div>
        {live && (
          <SweepReveal frame={frame} start={IMPACT + 2} dur={30} style={{ position: 'absolute', width: W, top: headTop - 10, textAlign: 'center', ...displayFace(p.font), fontSize: Math.min(140, 1800 / Math.max(8, p.after.length)), letterSpacing: '-0.025em', lineHeight: 1, color: p.accent, whiteSpace: 'nowrap' }}>
            {p.after}
          </SweepReveal>
        )}
        <div style={{ position: 'absolute', width: W, top: headTop + 150, textAlign: 'center', fontWeight: 700, fontSize: 56, letterSpacing: '0.01em', opacity: prog(frame, 40, 24), translate: `0 ${mix(20, 0, prog(frame, 40, 30, ease.out))}px` }}>
          {p.date}
        </div>

        {/* CTA */}
        <div style={{ position: 'absolute', width: W, top: headTop + 260, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              padding: '24px 46px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 46,
              color: live ? '#FFF8EE' : ink,
              background: live ? p.accent : paper,
              border: `4px solid ${ink}`,
              boxShadow: `8px 9px 0 ${ink}`,
              whiteSpace: 'pre',
              scale: String(ctaK),
              opacity: clamp(ctaK * 2),
            }}
          >
            {live ? p.ctaAfter : `${p.ctaBefore}  ☎`}
          </div>
        </div>

        {/* host cameo */}
        <div style={{ position: 'absolute', width: W, top: 1690, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26, opacity: prog(frame, 60, 30), translate: `0 ${mix(30, 0, prog(frame, 60, 40, ease.out))}px` }}>
          {p.hostImage && (
            <div style={{ width: 120, height: 120, borderRadius: 999, overflow: 'hidden', border: `4px solid ${ink}`, boxShadow: `6px 7px 0 ${ink}`, background: p.surface }}>
              <Img src={p.hostImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div style={{ fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 60, rotate: '-2deg' }}>{p.host}</div>
        </div>
      </AbsoluteFill>

      <FilmOverlay grain={0.05} vignette={dark ? 0.35 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
