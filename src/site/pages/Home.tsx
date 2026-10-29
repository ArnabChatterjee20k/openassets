import { assetsForDrop, drops } from '@/lib/registry';
import { href } from '../router';
import { AssetCard } from '../AssetCard';

export function Palette({ colors }: { colors: string[] }) {
  return (
    <span className="palette">
      {colors.map((c) => (
        <span key={c} title={c} style={{ background: c }} />
      ))}
    </span>
  );
}

export function Home() {
  if (!drops.length) return <p className="muted">No drops yet.</p>;
  return (
    <div className="stack">
      {drops.map((d) => {
        const assets = assetsForDrop(d.date);
        return (
          <section key={d.date} className="drop-section">
            <div className="drop-head">
              <div>
                <div className="muted mono">{d.date}</div>
                <h2>
                  <a href={href(`/drop/${d.date}`)}>{d.theme}</a>
                </h2>
                <p className="muted">{d.description}</p>
              </div>
              <Palette colors={d.palette} />
            </div>
            <div className="grid">
              {assets.slice(0, 8).map((a) => (
                <AssetCard key={a.id} asset={a} />
              ))}
            </div>
            {assets.length > 8 && (
              <a className="more" href={href(`/drop/${d.date}`)}>
                See all {assets.length} assets →
              </a>
            )}
          </section>
        );
      })}
    </div>
  );
}
