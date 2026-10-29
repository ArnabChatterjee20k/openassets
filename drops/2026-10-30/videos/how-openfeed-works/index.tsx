import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { BinocularsIcon, CheckIcon, FunnelIcon } from '@phosphor-icons/react/ssr';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, displayFace, ease, hexA, keys, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'How openfeed Works',
  category: 'tech',
  description:
    'Tech explainer on a 120 BPM grid: Scout collects sources, FeedX scores the day, domdistill strips a page to its substance, then today\'s page lands on 70s sunrise stripes with the repo CTA.',
  tags: ['tech', 'explainer', 'pipeline', 'reading', 'feed', 'openfeed'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30 frames, bar = 120
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(5) };

export const schema = z.object({
  product: text('Product name').default('openfeed'),
  tagline: text().default('Your reading, kept daily.'),
  cta: text('Call to action').default('github.com/ArnabChatterjee20k/openfeed'),
  step1: text('Step 1 headline').default('Scout collects.'),
  step1Sub: text('Step 1 line').default('38 sources you keep, checked every morning.'),
  step2: text('Step 2 headline').default('FeedX scores.'),
  step2Sub: text('Step 2 line').default('214 articles read for you. The best make the page.'),
  step3: text('Step 3 headline').default('domdistill distills.'),
  step3Sub: text('Step 3 line').default('Ads, popups and chrome out. Just the words.'),
  date: text('Today tab').default('Fri 30 Oct'),
  font: font('Display font').default('shrikhand'),
  background: color().default('#EEF1E6'),
  surface: color('Card paper').default('#FAF9F2'),
  textColor: color('Ink').default('#1E2A1A'),
  accent: color().default('#6A8D3A'),
  accent2: color('Second color').default('#C9A227'),
  pop: color('Pop').default('#E85D3F'),
  screenshot: image('App screenshot (optional, shown on the final page)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'forest-night': { background: '#0E1A14', surface: '#EAF2DC', textColor: '#EAF2DC', accent: '#B5E550', accent2: '#4E8A5B', pop: '#FF9F43' },
  terracotta: { background: '#F1E4D3', surface: '#FBF5EC', textColor: '#3B1F14', accent: '#C8553D', accent2: '#F2A541', pop: '#4F6D58' },
  nordic: { font: 'fredoka', background: '#E9EEF1', surface: '#FAFCFD', textColor: '#17242E', accent: '#2F6F8F', accent2: '#A7C4D4', pop: '#E4572E' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const SOURCES = ['stratechery.com', 'paulgraham.com', 'arstechnica.com', 'simonwillison.net', 'lwn.net', 'danluu.com', 'overreacted.io', 'news.ycombinator.com'];
const SCORED = [
  { src: 'Stratechery', title: 'The slow web is having a moment', score: 0.94 },
  { src: 'Tech Radar', title: '10 gadgets you need this week', score: 0.41 },
  { src: 'Ars Technica', title: 'Inside the 20-year battery', score: 0.88 },
  { src: 'Viral Daily', title: 'You won’t believe this one trick', score: 0.23 },
  { src: 'Paul Graham', title: 'How to do great work', score: 0.91 },
];

/** Scene window: fades/slides in at `a`, out before `b`. */
function Scene({ frame, a, b, children }: { frame: number; a: number; b: number; children: ReactNode }) {
  if (frame < a - 2 || frame > b + 2) return null;
  const i = prog(frame, a, 18, ease.out);
  const o = prog(frame, b - 16, 16, ease.in);
  return <AbsoluteFill style={{ opacity: i * (1 - o), translate: `${mix(60, 0, i) - o * 80}px 0`, filter: o > 0 ? `blur(${o * 10}px)` : undefined }}>{children}</AbsoluteFill>;
}

/** Step heading: eyebrow + juicy headline (offset 70s shadow) + one line. */
function Heading({ frame, at, n, title, sub, p }: { frame: number; at: number; n: string; title: string; sub: string; p: P }) {
  const shadow = isDark(p.background) ? '#000000' : p.accent2;
  return (
    <>
      <div style={{ position: 'absolute', left: 120, top: 104, display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 30, letterSpacing: '0.3em', textTransform: 'uppercase', color: p.accent, opacity: prog(frame, at, 20), translate: `0 ${mix(16, 0, prog(frame, at, 24))}px` }}>
        <span style={{ display: 'inline-flex', gap: 5 }}>
          {[p.accent, p.accent2, p.pop].map((c) => (
            <span key={c} style={{ width: 9, height: 30, borderRadius: 9, background: c }} />
          ))}
        </span>
        {n}
      </div>
      <SweepReveal frame={frame} start={at + 4} dur={30} style={{ position: 'absolute', left: 116, top: 150, ...displayFace(p.font), fontSize: 104, lineHeight: 1.05, letterSpacing: '-0.01em', whiteSpace: 'nowrap', color: p.textColor, textShadow: `5px 6px 0 ${shadow}` }}>
        {title}
      </SweepReveal>
      <WordsIn text={sub} frame={frame} start={at + 16} style={{ position: 'absolute', left: 120, top: 290, width: 1500, fontFamily: FONTS.fraunces, fontWeight: 400, fontSize: 46, color: hexA(p.textColor, 0.82) }} />
    </>
  );
}

function SceneScout({ frame, p }: { frame: number; p: P }) {
  const a = 0;
  const bx = 400;
  const by = 690;
  const card = isDark(p.background) ? p.surface : p.surface;
  const cardInk = isDark(card) ? '#F4F1E8' : isDark(p.textColor) ? p.textColor : '#1E2A1A';
  return (
    <>
      <Heading frame={frame} at={a} n="01 — Scout" title={p.step1} sub={p.step1Sub} p={p} />
      {/* Pings on every beat */}
      <svg style={{ position: 'absolute', inset: 0 }} width={1920} height={1080}>
        {[0, 1, 2, 3].map((k) => {
          const t = prog(frame, a + 8 + k * T.beat, 40, ease.out);
          return frame >= a + 8 + k * T.beat ? <circle key={k} cx={bx} cy={by} r={150 + t * 260} fill="none" stroke={p.accent} strokeWidth={mix(6, 1, t)} opacity={(1 - t) * 0.6} /> : null;
        })}
      </svg>
      <div style={{ position: 'absolute', left: bx - 140, top: by - 140, width: 280, height: 280, borderRadius: '50%', background: p.accent, border: `5px solid ${cardInk}`, boxShadow: `10px 12px 0 ${cardInk}`, display: 'grid', placeItems: 'center', scale: String(prog(frame, a + 4, 26, ease.backOut)) }}>
        <BinocularsIcon weight="fill" size={150} color={p.surface} />
      </div>
      {SOURCES.map((s, i) => {
        const at = a + 14 + i * 7;
        const t = prog(frame, at, 28, ease.out);
        const col = i % 2;
        const row = Math.floor(i / 2);
        const tx = 720 + col * 560;
        const ty = 430 + row * 122;
        return (
          <div
            key={s}
            style={{
              position: 'absolute',
              left: mix(bx - 100, tx, t),
              top: mix(by - 30, ty, t),
              opacity: clamp(t * 3),
              scale: String(mix(0.4, 1, t)),
              rotate: `${mix(-12, i % 3 === 0 ? -1.5 : 1, t)}deg`,
              display: 'flex',
              alignItems: 'center',
              gap: 18,
              padding: '18px 30px',
              borderRadius: 999,
              background: card,
              color: cardInk,
              border: `3px solid ${cardInk}`,
              boxShadow: `6px 7px 0 ${hexA(cardInk, 0.9)}`,
              fontFamily: FONTS.outfit,
              fontWeight: 500,
              fontSize: 40,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: [p.accent, p.accent2, p.pop][i % 3] }} />
            {s}
          </div>
        );
      })}
    </>
  );
}

function SceneScore({ frame, p }: { frame: number; p: P }) {
  const a = T.bars(1);
  const count = Math.round(214 * prog(frame, a + 10, 50, ease.outSoft));
  const keptAt = a + T.beats(3);
  const card = p.surface;
  const cardInk = isDark(card) ? '#F4F1E8' : isDark(p.textColor) ? p.textColor : '#1E2A1A';
  return (
    <>
      <Heading frame={frame} at={a} n="02 — FeedX" title={p.step2} sub={p.step2Sub} p={p} />
      <div style={{ position: 'absolute', left: 120, top: 470, ...displayFace(p.font), fontSize: 200, lineHeight: 1, color: p.accent, textShadow: `6px 7px 0 ${isDark(p.background) ? '#000000' : p.textColor}` }}>{count}</div>
      <div style={{ position: 'absolute', left: 126, top: 700, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 32, letterSpacing: '0.24em', textTransform: 'uppercase', color: p.textColor, opacity: prog(frame, a + 20, 20) }}>read today</div>
      <div style={{ position: 'absolute', left: 120, top: 760, display: 'flex', alignItems: 'baseline', gap: 22, opacity: prog(frame, keptAt, 12), scale: String(prog(frame, keptAt, 24, ease.backOut)), transformOrigin: 'left center' }}>
        <span style={{ ...displayFace(p.font), fontSize: 120, color: p.pop, textShadow: `5px 6px 0 ${isDark(p.background) ? '#000000' : p.textColor}` }}>→ 9</span>
        <span style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 32, letterSpacing: '0.24em', textTransform: 'uppercase', color: p.textColor }}>kept</span>
      </div>
      {SCORED.map((r, i) => {
        const at = a + 8 + i * 6;
        const t = prog(frame, at, 26, ease.out);
        const fill = prog(frame, at + 14, 36, ease.inOutSoft);
        const low = r.score < 0.5;
        const drop = low ? prog(frame, a + T.beats(2) + (i === 3 ? 8 : 0), 22, ease.inOut) : 0;
        const check = !low ? prog(frame, keptAt + i * 3, 22, ease.backOut) : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 760,
              top: 386 + i * 110,
              width: 1040,
              height: 94,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              gap: 26,
              padding: '0 30px',
              borderRadius: 22,
              background: card,
              color: cardInk,
              border: `3px solid ${cardInk}`,
              boxShadow: `6px 7px 0 ${hexA(cardInk, mix(0.9, 0.2, drop))}`,
              opacity: t * mix(1, 0.3, drop),
              translate: `${mix(80, 0, t) + drop * 60}px ${drop * 10}px`,
              rotate: `${drop * 2.5}deg`,
              filter: drop > 0 ? `grayscale(${drop})` : undefined,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 20, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55 }}>{r.src}</div>
              <div style={{ fontFamily: FONTS.fraunces, fontWeight: 600, fontSize: 36, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: drop > 0.5 ? 'line-through' : undefined }}>{r.title}</div>
            </div>
            <div style={{ width: 140, height: 14, borderRadius: 14, background: hexA(cardInk, 0.12), overflow: 'hidden' }}>
              <div style={{ width: `${r.score * 100 * fill}%`, height: '100%', borderRadius: 14, background: low ? p.pop : p.accent }} />
            </div>
            <div style={{ width: 78, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 34, textAlign: 'right' }}>{(r.score * fill).toFixed(2)}</div>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: p.accent, display: 'grid', placeItems: 'center', scale: String(check), flex: 'none' }}>
              <CheckIcon weight="bold" size={30} color={p.surface} />
            </div>
          </div>
        );
      })}
    </>
  );
}

