import { assetsForDrop, drops } from '@/lib/registry';
import { KIND_LABELS, type Kind } from '@/lib/types';
import { AssetCard } from '../AssetCard';
import { Palette } from './Home';

const ORDER: Kind[] = ['icon', 'icon3d', 'banner', 'video'];

export function DropPage({ date }: { date: string }) {
  const drop = drops.find((d) => d.date === date);
  if (!drop) return <p>Drop {date} not found.</p>;
  const assets = assetsForDrop(date);
  return (
    <div className="stack">
      <div className="drop-head">
        <div>
          <div className="muted mono">{drop.date}</div>
          <h1>{drop.theme}</h1>
          <p className="muted">{drop.description}</p>
        </div>
        <Palette colors={drop.palette} />
      </div>
      {ORDER.map((kind) => {
        const list = assets.filter((a) => a.kind === kind);
        if (!list.length) return null;
        return (
          <section key={kind}>
            <h3>{KIND_LABELS[kind]}</h3>
            <div className="grid">
              {list.map((a) => (
                <AssetCard key={a.id} asset={a} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
