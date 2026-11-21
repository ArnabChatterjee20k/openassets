import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, FilmOverlay, Glint, clamp, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Arcade Live Event',
  category: 'event',
  description:
    'Landscape livestream announcement in attract mode: a coin drops into the slot, the event title slams in under chasing marquee bulbs, the speaker appears on an arcade screen, then date chips, a live countdown and the RSVP pill land on the beat.',
  tags: ['event', 'livestream', 'webinar', 'arcade', 'pinball', 'memphis', 'youtube'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30 frames, bar = 120
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Multiball presents'),
  title: text('Title line 1').default('Ad Arcade'),
  title2: text('Title line 2').default('Live'),
  date: text('Date').default('Dec 4'),
  time: text('Time').default('6PM CET'),
  place: text('Where').default('Live on YouTube'),
  countdown: text('Countdown (prefix)').default('13D 04H 12M'),
  cta: text('Call to action').default('Save your seat'),
  speakerName: text('Speaker name').default('Maya Reyes'),
  speakerRole: text('Speaker role').default('Head of Growth'),
  speakerPhoto: image('Speaker photo (optional)').default(''),
  coinLabel: text('Coin slot label').default('Free entry'),
  background: color().default('#FFF6E9'),
  surface: color('Surface').default('#FFE3D3'),
  ink: color('Ink').default('#1A1A2E'),
  accent: color().default('#FF6F91'),
  accent2: color('Second color').default('#00B3A4'),
  pop: color('Pop').default('#FFC93C'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'after-dark': { background: '#12001F', surface: '#24003D', ink: '#FBEFFF', accent: '#FF2E88', accent2: '#B026FF', pop: '#FFD600', title: 'Night Shift', title2: 'Live', eyebrow: 'Late-night AMA', time: '9PM EST', place: 'Live on Twitch' },
  workshop: { background: '#F4EFE6', surface: '#EAE2D3', ink: '#1F2A6B', accent: '#FF48B0', accent2: '#0078BF', pop: '#FFE800', title: 'TikTok Ads', title2: 'Lab', eyebrow: 'Hands-on workshop', date: 'Jan 15', time: '11AM PT', place: 'Zoom · 40 seats', cta: 'Grab a seat', speakerName: 'Kai Mensah', speakerRole: 'Paid Social Lead' },
  citrus: { background: '#FFF8E1', surface: '#FFE9A8', ink: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F', title: 'Q1 Ads', title2: 'Draft', eyebrow: 'Planning session', date: 'Jan 8', time: '5PM GMT', place: 'LinkedIn Live', countdown: '06D 22H 40M' },
};

type P = z.infer<typeof schema>;

const NABLA_CSS = `@font-palette-values --mb-flat { font-family: 'Nabla'; override-colors: ${Array.from({ length: 32 }, (_, i) => `${i} currentColor`).join(', ')}; }`;

function arcade(face: string, side: string, size: number): CSSProperties {
  const depth = Math.max(3, Math.round(size * 0.07));
  return {
    fontFamily: FONTS.nabla,
    fontPalette: '--mb-flat',
    color: face,
    textShadow: Array.from({ length: depth }, (_, i) => `${i + 1}px ${i + 1}px 0 ${side}`).join(', '),
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
  } as CSSProperties;
}

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};
const onColor = (hex: string) => (isDark(hex) ? '#FFF6E9' : '#1A1A2E');

const W = 1920;
const H = 1080;
const BAR2 = T.bars(1);
const BAR3 = T.bars(2);
const BAR4 = T.bars(3);
const COIN_IN = T.beats(2);

/** Chasing marquee bulbs around the frame, like a backglass. */
function Marquee({ frame, p, boost }: { frame: number; p: P; boost: number }) {
  const inset = 30;
  const gap = 64;
  const pts: [number, number][] = [];
  for (let x = inset; x <= W - inset; x += gap) pts.push([x, inset]);
  for (let y = inset + gap; y <= H - inset; y += gap) pts.push([W - inset, y]);
  for (let x = W - inset - gap; x >= inset; x -= gap) pts.push([x, H - inset]);
  for (let y = H - inset - gap; y > inset; y -= gap) pts.push([inset, y]);
  const step = Math.floor(frame / (boost > 0.5 ? 3 : 6));
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <rect x={inset} y={inset} width={W - inset * 2} height={H - inset * 2} rx={26} fill="none" stroke={p.ink} strokeWidth={4} opacity={0.9} />
      {pts.map(([x, y], i) => {
        const lit = (i + step) % 3 === 0 || boost > 0.85;
        return (
          <g key={i}>
            {lit && <circle cx={x} cy={y} r={20} fill={p.pop} opacity={0.35} />}
            <circle cx={x} cy={y} r={9} fill={lit ? p.pop : p.surface} stroke={p.ink} strokeWidth={3} />
          </g>
        );
      })}
    </svg>
  );
}

