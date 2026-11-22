import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Dust, FilmOverlay, Glint, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Feature Drop',
  category: 'tech',
  description:
    'Changelog / feature-release film for a SaaS dashboard: a usage heatmap stamps in on the beat, the hot tile pops, a brutalist title slams in, three team stats count up and a CTA lands. Optional screenshot replaces the heatmap.',
  tags: ['tech', 'changelog', 'feature', 'release', 'saas', 'dashboard', 'heatmap'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30 f, bar = 120 f
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('New in Ambit 3.2'),
  title: text().default('Spend by model.'),
  subtitle: text().default('Every prompt, priced and tagged to a team.'),
  stat1Label: text('Stat 1 label').default('Engineering'),
  stat1: text('Stat 1 value').default('$8,910'),
  stat2Label: text('Stat 2 label').default('Support'),
  stat2: text('Stat 2 value').default('$4,120'),
  stat3Label: text('Stat 3 label').default('Marketing'),
  stat3: text('Stat 3 value').default('$2,380'),
  callout: text('Hot tile label').default('Eng · Tue · $1,240'),
  cta: text('Call to action').default('Live today · ambit.so/changelog'),
  screenshot: image('Screenshot (optional)').default(''),
  font: font('Title font').default('archivo'),
  background: color().default('#E9E3F5'),
  surface: color('Panel').default('#D6CCEC'),
  ink: color('Ink').default('#231942'),
  accent: color().default('#5E4AE3'),
  hot: color('Hot tile').default('#F49CBB'),
  pop: color('Live dot').default('#2EC4B6'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  acid: { background: '#0B0B0B', surface: '#1A1A1A', ink: '#F0FFE0', accent: '#C6FF00', hot: '#FF00E5', pop: '#00F0FF' },
  swiss: { background: '#F5F5F0', surface: '#E6E6E1', ink: '#0A0A0A', accent: '#E3000F', hot: '#E3000F', pop: '#0A0A0A', font: 'anton', title: 'Seat audit.', eyebrow: 'Ambit 3.3 · Shipping now', subtitle: 'Find idle AI seats and reclaim them in one click.', stat1Label: 'Idle seats', stat1: '41', stat2Label: 'Saved / mo', stat2: '$1,230', stat3Label: 'Teams', stat3: '12' },
  frost: { background: '#E9EEF1', surface: '#D3DDE3', ink: '#17242E', accent: '#2F6F8F', hot: '#E4572E', pop: '#2F6F8F', font: 'shoulders' },
};

type P = z.infer<typeof schema>;

const ROWS = 6;
const COLS = 12;
const HOT_R = 1;
const HOT_C = 8;
const TEAMS = ['ENG', 'SUP', 'SALES', 'MKTG', 'OPS', 'DATA'];

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};
function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) + ((((pb >> s) & 255) - ((pa >> s) & 255)) * t));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

/** Counts the numeric part of a value ("$8,910" → "$4,455" halfway), keeping prefix/suffix. */
function countUp(value: string, t: number) {
  const m = value.match(/^([^\d]*)([\d,]+(?:\.\d+)?)(.*)$/);
  if (!m) return value;
  const n = parseFloat(m[2].replace(/,/g, ''));
  const dec = m[2].includes('.') ? m[2].split('.')[1].length : 0;
  const v = n * t;
  const s = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US');
  return `${m[1]}${s}${m[3]}`;
}

