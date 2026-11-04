import { assetsForDrop, drops } from '@/lib/registry';
import { KIND_LABELS, type Kind } from '@/lib/types';
import { AssetCard } from '../AssetCard';
import { href } from '../router';
import { Palette } from './Home';

const ORDER: Kind[] = ['scene', 'card3d', 'video', 'icon3d', 'banner', 'icon'];

/** A kit: everything one use case needs, grouped by kind. */
export function DropPage({ date }: { date: string }) {
  const drop = drops.find((d) => d.date === date);
  if (!drop) return <p className="muted">Kit {date} not found.</p>;
  const assets = assetsForDrop(date);
  return (
    <>
      <section className="hero" style={{ gridTemplateColumns: '1fr' }}>
        <div>
          <span className="crumbs">
            <a href={href('/', { view: 'kits' })}>Kits</a> / {drop.date}
          </span>
          <h1 className="display-lg">{drop.theme}</h1>
          <p className="body-lg" style={{ maxWidth: 720 }}>
            {drop.description}
          </p>
          <div className="row" style={{ marginTop: 20 }}>
            <Palette colors={drop.palette} />
            {drop.direction && (
              <span className="eyebrow-sm">
                {drop.direction.palette} · {drop.direction.fonts}
              </span>
            )}
          </div>
        </div>
      </section>
      {ORDER.map((kind) => {
        const list = assets.filter((a) => a.kind === kind);
        if (!list.length) return null;
        return (
          <section key={kind} className="band">
            <div className="band-head">
              <div>
                <span className="eyebrow">{list.length} assets</span>
                <h2 className="display-md">{KIND_LABELS[kind]}</h2>
              </div>
            </div>
            <div className="grid">
              {list.map((a) => (
                <AssetCard key={a.id} asset={a} showKit={false} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
