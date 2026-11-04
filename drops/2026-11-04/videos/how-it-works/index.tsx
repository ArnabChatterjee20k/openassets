import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Img, useCurrentFrame } from 'remotion';
import { z } from 'zod';
import { color, image, text } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, VideoConfig } from '@/lib/types';
import { Backdrop, Dust, FilmOverlay, Glint, SweepReveal, WordsIn, clamp, ease, hexA, iso, keys, mix, prog, rand, shade, tempo, typed, type P3 } from '@/kit';

export const meta: AssetMeta = {
  kind: 'video',
  name: 'How It Works',
  category: 'tech',
  description:
    'Three-step product explainer for an on-demand factory: a CAD part outlines itself and gets quoted, a toolpath machines it with sparks, an inspection scan passes it, then "72H" hits with the CTA.',
  tags: ['explainer', 'how it works', 'manufacturing', 'cnc', 'steps', 'tech'],
};

const FPS = 60;
const T = tempo(FPS, 120); // beat = 30 frames, bar = 120
const W = 1920;
const H = 1080;
export const video: VideoConfig = { width: W, height: H, fps: FPS, durationInFrames: T.bars(4) + T.beats(2) };

export const schema = z.object({
  eyebrow: text().default('How Redbrick works'),
  step1: text('Step 1').default('Upload'),
  step1Body: text('Step 1 copy').default('Drop a STEP file. Get a price in 9 seconds.'),
  step2: text('Step 2').default('Machine'),
  step2Body: text('Step 2 copy').default('Robot-tended 5-axis cells cut it overnight.'),
  step3: text('Step 3').default('Ship'),
  step3Body: text('Step 3 copy').default('CMM-checked to ±0.01 mm, out the door.'),
  fileName: text('File name').default('bracket_v3.step'),
  price: text('Quoted price').default('$148.20 / ea'),
  cellLabel: text('Machine label').default('Cell 04 · Dayton, OH'),
  passLabel: text('Inspection chip').default('±0.01 mm · Passed'),
  big: text('Hero word').default('72H'),
  tagline: text().default('From CAD to your dock in three days.'),
  cta: text('Call to action').default('redbrick.works/quote'),
  partImage: image('Part render (optional)').default(''),
  background: color().default('#F1E4D3'),
  surface: color('Panels').default('#E5CDB2'),
  ink: color('Text').default('#3B1F14'),
  accent: color('Accent (toolpath)').default('#C8553D'),
  accent2: color('Scan / enamel').default('#4F6D58'),
  pop: color('Sparks').default('#F2A541'),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  'night-shift': { background: '#0F3B8C', surface: '#134AA8', ink: '#EAF2FF', accent: '#FFDD00', accent2: '#7FB2FF', pop: '#FFFFFF' },
  bauhaus: { background: '#F2EBDD', surface: '#E4D9C4', ink: '#111111', accent: '#D9381E', accent2: '#1D4E9E', pop: '#F2B90F' },
  matcha: { background: '#EEF1E6', surface: '#DCE3CC', ink: '#1E2A1A', accent: '#6A8D3A', accent2: '#C9A227', pop: '#E85D3F', step3: 'Deliver', big: '3 DAYS', tagline: 'Short runs, made in America.' },
};

type P = z.infer<typeof schema>;

// Stage panel (right side)
const SX = 980;
const SY = 190;
const SW = 820;
const SH = 720;
const PU = 58; // px per world unit for the drawn part
const PCX = 390;
const PCY = 392;
const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114 < 140;
};

const S = (q: P3): [number, number] => {
  const [x, y] = iso(q, PU);
  return [PCX - 30 + x, PCY - 40 + y];
};
const poly = (q: P3[]) => q.map((v) => S(v).map((n) => n.toFixed(1)).join(',')).join(' ');

