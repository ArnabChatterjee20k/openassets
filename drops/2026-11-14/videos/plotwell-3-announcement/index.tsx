import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, bezierPoint, clamp, displayFace, ease, hexA, keys, mix, prog, tempo, typed } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Plotwell 3 Announcement',
  category: 'announcement',
  description:
    'Product announcement on a cyanotype plan sheet: the grid draws on, the product name sweeps in over a dimension line, a pen plotter links your brief (or screenshot) to six platforms on the beat, and a highlighter marks the news before the CTA lands.',
  tags: ['announcement', 'product', 'blueprint', 'saas', 'ads', 'release'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames. 5 bars = 10 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text().default('announcing · nov 18 2026'),
  product: text('Product name').default('Plotwell 3'),
  version: text('Dimension label').default('v3.0 · drafted by your agent'),
  headline: text().default('Now running on 33 ad platforms.'),
  highlight: text('Highlighted words').default('33 ad platforms.'),
  body: textarea().default('One agent drafts the plan, makes the creatives, launches everywhere and rebalances spend every hour.'),
  platforms: text('Platforms (comma separated, 6)').default('Meta, Google, TikTok, YouTube, LinkedIn, Reddit'),
  brief: textarea('Brief card (one item per line)').default('q4 launch\n$4,200 / day\ngoal: cpa < $28'),
  cta: text('Call to action').default('plotwell.ai/3'),
  sheet: text('Title block').default('plotwell 3 · sheet 01'),
  screenshot: image('Product screenshot (optional)').default(''),
  background: color().default('#0F3B8C'),
  surface: color('Sheet').default('#134AA8'),
  ink: color('Text & lines').default('#EAF2FF'),
  line: color('Grid').default('#7FB2FF'),
  pop: color('Highlighter').default('#FFDD00'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  whiteprint: { background: '#F1EEE4', surface: '#E7E2D4', ink: '#173F9A', line: '#173F9A', pop: '#FFDD00' },
  'ink & gold': { background: '#0D0D0F', surface: '#1C1C20', ink: '#F3EDE2', line: '#C9A45C', pop: '#E8D9B5' },
  'ctv launch': {
    background: '#2B1B2E',
    surface: '#45293F',
    ink: '#FFE9D6',
    line: '#FF8E5E',
    pop: '#FFD27F',
    product: 'Plotwell CTV',
    eyebrow: 'new channel · dec 2 2026',
    headline: 'Your ads, now on the living-room screen.',
    highlight: 'living-room screen.',
    platforms: 'Netflix, Roku, Hulu, Prime Video, YouTube TV, Tubi',
    brief: 'holiday push\n$9,000 / day\ngoal: reach 2.4m',
    cta: 'plotwell.ai/ctv',
  },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const W = 1920;
const H = 1080;
const B1 = T.bars(1); // title
const B2 = T.bars(2); // plan plots
const B3 = T.bars(3); // highlight
const B4 = T.bars(4); // CTA
const END = video.durationInFrames;

/** Blueprint grid whose major lines draw on from the centre. */
function DraftGrid({ frame, p }: { frame: number; p: P }) {
  const step = 120;
  const drift = (frame * 0.25) % step;
  const op = isDark(p.background) ? 0.26 : 0.2;
  const cols = Math.ceil(W / step) + 2;
  const rows = Math.ceil(H / step) + 2;
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
      <g transform={`translate(0 ${-drift})`} stroke={p.line} strokeWidth={1.2}>
        {Array.from({ length: cols }, (_, i) => {
          const x = i * step;
          const d = Math.abs(x - W / 2) / W;
          const t = prog(frame, 2 + d * 40, 46, ease.out);
          return <line key={`v${i}`} x1={x} y1={H / 2 - (H / 2 + step) * t} x2={x} y2={H / 2 + (H / 2 + step * 2) * t} strokeOpacity={op} />;
        })}
        {Array.from({ length: rows }, (_, j) => {
          const y = j * step;
          const d = Math.abs(y - H / 2) / H;
          const t = prog(frame, 8 + d * 40, 46, ease.out);
          return <line key={`h${j}`} x1={W / 2 - (W / 2) * t} y1={y} x2={W / 2 + (W / 2) * t} y2={y} strokeOpacity={op} />;
        })}
      </g>
    </svg>
  );
}

/** Dimension line with ticks and a mono label; `t` draws it from the left. */
function DimLine({ x, y, w, t, label, p, size = 30 }: { x: number; y: number; w: number; t: number; label: string; p: P; size?: number }) {
  const len = w * t;
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: 60 }}>
      <svg width={w + 20} height={60} style={{ position: 'absolute', left: -10, top: 0, overflow: 'visible' }} stroke={p.ink} strokeWidth={2}>
        <line x1={10} y1={30} x2={10 + len} y2={30} />
        <line x1={10} y1={16} x2={10} y2={44} opacity={t > 0 ? 1 : 0} />
        <line x1={2} y1={38} x2={18} y2={22} strokeWidth={3} opacity={t > 0 ? 1 : 0} />
        <line x1={10 + w} y1={16} x2={10 + w} y2={44} opacity={t > 0.98 ? 1 : 0} />
        <line x1={2 + w} y1={38} x2={18 + w} y2={22} strokeWidth={3} opacity={t > 0.98 ? 1 : 0} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: w,
          top: 30 + 10,
          textAlign: 'center',
          fontFamily: FONTS.majormono,
          fontSize: size,
          color: p.ink,
          opacity: prog(t, 0.6, 0.4, ease.out),
          whiteSpace: 'nowrap',
        }}
      >
        {label.toLowerCase()}
      </div>
    </div>
  );
}