export default function FeatureDrop(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;
  const dark = isDark(p.background);

  const HIT = T.bars(1); // bar 2 downbeat: hot tile pops, title slams
  const STATS = T.bars(2);
  const CTA = T.bars(3);

  // Panel: centred and big during bar 1, then slides right as the title arrives.
  // The panel clears the left half on beat 4, so the title has room on the downbeat.
  const move = prog(frame, HIT - 30, 28, ease.inOut);
  const panelW = mix(1180, 820, move);
  const panelH = mix(680, 500, move);
  const panelX = mix((W - 1180) / 2, W - 820 - 110, move);
  const panelY = mix((H - 680) / 2 + 40, 250, move);
  const shake = frame >= HIT && frame < HIT + 18 ? Math.sin(frame * 2.3) * (1 - (frame - HIT) / 18) * 10 : 0;
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));
  const outro = prog(frame, end - 30, 30, ease.inOut);
  const flash = keys(frame, [HIT - 1, HIT + 2, HIT + 24], [0, 1, 0], [ease.out, ease.outSoft]);

  const pad = 40;
  const labelW = 96;
  const head = 92;
  const gap = 10;
  const tile = Math.min((panelW - pad * 2 - labelW - gap * (COLS - 1)) / COLS, (panelH - pad * 2 - head - gap * (ROWS - 1)) / ROWS);
  const gx = panelX + pad + labelW;
  const gy = panelY + pad + head;
  const ramp = (lv: number) => mixHex(mixHex(p.surface, p.background, dark ? 0.25 : 0.5), p.accent, lv);

  const titleSize = p.title.length > 16 ? 120 : 150;
  const slam = prog(frame, HIT, 16, ease.out);
  const mono: CSSProperties = { fontFamily: FONTS.spacemono, color: p.ink };
  const border = 5;
  const sh = 14;
  const stats = [
    [p.stat1Label, p.stat1],
    [p.stat2Label, p.stat2],
    [p.stat3Label, p.stat3],
  ];

  return (
    <AbsoluteFill style={{ background: p.background, color: p.ink, overflow: 'hidden' }}>
      {/* depth: drifting dot grid, two soft blooms */}
      <AbsoluteFill style={{ backgroundImage: `radial-gradient(circle, ${hexA(p.ink, dark ? 0.2 : 0.14)} 1.4px, transparent 2px)`, backgroundSize: '36px 36px', backgroundPosition: `0px ${-frame * 0.25}px` }} />
      <div style={{ position: 'absolute', left: -300, top: 420, width: 1300, height: 1300, borderRadius: '50%', background: `radial-gradient(circle, ${hexA(p.hot, 0.4)} 0%, transparent 62%)`, opacity: 0.8 + Math.sin(frame / 40) * 0.2 }} />
      <div style={{ position: 'absolute', left: 1000, top: -700, width: 1400, height: 1400, borderRadius: '50%', background: `radial-gradient(circle, ${hexA(p.accent, dark ? 0.35 : 0.25)} 0%, transparent 62%)` }} />
      <Dust frame={frame} width={W} height={H} count={40} color={p.accent} seed={4} opacity={dark ? 0.5 : 0.35} speed={0.7} />

      <AbsoluteFill style={{ scale: String(push), translate: `${shake}px ${shake * 0.4}px`, opacity: 1 - outro }}>
        {/* eyebrow: top-left, from the first beat */}
        <div style={{ ...mono, position: 'absolute', left: 110, top: 96, display: 'flex', alignItems: 'center', gap: 16, fontSize: 30, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: prog(frame, 6, 20), translate: `${mix(-30, 0, prog(frame, 6, 30))}px 0` }}>
          <span style={{ width: 22, height: 22, background: p.hot, border: `3px solid ${p.ink}`, borderRadius: 4 }} />
          {p.eyebrow}
        </div>

        {/* panel shadow + card */}
        <div style={{ position: 'absolute', left: panelX + sh, top: panelY + sh, width: panelW, height: panelH, background: p.ink, borderRadius: 22, opacity: prog(frame, 0, 14) }} />
        <div style={{ position: 'absolute', left: panelX, top: panelY, width: panelW, height: panelH, background: p.surface, border: `${border}px solid ${p.ink}`, borderRadius: 22, boxSizing: 'border-box', opacity: prog(frame, 0, 14) }} />
        <div style={{ ...mono, position: 'absolute', left: panelX + pad, top: panelY + pad - 4, width: panelW - pad * 2, display: 'flex', justifyContent: 'space-between', fontSize: 26, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: prog(frame, 8, 20) }}>
          <span>AI spend · this week</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 16, height: 16, borderRadius: '50%', background: p.pop, boxShadow: `0 0 0 ${4 + 3 * Math.sin(frame / 8)}px ${hexA(p.pop, 0.3)}` }} />
            Live
          </span>
        </div>

        {p.screenshot ? (
          <Img
            src={p.screenshot}
            style={{
              position: 'absolute',
              left: panelX + pad,
              top: panelY + pad + 50,
              width: panelW - pad * 2,
              height: panelH - pad * 2 - 50,
              objectFit: 'cover',
              objectPosition: 'top left',
              borderRadius: 10,
              border: `3px solid ${p.ink}`,
              boxSizing: 'border-box',
              clipPath: `inset(0 ${100 - prog(frame, 12, 50, ease.inOut) * 100}% 0 0)`,
            }}
          />
        ) : (
          <>
            {TEAMS.map((t, r) => (
              <div key={t} style={{ ...mono, position: 'absolute', left: panelX + pad, top: gy + r * (tile + gap), height: tile, display: 'flex', alignItems: 'center', fontSize: 22, letterSpacing: '0.06em', opacity: prog(frame, 10 + r * 4, 20) }}>
                {t}
              </div>
            ))}
            {Array.from({ length: ROWS * COLS }, (_, i) => {
              const r = Math.floor(i / COLS);
              const c = i % COLS;
              const hot = r === HOT_R && c === HOT_C;
              // Diagonal stamp wave: each diagonal band lands on an eighth-note step of bar 1.
              const at = 8 + Math.floor((r + c) / 2) * (T.beat / 4) + rand(i) * 4;
              const s = prog(frame, at, 14, ease.backOut);
              const lv = Math.round(clamp(rand(i * 2.3 + 1) * 0.85 + (c > 6 ? 0.15 : 0) - r * 0.04) * 4) / 4;
              const pop = hot ? keys(frame, [HIT - 4, HIT + 4, HIT + 22], [1, 1.45, 1.12], [ease.out, ease.inOutSoft]) : 1;
              const isHot = hot && frame >= HIT - 4;
              const wave = Math.max(0, Math.sin((frame - HIT - (r + c) * 3) / 14)) * clamp((frame - HIT - 30) / 30) * 0.14;
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: gx + c * (tile + gap),
                    top: gy + r * (tile + gap),
                    width: tile,
                    height: tile,
                    borderRadius: tile * 0.18,
                    background: isHot ? p.hot : ramp(clamp(lv + wave)),
                    border: isHot ? `4px solid ${p.ink}` : undefined,
                    boxShadow: isHot ? `5px 5px 0 ${p.ink}` : undefined,
                    boxSizing: 'border-box',
                    scale: String(s * pop),
                    opacity: clamp(s * 2),
                    zIndex: isHot ? 3 : undefined,
                  }}
                />
              );
            })}
            {/* shockwave square + callout from the hot tile */}
            {frame >= HIT && (
              <div
                style={{
                  position: 'absolute',
                  left: gx + HOT_C * (tile + gap) + tile / 2,
                  top: gy + HOT_R * (tile + gap) + tile / 2,
                  width: tile * mix(1.6, 5, prog(frame, HIT, 36)),
                  height: tile * mix(1.6, 5, prog(frame, HIT, 36)),
                  translate: '-50% -50%',
                  border: `4px solid ${p.ink}`,
                  borderRadius: tile * 0.4,
                  opacity: 1 - prog(frame, HIT, 36),
                }}
              />
            )}
            {p.callout && (
              <div
                style={{
                  ...mono,
                  position: 'absolute',
                  right: W - (gx + HOT_C * (tile + gap) + tile + 8),
                  top: gy + HOT_R * (tile + gap) - 66,
                  fontSize: 24,
                  fontWeight: 700,
                  padding: '8px 16px',
                  background: p.background,
                  border: `3px solid ${p.ink}`,
                  borderRadius: 10,
                  boxShadow: `5px 5px 0 ${p.ink}`,
                  whiteSpace: 'nowrap',
                  zIndex: 4,
                  scale: String(prog(frame, HIT + 8, 20, ease.backOut)),
                  transformOrigin: 'bottom right',
                }}
              >
                {p.callout}
              </div>
            )}
          </>
        )}

        {/* title slab: slams in on the bar-2 downbeat */}
        {frame >= HIT && (
          <div style={{ position: 'absolute', left: 110, top: 250, width: 820 }}>
            <div
              style={{
                ...displayFace(p.font),
                fontSize: titleSize,
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
                textTransform: 'uppercase',
                color: p.ink,
                scale: String(mix(1.35, 1, slam)),
                opacity: clamp(slam * 3),
                filter: slam < 1 ? `blur(${(1 - slam) * 10}px)` : undefined,
                transformOrigin: 'left top',
                textShadow: `${mix(0, 8, slam)}px ${mix(0, 8, slam)}px 0 ${p.accent}`,
                position: 'relative',
              }}
            >
              {p.title}
              <Glint frame={frame} start={CTA + T.beat} dur={44} style={{ position: 'absolute', inset: 0 }}>
                {p.title}
              </Glint>
            </div>
            <div style={{ ...mono, fontSize: 40, lineHeight: 1.3, marginTop: 28, maxWidth: 800, opacity: prog(frame, HIT + 20, 24), translate: `0 ${mix(20, 0, prog(frame, HIT + 20, 30))}px` }}>{p.subtitle}</div>
          </div>
        )}

        {/* stat slabs drop in on the beats of bar 3 */}
        <div style={{ position: 'absolute', left: 110, top: 690, display: 'flex', gap: 26 }}>
          {stats.map(([label, value], i) => {
            const at = STATS + i * T.beat;
            const d = prog(frame, at, 18, ease.backOut);
            const count = prog(frame, at, 40, ease.out);
            if (frame < at - 2) return null;
            return (
              <div
                key={i}
                style={{
                  ...mono,
                  width: 262,
                  padding: '16px 20px',
                  background: i === 0 ? p.accent : p.surface,
                  color: i === 0 && isDark(p.accent) ? '#F7F5FB' : p.ink,
                  border: `4px solid ${p.ink}`,
                  borderRadius: 14,
                  boxShadow: `8px 8px 0 ${p.ink}`,
                  translate: `0 ${mix(-60, 0, d)}px`,
                  opacity: clamp(d * 2),
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ fontSize: 24, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden' }}>{label}</div>
                <div style={{ ...displayFace(p.font), fontSize: value.length > 6 ? 50 : 58, lineHeight: 1.05, letterSpacing: '-0.03em', marginTop: 6, whiteSpace: 'nowrap' }}>{countUp(value, count)}</div>
              </div>
            );
          })}
        </div>

        {/* CTA pill, bottom-right, lands on bar 4 */}
        <div style={{ position: 'absolute', right: 110 + sh, top: 900, display: 'flex' }}>
          <div
            style={{
              ...mono,
              fontSize: 40,
              fontWeight: 700,
              padding: '20px 36px',
              background: p.ink,
              color: p.background,
              borderRadius: 14,
              boxShadow: `8px 8px 0 ${p.hot}`,
              whiteSpace: 'nowrap',
              scale: String(prog(frame, CTA, 24, ease.backOut)),
              opacity: clamp(prog(frame, CTA, 8)),
              transformOrigin: 'right center',
            }}
          >
            {p.cta} →
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at ${((gx + HOT_C * (tile + gap)) / W) * 100}% ${((gy + HOT_R * (tile + gap)) / H) * 100}%, ${hexA(p.hot, flash * 0.7)} 0%, transparent 45%)`, mixBlendMode: dark ? 'screen' : 'multiply' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.45 : 0.15} frame={frame} />
    </AbsoluteFill>
  );
}
