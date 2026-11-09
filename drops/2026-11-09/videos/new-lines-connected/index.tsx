import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, bezierPoint, clamp, displayFace, ease, hexA, keys, mix, prog, rand, shade, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'New Lines Connected',
  category: 'announcement',
  description:
    'Integration announcement: a mid-century switchboard builds on the beat, an orange patch cord swoops in and plugs the new platform on the downbeat, then the headline, platform chips and CTA land while every lamp ripples on.',
  tags: ['announcement', 'integration', 'new feature', 'switchboard', 'mid-century', 'ads'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120 frames. 4 bars = 8 s.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text('Handwritten note').default('New lines · November 2026'),
  line1: text('Headline').default('Now patched into'),
  line2: text('Headline, accent line').default('TikTok Shop.'),
  body: textarea().default('Patchwell now runs your brief on TikTok Shop, Reddit Pro and Roku CTV. That makes 36 lines from one brief.'),
  chip1: text('Platform chip 1').default('TikTok Shop'),
  chip2: text('Platform chip 2').default('Reddit Pro'),
  chip3: text('Platform chip 3').default('Roku CTV'),
  cta: text('Call to action').default('Patch them in  →  patchwell.ai'),
  caption: text('Screenshot caption').default('live on 214 accounts'),
  font: font('Headline font').default('youngserif'),
  background: color().default('#F4E9D8'),
  surface: color('Paper / disc').default('#E6D3B3'),
  panel: color('Switchboard').default('#2C7873'),
  accent: color('Patch cord').default('#D96C3D'),
  lamp: color('Lamps').default('#E9B44C'),
  textColor: color('Ink').default('#2E2A24'),
  productImage: image('Screenshot (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-shift': { background: '#2A0A10', surface: '#3F1019', panel: '#F5C6AA', accent: '#E3173E', lamp: '#F7B32B', textColor: '#FFE8E0', line2: 'Roku CTV.', chip1: 'Roku CTV' },
  matcha: { background: '#EEF1E6', surface: '#DCE3CC', panel: '#1E2A1A', accent: '#E85D3F', lamp: '#C9A227', textColor: '#1E2A1A', font: 'fraunces', line2: 'Reddit Pro.', chip1: 'Reddit Pro', chip2: 'TikTok Shop' },
  bauhaus: { background: '#F2EBDD', surface: '#E4D9C4', panel: '#1D4E9E', accent: '#D9381E', lamp: '#F2B90F', textColor: '#111111', font: 'dela' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 120;
};

// Switchboard layout (px, 1920×1080 frame).
const PX = 1090;
const PY = 200;
const PW = 690;
const PH = 600;
const COLS = 5;
const ROWS = 4;
const TARGET = { c: 2, r: 1 };
const NAMES = ['Meta', 'Google', 'YouTube', 'Reddit', 'LinkedIn', 'Pinterest', 'Snap', '', 'Amazon', 'Spotify', 'Bing', 'Quora', 'Roku', 'Hulu', 'Twitch', 'Criteo', 'Yelp', 'Uber', 'X', 'Taboola'];
const jackAt = (c: number, r: number) => ({ x: PX + 70 + ((PW - 140) / (COLS - 1)) * c, y: PY + 160 + ((PH - 245) / (ROWS - 1)) * r });

const IMPACT = T.bars(1); // the plug seats on the downbeat of bar 2

function Starburst({ x, y, r, c, sw, k }: { x: number; y: number; r: number; c: string; sw: number; k: number }) {
  if (k <= 0) return null;
  return (
    <g stroke={c} strokeWidth={sw} strokeLinecap="round" opacity={clamp(k * 1.5)}>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        const l = (i % 2 ? r * 0.55 : r) * k;
        return <line key={i} x1={x + Math.cos(a) * r * 0.25 * k} y1={y + Math.sin(a) * r * 0.25 * k} x2={x + Math.cos(a) * l} y2={y + Math.sin(a) * l} />;
      })}
    </g>
  );
}