function SceneDistill({ frame, p }: { frame: number; p: P }) {
  const a = T.bars(2);
  const card = p.surface;
  const ink = isDark(card) ? '#F4F1E8' : isDark(p.textColor) ? p.textColor : '#1E2A1A';
  // Clutter leaves on 8th-notes after beat 1; the reader column settles on beat 3.
  const out = (k: number) => prog(frame, a + T.beat + k * 15, 18, ease.in);
  const pop = out(0);
  const cookie = out(1);
  const ads = out(2);
  const nav = out(3);
  const clean = prog(frame, a + T.beats(3), 30, ease.inOutSoft);
  const X = 720;
  const Y = 390;
  const Wd = 1080;
  const Hd = 560;
  const gone = (t: number, dx: number, dy: number, r: number): CSSProperties => ({ opacity: 1 - t, translate: `${dx * t}px ${dy * t}px`, rotate: `${r * t}deg` });
  const tally = [`− 1 popup`, `− 1 cookie wall`, `− 4 ads`, `− nav & chrome`];
  return (
    <>
      <Heading frame={frame} at={a} n="03 — domdistill" title={p.step3} sub={p.step3Sub} p={p} />
      {/* Removal tally */}
      <div style={{ position: 'absolute', left: 120, top: 470, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {tally.map((t, i) => (
          <div key={t} style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 40, color: i === 3 ? p.accent : p.pop, opacity: prog(frame, a + T.beat + i * 15, 14), translate: `${mix(-24, 0, prog(frame, a + T.beat + i * 15, 20))}px 0` }}>
            {t}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 18, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 30, letterSpacing: '0.24em', textTransform: 'uppercase', color: p.textColor, opacity: clean }}>
          <FunnelIcon weight="fill" size={40} color={p.accent} />= 2,140 words, 9 min
        </div>
      </div>
      {/* The page */}
      <div style={{ position: 'absolute', left: X, top: Y, width: Wd, height: Hd, borderRadius: 24, background: card, border: `3px solid ${ink}`, boxShadow: `10px 12px 0 ${ink}`, overflow: 'hidden', color: ink, opacity: prog(frame, a + 6, 20), translate: `0 ${mix(40, 0, prog(frame, a + 6, 30))}px` }}>
        {/* browser chrome */}
        <div style={{ height: 46, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', borderBottom: `2px solid ${hexA(ink, 0.15)}` }}>
          {[p.pop, p.accent2, p.accent].map((c) => (
            <span key={c} style={{ width: 14, height: 14, borderRadius: '50%', background: c }} />
          ))}
          <span style={{ marginLeft: 18, fontFamily: FONTS.outfit, fontSize: 20, opacity: 0.55 }}>stratechery.com/2026/the-slow-web</span>
        </div>
        {/* site nav */}
        <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: 14, padding: '0 28px', background: hexA(ink, 0.07), ...gone(nav, 0, -60, 0) }}>
          {[90, 70, 110, 80, 60].map((w, i) => (
            <span key={i} style={{ width: w, height: 14, borderRadius: 14, background: hexA(ink, 0.25) }} />
          ))}
          <span style={{ marginLeft: 'auto', padding: '8px 18px', borderRadius: 999, background: p.pop, color: '#FFF8EE', fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 18 }}>SUBSCRIBE</span>
        </div>
        {/* article */}
        <div style={{ position: 'absolute', top: mix(132, 82, clean), left: mix(40, 170, clean), width: mix(640, 740, clean) }}>
          <div style={{ fontFamily: FONTS.fraunces, fontWeight: 900, fontSize: mix(38, 46, clean), lineHeight: 1.1, letterSpacing: '-0.02em' }}>The slow web is having a moment</div>
          <div style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 18, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.5, marginTop: 14 }}>Ben Thompson · 9 min read</div>
          <div style={{ position: 'relative', marginTop: 22 }}>
            <div style={{ opacity: 1 - clean }}>
              {[100, 94, 98, 70, 96, 88, 60].map((w, i) => (
                <div key={i} style={{ height: 14, width: `${w}%`, borderRadius: 14, background: hexA(ink, 0.18), marginBottom: 18 }} />
              ))}
            </div>
            <div style={{ position: 'absolute', inset: 0, opacity: clean, fontFamily: FONTS.fraunces, fontWeight: 400, fontSize: 31, lineHeight: 1.5 }}>
              For a decade the feed asked us to keep up. The quieter alternative is older than the feed itself: a page that arrives once, holds what mattered, and lets you stop.
            </div>
          </div>
        </div>
        {/* sidebar ads */}
        <div style={{ position: 'absolute', right: 28, top: 132, width: 300, display: 'flex', flexDirection: 'column', gap: 18, ...gone(ads, 260, 0, 6) }}>
          {[0, 1].map((k) => (
            <div key={k} style={{ height: 150, borderRadius: 14, background: hexA(p.accent2, 0.35), border: `2px dashed ${hexA(ink, 0.35)}`, display: 'grid', placeItems: 'center', fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 26, letterSpacing: '0.2em', opacity: 0.9 }}>
              AD
            </div>
          ))}
        </div>
        {/* cookie wall */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 86, display: 'flex', alignItems: 'center', gap: 20, padding: '0 28px', background: ink, color: card, fontFamily: FONTS.outfit, fontSize: 22, ...gone(cookie, 0, 120, 0) }}>
          We value your privacy. Accept 312 partners?
          <span style={{ marginLeft: 'auto', padding: '10px 22px', borderRadius: 999, background: p.accent2, color: ink, fontWeight: 800 }}>Accept all</span>
        </div>
        {/* newsletter popup */}
        <div style={{ position: 'absolute', left: 250, top: 150, width: 460, padding: 30, borderRadius: 20, background: card, border: `3px solid ${ink}`, boxShadow: `0 30px 80px ${hexA(ink, 0.35)}`, ...gone(pop, -80, -260, -14) }}>
          <div style={{ fontFamily: FONTS.fraunces, fontWeight: 900, fontSize: 32 }}>Wait! Don’t go!</div>
          <div style={{ fontFamily: FONTS.outfit, fontSize: 20, opacity: 0.7, marginTop: 8 }}>Get 7 newsletters a day, free forever.</div>
          <div style={{ marginTop: 18, height: 50, borderRadius: 12, background: p.pop }} />
        </div>
      </div>
    </>
  );
}

