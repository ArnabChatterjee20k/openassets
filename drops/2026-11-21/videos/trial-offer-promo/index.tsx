import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, FilmOverlay, Glint, clamp, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Trial Offer Promo',
  category: 'promo',
  description:
    'Square promo for a trial offer: a ball ricochets off three platform bumpers on the beat, the offer slams in with a flash and confetti, then perks, promo code and CTA land one per beat.',
  tags: ['promo', 'offer', 'discount', 'pinball', 'memphis', 'social'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30 frames, bar = 120
export const video: VideoConfig = { width: 1080, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Multiball Pro'),
  offer: text('Offer').default('50% OFF'),
  sub: text('Offer line').default('your first 3 months'),
  perk1: text('Perk 1').default('34 ad platforms'),
  perk2: text('Perk 2').default('AI autopilot'),
  code: text('Promo code').default('MULTI50'),
  cta: text('Call to action').default('Start free trial'),
  deadline: text('Deadline tag').default('Ends Dec 2'),
  bumper1: text('Bumper 1').default('META'),
  bumper2: text('Bumper 2').default('TIKTOK'),
  bumper3: text('Bumper 3').default('GOOGLE'),
  background: color().default('#FFF6E9'),
  surface: color('Surface').default('#FFE3D3'),
  ink: color('Ink').default('#1A1A2E'),
  accent: color().default('#FF6F91'),
  accent2: color('Second color').default('#00B3A4'),
  pop: color('Pop').default('#FFC93C'),
  productImage: image('Product screenshot (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'black-friday': { offer: '60% OFF', sub: 'Black Friday · 3 months', code: 'BF60', deadline: 'Ends Nov 30', background: '#12001F', surface: '#24003D', ink: '#FBEFFF', accent: '#FF2E88', accent2: '#B026FF', pop: '#FFD600' },
  citrus: { background: '#FFF8E1', surface: '#FFE9A8', ink: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F', offer: 'FREE', sub: 'for 30 days', code: 'PLAY30', cta: 'Claim 30 days' },
  riso: { background: '#F4EFE6', surface: '#EAE2D3', ink: '#1F2A6B', accent: '#FF48B0', accent2: '#0078BF', pop: '#FFE800', eyebrow: 'Agency plan', offer: '3 SEATS', sub: 'free with any plan', code: 'AGENCY3' },
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

const IMPACT = T.bars(1); // 120
const B1 = { x: 300, y: 420 };
const B2 = { x: 790, y: 380 };
const B3 = { x: 560, y: 720 };
const HITS = [T.beats(1), T.beats(2), T.beats(3)];

/** Ball path for bar 1: plunger launch, then three beat-synced bumper hits, then into the centre. */
const BALL_KEYS: { f: number; x: number; y: number }[] = [
  { f: 0, x: 980, y: 1000 },
  { f: 14, x: 980, y: 170 },
  { f: HITS[0], x: B1.x + 70, y: B1.y - 62 },
  { f: HITS[1], x: B2.x - 80, y: B2.y + 40 },
  { f: HITS[2], x: B3.x + 40, y: B3.y - 88 },
  { f: IMPACT, x: 540, y: 470 },
];
function ballAt(f: number) {
  const k = BALL_KEYS;
  if (f <= k[0].f) return k[0];
  for (let i = 0; i < k.length - 1; i++) {
    if (f <= k[i + 1].f) {
      const t = ease.outSoft(clamp((f - k[i].f) / (k[i + 1].f - k[i].f)));
      return { f, x: mix(k[i].x, k[i + 1].x, t), y: mix(k[i].y, k[i + 1].y, t) };
    }
  }
  return k[k.length - 1];
}

function Bumper({ x, y, c, label, hit, frame, p, gone }: { x: number; y: number; c: string; label: string; hit: number; frame: number; p: P; gone: number }) {
  const r = 104;
  const pop = keys(frame, [hit, hit + 3, hit + 18], [0, 1, 0], [ease.out, ease.inOutSoft]);
  const ring = prog(frame, hit, 34, ease.out);
  const enter = prog(frame, 0, 22, ease.backOut);
  const s = enter * (1 + pop * 0.16) * (1 - gone);
  const size = Math.min(34, Math.floor((r * 1.25) / Math.max(1, label.length)));
  const dark = isDark(p.ink) ? p.ink : p.background;
  return (
    <>
      {frame >= hit && frame < hit + 34 && (
        <div style={{ position: 'absolute', left: x - (r + 14 + ring * 120), top: y - (r + 14 + ring * 120), width: (r + 14 + ring * 120) * 2, height: (r + 14 + ring * 120) * 2, borderRadius: '50%', border: `${mix(10, 1, ring)}px solid ${c}`, opacity: 1 - ring }} />
      )}
      <div style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, scale: String(s) }}>
        <div style={{ position: 'absolute', inset: 0, translate: '12px 18px', borderRadius: '50%', background: p.ink }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: pop > 0.3 ? p.pop : c, border: `9px solid ${p.ink}` }} />
        <div style={{ position: 'absolute', inset: r * 0.28, borderRadius: '50%', background: '#FFFFFF', border: `7px solid ${p.ink}`, display: 'grid', placeItems: 'center', fontFamily: FONTS.pressstart, fontSize: size, color: dark }}>
          {label}
        </div>
      </div>
      {/* score pop */}
      {frame >= hit && frame < hit + 44 && (
        <div style={{ position: 'absolute', left: x - 200, width: 400, top: y - r - 62 - prog(frame, hit, 44) * 28, textAlign: 'center', fontFamily: FONTS.pressstart, fontSize: 40, color: p.ink, opacity: 1 - prog(frame, hit + 24, 20, ease.in), scale: String(mix(0.6, 1, prog(frame, hit, 10, ease.backOut))) }}>
          +1,000
        </div>
      )}
    </>
  );
}

/** Memphis confetti fired from the centre: high arc, linear drag, then drifts down. */
function Burst({ frame, at, p }: { frame: number; at: number; p: P }) {
  const t = frame - at;
  if (t < 0 || t > 150) return null;
  // Confetti clears before the perks land so nothing crosses the copy.
  const fade = 1 - prog(t, 70, 60, ease.inOutSoft);
  const cols = [p.accent, p.accent2, p.pop, p.ink];
  const d = 0.9;
  return (
    <svg width={1080} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: fade }}>
      {Array.from({ length: 34 }, (_, i) => {
        const a = rand(i * 4.1 + 2) * Math.PI * 2;
        const v = 22 + rand(i * 7.3) * 26;
        const travel = (1 - Math.pow(d, t)) / (1 - d);
        const x = 540 + Math.cos(a) * v * travel;
        const y = 470 + Math.sin(a) * v * travel + t * (0.9 + rand(i) * 0.8);
        const rot = rand(i * 2.9) * 360 + t * (rand(i * 3.3) - 0.5) * 8;
        const c = cols[i % 4];
        const k = 1.4 + rand(i * 1.7) * 1.2;
        const kind = i % 4;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
            {kind === 0 && <path d="M-18,0 q4.5,-8 9,0 t9,0 t9,0 t9,0" fill="none" stroke={c} strokeWidth="4.5" strokeLinecap="round" />}
            {kind === 1 && <path d="M0,-10 L10,8 L-10,8 Z" fill={c} stroke={p.ink} strokeWidth="2" strokeLinejoin="round" />}
            {kind === 2 && <circle r="7" fill="none" stroke={c} strokeWidth="4" />}
            {kind === 3 && <rect x="-2.5" y="-11" width="5" height="22" rx="2.5" fill={c} />}
          </g>
        );
      })}
    </svg>
  );
}

