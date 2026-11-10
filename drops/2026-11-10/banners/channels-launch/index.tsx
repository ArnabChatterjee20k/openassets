import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: '34 Channels Launch',
  description:
    'Launch banner for Formwork: an editorial italic headline beside a Bauhaus poster grid of ad-platform tiles, with a vermilion circle, cobalt square and yellow triangle cast across it and a live-channels chip.',
  tags: ['launch', 'hero', 'social', 'bauhaus', 'ads', 'agent'],
};

export const schema = z.object({
  eyebrow: text().default('Formwork · Nº 34 · Now live'),
  headline: text('Headline (first line)').default('Brief once,'),
  headlineItalic: text('Headline (italic line)').default('run everywhere.'),
  body: textarea().default('One AI agent drafts, launches and rebalances your campaign across 34 ad platforms, every hour.'),
  cta: text('Button (empty to hide)').default('Start free at formwork.ai'),
  chip: text('Live chip (empty to hide)').default('34 channels live'),
  platforms: text('Platform tiles (comma separated)').default('Meta,Google,TikTok,YouTube,LinkedIn,Reddit,Pinterest,Snap,Amazon,Spotify,X,CTV'),
  font: font('Headline font').default('instrument'),
  background: color().default('#F2EBDD'),
  surface: color('Tiles').default('#E4D9C4'),
  ink: color('Text').default('#111111'),
  circle: color('Circle').default('#D9381E'),
  square: color('Square').default('#1D4E9E'),
  triangle: color('Triangle').default('#F2B90F'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  swiss: { background: '#F5F5F0', surface: '#E6E6E1', ink: '#0A0A0A', circle: '#E3000F', square: '#0A0A0A', triangle: '#8C8C88', font: 'archivo', headline: 'One brief.', headlineItalic: '34 channels.' },
  'ink-gold': { background: '#0D0D0F', surface: '#1C1C20', ink: '#F3EDE2', circle: '#C9A45C', square: '#6E6A62', triangle: '#E8D9B5', font: 'bodoni', eyebrow: 'Formwork · Agency plan', cta: 'Book a walkthrough' },
  nordic: { background: '#E9EEF1', surface: '#D3DDE3', ink: '#17242E', circle: '#E4572E', square: '#2F6F8F', triangle: '#A7C4D4', chip: 'Rebalanced 12 min ago' },
  minimal: { body: '', chip: '', eyebrow: 'Formwork', cta: '' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** The hero: a poster grid of platform tiles with the three primaries cast across it. */
function PosterGrid({ x, y, w, h, p, small }: { x: number; y: number; w: number; h: number; p: P; small: number }) {
  const names = p.platforms.split(',').map((s) => s.trim()).filter(Boolean);
  const cols = w / h > 1.6 ? 6 : 4;
  const rows = Math.max(2, Math.ceil(Math.max(names.length, cols * 2) / cols));
  const gap = Math.min(w, h) * 0.018;
  const cw = (w - gap * (cols - 1)) / cols;
  const ch = (h - gap * (rows - 1)) / rows;
  const label = Math.max(9, Math.min(cw * 0.12, ch * 0.16, small * 0.62));
  const lit = new Set([1, 4, 6, 9, 11]);
  const dark = isDark(p.background);
  // the primaries, sized from the grid
  const R = Math.min(w, h) * 0.34;
  const cx = x + w * 0.38;
  const cy = y + h * 0.45;
  const sq = Math.min(w, h) * 0.36;
  return (
    <>
      {/* tiles */}
      {Array.from({ length: cols * rows }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const name = names[i] ?? '';
        const on = lit.has(i) && name;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + c * (cw + gap),
              top: y + r * (ch + gap),
              width: cw,
              height: ch,
              background: p.surface,
              border: `1px solid ${hexA(p.ink, 0.14)}`,
              boxSizing: 'border-box',
              padding: label * 0.7,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: FONTS.spacemono,
              fontSize: label,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: p.ink,
            }}
          >
            <span style={{ opacity: 0.55 }}>Nº {String(i + 1).padStart(2, '0')}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: label * 0.5, whiteSpace: 'nowrap', overflow: 'hidden' }}>
              {name && <span style={{ width: label * 0.6, height: label * 0.6, borderRadius: '50%', flexShrink: 0, background: on ? p.triangle : 'transparent', border: `1px solid ${p.ink}` }} />}
              {name}
            </span>
          </div>
        );
      })}
      {/* cobalt square, multiplied over the tiles like overprinted ink */}
      <div style={{ position: 'absolute', left: x + w * 0.56, top: y + h * 0.5 - sq * 0.15, width: sq, height: sq, background: p.square, mixBlendMode: dark ? 'screen' : 'multiply', opacity: 0.92, rotate: '-8deg' }} />
      {/* vermilion circle */}
      <div style={{ position: 'absolute', left: cx - R, top: cy - R, width: R * 2, height: R * 2, borderRadius: '50%', background: p.circle, mixBlendMode: dark ? 'screen' : 'multiply', boxShadow: `${R * 0.05}px ${R * 0.05}px 0 ${hexA(p.ink, dark ? 0 : 0.9)}` }} />
      {/* yellow triangle */}
      <svg style={{ position: 'absolute', left: x + w * 0.62, top: y - h * 0.04, width: R * 1.1, height: R * 1.0, overflow: 'visible' }} viewBox="0 0 110 100">
        <polygon points="55,0 110,100 0,100" fill={p.triangle} style={{ mixBlendMode: dark ? 'normal' : 'multiply' }} />
      </svg>
      {/* hairline registration cross on the circle centre */}
      <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
        <line x1={cx - R * 1.25} y1={cy} x2={cx + R * 1.25} y2={cy} stroke={p.ink} strokeWidth={1} />
        <line x1={cx} y1={cy - R * 1.25} x2={cx} y2={cy + R * 1.25} stroke={p.ink} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={R * 0.08} fill="none" stroke={p.ink} strokeWidth={1} />
      </svg>
    </>
  );
}

