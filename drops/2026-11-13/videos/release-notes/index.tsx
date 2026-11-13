import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Release Notes',
  category: 'tech',
  description:
    'Feature release film for a SaaS changelog: the version number shouts in, then the feature headline, a live spend-allocation panel that rebalances itself, a tip-up flag springing on the winning channel, three bullet points and a changelog CTA. Drop in a product screenshot to replace the panel.',
  tags: ['release notes', 'changelog', 'feature', 'saas', 'product update', '16:9'],
};

const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  product: text('Product').default('Pike'),
  version: text('Version').default('2.4'),
  eyebrow: text().default('Release notes · 18 Nov 2026'),
  kicker: text('Feature kicker').default('New: cross-platform'),
  title: text('Feature title').default('Pacing.'),
  bullet1: text('Bullet 1').default('Budget moves every hour across 32 platforms'),
  bullet2: text('Bullet 2').default('Tired creatives paused before CPA climbs'),
  bullet3: text('Bullet 3').default('Every move logged in plain English'),
  winner: text('Winning channel').default('TikTok'),
  lift: text('Lift chip').default('+38% ROAS'),
  agentNote: text('Agent log line').default('Moved $4,820 from Meta to TikTok · CPA −22%'),
  cta: text('CTA').default('Read the changelog'),
  url: text('URL').default('pike.ai/changelog'),
  screenshot: image('Product screenshot (optional)').default(''),
  background: color().default('#E9EEF1'),
  surface: color('Panel').default('#F6F8FA'),
  ink: color('Text').default('#17242E'),
  accent: color().default('#2F6F8F'),
  frost: color('Frost').default('#A7C4D4'),
  flag: color('Flag').default('#E4572E'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'polar-night': { background: '#0E1A22', surface: '#16262F', ink: '#E9EEF1', accent: '#A7C4D4', frost: '#2F6F8F', flag: '#E4572E' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', ink: '#EAF2FF', accent: '#FFFFFF', frost: '#7FB2FF', flag: '#FFDD00', version: '3.0', kicker: 'New: creative', title: 'Studio.', bullet1: 'Drafts 40 ad variants from one brief', bullet2: 'Sized for every placement automatically', bullet3: 'Brand-safe review before anything ships', winner: 'Meta', lift: '+24% CTR', agentNote: 'Shipped 12 new variants to Meta · CTR +24%' },
  'mid-century': { background: '#F4E9D8', surface: '#FBF4E8', ink: '#2E2A24', accent: '#2C7873', frost: '#E6D3B3', flag: '#D96C3D', version: '2.5', kicker: 'New: holiday', title: 'Guardrails.', winner: 'Google', lift: '−19% CPA', agentNote: 'Capped Black Friday bids on Google · CPA −19%' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Gentle snowfall: flakes fall with sway, wrap seamlessly. */
function Snow({ frame, W, H, color: c, count = 70 }: { frame: number; W: number; H: number; color: string; count?: number }) {
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: number) => rand(i * 9.13 + k * 3.7);
        const depth = 0.35 + r(1) * 0.65;
        const s = 2 + depth * 7;
        const y = ((r(2) * H + frame * (0.6 + depth * 1.6)) % (H + 40)) - 20;
        const x = r(3) * W + Math.sin(frame / (40 + r(4) * 40) + r(5) * 6) * 24 * depth;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: '50%', background: c, opacity: 0.25 + depth * 0.45, filter: depth > 0.8 ? 'blur(1.5px)' : undefined }} />;
      })}
    </AbsoluteFill>
  );
}

const ROWS = ['Meta', 'Google', '__winner__', 'YouTube', 'Reddit', 'LinkedIn'];
const FROM = [30, 24, 11, 14, 12, 9];
const TO = [21, 19, 31, 12, 10, 7];

