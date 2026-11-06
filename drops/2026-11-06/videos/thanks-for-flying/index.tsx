import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, font, image, num, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, clamp, displayFace, ease, hexA, keys, mix, prog, rand, shade, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Thanks for Flying',
  category: 'thank-you',
  description:
    'Square milestone thank-you: a striped sun rises while a tow plane passes, a flight-log counter rolls up to 10,000 and is stamped on the beat, then the sun sets into a serif “thank you” with a marker-swiped italic word, drifting ticket-stub confetti, a postcard (your team photo, or a sunset) and the crew’s sign-off.',
  tags: ['thank-you', 'milestone', 'counter', 'customers', 'square', 'social', 'celebration'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30 frames, bar = 120
export const video: VideoConfig = { width: 1080, height: 1080, fps: FPS, durationInFrames: T.bars(4.5) };

export const schema = z.object({
  eyebrow: text().default('Flight log · Nov 2026'),
  towText: text('Tow banner').default('THANK YOU, PILOTS'),
  count: num(0, 9999999, 1, 'Milestone number').default(10000),
  countLabel: text('Milestone label').default('Campaigns flown'),
  stamp: text('Stamp word').default('Logged'),
  headline: textarea('Headline (one line per row, *italic word*)').default('Thank you\nfor *flying*\nwith us.'),
  signature: text().default('— the Towline crew'),
  cta: text('Call to action').default('towline.ai'),
  note: text('Note under the CTA').default('Next stop: 100,000'),
  caption: text('Postcard caption').default('Greetings from 34 platforms'),
  photo: image('Team photo or logo collage (optional)').default(''),
  font: font('Headline font').default('gloock'),
  italicFont: font('Italic word font').default('instrument'),
  background: color().default('#FFEDE1'),
  surface: color('Postcard / stubs').default('#FFD3C2'),
  ink: color('Text').default('#3D0E2A'),
  accent: color('Accent (sun, banner)').default('#FF4F6D'),
  accent2: color('Sky + sea').default('#7B2CBF'),
  pop: color('Marker / stamp').default('#FFB627'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { background: '#2B1B2E', surface: '#45293F', ink: '#FFE9D6', accent: '#FF8E5E', accent2: '#E5487A', pop: '#FFD27F' },
  'mid-century': {
    background: '#F4E9D8', surface: '#E6D3B3', ink: '#2E2A24', accent: '#D96C3D', accent2: '#2C7873', pop: '#E9B44C', font: 'fraunces', italicFont: 'fraunces',
    eyebrow: 'Flight log · Year one', count: 365, countLabel: 'Days in the air', stamp: 'Year 1',
    headline: 'Thank you\nfor a *great*\nfirst year.', note: 'Year two starts Monday', caption: 'Greetings from year one',
  },
  citrus: {
    background: '#FFF8E1', surface: '#FFE9A8', ink: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F', font: 'shrikhand', italicFont: 'fraunces',
    eyebrow: 'Flight log · Q4 2026', towText: 'ONE MILLION, THANK YOU', count: 1000000, countLabel: 'Ads launched', stamp: 'Cleared',
    headline: 'A million\n*thank yous*', note: 'Here’s to the next million',
  },
  candy: {
    background: '#FDF3F8', surface: '#F7DDEB', ink: '#3A1F4A', accent: '#FF7EB6', accent2: '#8A7BFF', pop: '#4FD1C5', italicFont: 'bodoni',
    eyebrow: 'Flight log · Holiday 2026', count: 2400, countLabel: 'Brands on board', stamp: 'Aboard',
    headline: 'Thank you\nfor *trusting*\nthe pilot.', signature: '— Maya & the crew',
  },
};

type P = z.infer<typeof schema>;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};
const isDark = (hex: string) => lum(hex) < 140;
const onColor = (bg: string, a: string, b: string) => (Math.abs(lum(a) - lum(bg)) > Math.abs(lum(b) - lum(bg)) ? a : b);
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/** Compact form for stamps: 10000 → 10K, 1000000 → 1M, 2400 → 2.4K, 365 → 365. */
const short = (n: number) => {
  const t = (v: number) => String(Math.round(v * 10) / 10);
  if (n >= 1e6) return `${t(n / 1e6)}M`;
  if (n >= 1e3) return `${t(n / 1e3)}K`;
  return String(Math.round(n));
};

/** Flat poster-style prop plane facing right, nose at x=100, centreline y=0. */
function PlaneShape({ p, frame, line }: { p: P; frame: number; line: string }) {
  const body = isDark(p.background) ? shade(p.surface, 0.75) : shade(p.background, 0.55);
  const ink = { stroke: line, strokeWidth: 1.4, strokeLinejoin: 'round' as const };
  const blade = Math.cos(frame * 1.3);
  return (
    <g>
      <path d="M2,-4 L-3,-25 C-3,-27 -1,-28 2,-27 L10,-25 L26,-6 Z" fill={p.accent} {...ink} />
      <ellipse cx={11} cy={-2} rx={12} ry={2.6} fill={body} {...ink} />
      <path d="M0,-3 C14,-8 40,-12 70,-12 C86,-12 96,-8 100,-2 L100,4 C96,8 88,10 70,10 L28,9 C14,8 4,5 0,1 Z" fill={body} {...ink} />
      <path d="M6,2.2 L97,2.2" stroke={p.accent} strokeWidth={3.2} strokeLinecap="round" />
      <path d="M62,-11 C67,-20 80,-20 86,-10 Z" fill={shade(p.accent2, 0.55)} {...ink} />
      {[34, 43, 52].map((x) => (
        <circle key={x} cx={x} cy={-4} r={2.3} fill={p.accent2} />
      ))}
      <line x1={52} y1={-12} x2={45} y2={7} stroke={line} strokeWidth={1.4} />
      <ellipse cx={58} cy={-14} rx={20} ry={3.4} fill={body} {...ink} />
      <path d="M92,-7 C97,-6 100,-3 101.5,0 C100,3 97,6 92,7 Z" fill={p.accent} {...ink} />
      <line x1={62} y1={9} x2={64} y2={16} stroke={line} strokeWidth={1.6} />
      <circle cx={64} cy={17.5} r={3.6} fill={line} />
      <ellipse cx={104} cy={0} rx={2.4} ry={19} fill={line} opacity={0.14} />
      <line x1={103.5} y1={-17 * blade} x2={103.5} y2={17 * blade} stroke={line} strokeWidth={2.6} strokeLinecap="round" />
      <circle cx={103.5} cy={0} r={2.6} fill={line} />
    </g>
  );
}

/** Rippling tow banner with a swallowtail; the ripple travels with `phase`. */
function TowBanner({ id, x0, y, BL, BH, label, p, phase, line }: { id: string; x0: number; y: number; BL: number; BH: number; label: string; p: P; phase: number; line: string }) {
  const N = 48;
  const A = BH * 0.13;
  const wv = (d: number) => A * Math.sin(d * Math.PI * 2.6 - phase) * (0.2 + 0.8 * d);
  const top: string[] = [];
  const bot: string[] = [];
  const mid: string[] = [];
  for (let i = 0; i <= N; i++) {
    const d = i / N;
    const x = x0 + d * BL;
    const w = wv(d);
    top.push(`${x.toFixed(1)},${(y - BH / 2 + w).toFixed(1)}`);
    bot.push(`${x.toFixed(1)},${(y + BH / 2 + w * 1.1).toFixed(1)}`);
    mid.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${(y + w * 1.05).toFixed(1)}`);
  }
  const outline = `M${top.join(' L')} L${(x0 + BL - BH * 0.32).toFixed(1)},${(y + wv(1)).toFixed(1)} L${bot.reverse().join(' L')} Z`;
  const fs = BH * 0.44;
  return (
    <g>
      <path d={outline} transform={`translate(${BH * 0.12} ${BH * 0.14})`} fill={line} opacity={0.9} />
      <path d={outline} fill={p.accent} stroke={line} strokeWidth={BH * 0.03} strokeLinejoin="round" />
      <path d={`M${top.slice(0, N - 2).join(' L')}`} transform={`translate(0 ${BH * 0.12})`} stroke={p.pop} strokeWidth={BH * 0.05} fill="none" />
      <path id={id} d={mid.join(' ')} fill="none" />
      <text fontFamily={FONTS.spacemono} fontWeight={700} fontSize={fs} letterSpacing={fs * 0.12} fill={onColor(p.accent, line, shade(p.background, 0.6))} dy={fs * 0.36}>
        <textPath href={`#${id}`} startOffset={BH * 0.55}>
          {label}
        </textPath>
      </text>
      <line x1={x0} y1={y - BH * 0.62} x2={x0} y2={y + BH * 0.62} stroke={line} strokeWidth={BH * 0.07} strokeLinecap="round" />
    </g>
  );
}

/** Plane + line + banner, nose at (noseX, y) flying left. */
function Tow({ id, noseX, y, BH, label, p, frame, line }: { id: string; noseX: number; y: number; BH: number; label: string; p: P; frame: number; line: string }) {
  const Lp = BH * 3.4;
  const BL = (label.length * 0.335 + 1.4) * BH;
  const tail = noseX + Lp;
  return (
    <g>
      <path d={`M${tail},${y - BH * 0.05} L${tail + BH * 0.5},${y + BH * 0.1}`} stroke={line} strokeWidth={Math.max(1.5, BH * 0.035)} />
      <TowBanner id={id} x0={tail + BH * 0.5} y={y + BH * 0.1} BL={BL} BH={BH} label={label} p={p} phase={frame * 0.16} line={line} />
      <g transform={`translate(${tail} ${y}) scale(${-Lp / 100} ${Lp / 100}) rotate(${Math.sin(frame / 34) * 1.5})`}>
        <PlaneShape p={p} frame={frame} line={line} />
      </g>
    </g>
  );
}

/** Ticket-stub confetti: fired from the bottom corners, linear drag so stubs arc high, hang, and drift down. */
function Stubs({ frame, at, count, seed, colors, line, bg, W, H }: { frame: number; at: number; count: number; seed: number; colors: string[]; line: string; bg: string; W: number; H: number }) {
  const t = (frame - at) / FPS;
  if (t < 0) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: number) => rand(i * 9.13 + seed * 31.7 + k * 1.37);
        const left = i % 2 === 0;
        const tt = t - r(1) * 0.15;
        if (tt < 0) return null;
        const spread = 0.1 + r(2) * 0.55;
        const speed = 1900 + r(3) * 1500;
        const vx = (left ? 1 : -1) * Math.sin(spread) * speed;
        const vy = -Math.cos(spread) * speed;
        const drag = 2.3;
        const g = 620; // terminal velocity g/drag ≈ 270 px/s: a slow, papery drift
        const decay = (1 - Math.exp(-drag * tt)) / drag;
        const x = (left ? -20 : W + 20) + vx * decay + Math.sin(tt * 2.2 + i) * 40 * clamp(tt);
        const y = H + 30 + vy * decay + (g / drag) * (tt - decay);
        if (y > H + 80 && tt > 1) return null;
        const w = 54 + r(4) * 30;
        const h = w * 0.48;
        const spin = (r(5) - 0.5) * 260;
        const flutter = Math.cos(tt * (3 + r(6) * 4) + i);
        const c = colors[i % colors.length];
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - w / 2,
              top: y - h / 2,
              width: w,
              height: h,
              borderRadius: 4,
              background: c,
              border: `2px solid ${line}`,
              rotate: `${r(8) * 360 + spin * tt}deg`,
              scale: `1 ${Math.sign(flutter || 1) * Math.max(0.3, Math.abs(flutter))}`,
              filter: `brightness(${0.8 + 0.25 * Math.abs(flutter)})`,
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', left: w * 0.3, top: -2, bottom: -2, borderLeft: `2px dashed ${line}`, opacity: 0.7 }} />
            <div style={{ position: 'absolute', left: w * 0.3 - 5, top: -6, width: 10, height: 10, borderRadius: 5, background: bg }} />
            <div style={{ position: 'absolute', left: w * 0.3 - 5, bottom: -6, width: 10, height: 10, borderRadius: 5, background: bg }} />
            <div style={{ position: 'absolute', left: w * 0.42, right: w * 0.12, top: h * 0.3, height: 3, background: line, opacity: 0.45 }} />
            <div style={{ position: 'absolute', left: w * 0.42, right: w * 0.3, top: h * 0.56, height: 3, background: line, opacity: 0.45 }} />
          </div>
        );
      })}
    </>
  );
}

