import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, image, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, FilmOverlay, Glint, clamp, displayFace, ease, hexA, mix, prog, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Customer Quote',
  category: 'quote',
  description:
    'Square testimonial post: a vermilion quote disc rolls in, the quote rises word by word in an editorial serif, a key phrase gets a yellow marker on the beat, then the headshot, name and a results chip land.',
  tags: ['quote', 'testimonial', 'customer', 'social', 'bauhaus', 'square'],
};

// 60 fps, 120 BPM: 1 beat = 30 frames. 9 s = 18 beats.
const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1080, height: 1080, fps: FPS, durationInFrames: T.beats(18) };

export const schema = z.object({
  eyebrow: text().default('Customer story · Nº 07'),
  quote: textarea().default('We went from four channels to twenty-two without hiring a single media buyer. Formwork cut our CPA by a third.'),
  highlight: text('Highlighted phrase (must appear in the quote)').default('cut our CPA by a third.'),
  name: text().default('Maya Okafor'),
  role: text('Role · company').default('Head of Growth, Loom & Lumber'),
  stat: text('Result chip (empty to hide)').default('−38% CPA in 6 weeks'),
  headshot: image('Headshot (optional)').default(''),
  background: color().default('#F2EBDD'),
  surface: color('Card').default('#E4D9C4'),
  ink: color('Text').default('#111111'),
  accent: color('Quote disc').default('#D9381E'),
  accent2: color('Square').default('#1D4E9E'),
  pop: color('Marker').default('#F2B90F'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  swiss: { background: '#F5F5F0', surface: '#E6E6E1', ink: '#0A0A0A', accent: '#E3000F', accent2: '#0A0A0A', pop: '#E3000F' },
  'ink-gold': {
    background: '#0D0D0F', surface: '#1C1C20', ink: '#F3EDE2', accent: '#C9A45C', accent2: '#6E6A62', pop: '#6E5A2E',
    quote: 'Our agency runs eleven brands on Formwork. The overnight rebalancing alone paid for the year.', highlight: 'paid for the year.', name: 'Jonas Varga', role: 'Partner, Northlight Studio', stat: '11 brands · 1 agent', eyebrow: 'Agency story · Nº 12',
  },
  nordic: { background: '#E9EEF1', surface: '#D3DDE3', ink: '#17242E', accent: '#2F6F8F', accent2: '#E4572E', pop: '#A7C4D4' },
  terracotta: {
    background: '#F1E4D3', surface: '#E5CDB2', ink: '#3B1F14', accent: '#C8553D', accent2: '#4F6D58', pop: '#F2A541',
    quote: 'I wrote one brief on Monday. By Friday it was live on TikTok, Pinterest and Reddit, and it was winning.', highlight: 'and it was winning.', name: 'Priya Raman', role: 'Founder, Saltbush Skincare', stat: '3.4× ROAS on Pinterest',
  },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

/** Indices of the words that make up `phrase` inside `words` (first contiguous match). */
function phraseRange(words: string[], phrase: string): [number, number] {
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  const target = phrase.split(/\s+/).map(norm).filter(Boolean);
  if (!target.length) return [-1, -1];
  for (let i = 0; i + target.length <= words.length; i++) {
    if (target.every((t, k) => norm(words[i + k]) === t)) return [i, i + target.length - 1];
  }
  return [-1, -1];
}

export default function CustomerQuote(p: P) {
  const frame = useCurrentFrame();
  const W = video.width;
  const H = video.height;
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const blend = dark ? 'screen' : 'multiply';

  const exit = prog(frame, end - 30, 30, ease.in);
  const push = mix(1, 1.04, prog(frame, 0, end, ease.inOutSoft));

  // quote disc rolls in on beat 1
  const roll = prog(frame, T.beats(0.5), 40, ease.out);
  const discX = mix(-200, 214, roll);
  const discR = 132;

  const words = p.quote.split(/\s+/).filter(Boolean);
  const [h0, h1] = phraseRange(words, p.highlight);
  const size = p.quote.length > 130 ? 64 : p.quote.length > 95 ? 76 : 86;
  const QSTART = T.beats(2);
  const stagger = Math.max(2, Math.min(5, Math.floor(110 / Math.max(1, words.length))));
  const MARK = T.beats(7); // marker sweeps on beat 7
  const ATTR = T.beats(8);

  const initials = p.name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink, fontFamily: FONTS.familjen }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.08 : 0.15, size: 36, y: -frame * 0.12, color: dark ? '255,255,255' : '17,17,17' }}
        lift={dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.5)'}
        glows={dark ? [{ x: discX, y: 230, size: 900, color: hexA(p.accent, 0.3), opacity: 0.6 }] : []}
        grain={0}
        vignette={dark ? 0.45 : 0.08}
      />

      <AbsoluteFill style={{ scale: String(push), opacity: 1 - exit }}>
        {/* oat card */}
        <div style={{ position: 'absolute', left: 54, top: 54, right: 54, bottom: 54, background: p.surface, border: `1px solid ${hexA(p.ink, 0.15)}`, opacity: prog(frame, 0, 24), scale: String(mix(0.97, 1, prog(frame, 0, 40))) }} />

        {/* yellow triangle cropped at the bottom-right corner, drifting */}
        <svg style={{ position: 'absolute', left: 820, top: 800, width: 300, height: 300, overflow: 'visible', rotate: `${-14 + Math.sin(frame / 60) * 3}deg`, translate: `${mix(200, 0, prog(frame, T.beats(1), 40))}px ${mix(200, 0, prog(frame, T.beats(1), 40))}px` }} viewBox="0 0 100 100">
          <polygon points="50,4 98,94 2,94" fill={p.pop} style={{ mixBlendMode: blend }} />
        </svg>

        {/* quote disc + overprinted square */}
        <div style={{ position: 'absolute', left: discX - discR, top: 236 - discR, width: discR * 2, height: discR * 2, borderRadius: '50%', background: p.accent, rotate: `${mix(-200, 0, roll) + Math.sin(frame / 45) * 3}deg`, scale: String(1 + Math.sin(frame / 38) * 0.015), display: 'grid', placeItems: 'center' }}>
          <span style={{ ...displayFace('instrument', { italic: true }), fontSize: 300, lineHeight: 1, color: dark ? p.background : p.background, translate: '0 70px' }}>“</span>
        </div>
        <div style={{ position: 'absolute', left: discX + 96, top: 318, width: 84, height: 84, background: p.accent2, mixBlendMode: blend, rotate: `${8 + Math.sin(frame / 50) * 2}deg`, scale: String(prog(frame, T.beats(1.5), 22, ease.backOut)) }} />
        <Glint frame={frame} start={T.beats(12)} dur={40} style={{ position: 'absolute', left: discX - discR, top: 236 - discR, width: discR * 2, height: discR * 2, borderRadius: '50%', background: '#ffffff' }}>
          {' '}
        </Glint>

        {/* eyebrow, top-right */}
        <div style={{ position: 'absolute', right: 110, top: 112, display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONTS.spacemono, fontSize: 24, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: prog(frame, T.beats(1), 24) }}>
          {p.eyebrow}
          <span style={{ width: 40 * prog(frame, T.beats(1), 30), height: 2, background: p.accent }} />
        </div>

        {/* result chip, right-anchored */}
        {p.stat && (
          <div
            style={{
              position: 'absolute',
              right: 110,
              top: 214,
              padding: '16px 24px',
              background: p.ink,
              color: p.background,
              fontSize: 34,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: `8px 8px 0 ${p.accent}`,
              scale: String(prog(frame, T.beats(9), 22, ease.backOut)),
              opacity: clamp(prog(frame, T.beats(9), 8) * 1.5),
            }}
          >
            {p.stat}
          </div>
        )}

        {/* the quote, word by word, with a marker behind the key phrase */}
        <div style={{ position: 'absolute', left: 110, right: 110, top: 420, display: 'flex', flexWrap: 'wrap', columnGap: '0.24em', rowGap: size * 0.08, ...displayFace('instrument', { italic: false }), fontSize: size, lineHeight: 1.04, letterSpacing: '-0.015em' }}>
          {words.map((w, i) => {
            const t = prog(frame, QSTART + i * stagger, 24, ease.out);
            const inPhrase = i >= h0 && i <= h1 && h0 >= 0;
            const mk = inPhrase ? prog(frame, MARK + (i - h0) * 4, 16, ease.inOut) : 0;
            return (
              <span key={i} style={{ position: 'relative', display: 'inline-block', opacity: clamp(t * 1.4), translate: `0 ${(1 - t) * 26}px`, filter: t < 1 ? `blur(${(1 - t) * 8}px)` : undefined }}>
                {inPhrase && <span style={{ position: 'absolute', left: '-0.12em', right: '-0.12em', top: '42%', bottom: '2%', background: p.pop, transformOrigin: 'left', scale: `${mk} 1`, mixBlendMode: blend, zIndex: 0 }} />}
                <span style={{ position: 'relative', ...(inPhrase ? displayFace('instrument', { italic: true }) : {}) }}>{w}</span>
              </span>
            );
          })}
        </div>

        {/* attribution */}
        <div style={{ position: 'absolute', left: 110, bottom: 120, display: 'flex', alignItems: 'center', gap: 26 }}>
          <div style={{ width: 112, height: 112, flexShrink: 0, borderRadius: p.headshot ? '50%' : 0, overflow: 'hidden', background: p.accent2, border: `2px solid ${p.ink}`, display: 'grid', placeItems: 'center', scale: String(prog(frame, ATTR, 24, ease.backOut)) }}>
            {p.headshot ? (
              <Img src={p.headshot} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: FONTS.spacemono, fontSize: 40, color: '#F6F1E6', letterSpacing: '0.04em' }}>{initials}</span>
            )}
          </div>
          <div style={{ opacity: prog(frame, ATTR + 6, 22), translate: `${mix(-24, 0, prog(frame, ATTR + 6, 30))}px 0` }}>
            <div style={{ fontSize: 46, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.1 }}>{p.name}</div>
            <div style={{ fontSize: 30, marginTop: 6, opacity: 0.85 }}>{p.role}</div>
          </div>
        </div>
        {/* story progress rule along the card's bottom edge */}
        <div style={{ position: 'absolute', left: 54, bottom: 54, width: (W - 108) * prog(frame, 0, end - 30, ease.linear), height: 6, background: p.accent }} />
        {/* hairline over the attribution */}
        <div style={{ position: 'absolute', left: 110, bottom: 268, width: 860, height: 1, background: p.ink, opacity: 0.35, transformOrigin: 'left', scale: `${prog(frame, ATTR - 10, 40, ease.inOutSoft)} 1` }} />
      </AbsoluteFill>
      <FilmOverlay grain={0.05} vignette={dark ? 0.4 : 0.1} frame={frame} />
    </AbsoluteFill>
  );
}
