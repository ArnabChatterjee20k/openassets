import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Line Opening',
  category: 'launch',
  description:
    'Feature launch for Junction, the AI ad agent: a new coloured line draws across a route map and its stations pop on the beat, a ribbon across the tracks is cut on the hit, the line name slams in on a sign band, three feature "stops" arrive with an optional product screenshot, and a ride-it-today CTA settles.',
  tags: ['launch', 'feature', 'announcement', 'transit', 'ads', 'ctv'],
};

// 60 fps on a 120 BPM grid: beat = 30 frames, bar = 120. 5 bars = 10 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text().default('Now opening'),
  code: text('Line code').default('L33'),
  title: text('Line name').default('The CTV line'),
  subtitle: text().default('Your brief now runs on the big screen.'),
  stop1: text('Stop 1').default('Roku, Hulu, Disney+ and 9 more'),
  stop2: text('Stop 2').default('Same brief, same budget'),
  stop3: text('Stop 3').default('Reach by household, daily'),
  cta: text('CTA').default('Ride it today'),
  url: text('URL').default('junction.ad/ctv'),
  date: text('Date chip').default('Open Nov 12'),
  screenshot: image('Product screenshot (optional)').default(''),
  font: font('Title font').default('shoulders'),
  background: color().default('#FFF8E1'),
  surface: color('Panels').default('#FFE9A8'),
  ink: color('Ink / sign band').default('#1C2B1A'),
  signText: color('Sign text').default('#FFF8E1'),
  line: color('New line').default('#FF3D7F'),
  line2: color('Existing line 1').default('#FF7A00'),
  line3: color('Existing line 2').default('#2BB24C'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night line': { background: '#0E1A14', surface: '#18291F', ink: '#EAF2DC', signText: '#0E1A14', line: '#FF3D7F', line2: '#FF9F43', line3: '#B5E550' },
  'audio line': { line: '#2BB24C', line3: '#FF3D7F', code: 'L34', title: 'The Audio line', subtitle: 'Spotify, podcasts and radio from one brief.', stop1: 'Spotify, iHeart, SiriusXM', stop2: 'Scripts written for you', stop3: 'Host-read slots, booked', url: 'junction.ad/audio' },
  bauhaus: { background: '#F2EBDD', surface: '#E8DCC4', ink: '#111111', signText: '#F2EBDD', line: '#1D4E9E', line2: '#D9381E', line3: '#F2B90F', font: 'anton' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', ink: '#EAF2FF', signText: '#0F3B8C', line: '#FFDD00', line2: '#FF7A9C', line3: '#7FB2FF', title: 'Retail Media', code: 'L35', subtitle: 'Amazon, Walmart and Instacart, one brief.', url: 'junction.ad/retail' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

type Pt = [number, number];
const len = (pts: Pt[]) => pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
const toStr = (pts: Pt[]) => pts.map(([a, b]) => `${a},${b}`).join(' ');

// The new line: left edge → 45° climb → across the frame. Stations sit on it.
const NEW_LINE: Pt[] = [[-80, 820], [360, 820], [620, 560], [2000, 560]];
const STATIONS = [360, 620, 1000, 1380]; // x positions (first is on the flat, rest on y=560)
const RIBBON_X = 1180;

export default function LineOpening(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);
  const end = video.durationInFrames;
  const hasShot = !!p.screenshot;

  // Beat map
  const HIT = T.bars(1); // ribbon cut + title
  const STOPS = T.bars(2); // feature stops
  const CTA = T.bars(3) + T.beats(2);
  const EXIT = end - T.beats(2);

  const exitT = prog(frame, EXIT, T.beats(2) - 4, ease.in);
  const L = len(NEW_LINE);
  const draw = prog(frame, 6, HIT - 20, ease.inOutSoft);
  const flash = keys(frame, [HIT - 2, HIT + 3, HIT + 26], [0, 1, 0], [ease.out, ease.outSoft]);
  const shake = frame >= HIT && frame < HIT + 16 ? Math.sin(frame * 2.1) * (1 - (frame - HIT) / 16) * 9 : 0;
  const push = mix(1, 1.05, prog(frame, 0, end, ease.inOutSoft));

  // Phase 1 → 2: the map slides up and fades back to make room for the stops.
  // The map clears on the hit (the flash covers the change) so the title owns the frame.
  const mapBack = prog(frame, HIT - 4, 36, ease.inOut);
  const titleUp = 1;
  // Hold life: a train runs the new line, a dot runs down the stops line.
  const trainU = (((frame - HIT) / 140) % 1 + 1) % 1;

  const titleSize = p.title.length > 14 ? 150 : 196;
  const stops = [p.stop1, p.stop2, p.stop3].filter(Boolean);

  // Ribbon halves after the cut: they swing down and fall with drag.
  const cut = frame - HIT;
  const ribbonFall = (side: number) => {
    if (cut < 0) return { rot: 0, dy: 0, o: 1 };
    const t = cut / FPS;
    return { rot: side * Math.min(80, t * 260), dy: Math.min(900, t * t * 520), o: clamp(1 - t / 1.4) };
  };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, fontFamily: FONTS.outfit, overflow: 'hidden' }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.15, size: 44, y: -frame * 0.15, color: dark ? '255,255,255' : '28,43,26' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'}
        glows={[
          { x: RIBBON_X, y: 560, size: mix(700, 1600, prog(frame, HIT, 60)), color: hexA(p.line, 0.4), opacity: (dark ? 0.7 : 0.5) + 0.08 * Math.sin(frame / 40) },
          { x: 200, y: 1000, size: 1200, color: hexA(p.line3, 0.3), opacity: dark ? 0.5 : 0.3 },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.1}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.5}px` }}>
        <Dust frame={frame} width={W} height={H} count={40} color={p.line} seed={12} speed={0.8} opacity={dark ? 0.5 : 0.32} maxSize={5} />

        {/* ── Route map: two existing lines, the new line drawing over them ── */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: mix(1, 0.16, mapBack) * (1 - exitT), translate: `0 ${-mapBack * 120}px` }}>
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            {[
              { c: p.line2, pts: '-80,400 520,400 760,640 2000,640' },
              { c: p.line3, pts: '-80,940 900,940 1180,660 1180,-80' },
            ].map((l, i) => (
              <g key={i} opacity={prog(frame, i * 6, 30)}>
                <polyline points={l.pts} stroke={p.background} strokeWidth={46} />
                <polyline points={l.pts} stroke={l.c} strokeWidth={24} opacity={0.55} />
              </g>
            ))}
            <polyline points={toStr(NEW_LINE)} stroke={p.background} strokeWidth={62} strokeDasharray={`${L * draw} ${L * 2}`} opacity={draw > 0.002 ? 1 : 0} />
            <polyline points={toStr(NEW_LINE)} stroke={p.line} strokeWidth={34} strokeDasharray={`${L * draw} ${L * 2}`} opacity={draw > 0.002 ? 1 : 0} />
          </g>
          {frame > HIT && (
            <polyline points={toStr(NEW_LINE)} stroke={p.ink} strokeWidth={18} strokeLinecap="round" fill="none" strokeDasharray={`90 ${L * 3}`} strokeDashoffset={-trainU * L} />
          )}
          {/* stations pop on the beats as the line reaches them */}
          {STATIONS.map((x, i) => {
            const t = prog(frame, T.beats(i) + 14, 20, ease.backOut);
            const y = i === 0 ? 820 : 560;
            return (
              <g key={i} transform={`translate(${x} ${y}) scale(${t})`}>
                <circle r={30} fill={p.background} stroke={p.ink} strokeWidth={11} />
                {i === STATIONS.length - 1 && <circle r={11} fill={p.line} />}
              </g>
            );
          })}
          {/* interchange marks where the new line crosses existing ones */}
          {[[700, 560], [1180, 560]].map(([x, y], i) => (
            <rect key={i} x={x - 26} y={y - 46} width={52} height={92} rx={26} fill={p.background} stroke={p.ink} strokeWidth={10} opacity={prog(frame, HIT - 30 + i * 6, 20)} />
          ))}
        </svg>

        {/* ── Build label ── */}
        <div style={{ position: 'absolute', left: 120, top: 110, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 46, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: prog(frame, 4, 20) * (1 - prog(frame, HIT - 8, 10, ease.in)), translate: `${mix(-30, 0, prog(frame, 4, 30))}px 0` }}>
          {p.eyebrow}
          <span style={{ opacity: Math.floor(frame / 15) % 2 ? 1 : 0.2 }}> ▸</span>
        </div>

        {/* ── Ribbon across the tracks, cut on the hit ── */}
        {frame < HIT + 90 && (
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible', opacity: prog(frame, T.beats(2), 20) }}>
            {[-1, 1].map((side) => {
              const f = ribbonFall(side);
              const x0 = side < 0 ? RIBBON_X - 230 : RIBBON_X;
              const x1 = side < 0 ? RIBBON_X : RIBBON_X + 230;
              const pivot = side < 0 ? RIBBON_X - 230 : RIBBON_X + 230;
              const sag = Math.sin(frame / 12) * 5;
              return (
                <g key={side} opacity={f.o} transform={`translate(0 ${f.dy}) rotate(${-f.rot} ${pivot} 464)`}>
                  {/* posts with ball finials */}
                  <rect x={pivot - 12} y={440} width={24} height={360} rx={8} fill={p.ink} />
                  <circle cx={pivot} cy={436} r={22} fill={p.line2} stroke={p.ink} strokeWidth={7} />
                  <path d={`M${x0},${side < 0 ? 462 : 470 + sag} Q${(x0 + x1) / 2},${480 + sag} ${x1},${side < 0 ? 470 + sag : 462} L${x1},${side < 0 ? 534 + sag : 526} Q${(x0 + x1) / 2},${544 + sag} ${x0},${side < 0 ? 526 : 534 + sag} Z`} fill={p.line} stroke={p.ink} strokeWidth={6} strokeLinejoin="round" />
                </g>
              );
            })}
            {/* bow at the centre, gone on the cut */}
            {frame < HIT && (
              <g transform={`translate(${RIBBON_X} 498) scale(1.7)`}>
                <path d="M-8,10 L-30,60 L-16,54 L-8,66 Z M8,10 L30,60 L16,54 L8,66 Z" fill={p.line} stroke={p.ink} strokeWidth={4} strokeLinejoin="round" />
                <path d="M0,0 L-50,-34 L-50,34 Z M0,0 L50,-34 L50,34 Z" fill={p.line} stroke={p.ink} strokeWidth={4} strokeLinejoin="round" />
                <circle r={15} fill={p.line} stroke={p.ink} strokeWidth={4} />
              </g>
            )}
          </svg>
        )}
        <Streaks frame={frame} start={HIT} dur={36} width={W} height={H} direction="out" cx={RIBBON_X} cy={492} count={120} color={p.line} highlight="#FFFFFF" intensity={dark ? 1 : 0.8} seed={5} />
        {/* confetti tickets: drag + terminal velocity so they hang, then drift */}
        {frame >= HIT &&
          Array.from({ length: 36 }, (_, i) => {
            const r = (k: number) => rand(i * 9.13 + k);
            const t = (frame - HIT) / FPS;
            const vx = (r(1) - 0.5) * 1400;
            const vy = -500 - r(2) * 700;
            const drag = 2.6;
            const x = RIBBON_X + (vx / drag) * (1 - Math.exp(-drag * t));
            const y = 492 + (vy / drag) * (1 - Math.exp(-drag * t)) + 160 * t * t * 0.6 + 60 * t;
            const c = [p.line, p.line2, p.line3, p.ink][i % 4];
            const o = clamp(1 - (t - 2.2) / 1.2) * (1 - exitT);
            return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 14 + r(3) * 14, height: 8 + r(4) * 6, background: c, borderRadius: 2, rotate: `${t * (r(5) - 0.5) * 900}deg`, opacity: o }} />;
          })}

        {/* ── Title: line code bullet + name on a sign band ── */}
        {frame >= HIT - 2 && (
          <div style={{ position: 'absolute', left: 120, top: mix(330, 150, titleUp), display: 'flex', alignItems: 'center', gap: 36, opacity: 1 - exitT, translate: `0 ${-exitT * 40}px` }}>
            <div style={{ width: 210, height: 210, flex: 'none', borderRadius: '50%', background: p.line, border: `16px solid ${p.ink}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', scale: String(prog(frame, HIT - 2, 22, ease.backOut)), ...displayFace(p.font), fontSize: 92, color: '#FFFFFF', letterSpacing: '0.01em' }}>
              {p.code}
            </div>
            <div style={{ position: 'relative', background: p.ink, borderRadius: 26, padding: '24px 56px 18px', boxShadow: `14px 14px 0 ${p.line}`, clipPath: `inset(0 ${100 - prog(frame, HIT, 26, ease.out) * 100}% 0 0 round 26px)` }}>
              <SweepReveal frame={frame} start={HIT + 4} dur={30} blur={14}>
                <div style={{ ...displayFace(p.font), fontSize: titleSize, lineHeight: 0.9, letterSpacing: '0.005em', textTransform: 'uppercase', color: p.signText, whiteSpace: 'nowrap' }}>{p.title}</div>
              </SweepReveal>
              <Glint frame={frame} start={T.bars(2) + T.beats(3)} dur={44} style={{ position: 'absolute', left: 56, top: 24, ...displayFace(p.font), fontSize: titleSize, lineHeight: 0.9, letterSpacing: '0.005em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {p.title}
              </Glint>
            </div>
          </div>
        )}
        {/* subtitle under the title during the hit phase */}
        <div style={{ position: 'absolute', left: 120, top: mix(600, 420, titleUp), width: 1500, opacity: (1 - exitT) * (frame >= HIT ? 1 : 0) }}>
          <WordsIn text={p.subtitle} frame={frame} start={HIT + T.beats(1)} stagger={5} style={{ fontSize: 64, fontWeight: 500, letterSpacing: '-0.01em' }} />
        </div>

        {/* ── Feature stops: a vertical line with three stations ── */}
        <div style={{ position: 'absolute', left: 120, top: 560, width: hasShot ? 900 : 1400, opacity: 1 - exitT }}>
          <div style={{ position: 'absolute', left: 25, top: 30, width: 14, height: (stops.length - 1) * 112 * prog(frame, STOPS, 60, ease.inOutSoft), background: p.line, borderRadius: 7 }} />
          {frame > STOPS + 60 && (
            <div style={{ position: 'absolute', left: 21, top: 30 + ((((frame - STOPS - 60) / 90) % 1) * (stops.length - 1) * 112) - 16, width: 22, height: 32, borderRadius: 11, background: p.ink, opacity: 0.85 }} />
          )}
          {stops.map((s, i) => {
            const t = prog(frame, STOPS + i * T.beats(1), 26, ease.out);
            return (
              <div key={i} style={{ position: 'relative', height: 112, display: 'flex', alignItems: 'center', gap: 34, opacity: clamp(t * 1.5), translate: `${(1 - t) * -30}px 0`, filter: t < 1 ? `blur(${(1 - t) * 8}px)` : undefined }}>
                <div style={{ width: 64, height: 64, flex: 'none', borderRadius: '50%', background: p.background, border: `12px solid ${p.ink}`, boxSizing: 'border-box', scale: String(mix(0.4, 1, prog(frame, STOPS + i * T.beats(1), 20, ease.backOut))) }} />
                <span style={{ fontSize: 54, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{s}</span>
              </div>
            );
          })}
        </div>

        {/* ── Optional screenshot in a station-sign frame ── */}
        {hasShot && (
          <div style={{ position: 'absolute', right: 120, top: 520, width: 700, height: 440, borderRadius: 28, border: `10px solid ${p.ink}`, overflow: 'hidden', background: p.surface, boxShadow: `16px 16px 0 ${p.line}`, opacity: prog(frame, STOPS + 10, 30) * (1 - exitT), translate: `${mix(80, 0, prog(frame, STOPS + 10, 40))}px ${Math.sin(frame / 50) * 6}px`, rotate: `${mix(4, 1.5, prog(frame, STOPS + 10, 50))}deg` }}>
            <Img src={p.screenshot} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        {/* ── CTA + date chip ── */}
        <div style={{ position: 'absolute', right: 120, bottom: 110, display: 'flex', alignItems: 'flex-end', gap: 24, opacity: 1 - exitT, flexDirection: 'column-reverse' }}>
          {p.cta && (
            <div style={{ padding: '26px 52px', borderRadius: 999, background: p.ink, color: p.signText, fontWeight: 800, fontSize: 56, whiteSpace: 'nowrap', boxShadow: `10px 10px 0 ${p.line}`, scale: String(mix(0.5, 1, prog(frame, CTA, 24, ease.backOut))), opacity: clamp(prog(frame, CTA, 24) * 2) }}>
              {p.cta} →
            </div>
          )}
          <div style={{ textAlign: 'right', opacity: prog(frame, CTA + 8, 24), translate: `${(1 - prog(frame, CTA + 8, 30)) * 30}px 0` }}>
            <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: 46, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{p.url}</div>
            {p.date && <div style={{ display: 'inline-block', marginTop: 10, padding: '6px 18px', borderRadius: 10, background: p.line3, color: p.ink, fontFamily: FONTS.mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.2em', textTransform: 'uppercase' }}>● {p.date}</div>}
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at ${RIBBON_X}px 492px, ${hexA('#FFFFFF', flash * 0.95)} 0%, ${hexA('#FFFFFF', flash * 0.5)} 12%, ${hexA(p.line, flash * 0.2)} 26%, transparent 42%)`, pointerEvents: 'none' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.45 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