export default function Plotwell3Announcement(p: P) {
  const frame = useCurrentFrame();
  const dark = isDark(p.background);
  const onPop = dark ? p.background : p.ink;

  const push = mix(1, 1.04, prog(frame, 0, END, ease.inOutSoft));
  const outro = prog(frame, END - 30, 30, ease.in);
  const flash1 = keys(frame, [B1 - 2, B1 + 2, B1 + 24], [0, 0.7, 0], [ease.out, ease.outSoft]);
  const flash3 = keys(frame, [B3 - 2, B3 + 2, B3 + 26], [0, 0.55, 0], [ease.out, ease.outSoft]);

  // Title: centred hero during bar 2, then docks top-left for the plan.
  const dock = prog(frame, B2 - 8, 34, ease.inOut);
  const TITLE = p.product.length > 11 ? 170 : 210;
  const titleScale = mix(1, 0.52, dock);
  const titleX = mix(W / 2, 120, dock);
  const titleY = mix(H / 2 - 40, 150, dock);

  const names = p.platforms
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
  const briefLines = p.brief.split('\n').filter(Boolean).slice(0, 4);

  // Plan panel geometry (right side).
  const box = { x: 930, y: 420, w: 480, h: 330 };
  const tagX = 1560;
  const tagY0 = 300;
  const tagGap = (880 - tagY0) / Math.max(1, names.length - 1);
  const linkStart = (i: number) => B2 + 20 + i * 15; // half-beat stagger
  const highlightW = prog(frame, B3, 22, ease.inOutSoft) * 100;
  const hl = p.highlight && p.headline.includes(p.highlight) ? p.highlight : '';
  const hi = hl ? p.headline.indexOf(hl) : -1;

  // Which platform gets the highlight: the third one (index 2), on bar 4.
  const topI = Math.min(2, names.length - 1);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={false}
        lift={dark ? 'rgba(127,178,255,0.14)' : 'rgba(255,255,255,0.55)'}
        glows={[
          { x: W * 0.5, y: H * 0.5, size: 1500, color: hexA(p.line, dark ? 0.32 : 0.14), opacity: 0.7 + 0.2 * Math.sin(frame / 40) },
          { x: W * 0.78, y: H * 0.55, size: 1100, color: hexA(p.line, dark ? 0.28 : 0.12), opacity: prog(frame, B2, 60) },
          { x: W * 0.15, y: H * 1.05, size: 1200, color: hexA(p.pop, 0.12), opacity: prog(frame, B3, 40) },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.1}
      />

      <AbsoluteFill style={{ scale: String(push), opacity: 1 - outro }}>
        <DraftGrid frame={frame} p={p} />
        <Dust frame={frame} width={W} height={H} count={40} color={p.ink} seed={8} speed={0.6} opacity={0.3} maxSize={4} />

        {/* Registration crosshair lands in bar 1, fades as the title arrives */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: (1 - prog(frame, B1, 20)) * prog(frame, 16, 20) }}>
          <g stroke={p.ink} strokeWidth={2} fill="none" transform={`translate(${W / 2} ${H / 2}) rotate(${mix(-90, 0, prog(frame, 16, 40))}) scale(${mix(1.6, 1, prog(frame, 16, 40))})`}>
            <circle r={70} />
            <circle r={24} stroke={p.pop} strokeWidth={3} />
            <line x1={-130} y1={0} x2={130} y2={0} />
            <line x1={0} y1={-130} x2={0} y2={130} />
          </g>
        </svg>

        {/* Eyebrow types in during bar 1; docks with the title */}
        <div
          style={{
            position: 'absolute',
            left: dock > 0 ? 120 : 0,
            width: dock > 0 ? 900 : W,
            top: mix(H / 2 - TITLE / 2 - 150, 70, dock),
            textAlign: dock > 0 ? 'left' : 'center',
            fontFamily: FONTS.majormono,
            fontSize: mix(40, 30, dock),
            letterSpacing: '0.08em',
            color: p.ink,
            opacity: prog(frame, 26, 12) * (dock > 0 && dock < 1 ? Math.abs(dock - 0.5) * 2 : 1),
          }}
        >
          {typed(frame, 30, FPS, 26, p.eyebrow.toLowerCase())}
          <span style={{ display: 'inline-block', width: 14, height: 14, marginLeft: 14, borderRadius: '50%', background: p.pop, opacity: Math.floor(frame / 15) % 2 ? 1 : 0.25 }} />
        </div>

        {/* Title */}
        {frame >= B1 - 4 && (
          <div
            style={{
              position: 'absolute',
              left: titleX,
              top: titleY,
              transformOrigin: dock > 0.5 ? '0 0' : '50% 0',
              translate: `${mix(-50, 0, dock)}% ${-TITLE * 0.5 * (1 - dock)}px`,
              scale: String(titleScale),
            }}
          >
            <div style={{ position: 'relative', whiteSpace: 'nowrap', ...displayFace('syne'), fontSize: TITLE, lineHeight: 1, letterSpacing: '-0.04em' }}>
              <SweepReveal frame={frame} start={B1} dur={30}>
                <span style={{ color: p.ink }}>{p.product}</span>
              </SweepReveal>
              <Glint frame={frame} start={B4 + 30} dur={44} style={{ position: 'absolute', inset: 0 }}>
                {p.product}
              </Glint>
            </div>
          </div>
        )}
        {/* Dimension line under the centred title (bar 2 only) */}
        {frame >= B1 && frame < B2 + 10 && (
          <div style={{ opacity: 1 - prog(frame, B2 - 10, 16) }}>
            <DimLine x={W / 2 - 520} y={H / 2 + TITLE * 0.55} w={1040} t={prog(frame, B1 + 10, 40, ease.inOutSoft)} label={p.version} p={p} size={38} />
          </div>
        )}

        {/* ── Left column after the dock ── */}
        {frame >= B2 && (
          <>
            <div
              style={{
                position: 'absolute',
                left: 120,
                top: 330,
                width: 740,
                fontFamily: FONTS.bricolage,
                fontWeight: 800,
                fontSize: 88,
                lineHeight: 1.02,
                letterSpacing: '-0.03em',
                opacity: prog(frame, B2 + 14, 20),
                translate: `0 ${mix(30, 0, prog(frame, B2 + 14, 30))}px`,
                filter: `blur(${mix(10, 0, prog(frame, B2 + 14, 24))}px)`,
              }}
            >
              {hi >= 0 ? (
                <>
                  {p.headline.slice(0, hi)}
                  <span
                    style={{
                      color: highlightW > 40 ? onPop : p.ink,
                      backgroundImage: `linear-gradient(${p.pop}, ${p.pop})`,
                      backgroundSize: `${highlightW}% 78%`,
                      backgroundPosition: '0 62%',
                      backgroundRepeat: 'no-repeat',
                      WebkitBoxDecorationBreak: 'clone',
                      boxDecorationBreak: 'clone',
                      padding: '0 0.06em',
                    }}
                  >
                    {hl}
                  </span>
                  {p.headline.slice(hi + hl.length)}
                </>
              ) : (
                p.headline
              )}
            </div>
            <WordsIn
              text={p.body}
              frame={frame}
              start={B3 + 20}
              stagger={3}
              style={{ position: 'absolute', left: 120, top: 590, width: 740, fontFamily: FONTS.bricolage, fontSize: 44, lineHeight: 1.3, opacity: 0.88 }}
            />
          </>
        )}

        {/* ── Plan panel: brief box → platforms ── */}
        {frame >= B2 && (
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            {/* links drawn by the plotter */}
            {names.map((_, i) => {
              const s = linkStart(i);
              const t = prog(frame, s, 22, ease.inOut);
              const ty = tagY0 + i * tagGap;
              const p0: [number, number] = [box.x + box.w, box.y + box.h / 2];
              const p3: [number, number] = [tagX - 30, ty];
              const p1: [number, number] = [p0[0] + 120, p0[1]];
              const p2: [number, number] = [p3[0] - 120, ty];
              const d = `M${p0[0]},${p0[1]} C${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}`;
              const isTop = i === topI && frame >= B3;
              const head = bezierPoint(t, p0, p1, p2, p3);
              return (
                <g key={i}>
                  <path d={d} fill="none" pathLength={1} stroke={isTop ? p.pop : p.ink} strokeWidth={isTop ? 4 : 2.2} strokeDasharray={`${t} 1`} strokeOpacity={isTop ? 1 : 0.8} />
                  {t > 0 && t < 1 && (
                    <g transform={`translate(${head[0]} ${head[1]})`}>
                      <circle r={11} fill="none" stroke={p.pop} strokeWidth={2.5} />
                      <circle r={3.5} fill={p.pop} />
                    </g>
                  )}
                </g>
              );
            })}
            {/* construction ellipse */}
            <ellipse cx={box.x + box.w / 2} cy={box.y + box.h / 2} rx={330} ry={300} fill="none" stroke={p.line} strokeOpacity={0.45} strokeDasharray="3 10" strokeWidth={1.6} pathLength={1} style={{ opacity: prog(frame, B2 + 6, 30) }} />
          </svg>
        )}

        {/* brief box (or screenshot as "detail a") */}
        {frame >= B2 && (
          <div
            style={{
              position: 'absolute',
              left: box.x,
              top: box.y,
              width: box.w,
              height: box.h,
              border: `3px solid ${p.ink}`,
              background: hexA(p.surface, dark ? 0.9 : 0.95),
              boxShadow: `14px 14px 0 ${hexA(p.line, 0.35)}`,
              clipPath: `inset(0 ${100 - prog(frame, B2 + 4, 24, ease.inOut) * 100}% 0 0)`,
              overflow: 'hidden',
            }}
          >
            {p.screenshot ? (
              <Img src={p.screenshot} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ padding: '34px 36px', fontFamily: FONTS.majormono, color: p.ink }}>
                <div style={{ fontSize: 28, opacity: 0.7, marginBottom: 22 }}>brief</div>
                {briefLines.map((l, i) => (
                  <div key={i} style={{ fontSize: 34, lineHeight: 1.6, whiteSpace: 'nowrap', opacity: prog(frame, B2 + 14 + i * 6, 14) }}>
                    {l.toLowerCase()}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {frame >= B2 && (
          <div style={{ position: 'absolute', left: box.x, top: box.y - 50, fontFamily: FONTS.majormono, fontSize: 28, color: p.ink, opacity: prog(frame, B2 + 20, 16) }}>
            {p.screenshot ? 'detail a · your plan' : 'detail a'}
          </div>
        )}
        {frame >= B2 && (
          <DimLine x={box.x} y={box.y + box.h + 22} w={box.w} t={prog(frame, B2 + 30, 30, ease.inOutSoft)} label={`${names.length} of 33 platforms`} p={p} size={28} />
        )}

        {/* platform tags pop on the half-beats */}
        {names.map((n, i) => {
          const s = linkStart(i) + 18;
          const t = prog(frame, s, 16, ease.backOut);
          const ty = tagY0 + i * tagGap;
          const isTop = i === topI && frame >= B3;
          return (
            <div
              key={n}
              style={{
                position: 'absolute',
                left: tagX - 30,
                top: ty - 30,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                opacity: clamp(t * 1.5),
                scale: String(mix(0.6, 1, t)),
                transformOrigin: '0 50%',
              }}
            >
              <div style={{ width: 28, height: 28, borderRadius: '50%', border: `3px solid ${isTop ? p.pop : p.ink}`, background: isTop ? p.pop : p.background, boxShadow: isTop ? `0 0 30px ${p.pop}` : undefined }} />
              <div
                style={{
                  fontFamily: FONTS.majormono,
                  fontSize: 44,
                  padding: '2px 12px',
                  color: isTop ? onPop : p.ink,
                  background: isTop ? p.pop : 'transparent',
                  rotate: isTop ? '-1.5deg' : undefined,
                  whiteSpace: 'nowrap',
                }}
              >
                {n.toLowerCase()}
              </div>
            </div>
          );
        })}
        {/* the winning channel's live stat */}
        {names.length > 0 && (
          <div
            style={{
              position: 'absolute',
              left: tagX + 20,
              top: tagY0 + topI * tagGap + 30,
              fontFamily: FONTS.majormono,
              fontSize: 34,
              color: p.ink,
              opacity: prog(frame, B3 + 10, 16),
            }}
          >
            roas {(mix(1, 4.2, prog(frame, B3 + 10, 40, ease.out))).toFixed(1)}x ↑
          </div>
        )}

        {/* CTA + title block in bar 5 */}
        <div
          style={{
            position: 'absolute',
            left: 120,
            top: 900,
            fontFamily: FONTS.bricolage,
            fontWeight: 800,
            fontSize: 48,
            padding: '18px 34px',
            color: dark ? p.background : '#F7F5EF',
            background: p.ink,
            boxShadow: `10px 10px 0 ${p.pop}`,
            scale: String(prog(frame, B4, 24, ease.backOut)),
            transformOrigin: '0 50%',
            opacity: clamp(prog(frame, B4, 8)),
          }}
        >
          {p.cta} →
        </div>
        <div
          style={{
            position: 'absolute',
            right: 100,
            bottom: 60,
            width: 560,
            border: `3px solid ${p.ink}`,
            background: hexA(p.background, 0.9),
            fontFamily: FONTS.majormono,
            color: p.ink,
            opacity: clamp(prog(frame, B4 + 15, 6)),
            scale: String(mix(1.35, 1, prog(frame, B4 + 15, 14, ease.out))),
            rotate: `${mix(-6, -1.5, prog(frame, B4 + 15, 14, ease.out))}deg`,
          }}
        >
          <div style={{ padding: '14px 20px', fontSize: 28, whiteSpace: 'nowrap', borderBottom: `2px solid ${p.ink}` }}>{p.sheet.toLowerCase()}</div>
          <div style={{ display: 'flex', fontSize: 22 }}>
            <div style={{ padding: '10px 20px', borderRight: `2px solid ${p.ink}`, flex: 1 }}>approved</div>
            <div style={{ padding: '10px 20px', flex: 1, background: p.pop, color: onPop }}>live</div>
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${hexA('#ffffff', flash1 * 0.6)} 0%, ${hexA(p.line, flash1 * 0.5)} 30%, transparent 65%)`,
          mixBlendMode: 'screen',
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 30% 45%, ${hexA(p.pop, flash3 * 0.45)} 0%, transparent 55%)`,
          mixBlendMode: 'screen',
        }}
      />
      <FilmOverlay grain={0.05} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
