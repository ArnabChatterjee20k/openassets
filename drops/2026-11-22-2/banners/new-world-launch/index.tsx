import { z } from 'zod';
import { color, font, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA, rand } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'New World Launch',
  description:
    'Launch banner for a new Ardor story world: a pulp-paperback headline beside a live chat thread with the love interest, an affection meter, choice chips and a wax-seal "New world" badge.',
  tags: ['launch', 'hero', 'social', 'romance', 'chat', 'valentine'],
};

export const schema = z.object({
  eyebrow: text().default('New world · Feb 14'),
  headline: text().default('Fall for someone new tonight.'),
  body: textarea().default('The Midnight Court opens on Valentine’s Day. He remembers every word you say.'),
  cta: text('Button (empty to hide)').default('Start Chapter 1 free'),
  character: text('Love interest').default('Lucien'),
  world: text('World name').default('The Midnight Court'),
  line1: text('His message').default('You came back. I kept your seat by the fire.'),
  line2: text('Your reply').default('Only because you asked nicely.'),
  choice1: text('Choice 1').default('Take his hand'),
  choice2: text('Choice 2').default('Tease him'),
  affection: text('Affection %').default('82'),
  seal: text('Seal text').default('NEW WORLD'),
  font: font('Headline font').default('gloock'),
  background: color().default('#2A0A10'),
  surface: color().default('#3F1019'),
  accent: color().default('#E3173E'),
  accent2: color('Bubble').default('#F5C6AA'),
  pop: color('Gold').default('#F7B32B'),
  textColor: color('Text').default('#FFE8E0'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'desert-dusk': { background: '#2B1B2E', surface: '#45293F', accent: '#E5487A', accent2: '#FFD27F', pop: '#FF8E5E', textColor: '#FFE9D6', world: 'Saltwind Mirage', character: 'Idris', line1: 'The caravan leaves at dawn. Stay one more night?', line2: 'Ask me again at sunrise.', headline: 'Lost in the dunes with him.', body: 'A desert prince, a stolen map and seven nights under the stars.', eyebrow: 'New world · Now open' },
  'ink-gold': { font: 'instrument', background: '#0D0D0F', surface: '#1C1C20', accent: '#C9A45C', accent2: '#E8D9B5', pop: '#C9A45C', textColor: '#F3EDE2', headline: 'He kept your letters.', world: 'Regency Hearts', character: 'Lord Ashby', seal: 'CHAPTER 12', eyebrow: 'New chapter · Tonight', line1: 'I read every one of them twice, Miss Hale.', line2: 'Then you know how I feel.', choice1: 'Accept the dance', choice2: 'Leave the ball', body: 'Chapter 12 of Regency Hearts is out. The season’s last ball begins at nine.' },
  candy: { font: 'syne', background: '#FDF3F8', surface: '#F7DDEB', accent: '#FF3D7F', accent2: '#8A7BFF', pop: '#4FD1C5', textColor: '#3A1F4A', world: 'Neo-Seoul Rooftops', character: 'Jun', line1: 'Rooftop. Midnight. I brought two umbrellas.', line2: 'It isn’t even raining.', headline: 'Your city. Your crush.', body: 'Neo-Seoul Rooftops: a K-drama romance written live around your choices.', choice1: 'Share his umbrella', choice2: 'Race him down' },
  minimal: { cta: '', choice1: '', choice2: '', body: 'Free on iOS and Android.', eyebrow: 'Ardor' },
};

type P = z.infer<typeof schema> & BannerSize;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Scalloped wax-seal outline in a 100×100 box. */
function sealPath(bumps = 14) {
  const pts: string[] = [];
  const n = bumps * 8;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 44 + 4 * Math.abs(Math.sin((a * bumps) / 2)) + (rand(i * 1.7) - 0.5) * 0.9;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(2)},${(50 + Math.sin(a) * r).toFixed(2)}`);
  }
  return `M${pts.join('L')}Z`;
}
const HEART = 'M50 70 C30 56 24 46 24 38 C24 30 30 25 37 25 C43 25 47 29 50 34 C53 29 57 25 63 25 C70 25 76 30 76 38 C76 46 70 56 50 70Z';

function Seal({ x, y, size, p, rot = -12 }: { x: number; y: number; size: number; p: P; rot?: number }) {
  const id = 'nwl-seal';
  const label = p.seal.toUpperCase();
  return (
    <svg viewBox="0 0 100 100" style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, overflow: 'visible', rotate: `${rot}deg`, filter: `drop-shadow(0 ${size * 0.06}px ${size * 0.08}px rgba(0,0,0,0.45))` }}>
      <defs>
        <radialGradient id={`${id}-g`} cx="0.38" cy="0.32" r="0.8">
          <stop offset="0" stopColor={mixHex(p.accent, '#ffffff', 0.25)} />
          <stop offset="0.55" stopColor={p.accent} />
          <stop offset="1" stopColor={mixHex(p.accent, '#000000', 0.45)} />
        </radialGradient>
        <path id={`${id}-arc`} d="M50 50 m-30 0 a30 30 0 1 1 60 0 a30 30 0 1 1 -60 0" />
      </defs>
      <path d={sealPath()} fill={`url(#${id}-g)`} />
      <circle cx="50" cy="50" r="36" fill="none" stroke={mixHex(p.accent, '#000000', 0.35)} strokeWidth="1.6" />
      <circle cx="50" cy="50" r="35" fill="none" stroke={mixHex(p.accent, '#ffffff', 0.3)} strokeWidth="0.6" opacity="0.7" />
      <text fontFamily={FONTS.spacemono} fontSize="7.4" fontWeight={700} letterSpacing="2.2" fill={mixHex(p.accent, '#ffffff', 0.7)}>
        <textPath href={`#${id}-arc`} startOffset="0">
          {`${label} ♥ ${label} ♥ `}
        </textPath>
      </text>
      <g transform="translate(50 50) scale(0.5) translate(-50 -48)">
        <path d={HEART} fill={mixHex(p.accent, '#000000', 0.38)} transform="translate(1.5 2.5)" />
        <path d={HEART} fill={mixHex(p.accent, '#ffffff', 0.2)} />
      </g>
    </svg>
  );
}

function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')}`;
}

