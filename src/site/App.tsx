import { KIND_DIRS, KIND_LABELS, type Kind } from '@/lib/types';
import { href, useRoute } from './router';
import { Home } from './pages/Home';
import { DropPage } from './pages/DropPage';
import { AssetPage } from './pages/AssetPage';
import { RenderPage } from './pages/RenderPage';

const NAV_KINDS: Kind[] = ['scene', 'card3d', 'icon3d', 'video', 'banner', 'sticker', 'icon'];

export function App() {
  const { path, query } = useRoute();

  // Headless render target for CI: no chrome, no layout.
  if (path.startsWith('/render/')) return <RenderPage id={path.slice('/render/'.length)} query={query} />;

  let page;
  if (path.startsWith('/kit/')) page = <DropPage date={path.slice('/kit/'.length)} />;
  else if (path.startsWith('/drop/')) page = <DropPage date={path.slice('/drop/'.length)} />;
  else if (path.startsWith('/asset/')) page = <AssetPage key={path} id={path.slice('/asset/'.length)} query={query} />;
  else page = <Home query={query} />;

  const activeKind = path === '/' ? query.get('kind') : null;

  return (
    <div className="shell">
      <header className="nav">
        <div className="container nav-inner">
          <a href="#/" className="wordmark">
            OpenAssets
          </a>
          <nav className="nav-links">
            {NAV_KINDS.map((k) => (
              <a key={k} href={href('/', { kind: KIND_DIRS[k] })} className={activeKind === KIND_DIRS[k] ? 'on' : ''}>
                {KIND_LABELS[k]}
              </a>
            ))}
            <a href={href('/', { view: 'kits' })}>Kits</a>
          </nav>
          <a className="pill sm" href={href('/', { kind: 'all' })}>
            Browse all
          </a>
        </div>
      </header>
      <main className="container">{page}</main>
      <footer className="footer">
        <div className="container footer-inner">
          <span>OpenAssets</span>
          <span className="eyebrow-sm">Free · editable · new kit daily</span>
        </div>
      </footer>
    </div>
  );
}