function Stripes({ cx, cy, r, band, rise, p }: { cx: number; cy: number; r: number; band: number; rise: number; p: P }) {
  return (
    <svg style={{ position: 'absolute', inset: 0 }} width={1920} height={1080}>
      {[p.pop, p.accent2, p.accent].map((c, i) => {
        const R = r - i * band - band / 2;
        const t = prog(rise, i * 0.12, 0.7, ease.out);
        const y = cy + mix(900, 0, t);
        return <path key={i} d={`M${cx - R},1200 L${cx - R},${y} A${R},${R} 0 0 1 ${cx + R},${y} L${cx + R},1200`} fill="none" stroke={c} strokeWidth={band * 0.98} />;
      })}
    </svg>
  );
}

function ScenePage({ frame, p }: { frame: number; p: P }) {
  const a = T.bars(3);
  const end = video.durationInFrames;
  const card = p.surface;
  const ink = isDark(card) ? '#F4F1E8' : isDark(p.textColor) ? p.textColor : '#1E2A1A';
  const rise = clamp((frame - a) / 60);
  const drop = prog(frame, a + 10, 36, ease.backOut);
  const cx = 1470;
  const cw = 520;
  const ch = 620;
  const cy = 560 + Math.sin(frame / 40) * 6;
  const TITLE = p.product.length > 10 ? 130 : 168;
  const shadow = isDark(p.background) ? '#000000' : p.accent2;
  const titleStyle: CSSProperties = { position: 'absolute', left: 112, top: 330, ...displayFace(p.font), fontSize: TITLE, lineHeight: 1.05, whiteSpace: 'nowrap', letterSpacing: '-0.01em' };
  return (
    <>
      <Stripes cx={cx} cy={640} r={540} band={86} rise={rise} p={p} />
      <div style={{ position: 'absolute', left: cx - 330, top: 160, width: 660, height: 660, borderRadius: '50%', background: `radial-gradient(circle, ${hexA('#FFF6D8', 0.85)} 0%, transparent 65%)`, opacity: prog(frame, a, 40) * (0.85 + 0.15 * Math.sin(frame / 30)) }} />
      {/* Back pages + today's page */}
      {[-7, 5].map((r, i) => (
        <div key={r} style={{ position: 'absolute', left: cx - cw / 2 + (i ? 40 : -40), top: cy - ch / 2 + 16, width: cw, height: ch, borderRadius: 28, background: card, border: `3px solid ${ink}`, boxShadow: `8px 10px 0 ${hexA(ink, 0.5)}`, rotate: `${r * prog(frame, a + 16, 30)}deg`, opacity: prog(frame, a + 14, 16), translate: `0 ${mix(-700, 0, drop)}px` }} />
      ))}
      <div style={{ position: 'absolute', left: cx - cw / 2, top: cy - ch / 2, width: cw, height: ch, boxSizing: 'border-box', padding: 36, borderRadius: 28, background: card, color: ink, border: `3px solid ${ink}`, boxShadow: `12px 14px 0 ${ink}`, translate: `0 ${mix(-760, 0, drop)}px`, rotate: `${mix(-8, -1.5, drop)}deg`, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 18px', borderRadius: 999, background: p.accent, color: card, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 22, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: p.pop }} />
            {p.date}
          </span>
          <span style={{ fontFamily: FONTS.outfit, fontSize: 20, opacity: 0.55 }}>9 worth reading</span>
        </div>
        <div style={{ fontFamily: FONTS.fraunces, fontWeight: 900, fontSize: 48, letterSpacing: '-0.02em', marginTop: 22 }}>Today’s page</div>
        {p.screenshot ? (
          <Img src={p.screenshot} style={{ marginTop: 20, width: '100%', height: 440, objectFit: 'cover', borderRadius: 16, border: `2px solid ${hexA(ink, 0.2)}` }} />
        ) : (
          SCORED.filter((r) => r.score > 0.5).map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 24, paddingTop: 22, borderTop: `2px dashed ${hexA(ink, 0.22)}`, opacity: prog(frame, a + 40 + i * 6, 20), translate: `0 ${mix(16, 0, prog(frame, a + 40 + i * 6, 24))}px` }}>
              <div style={{ width: 76, height: 76, flex: 'none', borderRadius: 16, background: [p.accent, p.accent2, p.pop][i] }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 17, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55 }}>{r.src}</div>
                <div style={{ fontFamily: FONTS.fraunces, fontWeight: 600, fontSize: 30, lineHeight: 1.15, marginTop: 4 }}>{r.title}</div>
              </div>
            </div>
          ))
        )}
      </div>
      <div style={{ position: 'absolute', left: cx + cw / 2 - 210, top: cy + ch / 2 - 40, padding: '14px 26px', borderRadius: 999, background: p.pop, color: '#FFF8EE', fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 32, whiteSpace: 'nowrap', rotate: '-5deg', boxShadow: `5px 6px 0 ${ink}`, scale: String(prog(frame, a + T.beats(2), 24, ease.backOut)) }}>
        214 read → 9 kept
      </div>

      {/* Copy */}
      <div style={{ position: 'absolute', left: 120, top: 270, display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 30, letterSpacing: '0.3em', textTransform: 'uppercase', color: p.accent, opacity: prog(frame, a + 6, 20) }}>
        04 — Your page
      </div>
      <SweepReveal frame={frame} start={a + 4} dur={34} style={{ ...titleStyle, color: p.textColor, textShadow: `8px 9px 0 ${shadow}` }}>
        {p.product}
      </SweepReveal>
      <Glint frame={frame} start={a + T.bars(1)} dur={44} style={titleStyle}>
        {p.product}
      </Glint>
      <WordsIn text={p.tagline} frame={frame} start={a + 28} style={{ position: 'absolute', left: 120, top: 330 + TITLE * 1.12, width: 780, fontFamily: FONTS.fraunces, fontStyle: 'italic', fontWeight: 600, fontSize: 60, color: p.textColor }} />
      <div style={{ position: 'absolute', left: 120, top: 330 + TITLE * 1.12 + 110, padding: '18px 32px', borderRadius: 999, background: isDark(p.background) ? p.accent : p.textColor, color: isDark(p.background) ? p.background : p.surface, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 32, whiteSpace: 'nowrap', boxShadow: `6px 7px 0 ${p.accent}`, scale: String(prog(frame, a + T.beats(2), 26, ease.backOut)), transformOrigin: 'left center' }}>
        {p.cta} →
      </div>
      <div style={{ position: 'absolute', left: 124, top: 330 + TITLE * 1.12 + 210, fontFamily: FONTS.outfit, fontWeight: 500, fontSize: 28, letterSpacing: '0.16em', textTransform: 'uppercase', color: hexA(p.textColor, 0.7), opacity: prog(frame, a + T.beats(3), 24) * (1 - prog(frame, end - 30, 30)) }}>
        Built on FeedX · Scout · domdistill
      </div>
    </>
  );
}

