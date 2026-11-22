import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, num, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA, rand } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: '32 Platforms Launch',
  description:
    'Launch banner for Folio: a broadsheet masthead, "32 platforms. One agent." in editorial serif, and a hero 8 × 4 ticker grid of ad platforms with the agent’s red square on the winning cell and a reallocation ticket.',
  tags: ['launch', 'social', 'ad agent', 'platforms', 'swiss', 'grid'],
};

export const schema = z.object({
  masthead: text('Masthead').default('Folio Weekly · No. 01 · 22 Nov 2026'),
  eyebrow: text().default('Now live · 32 ad platforms'),
  headline: text('Headline line 1').default('32 platforms.'),
  headline2: text('Headline line 2 (first word in accent)').default('One agent.'),
  body: textarea().default('Folio plans, launches and rebalances your campaigns across Google, Meta, TikTok, LinkedIn and 28 more, every hour, in one canvas.'),
  cta: text('Button (empty to hide)').default('Start free for 14 days'),
  url: text('URL').default('folio.ai'),
  ticket: text('Agent log line').default('Moved +$4,120 → TikTok · ROAS 4.6×'),
  winner: num(1, 32, 1, 'Agent’s cell (1–32)').default(3),
  font: font('Headline font').default('instrument'),
  background: color().default('#F5F5F0'),
  surface: color('Cells').default('#E6E6E1'),
  ink: color('Ink').default('#0A0A0A'),
  accent: color('Agent red').default('#E3000F'),
  muted: color('Graphite').default('#8C8C88'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-edition': { background: '#0D0D0F', surface: '#1C1C20', ink: '#F3EDE2', accent: '#C9A45C', muted: '#6E6A62', masthead: 'Folio Weekly · Night Edition' },
  bauhaus: { background: '#F2EBDD', surface: '#E4D9C4', ink: '#111111', accent: '#1D4E9E', muted: '#8C7E66', font: 'gloock', winner: 1, ticket: 'Moved +$2,860 → Google · CPA −18%' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', ink: '#EAF2FF', accent: '#FFDD00', muted: '#7FB2FF', headline2: 'Zero tabs.', winner: 2 },
  'black-friday': { headline: 'Black Friday.', headline2: 'Handled.', eyebrow: 'BFCM · 28 Nov – 1 Dec', body: 'Folio watches 32 platforms through the weekend and moves budget to whatever is selling, hour by hour.', cta: 'Book a 15-min demo', ticket: 'Moved +$18,400 → Meta · ROAS 6.1×', winner: 2 },
};

type P = z.infer<typeof schema> & BannerSize;

const TICKERS = [
  'GGL', 'MTA', 'TTK', 'LKD', 'AMZ', 'RDT', 'PIN', 'SNP',
  'XAD', 'MSA', 'YTB', 'ASA', 'SPT', 'TTD', 'ROK', 'CTV',
  'QRA', 'TBL', 'OUT', 'CRT', 'DV3', 'NFX', 'HLU', 'TWC',
  'UBR', 'ISC', 'WMT', 'APL', 'UNT', 'DSC', 'KRG', 'ETS',
];

/** The hero: an 8-column ticker table of platforms, the agent's cell in red. */
function Grid({ x, y, w, h, rows, p, showTicket, label }: { x: number; y: number; w: number; h: number; rows: number; p: P; showTicket: boolean; label: number }) {
  const cols = 8;
  const cw = w / cols;
  const ch = h / rows;
  const win = Math.min(p.winner, cols * rows) - 1;
  const fs = Math.min(cw * 0.26, ch * 0.3);
  const tiny = Math.max(8, fs * 0.42);
  const winC = win % cols;
  const winR = Math.floor(win / cols);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      {Array.from({ length: cols * rows }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const isWin = i === win;
        const chg = (rand(i * 3.3 + 1) * 9 - 3).toFixed(1);
        const bar = 0.2 + rand(i * 7.1) * 0.7;
        const cell: CSSProperties = {
          position: 'absolute',
          left: c * cw,
          top: r * ch,
          width: cw,
          height: ch,
          boxSizing: 'border-box',
          borderRight: `1px solid ${hexA(p.ink, 0.22)}`,
          borderBottom: `1px solid ${hexA(p.ink, 0.22)}`,
          background: isWin ? p.accent : (c + r) % 2 ? p.surface : hexA(p.surface, 0.55),
          color: isWin ? p.background : p.ink,
          padding: cw * 0.09,
          overflow: 'hidden',
        };
        return (
          <div key={i} style={cell}>
            <div style={{ fontFamily: FONTS.spacemono, fontSize: tiny, letterSpacing: '0.08em', opacity: isWin ? 0.9 : 0.55 }}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{ fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: fs, lineHeight: 1, marginTop: ch * 0.08, letterSpacing: '-0.02em' }}>{TICKERS[i]}</div>
            {ch > fs * 2.6 && (
              <div style={{ fontFamily: FONTS.spacemono, fontSize: tiny, marginTop: ch * 0.06, opacity: isWin ? 1 : 0.7 }}>{isWin ? '+$4.1K' : `${Number(chg) >= 0 ? '+' : ''}${chg}%`}</div>
            )}
            {/* spend bar along the bottom of the cell */}
            <div style={{ position: 'absolute', left: cw * 0.09, bottom: ch * 0.1, height: Math.max(2, ch * 0.035), width: (cw * 0.82) * (isWin ? 1 : bar), background: isWin ? p.background : hexA(p.ink, 0.55) }} />
          </div>
        );
      })}
      {/* outer frame, heavier on top like a table head */}
      <div style={{ position: 'absolute', inset: 0, borderTop: `${Math.max(2, h * 0.008)}px solid ${p.ink}`, borderLeft: `1px solid ${hexA(p.ink, 0.22)}`, pointerEvents: 'none' }} />
      {/* agent marker: a small red square riding the winning cell's corner */}
      <div
        style={{
          position: 'absolute',
          left: (winC + 1) * cw - cw * 0.16,
          top: winR * ch - cw * 0.16,
          width: cw * 0.32,
          height: cw * 0.32,
          background: p.ink,
          boxShadow: `0 0 0 ${Math.max(2, cw * 0.04)}px ${p.background}`,
        }}
      />
      {showTicket && p.ticket && (
        <>
          {/* hairline leader from the ticket to the agent's cell */}
          <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
            <polyline
              points={`${(winC + 1) * cw},${(winR + 1) * ch} ${(winC + 1) * cw},${h + ch * 0.35} ${w - cw * 0.1},${h + ch * 0.35}`}
              fill="none"
              stroke={p.ink}
              strokeWidth={1.4}
            />
            <circle cx={(winC + 1) * cw} cy={(winR + 1) * ch} r={3.5} fill={p.ink} />
          </svg>
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: h + ch * 0.35 - label * 1.1,
              display: 'flex',
              alignItems: 'center',
              gap: label * 0.7,
              padding: `${label * 0.55}px ${label * 0.9}px`,
              background: p.background,
              border: `1px solid ${p.ink}`,
              fontFamily: FONTS.spacemono,
              fontSize: label,
              color: p.ink,
              whiteSpace: 'nowrap',
              boxShadow: `${label * 0.35}px ${label * 0.35}px 0 ${p.ink}`,
            }}
          >
            <span style={{ width: label * 0.7, height: label * 0.7, background: p.accent }} />
            <span style={{ opacity: 0.6 }}>AGENT 14:02</span>
            {p.ticket}
          </div>
        </>
      )}
    </div>
  );
}

