import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA, rand, shade } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: '33 Lines Open',
  description: 'Launch banner for an ad agent: a mid-century switchboard panel with lit jack lamps and an orange patch cord swooping out of frame, beside a chunky serif headline, operator note and CTA.',
  tags: ['launch', 'hero', 'social', 'switchboard', 'mid-century', 'ads'],
};

export const schema = z.object({
  eyebrow: text('Note above the headline').default('Patchwell launches Nov 18'),
  headline: text().default('One brief.'),
  headline2: text('Headline, second line').default('33 lines open.'),
  body: textarea().default('Patchwell writes, launches and rebalances your ads across Meta, Google, TikTok, YouTube, Reddit and 28 more, then leaves a memo on your desk at 8 a.m.'),
  cta: text('Button (empty to hide)').default('Start a 14-day trial'),
  url: text('URL').default('patchwell.ai'),
  note: text('Operator note on the panel').default('all lines patched ✓'),
  lines: textarea('Jack labels (comma separated)').default('Meta,Google,TikTok,YouTube,Reddit,LinkedIn,Pinterest,Snap,Amazon,X,Spotify,Roku,Hulu,Quora,Bing,Twitch,Taboola,Criteo,Nextdoor,AppLovin,Discord,Yelp,Uber,Instacart'),
  font: font('Headline font').default('youngserif'),
  background: color().default('#F4E9D8'),
  surface: color('Paper / disc').default('#E6D3B3'),
  panel: color('Switchboard').default('#2C7873'),
  accent: color('Patch cord').default('#D96C3D'),
  lamp: color('Lamps').default('#E9B44C'),
  textColor: color('Ink').default('#2E2A24'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  terracotta: { background: '#F1E4D3', surface: '#E5CDB2', panel: '#4F6D58', accent: '#C8553D', lamp: '#F2A541', textColor: '#3B1F14', font: 'fraunces' },
  'night-shift': { background: '#2A0A10', surface: '#3F1019', panel: '#F5C6AA', accent: '#E3173E', lamp: '#F7B32B', textColor: '#FFE8E0', headline: 'Lights out.', headline2: 'Lines still open.', eyebrow: 'Night Shift rebalances at 2 a.m.', note: 'moved $1,240 to TikTok' },
  bauhaus: { background: '#F2EBDD', surface: '#E4D9C4', panel: '#1D4E9E', accent: '#D9381E', lamp: '#F2B90F', textColor: '#111111', font: 'dela' },
  nordic: { background: '#E9EEF1', surface: '#D3DDE3', panel: '#17242E', accent: '#E4572E', lamp: '#F2C14E', textColor: '#17242E', eyebrow: 'Now patched into CTV', headline: 'New line:', headline2: 'connected TV.', cta: 'Patch it in' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 120;
};

/** Atomic-age starburst: thin spikes of alternating length. */
function Starburst({ x, y, r, c, sw }: { x: number; y: number; r: number; c: string; sw: number }) {
  return (
    <g stroke={c} strokeWidth={sw} strokeLinecap="round">
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        const l = i % 2 ? r * 0.55 : r;
        return <line key={i} x1={x + Math.cos(a) * r * 0.22} y1={y + Math.sin(a) * r * 0.22} x2={x + Math.cos(a) * l} y2={y + Math.sin(a) * l} />;
      })}
    </g>
  );
}