export default function ReleaseNotes(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const end = video.durationInFrames;
  const dark = isDark(p.background);

  const B2 = T.bars(1); // layout enters
  const HIT = T.bars(2); // flag springs on the winner
  const CTA = T.bars(3);

  // ── Intro: the version shouts in, then shrinks away on the bar line ──
  const introIn = prog(frame, 10, 40, ease.out);
  const introOut = prog(frame, B2 - 22, 24, ease.in);
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));
  const outro = prog(frame, end - 32, 32, ease.in);

  // ── Layout ──
  const L = 130;
  const colW = 820;
  const titleSize = Math.min(190, colW / (Math.max(4, p.title.length) * 0.84));
  const panelX = 1040;
  const panelW = 760;
  const panelY = 190;
  const panelH = 700;
  const panelIn = prog(frame, B2 + 8, 46, ease.out);
  const flash = keys(frame, [HIT - 1, HIT + 3, HIT + 26], [0, 0.5, 0], [ease.out, ease.outSoft]);
  const shake = frame >= HIT && frame < HIT + 14 ? Math.sin(frame * 2.3) * (1 - (frame - HIT) / 14) * 5 : 0;

  const rebalance = prog(frame, B2 + 40, HIT - B2 - 30, ease.inOutSoft);
  const hasShot = !!p.screenshot;
  const winnerIdx = 2;
  const rowY0 = panelY + 140;
  const rowH = 78;
  const flagRot = keys(frame, [HIT - 2, HIT + 8, HIT + 16, HIT + 26], [-92, 14, -6, 0], [ease.out, ease.inOut, ease.outSoft]);
  const ring = prog(frame, HIT, 40, ease.out);

  const liftNum = p.lift.match(/\d+(\.\d+)?/);
  const liftText = liftNum ? p.lift.replace(liftNum[0], String(Math.round(Number(liftNum[0]) * prog(frame, HIT + 4, 50, ease.out)))) : p.lift;
  const liftPop = prog(frame, HIT + 4, 24, ease.backOut);

  const breathe = Math.sin(frame / 40) * 0.5 + 0.5;
  const logChars = Math.max(0, Math.floor((frame - HIT - 30) * 1.1));

  const tile = dark ? hexA('#ffffff', 0.06) : '#FFFFFF';

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.16, size: 40, y: -frame * 0.15, color: dark ? '255,255,255' : '23,36,46' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'}
        glows={[
          { x: 1420, y: 540, size: 1400, color: hexA(p.frost, dark ? 0.35 : 0.6), opacity: 0.8 + breathe * 0.2 },
          { x: 200, y: 950, size: 1100, color: hexA(p.accent, dark ? 0.2 : 0.14), opacity: 0.8 },
        ]}
        grain={0}
        vignette={dark ? 0.45 : 0.08}
      />
      <Snow frame={frame} W={W} H={H} color={dark ? '#ffffff' : p.frost} />

      <AbsoluteFill style={{ scale: String(push * (1 - outro * 0.03)), opacity: 1 - outro, translate: `${shake}px 0` }}>
        {/* ── Intro version ── */}
        {frame < B2 + 4 && (
          <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: 1 - introOut, scale: String(mix(1, 0.7, introOut)), filter: introOut > 0 ? `blur(${introOut * 14}px)` : undefined }}>
            <div style={{ fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 46, letterSpacing: '0.42em', textTransform: 'uppercase', color: p.ink, opacity: introIn, translate: `0 ${(1 - introIn) * 24}px`, marginBottom: 10 }}>
              {p.product} · release
            </div>
            <SweepReveal frame={frame} start={18} dur={36} style={{ ...displayFace('climate'), fontSize: 380, lineHeight: 1, letterSpacing: '-0.03em', color: p.accent, paddingBottom: 30 }}>
              {p.version}
            </SweepReveal>
            <div style={{ position: 'absolute', top: 800, display: 'flex', gap: 16, alignItems: 'center', opacity: prog(frame, 50, 24) }}>
              <Flag x={0} y={0} size={44} rot={keys(frame, [52, 64, 72, 80], [-92, 14, -6, 0], [ease.out, ease.inOut, ease.outSoft])} color={p.flag} ink={p.ink} inline />
              <span style={{ fontFamily: FONTS.spacemono, fontSize: 40, letterSpacing: '0.2em', textTransform: 'uppercase' }}>{p.eyebrow}</span>
            </div>
          </AbsoluteFill>
        )}

        {frame >= B2 - 4 && (
          <>
            {/* ── Left column: eyebrow, headline, bullets, CTA ── */}
            <div style={{ position: 'absolute', left: L, top: 150, width: colW, fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 28, letterSpacing: '0.2em', whiteSpace: 'nowrap', textTransform: 'uppercase', opacity: prog(frame, B2, 24), translate: `0 ${(1 - prog(frame, B2, 30)) * 20}px`, display: 'flex', alignItems: 'center', gap: 18 }}>
              <span style={{ padding: '8px 16px', background: p.ink, color: p.background, borderRadius: 6, letterSpacing: '0.12em' }}>v{p.version}</span>
              {p.eyebrow}
            </div>
            <div style={{ position: 'absolute', left: L, top: 222, width: colW, fontSize: 72, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
              <WordsIn text={p.kicker} frame={frame} start={B2 + 6} stagger={5} />
            </div>
            <SweepReveal frame={frame} start={B2 + 14} dur={34} style={{ position: 'absolute', left: L - 6, top: 300, width: colW + 200, ...displayFace('climate'), fontSize: titleSize, lineHeight: 1.05, letterSpacing: '-0.025em', textTransform: 'uppercase', color: p.accent, whiteSpace: 'nowrap', paddingBottom: 20 }}>
              {p.title}
            </SweepReveal>
            <Glint frame={frame} start={CTA + 40} dur={44} style={{ position: 'absolute', left: L - 6, top: 300, width: colW + 200, ...displayFace('climate'), fontSize: titleSize, lineHeight: 1.05, letterSpacing: '-0.025em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              {p.title}
            </Glint>

            <div style={{ position: 'absolute', left: L, top: 520, width: colW - 40, display: 'flex', flexDirection: 'column', gap: 26 }}>
              {[p.bullet1, p.bullet2, p.bullet3].filter(Boolean).map((b, i) => {
                const s = HIT + 20 + i * 22;
                const t = prog(frame, s, 26, ease.out);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 24, opacity: clamp(t * 1.4), translate: `${(1 - t) * -30}px 0`, filter: t < 1 ? `blur(${(1 - t) * 8}px)` : undefined }}>
                    <span style={{ flex: 'none', marginTop: 17, width: 16, height: 16, borderRadius: 3, background: i === 0 ? p.flag : p.accent, rotate: '45deg' }} />
                    <span style={{ fontSize: 44, lineHeight: 1.15, fontWeight: 500 }}>{b}</span>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            {(() => {
              const t = prog(frame, CTA, 26, ease.backOut);
              return (
                <div style={{ position: 'absolute', left: L, top: 848, display: 'flex', alignItems: 'center', gap: 22, opacity: clamp(t * 2), scale: String(mix(0.85, 1, t)), transformOrigin: 'left center' }}>
                  <span style={{ padding: '22px 38px', borderRadius: 10, background: p.ink, color: dark ? p.background : '#F4F7F9', fontSize: 44, fontWeight: 700, boxShadow: `8px 9px 0 ${p.flag}` }}>{p.cta} →</span>
                  <span style={{ fontFamily: FONTS.spacemono, fontSize: 32, letterSpacing: '0.02em', maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.url}</span>
                </div>
              );
            })()}

            {/* ── Right: the product panel ── */}
            <div
              style={{
                position: 'absolute',
                left: panelX,
                top: panelY,
                width: panelW,
                height: panelH,
                borderRadius: 26,
                background: p.surface,
                border: `3px solid ${p.ink}`,
                boxShadow: `14px 16px 0 ${p.ink}, 0 40px 90px ${hexA(p.ink, 0.18)}`,
                overflow: 'hidden',
                opacity: clamp(panelIn * 1.5),
                translate: `${(1 - panelIn) * 120}px ${Math.sin(frame / 50) * 4}px`,
                filter: panelIn < 1 ? `blur(${(1 - panelIn) * 14}px)` : undefined,
              }}
            >
              {/* header */}
              <div style={{ height: 96, display: 'flex', alignItems: 'center', gap: 16, padding: '0 34px', borderBottom: `2px solid ${hexA(p.ink, 0.12)}` }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: p.flag, opacity: 0.55 + breathe * 0.45, boxShadow: `0 0 ${10 + breathe * 10}px ${p.flag}` }} />
                <span style={{ fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 28, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Spend allocation</span>
                <span style={{ marginLeft: 'auto', fontFamily: FONTS.spacemono, fontSize: 24, opacity: 0.7 }}>LIVE · 32 PLATFORMS</span>
              </div>
              {hasShot ? (
                <Img src={p.screenshot} style={{ position: 'absolute', left: 0, top: 98, width: '100%', height: panelH - 98, objectFit: 'cover' }} />
              ) : (
                <>
                  {ROWS.map((r, i) => {
                    // the winner takes slot 3; a duplicate elsewhere becomes another platform
                    const name = r === '__winner__' ? p.winner : r.toLowerCase() === p.winner.trim().toLowerCase() ? 'Pinterest' : r;
                    // live: values keep breathing a little after the move
                    const v = mix(FROM[i], TO[i], rebalance) + Math.sin(frame / (26 + i * 7) + i) * 0.8 * prog(frame, HIT, 60);
                    const win = i === winnerIdx;
                    const lit = win ? prog(frame, HIT, 20, ease.out) : 0;
                    const ry = rowY0 - panelY + i * rowH - 30;
                    const rowIn = prog(frame, B2 + 20 + i * 5, 30, ease.out);
                    return (
                      <div key={i} style={{ position: 'absolute', left: 24, right: 24, top: ry, height: rowH - 12, borderRadius: 14, background: win ? hexA(p.flag, 0.1 * lit) : 'transparent', display: 'flex', alignItems: 'center', gap: 20, padding: '0 14px', opacity: rowIn, translate: `${(1 - rowIn) * 30}px 0` }}>
                        <span style={{ width: 46, height: 46, borderRadius: 12, background: tile, border: `2px solid ${hexA(p.ink, 0.2)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 24 }}>{name.slice(0, 1)}</span>
                        <span style={{ width: 170, fontSize: 34, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
                        <div style={{ flex: 1, height: 22, borderRadius: 11, background: hexA(p.frost, dark ? 0.35 : 0.5), overflow: 'hidden' }}>
                          <div style={{ width: `${(v / 34) * 100}%`, height: '100%', borderRadius: 11, background: win && lit > 0 ? p.flag : p.accent }} />
                        </div>
                        <span style={{ width: 96, textAlign: 'right', fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 30 }}>{v.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                  {/* agent log line */}
                  <div style={{ position: 'absolute', left: 34, right: 34, bottom: 34, padding: '18px 22px', borderRadius: 14, background: hexA(p.ink, dark ? 0.35 : 0.06), fontFamily: FONTS.spacemono, fontSize: 24, lineHeight: 1.3, opacity: frame > HIT + 24 ? 1 : 0, minHeight: 64 }}>
                    <span style={{ color: p.accent, fontWeight: 700 }}>AGENT › </span>
                    {p.agentNote.slice(0, logChars)}
                    <span style={{ opacity: Math.floor(frame / 15) % 2 ? 1 : 0 }}>▍</span>
                  </div>
                </>
              )}
            </div>

            {/* flag + ring on the winner (or the panel corner with a screenshot) */}
            {(() => {
              // The flag springs out of the panel's top-right corner, like a tip-up over its hole.
              const fx = panelX + panelW - 90;
              const fy = panelY + (Math.sin(frame / 50) * 4);
              const ring2 = prog(frame, T.bars(4), 40, ease.out);
              return (
                <>
                  <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }} width={1} height={1}>
                    <ellipse cx={fx} cy={fy} rx={mix(40, 220, ring)} ry={mix(16, 90, ring)} fill="none" stroke={p.flag} strokeWidth={mix(8, 1, ring)} opacity={frame >= HIT ? (1 - ring) * 0.9 : 0} />
                    <ellipse cx={fx} cy={fy} rx={mix(30, 140, ring)} ry={mix(12, 56, ring)} fill="none" stroke={p.accent} strokeWidth={mix(5, 1, ring)} opacity={frame >= HIT ? (1 - ring) * 0.6 : 0} />
                    <ellipse cx={fx} cy={fy} rx={mix(30, 150, ring2)} ry={mix(12, 60, ring2)} fill="none" stroke={p.flag} strokeWidth={mix(5, 1, ring2)} opacity={frame >= T.bars(4) ? (1 - ring2) * 0.7 : 0} />
                  </svg>
                  {frame >= HIT - 2 && <Flag x={fx} y={fy + 4} size={100} rot={flagRot + (frame > HIT + 26 ? Math.sin(frame / 22) * 3 : 0)} color={p.flag} ink={p.ink} />}
                  <div
                    style={{
                      position: 'absolute',
                      right: W - fx + 26,
                      top: panelY - 150,
                      padding: '16px 26px',
                      borderRadius: 12,
                      background: p.flag,
                      color: '#FFF8F2',
                      fontFamily: FONTS.spacemono,
                      fontWeight: 700,
                      fontSize: 40,
                      whiteSpace: 'nowrap',
                      boxShadow: `6px 7px 0 ${p.ink}`,
                      opacity: clamp(liftPop * 2),
                      scale: String(mix(0.6, 1, liftPop)),
                      transformOrigin: 'right bottom',
                    }}
                  >
                    {liftText}
                  </div>
                </>
              );
            })()}
          </>
        )}
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 78% 42%, ${hexA('#ffffff', flash)} 0%, transparent 55%)`, mixBlendMode: dark ? 'screen' : 'soft-light' }} />
      <FilmOverlay grain={0.045} vignette={dark ? 0.35 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}

/** The tip-up flag: staff pivots at its base (rot -90 = lying flat, 0 = sprung). */
function Flag({ x, y, size, rot, color: c, ink, inline }: { x: number; y: number; size: number; rot: number; color: string; ink: string; inline?: boolean }) {
  const s = size;
  const svg = (
    <svg width={s} height={s * 1.25} viewBox="0 0 40 50" style={{ overflow: 'visible', display: 'block' }}>
      <g transform={`rotate(${rot} 4 48)`}>
        <line x1="4" y1="48" x2="4" y2="3" stroke={ink} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M4 3 L37 12 L4 21 Z" fill={c} stroke={ink} strokeWidth="2.4" strokeLinejoin="round" />
      </g>
      <circle cx="4" cy="48" r="3.6" fill={ink} />
    </svg>
  );
  if (inline) return svg;
  return <div style={{ position: 'absolute', left: x - (4 / 40) * s, top: y - (48 / 40) * s, pointerEvents: 'none' }}>{svg}</div>;
}
