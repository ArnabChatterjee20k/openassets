import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, num, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, Streaks, SweepReveal, WordsIn, bezierPoint, clamp, displayFace, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Platform Announcement',
  category: 'announcement',
  description: 'Feature announcement: a CRT terminal boots and types one command; on Enter, glowing threads branch out to every ad platform as a counter rolls up, then the headline sweeps in with a CTA.',
  tags: ['announcement', 'ai', 'ads', 'terminal', 'saas', 'integrations'],
};

// 60 fps on a 120 BPM grid: 1 beat = 30 frames, 1 bar = 120.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  eyebrow: text().default('Mycel 2.0 · Announcement'),
  prompt: text('Typed command').default('mycel launch --everywhere'),
  count: num(2, 99, 1, 'Platform count').default(32),
  countLabel: text('Counter label').default('platforms live'),
  platforms: text('Platforms (comma separated, 8 shown)').default('Meta Ads, Google Ads, TikTok, Reddit, LinkedIn, YouTube, Snapchat, Pinterest'),
  title: text().default('NOW ON 32 PLATFORMS'),
  subtitle: text().default('One prompt plans, launches and rebalances every campaign.'),
  cta: text('Call to action').default('Try it free  →  mycel.ai'),
  font: font('Display font').default('vt323'),
  background: color().default('#0E1A14'),
  surface: color('Terminal').default('#18291F'),
  accent: color().default('#B5E550'),
  accent2: color('Threads').default('#4E8A5B'),
  pop: color('Live dot').default('#FF9F43'),
  textColor: color('Text').default('#EAF2DC'),
  screenshot: image('Product screenshot (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'deep-sea': { background: '#021B26', surface: '#06303F', accent: '#2EF2C4', accent2: '#1B7FA6', pop: '#FF7A59', textColor: '#E6FFFA' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', accent: '#FFFFFF', accent2: '#7FB2FF', pop: '#FFDD00', textColor: '#EAF2FF', font: 'pressstart', title: 'NOW ON 32' },
  'ctv-launch': { eyebrow: 'New channel · CTV', prompt: 'mycel add --channel ctv', count: 6, countLabel: 'TV networks', platforms: 'Roku, Hulu, Peacock, Tubi, Pluto TV, Samsung TV+', title: 'ADS ON TV, BY PROMPT', subtitle: 'Your agent now buys streaming TV inventory too.', cta: 'Join the beta  →  mycel.ai/ctv' },
};

type P = z.infer<typeof schema>;

const IMPACT = T.bars(1); // Enter key
const TITLE = T.bars(2);
const END = video.durationInFrames;

