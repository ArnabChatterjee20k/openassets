import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Live Demo Day',
  category: 'event',
  description:
    'Event promo for a live product demo: a chat bubble pops and becomes the LIVE badge, the session title sweeps in, date/time chips land on the beat beside a chrome host card, platforms scroll past and the RSVP button lands.',
  tags: ['event', 'webinar', 'live', 'demo', 'y2k', 'ads'],
};

// 60 fps on a 120 BPM grid: beat = 30 frames, bar = 120 frames. 10 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text('Badge').default('Mimo Live'),
  invite: text('Intro line').default("psst... you're invited"),
  title1: text('Title line 1').default('Launch on 36 platforms'),
  title2: text('Title line 2').default('in one chat.'),
  date: text('Date').default('Thu, Nov 20'),
  time: text('Time').default('11:00 AM PT'),
  format: text('Format').default('45 min · Free'),
  hostName: text('Host name').default('Priya Raman'),
  hostRole: text('Host role').default('Head of Growth, Mimo'),
  hostNote: text('Handwritten note').default('your host!'),
  hostPhoto: image('Host photo (optional)').default(''),
  cta: text('Button').default('Save your seat'),
  url: text('Link').default('mimo.ad/live'),
  platforms: text('Platforms (comma separated)').default('Google, Meta, TikTok, Reddit, LinkedIn, Pinterest, Snap, Amazon, YouTube, X, Spotify, CTV'),
  font: font('Display font').default('fredoka'),
  background: color().default('#DADDE3'),
  surface: color('Chrome').default('#C3C8D1'),
  ink: color('Text').default('#101219'),
  accent: color().default('#3D5AFE'),
  pop: color('Pop').default('#FF3DB4'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  lilac: { background: '#E9E3F5', surface: '#D6CCEC', ink: '#231942', accent: '#5E4AE3', pop: '#2EC4B6' },
  'launch-night': { background: '#12001F', surface: '#3A0A5E', ink: '#FBEFFF', accent: '#B026FF', pop: '#FFD600', eyebrow: 'Launch Night', date: 'Tue, Dec 2', time: '6:00 PM ET', format: 'Live on YouTube' },
  workshop: { background: '#E9EEF1', surface: '#D3DDE3', ink: '#17242E', accent: '#2F6F8F', pop: '#E4572E', eyebrow: 'Office Hours', title1: 'Fix your ROAS', title2: 'live, with Mimo.', format: '30 min · Q&A', hostName: 'Dev Okafor', hostRole: 'Solutions Lead, Mimo', cta: 'Book a spot' },
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

function PodFace({ size, accent, blinkAmt = 0 }: { size: number; accent: string; blinkAmt?: number }) {
  const eh = 6 * (1 - blinkAmt * 0.85);
  return (
    <svg viewBox="0 0 40 46" width={size} height={size * 1.15}>
      <defs>
        <radialGradient id="ldd-shell" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.7" stopColor="#E3E6EC" />
          <stop offset="1" stopColor="#AEB4C0" />
        </radialGradient>
      </defs>
      <path d="M20 2C30 2 38 14 38 27S30 44 20 44 2 40 2 27 10 2 20 2Z" fill="url(#ldd-shell)" stroke="#9AA1AE" strokeWidth="0.6" />
      <rect x="8.5" y="12.5" width="23" height="18" rx="5" fill="#C3C8D1" />
      <rect x="10" y="14" width="20" height="15" rx="4" fill="#E8ECFF" />
      <rect x="14.5" y={20 - eh / 2} width="3" height={eh} fill="#101219" />
      <rect x="22.5" y={20 - eh / 2} width="3" height={eh} fill="#101219" />
      <rect x="17" y="25" width="6" height="1.8" fill="#101219" />
      <circle cx="14" cy="36.5" r="2" fill={accent} />
      <circle cx="20" cy="37.5" r="2.4" fill={accent} />
      <circle cx="26" cy="36.5" r="2" fill={accent} />
    </svg>
  );
}

/** Glossy Aqua-style chip that pops in on its beat. */
function Chip({ label, frame, at, p, dark, strong }: { label: string; frame: number; at: number; p: P; dark: boolean; strong?: boolean }) {
  const t = prog(frame, at, 24, ease.backOut);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 16,
        padding: '18px 30px',
        borderRadius: 999,
        fontFamily: FONTS.outfit,
        fontWeight: 500,
        fontSize: 44,
        whiteSpace: 'nowrap',
        color: strong ? '#ffffff' : p.ink,
        background: strong
          ? `linear-gradient(180deg, ${hexA('#ffffff', 0.5)} 0%, ${hexA('#ffffff', 0.06)} 48%, transparent 52%), ${p.accent}`
          : `linear-gradient(180deg, ${hexA('#ffffff', dark ? 0.2 : 0.95)} 0%, ${hexA('#ffffff', dark ? 0.06 : 0.55)} 100%)`,
        border: `1.5px solid ${hexA(dark ? '#ffffff' : '#101219', 0.1)}`,
        boxShadow: `0 14px 30px ${hexA(strong ? p.accent : '#30364A', strong ? 0.35 : dark ? 0.4 : 0.14)}, inset 0 -2px 0 ${hexA('#000000', 0.08)}`,
        opacity: clamp(t * 2),
        scale: String(mix(0.6, 1, t)),
        translate: `0 ${(1 - t) * 30}px`,
      }}
    >
      {!strong && <span style={{ width: 16, height: 16, borderRadius: 99, background: p.accent, boxShadow: `0 0 12px ${hexA(p.accent, 0.6)}` }} />}
      {label}
    </span>
  );
}

