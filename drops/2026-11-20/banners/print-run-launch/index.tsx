import type { CSSProperties } from 'react';
import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'Print Run Launch',
  description:
    'Launch banner for an AI ad agent: a fan of misregistered mini gig-posters in real ad formats (9:16, 4:5, 1:1, 16:9, 2:3), each hand-numbered, beside a warm serif headline. Stacks on square, drops the body on the LinkedIn strip.',
  tags: ['launch', 'hero', 'social', 'ads', 'platforms', 'print'],
};

export const schema = z.object({
  eyebrow: text('Eyebrow (handwritten)').default('Inkrun · public beta'),
  headline: text('Headline line 1').default('One brief.'),
  emphasis: text('Italic words').default('Thirty-one'),
  headlineEnd: text('Headline end').default('print runs.'),
  body: textarea().default("Inkrun's AI agent writes, resizes and launches your campaign on Google, Meta, TikTok and 28 more, then moves budget to whatever's working."),
  cta: text('Button (empty to hide)').default('Start your first run'),
  note: text('Handwritten note').default('free for 14 days'),
  campaign: text('Poster headline').default('Night Market'),
  offer: text('Poster offer').default('20% off'),
  formats: text('Formats (comma separated, 5)').default('TikTok 9:16, Meta 4:5, LinkedIn 1:1, YouTube 16:9, Pinterest 2:3'),
  font: font('Headline font').default('fraunces'),
  background: color().default('#12001F'),
  paper: color('Poster paper').default('#FBEFFF'),
  accent: color('Ink 1').default('#B026FF'),
  accent2: color('Ink 2').default('#FF2E88'),
  pop: color('Highlighter').default('#FFD600'),
  textColor: color('Text').default('#FBEFFF'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  risograph: { background: '#F4EFE6', paper: '#FFFFFF', accent: '#0078BF', accent2: '#FF48B0', pop: '#FFE800', textColor: '#1F2A6B' },
  lava: { background: '#1A0A06', paper: '#FFEDE0', accent: '#FF4D00', accent2: '#FFB000', pop: '#FF2E63', textColor: '#FFEDE0', emphasis: 'Every', headlineEnd: 'platform, lit.' },
  'ink-gold': { font: 'dmserif', background: '#0D0D0F', paper: '#F3EDE2', accent: '#C9A45C', accent2: '#6E6A62', pop: '#E8D9B5', textColor: '#F3EDE2', eyebrow: 'Inkrun for agencies', campaign: 'Atelier', offer: 'New season' },
  minimal: { body: '', note: '', cta: '', eyebrow: 'Inkrun' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Ad formats in fan order: aspect (w/h) + placement in the hero box (fractions) + tilt. */
const SLOTS = [
  { ar: 9 / 16, x: 0.16, y: 0.47, rot: -9, motif: 'sun' },
  { ar: 4 / 5, x: 0.39, y: 0.36, rot: -3, motif: 'stripes' },
  { ar: 2 / 3, x: 0.83, y: 0.44, rot: 8, motif: 'stripes' },
  { ar: 1, x: 0.66, y: 0.3, rot: 4, motif: 'sun' },
  { ar: 16 / 9, x: 0.55, y: 0.74, rot: -2, motif: 'sun' },
] as const;
// Map slot index → label index in the user's list (TikTok, Meta, LinkedIn, YouTube, Pinterest).
const LABEL_OF = [0, 1, 4, 2, 3];
const EDITIONS = ['04/31', '11/31', '23/31', '17/31', '31/31'];

function Poster({ slot, i, S, cx, cy, p, label }: { slot: (typeof SLOTS)[number]; i: number; S: number; cx: number; cy: number; p: P; label: string }) {
  const a = S * 0.42;
  const w = a * Math.sqrt(slot.ar);
  const h = a / Math.sqrt(slot.ar);
  const u = Math.min(w, h); // poster's own type unit
  const ink = isDark(p.background) ? '#1A0830' : p.textColor;
  const reg = u * 0.035; // misregistration offset
  const last = i === SLOTS.length - 1;
  const sun = slot.motif === 'sun';
  const fill: CSSProperties = { position: 'absolute', inset: 0 };
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - w / 2,
        top: cy - h / 2,
        width: w,
        height: h,
        rotate: `${slot.rot}deg`,
        background: p.paper,
        borderRadius: u * 0.025,
        overflow: 'hidden',
        boxShadow: `0 ${u * 0.08}px ${u * 0.25}px rgba(0,0,0,0.45), ${u * 0.03}px ${u * 0.03}px 0 ${hexA(p.accent, 0.9)}`,
      }}
    >
      {/* paper tooth */}
      <div style={{ ...fill, backgroundImage: `radial-gradient(${hexA(ink, 0.08)} 0.6px, transparent 1px)`, backgroundSize: `${u * 0.04}px ${u * 0.04}px` }} />
      {/* two-ink print, multiplied, slightly out of register */}
      <div style={{ ...fill, mixBlendMode: 'multiply' }}>
        {sun ? (
          <>
            <div style={{ position: 'absolute', width: u * 0.62, height: u * 0.62, borderRadius: '50%', left: w / 2 - u * 0.31, top: h * 0.42 - u * 0.31, background: p.accent2 }} />
            <div style={{ position: 'absolute', width: u * 0.62, height: u * 0.62, borderRadius: '50%', left: w / 2 - u * 0.31 + reg * 2.5, top: h * 0.42 - u * 0.31 + reg * 1.5, background: `radial-gradient(circle at 35% 35%, transparent 0 40%, ${p.accent} 41%)` }} />
          </>
        ) : (
          Array.from({ length: 6 }, (_, k) => (
            <div key={k} style={{ position: 'absolute', left: -w * 0.2, width: w * 1.4, top: h * (0.18 + k * 0.1), height: u * 0.05, rotate: '-14deg', background: k % 2 ? p.accent2 : p.accent, translate: `${k % 2 ? reg * 2 : 0}px 0` }} />
          ))
        )}
        {/* halftone shadow */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: h * 0.5, backgroundImage: `radial-gradient(${p.accent} 32%, transparent 36%)`, backgroundSize: `${u * 0.06}px ${u * 0.06}px`, maskImage: 'linear-gradient(transparent, black)', WebkitMaskImage: 'linear-gradient(transparent, black)', opacity: 0.55 }} />
      </div>
      {/* campaign title, printed in ink with a pink ghost pass */}
      <div style={{ position: 'absolute', left: u * 0.08, right: u * 0.08, bottom: h * 0.12, ...displayFace(p.font), fontSize: Math.min(u * 0.19, (w * 0.84) / (Math.max(4, p.campaign.length) * 0.56)), lineHeight: 0.9, letterSpacing: '-0.03em', color: ink, textShadow: `${reg * 1.6}px ${reg}px 0 ${hexA(p.accent2, 0.8)}`, whiteSpace: 'nowrap' }}>
        {p.campaign}
      </div>
      <div style={{ position: 'absolute', left: u * 0.08, bottom: h * 0.045, fontFamily: FONTS.outfit, fontWeight: 800, fontSize: u * 0.075, letterSpacing: '0.08em', textTransform: 'uppercase', color: ink, opacity: 0.85 }}>{p.offer}</div>
      {/* format label + hand-numbered edition */}
      <div style={{ position: 'absolute', left: u * 0.08, top: u * 0.07, fontFamily: FONTS.outfit, fontWeight: 500, fontSize: u * 0.07, color: ink, opacity: 0.75, whiteSpace: 'nowrap' }}>{label}</div>
      <div
        style={{
          position: 'absolute',
          right: u * 0.06,
          top: u * 0.035,
          fontFamily: FONTS.caveat,
          fontWeight: 700,
          fontSize: u * 0.13,
          color: last ? ink : p.accent,
          background: last ? p.pop : 'transparent',
          padding: last ? `0 ${u * 0.04}px` : 0,
          rotate: '-6deg',
        }}
      >
        {EDITIONS[i]}
      </div>
    </div>
  );
}