/** The toolpath contour, in stage px, for the drawn part or the uploaded image. */
function contour(hasImage: boolean): [number, number][] {
  if (hasImage) {
    const w = SW * 0.62;
    const h = SH * 0.58;
    const x = (SW - w) / 2;
    const y = SH * 0.17;
    return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  }
  return ([[-0.6, -0.6, 0], [6.6, -0.6, 0], [6.6, 4.6, 0], [-0.6, 4.6, 0]] as P3[]).map(S);
}

/** Point at fraction u (0..1, looping) along a closed polyline. */
function along(ptsList: [number, number][], u: number): [number, number] {
  const segs = ptsList.map((a, i) => {
    const b = ptsList[(i + 1) % ptsList.length];
    return { a, b, l: Math.hypot(b[0] - a[0], b[1] - a[1]) };
  });
  const total = segs.reduce((s, g) => s + g.l, 0);
  let d = (((u % 1) + 1) % 1) * total;
  for (const g of segs) {
    if (d <= g.l) {
      const t = d / g.l;
      return [mix(g.a[0], g.b[0], t), mix(g.a[1], g.b[1], t)];
    }
    d -= g.l;
  }
  return ptsList[0];
}

function Bracket({ p, draw, solid }: { p: P; draw: number; solid: number }) {
  const m = shade(p.surface, 0.25);
  const stroke = { stroke: p.ink, strokeWidth: 2.2, strokeLinejoin: 'round' as const, pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - draw };
  const box = (x: number, y: number, z: number, w: number, d: number, h: number) => {
    const X = x + w;
    const Y = y + d;
    const Z = z + h;
    return (
      <g>
        <polygon points={poly([[x, Y, z], [X, Y, z], [X, Y, Z], [x, Y, Z]])} fill={shade(m, -0.25)} fillOpacity={solid} {...stroke} />
        <polygon points={poly([[X, y, z], [X, Y, z], [X, Y, Z], [X, y, Z]])} fill={shade(m, -0.1)} fillOpacity={solid} {...stroke} />
        <polygon points={poly([[x, y, Z], [X, y, Z], [X, Y, Z], [x, Y, Z]])} fill={shade(m, 0.2)} fillOpacity={solid} {...stroke} />
      </g>
    );
  };
  const hole = (x: number, y: number, r: number) => {
    const [cx, cy] = S([x, y, 0.8]);
    return <ellipse cx={cx} cy={cy} rx={r * PU * 1.2247} ry={r * PU * 0.7071} fill={shade(m, -0.5)} fillOpacity={solid} {...stroke} />;
  };
  const [bx, by] = S([3, 0.9, 2.6]);
  const C30 = Math.cos(Math.PI / 6);
  return (
    <g>
      {box(0, 0, 0, 6, 4, 0.8)}
      {hole(1.4, 2.6, 0.42)}
      {hole(4.6, 2.6, 0.42)}
      {box(0, 0, 0.8, 6, 0.9, 3.4)}
      <g transform={`translate(${bx} ${by}) matrix(${C30}, 0.5, 0, 1, 0, 0)`}>
        <circle r={0.85 * PU} fill={shade(m, -0.5)} fillOpacity={solid} {...stroke} />
      </g>
    </g>
  );
}

