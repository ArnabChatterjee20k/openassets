import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, gradientText, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Launch Banner',
  description: 'Magazine-cover launch banner for Firebrand: a huge italic serif headline beside a live "heat index" that ranks ad platforms by how hot they run, with a giant 34 behind it.',
  tags: ['launch', 'hero', 'social', 'ads', 'platforms', 'editorial'],
};

export const schema = z.object({
  folio: text('Folio line').default('Firebrand · Issue 07 · Nov 2026'),
  headline: text('Headline').default("Spend where it's"),
  hotWord: text('Italic hot word').default('hot.'),
  body: textarea().default('One AI agent runs your ads on 34 platforms and moves budget every hour to whatever is working.'),
  cta: text('Button (empty to hide)').default('Start free'),
  url: text('URL').default('firebrand.ai'),
  bigNumber: text('Big numeral').default('34'),
  panelTitle: text('Panel title').default('Heat index · last 24h'),
  platforms: textarea('Platforms (Name: 0–100 per line)').default('TikTok: 94\nMeta: 82\nYouTube: 71\nGoogle: 64\nReddit: 48\nCTV: 37'),
  font: font('Headline font').default('dmserif'),
  background: color().default('#1A0A06'),
  surface: color('Panel').default('#2E120B'),
  textColor: color('Text').default('#FFEDE0'),
  accent: color().default('#FF4D00'),
  accent2: color('Heat top').default('#FFB000'),
  pop: color('Live dot').default('#FF2E63'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  cherry: { background: '#2A0A10', surface: '#3F1019', textColor: '#FFE8E0', accent: '#E3173E', accent2: '#F7B32B', pop: '#F5C6AA', hotWord: 'red hot.' },
  citrus: { background: '#FFF8E1', surface: '#FFE9A8', textColor: '#1C2B1A', accent: '#FF7A00', accent2: '#FF3D7F', pop: '#2BB24C', font: 'bricolage' },
  'ink-gold': { background: '#0D0D0F', surface: '#1C1C20', textColor: '#F3EDE2', accent: '#C9A45C', accent2: '#E8D9B5', pop: '#E3173E', headline: 'Put budget where it', hotWord: 'earns.', cta: '' },
  dusk: { background: '#2B1B2E', surface: '#45293F', textColor: '#FFE9D6', accent: '#E5487A', accent2: '#FFD27F', pop: '#FF8E5E', folio: 'Firebrand · Black Friday playbook' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

function parseRows(src: string) {
  return src
    .split('\n')
    .map((l) => l.split(':'))
    .filter((a) => a[0]?.trim())
    .map(([n, v]) => ({ name: n.trim(), v: Math.max(4, Math.min(100, Number(v) || 0)) }));
}

/** The heat-index panel: platform rows with thermal bars, hottest on top. */
function HeatPanel({ x, y, w, h, rows, p }: { x: number; y: number; w: number; h: number; rows: number; p: P }) {
  const dark = isDark(p.background);
  const data = parseRows(p.platforms).slice(0, rows);
  const max = Math.max(...data.map((d) => d.v), 1);
  const pad = Math.min(w, h) * 0.075;
  const headH = h * 0.22;
  const footH = h * 0.12;
  const rowH = (h - pad * 2 - headH - footH) / Math.max(1, data.length);
  const label = Math.max(11, Math.min(rowH * 0.34, w * 0.04));
  const nameW = label * 5.4;
  const valW = label * 2.6;
  const trackW = w - pad * 2 - nameW - valW;
  const thermal = `linear-gradient(90deg, ${hexA(p.accent, 0.25)} 0%, ${p.accent} 45%, ${p.accent2} 82%, #FFF4DE 100%)`;
  const mono: CSSProperties = { fontFamily: FONTS.mono, textTransform: 'uppercase', letterSpacing: '0.14em', whiteSpace: 'nowrap' };
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: pad * 0.6,
        background: `linear-gradient(160deg, ${hexA(p.surface, 0.96)}, ${hexA(p.surface, 0.82)})`,
        border: `1px solid ${hexA(p.accent, dark ? 0.28 : 0.4)}`,
        boxShadow: `0 ${pad}px ${pad * 3}px rgba(0,0,0,${dark ? 0.45 : 0.12}), inset 0 1px 0 ${hexA('#FFFFFF', dark ? 0.08 : 0.6)}`,
        padding: pad,
        boxSizing: 'border-box',
        color: p.textColor,
      }}
    >
      <div style={{ height: headH, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', ...mono, fontSize: label * 0.78 }}>
        <span style={{ display: 'flex', alignItems: 'flex-start', gap: label * 0.8 }}>
          {p.bigNumber && (
            <span style={{ ...displayFace(p.font, { italic: true }), fontSize: headH * 0.95, lineHeight: 0.8, letterSpacing: '-0.04em', textTransform: 'none', ...gradientText(`linear-gradient(170deg, #FFF4DE 0%, ${p.accent2} 40%, ${p.accent} 85%)`, headH), paddingBottom: 0, paddingRight: headH * 0.06 }}>
              {p.bigNumber}
            </span>
          )}
          <span style={{ display: 'flex', flexDirection: 'column', gap: label * 0.35, paddingTop: label * 0.1 }}>
            <span style={{ opacity: 0.95 }}>platforms</span>
            <span style={{ opacity: 0.55 }}>{p.panelTitle}</span>
          </span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: label * 0.45, color: p.pop }}>
          <span style={{ width: label * 0.55, height: label * 0.55, borderRadius: '50%', background: p.pop, boxShadow: `0 0 ${label}px ${p.pop}` }} />
          Live
        </span>
      </div>
      {data.map((d, i) => {
        const hot = i === 0;
        const bw = (d.v / max) * trackW;
        return (
          <div key={i} style={{ height: rowH, display: 'flex', alignItems: 'center' }}>
            <span style={{ width: nameW, ...mono, letterSpacing: '0.06em', fontSize: label, opacity: hot ? 1 : 0.78, overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
            <span style={{ position: 'relative', width: trackW, height: rowH * 0.42, borderRadius: rowH, background: hexA(p.textColor, dark ? 0.06 : 0.1) }}>
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: bw,
                  borderRadius: rowH,
                  backgroundImage: thermal,
                  backgroundSize: `${trackW}px 100%`,
                  boxShadow: hot ? `0 0 ${rowH * 0.6}px ${hexA(p.accent2, 0.7)}, 0 0 ${rowH * 1.6}px ${hexA(p.accent, 0.45)}` : undefined,
                }}
              />
            </span>
            <span style={{ width: valW, textAlign: 'right', ...mono, letterSpacing: '0.02em', fontSize: label, color: hot ? p.accent2 : p.textColor, opacity: hot ? 1 : 0.7 }}>{d.v}°</span>
          </div>
        );
      })}
      {/* the heat strip: thermal scale with tick labels */}
      <div style={{ height: footH, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: label * 0.4 }}>
        <div style={{ height: Math.max(3, label * 0.28), borderRadius: 99, backgroundImage: `linear-gradient(90deg, ${hexA(p.accent, 0.15)}, ${p.accent} 50%, ${p.accent2} 85%, #FFF4DE)` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', ...mono, fontSize: label * 0.62, opacity: 0.55 }}>
          <span>Cold</span>
          <span>Budget moves hourly</span>
          <span>Hot</span>
        </div>
      </div>
    </div>
  );
}

export default function LaunchBanner(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);

  const pad = stacked ? W * 0.075 : strip ? H * 0.16 : Math.max(W * 0.055, H * 0.09);
  // Panel geometry: right side (wide), right strip (strip), top (stacked).
  const panel = stacked
    ? { x: pad, y: pad * 1.1, w: W - pad * 2, h: H * 0.4, rows: 5 }
    : strip
      ? { w: W * 0.34, h: H - pad * 2, x: W - pad - W * 0.34, y: pad, rows: 3 }
      : { w: W * 0.38, h: H * 0.7, x: W - pad - W * 0.38, y: H * 0.15, rows: 6 };

  const colX = pad;
  const colW = stacked ? W - pad * 2 : panel.x - pad * 2.2;
  const head = stacked ? Math.min(W * 0.105, colW * 0.13) : Math.min(H * (strip ? 0.24 : 0.135), colW * 0.135);
  const small = Math.max(head * 0.24, 12);

  const gradient = `linear-gradient(160deg, ${p.accent2} 0%, ${p.accent} 60%, ${p.accent} 100%)`;
  const mono: CSSProperties = { fontFamily: FONTS.mono, textTransform: 'uppercase', letterSpacing: '0.3em', whiteSpace: 'nowrap' };

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.bricolage }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.06 : 0.1, size: Math.round(Math.min(W, H) / 24), color: dark ? '255,237,224' : '28,43,26' }}
        lift={dark ? hexA(p.accent, 0.08) : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: panel.x + panel.w * 0.5, y: panel.y + panel.h * 0.45, size: Math.max(panel.w, panel.h) * 2.2, color: hexA(p.accent, dark ? 0.42 : 0.3), opacity: 0.9 },
          { x: stacked ? W * 0.1 : W * 0.05, y: H * 1.05, size: Math.max(W, H) * 0.9, color: hexA(p.accent2, dark ? 0.2 : 0.25), opacity: 0.8 },
        ]}
        grain={dark ? 0.07 : 0.04}
        vignette={dark ? 0.55 : 0.08}
      />

      <HeatPanel {...panel} p={p} />


      <div
        style={{
          position: 'absolute',
          left: colX,
          width: colW,
          ...(stacked ? { top: panel.y + panel.h + pad * 0.8, bottom: pad * 0.9 } : { top: 0, bottom: 0 }),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: small * 0.7, ...mono, fontSize: small * 0.66, color: p.accent }}>
          {p.logo && <img src={p.logo} alt="" style={{ height: small * 1.4, objectFit: 'contain' }} />}
          <span style={{ width: small * 2.2, height: Math.max(2, small * 0.12), backgroundImage: `linear-gradient(90deg, ${p.accent}, ${p.accent2})` }} />
          {p.folio}
        </div>
        <div
          style={{
            ...displayFace(p.font, { italic: false }),
            fontSize: head,
            lineHeight: 0.98,
            letterSpacing: '-0.03em',
            marginTop: small * 0.7,
          }}
        >
          {p.headline}{' '}
          <span style={{ ...displayFace(p.font, { italic: true }), fontSize: head * 1.35, lineHeight: 0.9, ...gradientText(gradient, head), paddingBottom: head * 0.1, paddingRight: head * 0.08 }}>{p.hotWord}</span>
        </div>
        {!strip && <div style={{ fontSize: small * 0.98, lineHeight: 1.4, opacity: 0.8, marginTop: small * 0.3, maxWidth: colW * 0.92 }}>{p.body}</div>}
        {(p.cta || p.url) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: small * 0.9, marginTop: small * (strip ? 0.6 : 1.1) }}>
            {p.cta && (
              <span
                style={{
                  padding: `${small * 0.55}px ${small * 1.15}px`,
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: small * 0.82,
                  color: dark ? p.background : '#FFFDF6',
                  background: `linear-gradient(180deg, ${p.accent2}, ${p.accent})`,
                  boxShadow: `0 ${small * 0.4}px ${small * 1.6}px ${hexA(p.accent, 0.45)}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {p.cta} →
              </span>
            )}
            {p.url && <span style={{ ...mono, letterSpacing: '0.18em', fontSize: small * 0.62, opacity: 0.75 }}>{p.url}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
