import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Customer Story',
  description:
    'Results banner for an AI ad agent: a huge overprinted stat and a customer quote beside a hand-pulled gig-poster bar chart (two-ink bars, a pencilled note where the agent moved budget, a highlighter ROAS sticker). Stacks on square; the strip keeps just the stat and the chart.',
  tags: ['case study', 'results', 'customer', 'social', 'ads', 'chart'],
};

export const schema = z.object({
  eyebrow: text('Eyebrow (handwritten)').default('customer story · Night Market'),
  stat: text('Big stat').default('−38%'),
  headline: text('Stat line').default('cost per sale in 3 weeks'),
  quote: textarea('Quote').default('We wrote one brief. Inkrun printed the other thirty runs and kept moving money to TikTok while we slept.'),
  author: text('Name').default('Maya Ortiz'),
  role: text('Role').default('Growth lead, Night Market'),
  cta: text('Button (empty to hide)').default('Read the story'),
  chartTitle: text('Chart title').default('ROAS by week'),
  values: text('Chart values (comma separated)').default('1.2, 1.4, 1.3, 2.1, 2.7, 3.2, 3.8, 4.2'),
  marker: text('Note at bar # (1-based)').default('4'),
  note: text('Chart note (handwritten)').default('agent re-budgets'),
  sticker: text('Sticker value').default('4.2×'),
  stickerLabel: text('Sticker label').default('ROAS'),
  edition: text('Edition mark').default('08/31'),
  font: font('Headline font').default('fraunces'),
  background: color().default('#12001F'),
  paper: color('Poster paper').default('#FBEFFF'),
  accent: color('Ink 1').default('#B026FF'),
  accent2: color('Ink 2').default('#FF2E88'),
  pop: color('Highlighter').default('#FFD600'),
  textColor: color('Text').default('#FBEFFF'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  risograph: { background: '#F4EFE6', paper: '#FFFFFF', accent: '#0078BF', accent2: '#FF48B0', pop: '#FFE800', textColor: '#1F2A6B' },
  lava: {
    background: '#1A0A06', paper: '#FFEDE0', accent: '#FF4D00', accent2: '#FFB000', pop: '#FF2E63', textColor: '#FFEDE0',
    eyebrow: 'customer story · Kiln Coffee', stat: '6.1×', headline: 'return on ad spend', author: 'Theo Park', role: 'Founder, Kiln Coffee',
    quote: 'Our holiday drop sold out in nine days. The agent found buyers on Pinterest we never would have tried.', values: '1.8, 2.2, 2.0, 3.1, 4.4, 5.2, 5.8, 6.1', sticker: '9 days', stickerLabel: 'sold out', note: 'Pinterest added', edition: '19/31',
  },
  'mid-century': {
    font: 'dmserif', background: '#F4E9D8', paper: '#FFFDF7', accent: '#D96C3D', accent2: '#2C7873', pop: '#E9B44C', textColor: '#2E2A24',
    eyebrow: 'agency story · Fieldwork', stat: '14 hrs', headline: 'saved per client, every week', author: 'Ines Duarte', role: 'Paid social lead, Fieldwork', quote: 'Reporting used to eat our Mondays. Now the agent sends the deck before we log in.', chartTitle: 'Hours on reporting', values: '16, 15, 15, 9, 5, 3, 2, 2', sticker: '−88%', stickerLabel: 'busywork', note: 'agent takes over',
  },
  acid: { background: '#0B0B0B', paper: '#F0FFE0', accent: '#C6FF00', accent2: '#FF00E5', pop: '#00F0FF', textColor: '#F0FFE0' },
  minimal: { quote: '', cta: '', eyebrow: 'Night Market × Inkrun' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};
const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};

/** The hero: a hand-pulled gig poster carrying the results chart. */
function ChartPoster({ p, x, y, w, h }: { p: P; x: number; y: number; w: number; h: number }) {
  const u = Math.min(w, h * 0.8);
  const ink = isDark(p.paper) ? p.paper : lum(p.textColor) < 120 ? p.textColor : '#1A0830';
  const vals = p.values
    .split(',')
    .map((s) => parseFloat(s.trim()))
    .filter((v) => Number.isFinite(v))
    .slice(0, 12);
  const data = vals.length ? vals : [1];
  const max = Math.max(...data) * 1.08;
  const mark = Math.min(data.length, Math.max(1, parseInt(p.marker, 10) || 0)) - 1;

  const padX = w * 0.1;
  const chartTop = h * 0.3;
  const chartBot = h * 0.82;
  const chartH = chartBot - chartTop;
  const slot = (w - padX * 2) / data.length;
  const barW = slot * 0.62;
  const reg = u * 0.016;
  const fill: CSSProperties = { position: 'absolute', inset: 0 };
  // Readable ink for the highlighter sticker.
  const stickerInk = lum(p.pop) > 140 ? '#12001F' : '#FFFFFF';

  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      {/* a second sheet underneath for depth */}
      <div style={{ position: 'absolute', inset: 0, background: p.accent, borderRadius: u * 0.02, rotate: '5deg', translate: `${u * 0.03}px ${u * 0.02}px`, opacity: 0.9, boxShadow: `0 ${u * 0.05}px ${u * 0.14}px rgba(0,0,0,0.35)` }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: p.paper,
          borderRadius: u * 0.02,
          rotate: '-2.5deg',
          overflow: 'hidden',
          boxShadow: `0 ${u * 0.06}px ${u * 0.18}px rgba(0,0,0,0.45), ${u * 0.022}px ${u * 0.022}px 0 ${hexA(p.accent2, 0.9)}`,
        }}
      >
        {/* paper tooth */}
        <div style={{ ...fill, backgroundImage: `radial-gradient(${hexA(ink, 0.08)} 0.6px, transparent 1px)`, backgroundSize: `${Math.max(3, u * 0.025)}px ${Math.max(3, u * 0.025)}px` }} />
        {/* header */}
        <div style={{ position: 'absolute', left: padX, top: h * 0.07, right: padX, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', color: ink }}>
          <span style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: u * 0.05, letterSpacing: '0.14em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{p.chartTitle}</span>
          {/* sits clear of the sticker that overlaps the top-right corner */}
          <span style={{ fontFamily: FONTS.caveat, fontWeight: 700, fontSize: u * 0.075, color: p.accent, rotate: '-6deg', whiteSpace: 'nowrap', marginRight: p.sticker ? u * 0.2 : 0 }}>{p.edition}</span>
        </div>
        <div style={{ position: 'absolute', left: padX, right: padX, top: h * 0.155, height: Math.max(1, u * 0.006), background: ink, opacity: 0.8 }} />

        {/* gridlines */}
        {[0.25, 0.5, 0.75].map((g) => (
          <div key={g} style={{ position: 'absolute', left: padX, right: padX, top: chartBot - chartH * g, borderTop: `${Math.max(1, u * 0.003)}px dashed ${hexA(ink, 0.22)}` }} />
        ))}

        {/* two-ink bars: pink pass first, then violet out of register */}
        <div style={{ ...fill, mixBlendMode: 'multiply' }}>
          {data.map((v, i) => {
            const bh = (v / max) * chartH;
            const left = padX + slot * i + (slot - barW) / 2;
            const after = i >= mark;
            return (
              <div key={i}>
                <div style={{ position: 'absolute', left: left + reg * 1.8, top: chartBot - bh + reg, width: barW, height: bh, background: p.accent2, opacity: after ? 0.95 : 0.55 }} />
                <div
                  style={{
                    position: 'absolute',
                    left,
                    top: chartBot - bh,
                    width: barW,
                    height: bh,
                    background: after ? p.accent : hexA(p.accent, 0.45),
                    backgroundImage: `radial-gradient(${hexA(ink, 0.35)} 30%, transparent 34%)`,
                    backgroundSize: `${Math.max(3, u * 0.022)}px ${Math.max(3, u * 0.022)}px`,
                    backgroundPosition: '0 0',
                  }}
                />
              </div>
            );
          })}
        </div>
        {/* baseline + week labels */}
        <div style={{ position: 'absolute', left: padX * 0.7, right: padX * 0.7, top: chartBot, height: Math.max(1.5, u * 0.008), background: ink }} />
        {data.map((_, i) => (
          <div key={i} style={{ position: 'absolute', left: padX + slot * i, width: slot, top: chartBot + u * 0.025, textAlign: 'center', fontFamily: FONTS.outfit, fontWeight: 600, fontSize: u * 0.034, color: ink, opacity: 0.7 }}>
            W{i + 1}
          </div>
        ))}

        {/* pencilled marker where the agent stepped in */}
        {p.note && (
          <>
            <div style={{ position: 'absolute', left: padX + slot * mark - reg, top: chartTop - h * 0.04, height: chartH + h * 0.04, borderLeft: `${Math.max(1.5, u * 0.006)}px dashed ${ink}`, opacity: 0.75 }} />
            <div
              style={{
                position: 'absolute',
                right: w - (padX + slot * mark) + u * 0.02,
                top: chartTop - h * 0.06,
                fontFamily: FONTS.caveat,
                fontWeight: 700,
                fontSize: u * 0.072,
                lineHeight: 1,
                color: ink,
                rotate: '-5deg',
                whiteSpace: 'nowrap',
                textAlign: 'right',
              }}
            >
              {p.note} →
            </div>
          </>
        )}
      </div>

      {/* highlighter sticker, overlapping the poster corner */}
      {p.sticker && (
        <div
          style={{
            position: 'absolute',
            right: -u * 0.08,
            top: -u * 0.1,
            width: u * 0.34,
            height: u * 0.34,
            borderRadius: '50%',
            background: p.pop,
            rotate: '10deg',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: stickerInk,
            boxShadow: `${u * 0.014}px ${u * 0.014}px 0 ${p.accent2}, 0 ${u * 0.03}px ${u * 0.07}px rgba(0,0,0,0.35)`,
          }}
        >
          <div style={{ ...displayFace(p.font), fontSize: u * (p.sticker.length > 5 ? 0.075 : 0.1), lineHeight: 1, letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>{p.sticker}</div>
          <div style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: u * 0.032, letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: u * 0.01, whiteSpace: 'nowrap' }}>{p.stickerLabel}</div>
        </div>
      )}
    </div>
  );
}

export default function CustomerStory(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const eyebrowColor = dark ? p.pop : p.accent2;

  // Hero poster box (4:3.4-ish, a little taller than wide)
  const ar = 1.12; // w / h
  let hero: { x: number; y: number; w: number; h: number };
  if (stacked) {
    const hh = H * 0.36;
    const hw = Math.min(W * 0.62, hh * ar);
    hero = { x: (W - hw) / 2 - W * 0.02, y: H * 0.07, w: hw, h: hw / ar };
  } else if (strip) {
    const hh = H * 0.74;
    const hw = hh * ar * 1.25;
    hero = { x: W - hw - W * 0.07, y: (H - hh) / 2 + H * 0.02, w: hw, h: hh };
  } else {
    const hh = H * 0.66;
    const hw = Math.min(W * 0.4, hh * ar);
    hero = { x: W - hw - Math.max(W * 0.07, H * 0.12), y: (H - hw / ar) / 2 + H * 0.02, w: hw, h: hw / ar };
  }

  const pad = stacked ? W * 0.08 : Math.max(W * 0.055, H * 0.1);
  const colW = stacked ? W - pad * 2 : strip ? hero.x - pad * 1.6 : hero.x - pad * 1.5;

  // Sizes: the stat is the hero word.
  const statSize = Math.min(stacked ? W * 0.16 :strip ? H * 0.5 : H * 0.27, (colW * 0.95) / (Math.max(3, p.stat.length) * 0.56));
  const lineSize = Math.min(statSize * 0.32, (colW * 0.98) / (Math.max(10, p.headline.length) * 0.5));
  const small = Math.max(Math.min(W, H * 1.6) * 0.017, 13);
  const regOff = statSize * 0.035;

  const statStyle: CSSProperties = { ...displayFace(p.font), fontSize: statSize, lineHeight: 0.9, letterSpacing: '-0.045em', whiteSpace: 'nowrap' };

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.14, size: Math.round(Math.min(W, H) / 40), color: dark ? '251,239,255' : '31,42,107' }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)'}
        glows={[
          { x: hero.x + hero.w * 0.5, y: hero.y + hero.h * 0.5, size: Math.max(hero.w, hero.h) * 2.4, color: hexA(p.accent, dark ? 0.45 : 0.22), opacity: 0.9 },
          { x: hero.x + hero.w, y: hero.y + hero.h, size: Math.max(hero.w, hero.h) * 1.4, color: hexA(p.accent2, dark ? 0.35 : 0.18), opacity: 0.8 },
          { x: stacked ? W * 0.5 : pad, y: stacked ? H : H * 0.2, size: Math.max(W, H) * 0.55, color: hexA(p.accent2, dark ? 0.14 : 0.1), opacity: 0.8 },
        ]}
        grain={dark ? 0.06 : 0.035}
        vignette={dark ? 0.5 : 0.08}
      />

      {/* halftone fan behind the poster */}
      <div
        style={{
          position: 'absolute',
          left: hero.x - hero.w * 0.25,
          top: hero.y - hero.h * 0.15,
          width: hero.w * 1.5,
          height: hero.h * 1.3,
          backgroundImage: `radial-gradient(${hexA(p.accent2, dark ? 0.55 : 0.45)} 30%, transparent 34%)`,
          backgroundSize: `${Math.max(6, hero.w * 0.03)}px ${Math.max(6, hero.w * 0.03)}px`,
          maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, black 20%, transparent 70%)',
        }}
      />

      <ChartPoster p={p} {...hero} />

      {/* copy */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked
            ? { top: hero.y + hero.h + H * 0.045, textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }
            : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small * 0.6, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        {p.eyebrow && (
          <div style={{ fontFamily: FONTS.caveat, fontWeight: 700, fontSize: small * (strip ? 1.7 : 1.9), color: eyebrowColor, rotate: '-2deg', transformOrigin: 'left', whiteSpace: 'nowrap' }}>{p.eyebrow}</div>
        )}
        {/* stat: pink pass offset under the main ink */}
        <div style={{ position: 'relative', marginTop: small * 0.2 }}>
          <div style={{ ...statStyle, position: 'absolute', left: regOff * 1.6, top: regOff, color: p.accent2, opacity: 0.9, mixBlendMode: dark ? 'screen' : 'multiply' }}>{p.stat}</div>
          <div style={{ ...statStyle, position: 'relative', color: dark ? p.textColor : p.accent }}>{p.stat}</div>
        </div>
        <div style={{ ...displayFace(p.font), fontStyle: 'italic', fontWeight: 600, fontSize: lineSize, lineHeight: 1.05, letterSpacing: '-0.02em', marginTop: statSize * 0.06, color: p.textColor, whiteSpace: 'nowrap' }}>{p.headline}</div>

        {!strip && p.quote && (
          <div style={{ marginTop: small * 1.3, maxWidth: stacked ? colW : colW * 0.92, paddingLeft: stacked ? 0 : small * 1.1, borderLeft: stacked ? 'none' : `${Math.max(3, small * 0.22)}px solid ${p.accent2}` }}>
            <div style={{ fontSize: small * 1.2, lineHeight: 1.42, fontWeight: 500, opacity: 0.9 }}>“{p.quote}”</div>
            <div style={{ marginTop: small * 0.6, fontSize: small * 0.95, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {p.author}
              <span style={{ fontWeight: 400, opacity: 0.7 }}> · {p.role}</span>
            </div>
          </div>
        )}
        {!strip && p.cta && (
          <div style={{ marginTop: small * 1.4, display: 'flex', justifyContent: stacked ? 'center' : 'flex-start' }}>
            <span
              style={{
                padding: `${small * 0.62}px ${small * 1.25}px`,
                borderRadius: 999,
                fontWeight: 800,
                fontSize: small * 0.95,
                color: dark ? p.background : '#FFFFFF',
                background: p.textColor,
                boxShadow: `${small * 0.22}px ${small * 0.22}px 0 ${p.accent2}`,
                whiteSpace: 'nowrap',
              }}
            >
              {p.cta} →
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