/** One step's copy in the left column: outlined number, title, body. */
function Step({ n, title, body, at, until, frame, p }: { n: string; title: string; body: string; at: number; until: number; frame: number; p: P }) {
  if (frame < at - 2 || frame > until + 2) return null;
  const out = prog(frame, until - 14, 14, ease.in);
  const numIn = prog(frame, at, 26, ease.out);
  const dark = isDark(p.background);
  const size = title.length > 8 ? 96 : 120;
  return (
    <div style={{ position: 'absolute', left: 130, top: 340, width: 760, opacity: 1 - out, translate: `${-out * 40}px 0` }}>
      <div
        style={{
          fontFamily: FONTS.bungee,
          fontSize: 170,
          lineHeight: 1,
          color: 'transparent',
          WebkitTextStroke: `3px ${p.accent}`,
          opacity: numIn,
          translate: `0 ${mix(40, 0, numIn)}px`,
        }}
      >
        {n}
      </div>
      <SweepReveal frame={frame} start={at + 6} dur={30} style={{ marginTop: 6 }}>
        <div style={{ fontFamily: FONTS.bungee, fontSize: size, lineHeight: 1.02, letterSpacing: '-0.02em', color: dark ? p.ink : p.accent, textShadow: `5px 5px 0 ${dark ? hexA('#000000', 0.35) : p.ink}`, paddingBottom: 10 }}>
          {title}
        </div>
      </SweepReveal>
      <WordsIn text={body} frame={frame} start={at + 18} stagger={3} style={{ marginTop: 18, fontFamily: FONTS.outfit, fontWeight: 500, fontSize: 46, lineHeight: 1.25, color: p.ink, maxWidth: 720 }} />
    </div>
  );
}

