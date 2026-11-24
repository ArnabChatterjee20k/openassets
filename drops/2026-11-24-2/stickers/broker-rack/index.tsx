import { z } from 'zod';
import type { AssetMeta } from '@/lib/types';
import { Doodle, Line, Sticker, sk, stickerSchema } from '@/kit';

export const meta: AssetMeta = {
  kind: 'sticker',
  name: 'Broker Rack',
  description: 'A stubby three-broker server stack with vent slots and blinking LEDs, the doodle version of a Kafka cluster.',
  tags: ['server', 'broker', 'kafka', 'cluster', 'doodle'],
};

export const schema = stickerSchema({ fill: '#DCDCD5', accent: '#E3000F', ink: '#2A2A28' });

export const variants: Record<string, Partial<z.input<typeof schema>>> = {
  marker: { style: 'marker', wobble: 0.35 },
  pencil: { style: 'pencil' },
  'die-cut': { border: true },
  cherry: { fill: '#FFB3B8', accent: '#E3000F', ink: '#6B0A12' },
  blueprint: { fill: '#A9C8FF', accent: '#FFDD00', ink: '#0F3B8C' },
};

const UNITS = [44, 104, 164];

export default function BrokerRack(props: z.input<typeof schema>) {
  const p = schema.parse(props);
  return (
    <Sticker p={p} label="Broker rack">
      {/* feet */}
      <Doodle shape={sk.rect(66, 216, 22, 14, 4)} fill={p.ink} hatch={false} />
      <Doodle shape={sk.rect(168, 216, 22, 14, 4)} fill={p.ink} hatch={false} />
      {UNITS.map((y) => (
        <Doodle key={y} shape={sk.rect(46, y, 164, 52, 12)} />
      ))}
      {UNITS.map((y, i) => (
        <g key={`d${y}`}>
          {/* vent slots */}
          <Line shape={[sk.curve([[64, y + 18], [64, y + 36]]), sk.curve([[80, y + 18], [80, y + 36]]), sk.curve([[96, y + 18], [96, y + 36]])]} weight={p.weight * 0.7} />
          {/* status LEDs: the middle broker blinks red */}
          <Doodle shape={sk.circle(166, y + 26, 8)} fill={i === 1 ? p.accent : '#7BD88F'} hatch={false} />
          <Doodle shape={sk.circle(190, y + 26, 8)} fill="#7BD88F" hatch={false} />
        </g>
      ))}
    </Sticker>
  );
}
