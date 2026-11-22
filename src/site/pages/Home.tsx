import { useEffect, useMemo, useRef, useState } from 'react';
import { allAssets, assetsForDrop, drops } from '@/lib/registry';
import { DIR_KINDS, KIND_DIRS, KIND_LABELS, type AssetRef, type Kind } from '@/lib/types';
import { AssetCard } from '../AssetCard';
import { href, replaceQuery } from '../router';

export function Palette({ colors }: { colors: string[] }) {
  return (
    <span className="palette">
      {colors.map((c) => (
        <span key={c} title={c} style={{ background: c }} />
      ))}
    </span>
  );
}

const FILTERS: (Kind | 'all')[] = ['all', 'scene', 'card3d', 'icon3d', 'video', 'banner', 'sticker', 'icon'];
const humanize = (slug: string) => slug.replace(/-/g, ' ');

/** One representative asset per kind, for the hero mosaic. */
function heroPicks(assets: AssetRef[]) {
  const order: Kind[] = ['scene', 'icon3d', 'video'];
  return order.map((k) => assets.find((a) => a.kind === k)).filter((a): a is AssetRef => !!a);
}

export function Home({ query }: { query: URLSearchParams }) {
  const latest = drops[0];
  const kindParam = query.get('kind');
  const kind: Kind | 'all' = kindParam && DIR_KINDS[kindParam] ? DIR_KINDS[kindParam] : 'all';
  const [q, setQ] = useState(query.get('q') ?? '');
  const browseRef = useRef<HTMLDivElement>(null);
  const kitsRef = useRef<HTMLDivElement>(null);

  // Jump to the grid / kits when arriving from the nav.
  useEffect(() => {
    if (kindParam) browseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (query.get('view') === 'kits') kitsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [kindParam, query]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return allAssets.filter((a) => {
      if (kind !== 'all' && a.kind !== kind) return false;
      if (!needle) return true;
      const kit = drops.find((d) => d.date === a.date);
      return `${humanize(a.slug)} ${KIND_LABELS[a.kind]} ${kit?.theme ?? ''}`.toLowerCase().includes(needle);
    });
  }, [kind, q]);

  if (!latest) return <p className="muted">No kits yet.</p>;
  const picks = heroPicks(assetsForDrop(latest.date));

  const setSearch = (value: string) => {
    setQ(value);
    replaceQuery('/', { ...(kind !== 'all' ? { kind: KIND_DIRS[kind] } : {}), ...(value ? { q: value } : {}) });
  };

  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">New kit · {latest.date}</span>
          <h1 className="display-lg">{latest.theme}</h1>
          <p className="body-lg">{latest.description}</p>
          <div className="row" style={{ marginTop: 20 }}>
            <Palette colors={latest.palette} />
            <span className="eyebrow-sm">{assetsForDrop(latest.date).length} assets · every one editable</span>
          </div>
          <div className="actions">
            <a className="pill primary" href={href(`/kit/${latest.date}`)}>
              Open kit
            </a>
            <a className="pill" href={href('/', { kind: 'all' })}>
              Browse library
            </a>
          </div>
        </div>
        <div className="hero-mosaic">
          {picks.map((a) => (
            <AssetCard key={a.id} asset={a} showKit={false} />
          ))}
        </div>
      </section>

      <section className="band" ref={browseRef}>
        <div className="band-head">
          <div>
            <span className="eyebrow">Library</span>
            <h2 className="display-md">Browse assets</h2>
          </div>
          <span className="eyebrow-sm">{results.length} results</span>
        </div>
        <div className="filters">
          {FILTERS.map((f) => (
            <a
              key={f}
              className={`pill sm ${f === kind ? 'on' : ''}`}
              href={href('/', { ...(f !== 'all' ? { kind: KIND_DIRS[f] } : { kind: 'all' }), ...(q ? { q } : {}) })}
            >
              {f === 'all' ? 'All' : KIND_LABELS[f]}
            </a>
          ))}
          <input className="search" placeholder="Search assets, kits…" value={q} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {results.length ? (
          <div className="grid">
            {results.map((a) => (
              <AssetCard key={a.id} asset={a} />
            ))}
          </div>
        ) : (
          <div className="empty">Nothing matches “{q}”.</div>
        )}
      </section>

      <section className="band" ref={kitsRef}>
        <div className="band-head">
          <div>
            <span className="eyebrow">Collections</span>
            <h2 className="display-md">Kits</h2>
          </div>
        </div>
        <div className="kits">
          {drops.map((d) => (
            <a key={d.date} className="kit-card" href={href(`/kit/${d.date}`)}>
              <span className="eyebrow-sm">{d.date}</span>
              <h3>{d.theme}</h3>
              <p>{d.description}</p>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <Palette colors={d.palette} />
                <span className="eyebrow-sm">{assetsForDrop(d.date).length} assets</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