function Chip({ children, at, frame, p, style }: { children: ReactNode; at: number; frame: number; p: P; style: CSSProperties }) {
  const k = prog(frame, at, 24, ease.backOut);
  return (
    <div
      style={{
        position: 'absolute',
        padding: '12px 22px',
        borderRadius: 12,
        background: isDark(p.background) ? p.surface : '#FFF9F0',
        border: `2.5px solid ${p.ink}`,
        boxShadow: `6px 6px 0 ${p.ink}`,
        fontFamily: FONTS.vt323,
        fontSize: 40,
        color: p.ink,
        whiteSpace: 'nowrap',
        scale: String(k),
        opacity: clamp(k * 3),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function HowItWorks(p: P) {
  const frame = useCurrentFrame();
  const end = video.durationInFrames;
  const dark = isDark(p.background);
  const hasImage = !!p.partImage;
  const B1 = 0;
  const B2 = T.bars(1);
  const B3 = T.bars(2);
  const B4 = T.bars(3);

  // Camera + stage life
  const push = mix(1, 1.04, prog(frame, 0, B4, ease.inOutSoft));
  const stageIn = prog(frame, 8, 40, ease.out);
  const stageOut = prog(frame, B4 - 10, 24, ease.in);
  const flash2 = keys(frame, [B2 - 1, B2 + 3, B2 + 26], [0, 0.6, 0], [ease.out, ease.outSoft]);
  const flash4 = keys(frame, [B4 + 8, B4 + 12, B4 + 40], [0, 0.9, 0], [ease.out, ease.outSoft]);
  const outro = prog(frame, end - 30, 30, ease.inOut);

  // Part: outlines itself in bar 1, turns solid on the bar-2 downbeat
  const draw = prog(frame, 20, 70, ease.inOutSoft);
  const solid = mix(0.15, 1, prog(frame, B2, 24, ease.out));
  const cont = contour(hasImage);
  // Toolpath: tool circles the contour 1.5 times during bar 2
  const cut = prog(frame, B2 + 6, T.bars(1) - 10, ease.inOutSoft);
  const toolU = cut * 1.5 + 0.12;
  const [tx, ty] = along(cont, toolU);
  const cutting = frame >= B2 + 6 && frame < B3 - 2;
  // Scan in bar 3
  const scan = prog(frame, B3 + 4, 50, ease.inOutSoft);
  const scanning = frame >= B3 + 4 && frame < B3 + 56;

  const gcode = ['N0400 G90 G54 G17', 'N0410 T04 M06', 'N0420 S18000 M03', 'N0430 G01 X42.180 Y-12.004 F1800', 'N0440 G01 X120.000', 'N0450 G02 X126.0 Y-6.0 R6.0', 'N0460 G01 Y68.000', 'N0470 G01 X0.000', 'N0480 M05 M30'];
  const gScroll = Math.max(0, (frame - B2) / 14);

  // Big finale word
  const bigIn = prog(frame, B4 + 10, 30, ease.out);
  const ring = prog(frame, B4 + 10, 60, ease.out);
  const BIG = p.big.length > 4 ? 260 : 360;

  // Step rail progress
  const railU = keys(frame, [0, B2, B3, B4], [0, 0.5, 1, 1], ease.inOutSoft);

  return (
    <AbsoluteFill style={{ backgroundColor: p.background, color: p.ink }}>
      <Backdrop
        base={p.background}
        frame={frame}
        grid={{ opacity: dark ? 0.14 : 0.18, size: 40, y: -frame * 0.15, color: dark ? '234,242,255' : '59,31,20' }}
        lift={dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,250,240,0.8)'}
        glows={[
          { x: SX + SW / 2, y: SY + SH / 2, size: 1400, color: hexA(p.pop, dark ? 0.3 : 0.45), opacity: 0.6 + 0.2 * Math.sin(frame / 40) },
          { x: 200, y: 1000, size: 1200, color: hexA(p.accent, 0.25), opacity: 0.7 },
        ]}
        grain={0}
        vignette={dark ? 0.45 : 0.15}
      />
      <Dust frame={frame} width={W} height={H} count={40} color={p.pop} seed={4} opacity={0.4} speed={0.7} maxSize={5} />

      <AbsoluteFill style={{ scale: String(push), opacity: 1 - outro }}>
        {/* Eyebrow + step rail */}
        <div style={{ position: 'absolute', left: 130, top: 118, opacity: prog(frame, 4, 24), display: 'flex', alignItems: 'center', gap: 18, fontFamily: FONTS.vt323, fontSize: 44, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
          <span style={{ width: 16, height: 16, borderRadius: '50%', background: p.accent, boxShadow: `0 0 0 6px ${hexA(p.accent, 0.2)}` }} />
          {p.eyebrow}
        </div>
        <svg style={{ position: 'absolute', left: 130, top: 196, overflow: 'visible', opacity: prog(frame, 8, 24) * (1 - prog(frame, B4 - 10, 20, ease.in)) }} width={640} height={30}>
          <line x1={10} y1={15} x2={630} y2={15} stroke={hexA(p.ink, 0.3)} strokeWidth={3} strokeDasharray="10 8" />
          <line x1={10} y1={15} x2={10 + 620 * railU} y2={15} stroke={p.accent} strokeWidth={4} strokeDasharray="10 8" />
          {[0, 0.5, 1].map((k, i) => (
            <circle key={i} cx={10 + 620 * k} cy={15} r={11} fill={railU >= k - 0.001 ? p.accent : p.background} stroke={p.ink} strokeWidth={3} />
          ))}
          <circle cx={10 + 620 * railU} cy={15} r={6} fill={p.pop} />
          {[p.step1, p.step2, p.step3].map((s, i) => (
            <text key={i} x={10 + 310 * i} y={66} textAnchor={i === 0 ? 'start' : i === 1 ? 'middle' : 'end'} fontFamily={FONTS.vt323} fontSize={34} letterSpacing="3" fill={p.ink} opacity={railU >= i * 0.5 - 0.001 ? 1 : 0.45}>
              {`0${i + 1} ${s.toUpperCase()}`}
            </text>
          ))}
        </svg>

        <Step n="01" title={p.step1} body={p.step1Body} at={B1 + 12} until={B2} frame={frame} p={p} />
        <Step n="02" title={p.step2} body={p.step2Body} at={B2 + 4} until={B3} frame={frame} p={p} />
        <Step n="03" title={p.step3} body={p.step3Body} at={B3 + 4} until={B4} frame={frame} p={p} />

        {/* Stage: the machine's window */}
        <div
          style={{
            position: 'absolute',
            left: SX,
            top: SY,
            width: SW,
            height: SH,
            opacity: stageIn * (1 - stageOut),
            translate: `${mix(80, 0, stageIn) + stageOut * 60}px 0`,
            scale: String(mix(1, 0.94, stageOut)),
            filter: stageIn < 1 ? `blur(${(1 - stageIn) * 10}px)` : undefined,
          }}
        >
          <div style={{ position: 'absolute', inset: 0, borderRadius: 26, background: p.surface, border: `3px solid ${p.ink}`, boxShadow: `14px 14px 0 ${p.ink}`, overflow: 'hidden' }}>
            {/* header bar */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 64, background: p.ink, color: p.background, display: 'flex', alignItems: 'center', gap: 14, padding: '0 26px', fontFamily: FONTS.vt323, fontSize: 34, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: p.pop, opacity: 0.5 + 0.5 * Math.round((Math.sin(frame / 8) + 1) / 2) }} />
              {p.cellLabel}
              <span style={{ marginLeft: 'auto', color: p.pop }}>{frame < B2 ? 'QUOTING' : frame < B3 ? 'CUTTING' : 'INSPECT'}</span>
            </div>
            {/* inner grid */}
            <div style={{ position: 'absolute', left: 0, right: 0, top: 64, bottom: 0, backgroundImage: `linear-gradient(${hexA(p.ink, 0.08)} 1px, transparent 1px), linear-gradient(90deg, ${hexA(p.ink, 0.08)} 1px, transparent 1px)`, backgroundSize: '40px 40px', backgroundPosition: `0 ${-frame * 0.3}px` }} />
          </div>

          {hasImage && (
            <Img
              src={p.partImage}
              style={{ position: 'absolute', left: SW * 0.19 + 10, top: SH * 0.17 + 10, width: SW * 0.62 - 20, height: SH * 0.58 - 20, objectFit: 'contain', opacity: draw, filter: `saturate(${mix(0.2, 1, solid)})` }}
            />
          )}
          <svg width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
            <defs>
              <radialGradient id="hiw-spark">
                <stop offset="0" stopColor={p.pop} stopOpacity="1" />
                <stop offset="0.4" stopColor={p.pop} stopOpacity="0.4" />
                <stop offset="1" stopColor={p.pop} stopOpacity="0" />
              </radialGradient>
              <linearGradient id="hiw-scan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={p.accent2} stopOpacity="0" />
                <stop offset="0.85" stopColor={p.accent2} stopOpacity="0.35" />
                <stop offset="1" stopColor={p.accent2} stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {/* toolpath: faint full contour, then the cut trail in accent */}
            <polygon points={cont.map((c) => c.join(',')).join(' ')} fill="none" stroke={hexA(p.ink, 0.25)} strokeWidth={2.5} strokeDasharray="10 8" opacity={draw} />
            <polygon
              points={cont.map((c) => c.join(',')).join(' ')}
              fill="none"
              stroke={p.accent}
              strokeWidth={5}
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={`${clamp(cut * 1.5)} 1`}
              strokeDashoffset={-0.12}
              opacity={frame >= B2 + 6 ? 1 : 0}
            />
            {!hasImage && <Bracket p={p} draw={draw} solid={solid} />}

            {/* tool + sparks */}
            {frame >= B2 && frame < B3 + 10 && (
              <g opacity={1 - prog(frame, B3 - 4, 14, ease.in)}>
                {Array.from({ length: 60 }, (_, i) => {
                  const age = i * 0.8 + (frame % 2) * 0.4;
                  const born = frame - age;
                  if (!cutting || born < B2 + 6) return null;
                  const [ox, oy] = along(cont, prog(born, B2 + 6, T.bars(1) - 10, ease.inOutSoft) * 1.5 + 0.12);
                  const a = rand(i * 3.7 + Math.floor(born)) * Math.PI * 2;
                  const sp = 3 + rand(i * 9.1 + Math.floor(born)) * 7;
                  const x = ox + Math.cos(a) * sp * age;
                  const y = oy + Math.sin(a) * sp * age * 0.6 + 0.35 * age * age;
                  return <line key={i} x1={x} y1={y} x2={x - Math.cos(a) * 16} y2={y - Math.sin(a) * 16} stroke={i % 4 ? p.pop : p.accent} strokeWidth={4.5} strokeLinecap="round" opacity={clamp(1 - age / 46)} />;
                })}
                <circle cx={tx} cy={ty} r={60} fill="url(#hiw-spark)" opacity={cutting ? 0.8 + 0.2 * Math.sin(frame) : 0} />
                {/* end mill */}
                <rect x={tx - 9} y={ty - 170} width={18} height={162} rx={4} fill={shade(p.surface, 0.3)} stroke={p.ink} strokeWidth={2.5} />
                {[0, 1, 2, 3, 4].map((i) => {
                  const o = ((frame * 3 + i * 14) % 70) - 70;
                  return <line key={i} x1={tx - 9} y1={ty + o} x2={tx + 9} y2={ty + o + 9} stroke={hexA(p.ink, 0.6)} strokeWidth={2} opacity={o > -70 && o < -8 ? 1 : 0} />;
                })}
                <rect x={tx - 30} y={ty - 230} width={60} height={70} rx={8} fill={p.accent2} stroke={p.ink} strokeWidth={2.5} />
                <rect x={tx - 30} y={ty - 192} width={60} height={8} fill={p.pop} />
                <circle cx={tx} cy={ty} r={9} fill={p.pop} stroke={p.ink} strokeWidth={2.5} />
              </g>
            )}

            {/* inspection scan */}
            {scanning && (
              <g>
                <rect x={30} y={64 + mix(0, SH - 140, scan) - 120} width={SW - 60} height={120} fill="url(#hiw-scan)" />
                <line x1={30} x2={SW - 30} y1={64 + mix(0, SH - 140, scan)} y2={64 + mix(0, SH - 140, scan)} stroke={p.accent2} strokeWidth={4} />
              </g>
            )}
          </svg>

          {/* Bar 1 chips: file + quote */}
          {frame < B2 + 10 && (
            <div style={{ opacity: 1 - prog(frame, B2 - 6, 14, ease.in) }}>
              <Chip at={B1 + 36} frame={frame} p={p} style={{ left: 36, bottom: 40, transformOrigin: 'bottom left' }}>
                ▲ {typed(frame, B1 + 40, FPS, 30, p.fileName)}
                <div style={{ height: 8, marginTop: 8, borderRadius: 4, background: hexA(p.ink, 0.15) }}>
                  <div style={{ height: '100%', width: `${prog(frame, B1 + 44, 40, ease.inOutSoft) * 100}%`, borderRadius: 4, background: p.accent2 }} />
                </div>
              </Chip>
              <Chip at={B1 + T.beats(3)} frame={frame} p={p} style={{ right: 36, bottom: 40, transformOrigin: 'bottom right', fontFamily: FONTS.bungee, fontSize: 48, color: dark ? p.ink : p.accent }}>
                {p.price}
              </Chip>
            </div>
          )}

          {/* Bar 2: G-code ticker */}
          {frame >= B2 && frame < B3 + 10 && (
            <div style={{ position: 'absolute', left: 30, bottom: 28, width: 470, height: 126, overflow: 'hidden', borderRadius: 12, background: hexA(p.ink, 0.92), padding: '8px 16px', opacity: prog(frame, B2 + 8, 16) * (1 - prog(frame, B3 - 4, 14, ease.in)) }}>
              <div style={{ translate: `0 ${-(gScroll % gcode.length) * 36}px`, fontFamily: FONTS.vt323, fontSize: 34, lineHeight: '36px', color: p.pop }}>
                {[...gcode, ...gcode].map((g, i) => (
                  <div key={i} style={{ opacity: i === Math.floor(gScroll % gcode.length) + 1 ? 1 : 0.55 }}>
                    {g}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bar 3: pass chip + ship chip */}
          {frame >= B3 && (
            <>
              <Chip at={B3 + T.beats(2)} frame={frame} p={p} style={{ left: 36, bottom: 40, transformOrigin: 'bottom left', background: p.accent2, color: '#FFF8EE', border: `2.5px solid ${p.ink}` }}>
                ✓ {p.passLabel}
              </Chip>
              <Chip at={B3 + T.beats(3)} frame={frame} p={p} style={{ right: 36, bottom: 40, transformOrigin: 'bottom right' }}>
                ▶ Ships Thu · 72h
              </Chip>
            </>
          )}
        </div>

        {/* Finale: big word, shockwave, tagline, CTA */}
        {frame >= B4 && (
          <>
            <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
              <circle cx={W / 2} cy={470} r={BIG * 0.9 + ring * 700} fill="none" stroke={p.accent} strokeWidth={mix(10, 1, ring)} opacity={frame >= B4 + 10 ? (1 - ring) * 0.7 : 0} strokeDasharray="22 14" />
            </svg>
            <div
              style={{
                position: 'absolute',
                left: 0,
                width: W,
                top: 470 - BIG * 0.55,
                textAlign: 'center',
                fontFamily: FONTS.bungee,
                fontSize: BIG,
                lineHeight: 1.05,
                letterSpacing: '-0.03em',
                color: dark ? p.ink : p.accent,
                textShadow: `14px 14px 0 ${dark ? hexA('#000000', 0.35) : p.ink}`,
                opacity: clamp(bigIn * 2),
                scale: String(mix(1.3, 1, bigIn)),
                filter: bigIn < 1 ? `blur(${(1 - bigIn) * 18}px)` : undefined,
              }}
            >
              {p.big}
            </div>
            <Glint frame={frame} start={B4 + T.beats(3)} dur={44} style={{ position: 'absolute', left: 0, width: W, top: 470 - BIG * 0.55, textAlign: 'center', fontFamily: FONTS.bungee, fontSize: BIG, lineHeight: 1.05, letterSpacing: '-0.03em' }}>
              {p.big}
            </Glint>
            <WordsIn
              text={p.tagline}
              frame={frame}
              start={B4 + 26}
              stagger={4}
              style={{ position: 'absolute', left: 0, width: W, top: 470 + BIG * 0.6, justifyContent: 'center', fontFamily: FONTS.outfit, fontWeight: 500, fontSize: 58, color: p.ink }}
            />
            <div style={{ position: 'absolute', left: 0, width: W, top: 470 + BIG * 0.6 + 110, display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  fontFamily: FONTS.vt323,
                  fontSize: 50,
                  letterSpacing: '0.08em',
                  padding: '14px 40px',
                  borderRadius: 14,
                  background: dark ? p.accent : p.ink,
                  color: dark ? p.background : '#FFF8EE',
                  boxShadow: `8px 8px 0 ${dark ? hexA('#000000', 0.4) : p.accent}`,
                  scale: String(prog(frame, B4 + T.beats(2), 26, ease.backOut)),
                  opacity: clamp(prog(frame, B4 + T.beats(2), 10)),
                }}
              >
                {p.cta} →
              </div>
            </div>
          </>
        )}
      </AbsoluteFill>

      <AbsoluteFill style={{ background: `radial-gradient(circle at ${SX + SW / 2}px ${SY + SH / 2}px, ${hexA('#FFF8EE', flash2)} 0%, ${hexA(p.pop, flash2 * 0.6)} 22%, transparent 50%)`, mixBlendMode: 'screen' }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 44%, ${hexA('#FFF8EE', flash4)} 0%, ${hexA(p.pop, flash4 * 0.5)} 25%, transparent 60%)` }} />
      <FilmOverlay grain={0.05} vignette={dark ? 0.4 : 0.12} frame={frame} />
    </AbsoluteFill>
  );
}
