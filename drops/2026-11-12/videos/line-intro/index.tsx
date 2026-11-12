import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Line Intro',
  category: 'intro',
  description: 'Channel intro in transit-map style: three coloured lines run in at 45°, meet at an interchange, and a sign band opens out of it with your wordmark or logo, tagline and line chips.',
  tags: ['intro', 'logo', 'transit', 'channel', 'ads', 'brand'],
};

// 60 fps on a 120 BPM grid: beat = 30 frames, bar = 120. 3 bars = 6 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(3) };

export const schema = z.object({
  brand: text('Wordmark').default('Junction'),
  tagline: text().default('Your ad agent on 32 platforms.'),
  chip1: text('Chip 1').default('Plan'),
  chip2: text('Chip 2').default('Launch'),
  chip3: text('Chip 3').default('Pace'),
  ticker: text('Ticker').default('L01 GOOGLE · L02 META · L03 TIKTOK · L04 LINKEDIN · L05 REDDIT · L06 PINTEREST · L07 SNAP · L08 CTV'),
  url: text('URL').default('junction.ad'),
  logo: image('Logo (optional)').default(''),
  font: font('Wordmark font').default('shoulders'),
  background: color().default('#FFF8E1'),
  ink: color('Ink / sign band').default('#1C2B1A'),
  signText: color('Sign text').default('#FFF8E1'),
  line1: color('Line 1').default('#FF7A00'),
  line2: color('Line 2').default('#2BB24C'),
  line3: color('Line 3').default('#FF3D7F'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night line': { background: '#0E1A14', ink: '#EAF2DC', signText: '#0E1A14', line1: '#FF9F43', line2: '#B5E550', line3: '#FF3D7F' },
  bauhaus: { background: '#F2EBDD', ink: '#111111', signText: '#F2EBDD', line1: '#D9381E', line2: '#1D4E9E', line3: '#F2B90F', font: 'anton' },
  blueprint: { background: '#0F3B8C', ink: '#EAF2FF', signText: '#0F3B8C', line1: '#FFDD00', line2: '#7FB2FF', line3: '#FF7A9C', tagline: 'Ship every campaign on time.' },
};

type P = z.infer<typeof schema>;
type Pt = [number, number];

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const len = (pts: Pt[]) => pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
const toStr = (pts: Pt[]) => pts.map(([a, b]) => `${a},${b}`).join(' ');

// Geometry (1920 × 1080)
const HX = 420; // interchange
const HY = 470;
const GAP = 46; // line spacing
const LW = 30; // line weight
const BAND_L = HX + 46;
const BAND_R = 1560;
const DIAG = 560;
const BAND_H = 250;

export default function LineIntro(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const dark = isDark(p.background);
  const end = video.durationInFrames;

  const HIT = T.beats(2); // lines reach the hub
  const OPEN = HIT + 4; // band wipes open from the hub
  const EXIT = end - T.beats(2);

  const colors = [p.line1, p.line2, p.line3];
  // Inbound: diagonals from the corners turning flat into the hub.
  const inbound: Pt[][] = [
    [[HX - 200 - DIAG, HY - GAP - DIAG], [HX - 200, HY - GAP], [HX, HY - GAP]],
    [[-60, HY], [HX, HY]],
    [[HX - 200 - DIAG, HY + GAP + DIAG], [HX - 200, HY + GAP], [HX, HY + GAP]],
  ];
  // Outbound: leave the right end of the sign and fan out to the edges.
  const outbound: Pt[][] = [
    [[BAND_R, HY - GAP], [BAND_R + 120, HY - GAP], [BAND_R + 120 + 700, HY - GAP - 700]],
    [[BAND_R, HY], [W + 60, HY]],
    [[BAND_R, HY + GAP], [BAND_R + 120, HY + GAP], [BAND_R + 120 + 700, HY + GAP + 700]],
  ];

  const exitT = prog(frame, EXIT, T.beats(2) - 6, ease.in);
  const draw = (i: number) => prog(frame, 2 + i * 5, HIT - 2 - i * 5, ease.outSoft);
  const drawOut = (i: number) => prog(frame, OPEN + 30 + i * 5, 40, ease.out);
  const hub = prog(frame, HIT - 2, 22, ease.backOut);
  const shock = prog(frame, HIT, 50, ease.out);
  const flash = keys(frame, [HIT - 2, HIT + 2, HIT + 24], [0, 1, 0], [ease.out, ease.outSoft]);
  const open = prog(frame, OPEN, 28, ease.out);
  const shake = frame >= HIT && frame < HIT + 14 ? Math.sin(frame * 2.3) * (1 - (frame - HIT) / 14) * 7 : 0;
  const push = mix(1, 1.045, prog(frame, 0, end, ease.inOutSoft));

  const bandW = (BAND_R - BAND_L) * open * (1 - exitT);
  const wordSize = p.brand.length > 10 ? 150 : 200;
  const bandCx = (BAND_L + BAND_R) / 2;
  const tick = (frame * 2.2) % 2400;
  const chips = [p.chip1, p.chip2, p.chip3].filter(Boolean);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.16, size: 40, y: -frame * 0.15, color: dark ? '255,255,255' : '28,43,26' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)'}
        glows={[
          { x: HX, y: HY, size: mix(500, 1400, open), color: hexA(p.line1, 0.4), opacity: dark ? 0.7 : 0.5 },
          { x: 1500, y: 900, size: 1300, color: hexA(p.line2, 0.35), opacity: (dark ? 0.5 : 0.35) + 0.1 * Math.sin(frame / 40) },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.1}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.6}px` }}>
        <Dust frame={frame} width={W} height={H} count={40} color={p.line1} seed={9} speed={0.8} opacity={dark ? 0.5 : 0.35} maxSize={5} />

        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {/* inbound lines draw toward the hub; on exit they retract the way they came */}
          {inbound.map((pts, i) => {
            const L = len(pts);
            const shown = draw(i) * (1 - exitT);
            // a zero-length dash still draws round caps: hide until it has length
            return (
              <g key={`in${i}`} opacity={shown > 0.002 ? 1 : 0}>
                <polyline points={toStr(pts)} fill="none" stroke={p.background} strokeWidth={LW * 1.7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L * shown} ${L * 2}`} />
                <polyline points={toStr(pts)} fill="none" stroke={colors[i]} strokeWidth={LW} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L * shown} ${L * 2}`} />
              </g>
            );
          })}
          {outbound.map((pts, i) => {
            const L = len(pts);
            const shown = drawOut(i) * (1 - exitT);
            return (
              <g key={`out${i}`} opacity={shown > 0.002 ? 1 : 0}>
                <polyline points={toStr(pts)} fill="none" stroke={colors[i]} strokeWidth={LW} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L * shown} ${L * 2}`} />
              </g>
            );
          })}
          {/* trains: small cream dots running along the inbound lines during the hold */}
          {inbound.map((pts, i) => {
            const L = len(pts);
            const vis = prog(frame, HIT + 20, 20) * (1 - exitT);
            return [0, 1].map((k) => {
              const u = (((frame - HIT) / 90 + k * 0.5 + i * 0.17) % 1 + 1) % 1;
              return (
                <polyline
                  key={`t${i}${k}`}
                  points={toStr(pts)}
                  fill="none"
                  stroke={p.background}
                  strokeWidth={LW * 0.36}
                  strokeLinecap="round"
                  strokeDasharray={`${LW * 1.4} ${L * 3}`}
                  strokeDashoffset={-u * L}
                  opacity={vis * 0.9}
                />
              );
            });
          })}
          {/* shockwave from the interchange */}
          <circle cx={HX} cy={HY} r={140 + shock * 620} fill="none" stroke={p.line1} strokeWidth={mix(10, 1, shock)} opacity={frame >= HIT ? (1 - shock) * 0.7 : 0} />
          <circle cx={HX} cy={HY} r={140 + prog(frame, HIT + 5, 60) * 420} fill="none" stroke={p.ink} strokeWidth={mix(4, 0.5, prog(frame, HIT + 5, 60))} opacity={frame >= HIT + 5 ? (1 - prog(frame, HIT + 5, 60)) * 0.4 : 0} />
        </svg>

        {/* Build label: a platform announcement that clears on the hit */}
        <div
          style={{
            position: 'absolute',
            left: HX + 80,
            top: HY - 34,
            fontFamily: FONTS.mono,
            fontWeight: 700,
            fontSize: 48,
            letterSpacing: '0.3em',
            whiteSpace: 'nowrap',
            opacity: prog(frame, 6, 18) * (1 - prog(frame, HIT - 6, 8, ease.in)),
            translate: `${mix(-30, 0, prog(frame, 6, 30))}px 0`,
          }}
        >
          NOW ARRIVING<span style={{ opacity: Math.floor(frame / 15) % 2 ? 1 : 0.2 }}> ▸</span>
        </div>

        {/* Sign band: wipes out of the hub to the right */}
        <div
          style={{
            position: 'absolute',
            left: BAND_L,
            top: HY - BAND_H / 2,
            width: bandW,
            height: BAND_H,
            background: p.ink,
            borderRadius: 26,
            overflow: 'hidden',
            boxShadow: `14px 14px 0 ${hexA(p.line1, 0.95)}`,
          }}
        >
          <div style={{ position: 'absolute', left: 0, top: 22, height: 8, width: BAND_R - BAND_L, background: `linear-gradient(90deg, ${p.line1} 0 33%, ${p.line2} 33% 66%, ${p.line3} 66%)`, opacity: 0.95 }} />
        </div>
        {frame >= OPEN && (
          <div style={{ position: 'absolute', left: BAND_L, width: BAND_R - BAND_L, top: HY - BAND_H / 2 + 20, height: BAND_H, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, opacity: 1 - exitT }}>
            {p.logo && <Img src={p.logo} style={{ height: 140, maxWidth: 360, objectFit: 'contain', opacity: prog(frame, OPEN + 10, 24) }} />}
            <SweepReveal frame={frame} start={OPEN + 8} dur={30} blur={14}>
              <div style={{ ...displayFace(p.font), fontSize: wordSize, lineHeight: 1, letterSpacing: '0.01em', textTransform: 'uppercase', color: p.signText, whiteSpace: 'nowrap' }}>{p.brand}</div>
            </SweepReveal>
            <Glint frame={frame} start={T.bars(2)} dur={44} style={{ position: 'absolute', ...displayFace(p.font), fontSize: wordSize, lineHeight: 1, letterSpacing: '0.01em', textTransform: 'uppercase', whiteSpace: 'nowrap', left: 0, right: 0, textAlign: 'center', paddingLeft: p.logo ? 400 : 0 }}>
              {p.brand}
            </Glint>
          </div>
        )}

        {/* Interchange capsule */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <g transform={`translate(${HX} ${HY}) scale(${hub * (1 - exitT * 0.6)})`} opacity={clamp(hub * 3)}>
            <rect x={-38} y={-GAP - 40} width={76} height={GAP * 2 + 80} rx={38} fill={p.background} stroke={p.ink} strokeWidth={12} />
            <circle r={14} fill={p.line3} />
          </g>
        </svg>

        {/* Tagline + chips centred under the sign */}
        <div style={{ position: 'absolute', left: BAND_L, width: BAND_R - BAND_L, top: HY + BAND_H / 2 + 60, opacity: 1 - exitT, translate: `0 ${-exitT * 30}px` }}>
          <WordsIn text={p.tagline} frame={frame} start={OPEN + 34} stagger={5} style={{ justifyContent: 'center', fontSize: 64, fontWeight: 500, letterSpacing: '-0.01em' }} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 22, marginTop: 34 }}>
            {chips.map((c, i) => {
              const t = prog(frame, T.beats(5) + i * 8, 24, ease.backOut);
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 30px 14px 18px',
                    borderRadius: 999,
                    border: `4px solid ${p.ink}`,
                    background: p.background,
                    fontFamily: FONTS.mono,
                    fontWeight: 700,
                    fontSize: 44,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    scale: String(mix(0.6, 1, t)),
                    opacity: clamp(t * 2),
                  }}
                >
                  <span style={{ width: 30, height: 30, borderRadius: '50%', background: colors[i % 3], border: `6px solid ${p.ink}`, boxSizing: 'border-box' }} />
                  {c}
                </div>
              );
            })}
          </div>
        </div>

        {/* Ticker of line codes along the bottom */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 64, height: 64, background: p.ink, opacity: prog(frame, OPEN + 20, 30) * (1 - exitT), display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <div style={{ whiteSpace: 'nowrap', fontFamily: FONTS.mono, fontWeight: 700, fontSize: 30, letterSpacing: '0.2em', color: p.signText, translate: `${-tick}px 0` }}>
            {`${p.ticker} · ${p.ticker} · ${p.ticker}`}
          </div>
        </div>
        <div style={{ position: 'absolute', right: 96, top: 92, fontFamily: FONTS.mono, fontSize: 30, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: prog(frame, OPEN + 40, 30) * (1 - exitT) }}>{p.url}</div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at ${HX}px ${HY}px, ${hexA('#FFFFFF', flash * 0.95)} 0%, ${hexA('#FFFFFF', flash * 0.5)} 12%, ${hexA(p.line1, flash * 0.18)} 24%, transparent 38%)`, mixBlendMode: dark ? 'screen' : 'normal', pointerEvents: 'none' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.45 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