/** Pipeline rail: four steps light up on each downbeat. */
function Rail({ frame, p }: { frame: number; p: P }) {
  const steps = ['Scout', 'FeedX', 'domdistill', 'Your page'];
  const show = prog(frame, 6, 20) * (1 - prog(frame, T.bars(3) - 14, 14, ease.in));
  if (show <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 120, right: 120, top: 978, display: 'flex', alignItems: 'center', gap: 22, opacity: show }}>
      {steps.map((s, i) => {
        const on = prog(frame, i * T.bar, 20, ease.backOut);
        const active = frame >= i * T.bar && frame < (i + 1) * T.bar;
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 22, flex: i < 3 ? 1 : 'none' }}>
            <span style={{ width: 26, height: 26, borderRadius: '50%', border: `3px solid ${p.textColor}`, background: on > 0 ? p.accent : 'transparent', scale: String(0.6 + on * 0.4 + (active ? 0.1 * Math.sin(frame / 8) : 0)) }} />
            <span style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 28, letterSpacing: '0.14em', textTransform: 'uppercase', color: p.textColor, opacity: active ? 1 : 0.45, whiteSpace: 'nowrap' }}>{s}</span>
            {i < 3 && <span style={{ flex: 1, height: 3, borderRadius: 3, background: hexA(p.textColor, 0.15), position: 'relative', overflow: 'hidden' }}><span style={{ position: 'absolute', inset: 0, background: p.accent, scale: `${clamp((frame - i * T.bar) / T.bar)} 1`, transformOrigin: 'left' }} /></span>}
          </div>
        );
      })}
    </div>
  );
}

