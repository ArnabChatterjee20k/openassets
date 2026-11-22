import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { FilmOverlay, Glint, SweepReveal, clamp, displayFace, ease, hexA, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Meet Folio',
  category: 'intro',
  description:
    'Product intro film on a Swiss grid: a single red square unfolds into a 32-platform ticker table, hops from platform to platform on the beat, then the grid slides aside for "Meet Folio.", three feature lines, an optional product screenshot and a CTA.',
  tags: ['intro', 'product', 'ad agent', 'swiss', 'grid', 'saas'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat 30f, bar 120f
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  eyebrow: text().default('Your ad agent for 32 platforms'),
  title: text('Title').default('Meet'),
  brand: text('Brand (accent, italic)').default('Folio.'),
  feature1: text('Feature 1').default('Plans.'),
  feature1Note: text('Feature 1 note').default('One budget, split across every channel'),
  feature2: text('Feature 2').default('Launches.'),
  feature2Note: text('Feature 2 note').default('Ads written and sized for each platform'),
  feature3: text('Feature 3').default('Rebalances.'),
  feature3Note: text('Feature 3 note').default('Spend moves to what works, every hour'),
  cta: text('Call to action').default('Start free at folio.ai'),
  tag: text('Tag').default('14-day trial · No card needed'),
  screenshot: image('Product screenshot (optional)').default(''),
  font: font('Display font').default('instrument'),
  background: color().default('#F5F5F0'),
  surface: color('Cells').default('#E6E6E1'),
  ink: color('Ink').default('#0A0A0A'),
  accent: color('Agent red').default('#E3000F'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-edition': { background: '#0D0D0F', surface: '#1C1C20', ink: '#F3EDE2', accent: '#C9A45C' },
  frost: { background: '#E9EEF1', surface: '#D3DDE3', ink: '#17242E', accent: '#E4572E', font: 'gloock' },
  agency: { eyebrow: 'For agencies running 40+ clients', feature1: 'Reports.', feature1Note: 'Client-ready recaps in plain English', cta: 'Book a demo · folio.ai/agency', tag: 'White-label included' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', ink: '#EAF2FF', accent: '#FFDD00' },
};

type P = z.infer<typeof schema>;

const W = 1920;
const H = 1080;
const COLS = 8;
const ROWS = 4;
const CW = 180;
const CH = 150;
const GW = COLS * CW;
const GH = ROWS * CH;

const PLATFORMS: [string, string][] = [
  ['GGL', 'Google'], ['MTA', 'Meta'], ['TTK', 'TikTok'], ['LKD', 'LinkedIn'], ['AMZ', 'Amazon'], ['RDT', 'Reddit'], ['PIN', 'Pinterest'], ['SNP', 'Snapchat'],
  ['XAD', 'X Ads'], ['MSA', 'Microsoft'], ['YTB', 'YouTube'], ['ASA', 'Apple Search'], ['SPT', 'Spotify'], ['TTD', 'Trade Desk'], ['ROK', 'Roku'], ['CTV', 'Connected TV'],
  ['QRA', 'Quora'], ['TBL', 'Taboola'], ['OUT', 'Outbrain'], ['CRT', 'Criteo'], ['DV3', 'DV360'], ['NFX', 'Netflix'], ['HLU', 'Hulu'], ['TWC', 'Twitch'],
  ['UBR', 'Uber'], ['ISC', 'Instacart'], ['WMT', 'Walmart'], ['APL', 'AppLovin'], ['UNT', 'Unity'], ['DSC', 'Discord'], ['KRG', 'Kroger'], ['ETS', 'Etsy'],
];
// Cells the agent visits, one per beat from bar 2 onward.
const HOPS = [2, 9, 13, 4, 22, 17, 27, 11, 1, 30, 20, 6, 25, 15, 10, 3];

export default function MeetFolio(p: P) {
  const frame = useCurrentFrame();
  const end = video.durationInFrames;
  const isDark = parseInt(p.background.slice(1, 3), 16) < 90;
  const B2 = T.bars(1);
  const B3 = T.bars(2);
  const B4 = T.bars(3);
  const B5 = T.bars(4);

  const exit = prog(frame, end - 30, 30, ease.in);
  const push = mix(1, 1.035, prog(frame, 0, end, ease.inOutSoft));

  // Grid placement: centre stage, then aside on the bar-3 downbeat.
  const aside = prog(frame, B3 - 12, 36, ease.inOut);
  const shot = p.screenshot ? prog(frame, B4, 36, ease.out) : 0;
  const gcx = mix(W / 2, 1400, aside);
  const gcy = mix(H / 2, 540, aside);
  const gs = mix(1, 0.6, aside);

  // Rules unfold from the square: horizontals on beat 2, verticals on beat 3.
  const hr = prog(frame, T.beats(2), 30, ease.inOutSoft);
  const vr = prog(frame, T.beats(3), 30, ease.inOutSoft);

  // The agent: a free square at centre in bar 1, then a red cell hopping on beats.
  const sqPop = prog(frame, 6, 22, ease.backOut);
  const hopIdx = frame >= B2 ? Math.floor((frame - B2) / T.beat) : -1;
  const agentCell = hopIdx >= 0 ? HOPS[hopIdx % HOPS.length] : -1;
  const hopT = hopIdx >= 0 ? prog(frame, B2 + hopIdx * T.beat, 10, ease.out) : 0;
  const freeSq = frame < B2 + 4;
  const freeShrink = prog(frame, B2 - 8, 12, ease.in);

  const feats = [
    [p.feature1, p.feature1Note],
    [p.feature2, p.feature2Note],
    [p.feature3, p.feature3Note],
  ];
  const titleShrink = prog(frame, B4 - 10, 34, ease.inOut);
  const TITLE = mix(210, 120, titleShrink);
  const titleTop = mix(330, 150, titleShrink);
  const titleStyle = {
    position: 'absolute' as const,
    left: 140,
    top: titleTop,
    ...displayFace(p.font, { italic: false }),
    fontSize: TITLE,
    lineHeight: 0.92,
    letterSpacing: '-0.03em',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <AbsoluteFill style={{ background: p.background, color: p.ink, fontFamily: FONTS.familjen }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 60% at 50% 45%, ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)'} 0%, transparent 70%)` }} />
      {/* page hairlines: 12 columns, drifting very slightly */}
      {Array.from({ length: 13 }, (_, i) => (
        <div key={i} style={{ position: 'absolute', top: 0, bottom: 0, left: 80 + i * 146.6 + Math.sin(frame / 90) * 2, width: 1, background: hexA(p.ink, 0.05) }} />
      ))}

      <AbsoluteFill style={{ scale: String(push), opacity: 1 - exit }}>
        {/* ── Grid ── */}
        <div style={{ position: 'absolute', left: gcx - GW / 2, top: gcy - GH / 2, width: GW, height: GH, scale: String(gs), opacity: 1 - shot }}>
          {PLATFORMS.map(([tk, name], i) => {
            const c = i % COLS;
            const r = Math.floor(i / COLS);
            const dist = Math.hypot(c - 3.5, r - 1.5);
            const fillT = prog(frame, B2 - 10 + dist * 7, 18, ease.out);
            const isAgent = i === agentCell;
            const bar = 0.25 + rand(i * 5.3) * 0.6 + Math.sin(frame / 40 + i) * 0.06;
            return (
              <div key={i} style={{ position: 'absolute', left: c * CW, top: r * CH, width: CW, height: CH, padding: 16, boxSizing: 'border-box', background: isAgent ? p.accent : (c + r) % 2 ? hexA(p.surface, 0.9 * fillT) : hexA(p.surface, 0.45 * fillT), color: isAgent ? p.background : p.ink, overflow: 'hidden', scale: isAgent ? String(mix(0.9, 1, hopT)) : undefined }}>
                <div style={{ fontFamily: FONTS.spacemono, fontSize: 16, opacity: fillT * (isAgent ? 0.9 : 0.5) }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: 36, lineHeight: 1, marginTop: 10, opacity: fillT, translate: `0 ${mix(14, 0, fillT)}px` }}>{tk}</div>
                <div style={{ fontSize: 22, marginTop: 8, opacity: fillT * 0.8, whiteSpace: 'nowrap' }}>{name}</div>
                <div style={{ position: 'absolute', left: 16, bottom: 14, height: 4, width: (CW - 32) * (isAgent ? 1 : bar) * fillT, background: isAgent ? p.background : hexA(p.ink, 0.5) }} />
              </div>
            );
          })}
          <svg width={GW} height={GH} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            {Array.from({ length: ROWS + 1 }, (_, i) => (
              <line key={`h${i}`} x1={GW / 2 - (GW / 2) * hr} x2={GW / 2 + (GW / 2) * hr} y1={i * CH} y2={i * CH} stroke={i === 0 ? p.ink : hexA(p.ink, 0.25)} strokeWidth={i === 0 ? 4 : 1.2} />
            ))}
            {Array.from({ length: COLS + 1 }, (_, i) => (
              <line key={`v${i}`} x1={i * CW} x2={i * CW} y1={GH / 2 - (GH / 2) * vr} y2={GH / 2 + (GH / 2) * vr} stroke={hexA(p.ink, 0.25)} strokeWidth={1.2} />
            ))}
          </svg>
          {/* free square in bar 1 */}
          {freeSq && (
            <div style={{ position: 'absolute', left: 0, width: GW, top: GH / 2 + 90, textAlign: 'center', fontFamily: FONTS.spacemono, fontSize: 24, letterSpacing: '0.3em', textTransform: 'uppercase', opacity: prog(frame, 16, 20) * (1 - freeShrink) * 0.8 }}>
              One agent
            </div>
          )}
          {freeSq && (
            <div style={{ position: 'absolute', left: GW / 2 - 60, top: GH / 2 - 60, width: 120, height: 120, background: p.accent, scale: String(sqPop * (1 - freeShrink * 0.3)), opacity: 1 - freeShrink }} />
          )}
          {/* caption under the table */}
          <div style={{ position: 'absolute', left: 0, top: GH + 22, fontFamily: FONTS.spacemono, fontSize: 22, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: prog(frame, B2 + 20, 20) * 0.75 }}>
            Fig. 1 · Connected platforms · Agent at {agentCell >= 0 ? PLATFORMS[agentCell][1] : '—'}
          </div>
        </div>

        {/* Optional product screenshot replaces the grid in bar 4 */}
        {p.screenshot && (
          <div style={{ position: 'absolute', left: 1040, top: 250, width: 760, height: 520, border: `1.5px solid ${p.ink}`, background: p.background, boxShadow: `16px 16px 0 ${p.ink}`, opacity: shot, translate: `0 ${mix(40, 0, shot) + Math.sin(frame / 50) * 4}px`, overflow: 'hidden' }}>
            <Img src={p.screenshot} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, width: 26, height: 26, background: p.accent }} />
          </div>
        )}

        {/* ── Title ── */}
        {frame >= B3 - 4 && (
          <>
            <div style={{ position: 'absolute', left: 140, top: titleTop - 64, display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONTS.spacemono, fontSize: 28, letterSpacing: '0.24em', textTransform: 'uppercase', opacity: prog(frame, B3 + 8, 20) * (1 - titleShrink), translate: `${mix(-24, 0, prog(frame, B3 + 8, 26))}px 0` }}>
              <span style={{ width: 18, height: 18, background: p.accent }} />
              {p.eyebrow}
            </div>
            <SweepReveal frame={frame} start={B3 + 10} dur={34} style={titleStyle}>
              {p.title}
              <br />
              <span style={{ ...displayFace(p.font), color: p.accent }}>{p.brand}</span>
            </SweepReveal>
            <Glint frame={frame} start={B5 + T.beats(1)} dur={44} style={titleStyle}>
              {p.title}
              <br />
              <span style={displayFace(p.font)}>{p.brand}</span>
            </Glint>
          </>
        )}

        {/* ── Feature rows, one per beat ── */}
        {feats.map(([f, note], i) => {
          const at = B4 + T.beats(1) + i * T.beat;
          const y = 400 + i * 152;
          const r = prog(frame, at - 4, 20, ease.inOutSoft);
          const t = prog(frame, at, 24, ease.out);
          return (
            <div key={i}>
              <div style={{ position: 'absolute', left: 140, top: y, height: i === 0 ? 3 : 1, width: 760 * r, background: p.ink }} />
              <div style={{ position: 'absolute', left: 140, top: y + 18, width: 22, height: 22, background: p.accent, scale: String(prog(frame, at, 16, ease.backOut)) }} />
              <div style={{ position: 'absolute', left: 184, top: y + 4, ...displayFace(p.font), fontSize: 84, lineHeight: 1.1, opacity: t, translate: `0 ${mix(26, 0, t)}px`, filter: `blur(${mix(10, 0, t)}px)` }}>{f}</div>
              <div style={{ position: 'absolute', left: 184, top: y + 96, fontSize: 36, whiteSpace: 'nowrap', opacity: prog(frame, at + 8, 20) * 0.8, translate: `0 ${mix(12, 0, prog(frame, at + 8, 24))}px` }}>{note}</div>
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: 140, top: 400 + 3 * 152, height: 1, width: 760 * prog(frame, B4 + T.beats(4), 20, ease.inOutSoft), background: p.ink }} />

        {/* ── CTA ── */}
        <div style={{ position: 'absolute', left: 140, top: 892, display: 'flex', alignItems: 'center', gap: 34 }}>
          <div style={{ background: p.ink, color: p.background, padding: '26px 40px', fontSize: 44, fontWeight: 700, whiteSpace: 'nowrap', scale: String(prog(frame, B5, 24, ease.backOut)), opacity: clamp(prog(frame, B5, 8) * 1.2), transformOrigin: 'left center' }}>{p.cta} →</div>
          <div style={{ fontFamily: FONTS.spacemono, fontSize: 24, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: prog(frame, B5 + 12, 20) * 0.8, translate: `${mix(-16, 0, prog(frame, B5 + 12, 24))}px 0` }}>{p.tag}</div>
        </div>
      </AbsoluteFill>

      <FilmOverlay grain={isDark ? 0.06 : 0.045} vignette={isDark ? 0.45 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