export default function ChannelsLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const pad = stacked ? W * 0.075 : Math.max(W * 0.05, H * 0.1);
  const colW = stacked ? W - pad * 2 : W * (strip ? 0.42 : 0.44);
  const head = Math.min(stacked ? W * 0.09 : H * (strip ? 0.24 : 0.14), colW * 0.17);
  const small = Math.max(head * 0.22, 13);
  const dark = isDark(p.background);

  // hero grid box
  const gx = stacked ? pad : pad + colW + pad * (strip ? 0.8 : 0.9);
  const gy = stacked ? pad * 0.9 : pad;
  const gw = stacked ? W - pad * 2 : W - gx - pad;
  const gh = stacked ? H * 0.4 : H - pad * 2;
  const faceWeight = p.font === 'bodoni' ? 400 : undefined;

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.ink, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.14, size: Math.round(Math.min(W, H) / 24), color: dark ? '255,255,255' : '17,17,17' }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)'}
        glows={[]}
        grain={dark ? 0.06 : 0.05}
        vignette={dark ? 0.45 : 0.06}
      />
      <PosterGrid x={gx} y={gy} w={gw} h={gh} p={p} small={small} />

      {/* live chip, anchored by its right edge */}
      {p.chip && !strip && (
        <div
          style={{
            position: 'absolute',
            right: W - (gx + gw),
            top: gy + gh + small * 0.8 - (stacked ? 0 : small * 3.4),
            display: 'flex',
            alignItems: 'center',
            gap: small * 0.5,
            padding: `${small * 0.45}px ${small * 0.85}px`,
            background: p.ink,
            color: p.background,
            fontFamily: FONTS.spacemono,
            fontSize: small * 0.72,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: small * 0.5, height: small * 0.5, borderRadius: '50%', background: p.triangle }} />
          {p.chip}
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked
            ? { top: gy + gh + small * 4.2 }
            : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2, marginBottom: small, objectFit: 'contain', alignSelf: 'flex-start' }} />}
        <div style={{ fontFamily: FONTS.spacemono, fontSize: small * 0.72, letterSpacing: '0.3em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: small * 0.6 }}>
          <span style={{ width: small * 1.6, height: 1, background: p.ink }} />
          {p.eyebrow}
        </div>
        <div style={{ ...displayFace(p.font, { italic: false, weight: faceWeight }), fontSize: head, lineHeight: 0.92, letterSpacing: '-0.025em', marginTop: small * 0.7, whiteSpace: strip ? 'nowrap' : undefined }}>
          {p.headline}
          <br />
          <span style={{ ...displayFace(p.font, { italic: true, weight: faceWeight }), color: p.circle }}>{p.headlineItalic}</span>
        </div>
        {!strip && p.body && <div style={{ fontSize: small * 1.0, lineHeight: 1.4, marginTop: small * 0.9, maxWidth: colW * (stacked ? 0.78 : 0.92) }}>{p.body}</div>}
        {p.cta && (
          <div style={{ display: 'flex', marginTop: small * (strip ? 0.7 : 1.3) }}>
            <span
              style={{
                padding: `${small * 0.6}px ${small * 1.1}px`,
                fontWeight: 700,
                fontSize: small * 0.9,
                color: dark ? p.background : '#FBF7EE',
                background: dark ? p.circle : p.ink,
                boxShadow: `${small * 0.28}px ${small * 0.28}px 0 ${p.circle}`,
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