/** Bar 1: a coin drops into the slot plate. */
function CoinSlot({ frame, p }: { frame: number; p: P }) {
  const out = prog(frame, BAR2 - 14, 14, ease.in);
  if (out >= 1) return null;
  const enter = prog(frame, 0, 26, ease.out);
  const cx = W / 2;
  const S = 470;
  const plateTop = 190;
  const slotY = plateTop + 156;
  // coin falls in front of the plate, lands in the slot on beat 2, turns edge-on and sinks
  const fall = Math.pow(clamp((frame - 6) / (COIN_IN - 6)), 1.7);
  const sink = prog(frame, COIN_IN, 12, ease.inOutSoft);
  const coinY = mix(-110, slotY, fall) + sink * 30;
  const lightHit = keys(frame, [COIN_IN, COIN_IN + 3, COIN_IN + 26], [0, 1, 0], [ease.out, ease.inOutSoft]);
  const credit = frame >= T.beats(3);
  const creditPop = prog(frame, T.beats(3), 16, ease.backOut);
  const blink = Math.floor(frame / 15) % 2 === 0;
  const dark = isDark(p.background);
  const ring = prog(frame, COIN_IN, 30, ease.out);
  const rr = S / 2 + 20 + ring * 160;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: (1 - out) * enter, scale: String(mix(0.92, 1, enter) * mix(1, 1.25, out)), filter: out > 0 ? `blur(${out * 14}px)` : undefined }}>
      {frame >= COIN_IN && frame < COIN_IN + 30 && (
        <div style={{ position: 'absolute', left: cx - rr, top: plateTop + S / 2 - rr, width: rr * 2, height: rr * 2, borderRadius: 60 + ring * 220, border: `${mix(10, 1, ring)}px solid ${p.accent}`, opacity: 1 - ring }} />
      )}
      <div style={{ position: 'absolute', left: cx - S / 2, top: plateTop, width: S, height: S, borderRadius: 44, background: p.accent, border: `10px solid ${p.ink}`, boxShadow: `18px 18px 0 ${p.ink}`, boxSizing: 'border-box', scale: String(1 + lightHit * 0.03) }}>
        {[[22, 22], [S - 58, 22], [22, S - 58], [S - 58, S - 58]].map(([x, y], i) => (
          <div key={i} style={{ position: 'absolute', left: x, top: y, width: 16, height: 16, borderRadius: '50%', background: p.ink, opacity: 0.7 }} />
        ))}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center', fontFamily: FONTS.pressstart, fontSize: 24, color: onColor(p.accent), letterSpacing: '0.2em' }}>25¢</div>
        <div style={{ position: 'absolute', left: 80, right: 80, top: 90, height: 120, borderRadius: 24, background: p.ink }} />
        <div style={{ position: 'absolute', left: S / 2 - 24, width: 28, top: 106, height: 88, borderRadius: 10, background: lightHit > 0.3 ? p.pop : hexA(p.pop, 0.5), boxShadow: lightHit > 0.1 ? `0 0 ${50 * lightHit}px ${p.pop}` : undefined }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 256, textAlign: 'center', fontFamily: FONTS.pressstart, fontSize: 30, color: onColor(p.accent), textTransform: 'uppercase' }}>{p.coinLabel}</div>
        <div style={{ position: 'absolute', left: 120, right: 120, top: 322, height: 74, borderRadius: 14, background: p.surface, border: `7px solid ${p.ink}`, display: 'grid', placeItems: 'center', fontFamily: FONTS.pressstart, fontSize: 32, color: p.ink }}>
          <span style={{ scale: String(credit ? mix(1.6, 1, creditPop) : 1) }}>{credit ? '01' : '00'}</span>
        </div>
      </div>
      {/* the coin: in front of the plate until it turns edge-on into the slot */}
      {sink < 1 && (
        <div style={{ position: 'absolute', left: cx - 10 - 80, top: coinY - 80, width: 160, height: 160, borderRadius: '50%', background: p.pop, border: `9px solid ${p.ink}`, boxShadow: `inset -12px -12px 0 ${hexA(p.ink, 0.18)}, 8px 10px 0 ${p.ink}`, display: 'grid', placeItems: 'center', fontFamily: FONTS.rubikmono, fontSize: 72, color: '#1A1A2E', boxSizing: 'border-box', scale: `${mix(1, 0.14, sink)} 1`, opacity: 1 - sink * 0.6 }}>
          M
        </div>
      )}
      <div style={{ position: 'absolute', left: 0, width: W, top: 760, textAlign: 'center', fontFamily: FONTS.pressstart, fontSize: 64, color: credit ? (dark ? p.pop : p.accent) : p.ink, opacity: credit || blink ? 1 : 0.15, textTransform: 'uppercase', letterSpacing: '0.06em', scale: String(credit ? mix(1.3, 1, creditPop) : 1), textShadow: credit ? `5px 5px 0 ${p.ink}` : undefined }}>
        {credit ? 'Credit 01' : 'Insert coin'}
      </div>
    </div>
  );
}