export default function LiveDemoDay(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);
  const end = video.durationInFrames;

  const HIT = T.bars(1); // bubble → badge, title arrives
  const outro = prog(frame, end - 36, 36, ease.in);
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));

  // Intro bubble: pops in at the centre, then flies up-left to become the badge.
  const pop = prog(frame, 6, 26, ease.backOut);
  const fly = prog(frame, HIT - 22, 26, ease.inOut);
  const bubbleX = mix(W / 2, 140 + 190, fly);
  const bubbleY = mix(H / 2 - 40, 168, fly);
  const bubbleW = mix(520, 380, fly);
  const bubbleH = mix(230, 84, fly);
  const dotsOn = 1 - prog(frame, HIT - 26, 12, ease.in);
  const badgeOn = prog(frame, HIT, 16, ease.out);

  // Hit: shockwave ring + sparkle burst from the badge.
  const ring = prog(frame, HIT, 50, ease.out);
  const burst = prog(frame, HIT, 70, ease.out);

  const platforms = p.platforms.split(',').map((s) => s.trim()).filter(Boolean);
  const longest = Math.max(p.title1.length, p.title2.length, 10);
  const TITLE = Math.min(136, 1130 / (longest * 0.47));
  const titleStyle = { ...displayFace(p.font), fontSize: TITLE, lineHeight: 1.0, letterSpacing: '-0.025em', whiteSpace: 'nowrap' as const };
  const chromeGrad = `linear-gradient(180deg, #FFFFFF 0%, ${p.surface} 55%, ${dark ? p.surface : '#9AA1AE'} 100%)`;

  // Host card slides in from the right on beat 2 of bar 2.
  const card = prog(frame, HIT + T.beats(1), 40, ease.out);
  const cardBob = Math.sin(frame / 38) * 6;
  const blinkAmt = keys(frame % 150, [0, 128, 132, 136, 150], [0, 0, 1, 0, 0], ease.inOut);

  // CTA lands on the downbeat of bar 4.
  const CTA = T.bars(3);
  const ctaT = prog(frame, CTA, 26, ease.backOut);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.16, size: 40, y: -frame * 0.15, color: dark ? '255,255,255' : '16,18,25' }}
        lift={dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)'}
        glows={[
          { x: 1560, y: 470, size: 1300, color: hexA(p.accent, dark ? 0.5 : 0.3), opacity: 0.7 + 0.2 * Math.sin(frame / 40) },
          { x: 300, y: 980, size: 1100, color: hexA(p.pop, dark ? 0.35 : 0.22), opacity: 0.8 },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.14}
      />
      {/* brushed chrome horizon */}
      {!dark && <AbsoluteFill style={{ top: 860, height: 220, background: `linear-gradient(180deg, transparent, ${hexA('#ffffff', 0.6)} 40%, ${hexA('#9AA1AE', 0.25)} 60%, transparent)` }} />}

      <AbsoluteFill style={{ scale: String(push * mix(1, 0.97, outro)), opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={40} color={dark ? '#ffffff' : p.accent} seed={7} speed={0.7} opacity={dark ? 0.4 : 0.3} maxSize={5} />

        {/* Intro sparkles orbiting the bubble */}
        {frame < HIT &&
          Array.from({ length: 6 }, (_, i) => {
            const a = (i / 6) * Math.PI * 2 + frame / 70;
            const inT = prog(frame, 8 + i * 4, 24, ease.backOut);
            const outT = prog(frame, HIT - 26, 16, ease.in);
            return <Sparkle key={i} id={`o${i}`} x={W / 2 + Math.cos(a) * 420} y={H / 2 - 40 + Math.sin(a) * 150} s={(i % 2 ? 40 : 70) * inT * (1 - outT)} c={i % 3 === 0 ? p.pop : p.accent} rot={frame * (i % 2 ? 0.8 : -0.6)} />;
          })}

        {/* Intro line under the bubble */}
        {frame < HIT && (
          <div style={{ position: 'absolute', width: W, top: H / 2 + 150, textAlign: 'center', opacity: 1 - prog(frame, HIT - 26, 14, ease.in) }}>
            <WordsIn text={p.invite} frame={frame} start={T.beats(1) + 6} stagger={6} style={{ justifyContent: 'center', fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 84, color: p.ink }} />
          </div>
        )}

        {/* bubble → badge */}
        <div
          style={{
            position: 'absolute',
            left: bubbleX - bubbleW / 2,
            top: bubbleY - bubbleH / 2,
            width: bubbleW,
            height: bubbleH,
            borderRadius: 999,
            background: chromeGrad,
            border: `2px solid ${hexA('#ffffff', dark ? 0.3 : 0.95)}`,
            boxShadow: `0 ${mix(40, 14, fly)}px ${mix(80, 30, fly)}px ${hexA(dark ? '#000000' : '#30364A', dark ? 0.5 : 0.25)}, inset 0 -4px 0 ${hexA('#000000', 0.1)}`,
            scale: String(frame < HIT ? pop : 1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* typing dots */}
          <div style={{ position: 'absolute', display: 'flex', gap: 34, opacity: dotsOn }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 46, height: 46, borderRadius: 99, background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${p.accent} 45%)`, translate: `0 ${-Math.max(0, Math.sin(frame / 7 - i * 0.9)) * 22}px` }} />
            ))}
          </div>
          {/* badge content */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: badgeOn, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 40, color: '#101219', letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
            <span style={{ width: 22, height: 22, borderRadius: 99, background: p.pop, boxShadow: `0 0 ${10 + 8 * Math.sin(frame / 8)}px ${p.pop}`, opacity: 0.6 + 0.4 * (Math.sin(frame / 8) * 0.5 + 0.5) }} />
            LIVE · {p.eyebrow}
          </div>
          {/* tail */}
          <div style={{ position: 'absolute', left: bubbleW * 0.18, bottom: -16 * (1 - fly), width: 40, height: 40, background: p.surface, rotate: '45deg', borderRadius: 6, zIndex: -1, opacity: 1 - fly }} />
        </div>

        {/* hit: ring + sparkle burst from the badge */}
        {frame >= HIT && frame < HIT + 80 && (
          <>
            <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
              <rect x={330 - 200 - ring * 60} y={168 - 52 - ring * 30} width={400 + ring * 120} height={104 + ring * 60} rx={60 + ring * 30} fill="none" stroke={p.accent} strokeWidth={mix(6, 1, ring)} opacity={(1 - ring) * 0.7} />
            </svg>
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * Math.PI * 2 + rand(i) * 0.4;
              const d = 140 + burst * (220 + rand(i * 3.3) * 200);
              return <Sparkle key={i} id={`b${i}`} x={330 + Math.cos(a) * d * 1.6} y={168 + Math.sin(a) * d * 0.8} s={mix(50, 18, burst) + rand(i * 7) * 20} c={i % 3 ? p.accent : p.pop} rot={burst * 120} opacity={1 - burst} />;
            })}
          </>
        )}

        {/* Title */}
        {frame >= HIT && (
          <div style={{ position: 'absolute', left: 140, top: 292 }}>
            <SweepReveal frame={frame} start={HIT + 2} dur={34} style={{ ...titleStyle, color: p.ink }}>
              {p.title1}
            </SweepReveal>
            <div style={{ position: 'relative' }}>
              <SweepReveal frame={frame} start={HIT + 10} dur={34} style={titleStyle}>
                <span style={{ backgroundImage: `linear-gradient(170deg, ${p.accent} 30%, ${dark ? '#ffffff' : '#101219'} 170%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', paddingBottom: TITLE * 0.12 }}>{p.title2}</span>
              </SweepReveal>
              <Glint frame={frame} start={T.bars(3) + T.beats(2)} dur={44} style={{ ...titleStyle, position: 'absolute', inset: 0 }}>
                {p.title2}
              </Glint>
            </div>
          </div>
        )}

        {/* Date / time / format chips on beats 3, 4 and bar 3 */}
        <div style={{ position: 'absolute', left: 140, top: 340 + TITLE * 2.1, display: 'flex', gap: 22, flexWrap: 'wrap', width: 1120 }}>
          <Chip label={p.date} frame={frame} at={HIT + T.beats(2)} p={p} dark={dark} />
          <Chip label={p.time} frame={frame} at={HIT + T.beats(3)} p={p} dark={dark} />
          <Chip label={p.format} frame={frame} at={T.bars(2)} p={p} dark={dark} />
        </div>

        {/* CTA */}
        <div style={{ position: 'absolute', left: 140, top: 340 + TITLE * 2.1 + 160, display: 'flex', alignItems: 'center', gap: 30 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 18,
              padding: '24px 44px',
              borderRadius: 999,
              fontFamily: FONTS.outfit,
              fontWeight: 800,
              fontSize: 50,
              color: '#ffffff',
              background: `linear-gradient(180deg, ${hexA('#ffffff', 0.55)} 0%, ${hexA('#ffffff', 0.08)} 48%, transparent 52%), ${p.pop}`,
              boxShadow: `0 18px 44px ${hexA(p.pop, 0.45)}, inset 0 -3px 0 ${hexA('#000000', 0.15)}`,
              opacity: clamp(ctaT * 2),
              scale: String(mix(0.5, 1, ctaT) * (1 + 0.015 * Math.sin((frame - CTA) / 9) * prog(frame, CTA + 30, 20))),
            }}
          >
            {p.cta} →
          </span>
          <span style={{ fontFamily: FONTS.outfit, fontWeight: 500, fontSize: 46, color: p.ink, opacity: prog(frame, CTA + 10, 20), translate: `${(1 - prog(frame, CTA + 10, 24)) * -20}px 0` }}>{p.url}</span>
        </div>

        {/* Host card */}
        <div
          style={{
            position: 'absolute',
            left: 1330,
            top: 236 + cardBob,
            width: 470,
            borderRadius: 40,
            padding: 14,
            background: chromeGrad,
            border: `2px solid ${hexA('#ffffff', dark ? 0.25 : 0.95)}`,
            boxShadow: `0 40px 90px ${hexA(dark ? '#000000' : '#30364A', dark ? 0.55 : 0.28)}, inset 0 -4px 0 ${hexA('#000000', 0.1)}`,
            opacity: clamp(card * 1.5),
            translate: `${(1 - card) * 260}px 0`,
            rotate: `${mix(8, 2.5, card)}deg`,
          }}
        >
          <div style={{ height: 30, display: 'flex', gap: 9, alignItems: 'center', padding: '0 10px' }}>
            {[p.pop, '#FFC94D', p.accent].map((c, i) => (
              <span key={i} style={{ width: 16, height: 16, borderRadius: 99, background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${c} 50%)` }} />
            ))}
          </div>
          <div style={{ height: 400, borderRadius: 28, overflow: 'hidden', position: 'relative', background: `radial-gradient(circle at 50% 40%, ${hexA('#ffffff', 0.9)} 0%, ${hexA(p.accent, 0.35)} 80%), ${p.background}`, display: 'grid', placeItems: 'center' }}>
            {p.hostPhoto ? (
              <Img src={p.hostPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover', scale: String(mix(1.12, 1.02, prog(frame, HIT + 30, 300, ease.outSoft))) }} />
            ) : (
              <div style={{ translate: `0 ${Math.sin(frame / 22) * 8}px` }}>
                <PodFace size={230} accent={p.accent} blinkAmt={blinkAmt} />
              </div>
            )}
          </div>
          <div style={{ padding: '22px 18px 12px', color: '#101219' }}>
            <div style={{ ...displayFace(p.font), fontSize: 52, lineHeight: 1.05, letterSpacing: '-0.02em' }}>{p.hostName}</div>
            <div style={{ fontFamily: FONTS.outfit, fontWeight: 500, fontSize: 30, marginTop: 6, opacity: 0.75 }}>{p.hostRole}</div>
          </div>
        </div>
        {p.hostNote && (
          <div
            style={{
              position: 'absolute',
              left: 1240,
              top: 156,
              fontFamily: FONTS.caveat,
              fontWeight: 700,
              fontSize: 64,
              color: p.ink,
              rotate: '-8deg',
              opacity: prog(frame, HIT + T.beats(3), 20),
              translate: `0 ${(1 - prog(frame, HIT + T.beats(3), 26)) * 20}px`,
            }}
          >
            {p.hostNote} ↘
          </div>
        )}
        <Sparkle id="hs1" x={1810} y={240 + cardBob} s={86} c={p.pop} rot={frame * 0.4} opacity={card} />
        <Sparkle id="hs2" x={1316} y={720 + cardBob} s={54} c={p.accent} rot={-frame * 0.5} opacity={card} />

        {/* platform marquee along the bottom */}
        <div style={{ position: 'absolute', left: 0, top: 940, width: W, height: 90, overflow: 'hidden', opacity: prog(frame, T.bars(2), 30), maskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)' }}>
          <div style={{ display: 'flex', gap: 56, whiteSpace: 'nowrap', translate: `${-((frame * 2.2) % 2400)}px 0`, fontFamily: FONTS.fredoka, fontWeight: 600, fontSize: 48, color: p.ink, opacity: 0.55, alignItems: 'center', height: '100%' }}>
            {[...platforms, ...platforms, ...platforms, ...platforms].map((name, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 56 }}>
                {name}
                <span style={{ color: i % 4 === 0 ? p.pop : p.accent, fontSize: 30 }}>✦</span>
              </span>
            ))}
          </div>
        </div>
      </AbsoluteFill>
      <FilmOverlay grain={0.04} vignette={0} frame={frame} />
    </AbsoluteFill>
  );
}