export default function NewLinesConnected(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const ink = p.textColor;
  const dim = dark ? shade(p.panel, 0.35) : shade(p.panel, -0.3);

  // Camera: slow push, a small kick on impact, and the exit.
  const push = mix(1, 1.045, prog(frame, 0, end, ease.inOutSoft));
  // Bar 1 frames the switchboard centre-screen and pushed in; right after the
  // plug seats the camera pans out to make room for the headline.
  const pan = prog(frame, IMPACT + 4, 34, ease.inOut);
  const camX = mix(W / 2 - (PX + PW / 2), 0, pan);
  const camS = mix(1.12, 1, pan);
  const shakeK = Math.exp(-Math.max(0, frame - IMPACT) / 6) * (frame >= IMPACT ? 1 : 0);
  const shakeX = (rand(Math.floor(frame / 2) * 1.7) - 0.5) * 14 * shakeK;
  const shakeY = (rand(Math.floor(frame / 2) * 3.1) - 0.5) * 10 * shakeK;
  const outro = prog(frame, end - 36, 36, ease.in);

  // Panel entrance: slides up and settles over beat 1.
  const panelIn = prog(frame, 0, 40, ease.out);
  const t = jackAt(TARGET.c, TARGET.r);

  // Cord: drawn from off-frame (bottom-left) up into the target jack over beats 2-4.
  const P0: [number, number] = [780, H + 60];
  const P1: [number, number] = [1020, 1000];
  const P2: [number, number] = [t.x + 30, t.y + 520];
  const P3: [number, number] = [t.x, t.y];
  const cordT = prog(frame, T.beats(1.5), IMPACT - T.beats(1.5), ease.inOut);
  const head = bezierPoint(cordT, P0, P1, P2, P3);
  const cordPath = `M${P0[0]},${P0[1]} C${P1[0]},${P1[1]} ${P2[0]},${P2[1]} ${P3[0]},${P3[1]}`;
  const seated = frame >= IMPACT;
  const seatPop = prog(frame, IMPACT, 18, ease.backOut);
  const burst = prog(frame, IMPACT, 30, ease.out) * (1 - prog(frame, IMPACT + 30, 40, ease.in));
  const ring = prog(frame, IMPACT, 50, ease.out);

  // Lamps: dim at first; after the hit they cascade on from the patched jack;
  // in bar 4 a brighter ripple sweeps across them.
  const lampState = (c: number, r: number) => {
    const d = Math.hypot(c - TARGET.c, r - TARGET.r);
    const on = c === TARGET.c && r === TARGET.r ? (seated ? 1 : 0) : prog(frame, IMPACT + 10 + d * 9, 14, ease.out);
    const ripple = keys(frame, [T.bars(3) + d * 7, T.bars(3) + d * 7 + 8, T.bars(3) + d * 7 + 30], [0, 1, 0], [ease.out, ease.inOutSoft]);
    return { on, ripple };
  };

  // Copy timing (bar 2 onward).
  const titleSize = Math.min(150, 880 / Math.max(6, p.line2.length * 0.55));
  const chips = [p.chip1, p.chip2, p.chip3].filter(Boolean);
  const copyX = 150;
  const titleTop = 220;

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: ink, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.1, size: 40, y: -frame * 0.15, color: dark ? '255,255,255' : '46,42,36' }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,250,240,0.7)'}
        glows={[]}
        grain={0}
        vignette={dark ? 0.4 : 0.1}
      />

      <AbsoluteFill style={{ scale: String(push), translate: `${shakeX}px ${shakeY}px`, opacity: 1 - outro }}>
        <AbsoluteFill style={{ translate: `${camX}px 0`, scale: String(camS), transformOrigin: `${PX + PW / 2}px ${PY + PH / 2}px` }}>
        {/* sun disc + boomerang */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={PX + PW * 0.6} cy={PY + PH * 0.45} r={mix(0, 470, prog(frame, 0, 50, ease.out)) + Math.sin(frame / 40) * 6} fill={p.surface} />
          <path
            d={`M${PX - 220},${PY + PH + 80} Q${PX + 260},${PY + PH * 0.5} ${PX + PW + 120},${PY - 50} Q${PX + 380},${PY + PH * 0.82} ${PX - 220},${PY + PH + 80} Z`}
            fill={hexA(p.lamp, dark ? 0.3 : 0.5)}
            opacity={prog(frame, 10, 40)}
            transform={`translate(${mix(-60, 0, prog(frame, 10, 50, ease.out))} 0)`}
          />
        </svg>

        <Dust frame={frame} width={W} height={H} count={40} color={p.lamp} seed={9} speed={0.7} opacity={dark ? 0.5 : 0.65} maxSize={5} />

        {/* the switchboard */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <g transform={`translate(0 ${mix(80, 0, panelIn)})`} opacity={panelIn}>
            <rect x={PX + 14} y={PY + 16} width={PW} height={PH} rx={28} fill={ink} />
            <rect x={PX} y={PY} width={PW} height={PH} rx={28} fill="#7A4E2D" stroke={ink} strokeWidth={4} />
            <rect x={PX + 18} y={PY + 18} width={PW - 36} height={PH - 36} rx={18} fill={p.panel} />
            <rect x={PX + 18} y={PY + 18} width={PW - 36} height={(PH - 36) * 0.45} rx={18} fill="#ffffff" opacity={0.06} />
            <text x={PX + 46} y={PY + 66} fontFamily={FONTS.familjen} fontWeight={700} fontSize={20} letterSpacing="0.3em" fill={dark ? shade(p.panel, -0.7) : shade(p.panel, 0.8)}>
              PATCHWELL · EXCHANGE
            </text>
            {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([u, v], i) => (
              <circle key={i} cx={PX + 32 + u * (PW - 64)} cy={PY + 32 + v * (PH - 64)} r={6} fill="#C9A45C" />
            ))}
            {Array.from({ length: ROWS * COLS }, (_, i) => {
              const c = i % COLS;
              const r = Math.floor(i / COLS);
              const j = jackAt(c, r);
              const isT = c === TARGET.c && r === TARGET.r;
              const pop = prog(frame, 4 + (c + r) * 3, 22, ease.backOut);
              const { on, ripple } = lampState(c, r);
              const name = isT ? p.chip1 : NAMES[i];
              return (
                <g key={i} transform={`translate(${j.x} ${j.y}) scale(${pop})`}>
                  {(on > 0 || ripple > 0) && <circle cx={0} cy={-46} r={18 + ripple * 16 + (isT ? burst * 22 : 0)} fill={hexA(p.lamp, 0.28 * Math.max(on, ripple))} />}
                  <circle cx={0} cy={-46} r={13} fill={on > 0.5 || ripple > 0.3 ? p.lamp : dim} stroke={ink} strokeWidth={2.5} />
                  {on > 0.5 && <circle cx={-4} cy={-50} r={4} fill="#FFF6DA" opacity={0.85} />}
                  <circle cx={0} cy={0} r={21} fill="#C9A45C" stroke={ink} strokeWidth={2.5} />
                  <circle cx={0} cy={0} r={10} fill={ink} />
                  {name && (
                    <text y={46} textAnchor="middle" fontFamily={FONTS.familjen} fontWeight={700} fontSize={isT ? 17 : 15} letterSpacing="0.06em" fill={isT ? p.lamp : dark ? shade(p.panel, -0.7) : shade(p.panel, 0.8)}>
                      {name.toUpperCase()}
                    </text>
                  )}
                </g>
              );
            })}
          </g>

          {/* the patch cord: shadow, body, highlight (revealed along its length) */}
          {cordT > 0 && (
            <g>
              <path d={cordPath} pathLength={1} strokeDasharray={`${cordT} 2`} fill="none" stroke={ink} strokeWidth={26} strokeLinecap="round" transform="translate(8 10)" opacity={0.85} />
              <path d={cordPath} pathLength={1} strokeDasharray={`${cordT} 2`} fill="none" stroke={p.accent} strokeWidth={20} strokeLinecap="round" />
              <path d={cordPath} pathLength={1} strokeDasharray={`${cordT} 2`} fill="none" stroke="#ffffff" strokeWidth={4} strokeLinecap="round" opacity={0.35} transform="translate(-4 -3)" />
              {/* plug: travels on the cord's head, seats with a pop */}
              <g transform={`translate(${seated ? t.x : head[0]} ${seated ? t.y : head[1]}) scale(${seated ? mix(1.3, 1, seatPop) : 1.15})`}>
                <circle r={34} fill={p.accent} stroke={ink} strokeWidth={4} />
                <circle r={17} fill={shade(p.accent, -0.25)} />
                <circle cx={-10} cy={-11} r={8} fill="#ffffff" opacity={0.4} />
              </g>
            </g>
          )}
          {/* impact: ring + starburst */}
          {seated && <circle cx={t.x} cy={t.y} r={60 + ring * 260} fill="none" stroke={p.accent} strokeWidth={mix(8, 1, ring)} opacity={(1 - ring) * 0.8} />}
          <Starburst x={t.x + 70} y={t.y - 90} r={70} c={p.lamp} sw={6} k={burst} />
          <Starburst x={t.x - 80} y={t.y - 60} r={40} c={p.accent} sw={4} k={prog(frame, IMPACT + 4, 30, ease.out) * (1 - prog(frame, IMPACT + 40, 40, ease.in))} />
        </svg>

        {/* optional screenshot, pinned like a polaroid over the panel corner */}
        {p.productImage && (
          <div
            style={{
              position: 'absolute',
              left: PX - 150,
              top: PY + PH - 250,
              width: 380,
              padding: '16px 16px 52px',
              background: '#FFFBF2',
              border: `3px solid ${ink}`,
              boxShadow: `12px 14px 0 ${ink}`,
              rotate: `${mix(-14, -5, prog(frame, T.bars(1.5), 40, ease.out))}deg`,
              translate: `0 ${mix(240, 0, prog(frame, T.bars(1.5), 40, ease.out)) + Math.sin(frame / 36) * 4}px`,
              opacity: prog(frame, T.bars(1.5), 20),
            }}
          >
            <Img src={p.productImage} style={{ width: '100%', height: 230, objectFit: 'cover', display: 'block', border: `2px solid ${hexA('#2E2A24', 0.3)}` }} />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 8, textAlign: 'center', fontFamily: FONTS.caveat, fontWeight: 700, fontSize: 36, color: '#2E2A24' }}>{p.caption}</div>
          </div>
        )}
        </AbsoluteFill>

        {/* copy */}
        <div
          style={{
            position: 'absolute',
            left: copyX,
            top: titleTop - 90,
            fontFamily: FONTS.caveat,
            fontWeight: 700,
            fontSize: 60,
            color: p.accent,
            rotate: '-3deg',
            opacity: prog(frame, IMPACT + 22, 20),
            translate: `${mix(-30, 0, prog(frame, IMPACT + 22, 30, ease.out))}px 0`,
            whiteSpace: 'nowrap',
          }}
        >
          {p.eyebrow}
        </div>
        {frame >= IMPACT && (
          <>
            <SweepReveal frame={frame} start={IMPACT + 26} dur={30} style={{ position: 'absolute', left: copyX, top: titleTop, ...displayFace(p.font), fontSize: 100, lineHeight: 1.05, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              {p.line1}
            </SweepReveal>
            <SweepReveal frame={frame} start={IMPACT + 34} dur={32} style={{ position: 'absolute', left: copyX, top: titleTop + 112, ...displayFace(p.font), fontSize: titleSize, lineHeight: 1.05, letterSpacing: '-0.025em', color: p.accent, whiteSpace: 'nowrap' }}>
              {p.line2}
            </SweepReveal>
            <Glint frame={frame} start={T.bars(3) - 10} dur={44} style={{ position: 'absolute', left: copyX, top: titleTop + 112, ...displayFace(p.font), fontSize: titleSize, lineHeight: 1.05, letterSpacing: '-0.025em', whiteSpace: 'nowrap' }}>
              {p.line2}
            </Glint>
          </>
        )}

        {/* platform chips pop on beats 2-4 of bar 2 */}
        <div style={{ position: 'absolute', left: copyX, top: titleTop + 112 + titleSize * 1.12 + 20, display: 'flex', gap: 18 }}>
          {chips.map((c, i) => {
            const at = IMPACT + T.beats(2 + i);
            const k = prog(frame, at, 22, ease.backOut);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 24px',
                  borderRadius: 999,
                  border: `3px solid ${ink}`,
                  background: i === 0 ? p.lamp : dark ? shade(p.background, 0.08) : '#FFFBF2',
                  color: i === 0 ? '#2E2A24' : ink,
                  fontWeight: 700,
                  fontSize: 38,
                  boxShadow: `5px 6px 0 ${ink}`,
                  scale: String(k),
                  opacity: clamp(k * 2),
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ width: 14, height: 14, borderRadius: 99, background: i === 0 ? '#2E2A24' : p.accent }} />
                {c}
              </div>
            );
          })}
        </div>

        <WordsIn
          text={p.body}
          frame={frame}
          start={T.bars(2) + 6}
          stagger={3}
          style={{ position: 'absolute', left: copyX, top: titleTop + 112 + titleSize * 1.12 + 118, width: 860, fontSize: 44, lineHeight: 1.35 }}
        />

        <div style={{ position: 'absolute', left: copyX, top: titleTop + 112 + titleSize * 1.12 + 330 }}>
          <div
            style={{
              padding: '20px 38px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 40,
              color: '#FFF8EE',
              background: p.accent,
              border: `3px solid ${ink}`,
              boxShadow: `7px 8px 0 ${ink}`,
              whiteSpace: 'pre',
              transformOrigin: 'left center',
              scale: String(prog(frame, T.bars(2) + T.beats(2), 24, ease.backOut)),
              opacity: clamp(prog(frame, T.bars(2) + T.beats(2), 10)),
            }}
          >
            {p.cta}
          </div>
        </div>
      </AbsoluteFill>

      <FilmOverlay grain={0.05} vignette={dark ? 0.35 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
