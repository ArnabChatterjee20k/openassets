import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA, rand } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: '36 Platforms Launch',
  description: 'Launch banner for Mimo: a friendly two-line headline beside a glossy Y2K chat window where one prompt fans out to 36 ad platforms.',
  tags: ['launch', 'banner', 'ads', 'ai agent', 'y2k', 'chat'],
};

export const schema = z.object({
  eyebrow: text().default('New · Mimo 1.0'),
  line1: text('Headline line 1').default('One chat.'),
  line2: text('Headline line 2').default('36 ad platforms.'),
  body: textarea().default('Tell Mimo what you sell. It writes the ads, sets the budgets and runs them on Google, Meta, TikTok, Reddit and 32 more.'),
  cta: text('Button (empty to hide)').default('Start free'),
  note: text('Handwritten note').default('no card needed!'),
  prompt: textarea('Your message').default('Sell my $38 linen tote to plant lovers in Austin. $150/day.'),
  reply: text('Mimo reply').default('On it! 6 ads drafted, launching on 12 platforms.'),
  platforms: text('Platform chips (comma separated)').default('Google, Meta, TikTok, Reddit, Pinterest, Snap'),
  font: font('Headline font').default('fredoka'),
  background: color().default('#DADDE3'),
  surface: color('Window').default('#C3C8D1'),
  ink: color('Text').default('#101219'),
  accent: color().default('#3D5AFE'),
  pop: color('Pop').default('#FF3DB4'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  lilac: { background: '#E9E3F5', surface: '#D6CCEC', ink: '#231942', accent: '#5E4AE3', pop: '#2EC4B6' },
  candy: { background: '#FDF3F8', surface: '#F7DDEB', ink: '#3A1F4A', accent: '#FF7EB6', pop: '#8A7BFF', line2: '36 places to sell.' },
  ultraviolet: { background: '#12001F', surface: '#3A0A5E', ink: '#FBEFFF', accent: '#B026FF', pop: '#FFD600', note: 'launch night!' },
  nordic: { background: '#E9EEF1', surface: '#D3DDE3', ink: '#17242E', accent: '#2F6F8F', pop: '#E4572E', font: 'outfit', eyebrow: 'Now in beta', cta: 'Join the beta', note: '' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Four-point Y2K sparkle with a chrome gradient. */
function Sparkle({ x, y, s, c, id, rot = 0 }: { x: number; y: number; s: number; c: string; id: string; rot?: number }) {
  return (
    <svg viewBox="-50 -50 100 100" style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, overflow: 'visible', rotate: `${rot}deg` }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.45" stopColor={c} />
          <stop offset="1" stopColor="#7F8796" />
        </linearGradient>
      </defs>
      <path d="M0 -50 C6 -12 12 -6 50 0 C12 6 6 12 0 50 C-6 12 -12 6 -50 0 C-12 -6 -6 -12 0 -50Z" fill={`url(#${id})`} stroke="#ffffff" strokeOpacity={0.7} strokeWidth={1.5} />
    </svg>
  );
}

/** Mimo's tiny pod face, used as the chat avatar. */
function PodFace({ size, accent }: { size: number; accent: string }) {
  return (
    <svg viewBox="0 0 40 46" width={size} height={size * 1.15} style={{ flex: 'none' }}>
      <defs>
        <radialGradient id="pod-shell" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.7" stopColor="#E3E6EC" />
          <stop offset="1" stopColor="#AEB4C0" />
        </radialGradient>
      </defs>
      <path d="M20 2C30 2 38 14 38 27S30 44 20 44 2 40 2 27 10 2 20 2Z" fill="url(#pod-shell)" stroke="#9AA1AE" strokeWidth="1" />
      <rect x="9" y="13" width="22" height="17" rx="5" fill="#1B1F2B" />
      <rect x="11" y="15" width="18" height="13" rx="3.5" fill={accent} opacity="0.35" />
      <rect x="11" y="15" width="18" height="13" rx="3.5" fill="#ffffff" opacity="0.55" />
      <rect x="15" y="18" width="2.4" height="4" fill="#101219" />
      <rect x="22.6" y="18" width="2.4" height="4" fill="#101219" />
      <rect x="17" y="24" width="6" height="1.6" fill="#101219" />
      <circle cx="15" cy="36" r="2" fill={accent} />
      <circle cx="20" cy="37" r="2.3" fill={accent} />
      <circle cx="25" cy="36" r="2" fill={accent} />
    </svg>
  );
}

/** The chat window, designed on a 560 × 440 canvas and scaled to fit. */
function ChatWindow({ p, compact }: { p: P; compact: boolean }) {
  const dark = isDark(p.background);
  const chrome = `linear-gradient(180deg, #FFFFFF 0%, ${p.surface} 55%, ${dark ? p.surface : '#9AA1AE'} 100%)`;
  const chips = p.platforms
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, compact ? 4 : 6);
  const bodyBg = dark ? hexA('#FFFFFF', 0.08) : hexA('#FFFFFF', 0.72);
  const txt = dark ? p.ink : '#101219';
  const bubble: CSSProperties = { borderRadius: 26, padding: '14px 20px', fontFamily: FONTS.outfit, fontSize: 21, lineHeight: 1.3, fontWeight: 500 };
  return (
    <div
      style={{
        width: 560,
        height: compact ? 330 : 440,
        borderRadius: 34,
        background: chrome,
        padding: 10,
        boxShadow: `0 40px 80px ${hexA(dark ? '#000000' : '#30364A', dark ? 0.55 : 0.28)}, 0 8px 0 ${hexA('#ffffff', dark ? 0.08 : 0.6)} inset, 0 -3px 0 ${hexA('#000000', 0.12)} inset`,
        border: `1.5px solid ${hexA('#ffffff', dark ? 0.2 : 0.9)}`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* title bar with gel traffic lights */}
      <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 9, padding: '0 14px' }}>
        {[p.pop, '#FFC94D', p.accent].map((c, i) => (
          <span key={i} style={{ width: 16, height: 16, borderRadius: 99, background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${c} 45%, ${c} 100%)`, boxShadow: `0 1px 2px ${hexA('#000000', 0.3)}` }} />
        ))}
        <span style={{ flex: 1, textAlign: 'center', marginRight: 66, fontFamily: FONTS.outfit, fontWeight: 500, fontSize: 17, color: '#101219', opacity: 0.65, letterSpacing: '0.02em' }}>Mimo — New campaign</span>
      </div>
      <div style={{ flex: 1, borderRadius: 26, background: bodyBg, border: `1px solid ${hexA(dark ? '#ffffff' : '#101219', 0.08)}`, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }}>
        {/* user prompt */}
        <div
          style={{
            ...bubble,
            alignSelf: 'flex-end',
            maxWidth: 400,
            color: '#F7F8FB',
            background: `linear-gradient(180deg, ${hexA('#ffffff', 0.35)} 0%, ${p.accent} 45%, ${p.accent} 100%)`,
            backgroundColor: p.accent,
            borderBottomRightRadius: 8,
            boxShadow: `0 10px 24px ${hexA(p.accent, 0.35)}, inset 0 1px 0 ${hexA('#ffffff', 0.6)}`,
          }}
        >
          {p.prompt}
        </div>
        {/* Mimo reply */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <PodFace size={40} accent={p.accent} />
          <div style={{ ...bubble, color: txt, background: dark ? hexA('#ffffff', 0.12) : '#FFFFFF', borderBottomLeftRadius: 8, boxShadow: `0 6px 18px ${hexA('#30364A', 0.12)}`, maxWidth: 420 }}>
            {p.reply}
          </div>
        </div>
        {/* platform chips fanning out */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingLeft: 52 }}>
          {chips.map((c, i) => (
            <span
              key={c + i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 13px',
                borderRadius: 99,
                fontFamily: FONTS.outfit,
                fontWeight: 500,
                fontSize: 16,
                color: txt,
                background: dark ? hexA('#ffffff', 0.1) : hexA(p.surface, 0.6),
                border: `1px solid ${hexA(dark ? '#ffffff' : '#101219', 0.1)}`,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 9, background: i === 0 ? p.pop : p.accent }} />
              {c}
            </span>
          ))}
          <span style={{ padding: '7px 13px', borderRadius: 99, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 16, color: '#ffffff', background: p.pop }}>+30</span>
        </div>
        {!compact && (
          /* launch progress */
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONTS.outfit, fontSize: 16, fontWeight: 500, color: txt }}>
            <span style={{ opacity: 0.75 }}>Launching</span>
            <div style={{ flex: 1, height: 14, borderRadius: 99, background: hexA(dark ? '#ffffff' : '#101219', 0.08), overflow: 'hidden', boxShadow: `inset 0 1px 2px ${hexA('#000000', 0.15)}` }}>
              <div
                style={{
                  width: '68%',
                  height: '100%',
                  borderRadius: 99,
                  background: `repeating-linear-gradient(115deg, ${p.accent} 0 12px, ${hexA(p.accent, 0.75)} 12px 24px)`,
                  boxShadow: `inset 0 2px 0 ${hexA('#ffffff', 0.5)}`,
                }}
              />
            </div>
            <span style={{ fontWeight: 800 }}>8/12</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PlatformsLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const pad = stacked ? W * 0.08 : Math.max(W * 0.055, H * 0.1);

  // Hero box: right side (wide), top (stacked).
  const box = stacked ? { x: pad, y: H * 0.07, w: W - pad * 2, h: H * 0.42 } : { x: W * (strip ? 0.56 : 0.52), y: H * 0.1, w: W * (strip ? 0.4 : 0.44) - pad * 0.3, h: H * 0.8 };
  const winH = strip ? 330 : 440;
  const s = Math.min(box.w / 600, box.h / (winH + 30));
  const winX = box.x + (box.w - 560 * s) / 2;
  const winY = box.y + (box.h - winH * s) / 2;

  const colW = stacked ? W - pad * 2 : W * (strip ? 0.5 : 0.46);
  const longest = Math.max(p.line1.length, p.line2.length, 8);
  // Fredoka sets about 0.46em per character; fit the longest line to the column.
  const head = Math.min(stacked ? W * 0.082 :H * (strip ? 0.2 : 0.15), (colW / longest) * 2.05);
  const small = Math.max(head * 0.3, 14);
  const fg = dark ? p.ink : p.ink;

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: fg, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.16, size: Math.round(Math.min(W, H) / 24), color: dark ? '255,255,255' : '16,18,25' }}
        lift={dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.75)'}
        glows={[
          { x: winX + 280 * s, y: winY + (winH / 2) * s, size: 900 * s, color: hexA(p.accent, dark ? 0.45 : 0.32), opacity: 0.9 },
          { x: winX + 560 * s, y: winY, size: 500 * s, color: hexA(p.pop, dark ? 0.4 : 0.3), opacity: 0.8 },
        ]}
        grain={dark ? 0.05 : 0.03}
        vignette={dark ? 0.5 : 0.12}
      />
      {/* chrome horizon band: brushed-metal sheen behind the window */}
      {!dark && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: winY + winH * s * 0.62, height: winH * s * 0.5, background: `linear-gradient(180deg, transparent, ${hexA('#ffffff', 0.55)} 45%, ${hexA('#9AA1AE', 0.25)} 55%, transparent)`, opacity: 0.8 }} />
      )}

      {/* window */}
      <div style={{ position: 'absolute', left: winX, top: winY, width: 560, transformOrigin: '0 0', scale: String(s) }}>
        <ChatWindow p={p} compact={strip} />
      </div>
      {/* sparkles + ping bubble around the window */}
      <Sparkle x={winX - 18 * s} y={winY + 40 * s} s={74 * s} c={p.accent} id="sp-a" rot={8} />
      <Sparkle x={winX + 590 * s} y={winY + (winH - 40) * s} s={56 * s} c={p.pop} id="sp-b" rot={-10} />
      {Array.from({ length: 5 }, (_, i) => (
        <Sparkle key={i} x={winX + (rand(i * 4.1) * 1.2 - 0.1) * 560 * s} y={winY + (i % 2 ? -26 : winH + 26) * s + rand(i * 9.3) * 20 * s} s={(14 + rand(i * 2.7) * 16) * s} c={p.accent} id={`sp-${i}`} />
      ))}
      <div
        style={{
          position: 'absolute',
          left: winX + 470 * s,
          top: winY - 34 * s,
          padding: `${12 * s}px ${20 * s}px`,
          borderRadius: 99 * s,
          background: `linear-gradient(180deg, ${hexA('#ffffff', 0.5)} 0%, ${p.pop} 50%)`,
          backgroundColor: p.pop,
          color: '#ffffff',
          fontFamily: FONTS.fredoka,
          fontWeight: 600,
          fontSize: 24 * s,
          whiteSpace: 'nowrap',
          boxShadow: `0 ${10 * s}px ${24 * s}px ${hexA(p.pop, 0.45)}`,
          rotate: '6deg',
        }}
      >
        ● ● ●
      </div>

      {/* copy */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked
            ? { top: H * 0.53, bottom: H * 0.06, textAlign: 'center' as const, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', alignItems: 'center' }
            : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        <div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: small * 0.5,
              padding: `${small * 0.35}px ${small * 0.85}px`,
              borderRadius: 999,
              background: dark ? hexA('#ffffff', 0.08) : hexA('#ffffff', 0.7),
              border: `1px solid ${hexA(dark ? '#ffffff' : '#101219', 0.12)}`,
              boxShadow: `inset 0 1px 0 ${hexA('#ffffff', dark ? 0.15 : 1)}`,
              fontSize: small * 0.85,
              fontWeight: 500,
              color: fg,
            }}
          >
            <span style={{ width: small * 0.5, height: small * 0.5, borderRadius: '50%', background: p.pop, boxShadow: `0 0 ${small * 0.6}px ${p.pop}` }} />
            {p.eyebrow}
          </span>
        </div>
        <div style={{ ...displayFace(p.font), fontSize: head, lineHeight: 0.98, letterSpacing: '-0.025em', marginTop: small * 0.7 }}>
          <div style={{ color: fg }}>{p.line1}</div>
          <div
            style={{
              backgroundImage: `linear-gradient(170deg, ${p.accent} 30%, ${dark ? '#ffffff' : '#101219'} 160%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              paddingBottom: head * 0.08,
            }}
          >
            {p.line2}
          </div>
        </div>
        {!strip && p.body && <div style={{ fontSize: small * 1.05, lineHeight: 1.45, opacity: 0.82, marginTop: small * 0.6, maxWidth: colW * (stacked ? 0.8 : 0.88), textWrap: 'pretty' }}>{p.body}</div>}
        {p.cta && (
          <div style={{ display: 'flex', alignItems: 'center', gap: small * 0.8, justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.7 : 1.3) }}>
            <span
              style={{
                padding: `${small * 0.62}px ${small * 1.4}px`,
                borderRadius: 999,
                fontWeight: 800,
                fontSize: small * 0.98,
                color: '#ffffff',
                background: `linear-gradient(180deg, ${hexA('#ffffff', 0.55)} 0%, ${hexA('#ffffff', 0.08)} 48%, transparent 52%), ${p.accent}`,
                boxShadow: `0 ${small * 0.4}px ${small * 1.4}px ${hexA(p.accent, 0.45)}, inset 0 -2px 0 ${hexA('#000000', 0.18)}`,
                border: `1px solid ${hexA('#000000', 0.12)}`,
              }}
            >
              {p.cta} →
            </span>
            {p.note && (
              <span style={{ fontFamily: FONTS.caveat, fontWeight: 700, fontSize: small * 1.35, color: fg, rotate: '-4deg', whiteSpace: 'nowrap' }}>
                ← {p.note}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
