import type { ReactNode } from 'react';
import { z } from 'zod';
import { color, toggle } from '@/lib/params';
import type { AssetMeta, SceneConfig } from '@/lib/types';
import { Flicker, IsoBox, IsoCylinder, IsoGable, IsoGrid, IsoRoof, IsoWindow, iso, pts, rand, shade } from '@/kit';

export const meta: AssetMeta = {
  kind: 'scene',
  name: 'Stormcast HQ',
  description: 'Landing-page hero: a floating isometric island at night — weather tower with pulsing radar, glowing HQ, drifting storm cloud with lightning and rain. Loops seamlessly.',
  tags: ['hero', 'isometric', 'landing page', 'night', 'animated svg'],
};

// Every SMIL duration below divides this loop (6, 3, 2, 1.5, 1 s).
export const scene: SceneConfig = { width: 1200, height: 900, loop: 6 };

export const schema = z.object({
  skyTop: color('Sky top').default('#0B1416'),
  skyBottom: color('Sky bottom').default('#1C3A3A'),
  ground: color('Grass').default('#3FA7A0'),
  soil: color('Rock').default('#2A2F38'),
  building: color('Walls').default('#C9D3D1'),
  roof: color('Roof').default('#16302F'),
  glow: color('Window light').default('#FFD36B'),
  bolt: color('Lightning').default('#D4FF3A'),
  cloud: color('Cloud').default('#3C4A4E'),
  moon: toggle('Moon').default(true),
  rain: toggle('Rain').default(true),
  lightning: toggle('Lightning').default(true),
});

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  dusk: { skyTop: '#2B1B2E', skyBottom: '#FF8E5E', ground: '#E5487A', building: '#FFE9D6', roof: '#45293F', glow: '#FFD27F', cloud: '#5A3550', bolt: '#FFD27F' },
  daylight: { skyTop: '#9FD3F0', skyBottom: '#E9F6FB', ground: '#6CC070', soil: '#7A5A44', building: '#FFFFFF', roof: '#E4572E', glow: '#FFF3C4', cloud: '#FFFFFF', moon: false, lightning: false },
  ultraviolet: { skyTop: '#12001F', skyBottom: '#3A0A5E', ground: '#B026FF', soil: '#24003D', building: '#FBEFFF', roof: '#24003D', glow: '#FF2E88', cloud: '#2A1440', bolt: '#FFD600' },
  calm: { rain: false, lightning: false },
};

type P = z.infer<typeof schema>;

const U = 44; // pixels per world unit
const LOOP = scene.loop;
const spline = { calcMode: 'spline', keySplines: '0.45 0 0.55 1;0.45 0 0.55 1' } as const;

/** Places world-space content; the island is centred on the canvas. */
const ORIGIN: [number, number] = [600, 300];

function Tree({ x, y, s = 1, p }: { x: number; y: number; s?: number; p: P }) {
  return (
    <g>
      <IsoCylinder x={x} y={y} r={0.12 * s} h={0.7 * s} color={shade(p.soil, 0.25)} u={U} />
      <IsoCylinder x={x} y={y} z={0.55 * s} r={0.55 * s} h={0.1} color={p.ground} u={U} cone={{ h: 1.6 * s, color: shade(p.ground, -0.15) }} />
    </g>
  );
}

function Stars({ p }: { p: P }) {
  const stars: ReactNode[] = [];
  for (let i = 0; i < 46; i++) {
    const x = rand(i * 3.1) * 1200;
    const y = rand(i * 7.7) * 420;
    const r = 0.6 + rand(i * 1.3) * 1.4;
    const dur = [2, 3, 6][i % 3];
    stars.push(
      <circle key={i} cx={x} cy={y} r={r} fill="#ffffff" opacity={0.7}>
        <animate attributeName="opacity" values="0.15;0.9;0.15" dur={`${dur}s`} begin={`-${(rand(i * 5.9) * dur).toFixed(2)}s`} repeatCount="indefinite" />
      </circle>,
    );
  }
  return <g opacity={p.moon ? 1 : 0}>{stars}</g>;
}

