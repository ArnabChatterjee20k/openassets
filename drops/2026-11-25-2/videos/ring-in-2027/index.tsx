import { PhoneIcon } from '@phosphor-icons/react/ssr';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Ring In 2027',
  category: 'greeting',
  description:
    'Year-end customer greeting: a phone rings on the beat, "RING IN" sweeps in, the year slams down with a flash and confetti cannons, then a thank-you message, signature and optional team photo stamp.',
  tags: ['greeting', 'new year', 'holiday', 'thank you', 'customers', 'social'],
};

// 60 fps, 120 BPM: beat = 30 frames, bar = 120. Four bars = 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Happy holidays from Ringside'),
  lead: text('Line before the year').default('RING IN'),
  year: text('Year / big word').default('2027'),
  message: textarea().default('Thanks for 1.2 million calls this year. Here’s to more yeses in 2027.'),
  signature: text().default('— The Ringside team'),
  photo: image('Team photo (optional)').default(''),
  background: color().default('#F1E4D3'),
  surface: color().default('#E5CDB2'),
  ink: color().default('#3B1F14'),
  accent: color().default('#C8553D'),
  accent2: color('Second accent').default('#4F6D58'),
  pop: color('Pop').default('#F2A541'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'cherry-cola': { background: '#2A0A10', surface: '#3F1019', ink: '#FFE8E0', accent: '#E3173E', accent2: '#F5C6AA', pop: '#F7B32B' },
  evergreen: { background: '#EEF1E6', surface: '#DCE3CC', ink: '#1E2A1A', accent: '#4F6D58', accent2: '#C8553D', pop: '#C9A227', eyebrow: 'Season’s greetings from Ringside' },
  'thank-you': { lead: 'THANK YOU', year: 'SDRs', eyebrow: 'Happy holidays, sales floor', message: 'Every dial, every callback, every booked meeting. We see you. Rest up.', background: '#F4E9D8', surface: '#E6D3B3', ink: '#2E2A24', accent: '#D96C3D', accent2: '#2C7873', pop: '#E9B44C' },
};

type P = z.infer<typeof schema>;

const S = 1080;
const B = T.beat;
const WORD = T.beats(2); // 60: "RING IN"
const YEAR = T.bars(1); // 120: year slams, cannons fire
const RING2 = T.bars(2); // 240: second ring + small burst
const END = video.durationInFrames;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 120;
};

/** Confetti with linear drag: shoots high, hangs, then drifts down at terminal speed. */
function Confetti({ f, at, p, count, seed, origin, spread, power }: { f: number; at: number; p: P; count: number; seed: number; origin: [number, number][]; spread: number; power: number }) {
  if (f < at) return null;
  const t = (f - at) / FPS;
  const k = 2.1;
  const vt = 150;
  const colors = [p.accent, p.pop, p.accent2, p.ink, p.surface];
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const r = (n: number) => rand(seed * 31.7 + i * 7.13 + n);
        const [ox, oy] = origin[i % origin.length];
        const dir = ox < S / 2 ? 1 : ox > S / 2 ? -1 : r(9) > 0.5 ? 1 : -1;
        const ang = -Math.PI / 2 + dir * (0.12 + r(1) * spread);
        const v = power * (0.6 + r(2) * 0.55);
        const vx = Math.cos(ang) * v;
        const vy = Math.sin(ang) * v;
        const e = (1 - Math.exp(-k * t)) / k;
        const x = ox + vx * e + Math.sin(t * (2 + r(3) * 3) + r(4) * 6) * 22 * Math.min(1, t);
        const y = oy + (vy - vt) * e + vt * t;
        if (y > S + 40) return null;
        const w = 10 + r(5) * 14;
        const round = r(6) > 0.7;
        const spin = (t * (200 + r(7) * 500) + r(8) * 360) % 360;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: round ? w * 0.8 : w,
              height: round ? w * 0.8 : w * 0.46,
              borderRadius: round ? '50%' : 2,
              background: colors[i % colors.length],
              rotate: `${spin}deg`,
              scale: `1 ${round ? 1 : Math.abs(Math.cos((spin * Math.PI) / 180)) * 0.8 + 0.2}`,
              opacity: clamp(t * 12),
            }}
          />
        );
      })}
    </>
  );
}