/** Attract-mode HUD in the top-left corner (bar 1 only; the eyebrow takes over after). */
function Hud({ frame, p }: { frame: number; p: P }) {
  const dark = isDark(p.background);
  const out = prog(frame, BAR2 - 14, 14, ease.in);
  return (
    <div style={{ position: 'absolute', left: 90, top: 80, fontFamily: FONTS.pressstart, fontSize: 26, color: p.ink, lineHeight: 1.7, opacity: 1 - out }}>
      <div style={{ color: dark ? p.pop : p.accent }}>1UP</div>
      <div>{frame >= T.beats(3) ? 'CREDIT 01' : 'CREDIT 00'}</div>
    </div>
  );
}

function Chip({ label, at, frame, p, bg, fg, rotate }: { label: string; at: number; frame: number; p: P; bg: string; fg: string; rotate: number }) {
  if (!label) return null;
  const t = prog(frame, at, 22, ease.backOut);
  return (
    <div
      style={{
        padding: '18px 24px',
        background: bg,
        color: fg,
        border: `6px solid ${p.ink}`,
        boxShadow: `8px 8px 0 ${p.ink}`,
        borderRadius: 14,
        fontFamily: FONTS.pressstart,
        fontSize: 28,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        rotate: `${rotate}deg`,
        scale: String(t),
        opacity: clamp(prog(frame, at, 8)),
      }}
    >
      {label}
    </div>
  );
}

