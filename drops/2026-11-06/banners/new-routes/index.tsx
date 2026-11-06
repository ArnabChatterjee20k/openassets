import { z } from 'zod';
import { color, font, image, select, text, textarea } from '@/lib/params';
import { FONTS } from '@/lib/fonts';
import type { AssetMeta, BannerSize } from '@/lib/types';
import { Backdrop, displayFace, hexA, shade } from '@/kit';

export const meta: AssetMeta = {
  kind: 'banner',
  name: 'New Routes',
  description:
    'Route-launch banner for an AI ad agent: a 70s split-flap departures board announcing the ad platforms added this month, a striped sun rising behind it and a bold serif headline with a boarding-pass CTA.',
  tags: ['announcement', 'launch', 'social', 'ads', 'airport', 'departures', 'sunset'],
};

const STATUS = ['NEW', 'BOARDING', 'ON TIME', 'DELAYED', 'DEPARTED', ''] as const;

export const schema = z.object({
  eyebrow: text().default('New routes · November'),
  headline: text('Headline line 1').default('Three new places'),
  headline2: text('Headline line 2 (accent)').default('to fly your brief.'),
  body: textarea().default('Connected TV, Threads and Reddit Pro are now live in Towline. Same brief, same budget rules, three more skies to win in.'),
  cta: text('Button (empty to hide)').default('See all 37 routes'),
  url: text('URL').default('towline.ai/routes'),
  boardTitle: text('Board title').default('Departures'),
  boardTime: text('Board clock').default('09:41'),
  boardFooter: text('Board footer').default('37 routes · all gates open'),
  route1Code: text('Route 1 flight').default('TL-034'),
  route1: text('Route 1 destination').default('Pinterest'),
  route1Status: select(STATUS, 'Route 1 status').default('ON TIME'),
  route2Code: text('Route 2 flight').default('TL-035'),
  route2: text('Route 2 destination').default('Connected TV'),
  route2Status: select(STATUS, 'Route 2 status').default('NEW'),
  route3Code: text('Route 3 flight').default('TL-036'),
  route3: text('Route 3 destination').default('Threads Ads'),
  route3Status: select(STATUS, 'Route 3 status').default('NEW'),
  route4Code: text('Route 4 flight').default('TL-037'),
  route4: text('Route 4 destination').default('Reddit Pro'),
  route4Status: select(STATUS, 'Route 4 status').default('BOARDING'),
  font: font('Headline font').default('gloock'),
  background: color().default('#FFEDE1'),
  surface: color('Haze / flaps').default('#FFD3C2'),
  ink: color('Text + board').default('#3D0E2A'),
  accent: color('Accent (sun, headline)').default('#FF4F6D'),
  accent2: color('Sky + shadow').default('#7B2CBF'),
  pop: color('NEW stamp').default('#FFB627'),
  logo: image('Logo (optional)').default(''),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { background: '#2B1B2E', surface: '#45293F', ink: '#FFE9D6', accent: '#FF8E5E', accent2: '#E5487A', pop: '#FFD27F' },
  citrus: {
    background: '#FFF8E1', surface: '#FFE9A8', ink: '#1C2B1A', accent: '#FF7A00', accent2: '#2BB24C', pop: '#FF3D7F', font: 'shrikhand',
    headline: 'Fresh routes,', headline2: 'just landed.',
  },
  'mid-century': {
    background: '#F4E9D8', surface: '#E6D3B3', ink: '#2E2A24', accent: '#D96C3D', accent2: '#2C7873', pop: '#E9B44C', font: 'fraunces',
    eyebrow: 'Flight TL-037 · Gate: all of them', boardTitle: 'Arrivals', route1Status: 'DEPARTED',
  },
  lilac: {
    background: '#E9E3F5', surface: '#D6CCEC', ink: '#231942', accent: '#5E4AE3', accent2: '#F49CBB', pop: '#2EC4B6', font: 'syne',
    headline: '+3 routes.', headline2: 'One brief.', route2: 'Snapchat', route3: 'Amazon DSP', route4: 'Spotify Audio',
    body: 'Snapchat, Amazon DSP and Spotify Audio just joined the network. Write one brief and Towline flies it to all 37.',
  },
  minimal: { body: '', cta: '', eyebrow: 'Towline', route1Code: '', route1: '', boardFooter: '' },
};

type P = z.infer<typeof schema> & BannerSize;
type Status = (typeof STATUS)[number];

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114;
};
const isDark = (hex: string) => lum(hex) < 140;
const onColor = (bg: string, a: string, b: string) => (Math.abs(lum(a) - lum(bg)) > Math.abs(lum(b) - lum(bg)) ? a : b);

