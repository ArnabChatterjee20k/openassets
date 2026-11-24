import type { CSSProperties } from 'react';
import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { color, font, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { FilmOverlay, Glint, clamp, displayFace, ease, hexA, keys, mix, prog, rand, tempo } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'Meet Halfstream',
  category: 'intro',
  description: 'Brand intro for a channel or demo day: an MSK invoice prints, a red blade cuts the total in half, then the wordmark stacks in like a lit street sign, followed by three facts on the beat and a CTA.',
  tags: ['intro', 'brand', 'pricing', 'kafka', 'demo day', '16:9'],
};

const FPS = 60;
const T = tempo(FPS, 120);
export const video: VideoConfig = { width: 1920, height: 1080, fps: FPS, durationInFrames: T.bars(4) };

export const schema = z.object({
  invoiceTitle: text('Invoice title').default('Amazon MSK · Nov 2026'),
  line1: text('Invoice line 1').default('kafka.m7g.2xlarge × 6     $11,904'),
  line2: text('Invoice line 2').default('storage 24 TB × 3 AZ       $5,316'),
  line3: text('Invoice line 3').default('data transfer + support    $1,200'),
  before: text('Total before').default('$18,420'),
  after: text('Total after').default('$9,210'),
  unit: text('Price unit').default('/mo'),
  eyebrow: text().default('Meet'),
  brandTop: text('Wordmark line 1').default('HALF'),
  brandBottom: text('Wordmark line 2').default('STREAM'),
  fact1: text('Fact 1').default('Kafka in your AWS account'),
  fact2: text('Fact 2').default('On-demand prices + 25% on brokers'),
  fact3: text('Fact 3').default('We carry the pager'),
  cta: text('Call to action').default('Migrate off MSK'),
  url: text().default('halfstream.dev'),
  font: font('Display font').default('bungee'),
  background: color().default('#F5F5F0'),
  surface: color().default('#E6E6E1'),
  ink: color('Text').default('#0A0A0A'),
  accent: color().default('#E3000F'),
  accent2: color('Grid + secondary').default('#8C8C88'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'cherry-night': { background: '#2A0A10', surface: '#3F1019', ink: '#FFE8E0', accent: '#E3173E', accent2: '#F5C6AA' },
  blueprint: { background: '#0F3B8C', surface: '#134AA8', ink: '#EAF2FF', accent: '#FFDD00', accent2: '#7FB2FF' },
  'demo-day': { eyebrow: 'YC demo day', cta: 'Book a migration call', fact3: 'Live in your VPC in a week', before: '$42,800', after: '$21,400' },
};

type P = z.infer<typeof schema>;

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

// Receipt geometry (left column).
const R = { x: 150, y: 170, w: 640, h: 740 };
const TOTAL_Y = 560; // relative to receipt top

export default function MeetHalfstream(p: P) {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const CUT = T.beats(3); // blade drops on beat 4 of bar 1
  const HIT = T.bars(1); // wordmark
  const FACTS = T.bars(2);
  const CTA = T.bars(3);
  const END = video.durationInFrames;
  const dark = isDark(p.background);
  const onAccent = isDark(p.accent) ? '#F5F5F0' : '#0A0A0A';

  // Camera
  const shakeAmt = keys(frame, [CUT + 8, CUT + 11, CUT + 26], [0, 10, 0], [ease.out, ease.outSoft]) + keys(frame, [HIT, HIT + 3, HIT + 20], [0, 8, 0], [ease.out, ease.outSoft]);
  const shake = { x: (rand(frame * 1.3) - 0.5) * shakeAmt, y: (rand(frame * 2.9) - 0.5) * shakeAmt };
  const push = mix(1, 1.035, prog(frame, 0, END, ease.inOutSoft));
  const exit = prog(frame, END - 30, 30, ease.in);

  // Receipt enters, prints, gets cut.
  const rIn = prog(frame, 0, 30, ease.out);
  const blade = prog(frame, CUT, 10, ease.in);
  const drop = prog(frame, CUT + 12, 34, ease.in);
  const totalRoll = prog(frame, CUT + 14, 30, ease.inOutSoft);
  const slide = prog(frame, HIT - 6, 34, ease.inOut); // receipt shifts left/down a touch for the wordmark
  const lines = [p.line1, p.line2, p.line3];

  const totalNum = (() => {
    const a = Number(p.before.replace(/[^\d.]/g, ''));
    const b = Number(p.after.replace(/[^\d.]/g, ''));
    if (!a || !b || totalRoll <= 0) return p.before;
    if (totalRoll >= 1) return p.after;
    const prefix = p.before.match(/^[^\d]*/)?.[0] ?? '';
    return prefix + Math.round(mix(a, b, totalRoll)).toLocaleString('en-US');
  })();

  // Wordmark lights up letter by letter like a sign.
  const brandSize = Math.min(232, 900 / Math.max(4, Math.max(p.brandTop.length, p.brandBottom.length) * 0.8));
  const signLetter = (ch: string, i: number, line: number) => {
    const at = HIT + 2 + (line * p.brandTop.length + i) * 3;
    const on = frame >= at ? keys(frame, [at, at + 2, at + 4, at + 6, at + 9], [0, 1, 0.25, 1, 1], ease.linear) : 0;
    const fall = prog(frame, at, 14, ease.out);
    return (
      <span key={i} style={{ display: 'inline-block', opacity: on, translate: `0 ${(1 - fall) * -30}px`, color: line === 0 ? p.accent : p.ink }}>
        {ch}
      </span>
    );
  };
  const brandBlock: CSSProperties = { position: 'absolute', left: 940, top: 200, ...displayFace(p.font), fontSize: brandSize, lineHeight: 0.9, letterSpacing: '-0.01em', whiteSpace: 'nowrap' };
  const flash = keys(frame, [HIT - 1, HIT + 3, HIT + 26], [0, 1, 0], [ease.out, ease.outSoft]);

  const facts = [p.fact1, p.fact2, p.fact3];
  const ctaT = prog(frame, CTA + 4, 26, ease.backOut);
  const tick = 16;

  return (
    <AbsoluteFill style={{ background: p.background, color: p.ink, overflow: 'hidden' }}>
      <AbsoluteFill style={{ translate: `${shake.x}px ${shake.y - exit * 60}px`, scale: String(push), opacity: 1 - exit }}>
        {/* Swiss grid, drifting slowly */}
        {Array.from({ length: 13 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', left: 120 + (1680 * i) / 12 - (frame * 0.08) % 140 + 70, top: 0, bottom: 0, width: 1, background: hexA(p.ink, dark ? 0.09 : 0.06) }} />
        ))}
        <div style={{ position: 'absolute', left: 120, top: 96, height: 4, width: 1680 * prog(frame, 0, 40, ease.inOutSoft), background: p.ink }} />
        <div style={{ position: 'absolute', left: 120, top: 96, width: 84, height: 26, background: p.accent, scale: `${prog(frame, 6, 18, ease.backOut)} 1`, transformOrigin: 'left' }} />
        <div style={{ position: 'absolute', right: 120, top: 116, fontFamily: FONTS.vt323, fontSize: 44, letterSpacing: '0.14em', color: p.accent, opacity: prog(frame, 10, 20) }}>
          {frame < HIT ? 'INVOICE // MANAGED KAFKA' : 'HALFSTREAM // MANAGED KAFKA'}
        </div>
        {p.logo && (
          <Img src={p.logo} style={{ position: 'absolute', left: 120, top: 136, height: 56, objectFit: 'contain', opacity: prog(frame, HIT + 20, 20) }} />
        )}

        {/* ── Receipt ── */}
        <div style={{ position: 'absolute', left: R.x, top: R.y, width: R.w, height: R.h, opacity: rIn, translate: `${mix(-40, 0, rIn) - slide * 30}px ${slide * 20}px`, scale: String(mix(1, 0.9, slide)) }}>
          {/* left half (stays) */}
          <Receipt p={p} lines={lines} frame={frame} total={p.before} red={false} clip="left" hideTotal={frame >= CUT + 14} />
          {/* right half (drops away after the cut) */}
          <div style={{ position: 'absolute', inset: 0, translate: `${drop * 80}px ${drop * 900}px`, rotate: `${drop * 14}deg`, transformOrigin: '50% 0%', opacity: 1 - prog(frame, CUT + 36, 12) }}>
            <Receipt p={p} lines={lines} frame={frame} total={p.before} red={false} clip="right" hideTotal={frame >= CUT + 14} />
          </div>
          {/* the new total rolls down, unclipped, across where the dropped half was */}
          {frame >= CUT + 14 && (
            <div style={{ position: 'absolute', left: 48, top: TOTAL_Y - 10, ...displayFace(p.font), fontSize: 118, lineHeight: 1, whiteSpace: 'nowrap', color: p.accent, textShadow: `6px 6px 0 ${hexA(p.ink, 0.12)}` }}>
              {totalNum}
              <span style={{ fontFamily: FONTS.vt323, fontSize: 56, color: p.ink }}>{p.unit}</span>
            </div>
          )}
          {/* the blade */}
          <div style={{ position: 'absolute', left: R.w / 2 - 5, top: -80, width: 10, height: (R.h + 160) * blade, background: p.accent, opacity: 1 - prog(frame, CUT + 30, 20), boxShadow: `0 0 0 2px ${hexA(p.ink, 0.15)}` }} />
          {/* hairline left behind on the kept half */}
          <div style={{ position: 'absolute', left: R.w / 2 - 1, top: 0, width: 2, height: R.h * prog(frame, CUT + 20, 20), background: `repeating-linear-gradient(180deg, ${p.ink} 0 10px, transparent 10px 18px)` }} />
          {/* −50% stamp */}
          <div
            style={{
              position: 'absolute',
              left: R.w * 0.56,
              top: TOTAL_Y - 104,
              fontFamily: FONTS.vt323,
              fontSize: 64,
              letterSpacing: '0.06em',
              color: p.accent,
              border: `4px solid ${p.accent}`,
              padding: '0 18px',
              rotate: '-8deg',
              scale: String(mix(1.6, 1, prog(frame, CUT + 40, 14, ease.snap))),
              opacity: prog(frame, CUT + 40, 6),
            }}
          >
            −50%
          </div>
        </div>

        {/* ── Wordmark ── */}
        <div style={{ ...brandBlock, top: 200 }}>
          <div style={{ fontFamily: FONTS.vt323, fontSize: 52, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 18, opacity: prog(frame, HIT + 4, 16), color: p.ink }}>{p.eyebrow}</div>
          <div>{p.brandTop.split('').map((c, i) => signLetter(c, i, 0))}</div>
          <div>{p.brandBottom.split('').map((c, i) => signLetter(c, i, 1))}</div>
        </div>
        <Glint frame={frame} start={FACTS + T.beats(3)} dur={44} style={{ ...brandBlock, top: 200 + 52 + 18 + 4 }}>
          <div>{p.brandTop}</div>
          <div>{p.brandBottom}</div>
        </Glint>

        {/* ── Facts on the beats ── */}
        <div style={{ position: 'absolute', left: 944, top: 200 + 74 + brandSize * 1.8 + 40, width: 860 }}>
          {facts.map((f, i) => {
            const t = prog(frame, FACTS + i * T.beat, 22, ease.out);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 22, height: 74, borderTop: `2px solid ${hexA(p.ink, 0.8 * t)}`, opacity: t, translate: `${(1 - t) * 40}px 0` }}>
                <span style={{ width: 20, height: 20, background: i === 1 ? p.accent : p.ink, flex: 'none' }} />
                <span style={{ fontFamily: FONTS.outfit, fontWeight: 500, fontSize: 48, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{f}</span>
              </div>
            );
          })}
        </div>

        {/* ── CTA ── */}
        <div style={{ position: 'absolute', left: 944, top: 920, display: 'flex', alignItems: 'center', gap: 36 }}>
          <span style={{ fontFamily: FONTS.outfit, fontWeight: 800, fontSize: 46, padding: '14px 34px', background: p.accent, color: onAccent, boxShadow: `8px 8px 0 ${p.ink}`, scale: String(ctaT), opacity: clamp(ctaT * 2), transformOrigin: 'left' }}>
            {p.cta} →
          </span>
          <span style={{ fontFamily: FONTS.vt323, fontSize: 50, letterSpacing: '0.1em', opacity: prog(frame, CTA + 18, 16), borderBottom: `3px solid ${p.ink}` }}>{p.url}</span>
        </div>

        {/* ── The log: ticks streaming along the bottom rule ── */}
        <div style={{ position: 'absolute', left: 120, right: 120, top: 1010, height: 3, background: p.ink, opacity: 0.9 }} />
        <div style={{ position: 'absolute', left: 120, width: 1680, top: 1022, height: tick, overflow: 'hidden' }}>
          {Array.from({ length: 56 }, (_, i) => {
            const x = ((i * 30 + frame * 2.2) % (56 * 30)) - 30;
            return <div key={i} style={{ position: 'absolute', left: x, width: tick, height: tick, background: i % 7 === 3 ? p.accent : hexA(p.ink, i % 2 ? 0.25 : 0.6) }} />;
          })}
        </div>
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at 70% 40%, ${hexA(p.accent, flash * 0.28)} 0%, transparent 45%)`, mixBlendMode: dark ? 'screen' : 'multiply' }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.45 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}

/** One half of the invoice (clipped), so the right half can fall away after the cut. */
function Receipt({ p, lines, frame, total, red, clip, hideTotal }: { p: P; lines: string[]; frame: number; total: string; red: boolean; clip: 'left' | 'right'; hideTotal: boolean }) {
  const type = (s: string, at: number) => s.slice(0, Math.max(0, Math.floor((frame - at) * 1.4)));
  const totalT = prog(frame, 64, 16, ease.out);
  const dark = isDark(p.background);
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        clipPath: clip === 'left' ? 'inset(-40px 50% -40px -40px)' : 'inset(-40px -40px -40px 50%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: dark ? hexA('#ffffff', 0.06) : '#FBFBF8',
          border: `3px solid ${p.ink}`,
          boxShadow: `14px 14px 0 ${hexA(p.ink, 0.9)}`,
          // torn bottom edge
          clipPath: `polygon(0 0, 100% 0, 100% 96%, ${Array.from({ length: 16 }, (_, i) => `${100 - (i + 0.5) * 6.25}% ${i % 2 ? 96 : 100}%`).join(', ')}, 0 96%)`,
        }}
      />
      <div style={{ position: 'absolute', left: 48, right: 48, top: 44, fontFamily: FONTS.vt323, color: p.ink }}>
        <div style={{ fontSize: 50, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{type(p.invoiceTitle, 10)}</div>
        <div style={{ height: 3, background: p.ink, margin: '18px 0 26px', width: `${prog(frame, 14, 20) * 100}%` }} />
        {lines.map((l, i) => (
          <div key={i} style={{ fontSize: 44, lineHeight: 1.5, whiteSpace: 'pre', opacity: 0.8 }}>
            {type(l, 24 + i * 12)}
          </div>
        ))}
        <div style={{ height: 0, borderTop: `3px dashed ${hexA(p.ink, 0.6)}`, margin: '28px 0 30px', width: `${prog(frame, 58, 16) * 100}%` }} />
        <div style={{ fontSize: 46, letterSpacing: '0.2em', opacity: totalT }}>TOTAL</div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 48,
          top: TOTAL_Y - 10,
          ...displayFace(p.font),
          fontSize: 118,
          lineHeight: 1,
          whiteSpace: 'nowrap',
          color: red ? p.accent : p.ink,
          opacity: hideTotal ? 0 : totalT,
          translate: `0 ${(1 - totalT) * 20}px`,
        }}
      >
        {total}
        <span style={{ fontFamily: FONTS.vt323, fontSize: 56 }}>{p.unit}</span>
      </div>
    </div>
  );
}