export default function PlatformsLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const isDark = parseInt(p.background.slice(1, 3), 16) < 90;

  // Scale unit: 1 at 1600×900; stacked layouts scale by width.
  const u = stacked ? W / 1080 : strip ? H / 560 : Math.min(W / 1600, H / 900);
  const pad = stacked ? W * 0.07 : strip ? H * 0.12 : Math.max(W * 0.05, H * 0.08);
  const mh = strip ? H * 0.11 : 54 * u; // masthead band
  const label = Math.max(11, 17 * u);

  // Instrument is condensed; wider display faces get a smaller size so lines don't wrap.
  const narrow = p.font === 'instrument' || p.font === 'anton' || p.font === 'bebas';
  const head = (strip ? H * 0.2 : stacked ? 132 * u : Math.min(150 * u, W * 0.085)) * (narrow ? 1 : 0.7);
  const colW = stacked ? W - pad * 2 : strip ? W * 0.5 : W * 0.42;

  // Grid geometry per layout.
  const rows = strip ? 2 : 4;
  const gx = stacked ? pad : strip ? W * 0.56 : W * 0.5;
  const gw = stacked ? W - pad * 2 : W - pad - gx;
  const gy = stacked ? mh + pad * 0.9 : strip ? mh + H * 0.14 : mh + pad * 1.1;
  const gh = stacked ? Math.min(gw * 0.42, H * 0.3) : strip ? H - gy - H * 0.14 : Math.min(H - gy - pad - 90 * u, gw * 0.72);

  const copyTop = stacked ? gy + gh + 120 * u : mh;

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.ink, fontFamily: FONTS.familjen, background: p.background }}>
      <Backdrop
        base={p.background}
        grid={false}
        lift={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)'}
        glows={[]}
        grain={isDark ? 0.06 : 0.05}
        vignette={isDark ? 0.45 : 0.06}
      />
      {/* 12-column hairline grid: the page underneath everything */}
      {Array.from({ length: 13 }, (_, i) => (
        <div key={i} style={{ position: 'absolute', top: mh, bottom: 0, left: pad + ((W - pad * 2) / 12) * i, width: 1, background: hexA(p.ink, 0.06) }} />
      ))}

      {/* Masthead */}
      <div style={{ position: 'absolute', left: pad, right: pad, top: 0, height: mh, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `${Math.max(2, 3 * u)}px solid ${p.ink}`, fontFamily: FONTS.spacemono, fontSize: label * 0.85, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: label * 0.6 }}>
          {p.logo ? <img src={p.logo} alt="" style={{ height: mh * 0.5, objectFit: 'contain' }} /> : <span style={{ width: label * 0.9, height: label * 0.9, background: p.accent }} />}
          <span style={{ fontWeight: 700, letterSpacing: '0.1em' }}>FOLIO</span>
        </span>
        {!strip || W > 1400 ? <span style={{ opacity: 0.7 }}>{p.masthead}</span> : null}
      </div>

      <Grid x={gx} y={gy} w={gw} h={gh} rows={rows} p={p} showTicket={!strip} label={label} />

      {/* Copy column */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: copyTop } : { top: copyTop, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: label * 0.6, fontFamily: FONTS.spacemono, fontSize: label, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
          <span style={{ width: label * 0.7, height: label * 0.7, background: p.accent }} />
          {p.eyebrow}
        </div>
        <div style={{ ...displayFace(p.font, { italic: false }), fontSize: head, lineHeight: 0.92, letterSpacing: '-0.025em', marginTop: label * (strip ? 0.5 : 1), whiteSpace: strip ? 'nowrap' : undefined }}>
          {p.headline}
          {strip ? ' ' : <br />}
          <span style={{ ...displayFace(p.font), color: p.accent }}>{p.headline2.split(' ')[0]}</span>
          <span style={displayFace(p.font)}>{p.headline2.includes(' ') ? ' ' + p.headline2.split(' ').slice(1).join(' ') : ''}</span>
        </div>
        {!strip && (
          <div style={{ fontSize: Math.max(14, 25 * u), lineHeight: 1.4, marginTop: label * 1.3, maxWidth: colW * 0.94, paddingTop: label, borderTop: `1px solid ${hexA(p.ink, 0.3)}` }}>{p.body}</div>
        )}
        {(p.cta || p.url) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: label * 1.2, marginTop: label * (strip ? 0.9 : 1.6) }}>
            {p.cta && (
              <span style={{ background: p.ink, color: p.background, padding: `${label * 0.8}px ${label * 1.3}px`, fontWeight: 700, fontSize: Math.max(13, 22 * u), whiteSpace: 'nowrap' }}>
                {p.cta} →
              </span>
            )}
            {p.url && <span style={{ fontFamily: FONTS.spacemono, fontSize: label, letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>{p.url}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
