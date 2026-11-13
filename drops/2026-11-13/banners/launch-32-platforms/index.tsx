import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA, rand } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Launch: 32 Platforms',
  description: 'Launch banner for Pike: a shouting placard headline beside a frozen field of 24 ice holes, one per ad platform, wired under the ice to the agent, with three orange tip-up flags sprung where conversions landed.',
  tags: ['launch', 'hero', 'social', 'ad agent', 'platforms'],
};

export const schema = z.object({
  eyebrow: text().default('Pike 2.0 · Live on 32 platforms'),
  headline: text().default('Fish every feed.'),
  body: textarea().default('One AI agent runs your ads on Meta, Google, TikTok and 29 more, and moves budget to whatever is biting.'),
  cta: text('Button (empty to hide)').default('Start free, 14 days'),
  url: text('URL').default('pike.ai'),
  chip1: text('Flag chip 1').default('TikTok · ROAS 4.8×'),
  chip2: text('Flag chip 2').default('Reddit · CPA −31%'),
  font: font('Headline font').default('climate'),
  background: color().default('#E9EEF1'),
  ice: color('Ice').default('#D3DDE3'),
  ink: color('Text').default('#17242E'),
  accent: color().default('#2F6F8F'),
  frost: color('Frost').default('#A7C4D4'),
  flag: color('Flag').default('#E4572E'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'polar-night': { background: '#0E1A22', ice: '#1C2E3A', ink: '#E9EEF1', accent: '#A7C4D4', frost: '#2F6F8F', flag: '#E4572E' },
  blueprint: { background: '#0F3B8C', ice: '#134AA8', ink: '#EAF2FF', accent: '#FFFFFF', frost: '#7FB2FF', flag: '#FFDD00', headline: '32 feeds. 1 agent.' },
  swiss: { font: 'archivo', background: '#F5F5F0', ice: '#E6E6E1', ink: '#0A0A0A', accent: '#0A0A0A', frost: '#8C8C88', flag: '#E3000F', headline: 'Fish every feed.' },
  'forest-moss': { background: '#0E1A14', ice: '#18291F', ink: '#EAF2DC', accent: '#B5E550', frost: '#4E8A5B', flag: '#FF9F43', eyebrow: 'Black Friday ready', headline: 'Spend where it bites.' },
  minimal: { chip1: '', chip2: '', body: 'Ads on 32 platforms, run by one agent.', cta: '' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const PLATFORMS = ['META', 'GOOGLE', 'TIKTOK', 'YOUTUBE', 'LINKEDIN', 'REDDIT', 'SNAP', 'PINTEREST', 'AMAZON', 'SPOTIFY', 'X', 'CTV'];
const N = 5; // 5×5 field, centre is the agent
const SX = 54;
const SY = 31;
const VB_W = 640;
const VB_H = 470;
const CX = 320;
const CY0 = 92;
const at = (i: number, j: number): [number, number] => [CX + (i - j) * SX, CY0 + (i + j) * SY];
// Holes where the flag has sprung, and which chip (if any) hangs off them.
const POPPED: Record<string, 1 | 2 | 0> = { '3,1': 1, '1,3': 2, '4,3': 0 };

/** The frozen field: an iso slab of ice with 24 holes + tip-ups wired to the agent. */
function IceField({ p }: { p: P }) {
  const dark = isDark(p.background);
  const ink = p.ink;
  const [ax, ay] = at(2, 2);
  const corners = [at(-0.75, -0.75), at(N - 0.25, -0.75), at(N - 0.25, N - 0.25), at(-0.75, N - 0.25)];
  const T = 22; // slab thickness
  const top = corners.map(([x, y]) => `${x},${y}`).join(' ');
  const [l, b, r] = [corners[3], corners[2], corners[1]];
  const holes: { i: number; j: number; x: number; y: number; k: number }[] = [];
  let k = 0;
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      if (i === 2 && j === 2) continue;
      const [x, y] = at(i, j);
      holes.push({ i, j, x, y, k: k++ });
    }
  const chip = (x: number, y: number, label: string, flip: boolean) => {
    if (!label) return null;
    const fs = 15;
    const w = label.length * fs * 0.61 + 40;
    const h = 34;
    const x0 = flip ? x - w - 8 : x + 8;
    return (
      <g>
        <rect x={x0 + 4} y={y - h / 2 + 5} width={w} height={h} rx={6} fill={ink} />
        <rect x={x0} y={y - h / 2} width={w} height={h} rx={6} fill={dark ? p.ice : '#F7F9FA'} stroke={ink} strokeWidth={2} />
        <circle cx={x0 + 16} cy={y} r={5} fill={p.flag} />
        <text x={x0 + 28} y={y + 5} fontFamily={FONTS.spacemono} fontSize={fs} fontWeight={700} fill={ink}>
          {label}
        </text>
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%" style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id="pk-ice" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={dark ? hexA(p.frost, 0.5) : '#F4F7F9'} />
          <stop offset="1" stopColor={p.ice} />
        </linearGradient>
        <radialGradient id="pk-water">
          <stop offset="0" stopColor={p.accent} />
          <stop offset="1" stopColor={ink} />
        </radialGradient>
        <filter id="pk-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>
      {/* cast shadow + slab sides */}
      <polygon points={`${l[0] + 10},${l[1] + T + 14} ${b[0] + 10},${b[1] + T + 14} ${r[0] + 10},${r[1] + T + 14}`} fill={ink} opacity={0.18} filter="url(#pk-blur)" />
      <polygon points={`${l[0]},${l[1]} ${b[0]},${b[1]} ${b[0]},${b[1] + T} ${l[0]},${l[1] + T}`} fill={dark ? p.frost : p.frost} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <polygon points={`${b[0]},${b[1]} ${r[0]},${r[1]} ${r[0]},${r[1] + T} ${b[0]},${b[1] + T}`} fill={dark ? hexA(p.frost, 0.6) : '#C3D4DE'} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <polygon points={top} fill="url(#pk-ice)" stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* frost cracks */}
      {Array.from({ length: 9 }, (_, n) => {
        const [x, y] = at(rand(n * 3.3) * 4.4 - 0.4, rand(n * 7.9) * 4.4 - 0.4);
        const a = rand(n * 1.7) * Math.PI;
        const len = 18 + rand(n * 5.1) * 26;
        return <path key={n} d={`M${x},${y} l${Math.cos(a) * len},${Math.sin(a) * len * 0.55} l${Math.cos(a + 0.7) * len * 0.5},${Math.sin(a + 0.7) * len * 0.3}`} stroke={hexA(p.accent, 0.35)} strokeWidth={1.4} fill="none" />;
      })}
      {/* lines under the ice: every hole wired to the agent */}
      {holes.map((h) => (
        <line key={`l${h.k}`} x1={ax} y1={ay} x2={h.x} y2={h.y} stroke={POPPED[`${h.i},${h.j}`] !== undefined ? p.flag : p.accent} strokeWidth={POPPED[`${h.i},${h.j}`] !== undefined ? 2.4 : 1.4} strokeDasharray="2 5" strokeLinecap="round" opacity={0.75} />
      ))}
      {/* holes, tip-ups and labels, back to front */}
      {holes.map((h) => {
        const popped = POPPED[`${h.i},${h.j}`] !== undefined;
        const label = PLATFORMS[h.k % PLATFORMS.length];
        return (
          <g key={h.k}>
            <ellipse cx={h.x} cy={h.y} rx={23} ry={12.5} fill={dark ? hexA('#ffffff', 0.18) : '#FFFFFF'} stroke={ink} strokeWidth={1.5} />
            <ellipse cx={h.x} cy={h.y + 1} rx={15} ry={8} fill="url(#pk-water)" />
            {/* cross frame */}
            <line x1={h.x - 20} y1={h.y + 1} x2={h.x + 20} y2={h.y - 1} stroke={ink} strokeWidth={2.4} strokeLinecap="round" />
            {popped ? (
              <g>
                <line x1={h.x} y1={h.y} x2={h.x} y2={h.y - 56} stroke={ink} strokeWidth={2.4} strokeLinecap="round" />
                <path d={`M${h.x},${h.y - 58} L${h.x + 30},${h.y - 49} L${h.x},${h.y - 40} Z`} fill={p.flag} stroke={ink} strokeWidth={1.6} strokeLinejoin="round" />
                <ellipse cx={h.x} cy={h.y} rx={30} ry={16} fill="none" stroke={p.flag} strokeWidth={1.6} opacity={0.6} />
              </g>
            ) : (
              <line x1={h.x} y1={h.y} x2={h.x + 22} y2={h.y - 9} stroke={ink} strokeWidth={2} strokeLinecap="round" opacity={0.8} />
            )}
            {h.k < 12 && (h.i + h.j) % 2 === 0 && !popped && (
              <text x={h.x} y={h.y + 26} textAnchor="middle" fontFamily={FONTS.spacemono} fontSize={10.5} fontWeight={700} letterSpacing={1.2} fill={ink} opacity={0.7}>
                {label}
              </text>
            )}
          </g>
        );
      })}
      {/* the agent at the centre */}
      <ellipse cx={ax} cy={ay + 6} rx={40} ry={20} fill={ink} opacity={0.2} filter="url(#pk-blur)" />
      <circle cx={ax} cy={ay - 8} r={27} fill={ink} />
      <circle cx={ax} cy={ay - 8} r={27} fill="none" stroke={p.accent} strokeWidth={3} opacity={0.9} />
      <path d={`M${ax},${ay - 26} C${ax + 3},${ay - 12} ${ax + 4},${ay - 11} ${ax + 18},${ay - 8} C${ax + 4},${ay - 5} ${ax + 3},${ay - 4} ${ax},${ay + 10} C${ax - 3},${ay - 4} ${ax - 4},${ay - 5} ${ax - 18},${ay - 8} C${ax - 4},${ay - 11} ${ax - 3},${ay - 12} ${ax},${ay - 26} Z`} fill={dark ? p.background : '#F4F7F9'} />
      {/* chips hang off two of the sprung flags */}
      {Object.entries(POPPED).map(([key, c]) => {
        if (!c) return null;
        const [i, j] = key.split(',').map(Number);
        const [x, y] = at(i, j);
        return <g key={key}>{chip(c === 1 ? x + 26 : x - 4, y - 50, c === 1 ? p.chip1 : p.chip2, c === 2)}</g>;
      })}
    </svg>
  );
}

export default function Launch32Platforms(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const pad = stacked ? W * 0.08 : Math.max(W * 0.05, H * 0.1);

  // Visual box keeps the field's aspect (640:470).
  const vH = stacked ? H * 0.4 : strip ? H * 0.98 : Math.min(H * 0.9, W * 0.45 * (VB_H / VB_W));
  const vW = vH * (VB_W / VB_H);
  const vx = stacked ? (W - vW) / 2 : W - pad * (strip ? 0.6 : 0.7) - vW;
  const vy = stacked ? H * 0.06 : (H - vH) / 2 + (strip ? H * 0.03 : 0);

  const colW = stacked ? W - pad * 2 : vx - pad - W * 0.02;
  // Climate Crisis is very wide; size by the longest line so it never overflows.
  const words = p.headline.split(' ');
  const mid = Math.ceil(words.length / 2);
  const lines = strip ? [p.headline] : [words.slice(0, mid).join(' '), words.slice(mid).join(' ')].filter(Boolean);
  const longest = Math.max(...lines.map((s) => s.length));
  const wide = p.font === 'climate' ? 0.84 : 0.62;
  const head = Math.min(stacked ? W * 0.1 : H * (strip ? 0.2 : 0.17), (colW / (longest * wide)) * 0.97);
  const small = Math.max(Math.min(stacked ? W * 0.03 : H * (strip ? 0.065 : 0.036), head * 0.42), 13);
  const accentText = dark ? p.accent : p.accent;

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.ink, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.16, size: Math.round(Math.min(W, H) / 26), color: dark ? '255,255,255' : '23,36,46' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)'}
        glows={[
          { x: vx + vW / 2, y: vy + vH / 2, size: Math.max(vW, vH) * 1.5, color: hexA(p.frost, dark ? 0.35 : 0.55), opacity: 0.9 },
          { x: W * 0.05, y: H * 0.05, size: Math.max(W, H) * 0.6, color: hexA(p.accent, dark ? 0.15 : 0.1), opacity: 0.7 },
        ]}
        grain={dark ? 0.06 : 0.04}
        vignette={dark ? 0.5 : 0.06}
      />

      <div style={{ position: 'absolute', left: vx, top: vy, width: vW, height: vH }}>
        <IceField p={strip ? { ...p, chip1: '', chip2: '' } : p} />
      </div>

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: H * 0.49, textAlign: 'center' as const } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        <div style={{ display: 'flex', justifyContent: stacked ? 'center' : 'flex-start' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: small * 0.55,
              fontFamily: FONTS.spacemono,
              fontWeight: 700,
              fontSize: Math.min(small * 0.82, colW / (p.eyebrow.length * 0.8 + 2.5)),
              letterSpacing: '0.18em',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              color: p.ink,
            }}
          >
            <svg width={small * 0.9} height={small * 1.1} viewBox="0 0 18 22" style={{ flex: 'none' }}>
              <line x1="2" y1="2" x2="2" y2="21" stroke={p.ink} strokeWidth="2.4" strokeLinecap="round" />
              <path d="M2 2 L17 6.5 L2 11 Z" fill={p.flag} />
            </svg>
            {p.eyebrow}
          </span>
        </div>
        <div
          style={{
            ...displayFace(p.font),
            fontSize: head,
            lineHeight: 0.98,
            letterSpacing: p.font === 'climate' ? '-0.02em' : '-0.035em',
            textTransform: 'uppercase',
            marginTop: small * 0.8,
            color: p.ink,
          }}
        >
          {lines.map((l, i) => (
            <div key={i} style={{ whiteSpace: 'nowrap', color: i === lines.length - 1 && lines.length > 1 ? accentText : p.ink }}>
              {l}
            </div>
          ))}
        </div>
        {!strip && <div style={{ fontSize: small * 1.12, lineHeight: 1.4, marginTop: small * 0.9, maxWidth: stacked ? colW : colW * 0.92, marginInline: stacked ? 'auto' : undefined, fontWeight: 500 }}>{p.body}</div>}
        {(p.cta || p.url) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: small, justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.7 : 1.3) }}>
            {p.cta && (
              <span
                style={{
                  padding: `${small * 0.6}px ${small * 1.2}px`,
                  borderRadius: small * 0.4,
                  fontWeight: 700,
                  fontSize: small * 0.98,
                  color: dark ? p.background : '#F4F7F9',
                  background: p.ink,
                  boxShadow: `${small * 0.25}px ${small * 0.28}px 0 ${p.flag}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {p.cta} →
              </span>
            )}
            {p.url && <span style={{ fontFamily: FONTS.spacemono, fontSize: small * 0.85, letterSpacing: '0.08em', opacity: 0.8 }}>{p.url}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