export default function StormcastHQ(p: P) {
  // Lightning timing within the loop: double flash at ~55% of the loop.
  const flashTimes = '0;0.54;0.55;0.57;0.59;0.62;1';
  const flashVals = '0;0;1;0.2;0.9;0;0';

  const [tx, ty] = iso([1.5 + 0.6, 1.5 + 0.6, 6.2], U); // tower top (anemometer)
  const [rx, ry] = iso([1.5 + 0.6, 1.5 + 0.6, 5.5], U); // radar centre

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="hq-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.skyTop} />
          <stop offset="1" stopColor={p.skyBottom} />
        </linearGradient>
        <radialGradient id="hq-moon" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFF6DD" />
          <stop offset="0.45" stopColor="#FFF6DD" stopOpacity="0.35" />
          <stop offset="1" stopColor="#FFF6DD" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hq-fog" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="hq-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="hq-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
      </defs>

      {/* Sky, stars, moon */}
      <rect width="1200" height="900" fill="url(#hq-sky)" />
      <Stars p={p} />
      {p.moon && (
        <g>
          <circle cx="960" cy="150" r="120" fill="url(#hq-moon)" />
          <circle cx="960" cy="150" r="42" fill="#FFF6DD" />
          <circle cx="948" cy="140" r="7" fill="#EADFC2" />
          <circle cx="975" cy="165" r="5" fill="#EADFC2" />
        </g>
      )}

      {/* Lightning lights up the whole sky */}
      {p.lightning && (
        <rect width="1200" height="900" fill={p.bolt} opacity="0">
          <animate attributeName="opacity" values="0;0;0.1;0.02;0.08;0;0" keyTimes={flashTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
        </rect>
      )}

      {/* Fog bank under the island */}
      <ellipse cx="600" cy="820" rx="560" ry="70" fill="url(#hq-fog)">
        <animate attributeName="rx" values="560;600;560" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} keyTimes="0;0.5;1" />
      </ellipse>

      {/* The floating island bobs gently */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;0 -8;0 0" keyTimes="0;0.5;1" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
        <g transform={`translate(${ORIGIN[0]} ${ORIGIN[1]})`}>
          {/* Rocky underside + grass slab */}
          <polygon points={pts([[0, 10, -1.6], [10, 10, -1.6], [10, 0, -1.6], [6, 6, -5.2]], U)} fill={shade(p.soil, -0.2)} stroke="rgba(10,10,20,0.55)" strokeWidth={1.2} strokeLinejoin="round" />
          <polygon points={pts([[0, 10, -1.6], [6, 6, -5.2], [4, 7, -3.4]], U)} fill={shade(p.soil, -0.35)} stroke="rgba(10,10,20,0.55)" strokeWidth={1.2} strokeLinejoin="round" />
          <IsoBox x={0} y={0} z={-1.6} w={10} d={10} h={1.2} color={p.soil} u={U} top={false} />
          <IsoBox x={0} y={0} z={-0.4} w={10} d={10} h={0.4} color={p.ground} u={U} />
          <IsoGrid x={0} y={0} w={10} d={10} u={U} color={shade(p.ground, -0.4)} opacity={0.22} />
          {/* Stone path to the door */}
          {[0, 1, 2, 3].map((i) => (
            <polygon key={i} points={pts([[5.2, 7.2 + i * 0.7, 0.01], [5.9, 7.2 + i * 0.7, 0.01], [5.9, 7.7 + i * 0.7, 0.01], [5.2, 7.7 + i * 0.7, 0.01]], U)} fill={shade(p.building, -0.15)} opacity={0.9} />
          ))}

          {/* Back row: weather tower and shed */}
          <IsoBox x={1.5} y={1.5} w={1.2} d={1.2} h={5.2} color={p.building} u={U} />
          {[1.2, 2.6, 4].map((z) => (
            <IsoWindow key={z} face="right" plane={2.7} a={1.8} z={z} w={0.6} h={0.6} fill={p.glow} u={U}>
              <Flicker dur={LOOP} seed={z} />
            </IsoWindow>
          ))}
          <IsoBox x={1.3} y={1.3} z={5.2} w={1.6} d={1.6} h={0.3} color={p.roof} u={U} />
          {/* Radar dish + scan pulses */}
          <g>
            <ellipse cx={rx} cy={ry - 14} rx="22" ry="11" fill={shade(p.building, -0.1)} stroke="rgba(10,10,20,0.55)" strokeWidth="1.2" />
            {[0, 1].map((k) => (
              <ellipse key={k} cx={rx} cy={ry - 14} rx="22" ry="11" fill="none" stroke={p.bolt} strokeWidth="2">
                <animate attributeName="rx" values="22;120" dur="3s" begin={`-${k * 1.5}s`} repeatCount="indefinite" />
                <animate attributeName="ry" values="11;60" dur="3s" begin={`-${k * 1.5}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.9;0" dur="3s" begin={`-${k * 1.5}s`} repeatCount="indefinite" />
              </ellipse>
            ))}
          </g>
          {/* Anemometer spinning on the mast */}
          <line x1={tx} y1={ry - 20} x2={tx} y2={ty - 18} stroke={shade(p.roof, 0.2)} strokeWidth="2" />
          <g transform={`translate(${tx} ${ty - 18})`}>
            <g>
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="1s" repeatCount="indefinite" />
              {[0, 120, 240].map((a) => (
                <g key={a} transform={`rotate(${a})`}>
                  <line x1="0" y1="0" x2="14" y2="0" stroke={p.building} strokeWidth="1.6" />
                  <circle cx="14" cy="0" r="3" fill={p.glow} />
                </g>
              ))}
            </g>
          </g>

          <IsoBox x={7} y={1.4} w={1.8} d={1.6} h={1.5} color={shade(p.building, -0.05)} u={U} />
          <IsoRoof x={6.9} y={1.3} z={1.5} w={2} d={1.8} h={1} color={p.roof} u={U} />
          <IsoWindow face="left" plane={3} a={7.4} z={0.4} w={0.6} h={0.6} fill={p.glow} u={U}>
            <Flicker dur={LOOP} seed={9} low={0.3} />
          </IsoWindow>

          {/* HQ building */}
          <IsoBox x={3} y={4} w={4} d={3} h={2.6} color={p.building} u={U} />
          <IsoGable x={3} y={4} z={2.6} w={4} d={3} h={1.5} color={p.roof} u={U} />
          <g filter="url(#hq-glow)">
            {[3.4, 4.6, 5.8].map((a, i) => (
              <IsoWindow key={a} face="left" plane={7} a={a} z={1.1} w={0.7} h={0.9} fill={p.glow} u={U}>
                <Flicker dur={LOOP} seed={i + 3} />
              </IsoWindow>
            ))}
            {[4.4, 5.6].map((a, i) => (
              <IsoWindow key={a} face="right" plane={7} a={a} z={1.1} w={0.7} h={0.9} fill={p.glow} u={U}>
                <Flicker dur={LOOP} seed={i + 11} low={0.7} />
              </IsoWindow>
            ))}
          </g>
          {/* Door */}
          <IsoWindow face="left" plane={7} a={5.15} z={0} w={0.8} h={1.3} fill={shade(p.roof, 0.1)} u={U} />
          <IsoWindow face="left" plane={7} a={5.25} z={0.1} w={0.6} h={1.1} fill={p.glow} u={U}>
            <animate attributeName="opacity" values="0.55;0.8;0.55" dur="3s" repeatCount="indefinite" />
          </IsoWindow>
          {/* Chimney */}
          <IsoBox x={4} y={4.5} z={2.9} w={0.5} d={0.5} h={1.2} color={shade(p.building, -0.1)} u={U} />

          {/* Front row: trees + lamp */}
          <Tree x={1.6} y={7.6} p={p} />
          <Tree x={8.6} y={5.6} s={0.8} p={p} />
          <Tree x={8.4} y={8.6} s={1.1} p={p} />
          <IsoCylinder x={7} y={8.6} r={0.06} h={1.8} color={p.roof} u={U} />
          <circle cx={iso([7, 8.6, 1.9], U)[0]} cy={iso([7, 8.6, 1.9], U)[1]} r="7" fill={p.glow} filter="url(#hq-glow)">
            <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      </g>

      {/* Storm cloud drifting over the tower */}
      <g>
        <animateTransform attributeName="transform" type="translate" values="0 0;26 -4;0 0" keyTimes="0;0.5;1" dur={`${LOOP}s`} repeatCount="indefinite" {...spline} />
        {p.rain && (
          <g stroke={shade(p.cloud, 0.5)} strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
            <animateTransform attributeName="transform" type="translate" values="0 -30;-12 40" dur="1s" repeatCount="indefinite" />
            {Array.from({ length: 22 }, (_, i) => {
              const x = 280 + rand(i * 2.3) * 260;
              const y = 220 + rand(i * 4.1) * 120;
              return <line key={i} x1={x} y1={y} x2={x - 6} y2={y + 22} />;
            })}
          </g>
        )}
        {p.lightning && (
          <path
            d="M428 200 L404 252 L424 252 L398 318 L414 318 L392 372 L452 290 L432 290 L452 244 L436 244 L452 200 Z"
            fill={p.bolt}
            filter="url(#hq-glow)"
            opacity="0"
          >
            <animate attributeName="opacity" values={flashVals} keyTimes={flashTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
          </path>
        )}
        {/* Lit from inside: the glow sits behind the cloud and bleeds around its edges */}
        {p.lightning && (
          <ellipse cx="410" cy="170" rx="170" ry="90" fill={p.bolt} opacity="0" filter="url(#hq-soft)">
            <animate attributeName="opacity" values="0;0;0.55;0.1;0.45;0;0" keyTimes={flashTimes} dur={`${LOOP}s`} repeatCount="indefinite" />
          </ellipse>
        )}
        <g fill={p.cloud} stroke="rgba(10,10,20,0.45)" strokeWidth="1.2">
          <ellipse cx="400" cy="190" rx="130" ry="42" />
          <circle cx="350" cy="165" r="48" />
          <circle cx="420" cy="145" r="62" />
          <circle cx="485" cy="172" r="40" />
        </g>
        <g fill={shade(p.cloud, 0.18)}>
          <circle cx="410" cy="128" r="30" opacity="0.55" />
          <circle cx="352" cy="152" r="22" opacity="0.45" />
        </g>
      </g>
    </svg>
  );
}