/** Speaker on an arcade cabinet screen with scanlines; initials when there's no photo. */
function SpeakerScreen({ frame, p }: { frame: number; p: P }) {
  const at = BAR2 + T.beats(2);
  const t = prog(frame, at, 34, ease.out);
  const x = 1170;
  const y = 150;
  const w = 600;
  const h = 560;
  const initials = p.speakerName.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
  const nameIn = prog(frame, BAR3 + T.beats(0.5), 26, ease.out);
  const blink = Math.floor(frame / 20) % 2 === 0;
  const scan = (frame * 2) % h;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h + 130, translate: `${mix(700, 0, t)}px 0`, rotate: `${mix(8, 2, t)}deg` }}>
      {/* P1 tag */}
      <div style={{ position: 'absolute', left: 26, top: -46, padding: '10px 14px', background: p.ink, color: isDark(p.ink) ? p.pop : '#1A1A2E', fontFamily: FONTS.pressstart, fontSize: 22, textTransform: 'uppercase', borderRadius: 8 }}>
        <span style={{ color: blink ? p.accent : p.pop }}>●</span> Player 1
      </div>
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, borderRadius: 34, background: p.ink, boxShadow: `18px 18px 0 ${hexA(p.ink, 0.9)}`, padding: 22, boxSizing: 'border-box' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 20, overflow: 'hidden', background: p.accent2 }}>
          {p.speakerPhoto ? (
            <Img src={p.speakerPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover', scale: String(mix(1.12, 1.02, prog(frame, at, 300, ease.outSoft))) }} />
          ) : (
            <>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${hexA(p.ink, 0.14)} 2px, transparent 2px), linear-gradient(90deg, ${hexA(p.ink, 0.14)} 2px, transparent 2px)`, backgroundSize: '40px 40px', backgroundPosition: `0 ${frame * 0.4}px` }} />
              <div style={{ position: 'absolute', left: '50%', top: '50%', width: 340, height: 340, marginLeft: -170, marginTop: -170, borderRadius: '50%', background: p.accent, border: `9px solid ${p.ink}` }} />
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 190, lineHeight: 1, paddingBottom: 20 }}>
                <span style={arcade(p.pop, p.ink, 190)}>{initials}</span>
              </div>
            </>
          )}
          {/* scanlines + rolling bar */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(0deg, ${hexA('#000000', 0.12)} 0 2px, transparent 2px 6px)`, mixBlendMode: 'multiply' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: scan - 60, height: 60, background: `linear-gradient(transparent, ${hexA('#FFFFFF', 0.18)}, transparent)` }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: 20, boxShadow: `inset 0 0 80px ${hexA('#000000', 0.35)}` }} />
        </div>
      </div>
      {/* name plate */}
      <div style={{ position: 'absolute', left: 40, right: 40, top: h - 30, padding: '20px 26px', background: p.surface, border: `6px solid ${p.ink}`, borderRadius: 16, boxShadow: `8px 8px 0 ${p.ink}`, opacity: clamp(nameIn * 2), translate: `0 ${mix(30, 0, nameIn)}px` }}>
        <div style={{ fontFamily: FONTS.rubikmono, fontSize: p.speakerName.length > 14 ? 36 : 44, color: p.ink, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.speakerName}</div>
        <div style={{ marginTop: 12, fontFamily: FONTS.pressstart, fontSize: 22, color: p.ink, opacity: 0.85, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{p.speakerRole}</div>
      </div>
    </div>
  );
}

/** The kit's bouncing ball: it hops along the floor and touches down on every beat. */
function FloorBall({ frame, p }: { frame: number; p: P }) {
  const start = BAR2;
  if (frame < start) return null;
  const t = frame - start;
  const x = mix(-80, W + 80, t / (T.bars(3) + 10));
  const ph = (t % T.beat) / T.beat;
  const floor = 1008;
  const y = floor - 34 - Math.sin(ph * Math.PI) * 62;
  const squash = ph < 0.08 || ph > 0.92 ? 0.82 : 1;
  const ring = ph;
  return (
    <>
      <div style={{ position: 'absolute', left: x - 30 - ring * 40, top: floor - 8 - ring * 6, width: 60 + ring * 80, height: 16 + ring * 12, borderRadius: '50%', border: `3px solid ${p.ink}`, opacity: (1 - ring) * 0.4 }} />
      <div style={{ position: 'absolute', left: x - 34 + 6, top: y - 34 + 9, width: 68, height: 68, borderRadius: '50%', background: hexA(p.ink, 0.9), scale: `${2 - squash} ${squash}` }} />
      <div
        style={{
          position: 'absolute',
          left: x - 34,
          top: y - 34,
          width: 68,
          height: 68,
          borderRadius: '50%',
          border: `6px solid ${p.ink}`,
          background: 'radial-gradient(circle at 34% 30%, #FFFFFF 0%, #D9DCE4 45%, #7C8296 100%)',
          boxSizing: 'border-box',
          scale: `${2 - squash} ${squash}`,
          transformOrigin: '50% 100%',
        }}
      >
        <div style={{ position: 'absolute', left: 12, top: 10, width: 12, height: 12, borderRadius: '50%', background: p.pop }} />
      </div>
    </>
  );
}

export default function ArcadeLiveEvent(p: P) {
  const frame = useCurrentFrame();
  const end = video.durationInFrames;
  const dark = isDark(p.background);

  const flash = keys(frame, [BAR2 - 1, BAR2 + 1, BAR2 + 24], [0, 0.85, 0], [ease.out, ease.outSoft]);
  const shake = frame >= BAR2 && frame < BAR2 + 14 ? Math.sin(frame * 2.3) * (1 - (frame - BAR2) / 14) * 12 : 0;
  const push = mix(1, 1.035, prog(frame, BAR2, end - BAR2, ease.inOutSoft));
  const outro = prog(frame, end - 20, 20, ease.in);

  // Title: two Nabla lines sized to fit the 960 px copy column.
  const L1 = Math.min(190, Math.floor(960 / Math.max(1, p.title.length * 0.6)));
  const L2 = Math.min(270, Math.floor(960 / Math.max(1, p.title2.length * 0.6)));
  const s1 = prog(frame, BAR2, 18, ease.backOut);
  const s2 = prog(frame, BAR2 + 6, 20, ease.backOut);
  const titleX = 150;
  const t1Top = 250;
  const t2Top = t1Top + L1 * 1.02;
  const chipsTop = t2Top + L2 * 1.0 + 10;

  // Countdown seconds tick down once per second.
  const secs = 59 - (Math.floor(frame / FPS) % 60);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, overflow: 'hidden' }}>
      <style>{NABLA_CSS}</style>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.14 : 0.2, size: 40, y: -frame * 0.15, color: dark ? '255,255,255' : '26,26,46', fade: 1 }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)'}
        glows={dark ? [{ x: 1470, y: 430, size: 1100, color: hexA(p.accent2, 0.5), opacity: 0.55 + 0.2 * Math.sin(frame / 30) }, { x: 400, y: 500, size: 900, color: hexA(p.accent, 0.35), opacity: 0.5 }] : []}
        grain={0}
        vignette={dark ? 0.5 : 0.08}
      />

      <AbsoluteFill style={{ translate: `${shake}px ${shake * 0.6}px`, scale: String(push), opacity: 1 - outro }}>
        {/* Memphis furniture */}
        <div style={{ position: 'absolute', right: -200 + Math.sin(frame / 50) * 12, top: -260, width: 640, height: 640, borderRadius: '50%', background: p.accent2, opacity: dark ? 0.5 : 1 }} />
        <div style={{ position: 'absolute', left: -160, bottom: -230 + Math.sin(frame / 44) * 10, width: 520, height: 520, borderRadius: '50%', background: p.surface, border: `8px solid ${p.ink}` }} />
        <div style={{ position: 'absolute', right: 120, bottom: 80, width: 260, height: 260, background: `repeating-linear-gradient(45deg, ${p.ink} 0 6px, transparent 6px 24px)`, opacity: 0.35, rotate: `${12 + frame * 0.03}deg` }} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <path d={`M560,${118 + Math.sin(frame / 30) * 6} q22,-32 44,0 t44,0 t44,0 t44,0`} fill="none" stroke={p.accent} strokeWidth="12" strokeLinecap="round" />
          <path d="M1050,84 L1086,146 L1014,146 Z" fill={p.pop} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" transform={`rotate(${frame * 0.15} 1050 125)`} />
          <circle cx={1100} cy={250 + Math.sin(frame / 36) * 8} r={18} fill="none" stroke={p.accent2} strokeWidth="6" />
        </svg>

        <Marquee frame={frame} p={p} boost={flash} />
        <Hud frame={frame} p={p} />
        {/* the ball hops behind the copy so it never covers a word */}
        <FloorBall frame={frame} p={p} />

        {/* Bar 1: attract mode */}
        <CoinSlot frame={frame} p={p} />

        {/* Bar 2: the title */}
        {frame >= BAR2 && (
          <>
            <div style={{ position: 'absolute', left: titleX, top: 170, opacity: prog(frame, BAR2 + 10, 16), translate: `${mix(-30, 0, prog(frame, BAR2 + 10, 24))}px 0` }}>
              <span style={{ display: 'inline-block', background: p.pop, padding: '12px 18px', border: `5px solid ${p.ink}`, fontFamily: FONTS.pressstart, fontSize: 26, color: '#1A1A2E', letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: `6px 6px 0 ${p.ink}` }}>{p.eyebrow}</span>
            </div>
            <div style={{ position: 'absolute', left: titleX, top: t1Top, fontSize: L1, lineHeight: 1, scale: String(mix(1.7, 1, s1)), transformOrigin: '0% 50%', opacity: clamp(s1 * 3) }}>
              <span style={arcade(p.accent2, p.ink, L1)}>{p.title}</span>
            </div>
            <div style={{ position: 'absolute', left: titleX, top: t2Top, fontSize: L2, lineHeight: 1, scale: String(mix(1.8, 1, s2)), transformOrigin: '0% 50%', opacity: clamp(s2 * 3) }}>
              <span style={arcade(p.accent, p.ink, L2)}>{p.title2}</span>
            </div>
            <Glint frame={frame} start={BAR4 + T.beats(2)} dur={40} style={{ position: 'absolute', left: titleX, top: t2Top, fontSize: L2, lineHeight: 1, fontFamily: FONTS.nabla, fontPalette: '--mb-flat', textTransform: 'uppercase', letterSpacing: '0.01em', whiteSpace: 'nowrap' } as CSSProperties}>
              {p.title2}
            </Glint>
          </>
        )}

        {frame >= BAR2 && <SpeakerScreen frame={frame} p={p} />}

        {/* Bar 3: when / where, one per beat */}
        <div style={{ position: 'absolute', left: titleX, top: chipsTop, display: 'flex', gap: 22, alignItems: 'center', maxWidth: 1000 }}>
          <Chip label={p.date} at={BAR3} frame={frame} p={p} bg={p.accent2} fg={onColor(p.accent2)} rotate={-3} />
          <Chip label={p.time} at={BAR3 + T.beats(1)} frame={frame} p={p} bg={p.surface} fg={p.ink} rotate={2} />
          <Chip label={p.place} at={BAR3 + T.beats(2)} frame={frame} p={p} bg={p.pop} fg="#1A1A2E" rotate={-2} />
        </div>

        {/* Bar 4: RSVP + countdown */}
        <div style={{ position: 'absolute', left: titleX, top: chipsTop + 130, display: 'flex', alignItems: 'center', gap: 40 }}>
          <div
            style={{
              padding: '24px 48px',
              borderRadius: 999,
              background: p.accent,
              color: onColor(p.accent),
              border: `7px solid ${p.ink}`,
              boxShadow: `10px 10px 0 ${p.ink}`,
              fontFamily: FONTS.rubikmono,
              fontSize: 44,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              scale: String(prog(frame, BAR4, 24, ease.backOut) * (1 + 0.025 * Math.max(0, Math.sin((frame - BAR4) / 9.55)))),
              opacity: clamp(prog(frame, BAR4, 8)),
            }}
          >
            {p.cta} ▸
          </div>
          <div style={{ fontFamily: FONTS.pressstart, color: p.ink, opacity: clamp(prog(frame, BAR4 + T.beats(1), 10)), translate: `${mix(-20, 0, prog(frame, BAR4 + T.beats(1), 20))}px 0`, lineHeight: 1.7 }}>
            <div style={{ fontSize: 24, color: dark ? p.pop : p.accent, letterSpacing: '0.2em' }}>STARTS IN</div>
            <div style={{ fontSize: 34, whiteSpace: 'nowrap' }}>
              {p.countdown} {String(secs).padStart(2, '0')}S
            </div>
          </div>
        </div>

      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 40% 45%, ${hexA('#FFFFFF', flash)} 0%, ${hexA(p.pop, flash * 0.9)} 35%, ${hexA(p.pop, flash * 0.4)} 80%)`, pointerEvents: 'none' }} />
      <FilmOverlay grain={0.04} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
