import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Thank You, Early Crew',
  category: 'thank-you',
  description:
    'Square thank-you post for early users: the Mimo pod winks, "Thank you" pops with a bubble-confetti burst, a campaign stat counts up, then a handwritten note, optional team photo and signature.',
  tags: ['thank you', 'community', 'customers', 'social', 'y2k', 'ads'],
};

// 60 fps on a 120 BPM grid: beat = 30 frames, bar = 120 frames. 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  greeting: text('Greeting').default('Thank you,'),
  name: text('Who you thank').default('early crew!'),
  stat: text('Stat (digits count up)').default('12,480'),
  statLabel: text('Stat label').default('campaigns launched in beta'),
  note: textarea('Handwritten note').default('You broke it, flagged it and stuck around. Mimo is better because of you.'),
  signature: text('Signature').default('— Ana, Jun & the Mimo team'),
  url: text('Footer').default('mimo.ad'),
  photo: image('Team photo (optional)').default(''),
  font: font('Display font').default('fredoka'),
  background: color().default('#DADDE3'),
  surface: color('Chrome').default('#C3C8D1'),
  ink: color('Text').default('#101219'),
  accent: color().default('#3D5AFE'),
  pop: color('Pop').default('#FF3DB4'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  candy: { background: '#FDF3F8', surface: '#F7DDEB', ink: '#3A1F4A', accent: '#FF7EB6', pop: '#8A7BFF' },
  lilac: { background: '#E9E3F5', surface: '#D6CCEC', ink: '#231942', accent: '#5E4AE3', pop: '#2EC4B6', name: '1,000 teams!', stat: '1,000', statLabel: 'teams running ads on Mimo' },
  'after-hours': { background: '#12001F', surface: '#3A0A5E', ink: '#FBEFFF', accent: '#B026FF', pop: '#FFD600', greeting: 'Thanks for', name: 'a wild year!', stat: '2,140,000', statLabel: 'ads shipped across 36 platforms' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

function Sparkle({ x, y, s, c, id, rot = 0, opacity = 1 }: { x: number; y: number; s: number; c: string; id: string; rot?: number; opacity?: number }) {
  return (
    <svg viewBox="-50 -50 100 100" style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, overflow: 'visible', rotate: `${rot}deg`, opacity }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor={c} />
          <stop offset="1" stopColor="#7F8796" />
        </linearGradient>
      </defs>
      <path d="M0 -50 C6 -12 12 -6 50 0 C12 6 6 12 0 50 C-6 12 -12 6 -50 0 C-12 -6 -6 -12 0 -50Z" fill={`url(#${id})`} stroke="#ffffff" strokeOpacity={0.7} strokeWidth={1.5} />
    </svg>
  );
}

/** The Mimo pod, with a wink (left eye) and blink (both). */
function Pod({ size, accent, pop, wink, blinkAmt }: { size: number; accent: string; pop: string; wink: number; blinkAmt: number }) {
  const eye = (amt: number) => 7 * (1 - amt * 0.88);
  const l = eye(Math.max(wink, blinkAmt));
  const r = eye(blinkAmt);
  return (
    <svg viewBox="0 0 40 46" width={size} height={size * 1.15} style={{ overflow: 'visible', filter: `drop-shadow(0 ${size * 0.08}px ${size * 0.08}px rgba(48,54,74,0.3))` }}>
      <defs>
        <radialGradient id="tec-shell" cx="0.35" cy="0.28" r="0.85">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.6" stopColor="#E6E9EF" />
          <stop offset="1" stopColor="#A9B0BD" />
        </radialGradient>
        <linearGradient id="tec-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4F6FA" />
          <stop offset="1" stopColor="#8E95A3" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="1.6" r="1.6" fill="none" stroke="#B8C0CC" strokeWidth="0.8" />
      <path d="M20 3C30 3 38 15 38 27.5S30 44.5 20 44.5 2 40.5 2 27.5 10 3 20 3Z" fill="url(#tec-shell)" stroke="#9AA1AE" strokeWidth="0.4" />
      <ellipse cx="13" cy="10" rx="4" ry="2.2" fill="#ffffff" opacity="0.8" transform="rotate(-30 13 10)" />
      <rect x="8.5" y="13" width="23" height="18" rx="5" fill="url(#tec-rim)" />
      <rect x="10" y="14.5" width="20" height="15" rx="4" fill="#E8ECFF" />
      <rect x="10" y="14.5" width="20" height="15" rx="4" fill={accent} opacity="0.12" />
      <rect x="14.3" y={21 - l / 2} width="3.2" height={l} rx="0.4" fill="#101219" />
      <rect x="22.5" y={21 - r / 2} width="3.2" height={r} rx="0.4" fill="#101219" />
      <path d="M16.5 25.5 h7 v1.6 h-7z" fill="#101219" />
      <rect x="11.5" y="24" width="2.4" height="1.3" fill={pop} />
      <rect x="26.1" y="24" width="2.4" height="1.3" fill={pop} />
      <circle cx="14" cy="37" r="2" fill={accent} />
      <circle cx="20" cy="38" r="2.4" fill={accent} />
      <circle cx="26" cy="37" r="2" fill={accent} />
    </svg>
  );
}

/** Bubble confetti with drag + terminal velocity: arcs high, hangs, drifts down. */
function Confetti({ frame, start, cx, cy, count, seed, p }: { frame: number; start: number; cx: number; cy: number; count: number; seed: number; p: P }) {
  const t = (frame - start) / FPS;
  if (t < 0 || t > 5) return null;
  const k = 2.6;
  const vt = 170;
  const cols = [p.accent, p.pop, '#F4F6FA', p.surface, p.accent];
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const r = (n: number) => rand(i * 17.3 + seed * 3.1 + n);
        const a = -Math.PI / 2 + (r(1) - 0.5) * Math.PI * 1.5;
        const sp = 700 + r(2) * 1100;
        const vx = Math.cos(a) * sp;
        const vy = Math.sin(a) * sp;
        const decay = (1 - Math.exp(-k * t)) / k;
        const x = cx + vx * decay + Math.sin(t * 3 + r(3) * 6) * 18;
        const y = cy + vt * t + (vy - vt) * decay;
        const size = 12 + r(4) * 20;
        const fade = 1 - clamp((t - 3.4) / 1.4);
        const kind = i % 4;
        const c = cols[i % cols.length];
        if (kind === 0) return <Sparkle key={i} id={`cf${seed}-${i}`} x={x} y={y} s={size * 1.8} c={c} rot={t * 200 * (r(5) - 0.5)} opacity={fade} />;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - size / 2,
              top: y - size / 2,
              width: kind === 1 ? size * 1.6 : size,
              height: size,
              borderRadius: 99,
              background: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${c} 42%, ${c} 100%)`,
              boxShadow: `0 4px 10px ${hexA('#30364A', 0.15)}`,
              rotate: `${t * 160 * (r(6) - 0.5)}deg`,
              opacity: fade,
            }}
          />
        );
      })}
    </>
  );
}

export default function ThanksEarlyCrew(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);
  const end = video.durationInFrames;
  const HIT = T.bars(1);
  const STAT = HIT + T.beats(2);
  const NOTE = T.bars(2);
  const SIGN = T.bars(3);

  const outro = prog(frame, end - 30, 30, ease.in);
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));

  // Pod: rises, winks on beat 2, then flies up to the top as a small avatar on the hit.
  const rise = prog(frame, 4, 34, ease.backOut);
  const toTop = prog(frame, HIT - 14, 26, ease.inOut);
  const podSize = mix(300, 128, toTop);
  const podX = W / 2;
  const podY = mix(H / 2 + 20 + (1 - rise) * 200, 150, toTop) + Math.sin(frame / 24) * 6;
  const wink = keys(frame, [T.beats(2) - 4, T.beats(2) + 2, T.beats(2) + 22, T.beats(2) + 28], [0, 1, 1, 0], ease.inOut);
  const blinkAmt = keys(frame % 180, [0, 150, 154, 158, 180], [0, 0, 1, 0, 0], ease.inOut);

  // Title sizes scale down for longer strings.
  const G = Math.min(176, 900 / (Math.max(p.greeting.length, 6) * 0.47));
  const N = Math.min(150, 900 / (Math.max(p.name.length, 6) * 0.47));
  const titleTop = 270;

  // Stat counts up from 0 to its digits.
  const target = parseInt(p.stat.replace(/[^0-9]/g, ''), 10) || 0;
  const count = Math.round(target * prog(frame, STAT, 60, ease.out));
  const statText = target ? count.toLocaleString('en-US') : p.stat;
  const statIn = prog(frame, STAT, 24, ease.backOut);
  const statOut = prog(frame, NOTE - 10, 20, ease.in);

  const chromeGrad = `linear-gradient(180deg, #FFFFFF 0%, ${p.surface} 55%, ${dark ? p.surface : '#9AA1AE'} 100%)`;
  const hasPhoto = !!p.photo;
  const noteIn = prog(frame, NOTE, 30, ease.out);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.16, size: 36, y: -frame * 0.15, color: dark ? '255,255,255' : '16,18,25' }}
        lift={dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)'}
        glows={[
          { x: W / 2, y: H * 0.42, size: 1100, color: hexA(p.accent, dark ? 0.5 : 0.28), opacity: 0.7 + 0.2 * Math.sin(frame / 40) },
          { x: W * 0.85, y: H * 0.9, size: 800, color: hexA(p.pop, dark ? 0.4 : 0.25), opacity: 0.8 },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.14}
      />
      {!dark && <AbsoluteFill style={{ top: 880, height: 200, background: `linear-gradient(180deg, transparent, ${hexA('#ffffff', 0.6)} 40%, ${hexA('#9AA1AE', 0.22)} 60%, transparent)` }} />}

      <AbsoluteFill style={{ scale: String(push * mix(1, 0.97, outro)), opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={30} color={dark ? '#ffffff' : p.accent} seed={3} speed={0.6} opacity={dark ? 0.4 : 0.28} maxSize={5} />

        {/* bursts on the hit and on bar 4: behind the type so nothing crosses the letters */}
        <Confetti frame={frame} start={HIT} cx={W / 2} cy={titleTop + 120} count={46} seed={1} p={p} />
        <Confetti frame={frame} start={SIGN} cx={W / 2} cy={H + 40} count={26} seed={2} p={p} />

        {/* Pod */}
        <div style={{ position: 'absolute', left: podX - podSize / 2, top: podY - (podSize * 1.15) / 2, opacity: clamp(rise * 2), scale: String(mix(0.7, 1, rise)) }}>
          <Pod size={podSize} accent={p.accent} pop={p.pop} wink={wink} blinkAmt={frame > HIT ? blinkAmt : 0} />
        </div>
        {/* wink sparkle */}
        <Sparkle id="wk" x={W / 2 + 190} y={H / 2 - 120} s={90 * keys(frame, [T.beats(2), T.beats(2) + 10, T.beats(2) + 40], [0, 1, 0], ease.out)} c={p.pop} rot={frame * 2} />

        {/* Thank you */}
        {frame >= HIT && (
          <div style={{ position: 'absolute', left: 0, width: W, top: titleTop, textAlign: 'center' }}>
            <SweepReveal frame={frame} start={HIT} dur={30} style={{ ...displayFace(p.font), fontSize: G, lineHeight: 1, letterSpacing: '-0.025em', color: p.ink, whiteSpace: 'nowrap' }}>
              {p.greeting}
            </SweepReveal>
            <div style={{ position: 'relative' }}>
              <SweepReveal frame={frame} start={HIT + 8} dur={30} style={{ ...displayFace(p.font), fontSize: N, lineHeight: 1.05, letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>
                <span style={{ backgroundImage: `linear-gradient(170deg, ${p.accent} 30%, ${p.pop} 150%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: N * 0.12 }}>{p.name}</span>
              </SweepReveal>
              <Glint frame={frame} start={SIGN + T.beats(1)} dur={44} style={{ ...displayFace(p.font), fontSize: N, lineHeight: 1.05, letterSpacing: '-0.025em', whiteSpace: 'nowrap', position: 'absolute', inset: 0 }}>
                {p.name}
              </Glint>
            </div>
          </div>
        )}

        {/* Stat pill */}
        {frame < NOTE + 12 && (
          <div style={{ position: 'absolute', left: 0, width: W, top: titleTop + G + N + 70, display: 'flex', justifyContent: 'center', opacity: clamp(statIn * 2) * (1 - statOut), scale: String(mix(0.6, 1, statIn)), translate: `0 ${statOut * -30}px` }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 28,
                padding: '22px 44px 22px 30px',
                borderRadius: 999,
                background: chromeGrad,
                border: `2px solid ${hexA('#ffffff', dark ? 0.3 : 0.95)}`,
                boxShadow: `0 24px 50px ${hexA(dark ? '#000000' : '#30364A', dark ? 0.5 : 0.22)}, inset 0 -3px 0 ${hexA('#000000', 0.1)}`,
                color: '#101219',
              }}
            >
              <span style={{ ...displayFace(p.font), fontSize: 92, lineHeight: 1, letterSpacing: '-0.02em', color: p.accent, fontVariantNumeric: 'tabular-nums' }}>{statText}</span>
              <span style={{ fontWeight: 500, fontSize: 44, lineHeight: 1.1, maxWidth: 360 }}>{p.statLabel}</span>
            </div>
          </div>
        )}

        {/* Note (+ optional photo) */}
        {frame >= NOTE - 2 && (
          <div style={{ position: 'absolute', left: 90, right: 90, top: titleTop + G + N + 50, display: 'flex', alignItems: 'center', gap: 44, justifyContent: 'center' }}>
            {hasPhoto && (
              <div
                style={{
                  flex: 'none',
                  width: 300,
                  padding: 12,
                  paddingBottom: 40,
                  borderRadius: 22,
                  background: chromeGrad,
                  boxShadow: `0 26px 50px ${hexA('#30364A', 0.3)}`,
                  rotate: `${mix(-14, -5, noteIn)}deg`,
                  opacity: noteIn,
                  translate: `${(1 - noteIn) * -80}px 0`,
                }}
              >
                <Img src={p.photo} style={{ width: '100%', height: 250, objectFit: 'cover', borderRadius: 14, display: 'block' }} />
              </div>
            )}
            <div style={{ flex: 1, maxWidth: hasPhoto ? 560 : 860, textAlign: hasPhoto ? 'left' : 'center' }}>
              <WordsIn
                text={p.note}
                frame={frame}
                start={NOTE + 4}
                stagger={3}
                style={{ justifyContent: hasPhoto ? 'flex-start' : 'center', fontFamily: FONTS.caveat, fontWeight: 700, fontSize: hasPhoto ? 54 : 62, lineHeight: 1.05, color: p.ink }}
              />
              <div
                style={{
                  marginTop: 22,
                  fontFamily: FONTS.caveat,
                  fontWeight: 700,
                  fontSize: 56,
                  color: p.accent,
                  rotate: '-3deg',
                  opacity: prog(frame, SIGN, 24),
                  maskImage: `linear-gradient(90deg, black ${mix(-10, 110, prog(frame, SIGN, 40, ease.inOutSoft))}%, transparent ${mix(0, 120, prog(frame, SIGN, 40, ease.inOutSoft))}%)`,
                  WebkitMaskImage: `linear-gradient(90deg, black ${mix(-10, 110, prog(frame, SIGN, 40, ease.inOutSoft))}%, transparent ${mix(0, 120, prog(frame, SIGN, 40, ease.inOutSoft))}%)`,
                }}
              >
                {p.signature}
              </div>
            </div>
          </div>
        )}

        {/* footer */}
        <div style={{ position: 'absolute', left: 0, width: W, top: 960, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, fontWeight: 800, fontSize: 44, color: p.ink, opacity: prog(frame, SIGN + 20, 24) * 0.85 }}>
          <span style={{ width: 18, height: 18, borderRadius: 99, background: p.pop }} />
          {p.url}
        </div>

        {/* hit ring */}
        {frame >= HIT && frame < HIT + 60 && (
          <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
            <circle cx={W / 2} cy={titleTop + 150} r={360 + prog(frame, HIT, 50) * 360} fill="none" stroke={p.accent} strokeWidth={mix(8, 1, prog(frame, HIT, 50))} opacity={(1 - prog(frame, HIT, 50)) * 0.5} />
          </svg>
        )}
      </AbsoluteFill>
      <FilmOverlay grain={0.04} vignette={0} frame={frame} />
    </AbsoluteFill>
  );
}