/** The hero visual: a chat thread with the love interest, as a glassy card. */
function Thread({ left, top, w, p, compact }: { left: number; top: number; w: number; p: P; compact: boolean }) {
  const u = w / 100; // all sizes from the card width
  const dark = isDark(p.background);
  const fs = u * (compact ? 4.8 : 4.5);
  const pct = Math.max(0, Math.min(100, parseInt(p.affection, 10) || 0));
  const hearts = 5;
  const lit = Math.round((pct / 100) * hearts);
  const bubbleBase = { fontFamily: FONTS.syne, fontSize: fs, lineHeight: 1.32, padding: `${u * 2.6}px ${u * 3.6}px`, maxWidth: w * 0.78 } as const;
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: w,
        padding: u * 4.5,
        boxSizing: 'border-box',
        borderRadius: u * 6,
        background: `linear-gradient(160deg, ${hexA(mixHex(p.surface, '#ffffff', dark ? 0.06 : 0.5), 0.92)}, ${hexA(p.surface, 0.88)})`,
        border: `1px solid ${dark ? 'rgba(255,232,224,0.14)' : 'rgba(58,31,74,0.12)'}`,
        boxShadow: `0 ${u * 6}px ${u * 16}px rgba(0,0,0,${dark ? 0.5 : 0.12}), 0 0 ${u * 30}px ${hexA(p.accent, dark ? 0.18 : 0.12)}, inset 0 1px 0 rgba(255,255,255,${dark ? 0.1 : 0.7})`,
        display: 'flex',
        flexDirection: 'column',
        gap: u * 3.2,
      }}
    >
      {/* header: avatar monogram + name + online */}
      <div style={{ display: 'flex', alignItems: 'center', gap: u * 3 }}>
        <div
          style={{
            width: u * 11,
            height: u * 11,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            background: `radial-gradient(circle at 35% 30%, ${mixHex(p.accent, '#ffffff', 0.2)}, ${mixHex(p.accent, '#000000', 0.35)})`,
            boxShadow: `0 0 0 ${u * 0.7}px ${p.surface}, 0 0 0 ${u * 1.2}px ${hexA(p.accent2, 0.7)}`,
            ...displayFace('gloock'),
            fontSize: u * 6,
            color: '#FFE8E0',
          }}
        >
          {p.character.trim().charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ ...displayFace('gloock'), fontSize: u * 5.6, lineHeight: 1.05, color: p.textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.character}</div>
          <div style={{ fontFamily: FONTS.spacemono, fontSize: u * 2.7, letterSpacing: '0.18em', textTransform: 'uppercase', color: p.accent2, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: u * 0.8 }}>
            <span style={{ display: 'inline-block', width: u * 1.8, height: u * 1.8, borderRadius: '50%', background: '#5BE38A', marginRight: u * 1.4, verticalAlign: 'middle', boxShadow: `0 0 ${u * 2}px #5BE38A` }} />
            {p.world}
          </div>
        </div>
      </div>

      {/* his message */}
      <div style={{ ...bubbleBase, alignSelf: 'flex-start', borderRadius: `${u * 1.2}px ${u * 4.5}px ${u * 4.5}px ${u * 4.5}px`, background: dark ? 'rgba(255,232,224,0.09)' : 'rgba(255,255,255,0.85)', color: p.textColor, border: `1px solid ${dark ? 'rgba(255,232,224,0.1)' : 'rgba(58,31,74,0.08)'}` }}>
        {p.line1}
      </div>

      {/* your reply */}
      {!compact && (
        <div style={{ ...bubbleBase, alignSelf: 'flex-end', borderRadius: `${u * 4.5}px ${u * 1.2}px ${u * 4.5}px ${u * 4.5}px`, background: p.accent2, color: mixHex(p.accent2, '#000000', 0.78) }}>
          {p.line2}
        </div>
      )}

      {/* affection meter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: u * 2.4, paddingTop: u * 1 }}>
        <span style={{ fontFamily: FONTS.spacemono, fontSize: u * 2.7, letterSpacing: '0.2em', color: p.textColor, opacity: 0.7, whiteSpace: 'nowrap' }}>AFFECTION</span>
        <div style={{ display: 'flex', gap: u * 1 }}>
          {Array.from({ length: hearts }, (_, i) => (
            <svg key={i} viewBox="20 20 60 54" style={{ width: u * 4.2, height: u * 3.8, overflow: 'visible', filter: i < lit ? `drop-shadow(0 0 ${u * 1.4}px ${hexA(p.accent, 0.8)})` : undefined }}>
              <path d={HEART} fill={i < lit ? p.accent : 'none'} stroke={i < lit ? p.accent : hexA(p.textColor, 0.35)} strokeWidth="5" />
            </svg>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontFamily: FONTS.spacemono, fontWeight: 700, fontSize: u * 3.4, color: p.pop }}>{pct}%</span>
      </div>

      {/* choices */}
      {!compact && (p.choice1 || p.choice2) && (
        <div style={{ display: 'flex', gap: u * 2.4 }}>
          {[p.choice1, p.choice2].filter(Boolean).map((c, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                textAlign: 'center',
                fontFamily: FONTS.syne,
                fontWeight: 700,
                fontSize: u * 3.5,
                padding: `${u * 2.4}px ${u * 2}px`,
                borderRadius: u * 3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: i === 0 ? '#FFF4EF' : p.textColor,
                background: i === 0 ? `linear-gradient(180deg, ${mixHex(p.accent, '#ffffff', 0.12)}, ${p.accent})` : 'transparent',
                border: i === 0 ? 'none' : `1.5px solid ${hexA(p.textColor, 0.3)}`,
                boxShadow: i === 0 ? `0 ${u * 1.5}px ${u * 5}px ${hexA(p.accent, 0.45)}` : undefined,
              }}
            >
              {i === 0 ? '♥ ' : ''}
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewWorldLaunch(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);

  const pad = stacked ? W * 0.08 : Math.max(W * 0.055, H * 0.1);
  // Hero card width.
  const cardW = stacked ? Math.min(W * 0.56, H * 0.46) : strip ? Math.min(W * 0.34, H * 1.6) : Math.min(W * 0.4, H * 0.86);
  const cardLeft = stacked ? (W - cardW) / 2 : W - pad - cardW;
  // Estimated card height (in card-width units) so it centres vertically.
  const cardH = cardW * (strip ? 0.5 : 0.8);
  const cardTop = stacked ? H * 0.075 : (H - cardH) / 2;
  const colW = stacked ? W - pad * 2 : cardLeft - pad - W * 0.05;
  const head = stacked ? Math.min(W * 0.088, colW * 0.13) : strip ? Math.min(H * 0.2, colW * 0.085) : Math.min(H * 0.125, colW * 0.15);
  const small = Math.max(head * 0.27, 13);
  const sealSize = cardW * (strip ? 0.24 : 0.27);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.textColor, fontFamily: FONTS.syne }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.06 : 0.1, size: Math.round(Math.min(W, H) / 22), color: dark ? '255,232,224' : '58,31,74' }}
        lift={dark ? 'rgba(255,200,190,0.05)' : 'rgba(255,255,255,0.6)'}
        glows={[
          { x: cardLeft + cardW / 2, y: cardTop + cardW * 0.5, size: cardW * 2.6, color: hexA(p.accent, dark ? 0.55 : 0.3), opacity: 0.8 },
          { x: stacked ? W * 0.1 : W * 0.05, y: H * 1.05, size: Math.max(W, H) * 0.9, color: hexA(p.accent2, dark ? 0.22 : 0.3), opacity: 0.7 },
          { x: W * 0.95, y: -H * 0.1, size: Math.max(W, H) * 0.5, color: hexA(p.pop, 0.2), opacity: 0.6 },
        ]}
        grain={dark ? 0.07 : 0.04}
        vignette={dark ? 0.55 : 0.08}
      >
        {/* huge cropped heart outline behind the card: the cover art */}
        <svg viewBox="20 20 60 54" style={{ position: 'absolute', left: cardLeft + cardW * 0.5 - cardW * 0.95, top: cardTop + cardW * 0.45 - cardW * 0.88, width: cardW * 1.9, height: cardW * 1.71, overflow: 'visible', opacity: dark ? 0.5 : 0.6 }}>
          <path d={HEART} fill="none" stroke={hexA(p.accent, 0.7)} strokeWidth="0.5" />
          <path d={HEART} fill="none" stroke={hexA(p.accent, 0.35)} strokeWidth="0.3" transform="translate(50 47) scale(1.12) translate(-50 -47)" />
          <path d={HEART} fill={hexA(p.accent, 0.12)} transform="translate(50 47) scale(0.86) translate(-50 -47)" />
        </svg>
      </Backdrop>

      <Thread left={cardLeft} top={cardTop} w={cardW} p={p} compact={strip} />
      <Seal x={cardLeft + cardW - sealSize * 0.3} y={Math.max(cardTop + sealSize * 0.05, sealSize * 0.56)} size={sealSize} p={p} />
      {/* a gold spark: the 10% */}
      <svg viewBox="-10 -10 20 20" style={{ position: 'absolute', left: cardLeft - cardW * 0.07, top: cardTop + cardH * 0.72, width: cardW * 0.09, height: cardW * 0.09, overflow: 'visible', filter: `drop-shadow(0 0 ${cardW * 0.02}px ${p.pop})` }}>
        <path d="M0 -10 Q1.2 -1.2 10 0 Q1.2 1.2 0 10 Q-1.2 1.2 -10 0 Q-1.2 -1.2 0 -10Z" fill={p.pop} />
      </svg>

      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked ? { top: cardTop + cardH + H * 0.045, textAlign: 'center' as const } : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: small * 0.8, justifyContent: stacked ? 'center' : 'flex-start' }}>
          {p.logo && <img src={p.logo} alt="" style={{ height: small * 1.8, objectFit: 'contain' }} />}
          <span style={{ fontFamily: FONTS.spacemono, fontSize: small * 0.85, letterSpacing: '0.32em', textTransform: 'uppercase', color: dark ? p.accent2 : p.accent, whiteSpace: 'nowrap' }}>
            <span style={{ color: p.accent }}>♥ </span>
            {p.eyebrow}
          </span>
        </div>
        <div
          style={{
            ...displayFace(p.font),
            fontSize: head,
            lineHeight: 0.98,
            letterSpacing: p.font === 'instrument' ? '-0.015em' : '-0.03em',
            marginTop: small * 0.7,
            color: p.textColor,
            textWrap: 'balance',
          }}
        >
          {p.headline.split(' ').map((w, i, a) => (
            <span key={i} style={i === a.length - 1 ? { color: p.accent, fontStyle: p.font === 'instrument' ? 'italic' : undefined } : undefined}>
              {w}
              {i < a.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>
        {!strip && <div style={{ fontSize: small * 1.05, lineHeight: 1.45, opacity: 0.8, marginTop: small * 0.8, maxWidth: stacked ? colW * 0.85 : colW * 0.92, marginInline: stacked ? 'auto' : undefined }}>{p.body}</div>}
        {p.cta && (
          <div style={{ display: 'flex', alignItems: 'center', gap: small, justifyContent: stacked ? 'center' : 'flex-start', marginTop: small * (strip ? 0.7 : 1.4) }}>
            <span
              style={{
                padding: `${small * 0.62}px ${small * 1.25}px`,
                borderRadius: 999,
                fontWeight: 700,
                fontSize: small * 0.95,
                whiteSpace: 'nowrap',
                color: '#FFF4EF',
                background: `linear-gradient(180deg, ${mixHex(p.accent, '#ffffff', 0.12)}, ${p.accent})`,
                boxShadow: `0 ${small * 0.5}px ${small * 2}px ${hexA(p.accent, 0.45)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
              }}
            >
              {p.cta} →
            </span>
            {!strip && <span style={{ fontFamily: FONTS.spacemono, fontSize: small * 0.75, letterSpacing: '0.16em', opacity: 0.6, whiteSpace: 'nowrap' }}>iOS · ANDROID</span>}
          </div>
        )}
      </div>
    </div>
  );
}
