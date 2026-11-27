import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Platform Intro',
  category: 'intro',
  description:
    'Product intro for Plumbline: a cold CCTV feed of a bridge turns thermal under a scan line, the name sweeps in on the downbeat, three features land on beats and a strain pin pops on the span.',
  tags: ['intro', 'product', 'infrastructure', 'thermal', 'saas'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120. Five bars = 10 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text().default('Spatial intelligence for infrastructure'),
  product: text('Product name').default('Plumbline'),
  feature1: text('Feature 1').default('Video in.'),
  feature2: text('Feature 2').default('Live 3D twin out.'),
  feature3: text('Feature 3').default('Alerts in 0.8 s.'),
  tagline: text().default('Your cameras already see the cracks.'),
  cta: text('Call to action').default('plumbline.io/pilot'),
  pin: text('Anomaly label').default('Δ 3.2 mm · Span 3'),
  camLabel: text('Camera label').default('CAM 04 · RIVER ST BRIDGE'),
  feedImage: image('Camera still (optional)').default(''),
  font: font('Display font').default('bodoni'),
  background: color().default('#1A0A06'),
  surface: color().default('#2E120B'),
  accent: color('Heat').default('#FF4D00'),
  accent2: color('Hot core').default('#FFB000'),
  pop: color('Anomaly').default('#FF2E63'),
  textColor: color('Text').default('#FFEDE0'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'ink-gold': { background: '#0D0D0F', surface: '#1C1C20', accent: '#C9A45C', accent2: '#E8D9B5', pop: '#FF5A36', textColor: '#F3EDE2', font: 'instrument' },
  'deep-sea': {
    background: '#021B26',
    surface: '#06303F',
    accent: '#1B7FA6',
    accent2: '#2EF2C4',
    pop: '#FF7A59',
    textColor: '#E6FFFA',
    pin: 'Leak · 0.4 L/min',
    camLabel: 'CAM 11 · GAS MAIN 7',
    feature3: 'Leaks flagged in seconds.',
    tagline: 'Watch every pipe, not just the gauges.',
  },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', accent: '#7FB2FF', accent2: '#FFFFFF', pop: '#FFDD00', textColor: '#EAF2FF', font: 'familjen' },
};

type P = z.infer<typeof schema>;

// ---- the camera feed (600×360 space) ---------------------------------------

const VW = 600;
const VH = 360;
const DECK = 214;
const TOP = 138;
const WATER = 268;
const BOTTOM = Array.from({ length: 10 }, (_, i) => 48 + i * 56);
const TOPN = BOTTOM.slice(0, -1).map((x) => x + 28);
const PIERS = [160, 300, 440];
const HOT = { x: 356, y: TOP };

const TRUSS = (() => {
  const d: string[] = [`M${TOPN[0]},${TOP} L${TOPN[TOPN.length - 1]},${TOP}`, `M20,${DECK} L580,${DECK}`];
  BOTTOM.forEach((x, i) => {
    if (i < TOPN.length) d.push(`M${x},${DECK} L${TOPN[i]},${TOP} L${BOTTOM[i + 1]},${DECK}`);
  });
  TOPN.forEach((x) => d.push(`M${x},${TOP} L${x},${DECK}`));
  return d.join(' ');
})();

const rgb01 = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

function Bridge({ stroke, deckFill, pierFill, glow }: { stroke: string; deckFill: string; pierFill: string; glow?: boolean }) {
  return (
    <g>
      {glow && <path d={TRUSS} stroke={stroke} strokeWidth="10" fill="none" filter="url(#pi-bloom)" opacity="0.7" />}
      {PIERS.map((px) => (
        <rect key={px} x={px - 9} y={DECK + 4} width="18" height={WATER - DECK + 10} fill={pierFill} />
      ))}
      <path d={TRUSS} stroke={stroke} strokeWidth="3.2" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <rect x="20" y={DECK - 3} width="560" height="9" fill={deckFill} />
      <g mask="url(#pi-refl-mask)" transform={`translate(0 ${2 * WATER}) scale(1 -1)`} opacity="0.5">
        <path d={TRUSS} stroke={stroke} strokeWidth="3" fill="none" />
        <rect x="20" y={DECK - 3} width="560" height="9" fill={deckFill} />
      </g>
    </g>
  );
}

function Feed({ p, frame, x, y, w, heat, scanX, pinT, draw, rescan }: { p: P; frame: number; x: number; y: number; w: number; heat: number; scanX: number; pinT: number; draw: number; rescan: number }) {
  const h = w * (VH / VW);
  const ink = p.textColor;
  const [b0, a1, a2] = [rgb01(p.background), rgb01(p.accent), rgb01(p.accent2)];
  const table = (i: number) => `${b0[i]} ${a1[i] * 0.7} ${a1[i]} ${a2[i]} 1`;
  const k = 42 * draw;
  const m = 14;
  const corners = [
    `M${m},${m + k} L${m},${m} L${m + k},${m}`,
    `M${VW - m - k},${m} L${VW - m},${m} L${VW - m},${m + k}`,
    `M${VW - m},${VH - m - k} L${VW - m},${VH - m} L${VW - m - k},${VH - m}`,
    `M${m + k},${VH - m} L${m},${VH - m} L${m},${VH - m - k}`,
  ];
  const sec = 9 + Math.floor(frame / FPS);
  const ff = String(frame % FPS).padStart(2, '0');
  const rec = Math.floor(frame / 30) % 2 === 0;
  const pinScale = keys(pinT, [0, 0.35, 0.6], [0, 1.25, 1], [ease.out, ease.inOutSoft]);
  const ring = clamp(pinT * 1.4);
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, overflow: 'visible' }}>
      <defs>
        <linearGradient id="pi-heat" x1="0" x2="1">
          <stop offset="0" stopColor={p.surface} />
          <stop offset="0.28" stopColor={p.accent} />
          <stop offset="0.56" stopColor={p.accent2} />
          <stop offset="0.62" stopColor={p.accent2} />
          <stop offset="0.82" stopColor={p.accent} />
          <stop offset="1" stopColor={p.surface} />
        </linearGradient>
        <radialGradient id="pi-hot">
          <stop offset="0" stopColor={p.pop} stopOpacity="0.9" />
          <stop offset="0.35" stopColor={p.accent2} stopOpacity="0.45" />
          <stop offset="1" stopColor={p.accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="pi-refl" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="pi-refl-mask">
          <rect x="0" y={WATER} width={VW} height={VH - WATER} fill="url(#pi-refl)" />
        </mask>
        <clipPath id="pi-hotclip">
          <rect x="0" y="0" width={heat >= 1 ? VW : scanX} height={VH} />
        </clipPath>
        <clipPath id="pi-frame">
          <rect x="0" y="0" width={VW} height={VH} rx="6" />
        </clipPath>
        <filter id="pi-bloom" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id="pi-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        {/* gradient map: luminance → soot, ember, heat, hot core, white */}
        <filter id="pi-thermal" colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values="0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0.3 0.59 0.11 0 0  0 0 0 1 0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues={table(0)} />
            <feFuncG type="table" tableValues={table(1)} />
            <feFuncB type="table" tableValues={table(2)} />
          </feComponentTransfer>
        </filter>
        <filter id="pi-cold" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.55" />
          </feComponentTransfer>
        </filter>
      </defs>

      <g clipPath="url(#pi-frame)">
        <rect x="0" y="0" width={VW} height={VH} fill={hexA(p.surface, 0.6)} />
        {p.feedImage ? (
          <>
            <image href={p.feedImage} x="0" y="0" width={VW} height={VH} preserveAspectRatio="xMidYMid slice" filter="url(#pi-cold)" />
            <g clipPath="url(#pi-hotclip)">
              <image href={p.feedImage} x="0" y="0" width={VW} height={VH} preserveAspectRatio="xMidYMid slice" filter="url(#pi-thermal)" />
            </g>
          </>
        ) : (
          <>
            <rect x="0" y={WATER} width={VW} height={VH - WATER} fill={hexA(p.background, 0.7)} />
            <line x1="0" x2={VW} y1={WATER} y2={WATER} stroke={hexA(ink, 0.2)} />
            {/* cold, grey CCTV look */}
            <Bridge stroke={hexA(ink, 0.32)} deckFill={hexA(ink, 0.28)} pierFill={hexA(ink, 0.14)} />
            {/* thermal, revealed behind the scan line */}
            <g clipPath="url(#pi-hotclip)">
              <rect x="0" y="0" width={VW} height={VH} fill={p.background} opacity="0.5" />
              <ellipse cx={HOT.x} cy={(TOP + DECK) / 2} rx="190" ry="70" fill="url(#pi-hot)" filter="url(#pi-soft)" opacity={0.6 + 0.2 * Math.sin(frame / 18)} />
              <Bridge stroke="url(#pi-heat)" deckFill="url(#pi-heat)" pierFill={hexA(p.accent, 0.35)} glow />
              {[0, 1, 2, 3, 4].map((i) => {
                const dx = ((frame * 0.6 + i * 97) % 520) + 20;
                return <line key={i} x1={dx} x2={dx + 60} y1={WATER + 18 + (i % 3) * 16} y2={WATER + 18 + (i % 3) * 16} stroke={p.accent2} strokeOpacity="0.3" strokeWidth="1.4" strokeLinecap="round" />;
              })}
            </g>
          </>
        )}
        {/* CRT scanlines + rolling bar */}
        {Array.from({ length: 45 }, (_, i) => (
          <line key={i} x1="0" x2={VW} y1={i * 8 + 4} y2={i * 8 + 4} stroke={ink} strokeOpacity="0.04" />
        ))}
        <rect x="0" y={((frame * 1.5) % (VH + 60)) - 60} width={VW} height="60" fill={ink} opacity="0.035" />
        {/* the scan line */}
        {heat > 0 && heat < 1 && (
          <g>
            <rect x={scanX - 120} y="0" width="120" height={VH} fill={p.accent2} opacity="0.12" />
            <line x1={scanX} x2={scanX} y1="0" y2={VH} stroke={p.accent2} strokeWidth="2.5" />
            <line x1={scanX} x2={scanX} y1="0" y2={VH} stroke={p.accent2} strokeWidth="12" opacity="0.3" filter="url(#pi-bloom)" />
          </g>
        )}
        {rescan >= 0 && (
          <g opacity={Math.sin(Math.PI * rescan)}>
            <rect x={rescan * VW - 80} y="0" width="80" height={VH} fill={p.accent2} opacity="0.1" />
            <line x1={rescan * VW} x2={rescan * VW} y1="0" y2={VH} stroke={p.accent2} strokeWidth="2" />
          </g>
        )}
      </g>

      {/* anomaly pin */}
      {pinT > 0 && (
        <g>
          <circle cx={HOT.x} cy={HOT.y} r={14 + ring * 40} fill="none" stroke={p.pop} strokeWidth={mix(3, 0.5, ring)} opacity={1 - ring} />
          <g transform={`translate(${HOT.x} ${HOT.y}) scale(${pinScale})`}>
            <circle r="12" fill="none" stroke={p.pop} strokeWidth="2.5" />
            <circle r="5" fill={p.pop} />
          </g>
          <g opacity={prog(pinT * 60, 12, 14)}>
            <path d={`M${HOT.x + 14},${HOT.y - 12} L${HOT.x + 52},${HOT.y - 62} L${HOT.x + 64},${HOT.y - 62}`} stroke={p.pop} strokeWidth="1.6" fill="none" />
            <rect x={HOT.x + 68} y={HOT.y - 77} width={p.pin.length * 9.4 + 20} height="30" rx="15" fill={p.pop} />
            <text x={HOT.x + 78} y={HOT.y - 56} fontFamily={FONTS.familjen} fontSize="16" fontWeight="700" fill="#FFFFFF">
              {p.pin}
            </text>
          </g>
        </g>
      )}

      {/* viewfinder chrome */}
      {corners.map((d, i) => (
        <path key={i} d={d} stroke={ink} strokeWidth="2" fill="none" strokeLinecap="square" opacity={0.9 * draw} />
      ))}
      <g opacity={draw}>
        <circle cx="40" cy="44" r="6" fill={p.pop} opacity={rec ? 1 : 0.25} />
        <text x="54" y="50" fontFamily={FONTS.italiana} fontSize="17" letterSpacing="3" fill={ink}>
          REC · {p.camLabel}
        </text>
        <text x={VW - 34} y={VH - 34} textAnchor="end" fontFamily={FONTS.familjen} fontSize="14" letterSpacing="1.5" fill={ink} opacity="0.75">
          {heat > 0 ? 'THERMAL' : 'VISIBLE'} · 04:12:{String(sec).padStart(2, '0')}:{ff}
        </text>
      </g>
    </svg>
  );
}

