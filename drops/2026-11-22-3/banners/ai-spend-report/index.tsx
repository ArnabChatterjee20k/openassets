import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { FilmOverlay, displayFace, hexA, rand } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'AI Spend Report',
  description: 'Launch banner for Ambit: a brutalist headline beside a live-looking spend dashboard with a team-by-day usage heatmap, a big monthly figure and hard-shadow chips.',
  tags: ['hero', 'social', 'dashboard', 'heatmap', 'saas', 'ai'],
};

export const schema = z.object({
  eyebrow: text().default('Ambit · AI usage, by team'),
  headline: text().default('See where your AI spend goes.'),
  highlight: text('Highlighted words').default('AI spend'),
  body: textarea().default('Seats, spend and adoption for every model your team touches. One dashboard, set up in 9 minutes.'),
  cta: text('Button (empty to hide)').default('Start free for 14 days'),
  panelTitle: text('Panel title').default('AI spend · Nov 2026'),
  stat: text('Big number').default('$18,420'),
  delta: text('Change chip').default('−23% vs Oct'),
  chip: text('Floating chip (empty to hide)').default('312 active seats'),
  callout: text('Hot tile callout').default('Eng · Nov 18 · $1,240'),
  teams: text('Row labels, comma separated').default('Eng, Support, Sales, Design, Ops'),
  font: font('Headline font').default('archivo'),
  background: color().default('#E9E3F5'),
  surface: color('Panel').default('#D6CCEC'),
  ink: color('Ink').default('#231942'),
  accent: color().default('#5E4AE3'),
  accent2: color('Hot / highlight').default('#F49CBB'),
  pop: color('Live dot').default('#2EC4B6'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  swiss: { background: '#F5F5F0', surface: '#E6E6E1', ink: '#0A0A0A', accent: '#E3000F', accent2: '#E3000F', pop: '#E3000F', highlight: 'spend goes' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', ink: '#EAF2FF', accent: '#7FB2FF', accent2: '#FFDD00', pop: '#FFDD00', headline: 'Every prompt, accounted for.', highlight: 'accounted for' },
  'neo-brutal': { background: '#FFFDF2', surface: '#FFE45C', ink: '#000000', accent: '#5C8AFF', accent2: '#FF5C8A', pop: '#00D1A0', font: 'dela' },
  report: { eyebrow: 'Monthly AI report', headline: 'Your team ran 48,210 prompts in November.', highlight: '48,210 prompts', body: 'Eng led adoption. Support saved 312 hours. Spend fell 23%.', cta: '', stat: '48,210', delta: '+18% adoption', panelTitle: 'Prompts · Nov 2026' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Linear mix of two hex colours. */
function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) + ((((pb >> s) & 255) - ((pa >> s) & 255)) * t));
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

/** Headline with the highlighted phrase set in the accent colour. */
function Headline({ p, size, align }: { p: P; size: number; align: 'left' | 'center' }) {
  const h = p.highlight.trim();
  const i = h ? p.headline.toLowerCase().indexOf(h.toLowerCase()) : -1;
  const parts = i < 0 ? [p.headline] : [p.headline.slice(0, i), p.headline.slice(i, i + h.length), p.headline.slice(i + h.length)];
  return (
    <div
      style={{
        ...displayFace(p.font),
        fontSize: size,
        lineHeight: 0.94,
        letterSpacing: '-0.04em',
        textTransform: 'uppercase',
        color: p.ink,
        textAlign: align,
        textWrap: 'balance',
      }}
    >
      {parts.map((s, k) =>
        k === 1 ? (
          <span key={k} style={{ color: p.accent, WebkitTextStroke: `${Math.max(1, size * 0.012)}px ${p.ink}` }}>
            {s}
          </span>
        ) : (
          <span key={k}>{s}</span>
        ),
      )}
    </div>
  );
}

/** The dashboard panel: title row, big figure, team × day heatmap with one hot tile. */
function Panel({ x, y, w, h, u, p, rows, cols, compact }: { x: number; y: number; w: number; h: number; u: number; p: P; rows: number; cols: number; compact?: boolean }) {
  const dark = isDark(p.background);
  const border = Math.max(2, 3 * u);
  const shadow = 10 * u;
  const pad = (compact ? 16 : 24) * u;
  const label = (compact ? 10 : 12.5) * u;
  const statSize = (compact ? 40 : 58) * u;
  const teams = p.teams.split(',').map((s) => s.trim()).filter(Boolean);
  const labelW = label * 6.2;
  const headH = label * 1.6 + statSize * 1.05 + (compact ? 6 : 16) * u;
  const gridW = w - pad * 2 - labelW;
  const gridH = h - pad * 2 - headH - label * (compact ? 0 : 2.2);
  const gap = Math.max(2, 4 * u);
  const tile = Math.max(4, Math.min((gridW - gap * (cols - 1)) / cols, (gridH - gap * (rows - 1)) / rows));
  const hotR = Math.min(1, rows - 1);
  const hotC = Math.min(cols - 4, Math.round(cols * 0.62));
  const ramp = (lv: number) => mixHex(mixHex(p.surface, p.background, dark ? 0.2 : 0.55), p.accent, lv);
  const gx = x + pad + labelW;
  const gy = y + pad + headH;
  const mono: CSSProperties = { fontFamily: FONTS.spacemono, color: p.ink };

  return (
    <>
      {/* hard ink shadow + bordered card */}
      <div style={{ position: 'absolute', left: x + shadow, top: y + shadow, width: w, height: h, background: p.ink, borderRadius: 14 * u }} />
      <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, background: p.surface, border: `${border}px solid ${p.ink}`, borderRadius: 14 * u, boxSizing: 'border-box' }} />
      {/* title row */}
      <div style={{ ...mono, position: 'absolute', left: x + pad, top: y + pad, width: w - pad * 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: label, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>
        <span>{p.panelTitle}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: label * 0.5 }}>
          <span style={{ width: label * 0.7, height: label * 0.7, borderRadius: '50%', background: p.pop, boxShadow: `0 0 0 ${border * 0.8}px ${hexA(p.pop, 0.3)}` }} />
          Live
        </span>
      </div>
      {/* big figure + delta chip */}
      <div style={{ position: 'absolute', left: x + pad, top: y + pad + label * 1.7, display: 'flex', alignItems: 'center', gap: 14 * u }}>
        <span style={{ ...displayFace(p.font), fontSize: statSize, lineHeight: 1, letterSpacing: '-0.04em', color: p.ink }}>{p.stat}</span>
        {p.delta && (
          <span style={{ ...mono, fontSize: label, fontWeight: 700, padding: `${label * 0.35}px ${label * 0.7}px`, background: p.pop, color: isDark(p.pop) ? '#F7F5FB' : p.ink, border: `${border * 0.7}px solid ${p.ink}`, borderRadius: 999, whiteSpace: 'nowrap' }}>{p.delta}</span>
        )}
      </div>
      {/* team labels */}
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} style={{ ...mono, position: 'absolute', left: x + pad, top: gy + r * (tile + gap), height: tile, width: labelW - 8 * u, display: 'flex', alignItems: 'center', fontSize: label * 0.95, letterSpacing: '0.04em', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {teams[r % Math.max(1, teams.length)] ?? ''}
        </div>
      ))}
      {/* heat tiles */}
      {Array.from({ length: rows * cols }, (_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const hot = r === hotR && c === hotC;
        const weekend = c % 7 === 5 || c % 7 === 6;
        const lv = Math.min(1, Math.max(0, (rand(i * 3.7 + 11) * 0.8 + (rows - r) * 0.06) * (weekend ? 0.35 : 1)));
        const q = Math.round(lv * 4) / 4;
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
              background: hot ? p.accent2 : ramp(q),
              border: hot ? `${border}px solid ${p.ink}` : undefined,
              boxSizing: 'border-box',
              boxShadow: hot ? `${border}px ${border}px 0 ${p.ink}` : undefined,
              zIndex: hot ? 2 : undefined,
            }}
          />
        );
      })}
      {/* day axis */}
      {!compact && (
        <div style={{ ...mono, position: 'absolute', left: gx, top: gy + rows * (tile + gap) + label * 0.4, width: cols * (tile + gap), display: 'flex', justifyContent: 'space-between', fontSize: label * 0.85, opacity: 0.7 }}>
          <span>Mon</span>
          <span>2 weeks</span>
          <span>Today</span>
        </div>
      )}
      {/* callout pinned to the hot tile, anchored by its right edge so it never overflows */}
      {p.callout && !compact && (
        <div
          style={{
            ...mono,
            position: 'absolute',
            right: `calc(100% - ${gx + hotC * (tile + gap) + tile + label * 0.4}px)`,
            top: gy + hotR * (tile + gap) - label * 2.9,
            fontSize: label,
            fontWeight: 700,
            padding: `${label * 0.45}px ${label * 0.8}px`,
            background: p.background,
            border: `${border * 0.8}px solid ${p.ink}`,
            borderRadius: 8 * u,
            boxShadow: `${border * 1.4}px ${border * 1.4}px 0 ${p.ink}`,
            whiteSpace: 'nowrap',
            zIndex: 3,
          }}
        >
          <span style={{ color: p.ink }}>{p.callout}</span>
        </div>
      )}
    </>
  );
}