function Sticker({ label, at, frame, p, bg, fg, rotate, style }: { label: string; at: number; frame: number; p: P; bg: string; fg: string; rotate: number; style: CSSProperties }) {
  if (!label) return null;
  const t = prog(frame, at, 22, ease.backOut);
  return (
    <div
      style={{
        position: 'absolute',
        padding: '20px 26px',
        background: bg,
        color: fg,
        border: `6px solid ${p.ink}`,
        boxShadow: `9px 9px 0 ${p.ink}`,
        borderRadius: 14,
        fontFamily: FONTS.pressstart,
        fontSize: 30,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        rotate: `${rotate}deg`,
        scale: String(t),
        opacity: clamp(prog(frame, at, 8)),
        ...style,
      }}
    >
      {label}
    </div>
  );
}

export default function TrialOfferPromo(p: P) {
  const frame = useCurrentFrame();
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const hasImg = !!p.productImage;

  const ball = ballAt(frame);
  const flash = keys(frame, [IMPACT - 1, IMPACT + 1, IMPACT + 22], [0, 0.85, 0], [ease.out, ease.outSoft]);
  const shake = frame >= IMPACT && frame < IMPACT + 14 ? Math.sin(frame * 2.3) * (1 - (frame - IMPACT) / 14) * 12 : 0;
  const gone = prog(frame, IMPACT - 6, 10, ease.in);
  const push = mix(1, 1.04, prog(frame, IMPACT, end - IMPACT, ease.inOutSoft));
  const outro = prog(frame, end - 18, 18, ease.in);

  // HUD score: +1,000 per hit, jackpot at the impact.
  const score = frame < HITS[0] ? 0 : frame < HITS[1] ? 1000 : frame < HITS[2] ? 2000 : frame < IMPACT ? 3000 : 50000;

  // Offer: slams in on the bar-2 downbeat, then rises to make room on bar 3.
  const BAR3 = T.bars(2);
  const BAR4 = T.bars(3);
  const slam = prog(frame, IMPACT, 18, ease.backOut);
  const rise = prog(frame, BAR3, 30, ease.inOutSoft);
  const OFFER = p.offer.length > 8 ? 170 : 230;
  const offerY = mix(430, hasImg ? 210 : 270, rise);
  const offerScale = mix(1.9, 1, slam) * mix(1, hasImg ? 0.66 : 0.82, rise);
  const offerStyle: CSSProperties = { position: 'absolute', left: 0, width: 1080, top: offerY - OFFER / 2, textAlign: 'center', fontSize: OFFER, lineHeight: 1 };

  // Ball orbits the offer after the impact (keeps the hold alive).
  const orbitA = (frame - IMPACT) / 36;
  const orbit = { x: 540 + Math.cos(orbitA) * 430 * mix(1, 0.92, rise), y: offerY + 10 + Math.sin(orbitA) * 150 * mix(1, 0.8, rise) };
  const bx = frame < IMPACT ? ball.x : orbit.x;
  const by = frame < IMPACT ? ball.y : orbit.y;

  const perkY = hasImg ? 0 : 560;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, overflow: 'hidden' }}>
      <style>{NABLA_CSS}</style>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.14 : 0.2, size: 40, y: -frame * 0.2, color: dark ? '255,255,255' : '26,26,46', fade: 1 }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)'}
        glows={dark ? [{ x: 540, y: 480, size: 1100, color: hexA(p.accent, 0.35), opacity: 0.6 + 0.2 * Math.sin(frame / 30) }] : []}
        grain={0}
        vignette={dark ? 0.5 : 0.08}
      />

      <AbsoluteFill style={{ translate: `${shake}px ${shake * 0.6}px`, scale: String(push), opacity: 1 - outro }}>
        {/* Memphis furniture: drifting corner shapes */}
        <div style={{ position: 'absolute', right: -160 + Math.sin(frame / 50) * 10, top: -170, width: 440, height: 440, borderRadius: '50%', background: p.accent2, opacity: dark ? 0.55 : 1 }} />
        <div style={{ position: 'absolute', left: -120, bottom: -150 + Math.sin(frame / 44) * 10, width: 380, height: 380, borderRadius: '50%', background: p.surface, border: `8px solid ${p.ink}` }} />
        <div style={{ position: 'absolute', left: 60, bottom: 60, width: 220, height: 220, background: `repeating-linear-gradient(45deg, ${p.ink} 0 6px, transparent 6px 22px)`, opacity: 0.45, rotate: `${10 + frame * 0.03}deg` }} />
        <svg width={1080} height={1080} style={{ position: 'absolute', inset: 0 }}>
          <path d={`M80,${150 + Math.sin(frame / 30) * 6} q20,-30 40,0 t40,0 t40,0 t40,0`} fill="none" stroke={p.accent} strokeWidth="12" strokeLinecap="round" />
          <path d="M900,860 L960,960 L840,960 Z" fill={p.pop} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" transform={`rotate(${frame * 0.15} 900 925)`} />
        </svg>

        {/* Arcade HUD */}
        <div style={{ position: 'absolute', left: 70, top: 60, fontFamily: FONTS.pressstart, fontSize: 26, color: p.ink, lineHeight: 1.6 }}>
          <div style={{ color: dark ? p.pop : p.accent }}>1UP</div>
          <div>{String(score).padStart(6, '0')}</div>
        </div>
        <div style={{ position: 'absolute', right: 70, top: 60, fontFamily: FONTS.pressstart, fontSize: 26, color: dark ? p.ink : p.background, textAlign: 'right', lineHeight: 1.6 }}>
          <div>BALL</div>
          <div>{frame < IMPACT ? '1' : 'x3'}</div>
        </div>

        {/* Bar 1: bumpers */}
        {frame < IMPACT + 6 && (
          <>
            <Bumper x={B1.x} y={B1.y} c={p.accent} label={p.bumper1} hit={HITS[0]} frame={frame} p={p} gone={gone} />
            <Bumper x={B2.x} y={B2.y} c={p.accent2} label={p.bumper2} hit={HITS[1]} frame={frame} p={p} gone={gone} />
            <Bumper x={B3.x} y={B3.y} c={p.pop} label={p.bumper3} hit={HITS[2]} frame={frame} p={p} gone={gone} />
          </>
        )}

        <Burst frame={frame} at={IMPACT} p={p} />
        {/* the ball travels behind the copy so its orbit never covers a word */}
        <Ball frame={frame} p={p} bx={bx} by={by} rise={rise} offerY={offerY} />

        {/* Offer */}
        {frame >= IMPACT && (
          <>
            <div style={{ position: 'absolute', left: 0, width: 1080, top: offerY - OFFER / 2 - mix(110, hasImg ? 50 : 80, rise), textAlign: 'center', fontFamily: FONTS.pressstart, fontSize: 30, color: p.ink, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: prog(frame, IMPACT + 8, 16) }}>
              <span style={{ background: p.pop, padding: '10px 16px', border: `5px solid ${p.ink}`, color: isDark(p.pop) ? '#FFFFFF' : '#1A1A2E' }}>{p.eyebrow}</span>
            </div>
            <div style={{ ...offerStyle, scale: String(offerScale), opacity: clamp(slam * 3) }}>
              <span style={arcade(p.accent, p.ink, OFFER)}>{p.offer}</span>
            </div>
            <Glint frame={frame} start={BAR4 + T.beats(2)} dur={40} style={{ ...offerStyle, scale: String(offerScale), fontFamily: FONTS.nabla, fontPalette: '--mb-flat', textTransform: 'uppercase', letterSpacing: '0.01em', whiteSpace: 'nowrap' } as CSSProperties}>
              {p.offer}
            </Glint>
            <div
              style={{
                position: 'absolute',
                left: 0,
                width: 1080,
                top: offerY + OFFER * 0.5 * offerScale + 26,
                textAlign: 'center',
                fontFamily: FONTS.rubikmono,
                fontSize: hasImg ? 38 : 46,
                color: p.ink,
                textTransform: 'uppercase',
                opacity: prog(frame, IMPACT + 20, 20),
                translate: `0 ${mix(24, 0, prog(frame, IMPACT + 20, 24))}px`,
              }}
            >
              {p.sub}
            </div>
          </>
        )}

        {/* Bar 3: optional product shot in a tilted laminate frame */}
        {hasImg && (
          <div
            style={{
              position: 'absolute',
              left: 540 - 330,
              top: 400,
              width: 660,
              height: 380,
              rotate: '-3deg',
              border: `8px solid ${p.ink}`,
              borderRadius: 22,
              boxShadow: `16px 16px 0 ${p.ink}`,
              background: p.surface,
              overflow: 'hidden',
              scale: String(prog(frame, BAR3 + 6, 26, ease.backOut)),
              opacity: clamp(prog(frame, BAR3 + 6, 10)),
            }}
          >
            <Img src={p.productImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* Perks + code, one per beat */}
        {hasImg ? (
          <>
            <Sticker label={p.perk1} at={BAR3 + T.beats(1)} frame={frame} p={p} bg={p.accent2} fg={isDark(p.accent2) ? '#FFFFFF' : '#1A1A2E'} rotate={-6} style={{ left: 120, top: 360 }} />
            <Sticker label={p.perk2} at={BAR3 + T.beats(2)} frame={frame} p={p} bg={p.surface} fg={p.ink} rotate={5} style={{ right: 110, top: 720 }} />
            <Sticker label={`Code ${p.code}`} at={BAR3 + T.beats(3)} frame={frame} p={p} bg={p.pop} fg="#1A1A2E" rotate={-3} style={{ left: 140, top: 760 }} />
          </>
        ) : (
          <>
            <Sticker label={p.perk1} at={BAR3 + T.beats(1)} frame={frame} p={p} bg={p.accent2} fg={isDark(p.accent2) ? '#FFFFFF' : '#1A1A2E'} rotate={-4} style={{ left: 170, top: perkY }} />
            <Sticker label={p.perk2} at={BAR3 + T.beats(2)} frame={frame} p={p} bg={p.surface} fg={p.ink} rotate={3} style={{ right: 170, top: perkY + 92 }} />
            <Sticker label={`Code ${p.code}`} at={BAR3 + T.beats(3)} frame={frame} p={p} bg={p.pop} fg="#1A1A2E" rotate={-2} style={{ left: 300, top: perkY + 190 }} />
          </>
        )}

        {/* Bar 4: CTA + deadline */}
        <div style={{ position: 'absolute', left: 0, width: 1080, top: 890, display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              padding: '26px 52px',
              borderRadius: 999,
              background: p.accent,
              color: isDark(p.accent) ? '#FFFFFF' : '#1A1A2E',
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
        </div>
        {p.deadline && (
          <div
            style={{
              position: 'absolute',
              right: 56,
              top: 800,
              padding: '14px 18px',
              background: p.ink,
              color: p.pop,
              fontFamily: FONTS.pressstart,
              fontSize: 24,
              rotate: '8deg',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              scale: String(prog(frame, BAR4 + T.beats(1), 20, ease.backOut)),
              opacity: Math.floor(frame / 15) % 2 === 0 || frame < BAR4 + T.beats(3) ? 1 : 0.55,
            }}
          >
            {p.deadline}
          </div>
        )}

      </AbsoluteFill>

      {/* impact flash, pop-coloured */}
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 44%, ${hexA('#FFFFFF', flash)} 0%, ${hexA(p.pop, flash * 0.9)} 35%, ${hexA(p.pop, flash * 0.4)} 80%)`, pointerEvents: 'none' }} />
      <FilmOverlay grain={0.04} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}

/** The ball with a short trail. Before the impact it follows the ricochet path, then orbits the offer. */
function Ball({ frame, p, bx, by, rise, offerY }: { frame: number; p: P; bx: number; by: number; rise: number; offerY: number }) {
  return (
    <>
        {[5, 4, 3, 2, 1].map((k) => {
          const f = frame - k * 1.5;
          const pt = f < IMPACT ? ballAt(f) : { x: 540 + Math.cos((f - IMPACT) / 36) * 430 * mix(1, 0.92, rise), y: offerY + 10 + Math.sin((f - IMPACT) / 36) * 150 * mix(1, 0.8, rise) };
          return <div key={k} style={{ position: 'absolute', left: pt.x - 30, top: pt.y - 30, width: 60, height: 60, borderRadius: '50%', background: p.accent, opacity: (1 - k / 6) * 0.35, scale: String(1 - k * 0.1) }} />;
        })}
        <div style={{ position: 'absolute', left: bx - 34 + 6, top: by - 34 + 9, width: 68, height: 68, borderRadius: '50%', background: p.ink }} />
        <div
          style={{
            position: 'absolute',
            left: bx - 34,
            top: by - 34,
            width: 68,
            height: 68,
            borderRadius: '50%',
            border: `6px solid ${p.ink}`,
            background: 'radial-gradient(circle at 34% 30%, #FFFFFF 0%, #D9DCE4 45%, #7C8296 100%)',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ position: 'absolute', left: 12, top: 10, width: 12, height: 12, borderRadius: '50%', background: p.pop }} />
        </div>
    </>
  );
}