/** The switchboard: walnut-trimmed enamel panel, rows of jacks with lamps, one patched line. */
function Switchboard({ x, y, w, h, p, labels, W, H }: { x: number; y: number; w: number; h: number; p: P; labels: boolean; W: number; H: number }) {
  const cols = 6;
  const rows = 4;
  const names = p.lines.split(',').map((s) => s.trim()).filter(Boolean);
  const inset = w * 0.07;
  const cw = (w - inset * 2) / cols;
  const ch = (h - inset * 2.1) / rows;
  const r = Math.min(cw, ch) * 0.17;
  const ink = p.textColor;
  const dark = isDark(p.panel);
  const plate = dark ? shade(p.panel, 0.88) : shade(p.panel, -0.75);
  const target = { c: 3, r: 1 };
  const jack = (c: number, rr: number) => ({ jx: x + inset + cw * (c + 0.5), jy: y + inset * 1.25 + ch * (rr + 0.5) });
  const t = jack(target.c, target.r);
  const sh = Math.max(4, w * 0.022);
  const out: ReactNode[] = [];

  for (let rr = 0; rr < rows; rr++) {
    for (let c = 0; c < cols; c++) {
      const i = rr * cols + c;
      const { jx, jy } = jack(c, rr);
      const lit = c === target.c && rr === target.r ? 2 : rand(i * 4.7 + 1) > 0.22 ? 1 : 0;
      const ly = jy - r * 2.1;
      out.push(
        <g key={i}>
          {/* lamp cap */}
          <circle cx={jx} cy={ly} r={r * 0.62} fill={lit ? p.lamp : shade(p.panel, dark ? 0.35 : -0.35)} stroke={ink} strokeWidth={r * 0.14} />
          {lit === 2 && <circle cx={jx} cy={ly} r={r * 1.8} fill={hexA(p.lamp, 0.35)} />}
          {lit > 0 && <circle cx={jx - r * 0.18} cy={ly - r * 0.2} r={r * 0.18} fill="#FFF6DA" opacity={0.85} />}
          {/* jack: brass ring + hole */}
          <circle cx={jx} cy={jy} r={r} fill="#C9A45C" stroke={ink} strokeWidth={r * 0.14} />
          <circle cx={jx} cy={jy} r={r * 0.5} fill={ink} />
          {labels && names[i] && (
            <text x={jx} y={jy + r * 2.25} textAnchor="middle" fontFamily={FONTS.familjen} fontWeight={700} fontSize={Math.max(8, r * 0.95)} fill={plate} letterSpacing="0.04em">
              {names[i].toUpperCase()}
            </text>
          )}
        </g>,
      );
    }
  }

  // Cord: from the patched jack, hanging in a catenary-ish swoop out of the frame:
  // bottom-left on wide sizes, out the left edge (above the copy) when stacked.
  const stacked = W / H < 1.3;
  const cord = stacked
    ? `M${t.jx},${t.jy} C${t.jx + w * 0.04},${y + h * 1.12} ${x + w * 0.1},${y + h * 1.08} ${-40},${y + h * 0.62}`
    : `M${t.jx},${t.jy} C${t.jx + w * 0.02},${t.jy + h * 0.9} ${x + w * 0.1},${y + h * 1.2} ${x - w * 0.35},${H + 40}`;
  // A second, ink cord between two other jacks, sagging below the panel.
  const a = jack(0, 2);
  const b = jack(1, 0);
  const cord2 = `M${a.jx},${a.jy} C${a.jx - w * 0.02},${y + h * 1.15} ${b.jx + w * 0.12},${y + h * 1.1} ${b.jx},${b.jy}`;
  const cw2 = Math.max(4, w * 0.026);

  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      {/* hard offset print shadow */}
      <rect x={x + sh} y={y + sh} width={w} height={h} rx={w * 0.04} fill={ink} />
      {/* walnut frame + enamel panel */}
      <rect x={x} y={y} width={w} height={h} rx={w * 0.04} fill="#7A4E2D" stroke={ink} strokeWidth={Math.max(2, w * 0.006)} />
      <rect x={x + w * 0.025} y={y + w * 0.025} width={w - w * 0.05} height={h - w * 0.05} rx={w * 0.025} fill={p.panel} />
      <rect x={x + w * 0.025} y={y + w * 0.025} width={w - w * 0.05} height={(h - w * 0.05) * 0.45} rx={w * 0.025} fill="#ffffff" opacity={0.06} />
      {/* screws */}
      {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([u, v], i) => (
        <circle key={i} cx={x + w * 0.045 + u * (w - w * 0.09)} cy={y + w * 0.045 + v * (h - w * 0.09)} r={w * 0.008} fill="#C9A45C" />
      ))}
      {out}
      {/* ink cord (behind the orange one) */}
      <path d={cord2} fill="none" stroke={shade(ink, 0.05)} strokeWidth={cw2 * 0.8} strokeLinecap="round" />
      {[a, b].map((j, i) => (
        <g key={i}>
          <circle cx={j.jx} cy={j.jy} r={r * 1.35} fill={shade(ink, 0.15)} stroke={ink} strokeWidth={r * 0.14} />
          <circle cx={j.jx - r * 0.35} cy={j.jy - r * 0.35} r={r * 0.35} fill="#ffffff" opacity={0.25} />
        </g>
      ))}
      {/* the patch cord: shadow, body, highlight */}
      <path d={cord} fill="none" stroke={ink} strokeWidth={cw2 * 1.35} strokeLinecap="round" opacity={0.9} transform={`translate(${sh * 0.5} ${sh * 0.6})`} />
      <path d={cord} fill="none" stroke={p.accent} strokeWidth={cw2} strokeLinecap="round" />
      <path d={cord} fill="none" stroke="#ffffff" strokeWidth={cw2 * 0.22} strokeLinecap="round" opacity={0.35} transform={`translate(${-cw2 * 0.18} ${-cw2 * 0.12})`} />
      {/* plug head seated in the jack */}
      <circle cx={t.jx} cy={t.jy} r={r * 1.55} fill={p.accent} stroke={ink} strokeWidth={r * 0.16} />
      <circle cx={t.jx} cy={t.jy} r={r * 0.75} fill={shade(p.accent, -0.25)} />
      <circle cx={t.jx - r * 0.45} cy={t.jy - r * 0.5} r={r * 0.38} fill="#ffffff" opacity={0.4} />
      <Starburst x={t.jx + r * 3.1} y={t.jy - r * 3.8} r={r * 2.2} c={p.lamp} sw={Math.max(2, r * 0.22)} />
    </svg>
  );
}