export default function AiSpendReport(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const u = stacked ? W / 1000 : strip ? H / 430 : Math.min(H / 630, W / 1200);
  const pad = (stacked ? 70 : strip ? 44 : 64) * u;

  // Layout boxes
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.42 : 0.44);
  const panel = stacked
    ? { x: pad, y: pad * 1.15, w: W - pad * 2 - 10 * u, h: H * 0.44, rows: 5, cols: 16 }
    : strip
      ? { x: W * 0.5, y: pad * 0.9, w: W * 0.5 - pad - 10 * u, h: H - pad * 1.8 - 10 * u, rows: 3, cols: 14 }
      : { x: W * 0.52, y: H * 0.15, w: W * 0.48 - pad - 10 * u, h: H * 0.68, rows: 5, cols: 10 };
  const head = stacked ? 74 * u : strip ? 54 * u : Math.min(60 * u, colW / 8.6);
  const small = stacked ? 22 * u : strip ? 14 * u : 17 * u;
  const shadow = 6 * u;

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', background: p.background, color: p.ink, fontFamily: FONTS.spacemono }}>
      {/* layered field: dot grid, soft pink + violet blooms, a faint oversized tile cluster */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(circle, ${hexA(p.ink, dark ? 0.18 : 0.14)} 1.1px, transparent 1.7px)`, backgroundSize: `${22 * u}px ${22 * u}px` }} />
      <div style={{ position: 'absolute', left: -W * 0.15, top: H * 0.35, width: W * 0.7, height: W * 0.7, borderRadius: '50%', background: `radial-gradient(circle, ${hexA(p.accent2, 0.45)} 0%, transparent 62%)` }} />
      <div style={{ position: 'absolute', left: W * 0.5, top: -H * 0.5, width: W * 0.75, height: W * 0.75, borderRadius: '50%', background: `radial-gradient(circle, ${hexA(p.accent, dark ? 0.35 : 0.22)} 0%, transparent 62%)` }} />

      <Panel {...panel} u={u * (strip ? 0.95 : stacked ? 1.15 : 1)} p={p} compact={strip} />

      {/* floating seat chip, overlapping the panel corner */}
      {p.chip && !strip && (
        <div
          style={{
            position: 'absolute',
            left: panel.x - 24 * u,
            top: panel.y + panel.h - 22 * u,
            rotate: '-4deg',
            fontSize: small * 0.95,
            fontWeight: 700,
            padding: `${small * 0.5}px ${small * 0.9}px`,
            background: p.accent,
            color: isDark(p.accent) ? '#F7F5FB' : p.ink,
            border: `${Math.max(2, 3 * u)}px solid ${p.ink}`,
            borderRadius: 10 * u,
            boxShadow: `${shadow}px ${shadow}px 0 ${p.ink}`,
            whiteSpace: 'nowrap',
            letterSpacing: '0.04em',
            zIndex: 4,
          }}
        >
          ● {p.chip}
        </div>
      )}

      {/* copy */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          display: 'flex',
          flexDirection: 'column',
          alignItems: stacked ? 'center' : 'flex-start',
          ...(stacked ? { top: panel.y + panel.h + 70 * u } : { top: 0, bottom: 0, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small, objectFit: 'contain' }} />}
        {!strip && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: small * 0.5, fontSize: small * 0.82, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: p.ink, padding: `${small * 0.3}px ${small * 0.7}px`, border: `${Math.max(1.5, 2 * u)}px solid ${p.ink}`, borderRadius: 999, background: hexA(p.background, 0.7), marginBottom: small * 1.1 }}>
            <span style={{ width: small * 0.5, height: small * 0.5, background: p.accent2, border: `${Math.max(1, 1.5 * u)}px solid ${p.ink}`, borderRadius: 2 * u }} />
            {p.eyebrow}
          </span>
        )}
        <Headline p={p} size={head} align={stacked ? 'center' : 'left'} />
        {!strip && p.body && <div style={{ fontSize: small, lineHeight: 1.5, marginTop: small * 1.1, maxWidth: colW * 0.92, textAlign: stacked ? 'center' : 'left', color: p.ink, opacity: 0.85 }}>{p.body}</div>}
        {p.cta && (
          <span
            style={{
              marginTop: small * (strip ? 1 : 1.6),
              fontSize: small * 1.0,
              fontWeight: 700,
              padding: `${small * 0.75}px ${small * 1.3}px`,
              background: p.ink,
              color: p.background,
              borderRadius: 10 * u,
              boxShadow: `${shadow}px ${shadow}px 0 ${p.accent}`,
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
            }}
          >
            {p.cta} →
          </span>
        )}
      </div>

      <FilmOverlay grain={dark ? 0.06 : 0.04} vignette={dark ? 0.4 : 0} />
    </div>
  );
}