// ---- the film ----------------------------------------------------------------

export default function PlatformIntro(p: P) {
  const frame = useCurrentFrame();
  const W = video.width;
  const H = video.height;
  const end = video.durationInFrames;

  const HIT = T.bars(1); // title downbeat
  const FEAT = T.bars(2); // features on beats
  const TAG = T.bars(3); // tagline + CTA
  const OUT = end - 40;

  const draw = prog(frame, 6, 36, ease.out);
  const feedIn = prog(frame, 0, 40, ease.out);
  const scan = prog(frame, T.beats(2), T.beats(2) - 4, ease.inOutSoft);
  const heat = frame >= HIT ? 1 : scan;
  const move = prog(frame, HIT - 22, 40, ease.inOut);
  const fx = mix(W / 2, 1420, move);
  const fy = mix(H / 2, 640, move);
  const fw = mix(1440, 780, move);
  // a second, quicker re-scan keeps the final bar alive
  const rescan = frame >= T.bars(4) + 10 && frame < T.bars(4) + 70 ? prog(frame, T.bars(4) + 10, 60, ease.inOutSoft) : -1;
  const pinT = clamp((frame - (FEAT + T.beats(3))) / 60);
  const flash = keys(frame, [HIT - 2, HIT + 2, HIT + 28], [0, 1, 0], [ease.out, ease.outSoft]);
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));
  const shake = frame >= HIT && frame < HIT + 14 ? Math.sin(frame * 2.3) * (1 - (frame - HIT) / 14) * 6 : 0;
  const outro = prog(frame, OUT, 40, ease.in);

  const TITLE = p.product.length > 10 ? 150 : 196;
  const colX = 140;
  const titleTop = 260;
  const titleStyle = {
    position: 'absolute' as const,
    left: colX,
    top: titleTop,
    ...displayFace(p.font, { italic: true, weight: 400 }),
    fontSize: TITLE,
    lineHeight: 1,
    letterSpacing: '-0.035em',
    whiteSpace: 'nowrap' as const,
    color: p.textColor,
  };
  const featOut = prog(frame, TAG - 10, 16, ease.in);
  const features = [p.feature1, p.feature2, p.feature3];

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: 0.05, size: 44, y: -frame * 0.15, color: '255,237,224' }}
        lift={hexA(p.accent, 0.05)}
        glows={[
          { x: fx, y: fy, size: mix(1400, 1300, move), color: hexA(p.accent, 0.35), opacity: mix(0.3, 0.9, heat) * (0.85 + 0.15 * Math.sin(frame / 40)) },
          { x: 200, y: H + 100, size: 1400, color: hexA(p.accent2, 0.18), opacity: prog(frame, HIT, 60) },
        ]}
        grain={0}
        vignette={0.55}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.6}px`, opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={55} color={p.accent2} seed={9} speed={1.1} opacity={0.4 * mix(0.4, 1, heat)} maxSize={5} />

        <div style={{ position: 'absolute', inset: 0, opacity: feedIn, filter: feedIn < 1 ? `blur(${(1 - feedIn) * 12}px)` : undefined }}>
          <Feed p={p} frame={frame} x={fx} y={fy} w={fw} heat={heat} scanX={scan * VW} pinT={pinT} draw={draw} rescan={rescan} />
        </div>

        {/* eyebrow */}
        <div
          style={{
            position: 'absolute',
            left: colX,
            top: titleTop - 70,
            fontFamily: FONTS.italiana,
            fontSize: 42,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: p.accent2,
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            opacity: frame >= HIT ? prog(frame, HIT + 8, 24) : 0,
            translate: `${mix(-24, 0, prog(frame, HIT + 8, 30))}px 0`,
          }}
        >
          <span style={{ width: 70 * prog(frame, HIT + 8, 30), height: 2, background: p.accent2 }} />
          {p.eyebrow}
        </div>

        {/* title */}
        {frame >= HIT && (
          <>
            <SweepReveal frame={frame} start={HIT + 2} dur={34} style={titleStyle}>
              {p.product}
            </SweepReveal>
            <Glint frame={frame} start={T.bars(4)} dur={44} style={titleStyle}>
              {p.product}
            </Glint>
          </>
        )}

        {/* features land on beats */}
        <div style={{ position: 'absolute', left: colX, top: titleTop + TITLE + 60, opacity: 1 - featOut }}>
          {features.map((f, i) => {
            const at = FEAT + i * T.beat;
            const t = prog(frame, at, 22, ease.out);
            const line = prog(frame, at, 30, ease.inOutSoft);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 28, height: 84, opacity: t, translate: `0 ${mix(30, 0, t)}px`, filter: t < 1 ? `blur(${(1 - t) * 10}px)` : undefined }}>
                <span style={{ fontFamily: FONTS.italiana, fontSize: 36, color: p.accent, width: 56 }}>0{i + 1}</span>
                <span style={{ fontSize: 56, fontWeight: 500, letterSpacing: '-0.01em' }}>{f}</span>
                <span style={{ position: 'absolute', left: 84, marginTop: 74, width: 560 * line, height: 1, background: hexA(p.textColor, 0.18) }} />
              </div>
            );
          })}
        </div>

        {/* tagline + CTA */}
        <WordsIn
          text={p.tagline}
          frame={frame}
          start={TAG + 6}
          stagger={5}
          style={{ position: 'absolute', left: colX, top: titleTop + TITLE + 70, width: 760, ...displayFace(p.font, { italic: false, weight: 400 }), fontSize: 72, lineHeight: 1.05, letterSpacing: '-0.02em' }}
        />
        <div
          style={{
            position: 'absolute',
            left: colX,
            top: titleTop + TITLE + 280,
            padding: '22px 40px',
            fontSize: 38,
            fontWeight: 700,
            letterSpacing: '0.01em',
            color: p.background,
            background: p.accent,
            boxShadow: `0 18px 50px ${hexA(p.accent, 0.4)}`,
            transformOrigin: 'left center',
            scale: String(prog(frame, TAG + T.beats(2), 24, ease.backOut)),
            opacity: clamp(prog(frame, TAG + T.beats(2), 10)),
          }}
        >
          {p.cta} →
        </div>
      </AbsoluteFill>

      {/* downbeat flash, screen-blended from the feed */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${(fx / W) * 100}% ${(fy / H) * 100}%, ${hexA('#FFFFFF', flash * 0.9)} 0%, ${hexA(p.accent2, flash * 0.6)} 22%, transparent 60%)`,
          mixBlendMode: 'screen',
        }}
      />
      <FilmOverlay grain={0.06} vignette={0.45} frame={frame} />
    </AbsoluteFill>
  );
}
