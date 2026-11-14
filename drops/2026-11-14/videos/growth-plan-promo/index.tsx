import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, clamp, displayFace, ease, hexA, keys, mix, prog, tempo, typed } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Growth Plan Promo',
  category: 'promo',
  description:
    'Offer promo for Plotwell: the discount slams onto a cyanotype sheet with a highlighter swipe, slides aside for a "detail b" plan panel (or your screenshot) with dimension lines, feature chips on the beat, then the code and CTA.',
  tags: ['promo', 'sale', 'black friday', 'offer', 'blueprint', 'saas'],
};

// 60 fps on a 120 BPM grid: beat = 30 frames, bar = 120. 4 bars = 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('black friday · growth plan'),
  title: text().default('Plan Q4 for less.'),
  offer: text('Offer (big)').default('40% off'),
  oldPrice: text('Old price').default('$249 / mo'),
  newPrice: text('New price').default('$149 / mo for 3 months'),
  features: text('Features (comma separated, 3)').default('33 ad platforms, hourly rebalancing, unlimited creatives'),
  rows: text('Plan rows (name amount, …)').default('Meta 1200, Google 980, TikTok 860, YouTube 640, LinkedIn 320, Reddit 200'),
  cta: text('Call to action').default('Claim at plotwell.ai/bf'),
  code: text('Promo code').default('PLOT40'),
  deadline: text('Deadline').default('offer ends nov 30'),
  screenshot: image('Product screenshot (optional)').default(''),
  background: color().default('#0F3B8C'),
  surface: color('Panel').default('#134AA8'),
  ink: color('Text & lines').default('#EAF2FF'),
  line: color('Grid').default('#7FB2FF'),
  pop: color('Highlighter').default('#FFDD00'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  whiteprint: { background: '#F1EEE4', surface: '#E7E2D4', ink: '#173F9A', line: '#173F9A', pop: '#FFDD00' },
  'cyber monday': {
    background: '#0D0D0F',
    surface: '#1C1C20',
    ink: '#F3EDE2',
    line: '#C9A45C',
    pop: '#E8D9B5',
    eyebrow: 'cyber monday · 24 hours',
    title: 'One day. Every platform.',
    offer: '50% off',
    oldPrice: '$249 / mo',
    newPrice: '$124 / mo for 3 months',
    code: 'CYBER50',
    deadline: 'ends dec 1 · 11:59 pm pt',
  },
  'annual plan': {
    background: '#F2EBDD',
    surface: '#E4D9C4',
    ink: '#111111',
    line: '#1D4E9E',
    pop: '#F2B90F',
    eyebrow: 'new · annual billing',
    title: 'Draft a whole year.',
    offer: '2 months free',
    oldPrice: '$2,988 / yr',
    newPrice: '$2,490 / yr, billed once',
    cta: 'Switch at plotwell.ai/annual',
    code: 'YEARPLAN',
    deadline: 'for new annual plans',
  },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const W = 1920;
const H = 1080;
const HIT = T.bars(1); // 120: offer slams
const MOVE = T.bars(2); // 240: offer slides aside, panel enters
const CTA = T.bars(3); // 360: code + CTA
const END = video.durationInFrames;

// Panel (right)
const PX = 1190;
const PY = 170;
const PW = 610;
const PH = 640;
const LEFT_CX = 590; // centre of the left column once the hero slides aside

function Grid({ frame, p }: { frame: number; p: P }) {
  const step = 96;
  const drift = (frame * 0.25) % step;
  const op = isDark(p.background) ? 0.2 : 0.16;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(${-drift} 0)`} stroke={p.line} strokeWidth={1.2}>
        {Array.from({ length: Math.ceil(W / step) + 2 }, (_, i) => {
          const t = prog(frame, Math.abs(i * step - W / 2) / 40, 40);
          return <line key={`v${i}`} x1={i * step} y1={H / 2 - (H / 2) * t} x2={i * step} y2={H / 2 + (H / 2) * t} strokeOpacity={op} />;
        })}
        {Array.from({ length: Math.ceil(H / step) + 1 }, (_, j) => {
          const t = prog(frame, 6 + Math.abs(j * step - H / 2) / 30, 40);
          return <line key={`h${j}`} x1={W / 2 - (W / 2 + step) * t} y1={j * step} x2={W / 2 + (W / 2 + step) * t} y2={j * step} strokeOpacity={op} />;
        })}
      </g>
    </svg>
  );
}

/** A dimension line that draws on: tick ends, slash marks, label riding above. */
function Dim({ frame, start, x1, y1, x2, y2, label, c, size = 26 }: { frame: number; start: number; x1: number; y1: number; x2: number; y2: number; label: string; c: string; size?: number }) {
  const t = prog(frame, start, 34, ease.inOutSoft);
  if (t <= 0) return null;
  const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
  const ex = mix(x1, x2, t);
  const ey = mix(y1, y2, t);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const tick = (x: number, y: number) =>
    vertical ? <line x1={x - 12} y1={y} x2={x + 12} y2={y} /> : <line x1={x} y1={y - 12} x2={x} y2={y + 12} />;
  return (
    <g stroke={c} strokeWidth={2} fill="none">
      <line x1={x1} y1={y1} x2={ex} y2={ey} />
      {tick(x1, y1)}
      {t > 0.98 && tick(x2, y2)}
      <text
        x={mx}
        y={my}
        transform={vertical ? `rotate(-90 ${mx} ${my})` : undefined}
        dy={-size * 0.6}
        textAnchor="middle"
        fill={c}
        stroke="none"
        fontFamily={FONTS.majormono}
        fontSize={size}
        opacity={prog(frame, start + 16, 18)}
      >
        {label}
      </text>
    </g>
  );
}

/** "Detail B": the user's screenshot, or a live plan with budget bars that grow. */
function Panel({ frame, p }: { frame: number; p: P }) {
  const dark = isDark(p.background);
  const enter = prog(frame, MOVE + 22, 44, ease.out);
  const feats = p.features
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  const rows = p.rows
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6)
    .map((s) => {
      const m = s.match(/^(.*?)[\s]+([\d.,]+)$/);
      return m ? { name: m[1], v: parseFloat(m[2].replace(/,/g, '')) || 0 } : { name: s, v: 0 };
    });
  const max = Math.max(1, ...rows.map((r) => r.v));
  const topIdx = rows.findIndex((r) => r.v === max);
  const mask = `linear-gradient(90deg, black ${mix(-10, 110, enter)}%, transparent ${mix(0, 120, enter)}%)`;
  return (
    <div
      style={{
        position: 'absolute',
        left: PX,
        top: PY,
        width: PW,
        height: PH,
        translate: `${mix(80, 0, enter)}px 0`,
        opacity: clamp(enter * 1.5),
        maskImage: mask,
        WebkitMaskImage: mask,
        background: dark ? hexA(p.surface, 0.85) : hexA(p.surface, 0.9),
        border: `3px solid ${p.ink}`,
        boxShadow: `14px 14px 0 ${hexA(p.line, 0.35)}, 0 30px 80px rgba(0,0,0,${dark ? 0.35 : 0.12})`,
        overflow: 'hidden',
      }}
    >
      {/* header strip */}
      <div style={{ height: 64, borderBottom: `2px solid ${hexA(p.ink, 0.6)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 26px', fontFamily: FONTS.majormono, fontSize: 26, color: p.ink }}>
        <span>detail b · live plan</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 14, height: 14, borderRadius: '50%', background: p.pop, opacity: 0.5 + 0.5 * Math.abs(Math.sin(frame / 14)) }} />
          live
        </span>
      </div>
      {p.screenshot ? (
        <Img src={p.screenshot} style={{ width: '100%', height: PH - 64, objectFit: 'cover', display: 'block', scale: String(mix(1.08, 1, prog(frame, MOVE, 200, ease.outSoft))) }} />
      ) : (
        <div style={{ padding: '34px 30px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {rows.map((r, i) => {
            const g = prog(frame, MOVE + 30 + i * 6, 50, ease.out);
            const top = i === topIdx;
            const breathe = top ? 1 + 0.03 * Math.sin((frame - MOVE) / 18) * prog(frame, MOVE + 90, 30) : 1;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, fontFamily: FONTS.majormono, fontSize: 28, color: p.ink }}>
                <span style={{ width: 170, whiteSpace: 'nowrap', overflow: 'hidden' }}>{r.name.toLowerCase()}</span>
                <div style={{ flex: 1, height: 34, position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, borderBottom: `1px dashed ${hexA(p.ink, 0.35)}` }} />
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 4,
                      bottom: 4,
                      width: `${(r.v / max) * 100 * g * breathe}%`,
                      maxWidth: '100%',
                      background: top ? p.pop : 'transparent',
                      border: top ? 'none' : `2px solid ${p.ink}`,
                      backgroundImage: top ? undefined : `repeating-linear-gradient(45deg, ${hexA(p.ink, 0.35)} 0 2px, transparent 2px 10px)`,
                    }}
                  />
                </div>
                <span style={{ width: 110, textAlign: 'right' }}>${Math.round(r.v * g).toLocaleString('en-US')}</span>
              </div>
            );
          })}
        </div>
      )}
      {/* feature checklist along the panel foot, one per beat */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          padding: '20px 30px 26px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          borderTop: `2px solid ${hexA(p.ink, 0.6)}`,
          background: p.screenshot ? hexA(p.background, 0.88) : hexA(p.background, 0.35),
        }}
      >
        {feats.map((f, i) => {
          const t = prog(frame, MOVE + T.beat * (i + 2), 22, ease.out);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONTS.majormono, fontSize: 30, color: p.ink, opacity: clamp(t * 1.4), translate: `${mix(-24, 0, t)}px 0` }}>
              <span style={{ width: 26, height: 26, display: 'grid', placeItems: 'center', background: p.pop, color: isDark(p.background) ? p.background : p.ink, fontSize: 20, fontFamily: FONTS.bricolage, fontWeight: 800 }}>✓</span>
              {f.toLowerCase()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GrowthPlanPromo(p: P) {
  const frame = useCurrentFrame();
  const dark = isDark(p.background);
  const onPop = dark ? p.background : p.ink;

  const flash = keys(frame, [HIT - 2, HIT + 2, HIT + 30], [0, 1, 0], [ease.out, ease.outSoft]);
  const shake = frame >= HIT && frame < HIT + 14 ? Math.sin(frame * 2.1) * (1 - (frame - HIT) / 14) * 12 : 0;
  const push = mix(1, 1.04, prog(frame, 0, END, ease.inOutSoft));
  const outro = prog(frame, END - 30, 30, ease.in);

  // Hero group (title + offer + price) is centred, then slides into the left column.
  const mv = prog(frame, MOVE, 40, ease.inOutSoft);
  const gScale = mix(1, 0.6, mv);
  const gX = mix(0, LEFT_CX - W / 2, mv);
  const OFFER = Math.min(260, (W - 300) / Math.max(1, p.offer.length * 0.82));
  const slam = prog(frame, HIT, 18, ease.out);
  const swipe = prog(frame, HIT + T.beat, 18, ease.inOutSoft);
  const strike = prog(frame, HIT + T.beats(2) + 10, 16, ease.inOutSoft);
  // Title width estimate (Syne ExtraBold ≈ 0.78em per glyph) for the bar-1 dimension line.
  const titleW = Math.min(W - 240, p.title.length * 132 * 0.74);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={false}
        lift={dark ? 'rgba(127,178,255,0.14)' : 'rgba(255,255,255,0.55)'}
        glows={[
          { x: mix(W / 2, LEFT_CX, mv), y: 520, size: 1500, color: hexA(p.line, dark ? 0.32 : 0.16), opacity: 0.7 + 0.2 * Math.sin(frame / 30) },
          { x: PX + PW / 2, y: PY + PH / 2, size: 1100, color: hexA(p.line, dark ? 0.3 : 0.14), opacity: mv },
          { x: mix(W / 2, LEFT_CX, mv), y: 540, size: 1100, color: hexA(p.pop, 0.22), opacity: prog(frame, HIT, 30) * (0.6 + 0.2 * Math.sin(frame / 24)) },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.1}
      />
      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.5}px`, opacity: 1 - outro, filter: outro > 0.01 ? `blur(${outro * 14}px)` : undefined }}>
        <Grid frame={frame} p={p} />
        <Dust frame={frame} width={W} height={H} count={60} color={frame >= HIT ? p.pop : p.ink} seed={12} speed={0.7} opacity={0.3} maxSize={5} />
        <Streaks frame={frame} start={HIT} dur={46} direction="out" count={110} width={W} height={H} cx={W / 2} cy={540} seed={3} intensity={0.85} color={p.pop} highlight={p.ink} />

        {/* registration marks in the corners */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {[
            [64, 64],
            [W - 64, 64],
            [64, H - 64],
            [W - 64, H - 64],
          ].map(([x, y], i) => (
            <g key={i} stroke={p.ink} strokeWidth={2} fill="none" opacity={prog(frame, 20 + i * 5, 20) * 0.7}>
              <circle cx={x} cy={y} r={12} />
              <line x1={x - 22} y1={y} x2={x + 22} y2={y} />
              <line x1={x} y1={y - 22} x2={x} y2={y + 22} />
            </g>
          ))}
        </svg>

        {/* eyebrow types */}
        <div style={{ position: 'absolute', left: 120, top: 104, fontFamily: FONTS.majormono, fontSize: 40, letterSpacing: '0.06em', color: p.ink, display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', background: p.pop, boxShadow: `0 0 16px ${hexA(p.pop, 0.8)}` }} />
          {typed(frame, 6, FPS, 30, p.eyebrow.toLowerCase())}
        </div>

        {/* hero group */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, translate: `${gX}px 0`, scale: String(gScale), transformOrigin: '960px 520px' }}>
          <SweepReveal frame={frame} start={24} dur={36} style={{ position: 'absolute', left: 0, width: W, top: 250, textAlign: 'center', ...displayFace('syne'), fontSize: 132, lineHeight: 1, letterSpacing: '-0.04em', color: p.ink, whiteSpace: 'nowrap' }}>
            {p.title}
          </SweepReveal>
          {/* bar 1: a dimension line measures the title as it lands */}
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <Dim frame={frame} start={44} x1={W / 2 - titleW / 2} y1={226} x2={W / 2 + titleW / 2} y2={226} label="q4 · oct – dec" c={p.ink} size={30} />
          </svg>

          {/* the offer */}
          {frame >= HIT - 2 && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                width: W,
                top: 410,
                textAlign: 'center',
                opacity: clamp(slam * 2),
                scale: String(mix(1.35, 1, slam)),
                filter: slam < 1 ? `blur(${(1 - slam) * 18}px)` : undefined,
              }}
            >
              <span
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  ...displayFace('syne'),
                  fontSize: OFFER,
                  lineHeight: 1.08,
                  letterSpacing: '-0.045em',
                  padding: '0 0.12em',
                  whiteSpace: 'nowrap',
                  color: swipe > 0.55 ? onPop : p.ink,
                  backgroundImage: `linear-gradient(176deg, transparent 12%, ${p.pop} 12%, ${p.pop} 88%, transparent 88%)`,
                  backgroundSize: `${swipe * 100}% 100%`,
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {p.offer}
                <Glint frame={frame} start={CTA + 30} dur={44} style={{ position: 'absolute', inset: 0, padding: '0 0.12em' }}>
                  {p.offer}
                </Glint>
              </span>
            </div>
          )}

          {/* price line: old struck through, new */}
          <div style={{ position: 'absolute', left: 0, width: W, top: 730, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 36, fontFamily: FONTS.majormono, fontSize: 70, color: p.ink }}>
            <span style={{ position: 'relative', opacity: prog(frame, HIT + T.beats(2), 20) * 0.75, translate: `0 ${mix(24, 0, prog(frame, HIT + T.beats(2), 26))}px` }}>
              {p.oldPrice.toLowerCase()}
              <span style={{ position: 'absolute', left: -8, right: -8, top: '52%', height: 6, background: p.pop, transformOrigin: '0 50%', scale: `${strike} 1`, rotate: '-4deg' }} />
            </span>
            <span style={{ opacity: prog(frame, HIT + T.beats(2) + 8, 20), translate: `0 ${mix(24, 0, prog(frame, HIT + T.beats(2) + 8, 26))}px` }}>{p.newPrice.toLowerCase()}</span>
          </div>
        </div>

        {/* bar 3: panel + deadline dimension */}
        <Panel frame={frame} p={p} />
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <Dim frame={frame} start={MOVE + 50} x1={PX} y1={PY + PH + 56} x2={PX + PW} y2={PY + PH + 56} label={p.deadline.toLowerCase()} c={p.ink} size={30} />
        </svg>

        {/* bar 4: CTA + code */}
        <div style={{ position: 'absolute', left: 0, width: LEFT_CX * 2, top: 790, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 28 }}>
          <div
            style={{
              fontFamily: FONTS.bricolage,
              fontWeight: 800,
              fontSize: Math.min(46, 600 / Math.max(1, (p.cta.length + 2) * 0.5)),
              padding: '18px 32px',
              color: dark ? p.background : '#F7F5EF',
              background: p.ink,
              boxShadow: `10px 10px 0 ${p.pop}`,
              whiteSpace: 'nowrap',
              scale: String(prog(frame, CTA, 24, ease.backOut)),
              opacity: clamp(prog(frame, CTA, 8)),
            }}
          >
            {p.cta} →
          </div>
          <div
            style={{
              fontFamily: FONTS.majormono,
              fontSize: 34,
              padding: '14px 22px',
              border: `3px dashed ${p.pop}`,
              color: p.ink,
              whiteSpace: 'nowrap',
              opacity: clamp(prog(frame, CTA + 14, 10)),
              translate: `${mix(-30, 0, prog(frame, CTA + 14, 26))}px 0`,
              rotate: `${mix(-6, -2, prog(frame, CTA + 14, 26, ease.backOut))}deg`,
            }}
          >
            code {p.code.toLowerCase()}
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${hexA('#ffffff', flash * 0.6)} 0%, ${hexA(p.pop, flash * 0.55)} 25%, transparent 60%)`,
          mixBlendMode: 'screen',
        }}
      />
      <FilmOverlay grain={0.05} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