export default function PrintRunLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const labels = p.formats.split(',').map((s) => s.trim());

  const pad = stacked ? W * 0.08 : Math.max(W * 0.05, H * 0.1);
  // Hero box (where the poster fan lives).
  const hero = stacked
    ? { x: W * 0.04, y: H * 0.03, w: W * 0.92, h: H * 0.47 }
    : strip
      ? { x: W * 0.56, y: H * 0.02, w: W * 0.4, h: H * 0.96 }
      : { x: W * 0.5, y: H * 0.08, w: W * 0.47, h: H * 0.84 };
  const S = Math.min(hero.h, hero.w * 0.72);

  const colW = stacked ? W - pad * 2 : strip ? W * 0.5 : W * 0.45;
  // Each headline line stays on one line, so size to the longest one (~0.5em per char in Fraunces 900).
  // Wide layouts set three lines (emphasis on its own) so the type can be big; square and strip use two.
  const threeLines = !stacked && !strip;
  const longest = threeLines
    ? Math.max(p.headline.length, p.emphasis.length, p.headlineEnd.length, 6)
    : Math.max(p.headline.length, (p.emphasis + ' ' + p.headlineEnd).length, 8);
  const head = Math.min(stacked ? W * 0.085 : H * (strip ? 0.17 : 0.125), colW / (longest * 0.5));
  const small = Math.max(head * 0.3, 13);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.outfit }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.08 : 0.14, size: Math.round(Math.min(W, H) / 40), color: dark ? '251,239,255' : '31,42,107' }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.6)'}
        glows={[
          { x: hero.x + hero.w * 0.5, y: hero.y + hero.h * 0.5, size: S * 2.6, color: hexA(p.accent, dark ? 0.45 : 0.25), opacity: 0.9 },
          { x: hero.x + hero.w * 0.9, y: hero.y + hero.h, size: S * 1.8, color: hexA(p.accent2, dark ? 0.35 : 0.2), opacity: 0.8 },
          { x: stacked ? W * 0.1 : W * 0.05, y: H, size: Math.max(W, H) * 0.6, color: hexA(p.accent2, dark ? 0.12 : 0.1), opacity: 0.8 },
        ]}
        grain={dark ? 0.06 : 0.035}
        vignette={dark ? 0.5 : 0.08}
      />

      {/* squeegee stripes behind the fan: violet pass + misregistered pink pass */}
      <div style={{ position: 'absolute', left: hero.x - S * 0.15, top: hero.y + hero.h * 0.36, width: hero.w + S * 0.5, height: S * 0.34, background: p.accent, rotate: '-8deg', opacity: dark ? 0.85 : 0.9, borderRadius: S * 0.02 }} />
      <div style={{ position: 'absolute', left: hero.x - S * 0.12, top: hero.y + hero.h * 0.36 + S * 0.035, width: hero.w + S * 0.5, height: S * 0.34, background: p.accent2, rotate: '-8deg', mixBlendMode: dark ? 'screen' : 'multiply', opacity: 0.55, borderRadius: S * 0.02 }} />

      {SLOTS.map((slot, i) => {
        const cx = hero.x + hero.w * slot.x;
        const cy = hero.y + hero.h * slot.y;
        return <Poster key={i} slot={slot} i={i} S={S} cx={cx} cy={cy} p={p} label={labels[LABEL_OF[i]] ?? ''} />;
      })}

      {/* copy */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: H * 0.535, textAlign: 'center' as const } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2.2, marginBottom: small * 0.6, objectFit: 'contain', alignSelf: stacked ? 'center' : 'flex-start' }} />}
        {p.eyebrow && (
          <div style={{ fontFamily: FONTS.caveat, fontWeight: 700, fontSize: small * 1.5, color: p.pop === '#FFE800' && !dark ? p.accent2 : p.pop, rotate: '-2deg', transformOrigin: 'left' }}>
            {p.eyebrow}
          </div>
        )}
        <div style={{ ...displayFace(p.font), fontSize: head, lineHeight: 0.98, letterSpacing: '-0.035em', marginTop: small * 0.3, color: p.textColor }}>
          <div style={{ whiteSpace: 'nowrap' }}>{p.headline}</div>
          <div style={{ whiteSpace: 'nowrap' }}>
            <span style={{ fontStyle: 'italic', fontWeight: 600, color: p.accent2, textShadow: `${head * 0.03}px ${head * 0.025}px 0 ${hexA(p.accent, 0.9)}` }}>{p.emphasis}</span>
            {threeLines ? <br /> : ' '}
            {p.headlineEnd}
          </div>
        </div>
        {!strip && p.body && <div style={{ fontSize: small * 1.1, lineHeight: 1.45, opacity: 0.8, marginTop: small * 0.9, maxWidth: colW * 0.92, marginInline: stacked ? 'auto' : undefined }}>{p.body}</div>}
        {(p.cta || p.note) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: small * 0.8, justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.7 : 1.3) }}>
            {p.cta && (
              <span
                style={{
                  padding: `${small * 0.62}px ${small * 1.25}px`,
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: small * 0.95,
                  color: dark ? p.background : '#FFFFFF',
                  background: dark ? p.textColor : p.textColor,
                  boxShadow: `${small * 0.22}px ${small * 0.22}px 0 ${p.accent2}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {p.cta} →
              </span>
            )}
            {p.note && <span style={{ fontFamily: FONTS.caveat, fontSize: small * 1.25, color: p.textColor, opacity: 0.85, rotate: '-4deg', whiteSpace: 'nowrap' }}>{p.note}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