export default function RingIn2027(p: P) {
  const f = useCurrentFrame();
  const dark = isDark(p.background);
  const hasPhoto = !!p.photo;

  const outro = prog(f, END - 30, 30, ease.inOut);
  const push = mix(1, 1.05, prog(f, 0, END, ease.inOutSoft));
  const hit = (at: number, amp: number) => (f >= at && f < at + 16 ? Math.sin((f - at) * 2.2) * amp * (1 - (f - at) / 16) : 0);
  const shake = hit(YEAR, 14) + hit(RING2, 5);

  // Phone: big in the centre while it rings (beats 0, 1), then rises to the top as the words arrive.
  const phoneIn = prog(f, 0, 20, ease.backOut);
  const rise = prog(f, B + 12, 30, ease.inOut); // up and out of the way before "RING IN" sweeps in
  const ringing = (at: number) => (f >= at && f < at + 22 ? Math.sin((f - at) * 1.9) * (1 - (f - at) / 22) : 0);
  const wiggle = ringing(4) + ringing(B + 4) + ringing(RING2) + ringing(RING2 + 10) * 0.6;
  const phoneX = hasPhoto ? mix(S / 2, 300, rise) : S / 2;
  const phoneY = mix(470, 200, rise);
  const phoneSize = mix(300, 130, rise);
  const rippleAt = [4, B + 4, RING2, RING2 + 12];

  const flash = keys(f, [YEAR - 2, YEAR + 2, YEAR + 26], [0, 1, 0], [ease.out, ease.outSoft]);
  const y = prog(f, YEAR, 16, ease.out);
  const yearSize = Math.min(280, 1180 / Math.max(4, p.year.length));
  const leadSize = p.lead.length > 8 ? 96 : 120;
  const light = dark ? p.ink : p.background;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink }}>
      <Backdrop
        base={p.background}
        frame={f}
        grid={{ opacity: dark ? 0.08 : 0.15, size: 40, y: -f * 0.15, color: dark ? '255,232,224' : '59,31,20' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,250,240,0.75)'}
        glows={[]}
        grain={0}
        vignette={dark ? 0.5 : 0.12}
      />
      {/* sun disc behind the year; it breathes */}
      <div
        style={{
          position: 'absolute',
          left: S / 2 - 400,
          top: 560 - 400,
          width: 800,
          height: 800,
          borderRadius: '50%',
          background: hexA(p.accent, dark ? 0.2 : 0.14),
          scale: String(mix(0.6, 1, prog(f, YEAR - 10, 40, ease.out)) * (1 + Math.sin(f / 40) * 0.015)),
        }}
      />

      {/* confetti cannons on the year, a smaller pop on the second ring; behind the type so copy stays legible */}
      <AbsoluteFill style={{ scale: String(push), opacity: (1 - outro) * 0.95 }}>
        <Confetti f={f} at={YEAR} p={p} count={110} seed={3} origin={[[60, S + 10], [S - 60, S + 10]]} spread={0.55} power={2300} />
        <Confetti f={f} at={RING2} p={p} count={36} seed={8} origin={[[phoneX, phoneY]]} spread={1.3} power={900} />
      </AbsoluteFill>

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.5}px`, opacity: 1 - outro }}>
        {/* eyebrow */}
        <div style={{ position: 'absolute', width: S, top: 70, textAlign: 'center', fontFamily: FONTS.chakra, fontWeight: 700, fontSize: 30, letterSpacing: '0.32em', textTransform: 'uppercase', color: p.ink, opacity: prog(f, 10, 24), translate: `0 ${mix(-16, 0, prog(f, 10, 24))}px` }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: p.pop, marginRight: 16, verticalAlign: 'middle' }} />
          {p.eyebrow}
        </div>

        {/* ring ripples */}
        <svg style={{ position: 'absolute', inset: 0 }} width={S} height={S}>
          {rippleAt.map((at, k) => {
            const r = prog(f, at, 50, ease.out);
            return f >= at ? <circle key={k} cx={phoneX} cy={phoneY} r={phoneSize * 0.55 + r * phoneSize * 1.3} fill="none" stroke={k % 2 ? p.pop : p.accent} strokeWidth={mix(10, 1, r)} opacity={(1 - r) * 0.9} /> : null;
          })}
        </svg>
        {/* handset in a clay disc with a hard shadow */}
        <div
          style={{
            position: 'absolute',
            left: phoneX - phoneSize / 2,
            top: phoneY - phoneSize / 2,
            width: phoneSize,
            height: phoneSize,
            borderRadius: '50%',
            background: p.accent,
            border: `${phoneSize * 0.025}px solid ${p.ink}`,
            boxShadow: `${phoneSize * 0.045}px ${phoneSize * 0.045}px 0 ${p.ink}`,
            display: 'grid',
            placeItems: 'center',
            scale: String(phoneIn),
            rotate: `${wiggle * 14}deg`,
          }}
        >
          <svg width={phoneSize * 0.56} height={phoneSize * 0.56} viewBox="0 0 256 256">
            <PhoneIcon weight="fill" color={light} size={256} />
          </svg>
        </div>

        {/* optional team photo as a tilted postage stamp */}
        {hasPhoto && (
          <div
            style={{
              position: 'absolute',
              left: 640,
              top: 110,
              width: 280,
              height: 220,
              padding: 12,
              background: '#FBF6EE',
              boxShadow: `8px 8px 0 ${p.ink}`,
              border: `3px dashed ${hexA(p.ink, 0.45)}`,
              rotate: `${mix(14, 5, prog(f, WORD, 30, ease.backOut))}deg`,
              opacity: prog(f, WORD, 20),
              scale: String(mix(1.2, 1, prog(f, WORD, 30, ease.out))),
            }}
          >
            <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        )}

        {/* "RING IN" */}
        <SweepReveal frame={f} start={WORD} dur={28} style={{ position: 'absolute', width: S, top: 300, textAlign: 'center', ...displayFace('dela'), fontSize: leadSize, lineHeight: 1, letterSpacing: '0.02em', color: p.ink, whiteSpace: 'nowrap' }}>
          {p.lead}
        </SweepReveal>

        {/* the year slams down */}
        {f >= YEAR - 2 && (
          <>
            <div
              style={{
                position: 'absolute',
                width: S,
                top: 400,
                textAlign: 'center',
                ...displayFace('dela'),
                fontSize: yearSize,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                color: p.accent,
                textShadow: `12px 12px 0 ${p.ink}`,
                whiteSpace: 'nowrap',
                opacity: clamp(y * 2.5),
                scale: String(mix(1.7, 1, y)),
                rotate: `${mix(-10, -4, y)}deg`,
                filter: y < 1 ? `blur(${(1 - y) * 18}px)` : undefined,
              }}
            >
              {p.year}
            </div>
            <Glint frame={f} start={RING2 + 20} dur={44} style={{ position: 'absolute', width: S, top: 400, textAlign: 'center', ...displayFace('dela'), fontSize: yearSize, lineHeight: 1, letterSpacing: '-0.03em', rotate: '-4deg', whiteSpace: 'nowrap' }}>
              {p.year}
            </Glint>
          </>
        )}

        {/* message + signature */}
        <WordsIn
          text={p.message}
          frame={f}
          start={YEAR + 36}
          stagger={3}
          style={{ position: 'absolute', left: 130, width: S - 260, top: 790, justifyContent: 'center', textAlign: 'center', fontFamily: FONTS.familjen, fontWeight: 500, fontSize: 44, lineHeight: 1.22, color: p.ink }}
        />
        <div style={{ position: 'absolute', width: S, top: 945, textAlign: 'center', fontFamily: FONTS.chakra, fontWeight: 700, fontSize: 30, letterSpacing: '0.24em', textTransform: 'uppercase', color: p.accent2 === p.background ? p.ink : dark ? p.accent2 : p.ink, opacity: prog(f, YEAR + 90, 24) }}>
          {p.signature}
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 52%, ${hexA(p.pop, flash * 0.85)} 0%, ${hexA(p.pop, flash * 0.3)} 32%, transparent 66%)`, mixBlendMode: dark ? 'screen' : 'multiply' }} />
      <FilmOverlay grain={0.06} vignette={dark ? 0.4 : 0.1} frame={f} />
    </AbsoluteFill>
  );
}
