import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, clamp, displayFace, ease, hexA, mix, prog, tempo, typed } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Customer Quote',
  category: 'quote',
  description:
    'Feed testimonial for Plotwell: a compass scribes the quote marks, the quote lands word by word, a highlighter swipes the result while a dimension line measures it, then the customer appears in a compass-ring porthole with name, role and a title block.',
  tags: ['quote', 'testimonial', 'customer', 'social', 'blueprint', 'proof'],
};

// 60 fps on a 120 BPM grid: beat = 30 frames, bar = 120. 5 bars = 10 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1350, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text().default('customer notes · sheet 07'),
  quote: textarea().default('We replaced six dashboards with one plan. Plotwell cut our CPA 38% in six weeks.'),
  highlight: text('Highlighted words (in quote)').default('cut our CPA 38%'),
  measure: text('Dimension label').default('6 weeks · 9 channels'),
  name: text().default('Dana Whitfield'),
  role: text().default('VP Growth, Glowbar Skincare'),
  footer: text('Footer link').default('plotwell.ai/customers'),
  photo: image('Customer photo (optional)').default(''),
  background: color().default('#0F3B8C'),
  surface: color('Panel').default('#134AA8'),
  ink: color('Text & lines').default('#EAF2FF'),
  line: color('Grid').default('#7FB2FF'),
  pop: color('Highlighter').default('#FFDD00'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  whiteprint: { background: '#F1EEE4', surface: '#E7E2D4', ink: '#173F9A', line: '#173F9A', pop: '#FFDD00' },
  'ink & gold': {
    background: '#0D0D0F',
    surface: '#1C1C20',
    ink: '#F3EDE2',
    line: '#C9A45C',
    pop: '#E8D9B5',
    eyebrow: 'customer notes · sheet 12',
    quote: 'It plans like our best media buyer and never sleeps. ROAS is up 2.4× since spring.',
    highlight: 'ROAS is up 2.4×',
    measure: 'mar – sep · 4 platforms',
    name: 'Marcus Lee',
    role: 'Founder, Northpine Outdoor',
  },
  agency: {
    background: '#2B1B2E',
    surface: '#45293F',
    ink: '#FFE9D6',
    line: '#FF8E5E',
    pop: '#FFD27F',
    eyebrow: 'agency notes · sheet 03',
    quote: 'We run 40 clients on Plotwell. Launch day went from a week to an afternoon.',
    highlight: 'from a week to an afternoon',
    measure: '40 clients · 33 platforms',
    name: 'Priya Raman',
    role: 'Partner, Fieldwork Studio',
  },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const W = 1080;
const H = 1350;
const L = 90; // left margin
const QUOTE_AT = T.bars(1); // 120
const SWIPE_AT = T.bars(2); // 240
const PERSON_AT = T.bars(3); // 360
const END = video.durationInFrames;

function Grid({ frame, p }: { frame: number; p: P }) {
  const step = 90;
  const drift = (frame * 0.25) % step;
  const op = isDark(p.background) ? 0.18 : 0.15;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(0 ${-drift})`} stroke={p.line} strokeWidth={1.2}>
        {Array.from({ length: Math.ceil(W / step) + 1 }, (_, i) => {
          const t = prog(frame, i * 2, 40);
          return <line key={`v${i}`} x1={i * step} y1={0} x2={i * step} y2={(H + step) * t} strokeOpacity={op} />;
        })}
        {Array.from({ length: Math.ceil(H / step) + 2 }, (_, j) => {
          const t = prog(frame, 4 + j * 1.5, 40);
          return <line key={`h${j}`} x1={0} y1={j * step} x2={W * t} y2={j * step} strokeOpacity={op} />;
        })}
      </g>
    </svg>
  );
}

/**
 * Quote marks drawn like a compass construction: each mark is a circle scribed
 * by a rotating compass arm, then a tail; both fill with the highlighter on the beat.
 */
function QuoteMarks({ frame, p }: { frame: number; p: P }) {
  const r = 46;
  const marks = [
    { cx: L + r, cy: 214, start: 16 },
    { cx: L + r * 3.4, cy: 214, start: 34 },
  ];
  const fill = prog(frame, T.beats(3), 16, ease.out);
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      {marks.map((m, i) => {
        const s = prog(frame, m.start, 40, ease.inOutSoft);
        const a = -Math.PI / 2 + s * Math.PI * 2;
        const lx = m.cx + Math.cos(a) * r;
        const ly = m.cy + Math.sin(a) * r;
        const tail = prog(frame, m.start + 34, 20, ease.out);
        const tailPath = `M${m.cx + r * 0.98},${m.cy + r * 0.2} C${m.cx + r * 0.95},${m.cy + r * 1.6} ${m.cx + r * 0.1},${m.cy + r * 2.1} ${m.cx - r * 0.7},${m.cy + r * 2.25}`;
        return (
          // Rotated 180° so the tails rise from the left: opening “ marks.
          <g key={i} transform={`rotate(180 ${m.cx} ${m.cy + r * 0.6})`}>
            {/* construction ring */}
            <circle cx={m.cx} cy={m.cy} r={r + 18} fill="none" stroke={p.ink} strokeOpacity={0.3 * prog(frame, m.start - 6, 20)} strokeDasharray="3 8" strokeWidth={1.5} />
            <circle cx={m.cx} cy={m.cy} r={r} fill={hexA(p.pop, fill)} stroke={fill > 0.5 ? p.pop : p.ink} strokeWidth={4} pathLength={1} strokeDasharray={`${s} 1`} transform={`rotate(-90 ${m.cx} ${m.cy})`} />
            <path d={tailPath} fill="none" stroke={fill > 0.5 ? p.pop : p.ink} strokeWidth={fill > 0.5 ? 22 : 4} strokeLinecap="round" pathLength={1} strokeDasharray={`${tail} 1`} />
            {/* compass arm while scribing */}
            {s > 0 && s < 1 && (
              <g>
                <line x1={m.cx} y1={m.cy} x2={lx} y2={ly} stroke={p.ink} strokeWidth={2.5} strokeOpacity={0.6} />
                <circle cx={m.cx} cy={m.cy} r={6} fill={p.background} stroke={p.ink} strokeWidth={2.5} />
                <circle cx={lx} cy={ly} r={16} fill={p.pop} opacity={0.35} />
                <circle cx={lx} cy={ly} r={7} fill={p.pop} />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Words that belong to the highlight phrase (by word index). */
function highlightRange(words: string[], phrase: string): [number, number] {
  const hw = phrase.trim().split(/\s+/).filter(Boolean);
  if (!hw.length) return [-1, -1];
  const norm = (s: string) => s.toLowerCase().replace(/[.,!?;:"“”]/g, '');
  for (let i = 0; i + hw.length <= words.length; i++) {
    if (hw.every((w, k) => norm(words[i + k]) === norm(w))) return [i, i + hw.length - 1];
  }
  return [-1, -1];
}

export default function CustomerQuote(p: P) {
  const frame = useCurrentFrame();
  const dark = isDark(p.background);
  const onPop = dark ? p.background : p.ink;
  const push = mix(1, 1.04, prog(frame, 0, END, ease.inOutSoft));
  const outro = prog(frame, END - 30, 30, ease.in);

  const words = p.quote.trim().split(/\s+/);
  const [h0, h1] = highlightRange(words, p.highlight);
  // Size the quote by length so it always fits the 900 px column in ≤ 6 lines.
  const QS = p.quote.length > 110 ? 72 : p.quote.length > 80 ? 84 : 96;
  const quoteTop = 350;
  const quoteLines = Math.ceil((p.quote.length * QS * 0.5) / (W - L * 2));
  const quoteBottom = quoteTop + quoteLines * QS * 1.08;
  const dimY = Math.min(quoteBottom + 60, 900);

  const hlCount = h0 >= 0 ? h1 - h0 + 1 : 0;
  const ring = prog(frame, PERSON_AT, 40, ease.out);
  const PR = 92;
  const pcx = L + PR;
  const pcy = Math.min(dimY + 190, 1060);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={false}
        lift={dark ? 'rgba(127,178,255,0.14)' : 'rgba(255,255,255,0.55)'}
        glows={[
          { x: W * 0.3, y: 520, size: 1400, color: hexA(p.line, dark ? 0.32 : 0.16), opacity: 0.7 + 0.2 * Math.sin(frame / 34) },
          { x: W * 0.55, y: quoteBottom - 60, size: 900, color: hexA(p.pop, 0.2), opacity: prog(frame, SWIPE_AT, 40) * (0.7 + 0.2 * Math.sin(frame / 24)) },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.1}
      />
      <AbsoluteFill style={{ scale: String(push), opacity: 1 - outro, filter: outro > 0.01 ? `blur(${outro * 12}px)` : undefined }}>
        <Grid frame={frame} p={p} />
        <Dust frame={frame} width={W} height={H} count={45} color={p.ink} seed={21} speed={0.6} opacity={0.28} maxSize={4} />

        {/* eyebrow */}
        <div style={{ position: 'absolute', left: L, top: 104, fontFamily: FONTS.majormono, fontSize: 38, letterSpacing: '0.05em', color: p.ink, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ width: 44, height: 3, background: p.ink, scale: `${prog(frame, 4, 20)} 1`, transformOrigin: '0 50%' }} />
          {typed(frame, 8, FPS, 28, p.eyebrow.toLowerCase())}
        </div>

        <QuoteMarks frame={frame} p={p} />

        {/* the quote, word by word, with the highlighter on the result */}
        <div
          style={{
            position: 'absolute',
            left: L,
            top: quoteTop,
            width: W - L * 2,
            display: 'flex',
            flexWrap: 'wrap',
            columnGap: '0.26em',
            rowGap: QS * 0.08,
            fontFamily: FONTS.bricolage,
            fontWeight: 800,
            fontSize: QS,
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
          }}
        >
          {words.map((w, i) => {
            const t = prog(frame, QUOTE_AT + i * 4, 24, ease.out);
            const inHl = i >= h0 && i <= h1 && h0 >= 0;
            const k = inHl ? i - h0 : 0;
            const sw = inHl ? prog(frame, SWIPE_AT + (k * 14) / Math.max(1, hlCount), 16, ease.inOutSoft) : 0;
            return (
              <span
                key={i}
                style={{
                  position: 'relative',
                  display: 'inline-block',
                  opacity: clamp(t * 1.4),
                  translate: `0 ${(1 - t) * 30}px`,
                  filter: t < 1 ? `blur(${(1 - t) * 10}px)` : undefined,
                  color: sw > 0.6 ? onPop : p.ink,
                  // Highlighted words bridge the word gap so the swipe reads as one stroke.
                  padding: inHl && i < h1 ? '0 0.32em 0 0.06em' : '0 0.06em',
                  margin: inHl && i < h1 ? '0 -0.26em 0 -0.06em' : '0 -0.06em',
                  backgroundImage: inHl ? `linear-gradient(176deg, transparent 10%, ${p.pop} 10%, ${p.pop} 92%, transparent 92%)` : undefined,
                  backgroundSize: `${sw * 100}% 100%`,
                  backgroundRepeat: 'no-repeat',
                }}
              >
                {w}
                {inHl && (
                  <Glint frame={frame} start={T.bars(4) + 10 + k * 3} dur={40} style={{ position: 'absolute', inset: 0, padding: '0 0.06em' }}>
                    {w}
                  </Glint>
                )}
              </span>
            );
          })}
        </div>

        {/* dimension line measures the result */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {(() => {
            const t = prog(frame, SWIPE_AT + 10, 40, ease.inOutSoft);
            if (t <= 0) return null;
            const x1 = L;
            const x2 = W - L;
            const ex = mix(x1, x2, t);
            return (
              <g stroke={p.ink} strokeWidth={2} fill="none">
                <line x1={x1} y1={dimY} x2={ex} y2={dimY} />
                <line x1={x1} y1={dimY - 14} x2={x1} y2={dimY + 14} />
                <line x1={x1 - 7} y1={dimY + 7} x2={x1 + 7} y2={dimY - 7} strokeWidth={3} />
                {t > 0.98 && (
                  <>
                    <line x1={x2} y1={dimY - 14} x2={x2} y2={dimY + 14} />
                    <line x1={x2 - 7} y1={dimY + 7} x2={x2 + 7} y2={dimY - 7} strokeWidth={3} />
                  </>
                )}
                <text x={W / 2} y={dimY - 16} textAnchor="middle" fill={p.ink} stroke="none" fontFamily={FONTS.majormono} fontSize={32} opacity={prog(frame, SWIPE_AT + 30, 20)}>
                  {p.measure.toLowerCase()}
                </text>
              </g>
            );
          })()}
        </svg>

        {/* bar 4: the customer in a compass-ring porthole */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <g opacity={ring}>
            <circle cx={pcx} cy={pcy} r={PR + 14} fill="none" stroke={p.ink} strokeWidth={3} pathLength={1} strokeDasharray={`${ring} 1`} transform={`rotate(-90 ${pcx} ${pcy})`} />
            <g transform={`rotate(${(frame - PERSON_AT) * 0.25} ${pcx} ${pcy})`}>
              {Array.from({ length: 36 }, (_, i) => {
                const a = (i / 36) * Math.PI * 2;
                const long = i % 9 === 0;
                const r1 = PR + 24;
                const r2 = PR + (long ? 44 : 32);
                return <line key={i} x1={pcx + Math.cos(a) * r1} y1={pcy + Math.sin(a) * r1} x2={pcx + Math.cos(a) * r2} y2={pcy + Math.sin(a) * r2} stroke={long ? p.pop : p.ink} strokeWidth={long ? 4 : 1.6} strokeOpacity={long ? 1 : 0.6} />;
              })}
            </g>
          </g>
        </svg>
        <div
          style={{
            position: 'absolute',
            left: pcx - PR,
            top: pcy - PR,
            width: PR * 2,
            height: PR * 2,
            borderRadius: '50%',
            overflow: 'hidden',
            background: p.surface,
            display: 'grid',
            placeItems: 'center',
            scale: String(mix(0.5, 1, prog(frame, PERSON_AT + 6, 30, ease.backOut))),
            opacity: clamp(prog(frame, PERSON_AT + 6, 10)),
          }}
        >
          {p.photo ? (
            <Img src={p.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ ...displayFace('syne'), fontSize: 76, letterSpacing: '-0.05em', color: p.ink }}>
              {p.name
                .split(/\s+/)
                .map((s) => s[0] ?? '')
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </span>
          )}
        </div>
        <div style={{ position: 'absolute', left: pcx + PR + 64, top: pcy - 70, width: W - (pcx + PR + 64) - L }}>
          <div
            style={{
              ...displayFace('syne'),
              fontSize: p.name.length > 16 ? 50 : 58,
              lineHeight: 1.05,
              letterSpacing: '-0.035em',
              color: p.ink,
              opacity: clamp(prog(frame, PERSON_AT + 16, 14)),
              translate: `${mix(30, 0, prog(frame, PERSON_AT + 16, 30))}px 0`,
              filter: `blur(${mix(10, 0, prog(frame, PERSON_AT + 16, 24))}px)`,
            }}
          >
            {p.name}
          </div>
          <div
            style={{
              fontFamily: FONTS.bricolage,
              fontSize: 40,
              lineHeight: 1.2,
              marginTop: 10,
              color: p.ink,
              opacity: clamp(prog(frame, PERSON_AT + 26, 14)) * 0.88,
              translate: `${mix(30, 0, prog(frame, PERSON_AT + 26, 30))}px 0`,
            }}
          >
            {p.role}
          </div>
        </div>

        {/* footer: link in a title-block strip */}
        <div
          style={{
            position: 'absolute',
            left: L,
            right: L,
            top: H - 118,
            height: 56,
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `2px solid ${hexA(p.ink, 0.7)}`,
            fontFamily: FONTS.majormono,
            fontSize: 28,
            color: p.ink,
            opacity: prog(frame, PERSON_AT + T.beat, 20),
          }}
        >
          <span>plotwell</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: p.pop, opacity: 0.6 + 0.4 * Math.sin(frame / 12) }} />
            {p.footer.toLowerCase()}
          </span>
        </div>
      </AbsoluteFill>
      <FilmOverlay grain={0.05} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
