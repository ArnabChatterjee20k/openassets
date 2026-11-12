import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Arrivals Board',
  description:
    'Customer case-study banner for Junction, the AI ad agent: the headline result set as split-flap tiles on a station arrivals board, with each ad platform listed as a line that arrived early, beside the customer headline and a read-the-story CTA.',
  tags: ['case study', 'banner', 'social', 'results', 'ads', 'transit'],
};

export const schema = z.object({
  eyebrow: text().default('Case study · Loop Fitness'),
  headline: text('Headline (line 1)').default('Every line'),
  headline2: text('Headline (line 2, accent)').default('arrived early.'),
  body: textarea().default('Loop Fitness gave Junction one brief for its spring launch. Six weeks later, cost per member was down 38% on 14 platforms.'),
  cta: text('Button (empty to hide)').default('Read the story'),
  url: text('URL').default('junction.ad/loop'),
  stat: text('Big stat (split-flap)').default('−38%'),
  statLabel: text('Stat label').default('Cost per member'),
  board: text('Board title').default('Arrivals'),
  time: text('Board clock').default('09:41'),
  row1: text('Row 1 (platform | result)').default('Meta | 4.2× ROAS'),
  row2: text('Row 2').default('TikTok | −41% CPA'),
  row3: text('Row 3').default('Google | +62% conv.'),
  row4: text('Row 4').default('CTV | 1.9M reach'),
  status: text('Row status').default('Early'),
  font: font('Headline font').default('shoulders'),
  background: color().default('#FFF8E1'),
  ink: color().default('#1C2B1A'),
  boardBg: color('Board').default('#1C2B1A'),
  boardText: color('Board text').default('#FFF8E1'),
  accent: color('Accent / line 1').default('#FF7A00'),
  accent2: color('Line 2 / status').default('#2BB24C'),
  pop: color('Line 3').default('#FF3D7F'),
  logo: image('Customer logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night line': { background: '#0E1A14', ink: '#EAF2DC', boardBg: '#050A07', boardText: '#EAF2DC', accent: '#FF9F43', accent2: '#B5E550', pop: '#FF3D7F' },
  swiss: { background: '#F5F5F0', ink: '#0A0A0A', boardBg: '#0A0A0A', boardText: '#F5F5F0', accent: '#E3000F', accent2: '#E3000F', pop: '#8C8C88', eyebrow: 'Case study · Halde Outdoor', stat: '3.1×', statLabel: 'Return on ad spend', headline: 'Spend less.', headline2: 'Arrive first.' },
  sorbet: { background: '#FFEDE1', ink: '#3D0E2A', boardBg: '#3D0E2A', boardText: '#FFEDE1', accent: '#FF4F6D', accent2: '#7B2CBF', pop: '#FFB627', font: 'anton', eyebrow: 'Black Friday recap', stat: '+212%', statLabel: 'Holiday revenue', headline: 'Black Friday,', headline2: 'right on time.' },
  blueprint: { background: '#0F3B8C', ink: '#EAF2FF', boardBg: '#061A40', boardText: '#EAF2FF', accent: '#FFDD00', accent2: '#7FB2FF', pop: '#FF7A9C', status: 'On time' },
  minimal: { body: '', cta: '', row4: '', eyebrow: 'Loop Fitness × Junction' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const splitRow = (s: string) => {
  const [a, ...b] = s.split('|');
  return { name: (a ?? '').trim(), result: b.join('|').trim() };
};

/** Split-flap tiles: one rounded tile per character, with the hinge line across the middle. */
function Flaps({ value, h, maxW, p }: { value: string; h: number; maxW: number; p: P }) {
  const chars = Array.from(value);
  const gap = h * 0.07;
  // Signs and punctuation sit on narrower flaps so they don't read as empty tiles.
  const narrow = (c: string) => /[−\-+.,×:]/.test(c);
  const units = chars.reduce((s, c) => s + (narrow(c) ? 0.6 : 1), 0);
  const tw = Math.min(h * 0.7, (maxW - gap * (chars.length - 1)) / Math.max(1, units));
  const th = Math.min(h, tw / 0.7);
  return (
    <div style={{ display: 'flex', gap }}>
      {chars.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'relative',
            width: tw * (narrow(c) ? 0.6 : 1),
            height: th,
            borderRadius: th * 0.08,
            background: `linear-gradient(180deg, ${hexA('#FFFFFF', 0.1)} 0 50%, ${hexA('#000000', 0.18)} 50% 100%), ${hexA(p.boardText, 0.08)}`,
            boxShadow: `inset 0 0 0 1px ${hexA(p.boardText, 0.1)}, 0 ${th * 0.04}px ${th * 0.08}px rgba(0,0,0,0.35)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...displayFace(p.font),
            fontSize: Math.min(th * 0.86, tw * (c === '%' ? 0.95 : 1.15)),
            lineHeight: 1,
            color: i === 0 && /[−\-+]/.test(c) ? p.accent : p.boardText,
            overflow: 'hidden',
          }}
        >
          <span style={{ translate: `0 ${th * 0.03}px` }}>{c}</span>
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: Math.max(1, th * 0.025), background: p.boardBg, opacity: 0.9 }} />
          {/* hinge pins */}
          {[0, 1].map((k) => (
            <div key={k} style={{ position: 'absolute', top: `calc(50% - ${th * 0.03}px)`, [k ? 'right' : 'left']: th * 0.02, width: th * 0.04, height: th * 0.06, borderRadius: 2, background: hexA(p.boardText, 0.25) }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Board({ x, y, w, h, p, rowsMax, compact }: { x: number; y: number; w: number; h: number; p: P; rowsMax: number; compact: boolean }) {
  const rows = [p.row1, p.row2, p.row3, p.row4].filter((r) => r.trim()).slice(0, rowsMax).map(splitRow);
  const lineColors = [p.accent, p.accent2, p.pop, p.accent];
  const pad = Math.min(w, h) * (compact ? 0.06 : 0.065);
  const head = h * (compact ? 0.15 : 0.11);
  const statH = h * (compact ? 0.4 : 0.3);
  const rowsTop = head + pad + statH + pad * (compact ? 0.6 : 1.1);
  const rowH = (h - rowsTop - pad * 0.8) / Math.max(1, rows.length);
  const fs = Math.min(rowH * 0.42, w * 0.034);
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h }}>
      {/* offset hard shadow in accent: the enamel sign look */}
      <div style={{ position: 'absolute', inset: 0, translate: `${pad * 0.35}px ${pad * 0.35}px`, borderRadius: pad * 0.7, background: p.accent }} />
      <div style={{ position: 'absolute', inset: 0, borderRadius: pad * 0.7, background: p.boardBg, overflow: 'hidden', color: p.boardText, boxShadow: `inset 0 0 0 ${Math.max(2, pad * 0.08)}px ${hexA(p.boardText, 0.08)}` }}>
        {/* header band */}
        <div style={{ height: head, display: 'flex', alignItems: 'center', gap: head * 0.22, padding: `0 ${pad}px`, borderBottom: `${Math.max(1, head * 0.04)}px solid ${hexA(p.boardText, 0.14)}` }}>
          {[p.accent, p.accent2, p.pop].map((c, i) => (
            <span key={i} style={{ width: head * 0.34, height: head * 0.34, borderRadius: '50%', background: c, flex: 'none' }} />
          ))}
          <span style={{ ...displayFace('shoulders'), fontSize: head * 0.56, letterSpacing: '0.06em', textTransform: 'uppercase', marginLeft: head * 0.1, whiteSpace: 'nowrap' }}>{p.board}</span>
          <span style={{ marginLeft: 'auto', fontFamily: FONTS.mono, fontWeight: 700, fontSize: head * 0.32, letterSpacing: '0.16em', color: p.accent2, whiteSpace: 'nowrap' }}>● {p.time}</span>
        </div>
        {/* hero stat */}
        <div style={{ position: 'absolute', left: pad, right: pad, top: head + pad, height: statH, display: 'flex', alignItems: 'center', gap: pad * 0.8 }}>
          <Flaps value={p.stat} h={statH} maxW={(w - pad * 2) * (compact ? 0.62 : 0.66)} p={p} />
          <div style={{ fontFamily: FONTS.mono, fontWeight: 700, fontSize: Math.max(11, statH * 0.13), letterSpacing: '0.18em', textTransform: 'uppercase', lineHeight: 1.35, opacity: 0.85, minWidth: 0 }}>{p.statLabel}</div>
        </div>
        {/* arrival rows */}
        <div style={{ position: 'absolute', left: pad, right: pad, top: rowsTop }}>
          {rows.map((r, i) => (
            <div key={i} style={{ height: rowH, display: 'flex', alignItems: 'center', gap: fs * 0.8, borderTop: `1px solid ${hexA(p.boardText, 0.12)}`, fontFamily: FONTS.mono, fontWeight: 700, fontSize: fs, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              <span style={{ width: fs * 1.15, height: fs * 1.15, borderRadius: '50%', background: lineColors[i], boxShadow: `inset 0 0 0 ${fs * 0.3}px ${lineColors[i]}, inset 0 0 0 ${fs * 0.58}px ${p.boardBg}`, flex: 'none' }} />
              <span style={{ opacity: 0.6, fontWeight: 400 }}>L0{i + 1}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
              <span style={{ marginLeft: 'auto', ...displayFace(p.font), fontSize: fs * 1.45, letterSpacing: '0.02em', color: p.boardText }}>{r.result}</span>
              {!compact && p.status && (
                <span style={{ padding: `${fs * 0.22}px ${fs * 0.55}px`, borderRadius: fs * 0.25, background: p.accent2, color: p.boardBg, fontSize: fs * 0.8, letterSpacing: '0.14em' }}>{p.status}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ArrivalsBoard(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const pad = stacked ? W * 0.075 : strip ? H * 0.12 : Math.max(W * 0.05, H * 0.09);

  const boardW = stacked ? W - pad * 2 : W * (strip ? 0.42 : 0.47);
  const boardH = stacked ? H * 0.42 : H - pad * 2;
  const boardX = stacked ? pad : W - pad - boardW;
  const boardY = pad;

  const colX = pad;
  const colW = stacked ? W - pad * 2 : boardX - pad * 2;
  const head = stacked ? Math.min(W * 0.1, H * 0.085) : Math.min(H * (strip ? 0.26 : 0.15), colW * (strip ? 0.15 : 0.17));
  const small = Math.max(13, stacked ? W * 0.024 : Math.min(head * 0.26, H * 0.04));
  const lines = [p.headline, p.headline2].filter(Boolean);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.ink, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.14, size: Math.round(Math.min(W, H) / 24), color: dark ? '255,255,255' : '28,43,26' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'}
        glows={[
          { x: boardX + boardW * 0.5, y: boardY + boardH * 0.5, size: Math.max(W, H) * 0.75, color: hexA(p.accent, 0.35), opacity: dark ? 0.6 : 0.45 },
          { x: 0, y: 0, size: Math.max(W, H) * 0.6, color: hexA(p.accent2, 0.3), opacity: dark ? 0.45 : 0.3 },
        ]}
        grain={dark ? 0.06 : 0.04}
        vignette={dark ? 0.5 : 0.06}
      />

      {/* a route line runs behind the board, out of frame on both sides */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {(() => {
          const lw = Math.max(6, Math.min(W, H) * 0.022);
          const yy = stacked ? boardY + boardH + H * 0.04 : H - pad * 0.45;
          const x45 = stacked ? W * 0.62 : boardX - pad * 0.4;
          return (
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={`${-lw},${yy} ${x45},${yy} ${x45 + H * 0.4},${yy - H * 0.4}`} stroke={p.background} strokeWidth={lw * 1.8} />
              <polyline points={`${-lw},${yy} ${x45},${yy} ${x45 + H * 0.4},${yy - H * 0.4}`} stroke={p.accent2} strokeWidth={lw} />
              <circle cx={stacked ? W * 0.3 : colX + colW * 0.55} cy={yy} r={lw * 0.85} fill={p.background} stroke={p.ink} strokeWidth={lw * 0.35} />
            </g>
          );
        })()}
      </svg>

      <Board x={boardX} y={boardY} w={boardW} h={boardH} p={p} rowsMax={strip ? 2 : stacked ? 3 : 4} compact={strip} />

      {/* Copy */}
      <div
        style={{
          position: 'absolute',
          left: colX,
          width: colW,
          ...(stacked ? { top: boardY + boardH + H * 0.065 } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small * 0.8, objectFit: 'contain', alignSelf: 'flex-start' }} />}
        <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: small * 0.55, fontFamily: FONTS.mono, fontWeight: 700, fontSize: small * 0.82, letterSpacing: '0.22em', textTransform: 'uppercase', lineHeight: 1.3 }}>
          <span style={{ width: small * 0.8, height: small * 0.8, borderRadius: '50%', border: `${small * 0.2}px solid ${p.ink}`, background: p.background, boxSizing: 'border-box', flex: 'none' }} />
          <span style={{ width: small * 1.6, height: small * 0.28, background: p.accent2, borderRadius: 99, marginLeft: -small * 0.55, flex: 'none' }} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: small, marginTop: small * (strip ? 0.7 : 1.3), flexWrap: 'wrap' }}>
            {p.cta && (
              <span style={{ padding: `${small * 0.6}px ${small * 1.2}px`, borderRadius: 999, fontWeight: 800, fontSize: small * 0.95, color: dark ? p.background : '#FFF8E1', background: dark ? p.accent : p.ink, boxShadow: `${small * 0.25}px ${small * 0.25}px 0 ${p.accent}`, whiteSpace: 'nowrap' }}>
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
