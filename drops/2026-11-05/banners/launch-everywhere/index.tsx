import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Launch Everywhere',
  description: 'Launch banner for an AI ad agent: a green-phosphor terminal running one prompt, with glowing threads branching out to ad-platform chips and a ROAS readout, beside a big pixel headline.',
  tags: ['hero', 'social', 'launch', 'ads', 'ai', 'terminal'],
};

export const schema = z.object({
  eyebrow: text().default('Mycel 2.0 · now live'),
  headline: text().default('One prompt. 32 ad platforms.'),
  body: textarea().default('Your AI agent plans, launches and rebalances campaigns on Meta, Google, TikTok, Reddit and 28 more. You just approve the budget.'),
  cta: text('Button (empty to hide)').default('Start free → mycel.ai'),
  prompt: text('Terminal prompt').default('mycel launch --everywhere'),
  platforms: text('Platforms (comma separated)').default('Meta Ads, Google Ads, TikTok, Reddit, LinkedIn, YouTube, Snapchat, Pinterest'),
  stat: text('Stat chip (empty to hide)').default('4.1× ROAS'),
  font: font('Headline font').default('vt323'),
  background: color().default('#0E1A14'),
  surface: color('Terminal').default('#18291F'),
  accent: color().default('#B5E550'),
  accent2: color('Threads').default('#4E8A5B'),
  pop: color('Stat').default('#FF9F43'),
  textColor: color('Text').default('#EAF2DC'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'deep-sea': { background: '#021B26', surface: '#06303F', accent: '#2EF2C4', accent2: '#1B7FA6', pop: '#FF7A59', textColor: '#E6FFFA' },
  matcha: { background: '#EEF1E6', surface: '#1E2A1A', accent: '#6A8D3A', accent2: '#C9A227', pop: '#E85D3F', textColor: '#1E2A1A' },
  acid: { background: '#0B0B0B', surface: '#1A1A1A', accent: '#C6FF00', accent2: '#FF00E5', pop: '#00F0FF', textColor: '#F0FFE0', headline: 'Ads on autopilot. Everywhere.', font: 'pressstart' },
  'black-friday': { eyebrow: 'Black Friday · Nov 28', headline: 'Run BFCM on 32 platforms.', prompt: 'mycel plan --bfcm --budget 40k', stat: '−38% CPA', cta: 'Book a demo →' },
  minimal: { body: '', stat: '', cta: '', eyebrow: 'mycel.ai' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Terminal window + branching threads + platform chips, fitted into a box. */
function Network({ x, y, w, h, p, lines }: { x: number; y: number; w: number; h: number; p: P; lines: number }) {
  const names = p.platforms.split(',').map((s) => s.trim()).filter(Boolean);
  const termW = w * 0.54;
  const fs = Math.max(11, Math.min(termW * 0.058, h * 0.07));
  const chipH = fs * 2.1;
  const maxChips = Math.min(6, Math.max(3, Math.floor((h * 0.96) / (chipH * 1.3)) - 1));
  const chips = names.slice(0, maxChips);
  const more = Math.max(0, 32 - chips.length);
  const rows = chips.length + (more ? 1 : 0);
  const gap = Math.min(chipH * 0.55, (h - rows * chipH) / Math.max(1, rows - 1));
  const colH = rows * chipH + (rows - 1) * gap;
  const chipW = w * 0.33;
  const chipX = x + w - chipW;
  const termLines = [
    { t: `> ${p.prompt}`, c: p.textColor },
    { t: `✓ ${32} platforms connected`, c: p.accent },
    { t: '✓ 184 creatives generated', c: p.accent },
    { t: '▸ pacing $5,000/day', c: hexA(p.textColor, 0.7) },
  ].slice(0, lines);
  const termH = fs * (2.1 + 1.8 + (termLines.length + 1) * 1.55);
  const termY = y + (h - termH) / 2;
  const srcX = x + termW;
  const srcY = termY + termH * 0.55;
  const colY = y + (h - colH) / 2;
  const chipYs = Array.from({ length: rows }, (_, i) => colY + i * (chipH + gap) + chipH / 2);
  const mono: CSSProperties = { fontFamily: FONTS.mono, whiteSpace: 'nowrap' };

  return (
    <>
      {/* glow behind the terminal */}
      <div style={{ position: 'absolute', left: x - termW * 0.2, top: termY - termH * 0.4, width: termW * 1.4, height: termH * 1.8, background: `radial-gradient(ellipse, ${hexA(p.accent, 0.16)} 0%, transparent 65%)` }} />
      {/* threads: branching hyphae from the terminal to every platform */}
      <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }} width={1} height={1}>
        <defs>
          <linearGradient id="le-thread" x1="0" x2="1">
            <stop offset="0" stopColor={p.accent} stopOpacity="0.95" />
            <stop offset="1" stopColor={p.accent2} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {chipYs.map((cy, i) => {
          const midX = srcX + (chipX - srcX) * 0.42;
          const d = `M${srcX},${srcY} C${midX},${srcY} ${midX},${cy} ${chipX - fs * 0.4},${cy}`;
          return (
            <g key={i}>
              <path d={d} stroke={p.accent} strokeOpacity={0.18} strokeWidth={fs * 0.5} fill="none" />
              <path d={d} stroke="url(#le-thread)" strokeWidth={Math.max(1.2, fs * 0.11)} fill="none" strokeDasharray={i % 3 === 1 ? `${fs * 0.5} ${fs * 0.3}` : undefined} />
              {/* a packet travelling along the thread */}
              <circle cx={midX + (i % 2 ? -fs : fs * 0.6)} cy={srcY + (cy - srcY) * (i % 2 ? 0.35 : 0.62)} r={fs * 0.18} fill={p.accent} />
            </g>
          );
        })}
        <circle cx={srcX} cy={srcY} r={fs * 0.42} fill={p.background} stroke={p.accent} strokeWidth={fs * 0.12} />
        <circle cx={srcX} cy={srcY} r={fs * 0.18} fill={p.accent} />
      </svg>

      {/* terminal */}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: termY,
          width: termW,
          height: termH,
          borderRadius: fs * 0.7,
          background: `linear-gradient(170deg, ${p.surface}, ${hexA(p.surface, 0.92)})`,
          border: `1px solid ${hexA(p.accent, 0.32)}`,
          boxShadow: `0 ${fs * 1.4}px ${fs * 4}px rgba(0,0,0,0.45), 0 0 ${fs * 2}px ${hexA(p.accent, 0.12)}, inset 0 1px 0 ${hexA('#ffffff', 0.08)}`,
          overflow: 'hidden',
        }}
      >
        <div style={{ height: fs * 2.1, display: 'flex', alignItems: 'center', gap: fs * 0.4, padding: `0 ${fs * 0.8}px`, borderBottom: `1px solid ${hexA(p.accent, 0.18)}` }}>
          {[p.pop, hexA(p.textColor, 0.35), hexA(p.textColor, 0.35)].map((c, i) => (
            <span key={i} style={{ width: fs * 0.5, height: fs * 0.5, borderRadius: '50%', background: c }} />
          ))}
          <span style={{ fontFamily: FONTS.silkscreen, fontSize: fs * 0.62, letterSpacing: '0.2em', color: hexA('#EAF2DC', 0.55), marginLeft: fs * 0.5, textTransform: 'uppercase' }}>mycel — agent</span>
        </div>
        <div style={{ padding: `${fs * 0.9}px ${fs * 1}px`, display: 'flex', flexDirection: 'column', gap: fs * 0.55 }}>
          {termLines.map((l, i) => (
            <div key={i} style={{ ...mono, fontSize: fs * 0.88, color: i === 0 ? '#EAF2DC' : l.c, overflow: 'hidden', textOverflow: 'ellipsis', textShadow: `0 0 ${fs * 0.5}px ${hexA(p.accent, 0.35)}` }}>
              {l.t}
            </div>
          ))}
          <div style={{ ...mono, fontSize: fs, color: '#EAF2DC', display: 'flex', alignItems: 'center', gap: fs * 0.55 }}>
            {'>'}
            <span style={{ width: fs * 0.6, height: fs * 1.05, background: p.accent, boxShadow: `0 0 ${fs}px ${p.accent}` }} />
          </div>
        </div>
        {/* scanlines */}
        <div style={{ position: 'absolute', inset: 0, background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px)`, pointerEvents: 'none' }} />
      </div>

      {/* platform chips, all anchored to the right edge */}
      {chipYs.map((cy, i) => {
        const isMore = i === chips.length;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: chipX,
              width: chipW,
              top: cy - chipH / 2,
              height: chipH,
              boxSizing: 'border-box',
              display: 'flex',
              alignItems: 'center',
              gap: fs * 0.5,
              padding: `0 ${fs * 0.75}px`,
              borderRadius: fs * 0.45,
              background: isMore ? hexA(p.accent, 0.14) : hexA(p.surface, 0.94),
              border: `1px solid ${hexA(p.accent, isMore ? 0.6 : 0.25)}`,
              ...mono,
              fontSize: fs * 0.76,
              color: isMore ? p.accent : '#EAF2DC',
              overflow: 'hidden',
            }}
          >
            {!isMore && <span style={{ flex: 'none', width: fs * 0.42, height: fs * 0.42, borderRadius: 2, background: i % 4 === 2 ? p.pop : p.accent, boxShadow: `0 0 ${fs * 0.6}px ${i % 4 === 2 ? p.pop : p.accent}` }} />}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{isMore ? `+${more} more` : chips[i]}</span>
            {!isMore && <span style={{ marginLeft: 'auto', fontFamily: FONTS.silkscreen, fontSize: fs * 0.55, color: hexA(p.accent, 0.85), letterSpacing: '0.1em' }}>LIVE</span>}
          </div>
        );
      })}

      {/* stat chip, overlapping the terminal's lower corner */}
      {p.stat && (
        <div
          style={{
            position: 'absolute',
            left: x + termW * 0.5,
            top: termY + termH - fs * 1.1,
            padding: `${fs * 0.45}px ${fs * 0.9}px`,
            borderRadius: fs * 0.4,
            background: p.pop,
            color: '#1A0F05',
            ...displayFace('vt323'),
            fontSize: fs * 1.9,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            boxShadow: `${fs * 0.3}px ${fs * 0.3}px 0 ${hexA('#000000', 0.5)}, 0 0 ${fs * 2}px ${hexA(p.pop, 0.4)}`,
            rotate: '-3deg',
          }}
        >
          {p.stat}
        </div>
      )}
    </>
  );
}

export default function LaunchEverywhere(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const pad = stacked ? W * 0.075 : Math.max(W * 0.05, H * 0.1);

  const colW = stacked ? W - pad * 2 : W * (strip ? 0.4 : 0.44);
  // Average glyph width per face (em) so narrow pixel faces can run large and wide ones don't collide.
  const cw = ({ vt323: 0.5, pressstart: 1.0, silkscreen: 0.8, mono: 0.6, spacemono: 0.62 } as Record<string, number>)[p.font] ?? 0.56;
  const lineBudget = strip ? 1.9 : 2.2;
  const longest = Math.max(...p.headline.split(' ').map((w) => w.length)) + 1.5; // + the cursor block
  const head = Math.min(
    stacked ? W * 0.11 : H * (strip ? 0.22 : 0.19),
    (colW * lineBudget) / (Math.max(10, p.headline.length) * cw),
    colW / (longest * cw),
  );
  const small = Math.max(14, stacked ? W * 0.022 : Math.min(H * 0.034, W * 0.016));

  const box = stacked
    ? { x: pad, y: H * 0.06, w: W - pad * 2, h: H * 0.4 }
    : { x: pad + colW + W * 0.04, y: H * 0.1, w: W - (pad + colW + W * 0.04) - pad, h: H * 0.8 };

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.mono }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.07 : 0.14, size: Math.round(Math.min(W, H) / 24), color: dark ? '181,229,80' : '30,42,26' }}
        lift={dark ? 'rgba(181,229,80,0.05)' : 'rgba(255,255,255,0.6)'}
        glows={[
          { x: box.x + box.w * 0.5, y: box.y + box.h * 0.5, size: Math.max(box.w, box.h) * 1.6, color: hexA(p.accent2, dark ? 0.4 : 0.25), opacity: 0.9 },
          { x: stacked ? W * 0.2 : W * 0.1, y: H, size: Math.max(W, H) * 0.8, color: hexA(p.accent, dark ? 0.1 : 0.12), opacity: 0.8 },
        ]}
        grain={dark ? 0.06 : 0.035}
        vignette={dark ? 0.5 : 0.08}
      />

      <Network {...box} p={p} lines={strip ? 2 : 4} />

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: H * 0.5 } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.4, marginBottom: small, objectFit: 'contain', alignSelf: 'flex-start' }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: small * 0.6, fontFamily: FONTS.silkscreen, fontSize: small * 0.85, letterSpacing: '0.24em', textTransform: 'uppercase', color: dark ? p.accent : p.textColor }}>
          <span style={{ width: small * 0.6, height: small * 0.6, borderRadius: '50%', background: p.pop, boxShadow: `0 0 ${small}px ${p.pop}` }} />
          {p.eyebrow}
        </div>
        <div
          style={{
            ...displayFace(p.font),
            fontSize: head,
            lineHeight: p.font === 'vt323' ? 0.92 : 1.15,
            letterSpacing: p.font === 'vt323' ? '0' : '-0.02em',
            marginTop: small * 0.7,
            color: p.textColor,
            textShadow: dark ? `0 0 ${head * 0.25}px ${hexA(p.accent, 0.35)}` : undefined,
          }}
        >
          {/* numerals carry the accent: "32" is the hero fact */}
          {p.headline.split(/(\d[\d,.]*)/).map((part, i) => (i % 2 ? <span key={i} style={{ color: p.accent }}>{part}</span> : part))}
          <span style={{ display: 'inline-block', width: head * 0.36, height: head * 0.62, marginLeft: head * 0.12, background: p.accent, verticalAlign: 'baseline', boxShadow: dark ? `0 0 ${head * 0.2}px ${p.accent}` : undefined }} />
        </div>
        {!strip && p.body && <div style={{ fontSize: small * 1.05, lineHeight: 1.5, opacity: 0.8, marginTop: small * 0.9, maxWidth: colW * 0.95 }}>{p.body}</div>}
        {p.cta && (
          <div style={{ display: 'flex', marginTop: small * (strip ? 0.8 : 1.4) }}>
            <span
              style={{
                padding: `${small * 0.7}px ${small * 1.2}px`,
                borderRadius: small * 0.35,
                fontFamily: FONTS.mono,
                fontWeight: 700,
                fontSize: small * 0.95,
                color: dark ? p.background : '#F4F7EC',
                background: dark ? p.accent : p.textColor,
                boxShadow: `${small * 0.25}px ${small * 0.25}px 0 ${dark ? hexA(p.accent2, 0.9) : p.accent}`,
                whiteSpace: 'nowrap',
              }}
            >
              {p.cta}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
