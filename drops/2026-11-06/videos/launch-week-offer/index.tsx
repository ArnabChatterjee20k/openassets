import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, clamp, displayFace, ease, hexA, keys, mix, prog, shade, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Launch Week Offer',
  category: 'promo',
  description:
    'Vertical promo story: a sky arch wipes up, a striped sun rises and a tow plane flies your offer across it on the beat; headline, price strike, promo-code ticket and CTA follow.',
  tags: ['promo', 'offer', 'story', 'discount', 'launch', 'sale'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30 frames, bar = 120
export const video: VideoConfig = { width: 1080, height: 1920, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Launch week · Nov 10–16'),
  towText: text('Tow banner').default('0% PLATFORM FEES'),
  headline: text('Headline line 1').default('60 days,'),
  headline2: text('Headline line 2 (accent)').default('on us.'),
  oldPrice: text('Old price').default('$149/mo'),
  newPrice: text('New price').default('$0'),
  codeLabel: text('Code label').default('Promo code'),
  code: text('Code (empty to hide)').default('TOWLINE60'),
  cta: text('Call to action').default('Start free · towline.ai'),
  fine: text('Fine print').default('New workspaces · ends Nov 16'),
  font: font('Headline font').default('gloock'),
  background: color().default('#FFEDE1'),
  surface: color('Ticket / clouds').default('#FFD3C2'),
  ink: color('Text').default('#3D0E2A'),
  accent: color('Accent (sun, banner)').default('#FF4F6D'),
  accent2: color('Sky + sea').default('#7B2CBF'),
  pop: color('Spark').default('#FFB627'),
  productShot: image('Product screenshot (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { background: '#2B1B2E', surface: '#45293F', ink: '#FFE9D6', accent: '#FF8E5E', accent2: '#E5487A', pop: '#FFD27F' },
  'first-500': { towText: 'FIRST $500 MANAGED FREE', headline: 'Your first $500,', headline2: 'flown free.', oldPrice: '12% of spend', newPrice: '0%', code: 'FIRSTFLIGHT', fine: 'On your first $500 of ad spend' },
  citrus: { background: '#FFF8E1', surface: '#FFE9A8', ink: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F', font: 'shrikhand' },
  'no-code': { code: '', eyebrow: 'Black Friday · 3 days only', towText: 'BLACK FRIDAY · 50% OFF', headline: 'Half price,', headline2: 'full reach.', oldPrice: '$149/mo', newPrice: '$74', fine: 'Annual plans · ends Nov 30' },
};

type P = z.infer<typeof schema>;

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};
const isDark = (hex: string) => lum(hex) < 140;
const onColor = (bg: string, a: string, b: string) => (Math.abs(lum(a) - lum(bg)) > Math.abs(lum(b) - lum(bg)) ? a : b);

/** Flat poster-style prop plane facing right, nose at x=100, centreline y=0. */
function PlaneShape({ p, frame }: { p: P; frame: number }) {
  const body = isDark(p.background) ? shade(p.surface, 0.75) : shade(p.background, 0.55);
  const ink = { stroke: p.ink === body ? '#3D0E2A' : isDark(p.background) ? '#2B1B2E' : p.ink, strokeWidth: 1.4, strokeLinejoin: 'round' as const };
  const line = ink.stroke;
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
function TowBanner({ x0, y, BL, BH, label, p, phase }: { x0: number; y: number; BL: number; BH: number; label: string; p: P; phase: number }) {
  const N = 56;
  const A = BH * 0.13;
  const wv = (d: number) => A * Math.sin(d * Math.PI * 2.6 - phase) * (0.2 + 0.8 * d);
  const notch = BH * 0.32;
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
  const outline = `M${top.join(' L')} L${(x0 + BL - notch).toFixed(1)},${(y + wv(1)).toFixed(1)} L${bot.reverse().join(' L')} Z`;
  const fs = BH * 0.44;
  const line = isDark(p.background) ? '#2B1B2E' : p.ink;
  return (
    <g>
      <path d={outline} transform={`translate(${BH * 0.12} ${BH * 0.14})`} fill={line} opacity={0.9} />
      <path d={outline} fill={p.accent} stroke={line} strokeWidth={BH * 0.03} strokeLinejoin="round" />
      <path d={`M${top.slice(0, N - 2).join(' L')}`} transform={`translate(0 ${BH * 0.12})`} stroke={p.pop} strokeWidth={BH * 0.05} fill="none" />
      <path id="lwo-mid" d={mid.join(' ')} fill="none" />
      <text fontFamily={FONTS.spacemono} fontWeight={700} fontSize={fs} letterSpacing={fs * 0.12} fill={onColor(p.accent, line, shade(p.background, 0.6))} dy={fs * 0.36}>
        <textPath href="#lwo-mid" startOffset={BH * 0.55}>
          {label}
        </textPath>
      </text>
      <line x1={x0} y1={y - BH * 0.62} x2={x0} y2={y + BH * 0.62} stroke={line} strokeWidth={BH * 0.07} strokeLinecap="round" />
    </g>
  );
}

function Cloud({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <path
      d={`M${x - s},${y} C${x - s},${y - s * 0.45} ${x - s * 0.55},${y - s * 0.6} ${x - s * 0.3},${y - s * 0.42} C${x - s * 0.2},${y - s * 0.9} ${x + s * 0.4},${y - s * 0.95} ${x + s * 0.5},${y - s * 0.45} C${x + s * 0.8},${y - s * 0.6} ${x + s * 1.1},${y - s * 0.3} ${x + s},${y} Z`}
      fill={fill}
    />
  );
}

export default function LaunchWeekOffer(p: P) {
  const frame = useCurrentFrame();
  const W = video.width;
  const H = video.height;
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const line = dark ? '#2B1B2E' : p.ink;

  // Beat grid
  const HIT = T.bars(1); // plane + burst
  const HEAD = HIT + T.beats(1);
  const PRICE = T.bars(2);
  const CODE = T.bars(2) + T.beats(2);
  const CTA = T.bars(3);

  // Arch (airplane-window sky)
  const AX = 70;
  const AY = 190;
  const AW = W - AX * 2;
  const AH = 880;
  const horizon = AY + AH * 0.78;
  const archIn = prog(frame, 6, 56, ease.out);
  const sunR = 210;
  const sunX = p.productShot ? 400 : W / 2;
  const sunY = mix(horizon + sunR + 20, horizon - sunR * 0.5, prog(frame, 20, 100, ease.out));
  const sunPulse = 1 + Math.sin(frame / 22) * 0.008;

  // Tow
  const n = p.towText.length;
  const BH = Math.min(100, (W - 30) / (3.4 + 0.5 + n * 0.335 + 1.4));
  const Lp = BH * 3.4;
  const BL = (n * 0.335 + 1.4) * BH;
  const planeIn = prog(frame, HIT - 18, 80, ease.out);
  const noseX = mix(W + 60, 34, planeIn) - prog(frame, HIT + 62, end - HIT - 62, ease.inOutSoft) * 20;
  const planeY = AY + 300 + Math.sin(frame / 34) * 8;
  const tail = noseX + Lp;
  const bx0 = tail + BH * 0.5;

  const burst = prog(frame, HIT, 50, ease.out);
  const flash = keys(frame, [HIT - 2, HIT + 3, HIT + 30], [0, 1, 0], [ease.out, ease.outSoft]);
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));
  const outro = prog(frame, end - 22, 22, ease.in);

  const HEADSIZE = Math.max(p.headline.length, p.headline2.length) > 12 ? 118 : 150;
  const headTop = AY + AH + 70;
  const headStyle = {
    position: 'absolute' as const,
    left: 80,
    width: W - 160,
    ...displayFace(p.font),
    fontSize: HEADSIZE,
    lineHeight: 0.98,
    letterSpacing: '-0.03em',
  };
  const priceTop = headTop + HEADSIZE * 2 + 34;
  const strike = prog(frame, PRICE + 8, 18, ease.inOut);
  const newPop = prog(frame, PRICE + T.beats(1), 24, ease.backOut);
  const codePop = prog(frame, CODE, 22, ease.backOut);
  const ctaPop = prog(frame, CTA, 26, ease.backOut);
  const card = dark ? p.surface : shade(p.background, 0.5);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, fontFamily: FONTS.syne }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.12, size: 44, y: -frame * 0.15, color: dark ? '255,233,214' : '61,14,42' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.55)'}
        glows={[
          { x: sunX, y: horizon, size: 1500, color: hexA(p.accent, dark ? 0.35 : 0.2), opacity: 0.6 + 0.2 * Math.sin(frame / 40) },
          { x: W * 0.1, y: H, size: 1400, color: hexA(p.pop, dark ? 0.2 : 0.3), opacity: 0.8 },
        ]}
        grain={0}
        vignette={dark ? 0.45 : 0.06}
      />

      <AbsoluteFill style={{ scale: String(push), opacity: 1 - outro }}>
        {/* eyebrow */}
        <div style={{ position: 'absolute', top: 104, width: W, display: 'flex', justifyContent: 'center', opacity: prog(frame, 0, 24), translate: `0 ${mix(-16, 0, prog(frame, 0, 30))}px` }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 16, padding: '10px 26px', border: `3px solid ${p.ink}`, borderRadius: 999, fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 32, letterSpacing: '0.2em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            <span style={{ width: 16, height: 16, borderRadius: 99, background: p.pop, border: `2px solid ${p.ink}`, opacity: 0.6 + 0.4 * Math.sin(frame / 8) }} />
            {p.eyebrow}
          </span>
        </div>

        {/* sky arch: hard shadow, then the window, wiping up from the bottom */}
        <div style={{ position: 'absolute', left: AX + 16, top: AY + 18, width: AW, height: AH, borderRadius: `${AW / 2}px ${AW / 2}px 56px 56px`, background: line, clipPath: `inset(${(1 - archIn) * 100}% 0 0 0)` }} />
        <div style={{ position: 'absolute', left: AX, top: AY, width: AW, height: AH, borderRadius: `${AW / 2}px ${AW / 2}px 56px 56px`, overflow: 'hidden', clipPath: `inset(${(1 - archIn) * 100}% 0 0 0)`, border: `4px solid ${line}` }}>
          <svg width={AW} height={AH} viewBox={`${AX} ${AY} ${AW} ${AH}`} style={{ display: 'block' }}>
            <defs>
              <linearGradient id="lwo-sky" gradientUnits="userSpaceOnUse" x1={0} y1={AY} x2={0} y2={horizon}>
                <stop offset="0" stopColor={p.accent2} />
                <stop offset="0.55" stopColor={p.accent} />
                <stop offset="1" stopColor={p.pop} />
              </linearGradient>
              <linearGradient id="lwo-sea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={shade(p.accent2, -0.15)} />
                <stop offset="1" stopColor={shade(p.accent2, -0.55)} />
              </linearGradient>
            </defs>
            <rect x={AX} y={AY} width={AW} height={AH} fill="url(#lwo-sky)" />
            {/* burst ring off the sun on the hit */}
            <circle cx={sunX} cy={sunY} r={sunR * mix(1.05, 2.6, burst)} fill="none" stroke={p.pop} strokeWidth={mix(14, 1, burst)} opacity={frame >= HIT ? (1 - burst) * 0.9 : 0} />
            <g transform={`translate(${sunX} ${sunY}) scale(${sunPulse}) translate(${-sunX} ${-sunY})`}>
              <circle cx={sunX} cy={sunY} r={sunR} fill={p.pop} />
              <circle cx={sunX} cy={sunY} r={sunR * 0.8} fill={shade(p.pop, 0.3)} opacity={0.45} />
              {[0, 1, 2, 3, 4].map((i) => (
                <rect key={i} x={sunX - sunR * 1.1} y={sunY + sunR * (0.02 + i * 0.18)} width={sunR * 2.2} height={sunR * (0.035 + i * 0.024)} fill="url(#lwo-sky)" />
              ))}
            </g>
            <Cloud x={AX + 170 + frame * 0.35} y={AY + 560} s={110} fill={dark ? shade(p.surface, 0.2) : shade(p.surface, 0.35)} />
            <Cloud x={AX + AW - 150 - frame * 0.22} y={AY + 640} s={70} fill={dark ? shade(p.surface, 0.2) : shade(p.surface, 0.35)} />
            {[0, 1].map((i) => {
              const gx = AX + 620 - frame * (0.5 + i * 0.2) + i * 70;
              const gy = AY + 470 + i * 34 + Math.sin(frame / 14 + i) * 5;
              const s = 20 - i * 6;
              const flap = 0.5 + 0.5 * Math.sin(frame / 5 + i * 2);
              return <path key={i} d={`M${gx - s},${gy} Q${gx - s / 2},${gy - s * (0.3 + flap * 0.6)} ${gx},${gy} Q${gx + s / 2},${gy - s * (0.3 + flap * 0.6)} ${gx + s},${gy}`} stroke={line} strokeWidth={4} fill="none" strokeLinecap="round" />;
            })}
            <rect x={AX} y={horizon} width={AW} height={AY + AH - horizon} fill="url(#lwo-sea)" />
            {[0, 1, 2, 3, 4].map((i) => {
              const w = sunR * (1.4 - i * 0.24) * (0.85 + 0.15 * Math.sin(frame / 12 + i * 1.7));
              return <rect key={i} x={sunX - w / 2} y={horizon + 18 + i * 24} width={w} height={8} rx={4} fill={p.pop} opacity={(0.85 - i * 0.13) * prog(frame, 40, 60)} />;
            })}
          </svg>
          {p.productShot && (
            <Img
              src={p.productShot}
              style={{
                position: 'absolute',
                left: AW - 360,
                top: AH - 560,
                width: 300,
                height: 520,
                objectFit: 'cover',
                borderRadius: 34,
                border: `5px solid ${line}`,
                boxShadow: `14px 14px 0 ${line}`,
                rotate: `${mix(14, 6, prog(frame, HEAD, 50))}deg`,
                translate: `0 ${mix(560, 0, prog(frame, HEAD, 50, ease.out)) + Math.sin(frame / 30) * 6}px`,
              }}
            />
          )}
        </div>

        {/* the tow, flying in on the bar-2 downbeat */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {frame >= HIT - 20 && (
            <>
              <path d={`M${tail},${planeY - BH * 0.05} L${bx0},${planeY + BH * 0.1}`} stroke={line} strokeWidth={3} />
              <TowBanner x0={bx0} y={planeY + BH * 0.1} BL={BL} BH={BH} label={p.towText} p={p} phase={frame * 0.16} />
              <g transform={`translate(${noseX + Lp} ${planeY}) scale(${-Lp / 100} ${Lp / 100}) rotate(${Math.sin(frame / 34) * 1.5})`}>
                <PlaneShape p={p} frame={frame} />
              </g>
            </>
          )}
        </svg>

        {/* promo code ticket overlapping the arch bottom, stamped on beat 3 of bar 3 */}
        {p.code && (
          <div
            style={{
              position: 'absolute',
              left: AX + 44,
              top: AY + AH - 172,
              display: 'flex',
              alignItems: 'stretch',
              background: card,
              border: `4px solid ${line}`,
              borderRadius: 22,
              boxShadow: `10px 10px 0 ${line}`,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              color: p.ink,
              opacity: clamp(codePop * 3),
              scale: String(mix(1.35, 1, codePop)),
              rotate: `${mix(-14, -4, codePop)}deg`,
            }}
          >
            <div style={{ width: 34, background: p.accent, borderRight: `4px dashed ${line}` }} />
            <div style={{ padding: '16px 34px 18px 26px' }}>
              <div style={{ fontFamily: FONTS.spacemono, fontSize: 26, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.75 }}>{p.codeLabel}</div>
              <div style={{ fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 56, letterSpacing: '0.06em', lineHeight: 1.1 }}>{p.code}</div>
            </div>
          </div>
        )}
        {/* sparkles on the stamp */}
        {p.code && frame >= CODE && (
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2 + 0.3;
              const u = prog(frame, CODE, 30, ease.out);
              const cx = AX + 70;
              const cy = AY + AH - 160;
              const r0 = 40 + u * 70;
              const r1 = r0 + 26 * (1 - u);
              return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke={p.pop} strokeWidth={8} strokeLinecap="round" opacity={1 - u} />;
            })}
          </svg>
        )}

        {/* headline */}
        {frame >= HEAD - 2 && (
          <>
            <SweepReveal frame={frame} start={HEAD} dur={34} style={{ ...headStyle, top: headTop }}>
              <div style={{ color: p.ink }}>{p.headline}</div>
            </SweepReveal>
            <SweepReveal frame={frame} start={HEAD + 6} dur={34} style={{ ...headStyle, top: headTop + HEADSIZE * 0.98 }}>
              <div style={{ color: p.accent }}>{p.headline2}</div>
            </SweepReveal>
            <Glint frame={frame} start={CTA + 20} dur={44} style={{ ...headStyle, top: headTop + HEADSIZE * 0.98 }}>
              {p.headline2}
            </Glint>
          </>
        )}

        {/* price strike */}
        <div style={{ position: 'absolute', left: 80, top: priceTop, display: 'flex', alignItems: 'baseline', gap: 30, whiteSpace: 'nowrap' }}>
          <span style={{ position: 'relative', fontSize: 64, fontWeight: 700, opacity: prog(frame, PRICE - 6, 20) * 0.7, translate: `0 ${mix(20, 0, prog(frame, PRICE - 6, 26))}px` }}>
            {p.oldPrice}
            <span style={{ position: 'absolute', left: -6, right: -6, top: '54%', height: 7, borderRadius: 4, background: p.accent, scale: `${strike} 1`, transformOrigin: 'left' }} />
          </span>
          <span style={{ fontFamily: FONTS.spacemono, fontSize: 56, opacity: prog(frame, PRICE + 20, 14) }}>→</span>
          <span style={{ ...displayFace(p.font), fontSize: 132, lineHeight: 1, color: p.accent, display: 'inline-block', scale: String(newPop), opacity: clamp(newPop * 3), textShadow: `6px 6px 0 ${line}` }}>{p.newPrice}</span>
        </div>

        {/* CTA */}
        <div style={{ position: 'absolute', left: 80, top: priceTop + 176, display: 'flex' }}>
          <span
            style={{
              padding: '28px 52px',
              borderRadius: 999,
              fontWeight: 800,
              fontSize: 50,
              color: p.background,
              background: p.ink,
              boxShadow: `10px 10px 0 ${p.accent}`,
              whiteSpace: 'nowrap',
              scale: String(ctaPop),
              opacity: clamp(ctaPop * 3),
              transformOrigin: 'left center',
            }}
          >
            {p.cta}
          </span>
        </div>
        <div style={{ position: 'absolute', left: 84, top: priceTop + 330, fontFamily: FONTS.spacemono, fontSize: 34, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: prog(frame, CTA + 20, 24) * 0.8, whiteSpace: 'nowrap' }}>{p.fine}</div>

        <Dust frame={frame} width={W} height={H} count={40} color={p.pop} seed={9} speed={0.8} opacity={0.5} maxSize={7} />
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at ${(sunX / W) * 100}% ${(sunY / H) * 100}%, ${hexA(p.pop, flash * 0.7)} 0%, ${hexA(p.pop, flash * 0.25)} 14%, transparent 30%)`, mixBlendMode: dark ? 'screen' : 'normal', pointerEvents: 'none' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.4 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
