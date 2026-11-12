import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: '32 Lines Launch',
  description: 'Launch banner for Junction, the AI ad agent: a transit-signage headline beside a 45° route map whose coloured lines carry one brief from the Junction interchange to every ad platform, with a live departure-board chip.',
  tags: ['launch', 'banner', 'social', 'ads', 'transit', 'map'],
};

export const schema = z.object({
  eyebrow: text().default('Now boarding · 32 ad platforms'),
  headline: text('Headline (line 1)').default('One brief.'),
  headline2: text('Headline (line 2, accent)').default('32 lines.'),
  body: textarea().default('Junction plans, launches and paces your campaigns on every platform, so your team only writes the brief.'),
  cta: text('Button (empty to hide)').default('Plan your first route'),
  url: text('URL').default('junction.ad'),
  hub: text('Hub name').default('Junction'),
  line1: text('Line 1 stations (comma separated)').default('Google, YouTube, CTV'),
  line2: text('Line 2 stations').default('Meta, Instagram, TikTok'),
  line3: text('Line 3 stations').default('LinkedIn, Reddit, Pinterest'),
  board: text('Departure board').default('L07 META · ON TIME'),
  font: font('Headline font').default('shoulders'),
  background: color().default('#FFF8E1'),
  panel: color('Map panel').default('#FFE9A8'),
  ink: color().default('#1C2B1A'),
  accent: color('Line 1 / accent').default('#FF7A00'),
  accent2: color('Line 2').default('#2BB24C'),
  pop: color('Line 3').default('#FF3D7F'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night line': { background: '#0E1A14', panel: '#18291F', ink: '#EAF2DC', accent: '#FF9F43', accent2: '#B5E550', pop: '#FF3D7F' },
  swiss: { background: '#F5F5F0', panel: '#E6E6E1', ink: '#0A0A0A', accent: '#E3000F', accent2: '#0A0A0A', pop: '#8C8C88', headline2: 'Every platform.' },
  sorbet: { background: '#FFEDE1', panel: '#FFD3C2', ink: '#3D0E2A', accent: '#FF4F6D', accent2: '#7B2CBF', pop: '#FFB627', font: 'anton', eyebrow: 'Black Friday ready' },
  blueprint: { background: '#0F3B8C', panel: '#134AA8', ink: '#EAF2FF', accent: '#FFDD00', accent2: '#7FB2FF', pop: '#FF7A9C', board: 'L12 TIKTOK · BOARDING' },
  minimal: { body: '', cta: '', board: '', eyebrow: 'Junction' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const list = (s: string) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 3);

/**
 * Vignelli-style route map on a 10 × 6 grid: three lines leave the hub, turn at
 * 45° and run to their stations. `u` is pixels per grid unit.
 */
const HUB = 3.3; // hub x on the map grid
const END = 11.3; // terminus x
const MAP_W = 12;

function RouteMap({ x, y, u, p, compact }: { x: number; y: number; u: number; p: P; compact: boolean }) {
  const lines = [
    { c: p.accent, path: [[HUB, 3], [HUB + 2, 1], [END, 1]], st: list(p.line1) },
    { c: p.accent2, path: [[HUB, 3], [END, 3]], st: list(p.line2) },
    { c: p.pop, path: [[HUB, 3], [HUB + 2, 5], [END, 5]], st: list(p.line3) },
  ];
  const lw = u * 0.34;
  const label = u * (compact ? 0.44 : 0.36);
  const dark = isDark(p.panel);
  const stationXs = compact ? [7.2, END] : [6.4, 8.8, END];
  return (
    <svg style={{ position: 'absolute', left: x, top: y, overflow: 'visible' }} width={u * MAP_W} height={u * 6}>
      {/* faint grid, like drafting paper under the map */}
      <g stroke={hexA(dark ? '#FFFFFF' : p.ink, 0.07)} strokeWidth={1}>
        {Array.from({ length: MAP_W + 1 }, (_, i) => (
          <line key={`v${i}`} x1={i * u} y1={0} x2={i * u} y2={u * 6} />
        ))}
        {Array.from({ length: 7 }, (_, j) => (
          <line key={`h${j}`} x1={0} y1={j * u} x2={u * MAP_W} y2={j * u} />
        ))}
      </g>
      {lines.map((l, i) => (
        <g key={i}>
          {/* white casing gives the transit-map separation */}
          <polyline points={l.path.map(([a, b]) => `${a * u},${b * u}`).join(' ')} fill="none" stroke={p.panel} strokeWidth={lw * 1.7} strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={l.path.map(([a, b]) => `${a * u},${b * u}`).join(' ')} fill="none" stroke={l.c} strokeWidth={lw} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      ))}
      {lines.map((l, i) => {
        const yy = l.path[l.path.length - 1][1];
        const names = compact ? [l.st[0], l.st[l.st.length - 1]].filter(Boolean) : l.st;
        return names.map((name, k) => {
          const sx = stationXs[k] ?? END;
          const terminus = k === names.length - 1;
          // Middle stations label below the line so neighbours never collide.
          const below = !terminus && k % 2 === 1;
          return (
            <g key={`${i}-${k}`}>
              {terminus ? (
                <rect x={sx * u - lw * 0.75} y={yy * u - lw * 1.35} width={lw * 1.5} height={lw * 2.7} rx={lw * 0.75} fill={p.background} stroke={p.ink} strokeWidth={Math.max(2, lw * 0.28)} />
              ) : (
                <circle cx={sx * u} cy={yy * u} r={lw * 0.72} fill={p.background} stroke={p.ink} strokeWidth={Math.max(2, lw * 0.28)} />
              )}
              <text
                x={sx * u}
                y={below ? yy * u + lw * 1.6 + label * 0.8 : yy * u - lw * 1.6 - 2}
                textAnchor={terminus ? 'end' : 'middle'}
                dx={terminus ? lw * 0.8 : 0}
                fontFamily={FONTS.mono}
                fontWeight={700}
                fontSize={label}
                letterSpacing="0.08em"
                fill={p.ink}
              >
                {name.toUpperCase()}
              </text>
            </g>
          );
        });
      })}
      {/* the interchange: a capsule where all three lines meet */}
      <rect x={HUB * u - lw * 1.1} y={3 * u - lw * 2.4} width={lw * 2.2} height={lw * 4.8} rx={lw * 1.1} fill={p.background} stroke={p.ink} strokeWidth={Math.max(3, lw * 0.4)} />
      <circle cx={HUB * u} cy={3 * u} r={lw * 0.42} fill={p.pop} />
      {/* hub name on the free left side, sign-style */}
      <text x={HUB * u - lw * 1.9} y={3 * u + u * 0.12} textAnchor="end" fontFamily={FONTS.shoulders} fontWeight={900} fontSize={u * 0.66} letterSpacing="0.01em" fill={p.ink}>
        {p.hub.toUpperCase()}
      </text>
      <text x={HUB * u - lw * 1.9} y={3 * u + u * 0.62} textAnchor="end" fontFamily={FONTS.mono} fontSize={u * 0.27} letterSpacing="0.2em" fill={p.ink} opacity={0.75}>
        INTERCHANGE
      </text>
    </svg>
  );
}

export default function LinesLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const pad = stacked ? W * 0.075 : strip ? H * 0.12 : Math.max(W * 0.05, H * 0.09);

  // Map panel geometry: right column on landscape, top block on square.
  const panelW = stacked ? W - pad * 2 : W * (strip ? 0.44 : 0.52);
  const panelH = stacked ? H * 0.47 : H - pad * 2;
  const panelX = stacked ? pad : W - pad - panelW;
  const panelY = pad;
  const band = Math.max(26, panelH * (strip ? 0.15 : 0.11));
  const mapAreaH = panelH - band;
  const u = Math.min((panelW * 0.95) / MAP_W, (mapAreaH * 0.86) / 6.6);
  const mapX = panelX + (panelW - u * MAP_W) / 2;
  const mapY = panelY + band + (mapAreaH - u * 6) / 2 - u * 0.1;

  // Copy column
  const colX = pad;
  const colW = stacked ? W - pad * 2 : panelX - pad * 2;
  const head = stacked ? Math.min(W * 0.13, H * 0.1) : Math.min(H * (strip ? 0.3 : 0.17), colW * (strip ? 0.2 : 0.24));
  const small = Math.max(13, stacked ? W * 0.026 : Math.min(head * 0.24, H * 0.04));
  const lines = [p.headline, p.headline2].filter(Boolean);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.ink, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.14, size: Math.round(Math.min(W, H) / 24), color: dark ? '255,255,255' : '28,43,26' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'}
        glows={[
          { x: panelX + panelW * 0.3, y: panelY + panelH * 0.4, size: Math.max(W, H) * 0.7, color: hexA(p.accent, 0.35), opacity: dark ? 0.6 : 0.5 },
          { x: 0, y: H, size: Math.max(W, H) * 0.7, color: hexA(p.accent2, 0.3), opacity: dark ? 0.5 : 0.35 },
        ]}
        grain={dark ? 0.06 : 0.04}
        vignette={dark ? 0.5 : 0.06}
      />

      {/* Map panel with an offset ink shadow and a black sign band */}
      <div style={{ position: 'absolute', left: panelX + small * 0.6, top: panelY + small * 0.6, width: panelW, height: panelH, borderRadius: small * 0.9, background: p.ink, opacity: dark ? 0.35 : 1 }} />
      <div style={{ position: 'absolute', left: panelX, top: panelY, width: panelW, height: panelH, borderRadius: small * 0.9, background: p.panel, border: `${Math.max(2, small * 0.14)}px solid ${p.ink}`, overflow: 'hidden' }}>
        <div
          style={{
            height: band,
            background: dark ? p.background : p.ink,
            display: 'flex',
            alignItems: 'center',
            gap: band * 0.22,
            padding: `0 ${band * 0.45}px`,
            color: dark ? p.ink : p.background,
            ...displayFace('shoulders'),
            fontSize: band * 0.56,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {[p.accent, p.accent2, p.pop].map((c, i) => (
            <span key={i} style={{ width: band * 0.42, height: band * 0.42, borderRadius: '50%', background: c, flex: 'none' }} />
          ))}
          <span style={{ marginLeft: band * 0.1 }}>Lines from {p.hub}</span>
          <span style={{ marginLeft: 'auto', fontFamily: FONTS.mono, fontWeight: 400, fontSize: band * 0.32, letterSpacing: '0.18em', opacity: 0.8 }}>+23 more</span>
        </div>
      </div>
      <RouteMap x={mapX} y={mapY} u={u} p={p} compact={strip} />

      {/* Departure board chip, anchored by its right edge */}
      {p.board && (
        <div
          style={{
            position: 'absolute',
            // hangs off the panel's bottom edge like a platform display
            right: W - (panelX + panelW) + small * 1.2,
            top: panelY + panelH - small * 1.05,
            display: 'flex',
            alignItems: 'center',
            gap: small * 0.5,
            padding: `${small * 0.45}px ${small * 0.8}px`,
            borderRadius: small * 0.35,
            background: '#121A11',
            color: '#C9F27A',
            fontFamily: FONTS.mono,
            fontWeight: 700,
            fontSize: small * (strip ? 0.8 : 0.82),
            letterSpacing: '0.14em',
            whiteSpace: 'nowrap',
            boxShadow: `0 ${small * 0.4}px ${small * 1.4}px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.08)`,
          }}
        >
          <span style={{ width: small * 0.5, height: small * 0.5, borderRadius: '50%', background: p.accent2, boxShadow: `0 0 ${small * 0.6}px ${p.accent2}` }} />
          {p.board}
        </div>
      )}

      {/* Copy */}
      <div
        style={{
          position: 'absolute',
          left: colX,
          width: colW,
          ...(stacked ? { top: panelY + panelH + H * 0.05 } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small * 0.8, objectFit: 'contain', alignSelf: 'flex-start' }} />}
        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: small * 0.55,
            fontFamily: FONTS.mono,
            fontWeight: 700,
            fontSize: small * 0.82,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: p.ink,
            lineHeight: 1.3,
          }}
        >
          <span style={{ width: small * 0.8, height: small * 0.8, borderRadius: '50%', border: `${small * 0.2}px solid ${p.ink}`, background: p.background, boxSizing: 'border-box', flex: 'none' }} />
          <span style={{ width: small * 1.6, height: small * 0.28, background: p.accent, borderRadius: 99, marginLeft: -small * 0.55, flex: 'none' }} />
          {p.eyebrow}
        </div>
        <div style={{ ...displayFace(p.font), fontSize: head, lineHeight: 0.88, letterSpacing: '-0.01em', textTransform: 'uppercase', marginTop: small * 0.7 }}>
          {lines.map((l, i) => (
            <div key={i} style={{ color: i === 1 ? p.accent : p.ink, WebkitTextStroke: i === 1 && !dark ? `${Math.max(1, head * 0.012)}px ${p.ink}` : undefined }}>
              {l}
            </div>
          ))}
        </div>
        {!strip && p.body && <div style={{ fontSize: small * 1.08, lineHeight: 1.42, marginTop: small * 0.9, maxWidth: colW * 0.95, opacity: 0.88 }}>{p.body}</div>}
        {(p.cta || p.url) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: small * 1, marginTop: small * (strip ? 0.7 : 1.3), flexWrap: 'wrap' }}>
            {p.cta && (
              <span
                style={{
                  padding: `${small * 0.6}px ${small * 1.2}px`,
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: small * 0.95,
                  color: dark ? p.background : '#FFF8E1',
                  background: dark ? p.accent : p.ink,
                  boxShadow: `${small * 0.25}px ${small * 0.25}px 0 ${p.accent}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {p.cta} →
              </span>
            )}
            {p.url && <span style={{ fontFamily: FONTS.mono, fontSize: small * 0.85, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{p.url}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