export default function PlatformAnnouncement(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const cx = W / 2;
  const cy = H / 2 + 20;
  const hasShot = !!p.screenshot;

  const names = p.platforms.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 8);
  // Bar 1: power-on → terminal → typing
  const power = prog(frame, 4, 18, ease.out);
  const open = prog(frame, 18, 22, ease.out);
  const typedN = Math.floor(clamp((frame - 34) / (IMPACT - 14 - 34)) * p.prompt.length);
  const typedText = p.prompt.slice(0, typedN);
  const cursorOn = Math.floor(frame / 15) % 2 === 0 || (frame > 34 && frame < IMPACT - 14);
  // Bar 2: Enter → terminal morphs into the hub node, threads branch out
  const flash = keys(frame, [IMPACT - 2, IMPACT + 2, IMPACT + 26], [0, 1, 0], [ease.out, ease.outSoft]);
  const morph = prog(frame, IMPACT + 6, 30, ease.inOut);
  const termW = mix(mix(40, 1180, power), 420, morph);
  const termH = mix(mix(4, 300, open), 250, morph);
  const counter = Math.round(p.count * prog(frame, IMPACT + 14, T.beats(3), ease.out));
  // Bar 3: network recedes, title takes over
  const recede = prog(frame, TITLE - 6, 36, ease.inOut);
  const netScale = mix(1, hasShot ? 0.7 : 0.82, recede);
  const netOpacity = mix(1, hasShot ? 0.18 : 0.24, recede);
  const netBlur = recede * 7;
  const netX = hasShot ? mix(0, W * 0.2, recede) : 0;
  const push = mix(1, 1.05, prog(frame, 0, END, ease.inOutSoft));
  const outro = prog(frame, END - 36, 36, ease.in);

  const chipW = 370;
  const chipH = 74;
  const colX = 640;
  const ys = [-300, -100, 100, 300];
  const chips = names.map((n, i) => {
    const side = i % 2 ? 1 : -1;
    const row = Math.floor(i / 2);
    return { n, x: cx + side * colX, y: cy + ys[row], side, at: IMPACT + 16 + i * (T.beat / 2) };
  });

  const titleSize = p.font === 'pressstart' ? 92 : p.title.length > 18 ? 168 : 196;
  const titleTop = cy - titleSize * (hasShot ? 1.1 : 0.75);
  const titleBlock = {
    position: 'absolute' as const,
    left: hasShot ? 140 : 0,
    width: hasShot ? W * 0.52 : W,
    top: titleTop,
    textAlign: (hasShot ? 'left' : 'center') as 'left' | 'center',
    ...displayFace(p.font),
    fontSize: titleSize,
    lineHeight: 0.9,
    letterSpacing: p.font === 'vt323' ? '0.01em' : '0',
  };

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor, fontFamily: FONTS.mono }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: 0.07, size: 44, y: -frame * 0.15, color: '181,229,80' }}
        lift={hexA(p.accent, 0.05)}
        glows={[
          { x: cx, y: cy, size: mix(800, 1700, prog(frame, IMPACT, 60)), color: hexA(p.accent, 0.22), opacity: 0.6 + 0.2 * Math.sin(frame / 40) },
          { x: cx - 620, y: cy - 260, size: 1100, color: hexA(p.accent2, 0.4), opacity: 0.6 },
          { x: cx + 640, y: cy + 280, size: 1000, color: hexA(p.accent2, 0.3), opacity: prog(frame, IMPACT, 60) * 0.8 },
        ]}
        grain={0}
        vignette={0.55}
      />

      <AbsoluteFill style={{ scale: String(push * mix(1, 0.97, outro)), opacity: 1 - outro }}>
        <Dust frame={frame} width={W} height={H} count={60} color={p.accent} seed={9} speed={0.8} opacity={0.4} maxSize={5} />

        {/* Eyebrow, top-left, from the start */}
        <div style={{ position: 'absolute', left: 110, top: 96, display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONTS.silkscreen, fontSize: 30, letterSpacing: '0.28em', textTransform: 'uppercase', color: p.accent, opacity: prog(frame, 10, 24) }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', background: p.pop, boxShadow: `0 0 18px ${p.pop}`, opacity: 0.6 + 0.4 * Math.sin(frame / 8) }} />
          {p.eyebrow}
        </div>

        {/* ── Network (bar 2), recedes behind the title in bar 3 ── */}
        <AbsoluteFill style={{ scale: String(netScale), translate: `${netX}px 0`, opacity: netOpacity, filter: netBlur > 0.2 ? `blur(${netBlur}px)` : undefined }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {chips.map((c, i) => {
              const sx = cx + c.side * (termW / 2);
              const ex = c.x - c.side * (chipW / 2);
              const p0: [number, number] = [sx, cy];
              const p1: [number, number] = [sx + (ex - sx) * 0.55, cy];
              const p2: [number, number] = [sx + (ex - sx) * 0.45, c.y];
              const p3: [number, number] = [ex, c.y];
              const d = `M${p0[0]},${p0[1]} C${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}`;
              const draw = prog(frame, c.at - 14, 20, ease.out);
              const pk = ((frame - c.at) / 50 + i * 0.13) % 1;
              const [px, py] = bezierPoint(pk, p0, p1, p2, p3);
              return (
                <g key={i} opacity={frame >= c.at - 14 ? 1 : 0}>
                  <path d={d} stroke={p.accent} strokeOpacity={0.2} strokeWidth={14} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
                  <path d={d} stroke={p.accent2} strokeWidth={5} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} strokeLinecap="round" />
                  <path d={d} stroke={p.accent} strokeWidth={2.4} fill="none" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} strokeLinecap="round" />
                  {draw >= 1 && <circle cx={px} cy={py} r={7} fill={p.accent} style={{ filter: `drop-shadow(0 0 8px ${p.accent})` }} />}
                </g>
              );
            })}
          </svg>

          {/* chips pop on half-beats */}
          {chips.map((c, i) => {
            const s = prog(frame, c.at, 22, ease.backOut);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: c.x - chipW / 2,
                  top: c.y - chipH / 2,
                  width: chipW,
                  height: chipH,
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '0 24px',
                  borderRadius: 12,
                  background: hexA(p.surface, 0.95),
                  border: `2px solid ${hexA(p.accent, 0.4)}`,
                  boxShadow: `0 18px 40px rgba(0,0,0,0.4), 0 0 30px ${hexA(p.accent, 0.12 + 0.3 * keys(frame, [c.at, c.at + 4, c.at + 30], [0, 1, 0]))}`,
                  fontSize: 34,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  scale: String(Math.max(0.001, s)),
                  opacity: clamp(s * 2),
                }}
              >
                <span style={{ flex: 'none', width: 16, height: 16, borderRadius: 3, background: i === 2 ? p.pop : p.accent, boxShadow: `0 0 14px ${i === 2 ? p.pop : p.accent}` }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.n}</span>
                <span style={{ marginLeft: 'auto', fontFamily: FONTS.silkscreen, fontSize: 18, color: p.accent, letterSpacing: '0.12em' }}>LIVE</span>
              </div>
            );
          })}

          {/* the terminal, which becomes the hub */}
          <div
            style={{
              position: 'absolute',
              left: cx - termW / 2,
              top: cy - termH / 2,
              width: termW,
              height: termH,
              borderRadius: mix(6, 22, open),
              background: p.surface,
              border: `2px solid ${hexA(p.accent, 0.45)}`,
              boxShadow: `0 40px 90px rgba(0,0,0,0.5), 0 0 ${60 + flash * 120}px ${hexA(p.accent, 0.2 + flash * 0.4)}`,
              overflow: 'hidden',
              opacity: power,
            }}
          >
            {/* terminal content (fades as it morphs) */}
            <div style={{ position: 'absolute', inset: 0, opacity: (1 - morph) * open }}>
              <div style={{ height: 64, display: 'flex', alignItems: 'center', gap: 14, padding: '0 28px', borderBottom: `2px solid ${hexA(p.accent, 0.2)}` }}>
                {[p.pop, hexA(p.textColor, 0.3), hexA(p.textColor, 0.3)].map((c, i) => (
                  <span key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: c }} />
                ))}
                <span style={{ fontFamily: FONTS.silkscreen, fontSize: 22, letterSpacing: '0.22em', color: hexA(p.textColor, 0.55), marginLeft: 16 }}>MYCEL — AGENT</span>
              </div>
              <div style={{ padding: '44px 48px', fontSize: 58, lineHeight: 1.3, whiteSpace: 'nowrap', textShadow: `0 0 24px ${hexA(p.accent, 0.4)}` }}>
                <div>
                  <span style={{ color: p.accent }}>{'> '}</span>
                  {typedText}
                  <span style={{ display: 'inline-block', width: 30, height: 58, marginLeft: 6, verticalAlign: '-8px', background: p.accent, opacity: cursorOn ? 1 : 0, boxShadow: `0 0 20px ${p.accent}` }} />
                </div>
                <div style={{ fontSize: 40, color: p.accent, opacity: prog(frame, IMPACT + 2, 8) }}>✓ connecting {p.count} platforms…</div>
              </div>
            </div>
            {/* hub content: the counter */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: prog(frame, IMPACT + 22, 16) * (1 - prog(frame, TITLE - 8, 16)) }}>
              <div style={{ ...displayFace('vt323'), fontSize: 150, lineHeight: 0.85, color: p.accent, textShadow: `0 0 40px ${hexA(p.accent, 0.6)}` }}>{String(counter).padStart(2, '0')}</div>
              <div style={{ fontFamily: FONTS.silkscreen, fontSize: 26, letterSpacing: '0.26em', textTransform: 'uppercase', marginTop: 10 }}>{p.countLabel}</div>
            </div>
            {/* scanlines */}
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, transparent 2px, transparent 5px)', translate: `0 ${(frame * 0.6) % 5}px` }} />
          </div>
        </AbsoluteFill>

        {/* Impact light */}
        <Streaks frame={frame} start={IMPACT} dur={44} direction="out" count={150} width={W} height={H} cx={cx} cy={cy} seed={4} intensity={0.9} color={p.accent} highlight="#ffffff" />
        <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
          <ellipse cx={cx} cy={cy} rx={640 + prog(frame, IMPACT, 50) * 700} ry={260 + prog(frame, IMPACT, 50) * 450} fill="none" stroke={p.accent} strokeWidth={mix(8, 1, prog(frame, IMPACT, 50))} opacity={frame >= IMPACT ? (1 - prog(frame, IMPACT, 50)) * 0.7 : 0} />
        </svg>

        {/* ── Bar 3: title + subtitle + CTA ── */}
        {frame >= TITLE - 4 && (
          <>
            <SweepReveal frame={frame} start={TITLE} dur={34} style={titleBlock}>
              <span style={{ color: p.textColor, textShadow: `0 0 50px ${hexA(p.accent, 0.45)}` }}>
                {p.title.split(/(\d+)/).map((part, i) => (i % 2 ? <span key={i} style={{ color: p.accent }}>{part}</span> : part))}
              </span>
            </SweepReveal>
            <Glint frame={frame} start={T.bars(3)} dur={44} style={titleBlock}>
              {p.title}
            </Glint>
            <WordsIn
              text={p.subtitle}
              frame={frame}
              start={TITLE + 24}
              stagger={4}
              style={{
                position: 'absolute',
                left: hasShot ? 140 : W * 0.06,
                width: hasShot ? W * 0.48 : W * 0.88,
                top: titleTop + titleSize * (hasShot ? 2.05 : 1.12),
                justifyContent: hasShot ? 'flex-start' : 'center',
                fontSize: 46,
                lineHeight: 1.35,
                opacity: 0.9,
              }}
            />
            <div style={{ position: 'absolute', left: hasShot ? 140 : 0, width: hasShot ? undefined : W, top: titleTop + titleSize * (hasShot ? 2.05 : 1.12) + (hasShot ? 200 : 140), display: 'flex', justifyContent: hasShot ? 'flex-start' : 'center' }}>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontWeight: 700,
                  fontSize: 40,
                  padding: '22px 40px',
                  borderRadius: 10,
                  color: p.background,
                  background: p.accent,
                  boxShadow: `8px 8px 0 ${p.accent2}, 0 0 60px ${hexA(p.accent, 0.35)}`,
                  whiteSpace: 'pre',
                  scale: String(Math.max(0.001, prog(frame, TITLE + T.beats(3), 24, ease.backOut))),
                  opacity: clamp(prog(frame, TITLE + T.beats(3), 8)),
                }}
              >
                {p.cta}
              </div>
            </div>
          </>
        )}

        {/* Optional screenshot: framed like a terminal window, floats in on the right in bar 3 */}
        {hasShot && (
          <div
            style={{
              position: 'absolute',
              right: 120,
              top: cy - 270,
              width: 720,
              height: 480,
              borderRadius: 18,
              overflow: 'hidden',
              border: `2px solid ${hexA(p.accent, 0.5)}`,
              background: p.surface,
              boxShadow: `0 40px 100px rgba(0,0,0,0.55), 0 0 60px ${hexA(p.accent, 0.18)}`,
              opacity: prog(frame, TITLE + 10, 24),
              translate: `${mix(80, 0, prog(frame, TITLE + 10, 40))}px ${Math.sin(frame / 40) * 6}px`,
              rotate: `${mix(4, -2, prog(frame, TITLE + 10, 60))}deg`,
            }}
          >
            <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', borderBottom: `2px solid ${hexA(p.accent, 0.2)}` }}>
              {[p.pop, hexA(p.textColor, 0.3), hexA(p.textColor, 0.3)].map((c, i) => (
                <span key={i} style={{ width: 13, height: 13, borderRadius: '50%', background: c }} />
              ))}
            </div>
            <Img src={p.screenshot} style={{ width: '100%', height: 436, objectFit: 'cover' }} />
          </div>
        )}
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 50%, ${hexA('#ffffff', flash * 0.8)} 0%, ${hexA(p.accent, flash * 0.5)} 25%, transparent 60%)`, mixBlendMode: 'screen' }} />
      <FilmOverlay grain={0.06} vignette={0.45} frame={frame} />
    </AbsoluteFill>
  );
}