/** Headline rows: `*word*` marks the italic word; `plain` renders a colourless copy for the glint. */
function HeadRow({ row, p, size, mark, plain }: { row: string; p: P; size: number; mark: number; plain?: boolean }) {
  const parts = row.split(/(\*[^*]+\*)/).filter(Boolean);
  return (
    <div style={{ whiteSpace: 'nowrap' }}>
      {parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          return (
            <span
              key={i}
              style={{
                ...displayFace(p.italicFont, { italic: true }),
                fontSize: size * 1.1,
                letterSpacing: '-0.01em',
                color: plain ? undefined : p.accent,
                backgroundImage: plain ? undefined : `linear-gradient(${p.pop}, ${p.pop})`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: isDark(p.background) ? '0 94%' : '0 86%',
                backgroundSize: `${mark * 100}% ${isDark(p.background) ? 12 : 34}%`,
                padding: '0 0.08em',
                margin: '0 -0.02em',
              }}
            >
              {part.slice(1, -1)}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

export default function ThanksForFlying(p: P) {
  const frame = useCurrentFrame();
  const W = video.width;
  const H = video.height;
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const line = dark ? '#1E1220' : p.ink;
  const card = dark ? p.surface : shade(p.background, 0.5);

  // Beat grid
  const ROLL = T.beats(1); // counter starts rolling
  const HIT = T.bars(1); // lands + stamp on the bar-2 downbeat
  const MOVE = T.bars(2); // sun sets, counter docks, headline + stubs on bar 3
  const HEAD = MOVE + 26;
  const CARD = MOVE + T.beats(2);
  const MARK = MOVE + T.beats(3);
  const SIG = T.bars(3);
  const CTA = T.bars(3) + T.beats(1);
  const GLINT = T.bars(3) + T.beats(3);
  const outro = prog(frame, end - 26, 26, ease.in);
  const push = mix(1, 1.045, prog(frame, 0, end, ease.inOutSoft));

  // Impact
  const shakeAmt = keys(frame, [HIT, HIT + 2, HIT + 22], [0, 1, 0], [ease.out, ease.out]);
  const shakeX = Math.sin(frame * 2.1) * 9 * shakeAmt;
  const shakeY = Math.cos(frame * 2.7) * 7 * shakeAmt;
  const flash = keys(frame, [HIT - 2, HIT + 3, HIT + 34], [0, 1, 0], [ease.out, ease.outSoft]);
  const ring = prog(frame, HIT, 46, ease.out);

  // Sky: sun rises in bar 1, sets on bar 3 while the horizon sinks to a strip
  const set = prog(frame, MOVE - 6, 60, ease.inOut);
  const horizon = mix(880, 1010, set);
  const sunR = 300;
  const sunX = 540;
  const sunY = mix(horizon + sunR + 30, horizon - 70, prog(frame, 0, 150, ease.out)) + set * (sunR + 120);
  const drift = (frame * 0.4) % (sunR * 0.17);

  // Counter
  const dock = prog(frame, MOVE, 36, ease.inOut);
  const roll = prog(frame, ROLL, HIT - ROLL, ease.inOutSoft);
  const value = fmt(p.count * roll);
  const finalStr = fmt(p.count);
  const bigSize = Math.min(250, 900 / (finalStr.length * 0.6));
  const numSize = mix(bigSize, Math.min(100, bigSize), dock);
  const labelSize = mix(38, 28, dock);
  const landPop = keys(frame, [HIT - 1, HIT + 4, HIT + 26], [1, 1.07, 1], [ease.out, ease.outSoft]);
  const counterIn = prog(frame, ROLL - 10, 30, ease.out);

  // Stamp
  const stampIn = prog(frame, HIT, 20, ease.backOut);
  const stampWord = Math.min(46, 150 / (Math.max(3, p.stamp.length) * 0.66));

  // Tow plane crossing during bar 1–2
  const BH = 66;
  const towLen = BH * 3.4 + BH * 0.5 + (p.towText.length * 0.335 + 1.4) * BH;
  const noseX = mix(W + 40, -towLen - 80, prog(frame, 6, 250, (t) => t * (0.7 + 0.3 * t)));
  const planeY = 228 + Math.sin(frame / 30) * 8;

  // Headline
  const rows = p.headline.split('\n').filter((r) => r.trim().length);
  const longest = Math.max(...rows.map((r) => r.replace(/\*/g, '').length));
  const HS = longest > 13 ? 88 : longest > 10 ? 102 : 116;
  const LH = HS * 1.0;
  const headTop = 344;
  const mark = prog(frame, MARK, 18, ease.inOut);
  const headStyle = { position: 'absolute' as const, left: 80, ...displayFace(p.font), fontSize: HS, lineHeight: 1.06, letterSpacing: '-0.03em', color: p.ink };
  const below = headTop + rows.length * LH + 40;

  // Postcard
  const hasPhoto = !!p.photo;
  const cardIn = prog(frame, CARD, 40, ease.backOut);
  const PCW = 410;
  const PCH = 300;
  const PCX = 600;
  const PCY = 600;
  const sigIn = prog(frame, SIG, 30, ease.out);
  const ctaPop = prog(frame, CTA, 26, ease.backOut);
  const miniNose = mix(PCW + 20, -340, prog(frame, CARD + 10, end - CARD - 10, ease.linear));

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, fontFamily: FONTS.syne }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.12, size: 40, y: -frame * 0.15, color: dark ? '255,233,214' : '61,14,42' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)'}
        glows={[
          { x: sunX, y: horizon - 120, size: 1500, color: hexA(p.accent, dark ? 0.4 : 0.22), opacity: 0.7 + 0.2 * Math.sin(frame / 40) },
          { x: 100, y: 80, size: 900, color: hexA(p.pop, dark ? 0.16 : 0.26), opacity: 0.8 },
        ]}
        grain={0}
        vignette={dark ? 0.45 : 0.06}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shakeX}px ${shakeY}px`, opacity: 1 - outro }}>
        {/* sun + sea */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <clipPath id="tff-sky">
              <rect x={0} y={0} width={W} height={horizon} />
            </clipPath>
            <linearGradient id="tff-sea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={p.accent2} />
              <stop offset="1" stopColor={shade(p.accent2, -0.45)} />
            </linearGradient>
          </defs>
          <circle cx={sunX} cy={sunY} r={mix(sunR + 20, sunR * 2.1, ring)} fill="none" stroke={p.pop} strokeWidth={mix(16, 1, ring)} opacity={frame >= HIT ? (1 - ring) * 0.9 : 0} />
          <g clipPath="url(#tff-sky)">
            <circle cx={sunX + 12} cy={sunY + 14} r={sunR} fill={line} opacity={0.9} />
            <circle cx={sunX} cy={sunY} r={sunR} fill={p.accent} />
            <circle cx={sunX} cy={sunY} r={sunR * 0.7} fill={p.pop} opacity={0.35} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x={sunX - sunR - 20} y={sunY + sunR * 0.04 + i * sunR * 0.17 + drift} width={sunR * 2 + 40} height={sunR * (0.025 + i * 0.02)} fill={p.background} />
            ))}
          </g>
          <rect x={0} y={horizon} width={W} height={H - horizon + 40} fill="url(#tff-sea)" />
          <line x1={0} y1={horizon} x2={W} y2={horizon} stroke={line} strokeWidth={4} />
          {[0, 1, 2].map((i) => {
            const w = sunR * (1.2 - i * 0.32) * (0.85 + 0.15 * Math.sin(frame / 12 + i * 1.7));
            return <rect key={i} x={sunX - w / 2} y={horizon + 18 + i * 22} width={w} height={8} rx={4} fill={p.pop} opacity={(0.9 - i * 0.22) * (1 - set * 0.4)} />;
          })}
        </svg>

        {/* tow plane passes during the count */}
        {noseX > -towLen - 60 && (
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <Tow id="tff-big" noseX={noseX} y={planeY} BH={BH} label={p.towText} p={p} frame={frame} line={line} />
          </svg>
        )}

        {/* stubs live behind the copy */}
        <Stubs frame={frame} at={MOVE} count={38} seed={1} colors={[p.accent, p.pop, p.surface, p.accent2]} line={line} bg={p.background} W={W} H={H} />
        <Stubs frame={frame} at={GLINT} count={14} seed={7} colors={[p.pop, p.accent, p.surface]} line={line} bg={p.background} W={W} H={H} />

        {/* eyebrow: boarding-pass chip */}
        <div style={{ position: 'absolute', left: 80, top: 96, opacity: prog(frame, 0, 24), translate: `${mix(-24, 0, prog(frame, 0, 34))}px 0` }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: '9px 22px', background: hexA(card, 0.85), border: `3px solid ${line}`, borderRadius: 999, fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 28, letterSpacing: '0.22em', textTransform: 'uppercase', whiteSpace: 'nowrap', color: p.ink }}>
            <span style={{ width: 14, height: 14, borderRadius: 99, background: p.pop, border: `2px solid ${line}`, opacity: 0.6 + 0.4 * Math.sin(frame / 8) }} />
            {p.eyebrow}
          </span>
        </div>

        {/* counter: centred hero, then docks top-left */}
        <div
          style={{
            position: 'absolute',
            left: mix(W / 2, 80, dock),
            top: mix(440, 164, dock),
            translate: `${-50 * (1 - dock)}% ${mix(30, 0, counterIn)}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: dock < 0.5 ? 'center' : 'flex-start',
            opacity: counterIn,
            filter: counterIn < 1 ? `blur(${(1 - counterIn) * 12}px)` : undefined,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ ...displayFace(p.font), fontSize: numSize, lineHeight: 1, letterSpacing: '-0.03em', color: p.ink, textShadow: `${mix(10, 5, dock)}px ${mix(10, 5, dock)}px 0 ${dark ? line : p.background}`, scale: String(landPop), fontVariantNumeric: 'tabular-nums' }}>
            {frame < HIT ? value : finalStr}
          </div>
          <div style={{ marginTop: mix(14, 6, dock), fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: labelSize, letterSpacing: '0.24em', textTransform: 'uppercase', color: p.ink, opacity: prog(frame, ROLL + 20, 30) }}>
            {p.countLabel}
          </div>
        </div>

        {/* rubber stamp on the hit */}
        {frame >= HIT && (
          <div
            style={{
              position: 'absolute',
              left: mix(852, 828, dock),
              top: mix(650, 150, dock),
              width: 190,
              height: 190,
              borderRadius: '50%',
              border: `8px solid ${p.pop}`,
              boxShadow: `inset 0 0 0 6px ${hexA(p.pop, 0)}, 6px 6px 0 ${line}`,
              background: hexA(p.background, 0.6),
              display: 'grid',
              placeItems: 'center',
              rotate: `${mix(-30, -12, stampIn) + mix(0, 4, dock) + Math.sin(frame / 45) * 1.2}deg`,
              scale: String(mix(1.8, 1, stampIn) * mix(1, 0.86, dock)),
              opacity: clamp(stampIn * 3),
            }}
          >
            <div style={{ position: 'absolute', inset: 14, borderRadius: '50%', border: `3px dashed ${p.pop}` }} />
            <div style={{ textAlign: 'center', color: dark ? p.pop : p.ink }}>
              <div style={{ fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 17, letterSpacing: '0.16em', whiteSpace: 'nowrap' }}>TL · {short(p.count)}</div>
              <div style={{ ...displayFace(p.font), fontSize: stampWord, lineHeight: 1.1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{p.stamp}</div>
              <div style={{ fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 18, letterSpacing: '0.24em' }}>★ ★ ★</div>
            </div>
          </div>
        )}

        {/* headline */}
        {frame >= HEAD - 2 &&
          rows.map((row, i) => (
            <SweepReveal key={i} frame={frame} start={HEAD + i * 8} dur={36} style={{ ...headStyle, top: headTop + i * LH }}>
              <HeadRow row={row} p={p} size={HS} mark={mark} />
            </SweepReveal>
          ))}
        {rows.map((row, i) => (
          <Glint key={i} frame={frame} start={GLINT + i * 6} dur={44} style={{ ...headStyle, top: headTop + i * LH }}>
            <HeadRow row={row} p={p} size={HS} mark={0} plain />
          </Glint>
        ))}

        {/* signature + CTA */}
        <div style={{ position: 'absolute', left: 84, top: below, fontWeight: 700, fontSize: Math.min(44, 500 / (Math.max(1, p.signature.length) * 0.56)), whiteSpace: 'nowrap', opacity: sigIn, translate: `${mix(-30, 0, sigIn)}px 0` }}>{p.signature}</div>
        <div style={{ position: 'absolute', left: 80, top: below + 92, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 22 }}>
          <span style={{ padding: '18px 40px', borderRadius: 999, fontWeight: 800, fontSize: 44, color: p.background, background: p.ink, boxShadow: `8px 8px 0 ${p.accent}`, whiteSpace: 'nowrap', scale: String(ctaPop), opacity: clamp(ctaPop * 3), transformOrigin: 'left center' }}>{p.cta}</span>
          <span style={{ fontFamily: FONTS.spacemono, fontSize: 26, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: prog(frame, CTA + 16, 24) * 0.85, whiteSpace: 'nowrap' }}>{p.note}</span>
        </div>

        {/* postcard */}
        <div
          style={{
            position: 'absolute',
            left: PCX,
            top: PCY,
            width: PCW,
            height: PCH,
            background: dark ? shade(p.surface, 0.15) : shade(p.surface, 0.55),
            border: `4px solid ${line}`,
            borderRadius: 12,
            boxShadow: `12px 12px 0 ${line}`,
            rotate: `${mix(16, 4, cardIn) + Math.sin(frame / 50) * 0.8}deg`,
            translate: `${mix(520, 0, prog(frame, CARD, 40, ease.out))}px ${Math.sin(frame / 38) * 5}px`,
            opacity: clamp(cardIn * 4),
          }}
        >
          <div style={{ position: 'absolute', left: 16, top: 16, width: PCW - 40, height: 206, borderRadius: 6, overflow: 'hidden', border: `3px solid ${line}` }}>
            {hasPhoto ? (
              <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover', scale: String(mix(1.12, 1.02, prog(frame, CARD, end - CARD, ease.outSoft))) }} />
            ) : (
              <svg width={PCW - 40} height={206} style={{ display: 'block' }}>
                <defs>
                  <linearGradient id="tff-pc-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={p.accent2} />
                    <stop offset="0.6" stopColor={p.accent} />
                    <stop offset="1" stopColor={p.pop} />
                  </linearGradient>
                  <clipPath id="tff-pc-clip">
                    <rect x={0} y={0} width={PCW - 40} height={150} />
                  </clipPath>
                </defs>
                <rect width={PCW - 40} height={206} fill="url(#tff-pc-sky)" />
                <g clipPath="url(#tff-pc-clip)">
                  <circle cx={185} cy={150} r={86} fill={p.pop} />
                  {[0, 1, 2, 3].map((i) => (
                    <rect key={i} x={90} y={92 + i * 15 + ((frame * 0.25) % 15)} width={190} height={2 + i * 2} fill="url(#tff-pc-sky)" />
                  ))}
                </g>
                <rect y={150} width={PCW - 40} height={56} fill={shade(p.accent2, -0.35)} />
                {[0, 1, 2].map((i) => (
                  <rect key={i} x={185 - (70 - i * 18)} y={160 + i * 12} width={(70 - i * 18) * 2 * (0.85 + 0.15 * Math.sin(frame / 10 + i))} height={4} rx={2} fill={p.pop} opacity={0.85 - i * 0.2} />
                ))}
                <Tow id="tff-mini" noseX={miniNose} y={58} BH={26} label={p.towText} p={p} frame={frame} line={line} />
              </svg>
            )}
          </div>
          <div style={{ position: 'absolute', left: 20, right: 20, bottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 17, letterSpacing: '0.1em', textTransform: 'uppercase', color: p.ink, whiteSpace: 'nowrap' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.caption}</span>
          </div>
          {/* postage stamp */}
          <div style={{ position: 'absolute', right: -26, top: -30, width: 92, height: 108, background: p.pop, border: `3px dashed ${line}`, outline: `5px solid ${p.pop}`, display: 'grid', placeItems: 'center', rotate: '8deg', boxShadow: `6px 6px 0 ${line}` }}>
            <div style={{ textAlign: 'center', color: onColor(p.pop, p.ink, '#FFF6EF') }}>
              <div style={{ ...displayFace(p.font), fontSize: 36, lineHeight: 1 }}>{short(p.count)}</div>
              <div style={{ fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 13, letterSpacing: '0.18em', marginTop: 4 }}>AIRMAIL</div>
            </div>
          </div>
        </div>

        <Dust frame={frame} width={W} height={H} count={34} color={p.pop} seed={5} speed={0.7} opacity={0.5} maxSize={6} />
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 46%, ${hexA(p.pop, flash * 0.6)} 0%, ${hexA(p.pop, flash * 0.2)} 20%, transparent 42%)`, mixBlendMode: dark ? 'screen' : 'normal', pointerEvents: 'none' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