interface Route {
  code: string;
  name: string;
  status: Status;
}

/** One split-flap character tile: two halves, a seam with hinge pins, a mono glyph. */
function Flap({ x, y, w, h, ch, c }: { x: number; y: number; w: number; h: number; ch: string; c: Colors }) {
  const r = w * 0.12;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={r} fill={c.tile} />
      <rect x={x} y={y} width={w} height={h / 2} rx={r} fill={c.tileTop} />
      {ch !== ' ' && (
        <text x={x + w / 2} y={y + h * 0.72} textAnchor="middle" fontFamily={FONTS.spacemono} fontWeight={700} fontSize={h * 0.66} fill={c.flapText}>
          {ch}
        </text>
      )}
      <rect x={x} y={y + h / 2 - h * 0.025} width={w} height={h * 0.05} fill={c.body} />
      <rect x={x - w * 0.02} y={y + h / 2 - h * 0.07} width={w * 0.08} height={h * 0.14} rx={w * 0.03} fill={c.body} />
      <rect x={x + w * 0.94} y={y + h / 2 - h * 0.07} width={w * 0.08} height={h * 0.14} rx={w * 0.03} fill={c.body} />
    </g>
  );
}

interface Colors {
  body: string;
  tile: string;
  tileTop: string;
  flapText: string;
  pin: string;
  label: string;
}

function Pill({ x, y, w, h, status, p, c }: { x: number; y: number; w: number; h: number; status: Status; p: P; c: Colors }) {
  if (!status) return null;
  const filled = status === 'NEW' || status === 'BOARDING';
  const fill = status === 'NEW' ? p.pop : status === 'BOARDING' ? p.accent : 'none';
  const txt = filled ? onColor(fill, c.body, c.flapText) : c.label;
  const fs = Math.min(h * 0.6, (w * 0.82) / (status.length * 0.72));
  const dot = status === 'BOARDING';
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} stroke={filled ? 'none' : c.label} strokeWidth={Math.max(1.2, h * 0.05)} strokeOpacity={0.6} />
      {dot && <circle cx={x + h * 0.42} cy={y + h / 2} r={h * 0.11} fill={txt} />}
      <text x={x + w / 2 + (dot ? h * 0.14 : 0)} y={y + h / 2 + fs * 0.36} textAnchor="middle" fontFamily={FONTS.spacemono} fontWeight={700} fontSize={fs} letterSpacing={fs * 0.12} fill={txt}>
        {status}
      </text>
    </g>
  );
}