export default function HowOpenfeedWorks(p: P) {
  const frame = useCurrentFrame();
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const HIT = T.bars(3);
  const flash = keys(frame, [HIT - 2, HIT + 3, HIT + 30], [0, 1, 0], [ease.out, ease.outSoft]);
  const outro = prog(frame, end - 36, 36, ease.inOut);
  const push = mix(1, 1.035, prog(frame, 0, end, ease.inOutSoft));

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.textColor }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.16, size: 44, y: -frame * 0.15, color: dark ? '255,255,255' : '30,42,26' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)'}
        glows={[
          { x: 1500, y: 300, size: 1400, color: hexA(p.accent2, dark ? 0.2 : 0.28), opacity: 0.7 + 0.2 * Math.sin(frame / 40) },
          { x: 300, y: 1000, size: 1200, color: hexA(p.accent, dark ? 0.2 : 0.18), opacity: 0.7 },
        ]}
        grain={0}
        vignette={dark ? 0.5 : 0.12}
      />
      <AbsoluteFill style={{ scale: String(push), opacity: 1 - outro }}>
        <Dust frame={frame} width={1920} height={1080} count={40} color={dark ? p.accent : p.accent2} seed={4} speed={0.7} opacity={0.4} />
        <Scene frame={frame} a={0} b={T.bars(1)}>
          <SceneScout frame={frame} p={p} />
        </Scene>
        <Scene frame={frame} a={T.bars(1)} b={T.bars(2)}>
          <SceneScore frame={frame} p={p} />
        </Scene>
        <Scene frame={frame} a={T.bars(2)} b={T.bars(3)}>
          <SceneDistill frame={frame} p={p} />
        </Scene>
        <Scene frame={frame} a={T.bars(3)} b={end + 40}>
          <ScenePage frame={frame} p={p} />
        </Scene>
        <Rail frame={frame} p={p} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 72% 60%, ${hexA('#FFF6D8', flash * 0.9)} 0%, ${hexA(p.accent2, flash * 0.5)} 30%, transparent 65%)`, mixBlendMode: dark ? 'screen' : 'normal' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.35 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