export default function LinesOpen(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);

  const pad = stacked ? W * 0.08 : Math.max(W * 0.05, H * 0.1);
  // Panel geometry by layout; right-anchored on wide sizes.
  const pw = stacked ? W * 0.54 : strip ? H * 0.78 * 1.3 : Math.min(W * 0.4, H * 0.68 * 1.3);
  const ph = pw / 1.3;
  const px = stacked ? (W - pw) / 2 + W * 0.04 : W - pad - pw - (strip ? W * 0.02 : W * 0.02);
  const py = stacked ? H * 0.1 :(H - ph) / 2 - (strip ? 0 : H * 0.02);

  const colW = stacked ? W - pad * 2 : px - pad - W * 0.06;
  const head = Math.min(stacked ? W * 0.082 :H * (strip ? 0.19 : 0.12), colW * (strip ? 0.12 : 0.15));
  const small = Math.max(head * 0.27, 13);
  const ink = p.textColor;
  const discR = stacked ? W * 0.36 : strip ? H * 0.75 : Math.min(H * 0.5, W * 0.26);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: ink, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.1, size: Math.round(Math.min(W, H) / 26), color: dark ? '255,255,255' : '46,42,36' }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,250,240,0.7)'}
        glows={[]}
        grain={dark ? 0.06 : 0.05}
        vignette={dark ? 0.45 : 0.12}
      >
        {/* sun disc + boomerang behind the panel */}
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={px + pw * 0.62} cy={py + ph * 0.45} r={discR} fill={p.surface} />
          <path
            d={`M${px - pw * 0.25},${py + ph * 1.05} Q${px + pw * 0.4},${py + ph * 0.55} ${px + pw * 1.12},${py - ph * 0.05} Q${px + pw * 0.55},${py + ph * 0.8} ${px - pw * 0.25},${py + ph * 1.05} Z`}
            fill={hexA(p.lamp, dark ? 0.35 : 0.55)}
          />
          {!strip && <Starburst x={stacked ? W * 0.1 : pad * 0.9} y={stacked ? H * 0.08 : H * 0.12} r={Math.min(W, H) * 0.035} c={p.accent} sw={Math.max(2, Math.min(W, H) * 0.004)} />}
        </svg>
      </Backdrop>

      <Switchboard x={px} y={py} w={pw} h={ph} p={p} labels={pw > 360} W={W} H={H} />

      {/* operator note, handwritten on a tag pinned to the panel */}
      {p.note && (
        <div
          style={{
            position: 'absolute',
            right: W - (px + pw) - pw * 0.02,
            top: py - pw * (strip ? 0.02 : 0.085),
            rotate: '-4deg',
            fontFamily: FONTS.caveat,
            fontWeight: 700,
            fontSize: Math.max(14, pw * (strip ? 0.06 : 0.065)),
            padding: `${pw * 0.008}px ${pw * 0.03}px`,
            background: dark ? '#FFF6E6' : '#FFFBF2',
            color: '#2E2A24',
            boxShadow: `${pw * 0.008}px ${pw * 0.01}px 0 ${ink}`,
            border: `1px solid ${hexA('#2E2A24', 0.4)}`,
            whiteSpace: 'nowrap',
          }}
        >
          {p.note}
        </div>
      )}

      {/* copy */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: py + ph + H * 0.07, textAlign: 'center' as const } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2, marginBottom: small * 0.6, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        <div style={{ fontFamily: FONTS.caveat, fontWeight: 700, fontSize: small * 1.6, color: p.accent, rotate: '-2deg', transformOrigin: 'left', lineHeight: 1 }}>{p.eyebrow}</div>
        <div style={{ ...displayFace(p.font), fontSize: head, lineHeight: 1.0, letterSpacing: '-0.02em', marginTop: small * 0.5, whiteSpace: strip ? 'nowrap' : undefined }}>
          <div>{p.headline}</div>
          <div style={{ color: p.accent }}>{p.headline2}</div>
        </div>
        {!strip && <div style={{ fontSize: small * 1.0, lineHeight: 1.45, marginTop: small * 0.8, maxWidth: colW * 0.92, marginInline: stacked ? 'auto' : undefined }}>{p.body}</div>}
        {(p.cta || p.url) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: small * 0.9, justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.6 : 1.3) }}>
            {p.cta && (
              <span
                style={{
                  padding: `${small * 0.6}px ${small * 1.2}px`,
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: small * 0.95,
                  color: '#FFF8EE',
                  background: p.accent,
                  border: `${Math.max(1.5, small * 0.1)}px solid ${ink}`,
                  boxShadow: `${small * 0.22}px ${small * 0.26}px 0 ${ink}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {p.cta} →
              </span>
            )}
            {p.url && !strip && <span style={{ fontSize: small * 0.9, fontWeight: 700, borderBottom: `2px solid ${p.lamp}` }}>{p.url}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