/** Little poster plane for the board header, nose to the right. */
function HeaderPlane({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s / 24}) rotate(-18 12 12)`}>
      <path d="M1,12 C1,10.8 2.2,10.4 4,10.4 L9,10.4 L5.5,2 L8.4,2 L14.6,10.4 L20,10.4 C22.4,10.4 23.6,11.2 23.6,12 C23.6,12.8 22.4,13.6 20,13.6 L14.6,13.6 L8.4,22 L5.5,22 L9,13.6 L4,13.6 C2.2,13.6 1,13.2 1,12 Z M1.2,12 L0.2,7.6 L2,7.6 L4.4,10.6 Z" fill={fill} />
    </g>
  );
}

export default function NewRoutes(p: P) {
  const { width: W, height: H } = p;
  const stacked = W / H < 1.3;
  const strip = W / H > 3;
  const dark = isDark(p.background);
  const pad = stacked ? W * 0.07 : strip ? H * 0.11 : Math.max(W * 0.05, H * 0.08);
  const gid = `nr-${W}x${H}`;

  const c: Colors = dark
    ? { body: shade(p.background, -0.45), tile: shade(p.background, 0.08), tileTop: shade(p.background, 0.14), flapText: p.ink, pin: shade(p.background, 0.3), label: p.ink }
    : { body: p.ink, tile: shade(p.ink, 0.1), tileTop: shade(p.ink, 0.16), flapText: p.background, pin: shade(p.ink, 0.35), label: p.background };

  const all: Route[] = [
    { code: p.route1Code, name: p.route1, status: p.route1Status },
    { code: p.route2Code, name: p.route2, status: p.route2Status },
    { code: p.route3Code, name: p.route3, status: p.route3Status },
    { code: p.route4Code, name: p.route4, status: p.route4Status },
  ].filter((r) => r.name || r.code);
  // The strip keeps only the newest three routes (the bottom of the board).
  const rows = strip ? all.slice(-3) : all;
  const nRows = Math.max(rows.length, 1);

  // Board grid, measured in flap cells.
  const codeN = Math.max(4, ...rows.map((r) => r.code.length));
  const nameN = Math.min(16, Math.max(9, ...rows.map((r) => r.name.length)));
  const gapC = 0.55;
  const pillC = 6.6;
  const cellsW = codeN + gapC + nameN + gapC + pillC;
  const aspect = 1.45; // flap height / width
  const flapGap = 0.12; // between flaps, in cells
  const rowH = aspect + 0.42; // cells per row incl. spacing
  const headerH = strip ? 1.7 : 2.1;
  const colHeadH = strip ? 0 : 0.95;
  const footH = strip || !p.boardFooter ? 0.3 : 1.55;
  const padC = 0.9;
  const cellsH = padC * 2 + headerH + colHeadH + nRows * rowH + footH;
  const totalW = cellsW + padC * 2;

  // Available box for the board.
  let maxBW: number, maxBH: number;
  if (stacked) {
    maxBW = W - pad * 2;
    maxBH = H * 0.36;
  } else if (strip) {
    maxBW = W * 0.5;
    maxBH = H - pad * 2.1;
  } else {
    maxBW = W * 0.52;
    maxBH = H - pad * 2.6;
  }
  const cw = Math.min(maxBW / totalW, maxBH / cellsH);
  const bw = totalW * cw;
  const bh = cellsH * cw;
  const bx = stacked ? (W - bw) / 2 : W - pad - bw * 1.0 - cw * 0.4;
  const by = stacked ? pad + H * 0.06 : (H - bh) / 2 + (strip ? H * 0.02 : H * 0.03);
  const fw = cw * (1 - flapGap);
  const fh = cw * aspect;

  // Sun peeks over the board's top-left shoulder.
  const sunR = stacked ? bh * 0.5 : strip ? bh * 0.55 : bh * 0.5;
  const sunX = bx + bw * (stacked ? 0.72 : 0.2);
  const sunY = by - (stacked ? 0 : bh * 0.02);

  // Type scale
  const colW = stacked ? W - pad * 2 : bx - pad - (strip ? W * 0.035 : W * 0.045);
  const longest = Math.max(p.headline.length, p.headline2.length, 8);
  // chars-per-em budget: wide display faces need more room than Gloock.
  const perEm = p.font === 'gloock' ? 2.2 : ['syne', 'unbounded', 'monoton'].includes(p.font) ? 1.3 : p.font === 'shrikhand' ? 1.55 : 1.9;
  const fit = (colW / longest) * perEm;
  const head = stacked ? Math.min(W * 0.07, fit) : strip ? Math.min(H * 0.15, fit) : Math.min(H * 0.125, fit);
  const small = Math.max(head * 0.3, 13);

  // y positions inside the board
  const yHeader = by + padC * cw;
  const yCol = yHeader + headerH * cw;
  const yRows = yCol + colHeadH * cw;
  const xCode = bx + padC * cw;
  const xName = xCode + (codeN + gapC) * cw;
  const xPill = xName + (nameN + gapC) * cw;
  const labelFs = cw * 0.42;

  const hdrFs = cw * (strip ? 0.78 : 0.88);
  const stripeH = Math.max(H * 0.012, 4);

  return (
    <div style={{ width: W, height: H, position: 'relative', overflow: 'hidden', color: p.ink, fontFamily: FONTS.syne }}>
      <Backdrop
        base={p.background}
        grid={{ opacity: dark ? 0.07 : 0.09, size: Math.round(Math.min(W, H) / 22), color: dark ? '255,233,214' : '61,14,42' }}
        lift={dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)'}
        glows={[
          { x: sunX, y: sunY, size: sunR * 5, color: hexA(p.accent, dark ? 0.4 : 0.25), opacity: 1 },
          { x: stacked ? W * 0.1 : W * 0.06, y: H * 1.05, size: Math.max(W, H) * 0.7, color: hexA(p.pop, dark ? 0.18 : 0.3), opacity: 0.9 },
        ]}
        grain={dark ? 0.06 : 0.04}
        vignette={dark ? 0.5 : 0.06}
      />

      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id={`${gid}-haze`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.surface} stopOpacity={0} />
            <stop offset="1" stopColor={p.surface} stopOpacity={dark ? 0.55 : 0.9} />
          </linearGradient>
          <linearGradient id={`${gid}-sun`} gradientUnits="userSpaceOnUse" x1={0} y1={sunY - sunR} x2={0} y2={sunY + sunR * 0.4}>
            <stop offset="0" stopColor={p.pop} />
            <stop offset="0.55" stopColor={p.accent} />
            <stop offset="1" stopColor={p.accent2} />
          </linearGradient>
          <mask id={`${gid}-sunmask`} maskUnits="userSpaceOnUse" x={0} y={0} width={W} height={H}>
            <circle cx={sunX} cy={sunY} r={sunR} fill="#fff" />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x={sunX - sunR * 1.1} y={sunY - sunR * 0.48 + i * sunR * 0.2} width={sunR * 2.2} height={sunR * (0.025 + i * 0.022)} fill="#000" />
            ))}
          </mask>
        </defs>

        {/* sky haze rising from the ground */}
        <rect x={0} y={H * 0.45} width={W} height={H * 0.55} fill={`url(#${gid}-haze)`} />
        {/* striped 70s sun */}
        <circle cx={sunX} cy={sunY} r={sunR} fill={`url(#${gid}-sun)`} mask={`url(#${gid}-sunmask)`} />

        {/* 70s livery stripes along the floor */}
        {[p.accent2, p.accent, p.pop].map((col, i) => (
          <rect key={i} x={0} y={H - stripeH * (3.6 - i * 1.2)} width={W} height={stripeH} fill={col} opacity={0.95} />
        ))}

        {/* hanging rods */}
        {[0.07, 0.93].map((f) => <rect key={f} x={bx + bw * f - cw * 0.08} y={0} width={cw * 0.16} height={by} fill={p.ink} opacity={dark ? 0.5 : 0.85} />)}

        {/* board: hard riso shadow + body */}
        <rect x={bx + cw * 0.45} y={by + cw * 0.5} width={bw} height={bh} rx={cw * 0.6} fill={dark ? p.accent : p.accent2} />
        <rect x={bx} y={by} width={bw} height={bh} rx={cw * 0.6} fill={c.body} stroke={dark ? hexA(p.ink, 0.25) : p.ink} strokeWidth={Math.max(1.5, cw * 0.06)} />

        {/* header: plane + title, clock on the right */}
        <HeaderPlane x={xCode} y={yHeader + cw * 0.05} s={hdrFs * 1.25} fill={p.pop} />
        <text x={xCode + hdrFs * 1.6} y={yHeader + hdrFs * 1.0} fontFamily={FONTS.spacemono} fontWeight={700} fontSize={hdrFs} letterSpacing={hdrFs * 0.28} fill={c.label}>
          {p.boardTitle.toUpperCase()}
        </text>
        {p.boardTime && (
          <text x={bx + bw - padC * cw} y={yHeader + hdrFs * 1.0} textAnchor="end" fontFamily={FONTS.spacemono} fontWeight={700} fontSize={hdrFs} letterSpacing={hdrFs * 0.1} fill={p.pop}>
            {p.boardTime}
          </text>
        )}
        <rect x={xCode} y={yCol - cw * 0.42} width={bw - padC * cw * 2} height={Math.max(1, cw * 0.05)} fill={c.label} opacity={0.25} />

        {/* column heads */}
        {!strip &&
          [
            ['Flight', xCode],
            ['Destination', xName],
            ['Status', xPill],
          ].map(([t, x]) => (
            <text key={t as string} x={x as number} y={yCol + labelFs * 0.9} fontFamily={FONTS.spacemono} fontSize={labelFs} letterSpacing={labelFs * 0.3} fill={c.label} opacity={0.6}>
              {(t as string).toUpperCase()}
            </text>
          ))}

        {/* rows of flaps */}
        {rows.map((r, i) => {
          const y = yRows + i * rowH * cw;
          const code = r.code.toUpperCase().padEnd(codeN, ' ').slice(0, codeN);
          const name = r.name.toUpperCase().padEnd(nameN, ' ').slice(0, nameN);
          return (
            <g key={i}>
              {code.split('').map((ch, k) => (
                <Flap key={`c${k}`} x={xCode + k * cw} y={y} w={fw} h={fh} ch={ch} c={c} />
              ))}
              {name.split('').map((ch, k) => (
                <Flap key={`n${k}`} x={xName + k * cw} y={y} w={fw} h={fh} ch={ch} c={c} />
              ))}
              <Pill x={xPill} y={y + fh * 0.16} w={pillC * cw - cw * 0.1} h={fh * 0.68} status={r.status} p={p} c={c} />
            </g>
          );
        })}

        {/* footer ticker */}
        {!strip && p.boardFooter && (
          <text x={xCode} y={by + bh - padC * cw - cw * 0.12} fontFamily={FONTS.spacemono} fontSize={labelFs} letterSpacing={labelFs * 0.3} fill={c.label} opacity={0.7}>
            {`◆ ${p.boardFooter.toUpperCase()}`}
          </text>
        )}
      </svg>

      {/* Copy */}
      <div
        style={{
          position: 'absolute',
          left: pad,
          width: colW,
          ...(stacked
            ? { top: by + bh + cw * 0.5 + pad * 0.35, bottom: pad * 0.6 + stripeH * 3.6, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }
            : { top: 0, bottom: 0, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center' }),
        }}
      >
        {p.logo && <img src={p.logo} alt="" style={{ height: small * 2, marginBottom: small * 0.8, objectFit: 'contain', alignSelf: 'flex-start' }} />}
        {p.eyebrow && (
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: small * 0.5,
                padding: `${small * 0.32}px ${small * 0.8}px`,
                borderRadius: 999,
                border: `${Math.max(1.5, small * 0.08)}px solid ${p.ink}`,
                fontFamily: FONTS.spacemono,
                fontWeight: 700,
                fontSize: small * 0.78,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ width: small * 0.5, height: small * 0.5, borderRadius: '50%', background: p.pop, border: `1.5px solid ${p.ink}` }} />
              {p.eyebrow}
            </span>
          </div>
        )}
        <div style={{ ...displayFace(p.font), fontSize: head, lineHeight: 0.98, letterSpacing: '-0.03em', marginTop: small * (strip ? 0.6 : 0.9) }}>
          <div style={{ color: p.ink }}>{p.headline}</div>
          <div style={{ color: p.accent }}>{p.headline2}</div>
        </div>
        {!strip && p.body && <div style={{ fontSize: small * 1.05, lineHeight: 1.45, opacity: 0.85, marginTop: small * 0.9, maxWidth: colW * 0.94 }}>{p.body}</div>}
        {(p.cta || p.url) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: small * 1.1, rowGap: small * 0.7, marginTop: small * (strip ? 0.8 : 1.4) }}>
            {p.cta && (
              <span
                style={{
                  padding: `${small * 0.62}px ${small * 1.3}px`,
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: small * 0.95,
                  color: p.background,
                  background: p.ink,
                  boxShadow: `${small * 0.22}px ${small * 0.22}px 0 ${p.accent}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {p.cta} →
              </span>
            )}
            {p.url && !strip && <span style={{ fontFamily: FONTS.spacemono, fontSize: small * 0.82, letterSpacing: '0.08em' }}>{p.url}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
