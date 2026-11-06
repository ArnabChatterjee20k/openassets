import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, font, image, num, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, clamp, displayFace, ease, hexA, mix, prog, shade, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Customer Quote',
  category: 'quote',
  description:
    'Square testimonial post: a tow plane flies the intro banner across, a big quote mark stamps in on the beat, the quote rises word by word with a marker-swiped key phrase, then a counting stat ticket and the customer’s avatar and title.',
  tags: ['quote', 'testimonial', 'customer', 'social', 'square', 'review'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30 frames, bar = 120
export const video: VideoConfig = { width: 1080, height: 1080, fps: FPS, durationInFrames: T.bars(4.5) };

export const schema = z.object({
  towText: text('Intro banner').default('WHAT OUR PILOTS SAY'),
  eyebrow: text().default('Customer story · Fernway Travel'),
  quote: textarea().default('Towline moved $84k across 31 platforms last quarter. Our CPA dropped 38% and I got my Fridays back.'),
  highlight: text('Highlighted phrase (from the quote)').default('CPA dropped 38%'),
  statLabel: text('Stat label').default('Blended CPA · Q3 2026'),
  statPrefix: text('Stat prefix').default('−'),
  statValue: num(0, 9999, 1, 'Stat value').default(38),
  statSuffix: text('Stat suffix').default('%'),
  name: text().default('Priya Raman'),
  role: text().default('Head of Growth, Fernway Travel'),
  avatar: image('Customer photo (optional)').default(''),
  font: font('Quote font').default('gloock'),
  background: color().default('#FFEDE1'),
  surface: color('Ticket').default('#FFD3C2'),
  ink: color('Text').default('#3D0E2A'),
  accent: color('Accent (quote mark, sun)').default('#FF4F6D'),
  accent2: color('Sea').default('#7B2CBF'),
  pop: color('Marker').default('#FFB627'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { background: '#2B1B2E', surface: '#45293F', ink: '#FFE9D6', accent: '#FF8E5E', accent2: '#E5487A', pop: '#B8417A' },
  'mid-century': {
    background: '#F4E9D8', surface: '#E6D3B3', ink: '#2E2A24', accent: '#D96C3D', accent2: '#2C7873', pop: '#E9B44C', font: 'fraunces',
    eyebrow: 'Customer story · Hearth & Loom',
    quote: 'We used to brief five agencies. Now one brief goes out on Monday and every channel is live by lunch.',
    highlight: 'live by lunch',
    statLabel: 'Launch time, per campaign', statPrefix: '', statValue: 4, statSuffix: ' hrs',
    name: 'Marcus Oyelaran', role: 'Founder, Hearth & Loom',
  },
  lilac: {
    background: '#E9E3F5', surface: '#D6CCEC', ink: '#231942', accent: '#5E4AE3', accent2: '#F49CBB', pop: '#2EC4B6', font: 'syne',
    eyebrow: 'Customer story · Kindred Skin',
    quote: 'It found TikTok Shop and Pinterest buyers we had never tested. ROAS went from 1.9 to 4.2 in six weeks.',
    highlight: 'never tested',
    statLabel: 'ROAS after 6 weeks', statPrefix: '', statValue: 42, statSuffix: '',
    name: 'Ana Sofía Reyes', role: 'Growth Lead, Kindred Skin',
  },
};

type P = z.infer<typeof schema>;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};
const isDark = (hex: string) => lum(hex) < 140;
const onColor = (bg: string, a: string, b: string) => (Math.abs(lum(a) - lum(bg)) > Math.abs(lum(b) - lum(bg)) ? a : b);

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

function TowBanner({ x0, y, BL, BH, label, p, phase, line }: { x0: number; y: number; BL: number; BH: number; label: string; p: P; phase: number; line: string }) {
  const N = 56;
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
      <path id="cq-mid" d={mid.join(' ')} fill="none" />
      <text fontFamily={FONTS.spacemono} fontWeight={700} fontSize={fs} letterSpacing={fs * 0.12} fill={onColor(p.accent, line, shade(p.background, 0.6))} dy={fs * 0.36}>
        <textPath href="#cq-mid" startOffset={BH * 0.55}>
          {label}
        </textPath>
      </text>
      <line x1={x0} y1={y - BH * 0.62} x2={x0} y2={y + BH * 0.62} stroke={line} strokeWidth={BH * 0.07} strokeLinecap="round" />
    </g>
  );
}

export default function CustomerQuote(p: P) {
  const frame = useCurrentFrame();
  const W = video.width;
  const H = video.height;
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const line = dark ? '#1E1220' : p.ink;

  // Beat grid
  const MARK = T.bars(1); // quote mark stamps on the bar-2 downbeat
  const QIN = MARK + 12;
  const HILITE = MARK + T.beats(3);
  const STAT = T.bars(2);
  const WHO = STAT + T.beats(1);
  const outro = prog(frame, end - 24, 24, ease.in);
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));

  // Intro tow: crosses the frame during bar 1
  const n = p.towText.length;
  const BH = 92;
  const Lp = BH * 3.4;
  const BL = (n * 0.335 + 1.4) * BH;
  const total = Lp + BH * 0.5 + BL;
  const noseX = mix(W - Lp * 1.1, -total - 60, prog(frame, 0, MARK + 50, (t) => t * (0.75 + 0.25 * t)));
  const planeY = 520 + Math.sin(frame / 30) * 10;

  // Sun in the corner
  const sunX = 990;
  const horizon = 1000;
  const sunR = 250;
  const sunY = mix(horizon + 120, horizon - 150, prog(frame, 0, 200, ease.out));
  const drift = (frame * 0.35) % (sunR * 0.17);

  // Quote words + highlight
  const words = p.quote.split(' ');
  const hiStart = p.highlight ? p.quote.indexOf(p.highlight) : -1;
  const hiEnd = hiStart >= 0 ? hiStart + p.highlight.length : -1;
  let offset = 0;
  let marked = 0;
  const QSIZE = p.quote.length > 120 ? 52 : p.quote.length > 90 ? 60 : 68;

  const markStamp = prog(frame, MARK, 22, ease.backOut);
  const ring = prog(frame, MARK, 40, ease.out);
  const statPop = prog(frame, STAT, 24, ease.backOut);
  const count = Math.round(p.statValue * prog(frame, STAT + 6, 54, ease.out));
  const whoIn = prog(frame, WHO, 34, ease.out);
  const card = dark ? p.surface : shade(p.background, 0.5);
  const initials = p.name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('');

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, fontFamily: FONTS.syne }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.12, size: 40, y: -frame * 0.15, color: dark ? '255,233,214' : '61,14,42' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)'}
        glows={[
          { x: sunX, y: horizon - 160, size: 1300, color: hexA(p.accent, dark ? 0.4 : 0.25), opacity: 0.7 + 0.2 * Math.sin(frame / 40) },
          { x: 120, y: 120, size: 900, color: hexA(p.pop, dark ? 0.15 : 0.25), opacity: 0.8 },
        ]}
        grain={0}
        vignette={dark ? 0.45 : 0.06}
      />

      <AbsoluteFill style={{ scale: String(push), opacity: 1 - outro }}>
        {/* setting sun, stripes drifting down into the sea */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <clipPath id="cq-sky">
              <rect x={0} y={0} width={W} height={horizon} />
            </clipPath>
            <linearGradient id="cq-sea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={p.accent2} />
              <stop offset="1" stopColor={shade(p.accent2, -0.45)} />
            </linearGradient>
          </defs>
          <g clipPath="url(#cq-sky)">
            <circle cx={sunX + 10} cy={sunY + 12} r={sunR} fill={line} opacity={0.9} />
            <circle cx={sunX} cy={sunY} r={sunR} fill={p.accent} />
            <circle cx={sunX} cy={sunY} r={sunR * 0.72} fill={shade(p.accent, 0.18)} opacity={0.6} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x={sunX - sunR - 20} y={sunY + sunR * 0.02 + i * sunR * 0.17 + drift} width={sunR * 2 + 40} height={sunR * (0.025 + i * 0.02)} fill={p.background} />
            ))}
          </g>
          <rect x={0} y={horizon} width={W} height={H - horizon} fill="url(#cq-sea)" />
          <line x1={0} y1={horizon} x2={W} y2={horizon} stroke={line} strokeWidth={4} />
          {[0, 1, 2].map((i) => {
            const w = sunR * (1.1 - i * 0.3) * (0.85 + 0.15 * Math.sin(frame / 12 + i * 1.7));
            return <rect key={i} x={sunX - w / 2} y={horizon + 16 + i * 20} width={w} height={7} rx={3.5} fill={p.pop} opacity={0.9 - i * 0.2} />;
          })}
          {[0, 1].map((i) => {
            const gx = 760 - frame * (0.4 + i * 0.15) + i * 80;
            const gy = 640 + i * 40 + Math.sin(frame / 14 + i) * 5;
            const s = 18 - i * 5;
            const flap = 0.5 + 0.5 * Math.sin(frame / 5 + i * 2);
            return <path key={i} d={`M${gx - s},${gy} Q${gx - s / 2},${gy - s * (0.3 + flap * 0.6)} ${gx},${gy} Q${gx + s / 2},${gy - s * (0.3 + flap * 0.6)} ${gx + s},${gy}`} stroke={line} strokeWidth={4} fill="none" strokeLinecap="round" opacity={prog(frame, STAT, 30)} />;
          })}
        </svg>

        {/* bar 1: the intro banner flies through */}
        {noseX > -total - 50 && (
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <path d={`M${noseX + Lp},${planeY - BH * 0.05} L${noseX + Lp + BH * 0.5},${planeY + BH * 0.1}`} stroke={line} strokeWidth={3} />
            <TowBanner x0={noseX + Lp + BH * 0.5} y={planeY + BH * 0.1} BL={BL} BH={BH} label={p.towText} p={p} phase={frame * 0.16} line={line} />
            <g transform={`translate(${noseX + Lp} ${planeY}) scale(${-Lp / 100} ${Lp / 100})`}>
              <PlaneShape p={p} frame={frame} line={line} />
            </g>
          </svg>
        )}

        {/* quote mark stamps in on the downbeat */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={165} cy={150} r={mix(120, 300, ring)} fill="none" stroke={p.pop} strokeWidth={mix(12, 1, ring)} opacity={frame >= MARK ? (1 - ring) * 0.9 : 0} />
        </svg>
        <div
          style={{
            position: 'absolute',
            left: 64,
            top: 50,
            ...displayFace('gloock'),
            fontSize: 380,
            lineHeight: 1,
            color: p.accent,
            textShadow: `10px 10px 0 ${line}`,
            opacity: clamp(markStamp * 3),
            scale: String(mix(1.6, 1, markStamp)),
            rotate: `${mix(-12, 0, markStamp)}deg`,
            transformOrigin: '100px 160px',
          }}
        >
          “
        </div>
        <div
          style={{
            position: 'absolute',
            left: 300,
            top: 176,
            fontFamily: FONTS.spacemono,
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            opacity: prog(frame, MARK + 8, 24),
            translate: `${mix(-20, 0, prog(frame, MARK + 8, 30))}px 0`,
          }}
        >
          {p.eyebrow}
        </div>

        {/* the quote, word by word, with a marker swipe on the key phrase */}
        <div style={{ position: 'absolute', left: 80, top: 290, width: W - 160, display: 'flex', flexWrap: 'wrap', columnGap: '0.26em', ...displayFace(p.font), fontSize: QSIZE, lineHeight: 1.16, letterSpacing: '-0.015em' }}>
          {words.map((w, i) => {
            const s = offset;
            const e = offset + w.length;
            offset = e + 1;
            const isMark = hiStart >= 0 && s < hiEnd && e > hiStart;
            const k = isMark ? marked++ : 0;
            const t = prog(frame, QIN + i * 3, 24, ease.out);
            const m = isMark ? prog(frame, HILITE + k * 6, 14, ease.inOut) : 0;
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  opacity: clamp(t * 1.4),
                  translate: `0 ${(1 - t) * 28}px`,
                  filter: t < 1 ? `blur(${(1 - t) * 8}px)` : undefined,
                  backgroundImage: isMark ? `linear-gradient(${p.pop}, ${p.pop})` : undefined,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '0 82%',
                  backgroundSize: `${m * 100}% 42%`,
                  padding: isMark ? '0 0.05em' : undefined,
                  margin: isMark ? '0 -0.05em' : undefined,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>

        {/* stat ticket */}
        <div
          style={{
            position: 'absolute',
            left: 80,
            top: 640,
            display: 'flex',
            alignItems: 'stretch',
            background: card,
            border: `4px solid ${line}`,
            borderRadius: 22,
            boxShadow: `10px 10px 0 ${line}`,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            opacity: clamp(statPop * 3),
            scale: String(mix(0.6, 1, statPop)),
            transformOrigin: 'left center',
          }}
        >
          <div style={{ width: 30, background: p.accent, borderRight: `4px dashed ${line}` }} />
          <div style={{ padding: '14px 34px 16px 24px' }}>
            <div style={{ fontFamily: FONTS.spacemono, fontSize: 24, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.75 }}>{p.statLabel}</div>
            <div style={{ ...displayFace(p.font), fontSize: 92, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
              {p.statPrefix}
              {count}
              {p.statSuffix}
            </div>
          </div>
        </div>

        {/* attribution */}
        <div style={{ position: 'absolute', left: 80, top: 850, display: 'flex', alignItems: 'center', gap: 26, opacity: whoIn, translate: `${mix(-40, 0, whoIn)}px 0` }}>
          <div style={{ width: 112, height: 112, borderRadius: '50%', border: `4px solid ${line}`, boxShadow: `6px 6px 0 ${line}`, overflow: 'hidden', background: p.accent2, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            {p.avatar ? (
              <Img src={p.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ ...displayFace('gloock'), fontSize: 48, color: onColor(p.accent2, '#FFF6EF', '#2A0D1E') }}>{initials}</span>
            )}
          </div>
          <div style={{ whiteSpace: 'nowrap' }}>
            <div style={{ fontWeight: 800, fontSize: 44, lineHeight: 1.1 }}>{p.name}</div>
            <div style={{ fontFamily: FONTS.spacemono, fontSize: 26, letterSpacing: '0.06em', marginTop: 6, opacity: 0.85 }}>{p.role}</div>
          </div>
        </div>

        <Dust frame={frame} width={W} height={H} count={34} color={p.pop} seed={4} speed={0.7} opacity={0.5} maxSize={6} />
      </AbsoluteFill>
      <FilmOverlay grain={0.05} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
